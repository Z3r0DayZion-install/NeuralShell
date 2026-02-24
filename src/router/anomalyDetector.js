/**
 * Anomaly Detector
 * ML-based anomaly detection for traffic patterns and system behavior
 */

import { EventEmitter } from 'events';

// Optional decision engine import
let getDecisionEngine = null;
try {
  const module = await import('../intelligence/decisionEngine.js');
  getDecisionEngine = module.getDecisionEngine;
} catch (err) {
  console.log('[AnomalyDetector] Decision engine not available (optional)');
}

export class AnomalyDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    this.enabled = options.enabled !== false;
    this.windowSize = options.windowSize || 100;
    this.stdDevThreshold = options.stdDevThreshold || 3;
    this.minSamples = options.minSamples || 30;
    
    this.metrics = new Map();
    this.anomalies = [];
    this.maxAnomalyHistory = options.maxAnomalyHistory || 1000;
    
    this.detectionStats = {
      totalChecks: 0,
      anomaliesDetected: 0,
      falsePositives: 0
    };

    // Initialize Decision Intelligence Engine (optional)
    this.decisionEngine = getDecisionEngine ? getDecisionEngine() : null;
    this.decisionEngineEnabled = options.decisionEngineEnabled !== false && this.decisionEngine !== null;
  }

  /**
   * Record a metric value
   */
  record(metricName, value, metadata = {}) {
    if (!this.metrics.has(metricName)) {
      this.metrics.set(metricName, {
        name: metricName,
        values: [],
        stats: null
      });
    }

    const metric = this.metrics.get(metricName);
    metric.values.push({
      value,
      timestamp: Date.now(),
      metadata
    });

    // Keep only recent values
    if (metric.values.length > this.windowSize) {
      metric.values.shift();
    }

    // Update statistics
    this.updateStats(metric);

    // Check for anomaly
    if (metric.values.length >= this.minSamples) {
      this.checkAnomaly(metricName, value, metadata);
    }
  }

  /**
   * Update statistical measures
   */
  updateStats(metric) {
    const values = metric.values.map(v => v.value);
    const n = values.length;

    if (n === 0) {
      metric.stats = null;
      return;
    }

    // Calculate mean
    const mean = values.reduce((sum, v) => sum + v, 0) / n;

    // Calculate standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
    
    // SECURITY: Prevent zero-division and erratic triggers on small variance
    // We add a tiny epsilon or enforce a floor for stdDev
    const stdDev = Math.sqrt(Math.max(variance, 0.000001));

    // Calculate percentiles
    const sorted = [...values].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(n * 0.5)];
    const p95 = sorted[Math.floor(n * 0.95)];
    const p99 = sorted[Math.floor(n * 0.99)];

    metric.stats = {
      mean: isFinite(mean) ? mean : 0,
      stdDev: isFinite(stdDev) ? stdDev : 0,
      min: Math.min(...values),
      max: Math.max(...values),
      p50,
      p95,
      p99,
      samples: n
    };
  }

  /**
   * Check if value is anomalous
   */
  checkAnomaly(metricName, value, metadata) {
    if (!this.enabled) {
      return false;
    }

    this.detectionStats.totalChecks++;

    const metric = this.metrics.get(metricName);
    if (!metric || !metric.stats) {
      return false;
    }

    const { mean, stdDev } = metric.stats;
    
    // Z-score method
    const zScore = stdDev > 0 ? Math.abs((value - mean) / stdDev) : 0;
    const isAnomaly = zScore > this.stdDevThreshold;

    if (isAnomaly) {
      this.detectionStats.anomaliesDetected++;
      
      const anomaly = {
        metric: metricName,
        value,
        expected: mean,
        zScore: zScore.toFixed(2),
        deviation: ((value - mean) / mean * 100).toFixed(2) + '%',
        timestamp: new Date().toISOString(),
        metadata
      };

      this.recordAnomaly(anomaly);
      this.emit('anomaly', anomaly);

      // Record decision event for anomaly detection
      this.recordDecisionEvent({
        decision_type: 'anomaly_response',
        context: {
          trigger: 'metric_threshold_exceeded',
          metrics: {
            value,
            expected: mean,
            z_score: parseFloat(zScore.toFixed(2)),
            std_dev: stdDev
          },
          state: {
            metric_name: metricName,
            metadata,
            samples: metric.stats.samples
          }
        },
        action_taken: {
          type: 'anomaly_detected',
          parameters: {
            detection_method: 'z_score',
            threshold: this.stdDevThreshold
          }
        },
        outcome: {
          status: 'success',
          duration_ms: 0,
          impact: {
            anomaly_detected: 1,
            deviation_percent: parseFloat(((value - mean) / mean * 100).toFixed(2))
          }
        }
      });

      return true;
    }

    return false;
  }

  /**
   * Record anomaly in history
   */
  recordAnomaly(anomaly) {
    this.anomalies.push(anomaly);

    if (this.anomalies.length > this.maxAnomalyHistory) {
      this.anomalies.shift();
    }
  }

  /**
   * Detect traffic pattern anomalies
   */
  detectTrafficAnomaly(requestsPerMinute) {
    this.record('requests_per_minute', requestsPerMinute, {
      type: 'traffic'
    });
  }

  /**
   * Detect latency anomalies
   */
  detectLatencyAnomaly(endpoint, latencyMs) {
    this.record(`latency_${endpoint}`, latencyMs, {
      type: 'latency',
      endpoint
    });
  }

  /**
   * Detect error rate anomalies
   */
  detectErrorRateAnomaly(errorRate) {
    this.record('error_rate', errorRate, {
      type: 'error_rate'
    });
  }

  /**
   * Detect memory usage anomalies
   */
  detectMemoryAnomaly(memoryMB) {
    this.record('memory_usage', memoryMB, {
      type: 'memory'
    });
  }

  /**
   * Get metric statistics
   */
  getMetricStats(metricName) {
    const metric = this.metrics.get(metricName);
    return metric ? metric.stats : null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result = {};
    
    for (const [name, metric] of this.metrics) {
      result[name] = {
        stats: metric.stats,
        recentValues: metric.values.slice(-10).map(v => ({
          value: v.value,
          timestamp: v.timestamp
        }))
      };
    }

    return result;
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies(limit = 50) {
    return this.anomalies.slice(-limit);
  }

  /**
   * Get anomalies by metric
   */
  getAnomaliesByMetric(metricName, limit = 50) {
    return this.anomalies
      .filter(a => a.metric === metricName)
      .slice(-limit);
  }

  /**
   * Get detection statistics
   */
  getStats() {
    const anomalyRate = this.detectionStats.totalChecks > 0
      ? (this.detectionStats.anomaliesDetected / this.detectionStats.totalChecks) * 100
      : 0;

    return {
      enabled: this.enabled,
      config: {
        windowSize: this.windowSize,
        stdDevThreshold: this.stdDevThreshold,
        minSamples: this.minSamples
      },
      stats: {
        ...this.detectionStats,
        anomalyRate: anomalyRate.toFixed(2) + '%'
      },
      metrics: {
        tracked: this.metrics.size,
        totalAnomalies: this.anomalies.length
      }
    };
  }

  /**
   * Reset metric
   */
  resetMetric(metricName) {
    this.metrics.delete(metricName);
  }

  /**
   * Reset all metrics
   */
  resetAll() {
    this.metrics.clear();
    this.anomalies = [];
    this.detectionStats = {
      totalChecks: 0,
      anomaliesDetected: 0,
      falsePositives: 0
    };
  }

  /**
   * Mark anomaly as false positive
   */
  markFalsePositive(anomalyIndex) {
    if (anomalyIndex >= 0 && anomalyIndex < this.anomalies.length) {
      this.anomalies[anomalyIndex].falsePositive = true;
      this.detectionStats.falsePositives++;
    }
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
        system_component: 'anomaly-detector',
        ...eventData
      });
    } catch (error) {
      // Log error but don't fail the detection operation
      console.error('[AnomalyDetector] Failed to record decision event:', error.message);
    }
  }
}

