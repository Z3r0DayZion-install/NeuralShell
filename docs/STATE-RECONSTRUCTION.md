# State Reconstruction Implementation

## Overview

The State Reconstruction feature enables time-travel debugging by reconstructing system state at any historical point from the event stream. This implementation is part of Task 7.2 in the Autonomous Intelligence Layer spec.

## Features

### 1. State Reconstruction from Events

The `reconstructState()` method rebuilds system state by replaying Decision_Events chronologically:

```typescript
const state = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T10:30:00Z'),
  enableCaching: true,
  snapshotInterval: 60000 // 1 minute
});

console.log(`Reconstructed state at ${new Date(state.timestamp)}`);
console.log(`Components: ${state.componentStates.size}`);
console.log(`Events processed: ${state.eventsProcessed}`);
```

### 2. State Accumulation

Events are replayed in chronological order, accumulating state changes:

- **Component State**: Tracks state for each system component (auto-scaler, self-healing, etc.)
- **Metrics**: Aggregates the latest metric values
- **Decision History**: Stores the last decision made by each component

### 3. Snapshot Caching

For performance optimization with long event sequences:

- **Automatic Snapshots**: Creates state snapshots at configurable intervals (default: 1 minute)
- **Cache Reuse**: Finds the closest snapshot before the target timestamp to minimize replay
- **Memory Management**: Limits cache to 100 snapshots to prevent memory issues

```typescript
// Clear the snapshot cache
replayEngine.clearSnapshotCache();

// Get cache statistics
const stats = replayEngine.getSnapshotCacheStats();
console.log(`Cached snapshots: ${stats.snapshotCount}`);
console.log(`Timestamps: ${stats.timestamps}`);
```

## API Reference

### `reconstructState(config: StateReconstructionConfig): Promise<ReconstructedState>`

Reconstructs system state at a specific point in time.

**Parameters:**

- `config.targetTimestamp` (Date | number): Target timestamp to reconstruct state for (required)
- `config.startTime` (Date | number): Optional start time (defaults to beginning of time)
- `config.decisionTypes` (string[]): Optional filter by decision types
- `config.systemComponents` (string[]): Optional filter by system components
- `config.enableCaching` (boolean): Enable snapshot caching (default: true)
- `config.snapshotInterval` (number): Snapshot interval in milliseconds (default: 60000)

**Returns:**

```typescript
interface ReconstructedState {
  timestamp: number;                              // Timestamp of the state
  componentStates: Map<string, ComponentState>;   // State by component
  metrics: Record<string, number>;                // Aggregated metrics
  eventsProcessed: number;                        // Number of events processed
  fromCache: boolean;                             // Whether loaded from cache
}

interface ComponentState {
  component: string;                              // Component name
  state: Record<string, any>;                     // Current state values
  lastDecision?: DecisionEvent;                   // Last decision made
  lastUpdated: number;                            // Timestamp of last update
}
```

## Usage Examples

### Basic State Reconstruction

```typescript
import { ReplayEngine } from './intelligence/replayEngine.js';

const replayEngine = new ReplayEngine();
await replayEngine.connect();

// Reconstruct state at a specific time
const state = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T10:30:00Z')
});

// Access component states
for (const [component, componentState] of state.componentStates) {
  console.log(`${component}:`, componentState.state);
  console.log(`Last decision:`, componentState.lastDecision?.decision_type);
}

await replayEngine.disconnect();
```

### Filtered State Reconstruction

```typescript
// Reconstruct state for specific components only
const state = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T10:30:00Z'),
  systemComponents: ['auto-scaler', 'self-healing'],
  decisionTypes: ['scaling', 'healing']
});
```

### Performance Optimization with Caching

```typescript
// First reconstruction - builds cache
const state1 = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T10:00:00Z'),
  enableCaching: true,
  snapshotInterval: 30000 // 30 seconds
});

// Second reconstruction - uses cache
const state2 = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T10:30:00Z'),
  enableCaching: true
});

// Cache statistics
const stats = replayEngine.getSnapshotCacheStats();
console.log(`Cache hits improved performance by ${stats.snapshotCount} snapshots`);
```

### Time-Travel Debugging Workflow

```typescript
// 1. Identify incident time
const incidentTime = new Date('2024-01-15T10:25:00Z');

// 2. Reconstruct state before incident
const stateBefore = await replayEngine.reconstructState({
  targetTimestamp: new Date(incidentTime.getTime() - 5 * 60 * 1000) // 5 minutes before
});

// 3. Reconstruct state during incident
const stateDuring = await replayEngine.reconstructState({
  targetTimestamp: incidentTime
});

// 4. Compare states
console.log('State changes:');
for (const [component, state] of stateDuring.componentStates) {
  const beforeState = stateBefore.componentStates.get(component);
  if (beforeState) {
    console.log(`${component}:`, {
      before: beforeState.state,
      during: state.state
    });
  }
}
```

## Performance Characteristics

- **Without Caching**: O(n) where n is the number of events from start to target timestamp
- **With Caching**: O(m) where m is the number of events since the last snapshot
- **Memory Usage**: ~100 snapshots maximum (configurable via cache size limit)
- **Snapshot Overhead**: Minimal - snapshots are created asynchronously during replay

## Requirements Satisfied

This implementation satisfies **Requirement 3.2** from the Autonomous Intelligence Layer spec:

> THE Decision_Intelligence_Engine SHALL support time-travel debugging by reconstructing system state at any historical point

### Acceptance Criteria Met:

✅ Reconstructs system state from Decision_Events  
✅ Replays events chronologically with state accumulation  
✅ Implements snapshot caching for performance  
✅ Supports filtering by decision types and components  
✅ Provides complete component state and metrics

## Testing

Comprehensive unit tests cover:

- Configuration validation
- State accumulation from events
- Snapshot caching and reuse
- Filtering by decision types and components
- Performance with large event sequences
- Cache management and clearing

Run tests:

```bash
npm test -- test/intelligence/replayEngine.test.ts --run
```

## Integration with Replay Engine

State reconstruction integrates seamlessly with the existing replay functionality:

```typescript
// Replay decisions and reconstruct state
const replayResult = await replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date('2024-01-15T10:00:00Z'),
    endTime: new Date('2024-01-15T10:30:00Z')
  },
  sandbox: true,
  speed: 10
});

// Then reconstruct final state
const finalState = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T10:30:00Z')
});
```

## Future Enhancements

Potential improvements for future iterations:

1. **State Diff Calculation**: Automatically compute differences between states
2. **State Visualization**: Generate visual representations of state changes
3. **Predictive State**: Project future state based on current trends
4. **State Validation**: Verify state consistency across components
5. **Distributed State**: Support multi-region state reconstruction

## Related Documentation

- [Replay Engine Implementation](./REPLAY-ENGINE-IMPLEMENTATION.md)
- [Decision Intelligence Engine](../src/intelligence/README-DECISION-ENGINE.md)
- [Query API](./QUERY-API-IMPLEMENTATION.md)
