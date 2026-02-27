/**
 * Health Check System Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HealthCheck, StandardHealthChecks } from '../../src/router/healthCheck.js';

describe('HealthCheck', () => {
  let healthCheck;

  beforeEach(() => {
    healthCheck = new HealthCheck({ timeout: 1000 });
  });

  describe('Registration', () => {
    it('should register a health check', () => {
      const checkFn = async () => ({ available: true });
      healthCheck.register('test', checkFn);

      expect(healthCheck.checks.has('test')).toBe(true);
    });

    it('should register with custom timeout', () => {
      const checkFn = async () => ({ available: true });
      healthCheck.register('test', checkFn, { timeout: 2000 });

      const check = healthCheck.checks.get('test');
      expect(check.timeout).toBe(2000);
    });

    it('should default to critical check', () => {
      const checkFn = async () => ({ available: true });
      healthCheck.register('test', checkFn);

      const check = healthCheck.checks.get('test');
      expect(check.critical).toBe(true);
    });

    it('should allow non-critical checks', () => {
      const checkFn = async () => ({ available: true });
      healthCheck.register('test', checkFn, { critical: false });

      const check = healthCheck.checks.get('test');
      expect(check.critical).toBe(false);
    });
  });

  describe('Single Check Execution', () => {
    it('should run healthy check', async () => {
      const checkFn = async () => ({ available: true, detail: 'ok' });
      const check = { fn: checkFn, critical: true, timeout: 1000 };

      const result = await healthCheck.runCheck('test', check);

      expect(result.name).toBe('test');
      expect(result.status).toBe('healthy');
      expect(result.available).toBe(true);
      expect(result.detail).toBe('ok');
    });

    it('should handle unhealthy check', async () => {
      const checkFn = async () => {
        throw new Error('Service unavailable');
      };
      const check = { fn: checkFn, critical: true, timeout: 1000 };

      const result = await healthCheck.runCheck('test', check);

      expect(result.name).toBe('test');
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Service unavailable');
      expect(result.critical).toBe(true);
    });

    it('should timeout slow checks', async () => {
      const checkFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return { available: true };
      };
      const check = { fn: checkFn, critical: true, timeout: 100 };

      const result = await healthCheck.runCheck('test', check);

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Check timeout');
    });
  });

  describe('Run All Checks', () => {
    it('should run all registered checks', async () => {
      healthCheck.register('check1', async () => ({ available: true }));
      healthCheck.register('check2', async () => ({ available: true }));
      healthCheck.register('check3', async () => ({ available: true }));

      const result = await healthCheck.runAll();

      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      expect(result.summary.healthy).toBe(3);
      expect(result.summary.unhealthy).toBe(0);
    });

    it('should report unhealthy when critical check fails', async () => {
      healthCheck.register('critical', async () => {
        throw new Error('Critical failure');
      }, { critical: true });
      healthCheck.register('normal', async () => ({ available: true }));

      const result = await healthCheck.runAll();

      expect(result.status).toBe('unhealthy');
      expect(result.summary.critical).toBe(1);
    });

    it('should report healthy when only non-critical checks fail', async () => {
      healthCheck.register('non-critical', async () => {
        throw new Error('Non-critical failure');
      }, { critical: false });
      healthCheck.register('critical', async () => ({ available: true }), { critical: true });

      const result = await healthCheck.runAll();

      expect(result.status).toBe('healthy');
      expect(result.summary.unhealthy).toBe(1);
      expect(result.summary.critical).toBe(0);
    });

    it('should include timestamp', async () => {
      healthCheck.register('test', async () => ({ available: true }));

      const result = await healthCheck.runAll();

      expect(result.timestamp).toBeDefined();
      expect(() => new Date(result.timestamp)).not.toThrow();
    });

    it('should provide summary statistics', async () => {
      healthCheck.register('healthy1', async () => ({ available: true }));
      healthCheck.register('healthy2', async () => ({ available: true }));
      healthCheck.register('unhealthy', async () => {
        throw new Error('Failed');
      }, { critical: false });

      const result = await healthCheck.runAll();

      expect(result.summary.total).toBe(3);
      expect(result.summary.healthy).toBe(2);
      expect(result.summary.unhealthy).toBe(1);
    });
  });

  describe('Readiness Check', () => {
    it('should return true when all checks pass', async () => {
      healthCheck.register('check1', async () => ({ available: true }));
      healthCheck.register('check2', async () => ({ available: true }));

      const ready = await healthCheck.isReady();
      expect(ready).toBe(true);
    });

    it('should return false when any check fails', async () => {
      healthCheck.register('check1', async () => ({ available: true }));
      healthCheck.register('check2', async () => {
        throw new Error('Failed');
      });

      const ready = await healthCheck.isReady();
      expect(ready).toBe(false);
    });
  });

  describe('Liveness Check', () => {
    it('should return true when critical checks pass', async () => {
      healthCheck.register('critical', async () => ({ available: true }), { critical: true });
      healthCheck.register('non-critical', async () => {
        throw new Error('Failed');
      }, { critical: false });

      const alive = await healthCheck.isAlive();
      expect(alive).toBe(true);
    });

    it('should return false when critical check fails', async () => {
      healthCheck.register('critical', async () => {
        throw new Error('Critical failure');
      }, { critical: true });

      const alive = await healthCheck.isAlive();
      expect(alive).toBe(false);
    });

    it('should ignore non-critical checks', async () => {
      healthCheck.register('non-critical', async () => {
        throw new Error('Non-critical failure');
      }, { critical: false });

      const alive = await healthCheck.isAlive();
      expect(alive).toBe(true);
    });
  });
});

describe('StandardHealthChecks', () => {
  describe('Redis Check', () => {
    it('should report unavailable when Redis not configured', async () => {
      const check = StandardHealthChecks.redis(null);
      const result = await check();

      expect(result.available).toBe(false);
      expect(result.reason).toBe('not_configured');
    });

    it('should report unavailable when Redis not connected', async () => {
      const mockRedis = {
        isConnected: () => false
      };
      const check = StandardHealthChecks.redis(mockRedis);
      const result = await check();

      expect(result.available).toBe(false);
      expect(result.reason).toBe('not_connected');
    });

    it('should report available when Redis responds to ping', async () => {
      const mockRedis = {
        isConnected: () => true,
        ping: async () => 'PONG'
      };
      const check = StandardHealthChecks.redis(mockRedis);
      const result = await check();

      expect(result.available).toBe(true);
    });

    it('should handle Redis ping errors', async () => {
      const mockRedis = {
        isConnected: () => true,
        ping: async () => {
          throw new Error('Connection lost');
        }
      };
      const check = StandardHealthChecks.redis(mockRedis);
      const result = await check();

      expect(result.available).toBe(false);
      expect(result.error).toBe('Connection lost');
    });
  });

  describe('Router Check', () => {
    it('should report unavailable when router not initialized', async () => {
      const check = StandardHealthChecks.router(null);
      const result = await check();

      expect(result.available).toBe(false);
      expect(result.reason).toBe('not_initialized');
    });

    it('should report available when healthy endpoints exist', async () => {
      const mockRouter = {
        getEndpointStats: () => [
          { name: 'ep1', healthy: true },
          { name: 'ep2', healthy: true },
          { name: 'ep3', healthy: false }
        ]
      };
      const check = StandardHealthChecks.router(mockRouter);
      const result = await check();

      expect(result.available).toBe(true);
      expect(result.endpoints).toBe(3);
      expect(result.healthy).toBe(2);
      expect(result.unhealthy).toBe(1);
    });

    it('should report unavailable when no healthy endpoints', async () => {
      const mockRouter = {
        getEndpointStats: () => [
          { name: 'ep1', healthy: false },
          { name: 'ep2', healthy: false }
        ]
      };
      const check = StandardHealthChecks.router(mockRouter);
      const result = await check();

      expect(result.available).toBe(false);
      expect(result.healthy).toBe(0);
    });

    it('should handle missing getEndpointStats method', async () => {
      const mockRouter = {};
      const check = StandardHealthChecks.router(mockRouter);
      const result = await check();

      expect(result.available).toBe(false);
    });
  });

  describe('Memory Check', () => {
    it('should report memory usage', async () => {
      const check = StandardHealthChecks.memory(90);
      const result = await check();

      expect(result.heapUsed).toBeDefined();
      expect(result.heapTotal).toBeDefined();
      expect(result.percentUsed).toBeDefined();
      expect(result.rss).toBeDefined();
      expect(typeof result.heapUsed).toBe('number');
    });

    it('should report available when under threshold', async () => {
      const check = StandardHealthChecks.memory(99);
      const result = await check();

      expect(result.available).toBe(true);
    });

    it('should use custom threshold', async () => {
      const check = StandardHealthChecks.memory(1);
      const result = await check();

      // Memory usage should exceed 1%
      expect(result.available).toBe(false);
      expect(result.percentUsed).toBeGreaterThan(1);
    });
  });

  describe('Uptime Check', () => {
    it('should report process uptime', async () => {
      const check = StandardHealthChecks.uptime(0);
      const result = await check();

      expect(result.available).toBe(true);
      expect(result.uptime).toBeDefined();
      expect(result.uptimeFormatted).toBeDefined();
      expect(typeof result.uptime).toBe('number');
    });

    it('should format uptime correctly', async () => {
      const check = StandardHealthChecks.uptime(0);
      const result = await check();

      expect(result.uptimeFormatted).toMatch(/\d+[dhms]/);
    });

    it('should check minimum uptime', async () => {
      const check = StandardHealthChecks.uptime(999999);
      const result = await check();

      expect(result.available).toBe(false);
    });
  });

  describe('Disk Space Check', () => {
    it('should return placeholder result', async () => {
      const check = StandardHealthChecks.diskSpace();
      const result = await check();

      expect(result.available).toBe(true);
      expect(result.note).toBe('disk_check_not_implemented');
    });
  });
});
