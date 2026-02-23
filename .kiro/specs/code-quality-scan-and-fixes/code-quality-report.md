# NeuralShell Code Quality Scan Report

**Project:** NeuralShell AI Router  
**Scan Date:** 2024  
**Modules Analyzed:** 40+ modules in src/router/  
**Test Status:** All 77 tests passing  

---

## Executive Summary

This comprehensive code quality scan identified **28 potential issues** across 5 critical categories:
- **7 Security Vulnerabilities** (3 Critical, 4 High)
- **8 Error Handling Gaps** (2 Critical, 6 High)
- **6 Resource Management Issues** (2 Critical, 4 Medium)
- **4 Performance Bottlenecks** (1 High, 3 Medium)
- **3 Code Quality Issues** (3 Low)

**Critical Issues Requiring Immediate Attention:** 7  
**High Priority Issues:** 11  
**Medium Priority Issues:** 7  
**Low Priority Issues:** 3

---

## 1. Security Vulnerabilities

### 🔴 CRITICAL: Timing Attack in API Key Validation
**File:** `src/router/auth.js`  
**Line:** 362-394  
**Severity:** Critical

**Issue:**
```javascript
validateKey(fullKey) {
  const parts = fullKey.split('_');
  if (parts.length < 3) {
    return { valid: false, reason: 'Invalid key format' };
  }
  const [, keyId, secret] = parts;
  // No constant-time comparison for secret validation
}
```

The `validateKey` method does not perform constant-time comparison of the API key secret, making it vulnerable to timing attacks. An attacker could use timing differences to brute-force valid API keys.

**Impact:** High - Attackers can potentially discover valid API keys through timing analysis.

**Recommendation:**
```javascript
validateKey(fullKey) {
  const parts = fullKey.split('_');
  if (parts.length < 3) {
    return { valid: false, reason: 'Invalid key format' };
  }
  const [prefix, keyId, secret] = parts;
  const keyData = this.keys.get(keyId);
  
  if (!keyData) {
    // Use constant-time comparison even for non-existent keys
    crypto.timingSafeEqual(
      Buffer.from(secret),
      Buffer.from('0'.repeat(64))
    );
    return { valid: false, reason: 'Key not found' };
  }
  
  // Store hashed secrets and compare using constant-time
  const expectedHash = keyData.secretHash;
  const providedHash = crypto.createHash('sha256').update(secret).digest();
  
  if (!crypto.timingSafeEqual(providedHash, Buffer.from(expectedHash, 'hex'))) {
    return { valid: false, reason: 'Invalid key' };
  }
  // ... rest of validation
}
```

---

### 🔴 CRITICAL: Signature Verification Timing Attack
**File:** `src/router/auth.js`  
**Line:** 281-298  
**Severity:** Critical

**Issue:**
```javascript
verify(payload, signature, timestamp, nonce) {
  // ...
  const expectedSignature = this.generateSignature(payload, timestamp, nonce);
  
  if (signature !== expectedSignature) {  // ❌ Non-constant-time comparison
    return { valid: false, reason: 'Signature mismatch' };
  }
  return { valid: true };
}
```

String comparison using `!==` is not constant-time and vulnerable to timing attacks.

**Impact:** High - Attackers can forge request signatures through timing analysis.

**Recommendation:**
```javascript
verify(payload, signature, timestamp, nonce) {
  if (!timestamp || !nonce || !signature) {
    return { valid: false, reason: 'Missing required fields' };
  }

  const age = Date.now() - parseInt(timestamp);
  if (age > this.maxTimestampAge) {
    return { valid: false, reason: 'Timestamp too old' };
  }

  const expectedSignature = this.generateSignature(payload, timestamp, nonce);
  
  // Use constant-time comparison
  try {
    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { valid: false, reason: 'Signature mismatch' };
    }
  } catch {
    return { valid: false, reason: 'Invalid signature format' };
  }
  
  return { valid: true };
}
```

---

### 🔴 CRITICAL: Sensitive Data in Logs
**File:** `src/router/routerCore.js`, `src/router/redis.js`  
**Lines:** Multiple locations  
**Severity:** Critical

**Issue:**
```javascript
// routerCore.js line 360
headers['Authorization'] = `Bearer ${process.env.OPENAI_API_KEY}`;

// If this fails and error is logged, API key could be exposed
console.error('Request failed:', err);  // May contain headers
```

API keys and sensitive data may be logged in error messages, exposing them in log files.

**Impact:** High - API keys and tokens could be exposed in logs, leading to unauthorized access.

**Recommendation:**
1. Sanitize error objects before logging
2. Never log full request/response objects
3. Implement a secure logging wrapper:

```javascript
function sanitizeForLogging(obj) {
  if (!obj) return obj;
  const sanitized = { ...obj };
  
  // Remove sensitive headers
  if (sanitized.headers) {
    const headers = { ...sanitized.headers };
    if (headers.Authorization) headers.Authorization = '[REDACTED]';
    if (headers.authorization) headers.authorization = '[REDACTED]';
    sanitized.headers = headers;
  }
  
  // Remove sensitive query params
  if (sanitized.url) {
    try {
      const url = new URL(sanitized.url);
      if (url.searchParams.has('api_key')) {
        url.searchParams.set('api_key', '[REDACTED]');
      }
      sanitized.url = url.toString();
    } catch {}
  }
  
  return sanitized;
}
```

---

### 🟠 HIGH: Missing Input Sanitization in OAuth2
**File:** `src/router/auth.js`  
**Line:** 19-37  
**Severity:** High

**Issue:**
```javascript
generateAuthorizationUrl(state, options = {}) {
  const params = new URLSearchParams({
    client_id: this.clientId,
    redirect_uri: this.redirectUri,
    response_type: 'code',
    scope: options.scope || this.scopes.join(' '),
    state: state,  // ❌ No validation of state parameter
    // ...
  });
}
```

