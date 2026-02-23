import crypto from 'crypto';

class ResponseCache {
  constructor(options = {}) {
    this.ttlSeconds = options.ttlSeconds || 300;
    this.maxSize = options.maxSize || 1000;
    this.enabled = options.enabled !== false;
    this.cache = new Map();
    this.timers = new Map();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.evictionsByTtl = 0;

    if (options.redis) {
      this.redis = options.redis;
      this.useRedis = true;
    }
  }

  generateKey(request) {
    const normalized = {
      url: request.url,
      method: request.method || 'POST',
      body: request.body
    };
    const str = JSON.stringify(normalized);
    return crypto.createHash('sha256').update(str).digest('hex').slice(0, 32);
  }

  async get(key) {
    if (!this.enabled) {
      return null;
    }

    if (this.useRedis && this.redis) {
      try {
        const cached = await this.redis.get(`cache:${key}`);
        if (cached) {
          this.hits++;
          return JSON.parse(cached);
        }
        this.misses++;
        return null;
      } catch (err) {
        console.error('Redis cache get error:', err.message);
      }
    }

    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.evictionsByTtl++;
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  async set(key, value, ttlSeconds = this.ttlSeconds) {
    if (!this.enabled) {
      return;
    }

    const expiresAt = Date.now() + (ttlSeconds * 1000);

    if (this.useRedis && this.redis) {
      try {
        await this.redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(value));
        return;
      } catch (err) {
        console.error('Redis cache set error:', err.message);
      }
    }

    // Clear existing timer before setting new one
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(key);
    }

    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
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

  evictOldest() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      const timer = this.timers.get(oldestKey);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(oldestKey);
      }
      this.evictions++;
    }
  }

  async delete(key) {
    if (this.useRedis && this.redis) {
      try {
        await this.redis.del(`cache:${key}`);
      } catch (err) {
        console.error('Redis cache delete error:', err.message);
      }
    }

    if (this.cache.has(key)) {
      this.cache.delete(key);
      const timer = this.timers.get(key);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    }
  }

  clear() {
    if (this.useRedis && this.redis) {
      const keys = [];
      for (const key of this.cache.keys()) {
        keys.push(`cache:${key}`);
      }
      if (keys.length > 0) {
        this.redis.del(...keys).catch(() => {});
      }
    }

    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.cache.clear();
    this.timers.clear();
  }

  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? `${((this.hits / total) * 100).toFixed(2) }%` : '0%';

    return {
      enabled: this.enabled,
      size: this.useRedis ? 'N/A (Redis)' : this.cache.size,
      maxSize: this.maxSize,
      ttlSeconds: this.ttlSeconds,
      hits: this.hits,
      misses: this.misses,
      hitRate,
      evictions: this.evictions,
      evictionsByTtl: this.evictionsByTtl
    };
  }

  getKeys() {
    if (this.useRedis && this.redis) {
      return [];
    }
    return Array.from(this.cache.keys());
  }

  async has(key) {
    if (this.useRedis && this.redis) {
      try {
        return await this.redis.exists(`cache:${key}`);
      } catch {
        return false;
      }
    }
    return this.cache.has(key);
  }

  getSize() {
    if (this.useRedis && this.redis) {
      return -1;
    }
    return this.cache.size;
  }

  isEnabled() {
    return this.enabled;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  setTtl(seconds) {
    this.ttlSeconds = seconds;
  }

  setMaxSize(size) {
    this.maxSize = size;
    while (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  destroy() {
    this.clear();
  }
}

export { ResponseCache };
