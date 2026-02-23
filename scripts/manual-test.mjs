#!/usr/bin/env node

import { buildServer } from '../router.js';
import fetch from 'node-fetch';

process.env.DRY_RUN = '1';
process.env.AUTO_HEALING = '1';
process.env.AUTO_SCALING = '1';
process.env.AUTO_ANOMALY_DETECTION = '1';
process.env.AUTO_THREAT_DETECTION = '1';
process.env.AUTO_COST_MANAGEMENT = '1';

console.log('='.repeat(70));
console.log('PHASE 2 PROOF OF EXECUTION - Manual Test');
console.log('='.repeat(70));

const server = buildServer();

await server.listen({ port: 0, host: '127.0.0.1' });
const port = server.server.address().port;

console.log(`\nServer started on port ${port}`);
console.log(`DRY_RUN: ${process.env.DRY_RUN}`);

// Test metrics endpoint
console.log('\nFetching /metrics/autonomy...\n');
const response = await fetch(`http://127.0.0.1:${port}/metrics/autonomy`);
const metrics = await response.text();
console.log(metrics);

// Test self-healing
console.log('\n--- Testing Self-Healing ---');
const controller = server.autonomyController;
if (controller && controller.isModuleEnabled('selfHealing')) {
  const selfHealing = controller.getModule('selfHealing');
  selfHealing.registerStrategy('test_restart', {
    handler: async (issue) => ({ action: 'restarted', endpoint: issue.endpoint }),
    condition: (issue) => issue.type === 'endpoint_failure',
    priority: 8
  });
  
  const result = await selfHealing.heal({
    type: 'endpoint_failure',
    endpoint: 'test-endpoint',
    error: 'timeout',
    timestamp: Date.now()
  });
  
  console.log(`Self-healing result: ${result.healed ? 'PASS' : 'FAIL'}`);
} else {
  console.log('Self-healing: NOT ENABLED');
}

// Test auto-scaler
console.log('\n--- Testing Auto-Scaler ---');
if (controller && controller.isModuleEnabled('autoScaler')) {
  const autoScaler = controller.getModule('autoScaler');
  const decision = await autoScaler.evaluate({
    cpu: 85,
    memory: 75,
    requestRate: 1000,
    avgLatency: 250
  });
  console.log(`Auto-scaler decision: ${decision.action} - ${decision.action !== 'error' ? 'PASS' : 'FAIL'}`);
} else {
  console.log('Auto-scaler: NOT ENABLED');
}

// Test threat detector
console.log('\n--- Testing Threat Detector ---');
if (controller && controller.isModuleEnabled('threatDetector')) {
  const threatDetector = controller.getModule('threatDetector');
  const result = threatDetector.analyzeRequest({
    ip: '192.168.1.100',
    method: 'POST',
    path: '/prompt',
    headers: { 'user-agent': 'sqlmap/1.0' },
    body: { messages: [{ role: 'user', content: "'; DROP TABLE users; --" }] }
  });
  console.log(`Threat detector: ${result.threat ? 'PASS' : 'FAIL'}`);
} else {
  console.log('Threat detector: NOT ENABLED');
}

// Test cost manager
console.log('\n--- Testing Cost Manager ---');
if (controller && controller.isModuleEnabled('costManager')) {
  const costManager = controller.getModule('costManager');
  costManager.registerEndpoint('test-endpoint', {
    costPer1kInput: 0.03,
    costPer1kOutput: 0.06
  });
  costManager.trackRequest('test-endpoint', {
    inputTokens: 1000,
    outputTokens: 2000
  });
  const stats = costManager.getStats();
  console.log(`Cost manager: ${stats.metrics.totalRequests > 0 ? 'PASS' : 'FAIL'}`);
} else {
  console.log('Cost manager: NOT ENABLED');
}

console.log('\n' + '='.repeat(70));
console.log('Test complete');
console.log('='.repeat(70));

await server.close();
process.exit(0);