The `state` parameter is not validated before being used in URL construction, potentially allowing injection attacks.

**Impact:** Medium - Could lead to open redirect or CSRF vulnerabilities.

**Recommendation:**
```javascript
generateAuthorizationUrl(state, options = {}) {
  // Validate state parameter
  if (!state || typeof state !== 'string' || state.length > 256) {
    throw new Error('Invalid state parameter');
  }
  
  // Ensure state is URL-safe
  if (!/^[A-Za-z0-9_-]+$/.test(state)) {
    throw new Error('State parameter contains invalid characters');
  }
  
  // ... rest of implementation
}
```

---

### 🟠 HIGH: Unbounded State Store Growth
**File:** `src/router/auth.js`  
**Line:** 121-141  
**Severity:** High

**Issue:**
```javascript
storeState(state, data) {
  this.stateStore.set(state, {
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + 600000
  });
  // ❌ No size limit on stateStore Map
}

cleanupStates() {
  const now = Date.now();
  for (const [state, entry] of this.stateStore) {
    if (entry.expiresAt < now) {
      this.stateStore.delete(state);
    }
  }
  // ❌ cleanupStates is never called automatically
}
```

The `stateStore` Map can grow unbounded, and `cleanupStates()` is never called automatically, leading to memory exhaustion.

**Impact:** High - Memory leak leading to DoS.

**Recommendation:**
```javascript
constructor(options = {}) {
  // ...
  this.stateStore = new Map();
  this.maxStates = options.maxStates || 1000;
  
  // Auto-cleanup every 5 minutes
  this.cleanupInterval = setInterval(() => {
    this.cleanupStates();
  }, 300000);
}

storeState(state, data) {
  // Enforce size limit
  if (this.stateStore.size >= this.maxStates) {
    this.cleanupStates();
    if (this.stateStore.size >= this.maxStates) {
      throw new Error('State store capacity exceeded');
    }
  }
  
  this.stateStore.set(state, {
    data,
    createdAt: Date.now(),
    expiresAt: Date.now() + 600000
  });
}

destroy() {
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval);
  }
  this.stateStore.clear();
}
```

---

### 🟠 HIGH: JWKS Cache Poisoning Risk
**File:** `src/router/auth.js`  
**Line:** 158-173  
**Severity:** High

**Issue:**
```javascript
async fetchJWKS() {
  if (this.jwks && (Date.now() - this.jwksLastFetch) < this.jwksTtl) {
    return this.jwks;
  }

  try {
    const response = await fetch(this.jwksUri);
    this.jwks = await response.json();  // ❌ No validation of response
    this.jwksLastFetch = Date.now();
    return this.jwks;
  } catch (err) {
    console.error('Failed to fetch JWKS:', err.message);
    return this.jwks;  // ❌ Returns stale/null JWKS on error
  }
}
```

No validation of JWKS response structure, and errors return potentially stale or null JWKS.

**Impact:** High - Invalid JWKS could allow forged tokens to be accepted.

**Recommendation:**
```javascript
async fetchJWKS() {
  if (this.jwks && (Date.now() - this.jwksLastFetch) < this.jwksTtl) {
    return this.jwks;
  }

  try {
    const response = await fetch(this.jwksUri, {
      timeout: 5000,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`JWKS fetch failed: ${response.status}`);
    }
    
    const jwks = await response.json();
    
    // Validate JWKS structure
    if (!jwks || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      throw new Error('Invalid JWKS structure');
    }
    
    // Validate each key has required fields
    for (const key of jwks.keys) {
      if (!key.kid || !key.kty || !key.use) {
        throw new Error('Invalid JWK in JWKS');
      }
    }
    
    this.jwks = jwks;
    this.jwksLastFetch = Date.now();
    return this.jwks;
  } catch (err) {
    console.error('Failed to fetch JWKS:', err.message);
    // Don't return stale JWKS if it's too old
    if (this.jwks && (Date.now() - this.jwksLastFetch) < this.jwksTtl * 2) {
      return this.jwks;
    }
    throw new Error('Unable to fetch valid JWKS');
  }
}
```

---

### 🟠 HIGH: Missing TLS Verification
**File:** `src/router/auth.js`  
**Line:** 51-78, 80-102  
**Severity:** High

**Issue:**
```javascript
async exchangeCode(code, codeVerifier = null) {
  const response = await fetch(this.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
    // ❌ No TLS certificate validation options
  });
}
```

No explicit TLS certificate validation, potentially vulnerable to MITM attacks.

**Impact:** High - OAuth tokens could be intercepted.

**Recommendation:**
```javascript
constructor(options = {}) {
  // ...
  this.rejectUnauthorized = options.rejectUnauthorized !== false;
  this.agent = new https.Agent({
    rejectUnauthorized: this.rejectUnauthorized,
    minVersion: 'TLSv1.2'
  });
}

async exchangeCode(code, codeVerifier = null) {
  const response = await fetch(this.tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
    agent: this.agent  // Use configured agent with TLS validation
  });
  // ...
}
```

---

## 2. Error Handling Gaps

### 🔴 CRITICAL: Unhandled Promise Rejection in Redis Subscribe
**File:** `src/router/redis.js`  
**Line:** 260-272  
**Severity:** Critical

**Issue:**
```javascript
async subscribe(channels, callback) {
  if (!this.isConnected()) return;
  const subscriber = this.client.duplicate();
  await subscriber.connect();  // ❌ No error handling
  
  for (const channel of channels) {
    await subscriber.subscribe(channel, (message) => {
      callback(channel, message);  // ❌ Callback errors not caught
    });
  }

  return () => subscriber.unsubscribe(channels);
}
```

Multiple unhandled promise rejections and callback errors.

**Impact:** Critical - Unhandled rejections can crash the Node.js process.

