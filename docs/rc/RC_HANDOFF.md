# NeuralShell V2.0 RC Final Handoff Guide

## Objectives
This handoff guide facilitates the final transition of NeuralShell V2.0 to its definitive **Release Candidate Final (Post-Gen Expanded)** state. For the definitive boundary of this release and a classification of historical artifacts, refer to the **[RC_RELEASE_SCOPE.md](RC_RELEASE_SCOPE.md)**.

## Hardened Architecture Components

### 1. The Conflict-Aware Core
- **`src/core/conflictModel.js`**: Core state machine for workspace health (`MERGE_CONFLICT`, `LOCKED`, `DIRTY`).
- **`src/core/crossChainCoordinator.js`**: Managed logic for cross-repository signal propagation.

### 2. Post-Gen Resilience Layer (Wave 15)
- **`src/core/kernelRepair.js`**: Liveness monitoring and automated tactical resets for stalled orchestration.
- **`src/core/agencyPolicy.json`**: Externalized configuration for hot-reloadable risk and auto-run constraints.
- **`src/core/adaptiveIntelligence.js`**: Integrated anomaly detection with heuristic failure-spike analysis.

### 3. Autonomous Decision Integrity
- **`src/core/agencyPolicy.js`**: Deterministic risk model with explicit environmental constraints and anomaly integration.
- **`src/core/diagnosticsLedger.js`**: Append-only log for decision provenance and decision analysis.

### 4. Reliability & Performance
- **`src/core/executionEngine.js`**: Hardened lifestyle management with heartbeat integration and duplicate-trigger guards.
- **`src/core/projectIntelligence.js`**: Memoized intelligence snapshotting for low-latency ranking.

## Stewardship Responsibilities

### Policy Management
The operator is responsible for maintaining the `AGENCY_POLICY` in `agencyPolicy.js`. Adjust risk tiers and auto-run permissions to match changing security/safety requirements.

### Conflict Resolution
When the `ConflictModel` reports a `MERGE_CONFLICT`, the operator MUST intervene. NeuralShell will suppress risky autonomous actions in that workspace until resolved.

### Diagnostic Auditing
Regularly inspect the `DiagnosticsLedger` (accessible via UI/IPC or `diagnosticsLedger.js`) to verify that the system is operating within strategic expectations.

## Support & Escalation
- **Reliability Issues**: Check `executionEngine.js` logs for `CHAIN_TIMEOUT_MS` or `WORKLOAD_HEARTBEAT_MS` reaps.
- **Coordination Drift**: Inspect `crossChainCoordinator.js` linkage maps for invalid dependency propagation.
- **Audit Gaps**: Verify that all new pipelines/actions include `diagnosticsLedger.log` calls at key decision points.
