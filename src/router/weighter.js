// Adaptive endpoint weighting based on latency and success rate
export class EndpointWeighter {
  computeWeight(latencySamples, successRate, consecutiveFailures) {
    // Base weight from success rate
    const successWeight = Math.max(0.1, successRate * 100);

    // Latency penalty (lower latency = higher weight)
    let latencyWeight = 100;
    if (successRate > 0 && latencySamples.length > 0) {
      const p95Latency = this.calculateP95(latencySamples);
      latencyWeight = Math.max(10, 200 - p95Latency / 10);
    }

    // Failure penalty (exponential decay)
    const failurePenalty = Math.pow(0.5, Math.max(0, consecutiveFailures - 1));

    // Combined weight
    const weight = (successWeight * latencyWeight * failurePenalty) / 10000;
    return Math.max(0.01, weight);
  }

  calculateP95(samples) {
    if (samples.length === 0) {
      return 0;
    }
    const sorted = [...samples].sort((a, b) => a - b);
    const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
    return sorted[p95Index];
  }

  selectWeighted(endpoints) {
    if (endpoints.length === 0) {
      return null;
    }
    if (endpoints.length === 1) {
      return endpoints[0];
    }

    const weights = endpoints.map((ep) => ep.weight || 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    if (totalWeight <= 0) {
      return endpoints[0];
    }

    let pick = Math.random() * totalWeight;
    for (let i = 0; i < endpoints.length; i++) {
      pick -= weights[i];
      if (pick <= 0) {
        return endpoints[i];
      }
    }
    return endpoints[endpoints.length - 1];
  }

  updateWeights(endpointState) {
    for (const ep of endpointState) {
      const totalAttempts = ep.totalSuccesses + ep.totalFailures + ep.totalSkipped;
      const successRate = totalAttempts > 0 ? ep.totalSuccesses / totalAttempts : 0;

      ep.weight = this.computeWeight(
        ep.latencySamples || [],
        successRate,
        ep.consecutiveFailures || 0
      );
    }
  }
}
