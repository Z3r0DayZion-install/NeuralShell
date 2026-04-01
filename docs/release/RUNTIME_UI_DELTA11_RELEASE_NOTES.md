# NeuralShell Runtime/UI Wave Delta11 Release Notes

## Summary
Delta11 upgrades NeuralShell from a module-rich shell into a runtime authority workstation with live operational visibility, local automation, failure supervision, guided first-boot setup, and stateful split-workspace recovery workflows.

## Runtime Authority Wins

### 1. Release Surface Repair and Truth Pack
- Repaired workflow-file failure paths in:
  - `.github/workflows/publish.yml`
  - `.github/workflows/proof-drop-friday.yml`
- Added machine-readable and human-readable Delta10 truth artifacts:
  - `docs/release/DOMINATION_DELTA10_TRUTH_CHECKLIST.md`
  - `release/release-package/domination-delta10/release-truth.json`
- Added verifier:
  - `scripts/release_truth_verify.cjs`

### 2. Mission Control Cockpit
- Added top-level Mission Control overlay with live runtime cards:
  - provider, vault, proof, relay, collab/voice, policy, update lane, SEAL identity, watchdog
- Added real runtime event feed backed by local event bus.
- Mission Control is reachable from:
  - top status bar Mission button
  - ecosystem launcher Mission Control module
  - slash command `/mission`

### 3. NodeChain Runtime Automation
- Added local NodeChain rule engine with:
  - event listeners, conditions, action execution, dry-run, logging, enable/disable
- Added starter rules for provider sweep, proof pass, policy change, update verification failure, relay failure threshold, and collab disconnect.
- Added NodeChain UI panel and rule editor.
- Enforced allowlist constraints for local script action execution.

### 4. Runtime Watchdog Supervisor
- Added watchdog supervisor with checks for:
  - provider bridge, relay health, update verification, vault health
- Added runtime alerts drawer and status badge.
- Added sticky alert behavior and acknowledgement flow.
- Added recovery hooks for retrying probes and forcing safe policy posture.

### 5. First-Boot Authority Funnel
- Added first-boot authority step model and wizard flow.
- Added progress rail with reopen/reset controls.
- Added step event instrumentation to runtime feed.
- Preserved compatibility with existing onboarding by preventing overlap collisions.

### 6. Live Split Workspace and Snapshots
- Added split workspace overlay with left command deck, center workflow context, and right result pane.
- Added runtime snapshot capture, restore, and compare flows.
- Added snapshot redaction rules for secret-like fields.

## Quality Gates (Delta11)
- `npm run lint` passed.
- `npm test` passed.
- `npm run verify:ui` passed with new Delta11 specs.
- `node scripts/release_truth_verify.cjs` passed.
- No regressions in white-label verification and pilot/board/white-label generators.

## New Delta11 UI Verification Specs
- `e2e/missionControl.spec.js`
- `e2e/nodeChainRules.spec.js`
- `e2e/watchdogAlerts.spec.js`
- `e2e/firstBootAuthority.spec.js`
- `e2e/splitWorkspace.spec.js`
- `e2e/stateSnapshots.spec.js`

## Delta11 Screenshot Assets
- `screenshots/delta11/mission-control.png`
- `screenshots/delta11/firstboot-authority-wizard.png`
- `screenshots/delta11/firstboot-progress-rail.png`
- `screenshots/delta11/nodechain-rules.png`
- `screenshots/delta11/watchdog-degraded-alerts.png`
- `screenshots/delta11/split-workspace-proof-pane.png`

