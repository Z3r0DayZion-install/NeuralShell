/**
 * Unit Tests for Quality Scoring Module
 * 
 * Tests the quality score calculation algorithm including:
 * - Score bounds (0-100)
 * - Component scoring (effectiveness, response time, cost)
 * - Weighted combination
 * - Edge cases and boundary conditions
 * 
 * Requirements: 4.1, 4.2
 */

import { describe, it, expect } from 'vitest';
import {
  calculateQualityScore,
  calculateQualityScoreWithBreakdown,
  isLowQualityScore,
  explainQualityScore,
  type QualityScoringConfig
} from '../../src/intelligence/qualityScoring.js';
import { DecisionEvent } from '../../src/intelligence/types.js';

/**
 * Helper function to create a test decision event
 */
function createTestEvent(overrides: Partial<DecisionEvent> = {}): DecisionEvent {
  return {
    event_id: 'test-event-id',
    timestamp: Date.now() * 1000,
    decision_type: 'scaling',
    system_component: 'auto-scaler',
    context: {
      trigger: 'cpu_threshold_exceeded',
      metrics: {},
      state: {}
    },
    action_taken: {
      type: 'scale_up',
      parameters: { instances: 3 }
    },
    outcome: {
      status: 'success',
      duration_ms: 100,
      impact: {}
    },
    trace_id: 'test-trace-id',
    span_id: 'test-span-id',
    ...overrides
  };
}

