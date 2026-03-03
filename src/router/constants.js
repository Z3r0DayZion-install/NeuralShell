/**
 * Centralized constants for timeouts, size limits, and intervals
 * All values are in milliseconds unless otherwise specified
 */

export const TIMEOUTS = {
  // Authentication
  STATE_EXPIRY_MS: 10 * 60 * 1000, // 10 minutes
  JWKS_TTL_MS: 60 * 60 * 1000, // 1 hour
  JWKS_STALE_TTL_MS: 2 * 60 * 60 * 1000, // 2 hours

  // Network
  REQUEST_TIMEOUT_MS: 30 * 1000, // 30 seconds
  RESPONSE_READ_TIMEOUT_MS: 60 * 1000, // 60 seconds
  SHUTDOWN_GRACE_PERIOD_MS: 5 * 1000, // 5 seconds

  // Circuit Breaker
  CIRCUIT_BREAKER_TIMEOUT_MS: 30 * 1000, // 30 seconds
  COOLDOWN_BASE_MS: 1 * 1000, // 1 second

  // Cleanup
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  HEARTBEAT_INTERVAL_MS: 30 * 1000 // 30 seconds
};

export const SIZE_LIMITS = {
  // Caches and Maps
  MAX_OAUTH_STATES: 1000,
  MAX_IDEMPOTENCY_KEYS: 2000,
  MAX_AFFINITY_ENTRIES: 10000,
  MAX_CACHE_SIZE: 1000,

  // Request/Response
  MAX_RESPONSE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  MAX_STATE_LENGTH: 256,

  // Dead Letter Queue
  DLQ_MAX_SIZE: 10000
};

export const INTERVALS = {
  OAUTH_STATE_CLEANUP_MS: 5 * 60 * 1000, // 5 minutes
  IDEMPOTENCY_CLEANUP_MS: 30 * 1000, // 30 seconds
  AFFINITY_CLEANUP_MS: 10 * 60 * 1000 // 10 minutes
};
