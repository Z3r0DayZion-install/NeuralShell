import Fastify from 'fastify';
import fetch from 'node-fetch';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'url';
import crypto from 'crypto';
import { createLogger } from './src/router/logger.js';
import {
  appendAuditLogBounded,
  fileStats,
  readJsonFile,
  tailJsonLines,
  writeJsonFile
} from './src/router/stateStore.js';
import { orderEndpointsAdaptive } from './src/router/selector.js';
import { containsBlockedTerm, parseBlockedTerms, parseCsvSet, validateBootConfig } from './src/router/policy.js';
import { AutonomyController } from './src/router/autonomyController.js';
import { calculateQualityScore } from './qualityScoring.js';

const PORT = Number(process.env.PORT || 3000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 5000);
const REQUEST_BODY_LIMIT_BYTES = Number(process.env.REQUEST_BODY_LIMIT_BYTES || 262144);
const MAX_CONCURRENT_REQUESTS = Number(process.env.MAX_CONCURRENT_REQUESTS || 32);
const MAX_MESSAGES_PER_REQUEST = Number(process.env.MAX_MESSAGES_PER_REQUEST || 64);
const MAX_MESSAGE_CHARS = Number(process.env.MAX_MESSAGE_CHARS || 8000);
const MAX_TOTAL_MESSAGE_CHARS = Number(process.env.MAX_TOTAL_MESSAGE_CHARS || 32000);
const UPSTREAM_FAILURE_COOLDOWN_MS = Number(process.env.UPSTREAM_FAILURE_COOLDOWN_MS || 3000);
const MAX_ENDPOINT_FAILURES_BEFORE_COOLDOWN = Number(process.env.MAX_ENDPOINT_FAILURES_BEFORE_COOLDOWN || 2);
const EXPOSE_UPSTREAM_ERRORS = process.env.EXPOSE_UPSTREAM_ERRORS !== '0';
const EXPOSE_ENDPOINT_URLS = process.env.EXPOSE_ENDPOINT_URLS === '1';
const STRICT_ROLE_VALIDATION = process.env.STRICT_ROLE_VALIDATION === '1';
const REQUEST_RETRY_ON_TIMEOUT = Number(process.env.REQUEST_RETRY_ON_TIMEOUT || 1);
const REQUEST_RETRY_BACKOFF_MS = Number(process.env.REQUEST_RETRY_BACKOFF_MS || 50);
const RESPONSE_MAX_CHARS = Number(process.env.RESPONSE_MAX_CHARS || 32000);
const LATENCY_SAMPLE_SIZE = Number(process.env.LATENCY_SAMPLE_SIZE || 200);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const REQUESTS_PER_WINDOW = Number(process.env.REQUESTS_PER_WINDOW || 120);
const RATE_LIMIT_MAX_KEYS = Number(process.env.RATE_LIMIT_MAX_KEYS || 10000);
const RATE_LIMIT_CLEANUP_INTERVAL_MS = Number(process.env.RATE_LIMIT_CLEANUP_INTERVAL_MS || 60000);
const ENDPOINT_REQUESTS_PER_WINDOW = Number(process.env.ENDPOINT_REQUESTS_PER_WINDOW || 1000);
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const ADMIN_TOKEN_SHA256 = process.env.ADMIN_TOKEN_SHA256 || '';
const PROMPT_API_TOKEN = process.env.PROMPT_API_TOKEN || '';
const PROMPT_API_TOKEN_SHA256 = process.env.PROMPT_API_TOKEN_SHA256 || '';
const ALLOW_DRY_RUN = process.env.ALLOW_DRY_RUN === '1';
const SKIP_OPENAI_WHEN_NO_KEY = process.env.SKIP_OPENAI_WHEN_NO_KEY !== '0';
const INCLUDE_FAILURES_ON_SUCCESS = process.env.INCLUDE_FAILURES_ON_SUCCESS === '1';
const APP_VERSION = process.env.APP_VERSION || 'dev';
const ADAPTIVE_ROUTING = process.env.ADAPTIVE_ROUTING !== '0';
const MAX_QUEUE_SIZE = Number(process.env.MAX_QUEUE_SIZE || 128);
const REQUEST_QUEUE_TIMEOUT_MS = Number(process.env.REQUEST_QUEUE_TIMEOUT_MS || 10000);
const ENABLE_SECURITY_HEADERS = process.env.ENABLE_SECURITY_HEADERS !== '0';
const CORS_ALLOWED_ORIGINS = parseCsvSet(process.env.CORS_ALLOWED_ORIGINS || '');
const BLOCKED_TERMS = parseBlockedTerms(process.env.BLOCKED_TERMS || '');
const RUNTIME_STATE_FILE = process.env.RUNTIME_STATE_FILE || 'state/router_runtime_state.json';
const RATE_LIMIT_STATE_FILE = process.env.RATE_LIMIT_STATE_FILE || 'state/router_rate_limits.json';
const IDEMPOTENCY_STATE_FILE = process.env.IDEMPOTENCY_STATE_FILE || 'state/router_idempotency.json';
const PERSIST_VOLATILE_STATE = process.env.PERSIST_VOLATILE_STATE === '1';
const PERSIST_STATE_INTERVAL_MS = Number(process.env.PERSIST_STATE_INTERVAL_MS || 5000);
const ADMIN_AUDIT_LOG = process.env.ADMIN_AUDIT_LOG || 'state/router_admin_audit.log';
const ADMIN_AUDIT_MAX_BYTES = Number(process.env.ADMIN_AUDIT_MAX_BYTES || 1048576);
const ADMIN_AUDIT_RECENT_DEFAULT_LIMIT = Number(process.env.ADMIN_AUDIT_RECENT_DEFAULT_LIMIT || 50);
const OTLP_HTTP_ENDPOINT = process.env.OTLP_HTTP_ENDPOINT || '';
const OTLP_EXPORT_INTERVAL_MS = Number(process.env.OTLP_EXPORT_INTERVAL_MS || 60000);
const IDEMPOTENCY_TTL_MS = Number(process.env.IDEMPOTENCY_TTL_MS || 60000);
const MAX_IDEMPOTENCY_KEYS = Number(process.env.MAX_IDEMPOTENCY_KEYS || 2000);
const REQUIRE_JSON_CONTENT_TYPE = process.env.REQUIRE_JSON_CONTENT_TYPE === '1';
const MAX_ENDPOINTS = Number(process.env.MAX_ENDPOINTS || 32);
const MAX_FAILURES_REPORTED = Number(process.env.MAX_FAILURES_REPORTED || 10);
const STRICT_PROMPT_FIELDS = process.env.STRICT_PROMPT_FIELDS === '1';
const MAX_CLIENT_KEY_CHARS = Number(process.env.MAX_CLIENT_KEY_CHARS || 128);
const VALID_ROLES = new Set(['system', 'user', 'assistant', 'tool']);
const ALLOWED_PROMPT_FIELDS = new Set(['messages']);
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const ENDPOINT_NAME_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const RESET_METRICS_TOKEN = process.env.RESET_METRICS_TOKEN || '';
const DISABLED_ENDPOINTS = parseCsvSet(process.env.DISABLED_ENDPOINTS || '');
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/;
const SNAPSHOT_SCHEMA_VERSION = 1;
const ERROR_CATALOG = [
  'ADMIN_FORBIDDEN',
  'ALL_ENDPOINTS_FAILED',
  'BLOCKED_CONTENT',
  'IDEMPOTENCY_PAYLOAD_MISMATCH',
  'INVALID_CLIENT_REQUEST_ID',
  'INVALID_ENDPOINTS',
  'INVALID_IDEMPOTENCY_KEY',
  'INVALID_PAYLOAD',
  'INVALID_PAYLOAD_FIELDS',
  'INVALID_PAYLOAD_TYPE',
  'INVALID_RELOAD_PAYLOAD',
  'METRICS_RESET_FORBIDDEN',
  'NO_ACTIVE_ENDPOINTS',
  'OVERLOADED',
  'PROMPT_AUTH_FAILED',
  'RATE_LIMITED',
  'UNSUPPORTED_CONTENT_TYPE'
];

const DEFAULT_ENDPOINTS = [
  { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
  { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' },
  { name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }
];

function normalizeMessages(payload, policy = {}) {
  const maxMessagesPerRequest = normalizePositiveNumber(
    policy.maxMessagesPerRequest,
    MAX_MESSAGES_PER_REQUEST
  );
  const maxMessageChars = normalizePositiveNumber(policy.maxMessageChars, MAX_MESSAGE_CHARS);
  const maxTotalMessageChars = normalizePositiveNumber(
    policy.maxTotalMessageChars,
    MAX_TOTAL_MESSAGE_CHARS
  );
  const strictRoleValidation = normalizeBoolean(
    policy.strictRoleValidation,
    STRICT_ROLE_VALIDATION
  );
  if (!payload || !Array.isArray(payload.messages) || payload.messages.length === 0) {
    throw new Error('Invalid payload: messages[] is required');
  }
  if (payload.messages.length > maxMessagesPerRequest) {
    throw new Error(`Invalid payload: messages[] exceeds max length (${maxMessagesPerRequest})`);
  }
  let totalChars = 0;
  return payload.messages.map((m, index) => {
    if (!m || typeof m.content !== 'string' || !m.content.trim()) {
      throw new Error(`Invalid payload: messages[${index}].content must be a non-empty string`);
    }
    if (m.content.length > maxMessageChars) {
      throw new Error(`Invalid payload: messages[${index}].content exceeds max chars (${maxMessageChars})`);
    }
    const rawRole = typeof m.role === 'string' ? m.role : 'user';
    if (strictRoleValidation && !VALID_ROLES.has(rawRole)) {
      throw new Error(`Invalid payload: messages[${index}].role is not allowed`);
    }
    const role = VALID_ROLES.has(rawRole) ? rawRole : 'user';
    const content = m.content.trim();
    totalChars += content.length;
    if (totalChars > maxTotalMessageChars) {
      throw new Error(`Invalid payload: messages total chars exceeds max (${maxTotalMessageChars})`);
    }
    return { role, content };
  });
}

function normalizePositiveNumber(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeBoolean(value, fallback) {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

function validateRequestId(candidate) {
  if (typeof candidate !== 'string') {
    return false;
  }
  return REQUEST_ID_PATTERN.test(candidate);
}

function validateIdempotencyKey(candidate) {
  if (typeof candidate !== 'string') {
    return false;
  }
  return IDEMPOTENCY_KEY_PATTERN.test(candidate);
}

function computePayloadFingerprint(messages) {
  const canonical = JSON.stringify(
    messages.map((m) => ({ role: String(m.role || ''), content: String(m.content || '') }))
  );
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

async function readErrorBody(res) {
  try {
    const text = await res.text();
    return text ? text.slice(0, 400) : '';
  } catch {
    return '';
  }
}

async function fetchWithTimeout(fetchImpl, url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new Error('timeout');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

async function callEndpoint(ep, payload, fetchImpl = fetch, options = {}) {
  const timeoutMs = normalizePositiveNumber(options.timeoutMs, REQUEST_TIMEOUT_MS);
  const responseMaxChars = normalizePositiveNumber(options.responseMaxChars, RESPONSE_MAX_CHARS);
  const messages = normalizeMessages(payload, options.payloadPolicy);

  if (ep.name === 'ollama-local') {
    const res = await fetchWithTimeout(fetchImpl, ep.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: ep.model, prompt: messages.map((m) => m.content).join('\n') })
    }, timeoutMs);
    if (!res.ok) {
      const body = await readErrorBody(res);
      throw new Error(`Ollama request failed (${res.status})${body ? `: ${body}` : ''}`);
    }
    const data = await res.json();
    if (!data || typeof data.response !== 'string') {
      throw new Error('Invalid ollama response');
    }
    const content = String(data.response);
    return { content: content.slice(0, responseMaxChars), truncated: content.length > responseMaxChars };
  } else {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    const res = await fetchWithTimeout(fetchImpl, ep.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: ep.model,
        messages
      })
    }, timeoutMs);
    if (!res.ok) {
      const body = await readErrorBody(res);
      throw new Error(`OpenAI request failed (${res.status})${body ? `: ${body}` : ''}`);
    }
    const data = await res.json();
    if (!data?.choices?.[0]?.message) {
      throw new Error('Invalid OpenAI response');
    }
    const msg = data.choices[0].message;
    const content = typeof msg.content === 'string' ? msg.content : String(msg.content ?? '');
    return {
      ...msg,
      content: content.slice(0, responseMaxChars),
      truncated: content.length > responseMaxChars
    };
  }
}

