# Phase 28 — Packaged Operator Action Proof

Baseline: V2.1.27
Packaged artifact: `dist/win-unpacked/NeuralShell.exe` (Windows x64, electron-builder NSIS)
Probe: `tear/smoke-packaged-governance.js`

## Action Results

| # | Action | Start Profile | Start Badge | End Profile | End State | Pass |
|---|---|---|---|---|---|---|
| 1 | Disconnect | prof-a (Scenario A) | `trust-verified` | prof-a | Disconnected, banner shown | ✅ |
| 2 | Switch Profile | prof-a (Scenario A) | `trust-verified` | prof-b (Scenario B) | Active profile changed | ✅ |
| 3 | Enter Offline | prof-a (Scenario A) | `trust-verified` | prof-a | Offline entry executed | ✅ |
| 4 | Verify | prof-a (Scenario A) | `trust-verified` | prof-a | Button clicked, `runBridgeAutoDetect` fails gracefully (offline) | ✅ |
| 5 | Repair | prof-c (Scenario C) | `trust-drifted` | prof-c | `setupState=repair_mode` | ✅ |

## Action Details

### 1. Disconnect
- Profile `prof-a` (VERIFIED) active, disconnect invoked via `uiPerformDisconnect()`.
- Post-action: banner displayed ("SYSTEM PAUSED - OPERATOR INTERVENTION REQUIRED"), profile remains active but disconnected.

### 2. Switch Profile (Governed)
- Started on `prof-a` (VERIFIED). Invoked `uiSwitchActiveProfile("prof-b")`.
- Post-action: active profile changed to `prof-b`. APB updated on reload. Governed switch succeeded.

### 3. Enter Offline
- Started on `prof-a` (VERIFIED). Invoked `uiPerformOfflineEntry()`.
- Post-action: offline entry executed, `setupState` transitioned to `endpoint_pending_test` (offline posture entry).

### 4. Verify
- Started on `prof-a` (VERIFIED). Clicked `apbVerifyBtn`.
- Post-action: `runBridgeAutoDetect` triggered. In offline packaged environment, endpoint is unreachable — fails gracefully with banner. No raw error leakage. Expected behavior.

### 5. Repair
- Started on `prof-c` (DRIFTED, `trust-drifted` badge). Clicked `apbRepairBtn`.
- Post-action: `setupState=repair_mode`, `remoteActionsEnabled=false`. Correctly routed to repair pathway.

## Defect Found and Fixed

**Profile injection scope bug**: The `setActiveAndReload` helper referenced `window._SCENARIO_PROFILES` which is destroyed on page reload. Fix: moved profile definitions to Node scope and passed them as a Playwright `evaluate()` parameter. No runtime code change needed — probe-only fix.

## Evidence Artifacts

| File | Description |
|---|---|
| `proof/latest/phase28-scenario-report.json` | Structured JSON report for all 5 actions |
| `proof/latest/phase28-action-switch.png` | Screenshot after governed profile switch |
| `proof/latest/phase28-action-offline.png` | Screenshot after offline entry |
| `proof/latest/phase28-action-verify.png` | Screenshot after verify (graceful failure) |
| `proof/latest/phase28-action-repair.png` | Screenshot after repair entry on drifted profile |
| `proof/latest/phase25-action-disconnect.png` | Screenshot after disconnect (existing) |

## Verdict

All 4 previously-open operator actions (Switch, Offline, Verify, Repair) are now proven in the packaged environment. The packaged operator-action proof gap is **fully closed**.
