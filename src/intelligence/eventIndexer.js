/**
 * Event Indexer - Kafka Consumer for Decision Event Indexing
 *
 * Consumes Decision_Events from Kafka and builds secondary indexes in PostgreSQL
 * for efficient querying by decision_type, component, and outcome.
 *
 * Requirements: 2.1
 */

import { Kafka } from 'kafkajs';
import pg from 'pg';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

const { Pool } = pg;
const tracer = trace.getTracer('neuralshell-event-indexer');

/**
 * Event Indexer Configuration
 */
export class EventIndexerConfig {
  constructor(config = {}) {
    this.kafka = {
      brokers: config.kafkaBrokers || process.env.KAFKA_BROKERS?.split(',') || ['localhost:19092', 'localhost:19093', 'localhost:19094'],
      clientId: config.kafkaClientId || 'neuralshell-event-indexer',
      groupId: config.kafkaGroupId || 'event-indexer-group',
      topic: config.kafkaTopic || 'decision-events'
    };

    this.postgres = {
      host: config.pgHost || process.env.POSTGRES_HOST || 'localhost',
      port: config.pgPort || process.env.POSTGRES_PORT || 5432,
      database: config.pgDatabase || process.env.POSTGRES_DB || 'neuralshell_metrics',
      user: config.pgUser || process.env.POSTGRES_USER || 'neuralshell',
      password: config.pgPassword || process.env.POSTGRES_PASSWORD || 'neuralshell_dev_password',
      max: config.pgMaxConnections || 20,
      idleTimeoutMillis: config.pgIdleTimeout || 30000,
      connectionTimeoutMillis: config.pgConnectionTimeout || 10000
    };

    this.batchSize = config.batchSize || 100;
    this.batchTimeoutMs = config.batchTimeoutMs || 5000;
    this.autoCommit = config.autoCommit !== undefined ? config.autoCommit : true;
    this.autoCommitInterval = config.autoCommitInterval || 5000;
  }
}

/**
 * Event Indexer
 *
 * Consumes events from Kafka and indexes them in PostgreSQL for efficient querying.
 */
export class EventIndexer {
  constructor(config = {}) {
    this.config = new EventIndexerConfig(config);

    // Initialize Kafka consumer
    this.kafka = new Kafka({
      clientId: this.config.kafka.clientId,
      brokers: this.config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8
      }
    });

    this.consumer = null;

    // Initialize PostgreSQL connection pool
    this.pgPool = new Pool(this.config.postgres);

    // State
    this.running = false;
    this.connected = false;
    this.eventBatch = [];
    this.batchTimer = null;

