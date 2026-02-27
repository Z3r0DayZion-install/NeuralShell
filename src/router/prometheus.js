const METRIC_TYPES = {
  COUNTER: 'counter',
  GAUGE: 'gauge',
  HISTOGRAM: 'histogram',
  SUMMARY: 'summary'
};

class PrometheusExporter {
  constructor(options = {}) {
    this.namespace = options.namespace || 'neuralshell';
    this.subsystem = options.subsystem || 'router';
    this.metrics = new Map();
    this.labels = options.labels || {};
    this.prefix = `${this.namespace}_${this.subsystem}`;

    this.initDefaultMetrics();
  }

  initDefaultMetrics() {
    this.createCounter('requests_total', 'Total requests processed', ['method', 'endpoint', 'status']);
    this.createCounter('requests_errors_total', 'Total request errors', ['endpoint', 'error_type']);
    this.createGauge('requests_in_flight', 'Requests currently being processed', ['endpoint']);
    this.createHistogram('request_duration_ms', 'Request duration in milliseconds', [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], ['endpoint']);
    this.createCounter('upstream_requests_total', 'Total upstream requests', ['endpoint', 'status']);
    this.createHistogram('upstream_duration_ms', 'Upstream request duration', [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], ['endpoint']);
    this.createGauge('upstream_in_flight', 'Upstream requests in flight', ['endpoint']);
    this.createGauge('upstream_cooldown', 'Endpoint cooldown status', ['endpoint']);
    this.createCounter('endpoint_failures_total', 'Endpoint failures', ['endpoint']);
    this.createCounter('endpoint_successes_total', 'Endpoint successes', ['endpoint']);
    this.createGauge('endpoint_latency_avg_ms', 'Average endpoint latency', ['endpoint']);
    this.createGauge('endpoint_latency_p99_ms', 'P99 endpoint latency', ['endpoint']);
    this.createCounter('rate_limits_total', 'Rate limit hits', ['client']);
    this.createGauge('rate_limit_remaining', 'Remaining rate limit', ['client']);
    this.createCounter('idempotency_cache_hits', 'Idempotency cache hits', ['endpoint']);
    this.createCounter('idempotency_cache_misses', 'Idempotency cache misses', ['endpoint']);
    this.createGauge('idempotency_cache_size', 'Idempotency cache size', ['endpoint']);
    this.createCounter('circuit_breaker_state_changes', 'Circuit breaker state changes', ['endpoint', 'state']);
    this.createGauge('queue_size', 'Queue size by priority', ['priority']);
    this.createGauge('queue_capacity', 'Queue capacity', ['priority']);
    this.createCounter('cache_hits_total', 'Cache hits', ['cache']);
    this.createCounter('cache_misses_total', 'Cache misses', ['cache']);
    this.createGauge('cache_size', 'Cache size', ['cache']);
    this.createGauge('memory_usage_bytes', 'Memory usage by type', ['type']);
    this.createGauge('connections_pool_size', 'Connection pool size', ['endpoint']);
    this.createCounter('tokens_sent_total', 'Total tokens sent', ['model']);
    this.createCounter('tokens_received_total', 'Total tokens received', ['model']);
    this.createCounter('cost_total', 'Total cost in cents', ['model']);
  }

  createCounter(name, help, labelNames = []) {
    const fullName = `${this.prefix}_${name}`;
    this.metrics.set(fullName, {
      type: METRIC_TYPES.COUNTER,
      name: fullName,
      help,
      labelNames,
      values: new Map()
    });
    return fullName;
  }

  createGauge(name, help, labelNames = []) {
    const fullName = `${this.prefix}_${name}`;
    this.metrics.set(fullName, {
      type: METRIC_TYPES.GAUGE,
      name: fullName,
      help,
      labelNames,
      values: new Map()
    });
    return fullName;
  }

