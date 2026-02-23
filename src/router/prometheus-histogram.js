// Prometheus histograms for precise latency metrics
export class PrometheusHistogram {
  constructor(buckets = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000]) {
    this.buckets = buckets.sort((a, b) => a - b);
    this.bucketCounts = Array(buckets.length + 1).fill(0); // +1 for infinity
    this.sum = 0;
    this.count = 0;
  }

  observe(value) {
    this.count += 1;
    this.sum += value;

    for (let i = 0; i < this.buckets.length; i++) {
      if (value <= this.buckets[i]) {
        this.bucketCounts[i] += 1;
        break;
      }
    }
    this.bucketCounts[this.buckets.length] += 1; // Infinity bucket
  }

  getPercentile(percentile) {
    if (this.count === 0) {
      return 0;
    }

    const rank = (percentile / 100) * this.count;
    let cumulative = 0;

    for (let i = 0; i < this.buckets.length; i++) {
      cumulative = this.bucketCounts[i];
      if (cumulative >= rank) {
        // Linear interpolation within bucket
        const lowerBound = i === 0 ? 0 : this.buckets[i - 1];
        const upperBound = this.buckets[i];
        const prevCumulative = i === 0 ? 0 : this.bucketCounts[i - 1];
        const bucketSize = cumulative - prevCumulative;

        if (bucketSize === 0) {
          return upperBound;
        }

        const fraction = (rank - prevCumulative) / bucketSize;
        return lowerBound + (upperBound - lowerBound) * fraction;
      }
    }

    return this.buckets[this.buckets.length - 1];
  }

  getStats() {
    return {
      count: this.count,
      sum: this.sum,
      mean: this.count > 0 ? this.sum / this.count : 0,
      min: this.count > 0 ? this.buckets[0] : 0,
      max: this.buckets[this.buckets.length - 1],
      p50: this.getPercentile(50),
      p75: this.getPercentile(75),
      p90: this.getPercentile(90),
      p95: this.getPercentile(95),
      p99: this.getPercentile(99),
      p999: this.getPercentile(99.9)
    };
  }

  toPrometheusFormat(name, labels = {}) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    const labelPart = labelStr ? `{${labelStr}}` : '';

    const lines = [
      `# HELP ${name} Histogram metric`,
      `# TYPE ${name} histogram`
    ];

    for (let i = 0; i < this.buckets.length; i++) {
      lines.push(`${name}_bucket${labelPart}{le="${this.buckets[i]}"} ${this.bucketCounts[i]}`);
    }

    lines.push(`${name}_bucket${labelPart}{le="+Inf"} ${this.bucketCounts[this.buckets.length]}`);
    lines.push(`${name}_sum${labelPart} ${this.sum}`);
    lines.push(`${name}_count${labelPart} ${this.count}`);

    return lines.join('\n');
  }

  reset() {
    this.bucketCounts = Array(this.buckets.length + 1).fill(0);
    this.sum = 0;
    this.count = 0;
  }
}

export class HistogramRegistry {
  constructor() {
    this.histograms = new Map();
  }

  createHistogram(name, buckets) {
    const histogram = new PrometheusHistogram(buckets);
    this.histograms.set(name, histogram);
    return histogram;
  }

  getHistogram(name) {
    return this.histograms.get(name);
  }

  observe(name, value) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.observe(value);
    }
  }

  getAllStats() {
    const stats = {};
    for (const [name, histogram] of this.histograms) {
      stats[name] = histogram.getStats();
    }
    return stats;
  }

  toPrometheusFormat() {
    const lines = [];
    for (const [name, histogram] of this.histograms) {
      lines.push(histogram.toPrometheusFormat(name));
      lines.push('');
    }
    return lines.join('\n');
  }
}
