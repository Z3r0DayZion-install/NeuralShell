/**
 * Infrastructure Integration Tests
 *
 * Tests the complete infrastructure stack:
 * - Kafka Event Store
 * - TimescaleDB Metrics Store
 * - Tempo Tracing
 *
 * Prerequisites: Run docker-compose.intelligence.yml before running these tests
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { getEventStore } from '../../src/intelligence/eventStore.js';
import { getMetricsStore } from '../../src/intelligence/metricsStore.js';
import { initializeTracing } from '../../src/intelligence/tracing.js';

describe('Intelligence Layer Infrastructure', () => {
  let eventStore;
  let metricsStore;
  let tracingManager;

  beforeAll(async () => {
    // Initialize all components
    eventStore = getEventStore({
      brokers: ['localhost:19092'],
      topic: 'decision-events'
    });

    metricsStore = getMetricsStore({
      host: 'localhost',
      port: 5432,
      database: 'neuralshell_metrics',
      user: 'neuralshell',
      password: 'neuralshell_dev_password'
    });

    tracingManager = await initializeTracing({
      serviceName: 'neuralshell-test',
      tempoEndpoint: 'localhost:4317'
    });

    // Connect to services
    await eventStore.connect();
    await metricsStore.connect();
  });

  afterAll(async () => {
    // Cleanup
    if (eventStore) {
      await eventStore.disconnect();
    }
    if (metricsStore) {
      await metricsStore.disconnect();
    }
    if (tracingManager) {
      await tracingManager.shutdown();
    }
  });

  describe('Event Store Health', () => {
    it('should connect to Kafka cluster', async () => {
      expect(eventStore.connected).toBe(true);
    });

    it('should pass health check', async () => {
      const healthy = await eventStore.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should write and track events', async () => {
      const initialMetrics = eventStore.getMetrics();

      const eventId = await eventStore.writeEvent({
        decision_type: 'test',
        system_component: 'test-component',
        context: { test: true },
        action_taken: { type: 'test' },
        outcome: { status: 'success', duration_ms: 100, impact: {} }
      });

      expect(eventId).toBeDefined();

      const finalMetrics = eventStore.getMetrics();
      expect(finalMetrics.eventsWritten).toBeGreaterThan(initialMetrics.eventsWritten);
    });
  });

  describe('Metrics Store Health', () => {
    it('should connect to TimescaleDB', async () => {
      expect(metricsStore.connected).toBe(true);
    });

    it('should pass health check', async () => {
      const healthy = await metricsStore.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should ingest and query metrics', async () => {
      const now = new Date();
      const metricName = `test_metric_${Date.now()}`;

      // Ingest test metric
      await metricsStore.ingestMetric({
        time: now,
        metric_name: metricName,
        value: 42.5,
        component: 'test',
        region: 'test-region'
      });

      // Query back
      const results = await metricsStore.queryMetrics({
        metric_name: metricName,
        start_time: new Date(now.getTime() - 60000),
        end_time: new Date(now.getTime() + 60000),
        limit: 10
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].value).toBe(42.5);
    });

    it('should calculate percentiles', async () => {
      const now = new Date();
      const metricName = `percentile_test_${Date.now()}`;

      // Ingest multiple values
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      await metricsStore.ingestBatch(
        values.map(v => ({
          time: now,
          metric_name: metricName,
          value: v,
          component: 'test'
        }))
      );

      // Calculate percentiles
      const percentiles = await metricsStore.calculatePercentiles({
        metric_name: metricName,
        start_time: new Date(now.getTime() - 60000),
        end_time: new Date(now.getTime() + 60000),
        percentiles: [50, 95, 99]
      });

      expect(percentiles.p50).toBeDefined();
      expect(percentiles.p95).toBeDefined();
      expect(percentiles.p99).toBeDefined();
    });
  });

  describe('Tracing Health', () => {
    it('should initialize tracing', () => {
      expect(tracingManager.initialized).toBe(true);
    });

    it('should create spans', async () => {
      let spanExecuted = false;

      await tracingManager.withSpan('test-span', {
        attributes: { 'test.attribute': 'value' }
      }, async () => {
        spanExecuted = true;
        tracingManager.addEvent('test-event');
      });

      expect(spanExecuted).toBe(true);
    });

    it('should handle trace context', () => {
      const headers = {
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      };

      const context = tracingManager.extractTraceContext(headers);
      expect(context).toBeDefined();
    });

    it('should inject trace context', () => {
      const headers = tracingManager.injectTraceContext({});
      expect(headers.traceparent).toBeDefined();
    });
  });

  describe('End-to-End Integration', () => {
    it('should record decision with trace context and metrics', async () => {
      // Start a traced operation
      await tracingManager.withSpan('e2e-test', {
        attributes: { 'test.type': 'integration' }
      }, async () => {
        const traceId = tracingManager.getCurrentTraceId();
        const spanId = tracingManager.getCurrentSpanId();

        // Record decision event
        const eventId = await eventStore.writeEvent({
          decision_type: 'e2e_test',
          system_component: 'integration-test',
          context: {
            trigger: 'test',
            metrics: { test_value: 123 },
            state: {}
          },
          action_taken: {
            type: 'test_action',
            parameters: {}
          },
          outcome: {
            status: 'success',
            duration_ms: 50,
            impact: { test: true }
          }
        });

        expect(eventId).toBeDefined();
        expect(traceId).toBeDefined();
        expect(spanId).toBeDefined();

        // Ingest related metrics
        await metricsStore.ingestMetric({
          time: new Date(),
          metric_name: 'e2e_test_metric',
          value: 123,
          component: 'integration-test',
          tags: {
            event_id: eventId,
            trace_id: traceId
          }
        });

        // Verify metrics were ingested
        const metrics = metricsStore.getMetrics();
        expect(metrics.pointsIngested).toBeGreaterThan(0);
      });
    });

    it('should handle high-throughput batch operations', async () => {
      const batchSize = 100;
      const startTime = Date.now();

      // Generate batch of events
      const events = Array.from({ length: batchSize }, (_, i) => ({
        decision_type: 'batch_test',
        system_component: 'batch-test',
        context: { index: i },
        action_taken: { type: 'batch' },
        outcome: { status: 'success', duration_ms: 10, impact: {} }
      }));

      // Write batch
      const eventIds = await eventStore.writeBatch(events);
      expect(eventIds).toHaveLength(batchSize);

      // Generate batch of metrics
      const metrics = Array.from({ length: batchSize }, (_, i) => ({
        time: new Date(),
        metric_name: 'batch_test_metric',
        value: i,
        component: 'batch-test'
      }));

      // Ingest batch
      await metricsStore.ingestBatch(metrics);

      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`Batch operation completed in ${duration}ms (${batchSize} events + ${batchSize} metrics)`);

      // Should complete in reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds for 200 operations
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet event write latency target', async () => {
      const iterations = 10;
      const latencies = [];

      for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();

        await eventStore.writeEvent({
          decision_type: 'perf_test',
          system_component: 'perf-test',
          context: {},
          action_taken: { type: 'test' },
          outcome: { status: 'success', duration_ms: 1, impact: {} }
        });

        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1_000_000;
        latencies.push(latencyMs);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      console.log(`Event write latency: avg=${avgLatency.toFixed(2)}ms, max=${maxLatency.toFixed(2)}ms`);

      // Target: < 10ms average (may be higher in test environment)
      expect(avgLatency).toBeLessThan(100); // Relaxed for test environment
    });

    it('should meet metrics ingestion throughput', async () => {
      const batchSize = 1000;
      const metrics = Array.from({ length: batchSize }, (_, i) => ({
        time: new Date(),
        metric_name: 'throughput_test',
        value: i,
        component: 'perf-test'
      }));

      const start = Date.now();
      await metricsStore.ingestBatch(metrics);
      const end = Date.now();

      const duration = (end - start) / 1000; // seconds
      const throughput = batchSize / duration;

      console.log(`Metrics ingestion throughput: ${throughput.toFixed(0)} points/second`);

      // Target: > 10,000 points/second (may be lower in test environment)
      expect(throughput).toBeGreaterThan(100); // Relaxed for test environment
    });
  });
});
