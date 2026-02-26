export function computeEndpointScore(ep) {
  if (!ep) {
    return 0;
  }

  const successes = Number(ep.successes || ep.totalSuccesses || 0);
  const failures = Number(ep.failures || ep.totalFailures || 0);
  const attempts = successes + failures;
  const successRate = attempts > 0 ? successes / attempts : 1;

  const avgLatency = Number(ep.avgLatency || ep.lastLatencyMs || 0);
  const latencyPenalty = avgLatency ? Math.min(avgLatency / 5000, 0.5) : 0;

  const inCooldown = Boolean(ep.inCooldown || (ep.cooldownUntil && ep.cooldownUntil > Date.now()));
  const cooldownPenalty = inCooldown ? 1 : 0;
  const failurePenalty = Math.min(failures * 0.1, 0.5);

  const score = successRate - latencyPenalty - cooldownPenalty - failurePenalty;
  return Number(score.toFixed(4));
}

export function orderEndpointsAdaptive(endpoints, statsMap, options = {}) {
  if (!endpoints || endpoints.length === 0) {
    return [];
  }

  // Support boolean options (like adaptiveRouting flag)
  const actualOptions = typeof options === 'boolean' ? { adaptive: options } : options;

  const scored = endpoints.map(ep => {
    let stats = {};
    if (statsMap && typeof statsMap.get === 'function') {
      stats = statsMap.get(ep.name) || {};
    } else if (Array.isArray(statsMap)) {
      stats = statsMap.find(s => s.name === ep.name) || {};
    } else if (statsMap && typeof statsMap === 'object') {
      stats = statsMap[ep.name] || {};
    }

    return {
      endpoint: ep,
      score: computeEndpointScore(stats)
    };
  });

  scored.sort((a, b) => {
    if (actualOptions.strategy === 'random') {
      return Math.random() - 0.5;
    }

    if (actualOptions.strategy === 'round-robin') {
      return 0;
    }

    if (actualOptions.strategy === 'least-latency') {
      const statsA = (statsMap && typeof statsMap.get === 'function') ? statsMap.get(a.endpoint.name) : (Array.isArray(statsMap) ? statsMap.find(s => s.name === a.endpoint.name) : null);
      const statsB = (statsMap && typeof statsMap.get === 'function') ? statsMap.get(b.endpoint.name) : (Array.isArray(statsMap) ? statsMap.find(s => s.name === b.endpoint.name) : null);

      const latencyA = Number(statsA?.avgLatency || statsA?.lastLatencyMs || 0);
      const latencyB = Number(statsB?.avgLatency || statsB?.lastLatencyMs || 0);
      return latencyA - latencyB;
    }

    // Default: b.score - a.score
    return b.score - a.score;
  });

  if (actualOptions.returnFirst) {
    return scored[0]?.endpoint || null;
  }

  return scored.map(s => s.endpoint);
}

export function selectWeightedEndpoint(endpoints, statsMap) {
  if (!endpoints || endpoints.length === 0) {
    return null;
  }

  const validEndpoints = endpoints.filter(ep => {
    const stats = statsMap?.get?.(ep.name);
    return stats && !stats.inCooldown;
  });

  if (validEndpoints.length === 0) {
    return null;
  }

  const totalWeight = validEndpoints.reduce((sum, ep) => {
    const stats = statsMap.get(ep.name);
    const healthMultiplier = stats?.healthy ? 1 : 0.1;
    const successMultiplier = stats?.successes ? Math.min(stats.successes / 10, 2) : 1;
    return sum + ((ep.weight || 1) * healthMultiplier * successMultiplier);
  }, 0);

  let random = Math.random() * totalWeight;

  for (const ep of validEndpoints) {
    const stats = statsMap.get(ep.name);
    const healthMultiplier = stats?.healthy ? 1 : 0.1;
    const successMultiplier = stats?.successes ? Math.min(stats.successes / 10, 2) : 1;
    const weight = (ep.weight || 1) * healthMultiplier * successMultiplier;

    random -= weight;
    if (random <= 0) {
      return ep;
    }
  }

  return validEndpoints[0];
}

export function selectLeastLoadedEndpoint(endpoints, statsMap) {
  if (!endpoints || endpoints.length === 0) {
    return null;
  }

  const validEndpoints = endpoints.filter(ep => {
    const stats = statsMap?.get?.(ep.name);
    return stats && !stats.inCooldown && stats.healthy;
  });

  if (validEndpoints.length === 0) {
    return null;
  }

  return validEndpoints.reduce((min, ep) => {
    const stats = statsMap.get(ep.name);
    const loadA = min ? (statsMap.get(min.name)?.latencyCount || 0) : Infinity;
    const loadB = stats?.latencyCount || 0;
    return loadB < loadA ? ep : min;
  });
}
