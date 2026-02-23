// OpenTelemetry distributed tracing integration
export class TracingManager {
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.serviceName = config.serviceName || 'neuralshell-router';
    this.version = config.version || 'unknown';
    this.spans = new Map(); // traceId -> spans
    this.config = config;
  }

  generateTraceId() {
    return Math.random().toString(16).substring(2, 18);
  }

  generateSpanId() {
    return Math.random().toString(16).substring(2, 10);
  }

  startSpan(name, parentSpanId = null, attributes = {}) {
    if (!this.enabled) {
      return null;
    }

    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const timestamp = Date.now();

    const span = {
      traceId,
      spanId,
      parentSpanId,
      name,
      startTime: timestamp,
      endTime: null,
      duration: null,
      attributes: {
        'service.name': this.serviceName,
        'service.version': this.version,
        ...attributes
      },
      events: [],
      status: 'UNSET', // UNSET, OK, ERROR
      errorMessage: null
    };

    if (!this.spans.has(traceId)) {
      this.spans.set(traceId, []);
    }
    this.spans.get(traceId).push(span);

    return span;
  }

  addEvent(span, eventName, attributes = {}) {
    if (!span) {
      return;
    }

    span.events.push({
      name: eventName,
      timestamp: Date.now(),
      attributes
    });
  }

  endSpan(span, status = 'OK', errorMessage = null) {
    if (!span) {
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    span.errorMessage = errorMessage;

    return span;
  }

  getSpanContext(span) {
    if (!span) {
      return null;
    }

    return {
      traceId: span.traceId,
      spanId: span.spanId,
      parentSpanId: span.parentSpanId,
      trceFlags: '01'
    };
  }

  exportSpans(traceId) {
    const spans = this.spans.get(traceId);
    if (!spans) {
      return null;
    }

    const exported = {
      traceId,
      spans: spans.map((span) => ({
        traceId: span.traceId,
        spanId: span.spanId,
        parentSpanId: span.parentSpanId,
        name: span.name,
        startTimeUnixNano: span.startTime * 1000000,
        endTimeUnixNano: span.endTime ? span.endTime * 1000000 : 0,
        attributes: span.attributes,
        events: span.events.map((evt) => ({
          name: evt.name,
          timeUnixNano: evt.timestamp * 1000000,
          attributes: evt.attributes
        })),
        status: {
          code: span.status === 'OK' ? 0 : 2,
          message: span.errorMessage || ''
        }
      })),
      timestamp: Date.now()
    };

    return exported;
  }

  cleanup(maxAge = 3600000) {
    const cutoff = Date.now() - maxAge;
    for (const [traceId, spans] of this.spans) {
      if (spans[0]?.startTime < cutoff) {
        this.spans.delete(traceId);
      }
    }
  }

  getStats() {
    return {
      activeTraces: this.spans.size,
      totalSpans: Array.from(this.spans.values()).reduce((sum, spans) => sum + spans.length, 0)
    };
  }
}
