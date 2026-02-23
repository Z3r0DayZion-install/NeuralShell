/**
 * Security Logger Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SecurityLogger } from '../../src/router/securityLogger.js';

describe('SecurityLogger', () => {
  let logger;
  let consoleLogSpy;

  beforeEach(() => {
    logger = new SecurityLogger({ namespace: 'test' });
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('Correlation ID', () => {
    it('should generate correlation ID', () => {
      const correlationId = logger.getCorrelationId({});
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
      expect(correlationId.length).toBeGreaterThan(0);
    });

    it('should extract correlation ID from request headers', () => {
      const request = {
        headers: { 'x-correlation-id': 'test-correlation-123' }
      };
      const correlationId = logger.getCorrelationId(request);
      expect(correlationId).toBe('test-correlation-123');
    });

    it('should handle missing headers', () => {
      const correlationId = logger.getCorrelationId(null);
      expect(correlationId).toBeDefined();
      expect(typeof correlationId).toBe('string');
    });
  });

  describe('Log Entry Creation', () => {
    it('should create structured log entry', () => {
      const entry = logger.createLogEntry('info', 'test_event', { key: 'value' }, 'corr-123');
      
      expect(entry.timestamp).toBeDefined();
      expect(entry.level).toBe('info');
      expect(entry.namespace).toBe('test');
      expect(entry.event).toBe('test_event');
      expect(entry.correlationId).toBe('corr-123');
      expect(entry.key).toBe('value');
    });

    it('should generate correlation ID if not provided', () => {
      const entry = logger.createLogEntry('info', 'test_event');
      expect(entry.correlationId).toBeDefined();
    });

    it('should include timestamp in ISO format', () => {
      const entry = logger.createLogEntry('info', 'test_event');
      expect(() => new Date(entry.timestamp)).not.toThrow();
    });
  });

  describe('Security Event Logging', () => {
    it('should log security event', () => {
      const entry = logger.logSecurityEvent('test_event', { detail: 'test' }, 'corr-123');
      
      expect(entry.level).toBe('security');
      expect(entry.event).toBe('test_event');
      expect(entry.detail).toBe('test');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log as JSON', () => {
      logger.logSecurityEvent('test_event', { detail: 'test' });
      
      const loggedData = consoleLogSpy.mock.calls[0][0];
      expect(() => JSON.parse(loggedData)).not.toThrow();
    });
  });

  describe('Authentication Logging', () => {
    it('should log successful authentication', () => {
      const entry = logger.logAuthAttempt(true, {
        ip: '192.168.1.1',
        userAgent: 'test-agent',
        apiKey: 'sk-1234567890abcdef'
      });

      expect(entry.success).toBe(true);
      expect(entry.ip).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('test-agent');
      expect(entry.apiKey).toBe('sk-12345...');
    });

    it('should log failed authentication', () => {
      const entry = logger.logAuthAttempt(false, {
        ip: '192.168.1.1',
        reason: 'invalid_token'
      });

      expect(entry.success).toBe(false);
      expect(entry.reason).toBe('invalid_token');
    });

    it('should sanitize API keys', () => {
      const entry = logger.logAuthAttempt(true, {
        apiKey: 'sk-very-long-secret-key-12345'
      });

      expect(entry.apiKey).toBe('sk-very-...');
      expect(entry.apiKey).not.toContain('secret');
    });

    it('should handle missing API key', () => {
      const entry = logger.logAuthAttempt(true, {});
      expect(entry.apiKey).toBeNull();
    });
  });

  describe('Rate Limit Logging', () => {
    it('should log rate limit event', () => {
      const entry = logger.logRateLimit({
        ip: '192.168.1.1',
        endpoint: '/api/chat',
        limit: 100,
        window: 60000,
        retryAfter: 30
      });

      expect(entry.event).toBe('rate_limit_exceeded');
      expect(entry.ip).toBe('192.168.1.1');
      expect(entry.endpoint).toBe('/api/chat');
      expect(entry.limit).toBe(100);
      expect(entry.retryAfter).toBe(30);
    });
  });

  describe('Suspicious Activity Logging', () => {
    it('should log suspicious activity', () => {
      const entry = logger.logSuspiciousActivity('brute_force', {
        ip: '192.168.1.1',
        details: 'Multiple failed login attempts',
        severity: 'high'
      });

      expect(entry.event).toBe('suspicious_activity');
      expect(entry.type).toBe('brute_force');
      expect(entry.severity).toBe('high');
    });

    it('should default to medium severity', () => {
      const entry = logger.logSuspiciousActivity('unusual_pattern', {
        ip: '192.168.1.1'
      });

      expect(entry.severity).toBe('medium');
    });
  });

  describe('Access Denied Logging', () => {
    it('should log access denied', () => {
      const entry = logger.logAccessDenied('insufficient_permissions', {
        ip: '192.168.1.1',
        endpoint: '/admin',
        method: 'POST'
      });

      expect(entry.event).toBe('access_denied');
      expect(entry.reason).toBe('insufficient_permissions');
      expect(entry.endpoint).toBe('/admin');
    });
  });

  describe('Configuration Change Logging', () => {
    it('should log configuration changes', () => {
      const entry = logger.logConfigChange('endpoint_added', {
        user: 'admin',
        previous: null,
        new: { name: 'new-endpoint' }
      });

      expect(entry.event).toBe('config_change');
      expect(entry.change).toBe('endpoint_added');
      expect(entry.user).toBe('admin');
    });
  });

  describe('API Key Operations', () => {
    it('should log API key creation', () => {
      const entry = logger.logApiKeyOperation('create', {
        keyId: 'key-123',
        keyPrefix: 'sk-abc',
        user: 'admin'
      });

      expect(entry.event).toBe('api_key_operation');
      expect(entry.operation).toBe('create');
      expect(entry.keyId).toBe('key-123');
    });

    it('should log API key revocation', () => {
      const entry = logger.logApiKeyOperation('revoke', {
        keyId: 'key-123',
        user: 'admin'
      });

      expect(entry.operation).toBe('revoke');
    });
  });

  describe('Data Access Logging', () => {
    it('should log data access', () => {
      const entry = logger.logDataAccess('user_data', {
        action: 'read',
        user: 'user-123',
        ip: '192.168.1.1',
        success: true
      });

      expect(entry.event).toBe('data_access');
      expect(entry.resource).toBe('user_data');
      expect(entry.action).toBe('read');
      expect(entry.success).toBe(true);
    });
  });

  describe('Security Error Logging', () => {
    it('should log security errors', () => {
      const error = new Error('Security violation');
      error.code = 'SEC_001';

      const entry = logger.logSecurityError(error, {
        ip: '192.168.1.1',
        endpoint: '/api/secure'
      });

      expect(entry.event).toBe('security_error');
      expect(entry.error).toBe('Security violation');
      expect(entry.code).toBe('SEC_001');
      expect(entry.stack).toBeDefined();
    });
  });

  describe('Request Logger Middleware', () => {
    it('should create request logger middleware', () => {
      const middleware = logger.createRequestLogger();
      expect(typeof middleware).toBe('function');
    });

    it('should add correlation ID to request', async () => {
      const middleware = logger.createRequestLogger();
      const request = { 
        headers: {}, 
        method: 'GET', 
        url: '/test',
        ip: '127.0.0.1'
      };
      const reply = {
        header: jest.fn(),
        addHook: jest.fn()
      };

      await middleware(request, reply);

      expect(request.correlationId).toBeDefined();
      expect(reply.header).toHaveBeenCalledWith('x-correlation-id', request.correlationId);
    });

    it('should log request received', async () => {
      const middleware = logger.createRequestLogger();
      const request = { 
        headers: { 'user-agent': 'test' }, 
        method: 'POST', 
        url: '/api/test',
        ip: '192.168.1.1'
      };
      const reply = {
        header: jest.fn(),
        addHook: jest.fn()
      };

      await middleware(request, reply);

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedData = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(loggedData.event).toBe('request_received');
      expect(loggedData.method).toBe('POST');
      expect(loggedData.url).toBe('/api/test');
    });

    it('should register onSend hook for response logging', async () => {
      const middleware = logger.createRequestLogger();
      const request = { 
        headers: {}, 
        method: 'GET', 
        url: '/test',
        ip: '127.0.0.1'
      };
      const reply = {
        header: jest.fn(),
        addHook: jest.fn()
      };

      await middleware(request, reply);

      expect(reply.addHook).toHaveBeenCalledWith('onSend', expect.any(Function));
    });
  });

  describe('Custom Namespace', () => {
    it('should use custom namespace', () => {
      const customLogger = new SecurityLogger({ namespace: 'custom-app' });
      const entry = customLogger.createLogEntry('info', 'test');
      
      expect(entry.namespace).toBe('custom-app');
    });

    it('should default to neuralshell namespace', () => {
      const defaultLogger = new SecurityLogger();
      const entry = defaultLogger.createLogEntry('info', 'test');
      
      expect(entry.namespace).toBe('neuralshell');
    });
  });

  describe('Custom Correlation ID Header', () => {
    it('should use custom correlation ID header', () => {
      const customLogger = new SecurityLogger({ 
        correlationIdHeader: 'x-request-id' 
      });
      const request = {
        headers: { 'x-request-id': 'custom-123' }
      };

      const correlationId = customLogger.getCorrelationId(request);
      expect(correlationId).toBe('custom-123');
    });
  });
});
