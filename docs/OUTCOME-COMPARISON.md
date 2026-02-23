# Outcome Comparison Documentation

## Overview

The Outcome Comparison functionality enables comparing replayed decision outcomes with original outcomes to identify differences. This is a critical feature for debugging, testing improvements, and validating that system changes don't introduce regressions.

**Requirements:** 3.4

## Features

### Comparison Types

The system compares four types of differences:

1. **Action Parameters** - Changes in the actions taken by autonomous systems
2. **Outcome Status** - Changes in success/failure status
3. **Performance Metrics** - Changes in execution duration and latency
4. **Impact Measurements** - Changes in the measured impact of decisions

### Key Capabilities

- **Automatic Difference Detection** - Identifies all differences between original and replayed outcomes
- **Numeric Tolerance** - Supports configurable tolerance for numeric comparisons (e.g., 10% variance)
- **Percentage Calculations** - Automatically calculates percentage differences for numeric values
- **Aggregated Statistics** - Provides summary statistics across all comparisons
- **Top Differences** - Identifies the most common differences for quick analysis
- **Filtering Support** - Filter comparisons by decision type and system component

## Usage

### Basic Comparison

```typescript
import { ReplayEngine } from './intelligence/replayEngine.js';

const replayEngine = new ReplayEngine();
await replayEngine.connect();

// Compare outcomes for a time range
const report = await replayEngine.compareOutcomes({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  }
});

console.log(`Total events: ${report.totalEvents}`);
console.log(`Matching: ${report.matchingEvents} (${report.matchPercentage}%)`);
console.log(`Differing: ${report.differingEvents}`);
```

### Comparing Specific Events

```typescript
// Provide original and replayed events directly
const report = await replayEngine.compareOutcomes({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  },
  originalEvents: originalEventArray,
  replayedEvents: replayedEventArray
});
```

### Using Numeric Tolerance

```typescript
// Allow 10% variance in numeric values
const report = await replayEngine.compareOutcomes({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  },
  numericTolerance: 10 // 10% tolerance
});
```

### Filtering Comparisons

```typescript
// Compare only scaling decisions from auto-scaler
const report = await replayEngine.compareOutcomes({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  },
  decisionTypes: ['scaling'],
  systemComponents: ['auto-scaler']
});
```

## Report Structure

### OutcomeComparisonReport

```typescript
interface OutcomeComparisonReport {
  // Time range compared
  timeRange: TimeRange;
  
  // Statistics
  totalEvents: number;
  matchingEvents: number;
  differingEvents: number;
  matchPercentage: number;
  
  // Detailed comparisons
  comparisons: EventComparison[];
  
  // Summary by difference type
  differenceSummary: {
    action_parameters: number;
    outcome_status: number;
    performance_metrics: number;
    impact_measurements: number;
  };
  
  // Most common differences
  topDifferences: OutcomeDifference[];
  
  // Timestamp
  comparisonTimestamp: number;
}
```

### EventComparison

Each event comparison includes:

```typescript
interface EventComparison {
  eventId: string;
  decisionType: string;
  systemComponent: string;
  timestamp: number;
  matches: boolean;
  differences: OutcomeDifference[];
  originalEvent: DecisionEvent;
  replayedEvent?: DecisionEvent;
}
```

### OutcomeDifference

Each difference includes:

```typescript
interface OutcomeDifference {
  type: 'action_parameters' | 'outcome_status' | 'performance_metrics' | 'impact_measurements';
  field: string;
  originalValue: any;
  replayedValue: any;
  percentageDiff?: number; // For numeric values
  description: string;
}
```

## Example Output

```typescript
{
  timeRange: {
    startTime: '2024-01-01T00:00:00Z',
    endTime: '2024-01-02T00:00:00Z'
  },
  totalEvents: 100,
  matchingEvents: 85,
  differingEvents: 15,
  matchPercentage: 85.0,
  differenceSummary: {
    action_parameters: 5,
    outcome_status: 3,
    performance_metrics: 10,
    impact_measurements: 7
  },
  topDifferences: [
    {
      type: 'performance_metrics',
      field: 'outcome.duration_ms',
      originalValue: 100,
      replayedValue: 150,
      percentageDiff: 50,
      description: 'Duration changed from 100ms to 150ms'
    },
    {
      type: 'action_parameters',
      field: 'action_taken.parameters.target',
      originalValue: 5,
      replayedValue: 10,
      percentageDiff: 100,
      description: 'Parameter target changed from 5 to 10'
    }
  ],
  comparisons: [/* ... */],
  comparisonTimestamp: 1704153600000000
}
```

## Use Cases

### 1. Testing System Changes

Before deploying changes to autonomous systems, replay historical decisions to verify outcomes remain consistent:

```typescript
// Replay decisions with new code
const replayResult = await replayEngine.replayDecisions({
  timeRange: { startTime: lastWeek, endTime: now },
  sandbox: true,
  speed: 100
});

// Compare outcomes
const comparison = await replayEngine.compareOutcomes({
  timeRange: { startTime: lastWeek, endTime: now },
  numericTolerance: 5 // Allow 5% variance
});

if (comparison.matchPercentage < 95) {
  console.warn('Significant differences detected!');
  console.log('Top differences:', comparison.topDifferences);
}
```

### 2. Debugging Issues

When investigating incidents, compare outcomes before and after the issue:

