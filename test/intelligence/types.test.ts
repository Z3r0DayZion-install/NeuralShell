/**
 * Tests for Decision Intelligence Engine Types
 * 
 * Validates TypeScript interfaces, types, and validation functions
 * for DecisionEvent structures.
 */

import {
  DecisionEvent,
  PartialDecisionEvent,
  OutcomeStatus,
  DecisionType,
  SystemComponent,
  validateDecisionEvent,
  validatePartialDecisionEvent,
  isDecisionEvent,
  formatValidationErrors,
  ValidationResult
} from '../../src/intelligence/types';

describe('DecisionEvent Types', () => {
  describe('Type Definitions', () => {
    it('should allow valid OutcomeStatus values', () => {
      const validStatuses: OutcomeStatus[] = ['success', 'failure', 'partial', 'unknown'];
      expect(validStatuses).toHaveLength(4);
    });

    it('should allow predefined and custom DecisionType values', () => {
      const predefinedTypes: DecisionType[] = [
        'scaling',
        'healing',
        'routing',
        'optimization',
        'security',
        'cost_management',
        'anomaly_response',
        'failover',
        'threshold_adjustment'
      ];
      const customType: DecisionType = 'custom_decision_type';
      
      expect(predefinedTypes.length).toBeGreaterThan(0);
      expect(customType).toBe('custom_decision_type');
    });

    it('should allow predefined and custom SystemComponent values', () => {
      const predefinedComponents: SystemComponent[] = [
        'auto-scaler',
        'self-healing',
        'anomaly-detector',
        'threat-detector',
        'cost-manager',
        'auto-optimizer',
        'canary-deployment',
        'secret-rotation',
        'process-manager'
      ];
      const customComponent: SystemComponent = 'custom-component';
      
      expect(predefinedComponents.length).toBeGreaterThan(0);
      expect(customComponent).toBe('custom-component');
    });
  });

  describe('validateDecisionEvent', () => {
    const validEvent: DecisionEvent = {
      event_id: '01234567-89ab-7def-0123-456789abcdef',
      timestamp: 1234567890123456,
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
      },
      trace_id: '0123456789abcdef0123456789abcdef',
      span_id: '0123456789abcdef'
    };

    it('should validate a complete valid event', () => {
      const result = validateDecisionEvent(validEvent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate an event with quality_score', () => {
      const eventWithScore = { ...validEvent, quality_score: 85 };
      const result = validateDecisionEvent(eventWithScore);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject event with missing event_id', () => {
      const { event_id, ...eventWithoutId } = validEvent;
      const result = validateDecisionEvent(eventWithoutId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'event_id',
          message: 'Missing required field: event_id'
        })
      );
    });

    it('should reject event with missing timestamp', () => {
      const { timestamp, ...eventWithoutTimestamp } = validEvent;
      const result = validateDecisionEvent(eventWithoutTimestamp);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'timestamp',
          message: 'Missing required field: timestamp'
        })
      );
    });

    it('should reject event with missing decision_type', () => {
      const { decision_type, ...eventWithoutType } = validEvent;
      const result = validateDecisionEvent(eventWithoutType);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'decision_type',
          message: 'Missing required field: decision_type'
        })
      );
    });

    it('should reject event with missing system_component', () => {
      const { system_component, ...eventWithoutComponent } = validEvent;
      const result = validateDecisionEvent(eventWithoutComponent);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'system_component',
          message: 'Missing required field: system_component'
        })
      );
    });

    it('should reject event with missing context', () => {
      const { context, ...eventWithoutContext } = validEvent;
      const result = validateDecisionEvent(eventWithoutContext);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'context',
          message: 'Missing required field: context'
        })
      );
    });

    it('should reject event with invalid context structure', () => {
      const eventWithInvalidContext = {
        ...validEvent,
        context: { trigger: 'test' } // Missing metrics and state
      };
      const result = validateDecisionEvent(eventWithInvalidContext);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject event with missing action_taken', () => {
      const { action_taken, ...eventWithoutAction } = validEvent;
      const result = validateDecisionEvent(eventWithoutAction);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'action_taken',
          message: 'Missing required field: action_taken'
        })
      );
    });

    it('should reject event with missing outcome', () => {
      const { outcome, ...eventWithoutOutcome } = validEvent;
      const result = validateDecisionEvent(eventWithoutOutcome);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'outcome',
          message: 'Missing required field: outcome'
        })
      );
    });

    it('should reject event with invalid outcome status', () => {
      const eventWithInvalidStatus = {
        ...validEvent,
        outcome: { ...validEvent.outcome, status: 'invalid' as any }
      };
      const result = validateDecisionEvent(eventWithInvalidStatus);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'outcome.status',
          message: expect.stringContaining('outcome.status must be one of')
        })
      );
    });

    it('should reject event with invalid quality_score (negative)', () => {
      const eventWithNegativeScore = { ...validEvent, quality_score: -10 };
      const result = validateDecisionEvent(eventWithNegativeScore);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quality_score',
          message: 'quality_score must be between 0 and 100'
        })
      );
    });

    it('should reject event with invalid quality_score (over 100)', () => {
      const eventWithHighScore = { ...validEvent, quality_score: 150 };
      const result = validateDecisionEvent(eventWithHighScore);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'quality_score',
          message: 'quality_score must be between 0 and 100'
        })
      );
    });

    it('should accept quality_score of 0', () => {
      const eventWithZeroScore = { ...validEvent, quality_score: 0 };
      const result = validateDecisionEvent(eventWithZeroScore);
      expect(result.valid).toBe(true);
    });

    it('should accept quality_score of 100', () => {
      const eventWithMaxScore = { ...validEvent, quality_score: 100 };
      const result = validateDecisionEvent(eventWithMaxScore);
      expect(result.valid).toBe(true);
    });

    it('should reject event with non-string event_id', () => {
      const eventWithInvalidId = { ...validEvent, event_id: 12345 as any };
      const result = validateDecisionEvent(eventWithInvalidId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'event_id',
          message: 'event_id must be a string'
        })
      );
    });

    it('should reject event with non-number timestamp', () => {
      const eventWithInvalidTimestamp = { ...validEvent, timestamp: '1234567890' as any };
      const result = validateDecisionEvent(eventWithInvalidTimestamp);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'timestamp',
          message: 'timestamp must be a number (Unix timestamp in microseconds)'
        })
      );
    });

    it('should reject event with missing trace_id', () => {
      const { trace_id, ...eventWithoutTraceId } = validEvent;
      const result = validateDecisionEvent(eventWithoutTraceId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'trace_id',
          message: 'Missing required field: trace_id'
        })
      );
    });

    it('should reject event with missing span_id', () => {
      const { span_id, ...eventWithoutSpanId } = validEvent;
      const result = validateDecisionEvent(eventWithoutSpanId);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'span_id',
          message: 'Missing required field: span_id'
        })
      );
    });

    it('should handle multiple validation errors', () => {
      const invalidEvent = {
        event_id: 123, // Should be string
        timestamp: '1234567890', // Should be number
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: null, // Should be object
        action_taken: null, // Should be object
        outcome: null, // Should be object
        quality_score: 150, // Should be 0-100
        trace_id: 'valid-trace',
        span_id: 'valid-span'
      };
      const result = validateDecisionEvent(invalidEvent);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('isDecisionEvent', () => {
    const validEvent: DecisionEvent = {
      event_id: '01234567-89ab-7def-0123-456789abcdef',
      timestamp: 1234567890123456,
      decision_type: 'scaling',
      system_component: 'auto-scaler',
      context: {
        trigger: 'high_cpu',
        metrics: { cpu: 85 },
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
      },
      trace_id: '0123456789abcdef0123456789abcdef',
      span_id: '0123456789abcdef'
    };

    it('should return true for valid event', () => {
      expect(isDecisionEvent(validEvent)).toBe(true);
    });

    it('should return false for invalid event', () => {
      const invalidEvent = { ...validEvent, event_id: undefined };
      expect(isDecisionEvent(invalidEvent)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isDecisionEvent(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDecisionEvent(undefined)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isDecisionEvent('not an object')).toBe(false);
    });
  });

  describe('validatePartialDecisionEvent', () => {
    const validPartialEvent: PartialDecisionEvent = {
      decision_type: 'scaling',
      system_component: 'auto-scaler',
      context: {
        trigger: 'high_cpu',
        metrics: { cpu: 85 },
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

    it('should validate a valid partial event', () => {
      const result = validatePartialDecisionEvent(validPartialEvent);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should allow optional trace_id and span_id', () => {
      const partialWithTracing = {
        ...validPartialEvent,
        trace_id: 'optional-trace',
        span_id: 'optional-span'
      };
      const result = validatePartialDecisionEvent(partialWithTracing);
      expect(result.valid).toBe(true);
    });

    it('should not require event_id', () => {
      const result = validatePartialDecisionEvent(validPartialEvent);
      expect(result.valid).toBe(true);
      expect(result.errors.find(e => e.field === 'event_id')).toBeUndefined();
    });

    it('should not require timestamp', () => {
      const result = validatePartialDecisionEvent(validPartialEvent);
      expect(result.valid).toBe(true);
      expect(result.errors.find(e => e.field === 'timestamp')).toBeUndefined();
    });

    it('should reject partial event with missing decision_type', () => {
      const { decision_type, ...partialWithoutType } = validPartialEvent;
      const result = validatePartialDecisionEvent(partialWithoutType);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          field: 'decision_type',
          message: 'Missing required field: decision_type'
        })
      );
    });

    it('should reject partial event with invalid outcome status', () => {
      const partialWithInvalidStatus = {
        ...validPartialEvent,
        outcome: { ...validPartialEvent.outcome, status: 'invalid' as any }
      };
      const result = validatePartialDecisionEvent(partialWithInvalidStatus);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format single error', () => {
      const errors = [
        { field: 'event_id', message: 'Missing required field: event_id' }
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('event_id: Missing required field: event_id');
    });

    it('should format multiple errors', () => {
      const errors = [
        { field: 'event_id', message: 'Missing required field: event_id' },
        { field: 'timestamp', message: 'Missing required field: timestamp' }
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('event_id: Missing required field: event_id');
      expect(formatted).toContain('timestamp: Missing required field: timestamp');
      expect(formatted).toContain(';');
    });

    it('should handle empty errors array', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe('No validation errors');
    });

    it('should include error values when present', () => {
      const errors = [
        { field: 'quality_score', message: 'Invalid value', value: 150 }
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('quality_score: Invalid value');
    });
  });

  describe('Edge Cases', () => {
    it('should handle event with all optional fields', () => {
      const minimalEvent: DecisionEvent = {
        event_id: '01234567-89ab-7def-0123-456789abcdef',
        timestamp: 1234567890123456,
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
          duration_ms: 0,
          impact: {}
        },
        trace_id: 'trace',
        span_id: 'span'
      };
      const result = validateDecisionEvent(minimalEvent);
      expect(result.valid).toBe(true);
    });

    it('should handle event with complex nested structures', () => {
      const complexEvent: DecisionEvent = {
        event_id: '01234567-89ab-7def-0123-456789abcdef',
        timestamp: 1234567890123456,
        decision_type: 'scaling',
        system_component: 'auto-scaler',
        context: {
          trigger: 'complex_trigger',
          metrics: {
            cpu: 85,
            memory: 60,
            disk: 40,
            network_in: 1000,
            network_out: 500
          },
          state: {
            current_instances: 2,
            target_instances: 4,
            region: 'us-east-1',
            availability_zones: ['us-east-1a', 'us-east-1b'],
            metadata: {
              deployment: 'production',
              version: '1.2.3'
            }
          }
        },
        action_taken: {
          type: 'scale_up',
          parameters: {
            target_instances: 4,
            instance_type: 't3.medium',
            use_spot: true,
            max_price: 0.05
          }
        },
        outcome: {
          status: 'success',
          duration_ms: 1500,
          impact: {
            instances_added: 2,
            cost_increase: 0.10,
            capacity_increase: 100
          }
        },
        quality_score: 92,
        trace_id: '0123456789abcdef0123456789abcdef',
        span_id: '0123456789abcdef'
      };
      const result = validateDecisionEvent(complexEvent);
      expect(result.valid).toBe(true);
    });

    it('should handle all valid outcome statuses', () => {
      const statuses: OutcomeStatus[] = ['success', 'failure', 'partial', 'unknown'];
      
      for (const status of statuses) {
        const event: DecisionEvent = {
          event_id: '01234567-89ab-7def-0123-456789abcdef',
          timestamp: 1234567890123456,
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
            duration_ms: 0,
            impact: {}
          },
          trace_id: 'trace',
          span_id: 'span'
        };
        const result = validateDecisionEvent(event);
        expect(result.valid).toBe(true);
      }
    });
  });
});
