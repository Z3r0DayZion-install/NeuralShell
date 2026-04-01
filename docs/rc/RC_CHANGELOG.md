# NeuralShell V2.0 RC Final Changelog

## [2.0.0-rc.final] - 2026-03-20

### Added
- **Post-Gen Resilience (Wave 15)**:
    - **Wave 15A**: Heartbeat-based liveness monitoring and automated tactical kernel resets.
    - **Wave 15B**: Hot-reloadable strategic policies via external `agencyPolicy.json`.
    - **Wave 15C**: Proactive anomaly detection and dynamic auto-run suppression.
- **Reliability Hardening (Wave 14A)**:
    - Chain leases, inactivity timers, and duplicate run prevention.
    - Restart truthfulness for interrupted execution sequences.
- **Performance Optimizations (Wave 14B)**:
    - TTL-based intelligence caching and recomputation throttling.
- **Strategic Policy Depth (Wave 14C)**:
    - Risk-tiered autonomy (SAFE, MEDIUM, HIGH) with contextual rationales.
- **Conflict-Safe Multi-Repo Coordination (Wave 14D)**:
    - `ConflictModel` and cross-repo health signal propagation.
- **Audit & Diagnostics (Wave 14E)**:
    - `DiagnosticsLedger` for append-only autonomous decision logging.

### Changed
- Normalized all system versioning to `2.0.0-rc.final-postgen`.
- Migrated default policy constraints to externalized `agencyPolicy.json`.
- Enhanced `AdaptiveIntelligence.js` with failure-spike detection heuristics.

### Fixed
- Resolved path normalization inconsistencies in multi-workspace test suites.
- Corrected IPC handler duplication and state corruption in `main.js`.
- Stabilized coordination loops in high-drift repository environments.
