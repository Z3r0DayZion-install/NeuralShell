import Redis from 'ioredis';
import { EventEmitter } from 'events';
import crypto from 'crypto';

/**
 * Swarm Message Bus
 * 
 * A robust communication layer for the Multi-Agent Swarm.
 * Uses Redis Pub/Sub for broadcasting events and Lists for task queues.
 */
export class MessageBus extends EventEmitter {
  constructor(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
    super();
    this.redisUrl = redisUrl;
    this.publisher = null;
    this.subscriber = null;
    this.commander = null; // For queue operations
    this.serviceName = `service-${Math.random().toString(16).slice(2, 8)}`;
  }

  async connect(serviceName) {
    if (serviceName) this.serviceName = serviceName;
    
    this.publisher = new Redis(this.redisUrl);
    this.subscriber = new Redis(this.redisUrl);
    this.commander = new Redis(this.redisUrl);

    this.subscriber.on('message', (channel, message) => {
      try {
        const payload = JSON.parse(message);
        this.emit(channel, payload);
        this.emit('*', { channel, payload }); // Wildcard listener
      } catch (err) {
        console.error('[MessageBus] Failed to parse message:', err);
      }
    });

    console.log(`[MessageBus] Connected as ${this.serviceName}`);
  }

  async disconnect() {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
      this.commander.quit()
    ]);
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
    return this.publisher.publish(channel, payload);
  }

  /**
   * Subscribe to a specific channel
   */
  async subscribe(channel) {
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
    return this.commander.lpush(`queue:${queueName}`, payload);
  }

  /**
   * Blocking pop for agents to get tasks
   */
  async waitForTask(queueName, timeout = 0) {
    // brpop returns [key, element] or null
    const result = await this.commander.brpop(`queue:${queueName}`, timeout);
    if (!result) return null;
    return JSON.parse(result[1]);
  }
}
