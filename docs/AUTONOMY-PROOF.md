# Autonomous Systems Proof of Functionality

This document provides step-by-step instructions to demonstrate that NeuralShell's autonomous systems are properly wired and operational.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Running the Demo](#running-the-demo)
5. [Expected Output](#expected-output)
6. [Verification Steps](#verification-steps)
7. [Troubleshooting](#troubleshooting)
8. [Manual Testing](#manual-testing)

## Overview

The autonomous systems demo script (`scripts/demo-autonomy.mjs`) simulates various failure scenarios and demonstrates that the autonomous systems detect and respond appropriately. The demo tests:

- **Self-Healing**: Response to endpoint failures
- **Anomaly Detection**: Detection of traffic spikes and unusual patterns
- **Auto-Scaling**: Scaling decisions based on load metrics
- **Threat Detection**: Identification of malicious requests
- **Cost Management**: Tracking of API usage and costs

## Prerequisites

Before running the demo, ensure:

1. All autonomous modules are present in `src/router/`:
   - `selfHealing.js`
   - `processManager.js`
   - `anomalyDetector.js`
   - `autoScaler.js`
   - `secretRotation.js`
   - `costManager.js`
   - `threatDetector.js`
   - `autoOptimizer.js`
   - `canaryDeployment.js`

2. The `AutonomyController` is implemented in `src/router/autonomyController.js`

3. Node.js version 18 or higher is installed

4. All dependencies are installed: `npm install`

## Setup Instructions

### Environment Variables

The demo script works without environment variables (it uses internal feature flags), but for production use, you can configure autonomous systems using these environment variables:

```bash
# Enable/disable individual autonomous subsystems (1 = enabled, 0 = disabled)
export AUTO_HEALING=1
export AUTO_ANOMALY_DETECTION=1
export AUTO_SCALING=1
export AUTO_THREAT_DETECTION=1
export AUTO_COST_MANAGEMENT=1
export AUTO_PROCESS_MANAGEMENT=1
export AUTO_SECRET_ROTATION=1
export AUTO_OPTIMIZATION=1
export AUTO_CANARY_DEPLOYMENT=1

# Global controls
export DRY_RUN=1                    # Demo mode - logs decisions without taking actions
export AUTONOMY_KILL_SWITCH=0       # Emergency disable all autonomous systems (1 = disabled)
```

### Quick Setup

For the demo, no environment variables are required. The demo script automatically enables all features in dry-run mode.

## Running the Demo

### Basic Demo

Run the demo script from the project root:

```bash
node scripts/demo-autonomy.mjs
```

### With Verbose Logging

To see detailed logs during the demo:

```bash
DEBUG=autonomy:* node scripts/demo-autonomy.mjs
```

### Demo Duration

The demo takes approximately 5-10 seconds to complete and runs the following tests:

1. Self-Healing Response (1-2 seconds)
2. Anomaly Detection (1-2 seconds)
3. Auto-Scaling Decision (1-2 seconds)
4. Threat Detection (1-2 seconds)
5. Cost Management Tracking (1-2 seconds)

## Expected Output

### Successful Demo Output

When all autonomous systems are properly wired, you should see:

```
🤖 Autonomous Systems Demo

This demo simulates failures and shows autonomous responses.

======================================================================
📋 Setup Instructions:
  1. Ensure all autonomous modules are in src/router/
  2. Set environment variables (optional):
     - AUTO_HEALING=1
     - AUTO_ANOMALY_DETECTION=1
     - AUTO_SCALING=1
  3. Run: node scripts/demo-autonomy.mjs

======================================================================

🚀 Starting Autonomous Systems...

📍 Test 1: Self-Healing Response to Endpoint Failure
  Simulating endpoint failure...
  → Self-healing triggered: test_endpoint_restart
  → Healing strategy executed for test-endpoint
  → Healing successful: test_endpoint_restart
  → Total healing attempts: 1
  → Successful heals: 1
  ✅ PASS: Self-healing responded to endpoint failure

📊 Test 2: Anomaly Detection for Traffic Patterns
  Simulating normal traffic, then anomaly...
  → Recording baseline traffic...
  → Simulating traffic spike...
  → Anomaly detected: requests_per_minute
  → Value: 500, Expected: 110.00
  → Z-score: [calculated], Deviation: high
  → Total checks: 51
  → Anomalies detected: 1
  → Anomaly rate: [calculated]
  ✅ PASS: Anomaly detection identified traffic spike

⚖️  Test 3: Auto-Scaling Decision for High Load
  Simulating high CPU load...
  → CPU: 85%, Memory: 75%
  → Request rate: 1000/min
  → Scaling decision: scale_up
  → Instances: 2 → 4
  → Reason: cpu_threshold_exceeded
  → Scale-up decision made
  → Total scale-ups: 1
  → Current instances: 4
  ✅ PASS: Auto-scaling responded to high load

🛡️  Test 4: Threat Detection for Malicious Requests
  Simulating suspicious request patterns...
  → Analyzing request from 192.168.1.100
  → User-Agent: sqlmap/1.0
  → Threat identified: sql_injection
  → Risk score: [calculated]
  → Total threats detected: 1
  ✅ PASS: Threat detection identified malicious request

💰 Test 5: Cost Management Tracking
  Simulating API usage and cost tracking...
  → Tracking requests...
  → Total requests: 10
  → Total tokens: 3000
  → Total cost: 0.0090
  → Cost savings: 0.0000
  ✅ PASS: Cost management tracking requests

======================================================================
📊 Autonomous Systems Demo Results
======================================================================
Total Tests: 5
✅ Passed: 5
❌ Failed: 0
Success Rate: 100.00%
======================================================================

📈 Metrics Summary:
  Self-Healing Attempts: 1
  Anomalies Detected: 1
  Scaling Actions: 1
  Threats Detected: 1
  Total Cost: 0.0090

✨ Expected Output:
  - All subsystems should show PASS
  - Self-healing should respond to endpoint failures
  - Anomaly detection should identify traffic spikes
  - Auto-scaling should make scale-up decisions
  - Threat detection should identify malicious patterns
  - Cost management should track API usage

🔍 Verification Steps:
  1. Check that all tests passed (5/5)
  2. Verify metrics show autonomous activity
  3. Confirm no errors in output
  4. Review logs for autonomous decisions

🛠️  Troubleshooting:
  - If modules not initialized: Check feature flags
  - If tests fail: Review module implementation
  - If no metrics: Ensure modules are started
  - For help: See docs/AUTONOMY-PROOF.md

======================================================================
```

### PASS Criteria

All 5 tests should show `✅ PASS`:

1. ✅ PASS: Self-healing responded to endpoint failure
2. ✅ PASS: Anomaly detection identified traffic spike
3. ✅ PASS: Auto-scaling responded to high load
4. ✅ PASS: Threat detection identified malicious request
5. ✅ PASS: Cost management tracking requests

### Exit Code

- **Exit Code 0**: All tests passed (success)
- **Exit Code 1**: One or more tests failed

## Verification Steps

### 1. Check Demo Results

Verify that the demo script shows 5/5 tests passed:

```bash
node scripts/demo-autonomy.mjs
# Look for: "✅ Passed: 5" and "Success Rate: 100.00%"
```

### 2. Verify Metrics Endpoint

Check that autonomous metrics are exposed:

```bash
# Start the production server
npm start

# In another terminal, query the metrics endpoint
curl http://localhost:3000/metrics/autonomy
```

Expected metrics include:

```
# HELP self_healing_total_attempts Total self-healing attempts
# TYPE self_healing_total_attempts counter
self_healing_total_attempts 1

# HELP anomaly_detected Total anomalies detected
# TYPE anomaly_detected counter
anomaly_detected 1

# HELP scaler_total_scale_ups Total scale-up actions
# TYPE scaler_total_scale_ups counter
scaler_total_scale_ups 1

# HELP threat_total_threats Total threats detected
# TYPE threat_total_threats counter
threat_total_threats 1

# HELP cost_total Total cost tracked
# TYPE cost_total gauge
cost_total 0.009
```

### 3. Check Logs

Review application logs for autonomous decisions:

```bash
# Start server with logging
DEBUG=autonomy:* npm start

# Look for log entries like:
# [INFO] AutonomyController started with 5 modules
# [INFO] Self-healing triggered: endpoint_restart
# [INFO] Anomaly detected: requests_per_minute
# [INFO] Scaling decision: scale_up
# [INFO] Threat detected: sql_injection
```

### 4. Verify Module Initialization

Check that modules are properly initialized:

```bash
# Query the admin endpoint (requires admin token)
curl -H "X-Admin-Token: $ADMIN_TOKEN" \
  http://localhost:3000/admin/autonomy

# Expected response:
{
  "status": "running",
  "modules": {
    "selfHealing": { "enabled": true, "status": "active" },
    "anomalyDetector": { "enabled": true, "status": "active" },
    "autoScaler": { "enabled": true, "status": "active" },
    "threatDetector": { "enabled": true, "status": "active" },
    "costManager": { "enabled": true, "status": "active" }
  },
  "uptime": 12345,
  "metrics": { ... }
}
```

### 5. Run Integration Tests

Verify that integration tests pass:

```bash
# Run autonomous integration tests
npm test test/autonomy-integration.test.js

# Run self-healing E2E tests
npm test test/self-healing-e2e.test.js

# Run all autonomous tests
npm test -- --grep "autonomy|autonomous"
```

All tests should pass with no failures.

## Troubleshooting

### Issue: Modules Not Initialized

**Symptom**: Demo shows "module not initialized" errors

**Possible Causes**:
- AutonomyController not properly imported in production-server.js
- Feature flags not set correctly
- Module files missing or have syntax errors

**Solutions**:

1. Verify AutonomyController is imported:
   ```bash
   grep -n "AutonomyController" production-server.js
   # Should show import statement
   ```

2. Check that modules exist:
   ```bash
   ls -la src/router/{selfHealing,anomalyDetector,autoScaler,threatDetector,costManager}.js
   ```

3. Verify no syntax errors:
   ```bash
   node --check src/router/autonomyController.js
   node --check src/router/selfHealing.js
   # Repeat for all modules
   ```

4. Check feature flags in demo script:
   ```bash
   grep -A 10 "featureFlags:" scripts/demo-autonomy.mjs
   # Should show all flags set to '1'
   ```

### Issue: Tests Fail

**Symptom**: One or more tests show `❌ FAIL`

**Possible Causes**:
- Module implementation incomplete
- Event wiring not working
- Module methods missing or incorrect

**Solutions**:

1. Check which test failed and review the error message
2. Verify the specific module implementation:
   ```bash
   # For self-healing failure:
   node --check src/router/selfHealing.js
   
   # For anomaly detection failure:
   node --check src/router/anomalyDetector.js
   ```

3. Run the demo with verbose logging:
   ```bash
   DEBUG=* node scripts/demo-autonomy.mjs
   ```

4. Check that module methods exist:
   ```javascript
   // For self-healing:
   // - heal(issue)
   // - registerStrategy(name, strategy)
   // - getStats()
   
   // For anomaly detector:
   // - record(metric, value)
   // - getStats()
   
   // For auto-scaler:
   // - evaluate(metrics)
   // - getStats()
   ```

### Issue: No Metrics Exposed

**Symptom**: `/metrics/autonomy` returns 404 or empty response

**Possible Causes**:
- Metrics endpoint not registered in production-server.js
- AutonomyController.getMetrics() not implemented
- Modules not collecting metrics

**Solutions**:

1. Verify metrics endpoint is registered:
   ```bash
   grep -n "/metrics/autonomy" production-server.js
   # Should show route registration
   ```

2. Check AutonomyController has getMetrics():
   ```bash
   grep -n "getMetrics" src/router/autonomyController.js
   ```

3. Verify modules expose metrics:
   ```javascript
   // Each module should have getStats() or getMetrics()
   const stats = module.getStats();
   console.log(stats.metrics); // Should contain metric data
   ```

### Issue: Autonomous Systems Not Starting

**Symptom**: Server starts but autonomous systems don't initialize

**Possible Causes**:
- initializeAutonomy() not called in production-server.js
- AUTONOMY_KILL_SWITCH is set to 1
- Error during initialization

**Solutions**:

1. Check that initializeAutonomy() is called:
   ```bash
   grep -n "initializeAutonomy" production-server.js
   # Should show method definition and call in initialize()
   ```

2. Verify kill switch is not enabled:
   ```bash
   echo $AUTONOMY_KILL_SWITCH
   # Should be empty or 0
   ```

3. Check server logs for initialization errors:
   ```bash
   npm start 2>&1 | grep -i "autonomy\|error"
   ```

4. Verify initialization order:
   ```javascript
   // In production-server.js initialize() method:
   // 1. initializeHealthCheck()
   // 2. initializeAutonomy()  // Should be here
   // 3. registerRoutes()
   ```

### Issue: Demo Script Crashes

**Symptom**: Demo script exits with error before completing

**Possible Causes**:
- Missing dependencies
- Module constructor errors
- Event emitter issues

**Solutions**:

1. Check for missing dependencies:
   ```bash
   npm install
   ```

2. Run with full error stack:
   ```bash
   node scripts/demo-autonomy.mjs 2>&1 | tee demo-error.log
   ```

3. Verify EventEmitter is imported:
   ```bash
   grep -n "EventEmitter" scripts/demo-autonomy.mjs
   ```

4. Check module constructors accept correct parameters:
   ```javascript
   // Each module should accept:
   // - featureFlags or enabled flag
   // - logger object
   // - configuration options
   ```

### Issue: Cooldown Prevents Scaling

**Symptom**: Auto-scaling test shows "cooldown_active" instead of scaling

**Expected Behavior**: This is actually correct behavior if the scaler was recently used

**Solutions**:

1. This is not an error - cooldown prevents scaling flapping
2. The test should pass with message: "Auto-scaling cooldown working correctly"
3. To test actual scaling, wait for cooldown period (default 5 minutes) or reduce cooldown in test:
   ```javascript
   const autoScaler = new AutoScaler({
     cooldownMs: 1000 // 1 second for testing
   });
   ```

### Common Error Messages

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `Cannot find module 'AutonomyController'` | Import path incorrect | Check import statement in production-server.js |
| `module.heal is not a function` | Method not implemented | Implement heal() method in selfHealing.js |
| `Cannot read property 'getStats' of undefined` | Module not initialized | Check feature flags and module instantiation |
| `ECONNREFUSED` | Server not running | Start server with `npm start` |
| `404 Not Found` for `/metrics/autonomy` | Route not registered | Add route in registerRoutes() method |

## Manual Testing

If the automated demo doesn't work, you can manually test each subsystem:

### Manual Self-Healing Test

```javascript
// In Node.js REPL or test script
import { SelfHealingOrchestrator } from './src/router/selfHealing.js';

const healer = new SelfHealingOrchestrator({ enabled: true });

// Register a test strategy
healer.registerStrategy('test', {
  handler: async (issue) => {
    console.log('Healing triggered!');
    return { action: 'healed' };
  },
  condition: (issue) => issue.type === 'test',
  priority: 8
});

// Trigger healing
await healer.heal({ type: 'test', data: 'test data' });

// Check stats
console.log(healer.getStats());
// Should show: totalHealingAttempts: 1, successfulHeals: 1
```

### Manual Anomaly Detection Test

```javascript
import { AnomalyDetector } from './src/router/anomalyDetector.js';

const detector = new AnomalyDetector({ enabled: true });

// Listen for anomalies
detector.on('anomaly', (data) => {
  console.log('Anomaly detected!', data);
});

// Record normal values
for (let i = 0; i < 50; i++) {
  detector.record('test_metric', 100);
}

// Record anomaly
detector.record('test_metric', 500); // Should trigger anomaly event

// Check stats
console.log(detector.getStats());
// Should show: anomaliesDetected: 1
```

### Manual Auto-Scaling Test

```javascript
import { AutoScaler } from './src/router/autoScaler.js';

const scaler = new AutoScaler({ enabled: true, targetCPU: 70 });

// Evaluate high load
const decision = await scaler.evaluate({
  cpu: 85,
  memory: 75,
  requestRate: 1000,
  avgLatency: 250
});

console.log(decision);
// Should show: { action: 'scale_up', ... }

// Check stats
console.log(scaler.getStats());
// Should show: totalScaleUps: 1
```

### Manual Threat Detection Test

```javascript
import { ThreatDetector } from './src/router/threatDetector.js';

const detector = new ThreatDetector({ enabled: true });

// Analyze malicious request
const result = detector.analyzeRequest({
  ip: '192.168.1.100',
  method: 'POST',
  path: '/prompt',
  headers: { 'user-agent': 'sqlmap/1.0' },
  body: { messages: [{ role: 'user', content: "'; DROP TABLE users; --" }] }
});

console.log(result);
// Should show: { threat: true, type: 'sql_injection', ... }

// Check stats
console.log(detector.getStats());
// Should show: totalThreats: 1
```

### Manual Cost Management Test

```javascript
import { CostManager } from './src/router/costManager.js';

const manager = new CostManager({ enabled: true });

// Register endpoint
manager.registerEndpoint('test-api', {
  costPer1kInput: 0.03,
  costPer1kOutput: 0.06
});

// Track requests
for (let i = 0; i < 10; i++) {
  manager.trackRequest('test-api', {
    inputTokens: 100,
    outputTokens: 200
  });
}

// Check stats
console.log(manager.getStats());
// Should show: totalRequests: 10, totalCost: 0.009
```

## Additional Resources

- [Autonomous Systems Guide](./AUTONOMOUS-SYSTEMS.md) - Complete guide to all autonomous features
- [Self-Healing Documentation](./SELF-HEALING.md) - Detailed self-healing procedures
- [Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md) - Production deployment instructions
- [Integration Tests](../test/autonomy-integration.test.js) - Integration test examples
- [Demo Script Source](../scripts/demo-autonomy.mjs) - Demo script implementation

## Support

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/your-org/neuralshell/issues) for similar problems
2. Review the [Autonomous Systems Guide](./AUTONOMOUS-SYSTEMS.md) for detailed configuration
3. Enable debug logging: `DEBUG=autonomy:* npm start`
4. Run integration tests: `npm test test/autonomy-integration.test.js`
5. Create a new issue with:
   - Demo output
   - Error messages
   - Environment details (Node version, OS)
   - Steps to reproduce

## Conclusion

This proof documentation demonstrates that NeuralShell's autonomous systems are:

1. ✅ Properly wired into the production runtime
2. ✅ Responding to simulated failures and events
3. ✅ Exposing metrics for monitoring
4. ✅ Configurable via feature flags
5. ✅ Testable end-to-end

When all tests pass (5/5), the autonomous systems are confirmed operational and ready for production use.