function normalizeEndpoint(ep, index) {
  if (!ep || typeof ep !== 'object') {
    throw new Error(`Invalid endpoint at index ${index}`);
  }
  const name = typeof ep.name === 'string' ? ep.name.trim() : '';
  const url = typeof ep.url === 'string' ? ep.url.trim() : '';
  const model = typeof ep.model === 'string' ? ep.model.trim() : '';
  if (!name || !url || !model) {
    throw new Error(`Endpoint ${index} requires non-empty name, url, and model`);
  }
  if (!ENDPOINT_NAME_PATTERN.test(name)) {
    throw new Error(`Endpoint ${index} name is invalid`);
  }
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Endpoint ${index} has invalid url`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Endpoint ${index} uses unsupported protocol`);
  }
  return { name, url, model };
}

function assertUniqueEndpointNames(endpoints) {
  const seen = new Set();
  for (const ep of endpoints) {
    if (seen.has(ep.name)) {
      throw new Error(`Duplicate endpoint name: ${ep.name}`);
    }
    seen.add(ep.name);
  }
}

function loadEndpointsFromEnv() {
  const raw = process.env.ROUTER_ENDPOINTS_JSON;
  if (!raw) {
    return null;
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('ROUTER_ENDPOINTS_JSON must be a non-empty array');
  }
  if (parsed.length > MAX_ENDPOINTS) {
    throw new Error(`ROUTER_ENDPOINTS_JSON exceeds max endpoints (${MAX_ENDPOINTS})`);
  }
  const normalized = parsed.map(normalizeEndpoint);
  assertUniqueEndpointNames(normalized);
  return normalized;
}

function createRequestId() {
  return crypto.randomUUID();
}

function errorPayload(code, message, requestId, extra = {}) {
  return { code, error: message, ...(requestId ? { requestId } : {}), ...extra };
}

function appendLatencySample(metrics, latencyMs) {
  metrics.latencySamples.push(latencyMs);
  if (metrics.latencySamples.length > LATENCY_SAMPLE_SIZE) {
    metrics.latencySamples.shift();
  }
}

function summarizeLatency(latencySamples) {
  if (!latencySamples.length) {
    return { minMs: null, maxMs: null, avgMs: null, p95Ms: null, samples: 0 };
  }
  const sorted = [...latencySamples].sort((a, b) => a - b);
  const minMs = sorted[0];
  const maxMs = sorted[sorted.length - 1];
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const avgMs = Number((sum / sorted.length).toFixed(2));
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  const p95Ms = sorted[p95Index];
  return { minMs, maxMs, avgMs, p95Ms, samples: sorted.length };
}

function summarizeEndpoints(endpointState) {
  return endpointState.map((ep) => ({
    name: ep.name,
    inCooldown: ep.cooldownUntil > Date.now(),
    totalSelected: ep.totalSelected,
    totalSuccesses: ep.totalSuccesses,
    totalFailures: ep.totalFailures,
    totalSkipped: ep.totalSkipped,
    lastLatencyMs: ep.lastLatencyMs
  }));
}

function pruneIdempotencyStore(store, now) {
  for (const [key, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(key);
    }
  }
}

function capFailures(failures, limit) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const truncated = failures.length > safeLimit;
  return {
    failures: truncated ? failures.slice(0, safeLimit) : failures,
    failureCount: failures.length,
    failuresTruncated: truncated
  };
}

function formatPrometheusMetrics(metrics, inFlight, endpointState, extras = {}) {
  const rateLimitActiveKeys = Number(extras.rateLimitActiveKeys || 0);
  const idempotencyActiveKeys = Number(extras.idempotencyActiveKeys || 0);
  const stateLastPersistOk = extras.stateLastPersistOk ? 1 : 0;
  const adminTokenRequired = extras.adminTokenRequired ? 1 : 0;
  const promptTokenRequired = extras.promptTokenRequired ? 1 : 0;
  const lines = [
    '# HELP neuralshell_uptime_seconds Process uptime in seconds',
    '# TYPE neuralshell_uptime_seconds gauge',
    `neuralshell_uptime_seconds ${Number(process.uptime().toFixed(2))}`,
    '# HELP neuralshell_requests_total Total prompt requests seen by router',
    '# TYPE neuralshell_requests_total counter',
    `neuralshell_requests_total ${metrics.totalRequests}`,
    '# HELP neuralshell_success_total Total successful prompt responses',
    '# TYPE neuralshell_success_total counter',
    `neuralshell_success_total ${metrics.successRequests}`,
    '# HELP neuralshell_fail_total Total failed prompt responses',
    '# TYPE neuralshell_fail_total counter',
    `neuralshell_fail_total ${metrics.failedRequests}`,
    '# HELP neuralshell_failures_total Total failed prompt responses',
    '# TYPE neuralshell_failures_total counter',
    `neuralshell_failures_total ${metrics.failedRequests}`,
    '# HELP neuralshell_rejected_total Total rejected prompt responses',
    '# TYPE neuralshell_rejected_total counter',
    `neuralshell_rejected_total ${metrics.rejectedRequests}`,
    '# HELP neuralshell_rate_limited_total Total rate-limited prompt responses',
    '# TYPE neuralshell_rate_limited_total counter',
    `neuralshell_rate_limited_total ${metrics.rateLimitedRequests}`,
    '# HELP neuralshell_idempotency_hits_total Total idempotency cache hits',
    '# TYPE neuralshell_idempotency_hits_total counter',
    `neuralshell_idempotency_hits_total ${metrics.idempotencyHits}`,
    '# HELP neuralshell_idempotency_misses_total Total idempotency cache misses',
    '# TYPE neuralshell_idempotency_misses_total counter',
    `neuralshell_idempotency_misses_total ${metrics.idempotencyMisses}`,
    '# HELP neuralshell_idempotency_stores_total Total idempotency cache stores',
    '# TYPE neuralshell_idempotency_stores_total counter',
    `neuralshell_idempotency_stores_total ${metrics.idempotencyStores}`,
    '# HELP neuralshell_idempotency_conflicts_total Total idempotency key payload conflicts',
    '# TYPE neuralshell_idempotency_conflicts_total counter',
    `neuralshell_idempotency_conflicts_total ${metrics.idempotencyConflicts}`,
    '# HELP neuralshell_idempotency_evictions_total Total idempotency key evictions',
    '# TYPE neuralshell_idempotency_evictions_total counter',
    `neuralshell_idempotency_evictions_total ${metrics.idempotencyEvictions}`,
    '# HELP neuralshell_rate_limit_evictions_total Total rate-limit key evictions',
    '# TYPE neuralshell_rate_limit_evictions_total counter',
    `neuralshell_rate_limit_evictions_total ${metrics.rateLimitEvictions}`,
    '# HELP neuralshell_admin_forbidden_total Total admin forbidden responses',
    '# TYPE neuralshell_admin_forbidden_total counter',
    `neuralshell_admin_forbidden_total ${metrics.adminForbiddenRequests}`,
    '# HELP neuralshell_no_active_endpoints_total Total prompt requests rejected because no endpoints are active',
    '# TYPE neuralshell_no_active_endpoints_total counter',
    `neuralshell_no_active_endpoints_total ${metrics.noActiveEndpoints}`,
    '# HELP neuralshell_rate_limit_resets_total Total admin resets of rate-limit state',
    '# TYPE neuralshell_rate_limit_resets_total counter',
    `neuralshell_rate_limit_resets_total ${metrics.rateLimitResets}`,
    '# HELP neuralshell_idempotency_resets_total Total admin resets of idempotency cache',
    '# TYPE neuralshell_idempotency_resets_total counter',
    `neuralshell_idempotency_resets_total ${metrics.idempotencyResets}`,
    '# HELP neuralshell_prompt_auth_failures_total Total prompt authentication failures',
    '# TYPE neuralshell_prompt_auth_failures_total counter',
    `neuralshell_prompt_auth_failures_total ${metrics.promptAuthFailures}`,
    '# HELP neuralshell_state_persist_failures_total Total volatile state persistence failures',
    '# TYPE neuralshell_state_persist_failures_total counter',
    `neuralshell_state_persist_failures_total ${metrics.statePersistFailures}`,
    '# HELP neuralshell_state_load_failures_total Total volatile state load failures',
    '# TYPE neuralshell_state_load_failures_total counter',
    `neuralshell_state_load_failures_total ${metrics.stateLoadFailures}`,
    '# HELP neuralshell_audit_verify_failures_total Total failed audit-chain verification checks',
    '# TYPE neuralshell_audit_verify_failures_total counter',
    `neuralshell_audit_verify_failures_total ${metrics.auditVerifyFailures}`,
    '# HELP neuralshell_rate_limit_active_keys Active rate-limit keys in memory',
    '# TYPE neuralshell_rate_limit_active_keys gauge',
    `neuralshell_rate_limit_active_keys ${rateLimitActiveKeys}`,
    '# HELP neuralshell_idempotency_active_keys Active idempotency keys in memory',
    '# TYPE neuralshell_idempotency_active_keys gauge',
    `neuralshell_idempotency_active_keys ${idempotencyActiveKeys}`,
    '# HELP neuralshell_state_last_persist_ok Last volatile-state persist success (1 ok, 0 fail)',
    '# TYPE neuralshell_state_last_persist_ok gauge',
    `neuralshell_state_last_persist_ok ${stateLastPersistOk}`,
    '# HELP neuralshell_admin_token_required Whether admin token is required (1 yes, 0 no)',
    '# TYPE neuralshell_admin_token_required gauge',
    `neuralshell_admin_token_required ${adminTokenRequired}`,
    '# HELP neuralshell_prompt_token_required Whether prompt token is required (1 yes, 0 no)',
    '# TYPE neuralshell_prompt_token_required gauge',
    `neuralshell_prompt_token_required ${promptTokenRequired}`,
    '# HELP neuralshell_in_flight Current in-flight prompt requests',
    '# TYPE neuralshell_in_flight gauge',
    `neuralshell_in_flight ${inFlight}`,
    '# HELP neuralshell_endpoint_in_cooldown Endpoint cooldown status (1 if cooling down)',
    '# TYPE neuralshell_endpoint_in_cooldown gauge'
  ];
  for (const ep of endpointState) {
    lines.push(`neuralshell_endpoint_in_cooldown{endpoint="${ep.name}"} ${ep.cooldownUntil > Date.now() ? 1 : 0}`);
  }
  return `${lines.join('\n')}\n`;
}

