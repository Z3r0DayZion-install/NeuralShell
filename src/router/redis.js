import pkg from 'redis';
import { sanitizeForLogging } from './security-utils.js';
import { TIMEOUTS } from './constants.js';
const { createClient } = pkg;

class RedisBackend {
  constructor(options = {}) {
    this.url = options.url || process.env.REDIS_URL || 'redis://localhost:6379';
    this.password = options.password || process.env.REDIS_PASSWORD || '';
    this.database = options.database || 0;
    this.prefix = options.prefix || 'neuralshell:';
    this.client = null;
    this.connected = false;
    this.retryStrategy = options.retryStrategy || {
      maxRetries: 3,
      retryDelay: 1000
    };
  }

  async connect() {
    try {
      this.client = createClient({
        url: this.url,
        password: this.password || undefined,
        database: this.database,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > this.retryStrategy.maxRetries) {
              return new Error('Max retries reached');
            }
            return Math.min(retries * this.retryStrategy.retryDelay, 5000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis error:', err.message);
      });

      this.client.on('connect', () => {
        this.connected = true;
        console.log('Redis connected');
      });

      this.client.on('disconnect', () => {
        this.connected = false;
        console.log('Redis disconnected');
      });

      await this.client.connect();
      return this;
    } catch (err) {
      console.error('Failed to connect to Redis:', err.message);
      throw err;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        // Attempt graceful shutdown with timeout
        const disconnectPromise = this.client.quit();
        const timeoutPromise = new Promise((resolve) =>
          setTimeout(resolve, TIMEOUTS.SHUTDOWN_GRACE_PERIOD_MS)
        );

        await Promise.race([disconnectPromise, timeoutPromise]);
        this.connected = false;
      } catch (err) {
        console.error('Redis graceful disconnect failed:', sanitizeForLogging({ error: err.message }));

        // Force disconnect after timeout
        try {
          await this.client.disconnect();
        } catch (forceErr) {
          console.error('Redis force disconnect failed:', sanitizeForLogging({ error: forceErr.message }));
        } finally {
          this.connected = false;
        }
      }
    }
  }

  isConnected() {
    return this.connected && this.client?.isOpen;
  }

  key(...parts) {
    return this.prefix + parts.join(':');
  }

  async get(key) {
    if (!this.isConnected()) {
      return null;
    }
    try {
      const value = await this.client.get(this.key(key));
      return value;
    } catch (err) {
      console.error('Redis GET error:', err.message);
      return null;
    }
  }

  async set(key, value, ttlSeconds = null) {
    if (!this.isConnected()) {
      return false;
    }
    try {
      const fullKey = this.key(key);
      if (ttlSeconds) {
        await this.client.setEx(fullKey, ttlSeconds, value);
      } else {
        await this.client.set(fullKey, value);
      }
      return true;
    } catch (err) {
      console.error('Redis SET error:', err.message);
      return false;
    }
  }

  async del(...keys) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      const fullKeys = keys.map(k => this.key(k));
      return await this.client.del(fullKeys);
    } catch (err) {
      console.error('Redis DEL error:', err.message);
      return 0;
    }
  }

  async exists(key) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.exists(this.key(key));
    } catch (err) {
      console.error('Redis EXISTS error:', err.message);
      return 0;
    }
  }

  async incr(key) {
    if (!this.isConnected()) {
      return null;
    }
    try {
      return await this.client.incr(this.key(key));
    } catch (err) {
      console.error('Redis INCR error:', err.message);
      return null;
    }
  }

  async decr(key) {
    if (!this.isConnected()) {
      return null;
    }
    try {
      return await this.client.decr(this.key(key));
    } catch (err) {
      console.error('Redis DECR error:', err.message);
      return null;
    }
  }

  async expire(key, ttlSeconds) {
    if (!this.isConnected()) {
      return false;
    }
    try {
      return await this.client.expire(this.key(key), ttlSeconds);
    } catch (err) {
      console.error('Redis EXPIRE error:', err.message);
      return false;
    }
  }

  async ttl(key) {
    if (!this.isConnected()) {
      return -2;
    }
    try {
      return await this.client.ttl(this.key(key));
    } catch (err) {
      console.error('Redis TTL error:', err.message);
      return -2;
    }
  }

  async hget(key, field) {
    if (!this.isConnected()) {
      return null;
    }
    try {
      return await this.client.hGet(this.key(key), field);
    } catch (err) {
      console.error('Redis HGET error:', err.message);
      return null;
    }
  }

  async hset(key, field, value) {
    if (!this.isConnected()) {
      return false;
    }
    try {
      await this.client.hSet(this.key(key), field, value);
      return true;
    } catch (err) {
      console.error('Redis HSET error:', err.message);
      return false;
    }
  }

  async hgetall(key) {
    if (!this.isConnected()) {
      return {};
    }
    try {
      return await this.client.hGetAll(this.key(key));
    } catch (err) {
      console.error('Redis HGETALL error:', err.message);
      return {};
    }
  }

  async hdel(key, ...fields) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.hDel(this.key(key), ...fields);
    } catch (err) {
      console.error('Redis HDEL error:', err.message);
      return 0;
    }
  }

  async zadd(key, score, member) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.zAdd(this.key(key), { score, value: member });
    } catch (err) {
      console.error('Redis ZADD error:', err.message);
      return 0;
    }
  }

  async zrange(key, start, stop) {
    if (!this.isConnected()) {
      return [];
    }
    try {
      return await this.client.zRange(this.key(key), start, stop);
    } catch (err) {
      console.error('Redis ZRANGE error:', err.message);
      return [];
    }
  }

  async zrem(key, ...members) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.zRem(this.key(key), ...members);
    } catch (err) {
      console.error('Redis ZREM error:', err.message);
      return 0;
    }
  }

  async lpush(key, ...values) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.lPush(this.key(key), ...values);
    } catch (err) {
      console.error('Redis LPUSH error:', err.message);
      return 0;
    }
  }

  async lrange(key, start, stop) {
    if (!this.isConnected()) {
      return [];
    }
    try {
      return await this.client.lRange(this.key(key), start, stop);
    } catch (err) {
      console.error('Redis LRANGE error:', err.message);
      return [];
    }
  }

  async publish(channel, message) {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.publish(channel, message);
    } catch (err) {
      console.error('Redis PUBLISH error:', err.message);
      return 0;
    }
  }

  async subscribe(channels, callback) {
    if (!this.isConnected()) {
      return;
    }

    const subscriber = this.client.duplicate();

    // Add error handler for subscriber client
    subscriber.on('error', (err) => {
      console.error('Redis subscriber error:', sanitizeForLogging({ error: err.message, channels }));
    });

    try {
      await subscriber.connect();

      for (const channel of channels) {
        await subscriber.subscribe(channel, (message) => {
          // Wrap callback in try-catch to handle errors
          try {
            callback(channel, message);
          } catch (err) {
            console.error('Redis subscription callback error:', sanitizeForLogging({
              error: err.message,
              channel
            }));
          }
        });
      }

      return () => subscriber.unsubscribe(channels);
    } catch (err) {
      console.error('Redis subscribe error:', sanitizeForLogging({ error: err.message, channels }));
      throw err;
    }
  }

  async pipeline(commands) {
    if (!this.isConnected()) {
      return [];
    }
    try {
      const pipeline = this.client.multi();
      for (const [cmd, ...args] of commands) {
        pipeline[cmd.toLowerCase()](...args);
      }
      return await pipeline.exec();
    } catch (err) {
      console.error('Redis PIPELINE error:', err.message);
      return [];
    }
  }

  async scan(cursor, pattern = '*', count = 100) {
    if (!this.isConnected()) {
      return { cursor: 0, keys: [] };
    }
    try {
      return await this.client.scan(cursor, {
        MATCH: this.key(pattern),
        COUNT: count
      });
    } catch (err) {
      console.error('Redis SCAN error:', err.message);
      return { cursor: 0, keys: [] };
    }
  }

  async keys(pattern = '*') {
    const allKeys = [];
    let cursor = '0';

    do {
      const result = await this.scan(cursor, pattern);
      cursor = result.cursor;
      allKeys.push(...result.keys);
    } while (cursor !== '0');

    return allKeys.map(k => k.replace(this.prefix, ''));
  }

  async flushdb() {
    if (!this.isConnected()) {
      return false;
    }
    try {
      await this.client.flushDb();
      return true;
    } catch (err) {
      console.error('Redis FLUSHDB error:', err.message);
      return false;
    }
  }

  async info(section = 'all') {
    if (!this.isConnected()) {
      return null;
    }
    try {
      return await this.client.info(section);
    } catch (err) {
      console.error('Redis INFO error:', err.message);
      return null;
    }
  }

  async dbsize() {
    if (!this.isConnected()) {
      return 0;
    }
    try {
      return await this.client.dbSize();
    } catch (err) {
      console.error('Redis DBSIZE error:', err.message);
      return 0;
    }
  }

  getClient() {
    return this.client;
  }
}

