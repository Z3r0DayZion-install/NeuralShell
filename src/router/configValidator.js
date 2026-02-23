/**
 * Configuration Validator
 * Validates configuration against schema and security requirements
 */

export class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate complete configuration
   */
  validate(config) {
    this.errors = [];
    this.warnings = [];

    this.validateServer(config.server);
    this.validateEndpoints(config.endpoints);
    this.validateSecurity(config.security);
    this.validateRateLimit(config.rateLimit);
    this.validateRedis(config.redis);
    this.validateCircuitBreaker(config.circuitBreaker);
    this.validateCache(config.cache);
    this.validateLogging(config.logging);
    this.validateMonitoring(config.monitoring);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  /**
   * Validate server configuration
   */
  validateServer(server = {}) {
    if (server.port === undefined || server.port === null || server.port < 0 || server.port > 65535) {
      this.errors.push('server.port must be between 0 and 65535');
    }

    if (server.port === 0) {
      this.warnings.push('server.port is 0 (ephemeral port); intended for testing/runtime proof');
    }

    if (!server.host) {
      this.warnings.push('server.host not specified, defaulting to 0.0.0.0');
    }

    if (server.requestTimeoutMs && server.requestTimeoutMs < 1000) {
      this.warnings.push('server.requestTimeoutMs is very low, may cause timeouts');
    }

    if (server.maxConcurrentRequests && server.maxConcurrentRequests < 10) {
      this.warnings.push('server.maxConcurrentRequests is very low');
    }
  }

  /**
   * Validate endpoints configuration
   */
  validateEndpoints(endpoints = []) {
    if (!Array.isArray(endpoints) || endpoints.length === 0) {
      this.errors.push('At least one endpoint must be configured');
      return;
    }

    endpoints.forEach((endpoint, index) => {
      if (!endpoint.name) {
        this.errors.push(`Endpoint ${index}: name is required`);
      }

      if (!endpoint.url) {
        this.errors.push(`Endpoint ${index}: url is required`);
      } else if (!this.isValidUrl(endpoint.url)) {
        this.errors.push(`Endpoint ${index}: invalid url format`);
      }

      if (!endpoint.model) {
        this.warnings.push(`Endpoint ${index}: model not specified`);
      }

      if (endpoint.weight !== undefined && (endpoint.weight < 0 || endpoint.weight > 100)) {
        this.errors.push(`Endpoint ${index}: weight must be between 0 and 100`);
      }

      if (endpoint.priority !== undefined && endpoint.priority < 0) {
        this.errors.push(`Endpoint ${index}: priority must be >= 0`);
      }
    });
  }

  /**
   * Validate security configuration
   */
  validateSecurity(security = {}) {
    if (process.env.NODE_ENV === 'production') {
      if (!security.enableSecurityHeaders) {
        this.warnings.push('Security headers should be enabled in production');
      }

      if (!security.corsAllowedOrigins || security.corsAllowedOrigins.length === 0) {
        this.warnings.push('CORS origins should be restricted in production');
      }

      if (security.corsAllowedOrigins?.includes('*')) {
        this.errors.push('CORS wildcard (*) not allowed in production');
      }

      // Check for default/weak secrets
      if (process.env.API_KEY_SECRET?.includes('change') ||
          process.env.API_KEY_SECRET?.includes('dev')) {
        this.errors.push('API_KEY_SECRET appears to be a default value - change it!');
      }

      if (process.env.JWT_SECRET?.includes('change') ||
          process.env.JWT_SECRET?.includes('dev')) {
        this.errors.push('JWT_SECRET appears to be a default value - change it!');
      }
    }
  }

  /**
   * Validate rate limiting configuration
   */
  validateRateLimit(rateLimit = {}) {
    if (process.env.NODE_ENV === 'production' && !rateLimit.enabled) {
      this.warnings.push('Rate limiting should be enabled in production');
    }

    if (rateLimit.enabled) {
      if (!rateLimit.requestsPerWindow || rateLimit.requestsPerWindow < 1) {
        this.errors.push('rateLimit.requestsPerWindow must be >= 1');
      }

      if (!rateLimit.windowMs || rateLimit.windowMs < 1000) {
        this.errors.push('rateLimit.windowMs must be >= 1000');
      }
    }
  }

  /**
   * Validate Redis configuration
   */
  validateRedis(redis = {}) {
    if (redis.enabled) {
      if (!redis.url && !process.env.REDIS_URL) {
        this.errors.push('Redis enabled but no URL provided');
      }

      if (process.env.NODE_ENV === 'production' && !process.env.REDIS_PASSWORD) {
        this.warnings.push('Redis password should be set in production');
      }
    }
  }

  /**
   * Validate circuit breaker configuration
   */
  validateCircuitBreaker(circuitBreaker = {}) {
    if (circuitBreaker.enabled) {
      if (!circuitBreaker.failureThreshold || circuitBreaker.failureThreshold < 1) {
        this.errors.push('circuitBreaker.failureThreshold must be >= 1');
      }

      if (!circuitBreaker.timeoutMs || circuitBreaker.timeoutMs < 1000) {
        this.warnings.push('circuitBreaker.timeoutMs is very low');
      }
    }
  }

  /**
   * Validate cache configuration
   */
  validateCache(cache = {}) {
    if (cache.enabled) {
      if (!cache.ttlSeconds || cache.ttlSeconds < 1) {
        this.errors.push('cache.ttlSeconds must be >= 1');
      }

      if (cache.ttlSeconds > 3600) {
        this.warnings.push('cache.ttlSeconds is very high, may serve stale data');
      }
    }
  }

  /**
   * Validate logging configuration
   */
  validateLogging(logging = {}) {
    const validLevels = ['error', 'warn', 'info', 'debug', 'trace'];

    if (logging.level && !validLevels.includes(logging.level)) {
      this.errors.push(`logging.level must be one of: ${validLevels.join(', ')}`);
    }

    if (process.env.NODE_ENV === 'production' && logging.level === 'debug') {
      this.warnings.push('Debug logging in production may impact performance');
    }
  }

  /**
   * Validate monitoring configuration
   */
  validateMonitoring(monitoring = {}) {
    if (monitoring.prometheusEnabled) {
      if (!monitoring.prometheusPort || monitoring.prometheusPort < 1 || monitoring.prometheusPort > 65535) {
        this.errors.push('monitoring.prometheusPort must be between 1 and 65535');
      }
    }
  }

  /**
   * Validate URL format
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get validation summary
   */
  getSummary() {
    return {
      valid: this.errors.length === 0,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    };
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Required in production
  if (process.env.NODE_ENV === 'production') {
    const required = [
      'API_KEY_SECRET',
      'JWT_SECRET',
      'SESSION_SECRET'
    ];

    for (const envVar of required) {
      if (!process.env[envVar]) {
        errors.push(`${envVar} is required in production`);
      }
    }

    // Check for weak secrets
    const secrets = ['API_KEY_SECRET', 'JWT_SECRET', 'SESSION_SECRET'];
    for (const secret of secrets) {
      const value = process.env[secret];
      if (value && value.length < 32) {
        warnings.push(`${secret} should be at least 32 characters`);
      }
    }
  }

  // Validate Redis if enabled
  if (process.env.REDIS_ENABLED === 'true' && !process.env.REDIS_URL) {
    errors.push('REDIS_URL is required when REDIS_ENABLED is true');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

export default ConfigValidator;