function normalizeSha256Hex(value) {
  if (typeof value !== 'string') {
    return '';
  }
  const normalized = value.trim().toLowerCase();
  return SHA256_HEX_PATTERN.test(normalized) ? normalized : '';
}

function constantTimeEqual(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function tokenSha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function snapshotChecksum(entries) {
  return crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

function tokenAuthMatches(headerValue, auth) {
  if (!auth?.required) {
    return true;
  }
  if (typeof headerValue !== 'string' || !headerValue) {
    return false;
  }
  if (auth.sha256 && constantTimeEqual(tokenSha256(headerValue), auth.sha256)) {
    return true;
  }
  if (auth.plain && constantTimeEqual(headerValue, auth.plain)) {
    return true;
  }
  return false;
}

function isAdminAuthorized(request, adminAuth) {
  if (!adminAuth?.required) {
    return true;
  }
  return tokenAuthMatches(request.headers['x-admin-token'], adminAuth);
}

function clientIpKey(request) {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return String(request.ip || 'unknown');
}

function normalizeClientKey(value, maxChars) {
  const raw = String(value || 'unknown').trim() || 'unknown';
  return raw.slice(0, Math.max(1, maxChars));
}

function applyRateLimit(rateLimits, key, now, windowMs, maxRequests) {
  const record = rateLimits.get(key) || { count: 0, windowStart: now };
  if (now - record.windowStart >= windowMs) {
    record.count = 0;
    record.windowStart = now;
  }
  record.count += 1;
  rateLimits.set(key, record);
  return {
    limited: record.count > maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    resetInMs: Math.max(0, windowMs - (now - record.windowStart))
  };
}

function applyEndpointBudget(ep, now, windowMs, maxRequests) {
  if (!ep.budgetWindowStart || now - ep.budgetWindowStart >= windowMs) {
    ep.budgetWindowStart = now;
    ep.budgetCount = 0;
  }
  ep.budgetCount += 1;
  return ep.budgetCount <= maxRequests;
}

function persistMapSnapshot(filePath, entries, maxEntries) {
  if (!filePath) {
    return false;
  }
  const max = Math.max(1, Number(maxEntries) || 1);
  const sliced = entries.slice(-max);
  const checksum = snapshotChecksum(sliced);
  return writeJsonFile(filePath, {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    savedAt: new Date().toISOString(),
    checksum,
    entries: sliced
  });
}

function verifySnapshotObject(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    return { ok: false, reason: 'missing_snapshot', entries: [] };
  }
  if (!Array.isArray(snapshot.entries)) {
    return { ok: false, reason: 'invalid_entries', entries: [] };
  }
  const entries = snapshot.entries;
  if (typeof snapshot.checksum === 'string') {
    const expected = snapshotChecksum(entries);
    const provided = snapshot.checksum.toLowerCase();
    if (!SHA256_HEX_PATTERN.test(provided)) {
      return { ok: false, reason: 'invalid_checksum_format', entries };
    }
    if (!constantTimeEqual(provided, expected)) {
      return { ok: false, reason: 'checksum_mismatch', entries };
    }
  }
  return {
    ok: true,
    reason: null,
    schemaVersion: Number.isFinite(Number(snapshot.schemaVersion))
      ? Number(snapshot.schemaVersion)
      : null,
    entries
  };
}

function loadRateLimitsSnapshot(filePath, now, windowMs, maxKeys) {
  const snapshot = readJsonFile(filePath);
  const verified = verifySnapshotObject(snapshot);
  if (!verified.ok) {
    return { rows: [], verify: verified };
  }
  const rows = [];
  for (const item of verified.entries) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const key = typeof item.key === 'string' ? item.key : '';
    const count = Number(item.count);
    const windowStart = Number(item.windowStart);
    if (!key || !Number.isFinite(count) || !Number.isFinite(windowStart)) {
      continue;
    }
    if (count <= 0) {
      continue;
    }
    if (now - windowStart >= windowMs) {
      continue;
    }
    rows.push({ key, count, windowStart });
  }
  return {
    rows: rows.slice(-Math.max(1, Number(maxKeys) || 1)),
    verify: verified
  };
}

function loadIdempotencySnapshot(filePath, now, maxKeys) {
  const snapshot = readJsonFile(filePath);
  const verified = verifySnapshotObject(snapshot);
  if (!verified.ok) {
    return { rows: [], verify: verified };
  }
  const rows = [];
  for (const item of verified.entries) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const key = typeof item.key === 'string' ? item.key : '';
    const payload = item.payload;
    const fingerprint = typeof item.fingerprint === 'string' ? item.fingerprint : '';
    const expiresAt = Number(item.expiresAt);
    if (!key || !fingerprint || !Number.isFinite(expiresAt) || expiresAt <= now) {
      continue;
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      continue;
    }
    rows.push({ key, payload, fingerprint, expiresAt });
  }
  return {
    rows: rows.slice(-Math.max(1, Number(maxKeys) || 1)),
    verify: verified
  };
}

function computeAuditHash(payload, prevHash) {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify({ prevHash: prevHash || '', payload }))
    .digest('hex');
}

function verifyAuditEntries(entries) {
  const hashed = entries.filter((entry) => typeof entry?.hash === 'string' && SHA256_HEX_PATTERN.test(entry.hash));
  if (hashed.length === 0) {
    return { ok: true, checked: 0, note: 'no_hashed_entries' };
  }
  let previous = null;
  for (let idx = 0; idx < hashed.length; idx += 1) {
    const entry = hashed[idx];
    const prevHash = typeof entry.prevHash === 'string' ? entry.prevHash.toLowerCase() : '';
    const hash = String(entry.hash).toLowerCase();
    if (previous && prevHash !== previous.hash) {
      return { ok: false, checked: idx, brokenAt: idx, reason: 'prev_hash_mismatch' };
    }
    const payload = { ...entry };
    delete payload.hash;
    delete payload.prevHash;
    const expected = computeAuditHash(payload, prevHash);
    if (!constantTimeEqual(hash, expected)) {
      return { ok: false, checked: idx + 1, brokenAt: idx, reason: 'hash_mismatch' };
    }
    previous = { hash };
  }
  return { ok: true, checked: hashed.length, lastHash: hashed[hashed.length - 1].hash };
}

