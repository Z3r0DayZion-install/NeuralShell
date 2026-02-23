# Design Document: Code Quality Fixes

## Overview

This design addresses 28 code quality issues identified in the NeuralShell project scan, organized into 5 implementation phases based on priority and impact. The fixes span security vulnerabilities, error handling gaps, resource management issues, performance bottlenecks, and code quality improvements.

### Goals

- Fix all 7 critical security vulnerabilities (timing attacks, data leaks, resource cleanup)
- Address all 11 high-priority issues (input validation, error handling, timeouts)
- Resolve all 7 medium-priority resource management and performance issues
- Improve 3 low-priority code quality issues
- Maintain backward compatibility and all 77 passing tests
- Enable phased deployment with independent rollback capability

### Non-Goals

- Rewriting modules from scratch
- Changing external APIs or interfaces
- Adding new features beyond fixes
- Performance optimization beyond identified bottlenecks

## Architecture

### Phased Implementation Strategy

The fixes are organized into 5 phases that can be deployed independently:

**Phase 1: Critical Security (7 issues)**
- Timing attack prevention in authentication
- Sensitive data sanitization in logging
- Unhandled promise rejection fixes

**Phase 2: Critical Resource Management (2 issues)**
- Connection pool shutdown
- WebSocket cleanup

**Phase 3: High Priority Fixes (11 issues)**
- Input validation and size limits
- Comprehensive error handling
- Timeout enforcement

**Phase 4: Medium Priority Fixes (7 issues)**
- Cache cleanup and size limits
- Performance optimizations

**Phase 5: Code Quality (3 issues)**
- Consistent logging
- Magic number elimination
- Dead code removal

### Affected Modules

| Module | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|--------|---------|---------|---------|---------|---------|
| auth.js | ✓ | | ✓ | | |
| routerCore.js | ✓ | | ✓ | ✓ | ✓ |
| redis.js | ✓ | | ✓ | | |
| connectionPool.js | | ✓ | ✓ | | |
| websocket.js | | ✓ | ✓ | | |
| circuitBreaker.js | | | ✓ | | |
| responseCache.js | | | ✓ | ✓ | |
| streaming.js | ✓ | | | ✓ | |
| loadBalancer.js | | | | ✓ | |
| dead-letter-queue.js | | | | ✓ | |
| logger.js | | | | | ✓ |

## Components and Interfaces

### 1. Security Utilities Module (New)

A new centralized security utilities module will provide constant-time comparison and data sanitization.

```javascript
// src/router/security-utils.js

import crypto from 'node:crypto';

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('Both arguments must be strings');
  }
  
  // Normalize to same length to prevent length-based timing
  const maxLen = Math.max(a.length, b.length);
  const aBuf = Buffer.alloc(maxLen);
  const bBuf = Buffer.alloc(maxLen);
  
  aBuf.write(a, 0, a.length, 'utf8');
  bBuf.write(b, 0, b.length, 'utf8');
  
  return crypto.timingSafeEqual(aBuf, bBuf);
}

/**
 * Sanitize objects for logging by removing sensitive data
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
```

### 2. Constants Module (New)

Centralize all timeout and size limit constants.

```javascript
// src/router/constants.js

export const TIMEOUTS = {
  // Authentication
  STATE_EXPIRY_MS: 10 * 60 * 1000,      // 10 minutes
  JWKS_TTL_MS: 60 * 60 * 1000,          // 1 hour
  JWKS_STALE_TTL_MS: 2 * 60 * 60 * 1000, // 2 hours
  
  // Network
  REQUEST_TIMEOUT_MS: 30 * 1000,        // 30 seconds
  RESPONSE_READ_TIMEOUT_MS: 60 * 1000,  // 60 seconds
  SHUTDOWN_GRACE_PERIOD_MS: 5 * 1000,   // 5 seconds
  
  // Circuit Breaker
  CIRCUIT_BREAKER_TIMEOUT_MS: 30 * 1000, // 30 seconds
  COOLDOWN_BASE_MS: 1 * 1000,           // 1 second
  
  // Cleanup
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000,   // 5 minutes
  HEARTBEAT_INTERVAL_MS: 30 * 1000,     // 30 seconds
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
  DLQ_MAX_SIZE: 10000,
};

export const INTERVALS = {
  OAUTH_STATE_CLEANUP_MS: 5 * 60 * 1000,     // 5 minutes
  IDEMPOTENCY_CLEANUP_MS: 30 * 1000,         // 30 seconds
  AFFINITY_CLEANUP_MS: 10 * 60 * 1000,       // 10 minutes
};
```

