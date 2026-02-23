// Advanced circuit breaker with exponential backoff and half-open probing
export class AdvancedCircuitBreaker {
  constructor(config = {}) {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenProbes = 0;

    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000,
      halfOpenMaxProbes: config.halfOpenMaxProbes || 3,
      backoffMultiplier: config.backoffMultiplier || 2,
      maxBackoff: config.maxBackoff || 300000,
      jitterFactor: config.jitterFactor || 0.1
    };

    this.failureLevel = 0;
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount += 1;
      if (this.successCount >= this.config.successThreshold) {
        this.reset();
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  recordFailure() {
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED') {
      this.failureCount += 1;
      if (this.failureCount >= this.config.failureThreshold) {
        this.trip();
      }
    } else if (this.state === 'HALF_OPEN') {
      this.open();
    }
  }

  trip() {
    this.state = 'OPEN';
    this.failureLevel += 1;
    this.failureCount = 0;
  }

  open() {
    this.state = 'OPEN';
    this.successCount = 0;
    this.failureCount = 0;
  }

  attemptProbe() {
    if (this.state !== 'OPEN') {
      return false;
    }

    const elapsed = Date.now() - this.lastFailureTime;
    const backoffMs = this.calculateBackoff();

    if (elapsed >= backoffMs) {
      this.state = 'HALF_OPEN';
      this.halfOpenProbes = 0;
      this.successCount = 0;
      return true;
    }

    return false;
  }

  calculateBackoff() {
    const baseBackoff = this.config.timeout;
    const exponentialBackoff = baseBackoff * Math.pow(this.config.backoffMultiplier, this.failureLevel - 1);
    const cappedBackoff = Math.min(exponentialBackoff, this.config.maxBackoff);
    const jitter = cappedBackoff * this.config.jitterFactor * Math.random();
    return cappedBackoff + jitter;
  }

  canExecute() {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'HALF_OPEN') {
      return this.halfOpenProbes < this.config.halfOpenMaxProbes;
    }

    return this.attemptProbe();
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.failureLevel = Math.max(0, this.failureLevel - 1);
    this.lastFailureTime = null;
    this.halfOpenProbes = 0;
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureLevel: this.failureLevel,
      nextProbeInMs: this.state === 'OPEN' ? this.calculateBackoff() : 0,
      canExecute: this.canExecute()
    };
  }
}
