# Replay Engine

The Replay Engine provides time-travel debugging capabilities for the Autonomous Intelligence Layer. It allows you to replay historical decisions in a sandbox environment with configurable speed control.

## Features

- **Time-Travel Debugging**: Replay decisions from any historical time range
- **Sandbox Mode**: Isolated replay environment that doesn't affect production
- **Speed Control**: Replay at 1x to 100x real-time speed
- **Chronological Ordering**: Events are always replayed in the order they occurred
- **State Reconstruction**: Rebuild system state at any historical point in time
- **Outcome Comparison**: Compare replayed outcomes with original outcomes to identify differences
- **Filtering**: Filter replays by decision type and system component
- **Progress Tracking**: Real-time progress callbacks during replay
- **Event Callbacks**: Hook into each replayed event for custom processing

## Requirements

Implements requirements:
- **3.1**: Replay all Decision_Events in chronological order
- **3.2**: Support time-travel debugging by reconstructing system state at any historical point
- **3.3**: Execute replays in sandbox environment isolated from production
- **3.4**: Compare replayed outcomes with original outcomes and report differences
- **3.5**: Support replay speed control from 1x to 100x real-time

## Installation

```typescript
import { ReplayEngine, getReplayEngine } from './intelligence/replayEngine.js';
import { DecisionQueryAPI } from './intelligence/queryAPI.js';
```

## Usage

### Basic Replay

```typescript
import { getReplayEngine } from './intelligence/replayEngine.js';

const replayEngine = getReplayEngine();
await replayEngine.connect();

// Replay decisions from the last hour
const result = await replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date(Date.now() - 3600000), // 1 hour ago
    endTime: new Date()
  },
  sandbox: true,  // Always use sandbox mode for safety
  speed: 10       // 10x speed
});

console.log(`Replayed ${result.eventsReplayed} events`);
console.log(`Took ${result.totalRealTime}ms real time`);
console.log(`Simulated ${result.totalSimulatedTime}ms of system time`);
```

### Replay with Event Callbacks

```typescript
const replayEngine = getReplayEngine();
await replayEngine.connect();

const replayedEvents = [];

await replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  },
  sandbox: true,
  speed: 100,
  
  // Called for each replayed event
  onEvent: async (event, replayTime) => {
    console.log(`Replayed ${event.decision_type} at ${replayTime}ms`);
    replayedEvents.push(event);
  },
  
  // Called with progress updates
  onProgress: (progress) => {
    console.log(`Progress: ${progress.percentComplete.toFixed(1)}%`);
    console.log(`Events: ${progress.eventsReplayed}/${progress.totalEvents}`);
  }
});
```

### Filtered Replay

```typescript
// Replay only scaling decisions from auto-scaler
await replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  },
  sandbox: true,
  speed: 50,
  decisionTypes: ['scaling'],
  systemComponents: ['auto-scaler']
});
```

### Stop Ongoing Replay

```typescript
// Start a long replay
const replayPromise = replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-12-31')
  },
  sandbox: true,
  speed: 1,
  onProgress: (progress) => {
    // Stop after 50% complete
    if (progress.percentComplete >= 50) {
      replayEngine.stopReplay();
    }
  }
});

await replayPromise;
```

## API Reference

### ReplayEngine

#### Constructor

```typescript
constructor(queryAPI?: DecisionQueryAPI)
```

Creates a new Replay Engine instance. Optionally accepts a custom Query API instance.

#### Methods

##### `connect(): Promise<void>`

Connects to the Query API. Must be called before replaying decisions.

##### `disconnect(): Promise<void>`

Disconnects from the Query API.

##### `replayDecisions(config: ReplayConfig): Promise<ReplayResult>`

Replays decisions from a time range.

**Parameters:**
- `config.timeRange` (required): Time range to replay
  - `startTime`: Start time (Date or timestamp)
  - `endTime`: End time (Date or timestamp)
- `config.sandbox` (required): Enable sandbox mode (must be explicitly set)
- `config.speed` (optional): Replay speed multiplier (1-100, default: 1)
- `config.decisionTypes` (optional): Filter by decision types
- `config.systemComponents` (optional): Filter by system components
- `config.onEvent` (optional): Callback for each replayed event
- `config.onProgress` (optional): Callback for progress updates