### 3. Enhanced Logger Module

Extend the existing logger with sanitization and consistent error logging.

```javascript
// src/router/logger.js (additions)

import { sanitizeForLogging } from './security-utils.js';

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

export function logRequest(logger, request, metadata = {}) {
  const sanitized = sanitizeForLogging({
    method: request.method,
    url: request.url,
    headers: request.headers,
    ...metadata
  });
  
  logger.info('Request', sanitized);
}
```

### 4. Resource Cleanup Manager (New)

Centralize resource cleanup logic for graceful shutdown.

```javascript
// src/router/cleanup-manager.js

import { TIMEOUTS } from './constants.js';

export class CleanupManager {
  constructor() {
    this.resources = new Map();
    this.intervals = new Set();
    this.timeouts = new Set();
  }
  
  /**
   * Register a resource for cleanup
   */
  register(name, cleanupFn) {
    this.resources.set(name, cleanupFn);
  }
  
  /**
   * Track an interval for cleanup
   */
  trackInterval(intervalId) {
    this.intervals.add(intervalId);
    return intervalId;
  }
  
  /**
   * Track a timeout for cleanup
   */
  trackTimeout(timeoutId) {
    this.timeouts.add(timeoutId);
    return timeoutId;
  }
  
  /**
   * Cleanup all resources with timeout
   */
  async cleanup() {
    // Clear all intervals and timeouts first
    for (const intervalId of this.intervals) {
      clearInterval(intervalId);
    }
    this.intervals.clear();
    
    for (const timeoutId of this.timeouts) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
    
    // Cleanup resources with timeout
    const cleanupPromises = Array.from(this.resources.entries()).map(
      ([name, cleanupFn]) => this.cleanupResource(name, cleanupFn)
    );
    
    await Promise.race([
      Promise.all(cleanupPromises),
      new Promise((resolve) => 
        setTimeout(resolve, TIMEOUTS.SHUTDOWN_GRACE_PERIOD_MS)
      )
    ]);
    
    this.resources.clear();
  }
  
  async cleanupResource(name, cleanupFn) {
    try {
      await cleanupFn();
    } catch (err) {
      console.error(`Cleanup failed for ${name}:`, err.message);
    }
  }
}
```

### 5. Size-Limited Map (New)

A reusable Map implementation with size limits and TTL support.

```javascript
// src/router/size-limited-map.js

export class SizeLimitedMap {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || null;
    this.map = new Map();
    this.timers = new Map();
  }
  
  set(key, value) {
    // Clear existing timer if key is being overwritten
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }
    
    // Enforce size limit
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      // Remove oldest entry (first in iteration order)
      const firstKey = this.map.keys().next().value;
      this.delete(firstKey);
    }
    
    const entry = {
      value,
      createdAt: Date.now(),
      expiresAt: this.ttl ? Date.now() + this.ttl : null
    };
    
    this.map.set(key, entry);
    
    // Set TTL timer if configured
    if (this.ttl) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, this.ttl);
      this.timers.set(key, timer);
    }
  }
  
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  has(key) {
    return this.get(key) !== undefined;
  }
  
  delete(key) {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
    return this.map.delete(key);
  }
  
  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.map.clear();
  }
  
  get size() {
    return this.map.size;
  }
  
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.map) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key);
      }
    }
  }
  
  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }
}
```

## Data Models

### Configuration Schema

New configuration options will be added to support the fixes:

```javascript
{
  // Security
  security: {
    enableTimingSafeComparison: true,  // Enable constant-time comparison
    sanitizeLogs: true,                // Enable log sanitization
    rejectUnauthorizedTLS: true,       // Enforce TLS certificate validation
    minTLSVersion: 'TLSv1.2'          // Minimum TLS version
  },
  
  // Size Limits
  limits: {
    maxOAuthStates: 1000,
    maxIdempotencyKeys: 2000,
    maxAffinityEntries: 10000,
    maxCacheSize: 1000,
    maxResponseSizeBytes: 10485760,    // 10MB
    maxStateLength: 256
  },
  
  // Timeouts
  timeouts: {
    requestTimeoutMs: 30000,
    responseReadTimeoutMs: 60000,
    shutdownGracePeriodMs: 5000,
    circuitBreakerTimeoutMs: 30000,
    stateExpiryMs: 600000,             // 10 minutes
    jwksTtlMs: 3600000,                // 1 hour
    idempotencyTtlMs: 60000            // 1 minute
  },
  
  // Cleanup Intervals
  cleanup: {
    oauthStateCleanupMs: 300000,       // 5 minutes
    idempotencyCleanupMs: 30000,       // 30 seconds
    affinityCleanupMs: 600000          // 10 minutes
  }
}
```

### Error Response Format

Standardized error responses for WebSocket and HTTP:

```javascript
{
  type: 'error',
  error: 'Human-readable error message',
  code: 'ERROR_CODE',
  timestamp: 1234567890,
  requestId: 'uuid'
}
```

## 

### Phase-Specific Changes

#### Phase 1: Critical Security Fixes

**auth.js Changes:**

1. **Timing Attack Prevention in API Key Validation**
   - Replace string comparison with `timingSafeCompare()`
   - Store hashed secrets instead of plaintext
   - Use constant-time comparison even for non-existent keys

2. **Timing Attack Prevention in Signature Verification**
   - Replace `!==` with `crypto.timingSafeEqual()`
   - Convert signatures to buffers for comparison

3. **OAuth State Store Size Limit**
   - Replace Map with `SizeLimitedMap`
   - Add automatic cleanup interval
   - Enforce maximum size limit

4. **JWKS Validation**
   - Validate response structure before caching
   - Check for required fields in each key
   - Handle stale JWKS appropriately

5. **TLS Verification**
   - Create HTTPS agent with certificate validation
   - Set minimum TLS version to 1.2

**routerCore.js Changes:**

1. **Sensitive Data Sanitization**
   - Import `sanitizeForLogging()` from security-utils
   - Sanitize all error objects before logging
   - Never log full request/response objects with headers

**redis.js Changes:**

1. **Unhandled Promise Rejection in Subscribe**
   - Add error handlers for subscriber client
   - Wrap callback in try-catch
   - Handle connection errors gracefully

**streaming.js Changes:**

1. **Stream Error Handling**
   - Track if data has been received
   - Log parse errors instead of silently swallowing
   - Validate stream completion

#### Phase 2: Critical Resource Management

**connectionPool.js Changes:**

1. **Graceful Shutdown**
   - Make `closeAll()` async
   - Wait for active requests with timeout
   - Force close after grace period

**websocket.js Changes:**

1. **Complete Cleanup**
   - Close WebSocket server properly
   - Clear all data structures
   - Stop heartbeat interval

#### Phase 3: High Priority Fixes

**auth.js Changes:**

1. **Input Validation**
   - Validate state parameter in `generateAuthorizationUrl()`
   - Add length and character checks

2. **Token Revocation Error Handling**
   - Add try-catch around revocation
   - Check response status
   - Return success/failure indicator

**connectionPool.js Changes:**

1. **Response Read Timeout**
   - Add overall timeout for request+response
   - Enforce max response size
   - Cleanup on timeout

**websocket.js Changes:**

1. **Message Handler Error Handling**
   - Validate JSON with error response
   - Catch handler errors
   - Send error messages to clients

**circuitBreaker.js Changes:**

1. **Execution Timeout**
   - Add timeout parameter to `execute()`
   - Use `Promise.race()` with timeout
   - Fail fast on timeout

**responseCache.js Changes:**

