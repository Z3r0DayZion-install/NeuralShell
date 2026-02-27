/**
 * Security Event Logger
 * Provides structured logging for security-related events
 */

import { randomUUID } from 'crypto';

export class SecurityLogger {
  constructor(options = {}) {
    this.namespace = options.namespace || 'neuralshell';
    this.logLevel = options.logLevel || 'info';
    this.correlationIdHeader = options.correlationIdHeader || 'x-correlation-id';
  }

  /**
   * Generate or extract correlation ID
   */
  getCorrelationId(request) {
    return request?.headers?.[this.correlationIdHeader] || randomUUID();
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, event, data = {}, correlationId = null) {
    return {
      timestamp: new Date().toISOString(),
      level,
      namespace: this.namespace,
      event,
      correlationId: correlationId || randomUUID(),
      ...data
    };
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, data = {}, correlationId = null) {
    const entry = this.createLogEntry('security', event, data, correlationId);
    console.log(JSON.stringify(entry));
    return entry;
  }

  /**
   * Log authentication attempt
   */
  logAuthAttempt(success, data = {}, correlationId = null) {
    return this.logSecurityEvent('auth_attempt', {
      success,
      ip: data.ip,
      userAgent: data.userAgent,
      apiKey: data.apiKey ? `${data.apiKey.substring(0, 8)}...` : null,
      reason: data.reason
    }, correlationId);
  }

  /**
   * Log rate limit event
   */
  logRateLimit(data = {}, correlationId = null) {
    return this.logSecurityEvent('rate_limit_exceeded', {
      ip: data.ip,
      endpoint: data.endpoint,
      limit: data.limit,
      window: data.window,
      retryAfter: data.retryAfter
    }, correlationId);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(type, data = {}, correlationId = null) {
    return this.logSecurityEvent('suspicious_activity', {
      type,
      ip: data.ip,
      userAgent: data.userAgent,
      details: data.details,
      severity: data.severity || 'medium'
    }, correlationId);
  }

  /**
   * Log access denied
   */
  logAccessDenied(reason, data = {}, correlationId = null) {
    return this.logSecurityEvent('access_denied', {
      reason,
      ip: data.ip,
      endpoint: data.endpoint,
      method: data.method,
      userAgent: data.userAgent
    }, correlationId);
  }

  /**
   * Log configuration change
   */
  logConfigChange(change, data = {}, correlationId = null) {
    return this.logSecurityEvent('config_change', {
      change,
      user: data.user,
      previous: data.previous,
      new: data.new,
      timestamp: new Date().toISOString()
    }, correlationId);
  }

  /**
   * Log API key operation
   */
  logApiKeyOperation(operation, data = {}, correlationId = null) {
    return this.logSecurityEvent('api_key_operation', {
      operation,
      keyId: data.keyId,
      keyPrefix: data.keyPrefix,
      user: data.user,
      expiresAt: data.expiresAt
    }, correlationId);
  }

  /**
   * Log data access
   */
  logDataAccess(resource, data = {}, correlationId = null) {
    return this.logSecurityEvent('data_access', {
      resource,
      action: data.action,
      user: data.user,
      ip: data.ip,
      success: data.success
    }, correlationId);
  }

  /**
   * Log error with security context
   */
  logSecurityError(error, data = {}, correlationId = null) {
    return this.logSecurityEvent('security_error', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      ip: data.ip,
      endpoint: data.endpoint
    }, correlationId);
  }

  /**
   * Create request logger middleware
   */
  createRequestLogger() {
    return async (request, reply) => {
      const correlationId = this.getCorrelationId(request);

      // Add correlation ID to request
      request.correlationId = correlationId;

      // Add correlation ID to response headers
      reply.header(this.correlationIdHeader, correlationId);

      // Log request
      const requestLog = this.createLogEntry('info', 'request_received', {
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      }, correlationId);

      console.log(JSON.stringify(requestLog));

      // Track response time
      const startTime = Date.now();

      reply.addHook('onSend', async (req, replyHook, _payload) => {
        const duration = Date.now() - startTime;

        const responseLog = this.createLogEntry('info', 'request_completed', {
          method: req.method,
          url: req.url,
          statusCode: replyHook.statusCode,
          duration,
          ip: req.ip
        }, correlationId);

        console.log(JSON.stringify(responseLog));
      });
    };
  }
}

export default SecurityLogger;