```typescript
const report = await replayEngine.compareOutcomes({
  timeRange: {
    startTime: incidentStart,
    endTime: incidentEnd
  },
  decisionTypes: ['healing', 'scaling']
});

// Find events with outcome status changes
const statusChanges = report.comparisons.filter(c =>
  c.differences.some(d => d.type === 'outcome_status')
);

console.log('Events with status changes:', statusChanges);
```

### 3. Performance Analysis

Identify performance regressions by comparing execution times:

```typescript
const report = await replayEngine.compareOutcomes({
  timeRange: { startTime: lastWeek, endTime: now },
  numericTolerance: 0 // Strict comparison
});

// Find performance degradations
const slowdowns = report.comparisons
  .filter(c => c.differences.some(d => 
    d.field === 'outcome.duration_ms' && 
    d.percentageDiff && 
    d.percentageDiff > 20
  ))
  .sort((a, b) => {
    const aDiff = a.differences.find(d => d.field === 'outcome.duration_ms')?.percentageDiff || 0;
    const bDiff = b.differences.find(d => d.field === 'outcome.duration_ms')?.percentageDiff || 0;
    return bDiff - aDiff;
  });

console.log('Top 10 slowdowns:', slowdowns.slice(0, 10));
```

### 4. A/B Testing Validation

Compare outcomes between different autonomous strategies:

```typescript
// Compare strategy A vs strategy B
const report = await replayEngine.compareOutcomes({
  timeRange: { startTime: testStart, endTime: testEnd },
  originalEvents: strategyAEvents,
  replayedEvents: strategyBEvents
});

console.log(`Strategy B match rate: ${report.matchPercentage}%`);
console.log('Key differences:', report.topDifferences);
```

## Best Practices

### 1. Use Appropriate Tolerance

For performance metrics that naturally vary, use numeric tolerance:

```typescript
// Good: Allow reasonable variance
const report = await replayEngine.compareOutcomes({
  timeRange: timeRange,
  numericTolerance: 10 // 10% tolerance for timing variations
});

// Bad: Strict comparison for timing
const report = await replayEngine.compareOutcomes({
  timeRange: timeRange,
  numericTolerance: 0 // Will flag minor timing differences
});
```

### 2. Filter for Relevant Comparisons

Focus on specific decision types or components:

```typescript
// Compare only critical decisions
const report = await replayEngine.compareOutcomes({
  timeRange: timeRange,
  decisionTypes: ['healing', 'failover'], // Critical decisions only
  systemComponents: ['self-healing']
});
```

### 3. Analyze Top Differences First

Start with the most common differences:

```typescript
const report = await replayEngine.compareOutcomes({
  timeRange: timeRange,
  maxTopDifferences: 10
});

// Investigate top differences first
for (const diff of report.topDifferences) {
  console.log(`Common difference: ${diff.description}`);
  console.log(`Field: ${diff.field}, Type: ${diff.type}`);
}
```

### 4. Combine with Replay

Use outcome comparison after replay to validate changes:

```typescript
// 1. Replay decisions
const replayResult = await replayEngine.replayDecisions({
  timeRange: timeRange,
  sandbox: true,
  speed: 100
});

// 2. Compare outcomes
const comparison = await replayEngine.compareOutcomes({
  timeRange: timeRange,
  numericTolerance: 5
});

// 3. Analyze results
if (comparison.differingEvents > 0) {
  console.log('Differences found:', comparison.differenceSummary);
}
```

## Performance Considerations

### Memory Usage

For large time ranges, the comparison loads all events into memory. Consider:

- Breaking large comparisons into smaller time windows
- Using filtering to reduce the number of events
- Monitoring memory usage for very large datasets

```typescript
// Good: Process in chunks
const chunks = splitTimeRangeIntoChunks(startTime, endTime, 1000); // 1000 events per chunk

for (const chunk of chunks) {
  const report = await replayEngine.compareOutcomes({
    timeRange: chunk,
    numericTolerance: 10
  });
  
  processReport(report);
}
```

### Query Performance

Fetching events from the query API can be slow for large time ranges:

- Use appropriate time ranges (hours or days, not months)
- Apply filters to reduce event count
- Consider caching frequently compared events

## Error Handling

```typescript
try {
  const report = await replayEngine.compareOutcomes({
    timeRange: timeRange
  });
  
  // Process report
} catch (error) {
  if (error.message.includes('Outcome comparison failed')) {
    console.error('Comparison error:', error);
    // Handle comparison failure
  } else {
    throw error;
  }
}
```

## Integration with Observability

The comparison functionality integrates with OpenTelemetry tracing:

```typescript
// Traces are automatically created
const report = await replayEngine.compareOutcomes({
  timeRange: timeRange
});

// Trace attributes include:
// - comparison.start_time
// - comparison.end_time
// - comparison.original_events
// - comparison.replayed_events
// - comparison.matching_events
// - comparison.differing_events
// - comparison.match_percentage
```

## Related Documentation

- [Replay Engine Implementation](./REPLAY-ENGINE-IMPLEMENTATION.md)
- [State Reconstruction](./STATE-RECONSTRUCTION.md)
- [Decision Intelligence Engine](../src/intelligence/README-DECISION-ENGINE.md)
- [Query API](../src/intelligence/README-QUERY-API.md)

## API Reference

See [ReplayEngine TypeScript Documentation](../src/intelligence/replayEngine.ts) for complete API details.
