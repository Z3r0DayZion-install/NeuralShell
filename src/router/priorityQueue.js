const PRIORITIES = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  BATCH: 4
};

const PRIORITY_LABELS = {
  [PRIORITIES.CRITICAL]: 'critical',
  [PRIORITIES.HIGH]: 'high',
  [PRIORITIES.NORMAL]: 'normal',
  [PRIORITIES.LOW]: 'low',
  [PRIORITIES.BATCH]: 'batch'
};

class PriorityQueue {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.maxSizeByPriority = options.maxSizeByPriority || {
      [PRIORITIES.CRITICAL]: 100,
      [PRIORITIES.HIGH]: 200,
      [PRIORITIES.NORMAL]: 400,
      [PRIORITIES.LOW]: 200,
      [PRIORITIES.BATCH]: 100
    };
    this.queues = {
      [PRIORITIES.CRITICAL]: [],
      [PRIORITIES.HIGH]: [],
      [PRIORITIES.NORMAL]: [],
      [PRIORITIES.LOW]: [],
      [PRIORITIES.BATCH]: []
    };
    this.metrics = {
      enqueued: 0,
      dequeued: 0,
      rejected: 0,
      rejectedByPriority: {},
      processedByPriority: {},
      waitTimesMs: {}
    };

    for (const p of Object.values(PRIORITIES)) {
      this.metrics.rejectedByPriority[p] = 0;
      this.metrics.processedByPriority[p] = 0;
      this.metrics.waitTimesMs[p] = { sum: 0, count: 0, min: Infinity, max: 0 };
    }
  }

  getPriorityFromString(str) {
    const normalized = String(str).toLowerCase();
    return PRIORITIES[normalized.toUpperCase()] ?? PRIORITIES.NORMAL;
  }

  isFull(priority = null) {
    if (priority !== null) {
      return this.queues[priority].length >= (this.maxSizeByPriority[priority] || this.maxSize);
    }
    return this.size() >= this.maxSize;
  }

  size(priority = null) {
    if (priority !== null) {
      return this.queues[priority]?.length || 0;
    }
    return Object.values(this.queues).reduce((sum, q) => sum + q.length, 0);
  }

  enqueue(item, priority = PRIORITIES.NORMAL) {
    if (!this.queues[priority]) {
      priority = PRIORITIES.NORMAL;
    }

    if (this.queues[priority].length >= (this.maxSizeByPriority[priority] || this.maxSize)) {
      this.metrics.rejected++;
      this.metrics.rejectedByPriority[priority]++;
      return false;
    }

    const entry = {
      ...item,
      priority,
      enqueuedAt: Date.now(),
      id: item.id || crypto.randomUUID()
    };

    this.queues[priority].push(entry);
    this.metrics.enqueued++;

    return true;
  }

  dequeue() {
    for (const priority of Object.values(PRIORITIES)) {
      const queue = this.queues[priority];
      if (queue.length > 0) {
        const entry = queue.shift();
        const waitTime = Date.now() - entry.enqueuedAt;

        this.metrics.dequeued++;
        this.metrics.processedByPriority[priority]++;
        this.metrics.waitTimesMs[priority].sum += waitTime;
        this.metrics.waitTimesMs[priority].count++;
        this.metrics.waitTimesMs[priority].min = Math.min(
          this.metrics.waitTimesMs[priority].min,
          waitTime
        );
        this.metrics.waitTimesMs[priority].max = Math.max(
          this.metrics.waitTimesMs[priority].max,
          waitTime
        );

        return entry;
      }
    }
    return null;
  }

  peek(priority = null) {
    if (priority !== null) {
      return this.queues[priority]?.[0] || null;
    }

    for (const p of Object.values(PRIORITIES)) {
      if (this.queues[p].length > 0) {
        return this.queues[p][0];
      }
    }
    return null;
  }

  clear(priority = null) {
    if (priority !== null) {
      this.queues[priority] = [];
    } else {
      for (const q of Object.values(this.queues)) {
        q.length = 0;
      }
    }
  }

  getStats() {
    const stats = {
      total: this.size(),
      maxSize: this.maxSize,
      byPriority: {}
    };

    for (const [priority, label] of Object.entries(PRIORITY_LABELS)) {
      const p = Number(priority);
      const queue = this.queues[p];
      const waitMetrics = this.metrics.waitTimesMs[p];
      const avgWait = waitMetrics.count > 0
        ? Math.round(waitMetrics.sum / waitMetrics.count)
        : 0;

      stats.byPriority[label] = {
        size: queue.length,
        maxSize: this.maxSizeByPriority[p],
        processed: this.metrics.processedByPriority[p],
        rejected: this.metrics.rejectedByPriority[p],
        waitTimeMs: {
          avg: avgWait,
          min: waitMetrics.min === Infinity ? 0 : waitMetrics.min,
          max: waitMetrics.max
        }
      };
    }

    return {
      ...stats,
      totalEnqueued: this.metrics.enqueued,
      totalDequeued: this.metrics.dequeued,
      totalRejected: this.metrics.rejected
    };
  }

  getContents(limit = 10, priority = null) {
    const contents = [];

    if (priority !== null) {
      return this.queues[priority].slice(0, limit).map(e => ({
        id: e.id,
        priority: PRIORITY_LABELS[e.priority],
        waitTimeMs: Date.now() - e.enqueuedAt,
        data: e
      }));
    }

    for (const p of Object.values(PRIORITIES)) {
      for (const entry of this.queues[p].slice(0, limit - contents.length)) {
        contents.push({
          id: entry.id,
          priority: PRIORITY_LABELS[entry.priority],
          waitTimeMs: Date.now() - entry.enqueuedAt,
          data: entry
        });
        if (contents.length >= limit) {
          break;
        }
      }
      if (contents.length >= limit) {
        break;
      }
    }

    return contents;
  }
}

class WeightedFairQueue extends PriorityQueue {
  constructor(options = {}) {
    super(options);
    this.weights = options.weights || {
      [PRIORITIES.CRITICAL]: 10,
      [PRIORITIES.HIGH]: 5,
      [PRIORITIES.NORMAL]: 3,
      [PRIORITIES.LOW]: 1,
      [PRIORITIES.BATCH]: 0.5
    };
    this.counters = {};
    for (const p of Object.values(PRIORITIES)) {
      this.counters[p] = 0;
    }
  }

  dequeue() {
    let minScore = Infinity;
    let selectedPriority = null;

    for (const priority of Object.values(PRIORITIES)) {
      if (this.queues[priority].length === 0) {
        continue;
      }

      const weight = this.weights[priority] || 1;
      const score = this.counters[priority] / weight;

      if (score < minScore) {
        minScore = score;
        selectedPriority = priority;
      }
    }

    if (selectedPriority === null) {
      return null;
    }

    const entry = this.queues[selectedPriority].shift();
    this.counters[selectedPriority]++;

    const waitTime = Date.now() - entry.enqueuedAt;
    this.metrics.dequeued++;
    this.metrics.processedByPriority[selectedPriority]++;
    this.metrics.waitTimesMs[selectedPriority].sum += waitTime;
    this.metrics.waitTimesMs[selectedPriority].count++;

    return entry;
  }
}

export { PriorityQueue, WeightedFairQueue, PRIORITIES, PRIORITY_LABELS };
