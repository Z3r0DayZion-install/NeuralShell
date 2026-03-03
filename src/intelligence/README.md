# Autonomous Intelligence Layer

The Autonomous Intelligence Layer provides event sourcing, time-series metrics, and distributed tracing infrastructure for NeuralShell's autonomous systems.

## Components

### Types (`types.ts`)

TypeScript interfaces and types for Decision Intelligence Engine with comprehensive validation.

**Features:**
- Complete DecisionEvent interface with all required fields
- Type definitions for decision_type, outcome status, and system components
- Validation functions with detailed error reporting
- Type guards for runtime type checking
- Support for partial events (before IDs are assigned)

**Usage:**
```javascript
import { validateDecisionEvent, isDecisionEvent } from './intelligence/types.js';

// Validate an event
const result = validateDecisionEvent(event);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Type guard
if (isDecisionEvent(event)) {
  console.log(`Valid event: ${event.event_id}`);
}
```

See [types.md](./types.md) for complete documentation.

### Event Store (`eventStore.js`)

Kafka-based event store for recording all autonomous decisions with immutability and durability guarantees.

**Features:**
- UUID v7 time-ordered event IDs
- Sub-10ms persistence latency target
- Durability with acknowledgment waiting (acks=-1)
- Batch ingestion support
- Automatic partitioning by decision_type
- OpenTelemetry trace context injection

**Usage:**
```javascript
import { getEventStore } from './intelligence/eventStore.js';

const eventStore = getEventStore();
await eventStore.connect();

// Write a decision event
const eventId = await eventStore.writeEvent({
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
});
```

### Metrics Store (`metricsStore.js`)

TimescaleDB-based time-series database for metrics storage with automatic downsampling and compression.

**Features:**
- 1-second granularity with automatic downsampling
- Batch ingestion for high throughput
- Time-range queries with aggregation
- Percentile calculations (p50, p95, p99)
- Automatic compression (10-20x reduction)
- 90-day retention for raw data

**Usage:**
```javascript
import { getMetricsStore } from './intelligence/metricsStore.js';

const metricsStore = getMetricsStore();
await metricsStore.connect();

// Ingest a metric
await metricsStore.ingestMetric({
  time: new Date(),
  metric_name: 'cpu_usage',
  value: 75.5,
  component: 'api-server',
  region: 'us-east-1',
  tags: { instance: 'i-12345' }
});

// Query metrics with aggregation
const results = await metricsStore.queryMetrics({
  metric_name: 'cpu_usage',
  start_time: new Date(Date.now() - 3600000), // 1 hour ago
  end_time: new Date(),
  component: 'api-server',
  aggregation: 'avg',
  interval: '1 minute'
});

// Calculate percentiles
const percentiles = await metricsStore.calculatePercentiles({
  metric_name: 'response_time',
  start_time: new Date(Date.now() - 3600000),
  end_time: new Date(),
  percentiles: [50, 95, 99]
});
```

### Tracing Manager (`tracing.js`)

OpenTelemetry-based distributed tracing with adaptive sampling and W3C Trace Context propagation.

**Features:**
- Adaptive sampling (100% errors, 10% success)
- W3C Trace Context propagation
- Grafana Tempo integration via OTLP gRPC
- Fastify middleware for automatic request tracing
- Span helpers for custom instrumentation

**Usage:**
```javascript
import { initializeTracing } from './intelligence/tracing.js';

// Initialize tracing
const tracingManager = await initializeTracing({
  serviceName: 'neuralshell',
  serviceVersion: '1.0.0',
  tempoEndpoint: 'localhost:4317'
});

// Use in Fastify
fastify.addHook('onRequest', tracingManager.createFastifyMiddleware());

// Manual span creation
await tracingManager.withSpan('my-operation', {
  attributes: { 'operation.type': 'compute' }
}, async () => {
  // Your code here
  tracingManager.addEvent('processing-started');
  // ...
  tracingManager.addEvent('processing-completed');
});

// Get current trace context
const traceId = tracingManager.getCurrentTraceId();
const spanId = tracingManager.getCurrentSpanId();
```