export function buildServer(options = {}) {
  const timeoutMs = normalizePositiveNumber(options.timeoutMs, REQUEST_TIMEOUT_MS);
  const bodyLimit = normalizePositiveNumber(options.bodyLimit, REQUEST_BODY_LIMIT_BYTES);
  const maxConcurrentRequests = normalizePositiveNumber(options.maxConcurrentRequests, MAX_CONCURRENT_REQUESTS);
  const endpointCooldownMs = normalizePositiveNumber(
    options.endpointCooldownMs,
    UPSTREAM_FAILURE_COOLDOWN_MS
  );
  const maxEndpointFailuresBeforeCooldown = normalizePositiveNumber(
    options.maxEndpointFailuresBeforeCooldown,
    MAX_ENDPOINT_FAILURES_BEFORE_COOLDOWN
  );
  const exposeUpstreamErrors = normalizeBoolean(options.exposeUpstreamErrors, EXPOSE_UPSTREAM_ERRORS);
  const exposeEndpointUrls = normalizeBoolean(options.exposeEndpointUrls, EXPOSE_ENDPOINT_URLS);
  const retryOnTimeout = normalizePositiveNumber(options.retryOnTimeout, REQUEST_RETRY_ON_TIMEOUT);
  const retryBackoffMs = normalizePositiveNumber(options.retryBackoffMs, REQUEST_RETRY_BACKOFF_MS);
  const responseMaxChars = normalizePositiveNumber(options.responseMaxChars, RESPONSE_MAX_CHARS);
  const strictRoleValidation = normalizeBoolean(options.strictRoleValidation, STRICT_ROLE_VALIDATION);
  const maxMessagesPerRequest = normalizePositiveNumber(
    options.maxMessagesPerRequest,
    MAX_MESSAGES_PER_REQUEST
  );
  const maxMessageChars = normalizePositiveNumber(options.maxMessageChars, MAX_MESSAGE_CHARS);
  const maxTotalMessageChars = normalizePositiveNumber(
    options.maxTotalMessageChars,
    MAX_TOTAL_MESSAGE_CHARS
  );
  const resetMetricsToken = typeof options.resetMetricsToken === 'string'
    ? options.resetMetricsToken
    : RESET_METRICS_TOKEN;
  const adminToken = typeof options.adminToken === 'string' ? options.adminToken : ADMIN_TOKEN;
  const adminTokenSha256 = normalizeSha256Hex(
    typeof options.adminTokenSha256 === 'string' ? options.adminTokenSha256 : ADMIN_TOKEN_SHA256
  );
  const adminAuth = {
    plain: adminToken,
    sha256: adminTokenSha256,
    required: Boolean(adminToken || adminTokenSha256)
  };
  const allowDryRun = normalizeBoolean(options.allowDryRun, ALLOW_DRY_RUN);
  const skipOpenAIWhenNoKey = normalizeBoolean(options.skipOpenAIWhenNoKey, SKIP_OPENAI_WHEN_NO_KEY);
  const includeFailuresOnSuccess = normalizeBoolean(
    options.includeFailuresOnSuccess,
    INCLUDE_FAILURES_ON_SUCCESS
  );
  const requestsPerWindow = normalizePositiveNumber(options.requestsPerWindow, REQUESTS_PER_WINDOW);
  const endpointRequestsPerWindow = normalizePositiveNumber(
    options.endpointRequestsPerWindow,
    ENDPOINT_REQUESTS_PER_WINDOW
  );
  const rateLimitWindowMs = normalizePositiveNumber(options.rateLimitWindowMs, RATE_LIMIT_WINDOW_MS);
  const rateLimitMaxKeys = normalizePositiveNumber(options.rateLimitMaxKeys, RATE_LIMIT_MAX_KEYS);
  const rateLimitCleanupIntervalMs = normalizePositiveNumber(
    options.rateLimitCleanupIntervalMs,
    RATE_LIMIT_CLEANUP_INTERVAL_MS
  );
  const idempotencyTtlMs = normalizePositiveNumber(options.idempotencyTtlMs, IDEMPOTENCY_TTL_MS);
  const maxIdempotencyKeys = normalizePositiveNumber(options.maxIdempotencyKeys, MAX_IDEMPOTENCY_KEYS);
  const maxFailuresReported = normalizePositiveNumber(options.maxFailuresReported, MAX_FAILURES_REPORTED);
  const adminAuditMaxBytes = normalizePositiveNumber(options.adminAuditMaxBytes, ADMIN_AUDIT_MAX_BYTES);
  const adminAuditRecentDefaultLimit = normalizePositiveNumber(
    options.adminAuditRecentDefaultLimit,
    ADMIN_AUDIT_RECENT_DEFAULT_LIMIT
  );
  const strictPromptFields = normalizeBoolean(options.strictPromptFields, STRICT_PROMPT_FIELDS);
  const maxClientKeyChars = normalizePositiveNumber(options.maxClientKeyChars, MAX_CLIENT_KEY_CHARS);
  const maxQueueSize = normalizePositiveNumber(options.maxQueueSize, MAX_QUEUE_SIZE);
  const requestQueueTimeoutMs = normalizePositiveNumber(
    options.requestQueueTimeoutMs,
    REQUEST_QUEUE_TIMEOUT_MS
  );
  const adaptiveRouting = normalizeBoolean(options.adaptiveRouting, ADAPTIVE_ROUTING);
  const blockedTerms = Array.isArray(options.blockedTerms) ? options.blockedTerms : BLOCKED_TERMS;
  const promptApiToken = typeof options.promptApiToken === 'string' ? options.promptApiToken : PROMPT_API_TOKEN;
  const promptApiTokenSha256 = normalizeSha256Hex(
    typeof options.promptApiTokenSha256 === 'string'
      ? options.promptApiTokenSha256
      : PROMPT_API_TOKEN_SHA256
  );
  const promptAuth = {
    plain: promptApiToken,
    sha256: promptApiTokenSha256,
    required: Boolean(promptApiToken || promptApiTokenSha256)
  };
  const enableSecurityHeaders = normalizeBoolean(options.enableSecurityHeaders, ENABLE_SECURITY_HEADERS);
  const corsAllowedOrigins = options.corsAllowedOrigins
    ? new Set(options.corsAllowedOrigins)
    : CORS_ALLOWED_ORIGINS;
  let runtimeStateFile = options.runtimeStateFile || RUNTIME_STATE_FILE;
  let ephemeralRuntimeStateFile = null;
  // Test/CI hardening: prevent flakiness from persistent runtime state influencing endpoint ordering/cooldowns.
  // If a caller provides a custom runtimeStateFile, we honor it.
  if (!options.runtimeStateFile && typeof options.fetchImpl === 'function') {
    const seq = (buildServer.__testStateSeq = (buildServer.__testStateSeq || 0) + 1);
    runtimeStateFile = path.join('state', `router_runtime_state_test_${process.pid}_${seq}.json`);
    ephemeralRuntimeStateFile = runtimeStateFile;
    try {
      fs.mkdirSync(path.dirname(runtimeStateFile), { recursive: true });
    } catch {
      // ignore
    }
    try {
      fs.rmSync(runtimeStateFile, { force: true });
    } catch {
      // ignore
    }
  }
  const rateLimitStateFile = options.rateLimitStateFile || RATE_LIMIT_STATE_FILE;
  const idempotencyStateFile = options.idempotencyStateFile || IDEMPOTENCY_STATE_FILE;
  const persistVolatileState = normalizeBoolean(options.persistVolatileState, PERSIST_VOLATILE_STATE);
  const persistStateIntervalMs = normalizePositiveNumber(options.persistStateIntervalMs, PERSIST_STATE_INTERVAL_MS);
  const adminAuditLog = options.adminAuditLog || ADMIN_AUDIT_LOG;
  const otlpHttpEndpoint = options.otlpHttpEndpoint || OTLP_HTTP_ENDPOINT;
  const otlpExportIntervalMs = normalizePositiveNumber(
    options.otlpExportIntervalMs,
    OTLP_EXPORT_INTERVAL_MS
  );
  const requireJsonContentType = normalizeBoolean(
    options.requireJsonContentType,
    REQUIRE_JSON_CONTENT_TYPE
  );
  const maxEndpoints = normalizePositiveNumber(options.maxEndpoints, MAX_ENDPOINTS);
  const appVersion = typeof options.appVersion === 'string' ? options.appVersion : APP_VERSION;
  const disabledEndpoints = options.disabledEndpoints
    ? new Set(options.disabledEndpoints)
    : DISABLED_ENDPOINTS;
  validateBootConfig({
    timeoutMs,
    bodyLimit,
    maxConcurrentRequests,
    requestsPerWindow,
    rateLimitWindowMs,
    maxMessagesPerRequest,
    maxMessageChars,
    maxTotalMessageChars,
    responseMaxChars,
    retryOnTimeout,
    retryBackoffMs,
    maxEndpoints,
    rateLimitMaxKeys,
    rateLimitCleanupIntervalMs,
    idempotencyTtlMs,
    maxIdempotencyKeys,
    maxFailuresReported,
    adminAuditMaxBytes,
    adminAuditRecentDefaultLimit,
    maxClientKeyChars,
    persistStateIntervalMs
  });

  const fastify = Fastify({ logger: false, bodyLimit });
  const logger = createLogger(options.loggerOptions || {});

  if (ephemeralRuntimeStateFile) {
    fastify.addHook('onClose', async () => {
      try {
        fs.rmSync(ephemeralRuntimeStateFile, { force: true });
      } catch {
        // ignore
      }
    });
  }
  
  // Initialize Autonomy Controller
  const autonomyController = new AutonomyController({
    AUTO_HEALING: process.env.AUTO_HEALING,
    AUTO_SCALING: process.env.AUTO_SCALING,
    AUTO_ANOMALY_DETECTION: process.env.AUTO_ANOMALY_DETECTION,
    AUTO_PROCESS_MANAGEMENT: process.env.AUTO_PROCESS_MANAGEMENT,
    AUTO_SECRET_ROTATION: process.env.AUTO_SECRET_ROTATION,
    AUTO_COST_MANAGEMENT: process.env.AUTO_COST_MANAGEMENT,
    AUTO_THREAT_DETECTION: process.env.AUTO_THREAT_DETECTION,
    AUTO_OPTIMIZATION: process.env.AUTO_OPTIMIZATION,
    AUTO_CANARY_DEPLOYMENT: process.env.AUTO_CANARY_DEPLOYMENT,
    DRY_RUN: process.env.DRY_RUN,
    AUTONOMY_KILL_SWITCH: process.env.AUTONOMY_KILL_SWITCH
  });
  
  // Start autonomy controller if any features enabled
  const anyFeatureEnabled = Object.values(autonomyController.featureFlags).some(flag => flag);
  if (anyFeatureEnabled && !autonomyController.killSwitch) {
    autonomyController.start().catch(err => {
      logger.error('Failed to start autonomy controller', { error: err.message });
    });
  }
  
  // Decorate fastify with autonomy controller
  fastify.decorate('autonomyController', autonomyController);
  
  const initialEndpoints = (options.endpoints || loadEndpointsFromEnv() || DEFAULT_ENDPOINTS)
    .map(normalizeEndpoint)
    .filter((ep) => !disabledEndpoints.has(ep.name));
  if (initialEndpoints.length > maxEndpoints) {
    throw new Error(`Configured endpoints exceed maxEndpoints (${maxEndpoints})`);
  }
  assertUniqueEndpointNames(initialEndpoints);
  let localEndpoints = initialEndpoints;
  const fetchImpl = options.fetchImpl || fetch;
  let endpointState = localEndpoints.map((ep) => ({
    ...ep,
    consecutiveFailures: 0,
    cooldownUntil: 0,
    halfOpenProbe: false,
    totalSuccesses: 0,
    totalFailures: 0,
    totalSkipped: 0,
    totalSelected: 0,
    budgetWindowStart: 0,
    budgetCount: 0,
    lastError: null,
    lastLatencyMs: null
  }));
  let inFlight = 0;
  let roundRobinCursor = 0;
  const rateLimits = new Map();
  const idempotencyStore = new Map();
  const waitQueue = [];
  let otlpTimer = null;
  let rateLimitCleanupTimer = null;
  let idempotencyCleanupTimer = null;
  let persistVolatileStateTimer = null;
  let lastAuditHash = '';
  const metrics = {
    startedAt: new Date().toISOString(),
    totalRequests: 0,
    successRequests: 0,
    failedRequests: 0,
    rejectedRequests: 0,
    rateLimitedRequests: 0,
    idempotencyHits: 0,
    idempotencyMisses: 0,
    idempotencyStores: 0,
    idempotencyConflicts: 0,
    idempotencyEvictions: 0,
    rateLimitEvictions: 0,
    adminForbiddenRequests: 0,
    overloadRejectedRequests: 0,
    noActiveEndpoints: 0,
    rateLimitResets: 0,
    idempotencyResets: 0,
    promptAuthFailures: 0,
    statePersistFailures: 0,
    stateLoadFailures: 0,
    auditVerifyFailures: 0,
    timeoutFailures: 0,
    upstreamFailures: 0,
    status2xx: 0,
    status4xx: 0,
    status5xx: 0,
    latencySamples: [],
    routeCounts: {}
  };
  const stateHealth = {
    rateLimitLoad: { ok: true, reason: null },
    idempotencyLoad: { ok: true, reason: null },
    lastPersistOk: true,
    lastPersistAt: null,
    lastPersistReason: null
  };
  const bumpRoute = (name) => {
    metrics.routeCounts[name] = (metrics.routeCounts[name] || 0) + 1;
  };
  const persisted = readJsonFile(runtimeStateFile);
  if (persisted && Array.isArray(persisted.endpointState)) {
    endpointState = endpointState.map((ep) => {
      const found = persisted.endpointState.find((p) => p.name === ep.name);
      return found ? { ...ep, ...found, name: ep.name, url: ep.url, model: ep.model } : ep;
    });
  }
  if (persistVolatileState) {
    const now = Date.now();
    const rateLoaded = loadRateLimitsSnapshot(rateLimitStateFile, now, rateLimitWindowMs, rateLimitMaxKeys);
    stateHealth.rateLimitLoad = {
      ok: rateLoaded.verify.ok,
      reason: rateLoaded.verify.reason
    };
    if (!rateLoaded.verify.ok && fileStats(rateLimitStateFile).exists) {
      metrics.stateLoadFailures += 1;
    }
    for (const row of rateLoaded.rows) {
      rateLimits.set(row.key, { count: row.count, windowStart: row.windowStart });
    }
    const idemLoaded = loadIdempotencySnapshot(idempotencyStateFile, now, maxIdempotencyKeys);
    stateHealth.idempotencyLoad = {
      ok: idemLoaded.verify.ok,
      reason: idemLoaded.verify.reason
    };
    if (!idemLoaded.verify.ok && fileStats(idempotencyStateFile).exists) {
      metrics.stateLoadFailures += 1;
    }
    for (const row of idemLoaded.rows) {
      idempotencyStore.set(row.key, {
        payload: row.payload,
        fingerprint: row.fingerprint,
        expiresAt: row.expiresAt
      });
    }
  }
  const previousAudit = tailJsonLines(adminAuditLog, 1)[0];
  if (previousAudit && typeof previousAudit.hash === 'string' && SHA256_HEX_PATTERN.test(previousAudit.hash)) {
    lastAuditHash = previousAudit.hash.toLowerCase();
  }

  const persistRuntimeState = () => {
    writeJsonFile(runtimeStateFile, {
      savedAt: new Date().toISOString(),
      metrics: {
        totalRequests: metrics.totalRequests,
        successRequests: metrics.successRequests,
        failedRequests: metrics.failedRequests,
        rejectedRequests: metrics.rejectedRequests,
        rateLimitedRequests: metrics.rateLimitedRequests
      },
      endpointState
    });
  };
  const persistVolatileSnapshots = () => {
    if (!persistVolatileState) {
      return;
    }
    const rateEntries = Array.from(rateLimits.entries()).map(([key, value]) => ({
      key,
      count: value.count,
      windowStart: value.windowStart
    }));
    const idempotencyEntries = Array.from(idempotencyStore.entries()).map(([key, value]) => ({
      key,
      payload: value.payload,
      fingerprint: value.fingerprint,
      expiresAt: value.expiresAt
    }));
    const rateOk = persistMapSnapshot(rateLimitStateFile, rateEntries, rateLimitMaxKeys);
    const idemOk = persistMapSnapshot(idempotencyStateFile, idempotencyEntries, maxIdempotencyKeys);
    const ok = Boolean(rateOk && idemOk);
    stateHealth.lastPersistAt = new Date().toISOString();
    stateHealth.lastPersistOk = ok;
    stateHealth.lastPersistReason = ok ? null : 'write_failed';
    if (!ok) {
      metrics.statePersistFailures += 1;
    }
  };

  const audit = (action, details = {}) => {
    const payload = {
      ts: new Date().toISOString(),
      action,
      ...details
    };
    const prevHash = lastAuditHash;
    const hash = computeAuditHash(payload, prevHash);
    appendAuditLogBounded(adminAuditLog, {
      ...payload,
      prevHash,
      hash
    }, adminAuditMaxBytes);
    lastAuditHash = hash;
  };

  const denyAdmin = (request, reply, route) => {
    metrics.failedRequests += 1;
    metrics.status4xx += 1;
    metrics.adminForbiddenRequests += 1;
    audit('admin_forbidden', {
      route,
      ip: clientIpKey(request)
    });
    return reply.code(403).send(errorPayload('ADMIN_FORBIDDEN', 'Forbidden'));
  };

  const acquireSlot = async () => {
    if (inFlight < maxConcurrentRequests) {
      inFlight += 1;
      return true;
    }
    if (waitQueue.length >= maxQueueSize) {
      return false;
    }
    return new Promise((resolve) => {
      const token = { done: false };
      const timer = setTimeout(() => {
        if (!token.done) {
          token.done = true;
          const idx = waitQueue.indexOf(token);
          if (idx >= 0) {
            waitQueue.splice(idx, 1);
          }
          resolve(false);
        }
      }, requestQueueTimeoutMs);
      token.resolve = () => {
        if (!token.done) {
          token.done = true;
          clearTimeout(timer);
          inFlight += 1;
          resolve(true);
        }
      };
      waitQueue.push(token);
    });
  };

  const releaseSlot = () => {
    inFlight = Math.max(0, inFlight - 1);
    const next = waitQueue.shift();
    if (next && typeof next.resolve === 'function') {
      next.resolve();
    }
  };

  const reloadEndpoints = (nextEndpoints) => {
    const normalized = nextEndpoints
      .map(normalizeEndpoint)
      .filter((ep) => !disabledEndpoints.has(ep.name));
    if (normalized.length > maxEndpoints) {
      throw new Error(`endpoints[] exceeds maxEndpoints (${maxEndpoints})`);
    }
    assertUniqueEndpointNames(normalized);
    localEndpoints = normalized;
    endpointState = localEndpoints.map((ep) => ({
      ...ep,
      consecutiveFailures: 0,
      cooldownUntil: 0,
      halfOpenProbe: false,
      totalSuccesses: 0,
      totalFailures: 0,
      totalSkipped: 0,
      totalSelected: 0,
      budgetWindowStart: 0,
      budgetCount: 0,
      lastError: null,
      lastLatencyMs: null
    }));
    roundRobinCursor = 0;
    persistRuntimeState();
    persistVolatileSnapshots();
  };

  const exportOtlp = async () => {
    if (!otlpHttpEndpoint) {
      return;
    }
    try {
      await fetchImpl(otlpHttpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource: { service: 'neuralshell-router', version: appVersion },
          metrics: {
            totalRequests: metrics.totalRequests,
            successRequests: metrics.successRequests,
            failedRequests: metrics.failedRequests,
            rejectedRequests: metrics.rejectedRequests,
            rateLimitedRequests: metrics.rateLimitedRequests
          },
          ts: Date.now()
        })
      });
    } catch {
      // Best-effort export only.
    }
  };

  if (otlpHttpEndpoint) {
    otlpTimer = setInterval(() => {
      exportOtlp();
    }, otlpExportIntervalMs);
    otlpTimer.unref?.();
  }

  const pruneRateLimits = (now) => {
    for (const [key, record] of rateLimits.entries()) {
      if (now - record.windowStart >= rateLimitWindowMs) {
        rateLimits.delete(key);
      }
    }
  };

  rateLimitCleanupTimer = setInterval(() => {
    pruneRateLimits(Date.now());
  }, rateLimitCleanupIntervalMs);
  rateLimitCleanupTimer.unref?.();

  idempotencyCleanupTimer = setInterval(() => {
    pruneIdempotencyStore(idempotencyStore, Date.now());
  }, Math.min(idempotencyTtlMs, 60000));
  idempotencyCleanupTimer.unref?.();
  if (persistVolatileState) {
    persistVolatileStateTimer = setInterval(() => {
      persistVolatileSnapshots();
    }, persistStateIntervalMs);
    persistVolatileStateTimer.unref?.();
  }

  fastify.addHook('onRequest', async (request, reply) => {
    request.routerStartedAt = Date.now();
    reply.header('x-router-version', appVersion);
    if (corsAllowedOrigins.size > 0) {
      const origin = request.headers.origin;
      if (origin && corsAllowedOrigins.has(origin)) {
        reply.header('access-control-allow-origin', origin);
        reply.header('vary', 'Origin');
        reply.header('access-control-allow-methods', 'POST,GET,OPTIONS');
        reply.header('access-control-allow-headers', 'content-type,x-client-request-id,x-prompt-token,x-admin-token,x-reset-token,x-dry-run,x-idempotency-key');
        reply.header('access-control-max-age', '600');
      }
    }
    if (enableSecurityHeaders) {
      reply.header('x-content-type-options', 'nosniff');
      reply.header('x-frame-options', 'DENY');
      reply.header('referrer-policy', 'no-referrer');
    }
  });

  fastify.addHook('onSend', async (request, reply) => {
    const startedAt = Number(request.routerStartedAt || Date.now());
    const elapsedMs = Math.max(0, Date.now() - startedAt);
    reply.header('x-response-time-ms', String(elapsedMs));
  });

  fastify.addHook('onResponse', async (request, reply) => {
    logger.info('http_response', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      requestId: reply.getHeader('x-request-id') || null
    });
  });

  fastify.addHook('onClose', async () => {
    if (otlpTimer) {
      clearInterval(otlpTimer);
    }
    if (rateLimitCleanupTimer) {
      clearInterval(rateLimitCleanupTimer);
    }
    if (idempotencyCleanupTimer) {
      clearInterval(idempotencyCleanupTimer);
    }
    if (persistVolatileStateTimer) {
      clearInterval(persistVolatileStateTimer);
    }
    persistVolatileSnapshots();
    persistRuntimeState();
  });

  fastify.options('/prompt', async (_request, reply) => {
    return reply.code(204).send();
  });

  fastify.get('/errors/catalog', async (_request, reply) => {
    bumpRoute('/errors/catalog');
    reply.header('cache-control', 'no-store');
    return {
      ok: true,
      codes: ERROR_CATALOG
    };
  });
  fastify.get('/openapi.json', async (_request, reply) => {
    bumpRoute('/openapi.json');
    reply.header('cache-control', 'no-store');
    return {
      openapi: '3.0.3',
      info: {
        title: 'NeuralShell Router API',
        version: appVersion
      },
      paths: {
        '/health': { get: {} },
        '/ready': { get: {} },
        '/metrics': { get: {} },
        '/metrics/prometheus': { get: {} },
        '/prompt': { post: {} },
        '/config': { get: {} },
        '/errors/catalog': { get: {} },
        '/admin/audit/recent': { get: {} },
        '/admin/audit/stats': { get: {} },
        '/admin/audit/verify': { get: {} },
        '/admin/runtime/snapshot': { get: {} },
        '/admin/runtime/persist': { post: {} },
        '/admin/auth/status': { get: {} },
        '/admin/state/verify': { get: {} },
        '/admin/state/flush': { post: {} },
        '/admin/state/reload': { post: {} },
        '/admin/state/repair': { post: {} },
        '/admin/idempotency/stats': { get: {} },
        '/admin/idempotency/reset': { post: {} },
        '/admin/rate-limit/stats': { get: {} },
        '/admin/rate-limit/reset': { post: {} }
      }
    };
  });

  fastify.get('/health', async (request, reply) => {
    bumpRoute('/health');
    reply.header('cache-control', 'no-store');
    const includeDetails = request.query && request.query.details === '1';
    const degraded = endpointState.length > 0 && endpointState.every((ep) => ep.cooldownUntil > Date.now());
    if (includeDetails) {
      return {
        ok: true,
        degraded,
        uptimeSec: Number(process.uptime().toFixed(2)),
        inFlight
      };
    }
    return { ok: true, degraded };
  });
  fastify.get('/ready', async (_request, reply) => {
    bumpRoute('/ready');
    reply.header('cache-control', 'no-store');
    const degraded = endpointState.length > 0 && endpointState.every((ep) => ep.cooldownUntil > Date.now());
    return {
      ok: true,
      degraded,
      timeoutMs,
      bodyLimit,
      maxConcurrentRequests,
      inFlight,
      queueSize: waitQueue.length,
      maxQueueSize,
      idempotency: {
        ttlMs: idempotencyTtlMs,
        maxKeys: maxIdempotencyKeys,
        activeKeys: idempotencyStore.size
      },
      rateLimit: {
        activeKeys: rateLimits.size,
        maxKeys: rateLimitMaxKeys,
        windowMs: rateLimitWindowMs
      },
      auth: {
        adminTokenRequired: adminAuth.required,
        adminTokenSha256Enabled: Boolean(adminTokenSha256),
        promptTokenRequired: promptAuth.required,
        promptTokenSha256Enabled: Boolean(promptApiTokenSha256)
      },
      persistVolatileState,
      persistStateIntervalMs,
      stateHealth,
      maxClientKeyChars,
      strictPromptFields,
      maxFailuresReported,
      maxEndpoints,
      endpoints: localEndpoints.map((ep) => ep.name),
      retryOnTimeout,
      retryBackoffMs
    };
  });
  fastify.get('/metrics', async (_request, reply) => {
    bumpRoute('/metrics');
    reply.header('cache-control', 'no-store');
    reply.type('text/plain; version=0.0.4');
    return formatPrometheusMetrics(metrics, inFlight, endpointState, {
      rateLimitActiveKeys: rateLimits.size,
      idempotencyActiveKeys: idempotencyStore.size,
      stateLastPersistOk: stateHealth.lastPersistOk,
      adminTokenRequired: adminAuth.required,
      promptTokenRequired: promptAuth.required
    });
  });
  fastify.get('/metrics/json', async (_request, reply) => {
    bumpRoute('/metrics/json');
    reply.header('cache-control', 'no-store');
    const memory = process.memoryUsage();
    return {
      ...metrics,
      inFlight,
      memoryRssBytes: memory.rss,
      memoryHeapUsedBytes: memory.heapUsed,
      memoryHeapTotalBytes: memory.heapTotal,
      idempotencyActiveKeys: idempotencyStore.size,
      rateLimitActiveKeys: rateLimits.size,
      stateHealth,
      latency: summarizeLatency(metrics.latencySamples),
      endpointStats: summarizeEndpoints(endpointState)
    };
  });
  fastify.get('/metrics/prometheus', async (_request, reply) => {
    bumpRoute('/metrics/prometheus');
    reply.header('cache-control', 'no-store');
    reply.type('text/plain; version=0.0.4');
    return formatPrometheusMetrics(metrics, inFlight, endpointState, {
      rateLimitActiveKeys: rateLimits.size,
      idempotencyActiveKeys: idempotencyStore.size,
      stateLastPersistOk: stateHealth.lastPersistOk,
      adminTokenRequired: adminAuth.required,
      promptTokenRequired: promptAuth.required
    });
  });
  fastify.get('/metrics/autonomy', async (_request, reply) => {
    bumpRoute('/metrics/autonomy');
    reply.header('cache-control', 'no-store');
    reply.type('text/plain; version=0.0.4');
    
    if (!fastify.autonomyController) {
      return '# Autonomy controller not initialized\n';
    }
    
    const autonomyMetrics = fastify.autonomyController.getMetrics();
    let output = '';
    
    // Format as Prometheus text - mapping from flat metrics in AutonomyController
    output += '# TYPE decisions_total counter\n';
    output += `decisions_total{system="selfHealing",action="heal",outcome="success"} ${autonomyMetrics.self_healing_successful || 0}\n`;
    
    output += '# TYPE healing_attempts_total counter\n';
    output += `healing_attempts_total{strategy="endpoint_restart",outcome="success"} ${autonomyMetrics.self_healing_total_attempts || 0}\n`;
    
    output += '# TYPE threats_detected_total counter\n';
    output += `threats_detected_total{type="any",outcome="logged"} ${autonomyMetrics.threat_total_threats || 0}\n`;
    
    output += '# TYPE cost_total gauge\n';
    output += `cost_total ${autonomyMetrics.cost_total || 0}\n`;
    
    output += '# TYPE optimizations_applied_total counter\n';
    output += `optimizations_applied_total{name="generic"} ${autonomyMetrics.optimizer_total_optimizations || 0}\n`;
    
    output += '# TYPE canary_deployments_total counter\n';
    output += `canary_deployments_total{outcome="success"} ${autonomyMetrics.canary_total_deployments || 0}\n`;
    
    output += '# TYPE process_restarts_total counter\n';
    output += `process_restarts_total{reason="any"} ${autonomyMetrics.process_total_restarts || 0}\n`;
    
    output += '# TYPE anomalies_detected_total counter\n';
    output += `anomalies_detected_total ${autonomyMetrics.anomaly_detected || 0}\n`;
    
    output += '# TYPE scaling_decisions_total counter\n';
    output += `scaling_decisions_total ${autonomyMetrics.scaler_total_scale_ups + autonomyMetrics.scaler_total_scale_downs || 0}\n`;
    
    return output;
  });
  fastify.get('/endpoints', async (request, reply) => {
    bumpRoute('/endpoints');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/endpoints');
    }
    return {
      endpointCooldownMs,
      maxEndpointFailuresBeforeCooldown,
      disabledEndpoints: Array.from(disabledEndpoints),
      endpoints: endpointState.map((ep) => ({
        name: ep.name,
        url: exposeEndpointUrls ? ep.url : undefined,
        model: ep.model,
        cooldownUntil: ep.cooldownUntil || null,
        inCooldown: ep.cooldownUntil > Date.now(),
        consecutiveFailures: ep.consecutiveFailures,
        totalSelected: ep.totalSelected,
        totalSuccesses: ep.totalSuccesses,
        totalFailures: ep.totalFailures,
        totalSkipped: ep.totalSkipped,
        lastLatencyMs: ep.lastLatencyMs,
        lastError: ep.lastError
      }))
    };
  });
  fastify.post('/endpoints/reset', async (request, reply) => {
    bumpRoute('/endpoints/reset');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/endpoints/reset');
    }
    endpointState.forEach((ep) => {
      ep.consecutiveFailures = 0;
      ep.cooldownUntil = 0;
      ep.halfOpenProbe = false;
      ep.lastError = null;
    });
    audit('endpoints_reset', { by: request.headers['x-admin-token'] ? 'token' : 'open' });
    persistRuntimeState();
    return { ok: true };
  });
  fastify.post('/endpoints/reload', async (request, reply) => {
    bumpRoute('/endpoints/reload');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/endpoints/reload');
    }
    const body = request.body || {};
    if (!Array.isArray(body.endpoints) || body.endpoints.length === 0) {
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply.code(400).send(errorPayload('INVALID_RELOAD_PAYLOAD', 'endpoints[] is required'));
    }
    try {
      reloadEndpoints(body.endpoints);
    } catch (err) {
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      const message = err instanceof Error ? err.message : 'Invalid endpoints';
      return reply.code(400).send(errorPayload('INVALID_ENDPOINTS', message));
    }
    audit('endpoints_reload', { count: body.endpoints.length });
    return { ok: true, endpoints: localEndpoints.map((ep) => ep.name) };
  });
  fastify.get('/config', async (request, reply) => {
    bumpRoute('/config');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/config');
    }
    reply.header('cache-control', 'no-store');
    return {
      appVersion,
      timeoutMs,
      bodyLimit,
      maxConcurrentRequests,
      maxMessagesPerRequest,
      maxMessageChars,
      maxTotalMessageChars,
      strictRoleValidation,
      endpointCooldownMs,
      maxEndpointFailuresBeforeCooldown,
      exposeUpstreamErrors,
      exposeEndpointUrls,
      retryOnTimeout,
      retryBackoffMs,
      responseMaxChars,
      latencySampleSize: LATENCY_SAMPLE_SIZE,
      allowDryRun,
      skipOpenAIWhenNoKey,
      includeFailuresOnSuccess,
      requestsPerWindow,
      rateLimitWindowMs,
      rateLimitMaxKeys,
      rateLimitCleanupIntervalMs,
      idempotencyTtlMs,
      maxIdempotencyKeys,
      adminAuditRecentDefaultLimit,
      maxClientKeyChars,
      persistVolatileState,
      persistStateIntervalMs,
      strictPromptFields,
      maxFailuresReported,
      adminAuditMaxBytes,
      rateLimitStateFile,
      idempotencyStateFile,
      snapshotSchemaVersion: SNAPSHOT_SCHEMA_VERSION,
      adminTokenSha256Enabled: Boolean(adminTokenSha256),
      promptTokenSha256Enabled: Boolean(promptApiTokenSha256),
      requireJsonContentType,
      maxEndpoints
    };
  });
  fastify.get('/admin/audit/recent', async (request, reply) => {
    bumpRoute('/admin/audit/recent');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/audit/recent');
    }
    const rawLimit = Number(request.query?.limit || adminAuditRecentDefaultLimit);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    reply.header('cache-control', 'no-store');
    return {
      ok: true,
      entries: tailJsonLines(adminAuditLog, limit)
    };
  });
  fastify.get('/admin/audit/stats', async (request, reply) => {
    bumpRoute('/admin/audit/stats');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/audit/stats');
    }
    const stats = fileStats(adminAuditLog);
    return {
      ok: true,
      maxBytes: adminAuditMaxBytes,
      ...stats
    };
  });
  fastify.get('/admin/audit/verify', async (request, reply) => {
    bumpRoute('/admin/audit/verify');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/audit/verify');
    }
    const rawLimit = Number(request.query?.limit || 1000);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 5000) : 1000;
    const entries = tailJsonLines(adminAuditLog, limit);
    const verified = verifyAuditEntries(entries);
    if (!verified.ok) {
      metrics.auditVerifyFailures += 1;
    }
    return {
      ok: true,
      ...verified,
      scannedEntries: entries.length
    };
  });
  fastify.get('/admin/runtime/snapshot', async (request, reply) => {
    bumpRoute('/admin/runtime/snapshot');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/runtime/snapshot');
    }
    reply.header('cache-control', 'no-store');
    return {
      ok: true,
      generatedAt: new Date().toISOString(),
      config: {
        appVersion,
        timeoutMs,
        bodyLimit,
        maxConcurrentRequests,
        maxMessagesPerRequest,
        maxMessageChars,
        maxTotalMessageChars,
        requestsPerWindow,
        rateLimitWindowMs,
        idempotencyTtlMs,
        maxIdempotencyKeys,
        persistVolatileState,
        persistStateIntervalMs,
        maxEndpoints
      },
      metrics: {
        ...metrics,
        inFlight,
        idempotencyActiveKeys: idempotencyStore.size,
        rateLimitActiveKeys: rateLimits.size
      },
      audit: {
        maxBytes: adminAuditMaxBytes,
        chainLastHash: lastAuditHash || null,
        ...fileStats(adminAuditLog)
      },
      stateFiles: {
        runtimeStateFile,
        rateLimitStateFile,
        idempotencyStateFile
      },
      stateHealth,
      endpoints: summarizeEndpoints(endpointState)
    };
  });
  fastify.post('/admin/runtime/persist', async (request, reply) => {
    bumpRoute('/admin/runtime/persist');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/runtime/persist');
    }
    persistRuntimeState();
    persistVolatileSnapshots();
    audit('runtime_persist', { by: request.headers['x-admin-token'] ? 'token' : 'open' });
    return { ok: true };
  });
  fastify.get('/admin/auth/status', async (request, reply) => {
    bumpRoute('/admin/auth/status');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/auth/status');
    }
    return {
      ok: true,
      admin: {
        required: adminAuth.required,
        hashOnly: Boolean(adminTokenSha256 && !adminToken),
        hashEnabled: Boolean(adminTokenSha256)
      },
      prompt: {
        required: promptAuth.required,
        hashOnly: Boolean(promptApiTokenSha256 && !promptApiToken),
        hashEnabled: Boolean(promptApiTokenSha256)
      }
    };
  });
  fastify.get('/admin/state/verify', async (request, reply) => {
    bumpRoute('/admin/state/verify');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/state/verify');
    }
    const runtime = readJsonFile(runtimeStateFile);
    const rate = readJsonFile(rateLimitStateFile);
    const idem = readJsonFile(idempotencyStateFile);
    const rateVerify = verifySnapshotObject(rate);
    const idemVerify = verifySnapshotObject(idem);
    if (!rateVerify.ok || !idemVerify.ok) {
      metrics.stateLoadFailures += 1;
    }
    return {
      ok: true,
      runtimeState: {
        exists: fileStats(runtimeStateFile).exists,
        valid: Boolean(runtime && typeof runtime === 'object')
      },
      rateLimitState: {
        ...fileStats(rateLimitStateFile),
        ...rateVerify
      },
      idempotencyState: {
        ...fileStats(idempotencyStateFile),
        ...idemVerify
      },
      inMemory: {
        rateLimitKeys: rateLimits.size,
        idempotencyKeys: idempotencyStore.size
      }
    };
  });
  fastify.post('/admin/state/flush', async (request, reply) => {
    bumpRoute('/admin/state/flush');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/state/flush');
    }
    persistRuntimeState();
    persistVolatileSnapshots();
    audit('state_flush', { by: request.headers['x-admin-token'] ? 'token' : 'open' });
    return { ok: true, stateHealth };
  });
  fastify.post('/admin/state/reload', async (request, reply) => {
    bumpRoute('/admin/state/reload');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/state/reload');
    }
    rateLimits.clear();
    idempotencyStore.clear();
    const now = Date.now();
    const rateLoaded = loadRateLimitsSnapshot(rateLimitStateFile, now, rateLimitWindowMs, rateLimitMaxKeys);
    for (const row of rateLoaded.rows) {
      rateLimits.set(row.key, { count: row.count, windowStart: row.windowStart });
    }
    const idemLoaded = loadIdempotencySnapshot(idempotencyStateFile, now, maxIdempotencyKeys);
    for (const row of idemLoaded.rows) {
      idempotencyStore.set(row.key, {
        payload: row.payload,
        fingerprint: row.fingerprint,
        expiresAt: row.expiresAt
      });
    }
    if (!rateLoaded.verify.ok || !idemLoaded.verify.ok) {
      metrics.stateLoadFailures += 1;
    }
    stateHealth.rateLimitLoad = { ok: rateLoaded.verify.ok, reason: rateLoaded.verify.reason };
    stateHealth.idempotencyLoad = { ok: idemLoaded.verify.ok, reason: idemLoaded.verify.reason };
    audit('state_reload', {
      by: request.headers['x-admin-token'] ? 'token' : 'open',
      rateLimitKeys: rateLimits.size,
      idempotencyKeys: idempotencyStore.size
    });
    return {
      ok: true,
      rateLimitKeys: rateLimits.size,
      idempotencyKeys: idempotencyStore.size
    };
  });
  fastify.post('/admin/state/repair', async (request, reply) => {
    bumpRoute('/admin/state/repair');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/state/repair');
    }
    const rateVerify = verifySnapshotObject(readJsonFile(rateLimitStateFile));
    const idemVerify = verifySnapshotObject(readJsonFile(idempotencyStateFile));
    const repaired = {
      rateLimitState: false,
      idempotencyState: false
    };
    if (!rateVerify.ok) {
      const entries = Array.from(rateLimits.entries()).map(([key, value]) => ({
        key,
        count: value.count,
        windowStart: value.windowStart
      }));
      repaired.rateLimitState = persistMapSnapshot(rateLimitStateFile, entries, rateLimitMaxKeys);
    }
    if (!idemVerify.ok) {
      const entries = Array.from(idempotencyStore.entries()).map(([key, value]) => ({
        key,
        payload: value.payload,
        fingerprint: value.fingerprint,
        expiresAt: value.expiresAt
      }));
      repaired.idempotencyState = persistMapSnapshot(idempotencyStateFile, entries, maxIdempotencyKeys);
    }
    persistRuntimeState();
    const afterRate = verifySnapshotObject(readJsonFile(rateLimitStateFile));
    const afterIdem = verifySnapshotObject(readJsonFile(idempotencyStateFile));
    stateHealth.rateLimitLoad = { ok: afterRate.ok, reason: afterRate.reason };
    stateHealth.idempotencyLoad = { ok: afterIdem.ok, reason: afterIdem.reason };
    audit('state_repair', {
      by: request.headers['x-admin-token'] ? 'token' : 'open',
      repairedRateLimitState: repaired.rateLimitState,
      repairedIdempotencyState: repaired.idempotencyState
    });
    return {
      ok: true,
      repaired,
      verify: {
        rateLimitState: afterRate.ok,
        idempotencyState: afterIdem.ok
      }
    };
  });
  fastify.get('/admin/idempotency/stats', async (request, reply) => {
    bumpRoute('/admin/idempotency/stats');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/idempotency/stats');
    }
    return {
      ok: true,
      activeKeys: idempotencyStore.size,
      ttlMs: idempotencyTtlMs,
      maxKeys: maxIdempotencyKeys
    };
  });
  fastify.get('/admin/rate-limit/stats', async (request, reply) => {
    bumpRoute('/admin/rate-limit/stats');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/rate-limit/stats');
    }
    return {
      ok: true,
      activeKeys: rateLimits.size,
      windowMs: rateLimitWindowMs,
      maxKeys: rateLimitMaxKeys
    };
  });
  fastify.post('/admin/rate-limit/reset', async (request, reply) => {
    bumpRoute('/admin/rate-limit/reset');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/rate-limit/reset');
    }
    const cleared = rateLimits.size;
    rateLimits.clear();
    metrics.rateLimitResets += 1;
    persistVolatileSnapshots();
    audit('rate_limit_reset', { cleared, by: request.headers['x-admin-token'] ? 'token' : 'open' });
    return { ok: true, cleared };
  });
  fastify.post('/admin/idempotency/reset', async (request, reply) => {
    bumpRoute('/admin/idempotency/reset');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/admin/idempotency/reset');
    }
    const cleared = idempotencyStore.size;
    idempotencyStore.clear();
    metrics.idempotencyResets += 1;
    persistVolatileSnapshots();
    audit('idempotency_reset', { cleared, by: request.headers['x-admin-token'] ? 'token' : 'open' });
    return { ok: true, cleared };
  });
  fastify.get('/version', async (_request, reply) => {
    bumpRoute('/version');
    reply.header('cache-control', 'no-store');
    return {
      version: appVersion,
      startedAt: metrics.startedAt
    };
  });
  fastify.post('/metrics/reset', async (request, reply) => {
    bumpRoute('/metrics/reset');
    if (!isAdminAuthorized(request, adminAuth)) {
      return denyAdmin(request, reply, '/metrics/reset');
    }
    if (!resetMetricsToken || request.headers['x-reset-token'] !== resetMetricsToken) {
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply.code(403).send(errorPayload('METRICS_RESET_FORBIDDEN', 'Forbidden'));
    }
    metrics.totalRequests = 0;
    metrics.successRequests = 0;
    metrics.failedRequests = 0;
    metrics.rejectedRequests = 0;
    metrics.rateLimitedRequests = 0;
    metrics.idempotencyHits = 0;
    metrics.idempotencyMisses = 0;
    metrics.idempotencyStores = 0;
    metrics.idempotencyConflicts = 0;
    metrics.idempotencyEvictions = 0;
    metrics.rateLimitEvictions = 0;
    metrics.adminForbiddenRequests = 0;
    metrics.overloadRejectedRequests = 0;
    metrics.noActiveEndpoints = 0;
    metrics.rateLimitResets = 0;
    metrics.idempotencyResets = 0;
    metrics.promptAuthFailures = 0;
    metrics.statePersistFailures = 0;
    metrics.stateLoadFailures = 0;
    metrics.auditVerifyFailures = 0;
    metrics.timeoutFailures = 0;
    metrics.upstreamFailures = 0;
    metrics.status2xx = 0;
    metrics.status4xx = 0;
    metrics.status5xx = 0;
    metrics.latencySamples = [];
    metrics.routeCounts = {};
    persistVolatileSnapshots();
    audit('metrics_reset', { by: request.headers['x-admin-token'] ? 'token' : 'open' });
    persistRuntimeState();
    return { ok: true };
  });

  fastify.post('/prompt', async (request, reply) => {
    bumpRoute('/prompt');
    const startedAt = Date.now();
    metrics.totalRequests += 1;
    const incomingRequestId = request.headers['x-client-request-id'];
    if (incomingRequestId && !validateRequestId(incomingRequestId)) {
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply.code(400).send(errorPayload('INVALID_CLIENT_REQUEST_ID', 'Invalid x-client-request-id header'));
    }
    const requestId = incomingRequestId || createRequestId();
    reply.header('x-request-id', requestId);
    if (requireJsonContentType) {
      const contentType = String(request.headers['content-type'] || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        metrics.failedRequests += 1;
        metrics.status4xx += 1;
        return reply
          .code(415)
          .send(errorPayload('UNSUPPORTED_CONTENT_TYPE', 'application/json is required', requestId));
      }
    }
    if (!tokenAuthMatches(request.headers['x-prompt-token'], promptAuth)) {
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      metrics.promptAuthFailures += 1;
      return reply.code(401).send(errorPayload('PROMPT_AUTH_FAILED', 'Unauthorized', requestId));
    }
    const idempotencyKeyHeader = request.headers['x-idempotency-key'];
    const idempotencyKey = typeof idempotencyKeyHeader === 'string' ? idempotencyKeyHeader.trim() : '';
    if (idempotencyKey && !validateIdempotencyKey(idempotencyKey)) {
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply
        .code(400)
        .send(errorPayload('INVALID_IDEMPOTENCY_KEY', 'Invalid x-idempotency-key header', requestId));
    }
    if (idempotencyKey) {
      pruneIdempotencyStore(idempotencyStore, Date.now());
    }
    const clientKey = normalizeClientKey(clientIpKey(request), maxClientKeyChars);
    if (!rateLimits.has(clientKey) && rateLimits.size >= rateLimitMaxKeys) {
      pruneRateLimits(Date.now());
      if (!rateLimits.has(clientKey) && rateLimits.size >= rateLimitMaxKeys) {
        const oldestKey = rateLimits.keys().next().value;
        if (oldestKey) {
          rateLimits.delete(oldestKey);
          metrics.rateLimitEvictions += 1;
        }
      }
    }
    const rate = applyRateLimit(rateLimits, clientKey, Date.now(), rateLimitWindowMs, requestsPerWindow);
    reply.header('x-rate-limit-limit', String(requestsPerWindow));
    reply.header('x-rate-limit-remaining', String(rate.remaining));
    reply.header('x-rate-limit-reset-ms', String(rate.resetInMs));
    reply.header('x-rate-limit-window-ms', String(rateLimitWindowMs));
    if (rate.limited) {
      metrics.rateLimitedRequests += 1;
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      reply.header('retry-after', String(Math.max(1, Math.ceil(rate.resetInMs / 1000))));
      return reply
        .code(429)
        .send(errorPayload('RATE_LIMITED', 'Rate limit exceeded', requestId, { resetInMs: rate.resetInMs }));
    }
    const slotAcquired = await acquireSlot();
    if (!slotAcquired) {
      metrics.rejectedRequests += 1;
      metrics.overloadRejectedRequests += 1;
      metrics.status4xx += 1;
      reply.header('retry-after', String(Math.max(1, Math.ceil(requestQueueTimeoutMs / 1000))));
      return reply.code(429).send(errorPayload('OVERLOADED', 'Too many concurrent requests', requestId, {
        queueSize: waitQueue.length
      }));
    }

    const payload = request.body;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      releaseSlot();
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply.code(400).send(errorPayload('INVALID_PAYLOAD_TYPE', 'Payload must be a JSON object', requestId));
    }
    if (strictPromptFields) {
      const extras = Object.keys(payload).filter((k) => !ALLOWED_PROMPT_FIELDS.has(k));
      if (extras.length > 0) {
        releaseSlot();
        metrics.failedRequests += 1;
        metrics.status4xx += 1;
        return reply.code(400).send(errorPayload(
          'INVALID_PAYLOAD_FIELDS',
          `Unknown payload fields: ${extras.join(',')}`,
          requestId
        ));
      }
    }
    let normalizedForPolicy;
    try {
      normalizedForPolicy = normalizeMessages(payload, {
        maxMessagesPerRequest,
        maxMessageChars,
        maxTotalMessageChars,
        strictRoleValidation
      });
    } catch (err) {
      releaseSlot();
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply.code(400).send(errorPayload('INVALID_PAYLOAD', err.message, requestId));
    }
    const blocked = containsBlockedTerm(normalizedForPolicy, blockedTerms);
    if (blocked) {
      releaseSlot();
      metrics.failedRequests += 1;
      metrics.status4xx += 1;
      return reply.code(400).send(errorPayload('BLOCKED_CONTENT', `Blocked term: ${blocked}`, requestId));
    }
    const payloadFingerprint = computePayloadFingerprint(normalizedForPolicy);
    if (idempotencyKey) {
      const cached = idempotencyStore.get(idempotencyKey);
      if (cached && cached.expiresAt > Date.now()) {
        if (cached.fingerprint !== payloadFingerprint) {
          metrics.idempotencyConflicts += 1;
          metrics.failedRequests += 1;
          metrics.status4xx += 1;
          return reply.code(409).send(errorPayload(
            'IDEMPOTENCY_PAYLOAD_MISMATCH',
            'Idempotency key reused with different payload',
            requestId
          ));
        }
        metrics.idempotencyHits += 1;
        metrics.successRequests += 1;
        metrics.status2xx += 1;
        
        // Quality Scoring for Idempotency Hit
        const durationMs = Date.now() - startedAt;
        const qualityScore = calculateQualityScore({
          outcome: { status: 'success', duration_ms: durationMs },
          context: { metrics: { cost: 0 } }
        });
        reply.header('x-quality-score', String(qualityScore));
        
        reply.header('x-idempotency-hit', '1');
        appendLatencySample(metrics, durationMs);
        return {
          requestId,
          ...cached.payload
        };
      }
      metrics.idempotencyMisses += 1;
    }

    const failures = [];
    try {
      const orderedEndpoints = orderEndpointsAdaptive(
        endpointState.length
          ? endpointState.map((_, idx) => endpointState[(roundRobinCursor + idx) % endpointState.length])
          : [],
        endpointState,
        adaptiveRouting
      );
      roundRobinCursor = endpointState.length ? (roundRobinCursor + 1) % endpointState.length : 0;
      if (orderedEndpoints.length === 0) {
        metrics.failedRequests += 1;
        metrics.status5xx += 1;
        metrics.noActiveEndpoints += 1;
        appendLatencySample(metrics, Date.now() - startedAt);
        return reply.code(503).send(errorPayload(
          'NO_ACTIVE_ENDPOINTS',
          'No active endpoints are configured',
          requestId
        ));
      }
      for (const ep of orderedEndpoints) {
        ep.totalSelected += 1;
        if (ep.cooldownUntil > Date.now()) {
          ep.totalSkipped += 1;
          ep.halfOpenProbe = true;
          failures.push({
            endpoint: ep.name,
            latencyMs: 0,
            error: 'Endpoint cooling down after recent failures'
          });
          continue;
        }
        if (!applyEndpointBudget(ep, Date.now(), rateLimitWindowMs, endpointRequestsPerWindow)) {
          ep.totalSkipped += 1;
          failures.push({
            endpoint: ep.name,
            latencyMs: 0,
            error: 'Endpoint budget exceeded'
          });
          continue;
        }
        const isOpenAI = ep.url.includes('api.openai.com');
        if (isOpenAI && !process.env.OPENAI_API_KEY && skipOpenAIWhenNoKey) {
          ep.totalSkipped += 1;
          failures.push({
            endpoint: ep.name,
            latencyMs: 0,
            error: 'OPENAI_API_KEY is not set'
          });
          continue;
        }
        const dryRunRequested = request.headers['x-dry-run'] === '1';
        if (allowDryRun && dryRunRequested) {
          metrics.successRequests += 1;
          metrics.status2xx += 1;
          appendLatencySample(metrics, Date.now() - startedAt);
          return {
            requestId,
            endpoint: ep.name,
            latencyMs: 0,
            totalLatencyMs: Date.now() - startedAt,
            attempts: 0,
            dryRun: true,
            message: {
              role: 'assistant',
              content: '[dry-run] upstream call skipped',
              truncated: false
            }
          };
        }

        const endpointStartedAt = Date.now();
        const maxAttempts = retryOnTimeout + 1;
        for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
          try {
            const response = await callEndpoint(ep, payload, fetchImpl, {
              timeoutMs,
              responseMaxChars,
              payloadPolicy: {
                maxMessagesPerRequest,
                maxMessageChars,
                maxTotalMessageChars,
                strictRoleValidation
              }
            });

            ep.consecutiveFailures = 0;
            ep.halfOpenProbe = false;
            ep.totalSuccesses += 1;
            ep.lastError = null;
            ep.lastLatencyMs = Date.now() - endpointStartedAt;
            metrics.successRequests += 1;
            metrics.status2xx += 1;
            appendLatencySample(metrics, Date.now() - endpointStartedAt);
            const successPayload = {
              requestId,
              endpoint: ep.name,
              latencyMs: ep.lastLatencyMs,
              totalLatencyMs: Date.now() - startedAt,
              attempts: attempt + 1,
              message: response
            };
            if (includeFailuresOnSuccess && failures.length > 0) {
              const capped = capFailures(failures, maxFailuresReported);
              successPayload.priorFailures = capped.failures;
              successPayload.priorFailureCount = capped.failureCount;
              successPayload.priorFailuresTruncated = capped.failuresTruncated;
            }
            if (idempotencyKey) {
              if (!idempotencyStore.has(idempotencyKey) && idempotencyStore.size >= maxIdempotencyKeys) {
                pruneIdempotencyStore(idempotencyStore, Date.now());
                if (!idempotencyStore.has(idempotencyKey) && idempotencyStore.size >= maxIdempotencyKeys) {
                  const oldestKey = idempotencyStore.keys().next().value;
                  if (oldestKey) {
                    idempotencyStore.delete(oldestKey);
                    metrics.idempotencyEvictions += 1;
                  }
                }
              }
              const { requestId: _ignored, ...cachePayload } = successPayload;
              idempotencyStore.set(idempotencyKey, {
                payload: cachePayload,
                fingerprint: payloadFingerprint,
                expiresAt: Date.now() + idempotencyTtlMs
              });
              metrics.idempotencyStores += 1;
              reply.header('x-idempotency-hit', '0');
            }
            return successPayload;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            const isTimeout = msg === 'timeout';
            if (isTimeout && attempt < maxAttempts - 1) {
              await new Promise((resolve) => setTimeout(resolve, retryBackoffMs));
              continue;
            }
            if (isTimeout) {
              metrics.timeoutFailures += 1;
            } else {
              metrics.upstreamFailures += 1;
            }
            ep.totalFailures += 1;
            ep.consecutiveFailures += 1;
            ep.lastError = msg;
            ep.lastLatencyMs = Date.now() - endpointStartedAt;
            if (ep.consecutiveFailures >= maxEndpointFailuresBeforeCooldown) {
              ep.cooldownUntil = Date.now() + endpointCooldownMs;
              ep.consecutiveFailures = 0;
              ep.halfOpenProbe = true;
            }
            failures.push({
              endpoint: ep.name,
              latencyMs: ep.lastLatencyMs,
              error: exposeUpstreamErrors ? msg : 'Upstream request failed'
            });
            break;
          }
        }
      }
      metrics.failedRequests += 1;
      metrics.status5xx += 1;
      appendLatencySample(metrics, Date.now() - startedAt);
      const capped = capFailures(failures, maxFailuresReported);
      return reply.code(502).send(errorPayload('ALL_ENDPOINTS_FAILED', 'All endpoints failed', requestId, {
        totalLatencyMs: Date.now() - startedAt,
        failures: capped.failures,
        failureCount: capped.failureCount,
        failuresTruncated: capped.failuresTruncated
      }));
    } finally {
      releaseSlot();
      persistVolatileSnapshots();
      persistRuntimeState();
    }
  });

  return fastify;
}

export async function startServer() {
  const fastify = buildServer();
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Router live on ${PORT}`);
    const shutdown = async (signal) => {
      try {
        // Stop autonomy controller before closing fastify
        if (fastify.autonomyController) {
          await fastify.autonomyController.stop();
        }
        await fastify.close();
      } finally {
        process.exit(signal === 'SIGTERM' ? 0 : 0);
      }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', async (err) => {
      console.error('Uncaught exception:', err);
      try {
        if (fastify.autonomyController) {
          await fastify.autonomyController.stop();
        }
      } catch (stopErr) {
        console.error('Error stopping autonomy controller:', stopErr);
      }
      process.exit(1);
    });
    
    // Handle unhandled rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled rejection at:', promise, 'reason:', reason);
      try {
        if (fastify.autonomyController) {
          await fastify.autonomyController.stop();
        }
      } catch (stopErr) {
        console.error('Error stopping autonomy controller:', stopErr);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer();
}
