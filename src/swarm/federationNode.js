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
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.heartbeatInterval = null;
  }

  async start() {
    console.log(`[Federation] Node ${this.nodeId} joining cluster...`);
    
    // Initial registration
    await this.beat();
    
    // Heartbeat loop (every 10s)
    this.heartbeatInterval = setInterval(() => this.beat(), 10000);
    
    // Discovery
    await this.discoverPeers();
  }

  async stop() {
    clearInterval(this.heartbeatInterval);
    await this.redis.del(`federation:node:${this.nodeId}`);
    await this.redis.quit();
  }

  async beat() {
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
    const keys = await this.redis.keys('federation:node:*');
    const peers = [];
    
    for (const key of keys) {
      if (key === `federation:node:${this.nodeId}`) continue;
      const data = await this.redis.get(key);
      if (data) peers.push(JSON.parse(data));
    }
    
    console.log(`[Federation] Discovered ${peers.length} peers.`);
    return peers;
  }
}
