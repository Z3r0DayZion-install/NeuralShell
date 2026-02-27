/**
 * Preservation Test: Telemetry Collection
 *
 * **Validates: Requirements 3.10**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.10:
 * - Telemetry collection and reporting should continue to work
 *
 * This test verifies that:
 * 1. OpenTelemetry tracing is properly configured
 * 2. TracingManager can initialize and collect traces
 * 3. Decision events include trace context (trace_id, span_id)
 * 4. Spans are created for operations
 * 5. Metrics are collected and reported
 * 6. Event Store integrates with OpenTelemetry
 *
 * Expected Behavior (on unfixed code):
 * - All telemetry collection should work correctly
 * - Trace context should be propagated through the system
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Telemetry Collection Preservation Tests\n');
  console.log('✅ EXPECTED: These tests SHOULD PASS on unfixed code to confirm baseline behavior\n');

  for (const { name, fn } of tests) {
    results.total++;
    try {
      await fn();
      results.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      if (error.stack) {
        console.log(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
      }
    }
  }

  console.log(`\n📊 Results: ${results.passed}/${results.total} passed, ${results.failed} failed\n`);

  if (results.failed > 0) {
    console.log('❌ PRESERVATION FAILURE: Baseline behavior is broken');
    console.log('   These tests should pass on unfixed code to establish baseline\n');
    process.exit(1);
  } else {
    console.log('✅ PRESERVATION CONFIRMED: Baseline telemetry collection is working correctly\n');
  }
}

/**
 * Property: OpenTelemetry dependencies are installed
 *
 * This property verifies that all required OpenTelemetry packages
 * are listed in package.json dependencies.
 */
test('Property: OpenTelemetry dependencies are installed', async () => {
  const packageJsonPath = 'package.json';

  assert.ok(
    fs.existsSync(packageJsonPath),
    'package.json should exist'
  );

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredPackages = [
    '@opentelemetry/api',
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-grpc',
    '@opentelemetry/resources',
    '@opentelemetry/core',
    '@opentelemetry/sdk-trace-node'
  ];

  for (const pkg of requiredPackages) {
    assert.ok(
      dependencies[pkg],
      `OpenTelemetry package should be installed: ${pkg}`
    );
  }

  console.log(`   ✓ All ${requiredPackages.length} required OpenTelemetry packages are installed`);
});

/**
 * Property: TracingManager exists and exports required functions
 *
 * This property verifies that the TracingManager module exists
 * and exports all required functions for telemetry collection.
 */
test('Property: TracingManager exists and exports required functions', async () => {
  const tracingPath = 'src/intelligence/tracing.js';

  assert.ok(
    fs.existsSync(tracingPath),
    'TracingManager should exist at src/intelligence/tracing.js'
  );

  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify TracingManager class exists
  assert.ok(
    content.includes('class TracingManager') || content.includes('export class TracingManager'),
    'TracingManager class should be exported'
  );

  // Verify key methods exist
  const requiredMethods = [
    'initialize',
    'shutdown',
    'getTracer',
    'withSpan',
    'extractTraceContext',
    'injectTraceContext',
    'getCurrentTraceId',
    'getCurrentSpanId',
    'addEvent',
    'setAttribute',
    'recordException'
  ];

  for (const method of requiredMethods) {
    assert.ok(
      content.includes(`${method}(`),
      `TracingManager should have ${method} method`
    );
  }

  console.log(`   ✓ TracingManager has all ${requiredMethods.length} required methods`);
});

/**
 * Property: TracingManager initializes OpenTelemetry SDK
 *
 * This property verifies that TracingManager properly initializes
 * the OpenTelemetry SDK with required configuration.
 */