  createHistogram(name, help, buckets, labelNames = []) {
    const fullName = `${this.prefix}_${name}`;
    this.metrics.set(fullName, {
      type: METRIC_TYPES.HISTOGRAM,
      name: fullName,
      help,
      labelNames,
      buckets: buckets.reduce((acc, b) => {
        acc[b] = 0; return acc;
      }, {}),
      values: new Map()
    });
    return fullName;
  }

  getLabelKey(labels) {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    return Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
  }

  incCounter(name, labels = {}, value = 1) {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== METRIC_TYPES.COUNTER) {
      return;
    }

    const key = this.getLabelKey(labels);
    const current = metric.values.get(key) || 0;
    metric.values.set(key, current + value);
  }

  setGauge(name, labels = {}, value) {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== METRIC_TYPES.GAUGE) {
      return;
    }

    const key = this.getLabelKey(labels);
    metric.values.set(key, value);
  }

  observeHistogram(name, labels = {}, value) {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== METRIC_TYPES.HISTOGRAM) {
      return;
    }

    const key = this.getLabelKey(labels);
    let histogram = metric.values.get(key);

    if (!histogram) {
      histogram = {
        sum: 0,
        count: 0,
        buckets: { ...metric.buckets }
      };
    }

    histogram.sum += value;
    histogram.count++;

    for (const bucket of Object.keys(histogram.buckets)) {
      if (value <= parseFloat(bucket)) {
        histogram.buckets[bucket]++;
      }
    }

    metric.values.set(key, histogram);
  }

  setGaugeFromLabels(name, labelValues, value) {
    this.setGauge(name, labelValues, value);
  }

  incCounterFromLabels(name, labelValues, value = 1) {
    this.incCounter(name, labelValues, value);
  }

  observeFromLabels(name, labelValues, value) {
    this.observeHistogram(name, labelValues, value);
  }

  resetMetric(name) {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.values.clear();
    }
  }

  resetAll() {
    for (const metric of this.metrics.values()) {
      metric.values.clear();
    }
  }

  export() {
    const lines = [];

    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);

      for (const [labelKey, value] of metric.values) {
        let labelStr = '';
        if (labelKey) {
          const labels = `{${labelKey}}`;
          labelStr = labels;
        }

        if (metric.type === METRIC_TYPES.HISTOGRAM) {
          lines.push(`${metric.name}_sum${labelStr} ${value.sum.toFixed(6)}`);
          lines.push(`${metric.name}_count${labelStr} ${value.count}`);

          const sortedBuckets = Object.entries(value.buckets)
            .sort(([a], [b]) => parseFloat(a) - parseFloat(b));

          for (const [bucket, count] of sortedBuckets) {
            lines.push(`${metric.name}_bucket${labelStr.replace('{', `{le="${bucket}",`)} ${count}`);
          }
        } else if (metric.type === METRIC_TYPES.GAUGE || metric.type === METRIC_TYPES.COUNTER) {
          lines.push(`${metric.name}${labelStr} ${typeof value === 'number' ? value : 0}`);
        }
      }
    }

    return `${lines.join('\n') }\n`;
  }

  exportJSON() {
    const output = {};

    for (const [name, metric] of this.metrics) {
      output[name] = {
        type: metric.type,
        help: metric.help,
        values: {}
      };

      for (const [labelKey, value] of metric.values) {
        if (metric.type === METRIC_TYPES.HISTOGRAM) {
          output[name].values[labelKey] = {
            sum: value.sum,
            count: value.count,
            buckets: value.buckets
          };
        } else {
          output[name].values[labelKey] = value;
        }
      }
    }

    return output;
  }

  getMetricNames() {
    return Array.from(this.metrics.keys());
  }
}

function createRouterMetricsExporter(options = {}) {
  return new PrometheusExporter({
    namespace: options.namespace || 'neuralshell',
    subsystem: options.subsystem || 'router',
    labels: options.labels || {}
  });
}

export { PrometheusExporter, createRouterMetricsExporter, METRIC_TYPES };
