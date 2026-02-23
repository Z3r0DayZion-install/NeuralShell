import fs from 'fs';
import path from 'path';
import { sanitizeForLogging } from './security-utils.js';

export function createLogger(options = {}) {
  const level = String(options.level || process.env.LOG_LEVEL || 'info').toLowerCase();
  const logFile = options.logFile || process.env.LOG_FILE || '';
  const levels = new Set(['debug', 'info', 'warn', 'error']);
  const thresholdOrder = ['debug', 'info', 'warn', 'error'];
  const thresholdIndex = thresholdOrder.indexOf(levels.has(level) ? level : 'info');

  function shouldLog(candidate) {
    return thresholdOrder.indexOf(candidate) >= thresholdIndex;
  }

  function emit(candidate, event, payload = {}) {
    if (!shouldLog(candidate)) {
      return;
    }
    const entry = {
      ts: new Date().toISOString(),
      level: candidate,
      event,
      ...payload
    };
    const line = `${JSON.stringify(entry)}\n`;
    if (candidate === 'error') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
    if (logFile) {
      const dir = path.dirname(logFile);
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(logFile, line, 'utf8');
      } catch {
        // Best-effort file logging; console logging remains primary.
      }
    }
  }

  return {
    debug: (event, payload) => emit('debug', event, payload),
    info: (event, payload) => emit('info', event, payload),
    warn: (event, payload) => emit('warn', event, payload),
    error: (event, payload) => emit('error', event, payload)
  };
}

/**
 * Log an error with consistent formatting and sanitization
 * @param {Object} logger - Logger instance
 * @param {string} context - Context or event name
 * @param {Error} error - Error object
 * @param {Object} metadata - Additional metadata
 */
export function logError(logger, context, error, metadata = {}) {
  const sanitizedMetadata = sanitizeForLogging(metadata);
  const errorInfo = {
    message: error.message,
    code: error.code,
    name: error.name,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...sanitizedMetadata
  };

  logger.error(context, errorInfo);
}

/**
 * Log a request with sanitization
 * @param {Object} logger - Logger instance
 * @param {Object} request - Request object
 * @param {Object} metadata - Additional metadata
 */
export function logRequest(logger, request, metadata = {}) {
  const sanitized = sanitizeForLogging({
    method: request.method,
    url: request.url,
    headers: request.headers,
    ...metadata
  });

  logger.info('Request', sanitized);
}