**Recommendation:**
```javascript
async subscribe(channels, callback) {
  if (!this.isConnected()) {
    throw new Error('Redis not connected');
  }
  
  const subscriber = this.client.duplicate();
  
  subscriber.on('error', (err) => {
    console.error('Redis subscriber error:', err.message);
  });
  
  try {
    await subscriber.connect();
  } catch (err) {
    console.error('Failed to connect subscriber:', err.message);
    throw err;
  }
  
  for (const channel of channels) {
    try {
      await subscriber.subscribe(channel, (message) => {
        try {
          callback(channel, message);
        } catch (err) {
          console.error(`Subscription callback error for ${channel}:`, err.message);
        }
      });
    } catch (err) {
      console.error(`Failed to subscribe to ${channel}:`, err.message);
      throw err;
    }
  }

  return async () => {
    try {
      await subscriber.unsubscribe(channels);
      await subscriber.quit();
    } catch (err) {
      console.error('Error unsubscribing:', err.message);
    }
  };
}
```

---

### 🔴 CRITICAL: Missing Error Handling in Stream Events
**File:** `src/router/routerCore.js`  
**Line:** 280-320  
**Severity:** Critical

**Issue:**
```javascript
stream.on('data', (chunk) => {
  buffer += chunk.toString();
  // ... parsing logic
  try {
    const parsed = JSON.parse(data);
    // ...
  } catch {}  // ❌ Silent failure - errors are swallowed
});

stream.on('end', () => {
  resolve({ done: true });  // ❌ No validation of complete response
});

stream.on('error', (err) => {
  breaker.onFailure();
  reject(err);
});
```

JSON parsing errors are silently swallowed, and stream end doesn't validate if response was complete.

**Impact:** Critical - Silent failures lead to incomplete responses being treated as successful.

**Recommendation:**
```javascript
let hasReceivedData = false;
let lastChunkTime = Date.now();

stream.on('data', (chunk) => {
  hasReceivedData = true;
  lastChunkTime = Date.now();
  buffer += chunk.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop();

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        breaker.onSuccess();
        resolve({ done: true, complete: true });
        return;
      }

      try {
        const parsed = JSON.parse(data);
        let content = '';
        
        if (parsed.response) {
          content = parsed.response;
        } else if (parsed.choices?.[0]?.delta?.content) {
          content = parsed.choices[0].delta.content;
        }

        if (content) {
          onChunk(content);
        }
      } catch (parseErr) {
        console.error('Stream chunk parse error:', parseErr.message, 'Data:', data.slice(0, 100));
        // Don't reject immediately, continue processing other chunks
      }
    }
  }
});

stream.on('end', () => {
  if (!hasReceivedData) {
    reject(new Error('Stream ended without receiving any data'));
    return;
  }
  
  // Check if stream ended prematurely
  if (Date.now() - lastChunkTime < 100) {
    console.warn('Stream ended shortly after last chunk, may be incomplete');
  }
  
  resolve({ done: true, complete: hasReceivedData });
});
```

---

### 🟠 HIGH: Missing Timeout in Connection Pool Requests
**File:** `src/router/connectionPool.js`  
**Line:** 64-119  
**Severity:** High

**Issue:**
```javascript
async request(url, options = {}) {
  // ...
  return new Promise((resolve, reject) => {
    const requestOptions = {
      method: options.method || 'POST',
      headers: options.headers || {},
      timeout: options.timeout || this.timeout,
      agent: pool.agent,
      ...options
    };

    const req = (url.startsWith('https') ? https : http).request(url, requestOptions, (res) => {
      // ❌ No timeout on response reading
      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      // ...
    });
  });
}
```

While request has a timeout, there's no timeout on reading the response body, which could hang indefinitely.

**Impact:** High - Slow responses can cause resource exhaustion.

**Recommendation:**
```javascript
async request(url, options = {}) {
  const startTime = Date.now();
  const timeout = options.timeout || this.timeout;
  this.metrics.requestsTotal++;
  this.metrics.requestsActive++;

  const pool = this.getPool(url, options.agentOptions || {});
  pool.requests++;

  return new Promise((resolve, reject) => {
    let timeoutHandle;
    let isResolved = false;
    
    const cleanup = () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      this.metrics.requestsActive--;
    };
    
    const safeResolve = (value) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        resolve(value);
      }
    };
    
    const safeReject = (err) => {
      if (!isResolved) {
        isResolved = true;
        cleanup();
        reject(err);
      }
    };
    
    // Overall timeout
    timeoutHandle = setTimeout(() => {
      this.metrics.timeouts++;
      safeReject(new Error('Request timeout'));
    }, timeout);

    const requestOptions = {
      method: options.method || 'POST',
      headers: options.headers || {},
      agent: pool.agent,
      ...options
    };

    const req = (url.startsWith('https') ? https : http).request(url, requestOptions, (res) => {
      const chunks = [];
      let bytesReceived = 0;
      const maxResponseSize = options.maxResponseSize || 10 * 1024 * 1024; // 10MB default

      res.on('data', (chunk) => {
        bytesReceived += chunk.length;
        
        if (bytesReceived > maxResponseSize) {
          req.destroy();
          safeReject(new Error('Response size exceeded limit'));
          return;
        }
        
        chunks.push(chunk);
        this.metrics.bytesReceived += chunk.length;
      });

      res.on('end', () => {
        pool.totalTime += Date.now() - startTime;
        const body = Buffer.concat(chunks).toString('utf8');
        safeResolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          raw: res
        });
      });
      
      res.on('error', (err) => {
        safeReject(err);
      });
    });

    req.on('error', (err) => {
      this.metrics.errors++;
      pool.errors++;
      safeReject(err);
    });

    if (options.body) {
      const body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      this.metrics.bytesSent += Buffer.byteLength(body, 'utf8');
      req.write(body);
    }

    req.end();
  });
}
```

---

### 🟠 HIGH: Duplicate Usage Property in RouterCore
**File:** `src/router/routerCore.js`  
**Line:** 207-217  
**Severity:** High (Logic Error)

