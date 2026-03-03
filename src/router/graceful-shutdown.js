// Graceful shutdown with request draining
export class GracefulShutdownManager {
  constructor(config = {}) {
    this.shuttingDown = false;
    this.inFlightRequests = new Set();
    this.drainTimeout = config.drainTimeout || 30000;
    this.preShutdownHooks = [];
    this.postShutdownHooks = [];
  }

  registerRequest(requestId) {
    this.inFlightRequests.add(requestId);
  }

  completeRequest(requestId) {
    this.inFlightRequests.delete(requestId);
  }

  onPreShutdown(callback) {
    this.preShutdownHooks.push(callback);
  }

  onPostShutdown(callback) {
    this.postShutdownHooks.push(callback);
  }

  async shutdown(signal = 'SIGTERM') {
    this.shuttingDown = true;

    // Run pre-shutdown hooks
    for (const hook of this.preShutdownHooks) {
      try {
        await hook();
      } catch (err) {
        console.error(`Pre-shutdown hook failed: ${err.message}`);
      }
    }

    // Wait for in-flight requests to complete
    const drainStart = Date.now();
    let lastLogTime = drainStart;

    while (this.inFlightRequests.size > 0) {
      const elapsed = Date.now() - drainStart;

      if (elapsed > this.drainTimeout) {
        console.error(`Shutdown timeout after ${elapsed}ms, force closing ${this.inFlightRequests.size} requests`);
        break;
      }

      // Log progress every 5 seconds
      if (Date.now() - lastLogTime > 5000) {
        console.log(`Draining requests: ${this.inFlightRequests.size} in-flight (${elapsed}ms elapsed)`);
        lastLogTime = Date.now();
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const finalElapsed = Date.now() - drainStart;
    console.log(`Graceful shutdown completed: ${finalElapsed}ms, ${this.inFlightRequests.size} requests remaining`);

    // Run post-shutdown hooks
    for (const hook of this.postShutdownHooks) {
      try {
        await hook();
      } catch (err) {
        console.error(`Post-shutdown hook failed: ${err.message}`);
      }
    }

    return {
      signal,
      elapsedMs: finalElapsed,
      requestsRemaining: this.inFlightRequests.size,
      timedOut: this.inFlightRequests.size > 0
    };
  }

  isShuttingDown() {
    return this.shuttingDown;
  }

  getStats() {
    return {
      shuttingDown: this.shuttingDown,
      inFlightRequests: this.inFlightRequests.size
    };
  }
}
