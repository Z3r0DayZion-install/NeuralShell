/**
 * TypeScript Interfaces and Types for Decision Intelligence Engine
 * 
 * Defines the core data structures for autonomous decision events,
 * including DecisionEvent interface, decision types, outcome statuses,
 * and validation functions.
 * 
 * Requirements: 1.2, 1.4
 */

/**
 * Validates a DecisionEvent structure
 * 
 * @param event - The decision event to validate
 * @returns Validation result with any errors found
 */
export function validateDecisionEvent(event) {
  const errors = [];

  // Check if event is null or undefined
  if (event === null || event === undefined) {
    return {
      valid: false,
      errors: [{ field: 'event', message: 'Event cannot be null or undefined' }]
    };
  }

  // Check if event is an object
  if (typeof event !== 'object') {
    return {
      valid: false,
      errors: [{ field: 'event', message: 'Event must be an object' }]
    };
  }

  // Required fields
  const requiredFields = [
    'event_id',
    'timestamp',
    'decision_type',
    'system_component',
    'context',
    'action_taken',
    'outcome',
    'trace_id',
    'span_id'
  ];

  for (const field of requiredFields) {
    if (event[field] === undefined || event[field] === null) {
      errors.push({
        field,
        message: `Missing required field: ${field}`,
        value: event[field]
      });
    }
  }

  // Type validations
  if (event.event_id !== undefined && typeof event.event_id !== 'string') {
    errors.push({
      field: 'event_id',
      message: 'event_id must be a string',
      value: event.event_id
    });
  }

  if (event.timestamp !== undefined && typeof event.timestamp !== 'number') {
    errors.push({
      field: 'timestamp',
      message: 'timestamp must be a number (Unix timestamp in microseconds)',
      value: event.timestamp
    });
  }

  if (event.decision_type !== undefined && typeof event.decision_type !== 'string') {
    errors.push({
      field: 'decision_type',
      message: 'decision_type must be a string',
      value: event.decision_type
    });
  }

  if (event.system_component !== undefined && typeof event.system_component !== 'string') {
    errors.push({
      field: 'system_component',
      message: 'system_component must be a string',
      value: event.system_component
    });
  }

  // Context validation
  if (event.context !== undefined) {
    if (typeof event.context !== 'object' || event.context === null) {
      errors.push({
        field: 'context',
        message: 'context must be an object',
        value: event.context
      });
    } else {
      if (typeof event.context.trigger !== 'string') {
        errors.push({
          field: 'context.trigger',
          message: 'context.trigger must be a string',
          value: event.context.trigger
        });
      }

      if (typeof event.context.metrics !== 'object' || event.context.metrics === null) {
        errors.push({
          field: 'context.metrics',
          message: 'context.metrics must be an object',
          value: event.context.metrics
        });
      }

      if (typeof event.context.state !== 'object' || event.context.state === null) {
        errors.push({
          field: 'context.state',
          message: 'context.state must be an object',
          value: event.context.state
        });
      }
    }
  }

  // Action taken validation
  if (event.action_taken !== undefined) {
    if (typeof event.action_taken !== 'object' || event.action_taken === null) {
      errors.push({
        field: 'action_taken',
        message: 'action_taken must be an object',
        value: event.action_taken
      });
    } else {
      if (typeof event.action_taken.type !== 'string') {
        errors.push({
          field: 'action_taken.type',
          message: 'action_taken.type must be a string',
          value: event.action_taken.type
        });
      }

      if (typeof event.action_taken.parameters !== 'object' || event.action_taken.parameters === null) {
        errors.push({
          field: 'action_taken.parameters',
          message: 'action_taken.parameters must be an object',
          value: event.action_taken.parameters
        });
      }
    }
  }

  // Outcome validation
  if (event.outcome !== undefined) {
    if (typeof event.outcome !== 'object' || event.outcome === null) {
      errors.push({
        field: 'outcome',
        message: 'outcome must be an object',
        value: event.outcome
      });
    } else {
      const validStatuses = ['success', 'failure', 'partial', 'unknown'];
      if (!validStatuses.includes(event.outcome.status)) {
        errors.push({
          field: 'outcome.status',
          message: `outcome.status must be one of: ${validStatuses.join(', ')}`,
          value: event.outcome.status
        });
      }

      if (typeof event.outcome.duration_ms !== 'number') {
        errors.push({
          field: 'outcome.duration_ms',
          message: 'outcome.duration_ms must be a number',
          value: event.outcome.duration_ms
        });
      }

      if (typeof event.outcome.impact !== 'object' || event.outcome.impact === null) {
        errors.push({
          field: 'outcome.impact',
          message: 'outcome.impact must be an object',
          value: event.outcome.impact
        });
      }
    }
  }

  // Quality score validation (optional field)
  if (event.quality_score !== undefined) {
    if (typeof event.quality_score !== 'number') {
      errors.push({
        field: 'quality_score',
        message: 'quality_score must be a number',
        value: event.quality_score
      });
    } else if (event.quality_score < 0 || event.quality_score > 100) {
      errors.push({
        field: 'quality_score',
        message: 'quality_score must be between 0 and 100',
        value: event.quality_score
      });
    }
  }

  // Trace ID validation
  if (event.trace_id !== undefined && typeof event.trace_id !== 'string') {
    errors.push({
      field: 'trace_id',
      message: 'trace_id must be a string',
      value: event.trace_id
    });
  }

  // Span ID validation
  if (event.span_id !== undefined && typeof event.span_id !== 'string') {
    errors.push({
      field: 'span_id',
      message: 'span_id must be a string',
      value: event.span_id
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates a partial decision event (before IDs are assigned)
 * 
 * @param event - The partial decision event to validate
 * @returns Validation result with any errors found
 */
export function validatePartialDecisionEvent(event) {
  const errors = [];

  // Required fields for partial event
  const requiredFields = [
    'decision_type',
    'system_component',
    'context',
    'action_taken',
    'outcome'
  ];

  for (const field of requiredFields) {
    if (event[field] === undefined || event[field] === null) {
      errors.push({
        field,
        message: `Missing required field: ${field}`,
        value: event[field]
      });
    }
  }

  // Reuse the full validation logic for the fields that are present
  const fullValidation = validateDecisionEvent({
    event_id: 'temp-id',
    timestamp: Date.now() * 1000,
    trace_id: 'temp-trace',
    span_id: 'temp-span',
    ...event
  });

  // Filter out errors for fields that are optional in partial events
  const relevantErrors = fullValidation.errors.filter(error => 
    !['event_id', 'timestamp', 'trace_id', 'span_id'].includes(error.field)
  );

  errors.push(...relevantErrors);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Creates a formatted error message from validation errors
 * 
 * @param errors - Array of validation errors
 * @returns Formatted error message
 */
export function formatValidationErrors(errors) {
  if (errors.length === 0) {
    return 'No validation errors';
  }

  return errors
    .map(error => `${error.field}: ${error.message}`)
    .join('; ');
}
