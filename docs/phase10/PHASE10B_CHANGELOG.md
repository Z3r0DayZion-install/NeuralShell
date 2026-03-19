# Phase 10B: Hardening & Release Changelog

## 🚀 Action Orchestration Hardening

### Core Stability
- **Session Persistence**: Action statuses (`succeeded`, `failed`, `running`) now persist across application restarts via the `stateManager`.
- **State Restoration**: `executionEngine` now restores its internal map from saved session state on boot.
- **Unified IPC**: IPC handlers for status and history are now fully wired to the persistent store.

### UX & Clarity
- **Rationale Visibility**: Recommended actions now display a concise rationale (e.g., "→ Node.js project detected") directly in the UI.
- **Risk Indicators**: Every action now displays a colored safety dot (Safe/Medium/High) based on its registry risk profile.
- **Recovery Styling**: Automated recovery actions use a distinct **Amber** color scheme to differentiate them from standard engineering tasks.
- **Low Confidence Warning**: Repositories with less than 2 signals are now flagged with a "Limited Workspace Signals" banner.

### Guardrails & Safety
- **Git Cleanliness Check**: `Review uncommitted` is now blocked if the git tree is dirty, preventing accidental drift records.
- **Dependency Guard**: Playwright actions now require `node_modules` to be present, preventing execution failures.
- **Rich Failure Reasons**: Preflight checks now return human-readable reasons (e.g., "Git tree is dirty") displayed as tooltips on blocked buttons.

## 🛡️ Verification Results
- **Scenario A (Signals)**: PASSED - Correct detection of node/git/electron.
- **Scenario B (Guardrails)**: PASSED - Blocked execution on dirty git.
- **Scenario C (Recovery)**: PASSED - Recovery actions correctly boosted to Score 98.
- **Scenario D (Persistence)**: PASSED - Status survives restart simulation.
- **Scenario E (Low Signal)**: PASSED - Confidence capping at Score 40.