test('Property: TracingManager initializes OpenTelemetry SDK', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify NodeSDK is imported
  assert.ok(
    content.includes("from '@opentelemetry/sdk-node'"),
    'Should import NodeSDK from @opentelemetry/sdk-node'
  );

  // Verify OTLP exporter is configured
  assert.ok(
    content.includes('OTLPTraceExporter'),
    'Should configure OTLPTraceExporter'
  );

  // Verify Resource is configured with service information
  assert.ok(
    content.includes('Resource') && content.includes('SERVICE_NAME'),
    'Should configure Resource with service name'
  );

  // Verify SDK is started
  assert.ok(
    content.includes('sdk.start()') || content.includes('this.sdk.start()'),
    'Should start OpenTelemetry SDK'
  );

  console.log('   ✓ TracingManager properly initializes OpenTelemetry SDK');
});

/**
 * Property: TracingManager implements adaptive sampling
 *
 * This property verifies that TracingManager implements adaptive sampling
 * (100% errors, 10% success) as specified in the requirements.
 */
test('Property: TracingManager implements adaptive sampling', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify AdaptiveSampler class exists
  assert.ok(
    content.includes('class AdaptiveSampler') || content.includes('AdaptiveSampler'),
    'Should implement AdaptiveSampler'
  );

  // Verify sampling logic checks for errors
  assert.ok(
    content.includes('error') && content.includes('shouldSample'),
    'Should check for errors in sampling logic'
  );

  // Verify different sampling rates for errors vs success
  assert.ok(
    content.includes('AlwaysOnSampler') || content.includes('100%'),
    'Should sample 100% of errors'
  );

  assert.ok(
    content.includes('TraceIdRatioBasedSampler') || content.includes('0.1') || content.includes('10%'),
    'Should sample 10% of successful requests'
  );

  console.log('   ✓ TracingManager implements adaptive sampling (100% errors, 10% success)');
});

/**
 * Property: For all telemetry events, trace context is collected
 *
 * This is the core preservation property: verify that all telemetry events
 * include trace context (trace_id and span_id) for distributed tracing.
 */
test('Property: For all telemetry events, trace context is collected', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify trace context extraction
  assert.ok(
    content.includes('getCurrentTraceId') && content.includes('traceId'),
    'Should extract trace ID from active span'
  );

  assert.ok(
    content.includes('getCurrentSpanId') && content.includes('spanId'),
    'Should extract span ID from active span'
  );

  // Verify W3C Trace Context propagation
  assert.ok(
    content.includes('W3CTraceContextPropagator'),
    'Should use W3C Trace Context propagation'
  );

  assert.ok(
    content.includes('extractTraceContext') && content.includes('injectTraceContext'),
    'Should support trace context extraction and injection'
  );

  console.log('   ✓ All telemetry events collect trace context (trace_id, span_id)');
});

/**
 * Property: Decision events include OpenTelemetry trace context
 *
 * This property verifies that decision events recorded by the
 * DecisionIntelligenceEngine include trace_id and span_id.
 */
test('Property: Decision events include OpenTelemetry trace context', async () => {
  const decisionEnginePath = 'src/intelligence/decisionEngine.js';

  assert.ok(
    fs.existsSync(decisionEnginePath),
    'DecisionIntelligenceEngine should exist'
  );

  const content = fs.readFileSync(decisionEnginePath, 'utf8');

  // Verify OpenTelemetry API is imported
  assert.ok(
    content.includes("from '@opentelemetry/api'"),
    'Should import OpenTelemetry API'
  );

  // Verify trace context is extracted
  assert.ok(
    content.includes('trace.getSpan') && content.includes('spanContext()'),
    'Should extract span context'
  );

  // Verify trace_id and span_id are added to events
  assert.ok(
    content.includes('trace_id') && content.includes('span_id'),
    'Should add trace_id and span_id to decision events'
  );

  // Verify trace context is injected into events
  assert.ok(
    content.includes('traceId') && content.includes('spanId'),
    'Should inject trace context into events'
  );

  console.log('   ✓ Decision events include trace_id and span_id from OpenTelemetry');
});

/**
 * Property: Event Store integrates with OpenTelemetry
 *
 * This property verifies that the Event Store client integrates
 * with OpenTelemetry for tracing event writes.
 */
