# Event Indexer

The Event Indexer is a Kafka consumer that reads Decision_Events from the event stream and builds secondary indexes in PostgreSQL for efficient querying.

## Overview

The Event Indexer enables fast queries on decision events by:
- Consuming events from Kafka in real-time
- Building secondary indexes for `decision_type`, `system_component`, and `outcome_status`
- Storing indexed data in PostgreSQL with optimized query patterns
- Supporting batch processing for high throughput

## Architecture

```
Kafka (decision-events topic)
    ↓
Event Indexer Consumer
    ↓
PostgreSQL (decision_event_indexes table)
    ↓
Query API (fast lookups)
```

## Database Schema

The `decision_event_indexes` table stores indexed events:

```sql
CREATE TABLE decision_event_indexes (
    event_id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    decision_type TEXT NOT NULL,
    system_component TEXT NOT NULL,
    outcome_status TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    quality_score DOUBLE PRECISION,
    event_data JSONB NOT NULL,
    indexed_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

Secondary indexes for efficient querying:

- `idx_decision_type_time` - Query by decision type and time range
- `idx_component_time` - Query by system component and time range
- `idx_outcome_time` - Query by outcome status and time range
- `idx_timestamp` - Query by time range only
- `idx_trace_id` - Query by trace ID for distributed tracing
- `idx_type_component_time` - Composite index for combined queries
- `idx_event_data_gin` - GIN index for flexible JSONB queries

## Usage

### Starting the Indexer

```bash
# Using the CLI script
node scripts/run-event-indexer.mjs

# With custom configuration
KAFKA_BROKERS=kafka1:9092,kafka2:9092 \
POSTGRES_HOST=localhost \
POSTGRES_PORT=5432 \
BATCH_SIZE=200 \
node scripts/run-event-indexer.mjs
```

### Programmatic Usage

```javascript
import { EventIndexer } from './src/intelligence/eventIndexer.js';

const indexer = new EventIndexer({
  kafkaBrokers: ['localhost:19092'],
  kafkaTopic: 'decision-events',
  kafkaGroupId: 'event-indexer-group',
  pgHost: 'localhost',
  pgPort: 5432,
  pgDatabase: 'neuralshell_metrics',
  pgUser: 'neuralshell',
  pgPassword: 'password',
  batchSize: 100,
  batchTimeoutMs: 5000
});

// Connect and start
await indexer.connect();
await indexer.start();

// Get metrics
const metrics = indexer.getMetrics();
console.log('Events indexed:', metrics.eventsIndexed);

// Health check
const health = await indexer.healthCheck();
console.log('Healthy:', health.healthy);

// Stop and disconnect
await indexer.stop();
await indexer.disconnect();
```

## Configuration

### Kafka Configuration

- `kafkaBrokers` - Array of Kafka broker addresses (default: `['localhost:19092']`)
- `kafkaTopic` - Topic to consume from (default: `'decision-events'`)
- `kafkaGroupId` - Consumer group ID (default: `'event-indexer-group'`)
- `kafkaClientId` - Client ID for Kafka (default: `'neuralshell-event-indexer'`)

### PostgreSQL Configuration

- `pgHost` - PostgreSQL host (default: `'localhost'`)
- `pgPort` - PostgreSQL port (default: `5432`)
- `pgDatabase` - Database name (default: `'neuralshell_metrics'`)
- `pgUser` - Database user (default: `'neuralshell'`)
- `pgPassword` - Database password (required)
- `pgMaxConnections` - Max connection pool size (default: `20`)

### Batch Processing Configuration

- `batchSize` - Number of events to batch before indexing (default: `100`)
- `batchTimeoutMs` - Max time to wait before processing partial batch (default: `5000`)
- `autoCommit` - Enable auto-commit of Kafka offsets (default: `true`)
- `autoCommitInterval` - Auto-commit interval in ms (default: `5000`)

## Performance

### Throughput

- Processes events in batches for high throughput
- Default batch size of 100 events
- Typical indexing latency: 50-200ms per batch
- Can handle 10,000+ events/second with proper tuning

### Optimization Tips

1. **Increase Batch Size**: For high-volume scenarios, increase `batchSize` to 200-500
2. **Tune Batch Timeout**: Reduce `batchTimeoutMs` for lower latency, increase for higher throughput
3. **Connection Pool**: Increase `pgMaxConnections` for parallel processing
4. **Kafka Partitions**: Use multiple partitions and consumer instances for horizontal scaling

## Monitoring

### Metrics

The indexer exposes the following metrics:

```javascript
{
  eventsConsumed: 1000,      // Total events consumed from Kafka
  eventsIndexed: 1000,       // Total events indexed in PostgreSQL
  indexErrors: 0,            // Number of indexing errors
  batchesProcessed: 10,      // Number of batches processed
  totalLatency: 1500,        // Total latency in ms
  maxLatency: 200,           // Max batch latency in ms
  avgLatency: 150,           // Average batch latency in ms
  running: true,             // Whether consumer is running
  connected: true,           // Whether connected to Kafka and PostgreSQL
  batchSize: 50              // Current batch size
}
```

### Health Checks

```javascript
const health = await indexer.healthCheck();
// { healthy: true } or { healthy: false, reason: 'error message' }
```

## Error Handling

### Retry Logic

- Failed batches are automatically retried
- Kafka consumer has built-in retry with exponential backoff
- PostgreSQL transactions ensure atomicity

### Duplicate Handling

- Uses `ON CONFLICT` to handle duplicate events
- Updates `quality_score` if event is re-indexed
- Maintains `indexed_at` timestamp for tracking

### Graceful Shutdown

The indexer handles graceful shutdown:
1. Stops consuming new messages
2. Processes remaining events in batch
3. Commits Kafka offsets
4. Closes PostgreSQL connections

## Querying Indexed Events

### Example Queries

```sql
-- Query by decision type
SELECT * FROM decision_event_indexes
WHERE decision_type = 'scaling'
ORDER BY timestamp DESC
LIMIT 100;