**Returns:** `ReplayResult` with:
- `eventsReplayed`: Number of events replayed
- `timeRange`: Time range that was replayed
- `speed`: Replay speed used
- `sandbox`: Whether sandbox mode was enabled
- `totalRealTime`: Total real time taken (ms)
- `totalSimulatedTime`: Total simulated time (ms)
- `errors`: Any errors encountered

##### `stopReplay(): void`

Stops an ongoing replay. Throws error if no replay is in progress.

##### `reconstructState(config: StateReconstructionConfig): Promise<ReconstructedState>`

Reconstructs system state at a specific point in time by replaying events.

**Parameters:**
- `config.targetTimestamp` (required): Target timestamp to reconstruct state for
- `config.startTime` (optional): Start time for event replay (defaults to beginning)
- `config.decisionTypes` (optional): Filter by decision types
- `config.systemComponents` (optional): Filter by system components
- `config.enableCaching` (optional): Enable snapshot caching (default: true)
- `config.snapshotInterval` (optional): Snapshot interval in ms (default: 60000)

**Returns:** `ReconstructedState` with:
- `timestamp`: Timestamp of the reconstructed state
- `componentStates`: Map of component states
- `metrics`: Aggregated metrics at this point
- `eventsProcessed`: Number of events processed
- `fromCache`: Whether state was loaded from cache

##### `compareOutcomes(config: OutcomeComparisonConfig): Promise<OutcomeComparisonReport>`

Compares replayed outcomes with original outcomes to identify differences.

**Parameters:**
- `config.timeRange` (required): Time range to compare
- `config.originalEvents` (optional): Original events to compare (fetched if not provided)
- `config.replayedEvents` (optional): Replayed events to compare (fetched if not provided)
- `config.decisionTypes` (optional): Filter by decision types
- `config.systemComponents` (optional): Filter by system components
- `config.numericTolerance` (optional): Tolerance for numeric comparisons (percentage, default: 0)
- `config.maxTopDifferences` (optional): Maximum number of top differences to include (default: 10)

**Returns:** `OutcomeComparisonReport` with:
- `timeRange`: Time range compared
- `totalEvents`: Total events compared
- `matchingEvents`: Number of matching events
- `differingEvents`: Number of events with differences
- `matchPercentage`: Percentage of matching events
- `comparisons`: Detailed event comparisons
- `differenceSummary`: Summary of differences by type
- `topDifferences`: Most common differences
- `comparisonTimestamp`: When comparison was performed

##### `clearSnapshotCache(): void`

Clears the state snapshot cache.

##### `getSnapshotCacheStats()`

Returns snapshot cache statistics including count and timestamps.

##### `isReplayInProgress(): boolean`

Returns true if a replay is currently in progress.

##### `healthCheck(): Promise<boolean>`

Checks if the replay engine is healthy (Query API is accessible).

##### `getMetrics()`

Returns replay engine metrics including replay status and Query API metrics.

## Configuration

### Replay Speed

The `speed` parameter controls how fast events are replayed:

- **1x**: Real-time replay (100ms between events = 100ms delay)
- **10x**: 10x faster (100ms between events = 10ms delay)
- **100x**: 100x faster (100ms between events = 1ms delay)

Higher speeds are useful for quickly replaying long time periods.

### Sandbox Mode

**IMPORTANT**: Always use `sandbox: true` for safety. Production mode (`sandbox: false`) is not implemented and will result in errors.

Sandbox mode ensures that:
- Replayed decisions don't affect production systems
- No actual actions are executed
- Only simulation and analysis occur

## Examples

### Debug a Specific Incident

```typescript
// Replay decisions around an incident
const incidentTime = new Date('2024-01-15T14:30:00Z');
const windowMs = 30 * 60 * 1000; // 30 minutes

const result = await replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date(incidentTime.getTime() - windowMs),
    endTime: new Date(incidentTime.getTime() + windowMs)
  },
  sandbox: true,
  speed: 10,
  onEvent: async (event) => {
    if (event.outcome.status === 'failure') {
      console.log('Failed decision:', event);
    }
  }
});
```

### Reconstruct System State

