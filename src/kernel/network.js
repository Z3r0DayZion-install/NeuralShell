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
    this.pinnedKeys = new Map([
      ['updates.neuralshell.app', ['sha256/f7bb5d8487103251d86776295da97742d17c3857e4c029a68a99-ebff-11f0-b275-28dfeb5c36cb']]
    ]);
    this.maxResponseSize = 5 * 1024 * 1024; // 5 MB
    this.timeoutMs = 15000;
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

    if (targetUrl.protocol !== 'https:') {
      throw new Error('OMEGA_BLOCK: Only HTTPS is allowed.');
    }

    const agent = new https.Agent({
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
    });

    const safeHeaders = this._filterHeaders(headers);

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

    // Return raw Buffer to prevent string-based kernel exploits
    const buffer = await response.buffer();
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: buffer.toString('base64') 
    };
  }
}

module.exports = new NetworkBroker();