**Issue:**
```javascript
const response = {
  // ...
  usage: {
    prompt_tokens: Math.ceil(payload.messages.reduce((sum, m) => sum + m.content.length / 4, 0)),
    completion_tokens: Math.ceil(result.content.length / 4),
    total_tokens: 0  // ❌ Wrong value
  },
  usage: {  // ❌ Duplicate property - second one overwrites first
    prompt_tokens: Math.ceil(payload.messages.reduce((sum, m) => sum + m.content.length / 4, 0)),
    completion_tokens: Math.ceil(result.content.length / 4),
    total_tokens: Math.ceil(payload.messages.reduce((sum, m) => sum + m.content.length / 4, 0) + result.content.length / 4)
  },
  requestId
};
```

Duplicate `usage` property - the second one overwrites the first. This is a logic error.

**Impact:** High - Incorrect response structure, though second value is correct.

**Recommendation:**
```javascript
const promptTokens = Math.ceil(payload.messages.reduce((sum, m) => sum + m.content.length / 4, 0));
const completionTokens = Math.ceil(result.content.length / 4);

const response = {
  id: `chatcmpl-${requestId.slice(0, 8)}`,
  object: 'chat.completion',
  created: Math.floor(Date.now() / 1000),
  model: endpoint.model,
  choices: [{
    index: 0,
    message: {
      role: 'assistant',
      content: result.content
    },
    finish_reason: 'stop'
  }],
  usage: {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens
  },
  requestId
};
```

---

### 🟠 HIGH: Missing Error Handling in WebSocket Message Handler
**File:** `src/router/websocket.js`  
**Line:** 88-109  
**Severity:** High

**Issue:**
```javascript
handleMessage(id, data) {
  const connection = this.connections.get(id);
  if (!connection) return;

  connection.lastActivityAt = Date.now();
  this.stats.messagesReceived++;

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    return;  // ❌ Silent failure - client doesn't know message was invalid
  }

  const type = parsed.type || 'message';
  const handlers = this.messageHandlers.get(type) || [];
  
  for (const handler of handlers) {
    handler(id, parsed, connection);  // ❌ Handler errors not caught
  }
}
```

Invalid JSON is silently ignored, and handler errors are not caught.

**Impact:** High - Silent failures make debugging difficult, handler errors can crash the process.

**Recommendation:**
```javascript
handleMessage(id, data) {
  const connection = this.connections.get(id);
  if (!connection) {
    console.warn(`Received message for unknown connection: ${id}`);
    return;
  }

  connection.lastActivityAt = Date.now();
  this.stats.messagesReceived++;

  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (err) {
    console.error(`Invalid JSON from connection ${id}:`, err.message);
    this.send(id, {
      type: 'error',
      error: 'Invalid JSON message',
      code: 'PARSE_ERROR'
    });
    return;
  }

  const type = parsed.type || 'message';
  const handlers = this.messageHandlers.get(type) || [];
  
  if (handlers.length === 0) {
    console.warn(`No handlers registered for message type: ${type}`);
    this.send(id, {
      type: 'error',
      error: `Unknown message type: ${type}`,
      code: 'UNKNOWN_TYPE'
    });
    return;
  }
  
  for (const handler of handlers) {
    try {
      handler(id, parsed, connection);
    } catch (err) {
      console.error(`Handler error for type ${type}:`, err.message);
      this.send(id, {
        type: 'error',
        error: 'Message processing failed',
        code: 'HANDLER_ERROR'
      });
    }
  }
}
```

---


### 🟠 HIGH: Missing Validation in Circuit Breaker Execute
**File:** `src/router/circuitBreaker.js`  
**Line:** 48-72  
**Severity:** High

**Issue:**
```javascript
async execute(fn) {
  const state = this.getState();

  if (state === STATES.OPEN) {
    throw new Error(`Circuit breaker OPEN for ${this.name}`);
  }

  if (state === STATES.HALF_OPEN) {
    if (this.halfOpenRequests >= this.halfOpenMaxRequests) {
      throw new Error(`Circuit breaker half-open limit reached for ${this.name}`);
    }
    this.halfOpenRequests++;
  }

  try {
    const result = await fn();  // ❌ No timeout on function execution
    this.onSuccess();
    return result;
  } catch (err) {
    this.onFailure();
    throw err;
  }
}
```

No timeout on the executed function, which could hang indefinitely.

**Impact:** High - Circuit breaker can't protect against hanging operations.

**Recommendation:**
```javascript
async execute(fn, options = {}) {
  const state = this.getState();
  const timeout = options.timeout || this.timeoutMs;

  if (state === STATES.OPEN) {
    throw new Error(`Circuit breaker OPEN for ${this.name}`);
  }

  if (state === STATES.HALF_OPEN) {
    if (this.halfOpenRequests >= this.halfOpenMaxRequests) {
      throw new Error(`Circuit breaker half-open limit reached for ${this.name}`);
    }
    this.halfOpenRequests++;
  }

  try {
    // Add timeout protection
    const result = await Promise.race([
      fn(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Circuit breaker timeout')), timeout)
      )
    ]);
    
    this.onSuccess();
    return result;
  } catch (err) {
    this.onFailure();
    throw err;
  }
}
```

---

### 🟡 MEDIUM: Missing Error Handling in OAuth Token Revocation
**File:** `src/router/auth.js`  
**Line:** 104-119  
**Severity:** Medium

**Issue:**
```javascript
async revokeToken(token, tokenType = 'access_token') {
  const params = new URLSearchParams({
    token: token,
    token_type_hint: tokenType,
    client_id: this.clientId,
    client_secret: this.clientSecret
  });

  await fetch(this.tokenEndpoint.replace('/token', '/revoke'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  // ❌ No error handling - failures are silently ignored
}
```

Token revocation failures are silently ignored, which could leave tokens active.

**Impact:** Medium - Revoked tokens may remain valid.

