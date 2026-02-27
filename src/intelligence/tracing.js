/**
 * OpenTelemetry Tracing Integration
 *
 * Provides distributed tracing with OpenTelemetry SDK, trace context propagation,
 * and adaptive sampling (100% errors, 10% success).
 *
 * Requirements: 15.1, 15.2, 15.4, 15.5
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
  trace,
  context,
  propagation,
  SpanStatusCode,
  SpanKind
} from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import {
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  AlwaysOnSampler
} from '@opentelemetry/sdk-trace-node';

/**
 * Adaptive Sampler
 * Samples 100% of errors and 10% of successful requests
 */
class AdaptiveSampler {
  constructor(successRate = 0.1) {
    this.successSampler = new TraceIdRatioBasedSampler(successRate);
    this.errorSampler = new AlwaysOnSampler();
  }

  shouldSample(ctx, traceId, spanName, spanKind, attributes, links) {
    // Check if this is an error span
    const isError = attributes['error'] === true ||
                    attributes['http.status_code'] >= 400 ||
                    spanName.toLowerCase().includes('error') ||
                    spanName.toLowerCase().includes('failure');

    if (isError) {
      // Sample all errors
      return this.errorSampler.shouldSample(ctx, traceId, spanName, spanKind, attributes, links);
    } else {
      // Sample 10% of successful requests
      return this.successSampler.shouldSample(ctx, traceId, spanName, spanKind, attributes, links);
    }
  }

  toString() {
    return 'AdaptiveSampler{errors=100%, success=10%}';
  }
}

/**
 * OpenTelemetry Tracing Manager
 */
export class TracingManager {
  constructor(config = {}) {
    this.config = {
      serviceName: config.serviceName || process.env.SERVICE_NAME || 'neuralshell',
      serviceVersion: config.serviceVersion || process.env.SERVICE_VERSION || '1.0.0',
      environment: config.environment || process.env.NODE_ENV || 'development',
      tempoEndpoint: config.tempoEndpoint || process.env.TEMPO_ENDPOINT || 'localhost:4317',
      successSampleRate: config.successSampleRate || 0.1, // 10% for successful requests
      ...config
    };

    this.sdk = null;
    this.tracer = null;
    this.initialized = false;
  }

  /**
   * Initialize OpenTelemetry SDK
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create OTLP exporter for Tempo
      const traceExporter = new OTLPTraceExporter({
        url: `grpc://${this.config.tempoEndpoint}`,
        headers: {}
      });

      // Create resource with service information
      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
        [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment
      });

      // Create adaptive sampler
      const sampler = new ParentBasedSampler({
        root: new AdaptiveSampler(this.config.successSampleRate)
      });

      // Initialize SDK
      this.sdk = new NodeSDK({
        resource,
        traceExporter,
        spanProcessor: new BatchSpanProcessor(traceExporter, {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000
        }),
        sampler,
        instrumentations: []
      });

      // Set W3C Trace Context propagator
      propagation.setGlobalPropagator(new W3CTraceContextPropagator());

      await this.sdk.start();

      // Get tracer
      this.tracer = trace.getTracer(this.config.serviceName, this.config.serviceVersion);

      this.initialized = true;

      console.log(`OpenTelemetry tracing initialized: ${this.config.serviceName} -> ${this.config.tempoEndpoint}`);
    } catch (error) {
      console.error('Failed to initialize OpenTelemetry:', error);
      throw error;
    }
  }

  /**
   * Shutdown tracing
   */
  async shutdown() {
    if (!this.initialized || !this.sdk) {
      return;
    }

    try {
      await this.sdk.shutdown();
      this.initialized = false;
    } catch (error) {
      console.error('Error shutting down OpenTelemetry:', error);
    }
  }

  /**
   * Get tracer instance
   * @returns {Tracer} OpenTelemetry tracer
   */
  getTracer() {
    if (!this.initialized) {
      throw new Error('Tracing not initialized. Call initialize() first.');
    }
    return this.tracer;
  }

