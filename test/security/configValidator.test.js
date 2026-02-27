/**
 * Configuration Validator Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigValidator, validateEnvironment } from '../../src/router/configValidator.js';

describe('ConfigValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('Server Configuration', () => {
    it('should validate valid server configuration', () => {
      const config = {
        server: { port: 3000, host: '0.0.0.0' },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid port numbers', () => {
      const config = {
        server: { port: 70000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('server.port must be between 1 and 65535');
    });

    it('should warn about missing host', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }]
      };

      const result = validator.validate(config);
      expect(result.warnings.some(w => w.includes('server.host'))).toBe(true);
    });

    it('should warn about very low timeout', () => {
      const config = {
        server: { port: 3000, requestTimeoutMs: 500 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }]
      };

      const result = validator.validate(config);
      expect(result.warnings.some(w => w.includes('requestTimeoutMs'))).toBe(true);
    });
  });

  describe('Endpoints Configuration', () => {
    it('should require at least one endpoint', () => {
      const config = {
        server: { port: 3000 },
        endpoints: []
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one endpoint must be configured');
    });

    it('should validate endpoint structure', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [
          { name: 'test1', url: 'https://api.example.com', model: 'model1' },
          { name: 'test2', url: 'https://api2.example.com', model: 'model2' }
        ]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should reject endpoints without name', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ url: 'https://api.example.com', model: 'test-model' }]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('name is required'))).toBe(true);
    });

    it('should reject endpoints with invalid URL', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'not-a-url', model: 'test-model' }]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('invalid url format'))).toBe(true);
    });

    it('should validate weight range', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model', weight: 150 }]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('weight must be between 0 and 100'))).toBe(true);
    });

    it('should validate priority', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model', priority: 0 }]
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('priority must be >= 1'))).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should warn about disabled security headers in production', () => {
      process.env.NODE_ENV = 'production';
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        security: { enableSecurityHeaders: false }
      };

      const result = validator.validate(config);
      expect(result.warnings.some(w => w.includes('Security headers'))).toBe(true);
    });

    it('should reject CORS wildcard in production', () => {
      process.env.NODE_ENV = 'production';
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        security: { corsAllowedOrigins: ['*'] }
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('CORS wildcard (*) not allowed in production');
    });

    it('should detect weak secrets in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY_SECRET = 'change-me-dev';

      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        security: {}
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('API_KEY_SECRET'))).toBe(true);

      delete process.env.API_KEY_SECRET;
    });
  });

  describe('Rate Limiting Configuration', () => {
    it('should validate rate limit settings', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        rateLimit: { enabled: true, requestsPerWindow: 100, windowMs: 60000 }
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid requestsPerWindow', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        rateLimit: { enabled: true, requestsPerWindow: 0, windowMs: 60000 }
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('requestsPerWindow'))).toBe(true);
    });

    it('should reject invalid windowMs', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        rateLimit: { enabled: true, requestsPerWindow: 100, windowMs: 500 }
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('windowMs'))).toBe(true);
    });
  });

  describe('Redis Configuration', () => {
    it('should require Redis URL when enabled', () => {
      delete process.env.REDIS_URL;
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        redis: { enabled: true }
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Redis enabled but no URL provided');
    });
  });

  describe('Logging Configuration', () => {
    it('should validate log levels', () => {
      const config = {
        server: { port: 3000 },
        endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
        logging: { level: 'invalid' }
      };

      const result = validator.validate(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('logging.level'))).toBe(true);
    });

    it('should accept valid log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug', 'trace'];

      for (const level of levels) {
        const config = {
          server: { port: 3000 },
          endpoints: [{ name: 'test', url: 'https://api.example.com', model: 'test-model' }],
          logging: { level }
        };

        const result = validator.validate(config);
        expect(result.valid).toBe(true);
      }
    });
  });

  describe('getSummary', () => {
    it('should return validation summary', () => {
      const config = {
        server: { port: 70000 },
        endpoints: []
      };

      validator.validate(config);
      const summary = validator.getSummary();

      expect(summary.valid).toBe(false);
      expect(summary.errorCount).toBeGreaterThan(0);
      expect(summary.errors).toBeDefined();
      expect(summary.warnings).toBeDefined();
    });
  });
});

describe('validateEnvironment', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should pass in development', () => {
    process.env.NODE_ENV = 'development';
    const result = validateEnvironment();
    expect(result.valid).toBe(true);
  });

  it('should require secrets in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.API_KEY_SECRET;
    delete process.env.JWT_SECRET;
    delete process.env.SESSION_SECRET;

    const result = validateEnvironment();
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should warn about short secrets', () => {
    process.env.NODE_ENV = 'production';
    process.env.API_KEY_SECRET = 'short';
    process.env.JWT_SECRET = 'short';
    process.env.SESSION_SECRET = 'short';

    const result = validateEnvironment();
    expect(result.warnings.length).toBeGreaterThan(0);

    delete process.env.API_KEY_SECRET;
    delete process.env.JWT_SECRET;
    delete process.env.SESSION_SECRET;
  });
});
