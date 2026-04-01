# NeuralShell Source & Audit Snapshot — v2.1.29

## 1. Snapshot Objective
This archive provides a **comprehensive source and documentation snapshot** of the NeuralShell v5 baseline (v2.1.29). It includes the core architecture, hardening proofs (Phase 20-30), and the Founder Beta strategic plans.

## 2. Real Session Continuity
Unlike earlier development builds, this snapshot features **active session persistence**:
- **Hydration**: Switching between `workflowId` (sessions) now fetches real persisted chat and model state from the backend via `window.api.session.load`.
- **Auto-Sync**: Active chat logs are automatically synchronized to the backend ledger on every message change.

## 3. Core Architecture to Audit
- **`src/kernel/`**: The Trusted Computing Base (TCB).
- **`src/renderer/src/state/ShellContext.jsx`**: The centralized state controller where hydration logic resides.
- **`docs/audit/`**: Deep architectural proofs regarding hardware binding and integrity.

## 4. Portability Note
The **canonical active link layer is portability-clean**. Absolute machine-local path strings have been removed from active distribution artifacts and system logic. Supporting documentation, historical artifacts, and instructional examples may still contain path strings (e.g., `C:\Users\<you>`) for context or installation guidance.

## 5. Key Directories
- `src/`: Complete React/Electron source.
- `docs/`: Strategic and architectural documentation.
- `release/`: Verification artifacts (attestation, checksums, manifest).
- `e2e/`, `tear/`, `scripts/`: Verification and release-gate infrastructure.
- `governance/`, `proof/`: Hard integrity and reproducibility proofs.

---
*Generated: March 24, 2026*
