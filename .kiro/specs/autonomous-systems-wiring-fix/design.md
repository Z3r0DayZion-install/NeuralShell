# Autonomous Systems Wiring Fix Design

## Overview

This design implements a centralized AutonomyController that wires 9 autonomous system modules into the production runtime. The controller provides feature flag control, metrics exposure, and orchestrates autonomous responses to system events. The implementation follows ChatGPT's PHASE A-E instructions with a focus on minimal, testable code that can be demonstrated end-to-end.

## Glossary

- **Bug_Condition (C)**: The condition where autonomous modules exist but are never imported, instantiated, or executed in the runtime
- **Property (P)**: The desired behavior where autonomous modules are properly wired, respond to events, and expose metrics
- **Preservation**: Existing HTTP routing, metrics collection, and application startup behavior must remain unchanged
- **AutonomyController**: Centralized controller in `src/router/autonomyController.js` that manages all 9 autonomous modules
- **Feature Flags**: Environment variables (AUTO_HEALING, AUTO_SCALING, etc.) that enable/disable each autonomous subsystem
- **Autonomous Modules**: The 9 modules (selfHealing.js, processManager.js, anomalyDetector.js, autoScaler.js, secretRotation.js, costManager.js, threatDetector.js, autoOptimizer.js, canaryDeployment.js)

## Bug Details

### Fault Condition

The bug manifests when the application starts and runs. The autonomous system modules exist in src/router/ but are completely disconnected from the runtime - they are never imported in router.js or production-server.js, never instantiated, and never execute any logic.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type ApplicationStartup
  OUTPUT: boolean
  
  RETURN autonomousModulesExist(input.codebase)
         AND NOT autonomousModulesImported(input.entryPoints)
         AND NOT autonomousModulesInstantiated(input.runtime)
         AND NOT autonomousModulesExecuting(input.runtime)
END FUNCTION
```

### Examples

- **Example 1**: When production-server.js starts, selfHealing.js is never imported → No self-healing occurs when endpoints fail
- **Example 2**: When router.js handles requests, anomalyDetector.js is never instantiated → No anomaly detection runs on traffic patterns
- **Example 3**: When system load increases, autoScaler.js is never executed → No auto-scaling decisions are made
- **Example 4**: When /metrics endpoint is queried, no autonomous system metrics are exposed → Cannot observe autonomous behavior

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- HTTP request routing through router.js must continue to work exactly as before
- Existing Prometheus metrics at /metrics and /metrics/prometheus must remain unchanged
- Application startup sequence in production-server.js must maintain current initialization order
- All existing tests must continue to pass without modification
- Graceful shutdown behavior must remain unchanged
- Configuration loading and validation must work as before
- Health check endpoints (/health, /health/live, /health/ready) must continue functioning

**Scope:**
All inputs that do NOT involve autonomous system initialization should be completely unaffected by this fix. This includes:
- Normal HTTP request/response cycles
- Existing middleware and hooks
- Current metrics collection
- Redis connections and operations
- Router core functionality
- Security headers and CORS handling

## Hypothesized Root Cause

Based on the bug description, the root causes are:

1. **Missing Import Statements**: router.js and production-server.js do not import any of the 9 autonomous modules
   - No `import { SelfHealingOrchestrator } from './src/router/selfHealing.js'` statements
   - No centralized controller to manage autonomous systems

2. **No Instantiation Logic**: Even if imported, there is no code to instantiate the autonomous classes
   - No `new SelfHealingOrchestrator()` calls
   - No configuration passed to constructors

3. **No Event Wiring**: Autonomous modules use EventEmitter pattern but are never connected to system events
   - selfHealing never receives endpoint failure events
   - anomalyDetector never receives traffic metrics
   - autoScaler never receives load metrics

4. **No Feature Flag System**: No environment variables to enable/disable autonomous subsystems
   - Cannot selectively enable AUTO_HEALING without AUTO_SCALING
   - No dry-run mode for testing

## Correctness Properties

Property 1: Fault Condition - Autonomous Systems Are Wired and Operational

_For any_ application startup where autonomous feature flags are enabled, the fixed production-server.js SHALL import the AutonomyController, instantiate all enabled autonomous modules, wire them to system events, and expose their metrics through Prometheus endpoints.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - Non-Autonomous Functionality Unchanged

_For any_ HTTP request, metrics query, or application lifecycle event that does NOT involve autonomous systems, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing routing, metrics, health checks, and shutdown procedures.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/router/autonomyController.js` (NEW)

