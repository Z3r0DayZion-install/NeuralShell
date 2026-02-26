/**
 * Auto-Scaler
 * Intelligent scaling decisions based on load and predictions
 */

import { EventEmitter } from 'events';

// Optional decision engine import
let getDecisionEngine = null;
try {
  const module = await import('../intelligence/decisionEngine.js');
  getDecisionEngine = module.getDecisionEngine;
} catch (err) {
  console.log('[AutoScaler] Decision engine not available (optional)');
}

export class AutoScaler extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.minInstances = options.minInstances || 2;
    this.maxInstances = options.maxInstances || 20;
    this.targetCPU = options.targetCPU || 70;
    this.targetMemory = options.targetMemory || 80;
    this.scaleUpThreshold = options.scaleUpThreshold || 80;
    this.scaleDownThreshold = options.scaleDownThreshold || 30;
    this.cooldownMs = options.cooldownMs || 300000; // 5 minutes
    this.checkIntervalMs = options.checkIntervalMs || 30000; // 30 seconds

    this.currentInstances = this.minInstances;
    this.lastScaleTime = 0;
    this.metricsHistory = [];
    this.maxHistorySize = 100;

    this.metrics = {
      totalScaleUps: 0,
      totalScaleDowns: 0,
      failedScales: 0,
      predictiveScales: 0
    };

    this.checkInterval = null;

    // Initialize Decision Intelligence Engine (optional)
    this.decisionEngine = getDecisionEngine ? getDecisionEngine() : null;
    this.decisionEngineEnabled = options.decisionEngineEnabled !== false && this.decisionEngine !== null;
  }

  /**
   * Start auto-scaling
   */
  start(metricsProvider) {
    if (!this.enabled || this.checkInterval) {
      return;
    }

    this.checkInterval = setInterval(async () => {
      try {
        const metrics = await metricsProvider();
        await this.evaluate(metrics);
      } catch (error) {
        console.error('[AutoScaler] Evaluation error:', error);
      }
    }, this.checkIntervalMs);

    console.log('[AutoScaler] Started');
  }

  /**
   * Stop auto-scaling
   */
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[AutoScaler] Stopped');
    }
  }

  /**
   * Evaluate metrics and make scaling decision
   */
  async evaluate(metrics) {
    // Record metrics
    this.recordMetrics(metrics);

    // Check cooldown
    if (Date.now() - this.lastScaleTime < this.cooldownMs) {
      return { action: 'none', reason: 'cooldown_active' };
    }

    // Calculate current load
    const cpuLoad = metrics.cpu || 0;
    const memoryLoad = metrics.memory || 0;
    const requestRate = metrics.requestRate || 0;
    const avgLatency = metrics.avgLatency || 0;

    // Determine if scaling is needed
    const decision = this.makeDecision({
      cpuLoad,
      memoryLoad,
      requestRate,
      avgLatency
    });

    if (decision.action !== 'none') {
      await this.executeScaling(decision);
    }

    return decision;
  }

  /**
   * Make scaling decision
   */
  makeDecision(current) {
    const { cpuLoad, memoryLoad, requestRate } = current;

    // Scale up conditions
    if (cpuLoad > this.scaleUpThreshold || memoryLoad > this.scaleUpThreshold) {
      if (this.currentInstances < this.maxInstances) {
        return {
          action: 'scale_up',
          reason: 'high_resource_usage',
          target: Math.min(this.currentInstances + 1, this.maxInstances),
          metrics: current
        };
      }
    }

    // Scale down conditions
    if (cpuLoad < this.scaleDownThreshold && memoryLoad < this.scaleDownThreshold) {
      if (this.currentInstances > this.minInstances) {
        return {
          action: 'scale_down',
          reason: 'low_resource_usage',
          target: Math.max(this.currentInstances - 1, this.minInstances),
          metrics: current
        };
      }
    }

    // Predictive scaling
    const prediction = this.predictLoad();
    if (prediction.shouldScale) {
      this.metrics.predictiveScales++;
      return {
        action: prediction.direction,
        reason: 'predictive',
        target: prediction.target,
        metrics: current,
        prediction
      };
    }

    return { action: 'none', reason: 'within_thresholds', metrics: current };
  }

  /**
   * Predict future load based on historical data
   */
  predictLoad() {
    if (this.metricsHistory.length < 10) {
      return { shouldScale: false };
    }

    // Simple linear regression on request rate
    const recent = this.metricsHistory.slice(-10);
    const requestRates = recent.map(m => m.requestRate || 0);

    // Calculate trend
    const avgRate = requestRates.reduce((sum, r) => sum + r, 0) / requestRates.length;
    const lastRate = requestRates[requestRates.length - 1];
    const trend = (lastRate - avgRate) / avgRate;

    // If trend is increasing rapidly, scale up proactively
    if (trend > 0.3 && this.currentInstances < this.maxInstances) {
      return {
        shouldScale: true,
        direction: 'scale_up',
        target: this.currentInstances + 1,
        trend: (trend * 100).toFixed(2) + '%'
      };
    }

    // If trend is decreasing, consider scaling down
    if (trend < -0.3 && this.currentInstances > this.minInstances) {
      return {
        shouldScale: true,
        direction: 'scale_down',
        target: this.currentInstances - 1,
        trend: (trend * 100).toFixed(2) + '%'
      };
    }

    return { shouldScale: false, trend: (trend * 100).toFixed(2) + '%' };
  }

  /**
   * Execute scaling action
   */
  async executeScaling(decision) {
    console.log(`[AutoScaler] Scaling ${decision.action}: ${this.currentInstances} -> ${decision.target}`);

    const decisionStartTime = Date.now();

    try {
      this.emit('before_scale', decision);

      // Update instance count
      const oldCount = this.currentInstances;
      this.currentInstances = decision.target;
      this.lastScaleTime = Date.now();

      // Update metrics
      if (decision.action === 'scale_up') {
        this.metrics.totalScaleUps++;
      } else if (decision.action === 'scale_down') {
        this.metrics.totalScaleDowns++;
      }

      this.emit('scaled', {
        ...decision,
        oldCount,
        newCount: this.currentInstances,
        timestamp: Date.now()
      });

      // Record successful decision event
      await this.recordDecisionEvent({
        decision_type: 'scaling',
        context: {
          trigger: decision.reason,
          metrics: {
            cpu_load: decision.metrics?.cpuLoad || 0,
            memory_load: decision.metrics?.memoryLoad || 0,
            request_rate: decision.metrics?.requestRate || 0,
            avg_latency: decision.metrics?.avgLatency || 0
          },
          state: {
            old_instances: oldCount,
            target_instances: decision.target,
            is_predictive: decision.reason === 'predictive',
            prediction_trend: decision.prediction?.trend
          }
        },
        action_taken: {
          type: decision.action,
          parameters: {
            from: oldCount,
            to: decision.target,
            reason: decision.reason
          }
        },
        outcome: {
          status: 'success',
          duration_ms: Date.now() - decisionStartTime,
          impact: {
            instance_change: decision.target - oldCount,
            new_capacity: decision.target
          }
        }
      });

      return { success: true, ...decision };
    } catch (error) {
      this.metrics.failedScales++;
      console.error('[AutoScaler] Scaling failed:', error);

      this.emit('scale_error', {
        ...decision,
        error: error.message
      });

      // Record failed decision event
      await this.recordDecisionEvent({
        decision_type: 'scaling',
        context: {
          trigger: decision.reason,
          metrics: {
            cpu_load: decision.metrics?.cpuLoad || 0,
            memory_load: decision.metrics?.memoryLoad || 0
          },
          state: {
            old_instances: this.currentInstances,
            target_instances: decision.target
          }
        },
        action_taken: {
          type: decision.action,
          parameters: {
            from: this.currentInstances,
            to: decision.target,
            reason: decision.reason
          }
        },
        outcome: {
          status: 'failure',
          duration_ms: Date.now() - decisionStartTime,
          impact: {
            error: error.message
          }
        }
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Record metrics in history
   */
  recordMetrics(metrics) {
    this.metricsHistory.push({
      ...metrics,
      timestamp: Date.now()
    });

    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Get current scaling status
   */
  getStatus() {
    const recentMetrics = this.metricsHistory.slice(-5);
    const avgCPU = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.cpu || 0), 0) / recentMetrics.length
      : 0;

    return {
      enabled: this.enabled,
      currentInstances: this.currentInstances,
      minInstances: this.minInstances,
      maxInstances: this.maxInstances,
      lastScaleTime: this.lastScaleTime,
      cooldownRemaining: Math.max(0, this.cooldownMs - (Date.now() - this.lastScaleTime)),
      metrics: { ...this.metrics },
      currentLoad: {
        avgCPU: avgCPU.toFixed(2),
        samples: recentMetrics.length
      }
    };
  }

  /**
   * Get scaling recommendations
   */
  getRecommendations() {
    if (this.metricsHistory.length < 10) {
      return { recommendation: 'insufficient_data' };
    }

    const recent = this.metricsHistory.slice(-20);
    const avgCPU = recent.reduce((sum, m) => sum + (m.cpu || 0), 0) / recent.length;
    const avgMemory = recent.reduce((sum, m) => sum + (m.memory || 0), 0) / recent.length;
    const maxCPU = Math.max(...recent.map(m => m.cpu || 0));
    const maxMemory = Math.max(...recent.map(m => m.memory || 0));

    const recommendations = [];

    if (maxCPU > 90 || maxMemory > 90) {
      recommendations.push({
        type: 'increase_max_instances',
        reason: 'Peak load exceeds 90%',
        current: this.maxInstances,
        suggested: this.maxInstances + 2
      });
    }

    if (avgCPU < 20 && avgMemory < 20) {
      recommendations.push({
        type: 'decrease_min_instances',
        reason: 'Average load below 20%',
        current: this.minInstances,
        suggested: Math.max(1, this.minInstances - 1)
      });
    }

    if (this.metrics.totalScaleUps > this.metrics.totalScaleDowns * 3) {
      recommendations.push({
        type: 'adjust_thresholds',
        reason: 'Frequent scale-ups detected',
        suggestion: 'Consider lowering scale-up threshold'
      });
    }

    return {
      recommendations,
      stats: {
        avgCPU: avgCPU.toFixed(2),
        avgMemory: avgMemory.toFixed(2),
        maxCPU: maxCPU.toFixed(2),
        maxMemory: maxMemory.toFixed(2)
      }
    };
  }

  /**
   * Manual scale
   */
  async manualScale(targetInstances, reason = 'manual') {
    if (targetInstances < this.minInstances || targetInstances > this.maxInstances) {
      return {
        success: false,
        error: `Target must be between ${this.minInstances} and ${this.maxInstances}`
      };
    }

    const action = targetInstances > this.currentInstances ? 'scale_up' : 'scale_down';

    return this.executeScaling({
      action,
      reason,
      target: targetInstances,
      manual: true
    });
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      enabled: this.enabled,
      config: {
        minInstances: this.minInstances,
        maxInstances: this.maxInstances,
        targetCPU: this.targetCPU,
        targetMemory: this.targetMemory,
        cooldownMs: this.cooldownMs
      },
      current: {
        instances: this.currentInstances,
        lastScaleTime: this.lastScaleTime
      },
      metrics: { ...this.metrics },
      history: this.metricsHistory.length
    };
  }

  /**
   * Record decision event to Decision Intelligence Engine
   */
  async recordDecisionEvent(eventData) {
    if (!this.decisionEngineEnabled) {
      return;
    }

    try {
      await this.decisionEngine.recordDecision({
        system_component: 'auto-scaler',
        ...eventData
      });
    } catch (error) {
      // Log error but don't fail the scaling operation
      console.error('[AutoScaler] Failed to record decision event:', error.message);
    }
  }
}

export default AutoScaler;
