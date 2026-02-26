import crypto from 'crypto';
import { EventEmitter } from 'events';
import { createLogger } from './logger.js';
import { readJsonFile, writeJsonFile, fileStats } from './stateStore.js';
import { orderEndpointsAdaptive } from './selector.js';
import { containsBlockedTerm, parseBlockedTerms, parseCsvSet } from './policy.js';
import { CircuitBreakerManager, STATES as CB_STATES } from './circuitBreaker.js';
import { ResponseCache } from './responseCache.js';
import { PriorityQueue, PRIORITIES } from './priorityQueue.js';
import { ConnectionPool } from './connectionPool.js';
import { PrometheusExporter } from './prometheus.js';
import { sanitizeForLogging } from './security-utils.js';
import { SizeLimitedMap } from './size-limited-map.js';
import { SIZE_LIMITS, INTERVALS } from './constants.js';
import { calculateQualityScore } from '../../qualityScoring.js';

import { AnomalyDetector } from './anomalyDetector.js';
const logger = createLogger('router');

export class RouterCore extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      port: options.port || 3000,
      timeoutMs: options.timeoutMs || 5000,
      maxConcurrent: options.maxConcurrent || 32,
      queueSize: options.queueSize || 128,
      anomalyDetection: {
        enabled: options.anomalyDetection?.enabled !== false,
        stdDevThreshold: options.anomalyDetection?.stdDevThreshold || 3,
        minSamples: options.anomalyDetection?.minSamples || 20
      },
      ...options
    };

    this.endpoints = new Map();
    this.endpointStats = new Map();
    this.quarantinedEndpoints = new Set();
    this.inFlightRequests = 0;
    this.queue = new PriorityQueue({ maxSize: this.options.queueSize });
    this.connectionPool = new ConnectionPool({ maxSockets: 50 });
    this.responseCache = new ResponseCache({ enabled: options.cache?.enabled || false, ttlSeconds: options.cache?.ttl || 300 });
    this.circuitBreaker = new CircuitBreakerManager({
      enabled: options.circuitBreaker?.enabled || false,
      failureThreshold: options.circuitBreaker?.failureThreshold || 5,
      timeoutMs: options.circuitBreaker?.timeoutMs || 30000
    });
    this.prometheus = new PrometheusExporter({ namespace: 'neuralshell', subsystem: 'router' });
    this.anomalyDetector = new AnomalyDetector(this.options.anomalyDetection);

    this.metrics = {
      total: 0,
      success: 0,
      fail: 0,
      rejected: 0,
      inFlight: 0,
      anomalies: 0,
      quarantined: 0
    };

    this.startTime = Date.now();
    this.idempotencyCache = new SizeLimitedMap({
      maxSize: SIZE_LIMITS.MAX_IDEMPOTENCY_KEYS,
      ttl: 60000 // 1 minute TTL
    });
    this.rateLimits = new Map();
    this.cooldownTimers = new Map();

    // Setup anomaly listener
    this.anomalyDetector.on('anomaly', (anomaly) => {
      if (anomaly.metadata?.type === 'latency' && anomaly.metadata?.endpoint) {
        this.quarantineEndpoint(anomaly.metadata.endpoint, anomaly);
      }
    });

    // Setup self-healing loop for quarantine
    this.quarantineInterval = setInterval(() => {
      this.healQuarantine();
    }, 60000); // Check every minute

    // Setup idempotency cache cleanup
    this.idempotencyCleanupInterval = setInterval(() => {
      this.idempotencyCache.cleanupExpired();
    }, INTERVALS.IDEMPOTENCY_CLEANUP_MS);

    this.initializeEndpointStats();
  }

  quarantineEndpoint(name, anomaly) {
    if (this.quarantinedEndpoints.has(name)) {
      return;
    }

    this.quarantinedEndpoints.add(name);
    this.metrics.quarantined++;
    this.prometheus.incCounter('endpoint_quarantined_total', { endpoint: name });

    logger.warn('ENDPOINT_QUARANTINED', sanitizeForLogging({
      endpoint: name,
      reason: 'statistical_anomaly',
      value: anomaly.value,
      expected: anomaly.expected,
      zScore: anomaly.zScore
    }));
  }

  healQuarantine() {
    for (const name of this.quarantinedEndpoints) {
      const stats = this.endpointStats.get(name);
      if (stats && Date.now() - stats.lastFailure > 300000) { // 5 mins since last failure
        this.quarantinedEndpoints.delete(name);
        this.anomalyDetector.resetMetric(`latency_${name}`);
        logger.info('ENDPOINT_RESTORED', { endpoint: name, reason: 'quarantine_timeout' });
      }
    }
  }

  initializeEndpointStats() {
    for (const [name, ep] of this.endpoints) {
      this.endpointStats.set(name, {
        name,
        healthy: true,
        inCooldown: false,
        failures: 0,
        successes: 0,
        lastFailure: 0,
        lastSuccess: 0,
        latencySum: 0,
        latencyCount: 0,
        avgLatency: 0
      });
    }
  }

  addEndpoint(endpoint) {
    const ep = {
      name: endpoint.name,
      url: endpoint.url,
      model: endpoint.model,
      weight: endpoint.weight || 1,
      costPer1kInput: endpoint.costPer1kInput || 0,
      costPer1kOutput: endpoint.costPer1kOutput || 0,
      timeoutMs: endpoint.timeoutMs || this.options.timeoutMs,
      enabled: endpoint.enabled !== false,
      headers: endpoint.headers || {}
    };

    this.endpoints.set(ep.name, ep);
    this.endpointStats.set(ep.name, {
      name: ep.name,
      healthy: true,
      inCooldown: false,
      failures: 0,
      successes: 0,
      lastFailure: 0,
      lastSuccess: 0,
      latencySum: 0,
      latencyCount: 0,
      avgLatency: 0
    });

    this.circuitBreaker.getOrCreate(ep.name);

    return ep;
  }

  setEndpoints(endpoints) {
    this.endpoints.clear();
    this.endpointStats.clear();
    this.quarantinedEndpoints.clear();
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this.cooldownTimers.clear();

    for (const ep of endpoints) {
      this.addEndpoint(ep);
    }
  }

  selectEndpoint(context = {}) {
    const available = Array.from(this.endpoints.values())
      .filter(ep => ep.enabled)
      .filter(ep => !this.quarantinedEndpoints.has(ep.name))
      .filter(ep => {
        const stats = this.endpointStats.get(ep.name);
        return stats && !stats.inCooldown && stats.healthy;
      });

    if (available.length === 0) {
      // Emergency: if all are quarantined, try the one with best stats
      if (this.endpoints.size > 0) {
        return Array.from(this.endpoints.values())[0];
      }
      return null;
    }

    if (context.costBudget && context.costBudget > 0) {
      const affordable = available.filter(ep => ep.costPer1kInput <= context.costBudget);
      if (affordable.length > 0) {
        return this.weightedSelect(affordable);
      }
    }

    return orderEndpointsAdaptive(available, this.endpointStats, { returnFirst: true });
  }

  weightedSelect(endpoints) {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const ep of endpoints) {
      random -= ep.weight;
      if (random <= 0) {
        return ep;
      }
    }

    return endpoints[0];
  }

  async executeRequest(payload, options = {}) {
    const requestId = options.requestId || crypto.randomUUID();
    const startTime = Date.now();

    const cacheKey = this.responseCache.generateKey({ url: '/prompt', body: payload });

    if (options.useCache !== false) {
      const cached = await this.responseCache.get(cacheKey);
      if (cached) {
        this.metrics.total++;
        this.prometheus.incCounter('requests_total', { method: 'prompt', endpoint: 'router' });
        this.prometheus.incCounter('cache_hits_total', { cache: 'response' });
        return { ...cached, cached: true, requestId };
      }
    }

    if (this.metrics.inFlight >= this.options.maxConcurrent) {
      this.metrics.total++;
      this.metrics.rejected++;
      this.prometheus.incCounter('requests_total', { method: 'prompt', endpoint: 'router' });
      throw { code: 'OVERLOADED', statusCode: 429, requestId };
    }

    this.metrics.total++;
    this.metrics.inFlight++;
    this.prometheus.incCounter('requests_total', { method: 'prompt', endpoint: 'router' });
    this.prometheus.setGauge('requests_in_flight', {}, this.metrics.inFlight);

    try {
      const endpoint = options.endpoint || this.selectEndpoint(options);
      if (!endpoint) {
        this.metrics.fail++;
        throw { code: 'NO_ACTIVE_ENDPOINTS', statusCode: 503, requestId };
      }

      const result = await this.callEndpoint(endpoint, payload, options);

      // Shadow Routing: Artificial jitter to mask system timing signatures
      if (this.options.shadowRouting?.enabled !== false) {
        const elapsed = Date.now() - startTime;
        const remaining = (endpoint.timeoutMs || this.options.timeoutMs) - elapsed;
        const jitter = Math.floor(Math.random() * Math.min(this.options.shadowRouting?.maxJitterMs || 150, Math.max(0, remaining - 50)));
        if (jitter > 0) {
          await new Promise(resolve => setTimeout(resolve, jitter));
        }
      }

      const latency = Date.now() - startTime;
      this.recordSuccess(endpoint.name, latency);

      this.metrics.success++;
      this.prometheus.incCounter('requests_success_total', { endpoint: endpoint.name });
      this.prometheus.observeHistogram('request_duration_ms', { endpoint: endpoint.name }, latency);

      const promptTokens = Math.ceil(payload.messages.reduce((sum, m) => sum + m.content.length / 4, 0));
      const completionTokens = Math.ceil(result.content.length / 4);
      const totalTokens = promptTokens + completionTokens;

      const qualityScore = calculateQualityScore({
        outcome: { status: 'success', duration_ms: latency },
        context: { metrics: { cost: (promptTokens * (endpoint.costPer1kInput || 0) / 1000) + (completionTokens * (endpoint.costPer1kOutput || 0) / 1000) } }
      });

      this.emit('request_completed', {
        endpoint: endpoint.name,
        latencyMs: latency,
        qualityScore,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens
        }
      });

      const response = {
        id: `chatcmpl-${requestId.slice(0, 8)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: endpoint.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: result.content
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens
        },
        qualityScore,
        requestId
      };

      if (options.cacheResponse !== false) {
        await this.responseCache.set(cacheKey, response, 300);
      }

      return response;

    } catch (err) {
      if (err.code) {
        this.prometheus.incCounter('requests_errors_total', { endpoint: 'router', error_type: err.code });
        throw err;
      }

      const endpoint = options.endpoint || this.selectEndpoint(options);
      if (endpoint) {
        this.recordFailure(endpoint.name, err.message);
      }

      this.metrics.fail++;
      throw { code: 'ALL_ENDPOINTS_FAILED', message: err.message, statusCode: 502, requestId };
    } finally {
      this.metrics.inFlight = Math.max(0, this.metrics.inFlight - 1);
      this.prometheus.setGauge('requests_in_flight', {}, this.metrics.inFlight);
    }
  }

  async callEndpointStreaming(ep, payload, options = {}) {
    const startTime = Date.now();
    const timeoutMs = ep.timeoutMs || this.options.timeoutMs;
    const onChunk = options.onChunk || (() => {});

    const breaker = this.circuitBreaker.getOrCreate(ep.name);
    const state = breaker.getState();

    if (state === CB_STATES.OPEN) {
      throw new Error(`Circuit breaker OPEN for ${ep.name}`);
    }

    const messages = payload.messages.map(m => ({ role: m.role, content: m.content }));

    let body;
    const headers = { 'Content-Type': 'application/json', ...ep.headers };

    if (ep.name.includes('ollama') || ep.url.includes('ollama')) {
      body = JSON.stringify({ model: ep.model, prompt: messages.map(m => m.content).join('\n'), stream: true });
    } else {
      body = JSON.stringify({ model: ep.model, messages, stream: true });
      headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
    }

    try {
      const response = await this.connectionPool.requestStream(ep.url, {
        method: 'POST',
        headers,
        body,
        timeout: timeoutMs
      });

      if (response.status !== 200) {
        breaker.onFailure();
        throw new Error(`Upstream error: ${response.status}`);
      }

      const stream = response.stream;
      let buffer = '';
      let hasReceivedData = false;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => {
          hasReceivedData = true;
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                breaker.onSuccess();
                resolve({ done: true });
                return;
              }

              try {
                const parsed = JSON.parse(data);
                let content = '';

                if (parsed.response) {
                  content = parsed.response;
                } else if (parsed.choices?.[0]?.delta?.content) {
                  content = parsed.choices[0].delta.content;
                }

                if (content) {
                  onChunk(content);
                }
              } catch (parseErr) {
                // Log JSON parse errors instead of silently swallowing
                logger.error('Stream JSON parse error', sanitizeForLogging({
                  error: parseErr.message,
                  data: data.substring(0, 100)
                }));
              }
            }
          }
        });

        stream.on('end', () => {
          // Validate stream completion
          if (!hasReceivedData) {
            breaker.onFailure();
            reject(new Error('Stream ended without receiving data'));
            return;
          }
          resolve({ done: true });
        });

        stream.on('error', (err) => {
          breaker.onFailure();
          logger.error('Stream error', sanitizeForLogging({ error: err.message }));
          reject(err);
        });
      });

    } catch (err) {
      breaker.onFailure();
      logger.error('Streaming call error', sanitizeForLogging({ error: err.message, endpoint: ep.name }));
      throw err;
    }
  }

  async callEndpoint(ep, payload, options = {}) {
    const timeoutMs = ep.timeoutMs || this.options.timeoutMs;

    const breaker = this.circuitBreaker.getOrCreate(ep.name);
    const state = breaker.getState();

    if (state === CB_STATES.OPEN) {
      throw new Error(`Circuit breaker OPEN for ${ep.name}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const messages = payload.messages.map(m => ({ role: m.role, content: m.content }));

      let body;
      const headers = {
        'Content-Type': 'application/json',
        ...ep.headers
      };

      if (ep.name.includes('ollama') || ep.url.includes('ollama')) {
        body = JSON.stringify({
          model: ep.model,
          prompt: messages.map(m => m.content).join('\n')
        });
      } else {
        body = JSON.stringify({
          model: ep.model,
          messages
        });
        headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;
      }

      const response = await this.connectionPool.request(ep.url, {
        method: 'POST',
        headers,
        body,
        timeout: timeoutMs,
        agentOptions: { keepAlive: true },
        signal: controller.signal
      });

      if (response.status !== 200) {
        const errorBody = response.body?.slice(0, 500) || '';
        breaker.onFailure();
        this.prometheus.incCounter('endpoint_failures_total', { endpoint: ep.name });
        throw new Error(`Upstream error (${response.status}): ${errorBody}`);
      }

      let data;
      try {
        data = JSON.parse(response.body);
      } catch {
        throw new Error('Invalid JSON response from upstream');
      }

      breaker.onSuccess();
      this.prometheus.incCounter('endpoint_successes_total', { endpoint: ep.name });

      let content;
      if (data.response) {
        content = data.response;
      } else if (data.choices?.[0]?.message?.content) {
        content = data.choices[0].message.content;
      } else {
        throw new Error('Invalid upstream response format');
      }

      return { content, raw: data };

    } catch (err) {
      if (err.name === 'AbortError' || err.message === 'timeout') {
        breaker.onFailure();
        this.prometheus.incCounter('endpoint_failures_total', { endpoint: ep.name, type: 'timeout' });
        throw new Error(`Timeout calling ${ep.name}`);
      }

      breaker.onFailure();
      this.prometheus.incCounter('endpoint_failures_total', { endpoint: ep.name });
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  recordSuccess(endpointName, latency) {
    const stats = this.endpointStats.get(endpointName);
    if (!stats) {
      return;
    }

    stats.successes++;
    stats.lastSuccess = Date.now();
    stats.latencySum += latency;
    stats.latencyCount++;
    stats.avgLatency = Math.round(stats.latencySum / stats.latencyCount);
    stats.inCooldown = false;
    stats.failures = 0;

    const existingTimer = this.cooldownTimers.get(endpointName);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.cooldownTimers.delete(endpointName);
    }

    // Pass metric to anomaly detector
    this.anomalyDetector.detectLatencyAnomaly(endpointName, latency);
  }

  recordFailure(endpointName, error) {
    const stats = this.endpointStats.get(endpointName);
    if (!stats) {
      return;
    }

    stats.failures++;
    stats.lastFailure = Date.now();

    this.emit('endpoint_failure', {
      endpoint: endpointName,
      error
    });

    if (stats.failures >= 3) {
      stats.inCooldown = true;
      const existingTimer = this.cooldownTimers.get(endpointName);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        const s = this.endpointStats.get(endpointName);
        if (s) {
          s.inCooldown = false;
        }
        this.cooldownTimers.delete(endpointName);
      }, 3000);
      this.cooldownTimers.set(endpointName, timer);
    }

    this.prometheus.incCounter('endpoint_failures_total', { endpoint: endpointName });
  }

  getMetrics() {
    return {
      ...this.metrics,
      idempotencyKeys: this.idempotencyCache.size
    };
  }

  getEndpointStats() {
    const stats = Array.from(this.endpointStats.values()).map(s => ({
      ...s,
      quarantined: this.quarantinedEndpoints.has(s.name)
    }));
    return stats;
  }

  getPrometheusMetrics() {
    return this.prometheus.export();
  }

  resetMetrics() {
    this.metrics = { total: 0, success: 0, fail: 0, rejected: 0, inFlight: 0, anomalies: 0, quarantined: 0 };
    this.prometheus.resetAll();
    this.anomalyDetector.resetAll();
  }

  resetEndpoints() {
    for (const stats of this.endpointStats.values()) {
      stats.inCooldown = false;
      stats.failures = 0;
    }
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this.cooldownTimers.clear();
    this.quarantinedEndpoints.clear();
    this.circuitBreaker.resetAll();
  }

  async shutdown() {
    // Clear intervals
    if (this.idempotencyCleanupInterval) {
      clearInterval(this.idempotencyCleanupInterval);
      this.idempotencyCleanupInterval = null;
    }
    if (this.quarantineInterval) {
      clearInterval(this.quarantineInterval);
      this.quarantineInterval = null;
    }

    // Clear cooldown timers
    for (const timer of this.cooldownTimers.values()) {
      clearTimeout(timer);
    }
    this.cooldownTimers.clear();

    // Clear idempotency cache
    this.idempotencyCache.clear();

    // Shutdown connection pool and cache
    await this.connectionPool.closeAll();
    this.responseCache.destroy();
  }

}

export function createRouter(options = {}) {
  return new RouterCore(options);
}
