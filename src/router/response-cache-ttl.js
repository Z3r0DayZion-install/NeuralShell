// Response caching with TTL and LRU eviction
export class ResponseCache {
  constructor(config = {}) {
    this.cache = new Map();
    this.accessTimes = new Map();
    this.maxSize = config.maxSize || 1000;
    this.defaultTtlMs = config.defaultTtlMs || 300000; // 5 minutes
    this.cleanupIntervalMs = config.cleanupIntervalMs || 60000;

    if (this.cleanupIntervalMs > 0) {
      this.cleanupInterval = setInterval(() => this.cleanup(), this.cleanupIntervalMs);
      this.cleanupInterval.unref?.();
    }

    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expired: 0
    };
  }

  getKey(messages, endpoint) {
    const msgHash = this.hashMessages(messages);
    return `${endpoint}::${msgHash}`;
  }

  hashMessages(messages) {
    const canonical = messages.map((m) => `${m.role}:${m.content}`).join('|');
    return require('crypto').createHash('md5').update(canonical).digest('hex');
  }

  set(key, value, ttlMs = null) {
    const expireAt = Date.now() + (ttlMs || this.defaultTtlMs);

    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expireAt,
      createdAt: Date.now(),
      accessCount: 0
    });

    this.accessTimes.set(key, Date.now());
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses += 1;
      return null;
    }

    // Check expiration
    if (entry.expireAt < Date.now()) {
      this.cache.delete(key);
      this.accessTimes.delete(key);
      this.stats.expired += 1;
      this.stats.misses += 1;
      return null;
    }

    // Update access metadata
    entry.accessCount += 1;
    this.accessTimes.set(key, Date.now());
    this.stats.hits += 1;

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    this.cache.delete(key);
    this.accessTimes.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessTimes.clear();
  }

  evictLRU() {
    // Find least recently used entry
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessTimes.delete(oldestKey);
      this.stats.evictions += 1;
    }
  }

  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache) {
      if (entry.expireAt < now) {
        this.cache.delete(key);
        this.accessTimes.delete(key);
        cleaned += 1;
      }
    }

    if (cleaned > 0) {
      console.log(`Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? `${(this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) }%`
        : 'N/A'
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}
