const https = require('https');
const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * NeuralShell Network Broker — OMEGA ENFORCEMENT MODE
 * 
 * Enforces:
 * - HTTPS only
 * - Mandatory SPKI Pinning
 * - Header Allowlist (Accept, Content-Type, User-Agent)
 * - Proxy Environment Scrubbing
 * - Response Size Caps
 * - No Redirects
 */

const ALLOWED_HEADERS = new Set(['accept', 'content-type', 'user-agent']);
const PROXY_ENV_VARS = ['http_proxy', 'https_proxy', 'all_proxy', 'no_proxy', 'HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY'];

class NetworkBroker {
  constructor() {
    this.pinnedKeys = this._loadPinnedKeys();
    this.maxResponseSize = 5 * 1024 * 1024; // 5 MB
    this.timeoutMs = 15000;
  }

  _loadPinnedKeys() {
    const pins = new Map();
    const raw = String(process.env.NEURALSHELL_UPDATES_TLS_PINS || '');
    const parsedPins = raw
      .split(',')
      .map((pin) => pin.trim())
      .filter((pin) => /^sha256\/[A-Za-z0-9+/=]+$/.test(pin));
    if (parsedPins.length > 0) {
      pins.set('updates.neuralshell.app', parsedPins);
    }
    return pins;
  }

  /**
   * Scrub proxy environment variables to prevent interception.
   */
  _scrubEnv() {
    PROXY_ENV_VARS.forEach(v => {
      if (process.env[v]) delete process.env[v];
    });
  }

  /**
   * Filter headers against allowlist.
   */
  /**
   * Exponential backoff with jitter: base 400ms, doubles per attempt, ±200ms jitter.
   */
  _backoffMs(attempt) {
    return Math.min(400 * Math.pow(2, attempt), 8000) + Math.floor(Math.random() * 200);
  }

  _filterHeaders(headers) {
    const filtered = {};
    for (const [key, value] of Object.entries(headers)) {
      if (ALLOWED_HEADERS.has(key.toLowerCase())) {
        filtered[key.toLowerCase()] = value;
      }
    }
    return filtered;
  }

  /**
   * Secure fetch implementation.
   * @param {Object} payload { url, method, headers, body, timeoutMs }
   */
  async safeFetch(payload) {
    this._scrubEnv();
    
    const { url, method = 'GET', headers = {}, body, timeoutMs = this.timeoutMs } = payload;
    const targetUrl = new URL(url);

    if (targetUrl.protocol !== 'https:' && targetUrl.hostname !== '127.0.0.1' && targetUrl.hostname !== 'localhost') {
      throw new Error('OMEGA_BLOCK: Only HTTPS is allowed for remote endpoints.');
    }

    const agent = targetUrl.protocol === 'https:' ? new https.Agent({
      keepAlive: false,
      rejectUnauthorized: true,
      checkServerIdentity: (host, cert) => {
        const pins = this.pinnedKeys.get(host);
        if (!pins) throw new Error(`OMEGA_BLOCK: No pins for ${host}`);

        const spkiHash = crypto.createHash('sha256').update(cert.pubkey).digest('base64');
        if (!pins.includes(`sha256/${spkiHash}`)) {
          throw new Error(`OMEGA_BLOCK: SPKI pin mismatch for ${host}`);
        }
        return undefined;
      }
    }) : undefined;

    const safeHeaders = this._filterHeaders(headers);

    let lastError;
    const maxRetries = 3;
    const RETRYABLE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND']);
    const RETRYABLE_HTTP = new Set([429, 503, 504]);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: method.toUpperCase() === 'POST' ? 'POST' : 'GET',
          headers: safeHeaders,
          body: body ? JSON.stringify(body) : undefined,
          timeout: timeoutMs,
          redirect: 'error', // Absolute denial of redirects
          agent,
          trustProxy: false
        });

        const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
        if (contentLength > this.maxResponseSize) {
          throw new Error('OMEGA_BLOCK: Response size exceeds limit.');
        }

        // Retry on transient HTTP error codes before returning
        if (RETRYABLE_HTTP.has(response.status) && attempt < maxRetries) {
          const retryAfterMs = parseInt(response.headers.get('retry-after') || '0', 10) * 1000
            || this._backoffMs(attempt);
          await new Promise(res => setTimeout(res, retryAfterMs));
          continue;
        }

        // Return raw Buffer to prevent string-based kernel exploits
        const buffer = await response.buffer();
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          data: buffer.toString('base64')
        };
      } catch (error) {
        lastError = error;
        const isRetryable = RETRYABLE_CODES.has(error.code) || error.type === 'request-timeout';
        if (isRetryable && attempt < maxRetries) {
          await new Promise(res => setTimeout(res, this._backoffMs(attempt)));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  }
}

module.exports = new NetworkBroker();