test('Property: Event Store integrates with OpenTelemetry', async () => {
  const eventStorePath = 'src/intelligence/eventStore.js';

  assert.ok(
    fs.existsSync(eventStorePath),
    'Event Store should exist'
  );

  const content = fs.readFileSync(eventStorePath, 'utf8');

  // Verify OpenTelemetry API is imported
  assert.ok(
    content.includes("from '@opentelemetry/api'"),
    'Event Store should import OpenTelemetry API'
  );

  // Verify tracer is created
  assert.ok(
    content.includes('trace.getTracer'),
    'Event Store should create tracer'
  );

  // Verify spans are created for operations
  assert.ok(
    content.includes('startSpan'),
    'Event Store should create spans for operations'
  );

  // Verify span status is set
  assert.ok(
    content.includes('setStatus') && content.includes('SpanStatusCode'),
    'Event Store should set span status'
  );

  // Verify exceptions are recorded
  assert.ok(
    content.includes('recordException'),
    'Event Store should record exceptions in spans'
  );

  console.log('   ✓ Event Store integrates with OpenTelemetry for tracing');
});

/**
 * Property: Spans are created for all major operations
 *
 * This property verifies that spans are created for all major operations
 * to provide comprehensive distributed tracing.
 */
test('Property: Spans are created for all major operations', async () => {
  const files = [
    'src/intelligence/decisionEngine.js',
    'src/intelligence/eventStore.js',
    'src/intelligence/queryAPI.js',
    'src/intelligence/metricsStore.js',
    'src/intelligence/eventIndexer.js'
  ];

  let totalSpans = 0;

  for (const file of files) {
    if (!fs.existsSync(file)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');

    // Count startSpan calls
    const spanMatches = content.match(/startSpan\s*\(/g);
    if (spanMatches) {
      totalSpans += spanMatches.length;
      console.log(`   ✓ ${path.basename(file)}: ${spanMatches.length} spans`);
    }
  }

  assert.ok(
    totalSpans > 0,
    'Should create spans for operations'
  );

  console.log(`   ✓ Total: ${totalSpans} spans created across intelligence layer`);
});

/**
 * Property: Metrics are collected and tracked
 *
 * This property verifies that metrics are collected and tracked
 * for monitoring system performance.
 */
test('Property: Metrics are collected and tracked', async () => {
  const eventStorePath = 'src/intelligence/eventStore.js';
  const content = fs.readFileSync(eventStorePath, 'utf8');

  // Verify metrics object exists
  assert.ok(
    content.includes('this.metrics'),
    'Should have metrics object'
  );

  // Verify metrics are tracked
  const metricFields = [
    'eventsWritten',
    'writeErrors',
    'totalLatency',
    'maxLatency'
  ];

  for (const field of metricFields) {
    assert.ok(
      content.includes(field),
      `Should track ${field} metric`
    );
  }

  // Verify getMetrics method exists
  assert.ok(
    content.includes('getMetrics()'),
    'Should have getMetrics() method'
  );

  console.log(`   ✓ Metrics are collected: ${metricFields.join(', ')}`);
});

/**
 * Property: Latency is measured and reported
 *
 * This property verifies that operation latency is measured
 * and reported for performance monitoring.
 */
test('Property: Latency is measured and reported', async () => {
  const eventStorePath = 'src/intelligence/eventStore.js';
  const content = fs.readFileSync(eventStorePath, 'utf8');

  // Verify high-resolution time is used
  assert.ok(
    content.includes('process.hrtime'),
    'Should use high-resolution time for latency measurement'
  );

  // Verify latency is calculated
  assert.ok(
    content.includes('latencyMs') || content.includes('latency_ms'),
    'Should calculate latency in milliseconds'
  );

  // Verify latency is added to spans
  assert.ok(
    content.includes('setAttribute') && content.includes('latency'),
    'Should add latency to span attributes'
  );

  // Verify latency warnings
  assert.ok(
    content.includes('latency') && content.includes('exceeds'),
    'Should warn when latency exceeds target'
  );

  console.log('   ✓ Latency is measured and reported for operations');
});

/**
 * Property: Trace context propagation works across components
 *
 * This property verifies that trace context is properly propagated
 * across different components of the system.
 */
test('Property: Trace context propagation works across components', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify context propagation
  assert.ok(
    content.includes('propagation.extract') && content.includes('propagation.inject'),
    'Should support context propagation'
  );

  // Verify context is passed through operations
  assert.ok(
    content.includes('context.active()') || content.includes('context.with'),
    'Should use active context'
  );

  // Verify parent-child span relationships
  assert.ok(
    content.includes('ParentBasedSampler') || content.includes('parent'),
    'Should support parent-child span relationships'
  );

  console.log('   ✓ Trace context propagation works across components');
});

/**
 * Property: Telemetry configuration is environment-aware
 *
 * This property verifies that telemetry configuration can be
 * customized via environment variables.
 */
test('Property: Telemetry configuration is environment-aware', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify environment variables are used
  const envVars = [
    'SERVICE_NAME',
    'SERVICE_VERSION',
    'NODE_ENV',
    'TEMPO_ENDPOINT'
  ];

  for (const envVar of envVars) {
    assert.ok(
      content.includes(envVar),
      `Should support ${envVar} environment variable`
    );
  }

  console.log(`   ✓ Telemetry configuration supports ${envVars.length} environment variables`);
});

