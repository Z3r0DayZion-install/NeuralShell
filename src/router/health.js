export class HealthCheckManager {
  constructor(config = {}) {
    this.config = {
      checkInterval: config.checkInterval || 30000,
      stateFileTimeout: config.stateFileTimeout || 5000,
      ...config
    };

    this.checks = {
      memory: { ok: true, message: 'OK' },
      database: { ok: true, message: 'OK' },
      endpoints: { ok: true, message: 'OK', activeCount: 0 },
      stateFile: { ok: true, message: 'OK', lastCheck: null },
      uptime: { ok: true, message: 'OK', seconds: 0 }
    };

    this.startTime = Date.now();
  }

  performHealthChecks(runtime) {
    // Memory check
    const memory = process.memoryUsage();
    const heapUsedPercent = (memory.heapUsed / memory.heapTotal) * 100;
    this.checks.memory = {
      ok: heapUsedPercent < 85,
      message: heapUsedPercent < 85 ? 'OK' : 'HIGH_MEMORY_USAGE',
      usedPercent: heapUsedPercent.toFixed(2),
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal
    };

    // Endpoints check
    const activeEndpoints = runtime.endpointState.filter((ep) => ep.cooldownUntil <= Date.now());
    const inCooldown = runtime.endpointState.filter((ep) => ep.cooldownUntil > Date.now());
    this.checks.endpoints = {
      ok: activeEndpoints.length > 0,
      message: activeEndpoints.length > 0 ? 'OK' : 'NO_ACTIVE_ENDPOINTS',
      activeCount: activeEndpoints.length,
      inCooldownCount: inCooldown.length,
      totalCount: runtime.endpointState.length
    };

    // State file check
    this.checks.stateFile = {
      ok: runtime.stateHealth?.lastPersistOk !== false,
      message: runtime.stateHealth?.lastPersistOk ? 'OK' : 'PERSIST_FAILED',
      lastPersistAt: runtime.stateHealth?.lastPersistAt,
      lastPersistReason: runtime.stateHealth?.lastPersistReason
    };

    // Uptime check
    this.checks.uptime = {
      ok: true,
      message: 'OK',
      seconds: Math.floor((Date.now() - this.startTime) / 1000)
    };

    return this.checks;
  }

  getHealthStatus(includeDetails = false) {
    const allOk = Object.values(this.checks).every((check) => check.ok !== false);
    const degraded = !allOk && Object.values(this.checks).some((check) => check.ok === true);

    const response = {
      ok: allOk,
      degraded,
      timestamp: new Date().toISOString(),
      uptime: this.checks.uptime.seconds
    };

    if (includeDetails) {
      response.checks = this.checks;
    }

    return response;
  }

  getReadinessStatus(runtime) {
    const hasActiveEndpoints = runtime.endpointState.some((ep) => ep.cooldownUntil <= Date.now());
    const stateHealthOk = runtime.stateHealth?.lastPersistOk !== false;

    return {
      ready: hasActiveEndpoints && stateHealthOk,
      activeEndpoints: runtime.endpointState.filter((ep) => ep.cooldownUntil <= Date.now()).length,
      stateHealth: runtime.stateHealth
    };
  }
}
