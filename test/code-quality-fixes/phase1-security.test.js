import { describe, it, expect, beforeEach } from 'vitest';
import { timingSafeCompare, sanitizeForLogging, validateOAuthState } from '../../src/router/security-utils.js';
import { APIKeyManager, RequestSigner } from '../../src/router/auth.js';

describe('Phase 1: Security Fixes', () => {
  describe('Property 1: Constant-time API key validation', () => {
    it('should take similar time for valid and invalid keys', () => {
      const manager = new APIKeyManager();
      const { key: validKey } = manager.generateKey();
      const invalidKey = 'ns_invalid_1234567890abcdef';

      const validTimes = [];
      const invalidTimes = [];

      // Measure timing for valid keys
      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint();
        manager.validateKey(validKey);
        const end = process.hrtime.bigint();
        validTimes.push(Number(end - start));
      }

      // Measure timing for invalid keys
      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint();
        manager.validateKey(invalidKey);
        const end = process.hrtime.bigint();
        invalidTimes.push(Number(end - start));
      }

      const validAvg = validTimes.reduce((a, b) => a + b) / validTimes.length;
      const invalidAvg = invalidTimes.reduce((a, b) => a + b) / invalidTimes.length;
      const diff = Math.abs(validAvg - invalidAvg) / Math.max(validAvg, invalidAvg);

      // Timing difference should be less than 20% (allowing for some variance)
      expect(diff).toBeLessThan(0.2);
    });
  });

  describe('Property 2: Constant-time signature verification', () => {
    it('should take similar time for valid and invalid signatures', () => {
      const signer = new RequestSigner({ secretKey: 'test-secret' });
      const payload = { test: 'data' };
      const timestamp = Date.now();
      const nonce = 'test-nonce';

      const validSignature = signer.generateSignature(payload, timestamp, nonce);
      const invalidSignature = 'invalid-signature-1234567890abcdef';

      const validTimes = [];
      const invalidTimes = [];

      // Measure timing for valid signatures
      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint();
        signer.verify(payload, validSignature, timestamp, nonce);
        const end = process.hrtime.bigint();
        validTimes.push(Number(end - start));
      }

      // Measure timing for invalid signatures
      for (let i = 0; i < 100; i++) {
        const start = process.hrtime.bigint();
        signer.verify(payload, invalidSignature, timestamp, nonce);
        const end = process.hrtime.bigint();
        invalidTimes.push(Number(end - start));
      }

      const validAvg = validTimes.reduce((a, b) => a + b) / validTimes.length;
      const invalidAvg = invalidTimes.reduce((a, b) => a + b) / invalidTimes.length;
      const diff = Math.abs(validAvg - invalidAvg) / Math.max(validAvg, invalidAvg);

      // Timing difference should be less than 20%
      expect(diff).toBeLessThan(0.2);
    });
  });

  describe('Property 3: Log sanitization removes all sensitive data', () => {
    it('should remove API keys from logs', () => {
      const data = {
        api_key: 'secret-key-123',
        apiKey: 'another-secret',
        'api-key': 'yet-another-secret',
        normalField: 'visible'
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.api_key).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized['api-key']).toBe('[REDACTED]');
      expect(sanitized.normalField).toBe('visible');
    });

    it('should remove authorization headers', () => {
      const data = {
        headers: {
          authorization: 'Bearer token-123',
          Authorization: 'Bearer token-456',
          'content-type': 'application/json'
        }
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.headers.authorization).toBe('[REDACTED]');
      expect(sanitized.headers.Authorization).toBe('[REDACTED]');
      expect(sanitized.headers['content-type']).toBe('application/json');
    });

    it('should handle nested objects', () => {
      const data = {
        user: {
          name: 'John',
          password: 'secret123',
          settings: {
            token: 'abc123'
          }
        }
      };

      const sanitized = sanitizeForLogging(data);

      expect(sanitized.user.name).toBe('John');
      expect(sanitized.user.password).toBe('[REDACTED]');
      expect(sanitized.user.settings.token).toBe('[REDACTED]');
    });
  });

  describe('Property 8: OAuth state parameter validation', () => {
    it('should reject invalid state parameters', () => {
      expect(() => validateOAuthState('')).toThrow('State must be a non-empty string');
      expect(() => validateOAuthState(null)).toThrow('State must be a non-empty string');
      expect(() => validateOAuthState('a'.repeat(257))).toThrow('State parameter too long');
      expect(() => validateOAuthState('invalid chars!')).toThrow('State parameter contains invalid characters');
    });

    it('should accept valid state parameters', () => {
      expect(validateOAuthState('valid-state-123')).toBe(true);
      expect(validateOAuthState('ABC_def-123')).toBe(true);
    });
  });

  describe('timingSafeCompare', () => {
    it('should return true for equal strings', () => {
      expect(timingSafeCompare('test', 'test')).toBe(true);
      expect(timingSafeCompare('hello-world', 'hello-world')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(timingSafeCompare('test', 'test2')).toBe(false);
      expect(timingSafeCompare('hello', 'world')).toBe(false);
    });

    it('should throw for non-string arguments', () => {
      expect(() => timingSafeCompare(123, 'test')).toThrow(TypeError);
      expect(() => timingSafeCompare('test', null)).toThrow(TypeError);
    });
  });
});
