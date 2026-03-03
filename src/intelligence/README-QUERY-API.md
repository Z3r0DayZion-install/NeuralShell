# Decision Query API

## Overview

The Decision Query API provides efficient querying of indexed decision events with filtering, pagination, and sub-500ms response times. It uses PostgreSQL indexes created by the Event Indexer to enable fast lookups across millions of events.

## Architecture

```
Decision Events (Kafka)
    ↓
Event Indexer (Task 6.1)
    ↓
PostgreSQL (decision_event_indexes table)
    ↓
Query API (fast lookups)
```

## Features

- **Time Range Filtering**: Query events within specific time windows
- **Type Filtering**: Filter by decision type, system component, outcome status
- **Quality Score Filtering**: Find high/low quality decisions
- **Trace Filtering**: Query all decisions in a distributed trace
- **Cursor-Based Pagination**: Efficient pagination for large result sets
- **Sub-500ms Performance**: Optimized queries using PostgreSQL indexes
- **Flexible Sorting**: Sort by timestamp in ascending or descending order

## Usage

### Basic Query

```javascript
import { DecisionQueryAPI, DecisionQuery } from './queryAPI.js';

// Create API instance
const queryAPI = new DecisionQueryAPI();
await queryAPI.connect();

// Query all recent decisions
const query = new DecisionQuery({
  limit: 100,
  sortOrder: 'desc'
});

const result = await queryAPI.queryDecisions(query);

console.log(`Found ${result.count} events`);
console.log(`Has more: ${result.hasMore}`);
console.log(`Next cursor: ${result.nextCursor}`);

// Access events
result.events.forEach(event => {
  console.log(`${event.event_id}: ${event.decision_type} - ${event.outcome.status}`);
});
```

### Filter by Decision Type

```javascript
const query = new DecisionQuery({
  decisionTypes: ['scaling', 'healing'],
  limit: 50
});

const result = await queryAPI.queryDecisions(query);
```

### Filter by Time Range

```javascript
const query = new DecisionQuery({
  startTime: new Date('2024-01-01T00:00:00Z'),
  endTime: new Date('2024-01-31T23:59:59Z'),
  limit: 100
});

const result = await queryAPI.queryDecisions(query);
```

### Filter by Outcome Status

```javascript
const query = new DecisionQuery({
  outcomeStatuses: ['failure', 'partial'],
  limit: 100
});

const result = await queryAPI.queryDecisions(query);
```

### Filter by Quality Score

```javascript
// Find low quality decisions
const query = new DecisionQuery({
  maxQualityScore: 60,
  limit: 100
});

const result = await queryAPI.queryDecisions(query);
```

### Filter by Trace ID

```javascript
// Get all decisions in a distributed trace
const query = new DecisionQuery({
  traceId: 'abc123def456',
  limit: 100
});

const result = await queryAPI.queryDecisions(query);
```

### Combine Multiple Filters

```javascript
const query = new DecisionQuery({
  decisionTypes: ['scaling'],
  systemComponents: ['auto-scaler'],
  outcomeStatuses: ['success'],
  minQualityScore: 80,
  startTime: new Date('2024-01-01'),
  endTime: new Date('2024-01-31'),
  limit: 50
});

const result = await queryAPI.queryDecisions(query);
```

### Pagination

```javascript
// First page
const query1 = new DecisionQuery({
  limit: 100,
  sortOrder: 'desc'
});

const result1 = await queryAPI.queryDecisions(query1);

// Second page using cursor
if (result1.hasMore) {
  const query2 = new DecisionQuery({
    limit: 100,
    cursor: result1.nextCursor,
    sortOrder: 'desc'
  });
  
  const result2 = await queryAPI.queryDecisions(query2);
}
```

### Iterate Through All Results

```javascript
async function getAllEvents(baseQuery) {
  const allEvents = [];
  let cursor = null;
  
  do {
    const query = new DecisionQuery({
      ...baseQuery,
      cursor,
      limit: 100
    });
    
    const result = await queryAPI.queryDecisions(query);
    allEvents.push(...result.events);
    
    cursor = result.nextCursor;
  } while (cursor);
  
  return allEvents;
}

// Usage
const events = await getAllEvents({
  decisionTypes: ['scaling'],
  startTime: new Date('2024-01-01')
});
```

## Query Parameters

