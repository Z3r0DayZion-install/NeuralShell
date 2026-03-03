/**
 * Auto-Optimizer
 * Automatically optimizes system performance based on metrics
 */

import { EventEmitter } from 'events';

export class AutoOptimizer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.optimizationInterval = options.optimizationInterval || 300000; // 5 minutes
    this.learningRate = options.learningRate || 0.1;
    
    this.optimizations = new Map();
    this.performanceHistory = [];
    this.maxHistorySize = options.maxHistorySize || 1000;
    
    this.metrics = {
      totalOptimizations: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      performanceGain: 0
    };

    this.optimizationInterval = null;
    this.initializeOptimizations();
  }

  /**
   * Initialize optimization strategies
   */
  initializeOptimizations() {
    // Cache TTL optimization
    this.registerOptimization('cache_ttl', {
      metric: 'cache_hit_rate',
      target: 0.8,
      adjust: (current, target) => {
        if (current < target) {
          return { action: 'increase_ttl', value: 1.2 };
        } else if (current > 0.95) {
          return { action: 'decrease_ttl', value: 0.9 };
        }
        return null;
      }
    });

    // Timeout optimization
    this.registerOptimization('request_timeout', {
      metric: 'avg_latency',
      target: 1000,
      adjust: (current, target) => {
        if (current > target * 1.5) {
          return { action: 'increase_timeout', value: 1.2 };
        } else if (current < target * 0.5) {
          return { action: 'decrease_timeout', value: 0.9 };
        }
        return null;
      }
    });

    // Connection pool optimization
    this.registerOptimization('connection_pool', {
      metric: 'connection_wait_time',
      target: 10,
      adjust: (current, target) => {
        if (current > target) {
          return { action: 'increase_pool', value: 1.5 };
        } else if (current < target * 0.2) {
          return { action: 'decrease_pool', value: 0.8 };
        }
        return null;
      }
    });

    // Rate limit optimization
    this.registerOptimization('rate_limit', {
      metric: 'rate_limit_hits',
      target: 0.05, // 5% rate limit hit rate
      adjust: (current, target) => {
        if (current > target) {
          return { action: 'increase_limit', value: 1.2 };
        } else if (current < target * 0.2) {
          return { action: 'decrease_limit', value: 0.9 };
        }
        return null;
      }
    });
  }

  /**
   * Register an optimization strategy
   */
  registerOptimization(name, strategy) {
    this.optimizations.set(name, {
      name,
      ...strategy,
      lastOptimized: null,
      optimizationCount: 0,
      successCount: 0
    });
  }

  /**
   * Start auto-optimization
   */
  start(metricsProvider) {
    if (!this.enabled || this.optimizationInterval) {
      return;
    }

    this.optimizationInterval = setInterval(async () => {
      try {
        const metrics = await metricsProvider();
        await this.optimize(metrics);
      } catch (error) {
        console.error('[AutoOptimizer] Optimization error:', error);
      }
    }, this.optimizationInterval);

    console.log('[AutoOptimizer] Started');
  }

  /**
   * Stop auto-optimization
   */
  stop() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
      console.log('[AutoOptimizer] Stopped');
    }
  }

  /**
   * Run optimization cycle
   */
  async optimize(metrics) {
    const results = [];

    for (const [name, optimization] of this.optimizations) {
      try {
        const result = await this.runOptimization(name, optimization, metrics);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.error(`[AutoOptimizer] Failed to optimize ${name}:`, error);
      }
    }

    if (results.length > 0) {
      this.recordPerformance(metrics);
      this.emit('optimizations_applied', { results, timestamp: Date.now() });
    }

    return results;
  }

  /**
   * Run a single optimization
   */
  async runOptimization(name, optimization, metrics) {
    const currentValue = metrics[optimization.metric];
    
    if (currentValue === undefined) {
      return null;
    }

    // Check if adjustment is needed
    const adjustment = optimization.adjust(currentValue, optimization.target);
    
    if (!adjustment) {
      return null;
    }

    this.metrics.totalOptimizations++;
    optimization.optimizationCount++;

    console.log(`[AutoOptimizer] Applying ${name}: ${adjustment.action}`);

    try {
      // Emit optimization event for application to handle
      this.emit('optimize', {
        name,
        action: adjustment.action,
        value: adjustment.value,
        current: currentValue,
        target: optimization.target
      });

      optimization.lastOptimized = Date.now();
      optimization.successCount++;
      this.metrics.successfulOptimizations++;

      return {
        name,
        action: adjustment.action,
        value: adjustment.value,
        success: true
      };

    } catch (error) {
      this.metrics.failedOptimizations++;
      return {
        name,
        action: adjustment.action,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record performance metrics
   */
  recordPerformance(metrics) {
    this.performanceHistory.push({
      timestamp: Date.now(),
      metrics: { ...metrics }
    });

    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }

    // Calculate performance gain
    if (this.performanceHistory.length >= 2) {
      const current = this.performanceHistory[this.performanceHistory.length - 1];
      const previous = this.performanceHistory[this.performanceHistory.length - 2];
      
      const gain = this.calculatePerformanceGain(previous.metrics, current.metrics);
      this.metrics.performanceGain += gain;
    }
  }

  /**
   * Calculate performance gain
   */
  calculatePerformanceGain(previous, current) {
    let gain = 0;

    // Latency improvement
    if (previous.avg_latency && current.avg_latency) {
      const latencyGain = (previous.avg_latency - current.avg_latency) / previous.avg_latency;
      gain += latencyGain * 0.4;
    }

    // Cache hit rate improvement
    if (previous.cache_hit_rate && current.cache_hit_rate) {
      const cacheGain = current.cache_hit_rate - previous.cache_hit_rate;
      gain += cacheGain * 0.3;
    }

    // Error rate reduction
    if (previous.error_rate && current.error_rate) {
      const errorGain = (previous.error_rate - current.error_rate) / previous.error_rate;
      gain += errorGain * 0.3;
    }

    return gain;
  }

  /**
   * Optimize cache settings
   */
  optimizeCacheTTL(hitRate, currentTTL) {
    if (hitRate < 0.7) {
      // Low hit rate, increase TTL
      return Math.min(currentTTL * 1.5, 3600);
    } else if (hitRate > 0.95) {
      // Very high hit rate, can reduce TTL
      return Math.max(currentTTL * 0.8, 60);
    }
    return currentTTL;
  }

  /**
   * Optimize timeout settings
   */
  optimizeTimeout(avgLatency, p95Latency, currentTimeout) {
    // Set timeout to p95 + buffer
    const optimalTimeout = p95Latency * 1.5;
    
    // Gradually adjust
    const adjustment = (optimalTimeout - currentTimeout) * this.learningRate;
    return Math.max(1000, Math.min(currentTimeout + adjustment, 30000));
  }

  /**
   * Optimize connection pool size
   */
  optimizePoolSize(waitTime, utilization, currentSize) {
    if (waitTime > 50 || utilization > 0.9) {
      // High wait time or utilization, increase pool
      return Math.min(currentSize + 2, 100);
    } else if (waitTime < 5 && utilization < 0.3) {
      // Low utilization, decrease pool
      return Math.max(currentSize - 1, 5);
    }
    return currentSize;
  }

  /**
   * Optimize rate limits
   */
  optimizeRateLimit(hitRate, errorRate, currentLimit) {
    if (hitRate > 0.1) {
      // Too many rate limit hits, increase limit
      return Math.min(currentLimit * 1.2, 10000);
    } else if (errorRate > 0.05 && hitRate < 0.01) {
      // High error rate but low rate limiting, might need to decrease
      return Math.max(currentLimit * 0.9, 10);
    }
    return currentLimit;
  }

  /**
   * Get optimization recommendations
   */
  getRecommendations(metrics) {
    const recommendations = [];

    // Cache recommendations
    if (metrics.cache_hit_rate < 0.5) {
      recommendations.push({
        type: 'cache',
        priority: 'high',
        recommendation: 'Increase cache TTL or size',
        reason: `Low cache hit rate: ${(metrics.cache_hit_rate * 100).toFixed(2)}%`,
        expectedGain: '20-30% latency reduction'
      });
    }

    // Timeout recommendations
    if (metrics.timeout_rate > 0.05) {
      recommendations.push({
        type: 'timeout',
        priority: 'high',
        recommendation: 'Increase request timeout',
        reason: `High timeout rate: ${(metrics.timeout_rate * 100).toFixed(2)}%`,
        expectedGain: '10-15% success rate improvement'
      });
    }

    // Connection pool recommendations
    if (metrics.connection_wait_time > 100) {
      recommendations.push({
        type: 'connection_pool',
        priority: 'medium',
        recommendation: 'Increase connection pool size',
        reason: `High connection wait time: ${metrics.connection_wait_time}ms`,
        expectedGain: '15-20% latency reduction'
      });
    }

    // Rate limit recommendations
    if (metrics.rate_limit_hits / metrics.total_requests > 0.1) {
      recommendations.push({
        type: 'rate_limit',
        priority: 'medium',
        recommendation: 'Adjust rate limits',
        reason: 'High rate limit hit rate',
        expectedGain: 'Better user experience'
      });
    }

    return recommendations;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const successRate = this.metrics.totalOptimizations > 0
      ? (this.metrics.successfulOptimizations / this.metrics.totalOptimizations) * 100
      : 0;

    const optimizationStats = {};
    for (const [name, opt] of this.optimizations) {
      optimizationStats[name] = {
        count: opt.optimizationCount,
        successCount: opt.successCount,
        lastOptimized: opt.lastOptimized ? new Date(opt.lastOptimized).toISOString() : null
      };
    }

    return {
      enabled: this.enabled,
      metrics: {
        ...this.metrics,
        successRate: successRate.toFixed(2) + '%',
        performanceGain: (this.metrics.performanceGain * 100).toFixed(2) + '%'
      },
      optimizations: optimizationStats,
      historySize: this.performanceHistory.length
    };
  }

  /**
   * Get performance trends
   */
  getPerformanceTrends() {
    if (this.performanceHistory.length < 2) {
      return { trend: 'insufficient_data' };
    }

    const recent = this.performanceHistory.slice(-20);
    const latencies = recent.map(h => h.metrics.avg_latency || 0);
    const errorRates = recent.map(h => h.metrics.error_rate || 0);

    return {
      latency: {
        current: latencies[latencies.length - 1],
        avg: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
        trend: this.calculateTrend(latencies)
      },
      errorRate: {
        current: errorRates[errorRates.length - 1],
        avg: errorRates.reduce((sum, e) => sum + e, 0) / errorRates.length,
        trend: this.calculateTrend(errorRates)
      }
    };
  }

  /**
   * Calculate trend direction
   */
  calculateTrend(values) {
    if (values.length < 2) {
      return 'stable';
    }

    const first = values.slice(0, Math.floor(values.length / 2));
    const second = values.slice(Math.floor(values.length / 2));

    const firstAvg = first.reduce((sum, v) => sum + v, 0) / first.length;
    const secondAvg = second.reduce((sum, v) => sum + v, 0) / second.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  /**
   * Reset optimization history
   */
  reset() {
    this.performanceHistory = [];
    this.metrics = {
      totalOptimizations: 0,
      successfulOptimizations: 0,
      failedOptimizations: 0,
      performanceGain: 0
    };

    for (const optimization of this.optimizations.values()) {
      optimization.optimizationCount = 0;
      optimization.successCount = 0;
      optimization.lastOptimized = null;
    }
  }
}

export default AutoOptimizer;
