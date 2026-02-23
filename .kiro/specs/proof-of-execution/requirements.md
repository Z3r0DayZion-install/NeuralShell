# Bugfix Requirements: Proof of Execution

## Introduction

The autonomous intelligence layer (AutonomyController and related modules) exists in the codebase but lacks runtime proof that it actually executes. There is no observable evidence that the autonomy stack is running, making decisions, or producing outcomes. This creates an execution gap where the system cannot be verified, monitored, or validated in production.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the server starts THEN the AutonomyController is not initialized or started during boot

1.2 WHEN the server shuts down THEN the AutonomyController does not gracefully stop or clean up resources

1.3 WHEN process signals (SIGINT/SIGTERM) are received THEN the AutonomyController does not stop before exit

1.4 WHEN uncaught exceptions or unhandled rejections occur THEN the AutonomyController does not stop and timers/intervals remain active

1.5 WHEN requesting metrics THEN there is no /metrics/autonomy endpoint to observe autonomy decisions, healing attempts, threats, costs, or optimizations

1.6 WHEN running demos or tests THEN there is no deterministic demo runner that proves autonomy works end-to-end

1.7 WHEN the AUTONOMY_KILL_SWITCH is enabled THEN side effects may still execute

1.8 WHEN DRY_RUN mode is enabled THEN side effects may still execute instead of only running decision logic

1.9 WHEN restart or IP blocking limits are exceeded THEN the system may continue without backoff or safety bounds

### Expected Behavior (Correct)

2.1 WHEN the server starts THEN the AutonomyController SHALL be initialized and started during boot

2.2 WHEN the server shuts down THEN the AutonomyController SHALL gracefully stop, clear all timers/intervals, remove listeners, and close handles

2.3 WHEN process signals (SIGINT/SIGTERM) are received THEN the AutonomyController SHALL stop before process exit

2.4 WHEN uncaught exceptions or unhandled rejections occur THEN the AutonomyController SHALL log, stop, and exit with code 1

2.5 WHEN requesting GET /metrics/autonomy THEN the system SHALL return Prometheus-formatted metrics including decisions_total, healing_attempts_total, threats_detected_total, cost_total, optimizations_applied_total, canary_deployments_total, and process_restarts_total

2.6 WHEN running scripts/demo-autonomy.mjs THEN the system SHALL start the server, run scenarios A-G, scrape /metrics/autonomy, print PASS/FAIL per scenario, and exit non-zero on failure

2.7 WHEN AUTONOMY_KILL_SWITCH=1 THEN all autonomous side effects SHALL be disabled instantly

2.8 WHEN DRY_RUN=1 THEN side effects SHALL be disabled but decision logic and metrics SHALL still execute

2.9 WHEN safety limits are exceeded THEN the system SHALL enforce max restarts per window, max IP blocks per window, and backoff ceilings

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the server handles normal requests THEN the system SHALL CONTINUE TO route and respond correctly

3.2 WHEN existing tests run THEN the system SHALL CONTINUE TO pass all existing test suites

3.3 WHEN AutonomyController modules are disabled via feature flags THEN the system SHALL CONTINUE TO function without those modules

3.4 WHEN the server runs without autonomy enabled THEN the system SHALL CONTINUE TO operate normally
