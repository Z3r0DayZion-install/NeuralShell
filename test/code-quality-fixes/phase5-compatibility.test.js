import { describe, it, expect } from 'vitest';
import { APIKeyManager, OAuth2Provider, RequestSigner } from '../../src/router/auth.js';
import { ConnectionPool } from '../../src/router/connectionPool.js';
import { SizeLimitedMap } from '../../src/router/size-limited-map.js';
import { TIMEOUTS, SIZE_LIMITS, INTERVALS } from '../../src/router/constants.js';

describe('Phase 5: Compatibility and Configuration', () => {
  describe('Property 22: API signatures and interfaces remain stable', () => {
    it('should maintain APIKeyManager interface', () => {
      const manager = new APIKeyManager();

      expect(typeof manager.generateKey).toBe('function');
      expect(typeof manager.validateKey).toBe('function');
      expect(typeof manager.revokeKey).toBe('function');
      expect(typeof manager.getKey).toBe('function');
      expect(typeof manager.listKeys).toBe('function');
    });

    it('should maintain OAuth2Provider interface', () => {
      const provider = new OAuth2Provider({
        clientId: 'test',
        clientSecret: 'secret',
        authorizationEndpoint: 'https://auth.example.com',
        tokenEndpoint: 'https://token.example.com'
      });

      expect(typeof provider.generateAuthorizationUrl).toBe('function');
      expect(typeof provider.exchangeCode).toBe('function');
      expect(typeof provider.refreshToken).toBe('function');
      expect(typeof provider.revokeToken).toBe('function');
    });

    it('should maintain RequestSigner interface', () => {
      const signer = new RequestSigner({ secretKey: 'test' });

      expect(typeof signer.sign).toBe('function');
      expect(typeof signer.verify).toBe('function');
      expect(typeof signer.generateSignature).toBe('function');
    });

    it('should maintain ConnectionPool interface', () => {
      const pool = new ConnectionPool();

      expect(typeof pool.request).toBe('function');
      expect(typeof pool.requestStream).toBe('function');
      expect(typeof pool.closeAll).toBe('function');
      expect(typeof pool.getMetrics).toBe('function');
    });
  });

  describe('Property 23: Configuration defaults', () => {
    it('should use default values when not configured', () => {
      const map = new SizeLimitedMap();

      expect(map.maxSize).toBe(1000);
      expect(map.ttl).toBeNull();
    });

    it('should use documented default timeouts', () => {
      expect(TIMEOUTS.REQUEST_TIMEOUT_MS).toBe(30000);
      expect(TIMEOUTS.SHUTDOWN_GRACE_PERIOD_MS).toBe(5000);
      expect(TIMEOUTS.STATE_EXPIRY_MS).toBe(600000);
    });

    it('should use documented default size limits', () => {
      expect(SIZE_LIMITS.MAX_OAUTH_STATES).toBe(1000);
      expect(SIZE_LIMITS.MAX_IDEMPOTENCY_KEYS).toBe(2000);
      expect(SIZE_LIMITS.MAX_AFFINITY_ENTRIES).toBe(10000);
    });
  });

  describe('Property 24: Configuration acceptance', () => {
    it('should accept custom maxSize configuration', () => {
      const map = new SizeLimitedMap({ maxSize: 500 });

      expect(map.maxSize).toBe(500);
    });

    it('should accept custom TTL configuration', () => {
      const map = new SizeLimitedMap({ maxSize: 1000, ttl: 30000 });

      expect(map.ttl).toBe(30000);
    });

    it('should accept custom timeout configuration', () => {
      const pool = new ConnectionPool({ timeout: 60000 });

      expect(pool.timeout).toBe(60000);
    });
  });

  describe('Property 25: Configuration-based behavior control', () => {
    it('should respect maxSize configuration', () => {
      const map = new SizeLimitedMap({ maxSize: 3, ttl: null });

      map.set('key1', 'value1');
      map.set('key2', 'value2');
      map.set('key3', 'value3');
      map.set('key4', 'value4');

      expect(map.size).toBe(3);
    });

    it('should respect TTL configuration', async () => {
      const map = new SizeLimitedMap({ maxSize: 10, ttl: 50 });

      map.set('key1', 'value1');
      expect(map.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(map.get('key1')).toBeUndefined();
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain existing error types', () => {
      const manager = new APIKeyManager();
      const result = manager.validateKey('invalid-key');

      expect(result.valid).toBe(false);
      expect(result.reason).toBeDefined();
    });

    it('should maintain existing response format', () => {
      const manager = new APIKeyManager();
      const { key, id, secret, data } = manager.generateKey();

      expect(key).toBeDefined();
      expect(id).toBeDefined();
      expect(secret).toBeDefined();
      expect(data).toBeDefined();
      expect(data.scopes).toBeDefined();
      expect(data.rateLimit).toBeDefined();
    });
  });

  describe('Constants module', () => {
    it('should export all required constants', () => {
      expect(TIMEOUTS).toBeDefined();
      expect(SIZE_LIMITS).toBeDefined();
      expect(INTERVALS).toBeDefined();
    });

    it('should have all timeout constants', () => {
      expect(TIMEOUTS.STATE_EXPIRY_MS).toBeDefined();
      expect(TIMEOUTS.REQUEST_TIMEOUT_MS).toBeDefined();
      expect(TIMEOUTS.SHUTDOWN_GRACE_PERIOD_MS).toBeDefined();
      expect(TIMEOUTS.CIRCUIT_BREAKER_TIMEOUT_MS).toBeDefined();
    });

    it('should have all size limit constants', () => {
      expect(SIZE_LIMITS.MAX_OAUTH_STATES).toBeDefined();
      expect(SIZE_LIMITS.MAX_IDEMPOTENCY_KEYS).toBeDefined();
      expect(SIZE_LIMITS.MAX_AFFINITY_ENTRIES).toBeDefined();
      expect(SIZE_LIMITS.MAX_CACHE_SIZE).toBeDefined();
    });
  });
});