### DecisionQuery Options

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `startTime` | Date/number | Start of time range (inclusive) | undefined |
| `endTime` | Date/number | End of time range (inclusive) | undefined |
| `decisionTypes` | string[] | Filter by decision types | undefined |
| `systemComponents` | string[] | Filter by system components | undefined |
| `outcomeStatuses` | string[] | Filter by outcome status | undefined |
| `minQualityScore` | number | Minimum quality score (0-100) | undefined |
| `maxQualityScore` | number | Maximum quality score (0-100) | undefined |
| `traceId` | string | Filter by trace ID | undefined |
| `limit` | number | Max results per page (1-1000) | 100 |
| `cursor` | string | Pagination cursor | undefined |
| `sortOrder` | 'asc'/'desc' | Sort order by timestamp | 'desc' |

### QueryResult Structure

```typescript
{
  events: DecisionEvent[],  // Array of decision events
  count: number,             // Number of events in this page
  hasMore: boolean,          // Whether there are more results
  nextCursor: string | null  // Cursor for next page
}
```

## Performance

### Query Performance Targets

- **Sub-500ms**: All queries complete within 500ms (Requirement 2.2)
- **Indexed Lookups**: Uses PostgreSQL B-tree and GIN indexes
- **Efficient Pagination**: Cursor-based pagination avoids OFFSET overhead

### Index Usage

The Query API leverages these PostgreSQL indexes:

1. **idx_decision_type_time**: Fast lookups by decision type + time
2. **idx_component_time**: Fast lookups by component + time
3. **idx_outcome_time**: Fast lookups by outcome + time
4. **idx_timestamp**: Fast time range queries
5. **idx_trace_id**: Fast trace lookups
6. **Composite indexes**: Optimized for common filter combinations

### Performance Tips

1. **Use time ranges**: Narrow queries with startTime/endTime
2. **Limit results**: Use appropriate limit values (default 100)
3. **Use cursors**: Cursor-based pagination is more efficient than offset
4. **Combine filters**: Multiple filters use composite indexes efficiently

## Monitoring

### Metrics

```javascript
const metrics = queryAPI.getMetrics();

console.log(`Queries executed: ${metrics.queriesExecuted}`);
console.log(`Average latency: ${metrics.avgLatency.toFixed(2)}ms`);
console.log(`Max latency: ${metrics.maxLatency.toFixed(2)}ms`);
console.log(`Query errors: ${metrics.queryErrors}`);
```

### Health Check

```javascript
const health = await queryAPI.healthCheck();

if (health.healthy) {
  console.log('Query API is healthy');
} else {
  console.error(`Query API unhealthy: ${health.reason}`);
}
```

## Error Handling

```javascript
try {
  const query = new DecisionQuery({
    limit: 100
  });
  
  const result = await queryAPI.queryDecisions(query);
} catch (error) {
  if (error.message.includes('Invalid query')) {
    console.error('Query validation failed:', error.message);
  } else if (error.message.includes('Query failed')) {
    console.error('Database error:', error.message);
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Integration with Decision Engine

The Query API works seamlessly with the Decision Intelligence Engine:

```javascript
import { getDecisionEngine } from './decisionEngine.js';
import { getQueryAPI } from './queryAPI.js';

// Record a decision
const engine = getDecisionEngine();
await engine.connect();

await engine.recordDecision({
  decision_type: 'scaling',
  system_component: 'auto-scaler',
  context: { trigger: 'cpu_high', metrics: {}, state: {} },
  action_taken: { type: 'scale_up', parameters: {} },
  outcome: { status: 'success', duration_ms: 100, impact: {} }
});

// Wait for indexing (typically < 5 seconds)
await new Promise(resolve => setTimeout(resolve, 5000));

// Query the decision
const queryAPI = getQueryAPI();
await queryAPI.connect();

const query = new DecisionQuery({
  decisionTypes: ['scaling'],
  limit: 10
});

const result = await queryAPI.queryDecisions(query);
console.log(`Found ${result.count} scaling decisions`);
```

## Requirements Satisfied

- **Requirement 2.1**: Query capabilities by time range, decision type, and system component
- **Requirement 2.2**: Sub-500ms query performance for 30-day spans
- **Requirement 2.3**: Filtering by outcome (success, failure, partial)
- **Requirement 2.4**: Pagination with page sizes up to 1000 events

## Next Steps

1. **Task 6.3**: Write property tests for query filtering correctness
2. **Task 6.4**: Write property tests for query performance
3. **Task 6.5**: Write property tests for pagination correctness
4. **Phase 3**: Integrate with Visual Command Center for real-time querying

## See Also

- [Event Indexer Documentation](./README-EVENT-INDEXER.md)
- [Decision Engine Documentation](./README-DECISION-ENGINE.md)
- [Event Store Documentation](./eventStore.js)
