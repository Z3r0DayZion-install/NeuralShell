import Redis from 'ioredis';
import crypto from 'crypto';

/**
 * Federation Node
 *
 * Allows this NeuralShell instance to discover peers and form a cluster.
 * Uses Redis keys with TTL to maintain a dynamic registry of active nodes.
 */
export class FederationNode {
  constructor(config = {}) {
    this.nodeId = config.nodeId || crypto.randomUUID();
    this.region = config.region || 'us-east';
    this.capabilities = config.capabilities || ['router', 'swarm'];
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const isTestLike = process.env.NODE_ENV === 'test' || process.env.PROOF_MODE === '1' || process.env.DRY_RUN === '1';
    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: isTestLike ? 1 : 20,
      connectTimeout: isTestLike ? 750 : 5000,
      retryStrategy: (times) => {
        if (!isTestLike) {
          return Math.min(times * 250, 2000);
        }
        return times > 2 ? null : Math.min(times * 150, 500);
      }
    });
    this.redis.on('error', (err) => {
      console.warn('[Federation] Redis error:', err?.message || String(err));
    });
    this.heartbeatInterval = null;
    this.enabled = true;
  }

  async start() {
    console.log(`[Federation] Node ${this.nodeId} joining cluster...`);

    try {
      await this.redis.connect();
    } catch (err) {
      this.enabled = false;
      console.warn('[Federation] Redis unavailable; federation disabled:', err?.message || String(err));
      return false;
    }

    // Initial registration
    await this.beat();

    // Heartbeat loop (every 10s)
    this.heartbeatInterval = setInterval(() => this.beat(), 10000);

    // Discovery
    await this.discoverPeers();
  }

  async stop() {
    clearInterval(this.heartbeatInterval);
    if (!this.enabled) {
      await this.redis.disconnect().catch(() => {});
      return;
    }
    await this.redis.del(`federation:node:${this.nodeId}`).catch(() => {});
    await this.redis.quit().catch(() => this.redis.disconnect().catch(() => {}));
  }

  async beat() {
    if (!this.enabled) {
      return;
    }
    const info = JSON.stringify({
      id: this.nodeId,
      region: this.region,
      capabilities: this.capabilities,
      lastSeen: Date.now()
    });
    // Set key with 15s TTL (auto-expire if node crashes)
    await this.redis.set(`federation:node:${this.nodeId}`, info, 'EX', 15);
  }

  async discoverPeers() {
    if (!this.enabled) {
      return [];
    }
    const keys = await this.redis.keys('federation:node:*');
    const peers = [];

    for (const key of keys) {
      if (key === `federation:node:${this.nodeId}`) {
        continue;
      }
      const data = await this.redis.get(key);
      if (data) {
        peers.push(JSON.parse(data));
      }
    }

    console.log(`[Federation] Discovered ${peers.length} peers.`);
    return peers;
  }
}
