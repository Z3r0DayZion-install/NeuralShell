#!/usr/bin/env node

import { buildServer } from '../router.js';
import fetch from 'node-fetch';

const PORT = 9999;
const PAYLOAD = {
  messages: [
    { role: 'user', content: 'Hello, how are you?' }
  ]
};

async function benchmark() {
  console.log('🚀 Performance Benchmarking Suite\n');

  const fastify = buildServer({
    endpoints: [
      { name: 'mock-1', url: 'http://localhost:9998/mock', model: 'test-1' },
      { name: 'mock-2', url: 'http://localhost:9998/mock', model: 'test-2' }
    ]
  });

  await fastify.listen({ port: PORT, host: 'localhost' });
  console.log(`✓ Router started on port ${PORT}\n`);

  const scenarios = [
    { name: 'Sequential Requests', concurrency: 1, count: 100 },
    { name: 'Moderate Concurrency', concurrency: 10, count: 100 },
    { name: 'High Concurrency', concurrency: 50, count: 100 },
    { name: 'Stress Test', concurrency: 100, count: 200 }
  ];

  for (const scenario of scenarios) {
    await runScenario(scenario);
  }

  await fastify.close();
  console.log('\n✅ Benchmarking complete!');
}

async function runScenario({ name, concurrency, count }) {
  console.log(`\n📊 Scenario: ${name}`);
  console.log(`   Concurrency: ${concurrency}, Total Requests: ${count}`);

  const results = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    latencies: [],
    errors: {}
  };

  const startTime = Date.now();

  // Send requests in batches
  for (let i = 0; i < count; i += concurrency) {
    const batch = [];
    for (let j = 0; j < concurrency && i + j < count; j++) {
      batch.push(sendRequest(results));
    }
    await Promise.all(batch);
  }

  const totalTime = Date.now() - startTime;
  const throughput = (results.totalRequests / totalTime * 1000).toFixed(2);

  // Calculate latency stats
  const sorted = results.latencies.sort((a, b) => a - b);
  const minLatency = sorted[0] || 0;
  const maxLatency = sorted[sorted.length - 1] || 0;
  const avgLatency = sorted.length > 0 ? (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(2) : 0;
  const p95Latency = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99Latency = sorted[Math.floor(sorted.length * 0.99)] || 0;

  console.log(`   ✓ Total Time: ${totalTime}ms`);
  console.log(`   ✓ Throughput: ${throughput} req/sec`);
  console.log(`   ✓ Success Rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%`);
  console.log(`   ✓ Latency:`);
  console.log(`     - Min: ${minLatency}ms`);
  console.log(`     - Avg: ${avgLatency}ms`);
  console.log(`     - Max: ${maxLatency}ms`);
  console.log(`     - P95: ${p95Latency}ms`);
  console.log(`     - P99: ${p99Latency}ms`);

  if (results.failedRequests > 0) {
    console.log(`   ⚠ Failed: ${results.failedRequests}`);
  }

  if (Object.keys(results.errors).length > 0) {
    console.log(`   Errors:`, results.errors);
  }
}

async function sendRequest(results) {
  results.totalRequests++;

  try {
    const startLatency = Date.now();

    // Mock call without upstream
    const response = await fetch(`http://localhost:${PORT}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-dry-run': '1'
      },
      body: JSON.stringify(PAYLOAD)
    });

    const latency = Date.now() - startLatency;
    results.latencies.push(latency);

    if (response.ok) {
      results.successfulRequests++;
    } else {
      results.failedRequests++;
      const code = response.status;
      results.errors[code] = (results.errors[code] || 0) + 1;
    }
  } catch (err) {
    results.failedRequests++;
    const errType = err.code || err.name || 'UNKNOWN';
    results.errors[errType] = (results.errors[errType] || 0) + 1;
  }
}

benchmark().catch((err) => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
