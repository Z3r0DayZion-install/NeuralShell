/**
 * Autonomy Controller
 * Centralized controller for all autonomous system modules
 * Manages lifecycle, event wiring, and metrics aggregation
 */

import { EventEmitter } from 'events';
import { SelfHealingOrchestrator } from './selfHealing.js';
import { ProcessManager } from './processManager.js';
import { AnomalyDetector } from './anomalyDetector.js';
import { AutoScaler } from './autoScaler.js';
import { SecretRotationManager } from './secretRotation.js';
import { CostManager } from './costManager.js';
import { ThreatDetector } from './threatDetector.js';
import { AutoOptimizer } from './autoOptimizer.js';
import { CanaryDeployment } from './canaryDeployment.js';

export class AutonomyController extends EventEmitter {
  constructor(options = {}) {
    super();

    // Feature flags
    this.featureFlags = {
      AUTO_HEALING: this.parseFlag(options.AUTO_HEALING),
      AUTO_SCALING: this.parseFlag(options.AUTO_SCALING),
      AUTO_ANOMALY_DETECTION: this.parseFlag(options.AUTO_ANOMALY_DETECTION),
      AUTO_PROCESS_MANAGEMENT: this.parseFlag(options.AUTO_PROCESS_MANAGEMENT),
      AUTO_SECRET_ROTATION: this.parseFlag(options.AUTO_SECRET_ROTATION),
      AUTO_COST_MANAGEMENT: this.parseFlag(options.AUTO_COST_MANAGEMENT),
      AUTO_THREAT_DETECTION: this.parseFlag(options.AUTO_THREAT_DETECTION),
      AUTO_OPTIMIZATION: this.parseFlag(options.AUTO_OPTIMIZATION),
      AUTO_CANARY_DEPLOYMENT: this.parseFlag(options.AUTO_CANARY_DEPLOYMENT)
    };

    // Global controls
    this.dryRun = this.parseFlag(options.DRY_RUN);
    this.killSwitch = this.parseFlag(options.AUTONOMY_KILL_SWITCH);

    // Bounded defenses - safety limits
    this.safetyLimits = {
      MAX_RESTARTS_PER_WINDOW: options.MAX_RESTARTS_PER_WINDOW || 3,
      RESTART_WINDOW_MS: options.RESTART_WINDOW_MS || 300000, // 5 minutes
      MAX_IP_BLOCKS_PER_WINDOW: options.MAX_IP_BLOCKS_PER_WINDOW || 100,
      IP_BLOCK_WINDOW_MS: options.IP_BLOCK_WINDOW_MS || 3600000, // 1 hour
      MAX_BACKOFF_MS: options.MAX_BACKOFF_MS || 60000, // 1 minute ceiling
      MAX_DECISIONS_PER_MINUTE: options.MAX_DECISIONS_PER_MINUTE || 100
    };

    // Module instances
    this.modules = {};

    // State
    this.isStarted = false;
    this.started = false; // Alias for compatibility
    this.startTime = null;

    // Metrics
    this.metrics = {
      totalDecisions: 0,
      totalActions: 0,
      moduleMetrics: {}
    };

    // Initialize modules based on feature flags
    this.initializeModules(options);
  }

  /**
   * Parse feature flag (supports string '1'/'0' or boolean)
   */
  parseFlag(value) {
    if (value === undefined || value === null) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    return value === '1' || value === 'true' || value === true;
  }

