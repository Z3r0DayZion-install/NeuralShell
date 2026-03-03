import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { sanitizeForLogging } from './security-utils.js';
import { TIMEOUTS, SIZE_LIMITS } from './constants.js';

const DEFAULT_POOL_SIZE = 50;
const DEFAULT_MAX_FREE_SOCKETS = 10;
const DEFAULT_TIMEOUT_MS = 30000;

class ConnectionPool {
  constructor(options = {}) {
    this.maxSockets = options.maxSockets || DEFAULT_POOL_SIZE;
    this.maxFreeSockets = options.maxFreeSockets || DEFAULT_MAX_FREE_SOCKETS;
    this.timeout = options.timeout || DEFAULT_TIMEOUT_MS;
    this.keepAlive = options.keepAlive !== false;
    this.keepAliveInitialDelay = options.keepAliveInitialDelay || 0;

    this.pools = new Map();
    this.metrics = {
      requestsTotal: 0,
      requestsActive: 0,
      requestsQueued: 0,
      bytesSent: 0,
      bytesReceived: 0,
      errors: 0,
      timeouts: 0
    };
  }

  getPoolKey(url, options = {}) {
    const parsed = new URL(url);
    const port = options.port || (parsed.protocol === 'https:' ? 443 : 80);
    return `${parsed.protocol}://${parsed.hostname}:${port}`;
  }

  getPool(url, options = {}) {
    const key = this.getPoolKey(url, options);

    if (!this.pools.has(key)) {
      const isHttps = url.startsWith('https://');
      const agent = new (isHttps ? https : http).Agent({
        maxSockets: this.maxSockets,
        maxFreeSockets: this.maxFreeSockets,
        timeout: this.timeout,
        keepAlive: this.keepAlive,
        keepAliveInitialDelay: this.keepAliveInitialDelay,
        ...options
      });

      this.pools.set(key, {
        agent,
        url,
        createdAt: Date.now(),
        requests: 0,
        errors: 0,
        totalTime: 0
      });
    }

    return this.pools.get(key);
  }

  async request(url, options = {}) {
    const startTime = Date.now();
    this.metrics.requestsTotal++;
    this.metrics.requestsActive++;

    const pool = this.getPool(url, options.agentOptions || {});
    pool.requests++;

    return new Promise((resolve, reject) => {
      const requestTimeout = options.timeout || this.timeout;
      const responseReadTimeout = TIMEOUTS.RESPONSE_READ_TIMEOUT_MS;
      let responseSize = 0;

      const requestOptions = {
        method: options.method || 'POST',
        headers: options.headers || {},
        timeout: requestTimeout,
        agent: pool.agent,
        ...options
      };

      const req = (url.startsWith('https') ? https : http).request(url, requestOptions, (res) => {
        const chunks = [];

        // Set overall timeout for response reading
        const overallTimeout = setTimeout(() => {
          req.destroy();
          this.metrics.requestsActive--;
          this.metrics.timeouts++;
          reject(new Error('Response read timeout'));
        }, responseReadTimeout);

        res.on('data', (chunk) => {
          chunks.push(chunk);
          responseSize += chunk.length;
          this.metrics.bytesReceived += chunk.length;

          // Enforce max response size
          if (responseSize > SIZE_LIMITS.MAX_RESPONSE_SIZE_BYTES) {
            clearTimeout(overallTimeout);
            req.destroy();
            this.metrics.requestsActive--;
            this.metrics.errors++;
            reject(new Error('Response size exceeded limit'));
          }
        });

        res.on('end', () => {
          clearTimeout(overallTimeout);
          this.metrics.requestsActive--;
          pool.totalTime += Date.now() - startTime;

          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body,
            raw: res
          });
        });

        res.on('error', (err) => {
          clearTimeout(overallTimeout);
          this.metrics.requestsActive--;
          this.metrics.errors++;
          pool.errors++;
          console.error('Response error:', sanitizeForLogging({ error: err.message }));
          reject(err);
        });
      });

      req.on('error', (err) => {
        this.metrics.requestsActive--;
        this.metrics.errors++;
        pool.errors++;
        console.error('Request error:', sanitizeForLogging({ error: err.message }));
        reject(err);
      });

      req.on('timeout', () => {
        this.metrics.requestsActive--;
        this.metrics.timeouts++;
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        const body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
        this.metrics.bytesSent += Buffer.byteLength(body, 'utf8');
        req.write(body);
      }

      req.end();
    });
  }

  async requestStream(url, options = {}) {
    this.metrics.requestsTotal++;
    this.metrics.requestsActive++;

    const pool = this.getPool(url, options.agentOptions || {});
    pool.requests++;

    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'POST',
        headers: options.headers || {},
        timeout: options.timeout || this.timeout,
        agent: pool.agent,
        ...options
      };

      const req = (url.startsWith('https') ? https : http).request(url, requestOptions, (res) => {
        this.metrics.requestsActive--;

        resolve({
          status: res.statusCode,
          headers: res.headers,
          stream: res
        });
      });

      req.on('error', (err) => {
        this.metrics.requestsActive--;
        this.metrics.errors++;
        reject(err);
      });

      req.on('timeout', () => {
        this.metrics.requestsActive--;
        this.metrics.timeouts++;
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  getPoolStats() {
    const stats = {};
    for (const [key, pool] of this.pools) {
      const avgTime = pool.requests > 0 ? pool.totalTime / pool.requests : 0;
      stats[key] = {
        url: pool.url,
        requests: pool.requests,
        errors: pool.errors,
        avgResponseTimeMs: Math.round(avgTime),
        uptimeMs: Date.now() - pool.createdAt
      };
    }
    return stats;
  }

  getMetrics() {
    return {
      ...this.metrics,
      poolsActive: this.pools.size
    };
  }

  closePool(url) {
    const key = this.getPoolKey(url);
    const pool = this.pools.get(key);
    if (pool) {
      pool.agent.destroy();
      this.pools.delete(key);
    }
  }

  async closeAll() {
    // Wait for active requests to complete with timeout
    const startTime = Date.now();
    const gracePeriod = TIMEOUTS.SHUTDOWN_GRACE_PERIOD_MS;

    while (this.metrics.requestsActive > 0 && (Date.now() - startTime) < gracePeriod) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Force close after grace period
    for (const pool of this.pools.values()) {
      try {
        pool.agent.destroy();
      } catch (err) {
        console.error('Error destroying agent:', sanitizeForLogging({ error: err.message }));
      }
    }
    this.pools.clear();
  }

  async destroy() {
    await this.closeAll();
  }
}

export { ConnectionPool };
