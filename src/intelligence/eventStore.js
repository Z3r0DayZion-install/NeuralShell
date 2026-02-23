/**
 * Event Store Client Library
 * 
 * Provides a client for writing Decision_Events to Kafka with durability guarantees.
 * Uses UUID v7 for time-ordered event IDs and ensures sub-10ms persistence latency.
 * 
 * Requirements: 1.1, 1.2, 1.4, 49.2
 */

import { Kafka } from 'kafkajs';
import { v7 as uuidv7 } from 'uuid';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('neuralshell-event-store');

/**
 * Decision Event Schema
 * @typedef {Object} DecisionEvent
 * @property {string} event_id - UUID v7 (time-ordered)
 * @property {number} timestamp - Unix timestamp in microseconds
 * @property {string} decision_type - e.g., "scaling", "healing", "routing"
 * @property {string} system_component - e.g., "auto-scaler", "self-healing"
 * @property {Object} context - Decision context
 * @property {string} context.trigger - What caused the decision
 * @property {Object} context.metrics - Relevant metrics
 * @property {Object} context.state - System state
 * @property {Object} action_taken - Action details
 * @property {string} action_taken.type - Action type
 * @property {Object} action_taken.parameters - Action parameters
 * @property {Object} outcome - Decision outcome
 * @property {string} outcome.status - "success" | "failure" | "partial"
 * @property {number} outcome.duration_ms - Execution duration
 * @property {Object} outcome.impact - Impact metrics
 * @property {number} [quality_score] - 0-100, calculated post-decision
 * @property {string} trace_id - OpenTelemetry trace ID
 * @property {string} span_id - OpenTelemetry span ID
 */

/**
 * Event Store Client
 */
export class EventStoreClient {
  constructor(config = {}) {
    this.config = {
      brokers: config.brokers || process.env.KAFKA_BROKERS?.split(',') || ['localhost:19092', 'localhost:19093', 'localhost:19094'],
      clientId: config.clientId || 'neuralshell-event-store',
      topic: config.topic || 'decision-events',
      compression: config.compression || 'lz4',
      acks: config.acks || -1, // Wait for all in-sync replicas
      timeout: config.timeout || 10000, // 10 second timeout
      ...config
    };

    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.producer = null;
    this.connected = false;
    this.metrics = {
      eventsWritten: 0,
      writeErrors: 0,
      totalLatency: 0,
      maxLatency: 0
    };
  }

  /**
   * Connect to Kafka cluster
   */
  async connect() {
    if (this.connected) {
      return;
    }

    const span = tracer.startSpan('eventStore.connect');
    
    try {
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: false,
        transactionTimeout: 30000,
        compression: this.config.compression,
        idempotent: true, // Ensure exactly-once semantics
        maxInFlightRequests: 5,
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      await this.producer.connect();
      this.connected = true;
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      throw new Error(`Failed to connect to Kafka: ${error.message}`);
    }
  }

  /**
   * Disconnect from Kafka cluster
   */
  async disconnect() {
    if (!this.connected || !this.producer) {
      return;
    }

    try {
      await this.producer.disconnect();
      this.connected = false;
    } catch (error) {
      console.error('Error disconnecting from Kafka:', error);
    }
  }

  /**
   * Generate UUID v7 (time-ordered)
   * @returns {string} UUID v7
   */
  generateEventId() {
    return uuidv7();
  }

  /**
   * Get current timestamp in microseconds
   * @returns {number} Unix timestamp in microseconds
   */
  getCurrentTimestamp() {
    return Date.now() * 1000 + (process.hrtime()[1] / 1000);
  }

