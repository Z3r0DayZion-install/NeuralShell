/**
 * Security Features Integration Tests
 * Tests configValidator, securityLogger, and healthCheck modules
 */

import { strict as assert } from 'assert';
import { ConfigValidator, validateEnvironment } from '../src/router/configValidator.js';
import { SecurityLogger } from '../src/router/securityLogger.js';
import { HealthCheck, StandardHealthChecks } from '../src/router/healthCheck.js';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Security Features Tests\n');

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
    process.exit(1);
  }
}

// ============================================================================
// ConfigValidator Tests
// ============================================================================

test('ConfigValidator: validates valid server configuration', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000, host: '0.0.0.0' },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }]
  };

  const result = validator.validate(config);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('ConfigValidator: rejects invalid port numbers', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 70000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }]
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('port')));
});

test('ConfigValidator: requires at least one endpoint', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: []
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('endpoint')));
});

test('ConfigValidator: validates endpoint URL format', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'not-a-url', model: 'test-model' }]
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('url')));
});

test('ConfigValidator: validates rate limit configuration', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
    rateLimit: { enabled: true, requestsPerWindow: 0, windowMs: 60000 }
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('requestsPerWindow')));
});

test('ConfigValidator: validates logging levels', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 3000 },
    endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
    logging: { level: 'invalid' }
  };

  const result = validator.validate(config);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('logging.level')));
});

test('ConfigValidator: accepts valid log levels', () => {
  const validator = new ConfigValidator();
  const levels = ['error', 'warn', 'info', 'debug', 'trace'];

  for (const level of levels) {
    const config = {
      server: { port: 3000 },
      endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
      logging: { level }
    };

    const result = validator.validate(config);
    assert.equal(result.valid, true, `Level ${level} should be valid`);
  }
});

test('ConfigValidator: getSummary returns validation summary', () => {
  const validator = new ConfigValidator();
  const config = {
    server: { port: 70000 },
    endpoints: []
  };

  validator.validate(config);
  const summary = validator.getSummary();

  assert.equal(summary.valid, false);
  assert.ok(summary.errorCount > 0);
  assert.ok(Array.isArray(summary.errors));
  assert.ok(Array.isArray(summary.warnings));
});

test('validateEnvironment: passes in development', () => {
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  const result = validateEnvironment();
  assert.equal(result.valid, true);

  process.env.NODE_ENV = originalEnv;
});

// ============================================================================
// SecurityLogger Tests
// ============================================================================

test('SecurityLogger: generates correlation ID', () => {
  const logger = new SecurityLogger({ namespace: 'test' });
  const correlationId = logger.getCorrelationId({});

  assert.ok(correlationId);
  assert.equal(typeof correlationId, 'string');
  assert.ok(correlationId.length > 0);
});

test('SecurityLogger: extracts correlation ID from request headers', () => {
  const logger = new SecurityLogger();
  const request = {
    headers: { 'x-correlation-id': 'test-correlation-123' }
  };

  const correlationId = logger.getCorrelationId(request);
  assert.equal(correlationId, 'test-correlation-123');
});

test('SecurityLogger: creates structured log entry', () => {
  const logger = new SecurityLogger({ namespace: 'test' });
  const entry = logger.createLogEntry('info', 'test_event', { key: 'value' }, 'corr-123');

  assert.ok(entry.timestamp);
  assert.equal(entry.level, 'info');
  assert.equal(entry.namespace, 'test');
  assert.equal(entry.event, 'test_event');
  assert.equal(entry.correlationId, 'corr-123');
  assert.equal(entry.key, 'value');
});

test('SecurityLogger: logs authentication attempt', () => {
  const logger = new SecurityLogger();
  const entry = logger.logAuthAttempt(true, {
    ip: '192.168.1.1',
    userAgent: 'test-agent',
    apiKey: 'sk-1234567890abcdef'
  });

  assert.equal(entry.success, true);
  assert.equal(entry.ip, '192.168.1.1');
  assert.equal(entry.userAgent, 'test-agent');
  assert.equal(entry.apiKey, 'sk-12345...');
});

test('SecurityLogger: sanitizes API keys', () => {
  const logger = new SecurityLogger();
  const entry = logger.logAuthAttempt(true, {
    apiKey: 'sk-very-long-secret-key-12345'
  });

  assert.equal(entry.apiKey, 'sk-very-...');
  assert.ok(!entry.apiKey.includes('secret'));
});

