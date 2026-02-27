/**
 * End-to-End Test for Self-Healing Wiring
 *
 * Tests that the self-healing module is properly wired into production-server.js
 * and responds to system events.
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { NeuralShellServer } from '../production-server.js';

describe('Self-Healing End-to-End Wiring', () => {
  let server;
  let app;

  beforeEach(async () => {
    // Set AUTO_HEALING flag
    process.env.AUTO_HEALING = '1';

    // Create and initialize server
    server = new NeuralShellServer();
    await server.initialize();
    app = server.getApp();
  });

  afterEach(async () => {
    await server.shutdown();
    delete process.env.AUTO_HEALING;
  });

  it('should have autonomyController initialized when AUTO_HEALING=1', () => {
    assert.ok(server.autonomyController, 'AutonomyController should be initialized');
    assert.ok(server.autonomyController.started, 'AutonomyController should be started');
  });

  it('should include selfHealing in modules array at /admin/autonomy', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/admin/autonomy'
    });

    assert.strictEqual(response.statusCode, 200, 'Should return 200 OK');

    const data = JSON.parse(response.body);
    assert.ok(data.enabled, 'Autonomy should be enabled');
    assert.ok(Array.isArray(data.modules), 'Should have modules array');
    assert.ok(data.modules.includes('selfHealing'), 'Should include selfHealing in modules');
  });

  it('should expose self_healing_* metrics at /metrics/autonomy', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/metrics/autonomy'
    });

    assert.strictEqual(response.statusCode, 200, 'Should return 200 OK');
    assert.strictEqual(response.headers['content-type'], 'text/plain; charset=utf-8', 'Should return text/plain');

    const body = response.body;
    assert.ok(body.includes('self_healing_total_attempts'), 'Should include self_healing_total_attempts metric');
    assert.ok(body.includes('self_healing_successful'), 'Should include self_healing_successful metric');
    assert.ok(body.includes('self_healing_failed'), 'Should include self_healing_failed metric');
    assert.ok(body.includes('self_healing_prevented'), 'Should include self_healing_prevented metric');
  });

  it('should trigger self-healing response when heal() is called', async () => {
    const selfHealing = server.autonomyController.modules.selfHealing;
    assert.ok(selfHealing, 'Self-healing module should exist');

    // Register a test healing strategy
    selfHealing.registerStrategy('test_strategy', {
      handler: async (issue) => {
        return { action: 'test_heal', endpoint: issue.endpoint };
      },
      condition: (issue) => issue.type === 'test_failure',
      priority: 10
    });

    // Simulate an endpoint failure
    const result = await selfHealing.heal({
      type: 'test_failure',
      endpoint: 'test-endpoint',
      timestamp: Date.now()
    });

    assert.ok(result.healed, 'Should successfully heal the issue');
    assert.strictEqual(result.strategy, 'test_strategy', 'Should use test_strategy');

    // Verify metrics were updated
    const stats = selfHealing.getStats();
    assert.ok(stats.metrics.totalHealingAttempts > 0, 'Should have healing attempts');
    assert.ok(stats.metrics.successfulHeals > 0, 'Should have successful heals');
  });

  it('should log healing action when self-healing responds', async () => {
    const selfHealing = server.autonomyController.modules.selfHealing;

    // Track healing events
    let healingEventReceived = false;
    selfHealing.once('healed', (data) => {
      healingEventReceived = true;
      assert.ok(data.issue, 'Event should include issue');
      assert.ok(data.strategy, 'Event should include strategy name');
      assert.ok(data.result, 'Event should include result');
    });

    // Register a test strategy
    selfHealing.registerStrategy('event_test', {
      handler: async (issue) => {
        return { action: 'event_test_heal' };
      },
      condition: (issue) => issue.type === 'event_test',
      priority: 10
    });

    // Trigger healing
    await selfHealing.heal({
      type: 'event_test',
      endpoint: 'test-endpoint'
    });

    assert.ok(healingEventReceived, 'Should emit healed event');
  });

  it('should respect cooldown period between healing attempts', async () => {
    const selfHealing = server.autonomyController.modules.selfHealing;

    // Register a test strategy
    selfHealing.registerStrategy('cooldown_test', {
      handler: async (issue) => {
        return { action: 'cooldown_test_heal' };
      },
      condition: (issue) => issue.type === 'cooldown_test',
      priority: 10
    });

    // First healing attempt
    const result1 = await selfHealing.heal({
      type: 'cooldown_test',
      endpoint: 'test-endpoint'
    });
    assert.ok(result1.healed, 'First attempt should succeed');

    // Second attempt immediately (should be prevented by cooldown)
    const result2 = await selfHealing.heal({
      type: 'cooldown_test',
      endpoint: 'test-endpoint'
    });
    assert.strictEqual(result2.healed, false, 'Second attempt should be prevented');
    assert.strictEqual(result2.reason, 'cooldown_active', 'Should be prevented by cooldown');

    // Verify prevented heals metric
    const stats = selfHealing.getStats();
    assert.ok(stats.metrics.preventedHeals > 0, 'Should have prevented heals');
  });

  it('should return 503 when autonomy is not enabled', async () => {
    // Create server without AUTO_HEALING
    delete process.env.AUTO_HEALING;
    const serverNoAutonomy = new NeuralShellServer();
    await serverNoAutonomy.initialize();
    const appNoAutonomy = serverNoAutonomy.getApp();

    const response = await appNoAutonomy.inject({
      method: 'GET',
      url: '/admin/autonomy'
    });

    assert.strictEqual(response.statusCode, 503, 'Should return 503 when autonomy not enabled');

    const data = JSON.parse(response.body);
    assert.strictEqual(data.error, 'AUTONOMY_NOT_ENABLED', 'Should return AUTONOMY_NOT_ENABLED error');

    await serverNoAutonomy.shutdown();
  });
});
