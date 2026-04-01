# NeuralShell — HSG Batch 4 Audit Report

## Status: Audit Complete (Implementation Pending)

This is an audit-only pass. No gating implemented yet.

---

## Batch 4 Primary Audit Set

1. FieldLaunchCommandCenter
2. DemoFlowConsole
3. LaunchWeekCommandCenter

---

## Surface 1: FieldLaunchCommandCenter

**File:** `src/renderer/src/components/FieldLaunchCommandCenter.jsx`

**Classification:** Confirmed Hollow

**Evidence:**

**IPC Integration:**
- No IPC handlers in `src/main.js` for field launch operations
- No channels in `IPC_CONTRACT.md` for field launch operations

**Backend Integration:**
- No backend service integration
- No integration with `src/core/` or `src/daemon/` services

**State Persistence:**
- No persisted state in `src/core/stateManager.js`
- Reads from 15+ localStorage keys written by other GTM surfaces:
  - `neuralshell_procurement_pack_history_v1`
  - `neuralshell_training_bundle_history_v1`
  - `neuralshell_pilot_conversion_history_v1`
  - `neuralshell_support_triage_queue_v1`
  - `neuralshell_buyer_ops_timeline_v1`
  - `neuralshell_demo_to_pilot_history_v1`
  - `neuralshell_pilot_expansion_history_v1`
  - `neuralshell_renewal_risk_history_v1`
  - `neuralshell_followup_generation_history_v1`
  - `neuralshell_field_feedback_notes_v1`
  - `neuralshell_deployment_preflight_report_v1`
  - `neuralshell_partner_rollout_v1`
  - `neuralshell_launch_week_state_v1`
  - `neuralshell_demo_mode_v1`

**Data Sources:**
- All data is localStorage-only
- Aggregates data from other hollow GTM surfaces
- Hardcoded metrics: `commercialMatrixLoaded: true`, `releaseTruthStatus: "pass"`
- No real data sources

**Behavior:**
- Displays readiness cards with localStorage-derived metrics
- Provides drill-down buttons to open other GTM surfaces via `onOpenPanel` callback
- Refreshes every 5000ms (polling localStorage, not real backend)
- No file operations, no artifact verification, no crypto operations

**User-Visible Risk:** Very High

Users might think this is the real command center for NeuralShell field operations. The surface looks operational with live metrics, but all data is localStorage-only and aggregates from other hollow GTM surfaces. The hardcoded "pass" status for release truth is particularly misleading.

**Recommended Treatment:** Gate

---

## Surface 2: DemoFlowConsole

**File:** `src/renderer/src/components/DemoFlowConsole.jsx`

**Classification:** Confirmed Hollow

**Evidence:**

**IPC Integration:**
- No IPC handlers in `src/main.js` for demo flow operations
- No channels in `IPC_CONTRACT.md` for demo flow operations

**Backend Integration:**
- No backend service integration
- No integration with `src/core/` or `src/daemon/` services

**State Persistence:**
- No persisted state in `src/core/stateManager.js`
- localStorage-only: `neuralshell_demo_active_profile_v1`
- Reads from static config: `src/renderer/src/config/demo_profiles.json`

**Data Sources:**
- Hardcoded demo profiles in JSON config file
- No real data sources

**Behavior:**
- Manipulates localStorage keys to seed demo state (via `applySeed` function)
- Clears localStorage keys to reset demo baseline (via `clearKeys` function)
- Autoplay feature opens panels via `onOpenPanel` callback (UI orchestration only)
- Toggles `demoModeEnabled` flag in App.jsx state (localStorage-backed)
- No file operations, no artifact verification, no crypto operations

**Demo Mode Flag Usage:**
- Flag is stored in localStorage: `neuralshell_demo_mode_v1`
- Flag is displayed in TopStatusBar as a badge (visual indicator only)
- Flag is read by FieldLaunchCommandCenter to show "ready" or "disabled" (GTM surface reading GTM flag)
- Flag does NOT affect real product behavior (no IPC handlers, no backend integration, no security gates)

**User-Visible Risk:** High

Users might think this is how they should run demos or that demo mode affects real product behavior. The surface looks like real demo infrastructure with autoplay, seed state, and profile management. However, it's a GTM tool for sales presentations that only manipulates localStorage and orchestrates UI panel opening. The demo mode flag is purely cosmetic.

**Recommended Treatment:** Gate

---

## Surface 3: LaunchWeekCommandCenter

**File:** `src/renderer/src/components/LaunchWeekCommandCenter.jsx`

**Classification:** Confirmed Hollow

**Evidence:**

**IPC Integration:**
- No IPC handlers in `src/main.js` for launch week operations
- No channels in `IPC_CONTRACT.md` for launch week operations

**Backend Integration:**
- No backend service integration
- No integration with `src/core/` or `src/daemon/` services

**State Persistence:**
- No persisted state in `src/core/stateManager.js`
- localStorage-only: `neuralshell_launch_week_state_v1`

**Data Sources:**
- Hardcoded checklist (4 items)
- Hardcoded default priorities (2 items)
- Hardcoded default issues (1 item)
- No real data sources

