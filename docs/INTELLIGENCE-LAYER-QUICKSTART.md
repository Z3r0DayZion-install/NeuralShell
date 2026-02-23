# Autonomous Intelligence Layer - Quick Start Guide

This guide will help you get started with the Autonomous Intelligence Layer infrastructure.

## Overview

The Autonomous Intelligence Layer provides:

1. **Event Store** - Kafka-based immutable event log for all autonomous decisions
2. **Metrics Store** - TimescaleDB time-series database for metrics and analytics
3. **Distributed Tracing** - OpenTelemetry + Grafana Tempo for request tracing

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- At least 4GB RAM available for containers

## Quick Setup

### 1. Start Infrastructure

Run the setup script:

```bash
chmod +x scripts/setup-intelligence-layer.sh
./scripts/setup-intelligence-layer.sh
```

This will:
- Create environment configuration
- Start Kafka cluster (3 nodes)
- Start TimescaleDB with schema initialization
- Start Grafana Tempo for tracing
- Wait for all services to be ready

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `kafkajs` - Kafka client
- `pg` - PostgreSQL/TimescaleDB client
- `@opentelemetry/sdk-node` - OpenTelemetry SDK
- `@opentelemetry/exporter-trace-otlp-grpc` - OTLP exporter

### 3. Verify Installation

Run the infrastructure tests:

```bash
npm test test/intelligence/infrastructure.test.js
```

All tests should pass, confirming:
- Kafka cluster is operational
- TimescaleDB is accepting writes and queries
- Tempo is receiving traces
- Performance targets are met

## Usage Examples

### Recording Decision Events

```javascript
import { getEventStore } from './src/intelligence/eventStore.js';

const eventStore = getEventStore();
await eventStore.connect();

// Record an autonomous decision
const eventId = await eventStore.writeEvent({
  decision_type: 'scaling',
  system_component: 'auto-scaler',
  context: {
    trigger: 'high_cpu',
    metrics: { 
      cpu_usage: 85.5,
      memory_usage: 60.2,
      request_rate: 1500
    },
    state: { 
      current_instances: 2,
      target_instances: 4
    }
  },
  action_taken: {
    type: 'scale_up',
    parameters: { 
      instances_to_add: 2,
      instance_type: 't3.medium'
    }
  },
  outcome: {
    status: 'success',
    duration_ms: 1500,
    impact: { 
      instances_added: 2,
      new_capacity: 4
    }
  }
});

console.log(`Decision recorded: ${eventId}`);
```

### Ingesting Metrics

```javascript
import { getMetricsStore } from './src/intelligence/metricsStore.js';

const metricsStore = getMetricsStore();
await metricsStore.connect();

// Ingest a single metric
await metricsStore.ingestMetric({
  time: new Date(),
  metric_name: 'cpu_usage',
  value: 75.5,
  component: 'api-server',
  region: 'us-east-1',
  tags: { 
    instance: 'i-12345',
    availability_zone: 'us-east-1a'
  }
});

// Batch ingestion for high throughput
const metrics = [
  { time: new Date(), metric_name: 'requests_per_second', value: 1500, component: 'api' },
  { time: new Date(), metric_name: 'response_time_ms', value: 45, component: 'api' },
  { time: new Date(), metric_name: 'error_rate', value: 0.02, component: 'api' }
];

await metricsStore.ingestBatch(metrics);
```

### Querying Metrics

```javascript
// Query with time range and aggregation
const results = await metricsStore.queryMetrics({
  metric_name: 'cpu_usage',
  start_time: new Date(Date.now() - 3600000), // 1 hour ago
  end_time: new Date(),
  component: 'api-server',
  aggregation: 'avg',
  interval: '1 minute'
});

console.log('Average CPU usage per minute:', results);

// Calculate percentiles
const percentiles = await metricsStore.calculatePercentiles({
  metric_name: 'response_time_ms',
  start_time: new Date(Date.now() - 3600000),
  end_time: new Date(),
  percentiles: [50, 95, 99]
});

console.log('Response time percentiles:', percentiles);
// Output: { p50: 45, p95: 120, p99: 250 }
```

### Distributed Tracing

```javascript
import { initializeTracing } from './src/intelligence/tracing.js';

// Initialize tracing
const tracingManager = await initializeTracing({
  serviceName: 'neuralshell',
  serviceVersion: '1.0.0'
});

// Use with Fastify
import Fastify from 'fastify';
const fastify = Fastify();

fastify.addHook('onRequest', tracingManager.createFastifyMiddleware());

// Manual span creation
await tracingManager.withSpan('process-request', {
  attributes: { 
    'request.type': 'api',
    'user.id': '12345'
  }
}, async () => {
  // Your code here
  tracingManager.addEvent('validation-started');
  
  // ... validation logic ...
  
  tracingManager.addEvent('validation-completed');
  tracingManager.setAttribute('validation.result', 'success');
});

// Get current trace context
const traceId = tracingManager.getCurrentTraceId();
const spanId = tracingManager.getCurrentSpanId();
```

## Service Endpoints

