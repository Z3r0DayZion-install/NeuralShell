import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_SCHEMA_VERSION = '1.0.0';

const schema = {
  type: 'object',
  properties: {
    version: { type: 'string' },
    server: {
      type: 'object',
      properties: {
        profile: { type: 'string', enum: ['local', 'lan', 'public'] },
        port: { type: 'number', minimum: 0, maximum: 65535 },
        host: { type: 'string' },
        trustProxy: { type: 'boolean' },
        tls: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            pfxPath: { type: 'string' },
            pfxPassphraseEnv: { type: 'string' },
            certPath: { type: 'string' },
            keyPath: { type: 'string' },
            caPath: { type: 'string' },
            requireClientCert: { type: 'boolean' }
          }
        },
        requestTimeoutMs: { type: 'number', minimum: 0 },
        requestBodyLimitBytes: { type: 'number', minimum: 0 },
        maxConcurrentRequests: { type: 'number', minimum: 1 },
        gracefulShutdownTimeoutMs: { type: 'number', minimum: 0 },
        enableHttp2: { type: 'boolean' }
      }
    },
    endpoints: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'url'],
        properties: {
          name: { type: 'string', pattern: '^[a-zA-Z0-9._-]+$' },
          url: { type: 'string', format: 'uri' },
          model: { type: 'string' },
          apiKey: { type: 'string' },
          provider: { type: 'string' },
          deployment: { type: 'string' },
          region: { type: 'string' },
          weight: { type: 'number', minimum: 0, maximum: 100 },
          timeoutMs: { type: 'number', minimum: 0 },
          maxRetries: { type: 'number', minimum: 0 },
          costPer1kInput: { type: 'number', minimum: 0 },
          costPer1kOutput: { type: 'number', minimum: 0 },
          priority: { type: 'number', minimum: 0, maximum: 10 },
          enabled: { type: 'boolean' },
          headers: { type: 'object' }
        }
      }
    },
    routing: {
      type: 'object',
      properties: {
        strategy: { type: 'string', enum: ['failover', 'round-robin', 'weighted', 'cost-optimal', 'latency-optimal'] },
        adaptive: { type: 'boolean' },
        retryTimeoutMs: { type: 'number', minimum: 0 },
        retryBackoffMs: { type: 'number', minimum: 0 },
        maxRetries: { type: 'number', minimum: 0 },
        failoverDelayMs: { type: 'number', minimum: 0 }
      }
    },
    rateLimit: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        requestsPerWindow: { type: 'number', minimum: 1 },
        windowMs: { type: 'number', minimum: 1000 },
        byApiKey: { type: 'boolean' },
        byIp: { type: 'boolean' },
        backend: { type: 'string', enum: ['memory', 'redis'] },
        redisUrl: { type: 'string' }
      }
    },
    circuitBreaker: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        failureThreshold: { type: 'number', minimum: 1 },
        successThreshold: { type: 'number', minimum: 1 },
        timeoutMs: { type: 'number', minimum: 0 },
        halfOpenMaxRequests: { type: 'number', minimum: 1 }
      }
    },
    cache: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        ttlSeconds: { type: 'number', minimum: 0 },
        maxSize: { type: 'number', minimum: 0 },
        backend: { type: 'string', enum: ['memory', 'redis'] },
        redisUrl: { type: 'string' }
      }
    },
    security: {
      type: 'object',
      properties: {
        adminToken: { type: 'string' },
        promptToken: { type: 'string' },
        adminIpAllowlist: { type: 'array', items: { type: 'string' } },
        requireJsonContentType: { type: 'boolean' },
        strictPromptFields: { type: 'boolean' },
        enableSecurityHeaders: { type: 'boolean' },
        corsAllowedOrigins: { type: 'array', items: { type: 'string' } },
        blockedTerms: { type: 'array', items: { type: 'string' } },
        ipAllowlist: { type: 'array', items: { type: 'string' } },
        ipDenylist: { type: 'array', items: { type: 'string' } }
      }
    },
    logging: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
        format: { type: 'string', enum: ['json', 'text'] },
        output: { type: 'string', enum: ['stdout', 'file'] },
        file: { type: 'string' },
        maxFiles: { type: 'number', minimum: 1 },
        maxSize: { type: 'string' },
        redactPii: { type: 'boolean' }
      }
    },
    monitoring: {
      type: 'object',
      properties: {
        prometheusEnabled: { type: 'boolean' },
        prometheusPort: { type: 'number' },
        otlpEndpoint: { type: 'string' },
        exportIntervalMs: { type: 'number' },
        tracingEnabled: { type: 'boolean' },
        sampleRate: { type: 'number', minimum: 0, maximum: 1 }
      }
    },
    persistence: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        runtimeStateFile: { type: 'string' },
        rateLimitStateFile: { type: 'string' },
        idempotencyStateFile: { type: 'string' },
        intervalMs: { type: 'number', minimum: 1000 }
      }
    },
    limits: {
      type: 'object',
      properties: {
        maxMessagesPerRequest: { type: 'number', minimum: 1 },
        maxMessageChars: { type: 'number', minimum: 1 },
        maxTotalMessageChars: { type: 'number', minimum: 1 },
        maxResponseChars: { type: 'number', minimum: 1 },
        maxConcurrentRequests: { type: 'number', minimum: 1 },
        maxQueueSize: { type: 'number', minimum: 1 }
      }
    },
    features: {
      type: 'object',
      properties: {
        dryRun: { type: 'boolean' },
        skipOpenaiWhenNoKey: { type: 'boolean' },
        includeFailuresOnSuccess: { type: 'boolean' },
        streaming: { type: 'boolean' },
        idempotency: { type: 'boolean' },
        adminAudit: { type: 'boolean' }
      }
    }
  }
};

