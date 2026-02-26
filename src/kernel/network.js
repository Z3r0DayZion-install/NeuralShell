import https from 'node:https';
import crypto from 'node:crypto';
import { URL } from 'node:url';

const NETWORK_POLICY = Object.freeze({
  MAX_BYTES: 10 * 1024 * 1024,
  TIMEOUT: 15000,
  METHODS: ['GET', 'POST'],
  HEADERS: ['accept', 'content-type', 'user-agent'],
  PINS: { 'api.trusted-llm.com': 'sha256/iv6Ip...REQUIRED_HASH...' }
});

function safeFetch(urlStr, options = {}) {
  // Purge Proxy Environment Variables
  const proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY', 'NO_PROXY', 'NODE_OPTIONS', 'SSL_CERT_FILE', 'SSL_CERT_DIR'];
  proxyVars.forEach(v => {
    delete process.env[v]; delete process.env[v.toLowerCase()];
  });

  const url = new URL(urlStr);
  if (url.protocol !== 'https:') {
    throw new Error('ERR_PROTOCOL_DENIED');
  }

  const pin = NETWORK_POLICY.PINS[url.hostname];
  if (!pin) {
    throw new Error('ERR_PIN_REQUIRED');
  }

  const method = (options.method || 'GET').toUpperCase();
  if (!NETWORK_POLICY.METHODS.includes(method)) {
    throw new Error('ERR_METHOD_DENIED');
  }

  // Validate and filter headers against whitelist
  const filteredHeaders = {};
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      const lowerKey = key.toLowerCase();
      if (NETWORK_POLICY.HEADERS.includes(lowerKey)) {
        filteredHeaders[lowerKey] = value;
      } else {
        throw new Error(`ERR_HEADER_DENIED: ${key}`);
      }
    }
  }

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: filteredHeaders,
      timeout: NETWORK_POLICY.TIMEOUT,
      agent: new https.Agent({ keepAlive: false }),
      checkServerIdentity: (host, cert) => {
        const x509 = new crypto.X509Certificate(cert.raw);
        const spki = x509.publicKey.export({ type: 'spki', format: 'der' });
        const hash = crypto.createHash('sha256').update(spki).digest('base64');
        if (`sha256/${hash}` !== pin) {
          return new Error('ERR_PIN_MISMATCH');
        }
        return undefined;
      }
    }, res => {
      if (res.statusCode >= 300) {
        req.destroy(); return reject(new Error('ERR_REDIRECT_DENIED'));
      }

      let size = 0;
      const chunks = [];
      res.on('data', d => {
        size += d.length;
        if (size > NETWORK_POLICY.MAX_BYTES) {
          req.destroy();
          reject(new Error('ERR_SIZE_EXCEEDED'));
        }
        chunks.push(d);
      });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(); reject(new Error('ERR_TIMEOUT'));
    });
    req.end(options.body);
  });
}

export { safeFetch };