test('SecurityLogger: logs rate limit event', () => {
  const logger = new SecurityLogger();
  const entry = logger.logRateLimit({
    ip: '192.168.1.1',
    endpoint: '/api/chat',
    limit: 100,
    window: 60000,
    retryAfter: 30
  });

  assert.equal(entry.event, 'rate_limit_exceeded');
  assert.equal(entry.ip, '192.168.1.1');
  assert.equal(entry.endpoint, '/api/chat');
  assert.equal(entry.limit, 100);
});

test('SecurityLogger: logs suspicious activity', () => {
  const logger = new SecurityLogger();
  const entry = logger.logSuspiciousActivity('brute_force', {
    ip: '192.168.1.1',
    details: 'Multiple failed login attempts',
    severity: 'high'
  });

  assert.equal(entry.event, 'suspicious_activity');
  assert.equal(entry.type, 'brute_force');
  assert.equal(entry.severity, 'high');
});

test('SecurityLogger: logs access denied', () => {
  const logger = new SecurityLogger();
  const entry = logger.logAccessDenied('insufficient_permissions', {
    ip: '192.168.1.1',
    endpoint: '/admin',
    method: 'POST'
  });

  assert.equal(entry.event, 'access_denied');
  assert.equal(entry.reason, 'insufficient_permissions');
  assert.equal(entry.endpoint, '/admin');
});

test('SecurityLogger: logs configuration changes', () => {
  const logger = new SecurityLogger();
  const entry = logger.logConfigChange('endpoint_added', {
    user: 'admin',
    previous: null,
    new: { name: 'new-endpoint' }
  });

  assert.equal(entry.event, 'config_change');
  assert.equal(entry.change, 'endpoint_added');
  assert.equal(entry.user, 'admin');
});

test('SecurityLogger: logs API key operations', () => {
  const logger = new SecurityLogger();
  const entry = logger.logApiKeyOperation('create', {
    keyId: 'key-123',
    keyPrefix: 'sk-abc',
    user: 'admin'
  });

  assert.equal(entry.event, 'api_key_operation');
  assert.equal(entry.operation, 'create');
  assert.equal(entry.keyId, 'key-123');
});

test('SecurityLogger: logs security errors', () => {
  const logger = new SecurityLogger();
  const error = new Error('Security violation');
  error.code = 'SEC_001';

  const entry = logger.logSecurityError(error, {
    ip: '192.168.1.1',
    endpoint: '/api/secure'
  });

  assert.equal(entry.event, 'security_error');
  assert.equal(entry.error, 'Security violation');
  assert.equal(entry.code, 'SEC_001');
  assert.ok(entry.stack);
});

test('SecurityLogger: uses custom namespace', () => {
  const logger = new SecurityLogger({ namespace: 'custom-app' });
  const entry = logger.createLogEntry('info', 'test');

  assert.equal(entry.namespace, 'custom-app');
});

// ============================================================================
// HealthCheck Tests
// ============================================================================

test('HealthCheck: registers a health check', () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  const checkFn = async () => ({ available: true });

  healthCheck.register('test', checkFn);
  assert.ok(healthCheck.checks.has('test'));
});

test('HealthCheck: runs healthy check', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  const checkFn = async () => ({ available: true, detail: 'ok' });
  const check = { fn: checkFn, critical: true, timeout: 1000 };

  const result = await healthCheck.runCheck('test', check);

  assert.equal(result.name, 'test');
  assert.equal(result.status, 'healthy');
  assert.equal(result.available, true);
  assert.equal(result.detail, 'ok');
});

test('HealthCheck: handles unhealthy check', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  const checkFn = async () => {
    throw new Error('Service unavailable');
  };
  const check = { fn: checkFn, critical: true, timeout: 1000 };

  const result = await healthCheck.runCheck('test', check);

  assert.equal(result.name, 'test');
  assert.equal(result.status, 'unhealthy');
  assert.equal(result.error, 'Service unavailable');
  assert.equal(result.critical, true);
});