**Purpose**: Centralized controller that manages all 9 autonomous modules

**Specific Changes**:
1. **Create AutonomyController Class**: Manages lifecycle of all autonomous modules
   - Constructor accepts feature flags and configuration
   - Instantiates enabled modules based on flags
   - Provides start(), stop(), getMetrics() methods

2. **Wire Event Handlers**: Connect autonomous modules to system events
   - selfHealing listens to endpoint failures
   - anomalyDetector receives traffic/latency metrics
   - autoScaler receives CPU/memory metrics
   - processManager monitors health checks

3. **Expose Metrics**: Aggregate metrics from all modules
   - Prometheus format for /metrics/autonomy endpoint
   - JSON format for /admin/autonomy endpoint

4. **Feature Flag Support**: Read environment variables
   - AUTO_HEALING, AUTO_SCALING, AUTO_ANOMALY_DETECTION, etc.
   - DRY_RUN mode for testing without taking actions
   - AUTONOMY_KILL_SWITCH to disable all systems

5. **Minimal Dependencies**: Only import what's needed
   - Import autonomous modules conditionally based on flags
   - No changes to existing router.js core logic

**File**: `production-server.js`

**Function**: `NeuralShellServer.initialize()`

**Specific Changes**:
1. **Import AutonomyController**: Add import statement at top
   - `import { AutonomyController } from './src/router/autonomyController.js';`

2. **Add initializeAutonomy() Method**: New method in NeuralShellServer class
   - Reads feature flags from environment
   - Instantiates AutonomyController with config
   - Calls controller.start() to begin autonomous operations

3. **Call in Initialization Sequence**: Add to initialize() method
   - Call after initializeHealthCheck()
   - Before registerRoutes()

4. **Register Autonomy Routes**: Add endpoints in registerRoutes()
   - GET /metrics/autonomy - Prometheus metrics
   - GET /admin/autonomy - JSON status
   - POST /admin/autonomy/toggle - Enable/disable subsystems

5. **Wire to Shutdown**: Add to shutdown() method
   - Call autonomyController.stop() for graceful cleanup

**File**: `scripts/demo-autonomy.mjs` (NEW)

**Purpose**: Proof-of-concept demo script that simulates failures and shows autonomous responses

**Specific Changes**:
1. **Simulate Endpoint Failures**: Send requests that trigger circuit breaker
   - Show self-healing response (endpoint restart, cooldown clear)

2. **Simulate High Load**: Generate burst traffic
   - Show auto-scaling decision (scale up recommendation)

3. **Simulate Anomalies**: Send unusual traffic patterns
   - Show anomaly detection (z-score calculation, alert)

4. **Display Results**: Clear PASS/FAIL output for each subsystem
   - Green checkmarks for successful autonomous responses
   - Red X for failures with error details

**File**: `test/autonomy-integration.test.js` (NEW)

**Purpose**: Integration tests verifying autonomous systems are wired correctly

**Specific Changes**:
1. **Test Controller Initialization**: Verify AutonomyController instantiates with feature flags

2. **Test Event Wiring**: Verify autonomous modules receive events
   - Emit endpoint failure, verify selfHealing receives it
   - Emit traffic metrics, verify anomalyDetector receives them

3. **Test Metrics Exposure**: Verify /metrics/autonomy returns Prometheus format

4. **Test Feature Flags**: Verify AUTO_HEALING=0 disables self-healing

5. **Test Preservation**: Verify existing routes still work with autonomy enabled

**File**: `test/autonomy-controller.test.js` (NEW)

**Purpose**: Unit tests for AutonomyController class

**Specific Changes**:
1. **Test Module Instantiation**: Verify correct modules are created based on flags

2. **Test Start/Stop Lifecycle**: Verify start() begins operations, stop() cleans up

3. **Test Metrics Aggregation**: Verify getMetrics() returns data from all modules

4. **Test Dry-Run Mode**: Verify DRY_RUN=1 prevents actions but logs decisions

5. **Test Kill Switch**: Verify AUTONOMY_KILL_SWITCH=1 disables all systems

