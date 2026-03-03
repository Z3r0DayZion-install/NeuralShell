# Decision Intelligence Engine Types

TypeScript interfaces and types for the Decision Intelligence Engine, providing type safety and validation for autonomous decision events.

## Overview

This module defines the core data structures for recording autonomous decisions in the Intelligence Layer. It includes:

- **DecisionEvent**: Complete event structure with all required fields
- **PartialDecisionEvent**: Event structure for creation (before IDs are assigned)
- **Type definitions**: OutcomeStatus, DecisionType, SystemComponent
- **Validation functions**: Comprehensive validation with detailed error reporting

## Type Definitions

### OutcomeStatus

```typescript
type OutcomeStatus = 'success' | 'failure' | 'partial' | 'unknown';
```

Represents the outcome status of an autonomous decision.

### DecisionType

```typescript
type DecisionType = 
  | 'scaling'
  | 'healing'
  | 'routing'
  | 'optimization'
  | 'security'
  | 'cost_management'
  | 'anomaly_response'
  | 'failover'
  | 'threshold_adjustment'
  | string; // Allow custom decision types
```

Predefined decision types with support for custom types.

### SystemComponent

```typescript
type SystemComponent =
  | 'auto-scaler'
  | 'self-healing'
  | 'anomaly-detector'
  | 'threat-detector'
  | 'cost-manager'
  | 'auto-optimizer'
  | 'canary-deployment'
  | 'secret-rotation'
  | 'process-manager'
  | string; // Allow custom components
```

System components that can make autonomous decisions.

## Interfaces

### DecisionEvent

Complete decision event structure:

```typescript
interface DecisionEvent {
  event_id: string;              // UUID v7 (time-ordered)
  timestamp: number;             // Unix timestamp in microseconds
  decision_type: DecisionType;   // Type of decision
  system_component: SystemComponent; // Component making the decision
  context: DecisionContext;      // Decision context
  action_taken: ActionTaken;     // Action details
  outcome: DecisionOutcome;      // Decision outcome
  quality_score?: number;        // 0-100, calculated post-decision
  trace_id: string;              // OpenTelemetry trace ID
  span_id: string;               // OpenTelemetry span ID
}
```

### DecisionContext

```typescript
interface DecisionContext {
  trigger: string;                    // What caused the decision
  metrics: Record<string, number>;    // Relevant metrics
  state: Record<string, any>;         // System state
}
```

### ActionTaken

```typescript
interface ActionTaken {
  type: string;                       // Type of action
  parameters: Record<string, any>;    // Action parameters
}
```

### DecisionOutcome

```typescript
interface DecisionOutcome {
  status: OutcomeStatus;              // Outcome status
  duration_ms: number;                // Execution duration
  impact: Record<string, number>;     // Impact metrics
}
```

### PartialDecisionEvent

Event structure for creation (before IDs and timestamps are assigned):

```typescript
type PartialDecisionEvent = Omit<DecisionEvent, 'event_id' | 'timestamp' | 'trace_id' | 'span_id'> & {
  trace_id?: string;
  span_id?: string;
};
```

## Validation Functions

### validateDecisionEvent(event: any): ValidationResult

Validates a complete DecisionEvent structure.

**Parameters:**
- `event`: The decision event to validate

**Returns:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
```

**Example:**
```javascript
import { validateDecisionEvent } from './types.js';

