// Adaptive timeout calculation based on endpoint history
export class AdaptiveTimeout {
  constructor(config = {}) {
    this.baseTimeoutMs = config.baseTimeoutMs || 5000;
    this.maxTimeoutMs = config.maxTimeoutMs || 30000;
    this.minTimeoutMs = config.minTimeoutMs || 1000;
    this.multiplier = config.multiplier || 1.5; // P95 * 1.5
    this.adaptiveEnabled = config.adaptiveEnabled !== false;
  }

  calculateTimeout(latencySamples) {
    if (!this.adaptiveEnabled || !latencySamples || latencySamples.length === 0) {
      return this.baseTimeoutMs;
    }

    // Calculate P95 latency
    const sorted = [...latencySamples].sort((a, b) => a - b);
    const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
    const p95Latency = sorted[p95Index];

    // Apply multiplier with jitter
    const jitter = Math.random() * 0.1; // 0-10% variance
    const adaptiveTimeout = p95Latency * this.multiplier * (1 + jitter);

    // Clamp to min/max
    return Math.max(this.minTimeoutMs, Math.min(adaptiveTimeout, this.maxTimeoutMs));
  }

  calculateTimeoutPercentile(latencySamples, percentile = 95) {
    if (!latencySamples || latencySamples.length === 0) {
      return this.baseTimeoutMs;
    }

    const sorted = [...latencySamples].sort((a, b) => a - b);
    const index = Math.max(0, Math.ceil((percentile / 100) * sorted.length) - 1);
    return sorted[index];
  }

  calculateTimeoutWithStdDev(latencySamples, stdDevMultiplier = 2) {
    if (!latencySamples || latencySamples.length === 0) {
      return this.baseTimeoutMs;
    }

    const mean = latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length;
    const variance = latencySamples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / latencySamples.length;
    const stdDev = Math.sqrt(variance);

    const timeout = mean + stdDevMultiplier * stdDev;
    return Math.max(this.minTimeoutMs, Math.min(timeout, this.maxTimeoutMs));
  }

  getTimeoutStats(latencySamples) {
    if (!latencySamples || latencySamples.length === 0) {
      return { baseTimeout: this.baseTimeoutMs };
    }

    const sorted = [...latencySamples].sort((a, b) => a - b);
    const mean = latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length;
    const variance = latencySamples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / latencySamples.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: mean.toFixed(2),
      stdDev: stdDev.toFixed(2),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      suggestedTimeout: this.calculateTimeout(latencySamples),
      baseTimeout: this.baseTimeoutMs
    };
  }
}