**Behavior:**
- Manages priorities and issues arrays in localStorage
- Provides drill-down buttons to open other GTM surfaces via `onOpenPanel` callback
- Generates JSON export via `downloadJson` utility (no real outbound integration)
- No file operations, no artifact verification, no crypto operations
- No issue tracking backend, no project management integration

**User-Visible Risk:** Medium

Users might think NeuralShell has project management or launch coordination features. The surface looks like a real launch coordination tool with issue tracking and priority management. However, it's a GTM tool for internal launch planning that only stores data in localStorage and exports JSON files.

**Recommended Treatment:** Gate

---

## Audit Summary

### A. Audited Surfaces (3)

1. FieldLaunchCommandCenter — Confirmed Hollow
2. DemoFlowConsole — Confirmed Hollow
3. LaunchWeekCommandCenter — Confirmed Hollow

### B. Confirmed Real Surfaces (0)

None. All 3 audited surfaces are confirmed hollow.

### C. Confirmed Hollow Surfaces (3)

1. **FieldLaunchCommandCenter** — localStorage-only aggregator, hardcoded metrics, no backend integration
2. **DemoFlowConsole** — localStorage manipulation tool, static config, no backend integration
3. **LaunchWeekCommandCenter** — localStorage-only planning tool, JSON export only, no backend integration

### D. Deferred Surfaces (0)

None. All 3 audited surfaces have clear evidence for classification.

### E. Reserve Surfaces Status

**BuyerOpsConsole and FollowupGenerator should remain deferred.**

Reasoning:
- All 3 primary surfaces are confirmed hollow with clear evidence
- No mixed patterns discovered that would require reserve surface inspection
- Reserve surfaces follow the same localStorage-only + JSON-export pattern as the primary set
- No justification to widen scope beyond the primary 3

### F. Recommended Implementation Set

**Gate all 3 confirmed hollow surfaces:**

1. FieldLaunchCommandCenter
2. DemoFlowConsole
3. LaunchWeekCommandCenter

**Implementation pattern:**
- 3 direct render gates in App.jsx (conditional blocks)
- 6 callback gates in App.jsx (3 EcosystemLauncher + 3 MissionControl, ternary conditionals)
- 3 section wraps in EcosystemLauncher.jsx (function checks)
- 3 button wraps in MissionControl.jsx (function checks)
- Total: 15 conditional gates across 3 files

**Flag:** `INTERNAL_GTM_MODE`  
**Storage Key:** `neuralshell_internal_gtm_mode_v1`

### G. HSG PR Reference Sentence

```
This PR applies the Hollow Surface Gating (HSG) pattern documented in docs/patterns/hollow-surface-gating.md to gate 3 confirmed hollow GTM surfaces behind the INTERNAL_GTM_MODE flag.
```

---

## Classification Rationale

### Why All 3 Are Confirmed Hollow

**Common Pattern:**
- No IPC handlers in `src/main.js`
- No channels in `IPC_CONTRACT.md`
- No persisted state in `src/core/stateManager.js`
- No backend service integration in `src/core/` or `src/daemon/`
- localStorage-only persistence
- No real data sources (hardcoded or localStorage-derived)
- No file operations, no artifact verification, no crypto operations
- JSON export only (no real outbound integration)

**FieldLaunchCommandCenter:**
- Aggregates localStorage data from 15+ other GTM surfaces
- Hardcoded "pass" status for release truth
- Hardcoded "loaded" status for commercial matrix
- Polls localStorage every 5000ms (not real backend)

**DemoFlowConsole:**
- Manipulates localStorage keys to seed demo state
- Reads from static JSON config file
- Demo mode flag is purely cosmetic (no real product behavior changes)
- Autoplay only orchestrates UI panel opening (no real automation)

**LaunchWeekCommandCenter:**
- Hardcoded checklist, priorities, and issues
- JSON export only (no real issue tracking backend)
- No project management integration

### Why No Surfaces Are Real

None of the 3 surfaces have:
- Real IPC handlers for backend communication
- Real state persistence beyond localStorage
- Real backend service integration
- Real data sources (all hardcoded or localStorage-derived)
- Real crypto operations (no Ed25519, no SHA-256, no AES-256-GCM)
- Real file operations (no artifact verification, no signed packages)

### Why No Surfaces Are Deferred

All 3 surfaces have clear, unambiguous evidence:
- Implementation is fully inspected
- No mixed patterns discovered
- No real integration points found
- Classification is straightforward

---

## Next Steps

1. Implement gating for all 3 confirmed hollow surfaces
2. Follow 4-layer HSG pattern (direct renders, callbacks, sections, buttons)
3. Run full test suite (unit, contract, smoke, security, E2E)
4. Verify flag off: Surfaces not visible in DOM
5. Verify flag on: Surfaces render correctly
6. Create lane completion doc
7. Update HSG index

---

## References

- HSG Pattern Doc: `docs/patterns/hollow-surface-gating.md`
- HSG Batch Index: `docs/lanes/hsg-index.md`
- HSG Review Checklist: `docs/checklists/hsg-review-checklist.md`
- HSG PR Template: `docs/templates/hsg-pr-snippet.md`
- Batch 4 Triage: `docs/lanes/hsg-batch4-triage.md`
