import Redis from 'ioredis';
import { EventEmitter } from 'events';
import crypto from 'crypto';

const DEFAULT_REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_MODE = process.env.MESSAGE_BUS_MODE || 'auto'; // auto | redis | memory

const memoryBackend = (() => {
  const instances = new Set();
  const queues = new Map(); // queueName -> array of JSON payload strings
  const waiters = new Map(); // queueName -> array of { resolve, timer }

  function deliver(channel, payloadString) {
    for (const bus of instances) {
      if (!bus._subscriptions.has(channel)) {
        continue;
      }
      bus._deliver(channel, payloadString);
    }
  }

  function getQueue(name) {
    let q = queues.get(name);
    if (!q) {
      q = [];
      queues.set(name, q);
    }
    return q;
  }

  function getWaiters(name) {
    let w = waiters.get(name);
    if (!w) {
      w = [];
      waiters.set(name, w);
    }
    return w;
  }

  function push(queueName, payloadString) {
    const q = getQueue(queueName);
    q.unshift(payloadString);
    const w = getWaiters(queueName);
    const waiter = w.shift();
    if (waiter) {
      if (waiter.timer) {
        clearTimeout(waiter.timer);
      }
      const value = q.pop();
      waiter.resolve(value || null);
    }
  }

  function pop(queueName, timeoutSeconds) {
    const q = getQueue(queueName);
    if (q.length > 0) {
      return Promise.resolve(q.pop());
    }

    return new Promise((resolve) => {
      const w = getWaiters(queueName);
      const waiter = { resolve, timer: null };
      if (timeoutSeconds > 0) {
        waiter.timer = setTimeout(() => {
          const idx = w.indexOf(waiter);
          if (idx >= 0) {
            w.splice(idx, 1);
          }
          resolve(null);
        }, timeoutSeconds * 1000);
      }
      w.push(waiter);
    });
  }

  return {
    attach(bus) {
      instances.add(bus);
    },
    detach(bus) {
      instances.delete(bus);
    },
    publish: deliver,
    push,
    pop
  };
})();

/**
 * Swarm Message Bus
 *
 * A robust communication layer for the Multi-Agent Swarm.
 * Uses Redis Pub/Sub for broadcasting events and Lists for task queues.
 */
export class MessageBus extends EventEmitter {
  constructor(redisUrl = DEFAULT_REDIS_URL) {
    super();
    this.redisUrl = redisUrl;
    this.publisher = null;
    this.subscriber = null;
    this.commander = null; // For queue operations
    this.serviceName = `service-${Math.random().toString(16).slice(2, 8)}`;
    this.mode = DEFAULT_MODE;
    this._subscriptions = new Set();
    this._lastRedisErrorLogAtMs = 0;
  }

  async connect(serviceName) {
    if (serviceName) {
      this.serviceName = serviceName;
    }

    if (this.mode === 'memory') {
      memoryBackend.attach(this);
      console.log(`[MessageBus] Using in-memory bus as ${this.serviceName}`);
      return;
    }

    const isTestLike = process.env.NODE_ENV === 'test' || process.env.PROOF_MODE === '1' || process.env.DRY_RUN === '1';
    const redisOptions = {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: isTestLike ? 1 : 20,
      connectTimeout: isTestLike ? 750 : 5000,
      retryStrategy: (times) => {
        if (!isTestLike) {
          return Math.min(times * 200, 2000);
        }
        return times > 2 ? null : Math.min(times * 150, 500);
      }
    };

    this.publisher = new Redis(this.redisUrl, redisOptions);
    this.subscriber = new Redis(this.redisUrl, redisOptions);
    this.commander = new Redis(this.redisUrl, redisOptions);

    const onRedisError = (err) => {
      const now = Date.now();
      if (now - this._lastRedisErrorLogAtMs > 5000) {
        this._lastRedisErrorLogAtMs = now;
        console.warn('[MessageBus] Redis error (will degrade if needed):', err?.message || String(err));
      }
    };

    this.publisher.on('error', onRedisError);
    this.subscriber.on('error', onRedisError);
    this.commander.on('error', onRedisError);

    this.subscriber.on('message', (channel, message) => {
      try {
        const payload = JSON.parse(message);
        this.emit(channel, payload);
        this.emit('*', { channel, payload }); // Wildcard listener
      } catch (err) {
        console.error('[MessageBus] Failed to parse message:', err);
      }
    });

    try {
      await Promise.all([this.publisher.connect(), this.subscriber.connect(), this.commander.connect()]);
      console.log(`[MessageBus] Connected (Redis) as ${this.serviceName}`);
    } catch (err) {
      const mode = this.mode;
      await this.disconnect().catch(() => {});
      if (mode === 'redis') {
        throw err;
      }
      this.mode = 'memory';
      memoryBackend.attach(this);
      console.warn(
        `[MessageBus] Redis unavailable; falling back to in-memory bus for ${this.serviceName}:`,
        err?.message || String(err)
      );
    }
  }

  async disconnect() {
    if (this.mode === 'memory') {
      memoryBackend.detach(this);
      this._subscriptions.clear();
      return;
    }

    const clients = [this.publisher, this.subscriber, this.commander].filter(Boolean);
    await Promise.all(
      clients.map((c) =>
        c
          .quit()
          .catch(() => c.disconnect().catch(() => {}))
      )
    );
    this.publisher = null;
    this.subscriber = null;
    this.commander = null;
    this._subscriptions.clear();
  }

  /**
   * Broadcast an event to all agents
   */
  async publish(channel, event) {
    const payload = JSON.stringify({
      id: crypto.randomUUID(),
      source: this.serviceName,
      timestamp: Date.now(),
      ...event
    });
    if (this.mode === 'memory') {
      memoryBackend.publish(channel, payload);
      return 1;
    }
    return this.publisher.publish(channel, payload);
  }

  /**
   * Subscribe to a specific channel
   */
  async subscribe(channel) {
    this._subscriptions.add(channel);
    if (this.mode === 'memory') {
      return 1;
    }
    return this.subscriber.subscribe(channel);
  }

  /**
   * Push a task to a specific agent queue
   */
  async pushTask(queueName, task) {
    const payload = JSON.stringify({
      id: task.id || crypto.randomUUID(),
      type: task.type,
      data: task.data,
      source: this.serviceName,
      createdAt: Date.now()
    });
    if (this.mode === 'memory') {
      memoryBackend.push(`queue:${queueName}`, payload);
      return 1;
    }
    return this.commander.lpush(`queue:${queueName}`, payload);
  }

  /**
   * Blocking pop for agents to get tasks
   */
  async waitForTask(queueName, timeout = 0) {
    // brpop returns [key, element] or null
    if (this.mode === 'memory') {
      const payloadString = await memoryBackend.pop(`queue:${queueName}`, timeout);
      if (!payloadString) {
        return null;
      }
      return JSON.parse(payloadString);
    }

    const result = await this.commander.brpop(`queue:${queueName}`, timeout);
    if (!result) {
      return null;
    }
    return JSON.parse(result[1]);
  }

  _deliver(channel, payloadString) {
    try {
      const payload = JSON.parse(payloadString);
      this.emit(channel, payload);
      this.emit('*', { channel, payload });
    } catch (err) {
      console.error('[MessageBus] Failed to parse in-memory message:', err);
    }
  }
}