After starting the infrastructure:

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Kafka Broker 1 | localhost:19092 | Event ingestion |
| Kafka Broker 2 | localhost:19093 | Event ingestion |
| Kafka Broker 3 | localhost:19094 | Event ingestion |
| TimescaleDB | localhost:5432 | Metrics storage |
| Tempo HTTP | localhost:3200 | Trace queries |
| Tempo OTLP gRPC | localhost:4317 | Trace ingestion |
| Tempo OTLP HTTP | localhost:4318 | Trace ingestion |

## Database Access

Connect to TimescaleDB:

```bash
docker exec -it neuralshell-timescaledb psql -U neuralshell -d neuralshell_metrics
```

Useful queries:

```sql
-- View recent metrics
SELECT * FROM metrics ORDER BY time DESC LIMIT 10;

-- View metric aggregates
SELECT * FROM metrics_1min ORDER BY bucket DESC LIMIT 10;

-- Check table sizes
SELECT 
  hypertable_name,
  pg_size_pretty(hypertable_size(format('%I.%I', hypertable_schema, hypertable_name))) as size
FROM timescaledb_information.hypertables;
```

## Kafka Management

List topics:

```bash
docker exec neuralshell-kafka-1 kafka-topics --bootstrap-server localhost:9092 --list
```

View topic details:

```bash
docker exec neuralshell-kafka-1 kafka-topics --bootstrap-server localhost:9092 --describe --topic decision-events
```

Consume events (for debugging):

```bash
docker exec neuralshell-kafka-1 kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic decision-events \
  --from-beginning \
  --max-messages 10
```

## Monitoring

### Check Service Health

```bash
# View all containers
docker-compose -f docker-compose.intelligence.yml ps

# View logs
docker-compose -f docker-compose.intelligence.yml logs -f

# View specific service logs
docker-compose -f docker-compose.intelligence.yml logs -f kafka-1
docker-compose -f docker-compose.intelligence.yml logs -f timescaledb
docker-compose -f docker-compose.intelligence.yml logs -f tempo
```

### Performance Metrics

Check Event Store metrics:

```javascript
const metrics = eventStore.getMetrics();
console.log(metrics);
// {
//   eventsWritten: 1234,
//   writeErrors: 0,
//   avgLatency: 5.2,
//   maxLatency: 12.5,
//   connected: true
// }
```

Check Metrics Store metrics:

```javascript
const metrics = metricsStore.getMetrics();
console.log(metrics);
// {
//   pointsIngested: 50000,
//   ingestErrors: 0,
//   queriesExecuted: 150,
//   queryErrors: 0,
//   connected: true
// }
```

## Troubleshooting

### Kafka Not Starting

If Kafka fails to start:

```bash
# Check logs
docker-compose -f docker-compose.intelligence.yml logs kafka-1

# Restart Kafka cluster
docker-compose -f docker-compose.intelligence.yml restart kafka-1 kafka-2 kafka-3
```

### TimescaleDB Connection Issues

```bash
# Check if TimescaleDB is ready
docker exec neuralshell-timescaledb pg_isready -U neuralshell

# Check logs
docker-compose -f docker-compose.intelligence.yml logs timescaledb

# Restart TimescaleDB
docker-compose -f docker-compose.intelligence.yml restart timescaledb
```

### Tempo Not Receiving Traces

```bash
# Check Tempo logs
docker-compose -f docker-compose.intelligence.yml logs tempo

# Verify OTLP endpoint is accessible
curl http://localhost:4318/v1/traces
```

### Reset Everything

To completely reset the infrastructure:

```bash
# Stop and remove all containers and volumes
docker-compose -f docker-compose.intelligence.yml down -v

# Restart setup
./scripts/setup-intelligence-layer.sh
```

## Production Deployment

For production deployment to Kubernetes:

```bash
# Create namespace
kubectl create namespace neuralshell-intelligence

# Update secrets
kubectl create secret generic timescaledb-secret \
  --from-literal=password='YOUR_SECURE_PASSWORD' \
  -n neuralshell-intelligence

# Deploy infrastructure
kubectl apply -f k8s/intelligence-layer.yaml

# Check status
kubectl get pods -n neuralshell-intelligence
kubectl get pvc -n neuralshell-intelligence
```

## Next Steps

1. **Integrate with Autonomous Systems** - Connect existing autonomous systems to emit decision events
2. **Build Decision Intelligence Engine** - Implement event querying, replay, and quality scoring
3. **Create Visual Command Center** - Build real-time dashboard with WebSocket streaming
4. **Add Predictive Intelligence** - Implement ML-based forecasting and anomaly detection

## Resources

- [Event Store API Documentation](../src/intelligence/README.md)
- [Metrics Store API Documentation](../src/intelligence/README.md)
- [Tracing API Documentation](../src/intelligence/README.md)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [TimescaleDB Documentation](https://docs.timescale.com/)
- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Grafana Tempo Documentation](https://grafana.com/docs/tempo/)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review test files for usage examples
3. Check Docker logs for error messages
4. Verify all prerequisites are met
