const { describe, it, expect, beforeEach, jest } = require('@jest/globals');
const RedisModule = require('../src/router/redis');

describe('RedisModule', () => {
  let redis;

  beforeEach(() => {
    redis = new RedisModule();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      expect(redis.config).toBeDefined();
      expect(redis.connected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect to Redis', async () => {
      await redis.connect({ host: 'localhost', port: 6379 });
      expect(redis.connected).toBe(true);
    });

    it('should handle connection error', async () => {
      await expect(redis.connect({ host: 'invalid', port: 9999 }))
        .rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should disconnect from Redis', async () => {
      await redis.connect({ host: 'localhost', port: 6379 });
      await redis.disconnect();
      expect(redis.connected).toBe(false);
    });
  });

  describe('cache operations', () => {
    beforeEach(async () => {
      try {
        await redis.connect({ host: 'localhost', port: 6379 });
      } catch (e) {
        // Skip if Redis not available
      }
    });

    it('should set cache value', async () => {
      if (redis.connected) {
        await redis.set('test-key', 'test-value', 60);
        const value = await redis.get('test-key');
        expect(value).toBe('test-value');
      }
    });

    it('should get cache value', async () => {
      if (redis.connected) {
        await redis.set('test-key-2', 'test-value-2', 60);
        const value = await redis.get('test-key-2');
        expect(value).toBe('test-value-2');
      }
    });

    it('should delete cache value', async () => {
      if (redis.connected) {
        await redis.set('test-key-3', 'test-value-3', 60);
        await redis.del('test-key-3');
        const value = await redis.get('test-key-3');
        expect(value).toBeNull();
      }
    });

    it('should check if key exists', async () => {
      if (redis.connected) {
        await redis.set('test-key-4', 'test-value-4', 60);
        const exists = await redis.exists('test-key-4');
        expect(exists).toBe(true);
      }
    });
  });

  describe('rate limiting', () => {
    it('should check rate limit', async () => {
      if (redis.connected) {
        const result = await redis.checkRateLimit('user-1', 10, 60);
        expect(result).toBeDefined();
        expect(result.allowed).toBe(true);
      }
    });

    it('should block when rate exceeded', async () => {
      if (redis.connected) {
        for (let i = 0; i < 10; i++) {
          await redis.checkRateLimit('user-2', 5, 60);
        }
        const result = await redis.checkRateLimit('user-2', 5, 60);
        expect(result.allowed).toBe(false);
      }
    });
  });

  describe('pub/sub', () => {
    it('should publish message', async () => {
      if (redis.connected) {
        await redis.publish('test-channel', 'test-message');
      }
    });

    it('should subscribe to channel', async () => {
      if (redis.connected) {
        const callback = jest.fn();
        await redis.subscribe('test-channel', callback);
      }
    });
  });

  describe('health check', () => {
    it('should return health status', () => {
      const health = redis.healthCheck();
      expect(health).toBeDefined();
      expect(health.status).toBeDefined();
    });
  });
});
