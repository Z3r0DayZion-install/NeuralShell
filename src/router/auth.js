import crypto from 'crypto';
import https from 'https';
import jwt from 'jsonwebtoken';
import { URL } from 'node:url';
import { timingSafeCompare, validateOAuthState } from './security-utils.js';
import { SizeLimitedMap } from './size-limited-map.js';
import { TIMEOUTS, SIZE_LIMITS, INTERVALS } from './constants.js';

class OAuth2Provider {
  constructor(options = {}) {
    this.clientId = options.clientId || '';
    this.clientSecret = options.clientSecret || '';
    this.authorizationEndpoint = options.authorizationEndpoint || '';
    this.tokenEndpoint = options.tokenEndpoint || '';
    this.redirectUri = options.redirectUri || '';
    this.scopes = options.scopes || ['openid', 'profile', 'email'];
    this.issuer = options.issuer || '';
    this.jwksUri = options.jwksUri || '';
    this.stateStore = new SizeLimitedMap({
      maxSize: SIZE_LIMITS.MAX_OAUTH_STATES,
      ttl: TIMEOUTS.STATE_EXPIRY_MS
    });
    this.codeVerifiers = new Map();

    // Create HTTPS agent with TLS verification
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2'
    });

    // Setup automatic cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupStates();
    }, INTERVALS.OAUTH_STATE_CLEANUP_MS);
  }

  generateAuthorizationUrl(state, options = {}) {
    // Validate state parameter
    validateOAuthState(state);

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: options.scope || this.scopes.join(' '),
      state: state,
      ...(options.codeChallenge && {
        code_challenge: options.codeChallenge,
        code_challenge_method: 'S256'
      })
    });

    if (options.nonce) {
      params.append('nonce', options.nonce);
    }

    return `${this.authorizationEndpoint}?${params.toString()}`;
  }

  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateCodeVerifier() {
    return crypto.randomBytes(32).toString('base64url');
  }

  generateCodeChallenge(verifier) {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  async exchangeCode(code, codeVerifier = null) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: this.redirectUri
    });

    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
    }

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      agent: this.httpsAgent
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  async refreshToken(refreshToken) {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      agent: this.httpsAgent
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

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
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString(),
        agent: this.httpsAgent
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Token revocation failed:', error);
        return { success: false, error: error.error || 'Revocation failed' };
      }

      return { success: true };
    } catch (err) {
      console.error('Token revocation error:', err.message);
      return { success: false, error: err.message };
    }
  }

  storeState(state, data) {
    this.stateStore.set(state, data);
  }

  getState(state) {
    return this.stateStore.get(state);
  }

  deleteState(state) {
    this.stateStore.delete(state);
  }

  cleanupStates() {
    this.stateStore.cleanupExpired();
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.stateStore.clear();
  }
}

class OIDCTokenVerifier {
  constructor(options = {}) {
    this.issuer = options.issuer || '';
    this.jwksUri = options.jwksUri || '';
    this.audience = options.audience || '';
    this.algorithms = options.algorithms || ['RS256'];
    this.jwks = null;
    this.jwksLastFetch = 0;
    this.jwksTtl = 3600000;
  }

  async fetchJWKS() {
    if (this.jwks && (Date.now() - this.jwksLastFetch) < this.jwksTtl) {
      return this.jwks;
    }

    try {
      const response = await fetch(this.jwksUri);

      if (!response.ok) {
        throw new Error(`JWKS fetch failed with status ${response.status}`);
      }

      const jwks = await response.json();

      // Validate JWKS structure
      if (!jwks || typeof jwks !== 'object') {
        throw new Error('Invalid JWKS structure: not an object');
      }

      if (!Array.isArray(jwks.keys)) {
        throw new Error('Invalid JWKS structure: keys is not an array');
      }

      // Validate each key has required fields
      for (const key of jwks.keys) {
        if (!key.kty || !key.kid) {
          throw new Error('Invalid JWK: missing required fields (kty, kid)');
        }

        // For RSA keys, validate required fields
        if (key.kty === 'RSA' && (!key.n || !key.e)) {
          throw new Error('Invalid RSA JWK: missing n or e');
        }
      }

      this.jwks = jwks;
      this.jwksLastFetch = Date.now();
      return this.jwks;
    } catch (err) {
      console.error('Failed to fetch JWKS:', err.message);

      // Return stale JWKS if available and not too old
      if (this.jwks && (Date.now() - this.jwksLastFetch) < TIMEOUTS.JWKS_STALE_TTL_MS) {
        console.warn('Using stale JWKS due to fetch failure');
        return this.jwks;
      }

      throw err;
    }
  }