/**
 * Advanced anomaly detection using exponential moving average
 */
export class EMAnomalyDetector extends AnomalyDetector {
  constructor(options = {}) {
    super(options);
    this.alpha = options.alpha || 0.3; // Smoothing factor
    this.emaValues = new Map();
  }

  record(metricName, value, metadata = {}) {
    // Calculate EMA
    if (!this.emaValues.has(metricName)) {
      this.emaValues.set(metricName, value);
    } else {
      const prevEMA = this.emaValues.get(metricName);
      const newEMA = this.alpha * value + (1 - this.alpha) * prevEMA;
      this.emaValues.set(metricName, newEMA);
    }

    // Call parent record
    super.record(metricName, value, metadata);
  }

  checkAnomaly(metricName, value, metadata) {
    const ema = this.emaValues.get(metricName);
    
    if (ema === undefined) {
      return false;
    }

    // Check deviation from EMA
    const deviation = Math.abs(value - ema) / ema;
    const threshold = 0.5; // 50% deviation threshold

    if (deviation > threshold) {
      this.detectionStats.anomaliesDetected++;
      
      const anomaly = {
        metric: metricName,
        value,
        expected: ema,
        deviation: (deviation * 100).toFixed(2) + '%',
        method: 'EMA',
        timestamp: new Date().toISOString(),
        metadata
      };

      this.recordAnomaly(anomaly);
      this.emit('anomaly', anomaly);

      return true;
    }

    return false;
  }
}

export default AnomalyDetector;