**Recommendation:**
```javascript
async revokeToken(token, tokenType = 'access_token') {
  const params = new URLSearchParams({
    token: token,
    token_type_hint: tokenType,
    client_id: this.clientId,
    client_secret: this.clientSecret
  });

  try {
    const response = await fetch(this.tokenEndpoint.replace('/token', '/revoke'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      timeout: 5000
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Token revocation failed: ${error.error_description || error.error || response.status}`);
    }
    
    return { success: true };
  } catch (err) {
    console.error('Token revocation error:', err.message);
    throw err;
  }
}
```

---

### 🟡 MEDIUM: Missing Cleanup in ResponseCache
**File:** `src/router/responseCache.js`  
**Line:** 79-95  
**Severity:** Medium

**Issue:**
```javascript
async set(key, value, ttlSeconds = this.ttlSeconds) {
  // ...
  const timer = setTimeout(() => {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.evictionsByTtl++;
    }
    this.timers.delete(key);
  }, ttlSeconds * 1000);

  this.timers.set(key, timer);
  // ❌ If timer is replaced, old timer is not cleared
}
```

When a key is overwritten, the old timer is not cleared, leading to timer leaks.

**Impact:** Medium - Memory leak from accumulated timers.

**Recommendation:**
```javascript
async set(key, value, ttlSeconds = this.ttlSeconds) {
  if (!this.enabled) return;

  const expiresAt = Date.now() + (ttlSeconds * 1000);

  if (this.useRedis && this.redis) {
    try {
      await this.redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
      return;
    } catch (err) {
      console.error('Redis cache set error:', err.message);
    }
  }

  if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
    this.evictOldest();
  }

  // Clear existing timer if key is being overwritten
  const existingTimer = this.timers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const entry = { value, expiresAt, createdAt: Date.now() };
  this.cache.set(key, entry);

  const timer = setTimeout(() => {
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.evictionsByTtl++;
    }
    this.timers.delete(key);
  }, ttlSeconds * 1000);

  this.timers.set(key, timer);
}
```

---

## 3. Resource Management Issues

### 🔴 CRITICAL: Connection Pool Not Closed on Shutdown
**File:** `src/router/connectionPool.js`  
**Line:** 195-202  
**Severity:** Critical

**Issue:**
```javascript
closeAll() {
  for (const pool of this.pools.values()) {
    pool.agent.destroy();  // ❌ Doesn't wait for connections to close
  }
  this.pools.clear();
}

destroy() {
  this.closeAll();  // ❌ Not async, doesn't ensure cleanup
}
```

Agent destruction doesn't wait for active connections to close, potentially leaving connections open.

**Impact:** Critical - Resource leak, connections may remain open after shutdown.

**Recommendation:**
```javascript
async closeAll() {
  const closePromises = [];
  
  for (const [key, pool] of this.pools) {
    closePromises.push(
      new Promise((resolve) => {
        // Wait for active requests to complete (with timeout)
        const checkInterval = setInterval(() => {
          if (this.metrics.requestsActive === 0) {
            clearInterval(checkInterval);
            pool.agent.destroy();
            resolve();
          }
        }, 100);
        
        // Force close after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          pool.agent.destroy();
          resolve();
        }, 5000);
      })
    );
  }
  
  await Promise.all(closePromises);
  this.pools.clear();
}

async destroy() {
  await this.closeAll();
}
```

---

### 🔴 CRITICAL: WebSocket Connections Not Cleaned Up
**File:** `src/router/websocket.js`  
**Line:** 210-214  
**Severity:** Critical

**Issue:**
```javascript
destroy() {
  this.stopHeartbeat();
  this.closeAll();
  // ❌ WebSocket server not closed
  // ❌ Connections map not cleared
}
```

WebSocket server is not properly closed, and connections are not cleared.

**Impact:** Critical - Resource leak, server may not shut down cleanly.

**Recommendation:**
```javascript
async destroy() {
  this.stopHeartbeat();
  
  // Close all connections
  await this.closeAll(1001, 'Server shutting down');
  
  // Close WebSocket server if it exists
  if (this.wss) {
    await new Promise((resolve) => {
      this.wss.close(() => {
        resolve();
      });
      
      // Force close after 5 seconds
      setTimeout(resolve, 5000);
    });
  }
  
  // Clear all data structures
  this.connections.clear();
  this.messageHandlers.clear();
}
```

---

### 🟠 HIGH: Redis Connection Not Properly Closed
**File:** `src/router/redis.js`  
**Line:** 56-61  
**Severity:** High

**Issue:**
```javascript
async disconnect() {
  if (this.client) {
    await this.client.quit();  // ❌ No error handling
    this.connected = false;
  }
}
```

No error handling if quit fails, and no force-close fallback.

**Impact:** High - Connection may not close properly, leading to resource leaks.

**Recommendation:**
```javascript
async disconnect() {
  if (!this.client) return;
  
  try {
    // Try graceful shutdown first
    await Promise.race([
      this.client.quit(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Quit timeout')), 5000)
      )
    ]);
  } catch (err) {
    console.error('Redis graceful disconnect failed:', err.message);
    // Force disconnect
    try {
      await this.client.disconnect();
    } catch (forceErr) {
      console.error('Redis force disconnect failed:', forceErr.message);
    }
  } finally {
    this.connected = false;
    this.client = null;
  }
}
```

---

### 🟡 MEDIUM: Stream Manager Doesn't Clean Up Parsers
**File:** `src/router/streaming.js`  
**Line:** 138-148  
**Severity:** Medium

**Issue:**
```javascript
cleanupStream(streamId) {
  const stream = this.streams.get(streamId);
  if (!stream) return;

  if (stream.timeout) {
    clearTimeout(stream.timeout);
  }

  this.onEnd(streamId, stream);
  this.streams.delete(streamId);
  // ❌ stream.parsers Map is not cleared
}
```

The `parsers` Map in each stream is not cleared, potentially leaking memory.

**Impact:** Medium - Memory leak if parsers hold references.

**Recommendation:**
```javascript
cleanupStream(streamId) {
  const stream = this.streams.get(streamId);
  if (!stream) return;

  if (stream.timeout) {
    clearTimeout(stream.timeout);
  }
  
  // Clear parsers
  if (stream.parsers) {
    stream.parsers.clear();
  }

  this.onEnd(streamId, stream);
  this.streams.delete(streamId);
}
```

---

### 🟡 MEDIUM: Load Balancer Affinity Map Unbounded Growth
**File:** `src/router/loadBalancer.js`  
**Line:** 143-156  
**Severity:** Medium

**Issue:**
```javascript
sticky(endpoints, context) {
  if (context.sessionId && this.affinity.has(context.sessionId)) {
    const endpointName = this.affinity.get(context.sessionId);
    const endpoint = endpoints.find(ep => ep.name === endpointName);
    if (endpoint) return endpoint;
  }

  const selected = this.roundRobin(endpoints);
  
  if (context.sessionId) {
    this.affinity.set(context.sessionId, selected.name);
    // ❌ No size limit or expiration on affinity map
  }
  
  return selected;
}
```

The affinity Map can grow unbounded, leading to memory exhaustion.

**Impact:** Medium - Memory leak with many unique session IDs.

**Recommendation:**
```javascript
constructor(options = {}) {
  // ...
  this.affinity = new Map();
  this.maxAffinityEntries = options.maxAffinityEntries || 10000;
  this.affinityTtl = options.affinityTtl || 3600000; // 1 hour
}

