import { SizeLimitedMap } from './size-limited-map.js';
import { SIZE_LIMITS, INTERVALS } from './constants.js';

class LoadBalancer {
  constructor(options = {}) {
    this.strategy = options.strategy || 'round-robin';
    this.endpoints = new Map();
    this.healthCheckInterval = options.healthCheckInterval || 30000;
    this.healthCheckUrl = options.healthCheckUrl || '/health';
    this.degradationThreshold = options.degradationThreshold || 1000;
    this.weights = options.weights || {};
    this.affinity = new SizeLimitedMap({
      maxSize: SIZE_LIMITS.MAX_AFFINITY_ENTRIES,
      ttl: INTERVALS.AFFINITY_CLEANUP_MS
    });
    this.stats = {
      requests: 0,
      errors: 0,
      latencySum: 0,
      byEndpoint: {}
    };

    // Cache for available endpoints
    this.availableEndpoints = null;
    this.availableEndpointsDirty = true;

    // Setup affinity cleanup
    this.affinityCleanupInterval = setInterval(() => {
      this.affinity.cleanupExpired();
    }, INTERVALS.AFFINITY_CLEANUP_MS);
  }

  addEndpoint(name, url, weight = 1, metadata = {}) {
    const endpoint = {
      name,
      url,
      weight,
      metadata,
      healthy: true,
      available: true,
      inCooldown: false,
      cooldownUntil: null,
      failures: 0,
      successes: 0,
      lastSuccess: null,
      lastFailure: null,
      avgLatency: 0,
      minLatency: Infinity,
      maxLatency: 0,
      requests: 0,
      errors: 0,
      weightMultiplier: 1,
      score: 100,
      addedAt: Date.now()
    };

    this.endpoints.set(name, endpoint);
    this.stats.byEndpoint[name] = {
      requests: 0,
      errors: 0,
      latencySum: 0
    };

    return endpoint;
  }

  removeEndpoint(name) {
    this.endpoints.delete(name);
    this.affinity.delete(name);
  }

  select(context = {}) {
    // Use cached available endpoints if not dirty
    if (this.availableEndpointsDirty || !this.availableEndpoints) {
      this.availableEndpoints = Array.from(this.endpoints.values())
        .filter(ep => ep.healthy && ep.available && !ep.inCooldown);
      this.availableEndpointsDirty = false;
    }

    const available = this.availableEndpoints;

    if (available.length === 0) {
      return null;
    }

    let selected;

    switch (this.strategy) {
    case 'round-robin':
      selected = this.roundRobin(available);
      break;
    case 'weighted':
      selected = this.weighted(available);
      break;
    case 'least-connections':
      selected = this.leastConnections(available);
      break;
    case 'least-latency':
      selected = this.leastLatency(available);
      break;
    case 'ip-hash':
      selected = this.ipHash(available, context.ip);
      break;
    case 'sticky':
      selected = this.sticky(available, context);
      break;
    case 'random':
      selected = this.random(available);
      break;
    case 'best-score':
      selected = this.bestScore(available);
      break;
    default:
      selected = this.roundRobin(available);
    }

    if (selected) {
      selected.requests++;
      this.stats.requests++;
      this.stats.byEndpoint[selected.name].requests++;
    }

    return selected;
  }

  roundRobin(endpoints) {
    const key = `rr_${this.stats.requests}`;
    return endpoints[this.stats.requests % endpoints.length];
  }

  weighted(endpoints) {
    const totalWeight = endpoints.reduce((sum, ep) => sum + (ep.weight * ep.weightMultiplier), 0);
    let random = Math.random() * totalWeight;

    for (const ep of endpoints) {
      random -= ep.weight * ep.weightMultiplier;
      if (random <= 0) {
        return ep;
      }
    }

    return endpoints[0];
  }

  leastConnections(endpoints) {
    return endpoints.reduce((min, ep) =>
      ep.requests < min.requests ? ep : min
    );
  }

  leastLatency(endpoints) {
    const healthy = endpoints.filter(ep => ep.avgLatency < this.degradationThreshold);
    if (healthy.length === 0) {
      return endpoints[0];
    }

    return healthy.reduce((min, ep) =>
      ep.avgLatency < min.avgLatency ? ep : min
    );
  }

  ipHash(endpoints, ip) {
    if (!ip) {
      return endpoints[0];
    }

    const hash = ip.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);