  /**
   * Write a decision event to the Event Store
   * 
   * @param {Object} event - Decision event data
   * @param {string} event.decision_type - Type of decision
   * @param {string} event.system_component - Component making the decision
   * @param {Object} event.context - Decision context
   * @param {Object} event.action_taken - Action details
   * @param {Object} event.outcome - Decision outcome
   * @returns {Promise<string>} Event ID
   */
  async writeEvent(event) {
    if (!this.connected) {
      await this.connect();
    }

    const startTime = process.hrtime.bigint();
    const span = tracer.startSpan('eventStore.writeEvent', {
      attributes: {
        'event.decision_type': event.decision_type,
        'event.system_component': event.system_component,
        'event.outcome.status': event.outcome?.status
      }
    });

    try {
      // Generate event ID and timestamp
      const eventId = this.generateEventId();
      const timestamp = this.getCurrentTimestamp();

      // Get trace context
      const activeSpan = trace.getSpan(context.active());
      const traceId = activeSpan?.spanContext().traceId || '00000000000000000000000000000000';
      const spanId = activeSpan?.spanContext().spanId || '0000000000000000';

      // Build complete event
      const completeEvent = {
        event_id: eventId,
        timestamp,
        decision_type: event.decision_type,
        system_component: event.system_component,
        context: event.context || {},
        action_taken: event.action_taken || {},
        outcome: event.outcome || { status: 'unknown', duration_ms: 0, impact: {} },
        trace_id: traceId,
        span_id: spanId,
        quality_score: event.quality_score
      };

      // Validate event
      this.validateEvent(completeEvent);

      // Partition key based on decision_type for efficient querying
      const partitionKey = event.decision_type;

      // Write to Kafka with acknowledgment waiting
      const result = await this.producer.send({
        topic: this.config.topic,
        messages: [{
          key: partitionKey,
          value: JSON.stringify(completeEvent),
          headers: {
            'event_id': eventId,
            'decision_type': event.decision_type,
            'trace_id': traceId
          }
        }],
        acks: this.config.acks,
        timeout: this.config.timeout
      });

      // Calculate latency
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000;

      // Update metrics
      this.metrics.eventsWritten++;
      this.metrics.totalLatency += latencyMs;
      this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latencyMs);

      span.setAttribute('event.id', eventId);
      span.setAttribute('event.latency_ms', latencyMs);
      span.setAttribute('kafka.partition', result[0].partition);
      span.setAttribute('kafka.offset', result[0].baseOffset);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      // Log warning if latency exceeds 10ms target
      if (latencyMs > 10) {
        console.warn(`Event write latency ${latencyMs.toFixed(2)}ms exceeds 10ms target`);
      }

      return eventId;
    } catch (error) {
      this.metrics.writeErrors++;
      
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      
      throw new Error(`Failed to write event: ${error.message}`);
    }
  }

  /**
   * Write multiple events in a batch
   * 
   * @param {Array<Object>} events - Array of decision events
   * @returns {Promise<Array<string>>} Array of event IDs
   */
  async writeBatch(events) {
    if (!this.connected) {
      await this.connect();
    }

    const span = tracer.startSpan('eventStore.writeBatch', {
      attributes: {
        'batch.size': events.length
      }
    });

    try {
      const messages = events.map(event => {
        const eventId = this.generateEventId();
        const timestamp = this.getCurrentTimestamp();
        
        const activeSpan = trace.getSpan(context.active());
        const traceId = activeSpan?.spanContext().traceId || '00000000000000000000000000000000';
        const spanId = activeSpan?.spanContext().spanId || '0000000000000000';

        const completeEvent = {
          event_id: eventId,
          timestamp,
          decision_type: event.decision_type,
          system_component: event.system_component,
          context: event.context || {},
          action_taken: event.action_taken || {},
          outcome: event.outcome || { status: 'unknown', duration_ms: 0, impact: {} },
          trace_id: traceId,
          span_id: spanId,
          quality_score: event.quality_score
        };

        this.validateEvent(completeEvent);

        return {
          key: event.decision_type,
          value: JSON.stringify(completeEvent),
          headers: {
            'event_id': eventId,
            'decision_type': event.decision_type,
            'trace_id': traceId
          }
        };
      });

      await this.producer.send({
        topic: this.config.topic,
        messages,
        acks: this.config.acks,
        timeout: this.config.timeout
      });

      const eventIds = messages.map(m => m.headers.event_id);
      
      this.metrics.eventsWritten += events.length;
      
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      return eventIds;
    } catch (error) {
      this.metrics.writeErrors += events.length;
      
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();
      
      throw new Error(`Failed to write batch: ${error.message}`);
    }
  }

  /**
   * Validate event structure
   * @param {DecisionEvent} event - Event to validate
   * @throws {Error} If event is invalid
   */
  validateEvent(event) {
    const required = ['event_id', 'timestamp', 'decision_type', 'system_component', 'context', 'action_taken', 'outcome'];
    
    for (const field of required) {
      if (!event[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof event.timestamp !== 'number') {
      throw new Error('timestamp must be a number');
    }

    if (!['success', 'failure', 'partial', 'unknown'].includes(event.outcome.status)) {
      throw new Error('outcome.status must be one of: success, failure, partial, unknown');
    }

    if (event.quality_score !== undefined) {
      if (typeof event.quality_score !== 'number' || event.quality_score < 0 || event.quality_score > 100) {
        throw new Error('quality_score must be a number between 0 and 100');
      }
    }
  }

  /**
   * Get client metrics
   * @returns {Object} Metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatency: this.metrics.eventsWritten > 0 
        ? this.metrics.totalLatency / this.metrics.eventsWritten 
        : 0,
      connected: this.connected
    };
  }

  /**
   * Health check
   * @returns {Promise<boolean>} True if healthy
   */
  async healthCheck() {
    try {
      if (!this.connected) {
        return false;
      }

      // Try to get cluster metadata as a health check
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      
      return true;
    } catch (error) {
      console.error('Event Store health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
let eventStoreInstance = null;

/**
 * Get or create Event Store client instance
 * @param {Object} config - Configuration
 * @returns {EventStoreClient} Event Store client
 */
export function getEventStore(config) {
  if (!eventStoreInstance) {
    eventStoreInstance = new EventStoreClient(config);
  }
  return eventStoreInstance;
}

export default EventStoreClient;
