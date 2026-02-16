"use strict";

class Telemetry {
  constructor() {
    this.startedAt = Date.now();
    this.routes = {};
    this.errors = 0;
  }

  wrap(route, fn) {
    return async (...args) => {
      const started = Date.now();
      this.routes[route] = this.routes[route] || { calls: 0, errors: 0, avgMs: 0 };
      this.routes[route].calls += 1;
      try {
        const result = await fn(...args);
        const ms = Date.now() - started;
        const r = this.routes[route];
        r.avgMs = Number(((r.avgMs * (r.calls - 1) + ms) / r.calls).toFixed(2));
        return result;
      } catch (err) {
        this.errors += 1;
        this.routes[route].errors += 1;
        throw err;
      }
    };
  }

  snapshot() {
    const mem = process.memoryUsage();
    return {
      upSec: Math.floor((Date.now() - this.startedAt) / 1000),
      errors: this.errors,
      routes: this.routes,
      process: {
        rssMb: Number((mem.rss / (1024 * 1024)).toFixed(2)),
        heapUsedMb: Number((mem.heapUsed / (1024 * 1024)).toFixed(2)),
        heapTotalMb: Number((mem.heapTotal / (1024 * 1024)).toFixed(2))
      }
    };
  }
}

module.exports = { Telemetry };