test('HealthCheck: runs all registered checks', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  healthCheck.register('check1', async () => ({ available: true }));
  healthCheck.register('check2', async () => ({ available: true }));
  healthCheck.register('check3', async () => ({ available: true }));

  const result = await healthCheck.runAll();

  assert.equal(result.status, 'healthy');
  assert.equal(result.checks.length, 3);
  assert.equal(result.summary.total, 3);
  assert.equal(result.summary.healthy, 3);
  assert.equal(result.summary.unhealthy, 0);
});

test('HealthCheck: reports unhealthy when critical check fails', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  healthCheck.register('critical', async () => {
    throw new Error('Critical failure');
  }, { critical: true });
  healthCheck.register('normal', async () => ({ available: true }));

  const result = await healthCheck.runAll();

  assert.equal(result.status, 'unhealthy');
  assert.equal(result.summary.critical, 1);
});

test('HealthCheck: isReady returns true when all checks pass', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  healthCheck.register('check1', async () => ({ available: true }));
  healthCheck.register('check2', async () => ({ available: true }));

  const ready = await healthCheck.isReady();
  assert.equal(ready, true);
});

test('HealthCheck: isReady returns false when any check fails', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  healthCheck.register('check1', async () => ({ available: true }));
  healthCheck.register('check2', async () => {
    throw new Error('Failed');
  });

  const ready = await healthCheck.isReady();
  assert.equal(ready, false);
});

test('HealthCheck: isAlive returns true when critical checks pass', async () => {
  const healthCheck = new HealthCheck({ timeout: 1000 });
  healthCheck.register('critical', async () => ({ available: true }), { critical: true });
  healthCheck.register('non-critical', async () => {
    throw new Error('Failed');
  }, { critical: false });

  const alive = await healthCheck.isAlive();
  assert.equal(alive, true);
});

// ============================================================================
// StandardHealthChecks Tests
// ============================================================================

test('StandardHealthChecks.redis: reports unavailable when not configured', async () => {
  const check = StandardHealthChecks.redis(null);
  const result = await check();

  assert.equal(result.available, false);
  assert.equal(result.reason, 'not_configured');
});

test('StandardHealthChecks.redis: reports unavailable when not connected', async () => {
  const mockRedis = {
    isConnected: () => false
  };
  const check = StandardHealthChecks.redis(mockRedis);
  const result = await check();

  assert.equal(result.available, false);
  assert.equal(result.reason, 'not_connected');
});

test('StandardHealthChecks.redis: reports available when Redis responds', async () => {
  const mockRedis = {
    isConnected: () => true,
    ping: async () => 'PONG'
  };
  const check = StandardHealthChecks.redis(mockRedis);
  const result = await check();

  assert.equal(result.available, true);
});

test('StandardHealthChecks.router: reports unavailable when not initialized', async () => {
  const check = StandardHealthChecks.router(null);
  const result = await check();

  assert.equal(result.available, false);
  assert.equal(result.reason, 'not_initialized');
});

test('StandardHealthChecks.router: reports available when healthy endpoints exist', async () => {
  const mockRouter = {
    getEndpointStats: () => [
      { name: 'ep1', healthy: true },
      { name: 'ep2', healthy: true },
      { name: 'ep3', healthy: false }
    ]
  };
  const check = StandardHealthChecks.router(mockRouter);
  const result = await check();

  assert.equal(result.available, true);
  assert.equal(result.endpoints, 3);
  assert.equal(result.healthy, 2);
  assert.equal(result.unhealthy, 1);
});

test('StandardHealthChecks.memory: reports memory usage', async () => {
  const check = StandardHealthChecks.memory(90);
  const result = await check();

  assert.ok(result.heapUsed);
  assert.ok(result.heapTotal);
  assert.ok(result.percentUsed);
  assert.ok(result.rss);
  assert.equal(typeof result.heapUsed, 'number');
});

test('StandardHealthChecks.uptime: reports process uptime', async () => {
  const check = StandardHealthChecks.uptime(0);
  const result = await check();

  assert.equal(result.available, true);
  assert.ok(result.uptime !== undefined);
  assert.ok(result.uptimeFormatted);
  assert.equal(typeof result.uptime, 'number');
});

test('StandardHealthChecks.diskSpace: returns placeholder result', async () => {
  const check = StandardHealthChecks.diskSpace();
  const result = await check();

  assert.equal(result.available, true);
  assert.equal(result.note, 'disk_check_not_implemented');
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