    // Metrics
    this.metrics = {
      eventsConsumed: 0,
      eventsIndexed: 0,
      indexErrors: 0,
      batchesProcessed: 0,
      totalLatency: 0,
      maxLatency: 0
    };
  }

  /**
   * Connect to Kafka and PostgreSQL
   */
  async connect() {
    if (this.connected) {
      return;
    }

    const span = tracer.startSpan('eventIndexer.connect');

    try {
      // Test PostgreSQL connection
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();

      // Create consumer
      this.consumer = this.kafka.consumer({
        groupId: this.config.kafka.groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
        maxBytesPerPartition: 1048576, // 1MB
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      await this.consumer.connect();

      // Subscribe to decision events topic
      await this.consumer.subscribe({
        topic: this.config.kafka.topic,
        fromBeginning: false
      });

      this.connected = true;

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      console.log('Event Indexer connected successfully');
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      throw new Error(`Failed to connect Event Indexer: ${error.message}`);
    }
  }

  /**
   * Disconnect from Kafka and PostgreSQL
   */
  async disconnect() {
    if (!this.connected) {
      return;
    }

    try {
      // Stop consuming
      this.running = false;

      // Clear batch timer
      if (this.batchTimer) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }

      // Process remaining events in batch
      if (this.eventBatch.length > 0) {
        await this.processBatch();
      }

      // Disconnect consumer
      if (this.consumer) {
        await this.consumer.disconnect();
      }

      // Close PostgreSQL pool
      await this.pgPool.end();

      this.connected = false;

      console.log('Event Indexer disconnected');
    } catch (error) {
      console.error('Error disconnecting Event Indexer:', error);
    }
  }

  /**
   * Start consuming and indexing events
   */
  async start() {
    if (!this.connected) {
      await this.connect();
    }

    if (this.running) {
      console.warn('Event Indexer is already running');
      return;
    }

    this.running = true;

    console.log('Event Indexer started');

    // Start consuming messages
    await this.consumer.run({
      autoCommit: this.config.autoCommit,
      autoCommitInterval: this.config.autoCommitInterval,
      eachMessage: async ({ topic, partition, message }) => {
        await this.handleMessage(topic, partition, message);
      }
    });
  }

  /**
   * Stop consuming events
   */
  async stop() {
    this.running = false;

    // Process remaining batch
    if (this.eventBatch.length > 0) {
      await this.processBatch();
    }

    console.log('Event Indexer stopped');
  }

  /**
   * Handle incoming Kafka message
   */
  async handleMessage(topic, partition, message) {
    const span = tracer.startSpan('eventIndexer.handleMessage', {
      attributes: {
        'kafka.topic': topic,
        'kafka.partition': partition,
        'kafka.offset': message.offset
      }
    });

    try {
      // Parse event
      const eventData = JSON.parse(message.value.toString());

      this.metrics.eventsConsumed++;

      // Add to batch
      this.eventBatch.push({
        event: eventData,
        offset: message.offset,
        partition,
        timestamp: Date.now()
      });

      // Process batch if size threshold reached
      if (this.eventBatch.length >= this.config.batchSize) {
        await this.processBatch();
      } else {
        // Set timer for batch timeout if not already set
        if (!this.batchTimer) {
          this.batchTimer = setTimeout(async () => {
            await this.processBatch();
          }, this.config.batchTimeoutMs);
        }
      }

      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
    } catch (error) {
      this.metrics.indexErrors++;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      console.error('Error handling message:', error);
    }
  }

  /**
   * Process batch of events and index them in PostgreSQL
   */
  async processBatch() {
    if (this.eventBatch.length === 0) {
      return;
    }

    // Clear batch timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batchSize = this.eventBatch.length;
    const batch = [...this.eventBatch];
    this.eventBatch = [];

    const startTime = process.hrtime.bigint();
    const span = tracer.startSpan('eventIndexer.processBatch', {
      attributes: {
        'batch.size': batchSize
      }
    });

    const client = await this.pgPool.connect();

    try {
      // Start transaction
      await client.query('BEGIN');

      // Prepare batch insert
      const values = [];
      const placeholders = [];

      for (let i = 0; i < batch.length; i++) {
        const { event } = batch[i];
        const offset = i * 9;

        placeholders.push(
          `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9})`
        );

        values.push(
          event.event_id,
          new Date(event.timestamp / 1000), // Convert microseconds to milliseconds
          event.decision_type,
          event.system_component,
          event.outcome.status,
          event.trace_id,
          event.span_id,
          event.quality_score || null,
          JSON.stringify(event)
        );
      }

      // Insert batch with ON CONFLICT to handle duplicates
      const query = `
        INSERT INTO decision_event_indexes (
          event_id, timestamp, decision_type, system_component, 
          outcome_status, trace_id, span_id, quality_score, event_data
        )
        VALUES ${placeholders.join(', ')}
        ON CONFLICT (event_id) DO UPDATE SET
          quality_score = EXCLUDED.quality_score,
          indexed_at = NOW()
      `;

      await client.query(query, values);

      // Commit transaction
      await client.query('COMMIT');

      // Update metrics
      this.metrics.eventsIndexed += batchSize;
      this.metrics.batchesProcessed++;

      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1_000_000;

      this.metrics.totalLatency += latencyMs;
      this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latencyMs);

      span.setAttribute('batch.latency_ms', latencyMs);
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();

      console.log(`Indexed batch of ${batchSize} events in ${latencyMs.toFixed(2)}ms`);
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');

      this.metrics.indexErrors += batchSize;

      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.end();

      console.error('Error processing batch:', error);

      // Re-add events to batch for retry
      this.eventBatch.unshift(...batch);
    } finally {
      client.release();
    }
  }

  /**
   * Get indexer metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatency: this.metrics.batchesProcessed > 0
        ? this.metrics.totalLatency / this.metrics.batchesProcessed
        : 0,
      running: this.running,
      connected: this.connected,
      batchSize: this.eventBatch.length
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (!this.connected) {
        return { healthy: false, reason: 'Not connected' };
      }

      // Check PostgreSQL connection
      const client = await this.pgPool.connect();
      await client.query('SELECT 1');
      client.release();

      // Check if consumer is running
      if (!this.running) {
        return { healthy: false, reason: 'Consumer not running' };
      }

      return { healthy: true };
    } catch (error) {
      return { healthy: false, reason: error.message };
    }
  }
}

// Singleton instance
let eventIndexerInstance = null;

/**
 * Get or create Event Indexer instance
 */
export function getEventIndexer(config) {
  if (!eventIndexerInstance) {
    eventIndexerInstance = new EventIndexer(config);
  }
  return eventIndexerInstance;
}

export default EventIndexer;
