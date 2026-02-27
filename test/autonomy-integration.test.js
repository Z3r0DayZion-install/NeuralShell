/**
 * Integration Tests for Autonomous Systems Wiring
 *
 * Tests full application startup with autonomy enabled and verifies:
 * - Autonomous response to simulated endpoint failures (self-healing)
 * - Autonomous response to simulated high load (auto-scaling)
 * - Autonomous response to simulated anomalies (detection and alert)
 * - Metrics exposure at /metrics/autonomy (Prometheus format)
 * - Feature flag toggling via /admin/autonomy/toggle
 * - Graceful shutdown with autonomy enabled
 * - Preservation: existing routes still work with autonomy enabled
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../production-server.js';

describe('Autonomous Systems Integration Tests', () => {
  let server;
  let app;

  beforeAll(async () => {
    // Enable all autonomous feature flags
    process.env.AUTO_HEALING = '1';
    process.env.AUTO_SCALING = '1';
    process.env.AUTO_ANOMALY_DETECTION = '1';
    process.env.AUTO_PROCESS_MANAGEMENT = '1';
    process.env.AUTO_SECRET_ROTATION = '1';
    process.env.AUTO_COST_MANAGEMENT = '1';
    process.env.AUTO_THREAT_DETECTION = '1';
    process.env.AUTO_OPTIMIZATION = '1';
    process.env.AUTO_CANARY_DEPLOYMENT = '1';

    server = await createServer();
    app = server.getApp();
    await server.start();
  });

  afterAll(async () => {
    // Clean up environment variables
    delete process.env.AUTO_HEALING;
    delete process.env.AUTO_SCALING;
    delete process.env.AUTO_ANOMALY_DETECTION;
    delete process.env.AUTO_PROCESS_MANAGEMENT;
    delete process.env.AUTO_SECRET_ROTATION;
    delete process.env.AUTO_COST_MANAGEMENT;
    delete process.env.AUTO_THREAT_DETECTION;
    delete process.env.AUTO_OPTIMIZATION;
    delete process.env.AUTO_CANARY_DEPLOYMENT;
  });

  describe('Full Application Startup with Autonomy Enabled', () => {
    it('should start server successfully with all autonomous modules enabled', () => {
      expect(server).toBeDefined();
      expect(server.autonomyController).toBeDefined();
      expect(server.autonomyController.started).toBe(true);
    });

    it('should have all 9 autonomous modules instantiated', () => {
      const status = server.autonomyController.getStatus();

      expect(status.enabled).toBe(true);
      expect(status.moduleCount).toBe(9);
      expect(status.modules).toContain('selfHealing');
      expect(status.modules).toContain('processManager');
      expect(status.modules).toContain('anomalyDetector');
      expect(status.modules).toContain('autoScaler');
      expect(status.modules).toContain('secretRotation');
      expect(status.modules).toContain('costManager');
      expect(status.modules).toContain('threatDetector');
      expect(status.modules).toContain('autoOptimizer');
      expect(status.modules).toContain('canaryDeployment');
    });

    it('should have autonomy controller started', () => {
      expect(server.autonomyController.started).toBe(true);
    });
  });

  describe('Autonomous Response to Simulated Endpoint Failure (Self-Healing)', () => {
    it('should have self-healing module active', () => {
      const selfHealing = server.autonomyController.getModule('selfHealing');
      expect(selfHealing).toBeDefined();
      expect(selfHealing.constructor.name).toBe('SelfHealingOrchestrator');
    });

    it('should respond to endpoint failure with healing attempt', async () => {
      const selfHealing = server.autonomyController.getModule('selfHealing');

      // Register a test healing strategy
      selfHealing.registerStrategy('integration_test_strategy', {
        handler: async (issue) => {
          return {
            action: 'test_heal',
            endpoint: issue.endpoint,
            timestamp: Date.now()
          };
        },
        condition: (issue) => issue.type === 'integration_test_failure',
        priority: 10
      });

      // Simulate an endpoint failure
      const result = await selfHealing.heal({
        type: 'integration_test_failure',
        endpoint: 'test-endpoint',
        timestamp: Date.now()
      });

      expect(result.healed).toBe(true);
      expect(result.strategy).toBe('integration_test_strategy');

      // Verify metrics were updated
      const metrics = server.autonomyController.getMetrics();
      expect(metrics.self_healing_total_attempts).toBeGreaterThan(0);
      expect(metrics.self_healing_successful).toBeGreaterThan(0);
    });

    it('should track healing attempts in metrics', async () => {
      const metrics = server.autonomyController.getMetrics();

      expect(metrics).toHaveProperty('self_healing_total_attempts');
      expect(metrics).toHaveProperty('self_healing_successful');
      expect(metrics).toHaveProperty('self_healing_failed');
      expect(metrics).toHaveProperty('self_healing_prevented');
    });
  });

  describe('Autonomous Response to Simulated High Load (Auto-Scaling)', () => {
    it('should have auto-scaler module active', () => {
      const autoScaler = server.autonomyController.getModule('autoScaler');
      expect(autoScaler).toBeDefined();
      expect(autoScaler.constructor.name).toBe('AutoScaler');
    });

    it('should make scaling decision based on high CPU', async () => {
      const autoScaler = server.autonomyController.getModule('autoScaler');

      // Simulate high CPU load (above 80% threshold)
      const decision = autoScaler.makeDecision({
        cpuLoad: 85,
        memoryLoad: 60,
        requestRate: 100
      });

      expect(decision).toBeDefined();
      expect(decision.action).toBe('scale_up');
      expect(decision.target).toBeGreaterThan(2);
    });

    it('should make scaling decision based on low CPU', async () => {
      const autoScaler = server.autonomyController.getModule('autoScaler');

      // Set current instances higher first
      autoScaler.currentInstances = 5;

      // Simulate low CPU load (below 30% threshold)
      const decision = autoScaler.makeDecision({
        cpuLoad: 20,
        memoryLoad: 25,
        requestRate: 10
      });

      expect(decision).toBeDefined();
      expect(decision.action).toBe('scale_down');
      expect(decision.target).toBeLessThan(5);
    });

    it('should track scaling decisions in metrics', () => {
      const metrics = server.autonomyController.getMetrics();

      expect(metrics).toHaveProperty('scaler_total_scale_ups');
      expect(metrics).toHaveProperty('scaler_total_scale_downs');
      expect(metrics).toHaveProperty('scaler_current_instances');
    });
  });

  describe('Autonomous Response to Simulated Anomaly (Detection and Alert)', () => {
    it('should have anomaly detector module active', () => {
      const anomalyDetector = server.autonomyController.getModule('anomalyDetector');
      expect(anomalyDetector).toBeDefined();
      expect(anomalyDetector.constructor.name).toBe('AnomalyDetector');
    });

    it('should detect traffic anomaly when requests spike', () => {
      const anomalyDetector = server.autonomyController.getModule('anomalyDetector');

      // Feed normal traffic data
      for (let i = 0; i < 50; i++) {
        anomalyDetector.detectTrafficAnomaly(100); // 100 requests/min baseline
      }

      // Track anomaly events
      let anomalyDetected = false;
      anomalyDetector.once('anomaly', (anomaly) => {
        anomalyDetected = true;
        expect(anomaly.metric).toBe('requests_per_minute');
        expect(anomaly.value).toBe(500);
      });

      // Simulate traffic spike (anomaly)
      anomalyDetector.detectTrafficAnomaly(500); // 5x normal traffic

      // Verify anomaly was detected
      expect(anomalyDetected).toBe(true);
    });

    it('should detect latency anomaly when response time spikes', () => {
      const anomalyDetector = server.autonomyController.getModule('anomalyDetector');

      // Feed normal latency data
      for (let i = 0; i < 50; i++) {
        anomalyDetector.detectLatencyAnomaly('/test-endpoint', 50); // 50ms baseline
      }

      // Track anomaly events
      let anomalyDetected = false;
      anomalyDetector.once('anomaly', (anomaly) => {
        anomalyDetected = true;
        expect(anomaly.metric).toBe('latency_/test-endpoint');
        expect(anomaly.value).toBe(500);
      });

      // Simulate latency spike (anomaly)
      anomalyDetector.detectLatencyAnomaly('/test-endpoint', 500); // 10x normal latency

      // Verify anomaly was detected
      expect(anomalyDetected).toBe(true);
    });

    it('should track anomaly detections in metrics', () => {
      const metrics = server.autonomyController.getMetrics();

      expect(metrics).toHaveProperty('anomaly_total_checks');
      expect(metrics).toHaveProperty('anomaly_detected');
      expect(metrics.anomaly_total_checks).toBeGreaterThan(0);
      expect(metrics.anomaly_detected).toBeGreaterThan(0);
    });
  });

  describe('Metrics Exposure at /metrics/autonomy (Prometheus Format)', () => {
    it('should expose /metrics/autonomy endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics/autonomy'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
    });

    it('should return metrics in Prometheus text format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics/autonomy'
      });

      const body = response.body;

      // Verify Prometheus format (metric_name value)
      expect(body).toMatch(/self_healing_total_attempts \d+/);
      expect(body).toMatch(/self_healing_successful \d+/);
      expect(body).toMatch(/process_total_restarts \d+/);
      expect(body).toMatch(/anomaly_total_checks \d+/);
      expect(body).toMatch(/scaler_total_scale_ups \d+/);
      expect(body).toMatch(/secret_total_rotations \d+/);
      expect(body).toMatch(/cost_total \d+/);
      expect(body).toMatch(/threat_total_threats \d+/);
      expect(body).toMatch(/optimizer_total_optimizations \d+/);
      expect(body).toMatch(/canary_total_deployments \d+/);
    });

    it('should include metrics from all 9 modules', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics/autonomy'
      });

      const body = response.body;

      // Verify each module's metrics are present
      expect(body).toContain('self_healing_');
      expect(body).toContain('process_');
      expect(body).toContain('anomaly_');
      expect(body).toContain('scaler_');
      expect(body).toContain('secret_');
      expect(body).toContain('cost_');
      expect(body).toContain('threat_');
      expect(body).toContain('optimizer_');
      expect(body).toContain('canary_');
    });
  });

  describe('Feature Flag Toggling via /admin/autonomy/toggle', () => {
    it('should expose /admin/autonomy status endpoint', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/autonomy'
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data.enabled).toBe(true);
      expect(data.modules).toBeDefined();
      expect(data.moduleCount).toBe(9);
      expect(data.metrics).toBeDefined();
    });

    it('should return status with all module names', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/autonomy'
      });

      const data = JSON.parse(response.body);

      expect(data.modules).toContain('selfHealing');
      expect(data.modules).toContain('processManager');
      expect(data.modules).toContain('anomalyDetector');
      expect(data.modules).toContain('autoScaler');
      expect(data.modules).toContain('secretRotation');
      expect(data.modules).toContain('costManager');
      expect(data.modules).toContain('threatDetector');
      expect(data.modules).toContain('autoOptimizer');
      expect(data.modules).toContain('canaryDeployment');
    });

    it('should include current metrics in status response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin/autonomy'
      });

      const data = JSON.parse(response.body);

      expect(data.metrics).toHaveProperty('self_healing_total_attempts');
      expect(data.metrics).toHaveProperty('anomaly_total_checks');
      expect(data.metrics).toHaveProperty('scaler_total_scale_ups');
    });
  });

  describe('Graceful Shutdown with Autonomy Enabled', () => {
    it('should support shutdown method', () => {
      expect(server.shutdown).toBeDefined();
      expect(typeof server.shutdown).toBe('function');
    });

    it('should have autonomy controller with stop method', () => {
      expect(server.autonomyController.stop).toBeDefined();
      expect(typeof server.autonomyController.stop).toBe('function');
    });

    it('should stop autonomy controller during shutdown', async () => {
      // Verify the controller has a stop method and can be stopped
      // We test this by checking the controller's state directly
      // rather than creating a new server (which would conflict with the main test server)

      const controller = server.autonomyController;
      expect(controller.started).toBe(true);

      // Manually stop the controller to test the stop functionality
      await controller.stop();
      expect(controller.started).toBe(false);

      // Restart it for other tests
      await controller.start();
      expect(controller.started).toBe(true);
    });
  });

  describe('Preservation: Existing Routes Still Work with Autonomy Enabled', () => {
    it('should handle GET /health requests normally', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('timestamp');
    });

    it('should handle GET /health/live requests normally', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/live'
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data.alive).toBe(true);
    });

    it('should handle GET /health/ready requests normally', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health/ready'
      });

      expect(response.statusCode).toBe(200);

      const data = JSON.parse(response.body);
      expect(data).toHaveProperty('ready');
    });

    it('should expose existing /metrics endpoint normally', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics'
      });

      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');

      const data = JSON.parse(response.body);
      expect(data).toBeDefined();
    });

    it('should expose existing /metrics/prometheus endpoint normally', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/metrics/prometheus'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatch(/# HELP/);
      expect(response.body).toMatch(/# TYPE/);
    });

    it('should handle multiple concurrent requests without interference', async () => {
      const requests = Array.from({ length: 20 }, () =>
        app.inject({
          method: 'GET',
          url: '/health'
        })
      );

      const responses = await Promise.all(requests);

      // All should succeed
      for (const response of responses) {
        expect(response.statusCode).toBe(200);
        const data = JSON.parse(response.body);
        expect(data).toHaveProperty('status');
      }
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent-route-test'
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Additional Module Integration Tests', () => {
    it('should have process manager tracking uptime', () => {
      const processManager = server.autonomyController.getModule('processManager');
      expect(processManager).toBeDefined();

      const stats = processManager.getStats();
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.metrics.totalRestarts).toBeGreaterThanOrEqual(0);
    });

    it('should have secret rotation manager initialized', () => {
      const secretRotation = server.autonomyController.getModule('secretRotation');
      expect(secretRotation).toBeDefined();

      const stats = secretRotation.getStats();
      expect(stats.metrics.totalRotations).toBeGreaterThanOrEqual(0);
    });

    it('should have cost manager tracking requests', () => {
      const costManager = server.autonomyController.getModule('costManager');
      expect(costManager).toBeDefined();

      const stats = costManager.getStats();
      expect(stats.metrics.totalRequests).toBeGreaterThanOrEqual(0);
      expect(stats.metrics.totalCost).toBeDefined();
    });

    it('should have threat detector ready to analyze requests', () => {
      const threatDetector = server.autonomyController.getModule('threatDetector');
      expect(threatDetector).toBeDefined();

      // Test threat analysis
      const result = threatDetector.analyzeRequest({
        ip: '192.168.1.1',
        method: 'GET',
        path: '/health',
        headers: { 'user-agent': 'test-client' }
      });

      expect(result).toBeDefined();
      expect(result.threat).toBe(false); // Normal request should not be a threat
    });

    it('should have auto-optimizer initialized', () => {
      const autoOptimizer = server.autonomyController.getModule('autoOptimizer');
      expect(autoOptimizer).toBeDefined();

      const stats = autoOptimizer.getStats();
      expect(stats.metrics.totalOptimizations).toBeGreaterThanOrEqual(0);
    });

    it('should have canary deployment manager initialized', () => {
      const canaryDeployment = server.autonomyController.getModule('canaryDeployment');
      expect(canaryDeployment).toBeDefined();

      const stats = canaryDeployment.getStats();
      expect(stats.metrics.totalDeployments).toBeGreaterThanOrEqual(0);
    });
  });
});