  async verify(token) {
    const jwks = await this.fetchJWKS();
    if (!jwks) {
      throw new Error('Unable to fetch JWKS');
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const kid = decoded.header.kid;
    const key = jwks.keys?.find(k => k.kid === kid);

    if (!key) {
      throw new Error('Unable to find matching key');
    }

    const publicKey = crypto.createPublicKey({
      key: key,
      format: 'jwk'
    });

    const payload = jwt.verify(token, publicKey, {
      algorithms: this.algorithms,
      issuer: this.issuer,
      audience: this.audience
    });

    return payload;
  }

  async verifyWithoutAudience(token) {
    const jwks = await this.fetchJWKS();
    if (!jwks) {
      throw new Error('Unable to fetch JWKS');
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) {
      throw new Error('Invalid token');
    }

    const kid = decoded.header.kid;
    const key = jwks.keys?.find(k => k.kid === kid);

    if (!key) {
      throw new Error('Unable to find matching key');
    }

    const publicKey = crypto.createPublicKey({
      key: key,
      format: 'jwk'
    });

    const payload = jwt.verify(token, publicKey, {
      algorithms: this.algorithms,
      issuer: this.issuer
    });

    return payload;
  }
}

class RequestSigner {
  constructor(options = {}) {
    this.secretKey = options.secretKey || '';
    this.algorithm = options.algorithm || 'sha256';
    this.signatureHeader = options.signatureHeader || 'x-signature';
    this.timestampHeader = options.timestampHeader || 'x-timestamp';
    this.nonceHeader = options.nonceHeader || 'x-nonce';
    this.maxTimestampAge = options.maxTimestampAge || 300000;
  }

  generateSignature(payload, timestamp, nonce) {
    const data = `${timestamp}.${nonce}.${JSON.stringify(payload)}`;

    let signature;
    if (this.algorithm === 'sha256') {
      signature = crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
    } else if (this.algorithm === 'sha512') {
      signature = crypto.createHmac('sha512', this.secretKey).update(data).digest('hex');
    } else {
      signature = crypto.createHmac(this.algorithm, this.secretKey).update(data).digest('hex');
    }

    return signature;
  }

  sign(payload) {
    const timestamp = Date.now();
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = this.generateSignature(payload, timestamp, nonce);

    return {
      payload,
      signature,
      timestamp,
      nonce,
      headers: {
        [this.signatureHeader]: signature,
        [this.timestampHeader]: timestamp.toString(),
        [this.nonceHeader]: nonce
      }
    };
  }

  verify(payload, signature, timestamp, nonce) {
    if (!timestamp || !nonce || !signature) {
      return { valid: false, reason: 'Missing required fields' };
    }

    const age = Date.now() - parseInt(timestamp);
    if (age > this.maxTimestampAge) {
      return { valid: false, reason: 'Timestamp too old' };
    }

    const expectedSignature = this.generateSignature(payload, timestamp, nonce);

    // Use constant-time comparison to prevent timing attacks
    try {
      const isValid = timingSafeCompare(signature, expectedSignature);
      if (!isValid) {
        return { valid: false, reason: 'Signature mismatch' };
      }
    } catch (err) {
      return { valid: false, reason: 'Signature comparison failed' };
    }

    return { valid: true };
  }

