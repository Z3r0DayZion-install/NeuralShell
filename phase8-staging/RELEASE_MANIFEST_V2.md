# NeuralShell V2.0 Kickoff - Release Manifest

This manifest defines the evidence bundle for the V2.0 version line kickoff (Phase 8).

## Metadata
- **Release Name**: NeuralShell V2.0 Alpha Kickoff
- **Phase**: 8
- **Status**: Technical Foundations Established
- **Date**: 2026-03-18

## Evidence Files

### 1. Core Foundations
- `src/core/config.js`: Centralized configuration (LLM Status, Connection Defaults).
- `src/core/telemetry.js`: Structured telemetry system.
- `src/core/logger.js`: Runtime logging dependency for telemetry.

### 2. Integration Proofs
- `src/renderer.js`: (Partial) Refactored UI logic using V2.0 modules.
- `src/main.js`: (Partial) Main process IPC wiring.
- `src/core/llmService.js`: Refactored to consume centralized `config.js`.
- `src/core/ipcValidators.js`: Telemetry channel validation.

### 3. Verification & Documentation
- `scripts/release-verify.js`: Automated verification utility.
- `walkthrough.md`: Phase 8 technical walkthrough and verification proof.
- `task.md`: Phase 8 objective tracking.

## Integrity Proof
- **Build Hash**: 039e4765a76482bda64fef7f01ceb7918cbeba2337666fb8039ed205a377d40f
- **Stewardship Level**: V2.0 Initial Baseline

> [!NOTE]
> The current release verification utility (`release-verify.js`) is Windows-bound, leveraging PowerShell and .NET for ZIP inspection. This is the intentional configuration for the current NeuralShell delivery lane.
