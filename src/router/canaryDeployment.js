/**
 * Canary Deployment System
 * Automatic canary testing and rollback on failures
 */

import { EventEmitter } from 'events';

export class CanaryDeployment extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.canaryPercent = options.canaryPercent || 10;
    this.successThreshold = options.successThreshold || 0.99;
    this.errorThreshold = options.errorThreshold || 0.05;
    this.latencyThreshold = options.latencyThreshold || 2000;
    this.minRequests = options.minRequests || 100;
    this.evaluationPeriodMs = options.evaluationPeriodMs || 300000; // 5 minutes

    this.canaryVersion = null;
    this.stableVersion = null;
    this.canaryMetrics = this.createMetrics();
    this.stableMetrics = this.createMetrics();
    this.evaluationTimer = null;

    this.deploymentHistory = [];
    this.maxHistorySize = options.maxHistorySize || 100;

    this.metrics = {
      totalDeployments: 0,
      successfulDeployments: 0,
      rolledBackDeployments: 0,
      autoRollbacks: 0
    };
  }

  /**
   * Create metrics structure
   */
  createMetrics() {
    return {
      requests: 0,
      successes: 0,
      errors: 0,
      latencies: [],
      startTime: Date.now()
    };
  }

  /**
   * Start canary deployment
   */
  startCanary(canaryVersion, stableVersion) {
    if (!this.enabled) {
      return { success: false, reason: 'canary_disabled' };
    }

    if (this.canaryVersion) {
      return { success: false, reason: 'canary_already_running' };
    }

    console.log(`[Canary] Starting canary deployment: ${canaryVersion}`);

    this.canaryVersion = canaryVersion;
    this.stableVersion = stableVersion;
    this.canaryMetrics = this.createMetrics();
    this.stableMetrics = this.createMetrics();
    this.metrics.totalDeployments++;

    // Start evaluation timer
    this.evaluationTimer = setTimeout(() => {
      this.evaluateCanary();
    }, this.evaluationPeriodMs);

    this.emit('canary_started', {
      canaryVersion,
      stableVersion,
      canaryPercent: this.canaryPercent,
      timestamp: Date.now()
    });

    return {
      success: true,
      canaryVersion,
      stableVersion,
      canaryPercent: this.canaryPercent
    };
  }

  /**
   * Route request to canary or stable
   */
  routeRequest() {
    if (!this.canaryVersion) {
      return { version: this.stableVersion, isCanary: false };
    }

    // Route based on canary percentage
    const isCanary = Math.random() * 100 < this.canaryPercent;

    return {
      version: isCanary ? this.canaryVersion : this.stableVersion,
      isCanary
    };
  }

  /**
   * Record request result
   */
  recordRequest(version, success, latencyMs) {
    const metrics = version === this.canaryVersion ? this.canaryMetrics : this.stableMetrics;

    metrics.requests++;
    if (success) {
      metrics.successes++;
    } else {
      metrics.errors++;
    }
    metrics.latencies.push(latencyMs);

    // Keep only recent latencies
    if (metrics.latencies.length > 1000) {
      metrics.latencies.shift();
    }

    // Check for immediate rollback conditions
    if (version === this.canaryVersion) {
      this.checkImmediateRollback();
    }
  }

  /**
   * Check for immediate rollback conditions
   */
  checkImmediateRollback() {
    if (this.canaryMetrics.requests < 10) {
      return; // Not enough data
    }

    const errorRate = this.canaryMetrics.errors / this.canaryMetrics.requests;
    const avgLatency = this.calculateAvgLatency(this.canaryMetrics.latencies);

    // Immediate rollback if error rate is very high
    if (errorRate > 0.5) {
      console.error('[Canary] Critical error rate detected, rolling back immediately');
      this.rollback('critical_error_rate');
      return;
    }

    // Immediate rollback if latency is extremely high
    if (avgLatency > this.latencyThreshold * 2) {
      console.error('[Canary] Critical latency detected, rolling back immediately');
      this.rollback('critical_latency');
      return;
    }
  }

  /**
   * Evaluate canary deployment
   */
  async evaluateCanary() {
    if (!this.canaryVersion) {
      return;
    }

    console.log('[Canary] Evaluating canary deployment');

    // Check if we have enough data
    if (this.canaryMetrics.requests < this.minRequests) {
      console.log(`[Canary] Insufficient requests (${this.canaryMetrics.requests}/${this.minRequests}), extending evaluation`);

      // Extend evaluation period
      this.evaluationTimer = setTimeout(() => {
        this.evaluateCanary();
      }, this.evaluationPeriodMs);

      return;
    }

    // Calculate metrics
    const canaryStats = this.calculateStats(this.canaryMetrics);
    const stableStats = this.calculateStats(this.stableMetrics);

    console.log('[Canary] Canary stats:', canaryStats);
    console.log('[Canary] Stable stats:', stableStats);

    // Evaluate canary
    const evaluation = this.evaluateStats(canaryStats, stableStats);

    if (evaluation.pass) {
      this.promote();
    } else {
      this.rollback(evaluation.reason);
    }
  }

  /**
   * Calculate statistics
   */
  calculateStats(metrics) {
    const successRate = metrics.requests > 0
      ? metrics.successes / metrics.requests
      : 0;

    const errorRate = metrics.requests > 0
      ? metrics.errors / metrics.requests
      : 0;

    const avgLatency = this.calculateAvgLatency(metrics.latencies);
    const p95Latency = this.calculatePercentile(metrics.latencies, 0.95);
    const p99Latency = this.calculatePercentile(metrics.latencies, 0.99);

    return {
      requests: metrics.requests,
      successRate,
      errorRate,
      avgLatency,
      p95Latency,
      p99Latency
    };
  }

  /**
   * Evaluate if canary passes
   */
  evaluateStats(canaryStats, stableStats) {
    const reasons = [];

    // Check success rate
    if (canaryStats.successRate < this.successThreshold) {
      reasons.push(`Low success rate: ${(canaryStats.successRate * 100).toFixed(2)}%`);
    }

    // Check error rate
    if (canaryStats.errorRate > this.errorThreshold) {
      reasons.push(`High error rate: ${(canaryStats.errorRate * 100).toFixed(2)}%`);
    }

    // Check latency
    if (canaryStats.p95Latency > this.latencyThreshold) {
      reasons.push(`High P95 latency: ${canaryStats.p95Latency.toFixed(2)}ms`);
    }

    // Compare with stable
    if (stableStats.requests > 0) {
      // Error rate comparison
      if (canaryStats.errorRate > stableStats.errorRate * 1.5) {
        reasons.push('Error rate 50% higher than stable');
      }

      // Latency comparison
      if (canaryStats.p95Latency > stableStats.p95Latency * 1.3) {
        reasons.push('P95 latency 30% higher than stable');
      }
    }

    return {
      pass: reasons.length === 0,
      reason: reasons.join(', ') || 'passed_all_checks'
    };
  }

  /**
   * Promote canary to stable
   */
  promote() {
    console.log(`[Canary] Promoting canary ${this.canaryVersion} to stable`);

    const deployment = {
      canaryVersion: this.canaryVersion,
      stableVersion: this.stableVersion,
      result: 'promoted',
      canaryStats: this.calculateStats(this.canaryMetrics),
      stableStats: this.calculateStats(this.stableMetrics),
      timestamp: new Date().toISOString()
    };

    this.recordDeployment(deployment);
    this.metrics.successfulDeployments++;

    this.emit('canary_promoted', deployment);

    // Update stable version
    this.stableVersion = this.canaryVersion;
    this.cleanup();
  }

  /**
   * Rollback canary deployment
   */
  rollback(reason) {
    console.log(`[Canary] Rolling back canary ${this.canaryVersion}: ${reason}`);

    const deployment = {
      canaryVersion: this.canaryVersion,
      stableVersion: this.stableVersion,
      result: 'rolled_back',
      reason,
      canaryStats: this.calculateStats(this.canaryMetrics),
      stableStats: this.calculateStats(this.stableMetrics),
      timestamp: new Date().toISOString()
    };

    this.recordDeployment(deployment);
    this.metrics.rolledBackDeployments++;
    this.metrics.autoRollbacks++;

    this.emit('canary_rolled_back', deployment);

    this.cleanup();
  }

  /**
   * Record deployment in history
   */
  recordDeployment(deployment) {
    this.deploymentHistory.push(deployment);

    if (this.deploymentHistory.length > this.maxHistorySize) {
      this.deploymentHistory.shift();
    }
  }

  /**
   * Cleanup canary deployment
   */
  cleanup() {
    if (this.evaluationTimer) {
      clearTimeout(this.evaluationTimer);
      this.evaluationTimer = null;
    }

    this.canaryVersion = null;
    this.canaryMetrics = this.createMetrics();
  }

  /**
   * Calculate average latency
   */
  calculateAvgLatency(latencies) {
    if (latencies.length === 0) {
      return 0;
    }
    return latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) {
      return 0;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get canary status
   */
  getStatus() {
    if (!this.canaryVersion) {
      return {
        active: false,
        stableVersion: this.stableVersion
      };
    }

    const canaryStats = this.calculateStats(this.canaryMetrics);
    const stableStats = this.calculateStats(this.stableMetrics);
    const elapsed = Date.now() - this.canaryMetrics.startTime;
    const remaining = Math.max(0, this.evaluationPeriodMs - elapsed);

    return {
      active: true,
      canaryVersion: this.canaryVersion,
      stableVersion: this.stableVersion,
      canaryPercent: this.canaryPercent,
      canaryStats,
      stableStats,
      elapsed,
      remaining,
      evaluation: this.evaluateStats(canaryStats, stableStats)
    };
  }

  /**
   * Get deployment history
   */
  getHistory(limit = 20) {
    return this.deploymentHistory.slice(-limit);
  }

  /**
   * Get statistics
   */
  getStats() {
    const successRate = this.metrics.totalDeployments > 0
      ? (this.metrics.successfulDeployments / this.metrics.totalDeployments) * 100
      : 0;

    return {
      enabled: this.enabled,
      metrics: {
        ...this.metrics,
        successRate: successRate.toFixed(2) + '%'
      },
      config: {
        canaryPercent: this.canaryPercent,
        successThreshold: this.successThreshold,
        errorThreshold: this.errorThreshold,
        latencyThreshold: this.latencyThreshold,
        minRequests: this.minRequests
      },
      currentCanary: this.canaryVersion,
      stableVersion: this.stableVersion
    };
  }

  /**
   * Manual promote
   */
  manualPromote() {
    if (!this.canaryVersion) {
      return { success: false, reason: 'no_active_canary' };
    }

    this.promote();
    return { success: true };
  }

  /**
   * Manual rollback
   */
  manualRollback(reason = 'manual') {
    if (!this.canaryVersion) {
      return { success: false, reason: 'no_active_canary' };
    }

    this.rollback(reason);
    return { success: true };
  }
}

export default CanaryDeployment;
