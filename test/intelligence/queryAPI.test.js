/**
 * Tests for Decision Query API
 * 
 * Tests filtering, pagination, and performance requirements.
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { 
  DecisionQueryAPI, 
  DecisionQuery, 
  QueryResult,
  getQueryAPI 
} from '../../src/intelligence/queryAPI.js';
import { EventIndexer } from '../../src/intelligence/eventIndexer.js';
import { getEventStore } from '../../src/intelligence/eventStore.js';

describe('DecisionQuery', () => {
  describe('constructor', () => {
    it('should create query with default values', () => {
      const query = new DecisionQuery();
      
      assert.strictEqual(query.limit, 100);
      assert.strictEqual(query.sortOrder, 'desc');
      assert.strictEqual(query.startTime, undefined);
      assert.strictEqual(query.endTime, undefined);
    });

    it('should create query with custom values', () => {
      const query = new DecisionQuery({
        startTime: new Date('2024-01-01'),
        endTime: new Date('2024-01-31'),
        decisionTypes: ['scaling', 'healing'],
        systemComponents: ['auto-scaler'],
        outcomeStatuses: ['success'],
        minQualityScore: 80,
        maxQualityScore: 100,
        traceId: 'trace-123',
        limit: 50,
        cursor: 'abc123',
        sortOrder: 'asc'
      });

      assert.deepStrictEqual(query.startTime, new Date('2024-01-01'));
      assert.deepStrictEqual(query.endTime, new Date('2024-01-31'));
      assert.deepStrictEqual(query.decisionTypes, ['scaling', 'healing']);
      assert.deepStrictEqual(query.systemComponents, ['auto-scaler']);
      assert.deepStrictEqual(query.outcomeStatuses, ['success']);
      assert.strictEqual(query.minQualityScore, 80);
      assert.strictEqual(query.maxQualityScore, 100);
      assert.strictEqual(query.traceId, 'trace-123');
      assert.strictEqual(query.limit, 50);
      assert.strictEqual(query.cursor, 'abc123');
      assert.strictEqual(query.sortOrder, 'asc');
    });
  });

  describe('validate', () => {
    it('should validate valid query', () => {
      const query = new DecisionQuery({
        limit: 100,
        sortOrder: 'desc'
      });

      const result = query.validate();
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it('should reject limit < 1', () => {
      const query = new DecisionQuery({ limit: 0 });
      const result = query.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('limit')));
    });

    it('should reject limit > 1000', () => {
      const query = new DecisionQuery({ limit: 1001 });
      const result = query.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('limit')));
    });

    it('should reject invalid sort order', () => {
      const query = new DecisionQuery({ sortOrder: 'invalid' });
      const result = query.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('sortOrder')));
    });

    it('should reject startTime after endTime', () => {
      const query = new DecisionQuery({
        startTime: new Date('2024-01-31'),
        endTime: new Date('2024-01-01')
      });
      const result = query.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('startTime')));
    });

    it('should reject invalid quality score range', () => {
      const query = new DecisionQuery({
        minQualityScore: -1
      });
      const result = query.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('minQualityScore')));
    });

    it('should reject minQualityScore > maxQualityScore', () => {
      const query = new DecisionQuery({
        minQualityScore: 90,
        maxQualityScore: 80
      });
      const result = query.validate();
      
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('minQualityScore')));
    });
  });
});

describe('QueryResult', () => {
  it('should create result with metadata', () => {
    const events = [{ event_id: '1' }, { event_id: '2' }];
    const result = new QueryResult(events, true, 'cursor123');

    assert.strictEqual(result.events, events);
    assert.strictEqual(result.count, 2);
    assert.strictEqual(result.hasMore, true);
    assert.strictEqual(result.nextCursor, 'cursor123');
  });
});

describe('DecisionQueryAPI', () => {
  let queryAPI;
  let eventStore;
  let eventIndexer;

  before(async () => {
    // Initialize components
    eventStore = getEventStore();
    await eventStore.connect();

    eventIndexer = new EventIndexer();
    await eventIndexer.connect();
    await eventIndexer.start();

    queryAPI = new DecisionQueryAPI();
    await queryAPI.connect();

    // Wait for indexer to catch up
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  after(async () => {
    await eventIndexer.stop();
    await eventIndexer.disconnect();
    await eventStore.disconnect();
    await queryAPI.disconnect();
  });

  beforeEach(async () => {
    // Clear existing events
    const client = await queryAPI.pgPool.connect();
    try {
      await client.query('DELETE FROM decision_event_indexes');
    } finally {
      client.release();
    }
  });

  describe('connect', () => {
    it('should connect to PostgreSQL', async () => {
      const api = new DecisionQueryAPI();
      await api.connect();
      
      assert.strictEqual(api.connected, true);
      
      await api.disconnect();
    });

    it('should not reconnect if already connected', async () => {
      const api = new DecisionQueryAPI();
      await api.connect();
      await api.connect(); // Should not throw
      
      assert.strictEqual(api.connected, true);
      
      await api.disconnect();
    });
  });

  describe('queryDecisions', () => {
    beforeEach(async () => {
      // Insert test events
      const testEvents = [
        {
          event_id: 'event-1',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          outcome_status: 'success',
          trace_id: 'trace-1',
          span_id: 'span-1',
          quality_score: 85,
          event_data: {
            event_id: 'event-1',
            timestamp: new Date('2024-01-01T10:00:00Z').getTime() * 1000,
            decision_type: 'scaling',
            system_component: 'auto-scaler',
            context: { trigger: 'cpu_high', metrics: {}, state: {} },
            action_taken: { type: 'scale_up', parameters: {} },
            outcome: { status: 'success', duration_ms: 100, impact: {} },
            trace_id: 'trace-1',
            span_id: 'span-1',
            quality_score: 85
          }
        },
        {
          event_id: 'event-2',
          timestamp: new Date('2024-01-01T11:00:00Z'),
          decision_type: 'healing',
          system_component: 'self-healing',
          outcome_status: 'success',
          trace_id: 'trace-2',
          span_id: 'span-2',
          quality_score: 90,
          event_data: {
            event_id: 'event-2',
            timestamp: new Date('2024-01-01T11:00:00Z').getTime() * 1000,
            decision_type: 'healing',
            system_component: 'self-healing',
            context: { trigger: 'service_down', metrics: {}, state: {} },
            action_taken: { type: 'restart', parameters: {} },
            outcome: { status: 'success', duration_ms: 200, impact: {} },
            trace_id: 'trace-2',
            span_id: 'span-2',
            quality_score: 90
          }
        },
        {
          event_id: 'event-3',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          outcome_status: 'failure',
          trace_id: 'trace-3',
          span_id: 'span-3',
          quality_score: 40,
          event_data: {
            event_id: 'event-3',
            timestamp: new Date('2024-01-01T12:00:00Z').getTime() * 1000,
            decision_type: 'scaling',
            system_component: 'auto-scaler',
            context: { trigger: 'cpu_high', metrics: {}, state: {} },
            action_taken: { type: 'scale_up', parameters: {} },
            outcome: { status: 'failure', duration_ms: 50, impact: {} },
            trace_id: 'trace-3',
            span_id: 'span-3',
            quality_score: 40
          }
        }
      ];

      const client = await queryAPI.pgPool.connect();
      try {
        for (const event of testEvents) {
          await client.query(
            `INSERT INTO decision_event_indexes 
             (event_id, timestamp, decision_type, system_component, outcome_status, trace_id, span_id, quality_score, event_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              event.event_id,
              event.timestamp,
              event.decision_type,
              event.system_component,
              event.outcome_status,
              event.trace_id,
              event.span_id,
              event.quality_score,
              JSON.stringify(event.event_data)
            ]
          );
        }
      } finally {
        client.release();
      }
    });

    it('should query all events with no filters', async () => {
      const query = new DecisionQuery({ limit: 100 });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 3);
      assert.strictEqual(result.hasMore, false);
      assert.strictEqual(result.nextCursor, null);
    });

    it('should filter by decision type', async () => {
      const query = new DecisionQuery({
        decisionTypes: ['scaling'],
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 2);
      assert.ok(result.events.every(e => e.decision_type === 'scaling'));
    });

    it('should filter by system component', async () => {
      const query = new DecisionQuery({
        systemComponents: ['self-healing'],
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.events[0].system_component, 'self-healing');
    });

    it('should filter by outcome status', async () => {
      const query = new DecisionQuery({
        outcomeStatuses: ['success'],
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 2);
      assert.ok(result.events.every(e => e.outcome.status === 'success'));
    });

    it('should filter by time range', async () => {
      const query = new DecisionQuery({
        startTime: new Date('2024-01-01T10:30:00Z'),
        endTime: new Date('2024-01-01T11:30:00Z'),
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.events[0].event_id, 'event-2');
    });

    it('should filter by quality score range', async () => {
      const query = new DecisionQuery({
        minQualityScore: 80,
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 2);
      assert.ok(result.events.every(e => e.quality_score >= 80));
    });

    it('should filter by trace ID', async () => {
      const query = new DecisionQuery({
        traceId: 'trace-2',
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.events[0].trace_id, 'trace-2');
    });

    it('should combine multiple filters', async () => {
      const query = new DecisionQuery({
        decisionTypes: ['scaling'],
        outcomeStatuses: ['success'],
        minQualityScore: 80,
        limit: 100
      });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 1);
      assert.strictEqual(result.events[0].event_id, 'event-1');
    });

    it('should support pagination with limit', async () => {
      const query = new DecisionQuery({ limit: 2 });
      const result = await queryAPI.queryDecisions(query);

      assert.strictEqual(result.count, 2);
      assert.strictEqual(result.hasMore, true);
      assert.ok(result.nextCursor);
    });

    it('should support cursor-based pagination', async () => {
      // First page
      const query1 = new DecisionQuery({ limit: 2 });
      const result1 = await queryAPI.queryDecisions(query1);

      assert.strictEqual(result1.count, 2);
      assert.strictEqual(result1.hasMore, true);

      // Second page
      const query2 = new DecisionQuery({
        limit: 2,
        cursor: result1.nextCursor
      });
      const result2 = await queryAPI.queryDecisions(query2);

      assert.strictEqual(result2.count, 1);
      assert.strictEqual(result2.hasMore, false);

      // Verify no overlap
      const ids1 = result1.events.map(e => e.event_id);
      const ids2 = result2.events.map(e => e.event_id);
      const overlap = ids1.filter(id => ids2.includes(id));
      assert.strictEqual(overlap.length, 0);
    });

    it('should sort in descending order by default', async () => {
      const query = new DecisionQuery({ limit: 100 });
      const result = await queryAPI.queryDecisions(query);

      // Should be ordered: event-3, event-2, event-1
      assert.strictEqual(result.events[0].event_id, 'event-3');
      assert.strictEqual(result.events[1].event_id, 'event-2');
      assert.strictEqual(result.events[2].event_id, 'event-1');
    });

    it('should sort in ascending order when specified', async () => {
      const query = new DecisionQuery({ 
        limit: 100,
        sortOrder: 'asc'
      });
      const result = await queryAPI.queryDecisions(query);

      // Should be ordered: event-1, event-2, event-3
      assert.strictEqual(result.events[0].event_id, 'event-1');
      assert.strictEqual(result.events[1].event_id, 'event-2');
      assert.strictEqual(result.events[2].event_id, 'event-3');
    });

    it('should complete query within 500ms', async () => {
      const startTime = Date.now();
      
      const query = new DecisionQuery({ limit: 100 });
      await queryAPI.queryDecisions(query);
      
      const duration = Date.now() - startTime;
      
      // Should be well under 500ms for small dataset
      assert.ok(duration < 500, `Query took ${duration}ms, expected < 500ms`);
    });

    it('should reject invalid query', async () => {
      const query = new DecisionQuery({ limit: 0 });
      
      await assert.rejects(
        async () => await queryAPI.queryDecisions(query),
        /Invalid query/
      );
    });
  });

  describe('cursor encoding/decoding', () => {
    it('should encode and decode cursor correctly', () => {
      const timestamp = 1704110400000000; // microseconds
      const eventId = 'event-123';

      const cursor = queryAPI.encodeCursor(timestamp, eventId);
      const decoded = queryAPI.decodeCursor(cursor);

      assert.strictEqual(decoded.timestamp, timestamp);
      assert.strictEqual(decoded.eventId, eventId);
    });

    it('should reject invalid cursor', () => {
      assert.throws(
        () => queryAPI.decodeCursor('invalid-cursor'),
        /Invalid cursor/
      );
    });
  });

  describe('getMetrics', () => {
    it('should return query metrics', async () => {
      const query = new DecisionQuery({ limit: 100 });
      await queryAPI.queryDecisions(query);

      const metrics = queryAPI.getMetrics();

      assert.ok(metrics.queriesExecuted > 0);
      assert.ok(metrics.totalLatency > 0);
      assert.ok(metrics.avgLatency > 0);
      assert.strictEqual(metrics.connected, true);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when connected', async () => {
      const health = await queryAPI.healthCheck();
      
      assert.strictEqual(health.healthy, true);
    });

    it('should return unhealthy when not connected', async () => {
      const api = new DecisionQueryAPI();
      const health = await api.healthCheck();
      
      assert.strictEqual(health.healthy, false);
      assert.ok(health.reason);
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const api1 = getQueryAPI();
      const api2 = getQueryAPI();
      
      assert.strictEqual(api1, api2);
    });
  });
});
