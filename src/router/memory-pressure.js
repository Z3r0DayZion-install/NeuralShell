// Memory pressure detection and auto-throttle
export class MemoryPressureDetector {
  constructor(config = {}) {
    this.thresholds = {
      warning: config.warningThresholdPercent || 70,
      critical: config.criticalThresholdPercent || 85,
      emergency: config.emergencyThresholdPercent || 95
    };

    this.state = 'NORMAL'; // NORMAL, WARNING, CRITICAL, EMERGENCY
    this.checkInterval = config.checkIntervalMs || 5000;
    this.throttleMultiplier = 1;
    this.stats = {
      checksPerformed: 0,
      timeInWarning: 0,
      timeInCritical: 0,
      timeInEmergency: 0,
      peakHeapUsagePercent: 0
    };

    this.lastCheckTime = Date.now();
    this.lastStateChange = Date.now();

    if (this.checkInterval > 0) {
      this.startMonitoring();
    }
  }

  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.check();
    }, this.checkInterval);
    this.monitoringInterval.unref?.();
  }

  check() {
    const memory = process.memoryUsage();
    const heapUsedPercent = (memory.heapUsed / memory.heapTotal) * 100;
    const externalPercent = (memory.external / memory.heapTotal) * 100;
    const rssPercent = (memory.rss / 1024 / 1024 / 1024) * 100;

    this.stats.checksPerformed += 1;
    this.stats.peakHeapUsagePercent = Math.max(this.stats.peakHeapUsagePercent, heapUsedPercent);

    const previousState = this.state;
    const now = Date.now();
    const timeSinceLastChange = now - this.lastStateChange;

    // Determine state
    if (heapUsedPercent >= this.thresholds.emergency) {
      this.state = 'EMERGENCY';
      this.throttleMultiplier = 0.1;
    } else if (heapUsedPercent >= this.thresholds.critical) {
      this.state = 'CRITICAL';
      this.throttleMultiplier = 0.5;
    } else if (heapUsedPercent >= this.thresholds.warning) {
      this.state = 'WARNING';
      this.throttleMultiplier = 0.8;
    } else {
      this.state = 'NORMAL';
      this.throttleMultiplier = 1;
    }

    // Track time in each state
    if (this.state !== previousState) {
      if (previousState === 'WARNING') {
        this.stats.timeInWarning += timeSinceLastChange;
      } else if (previousState === 'CRITICAL') {
        this.stats.timeInCritical += timeSinceLastChange;
      } else if (previousState === 'EMERGENCY') {
        this.stats.timeInEmergency += timeSinceLastChange;
      }

      this.lastStateChange = now;

      if (this.state !== 'NORMAL' && previousState === 'NORMAL') {
        console.warn(`Memory pressure detected: ${this.state} (${heapUsedPercent.toFixed(1)}%)`);
      } else if (this.state === 'NORMAL' && previousState !== 'NORMAL') {
        console.log(`Memory pressure resolved: back to NORMAL (${heapUsedPercent.toFixed(1)}%)`);
      }
    }

    this.lastCheckTime = now;

    return {
      state: this.state,
      heapUsedPercent: heapUsedPercent.toFixed(2),
      externalPercent: externalPercent.toFixed(2),
      rssPercent: rssPercent.toFixed(2),
      throttleMultiplier: this.throttleMultiplier
    };
  }

  shouldThrottle() {
    return this.state !== 'NORMAL';
  }

  getThrottleMultiplier() {
    return this.throttleMultiplier;
  }

  getThrottledConcurrency(baseConcurrency) {
    return Math.max(1, Math.floor(baseConcurrency * this.throttleMultiplier));
  }

  getThrottledRateLimit(baseRateLimit) {
    return Math.max(1, Math.floor(baseRateLimit * this.throttleMultiplier));
  }

  getState() {
    return {
      state: this.state,
      throttleMultiplier: this.throttleMultiplier,
      memory: this.check()
    };
  }

  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      return true;
    }
    return false;
  }

  getStats() {
    return {
      ...this.stats,
      currentState: this.state,
      currentThrottleMultiplier: this.throttleMultiplier
    };
  }

  destroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }
}
