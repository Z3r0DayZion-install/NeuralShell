const { describe, it, expect, beforeEach } = require('@jest/globals');
const CircuitBreaker = require('../src/router/circuitBreaker');

describe('CircuitBreaker', () => {
  let cb;

  beforeEach(() => {
    cb = new CircuitBreaker({
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 1000
    });
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(cb.failureThreshold).toBe(3);
      expect(cb.successThreshold).toBe(2);
      expect(cb.timeout).toBe(1000);
      expect(cb.state).toBe('CLOSED');
    });
  });

  describe('execute', () => {
    it('should execute successful call', async () => {
      const result = await cb.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
      expect(cb.state).toBe('CLOSED');
    });

    it('should execute failed call', async () => {
      await expect(cb.execute(() => Promise.reject(new Error('fail'))))
        .rejects.toThrow('fail');
      expect(cb.failures).toBe(1);
    });

    it('should open circuit after threshold', async () => {
      for (let i = 0; i < 3; i++) {
        try {
          await cb.execute(() => Promise.reject(new Error('fail')));
        } catch (e) {}
      }
      expect(cb.state).toBe('OPEN');
    });

    it('should half-open after timeout', async () => {
      cb.state = 'OPEN';
      cb.lastFailureTime = Date.now() - 2000;
      const result = await cb.execute(() => Promise.resolve('success'));
      expect(result).toBe('success');
    });
  });

  describe('state transitions', () => {
    it('should transition from OPEN to HALF_OPEN', () => {
      cb.state = 'OPEN';
      cb.lastFailureTime = Date.now() - 2000;
      cb.canExecute();
      expect(cb.state).toBe('HALF_OPEN');
    });

    it('should transition from HALF_OPEN to CLOSED', async () => {
      cb.state = 'HALF_OPEN';
      cb.consecutiveSuccesses = 2;
      await cb.recordSuccess();
      expect(cb.state).toBe('CLOSED');
    });

    it('should transition from HALF_OPEN to OPEN', async () => {
      cb.state = 'HALF_OPEN';
      await cb.recordFailure();
      expect(cb.state).toBe('OPEN');
    });
  });

  describe('reset', () => {
    it('should reset circuit breaker', () => {
      cb.failures = 5;
      cb.state = 'OPEN';
      cb.reset();
      expect(cb.failures).toBe(0);
      expect(cb.state).toBe('CLOSED');
    });
  });

  describe('getHealth', () => {
    it('should return health status', () => {
      const health = cb.getHealth();
      expect(health).toBeDefined();
      expect(health.state).toBe('CLOSED');
    });
  });
});