1. **Timer Cleanup**
   - Clear existing timer before setting new one
   - Prevent timer leaks

#### Phase 4: Medium Priority Fixes

**routerCore.js Changes:**

1. **Idempotency Cache Management**
   - Replace Map with `SizeLimitedMap`
   - Add periodic cleanup
   - Enforce size limits

2. **Duplicate Property Fix**
   - Calculate tokens once
   - Remove duplicate usage property

**loadBalancer.js Changes:**

1. **Affinity Map Management**
   - Replace Map with `SizeLimitedMap`
   - Add TTL to affinity entries
   - Periodic cleanup of expired entries

2. **Endpoint Selection Optimization**
   - Cache available endpoints list
   - Mark cache dirty on health changes
   - Recompute only when needed

3. **Latency Calculation Optimization**
   - Store latency sum instead of recalculating average
   - Track min/max latency
   - Use integer math

**streaming.js Changes:**

1. **Parser Cleanup**
   - Clear parsers Map in `cleanupStream()`

2. **Memory-Efficient Parsing**
   - Convert `parseStreamPayload()` to generator
   - Yield events instead of storing all

**dead-letter-queue.js Changes:**

1. **Async File Operations**
   - Replace `fs.appendFileSync()` with `fs.promises.appendFile()`
   - Make `enqueue()` async

#### Phase 5: Code Quality

**All Modules:**

1. **Consistent Error Logging**
   - Use `logError()` helper
   - Standardize error format

2. **Magic Numbers**
   - Replace with constants from constants.js
   - Document all timeout values

3. **Dead Code Removal**
   - Remove unused variables
   - Run ESLint with --fix

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Constant-time API key validation

*For any* API key (valid or invalid), the time taken to validate the key should not vary significantly based on whether the key is valid or invalid, preventing timing attacks.

**Validates: Requirements 1.1**

### Property 2: Constant-time signature verification

*For any* request signature (valid or invalid), the time taken to verify the signature should not vary significantly based on whether the signature is valid or invalid, preventing timing attacks.

**Validates: Requirements 1.2**

### Property 3: Log sanitization removes all sensitive data

*For any* log entry containing sensitive data (API keys, tokens, credentials, Authorization headers), the sanitized output should not contain any of the original sensitive values.

**Validates: Requirements 1.3, 1.4**

### Property 4: Redis subscription error handling

*For any* Redis subscription operation, connection errors and callback errors should be caught and logged without crashing the process.

**Validates: Requirements 2.1**

### Property 5: Stream JSON parsing resilience

*For any* streaming response containing invalid JSON chunks, the system should log parsing errors and continue processing valid chunks without rejecting the entire stream.

**Validates: Requirements 2.2**

### Property 6: Graceful connection pool shutdown

*For any* connection pool with active requests, shutting down should wait for requests to complete (up to the grace period) before destroying agents.

**Validates: Requirements 3.1**

### Property 7: Component cleanup completeness

*For any* component with intervals, timeouts, or event listeners, destroying the component should clear all tracked resources.

**Validates: Requirements 3.3**

### Property 8: OAuth state parameter validation

*For any* state parameter provided to OAuth authorization URL generation, invalid parameters (wrong type, too long, invalid characters) should be rejected with an appropriate error.

**Validates: Requirements 4.1**

### Property 9: OAuth state store bounded growth

*For any* sequence of OAuth state storage operations, the state store size should never exceed the configured maximum, and expired entries should be automatically removed.

**Validates: Requirements 4.2**

### Property 10: JWKS response validation

*For any* JWKS fetch response, responses with invalid structure or missing required key fields should be rejected and not cached.

**Validates: Requirements 4.3**

### Property 11: HTTP request timeout enforcement

*For any* HTTP request made via the connection pool, requests that exceed the configured timeout (for request or response reading) should be terminated and rejected with a timeout error.

**Validates: Requirements 5.1**

### Property 12: Response object uniqueness

*For any* response object constructed by the router, the object should not contain duplicate property keys.

**Validates: Requirements 5.2**

### Property 13: WebSocket message error handling

