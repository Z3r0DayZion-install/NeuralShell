import { createLogger } from './logger.js';

const logger = createLogger();

const ENV_SCHEMA = {
  PORT: { type: 'integer', min: 1, max: 65535, default: 3000 },
  NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'], default: 'production' },
  REQUEST_TIMEOUT_MS: { type: 'integer', min: 100, max: 60000, default: 5000 },
  REQUEST_BODY_LIMIT_BYTES: { type: 'integer', min: 1024, max: 10485760, default: 262144 },
  MAX_CONCURRENT_REQUESTS: { type: 'integer', min: 1, max: 10000, default: 32 },
  MAX_MESSAGES_PER_REQUEST: { type: 'integer', min: 1, max: 1000, default: 64 },
  MAX_MESSAGE_CHARS: { type: 'integer', min: 100, max: 1000000, default: 8000 },
  MAX_TOTAL_MESSAGE_CHARS: { type: 'integer', min: 100, max: 10000000, default: 32000 },
  UPSTREAM_FAILURE_COOLDOWN_MS: { type: 'integer', min: 100, max: 600000, default: 3000 },
  MAX_ENDPOINT_FAILURES_BEFORE_COOLDOWN: { type: 'integer', min: 1, max: 100, default: 2 },
  RESPONSE_MAX_CHARS: { type: 'integer', min: 100, max: 10000000, default: 32000 },
  REQUEST_RETRY_ON_TIMEOUT: { type: 'integer', min: 0, max: 10, default: 1 },
  REQUEST_RETRY_BACKOFF_MS: { type: 'integer', min: 0, max: 5000, default: 50 },
  RATE_LIMIT_WINDOW_MS: { type: 'integer', min: 1000, max: 3600000, default: 60000 },
  REQUESTS_PER_WINDOW: { type: 'integer', min: 1, max: 100000, default: 120 },
  RATE_LIMIT_MAX_KEYS: { type: 'integer', min: 10, max: 1000000, default: 10000 },
  IDEMPOTENCY_TTL_MS: { type: 'integer', min: 1000, max: 3600000, default: 60000 },
  MAX_IDEMPOTENCY_KEYS: { type: 'integer', min: 10, max: 1000000, default: 2000 },
  MAX_ENDPOINTS: { type: 'integer', min: 1, max: 1000, default: 32 },
  MAX_FAILURES_REPORTED: { type: 'integer', min: 1, max: 100, default: 10 },
  APP_VERSION: { type: 'string', default: 'dev' },
  OPENAI_API_KEY: { type: 'string', optional: true },
  ADMIN_TOKEN: { type: 'string', optional: true },
  PROMPT_API_TOKEN: { type: 'string', optional: true },
  ALLOW_DRY_RUN: { type: 'boolean', default: false },
  SKIP_OPENAI_WHEN_NO_KEY: { type: 'boolean', default: true },
  ENABLE_SECURITY_HEADERS: { type: 'boolean', default: true },
  PERSIST_VOLATILE_STATE: { type: 'boolean', default: false }
};

export function validateEnvironment() {
  const errors = [];
  const warnings = [];
  const validated = {};

  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];

    if (value === undefined) {
      if (schema.optional) {
        validated[key] = null;
        continue;
      }
      if (schema.default !== undefined) {
        validated[key] = schema.default;
        continue;
      }
      errors.push(`Missing required environment variable: ${key}`);
      continue;
    }

    try {
      let validated_value;

      switch (schema.type) {
      case 'integer':
        validated_value = parseInt(value, 10);
        if (!Number.isFinite(validated_value)) {
          throw new Error(`Expected integer, got ${value}`);
        }
        if (schema.min && validated_value < schema.min) {
          throw new Error(`Value ${validated_value} is below minimum ${schema.min}`);
        }
        if (schema.max && validated_value > schema.max) {
          throw new Error(`Value ${validated_value} exceeds maximum ${schema.max}`);
        }
        break;

      case 'boolean':
        validated_value = value === '1' || value === 'true' || value === 'yes';
        break;

      case 'string':
        validated_value = String(value).trim();
        if (schema.enum && !schema.enum.includes(validated_value)) {
          throw new Error(`Value "${validated_value}" must be one of: ${schema.enum.join(', ')}`);
        }
        break;

      default:
        validated_value = value;
      }

      validated[key] = validated_value;
    } catch (err) {
      errors.push(`Invalid value for ${key}: ${err.message}`);
    }
  }

  // Additional cross-field validation
  if (validated.MAX_TOTAL_MESSAGE_CHARS < validated.MAX_MESSAGE_CHARS) {
    errors.push('MAX_TOTAL_MESSAGE_CHARS must be >= MAX_MESSAGE_CHARS');
  }

  if (validated.REQUEST_TIMEOUT_MS < 100) {
    warnings.push('REQUEST_TIMEOUT_MS is very low (<100ms), may cause false timeouts');
  }

  if (validated.REQUEST_TIMEOUT_MS > 60000) {
    warnings.push('REQUEST_TIMEOUT_MS is very high (>60s), consider reducing');
  }

  if (!validated.ADMIN_TOKEN && !process.env.ADMIN_TOKEN_SHA256) {
    warnings.push('No admin token configured, admin endpoints will be open');
  }

  if (!validated.PROMPT_API_TOKEN && !process.env.PROMPT_API_TOKEN_SHA256) {
    warnings.push('No prompt API token configured, /prompt endpoint will be open');
  }

  if (validated.NODE_ENV === 'production') {
    if (!validated.ADMIN_TOKEN && !process.env.ADMIN_TOKEN_SHA256) {
      errors.push('Admin token is required in production');
    }
    if (!validated.PROMPT_API_TOKEN && !process.env.PROMPT_API_TOKEN_SHA256) {
      errors.push('Prompt API token is required in production');
    }
  }

  return { validated, errors, warnings };
}

export function logEnvironmentValidation(result) {
  if (result.errors.length > 0) {
    logger.error('environment_validation_failed', {
      errorCount: result.errors.length,
      errors: result.errors
    });
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    logger.warn('environment_validation_warnings', {
      warningCount: result.warnings.length,
      warnings: result.warnings
    });
  }

  logger.info('environment_validated', {
    nodeEnv: result.validated.NODE_ENV,
    port: result.validated.PORT,
    maxConcurrent: result.validated.MAX_CONCURRENT_REQUESTS,
    rateLimitWindowMs: result.validated.RATE_LIMIT_WINDOW_MS,
    requestsPerWindow: result.validated.REQUESTS_PER_WINDOW
  });
}