  /**
   * Start a new span
   *
   * @param {string} name - Span name
   * @param {Object} options - Span options
   * @param {Object} options.attributes - Span attributes
   * @param {SpanKind} options.kind - Span kind
   * @param {Function} fn - Function to execute within span
   * @returns {Promise<any>} Function result
   */
  async withSpan(name, options = {}, fn) {
    if (!this.initialized) {
      // If tracing not initialized, just execute function
      return fn();
    }

    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: options.attributes || {}
    });

    const ctx = trace.setSpan(context.active(), span);

    try {
      const result = await context.with(ctx, fn);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.setAttribute('error', true);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Extract trace context from headers (W3C Trace Context format)
   *
   * @param {Object} headers - HTTP headers
   * @returns {Object} Trace context
   */
  extractTraceContext(headers) {
    const carrier = {};

    // Convert headers to carrier format
    Object.keys(headers).forEach(key => {
      carrier[key.toLowerCase()] = headers[key];
    });

    // Extract context using W3C propagator
    const ctx = propagation.extract(context.active(), carrier);
    const span = trace.getSpan(ctx);

    if (span) {
      const spanContext = span.spanContext();
      return {
        traceId: spanContext.traceId,
        spanId: spanContext.spanId,
        traceFlags: spanContext.traceFlags
      };
    }

    return null;
  }

  /**
   * Inject trace context into headers (W3C Trace Context format)
   *
   * @param {Object} headers - HTTP headers object to inject into
   * @returns {Object} Headers with trace context
   */
  injectTraceContext(headers = {}) {
    const carrier = { ...headers };
    propagation.inject(context.active(), carrier);
    return carrier;
  }

  /**
   * Get current trace ID
   * @returns {string|null} Trace ID
   */
  getCurrentTraceId() {
    const span = trace.getSpan(context.active());
    if (span) {
      return span.spanContext().traceId;
    }
    return null;
  }

  /**
   * Get current span ID
   * @returns {string|null} Span ID
   */
  getCurrentSpanId() {
    const span = trace.getSpan(context.active());
    if (span) {
      return span.spanContext().spanId;
    }
    return null;
  }

  /**
   * Add event to current span
   *
   * @param {string} name - Event name
   * @param {Object} attributes - Event attributes
   */
  addEvent(name, attributes = {}) {
    const span = trace.getSpan(context.active());
    if (span) {
      span.addEvent(name, attributes);
    }
  }

  /**
   * Set attribute on current span
   *
   * @param {string} key - Attribute key
   * @param {any} value - Attribute value
   */
  setAttribute(key, value) {
    const span = trace.getSpan(context.active());
    if (span) {
      span.setAttribute(key, value);
    }
  }

  /**
   * Record exception on current span
   *
   * @param {Error} error - Exception to record
   */
  recordException(error) {
    const span = trace.getSpan(context.active());
    if (span) {
      span.recordException(error);
      span.setAttribute('error', true);
    }
  }

  /**
   * Create a middleware for Fastify to add tracing
   * @returns {Function} Fastify middleware
   */
  createFastifyMiddleware() {
    return async (request, reply) => {
      if (!this.initialized) {
        return;
      }

      // Extract trace context from headers
      const carrier = {};
      Object.keys(request.headers).forEach(key => {
        carrier[key.toLowerCase()] = request.headers[key];
      });

      const parentContext = propagation.extract(context.active(), carrier);

      // Start span for request
      const span = this.tracer.startSpan(
        `${request.method} ${request.url}`,
        {
          kind: SpanKind.SERVER,
          attributes: {
            'http.method': request.method,
            'http.url': request.url,
            'http.target': request.url,
            'http.host': request.hostname,
            'http.scheme': request.protocol,
            'http.user_agent': request.headers['user-agent']
          }
        },
        parentContext
      );

      const ctx = trace.setSpan(parentContext, span);

      // Store context in request for later use
      request.traceContext = {
        traceId: span.spanContext().traceId,
        spanId: span.spanContext().spanId
      };

      // Add response hook to end span
      reply.addHook('onSend', async (_request, replyHook, payload) => {
        span.setAttribute('http.status_code', replyHook.statusCode);

        if (replyHook.statusCode >= 400) {
          span.setAttribute('error', true);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${replyHook.statusCode}`
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        span.end();
        return payload;
      });

      // Execute in context
      return context.with(ctx, () => {});
    };
  }
}

// Singleton instance
let tracingManagerInstance = null;

/**
 * Get or create Tracing Manager instance
 * @param {Object} config - Configuration
 * @returns {TracingManager} Tracing Manager
 */
export function getTracingManager(config) {
  if (!tracingManagerInstance) {
    tracingManagerInstance = new TracingManager(config);
  }
  return tracingManagerInstance;
}

/**
 * Initialize tracing (convenience function)
 * @param {Object} config - Configuration
 * @returns {Promise<TracingManager>} Initialized Tracing Manager
 */
export async function initializeTracing(config) {
  const manager = getTracingManager(config);
  await manager.initialize();
  return manager;
}

export default TracingManager;