*For any* WebSocket message received, invalid JSON should result in an error response to the client, and handler errors should be caught and result in error responses without crashing.

**Validates: Requirements 5.3**

### Property 14: Circuit breaker timeout enforcement

*For any* function executed via circuit breaker, functions that exceed the configured timeout should be terminated and result in a timeout error.

**Validates: Requirements 5.4**

### Property 15: OAuth token revocation error handling

*For any* token revocation attempt, failures should be caught, logged, and reported to the caller rather than silently ignored.

**Validates: Requirements 5.5**

### Property 16: Redis graceful disconnect with fallback

*For any* Redis disconnect operation, the system should attempt graceful shutdown first, and if it times out, force disconnect within the configured timeout period.

**Validates: Requirements 6.1, 6.2**

### Property 17: Cache timer cleanup

*For any* cache entry that is overwritten, the existing timer for that entry should be cleared before creating a new timer, preventing timer leaks.

**Validates: Requirements 7.1**

### Property 18: Size-limited maps enforce maximum size and TTL

*For any* size-limited map, adding entries should never cause the size to exceed the maximum, and entries should be automatically removed after their TTL expires.

**Validates: Requirements 7.3, 7.4**

### Property 19: Cache eviction based on size and TTL

*For any* cache that reaches maximum size, adding new entries should evict the oldest entries, and expired entries should be automatically removed via periodic cleanup.

**Validates: Requirements 7.5, 7.6**

### Property 20: Endpoint selection caching

*For any* sequence of endpoint selections without health changes, the available endpoints list should only be computed once and reused for subsequent selections.

**Validates: Requirements 8.2**

### Property 21: Latency calculation correctness

*For any* sequence of latency recordings, the calculated average latency should equal the sum of all latencies divided by the count, regardless of calculation method.

**Validates: Requirements 8.3**

### Property 22: API signatures and interfaces remain stable

*For any* existing API method or interface, applying the fixes should not change the method signature, parameter types, or return types.

**Validates: Requirements 10.1, 10.3**

### Property 23: Configuration defaults

*For any* component that accepts new configuration options, creating the component without providing those options should result in the component using documented default values.

**Validates: Requirements 10.2, 12.2**

### Property 24: Configuration acceptance

*For any* new configuration option (size limits, timeouts, cleanup intervals), providing a valid value should result in the component using that value instead of the default.

**Validates: Requirements 12.1**

### Property 25: Configuration-based behavior control

*For any* configurable behavior, changing the configuration should change the behavior accordingly, allowing rollback via configuration.

**Validates: Requirements 12.4**

## Error Handling

### Error Categories

1. **Security Errors**
   - Invalid state parameters → `Error('Invalid state parameter')`
   - Invalid JWKS structure → `Error('Invalid JWKS structure')`
   - TLS verification failures → Network error with TLS details

2. **Timeout Errors**
   - Request timeout → `Error('Request timeout')`
   - Response read timeout → `Error('Response read timeout')`
   - Circuit breaker timeout → `Error('Circuit breaker timeout')`
   - Shutdown timeout → Force close after grace period

3. **Resource Errors**
   - State store capacity exceeded → `Error('State store capacity exceeded')`
   - Cache size exceeded → Evict oldest entry (no error)
   - Response size exceeded → `Error('Response size exceeded limit')`

4. **Validation Errors**
   - Invalid JSON in WebSocket → Error response to client
   - Invalid OAuth state → `Error('State parameter contains invalid characters')`
   - Missing required fields → `Error('Missing required fields')`

### Error Handling Strategy

1. **Fail Fast**: Validation errors should be thrown immediately
2. **Graceful Degradation**: Parsing errors in streams should log and continue
3. **Resource Protection**: Size limit violations should trigger eviction, not errors
4. **Client Notification**: WebSocket errors should send error responses to clients
5. **Logging**: All errors should be logged with sanitized context

### Backward Compatibility

All error handling changes maintain backward compatibility:
- Existing error types and messages are preserved
- New errors are only thrown for new validation logic
- Existing callers don't need to handle new error types

## Testing Strategy

### Dual Testing Approach