sticky(endpoints, context) {
  if (context.sessionId && this.affinity.has(context.sessionId)) {
    const entry = this.affinity.get(context.sessionId);
    
    // Check if entry is expired
    if (Date.now() - entry.createdAt > this.affinityTtl) {
      this.affinity.delete(context.sessionId);
    } else {
      const endpoint = endpoints.find(ep => ep.name === entry.endpointName);
      if (endpoint) return endpoint;
    }
  }

  const selected = this.roundRobin(endpoints);
  
  if (context.sessionId) {
    // Enforce size limit
    if (this.affinity.size >= this.maxAffinityEntries) {
      // Remove oldest entry
      const firstKey = this.affinity.keys().next().value;
      this.affinity.delete(firstKey);
    }
    
    this.affinity.set(context.sessionId, {
      endpointName: selected.name,
      createdAt: Date.now()
    });
  }
  
  return selected;
}

clearExpiredAffinity() {
  const now = Date.now();
  for (const [sessionId, entry] of this.affinity) {
    if (now - entry.createdAt > this.affinityTtl) {
      this.affinity.delete(sessionId);
    }
  }
}
```

---

### 🟡 MEDIUM: RouterCore Idempotency Cache Unbounded
**File:** `src/router/routerCore.js`  
**Line:** 48  
**Severity:** Medium

**Issue:**
```javascript
constructor(options = {}) {
  // ...
  this.idempotencyCache = new Map();
  // ❌ No size limit or cleanup for idempotency cache
}
```

The idempotency cache has no size limit or automatic cleanup.

**Impact:** Medium - Memory leak with many unique idempotency keys.

**Recommendation:**
```javascript
constructor(options = {}) {
  // ...
  this.idempotencyCache = new Map();
  this.maxIdempotencyKeys = options.maxIdempotencyKeys || 2000;
  this.idempotencyTtl = options.idempotencyTtl || 60000; // 1 minute
  
  // Periodic cleanup
  this.idempotencyCleanupInterval = setInterval(() => {
    this.cleanupIdempotencyCache();
  }, 30000);
}

cleanupIdempotencyCache() {
  const now = Date.now();
  for (const [key, entry] of this.idempotencyCache) {
    if (now - entry.timestamp > this.idempotencyTtl) {
      this.idempotencyCache.delete(key);
    }
  }
  
  // Enforce size limit
  if (this.idempotencyCache.size > this.maxIdempotencyKeys) {
    const toDelete = this.idempotencyCache.size - this.maxIdempotencyKeys;
    let deleted = 0;
    for (const key of this.idempotencyCache.keys()) {
      if (deleted >= toDelete) break;
      this.idempotencyCache.delete(key);
      deleted++;
    }
  }
}

shutdown() {
  if (this.idempotencyCleanupInterval) {
    clearInterval(this.idempotencyCleanupInterval);
  }
  this.connectionPool.closeAll();
  this.responseCache.destroy();
}
```

---

## 4. Performance Bottlenecks

### 🟠 HIGH: Synchronous File Operations in Main Thread
**File:** `src/router/dead-letter-queue.js`  
**Line:** 102-106  
**Severity:** High

**Issue:**
```javascript
try {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFileSync(this.queueFile, line, 'utf8');  // ❌ Blocking I/O
} catch (err) {
  console.error(`Failed to persist DLQ entry: ${err.message}`);
}
```

Synchronous file operations block the event loop.

**Impact:** High - Blocks event loop, degrading performance under load.

**Recommendation:**
```javascript
async enqueue(entry) {
  if (this.queue.length >= this.maxSize) {
    this.stats.rejected++;
    return false;
  }

  const enriched = {
    ...entry,
    id: crypto.randomUUID(),
    enqueuedAt: Date.now(),
    retries: 0
  };

  this.queue.push(enriched);
  this.stats.enqueued++;
  this.stats.currentSize = this.queue.length;

  if (this.persistToDisk) {
    try {
      const line = JSON.stringify(enriched) + '\n';
      // Use async file operations
      await fs.promises.appendFile(this.queueFile, line, 'utf8');
    } catch (err) {
      console.error(`Failed to persist DLQ entry: ${err.message}`);
    }
  }

  return true;
}
```

---

### 🟡 MEDIUM: Inefficient Endpoint Selection Algorithm
**File:** `src/router/loadBalancer.js`  
**Line:** 56-91  
**Severity:** Medium

**Issue:**
```javascript
select(context = {}) {
  const available = Array.from(this.endpoints.values())
    .filter(ep => ep.healthy && ep.available && !ep.inCooldown);

  if (available.length === 0) {
    return null;
  }

  let selected;

  switch (this.strategy) {
    case 'round-robin':
      selected = this.roundRobin(available);
      break;
    // ... many cases
    default:
      selected = this.roundRobin(available);
  }
  // ❌ Filters all endpoints on every request
}
```

Filtering all endpoints on every request is inefficient.

**Impact:** Medium - Performance degradation with many endpoints.

**Recommendation:**
```javascript
constructor(options = {}) {
  // ...
  this.availableEndpoints = [];
  this.availableEndpointsDirty = true;
}

