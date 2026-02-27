/**
 * Event Indexer Tests
 *
 * Tests for the Kafka consumer that indexes decision events in PostgreSQL.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { EventIndexer, EventIndexerConfig } from '../../src/intelligence/eventIndexer.js';
import { EventStoreClient } from '../../src/intelligence/eventStore.js';
import pg from 'pg';

const { Pool } = pg;

// Test configuration
const TEST_CONFIG = {
  kafkaBrokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:19092'],
  kafkaTopic: 'decision-events-test',
  kafkaGroupId: 'event-indexer-test-group',
  pgHost: process.env.POSTGRES_HOST || 'localhost',
  pgPort: process.env.POSTGRES_PORT || 5432,
  pgDatabase: process.env.POSTGRES_DB || 'neuralshell_metrics',
  pgUser: process.env.POSTGRES_USER || 'neuralshell',
  pgPassword: process.env.POSTGRES_PASSWORD || 'neuralshell_dev_password',
  batchSize: 10,
  batchTimeoutMs: 1000
};

describe('EventIndexer', () => {
  let indexer;
  let eventStore;
  let pgPool;

  before(async () => {
    // Initialize PostgreSQL pool for test queries
    pgPool = new Pool({
      host: TEST_CONFIG.pgHost,
      port: TEST_CONFIG.pgPort,
      database: TEST_CONFIG.pgDatabase,
      user: TEST_CONFIG.pgUser,
      password: TEST_CONFIG.pgPassword
    });

    // Ensure test table exists
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS decision_event_indexes (
        event_id TEXT PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        decision_type TEXT NOT NULL,
        system_component TEXT NOT NULL,
        outcome_status TEXT NOT NULL,
        trace_id TEXT NOT NULL,
        span_id TEXT NOT NULL,
        quality_score DOUBLE PRECISION,
        event_data JSONB NOT NULL,
        indexed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes if they don't exist
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_decision_type_time ON decision_event_indexes (decision_type, timestamp DESC)
    `);
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_component_time ON decision_event_indexes (system_component, timestamp DESC)
    `);
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_outcome_time ON decision_event_indexes (outcome_status, timestamp DESC)
    `);
  });

  after(async () => {
    if (pgPool) {
      await pgPool.end();
    }
  });

  beforeEach(async () => {
    // Clean up test data
    await pgPool.query('DELETE FROM decision_event_indexes');
  });

  describe('Configuration', () => {
    it('should create config with defaults', () => {
      const config = new EventIndexerConfig();

      assert.ok(config.kafka);
      assert.ok(config.postgres);
      assert.strictEqual(config.batchSize, 100);
      assert.strictEqual(config.batchTimeoutMs, 5000);
    });

    it('should create config with custom values', () => {
      const config = new EventIndexerConfig({
        batchSize: 50,
        batchTimeoutMs: 2000
      });

      assert.strictEqual(config.batchSize, 50);
      assert.strictEqual(config.batchTimeoutMs, 2000);
    });
  });

  describe('Connection', () => {
    it('should connect to Kafka and PostgreSQL', async () => {
      indexer = new EventIndexer(TEST_CONFIG);

      await indexer.connect();

      assert.strictEqual(indexer.connected, true);

      await indexer.disconnect();
    });

    it('should handle connection errors gracefully', async () => {
      const badConfig = {
        ...TEST_CONFIG,
        pgHost: 'invalid-host'
      };

      indexer = new EventIndexer(badConfig);

      await assert.rejects(
        async () => await indexer.connect(),
        /Failed to connect Event Indexer/
      );
    });
  });

  describe('Event Indexing', () => {
    beforeEach(async () => {
      indexer = new EventIndexer(TEST_CONFIG);
      await indexer.connect();

      // Initialize event store for writing test events
      eventStore = new EventStoreClient({
        brokers: TEST_CONFIG.kafkaBrokers,
        topic: TEST_CONFIG.kafkaTopic
      });
      await eventStore.connect();
    });

    afterEach(async () => {
      if (indexer) {
        await indexer.disconnect();
      }
      if (eventStore) {
        await eventStore.disconnect();
      }
    });

    it('should index a single event', async () => {
      // Write event to Kafka
      const testEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'cpu_threshold_exceeded',
          metrics: { cpu: 85 },
          state: { instances: 2 }
        },
        action_taken: {
          type: 'scale_up',
          parameters: { target_instances: 3 }
        },
        outcome: {
          status: 'success',
          duration_ms: 1500,
          impact: { instances_added: 1 }
        }
      };

      const eventId = await eventStore.writeEvent(testEvent);

      // Start indexer
      await indexer.start();

      // Wait for event to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stop indexer
      await indexer.stop();

      // Verify event was indexed
      const result = await pgPool.query(
        'SELECT * FROM decision_event_indexes WHERE event_id = $1',
        [eventId]
      );

      assert.strictEqual(result.rows.length, 1);
      assert.strictEqual(result.rows[0].decision_type, 'scaling');
      assert.strictEqual(result.rows[0].system_component, 'auto-scaler');
      assert.strictEqual(result.rows[0].outcome_status, 'success');
    });

    it('should index multiple events in batch', async () => {
      // Write multiple events
      const events = [];
      for (let i = 0; i < 5; i++) {
        events.push({
          decision_type: i % 2 === 0 ? 'scaling' : 'healing',
          system_component: 'auto-scaler',
          context: {
            trigger: 'test',
            metrics: { value: i },
            state: {}
          },
          action_taken: {
            type: 'test_action',
            parameters: {}
          },
          outcome: {
            status: 'success',
            duration_ms: 100,
            impact: {}
          }
        });
      }

      const eventIds = await eventStore.writeBatch(events);

      // Start indexer
      await indexer.start();

      // Wait for events to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Stop indexer
      await indexer.stop();

      // Verify all events were indexed
      const result = await pgPool.query(
        'SELECT COUNT(*) as count FROM decision_event_indexes WHERE event_id = ANY($1)',
        [eventIds]
      );

      assert.strictEqual(parseInt(result.rows[0].count), 5);
    });

    it('should create secondary indexes for efficient querying', async () => {
      // Write events with different types
      const events = [
        {
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          context: { trigger: 'test', metrics: {}, state: {} },
          action_taken: { type: 'scale_up', parameters: {} },
          outcome: { status: 'success', duration_ms: 100, impact: {} }
        },
        {
          decision_type: 'healing',
          system_component: 'self-healing',
          context: { trigger: 'test', metrics: {}, state: {} },
          action_taken: { type: 'restart', parameters: {} },
          outcome: { status: 'failure', duration_ms: 200, impact: {} }
        },
        {
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          context: { trigger: 'test', metrics: {}, state: {} },
          action_taken: { type: 'scale_down', parameters: {} },
          outcome: { status: 'success', duration_ms: 150, impact: {} }
        }
      ];

      await eventStore.writeBatch(events);

      // Start indexer
      await indexer.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await indexer.stop();

      // Query by decision_type
      const scalingResult = await pgPool.query(
        'SELECT COUNT(*) as count FROM decision_event_indexes WHERE decision_type = $1',
        ['scaling']
      );
      assert.strictEqual(parseInt(scalingResult.rows[0].count), 2);

      // Query by component
      const componentResult = await pgPool.query(
        'SELECT COUNT(*) as count FROM decision_event_indexes WHERE system_component = $1',
        ['auto-scaler']
      );
      assert.strictEqual(parseInt(componentResult.rows[0].count), 2);

      // Query by outcome
      const outcomeResult = await pgPool.query(
        'SELECT COUNT(*) as count FROM decision_event_indexes WHERE outcome_status = $1',
        ['success']
      );
      assert.strictEqual(parseInt(outcomeResult.rows[0].count), 2);
    });

    it('should handle duplicate events with ON CONFLICT', async () => {
      const testEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: { trigger: 'test', metrics: {}, state: {} },
        action_taken: { type: 'scale_up', parameters: {} },
        outcome: { status: 'success', duration_ms: 100, impact: {} }
      };

      const eventId = await eventStore.writeEvent(testEvent);

      // Start indexer
      await indexer.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await indexer.stop();

      // Write same event again (simulating duplicate)
      await indexer.start();
      await new Promise(resolve => setTimeout(resolve, 2000));
      await indexer.stop();

      // Verify only one record exists
      const result = await pgPool.query(
        'SELECT COUNT(*) as count FROM decision_event_indexes WHERE event_id = $1',
        [eventId]
      );
      assert.strictEqual(parseInt(result.rows[0].count), 1);
    });
  });

  describe('Metrics', () => {
    it('should track indexing metrics', async () => {
      indexer = new EventIndexer(TEST_CONFIG);
      await indexer.connect();

      const metrics = indexer.getMetrics();

      assert.strictEqual(metrics.eventsConsumed, 0);
      assert.strictEqual(metrics.eventsIndexed, 0);
      assert.strictEqual(metrics.batchesProcessed, 0);
      assert.strictEqual(metrics.connected, true);

      await indexer.disconnect();
    });
  });

  describe('Health Check', () => {
    it('should return healthy when connected and running', async () => {
      indexer = new EventIndexer(TEST_CONFIG);
      await indexer.connect();
      await indexer.start();

      const health = await indexer.healthCheck();

      assert.strictEqual(health.healthy, true);

      await indexer.stop();
      await indexer.disconnect();
    });

    it('should return unhealthy when not connected', async () => {
      indexer = new EventIndexer(TEST_CONFIG);

      const health = await indexer.healthCheck();

      assert.strictEqual(health.healthy, false);
      assert.ok(health.reason);
    });
  });
});
