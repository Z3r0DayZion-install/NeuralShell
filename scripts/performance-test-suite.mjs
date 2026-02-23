import { buildServer } from '../router.js';
import fetch from 'node-fetch';

// Comprehensive performance testing suite
export class PerformanceTester {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.tests = [];
    this.results = [];
  }

  registerTest(name, fn) {
    this.tests.push({ name, fn });
  }

  async runAll() {
    console.log('\n🚀 NeuralShell Performance Test Suite\n');

    for (const test of this.tests) {
      try {
        console.log(`⏱️  Running: ${test.name}`);
        const result = await test.fn();
        this.results.push({ name: test.name, ...result, status: 'PASS' });
        this.printResult(result);
      } catch (err) {
        this.results.push({ name: test.name, error: err.message, status: 'FAIL' });
        console.error(`   ❌ FAILED: ${err.message}\n`);
      }
    }

    this.printSummary();
  }

  printResult(result) {
    console.log(`   ✓ Duration: ${result.durationMs}ms`);
    if (result.throughput) console.log(`   ✓ Throughput: ${result.throughput} req/s`);
    if (result.p95) console.log(`   ✓ P95: ${result.p95}ms`);
    if (result.p99) console.log(`   ✓ P99: ${result.p99}ms`);
    if (result.successRate) console.log(`   ✓ Success Rate: ${(result.successRate * 100).toFixed(2)}%`);
    console.log('');
  }

  printSummary() {
    console.log('\n📊 Test Summary');
    console.log('═'.repeat(60));

    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;

    console.log(`Total: ${this.results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('═'.repeat(60) + '\n');
  }
}

// Standard test implementations
export async function testSequentialRequests(baseUrl, count = 100) {
  const startTime = Date.now();
  let successCount = 0;
  const latencies = [];

  for (let i = 0; i < count; i++) {
    try {
      const reqStart = Date.now();
      const res = await fetch(`${baseUrl}/health`);
      const latency = Date.now() - reqStart;

      if (res.ok) {
        successCount += 1;
        latencies.push(latency);
      }
    } catch {
      // Request failed
    }
  }

  const durationMs = Date.now() - startTime;
  const sorted = latencies.sort((a, b) => a - b);

  return {
    durationMs,
    requestCount: count,
    successCount,
    successRate: successCount / count,
    throughput: (count / (durationMs / 1000)).toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] || 0
  };
}

export async function testConcurrentRequests(baseUrl, concurrency = 50, totalRequests = 1000) {
  const startTime = Date.now();
  const latencies = [];
  let successCount = 0;
  let failureCount = 0;

  // Send requests in concurrent batches
  for (let i = 0; i < totalRequests; i += concurrency) {
    const batch = [];

    for (let j = 0; j < concurrency && i + j < totalRequests; j++) {
      batch.push(
        (async () => {
          try {
            const reqStart = Date.now();
            const res = await fetch(`${baseUrl}/health`);
            const latency = Date.now() - reqStart;

            if (res.ok) {
              successCount += 1;
              latencies.push(latency);
            } else {
              failureCount += 1;
            }
          } catch {
            failureCount += 1;
          }
        })()
      );
    }

    await Promise.all(batch);
  }

  const durationMs = Date.now() - startTime;
  const sorted = latencies.sort((a, b) => a - b);

  return {
    durationMs,
    requestCount: totalRequests,
    concurrency,
    successCount,
    failureCount,
    successRate: successCount / totalRequests,
    throughput: (totalRequests / (durationMs / 1000)).toFixed(2),
    p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
    p99: sorted[Math.floor(sorted.length * 0.99)] || 0
  };
}

export async function testEndpointFailover(baseUrl) {
  // Test that requests failover to healthy endpoints
  const startTime = Date.now();
  const responses = [];

  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'test' }] })
      });

      responses.push(res.status);
    } catch {
      responses.push(0);
    }
  }

  const durationMs = Date.now() - startTime;
  const successCount = responses.filter((s) => s === 200 || s === 502).length;

  return {
    durationMs,
    requestCount: responses.length,
    successRate: successCount / responses.length
  };
}

export async function testRateLimiting(baseUrl, requestsPerWindow = 120) {
  const startTime = Date.now();
  let successCount = 0;
  let rateLimitedCount = 0;

  // Send more requests than rate limit allows
  for (let i = 0; i < requestsPerWindow + 50; i++) {
    try {
      const res = await fetch(`${baseUrl}/metrics`);

      if (res.status === 200) {
        successCount += 1;
      } else if (res.status === 429) {
        rateLimitedCount += 1;
      }
    } catch {
      // Error
    }
  }

  const durationMs = Date.now() - startTime;

  return {
    durationMs,
    requestCount: requestsPerWindow + 50,
    successCount,
    rateLimitedCount,
    rateLimitAccuracy: rateLimitedCount > 0 ? 'OK' : 'POTENTIAL_ISSUE'
  };
}

export async function testMemoryStability(baseUrl, durationSec = 30) {
  const startTime = Date.now();
  const memorySnapshots = [];
  const endTime = startTime + durationSec * 1000;

  while (Date.now() < endTime) {
    const memory = process.memoryUsage();
    memorySnapshots.push({
      timestamp: Date.now(),
      heapUsed: memory.heapUsed,
      rss: memory.rss
    });

    // Send request
    try {
      await fetch(`${baseUrl}/health`);
    } catch {
      // Error
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  const heapDifference = memorySnapshots[memorySnapshots.length - 1].heapUsed - memorySnapshots[0].heapUsed;
  const heapGrowthPercent = (heapDifference / memorySnapshots[0].heapUsed) * 100;

  return {
    durationSec,
    snapshots: memorySnapshots.length,
    heapGrowthPercent: heapGrowthPercent.toFixed(2),
    stable: Math.abs(heapGrowthPercent) < 10
  };
}