-- Query by component and time range
SELECT * FROM decision_event_indexes
WHERE system_component = 'auto-scaler'
  AND timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;

-- Query by outcome status
SELECT * FROM decision_event_indexes
WHERE outcome_status = 'failure'
ORDER BY timestamp DESC;

-- Query by multiple criteria
SELECT * FROM decision_event_indexes
WHERE decision_type = 'healing'
  AND system_component = 'self-healing'
  AND outcome_status = 'success'
  AND timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Query by trace ID (for distributed tracing)
SELECT * FROM decision_event_indexes
WHERE trace_id = '1234567890abcdef'
ORDER BY timestamp;

-- Aggregate queries
SELECT 
  decision_type,
  outcome_status,
  COUNT(*) as count,
  AVG(quality_score) as avg_quality
FROM decision_event_indexes
WHERE timestamp >= NOW() - INTERVAL '1 day'
GROUP BY decision_type, outcome_status;
```

## Integration with Query API

The indexed events are consumed by the Query API (Task 6.2) which provides:
- REST API for querying events
- Filtering by type, component, outcome, time range
- Pagination support
- Full-text search on event data

## Requirements

Implements **Requirement 2.1**: Decision Audit Trail
- Provides query capabilities by time range, decision type, and system component
- Enables sub-500ms query performance through secondary indexes
- Supports filtering by outcome (success, failure, partial)

## Related Components

- **Event Store** (`eventStore.js`) - Writes events to Kafka
- **Decision Engine** (`decisionEngine.ts`) - Records decisions
- **Query API** (Task 6.2) - Provides REST API for querying indexed events

## Testing

Run tests:

```bash
npm test test/intelligence/eventIndexer.test.js
```

Tests cover:
- Connection to Kafka and PostgreSQL
- Single event indexing
- Batch event indexing
- Secondary index creation
- Duplicate event handling
- Metrics tracking
- Health checks

## Deployment

### Docker Compose

The indexer is included in the intelligence layer docker-compose:

```bash
docker-compose -f docker-compose.intelligence.yml up -d
```

### Kubernetes

Deploy using the intelligence layer manifest:

```bash
kubectl apply -f k8s/intelligence-layer.yaml
```

### Scaling

For high-volume scenarios, deploy multiple indexer instances:
- Each instance joins the same consumer group
- Kafka automatically distributes partitions across instances
- Horizontal scaling for increased throughput

## Troubleshooting

### Consumer Lag

If consumer lag increases:
1. Check PostgreSQL performance
2. Increase batch size
3. Add more consumer instances
4. Optimize database indexes

### Connection Issues

If connection fails:
1. Verify Kafka brokers are accessible
2. Check PostgreSQL connection settings
3. Ensure network connectivity
4. Review firewall rules

### Indexing Errors

If indexing errors occur:
1. Check PostgreSQL logs
2. Verify table schema matches
3. Review event data format
4. Check disk space and resources

## Future Enhancements

- [ ] Support for Elasticsearch as alternative index store
- [ ] Real-time index updates via WebSocket
- [ ] Automatic index optimization
- [ ] Multi-region index replication
- [ ] Custom index definitions