This project requires both unit tests and property-based tests:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Empty stream handling (Requirement 2.3)
- WebSocket server shutdown (Requirement 3.2)
- Forced shutdown after timeout (Requirement 3.4)
- TLS configuration (Requirement 4.4)
- Redis disconnect timeout (Requirement 6.2)
- Redis disconnect failure (Requirement 6.3)
- Stream parser cleanup (Requirement 7.2)
- Existing test suite (Requirement 10.4)

**Property Tests**: Verify universal properties across all inputs
- All properties listed in Correctness Properties section
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: code-quality-fixes, Property {number}: {property_text}`

### Property-Based Testing Library

Use `fast-check` for JavaScript property-based testing:

```javascript
import fc from 'fast-check';

// Example: Property 1 - Constant-time API key validation
test('Feature: code-quality-fixes, Property 1: Constant-time API key validation', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 64, maxLength: 64 }),
      (secret) => {
        const manager = new APIKeyManager();
        const { key: validKey } = manager.generateKey();
        const invalidKey = `ns_test_${secret}`;
        
        // Measure timing for valid and invalid keys
        const validTimes = [];
        const invalidTimes = [];
        
        for (let i = 0; i < 100; i++) {
          const start = process.hrtime.bigint();
          manager.validateKey(validKey);
          const end = process.hrtime.bigint();
          validTimes.push(Number(end - start));
        }
        
        for (let i = 0; i < 100; i++) {
          const start = process.hrtime.bigint();
          manager.validateKey(invalidKey);
          const end = process.hrtime.bigint();
          invalidTimes.push(Number(end - start));
        }
        
        const validAvg = validTimes.reduce((a, b) => a + b) / validTimes.length;
        const invalidAvg = invalidTimes.reduce((a, b) => a + b) / invalidTimes.length;
        const diff = Math.abs(validAvg - invalidAvg) / validAvg;
        
        // Timing difference should be less than 10%
        return diff < 0.1;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Organization

Tests will be organized by phase:

```
test/
  code-quality-fixes/
    phase1-security.test.js          # Properties 1-3
    phase2-resources.test.js         # Properties 6-7
    phase3-high-priority.test.js     # Properties 8-15
    phase4-medium-priority.test.js   # Properties 17-21
    phase5-compatibility.test.js     # Properties 22-25
    integration.test.js              # End-to-end tests
```

### Test Coverage Requirements

- All 25 properties must have property-based tests
- All 8 example cases must have unit tests
- All existing 77 tests must continue to pass
- New tests should achieve >90% code coverage for modified files

### Performance Benchmarks

For performance-related fixes (Phase 4), include benchmarks:

```javascript
// Benchmark endpoint selection caching
const iterations = 10000;
const start = Date.now();

for (let i = 0; i < iterations; i++) {
  loadBalancer.select(context);
}

const duration = Date.now() - start;
const opsPerSec = iterations / (duration / 1000);

console.log(`Endpoint selection: ${opsPerSec.toFixed(0)} ops/sec`);
```

### Regression Prevention

Each phase includes regression tests:
1. Run full test suite before changes
2. Run full test suite after each file modification
3. Run property tests with increased iterations (1000) before merge
4. Run performance benchmarks to verify improvements

## Deployment and Rollout Plan

### Phase-Based Deployment

Each phase can be deployed independently with its own rollback capability:

**Phase 1: Critical Security (Week 1)**
- Deploy to staging environment
- Run security audit tools
- Verify timing attack tests pass
- Deploy to production with monitoring
- Rollback trigger: Any security test failure

**Phase 2: Critical Resource Management (Week 1)**
- Deploy to staging environment
- Run load tests with graceful shutdown
- Monitor resource cleanup metrics
- Deploy to production
- Rollback trigger: Resource leaks detected

**Phase 3: High Priority Fixes (Week 2)**
- Deploy to staging environment
- Run comprehensive error injection tests
- Monitor error rates and timeout metrics
- Deploy to production with gradual rollout
- Rollback trigger: Increased error rates

**Phase 4: Medium Priority Fixes (Week 3)**
- Deploy to staging environment
- Run performance benchmarks
- Monitor memory usage and cache metrics
- Deploy to production
- Rollback trigger: Performance degradation

**Phase 5: Code Quality (Week 3)**
- Deploy to staging environment
- Verify logging consistency
- Deploy to production
- Rollback trigger: Logging issues

### Configuration-Based Rollback

Each phase supports configuration-based rollback:

```javascript
{
  security: {
    enableTimingSafeComparison: true,  // Set to false to rollback Phase 1
    sanitizeLogs: true                 // Set to false to rollback Phase 1
  },
  cleanup: {
    enableGracefulShutdown: true,      // Set to false to rollback Phase 2
    shutdownGracePeriodMs: 5000
  },
  validation: {
    enableInputValidation: true,       // Set to false to rollback Phase 3
    enableTimeouts: true
  },
  optimization: {
    enableCaching: true,               // Set to false to rollback Phase 4
    enableAsyncIO: true
  }
}
```

### Monitoring and Metrics

Key metrics to monitor during rollout:

**Phase 1 Metrics:**
- Authentication success/failure rates
- Log volume and sanitization effectiveness
- Error rates in Redis subscriptions

**Phase 2 Metrics:**
- Active connection count during shutdown
- Resource cleanup completion time
- WebSocket connection cleanup success rate

**Phase 3 Metrics:**
- Timeout occurrence rates
- Error handling success rates
- WebSocket error response rates

**Phase 4 Metrics:**
- Cache hit rates
- Memory usage trends
- Endpoint selection performance
- File I/O latency

**Phase 5 Metrics:**
- Log consistency (manual review)
- Code quality metrics (ESLint)

### Rollback Procedures

**Immediate Rollback (< 5 minutes):**
1. Update configuration to disable phase features
2. Restart services with new configuration
3. Verify metrics return to baseline

**Full Rollback (< 15 minutes):**
1. Deploy previous version from artifact repository
2. Restart all services
3. Verify all metrics return to baseline
4. Investigate root cause

### Success Criteria

Each phase is considered successful when:
1. All tests pass (unit, property, integration)
2. All 77 existing tests continue to pass
3. Metrics show expected improvements
4. No increase in error rates
5. Performance meets or exceeds baseline
6. Runs stable in production for 48 hours

## Risk Assessment and Mitigation

### High Risk Areas

**1. Timing Attack Fixes (Phase 1)**
- **Risk**: Constant-time comparison may have edge cases
- **Mitigation**: Extensive property-based testing with 1000+ iterations
- **Fallback**: Configuration flag to disable

**2. Resource Cleanup (Phase 2)**
- **Risk**: Graceful shutdown may not handle all edge cases
- **Mitigation**: Comprehensive testing with various connection states
- **Fallback**: Force shutdown after timeout

**3. Timeout Changes (Phase 3)**
- **Risk**: New timeouts may be too aggressive
- **Mitigation**: Make all timeouts configurable with conservative defaults
- **Fallback**: Configuration-based adjustment

**4. Performance Optimizations (Phase 4)**
- **Risk**: Caching may introduce stale data issues
- **Mitigation**: Careful cache invalidation logic and testing
- **Fallback**: Configuration flag to disable caching

### Medium Risk Areas

**1. Error Handling Changes**
- **Risk**: New error handling may change behavior
- **Mitigation**: Maintain existing error types and messages
- **Fallback**: Existing tests will catch regressions

**2. Size Limit Enforcement**
- **Risk**: Limits may be too restrictive
- **Mitigation**: Use generous defaults based on current usage
- **Fallback**: Configurable limits

### Low Risk Areas

**1. Code Quality Improvements (Phase 5)**
- **Risk**: Minimal - mostly cosmetic changes
- **Mitigation**: Automated linting and formatting
- **Fallback**: Easy to revert

### Risk Mitigation Strategy

1. **Comprehensive Testing**: All changes have property-based and unit tests
2. **Phased Rollout**: Deploy one phase at a time with monitoring
3. **Configuration Flags**: All major changes can be disabled via configuration
4. **Monitoring**: Track key metrics for each phase
5. **Quick Rollback**: Configuration-based rollback in < 5 minutes
6. **Gradual Deployment**: Use canary deployments for high-risk changes

## Migration Path

### Breaking Changes

**None** - All changes maintain backward compatibility:
- Existing API signatures unchanged
- New configuration options have defaults
- Error types and messages preserved
- Existing behavior maintained when new features disabled

### Configuration Migration

**Old Configuration** (still supported):
```javascript
{
  timeout: 30000,
  maxSockets: 50
}
```

**New Configuration** (recommended):
```javascript
{
  timeout: 30000,
  maxSockets: 50,
  
  // New options with defaults
  security: {
    enableTimingSafeComparison: true,
    sanitizeLogs: true
  },
  limits: {
    maxOAuthStates: 1000,
    maxIdempotencyKeys: 2000
  },
  timeouts: {
    requestTimeoutMs: 30000,
    shutdownGracePeriodMs: 5000
  }
}
```

### Upgrade Path

1. **Deploy Phase 1**: No configuration changes required
2. **Deploy Phase 2**: No configuration changes required
3. **Deploy Phase 3**: Optionally tune timeout values
4. **Deploy Phase 4**: Optionally tune size limits
5. **Deploy Phase 5**: No configuration changes required

### Deprecation Policy

**No deprecations** - All existing functionality remains supported.

New configuration options are additive only.

## Documentation Updates

### Configuration Documentation

New configuration options will be documented in:
- `README.md` - Quick start configuration
- `docs/CONFIGURATION.md` - Comprehensive configuration guide
- `config.yaml.example` - Example configuration file

### API Documentation

No API documentation changes required - all APIs remain unchanged.

### Operations Documentation

Updates to `docs/OPERATIONS.md`:
- Graceful shutdown procedures
- Monitoring metrics for each phase
- Troubleshooting guide for new error conditions
- Configuration tuning guidelines

### Migration Guide

New document: `docs/CODE-QUALITY-FIXES-MIGRATION.md`
- Overview of changes by phase
- Configuration options and defaults
- Monitoring recommendations
- Rollback procedures
- FAQ

## Implementation Notes

### Development Workflow

1. **Create feature branch** for each phase
2. **Implement changes** file by file
3. **Write tests** for each change
4. **Run full test suite** after each file
5. **Update documentation** as needed
6. **Code review** before merge
7. **Merge to main** after approval
8. **Deploy to staging** for validation
9. **Deploy to production** with monitoring

### Code Review Checklist

For each phase:
- [ ] All affected files have tests
- [ ] All new code has JSDoc comments
- [ ] All magic numbers replaced with constants
- [ ] All error handling includes logging
- [ ] All resources have cleanup logic
- [ ] All configuration options have defaults
- [ ] All changes maintain backward compatibility
- [ ] All 77 existing tests pass
- [ ] All new property tests pass (100+ iterations)
- [ ] Performance benchmarks show improvement (Phase 4)

### Testing Workflow

1. **Unit tests**: Run after each file change
2. **Property tests**: Run before commit (100 iterations)
3. **Integration tests**: Run before push
4. **Full test suite**: Run before merge
5. **Extended property tests**: Run before deploy (1000 iterations)
6. **Load tests**: Run in staging before production deploy

## Conclusion

This design provides a comprehensive, phased approach to fixing all 28 code quality issues in the NeuralShell project. The implementation is organized into 5 independent phases that can be deployed and rolled back separately, minimizing risk while maximizing the impact of the fixes.

Key benefits of this approach:
- **Security**: Eliminates timing attacks and data leaks
- **Reliability**: Comprehensive error handling and resource cleanup
- **Performance**: Optimizes hot paths and eliminates bottlenecks
- **Maintainability**: Consistent code quality and documentation
- **Safety**: Backward compatible with configuration-based rollback
- **Testability**: Property-based testing ensures correctness

The phased deployment strategy allows for careful validation at each step, with clear success criteria and rollback procedures. All changes maintain backward compatibility and include comprehensive testing to prevent regressions.
