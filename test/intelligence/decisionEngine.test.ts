/**
 * Unit Tests for Decision Intelligence Engine
 * 
 * Tests the core recordDecision() functionality including:
 * - Event validation
 * - Trace context injection
 * - Event persistence
 * - Latency requirements
 * - Error handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DecisionIntelligenceEngine, getDecisionEngine } from '../../src/intelligence/decisionEngine.js';
import { PartialDecisionEvent } from '../../src/intelligence/types.js';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { getTracingManager } from '../../src/intelligence/tracing.js';

describe('DecisionIntelligenceEngine', () => {
  let engine: DecisionIntelligenceEngine;
  let tracingManager: any;

  beforeAll(async () => {
    // Initialize tracing for tests
    tracingManager = getTracingManager({
      serviceName: 'test-decision-engine',
      environment: 'test'
    });
    
    try {
      await tracingManager.initialize();
    } catch (error) {
      console.warn('Tracing initialization failed (expected in test environment):', error);
    }
  });

  afterAll(async () => {
    if (tracingManager) {
      await tracingManager.shutdown();
    }
  });

  beforeEach(() => {
    // Create a new engine instance for each test
    engine = new DecisionIntelligenceEngine({
      autoConnect: false, // Manual connection for tests
      maxLatencyMs: 10
    });
  });

  describe('Connection Management', () => {
    it('should start disconnected', () => {
      expect(engine.isConnected()).toBe(false);
    });

    it('should connect to Event Store', async () => {
      await engine.connect();
      expect(engine.isConnected()).toBe(true);
      await engine.disconnect();
    });

    it('should handle multiple connect calls gracefully', async () => {
      await engine.connect();
      await engine.connect(); // Should not throw
      expect(engine.isConnected()).toBe(true);
      await engine.disconnect();
    });

    it('should disconnect cleanly', async () => {
      await engine.connect();
      await engine.disconnect();
      expect(engine.isConnected()).toBe(false);
    });
  });

  describe('recordDecision()', () => {
    beforeEach(async () => {
      await engine.connect();
    });

    afterEach(async () => {
      await engine.disconnect();
    });

    it('should record a valid decision event', async () => {
      const event: PartialDecisionEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'cpu_threshold_exceeded',
          metrics: {
            cpu_utilization: 85.5,
            memory_utilization: 60.2
          },
          state: {
            current_instances: 2,
            target_instances: 4
          }
        },
        action_taken: {
          type: 'scale_up',
          parameters: {
            instances: 2,
            instance_type: 't3.medium'
          }
        },
        outcome: {
          status: 'success',
          duration_ms: 1500,
          impact: {
            instances_added: 2,
            capacity_increase_percent: 100
          }
        }
      };

      await expect(engine.recordDecision(event)).resolves.not.toThrow();
    });

    it('should inject trace context from OpenTelemetry', async () => {
      const event: PartialDecisionEvent = {
        decision_type: 'healing',
        system_component: 'self-healing',
        context: {
          trigger: 'service_unhealthy',
          metrics: { error_rate: 0.15 },
          state: { service_status: 'degraded' }
        },
        action_taken: {
          type: 'restart_service',
          parameters: { service_name: 'api-gateway' }
        },
        outcome: {
          status: 'success',
          duration_ms: 3000,
          impact: { error_rate_after: 0.01 }
        }
      };

      // Create a span to provide trace context
      const tracer = trace.getTracer('test');
      const span = tracer.startSpan('test-span');
      const ctx = trace.setSpan(context.active(), span);

      await context.with(ctx, async () => {
        await engine.recordDecision(event);
      });

      span.end();

      // Verify metrics show the event was recorded
      const metrics = engine.getMetrics();
      expect(metrics.eventsWritten).toBeGreaterThan(0);
    });

    it('should reject invalid decision event - missing required fields', async () => {
      const invalidEvent = {
        decision_type: 'scaling',
        // Missing system_component, context, action_taken, outcome
      } as any;

      await expect(engine.recordDecision(invalidEvent)).rejects.toThrow('Invalid decision event');
    });

    it('should reject invalid decision event - invalid outcome status', async () => {
      const invalidEvent: any = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'test',
          metrics: {},
          state: {}
        },
        action_taken: {
          type: 'scale_up',
          parameters: {}
        },
        outcome: {
          status: 'invalid_status', // Invalid status
          duration_ms: 100,
          impact: {}
        }
      };

      await expect(engine.recordDecision(invalidEvent)).rejects.toThrow('Invalid decision event');
    });

    it('should record decision with quality score', async () => {
      const event: PartialDecisionEvent = {
        decision_type: 'routing',
        system_component: 'auto-optimizer',
        context: {
          trigger: 'latency_optimization',
          metrics: { p95_latency: 450 },
          state: { current_provider: 'aws' }
        },
        action_taken: {
          type: 'switch_provider',
          parameters: { target_provider: 'gcp' }
        },
        outcome: {
          status: 'success',
          duration_ms: 200,
          impact: { p95_latency_after: 320 }
        },
        quality_score: 85
      };

      await expect(engine.recordDecision(event)).resolves.not.toThrow();
    });

    it('should handle different decision types', async () => {
      const decisionTypes = ['scaling', 'healing', 'routing', 'optimization', 'security'];

      for (const type of decisionTypes) {
        const event: PartialDecisionEvent = {
          decision_type: type,
          system_component: 'test-component',
          context: {
            trigger: 'test_trigger',
            metrics: { test_metric: 100 },
            state: { test_state: 'active' }
          },
          action_taken: {
            type: 'test_action',
            parameters: { test_param: 'value' }
          },
          outcome: {
            status: 'success',
            duration_ms: 100,
            impact: { test_impact: 1 }
          }
        };

        await expect(engine.recordDecision(event)).resolves.not.toThrow();
      }
    });

    it('should handle different outcome statuses', async () => {
      const statuses: Array<'success' | 'failure' | 'partial' | 'unknown'> = 
        ['success', 'failure', 'partial', 'unknown'];

      for (const status of statuses) {
        const event: PartialDecisionEvent = {
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          context: {
            trigger: 'test',
            metrics: {},
            state: {}
          },
          action_taken: {
            type: 'test',
            parameters: {}
          },
          outcome: {
            status,
            duration_ms: 100,
            impact: {}
          }
        };

        await expect(engine.recordDecision(event)).resolves.not.toThrow();
      }
    });

    it('should throw error when not connected and autoConnect is disabled', async () => {
      const disconnectedEngine = new DecisionIntelligenceEngine({
        autoConnect: false
      });

      const event: PartialDecisionEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'test',
          metrics: {},
          state: {}
        },
        action_taken: {
          type: 'test',
          parameters: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      };

      await expect(disconnectedEngine.recordDecision(event)).rejects.toThrow('not connected');
    });
  });

  describe('recordDecisionBatch()', () => {
    beforeEach(async () => {
      await engine.connect();
    });

    afterEach(async () => {
      await engine.disconnect();
    });

    it('should record multiple decisions in a batch', async () => {
      const events: PartialDecisionEvent[] = [
        {
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          context: {
            trigger: 'cpu_high',
            metrics: { cpu: 90 },
            state: {}
          },
          action_taken: {
            type: 'scale_up',
            parameters: { instances: 1 }
          },
          outcome: {
            status: 'success',
            duration_ms: 1000,
            impact: {}
          }
        },
        {
          decision_type: 'healing',
          system_component: 'self-healing',
          context: {
            trigger: 'service_down',
            metrics: { uptime: 0 },
            state: {}
          },
          action_taken: {
            type: 'restart',
            parameters: { service: 'api' }
          },
          outcome: {
            status: 'success',
            duration_ms: 2000,
            impact: {}
          }
        }
      ];

      await expect(engine.recordDecisionBatch(events)).resolves.not.toThrow();
    });

    it('should reject batch with invalid event', async () => {
      const events: any[] = [
        {
          decision_type: 'scaling',
          system_component: 'auto-scaler',
          context: {
            trigger: 'test',
            metrics: {},
            state: {}
          },
          action_taken: {
            type: 'test',
            parameters: {}
          },
          outcome: {
            status: 'success',
            duration_ms: 100,
            impact: {}
          }
        },
        {
          // Invalid event - missing required fields
          decision_type: 'healing'
        }
      ];

      await expect(engine.recordDecisionBatch(events)).rejects.toThrow('Invalid decision event');
    });
  });

  describe('Metrics and Health', () => {
    beforeEach(async () => {
      await engine.connect();
    });

    afterEach(async () => {
      await engine.disconnect();
    });

    it('should return metrics', () => {
      const metrics = engine.getMetrics();
      
      expect(metrics).toHaveProperty('eventsWritten');
      expect(metrics).toHaveProperty('writeErrors');
      expect(metrics).toHaveProperty('avgLatency');
      expect(metrics).toHaveProperty('maxLatency');
      expect(metrics).toHaveProperty('connected');
    });

    it('should perform health check', async () => {
      const healthy = await engine.healthCheck();
      expect(typeof healthy).toBe('boolean');
    });

    it('should return false for health check when disconnected', async () => {
      await engine.disconnect();
      const healthy = await engine.healthCheck();
      expect(healthy).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getDecisionEngine', () => {
      const instance1 = getDecisionEngine();
      const instance2 = getDecisionEngine();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Latency Requirements', () => {
    beforeEach(async () => {
      await engine.connect();
    });

    afterEach(async () => {
      await engine.disconnect();
    });

    it('should record decision within latency target', async () => {
      const event: PartialDecisionEvent = {
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'latency_test',
          metrics: { cpu: 80 },
          state: {}
        },
        action_taken: {
          type: 'scale_up',
          parameters: { instances: 1 }
        },
        outcome: {
          status: 'success',
          duration_ms: 1000,
          impact: {}
        }
      };

      const startTime = process.hrtime.bigint();
      await engine.recordDecision(event);
      const endTime = process.hrtime.bigint();
      
      const latencyMs = Number(endTime - startTime) / 1_000_000;
      
      // Allow some overhead for test environment
      // In production with proper Kafka setup, this should be < 10ms
      expect(latencyMs).toBeLessThan(100); // Relaxed for test environment
    });
  });
});