addEndpoint(name, url, weight = 1, metadata = {}) {
  // ... existing code
  this.availableEndpointsDirty = true;
  return endpoint;
}

setHealth(endpointName, healthy) {
  const endpoint = this.endpoints.get(endpointName);
  if (endpoint) {
    endpoint.healthy = healthy;
    this.availableEndpointsDirty = true;
  }
}

getAvailableEndpoints() {
  if (this.availableEndpointsDirty) {
    this.availableEndpoints = Array.from(this.endpoints.values())
      .filter(ep => ep.healthy && ep.available && !ep.inCooldown);
    this.availableEndpointsDirty = false;
  }
  return this.availableEndpoints;
}

select(context = {}) {
  const available = this.getAvailableEndpoints();

  if (available.length === 0) {
    return null;
  }

  // ... rest of selection logic
}
```

---

### 🟡 MEDIUM: Inefficient Latency Calculation
**File:** `src/router/loadBalancer.js`  
**Line:** 197-207  
**Severity:** Medium

**Issue:**
```javascript
recordSuccess(endpointName, latency) {
  const endpoint = this.endpoints.get(endpointName);
  if (!endpoint) return;

  endpoint.successes++;
  endpoint.lastSuccess = Date.now();
  endpoint.failures = 0;
  endpoint.inCooldown = false;
  endpoint.cooldownUntil = null;

  if (latency) {
    endpoint.requests++;
    endpoint.avgLatency = ((endpoint.avgLatency * (endpoint.requests - 1)) + latency) / endpoint.requests;
    // ❌ Recalculates average on every request, prone to floating point errors
  }
}
```

Recalculating average on every request is inefficient and prone to floating point drift.

**Impact:** Medium - Performance degradation and accuracy issues.

**Recommendation:**
```javascript
recordSuccess(endpointName, latency) {
  const endpoint = this.endpoints.get(endpointName);
  if (!endpoint) return;

  endpoint.successes++;
  endpoint.lastSuccess = Date.now();
  endpoint.failures = 0;
  endpoint.inCooldown = false;
  endpoint.cooldownUntil = null;

  if (latency) {
    endpoint.requests++;
    endpoint.latencySum = (endpoint.latencySum || 0) + latency;
    endpoint.avgLatency = Math.round(endpoint.latencySum / endpoint.requests);
    endpoint.minLatency = Math.min(endpoint.minLatency, latency);
    endpoint.maxLatency = Math.max(endpoint.maxLatency, latency);
    
    this.stats.latencySum += latency;
    this.stats.byEndpoint[endpointName].latencySum += latency;
  }

  this.updateWeightMultiplier(endpoint);
  this.availableEndpointsDirty = true;
}
```

---

### 🟡 MEDIUM: Redundant JSON Parsing in Streaming
**File:** `src/router/streaming.js`  
**Line:** 230-245  
**Severity:** Medium

**Issue:**
```javascript
function parseStreamPayload(body) {
  const lines = body.split('\n');
  const parser = createSSEParser();
  const events = [];

  for (const line of lines) {
    const event = parser.parse(line);
    if (event) {
      events.push(event);  // ❌ Stores all events in memory
    }
  }

  return events;
}
```

Stores all events in memory, which is inefficient for large streams.

**Impact:** Medium - Memory usage scales with stream size.

**Recommendation:**
```javascript
function* parseStreamPayload(body) {
  const lines = body.split('\n');
  const parser = createSSEParser();

  for (const line of lines) {
    const event = parser.parse(line);
    if (event) {
      yield event;  // Use generator for memory efficiency
    }
  }
}

// Usage:
for (const event of parseStreamPayload(body)) {
  // Process event
}
```

---

## 5. Code Quality Issues

### 🟢 LOW: Inconsistent Error Logging
**Files:** Multiple  
**Severity:** Low

**Issue:**
Inconsistent error logging patterns across modules:
- Some use `console.error`
- Some use logger
- Some log full error objects (potential sensitive data exposure)
- Some only log error messages

**Impact:** Low - Makes debugging harder, potential security issues.

**Recommendation:**
Standardize on a logging approach:

```javascript
// Create a centralized error logger
import { createLogger } from './logger.js';

const logger = createLogger('module-name');

// Sanitize errors before logging
function logError(context, error, metadata = {}) {
  const sanitized = {
    message: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    ...metadata
  };
  
  logger.error(context, sanitized);
}

// Usage:
try {
  // ...
} catch (err) {
  logError('Failed to process request', err, { requestId, endpoint });
}
```

---

### 🟢 LOW: Magic Numbers Throughout Codebase
**Files:** Multiple  
**Severity:** Low

**Issue:**
Many magic numbers without explanation:
- `600000` (10 minutes) in auth.js
- `3600000` (1 hour) in auth.js
- `5000` (5 seconds) in various timeout contexts
- `1000` (1 second) in cooldown calculations

**Impact:** Low - Reduces code maintainability.

**Recommendation:**
Define constants at module level:

```javascript
// At top of file
const TIMEOUTS = {
  STATE_EXPIRY_MS: 10 * 60 * 1000,      // 10 minutes
  JWKS_TTL_MS: 60 * 60 * 1000,          // 1 hour
  REQUEST_TIMEOUT_MS: 5 * 1000,         // 5 seconds
  COOLDOWN_BASE_MS: 1 * 1000,           // 1 second
  CLEANUP_INTERVAL_MS: 5 * 60 * 1000    // 5 minutes
};

