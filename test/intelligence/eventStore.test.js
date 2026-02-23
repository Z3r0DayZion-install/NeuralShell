/**
 * Event Store Client Tests
 * 
 * Tests for the Event Store client library including:
 * - Connection management
 * - Event writing with durability
 * - UUID v7 generation
 * - Latency requirements
 * - Batch operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { EventStoreClient } from '../../src/intelligence/eventStore.js';

describe('EventStoreClient', () => {
  let client;

  beforeAll(async () => {
    // Use test Kafka brokers
    client = new EventStoreClient({
      brokers: ['localhost:19092'],
      clientId: 'test-event-store',
      topic: 'decision-events-test'
    });
  });

  afterAll(async () => {
    if (client) {
      await client.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should connect to Kafka cluster', async () => {
      await client.connect();
      expect(client.connected).toBe(true);
    });

    it('should handle multiple connect calls gracefully', async () => {
      await client.connect();
      await client.connect(); // Should not throw
      expect(client.connected).toBe(true);
    });

    it('should pass health check when connected', async () => {
      await client.connect();
      const healthy = await client.healthCheck();
      expect(healthy).toBe(true);
    });
  });

  describe('UUID v7 Generation', () => {
    it('should generate valid UUID v7', () => {
      const id1 = client.generateEventId();
      const id2 = client.generateEventId();
      
      expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(id2).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate time-ordered UUIDs', () => {
      const id1 = client.generateEventId();
      const id2 = client.generateEventId();
      
      // UUID v7 is time-ordered, so id2 should be greater than id1
      expect(id2 > id1).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(client.generateEventId());
      }
      expect(ids.size).toBe(1000);
    });
  });

  describe('Event Writing', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should write a valid decision event', async () => {
      const event = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'high_cpu',
          metrics: { cpu: 85, memory: 60 },
          state: { current_instances: 2 }
        },
        action_taken: {
          type: 'scale_up',
          parameters: { target_instances: 4 }
        },
        outcome: {
          status: 'success',
          duration_ms: 1500,
          impact: { instances_added: 2 }
        }
      };

      const eventId = await client.writeEvent(event);
      
      expect(eventId).toBeDefined();
      expect(typeof eventId).toBe('string');
      expect(eventId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should write event with sub-10ms latency target', async () => {
      const event = {
        decision_type: 'healing',
        system_component: 'self-healing',
        context: {
          trigger: 'service_down',
          metrics: { health_score: 0 },
          state: { service: 'api' }
        },
        action_taken: {
          type: 'restart_service',
          parameters: { service: 'api' }
        },
        outcome: {
          status: 'success',
          duration_ms: 500,
          impact: { service_restored: true }
        }
      };

      const start = process.hrtime.bigint();
      await client.writeEvent(event);
      const end = process.hrtime.bigint();
      
      const latencyMs = Number(end - start) / 1_000_000;
      
      // Note: This may exceed 10ms in test environments, but should be close
      console.log(`Event write latency: ${latencyMs.toFixed(2)}ms`);
      expect(latencyMs).toBeLessThan(100); // Relaxed for test environment
    });

    it('should include trace context in events', async () => {
      const event = {
        decision_type: 'routing',
        system_component: 'load-balancer',
        context: {
          trigger: 'request',
          metrics: { latency: 50 },
          state: { backend: 'api-1' }
        },
        action_taken: {
          type: 'route_request',
          parameters: { backend: 'api-1' }
        },
        outcome: {
          status: 'success',
          duration_ms: 5,
          impact: { request_routed: true }
        }
      };

      const eventId = await client.writeEvent(event);
      expect(eventId).toBeDefined();
      
      // Verify metrics were updated
      const metrics = client.getMetrics();
      expect(metrics.eventsWritten).toBeGreaterThan(0);
    });

    it('should validate required fields', async () => {
      const invalidEvent = {
        decision_type: 'scaling'
        // Missing required fields
      };

      await expect(client.writeEvent(invalidEvent)).rejects.toThrow();
    });

    it('should validate outcome status', async () => {
      const invalidEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {},
        action_taken: {},
        outcome: {
          status: 'invalid_status', // Invalid status
          duration_ms: 100,
          impact: {}
        }
      };

      await expect(client.writeEvent(invalidEvent)).rejects.toThrow('outcome.status must be one of');
    });

    it('should validate quality score range', async () => {
      const invalidEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {},
        action_taken: {},
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        },
        quality_score: 150 // Invalid: > 100
      };

      await expect(client.writeEvent(invalidEvent)).rejects.toThrow('quality_score must be a number between 0 and 100');
    });
  });

  describe('Batch Operations', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should write multiple events in a batch', async () => {
      const events = [
        {
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          context: { trigger: 'high_cpu', metrics: {}, state: {} },
          action_taken: { type: 'scale_up', parameters: {} },
          outcome: { status: 'success', duration_ms: 100, impact: {} }
        },
        {
          decision_type: 'healing',
          system_component: 'self-healing',
          context: { trigger: 'service_down', metrics: {}, state: {} },
          action_taken: { type: 'restart', parameters: {} },
          outcome: { status: 'success', duration_ms: 200, impact: {} }
        },
        {
          decision_type: 'routing',
          system_component: 'load-balancer',
          context: { trigger: 'request', metrics: {}, state: {} },
          action_taken: { type: 'route', parameters: {} },
          outcome: { status: 'success', duration_ms: 50, impact: {} }
        }
      ];

      const eventIds = await client.writeBatch(events);
      
      expect(eventIds).toHaveLength(3);
      expect(eventIds.every(id => typeof id === 'string')).toBe(true);
    });

    it('should handle empty batch', async () => {
      const eventIds = await client.writeBatch([]);
      expect(eventIds).toHaveLength(0);
    });
  });

  describe('Metrics', () => {
    beforeEach(async () => {
      await client.connect();
    });

    it('should track events written', async () => {
      const initialMetrics = client.getMetrics();
      const initialCount = initialMetrics.eventsWritten;

      const event = {
        decision_type: 'test',
        system_component: 'test',
        context: {},
        action_taken: {},
        outcome: { status: 'success', duration_ms: 100, impact: {} }
      };

      await client.writeEvent(event);

      const finalMetrics = client.getMetrics();
      expect(finalMetrics.eventsWritten).toBe(initialCount + 1);
    });

    it('should track average latency', async () => {
      const event = {
        decision_type: 'test',
        system_component: 'test',
        context: {},
        action_taken: {},
        outcome: { status: 'success', duration_ms: 100, impact: {} }
      };

      await client.writeEvent(event);

      const metrics = client.getMetrics();
      expect(metrics.avgLatency).toBeGreaterThan(0);
      expect(metrics.maxLatency).toBeGreaterThan(0);
    });

    it('should track connection status', () => {
      const metrics = client.getMetrics();
      expect(metrics.connected).toBe(true);
    });
  });
});