```typescript
// Reconstruct state at a specific point in time
const state = await replayEngine.reconstructState({
  targetTimestamp: new Date('2024-01-15T14:30:00Z'),
  enableCaching: true
});

console.log(`Processed ${state.eventsProcessed} events`);
console.log(`Components: ${state.componentStates.size}`);

// Inspect component state
const scalerState = state.componentStates.get('auto-scaler');
if (scalerState) {
  console.log('Auto-scaler state:', scalerState.state);
  console.log('Last decision:', scalerState.lastDecision?.decision_type);
}
```

### Compare Outcomes

```typescript
// Compare replayed outcomes with original outcomes
const report = await replayEngine.compareOutcomes({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-02')
  },
  numericTolerance: 10 // Allow 10% variance
});

console.log(`Match rate: ${report.matchPercentage.toFixed(1)}%`);
console.log(`Differences by type:`, report.differenceSummary);

// Find events with outcome status changes
const statusChanges = report.comparisons.filter(c =>
  c.differences.some(d => d.type === 'outcome_status')
);

console.log(`Events with status changes: ${statusChanges.length}`);
```

### Analyze Decision Quality Over Time

```typescript
const qualityScores = [];

await replayEngine.replayDecisions({
  timeRange: {
    startTime: new Date('2024-01-01'),
    endTime: new Date('2024-01-31')
  },
  sandbox: true,
  speed: 100,
  onEvent: async (event) => {
    if (event.quality_score !== undefined) {
      qualityScores.push({
        timestamp: event.timestamp,
        score: event.quality_score,
        type: event.decision_type
      });
    }
  }
});

// Calculate average quality score
const avgScore = qualityScores.reduce((sum, s) => sum + s.score, 0) / qualityScores.length;
console.log(`Average quality score: ${avgScore.toFixed(2)}`);
```

### Test System Changes

```typescript
// Before deploying changes, compare outcomes
const originalEvents = await fetchOriginalEvents(timeRange);

// Replay with new code
const replayResult = await replayEngine.replayDecisions({
  timeRange,
  sandbox: true,
  speed: 100
});

// Compare outcomes
const comparison = await replayEngine.compareOutcomes({
  timeRange,
  originalEvents,
  numericTolerance: 5
});

if (comparison.matchPercentage < 95) {
  console.warn('Significant differences detected!');
  console.log('Top differences:', comparison.topDifferences);
}
```

## Error Handling

```typescript
try {
  const result = await replayEngine.replayDecisions({
    timeRange: {
      startTime: new Date('2024-01-01'),
      endTime: new Date('2024-01-02')
    },
    sandbox: true
  });
  
  // Check for errors during replay
  if (result.errors.length > 0) {
    console.error('Errors during replay:');
    result.errors.forEach(error => {
      console.error(`Event ${error.eventId}: ${error.message}`);
    });
  }
} catch (error) {
  console.error('Replay failed:', error.message);
}
```

## Performance Considerations

- **Large Time Ranges**: Replaying large time ranges can take significant time even at 100x speed
- **Memory Usage**: All events in the time range are loaded into memory before replay
- **Query Performance**: Replay speed is limited by Query API performance
- **Pagination**: The engine automatically handles pagination for large result sets

## Testing

Run the replay engine tests:

```bash
npm test test/intelligence/replayEngine.test.ts
```

## Architecture

The Replay Engine:
1. Queries the Event Store via the Query API
2. Loads all events in the specified time range
3. Sorts events chronologically
4. Replays events with appropriate delays based on speed
5. Calls callbacks for each event and progress update
6. Returns a summary result

## Future Enhancements

Planned features for future releases:
- Production mode replay (with safety controls)
- Replay checkpoints and resume
- Parallel replay for performance
- Replay visualization dashboard
- Advanced diff visualization for outcome comparison
- Machine learning-based anomaly detection in replays

## Related Components

- **Event Store**: Stores immutable decision events
- **Query API**: Provides efficient querying of indexed events
- **Decision Intelligence Engine**: Records decisions as events

## Additional Documentation

- [Outcome Comparison Guide](../../docs/OUTCOME-COMPARISON.md) - Detailed guide for comparing outcomes
- [State Reconstruction Guide](../../docs/STATE-RECONSTRUCTION.md) - Guide for time-travel debugging
- [Replay Engine Implementation](../../docs/REPLAY-ENGINE-IMPLEMENTATION.md) - Implementation details

## License

Part of the NeuralShell Autonomous Intelligence Layer.