## Infrastructure Setup

### Docker Compose (Development)

Start all infrastructure components:

```bash
docker-compose -f docker-compose.intelligence.yml up -d
```

This starts:
- 3-node Kafka cluster with Zookeeper
- TimescaleDB with automatic initialization
- Grafana Tempo for trace storage

### Kubernetes (Production)

Deploy to Kubernetes:

```bash
kubectl apply -f k8s/intelligence-layer.yaml
```

This creates:
- `neuralshell-intelligence` namespace
- Kafka StatefulSet (3 replicas)
- Zookeeper StatefulSet
- TimescaleDB StatefulSet with persistent storage
- Tempo StatefulSet with persistent storage
- Required Services and ConfigMaps

### Environment Variables

```bash
# Kafka
KAFKA_BROKERS=localhost:19092,localhost:19093,localhost:19094

# TimescaleDB
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DB=neuralshell_metrics
TIMESCALE_USER=neuralshell
TIMESCALE_PASSWORD=your_password

# Tempo
TEMPO_ENDPOINT=localhost:4317

# Service Info
SERVICE_NAME=neuralshell
SERVICE_VERSION=1.0.0
NODE_ENV=production
```

## Database Schema

### TimescaleDB Tables

**metrics** - Raw time-series metrics
- `time` - Timestamp (TIMESTAMPTZ)
- `metric_name` - Metric name (TEXT)
- `value` - Metric value (DOUBLE PRECISION)
- `tags` - Additional tags (JSONB)
- `component` - System component (TEXT)
- `region` - Region (TEXT)

**decision_quality_scores** - Quality scores for decisions
- `time` - Timestamp
- `event_id` - Event ID reference
- `decision_type` - Type of decision
- `component` - System component
- `quality_score` - Score 0-100
- `effectiveness_score` - Effectiveness component
- `response_time_score` - Response time component
- `cost_impact_score` - Cost impact component

**request_costs** - Per-request cost tracking
- `time` - Timestamp
- `request_id` - Request ID
- `endpoint` - API endpoint
- `user_id` - User ID
- `region` - Region
- `compute_cost` - Compute cost
- `storage_cost` - Storage cost
- `network_cost` - Network cost
- `api_cost` - API call cost
- `total_cost` - Total cost

**prediction_accuracy** - ML prediction accuracy tracking
- `time` - Timestamp
- `prediction_id` - Prediction ID
- `prediction_type` - Type of prediction
- `predicted_value` - Predicted value
- `actual_value` - Actual value
- `error` - Prediction error
- `confidence` - Confidence score

### Kafka Topics

**decision-events** - All autonomous decision events
- Partitions: 12 (partitioned by decision_type)
- Replication Factor: 3
- Retention: 90 days (7776000000 ms)
- Compression: LZ4

## Testing

Run tests:

```bash
# Event Store tests
npm test test/intelligence/eventStore.test.js

# Integration tests (requires infrastructure running)
docker-compose -f docker-compose.intelligence.yml up -d
npm test test/intelligence/
```

## Performance Targets

- **Event Store Write Latency**: < 10ms (p99)
- **Metrics Ingestion**: > 10,000 points/second
- **Query Performance**: < 500ms for 30-day queries (p99)
- **Trace Sampling**: 100% errors, 10% success
- **Storage Compression**: 10-20x for time-series data

## Next Steps

Phase 2 will implement:
- Decision Intelligence Engine (event recording, querying, replay)
- Quality scoring for autonomous decisions
- A/B testing for autonomous strategies
- Event-driven architecture integration with existing autonomous systems

## Requirements Mapping

This implementation satisfies:
- **1.1-1.5**: Event Store with Kafka
- **15.1-15.5**: OpenTelemetry tracing
- **49.1-49.5**: Event Store infrastructure
- **50.1-50.5**: Time-Series Database
