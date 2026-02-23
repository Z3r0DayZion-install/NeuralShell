/**
 * Integration tests for Decision Intelligence Engine with autonomous systems
 * 
 * Tests that self-healing, auto-scaler, and anomaly detector properly
 * emit Decision_Events when making autonomous decisions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SelfHealingOrchestrator } from '../../src/router/selfHealing.js';
import { AutoScaler } from '../../src/router/autoScaler.js';
import { AnomalyDetector } from '../../src/router/anomalyDetector.js';
import { getDecisionEngine } from '../../src/intelligence/decisionEngine.js';

describe('Decision Intelligence Engine Integration', () => {
  let decisionEngine;

  beforeEach(async () => {
    decisionEngine = getDecisionEngine();
    
    // Mock the recordDecision method to avoid Kafka dependency
    vi.spyOn(decisionEngine, 'recordDecision').mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Self-Healing Integration', () => {
    it('should emit Decision_Event when healing succeeds', async () => {
      const orchestrator = new SelfHealingOrchestrator({
        decisionEngineEnabled: true
      });

      // Register a simple healing strategy
      orchestrator.registerStrategy('test-strategy', {
        handler: async () => ({ success: true }),
        condition: (issue) => issue.type === 'test-issue',
        priority: 5
      });

      // Trigger healing
      const result = await orchestrator.heal({
        type: 'test-issue',
        details: 'Test issue for healing'
      });

      expect(result.healed).toBe(true);
      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          system_component: 'self-healing',
          decision_type: 'healing',
          context: expect.objectContaining({
            trigger: 'issue_detected'
          }),
          outcome: expect.objectContaining({
            status: 'success'
          })
        })
      );
    });

    it('should emit Decision_Event when healing fails', async () => {
      const orchestrator = new SelfHealingOrchestrator({
        decisionEngineEnabled: true
      });

      // No strategies registered - healing will fail
      const result = await orchestrator.heal({
        type: 'test-issue',
        details: 'Test issue with no strategy'
      });

      expect(result.healed).toBe(false);
      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          system_component: 'self-healing',
          decision_type: 'healing',
          outcome: expect.objectContaining({
            status: 'failure'
          })
        })
      );
    });

    it('should emit Decision_Event when cooldown prevents healing', async () => {
      const orchestrator = new SelfHealingOrchestrator({
        decisionEngineEnabled: true,
        cooldownMs: 10000
      });

      orchestrator.registerStrategy('test-strategy', {
        handler: async () => ({ success: true }),
        condition: (issue) => issue.type === 'test-issue',
        priority: 5
      });

      // First healing
      await orchestrator.heal({ type: 'test-issue' });
      
      // Second healing (should be prevented by cooldown)
      const result = await orchestrator.heal({ type: 'test-issue' });

      expect(result.healed).toBe(false);
      expect(result.reason).toBe('cooldown_active');
      
      // Should have recorded 2 decision events
      expect(decisionEngine.recordDecision).toHaveBeenCalledTimes(2);
    });
  });

  describe('Auto-Scaler Integration', () => {
    it('should emit Decision_Event when scaling up', async () => {
      const scaler = new AutoScaler({
        decisionEngineEnabled: true,
        minInstances: 2,
        maxInstances: 10
      });

      const decision = {
        action: 'scale_up',
        reason: 'high_resource_usage',
        target: 3,
        metrics: {
          cpuLoad: 85,
          memoryLoad: 75,
          requestRate: 1000,
          avgLatency: 200
        }
      };

      await scaler.executeScaling(decision);

      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          system_component: 'auto-scaler',
          decision_type: 'scaling',
          context: expect.objectContaining({
            trigger: 'high_resource_usage',
            metrics: expect.objectContaining({
              cpu_load: 85,
              memory_load: 75
            })
          }),
          action_taken: expect.objectContaining({
            type: 'scale_up'
          }),
          outcome: expect.objectContaining({
            status: 'success'
          })
        })
      );
    });

    it('should emit Decision_Event when scaling down', async () => {
      const scaler = new AutoScaler({
        decisionEngineEnabled: true,
        minInstances: 2,
        maxInstances: 10
      });

      // Set current instances to 5
      scaler.currentInstances = 5;

      const decision = {
        action: 'scale_down',
        reason: 'low_resource_usage',
        target: 4,
        metrics: {
          cpuLoad: 20,
          memoryLoad: 25,
          requestRate: 100,
          avgLatency: 50
        }
      };

      await scaler.executeScaling(decision);

      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          system_component: 'auto-scaler',
          decision_type: 'scaling',
          action_taken: expect.objectContaining({
            type: 'scale_down'
          }),
          outcome: expect.objectContaining({
            status: 'success'
          })
        })
      );
    });

    it('should emit Decision_Event for predictive scaling', async () => {
      const scaler = new AutoScaler({
        decisionEngineEnabled: true,
        minInstances: 2,
        maxInstances: 10
      });

      const decision = {
        action: 'scale_up',
        reason: 'predictive',
        target: 3,
        metrics: {
          cpuLoad: 60,
          memoryLoad: 55
        },
        prediction: {
          trend: '+35.00%'
        }
      };

      await scaler.executeScaling(decision);

      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          system_component: 'auto-scaler',
          decision_type: 'scaling',
          context: expect.objectContaining({
            trigger: 'predictive',
            state: expect.objectContaining({
              is_predictive: true,
              prediction_trend: '+35.00%'
            })
          })
        })
      );
    });
  });

  describe('Anomaly Detector Integration', () => {
    it('should emit Decision_Event when anomaly is detected', async () => {
      const detector = new AnomalyDetector({
        decisionEngineEnabled: true,
        minSamples: 5,
        stdDevThreshold: 2
      });

      // Record normal values
      for (let i = 0; i < 10; i++) {
        detector.record('test_metric', 100 + Math.random() * 10);
      }

      // Record anomalous value
      detector.record('test_metric', 500, { type: 'test' });

      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          system_component: 'anomaly-detector',
          decision_type: 'anomaly_response',
          context: expect.objectContaining({
            trigger: 'metric_threshold_exceeded',
            state: expect.objectContaining({
              metric_name: 'test_metric'
            })
          }),
          action_taken: expect.objectContaining({
            type: 'anomaly_detected',
            parameters: expect.objectContaining({
              detection_method: 'z_score'
            })
          }),
          outcome: expect.objectContaining({
            status: 'success'
          })
        })
      );
    });

    it('should not emit Decision_Event when value is normal', async () => {
      const detector = new AnomalyDetector({
        decisionEngineEnabled: true,
        minSamples: 5,
        stdDevThreshold: 3
      });

      // Record normal values
      for (let i = 0; i < 10; i++) {
        detector.record('test_metric', 100 + Math.random() * 5);
      }

      // recordDecision should not have been called (no anomalies)
      expect(decisionEngine.recordDecision).not.toHaveBeenCalled();
    });

    it('should include metadata in Decision_Event', async () => {
      const detector = new AnomalyDetector({
        decisionEngineEnabled: true,
        minSamples: 5,
        stdDevThreshold: 2
      });

      // Record normal values
      for (let i = 0; i < 10; i++) {
        detector.record('latency_api', 100);
      }

      // Record anomalous value with metadata
      detector.record('latency_api', 500, {
        type: 'latency',
        endpoint: '/api/users'
      });

      expect(decisionEngine.recordDecision).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({
            state: expect.objectContaining({
              metadata: expect.objectContaining({
                type: 'latency',
                endpoint: '/api/users'
              })
            })
          })
        })
      );
    });
  });

  describe('Decision Engine Disabled', () => {
    it('should not emit events when decisionEngineEnabled is false', async () => {
      const orchestrator = new SelfHealingOrchestrator({
        decisionEngineEnabled: false
      });

      orchestrator.registerStrategy('test-strategy', {
        handler: async () => ({ success: true }),
        condition: (issue) => issue.type === 'test-issue',
        priority: 5
      });

      await orchestrator.heal({ type: 'test-issue' });

      expect(decisionEngine.recordDecision).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should not fail healing when decision recording fails', async () => {
      // Make recordDecision throw an error
      decisionEngine.recordDecision.mockRejectedValue(new Error('Kafka connection failed'));

      const orchestrator = new SelfHealingOrchestrator({
        decisionEngineEnabled: true
      });

      orchestrator.registerStrategy('test-strategy', {
        handler: async () => ({ success: true }),
        condition: (issue) => issue.type === 'test-issue',
        priority: 5
      });

      // Healing should still succeed even if decision recording fails
      const result = await orchestrator.heal({ type: 'test-issue' });

      expect(result.healed).toBe(true);
      expect(decisionEngine.recordDecision).toHaveBeenCalled();
    });

    it('should not fail scaling when decision recording fails', async () => {
      decisionEngine.recordDecision.mockRejectedValue(new Error('Kafka connection failed'));

      const scaler = new AutoScaler({
        decisionEngineEnabled: true
      });

      const decision = {
        action: 'scale_up',
        reason: 'high_resource_usage',
        target: 3,
        metrics: { cpuLoad: 85 }
      };

      const result = await scaler.executeScaling(decision);

      expect(result.success).toBe(true);
      expect(decisionEngine.recordDecision).toHaveBeenCalled();
    });
  });
});