describe('Quality Scoring Module', () => {
  describe('calculateQualityScore', () => {
    it('should return a score between 0 and 100', () => {
      const event = createTestEvent();
      const score = calculateQualityScore(event);
      
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return high score for successful fast decision', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 50,
          impact: { problem_resolved: 1 }
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThan(85);
    });

    it('should return low score for failed slow decision', () => {
      const event = createTestEvent({
        outcome: {
          status: 'failure',
          duration_ms: 5000,
          impact: {}
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeLessThan(40);
    });

    it('should return moderate score for partial success', () => {
      const event = createTestEvent({
        outcome: {
          status: 'partial',
          duration_ms: 200,
          impact: {}
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThan(40);
      expect(score).toBeLessThan(80);
    });

    it('should handle unknown outcome status', () => {
      const event = createTestEvent({
        outcome: {
          status: 'unknown',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should consider error rate reduction in effectiveness', () => {
      const eventWithReduction = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: { error_rate_reduction: 0.5 }
        }
      });
      
      const eventWithoutReduction = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const scoreWith = calculateQualityScore(eventWithReduction);
      const scoreWithout = calculateQualityScore(eventWithoutReduction);
      
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should consider latency improvement in effectiveness', () => {
      const eventWithImprovement = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: { latency_improvement: 0.3 }
        }
      });
      
      const eventWithoutImprovement = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const scoreWith = calculateQualityScore(eventWithImprovement);
      const scoreWithout = calculateQualityScore(eventWithoutImprovement);
      
      expect(scoreWith).toBeGreaterThan(scoreWithout);
    });

    it('should penalize slow response times', () => {
      const fastEvent = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 50,
          impact: {}
        }
      });
      
      const slowEvent = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 3000,
          impact: {}
        }
      });
      
      const fastScore = calculateQualityScore(fastEvent);
      const slowScore = calculateQualityScore(slowEvent);
      
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    it('should consider cost impact when available', () => {
      const lowCostEvent = createTestEvent({
        context: {
          trigger: 'test',
          metrics: { cost: 0.0005 },
          state: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const highCostEvent = createTestEvent({
        context: {
          trigger: 'test',
          metrics: { cost: 0.05 },
          state: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const lowCostScore = calculateQualityScore(lowCostEvent);
      const highCostScore = calculateQualityScore(highCostEvent);
      
      expect(lowCostScore).toBeGreaterThan(highCostScore);
    });

    it('should handle missing cost data gracefully', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should respect custom configuration weights', () => {
      const event = createTestEvent({
        outcome: {
          status: 'failure',
          duration_ms: 50,
          impact: {}
        }
      });
      
      // High weight on response time (which is good)
      const config1: QualityScoringConfig = {
        effectivenessWeight: 0.1,
        responseTimeWeight: 0.8,
        costImpactWeight: 0.1
      };
      
      // High weight on effectiveness (which is bad)
      const config2: QualityScoringConfig = {
        effectivenessWeight: 0.8,
        responseTimeWeight: 0.1,
        costImpactWeight: 0.1
      };
      
      const score1 = calculateQualityScore(event, config1);
      const score2 = calculateQualityScore(event, config2);
      
      expect(score1).toBeGreaterThan(score2);
    });

    it('should respect custom response time thresholds', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 500,
          impact: {}
        }
      });
      
      const strictConfig: QualityScoringConfig = {
        targetResponseTimeMs: 100,
        maxResponseTimeMs: 1000
      };
      
      const lenientConfig: QualityScoringConfig = {
        targetResponseTimeMs: 1000,
        maxResponseTimeMs: 5000
      };
      
      const strictScore = calculateQualityScore(event, strictConfig);
      const lenientScore = calculateQualityScore(event, lenientConfig);
      
      expect(lenientScore).toBeGreaterThan(strictScore);
    });

    it('should handle extreme duration values', () => {
      const veryFastEvent = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 1,
          impact: {}
        }
      });
      
      const verySlowEvent = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100000,
          impact: {}
        }
      });
      
      const fastScore = calculateQualityScore(veryFastEvent);
      const slowScore = calculateQualityScore(verySlowEvent);
      
      expect(fastScore).toBeGreaterThanOrEqual(0);
      expect(fastScore).toBeLessThanOrEqual(100);
      expect(slowScore).toBeGreaterThanOrEqual(0);
      expect(slowScore).toBeLessThanOrEqual(100);
      expect(fastScore).toBeGreaterThan(slowScore);
    });

    it('should handle zero duration', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 0,
          impact: {}
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle negative impact metrics', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {
            error_rate_reduction: -0.2,
            latency_improvement: -0.1
          }
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateQualityScoreWithBreakdown', () => {
    it('should return breakdown with all components', () => {
      const event = createTestEvent();
      const breakdown = calculateQualityScoreWithBreakdown(event);
      
      expect(breakdown).toHaveProperty('overall');
      expect(breakdown).toHaveProperty('effectiveness');
      expect(breakdown).toHaveProperty('responseTime');
      expect(breakdown).toHaveProperty('costImpact');
      expect(breakdown).toHaveProperty('weights');
    });

    it('should have all component scores between 0 and 100', () => {
      const event = createTestEvent();
      const breakdown = calculateQualityScoreWithBreakdown(event);
      
      expect(breakdown.overall).toBeGreaterThanOrEqual(0);
      expect(breakdown.overall).toBeLessThanOrEqual(100);
      expect(breakdown.effectiveness).toBeGreaterThanOrEqual(0);
      expect(breakdown.effectiveness).toBeLessThanOrEqual(100);
      expect(breakdown.responseTime).toBeGreaterThanOrEqual(0);
      expect(breakdown.responseTime).toBeLessThanOrEqual(100);
      expect(breakdown.costImpact).toBeGreaterThanOrEqual(0);
      expect(breakdown.costImpact).toBeLessThanOrEqual(100);
    });

    it('should have weights that sum to 1', () => {
      const event = createTestEvent();
      const breakdown = calculateQualityScoreWithBreakdown(event);
      
      const weightSum = 
        breakdown.weights.effectiveness +
        breakdown.weights.responseTime +
        breakdown.weights.costImpact;
      
      expect(weightSum).toBeCloseTo(1.0, 5);
    });

    it('should match overall score from calculateQualityScore', () => {
      const event = createTestEvent();
      const score = calculateQualityScore(event);
      const breakdown = calculateQualityScoreWithBreakdown(event);
      
      expect(breakdown.overall).toBe(score);
    });

    it('should show high effectiveness for successful decisions', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: { problem_resolved: 1 }
        }
      });
      
      const breakdown = calculateQualityScoreWithBreakdown(event);
      expect(breakdown.effectiveness).toBeGreaterThan(90);
    });

    it('should show low effectiveness for failed decisions', () => {
      const event = createTestEvent({
        outcome: {
          status: 'failure',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const breakdown = calculateQualityScoreWithBreakdown(event);
      expect(breakdown.effectiveness).toBeLessThan(40);
    });

    it('should show high response time score for fast decisions', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 50,
          impact: {}
        }
      });
      
      const breakdown = calculateQualityScoreWithBreakdown(event);
      expect(breakdown.responseTime).toBe(100);
    });

    it('should show low response time score for slow decisions', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 5000,
          impact: {}
        }
      });
      
      const breakdown = calculateQualityScoreWithBreakdown(event);
      expect(breakdown.responseTime).toBe(0);
    });
  });

  describe('isLowQualityScore', () => {
    it('should return true for scores below 60', () => {
      expect(isLowQualityScore(59)).toBe(true);
      expect(isLowQualityScore(30)).toBe(true);
      expect(isLowQualityScore(0)).toBe(true);
    });

    it('should return false for scores at or above 60', () => {
      expect(isLowQualityScore(60)).toBe(false);
      expect(isLowQualityScore(75)).toBe(false);
      expect(isLowQualityScore(100)).toBe(false);
    });

    it('should respect custom threshold', () => {
      expect(isLowQualityScore(70, 80)).toBe(true);
      expect(isLowQualityScore(85, 80)).toBe(false);
    });
  });

  describe('explainQualityScore', () => {
    it('should provide explanation for excellent scores', () => {
      const breakdown = {
        overall: 90,
        effectiveness: 95,
        responseTime: 90,
        costImpact: 85,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('Excellent');
    });

    it('should provide explanation for good scores', () => {
      const breakdown = {
        overall: 70,
        effectiveness: 75,
        responseTime: 70,
        costImpact: 65,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('Good');
    });

    it('should provide explanation for moderate scores', () => {
      const breakdown = {
        overall: 50,
        effectiveness: 55,
        responseTime: 50,
        costImpact: 45,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('Moderate');
    });

    it('should provide explanation for poor scores', () => {
      const breakdown = {
        overall: 30,
        effectiveness: 25,
        responseTime: 35,
        costImpact: 30,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('Poor');
    });

    it('should identify low effectiveness issues', () => {
      const breakdown = {
        overall: 50,
        effectiveness: 40,
        responseTime: 80,
        costImpact: 70,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('effectiveness');
      expect(explanation).toContain('did not achieve desired outcomes');
    });

    it('should identify low response time issues', () => {
      const breakdown = {
        overall: 50,
        effectiveness: 80,
        responseTime: 30,
        costImpact: 70,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('response time');
      expect(explanation).toContain('took too long');
    });

    it('should identify low cost impact issues', () => {
      const breakdown = {
        overall: 50,
        effectiveness: 80,
        responseTime: 70,
        costImpact: 20,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('cost');
      expect(explanation).toContain('expensive');
    });

    it('should highlight strengths', () => {
      const breakdown = {
        overall: 70,
        effectiveness: 90,
        responseTime: 85,
        costImpact: 50,
        weights: { effectiveness: 0.5, responseTime: 0.3, costImpact: 0.2 }
      };
      
      const explanation = explainQualityScore(breakdown);
      expect(explanation).toContain('Strong performance');
      expect(explanation).toContain('effectiveness');
      expect(explanation).toContain('response time');
    });
  });

  describe('Edge Cases', () => {
    it('should handle all impact metrics at once', () => {
      const event = createTestEvent({
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {
            error_rate_reduction: 0.3,
            latency_improvement: 0.2,
            availability_increase: 0.1,
            problem_resolved: 1
          }
        }
      });
      
      const score = calculateQualityScore(event);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle cost in different locations', () => {
      const eventWithMetricsCost = createTestEvent({
        context: {
          trigger: 'test',
          metrics: { cost: 0.001 },
          state: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const eventWithImpactCost = createTestEvent({
        context: {
          trigger: 'test',
          metrics: {},
          state: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: { cost: 0.001 }
        }
      });
      
      const score1 = calculateQualityScore(eventWithMetricsCost);
      const score2 = calculateQualityScore(eventWithImpactCost);
      
      expect(score1).toBeGreaterThanOrEqual(0);
      expect(score1).toBeLessThanOrEqual(100);
      expect(score2).toBeGreaterThanOrEqual(0);
      expect(score2).toBeLessThanOrEqual(100);
    });

    it('should handle extreme cost values', () => {
      const zeroCostEvent = createTestEvent({
        context: {
          trigger: 'test',
          metrics: { cost: 0 },
          state: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const highCostEvent = createTestEvent({
        context: {
          trigger: 'test',
          metrics: { cost: 1000 },
          state: {}
        },
        outcome: {
          status: 'success',
          duration_ms: 100,
          impact: {}
        }
      });
      
      const zeroScore = calculateQualityScore(zeroCostEvent);
      const highScore = calculateQualityScore(highCostEvent);
      
      expect(zeroScore).toBeGreaterThanOrEqual(0);
      expect(zeroScore).toBeLessThanOrEqual(100);
      expect(highScore).toBeGreaterThanOrEqual(0);
      expect(highScore).toBeLessThanOrEqual(100);
    });
  });
});