  verifyRequest(req, body) {
    const signature = req.headers[this.signatureHeader];
    const timestamp = req.headers[this.timestampHeader];
    const nonce = req.headers[this.nonceHeader];

    if (!signature || !timestamp || !nonce) {
      return { valid: false, reason: 'Missing signature headers' };
    }

    const payload = {
      method: req.method,
      path: req.url,
      body: body || ''
    };

    return this.verify(payload, signature, timestamp, nonce);
  }
}

class APIKeyManager {
  constructor(options = {}) {
    this.keys = new Map();
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
  }

  generateKey(options = {}) {
    const keyId = this.generateKeyId();
    const keySecret = crypto.randomBytes(32).toString('hex');
    const prefix = options.prefix || 'ns';
    const fullKey = `${prefix}_${keyId}_${keySecret}`;

    const keyData = {
      id: keyId,
      prefix,
      secretHash: this.hashKey(keySecret), // Store hashed secret instead of plaintext
      name: options.name || 'API Key',
      createdAt: Date.now(),
      expiresAt: options.expiresAt || null,
      scopes: options.scopes || ['prompt'],
      rateLimit: options.rateLimit || 100,
      tenantId: options.tenantId || null,
      lastUsedAt: null,
      metadata: options.metadata || {}
    };

    this.keys.set(keyId, keyData);

    return {
      key: fullKey,
      id: keyId,
      secret: keySecret,
      data: keyData
    };
  }

  generateKeyId() {
    return crypto.randomBytes(8).toString('hex');
  }

  hashKey(key) {
    return crypto.createHash(this.hashAlgorithm).update(key).digest('hex');
  }

  validateKey(fullKey) {
    const parts = fullKey.split('_');
    if (parts.length < 3) {
      // Use constant-time comparison even for invalid format
      // to prevent timing attacks on key format detection
      const dummyHash = this.hashKey('dummy_secret_for_timing');
      const dummyCompare = this.hashKey('another_dummy_secret');
      try {
        timingSafeCompare(dummyHash, dummyCompare);
      } catch (err) {
        // Ignore error
      }
      return { valid: false, reason: 'Invalid key format' };
    }

    const [, keyId, secret] = parts;
    const keyData = this.keys.get(keyId);

    if (!keyData) {
      // Use constant-time comparison even for non-existent keys
      // to prevent timing attacks on key existence
      const providedHash = this.hashKey(secret);
      const dummyHash = this.hashKey('dummy_secret_for_timing');
      try {
        timingSafeCompare(providedHash, dummyHash);
      } catch (err) {
        // Ignore error
      }
      return { valid: false, reason: 'Key not found' };
    }

    // Use constant-time comparison for secret validation
    const providedHash = this.hashKey(secret);
    let secretValid = false;
    try {
      secretValid = timingSafeCompare(providedHash, keyData.secretHash);
    } catch (err) {
      return { valid: false, reason: 'Secret validation failed' };
    }

    if (!secretValid) {
      return { valid: false, reason: 'Invalid secret' };
    }

    if (keyData.expiresAt && keyData.expiresAt < Date.now()) {
      return { valid: false, reason: 'Key expired' };
    }

    if (keyData.revokedAt) {
      return { valid: false, reason: 'Key revoked' };
    }

    keyData.lastUsedAt = Date.now();

    return {
      valid: true,
      keyId,
      scopes: keyData.scopes,
      rateLimit: keyData.rateLimit,
      tenantId: keyData.tenantId,
      metadata: keyData.metadata
    };
  }

  revokeKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (keyData) {
      keyData.revokedAt = Date.now();
      return true;
    }
    return false;
  }

  getKey(keyId) {
    return this.keys.get(keyId);
  }

  listKeys(tenantId = null) {
    return Array.from(this.keys.values())
      .filter(k => !tenantId || k.tenantId === tenantId)
      .map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt,
        expiresAt: k.expiresAt,
        lastUsedAt: k.lastUsedAt,
        revokedAt: k.revokedAt,
        scopes: k.scopes
      }));
  }
}

export { OAuth2Provider, OIDCTokenVerifier, RequestSigner, APIKeyManager };