const event = {
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

const result = validateDecisionEvent(event);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
```

### validatePartialDecisionEvent(event: any): ValidationResult

Validates a partial decision event (before IDs are assigned).

**Example:**
```javascript
import { validatePartialDecisionEvent } from './types.js';

const partialEvent = {
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

const result = validatePartialDecisionEvent(partialEvent);
if (result.valid) {
  // Event is ready to be written to Event Store
  await eventStore.writeEvent(partialEvent);
}
```

### isDecisionEvent(event: any): boolean

Type guard to check if an object is a valid DecisionEvent.

**Example:**
```javascript
import { isDecisionEvent } from './types.js';

if (isDecisionEvent(event)) {
  // TypeScript knows event is a DecisionEvent
  console.log(`Event ${event.event_id} is valid`);
}
```

### formatValidationErrors(errors: ValidationError[]): string

Creates a formatted error message from validation errors.

**Example:**
```javascript
import { validateDecisionEvent, formatValidationErrors } from './types.js';

const result = validateDecisionEvent(event);
if (!result.valid) {
  const errorMessage = formatValidationErrors(result.errors);
  throw new Error(`Invalid decision event: ${errorMessage}`);
}
```

## Usage with Event Store

The types are designed to work seamlessly with the existing Event Store implementation:

```javascript
import { getEventStore } from './eventStore.js';
import { validatePartialDecisionEvent, formatValidationErrors } from './types.js';

const eventStore = getEventStore();
await eventStore.connect();

// Create a partial event
const partialEvent = {
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

// Validate before writing
const validation = validatePartialDecisionEvent(partialEvent);
if (!validation.valid) {
  throw new Error(`Invalid event: ${formatValidationErrors(validation.errors)}`);
}

// Write to Event Store (IDs and timestamps will be added automatically)
const eventId = await eventStore.writeEvent(partialEvent);
console.log(`Event written with ID: ${eventId}`);
```

## Validation Rules

### Required Fields

All fields except `quality_score` are required:
- `event_id`: Must be a string (UUID v7)
- `timestamp`: Must be a number (Unix timestamp in microseconds)
- `decision_type`: Must be a string
- `system_component`: Must be a string
- `context`: Must be an object with `trigger`, `metrics`, and `state`
- `action_taken`: Must be an object with `type` and `parameters`
- `outcome`: Must be an object with `status`, `duration_ms`, and `impact`
- `trace_id`: Must be a string
- `span_id`: Must be a string

### Field Constraints

- `outcome.status`: Must be one of: 'success', 'failure', 'partial', 'unknown'
- `quality_score`: If present, must be a number between 0 and 100 (inclusive)
- `timestamp`: Must be a number
- `outcome.duration_ms`: Must be a number
- `context.metrics`: Must be an object
- `context.state`: Must be an object
- `action_taken.parameters`: Must be an object
- `outcome.impact`: Must be an object

## TypeScript Integration

For TypeScript projects, import the types directly:

```typescript
import {
  DecisionEvent,
  PartialDecisionEvent,
  DecisionType,
  SystemComponent,
  OutcomeStatus,
  validateDecisionEvent
} from './types';

// Type-safe event creation
const event: DecisionEvent = {
  event_id: '01234567-89ab-7def-0123-456789abcdef',
  timestamp: Date.now() * 1000,
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

// TypeScript will catch type errors at compile time
const result = validateDecisionEvent(event);
```

## Error Handling

Validation errors include detailed information:

```typescript
interface ValidationError {
  field: string;      // Field that failed validation
  message: string;    // Error message
  value?: any;        // The invalid value (optional)
}
```

Example error output:
```javascript
{
  valid: false,
  errors: [
    {
      field: 'quality_score',
      message: 'quality_score must be between 0 and 100',
      value: 150
    },
    {
      field: 'outcome.status',
      message: 'outcome.status must be one of: success, failure, partial, unknown',
      value: 'invalid'
    }
  ]
}
```

## Requirements Mapping

This implementation satisfies:
- **Requirement 1.2**: DecisionEvent contains all required fields (decision type, context, action, timestamp, outcome)
- **Requirement 1.4**: Validation functions ensure event structure integrity

## Next Steps

These types will be used by:
- Decision Intelligence Engine (Phase 2) for event recording and querying
- Quality scoring system for calculating decision effectiveness
- A/B testing framework for comparing autonomous strategies
- Visual Command Center for displaying decision streams
