import crypto from 'node:crypto';

/**
 * Constant-time string comparison to prevent timing attacks
 * Uses SHA-256 hashing to ensure equal-length buffer comparison
 * @param {string} a - First string to compare
 * @param {string} b - Second string to compare
 * @returns {boolean} True if strings are equal
 * @throws {TypeError} If arguments are not strings
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    // Return false instead of throwing to avoid error-based timing leaks
    return false;
  }

  // Hash both inputs to get fixed-length buffers (32 bytes for sha256)
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();

  // crypto.timingSafeEqual requires buffers of equal length
  // Since we use sha256, both buffers are guaranteed to be 32 bytes
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Sanitize objects for logging by removing sensitive data
 * @param {*} obj - Object to sanitize
 * @param {number} depth - Current recursion depth
 * @returns {*} Sanitized object
 */
export function sanitizeForLogging(obj, depth = 0) {
  if (depth > 3 || !obj || typeof obj !== 'object') {
    return obj;
  }

  const sensitiveKeys = [
    'authorization', 'Authorization',
    'api_key', 'apiKey', 'api-key',
    'secret', 'password', 'token',
    'client_secret', 'clientSecret'
  ];

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate OAuth state parameter
 * @param {string} state - State parameter to validate
 * @returns {boolean} True if valid
 * @throws {Error} If state is invalid
 */
export function validateOAuthState(state) {
  if (!state || typeof state !== 'string') {
    throw new Error('State must be a non-empty string');
  }

  if (state.length > 256) {
    throw new Error('State parameter too long (max 256 characters)');
  }

  if (!/^[A-Za-z0-9_-]+$/.test(state)) {
    throw new Error('State parameter contains invalid characters');
  }

  return true;
}
