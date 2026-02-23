const STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half-open'
};

class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeoutMs = options.timeoutMs || 30000;
    this.halfOpenMaxRequests = options.halfOpenMaxRequests || 3;
    this.monitor = options.monitor || (() => {});

    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    this.stateChangeTimes = { [STATES.CLOSED]: Date.now() };
  }

  getState() {
    if (this.state === STATES.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.timeoutMs) {
        this.transitionTo(STATES.HALF_OPEN);
      }
    }
    return this.state;
  }

  transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.stateChangeTimes[newState] = Date.now();
    this.monitor({
      type: 'circuit_breaker_state_change',
      endpoint: this.name,
      oldState,
      newState,
      timestamp: Date.now()
    });

    if (newState === STATES.HALF_OPEN) {
      this.halfOpenRequests = 0;
    }
  }

  async execute(fn, timeout = null) {
    const state = this.getState();

    if (state === STATES.OPEN) {
      throw new Error(`Circuit breaker OPEN for ${this.name}`);
    }

    if (state === STATES.HALF_OPEN) {
      if (this.halfOpenRequests >= this.halfOpenMaxRequests) {
        throw new Error(`Circuit breaker half-open limit reached for ${this.name}`);
      }
      this.halfOpenRequests++;
    }

    try {
      let result;

      // Use Promise.race with timeout if provided
      if (timeout) {
        let timer;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Circuit breaker timeout after ${timeout}ms`)), timeout);
        });
        try {
          result = await Promise.race([fn(), timeoutPromise]);
        } finally {
          clearTimeout(timer);
        }
      } else {
        result = await fn();
      }

      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.totalSuccesses++;
    this.failureCount = 0;

    if (this.state === STATES.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.transitionTo(STATES.CLOSED);
        this.successCount = 0;
      }
    }

    this.monitor({
      type: 'circuit_breaker_success',
      endpoint: this.name,
      state: this.state,
      totalSuccesses: this.totalSuccesses
    });
  }

  onFailure() {
    this.totalFailures++;
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.state === STATES.HALF_OPEN) {
      this.transitionTo(STATES.OPEN);
    } else if (this.state === STATES.CLOSED && this.failureCount >= this.failureThreshold) {
      this.transitionTo(STATES.OPEN);
    }

    this.monitor({
      type: 'circuit_breaker_failure',
      endpoint: this.name,
      state: this.state,
      failureCount: this.failureCount,
      totalFailures: this.totalFailures
    });
  }

  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenRequests = 0;
    this.stateChangeTimes = { [STATES.CLOSED]: Date.now() };
  }

  getStats() {
    const uptime = Date.now() - this.stateChangeTimes[STATES.CLOSED] || 0;
    const total = this.totalSuccesses + this.totalFailures;
    const successRate = total > 0 ? (this.totalSuccesses / total) * 100 : 100;

    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
      successRate: `${successRate.toFixed(2) }%`,
      uptimeMs: uptime,
      lastFailureTime: this.lastFailureTime || null,
      stateChangeTimes: { ...this.stateChangeTimes }
    };
  }
}

class CircuitBreakerManager {
  constructor(options = {}) {
    this.breakers = new Map();
    this.defaultOptions = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeoutMs: options.timeoutMs || 30000,
      halfOpenMaxRequests: options.halfOpenMaxRequests || 3,
      enabled: options.enabled !== false
    };
    this.monitor = options.monitor || (() => {});
  }

  getOrCreate(name, options = {}) {
    if (!this.breakers.has(name)) {
      const breakerOptions = {
        ...this.defaultOptions,
        ...options,
        monitor: this.monitor
      };
      this.breakers.set(name, new CircuitBreaker(name, breakerOptions));
    }
    return this.breakers.get(name);
  }

  execute(name, fn, options = {}) {
    const breaker = this.getOrCreate(name, options);
    return breaker.execute(fn);
  }

  getState(name) {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.getState() : STATES.CLOSED;
  }

  getAllStats() {
    const stats = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  reset(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  remove(name) {
    this.breakers.delete(name);
  }

  removeAll() {
    this.breakers.clear();
  }

  isEnabled() {
    return this.defaultOptions.enabled;
  }
}

export { CircuitBreaker, CircuitBreakerManager, STATES };