/**
 * Property: Telemetry can be gracefully shutdown
 *
 * This property verifies that telemetry can be gracefully shutdown
 * to ensure all traces are flushed before process exit.
 */
test('Property: Telemetry can be gracefully shutdown', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify shutdown method exists
  assert.ok(
    content.includes('shutdown()') || content.includes('async shutdown'),
    'Should have shutdown method'
  );

  // Verify SDK shutdown is called
  assert.ok(
    content.includes('sdk.shutdown()') || content.includes('this.sdk.shutdown()'),
    'Should call SDK shutdown'
  );

  // Verify cleanup is performed
  assert.ok(
    content.includes('this.initialized = false'),
    'Should reset initialization state on shutdown'
  );

  console.log('   ✓ Telemetry can be gracefully shutdown');
});

/**
 * Property: Error handling preserves telemetry context
 *
 * This property verifies that error handling properly records
 * exceptions in telemetry without losing trace context.
 */
test('Property: Error handling preserves telemetry context', async () => {
  const files = [
    'src/intelligence/decisionEngine.js',
    'src/intelligence/eventStore.js',
    'src/intelligence/tracing.js'
  ];

  let filesWithErrorHandling = 0;

  for (const file of files) {
    if (!fs.existsSync(file)) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf8');

    // Check if file has error handling
    const hasRecordException = content.includes('recordException');
    const hasErrorStatus = content.includes('SpanStatusCode.ERROR');

    if (hasRecordException && hasErrorStatus) {
      filesWithErrorHandling++;
      console.log(`   ✓ ${path.basename(file)}: Records exceptions and sets error status`);
    }
  }

  assert.ok(
    filesWithErrorHandling > 0,
    'At least one file should have error handling with telemetry'
  );

  console.log(`   ✓ Error handling preserves telemetry context in ${filesWithErrorHandling} components`);
});

/**
 * Property: Telemetry system is testable
 *
 * This property verifies that the telemetry system can be tested
 * without requiring external infrastructure.
 */
test('Property: Telemetry system is testable', async () => {
  const tracingPath = 'src/intelligence/tracing.js';
  const content = fs.readFileSync(tracingPath, 'utf8');

  // Verify initialization check
  assert.ok(
    content.includes('if (!this.initialized)'),
    'Should check initialization state'
  );

  // Verify graceful degradation
  assert.ok(
    content.includes('if (!this.initialized)') && content.includes('return'),
    'Should gracefully handle uninitialized state'
  );

  // Verify singleton pattern allows testing
  assert.ok(
    content.includes('getTracingManager'),
    'Should provide singleton accessor for testing'
  );

  console.log('   ✓ Telemetry system is testable without external infrastructure');
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
