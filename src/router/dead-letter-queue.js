import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

// Dead letter queue for failed requests
export class DeadLetterQueue {
  constructor(config = {}) {
    this.queueFile = config.queueFile || 'state/dead-letter-queue.jsonl';
    this.maxQueueSize = config.maxQueueSize || 10000;
    this.queue = [];
    this.stats = {
      totalEnqueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      currentSize: 0
    };

    // Ensure directory exists (sync in constructor is acceptable)
    const dir = path.dirname(this.queueFile);
    if (!fsSync.existsSync(dir)) {
      fsSync.mkdirSync(dir, { recursive: true });
    }

    // Load existing queue
    this.loadQueue();
  }

  async enqueue(requestId, payload, failures, metadata = {}) {
    const entry = {
      id: requestId,
      timestamp: new Date().toISOString(),
      payload,
      failures,
      metadata,
      retryCount: 0,
      lastRetryAt: null,
      nextRetryAt: Date.now() + 60000 // Retry in 1 minute
    };

    if (this.queue.length < this.maxQueueSize) {
      this.queue.push(entry);
      this.stats.totalEnqueued += 1;
      this.stats.currentSize += 1;
      await this.persistEntry(entry);
      return true;
    }

    console.warn(`Dead letter queue full (${this.maxQueueSize}), dropping entry`);
    this.stats.totalFailed += 1;
    return false;
  }

  dequeue() {
    if (this.queue.length === 0) {
      return null;
    }
    const entry = this.queue.shift();
    this.stats.currentSize = this.queue.length;
    return entry;
  }

  peek(count = 10) {
    return this.queue.slice(0, count);
  }

  recordRetry(requestId) {
    const entry = this.queue.find((e) => e.id === requestId);
    if (entry) {
      entry.retryCount += 1;
      entry.lastRetryAt = Date.now();
      entry.nextRetryAt = Date.now() + Math.pow(2, entry.retryCount) * 60000; // Exponential backoff
    }
  }

  recordSuccess(requestId) {
    const idx = this.queue.findIndex((e) => e.id === requestId);
    if (idx >= 0) {
      this.queue.splice(idx, 1);
      this.stats.totalProcessed += 1;
      this.stats.currentSize = this.queue.length;
    }
  }

  getRetryable(now = Date.now()) {
    return this.queue.filter((entry) => entry.nextRetryAt <= now && entry.retryCount < 5);
  }

  purgeOldEntries(olderThanDays = 7) {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const before = this.queue.length;

    this.queue = this.queue.filter((entry) => {
      const timestamp = new Date(entry.timestamp).getTime();
      return timestamp > cutoff;
    });

    const purged = before - this.queue.length;
    this.stats.currentSize = this.queue.length;
    return purged;
  }

  async persistEntry(entry) {
    try {
      const line = `${JSON.stringify(entry) }\n`;
      await fs.appendFile(this.queueFile, line, 'utf8');
    } catch (err) {
      console.error(`Failed to persist DLQ entry: ${err.message}`);
    }
  }

  loadQueue() {
    try {
      if (!fsSync.existsSync(this.queueFile)) {
        return;
      }

      const content = fsSync.readFileSync(this.queueFile, 'utf8');
      const lines = content.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.id && entry.payload) {
            this.queue.push(entry);
          }
        } catch {
          // Skip invalid entries
        }
      }

      this.stats.currentSize = this.queue.length;
      console.log(`Loaded ${this.queue.length} entries from dead letter queue`);
    } catch (err) {
      console.error(`Failed to load DLQ: ${err.message}`);
    }
  }

  clear() {
    this.queue = [];
    this.stats.currentSize = 0;
    try {
      fsSync.unlinkSync(this.queueFile);
    } catch {
      // File may not exist
    }
  }

  getStats() {
    return { ...this.stats };
  }
}