**File**: `docs/AUTONOMY-PROOF.md` (NEW)

**Purpose**: Documentation with exact commands to demonstrate autonomous functionality

**Specific Changes**:
1. **Setup Instructions**: Environment variables to set

2. **Demo Commands**: Exact commands to run demo script
   - `node scripts/demo-autonomy.mjs`

3. **Expected Output**: What PASS/FAIL messages to expect

4. **Verification Steps**: How to verify each subsystem is working
   - Check /metrics/autonomy for metrics
   - Check logs for autonomous decisions

5. **Troubleshooting**: Common issues and solutions

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (autonomous modules not wired), then verify the fix works correctly (modules are wired and respond to events) and preserves existing behavior (HTTP routing unchanged).

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that autonomous modules are not imported, instantiated, or executing.

**Test Plan**: Write tests that check for autonomous module imports in production-server.js, attempt to query /metrics/autonomy (should 404), and simulate failures that should trigger autonomous responses (but don't). Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Import Check Test**: Parse production-server.js source, assert no autonomous imports (will pass on unfixed code, showing bug)
2. **Metrics Endpoint Test**: GET /metrics/autonomy, expect 404 (will pass on unfixed code, showing bug)
3. **Self-Healing Test**: Simulate endpoint failure, wait 5s, assert no healing occurred (will pass on unfixed code, showing bug)
4. **Auto-Scaling Test**: Simulate high CPU, assert no scaling decision logged (will pass on unfixed code, showing bug)

**Expected Counterexamples**:
- production-server.js does not import AutonomyController
- /metrics/autonomy returns 404 Not Found
- Endpoint failures do not trigger self-healing responses
- High load does not trigger auto-scaling decisions

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds (application startup with autonomous flags enabled), the fixed function produces the expected behavior (modules are wired and operational).

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := startApplication_fixed(input, { AUTO_HEALING: '1' })
  ASSERT autonomousModulesImported(result.imports)
  ASSERT autonomousModulesInstantiated(result.runtime)
  ASSERT autonomousModulesExecuting(result.runtime)
  ASSERT metricsExposed(result.endpoints, '/metrics/autonomy')
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold (normal HTTP requests, existing metrics queries), the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleRequest_original(input) = handleRequest_fixed(input)
  ASSERT getMetrics_original() = getMetrics_fixed()
  ASSERT healthCheck_original() = healthCheck_fixed()
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various HTTP requests, metrics queries)
- It catches edge cases that manual unit tests might miss (unusual headers, query params)
- It provides strong guarantees that behavior is unchanged for all non-autonomous inputs

**Test Plan**: Observe behavior on UNFIXED code first for HTTP requests and metrics queries, then write property-based tests capturing that behavior. Verify fixed code produces identical responses.

**Test Cases**:
1. **HTTP Routing Preservation**: Send 100 random HTTP requests to /prompt, verify responses match unfixed code
2. **Metrics Preservation**: Query /metrics 50 times, verify output format and values match unfixed code
3. **Health Check Preservation**: Query /health, /health/live, /health/ready, verify responses match unfixed code
4. **Startup Preservation**: Start application without autonomous flags, verify initialization sequence matches unfixed code

### Unit Tests

- Test AutonomyController constructor with various feature flag combinations
- Test module instantiation (verify correct classes created)
- Test start() method (verify modules begin operations)
- Test stop() method (verify cleanup occurs)
- Test getMetrics() method (verify aggregation from all modules)
- Test dry-run mode (verify no actions taken)
- Test kill switch (verify all systems disabled)

### Property-Based Tests

- Generate random feature flag combinations, verify controller handles all cases
- Generate random system events (failures, load spikes), verify appropriate modules respond
- Generate random HTTP requests, verify routing unchanged with autonomy enabled
- Test that all non-autonomous endpoints continue to work across many scenarios

### Integration Tests

- Test full application startup with autonomy enabled
- Test autonomous response to simulated endpoint failure (self-healing)
- Test autonomous response to simulated high load (auto-scaling)
- Test autonomous response to simulated anomaly (detection and alert)
- Test metrics exposure at /metrics/autonomy
- Test feature flag toggling via /admin/autonomy/toggle
- Test graceful shutdown with autonomy enabled
