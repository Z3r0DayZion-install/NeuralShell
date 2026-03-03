// Bulkhead pattern for per-endpoint isolation
export class BulkheadIsolation {
  constructor(config = {}) {
    this.endpointBulkheads = new Map();
    this.defaultConfig = {
      maxConcurrent: config.maxConcurrent || 10,
      maxQueueSize: config.maxQueueSize || 50,
      timeoutMs: config.timeoutMs || 30000
    };
  }

  createBulkhead(endpointName, config = {}) {
    const bulkhead = {
      name: endpointName,
      maxConcurrent: config.maxConcurrent || this.defaultConfig.maxConcurrent,
      maxQueueSize: config.maxQueueSize || this.defaultConfig.maxQueueSize,
      timeoutMs: config.timeoutMs || this.defaultConfig.timeoutMs,
      inFlight: 0,
      queue: [],
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        rejectedRequests: 0,
        totalQueueWaitMs: 0
      }
    };

    this.endpointBulkheads.set(endpointName, bulkhead);
    return bulkhead;
  }

  getBulkhead(endpointName) {
    if (!this.endpointBulkheads.has(endpointName)) {
      this.createBulkhead(endpointName);
    }
    return this.endpointBulkheads.get(endpointName);
  }

  async executeWithBulkhead(endpointName, fn) {
    const bulkhead = this.getBulkhead(endpointName);
    bulkhead.stats.totalRequests += 1;

    // Check queue capacity
    if (bulkhead.inFlight >= bulkhead.maxConcurrent && bulkhead.queue.length >= bulkhead.maxQueueSize) {
      bulkhead.stats.rejectedRequests += 1;
      throw new Error(`Bulkhead rejected: ${endpointName} queue full`);
    }

    // Wait for slot if at capacity
    if (bulkhead.inFlight >= bulkhead.maxConcurrent) {
      await this.waitForSlot(endpointName, bulkhead);
    }

    bulkhead.inFlight += 1;

    try {
      return await fn();
    } catch (err) {
      bulkhead.stats.failedRequests += 1;
      throw err;
    } finally {
      bulkhead.inFlight -= 1;

      // Process next queued request
      if (bulkhead.queue.length > 0) {
        const next = bulkhead.queue.shift();
        next.resolve();
      }
    }
  }

  async waitForSlot(endpointName, bulkhead) {
    const startWait = Date.now();

    return new Promise((resolve, reject) => {
      const token = { resolve, reject };
      const timeoutHandle = setTimeout(() => {
        const idx = bulkhead.queue.indexOf(token);
        if (idx >= 0) {
          bulkhead.queue.splice(idx, 1);
        }
        reject(new Error(`Bulkhead timeout waiting for slot: ${endpointName}`));
      }, bulkhead.timeoutMs);

      token.timeoutHandle = timeoutHandle;
      bulkhead.queue.push(token);

      // Resolve when slot available
      if (bulkhead.inFlight < bulkhead.maxConcurrent) {
        resolve();
      }
    }).then(() => {
      const waitTime = Date.now() - startWait;
      bulkhead.stats.totalQueueWaitMs += waitTime;
    });
  }

  getStats(endpointName) {
    const bulkhead = this.getBulkhead(endpointName);
    return {
      endpoint: endpointName,
      inFlight: bulkhead.inFlight,
      queueSize: bulkhead.queue.length,
      ...bulkhead.stats,
      avgQueueWaitMs:
        bulkhead.stats.totalRequests > 0
          ? (bulkhead.stats.totalQueueWaitMs / bulkhead.stats.totalRequests).toFixed(2)
          : 0
    };
  }

  getAllStats() {
    const allStats = {};
    for (const name of this.endpointBulkheads.keys()) {
      allStats[name] = this.getStats(name);
    }
    return allStats;
  }

  reset(endpointName) {
    const bulkhead = this.getBulkhead(endpointName);
    bulkhead.queue = [];
    bulkhead.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      totalQueueWaitMs: 0
    };
  }
}
