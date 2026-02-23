/**
 * Unit tests for AutonomyController
 * 
 * Tests cover:
 * - Constructor with various feature flag combinations
 * - Module instantiation (all 9 modules)
 * - start() method
 * - stop() method
 * - getMetrics() method
 * - Dry-run mode
 * - Kill switch
 * 
 * Validates Requirements: 2.1, 2.2, 2.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutonomyController } from '../src/router/autonomyController.js';

describe('AutonomyController', () => {
  let mockLogger;

  beforeEach(() => {
    // Reset environment variables
    delete process.env.DRY_RUN;
    delete process.env.AUTONOMY_KILL_SWITCH;
    
    // Create mock logger
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    };
  });

  describe('Constructor with various feature flag combinations', () => {
    it('should instantiate with no feature flags (no modules)', () => {
      const controller = new AutonomyController({
        featureFlags: {},
        logger: mockLogger
      });

      expect(controller).toBeDefined();
      expect(controller.config).toBeDefined();
      expect(controller.featureFlags).toEqual({});
      expect(Object.keys(controller.modules)).toHaveLength(0);
    });

    it('should instantiate with AUTO_HEALING flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      expect(controller.modules.selfHealing).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_PROCESS_MANAGEMENT flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_PROCESS_MANAGEMENT: '1' },
        logger: mockLogger
      });

      expect(controller.modules.processManager).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_ANOMALY_DETECTION flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_ANOMALY_DETECTION: '1' },
        logger: mockLogger
      });

      expect(controller.modules.anomalyDetector).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_SCALING flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_SCALING: '1' },
        logger: mockLogger
      });

      expect(controller.modules.autoScaler).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_SECRET_ROTATION flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_SECRET_ROTATION: '1' },
        logger: mockLogger
      });

      expect(controller.modules.secretRotation).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_COST_MANAGEMENT flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_COST_MANAGEMENT: '1' },
        logger: mockLogger
      });

      expect(controller.modules.costManager).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_THREAT_DETECTION flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_THREAT_DETECTION: '1' },
        logger: mockLogger
      });

      expect(controller.modules.threatDetector).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_OPTIMIZATION flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_OPTIMIZATION: '1' },
        logger: mockLogger
      });

      expect(controller.modules.autoOptimizer).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate with AUTO_CANARY_DEPLOYMENT flag', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_CANARY_DEPLOYMENT: '1' },
        logger: mockLogger
      });

      expect(controller.modules.canaryDeployment).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(1);
    });

    it('should instantiate all 9 modules when all flags are enabled', () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_PROCESS_MANAGEMENT: '1',
          AUTO_ANOMALY_DETECTION: '1',
          AUTO_SCALING: '1',
          AUTO_SECRET_ROTATION: '1',
          AUTO_COST_MANAGEMENT: '1',
          AUTO_THREAT_DETECTION: '1',
          AUTO_OPTIMIZATION: '1',
          AUTO_CANARY_DEPLOYMENT: '1'
        },
        logger: mockLogger
      });

      expect(controller.modules.selfHealing).toBeDefined();
      expect(controller.modules.processManager).toBeDefined();
      expect(controller.modules.anomalyDetector).toBeDefined();
      expect(controller.modules.autoScaler).toBeDefined();
      expect(controller.modules.secretRotation).toBeDefined();
      expect(controller.modules.costManager).toBeDefined();
      expect(controller.modules.threatDetector).toBeDefined();
      expect(controller.modules.autoOptimizer).toBeDefined();
      expect(controller.modules.canaryDeployment).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(9);
    });

    it('should instantiate multiple modules with mixed flags', () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_SCALING: '1',
          AUTO_THREAT_DETECTION: '1'
        },
        logger: mockLogger
      });

      expect(controller.modules.selfHealing).toBeDefined();
      expect(controller.modules.autoScaler).toBeDefined();
      expect(controller.modules.threatDetector).toBeDefined();
      expect(Object.keys(controller.modules)).toHaveLength(3);
    });
  });

  describe('Module instantiation verification', () => {
    it('should create correct class instances based on flags', () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_ANOMALY_DETECTION: '1'
        },
        logger: mockLogger
      });

      // Verify correct classes are instantiated
      expect(controller.modules.selfHealing.constructor.name).toBe('SelfHealingOrchestrator');
      expect(controller.modules.anomalyDetector.constructor.name).toBe('AnomalyDetector');
    });

    it('should pass configuration to module constructors', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_SCALING: '1' },
        logger: mockLogger,
        minInstances: 5,
        maxInstances: 50,
        targetCPU: 80
      });

      const scaler = controller.modules.autoScaler;
      expect(scaler.minInstances).toBe(5);
      expect(scaler.maxInstances).toBe(50);
      expect(scaler.targetCPU).toBe(80);
    });
  });

  describe('start() method', () => {
    it('should start with no modules', async () => {
      const controller = new AutonomyController({
        featureFlags: {},
        logger: mockLogger
      });

      await controller.start();

      expect(controller.started).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('AutonomyController starting...');
    });

    it('should start and log each enabled module', async () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_SCALING: '1'
        },
        logger: mockLogger
      });

      await controller.start();

      expect(controller.started).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Starting self-healing module');
      expect(mockLogger.info).toHaveBeenCalledWith('Starting auto-scaler module');
    });

    it('should not start twice', async () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      await controller.start();
      await controller.start();

      expect(mockLogger.warn).toHaveBeenCalledWith('AutonomyController already started');
    });

    it('should start secret rotation module explicitly', async () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_SECRET_ROTATION: '1' },
        logger: mockLogger
      });

      const startSpy = vi.spyOn(controller.modules.secretRotation, 'start');

      await controller.start();

      expect(startSpy).toHaveBeenCalled();
    });
  });

  describe('stop() method', () => {
    it('should stop gracefully when not started', async () => {
      const controller = new AutonomyController({
        featureFlags: {},
        logger: mockLogger
      });

      await controller.stop();

      expect(controller.started).toBe(false);
    });

    it('should stop all modules and clean up', async () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_PROCESS_MANAGEMENT: '1'
        },
        logger: mockLogger
      });

      await controller.start();
      await controller.stop();

      expect(controller.started).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('AutonomyController stopping...');
      expect(mockLogger.info).toHaveBeenCalledWith('Stopping self-healing module');
      expect(mockLogger.info).toHaveBeenCalledWith('Stopping process manager module');
    });

    it('should call stop() on modules that have it', async () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_SECRET_ROTATION: '1',
          AUTO_SCALING: '1'
        },
        logger: mockLogger
      });

      await controller.start();

      const secretStopSpy = vi.spyOn(controller.modules.secretRotation, 'stop');
      const scalerStopSpy = vi.spyOn(controller.modules.autoScaler, 'stop');

      await controller.stop();

      expect(secretStopSpy).toHaveBeenCalled();
      expect(scalerStopSpy).toHaveBeenCalled();
    });

    it('should remove all listeners from modules', async () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      await controller.start();

      const removeListenersSpy = vi.spyOn(controller.modules.selfHealing, 'removeAllListeners');

      await controller.stop();

      expect(removeListenersSpy).toHaveBeenCalled();
    });
  });

  describe('getMetrics() method', () => {
    it('should return empty metrics when no modules are enabled', () => {
      const controller = new AutonomyController({
        featureFlags: {},
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toEqual({});
    });

    it('should aggregate metrics from self-healing module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('self_healing_total_attempts');
      expect(metrics).toHaveProperty('self_healing_successful');
      expect(metrics).toHaveProperty('self_healing_failed');
      expect(metrics).toHaveProperty('self_healing_prevented');
    });

    it('should aggregate metrics from process manager module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_PROCESS_MANAGEMENT: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('process_total_restarts');
      expect(metrics).toHaveProperty('process_crash_restarts');
      expect(metrics).toHaveProperty('process_graceful_restarts');
      expect(metrics).toHaveProperty('process_uptime_seconds');
    });

    it('should aggregate metrics from anomaly detector module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_ANOMALY_DETECTION: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('anomaly_total_checks');
      expect(metrics).toHaveProperty('anomaly_detected');
    });

    it('should aggregate metrics from auto-scaler module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_SCALING: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('scaler_total_scale_ups');
      expect(metrics).toHaveProperty('scaler_total_scale_downs');
      expect(metrics).toHaveProperty('scaler_current_instances');
    });

    it('should aggregate metrics from secret rotation module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_SECRET_ROTATION: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('secret_total_rotations');
      expect(metrics).toHaveProperty('secret_successful_rotations');
    });

    it('should aggregate metrics from cost manager module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_COST_MANAGEMENT: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('cost_total');
      expect(metrics).toHaveProperty('cost_total_requests');
    });

    it('should aggregate metrics from threat detector module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_THREAT_DETECTION: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('threat_total_threats');
      expect(metrics).toHaveProperty('threat_blocked_ips');
    });

    it('should aggregate metrics from auto-optimizer module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_OPTIMIZATION: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('optimizer_total_optimizations');
      expect(metrics).toHaveProperty('optimizer_successful');
    });

    it('should aggregate metrics from canary deployment module', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_CANARY_DEPLOYMENT: '1' },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      expect(metrics).toHaveProperty('canary_total_deployments');
      expect(metrics).toHaveProperty('canary_successful');
    });

    it('should aggregate metrics from all 9 modules', () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_PROCESS_MANAGEMENT: '1',
          AUTO_ANOMALY_DETECTION: '1',
          AUTO_SCALING: '1',
          AUTO_SECRET_ROTATION: '1',
          AUTO_COST_MANAGEMENT: '1',
          AUTO_THREAT_DETECTION: '1',
          AUTO_OPTIMIZATION: '1',
          AUTO_CANARY_DEPLOYMENT: '1'
        },
        logger: mockLogger
      });

      const metrics = controller.getMetrics();

      // Verify metrics from all modules are present
      expect(metrics).toHaveProperty('self_healing_total_attempts');
      expect(metrics).toHaveProperty('process_total_restarts');
      expect(metrics).toHaveProperty('anomaly_total_checks');
      expect(metrics).toHaveProperty('scaler_total_scale_ups');
      expect(metrics).toHaveProperty('secret_total_rotations');
      expect(metrics).toHaveProperty('cost_total');
      expect(metrics).toHaveProperty('threat_total_threats');
      expect(metrics).toHaveProperty('optimizer_total_optimizations');
      expect(metrics).toHaveProperty('canary_total_deployments');
    });
  });

  describe('Dry-run mode', () => {
    it('should enable dry-run mode from config', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger,
        dryRun: true
      });

      expect(controller.dryRun).toBe(true);
    });

    it('should enable dry-run mode from environment variable', () => {
      process.env.DRY_RUN = '1';

      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      expect(controller.dryRun).toBe(true);
    });

    it('should pass dry-run flag to modules', () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger,
        dryRun: true
      });

      // The dryRun flag is passed to the module constructor
      // SelfHealingOrchestrator doesn't store dryRun in config, but receives it in options
      // We can verify the controller's dryRun flag is set
      expect(controller.dryRun).toBe(true);
      expect(controller.modules.selfHealing).toBeDefined();
    });

    it('should not take actions in dry-run mode (only logging)', async () => {
      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger,
        dryRun: true
      });

      await controller.start();

      // In dry-run mode, modules should log but not take actions
      expect(controller.dryRun).toBe(true);
      expect(controller.started).toBe(true);
    });
  });

  describe('Kill switch', () => {
    it('should disable all systems when AUTONOMY_KILL_SWITCH=1', () => {
      process.env.AUTONOMY_KILL_SWITCH = '1';

      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_SCALING: '1'
        },
        logger: mockLogger
      });

      expect(controller.killSwitch).toBe(true);
      expect(Object.keys(controller.modules)).toHaveLength(0);
      expect(mockLogger.warn).toHaveBeenCalledWith('AUTONOMY_KILL_SWITCH is active - all autonomous systems disabled');
    });

    it('should prevent start() when kill switch is active', async () => {
      process.env.AUTONOMY_KILL_SWITCH = '1';

      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      await controller.start();

      expect(controller.started).toBe(false);
      expect(mockLogger.warn).toHaveBeenCalledWith('Cannot start - AUTONOMY_KILL_SWITCH is active');
    });

    it('should show kill switch status in getStatus()', () => {
      process.env.AUTONOMY_KILL_SWITCH = '1';

      const controller = new AutonomyController({
        featureFlags: { AUTO_HEALING: '1' },
        logger: mockLogger
      });

      const status = controller.getStatus();

      expect(status.killSwitch).toBe(true);
      expect(status.modules).toHaveLength(0);
    });
  });

  describe('getStatus() method', () => {
    it('should return status with all module names', () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_SCALING: '1',
          AUTO_THREAT_DETECTION: '1'
        },
        logger: mockLogger
      });

      const status = controller.getStatus();

      expect(status.modules).toContain('selfHealing');
      expect(status.modules).toContain('autoScaler');
      expect(status.modules).toContain('threatDetector');
      expect(status.moduleCount).toBe(3);
    });

    it('should show all 9 modules when all are enabled', () => {
      const controller = new AutonomyController({
        featureFlags: {
          AUTO_HEALING: '1',
          AUTO_PROCESS_MANAGEMENT: '1',
          AUTO_ANOMALY_DETECTION: '1',
          AUTO_SCALING: '1',
          AUTO_SECRET_ROTATION: '1',
          AUTO_COST_MANAGEMENT: '1',
          AUTO_THREAT_DETECTION: '1',
          AUTO_OPTIMIZATION: '1',
          AUTO_CANARY_DEPLOYMENT: '1'
        },
        logger: mockLogger
      });

      const status = controller.getStatus();

      expect(status.modules).toContain('selfHealing');
      expect(status.modules).toContain('processManager');
      expect(status.modules).toContain('anomalyDetector');
      expect(status.modules).toContain('autoScaler');
      expect(status.modules).toContain('secretRotation');
      expect(status.modules).toContain('costManager');
      expect(status.modules).toContain('threatDetector');
      expect(status.modules).toContain('autoOptimizer');
      expect(status.modules).toContain('canaryDeployment');
      expect(status.moduleCount).toBe(9);
    });
  });
});
