/**
 * Security Integration Test
 * Tests security features integrated with the router
 */

import { strict as assert } from 'assert';
import { buildServer } from '../router.js';
import { ConfigValidator } from '../src/router/configValidator.js';
import { SecurityLogger } from '../src/router/securityLogger.js';
import { HealthCheck, StandardHealthChecks } from '../src/router/healthCheck.js';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🔒 Running Security Integration Tests\n');

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
    }
  }

  console.log(`\n📊 Results: ${results.passed}/${results.total} passed, ${results.failed} failed\n`);

  if (results.failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// Integration Tests
// ============================================================================

test('ConfigValidator can validate router configuration', () => {
  const validator = new ConfigValidator();

  const config = {
    server: { port: 3000, host: '0.0.0.0' },
    endpoints: [
      { name: 'test1', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4' },
      { name: 'test2', url: 'http://localhost:11434/api/generate', model: 'llama3' }
    ],
    rateLimit: { enabled: true, requestsPerWindow: 100, windowMs: 60000 },
    redis: { enabled: false },
    logging: { level: 'info' },
    security: { enableSecurityHeaders: true, corsAllowedOrigins: ['http://localhost:3000'] }
  };

  const result = validator.validate(config);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('SecurityLogger can be instantiated and used', () => {
  const logger = new SecurityLogger({ namespace: 'neuralshell' });

  // Test various logging methods
  const authEntry = logger.logAuthAttempt(true, { ip: '127.0.0.1', apiKey: 'test-key' });
  assert.ok(authEntry.correlationId);
  assert.equal(authEntry.success, true);

  const rateLimitEntry = logger.logRateLimit({ ip: '127.0.0.1', endpoint: '/prompt', limit: 100 });
  assert.equal(rateLimitEntry.event, 'rate_limit_exceeded');

  const accessDeniedEntry = logger.logAccessDenied('invalid_token', { ip: '127.0.0.1' });
  assert.equal(accessDeniedEntry.event, 'access_denied');
});

test('HealthCheck can monitor router components', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });

  // Register checks for router components
  healthCheck.register('memory', StandardHealthChecks.memory(90), { critical: true });
  healthCheck.register('uptime', StandardHealthChecks.uptime(0), { critical: false });

  const result = await healthCheck.runAll();

  assert.ok(result.timestamp);
  assert.equal(result.status, 'healthy');
  assert.ok(result.checks.length >= 2);
  assert.ok(result.summary.total >= 2);
});

test('Router can be built with security configuration', async () => {
  const server = buildServer({
    endpoints: [
      { name: 'test', url: 'http://localhost:11434/api/generate', model: 'test' }
    ],
    enableSecurityHeaders: true,
    corsAllowedOrigins: ['http://localhost:3000'],
    requestsPerWindow: 100,
    rateLimitWindowMs: 60000
  });

  assert.ok(server);
  assert.ok(server.server);

  await server.close();
});

test('ConfigValidator detects production security issues', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test' }],
    security: {
      enableSecurityHeaders: false,
      corsAllowedOrigins: ['*']
    }
  };

  const result = validator.validate(config);

  // Should have errors about CORS wildcard in production
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('CORS')));

  process.env.NODE_ENV = originalEnv;
});

test('SecurityLogger creates request logger middleware', () => {
  const logger = new SecurityLogger();
  const middleware = logger.createRequestLogger();

  assert.equal(typeof middleware, 'function');
});

test('HealthCheck timeout handling works', async () => {
  const healthCheck = new HealthCheck({ timeout: 100 });

  // Register a slow check that will timeout
  healthCheck.register('slow', async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { available: true };
  }, { critical: false, timeout: 50 });

  const result = await healthCheck.runAll();

  // The slow check should have timed out
  const slowCheck = result.checks.find(c => c.name === 'slow');
  assert.equal(slowCheck.status, 'unhealthy');
  assert.equal(slowCheck.error, 'Check timeout');
});

test('StandardHealthChecks.router handles missing getEndpointStats', async () => {
  const mockRouter = {}; // No getEndpointStats method
  const check = StandardHealthChecks.router(mockRouter);
  const result = await check();

  assert.equal(result.available, false);
});

test('ConfigValidator validates circuit breaker settings', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test' }],
    circuitBreaker: {
      enabled: true,
      failureThreshold: 0, // Invalid
      timeoutMs: 5000
    }
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('failureThreshold')));
});

test('ConfigValidator validates cache settings', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test' }],
    cache: {
      enabled: true,
      ttlSeconds: 0 // Invalid
    }
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('ttlSeconds')));
});

test('SecurityLogger handles null request gracefully', () => {
  const logger = new SecurityLogger();
  const correlationId = logger.getCorrelationId(null);

  assert.ok(correlationId);
  assert.equal(typeof correlationId, 'string');
});

test('HealthCheck supports non-critical checks', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });

  healthCheck.register('critical', async () => ({ available: true }), { critical: true });
  healthCheck.register('non-critical', async () => {
    throw new Error('Non-critical failure');
  }, { critical: false });

  const result = await healthCheck.runAll();

  // Should be healthy because only non-critical check failed
  assert.equal(result.status, 'healthy');
  assert.equal(result.summary.unhealthy, 1);
  assert.equal(result.summary.critical, 0);
});

test('ConfigValidator warns about high cache TTL', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test' }],
    cache: {
      enabled: true,
      ttlSeconds: 7200 // Very high
    }
  };

  const result = validator.validate(config);
  assert.ok(result.warnings.some(w => w.includes('ttlSeconds')));
});

test('SecurityLogger logs data access events', () => {
  const logger = new SecurityLogger();
  const entry = logger.logDataAccess('user_profile', {
    action: 'read',
    user: 'user-123',
    ip: '192.168.1.1',
    success: true
  });

  assert.equal(entry.event, 'data_access');
  assert.equal(entry.resource, 'user_profile');
  assert.equal(entry.action, 'read');
  assert.equal(entry.success, true);
});

test('HealthCheck provides summary statistics', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });

  healthCheck.register('check1', async () => ({ available: true }));
  healthCheck.register('check2', async () => ({ available: true }));
  healthCheck.register('check3', async () => {
    throw new Error('Failed');
  });

  const result = await healthCheck.runAll();

  assert.equal(result.summary.total, 3);
  assert.equal(result.summary.healthy, 2);
  assert.equal(result.summary.unhealthy, 1);
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