  /**
   * Initialize autonomous modules based on enabled flags
   */
  initializeModules(options) {
    // Check kill switch first
    if (this.killSwitch) {
      console.log('[AutonomyController] Kill switch enabled - all autonomous systems disabled');
      return;
    }

    // Self-Healing
    if (this.featureFlags.AUTO_HEALING) {
      this.modules.selfHealing = new SelfHealingOrchestrator({
        enabled: !this.dryRun,
        ...options.selfHealing
      });
      console.log('[AutonomyController] Self-Healing module initialized');
    }

    // Process Manager
    if (this.featureFlags.AUTO_PROCESS_MANAGEMENT) {
      this.modules.processManager = new ProcessManager({
        enabled: !this.dryRun,
        maxRestarts: this.safetyLimits.MAX_RESTARTS_PER_WINDOW,
        restartWindowMs: this.safetyLimits.RESTART_WINDOW_MS,
        maxBackoffMs: this.safetyLimits.MAX_BACKOFF_MS,
        ...options.processManager
      });
      console.log('[AutonomyController] Process Manager module initialized');
    }

    // Anomaly Detector
    if (this.featureFlags.AUTO_ANOMALY_DETECTION) {
      this.modules.anomalyDetector = new AnomalyDetector({
        enabled: !this.dryRun,
        ...options.anomalyDetector
      });
      console.log('[AutonomyController] Anomaly Detector module initialized');
    }

    // Auto Scaler
    if (this.featureFlags.AUTO_SCALING) {
      this.modules.autoScaler = new AutoScaler({
        enabled: !this.dryRun,
        ...options.autoScaler
      });
      console.log('[AutonomyController] Auto Scaler module initialized');
    }

    // Secret Rotation
    if (this.featureFlags.AUTO_SECRET_ROTATION) {
      this.modules.secretRotation = new SecretRotationManager({
        enabled: !this.dryRun,
        ...options.secretRotation
      });
      console.log('[AutonomyController] Secret Rotation module initialized');
    }

    // Cost Manager
    if (this.featureFlags.AUTO_COST_MANAGEMENT) {
      this.modules.costManager = new CostManager({
        enabled: !this.dryRun,
        ...options.costManager
      });
      console.log('[AutonomyController] Cost Manager module initialized');
    }

    // Threat Detector
    if (this.featureFlags.AUTO_THREAT_DETECTION) {
      this.modules.threatDetector = new ThreatDetector({
        enabled: !this.dryRun,
        maxIpBlocksPerWindow: this.safetyLimits.MAX_IP_BLOCKS_PER_WINDOW,
        ipBlockWindowMs: this.safetyLimits.IP_BLOCK_WINDOW_MS,
        ...options.threatDetector
      });
      console.log('[AutonomyController] Threat Detector module initialized');
    }

    // Auto Optimizer
    if (this.featureFlags.AUTO_OPTIMIZATION) {
      this.modules.autoOptimizer = new AutoOptimizer({
        enabled: !this.dryRun,
        ...options.autoOptimizer
      });
      console.log('[AutonomyController] Auto Optimizer module initialized');
    }

    // Canary Deployment
    if (this.featureFlags.AUTO_CANARY_DEPLOYMENT) {
      this.modules.canaryDeployment = new CanaryDeployment({
        enabled: !this.dryRun,
        ...options.canaryDeployment
      });
      console.log('[AutonomyController] Canary Deployment module initialized');
    }
  }

  /**
   * Start autonomous operations
   */
  async start() {
    if (this.isStarted) {
      console.log('[AutonomyController] Already started');
      return { success: false, reason: 'already_started' };
    }

    if (this.killSwitch) {
      console.log('[AutonomyController] Kill switch enabled - cannot start');
      return { success: false, reason: 'kill_switch_enabled' };
    }

    console.log('[AutonomyController] Starting autonomous systems...');
    this.startTime = Date.now();
    this.isStarted = true;
    this.started = true; // Alias for compatibility

    // Wire event handlers
    this.wireEventHandlers();

    // Start modules that need active monitoring
    if (this.modules.autoScaler) {
      this.modules.autoScaler.start(() => this.getSystemMetrics());
    }

    if (this.modules.autoOptimizer) {
      this.modules.autoOptimizer.start(() => this.getSystemMetrics());
    }

    if (this.modules.secretRotation) {
      this.modules.secretRotation.start();
    }

    if (this.modules.processManager) {
      // Process manager is passive, just listening to events
      console.log('[AutonomyController] Process Manager ready');
    }

    this.emit('started', {
      modules: Object.keys(this.modules),
      dryRun: this.dryRun,
      timestamp: Date.now()
    });

    console.log('[AutonomyController] Autonomous systems started successfully');
    return { success: true, modules: Object.keys(this.modules) };
  }

