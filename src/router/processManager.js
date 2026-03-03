/**
 * Process Manager
 * Handles process lifecycle, auto-restart, and graceful shutdown
 */

import { EventEmitter } from 'events';

export class ProcessManager extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.maxRestarts = options.maxRestarts || 5;
    this.restartWindowMs = options.restartWindowMs || 60000;
    this.backoffMultiplier = options.backoffMultiplier || 2;
    this.maxBackoffMs = options.maxBackoffMs || 30000;
    this.minBackoffMs = options.minBackoffMs || 1000;
    
    this.restarts = [];
    this.currentBackoff = this.minBackoffMs;
    this.isShuttingDown = false;
    this.healthCheckInterval = null;
    this.memoryCheckInterval = null;
    
    this.metrics = {
      totalRestarts: 0,
      crashRestarts: 0,
      gracefulRestarts: 0,
      failedRestarts: 0,
      uptime: Date.now()
    };

    this.setupSignalHandlers();
  }

  /**
   * Setup signal handlers for graceful shutdown
   */
  setupSignalHandlers() {
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    process.on('uncaughtException', (error) => this.handleCrash(error));
    process.on('unhandledRejection', (reason) => this.handleCrash(reason));
  }

  /**
   * Handle process crash
   */
  async handleCrash(error) {
    console.error('[ProcessManager] Crash detected:', error);
    this.emit('crash', { error, timestamp: Date.now() });

    if (!this.enabled) {
      process.exit(1);
    }

    // Check if we should restart
    if (this.shouldRestart()) {
      this.metrics.crashRestarts++;
      await this.restart('crash');
    } else {
      console.error('[ProcessManager] Max restarts exceeded, exiting');
      process.exit(1);
    }
  }

  /**
   * Check if restart is allowed
   */
  shouldRestart() {
    const now = Date.now();
    
    // Remove old restart records
    this.restarts = this.restarts.filter(
      time => now - time < this.restartWindowMs
    );

    return this.restarts.length < this.maxRestarts;
  }

  /**
   * Restart the process
   */
  async restart(reason = 'manual') {
    if (this.isShuttingDown) {
      return { success: false, reason: 'already_shutting_down' };
    }

    console.log(`[ProcessManager] Restarting process: ${reason}`);
    this.metrics.totalRestarts++;
    this.restarts.push(Date.now());

    try {
      // Emit restart event for cleanup
      this.emit('before_restart', { reason, timestamp: Date.now() });

      // Wait for backoff
      await this.sleep(this.currentBackoff);

      // Increase backoff for next time
      this.currentBackoff = Math.min(
        this.currentBackoff * this.backoffMultiplier,
        this.maxBackoffMs
      );

      // In a real implementation, this would spawn a new process
      // For now, we emit an event that the application can handle
      this.emit('restart', { reason, timestamp: Date.now() });

      return { success: true, reason };
    } catch (error) {
      this.metrics.failedRestarts++;
      console.error('[ProcessManager] Restart failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Graceful restart
   */
  async gracefulRestart(reason = 'manual') {
    console.log(`[ProcessManager] Graceful restart: ${reason}`);
    this.metrics.gracefulRestarts++;
    
    this.emit('before_graceful_restart', { reason, timestamp: Date.now() });
    
    // Allow time for cleanup
    await this.sleep(1000);
    
    return this.restart(reason);
  }

  /**
   * Graceful shutdown
   */
  async gracefulShutdown(signal) {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log(`[ProcessManager] Graceful shutdown initiated: ${signal}`);

    this.emit('shutdown_start', { signal, timestamp: Date.now() });

    try {
      // Stop accepting new requests
      this.emit('stop_accepting_requests');

      // Wait for in-flight requests (max 30s)
      const shutdownTimeout = 30000;
      const shutdownStart = Date.now();

      while (Date.now() - shutdownStart < shutdownTimeout) {
        const inFlight = await this.getInFlightRequests();
        if (inFlight === 0) {
          break;
        }
        await this.sleep(100);
      }

      // Cleanup
      this.emit('cleanup');

      console.log('[ProcessManager] Graceful shutdown complete');
      this.emit('shutdown_complete', { signal, timestamp: Date.now() });

      process.exit(0);
    } catch (error) {
      console.error('[ProcessManager] Shutdown error:', error);
      process.exit(1);
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(healthCheck, intervalMs = 30000) {
    if (this.healthCheckInterval) {
      return;
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await healthCheck();
        
        if (!isHealthy) {
          console.warn('[ProcessManager] Health check failed');
          this.emit('unhealthy', { timestamp: Date.now() });
          
          // Auto-restart if unhealthy for too long
          await this.gracefulRestart('health_check_failed');
        }
      } catch (error) {
        console.error('[ProcessManager] Health check error:', error);
      }
    }, intervalMs);
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring(thresholdMB = 1024, intervalMs = 60000) {
    if (this.memoryCheckInterval) {
      return;
    }

    this.memoryCheckInterval = setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;

      if (heapUsedMB > thresholdMB) {
        console.warn(`[ProcessManager] Memory threshold exceeded: ${heapUsedMB.toFixed(2)}MB`);
        this.emit('memory_threshold_exceeded', { 
          heapUsedMB: heapUsedMB.toFixed(2),
          threshold: thresholdMB,
          timestamp: Date.now()
        });

        // Auto-restart on memory leak
        this.gracefulRestart('memory_threshold_exceeded');
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
  }

  /**
   * Get in-flight requests count (to be implemented by application)
   */
  async getInFlightRequests() {
    // This should be implemented by the application
    return 0;
  }

  /**
   * Get process statistics
   */
  getStats() {
    const uptime = Date.now() - this.metrics.uptime;
    const memory = process.memoryUsage();

    return {
      enabled: this.enabled,
      uptime: uptime,
      uptimeFormatted: this.formatUptime(uptime / 1000),
      metrics: { ...this.metrics },
      restarts: {
        recent: this.restarts.length,
        window: this.restartWindowMs,
        maxAllowed: this.maxRestarts
      },
      backoff: {
        current: this.currentBackoff,
        min: this.minBackoffMs,
        max: this.maxBackoffMs
      },
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
        rss: Math.round(memory.rss / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024)
      },
      isShuttingDown: this.isShuttingDown
    };
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    parts.push(`${secs}s`);

    return parts.join(' ');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ProcessManager;
