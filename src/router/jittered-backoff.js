// Jittered exponential backoff for retries
export class JitteredBackoff {
  constructor(config = {}) {
    this.baseDelayMs = config.baseDelayMs || 50;
    this.maxDelayMs = config.maxDelayMs || 30000;
    this.multiplier = config.multiplier || 2;
    this.jitterFactor = config.jitterFactor || 0.1; // 10% jitter
    this.strategy = config.strategy || 'exponential'; // exponential, linear, decorrelated
  }

  calculateDelay(attemptNumber = 0) {
    switch (this.strategy) {
    case 'linear':
      return this.linearBackoff(attemptNumber);
    case 'decorrelated':
      return this.decorrelatedBackoff(attemptNumber);
    case 'exponential':
    default:
      return this.exponentialBackoff(attemptNumber);
    }
  }

  exponentialBackoff(attemptNumber) {
    const exponentialDelay = this.baseDelayMs * Math.pow(this.multiplier, attemptNumber);
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    return this.addJitter(cappedDelay);
  }

  linearBackoff(attemptNumber) {
    const linearDelay = this.baseDelayMs * (attemptNumber + 1);
    const cappedDelay = Math.min(linearDelay, this.maxDelayMs);
    return this.addJitter(cappedDelay);
  }

  decorrelatedBackoff(attemptNumber, previousDelay = this.baseDelayMs) {
    // AWS-style decorrelated jitter
    const randomDelay = this.baseDelayMs + Math.random() * (previousDelay * this.multiplier - this.baseDelayMs);
    const cappedDelay = Math.min(randomDelay, this.maxDelayMs);
    return cappedDelay;
  }

  addJitter(delayMs) {
    const jitterAmount = delayMs * this.jitterFactor;
    const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
    return Math.max(0, delayMs + jitter);
  }

  fullJitter(attemptNumber) {
    // Full jitter formula: random(0, min(cap, base * 2^attempts))
    const cap = Math.min(this.maxDelayMs, this.baseDelayMs * Math.pow(2, attemptNumber));
    return Math.random() * cap;
  }

  async waitWithBackoff(attemptNumber) {
    const delayMs = this.calculateDelay(attemptNumber);
    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  getDelaySequence(maxAttempts) {
    const sequence = [];
    for (let i = 0; i < maxAttempts; i++) {
      sequence.push(this.calculateDelay(i));
    }
    return sequence;
  }

  getTotalBackoffTime(maxAttempts) {
    return this.getDelaySequence(maxAttempts).reduce((a, b) => a + b, 0);
  }
}

export function createRetryWithBackoff(fn, options = {}) {
  const backoff = new JitteredBackoff(options);
  const maxAttempts = options.maxAttempts || 3;

  return async function retry(...args) {
    let lastError;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (err) {
        lastError = err;

        if (attempt < maxAttempts - 1) {
          const delay = backoff.calculateDelay(attempt);
          console.log(`Retry attempt ${attempt + 1}/${maxAttempts} after ${delay}ms`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  };
}