  /**
   * Wire event handlers to connect modules to system events
   */
  wireEventHandlers() {
    // Self-Healing: Listen for endpoint failures
    if (this.modules.selfHealing) {
      this.on('endpoint_failure', async (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would trigger self-healing for', data);
          return;
        }
        await this.modules.selfHealing.heal({
          type: 'endpoint_failure',
          endpoint: data.endpoint,
          error: data.error
        });
      });

      this.on('endpoint_cooldown', async (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would clear cooldown for', data);
          return;
        }
        await this.modules.selfHealing.heal({
          type: 'endpoint_cooldown',
          endpoint: data.endpoint
        });
      });
    }

    // Anomaly Detector: Listen for traffic and latency metrics
    if (this.modules.anomalyDetector) {
      this.on('traffic_metrics', (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would record traffic metrics', data);
          return;
        }
        this.modules.anomalyDetector.detectTrafficAnomaly(data.requestsPerMinute);
      });

      this.on('latency_metrics', (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would record latency metrics', data);
          return;
        }
        this.modules.anomalyDetector.detectLatencyAnomaly(data.endpoint, data.latencyMs);
      });

      this.on('error_rate_metrics', (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would record error rate metrics', data);
          return;
        }
        this.modules.anomalyDetector.detectErrorRateAnomaly(data.errorRate);
      });
    }

    // Auto Scaler: Metrics are pulled via getSystemMetrics()
    // No event wiring needed, it polls metrics

    // Process Manager: Listen for health check failures
    if (this.modules.processManager) {
      this.on('health_check_failed', async (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would restart process', data);
          return;
        }
        await this.modules.processManager.gracefulRestart('health_check_failed');
      });

      this.on('memory_threshold_exceeded', async (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would restart due to memory', data);
          return;
        }
        await this.modules.processManager.gracefulRestart('memory_threshold_exceeded');
      });
    }

    // Cost Manager: Listen for request cost tracking
    if (this.modules.costManager) {
      this.on('request_completed', (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would track cost', data);
          return;
        }
        if (data.endpoint && data.usage) {
          this.modules.costManager.trackRequest(data.endpoint, data.usage);
        }
      });
    }

    // Threat Detector: Listen for incoming requests
    if (this.modules.threatDetector) {
      this.on('request_received', (data) => {
        this.metrics.totalActions++;
        if (this.dryRun) {
          console.log('[AutonomyController] DRY RUN: Would analyze threat', data);
          return;
        }
        const result = this.modules.threatDetector.analyzeRequest(data.request);
        if (result.threat) {
          this.emit('threat_detected', result);
        }
      });
    }

    console.log('[AutonomyController] Event handlers wired');
  }

  /**
   * Stop autonomous operations
   */
  async stop() {
    if (!this.isStarted) {
      console.log('[AutonomyController] Not started');
      return { success: false, reason: 'not_started' };
    }

    console.log('[AutonomyController] Stopping autonomous systems...');

    // Stop active modules and clear their intervals/timeouts
    if (this.modules.autoScaler) {
      this.modules.autoScaler.stop();
    }

    if (this.modules.autoOptimizer) {
      this.modules.autoOptimizer.stop();
    }

    if (this.modules.secretRotation) {
      this.modules.secretRotation.stop();
    }

    if (this.modules.processManager) {
      this.modules.processManager.stopMonitoring();
    }

    if (this.modules.anomalyDetector) {
      // AnomalyDetector doesn't have intervals, but remove listeners
      this.modules.anomalyDetector.removeAllListeners();
    }

    if (this.modules.selfHealing) {
      this.modules.selfHealing.removeAllListeners();
    }

    if (this.modules.costManager) {
      this.modules.costManager.removeAllListeners();
    }

    if (this.modules.threatDetector) {
      this.modules.threatDetector.removeAllListeners();
    }

    if (this.modules.canaryDeployment) {
      this.modules.canaryDeployment.removeAllListeners();
    }

    // Remove all event listeners from controller
    this.removeAllListeners();

    this.isStarted = false;
    this.started = false; // Alias for compatibility

    this.emit('stopped', {
      uptime: Date.now() - this.startTime,
      timestamp: Date.now()
    });

    console.log('[AutonomyController] Autonomous systems stopped');
    return { success: true };
  }

  /**
   * Get system metrics for auto-scaler and optimizer
   */
  async getSystemMetrics() {
    const memUsage = process.memoryUsage();

    return {
      cpu: this.getCPUUsage(),
      memory: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      requestRate: this.metrics.totalActions / ((Date.now() - this.startTime) / 60000) || 0,
      avgLatency: 100, // Placeholder - should be tracked from actual requests
      cache_hit_rate: 0.75, // Placeholder
      error_rate: 0.01, // Placeholder
      connection_wait_time: 5, // Placeholder
      rate_limit_hits: 0 // Placeholder
    };
  }

  /**
   * Get CPU usage (simplified)
   */
  getCPUUsage() {
    // Simplified CPU usage calculation
    // In production, use proper CPU monitoring
    const usage = process.cpuUsage();
    const total = usage.user + usage.system;
    return (total / 1000000) % 100; // Convert to percentage
  }

  /**
   * Get aggregated metrics from all modules
   */
  getMetrics() {
    const flatMetrics = {};

    // Collect metrics from each module and flatten them
    if (this.modules.selfHealing) {
      const stats = this.modules.selfHealing.getStats();
      flatMetrics.self_healing_total_attempts = stats.metrics?.totalHealingAttempts || 0;
      flatMetrics.self_healing_successful = stats.metrics?.successfulHeals || 0;
      flatMetrics.self_healing_failed = stats.metrics?.failedHeals || 0;
      flatMetrics.self_healing_prevented = stats.metrics?.preventedHeals || 0;
    }

    if (this.modules.processManager) {
      const stats = this.modules.processManager.getStats();
      flatMetrics.process_total_restarts = stats.metrics?.totalRestarts || 0;
      flatMetrics.process_uptime = stats.uptime || 0;
    }

    if (this.modules.anomalyDetector) {
      const stats = this.modules.anomalyDetector.getStats();
      flatMetrics.anomaly_total_checks = stats.stats?.totalChecks || 0;
      flatMetrics.anomaly_detected = stats.stats?.anomaliesDetected || 0;
    }

    if (this.modules.autoScaler) {
      const stats = this.modules.autoScaler.getStats();
      flatMetrics.scaler_total_scale_ups = stats.metrics?.totalScaleUps || 0;
      flatMetrics.scaler_total_scale_downs = stats.metrics?.totalScaleDowns || 0;
      flatMetrics.scaler_current_instances = stats.current?.instances || 0;
    }

    if (this.modules.secretRotation) {
      const stats = this.modules.secretRotation.getStats();
      flatMetrics.secret_total_rotations = stats.metrics?.totalRotations || 0;
    }

    if (this.modules.costManager) {
      const stats = this.modules.costManager.getStats();
      flatMetrics.cost_total = stats.metrics?.totalCost || 0;
      flatMetrics.cost_total_requests = stats.metrics?.totalRequests || 0;
    }

    if (this.modules.threatDetector) {
      const stats = this.modules.threatDetector.getStats();
      flatMetrics.threat_total_threats = stats.metrics?.totalThreats || 0;
      flatMetrics.threat_blocked_ips = stats.metrics?.blockedIPs || 0;
    }

    if (this.modules.autoOptimizer) {
      const stats = this.modules.autoOptimizer.getStats();
      flatMetrics.optimizer_total_optimizations = stats.metrics?.totalOptimizations || 0;
    }

    if (this.modules.canaryDeployment) {
      const stats = this.modules.canaryDeployment.getStats();
      flatMetrics.canary_total_deployments = stats.metrics?.totalDeployments || 0;
    }

    return flatMetrics;
  }

  /**
   * Get Prometheus-formatted metrics
   */
  getPrometheusMetrics() {
    const metrics = this.getMetrics();
    const lines = [];

    // Controller uptime
    const uptime = this.isStarted ? (Date.now() - this.startTime) / 1000 : 0;
    lines.push('# HELP autonomy_controller_uptime_seconds Uptime of autonomy controller');
    lines.push('# TYPE autonomy_controller_uptime_seconds gauge');
    lines.push(`autonomy_controller_uptime_seconds ${uptime.toFixed(2)}`);

    lines.push('# HELP autonomy_controller_modules_enabled Number of enabled modules');
    lines.push('# TYPE autonomy_controller_modules_enabled gauge');
    lines.push(`autonomy_controller_modules_enabled ${Object.keys(this.modules).length}`);

    lines.push('# HELP autonomy_controller_dry_run Dry run mode enabled');
    lines.push('# TYPE autonomy_controller_dry_run gauge');
    lines.push(`autonomy_controller_dry_run ${this.dryRun ? 1 : 0}`);

    // Flatten all metrics
    for (const [key, value] of Object.entries(metrics)) {
      lines.push(`# TYPE ${key} gauge`);
      lines.push(`${key} ${value}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Get module instance (for direct access if needed)
   */
  getModule(name) {
    return this.modules[name] || null;
  }

  /**
   * Check if module is enabled
   */
  isModuleEnabled(name) {
    return this.modules[name] !== undefined;
  }

  /**
   * Get status summary
   */
  getStatus() {
    return {
      enabled: this.isStarted,
      started: this.isStarted, // Alias for compatibility
      isStarted: this.isStarted,
      dryRun: this.dryRun,
      killSwitch: this.killSwitch,
      uptime: this.isStarted ? Date.now() - this.startTime : 0,
      modules: Object.keys(this.modules), // Array of module names
      enabledModules: Object.keys(this.modules),
      featureFlags: this.featureFlags,
      moduleCount: Object.keys(this.modules).length
    };
  }
}

export default AutonomyController;
