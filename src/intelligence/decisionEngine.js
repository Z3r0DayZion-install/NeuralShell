/**
 * Decision Intelligence Engine
 * 
 * Core engine for recording, querying, and analyzing autonomous decisions.
 * Uses event sourcing with Kafka for immutable decision history and
 * integrates with OpenTelemetry for distributed tracing.
 * 
 * Requirements: 1.1, 1.2, 15.2
 */

import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { getEventStore } from './eventStore.js';

const tracer = trace.getTracer('neuralshell-decision-engine');

/**
 * Decision Intelligence Engine
 * 
 * Provides the core functionality for recording autonomous decisions
 * as immutable events with full tracing context.
 */
export class DecisionIntelligenceEngine {
  constructor(config = {}) {
    this.config = {
      brokers: config.brokers || process.env.KAFKA_BROKERS?.split(',') || ['localhost:19092'],
      topic: config.topic || 'decision-events',
      clientId: config.clientId || 'neuralshell-decision-engine',
      autoConnect: config.autoConnect !== undefined ? config.autoConnect : true,
      maxLatencyMs: config.maxLatencyMs || 10
    };

    this.connected = false;

    // Initialize Event Store client
    this.eventStore = getEventStore({
      brokers: this.config.brokers,
      topic: this.config.topic,
      clientId: this.config.clientId
    });
  }

  /**
   * Connect to the Event Store
   */
  async connect() {
    if (this.connected) {
      return;
    }

    const span = tracer.startSpan('decisionEngine.connect');
    
    try {
      await this.eventStore.connect();
      this.connected = true;
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();
      throw error;
    }
  }

  /**
   * Disconnect from the Event Store
   */
  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      await this.eventStore.disconnect();
      this.connected = false;
    } catch (error) {
      console.error('Error disconnecting from Event Store:', error);
    }
  }

  /**
   * Record an autonomous decision as an immutable event
   */
  async recordDecision(event) {
    // Auto-connect if enabled
    if (!this.connected && this.config.autoConnect) {
      await this.connect();
    }

    if (!this.connected) {
      throw new Error('Decision Engine not connected. Call connect() first or enable autoConnect.');
    }

    const startTime = process.hrtime.bigint();
    
    // Start a span for the decision recording
    const span = tracer.startSpan('decisionEngine.recordDecision', {
      attributes: {
        'decision.type': event.decision_type,
        'decision.component': event.system_component,
        'decision.outcome.status': event.outcome?.status
      }
    });

    try {
      // Get trace context from OpenTelemetry
      const activeSpan = trace.getSpan(context.active());
      const traceId = activeSpan?.spanContext().traceId || span.spanContext().traceId;
      const spanId = activeSpan?.spanContext().spanId || span.spanContext().spanId;

      // Build complete event with trace context
      const completeEvent = {
        ...event,
        trace_id: event.trace_id || traceId,
        span_id: event.span_id || spanId
      };

      // Write to Event Store
      const eventId = await this.eventStore.writeEvent(completeEvent);

      // Calculate latency
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000;

      // Add span attributes
      span.setAttribute('event.id', eventId);
      span.setAttribute('event.latency_ms', latencyMs);
      span.setAttribute('event.trace_id', completeEvent.trace_id);
      span.setAttribute('event.span_id', completeEvent.span_id);

      // Log warning if latency exceeds target
      if (latencyMs > this.config.maxLatencyMs) {
        const warningMsg = `Decision recording latency ${latencyMs.toFixed(2)}ms exceeds ${this.config.maxLatencyMs}ms target`;
        console.warn(warningMsg);
        span.addEvent('latency_warning', {
          'latency_ms': latencyMs,
          'target_ms': this.config.maxLatencyMs
        });
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();
      
      throw new Error(`Failed to record decision: ${error.message}`);
    }
  }

  /**
   * Record multiple decisions in a batch
   */
  async recordDecisionBatch(events) {
    if (!this.connected && this.config.autoConnect) {
      await this.connect();
    }

    if (!this.connected) {
      throw new Error('Decision Engine not connected. Call connect() first or enable autoConnect.');
    }

    const span = tracer.startSpan('decisionEngine.recordDecisionBatch', {
      attributes: {
        'batch.size': events.length
      }
    });

    try {
      // Get trace context
      const activeSpan = trace.getSpan(context.active());
      const traceId = activeSpan?.spanContext().traceId || span.spanContext().traceId;
      const spanId = activeSpan?.spanContext().spanId || span.spanContext().spanId;

      // Add trace context to all events
      const completeEvents = events.map(event => ({
        ...event,
        trace_id: event.trace_id || traceId,
        span_id: event.span_id || spanId
      }));

      // Write batch to Event Store
      await this.eventStore.writeBatch(completeEvents);

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      span.recordException(error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error.message 
      });
      span.end();
      
      throw new Error(`Failed to record decision batch: ${error.message}`);
    }
  }

  /**
   * Get Event Store metrics
   */
  getMetrics() {
    return this.eventStore.getMetrics();
  }

  /**
   * Health check for the Decision Engine
   */
  async healthCheck() {
    if (!this.connected) {
      return false;
    }

    return this.eventStore.healthCheck();
  }

  /**
   * Check if the engine is connected
   */
  isConnected() {
    return this.connected;
  }
}

// Singleton instance
let decisionEngineInstance = null;

/**
 * Get or create Decision Intelligence Engine instance
 */
export function getDecisionEngine(config) {
  if (!decisionEngineInstance) {
    decisionEngineInstance = new DecisionIntelligenceEngine(config);
  }
  return decisionEngineInstance;
}

export default DecisionIntelligenceEngine;
