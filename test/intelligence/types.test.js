/**
 * Tests for Decision Intelligence Engine Types
 * 
 * Validates the validation functions for DecisionEvent structures.
 * Note: This is a JavaScript test file that imports the compiled TypeScript types.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read and evaluate the compiled types module
const typesPath = join(__dirname, '../../dist/types.js');
const typesCode = readFileSync(typesPath, 'utf-8');

// Create a module context
const module = { exports: {} };
const exports = module.exports;

// Evaluate the code
eval(typesCode);

// Extract the functions we need
const {
  validateDecisionEvent,
  validatePartialDecisionEvent,
  isDecisionEvent,
  formatValidationErrors
} = module.exports;

// Simple test framework
const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
      }
    },
    toEqual(expected) {
      const valueStr = JSON.stringify(value);
      const expectedStr = JSON.stringify(expected);
      if (valueStr !== expectedStr) {
        throw new Error(`Expected ${expectedStr}, got ${valueStr}`);
      }
    },
    toBeGreaterThan(expected) {
      if (value <= expected) {
        throw new Error(`Expected ${value} to be greater than ${expected}`);
      }
    },
    toContain(expected) {
      if (!value.includes(expected)) {
        throw new Error(`Expected ${JSON.stringify(value)} to contain ${JSON.stringify(expected)}`);
      }
    },
    toHaveLength(expected) {
      if (value.length !== expected) {
        throw new Error(`Expected length ${expected}, got ${value.length}`);
      }
    }
  };
}

// Test data
const validEvent = {
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

// Tests
test('validateDecisionEvent - valid event', () => {
  const result = validateDecisionEvent(validEvent);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

test('validateDecisionEvent - event with quality_score', () => {
  const eventWithScore = { ...validEvent, quality_score: 85 };
  const result = validateDecisionEvent(eventWithScore);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

test('validateDecisionEvent - missing event_id', () => {
  const { event_id, ...eventWithoutId } = validEvent;
  const result = validateDecisionEvent(eventWithoutId);
  expect(result.valid).toBe(false);
  expect(result.errors.length).toBeGreaterThan(0);
  const hasError = result.errors.some(e => e.field === 'event_id');
  if (!hasError) throw new Error('Expected error for missing event_id');
});

test('validateDecisionEvent - invalid outcome status', () => {
  const eventWithInvalidStatus = {
    ...validEvent,
    outcome: { ...validEvent.outcome, status: 'invalid' }
  };
  const result = validateDecisionEvent(eventWithInvalidStatus);
  expect(result.valid).toBe(false);
  const hasError = result.errors.some(e => e.field === 'outcome.status');
  if (!hasError) throw new Error('Expected error for invalid outcome status');
});

test('validateDecisionEvent - invalid quality_score (negative)', () => {
  const eventWithNegativeScore = { ...validEvent, quality_score: -10 };
  const result = validateDecisionEvent(eventWithNegativeScore);
  expect(result.valid).toBe(false);
  const hasError = result.errors.some(e => e.field === 'quality_score');
  if (!hasError) throw new Error('Expected error for negative quality_score');
});

test('validateDecisionEvent - invalid quality_score (over 100)', () => {
  const eventWithHighScore = { ...validEvent, quality_score: 150 };
  const result = validateDecisionEvent(eventWithHighScore);
  expect(result.valid).toBe(false);
  const hasError = result.errors.some(e => e.field === 'quality_score');
  if (!hasError) throw new Error('Expected error for quality_score over 100');
});

test('validateDecisionEvent - quality_score of 0', () => {
  const eventWithZeroScore = { ...validEvent, quality_score: 0 };
  const result = validateDecisionEvent(eventWithZeroScore);
  expect(result.valid).toBe(true);
});

test('validateDecisionEvent - quality_score of 100', () => {
  const eventWithMaxScore = { ...validEvent, quality_score: 100 };
  const result = validateDecisionEvent(eventWithMaxScore);
  expect(result.valid).toBe(true);
});

test('isDecisionEvent - valid event', () => {
  const result = isDecisionEvent(validEvent);
  expect(result).toBe(true);
});

test('isDecisionEvent - invalid event', () => {
  const invalidEvent = { ...validEvent, event_id: undefined };
  const result = isDecisionEvent(invalidEvent);
  expect(result).toBe(false);
});

test('isDecisionEvent - null', () => {
  const result = isDecisionEvent(null);
  expect(result).toBe(false);
});

test('validatePartialDecisionEvent - valid partial event', () => {
  const validPartialEvent = {
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
  const result = validatePartialDecisionEvent(validPartialEvent);
  expect(result.valid).toBe(true);
  expect(result.errors).toHaveLength(0);
});

test('formatValidationErrors - single error', () => {
  const errors = [
    { field: 'event_id', message: 'Missing required field: event_id' }
  ];
  const formatted = formatValidationErrors(errors);
  expect(formatted).toContain('event_id');
  expect(formatted).toContain('Missing required field');
});

test('formatValidationErrors - empty errors', () => {
  const formatted = formatValidationErrors([]);
  expect(formatted).toBe('No validation errors');
});

test('validateDecisionEvent - all valid outcome statuses', () => {
  const statuses = ['success', 'failure', 'partial', 'unknown'];
  
  for (const status of statuses) {
    const event = {
      ...validEvent,
      outcome: {
        status,
        duration_ms: 0,
        impact: {}
      }
    };
    const result = validateDecisionEvent(event);
    if (!result.valid) {
      throw new Error(`Status ${status} should be valid but got errors: ${JSON.stringify(result.errors)}`);
    }
  }
});

test('validateDecisionEvent - complex nested structures', () => {
  const complexEvent = {
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

// Run tests
async function runTests() {
  console.log(`\nRunning ${tests.length} tests for Decision Intelligence Engine Types...\n`);
  
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed\n`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