// Usage:
expiresAt: Date.now() + TIMEOUTS.STATE_EXPIRY_MS
```

---

### 🟢 LOW: Unused Variables and Dead Code
**Files:** Multiple  
**Severity:** Low

**Issue:**
Several instances of unused variables:
- `src/router/streaming.js` line 177: `totalAge` is declared but never used
- `src/router/connectionPool.js`: Some metrics may not be used

**Impact:** Low - Code clutter, minor performance impact.

**Recommendation:**
Run ESLint with `no-unused-vars` rule and clean up:

```bash
npx eslint src/router/ --fix
```

---

## Summary by Priority

### Critical (7 issues)
1. ✅ Timing attack in API key validation
2. ✅ Timing attack in signature verification
3. ✅ Sensitive data in logs
4. ✅ Unhandled promise rejection in Redis subscribe
5. ✅ Missing error handling in stream events
6. ✅ Connection pool not closed on shutdown
7. ✅ WebSocket connections not cleaned up

### High (11 issues)
1. ✅ Missing input sanitization in OAuth2
2. ✅ Unbounded state store growth
3. ✅ JWKS cache poisoning risk
4. ✅ Missing TLS verification
5. ✅ Missing timeout in connection pool requests
6. ✅ Duplicate usage property in RouterCore
7. ✅ Missing error handling in WebSocket message handler
8. ✅ Missing validation in circuit breaker execute
9. ✅ Redis connection not properly closed
10. ✅ Synchronous file operations in main thread

### Medium (7 issues)
1. ✅ Missing error handling in OAuth token revocation
2. ✅ Missing cleanup in ResponseCache
3. ✅ Stream manager doesn't clean up parsers
4. ✅ Load balancer affinity map unbounded growth
5. ✅ RouterCore idempotency cache unbounded
6. ✅ Inefficient endpoint selection algorithm
7. ✅ Inefficient latency calculation
8. ✅ Redundant JSON parsing in streaming

### Low (3 issues)
1. ✅ Inconsistent error logging
2. ✅ Magic numbers throughout codebase
3. ✅ Unused variables and dead code

---

## Recommended Action Plan

### Phase 1: Critical Security Fixes (Week 1)
1. Implement constant-time comparisons in auth.js
2. Add sensitive data sanitization to all logging
3. Fix unhandled promise rejections
4. Add proper resource cleanup on shutdown

### Phase 2: High Priority Fixes (Week 2)
1. Add input validation and size limits
2. Implement proper timeout handling
3. Fix logic errors (duplicate properties)
4. Add comprehensive error handling

### Phase 3: Resource Management (Week 3)
1. Add size limits to all caches and maps
2. Implement automatic cleanup intervals
3. Add proper shutdown procedures
4. Fix memory leaks

### Phase 4: Performance Optimization (Week 4)
1. Replace synchronous I/O with async
2. Optimize hot paths (endpoint selection, latency calculation)
3. Use generators for streaming data
4. Cache frequently computed values

### Phase 5: Code Quality (Week 5)
1. Standardize error logging
2. Replace magic numbers with constants
3. Remove dead code
4. Add comprehensive JSDoc comments

---

## Testing Recommendations

For each fix, ensure:
1. Unit tests cover the fixed code path
2. Integration tests verify the fix doesn't break existing functionality
3. Load tests confirm performance improvements
4. Security tests validate vulnerability is closed

### Suggested New Tests

```javascript
// Test timing attack resistance
test('API key validation is constant-time', async () => {
  const manager = new APIKeyManager();
  const { key } = manager.generateKey();
  
  const validTimes = [];
  const invalidTimes = [];
  
  for (let i = 0; i < 1000; i++) {
    const start = process.hrtime.bigint();
    manager.validateKey(key);
    const end = process.hrtime.bigint();
    validTimes.push(Number(end - start));
  }
  
  for (let i = 0; i < 1000; i++) {
    const start = process.hrtime.bigint();
    manager.validateKey('invalid_key_12345_67890');
    const end = process.hrtime.bigint();
    invalidTimes.push(Number(end - start));
  }
  
  const validAvg = validTimes.reduce((a, b) => a + b) / validTimes.length;
  const invalidAvg = invalidTimes.reduce((a, b) => a + b) / invalidTimes.length;
  
  // Timing difference should be minimal (< 10%)
  const diff = Math.abs(validAvg - invalidAvg) / validAvg;
  assert.ok(diff < 0.1, `Timing difference too large: ${diff}`);
});

// Test resource cleanup
test('All resources cleaned up on shutdown', async () => {
  const router = new RouterCore();
  // ... setup
  
  await router.shutdown();
  
  assert.equal(router.connectionPool.pools.size, 0);
  assert.equal(router.idempotencyCache.size, 0);
  assert.equal(router.responseCache.cache.size, 0);
});

// Test memory leak prevention
test('Caches respect size limits', async () => {
  const cache = new ResponseCache({ maxSize: 10 });
  
  for (let i = 0; i < 100; i++) {
    await cache.set(`key${i}`, `value${i}`);
  }
  
  assert.ok(cache.cache.size <= 10, 'Cache exceeded size limit');
});
```

---

## Conclusion

This scan identified 28 issues across security, error handling, resource management, performance, and code quality. The most critical issues involve timing attacks, unhandled errors, and resource leaks that could lead to security breaches or service degradation.

**Immediate action required on:**
- All 7 critical security vulnerabilities
- 5 high-priority error handling gaps
- 2 critical resource management issues

Addressing these issues will significantly improve the robustness, security, and maintainability of the NeuralShell router.