    return endpoints[Math.abs(hash) % endpoints.length];
  }

  sticky(endpoints, context) {
    if (context.sessionId && this.affinity.has(context.sessionId)) {
      const endpointName = this.affinity.get(context.sessionId);
      const endpoint = endpoints.find(ep => ep.name === endpointName);
      if (endpoint) {
        return endpoint;
      }
    }

    const selected = this.roundRobin(endpoints);

    if (context.sessionId) {
      this.affinity.set(context.sessionId, selected.name);
    }

    return selected;
  }

  random(endpoints) {
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  bestScore(endpoints) {
    return endpoints.reduce((best, ep) => {
      const score = this.calculateScore(ep);
      if (!best || score > best.score) {
        return { ...ep, score };
      }
      return best;
    }, null);
  }

  calculateScore(endpoint) {
    let score = 100;

    if (endpoint.avgLatency > 0) {
      const latencyScore = Math.max(0, 100 - (endpoint.avgLatency / 50));
      score *= (latencyScore / 100);
    }

    if (endpoint.errors > 0) {
      const errorRate = endpoint.errors / (endpoint.requests || 1);
      score *= (1 - Math.min(errorRate, 0.5));
    }

    if (endpoint.inCooldown) {
      score *= 0.1;
    }

    score *= endpoint.weightMultiplier;

    return Math.max(0, Math.min(100, score));
  }

  recordSuccess(endpointName, latency) {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) {
      return;
    }

    endpoint.successes++;
    endpoint.lastSuccess = Date.now();
    endpoint.failures = 0;
    endpoint.inCooldown = false;
    endpoint.cooldownUntil = null;

    if (latency) {
      endpoint.requests++;

      // Use sum-based average calculation instead of recalculating on every request
      if (!endpoint.latencySum) {
        endpoint.latencySum = 0;
        endpoint.latencyCount = 0;
      }
      endpoint.latencySum += latency;
      endpoint.latencyCount++;
      endpoint.avgLatency = endpoint.latencySum / endpoint.latencyCount;

      endpoint.minLatency = Math.min(endpoint.minLatency, latency);
      endpoint.maxLatency = Math.max(endpoint.maxLatency, latency);

      this.stats.latencySum += latency;
      this.stats.byEndpoint[endpointName].latencySum += latency;
    }

    this.updateWeightMultiplier(endpoint);
  }

  recordFailure(endpointName, error = null) {
    const endpoint = this.endpoints.get(endpointName);
    if (!endpoint) {
      return;
    }

    endpoint.failures++;
    endpoint.errors++;
    endpoint.lastFailure = Date.now();
    this.stats.errors++;
    this.stats.byEndpoint[endpointName].errors++;

    if (endpoint.failures >= 3) {
      endpoint.inCooldown = true;
      endpoint.cooldownUntil = Date.now() + (endpoint.failures * 1000);
      // Mark cache dirty on health changes
      this.availableEndpointsDirty = true;
    }

    this.updateWeightMultiplier(endpoint);
  }

  updateWeightMultiplier(endpoint) {
    if (endpoint.failures === 0) {
      endpoint.weightMultiplier = Math.min(2, endpoint.weightMultiplier * 1.1);
    } else {
      endpoint.weightMultiplier = Math.max(0.1, endpoint.weightMultiplier * 0.8);
    }
  }

  getHealthyEndpoints() {
    return Array.from(this.endpoints.values()).filter(ep => ep.healthy && !ep.inCooldown);
  }

  getAllEndpoints() {
    return Array.from(this.endpoints.values());
  }

  getEndpointStats(name) {
    return this.endpoints.get(name);
  }

  getStats() {
    return {
      strategy: this.strategy,
      totalEndpoints: this.endpoints.size,
      healthyEndpoints: this.getHealthyEndpoints().length,
      totalRequests: this.stats.requests,
      totalErrors: this.stats.errors,
      errorRate: this.stats.requests > 0
        ? `${((this.stats.errors / this.stats.requests) * 100).toFixed(2) }%`
        : '0%',
      avgLatency: this.stats.requests > 0
        ? Math.round(this.stats.latencySum / this.stats.requests)
        : 0,
      endpoints: Object.fromEntries(
        Array.from(this.endpoints.entries()).map(([name, ep]) => [
          name,
          {
            healthy: ep.healthy,
            inCooldown: ep.inCooldown,
            requests: ep.requests,
            errors: ep.errors,
            avgLatency: Math.round(ep.avgLatency),
            score: Math.round(ep.score),
            weightMultiplier: ep.weightMultiplier.toFixed(2)
          }
        ])
      )
    };
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  setEndpointWeight(name, weight) {
    const endpoint = this.endpoints.get(name);
    if (endpoint) {
      endpoint.weight = weight;
    }
  }

  setHealth(endpointName, healthy) {
    const endpoint = this.endpoints.get(endpointName);
    if (endpoint) {
      endpoint.healthy = healthy;
      // Mark cache dirty on health changes
      this.availableEndpointsDirty = true;
    }
  }

  clearCooldowns() {
    for (const endpoint of this.endpoints.values()) {
      endpoint.inCooldown = false;
      endpoint.cooldownUntil = null;
      endpoint.failures = 0;
    }
    // Mark cache dirty after clearing cooldowns
    this.availableEndpointsDirty = true;
  }

  clearAffinity() {
    this.affinity.clear();
  }

  destroy() {
    if (this.affinityCleanupInterval) {
      clearInterval(this.affinityCleanupInterval);
      this.affinityCleanupInterval = null;
    }
    this.affinity.clear();
  }
}

export { LoadBalancer };
