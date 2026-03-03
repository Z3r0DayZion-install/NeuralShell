/**
 * Health Check System
 * Provides comprehensive health and readiness checks
 */

export class HealthCheck {
  constructor(options = {}) {
    this.checks = new Map();
    this.timeout = options.timeout || 5000;
  }

  /**
   * Register a health check
   */
  register(name, checkFn, options = {}) {
    this.checks.set(name, {
      fn: checkFn,
      critical: options.critical !== false,
      timeout: options.timeout || this.timeout
    });
  }

  /**
   * Run a single check with timeout
   */
  async runCheck(name, check) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Check timeout')), check.timeout);
    });

    try {
      const result = await Promise.race([
        check.fn(),
        timeoutPromise
      ]);

      return {
        name,
        status: 'healthy',
        ...result
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        error: error.message,
        critical: check.critical
      };
    }
  }

  /**
   * Run all health checks
   */
  async runAll() {
    const results = await Promise.all(
      Array.from(this.checks.entries()).map(([name, check]) =>
        this.runCheck(name, check)
      )
    );

    const unhealthy = results.filter(r => r.status === 'unhealthy');
    const criticalFailures = unhealthy.filter(r => r.critical);

    return {
      status: criticalFailures.length > 0 ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        unhealthy: unhealthy.length,
        critical: criticalFailures.length
      }
    };
  }

  /**
   * Get readiness status (all checks must pass)
   */
  async isReady() {
    const health = await this.runAll();
    return health.status === 'healthy';
  }

  /**
   * Get liveness status (critical checks only)
   */
  async isAlive() {
    const results = await Promise.all(
      Array.from(this.checks.entries())
        .filter(([_, check]) => check.critical)
        .map(([name, check]) => this.runCheck(name, check))
    );

    const criticalFailures = results.filter(r => r.status === 'unhealthy');
    return criticalFailures.length === 0;
  }
}

/**
 * Standard health checks
 */
export class StandardHealthChecks {
  static redis(redisClient) {
    return async () => {
      if (!redisClient) {
        return { available: false, reason: 'not_configured' };
      }

      try {
        const connected = redisClient.isConnected();
        if (!connected) {
          return { available: false, reason: 'not_connected' };
        }

        await redisClient.ping();
        return { available: true };
      } catch (error) {
        return { available: false, error: error.message };
      }
    };
  }

  static router(router) {
    return async () => {
      if (!router) {
        return { available: false, reason: 'not_initialized' };
      }

      const endpoints = router.getEndpointStats?.() || [];
      const healthyEndpoints = endpoints.filter(ep => ep.healthy);

      return {
        available: healthyEndpoints.length > 0,
        endpoints: endpoints.length,
        healthy: healthyEndpoints.length,
        unhealthy: endpoints.length - healthyEndpoints.length
      };
    };
  }

  static memory(thresholdPercent = 90) {
    return async () => {
      const usage = process.memoryUsage();
      const totalHeap = usage.heapTotal;
      const usedHeap = usage.heapUsed;
      const percentUsed = (usedHeap / totalHeap) * 100;

      return {
        available: percentUsed < thresholdPercent,
        heapUsed: Math.round(usedHeap / 1024 / 1024),
        heapTotal: Math.round(totalHeap / 1024 / 1024),
        percentUsed: Math.round(percentUsed),
        rss: Math.round(usage.rss / 1024 / 1024)
      };
    };
  }

  static uptime(minUptimeSeconds = 0) {
    return async () => {
      const uptime = process.uptime();
      return {
        available: uptime >= minUptimeSeconds,
        uptime: Math.round(uptime),
        uptimeFormatted: formatUptime(uptime)
      };
    };
  }

  static diskSpace() {
    return async () => {
      // Basic check - in production, use a proper disk space library
      return { available: true, note: 'disk_check_not_implemented' };
    };
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default HealthCheck;