class RedisRateLimiter {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 100;
    this.keyPrefix = options.keyPrefix || 'ratelimit:';
    this.blockDuration = options.blockDuration || 60;
  }

  async isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const redisKey = `${this.keyPrefix}${key}`;

    const current = await this.redis.get(redisKey);

    if (current && parseInt(current) >= this.maxRequests) {
      const ttl = await this.redis.ttl(redisKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + (ttl > 0 ? ttl * 1000 : this.windowMs),
        retryAfter: ttl > 0 ? ttl : this.blockDuration
      };
    }

    const multi = this.redis.client.multi();
    multi.zAdd(redisKey, { score: now, value: `${now}` });
    multi.zRemRangeByScore(redisKey, '-inf', windowStart.toString());
    multi.incr(redisKey);
    multi.expire(redisKey, Math.ceil(this.windowMs / 1000));

    const results = await this.redis.pipeline([
      ['zadd', redisKey, now, `${now}`],
      ['zremrangebyscore', redisKey, '-inf', windowStart],
      ['incr', redisKey],
      ['expire', redisKey, Math.ceil(this.windowMs / 1000)]
    ]);

    const count = parseInt(results[2]);

    return {
      allowed: true,
      remaining: Math.max(0, this.maxRequests - count),
      resetAt: now + this.windowMs,
      retryAfter: 0
    };
  }

  async getStats(key) {
    const redisKey = `${this.keyPrefix}${key}`;
    const current = await this.redis.get(redisKey);
    const ttl = await this.redis.ttl(redisKey);

    return {
      current: parseInt(current) || 0,
      max: this.maxRequests,
      remaining: Math.max(0, this.maxRequests - (parseInt(current) || 0)),
      resetAt: ttl > 0 ? Date.now() + ttl * 1000 : null
    };
  }

  async reset(key) {
    return await this.redis.del(`${this.keyPrefix}${key}`);
  }
}

class RedisCache {
  constructor(redis, options = {}) {
    this.redis = redis;
    this.prefix = options.prefix || 'cache:';
    this.defaultTtl = options.defaultTtl || 300;
  }

  async get(key) {
    const value = await this.redis.get(`${this.prefix}${key}`);
    if (value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return null;
  }

  async set(key, value, ttl = this.defaultTtl) {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    return await this.redis.set(`${this.prefix}${key}`, serialized, ttl);
  }

  async del(key) {
    return await this.redis.del(`${this.prefix}${key}`);
  }

  async exists(key) {
    return await this.redis.exists(`${this.prefix}${key}`);
  }

  async clear() {
    const keys = await this.redis.keys(`${this.prefix}*`);
    if (keys.length > 0) {
      return await this.redis.del(...keys);
    }
    return 0;
  }
}

export { RedisBackend, RedisRateLimiter, RedisCache };