function validateConfig(config, filePath = 'config') {
  const errors = [];

  if (!config.version) {
    errors.push(`${filePath}: missing required field 'version'`);
  }

  for (const [section, sectionSchema] of Object.entries(schema.properties)) {
    if (!config[section]) {
      continue;
    }

    const sectionErrors = validateSection(config[section], sectionSchema, `${filePath}.${section}`);
    errors.push(...sectionErrors);
  }

  if (config.endpoints) {
    const names = new Set();
    for (let i = 0; i < config.endpoints.length; i++) {
      const ep = config.endpoints[i];
      if (names.has(ep.name)) {
        errors.push(`${filePath}.endpoints[${i}]: duplicate endpoint name '${ep.name}'`);
      }
      names.add(ep.name);
    }
  }

  return errors;
}

function validateSection(section, schema, path) {
  const errors = [];

  if (schema.properties) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (section[key] === undefined) {
        continue;
      }

      const value = section[key];

      if (propSchema.type === 'number' && typeof value !== 'number') {
        errors.push(`${path}.${key}: expected number, got ${typeof value}`);
        continue;
      }

      if (propSchema.type === 'string' && typeof value !== 'string') {
        errors.push(`${path}.${key}: expected string, got ${typeof value}`);
        continue;
      }

      if (propSchema.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${path}.${key}: expected boolean, got ${typeof value}`);
        continue;
      }

      if (propSchema.type === 'array' && !Array.isArray(value)) {
        errors.push(`${path}.${key}: expected array, got ${typeof value}`);
        continue;
      }

      if (propSchema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        errors.push(`${path}.${key}: expected object, got ${typeof value}`);
        continue;
      }

      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.push(`${path}.${key}: must be one of ${propSchema.enum.join(', ')}, got '${value}'`);
      }

      if (propSchema.pattern) {
        const regex = new RegExp(propSchema.pattern);
        if (!regex.test(value)) {
          errors.push(`${path}.${key}: must match pattern ${propSchema.pattern}`);
        }
      }

      if (propSchema.minimum !== undefined && value < propSchema.minimum) {
        errors.push(`${path}.${key}: must be >= ${propSchema.minimum}`);
      }

      if (propSchema.maximum !== undefined && value > propSchema.maximum) {
        errors.push(`${path}.${key}: must be <= ${propSchema.maximum}`);
      }

      if (propSchema.format === 'uri') {
        try {
          new URL(value);
        } catch {
          errors.push(`${path}.${key}: must be a valid URI`);
        }
      }
    }
  }

  return errors;
}

function mergeWithDefaults(config) {
  const serverInput = config.server && typeof config.server === 'object' ? config.server : {};
  const tlsInput = serverInput.tls && typeof serverInput.tls === 'object' ? serverInput.tls : {};
  return {
    version: CONFIG_SCHEMA_VERSION,
    server: {
      profile: 'local',
      port: 3000,
      host: '127.0.0.1',
      trustProxy: false,
      requestTimeoutMs: 5000,
      requestBodyLimitBytes: 262144,
      maxConcurrentRequests: 32,
      gracefulShutdownTimeoutMs: 30000,
      enableHttp2: false,
      ...serverInput,
      tls: {
        enabled: false,
        pfxPath: '',
        pfxPassphraseEnv: '',
        certPath: '',
        keyPath: '',
        caPath: '',
        requireClientCert: false,
        ...tlsInput
      }
    },
    endpoints: config.endpoints || [],
    routing: {
      strategy: 'failover',
      adaptive: true,
      retryTimeoutMs: 5000,
      retryBackoffMs: 50,
      maxRetries: 1,
      failoverDelayMs: 100,
      ...config.routing
    },
    rateLimit: {
      enabled: true,
      requestsPerWindow: 120,
      windowMs: 60000,
      byApiKey: true,
      byIp: true,
      backend: 'memory',
      ...config.rateLimit
    },
    circuitBreaker: {
      enabled: false,
      failureThreshold: 5,
      successThreshold: 2,
      timeoutMs: 30000,
      halfOpenMaxRequests: 3,
      ...config.circuitBreaker
    },
    cache: {
      enabled: false,
      ttlSeconds: 300,
      maxSize: 1000,
      backend: 'memory',
      ...config.cache
    },
    security: {
      adminToken: '',
      promptToken: '',
      adminIpAllowlist: [],
      requireJsonContentType: false,
      strictPromptFields: false,
      enableSecurityHeaders: true,
      corsAllowedOrigins: [],
      blockedTerms: [],
      ipAllowlist: [],
      ipDenylist: [],
      ...config.security
    },
    logging: {
      level: 'info',
      format: 'json',
      output: 'stdout',
      maxFiles: 7,
      maxSize: '10m',
      redactPii: true,
      ...config.logging
    },
    monitoring: {
      prometheusEnabled: false,
      prometheusPort: 9090,
      otlpEndpoint: '',
      exportIntervalMs: 60000,
      tracingEnabled: false,
      sampleRate: 0.1,
      ...config.monitoring
    },
    persistence: {
      enabled: true,
      runtimeStateFile: 'state/router_runtime_state.json',
      rateLimitStateFile: 'state/router_rate_limits.json',
      idempotencyStateFile: 'state/router_idempotency.json',
      intervalMs: 5000,
      ...config.persistence
    },
    limits: {
      maxMessagesPerRequest: 64,
      maxMessageChars: 8000,
      maxTotalMessageChars: 32000,
      maxResponseChars: 32000,
      maxConcurrentRequests: 32,
      maxQueueSize: 128,
      ...config.limits
    },
    features: {
      dryRun: false,
      skipOpenaiWhenNoKey: true,
      includeFailuresOnSuccess: false,
      streaming: false,
      idempotency: true,
      adminAudit: true,
      ...config.features
    }
  };
}

function substituteEnvVars(obj) {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] || '');
  }
  if (Array.isArray(obj)) {
    return obj.map(substituteEnvVars);
  }
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVars(value);
    }
    return result;
  }
  return obj;
}

export async function loadConfig(configPath, configFormat = 'auto') {
  const formats = {
    yaml: ['.yaml', '.yml'],
    json: ['.json'],
    auto: ['.yaml', '.yml', '.json']
  };

  let filePath = configPath;
  let format = configFormat;

  if (format === 'auto') {
    const ext = path.extname(configPath).toLowerCase();
    if (['.yaml', '.yml'].includes(ext)) {
      format = 'yaml';
    } else if (ext === '.json') {
      format = 'json';
    } else {
      for (const f of formats.auto) {
        const trial = configPath + f;
        if (fs.existsSync(trial)) {
          filePath = trial;
          format = f === '.json' ? 'json' : 'yaml';
          break;
        }
      }
    }
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`Config file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  let config;

  if (format === 'yaml') {
    try {
      const yaml = await import('yaml');
      config = yaml.parse(content);
    } catch (err) {
      throw new Error(`Failed to parse YAML config: ${err.message}`);
    }
  } else {
    try {
      config = JSON.parse(content);
    } catch (err) {
      throw new Error(`Failed to parse JSON config: ${err.message}`);
    }
  }

  config = substituteEnvVars(config);

  const errors = validateConfig(config, filePath);
  if (errors.length > 0) {
    throw new Error(`Config validation failed:\n${errors.join('\n')}`);
  }

  return mergeWithDefaults(config);
}

export function getConfigSchema() {
  return schema;
}

export { CONFIG_SCHEMA_VERSION };
