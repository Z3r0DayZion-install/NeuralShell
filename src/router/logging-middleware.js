import { createLogger } from './logger.js';

const logger = createLogger();

export function createLoggingMiddleware(options = {}) {
  const {
    logRequestBody = false,
    logResponseBody = false,
    sensitiveHeaders = ['x-prompt-token', 'x-admin-token', 'authorization'],
    excludePaths = ['/health', '/ready', '/metrics']
  } = options;

  return {
    onRequest: async (request, reply) => {
      request.logStartTime = Date.now();

      const shouldLog = !excludePaths.includes(request.url.split('?')[0]);

      if (shouldLog) {
        const headers = sanitizeHeaders(request.headers, sensitiveHeaders);
        const logData = {
          event: 'http_request',
          method: request.method,
          path: request.url,
          ip: request.ip,
          userAgent: request.headers['user-agent'],
          headers
        };

        if (logRequestBody && request.body) {
          logData.bodySize = JSON.stringify(request.body).length;
          if (request.body.messages) {
            logData.messageCount = request.body.messages.length;
          }
        }

        logger.debug('http_request', logData);
      }
    },

    onResponse: async (request, reply) => {
      const shouldLog = !excludePaths.includes(request.url.split('?')[0]);

      if (shouldLog) {
        const elapsedMs = Date.now() - request.logStartTime;
        const logLevel = reply.statusCode >= 500 ? 'error' : reply.statusCode >= 400 ? 'warn' : 'info';

        const logData = {
          event: 'http_response',
          method: request.method,
          path: request.url,
          statusCode: reply.statusCode,
          elapsedMs,
          requestId: reply.getHeader('x-request-id')
        };

        if (reply.statusCode >= 400) {
          logData.errorCode = reply.getHeader('x-error-code');
        }

        logger[logLevel]('http_response', logData);
      }
    },

    onError: async (request, reply, error) => {
      logger.error('request_error', {
        event: 'request_error',
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        errorMessage: error.message,
        errorStack: error.stack,
        requestId: reply.getHeader('x-request-id')
      });
    }
  };
}

export function createMetricsLoggingMiddleware(metrics) {
  return {
    onResponse: async (request, reply) => {
      const path = request.url.split('?')[0];

      // Log every 100 requests
      if (metrics.totalRequests % 100 === 0) {
        logger.info('metrics_snapshot', {
          event: 'metrics_snapshot',
          totalRequests: metrics.totalRequests,
          successRequests: metrics.successRequests,
          failedRequests: metrics.failedRequests,
          rateLimitedRequests: metrics.rateLimitedRequests,
          avgSuccessRate: `${(
            (metrics.successRequests / Math.max(1, metrics.totalRequests)) * 100
          ).toFixed(2) }%`
        });
      }
    }
  };
}

export function createPerformanceLoggingMiddleware(options = {}) {
  const { slowThresholdMs = 1000, enableDetailedTiming = false } = options;

  return {
    onResponse: async (request, reply) => {
      const elapsedMs = Date.now() - request.logStartTime;

      if (enableDetailedTiming) {
        logger.debug('performance_timing', {
          event: 'performance_timing',
          path: request.url,
          method: request.method,
          elapsedMs,
          statusCode: reply.statusCode
        });
      }

      if (elapsedMs > slowThresholdMs) {
        logger.warn('slow_request', {
          event: 'slow_request',
          path: request.url,
          method: request.method,
          elapsedMs,
          threshold: slowThresholdMs,
          statusCode: reply.statusCode
        });
      }
    }
  };
}

function sanitizeHeaders(headers, sensitiveKeys) {
  const sanitized = { ...headers };
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
}
