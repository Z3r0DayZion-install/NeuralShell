# NeuralShell — HSG Batch 4 Candidate Triage

## Status: Triage Complete

This is a triage-only lane. No implementation. No deep audit. The goal is to select the best 3–5 candidates for Batch 4 audit using HSG doctrine, not instinct.

---

## Current HSG State

**Completed:**
- Batch 1: 5 confirmed hollow surfaces gated
- Batch 2: 10 confirmed hollow surfaces gated
- Batch 3: 3 confirmed hollow surfaces gated, 2 real surfaces preserved

**Total Gated:** 18 surfaces  
**Remaining Suspected:** 22 surfaces

---

## Selection Criteria

A surface should be considered for Batch 4 only if it meets at least 2 of these:

1. **Operational appearance** — It looks real enough to mislead a user into thinking it is production-backed
2. **Product claim overlap** — It overlaps with real NeuralShell capabilities or product claims
3. **Ambiguity** — It is not obvious from the name or quick inspection whether it is real or hollow
4. **High visibility** — It is reachable from a prominent surface (Mission Control, Ecosystem Launcher, App-level view)

---

## Candidate Pool (22 Remaining Suspected Surfaces)

1. ProcurementCommandCenter
2. TamperSimulationCenter
3. InstitutionalCommandConsole
4. DemoFlowConsole
5. DeploymentProgramCenter
6. TrainingDeliveryCenter
7. SupportOpsConsole
8. BuyerEvaluationCenter
9. CommercialPackageConsole
10. FieldLaunchCommandCenter
11. PartnerRolloutConsole
12. BuyerOpsConsole
13. DemoToPilotConsole
14. PilotExpansionConsole
15. RenewalRiskConsole
16. LaunchWeekCommandCenter
17. FollowupGenerator
18. FieldFeedbackConsole
19. PartnerCertificationHub
20. EcosystemRevenuePlanner
21. (2 additional surfaces not yet identified in codebase)

---

## Candidate Analysis

### 1. DemoFlowConsole

**File:** `src/renderer/src/components/DemoFlowConsole.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl, has `/demo` command

**Implementation:**
- localStorage-only: `neuralshell_demo_active_profile_v1`
- Reads from `demo_profiles.json` config file
- Manipulates localStorage keys to seed demo state
- Autoplay feature opens panels via `onOpenPanel` callback
- No IPC handlers, no backend integration

**Operational Appearance:** High — Looks like a real demo orchestration tool with autoplay, seed state, and profile management

**Product Claim Overlap:** Medium — NeuralShell has real demo capabilities (onboarding wizard), but this is a GTM tool for sales demos

**Ambiguity:** Medium — Could be real demo infrastructure or GTM tooling

**Likely Risk to User Trust:** High — Users might think this is how they should run demos, but it's a sales tool

**Criteria Matched:** 3 of 4 (operational appearance, ambiguity, high visibility)

**Recommendation:** **Include in Batch 4** — High-confidence hollow candidate with strong operational appearance

---

### 2. BuyerOpsConsole

**File:** `src/renderer/src/components/BuyerOpsConsole.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl

**Implementation:**
- localStorage-only: `neuralshell_buyer_ops_timeline_v1`
- Hardcoded stages (discovery, security_review, procurement, pilot_planning)
- Generates JSON export via `downloadJson` utility
- No IPC handlers, no backend integration, no CRM integration

**Operational Appearance:** High — Looks like a real buyer journey automation tool with stage tracking and follow-up generation

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have CRM or buyer ops automation

**Ambiguity:** Low — Name clearly indicates GTM/sales tooling

**Likely Risk to User Trust:** Medium — Users might think NeuralShell has CRM features

**Criteria Matched:** 2 of 4 (operational appearance, high visibility)

**Recommendation:** **Include in Batch 4** — Meets minimum criteria, strong operational appearance

---

### 3. FollowupGenerator

**File:** `src/renderer/src/components/FollowupGenerator.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl, has `/followup` command

**Implementation:**
- localStorage-only: `neuralshell_followup_generation_history_v1`
- Hardcoded stages (demo_followup, security_followup, pilot_kickoff, expansion_followup, renewal_followup)
- Generates JSON export via `downloadJson` utility
- No IPC handlers, no backend integration, no email integration

**Operational Appearance:** High — Looks like a real follow-up automation tool with evidence tracking and stage-aware drafts

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have email automation or follow-up generation

**Ambiguity:** Low — Name clearly indicates GTM/sales tooling

**Likely Risk to User Trust:** Medium — Users might think NeuralShell has email automation features

**Criteria Matched:** 2 of 4 (operational appearance, high visibility)

**Recommendation:** **Include in Batch 4** — Meets minimum criteria, strong operational appearance

---

### 4. FieldLaunchCommandCenter

**File:** `src/renderer/src/components/FieldLaunchCommandCenter.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl

**Implementation:**
- Aggregates localStorage data from 15+ other GTM surfaces
- No IPC handlers, no backend integration
- Reads from multiple localStorage keys (procurement, training, pilot, support, buyer ops, demo-to-pilot, pilot expansion, renewal risk, followup, feedback)
- Provides drill-down buttons to open other GTM surfaces

**Operational Appearance:** Very High — Looks like a real command center dashboard with live readiness metrics

**Product Claim Overlap:** Medium — NeuralShell has real command/control surfaces (Mission Control), but this is a GTM aggregator

**Ambiguity:** High — Could be real product infrastructure or GTM tooling

**Likely Risk to User Trust:** Very High — Users might think this is the real command center for NeuralShell operations

**Criteria Matched:** 4 of 4 (operational appearance, product claim overlap, ambiguity, high visibility)

**Recommendation:** **Include in Batch 4** — Highest-priority candidate, meets all criteria

---

### 5. LaunchWeekCommandCenter

**File:** `src/renderer/src/components/LaunchWeekCommandCenter.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl

**Implementation:**
- localStorage-only: `neuralshell_launch_week_state_v1`
- Hardcoded checklist (4 items)
- Manages priorities and issues arrays
- Generates JSON export via `downloadJson` utility
- No IPC handlers, no backend integration

**Operational Appearance:** High — Looks like a real launch coordination tool with issue tracking and priority management

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have launch coordination features

**Ambiguity:** Medium — Could be real product infrastructure or GTM tooling

**Likely Risk to User Trust:** Medium — Users might think NeuralShell has project management features

**Criteria Matched:** 3 of 4 (operational appearance, ambiguity, high visibility)

**Recommendation:** **Include in Batch 4** — Strong candidate, meets criteria

---

### 6. DemoToPilotConsole

**File:** `src/renderer/src/components/DemoToPilotConsole.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl

**Implementation:**
- localStorage-only: `neuralshell_demo_to_pilot_history_v1`
- Hardcoded scoring dimensions
- Generates JSON export via `downloadJson` utility
- No IPC handlers, no backend integration

**Operational Appearance:** High — Looks like a real conversion scoring tool

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have conversion tracking

**Ambiguity:** Low — Name clearly indicates GTM/sales tooling

**Likely Risk to User Trust:** Low — Users unlikely to think this is core product

**Criteria Matched:** 2 of 4 (operational appearance, high visibility)

**Recommendation:** **Defer** — Meets minimum criteria but lower priority than top 5

---

### 7. PilotExpansionConsole

**File:** `src/renderer/src/components/PilotExpansionConsole.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl

**Implementation:**
- localStorage-only: `neuralshell_pilot_expansion_history_v1`
- Hardcoded expansion paths
- Generates JSON export via `downloadJson` utility
- No IPC handlers, no backend integration

**Operational Appearance:** High — Looks like a real expansion planning tool

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have expansion tracking

**Ambiguity:** Low — Name clearly indicates GTM/sales tooling

**Likely Risk to User Trust:** Low — Users unlikely to think this is core product

**Criteria Matched:** 2 of 4 (operational appearance, high visibility)

**Recommendation:** **Defer** — Meets minimum criteria but lower priority than top 5

---

### 8. RenewalRiskConsole

**File:** `src/renderer/src/components/RenewalRiskConsole.jsx`

**Visibility:** High — Reachable from EcosystemLauncher and MissionControl

**Implementation:**
- localStorage-only: `neuralshell_renewal_risk_history_v1`
- Hardcoded risk factors
- Generates JSON export via `downloadJson` utility
- No IPC handlers, no backend integration

**Operational Appearance:** High — Looks like a real renewal risk assessment tool

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have renewal tracking

**Ambiguity:** Low — Name clearly indicates GTM/sales tooling

**Likely Risk to User Trust:** Low — Users unlikely to think this is core product

**Criteria Matched:** 2 of 4 (operational appearance, high visibility)

**Recommendation:** **Defer** — Meets minimum criteria but lower priority than top 5

---

### 9. ProcurementCommandCenter

**File:** `src/renderer/src/components/ProcurementCommandCenter.jsx`

**Visibility:** High — Reachable from App.jsx (direct render)

**Implementation:** (Not inspected in detail, but likely localStorage-only based on pattern)

**Operational Appearance:** Unknown — Needs inspection

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have procurement features

**Ambiguity:** Low — Name clearly indicates GTM/sales tooling

**Likely Risk to User Trust:** Low — Users unlikely to think this is core product

**Criteria Matched:** 1 of 4 (high visibility)

**Recommendation:** **Defer** — Insufficient evidence for Batch 4

---

### 10. TamperSimulationCenter

**File:** `src/renderer/src/components/TamperSimulationCenter.jsx`

**Visibility:** High — Reachable from App.jsx (direct render)

**Implementation:** (Not inspected in detail)

**Operational Appearance:** Unknown — Needs inspection

**Product Claim Overlap:** Medium — NeuralShell has real security features (audit chain, policy firewall)

**Ambiguity:** High — Could be real security testing infrastructure

**Likely Risk to User Trust:** High — Users might think this is real security testing

**Criteria Matched:** 3 of 4 (product claim overlap, ambiguity, high visibility)

**Recommendation:** **Defer to Batch 5** — High ambiguity but needs deeper inspection to classify

---

### 11. InstitutionalCommandConsole

**File:** `src/renderer/src/components/InstitutionalCommandConsole.jsx`

**Visibility:** High — Reachable from App.jsx (direct render)

**Implementation:** (Not inspected in detail)

**Operational Appearance:** Unknown — Needs inspection

**Product Claim Overlap:** Low — NeuralShell doesn't claim to have institutional-specific features

**Ambiguity:** Medium — Could be real enterprise infrastructure

**Likely Risk to User Trust:** Medium — Users might think this is real enterprise tooling

**Criteria Matched:** 2 of 4 (ambiguity, high visibility)

**Recommendation:** **Defer** — Insufficient evidence for Batch 4

---

### 12–22. Remaining Surfaces

The following surfaces were not inspected in detail:

- DeploymentProgramCenter
- TrainingDeliveryCenter
- SupportOpsConsole
- BuyerEvaluationCenter
- CommercialPackageConsole
- PartnerRolloutConsole
- FieldFeedbackConsole
- PartnerCertificationHub
- EcosystemRevenuePlanner

**Recommendation:** **Defer** — Insufficient evidence for Batch 4 selection

---

## Ranked Candidate List

### Top 5 Candidates (Scored by Criteria Match)

1. **FieldLaunchCommandCenter** — 4 of 4 criteria (operational appearance, product claim overlap, ambiguity, high visibility)
2. **DemoFlowConsole** — 3 of 4 criteria (operational appearance, ambiguity, high visibility)
3. **LaunchWeekCommandCenter** — 3 of 4 criteria (operational appearance, ambiguity, high visibility)
4. **BuyerOpsConsole** — 2 of 4 criteria (operational appearance, high visibility)
5. **FollowupGenerator** — 2 of 4 criteria (operational appearance, high visibility)

### Next Tier (Meets Minimum Criteria)

6. DemoToPilotConsole — 2 of 4 criteria
7. PilotExpansionConsole — 2 of 4 criteria
8. RenewalRiskConsole — 2 of 4 criteria
9. InstitutionalCommandConsole — 2 of 4 criteria

### Deferred (Insufficient Evidence)

10–22. All remaining surfaces

---

## Recommended Batch 4 Audit Set

**5 surfaces** (top 5 from ranked list):

1. **FieldLaunchCommandCenter** — Highest priority, meets all 4 criteria
2. **DemoFlowConsole** — Strong operational appearance, high ambiguity
3. **LaunchWeekCommandCenter** — Strong operational appearance, medium ambiguity
4. **BuyerOpsConsole** — Strong operational appearance, meets minimum criteria
5. **FollowupGenerator** — Strong operational appearance, meets minimum criteria

---

## Why These Were Chosen Over Others

### FieldLaunchCommandCenter (Must Include)
- Only surface that meets all 4 criteria
- Aggregates data from 15+ other GTM surfaces
- Looks like a real command center dashboard
- High risk to user trust (users might think this is the real NeuralShell command center)
- Overlaps with real product claims (Mission Control exists)

### DemoFlowConsole (Strong Candidate)
- Meets 3 of 4 criteria
- Strong operational appearance (autoplay, seed state, profile management)
- High ambiguity (could be real demo infrastructure)
- High visibility (has `/demo` command)
- Overlaps with real product claims (onboarding wizard exists)

### LaunchWeekCommandCenter (Strong Candidate)
- Meets 3 of 4 criteria
- Strong operational appearance (issue tracking, priority management, checklist)
- Medium ambiguity (could be real project management infrastructure)
- High visibility

### BuyerOpsConsole (Meets Minimum)
- Meets 2 of 4 criteria (minimum threshold)
- Strong operational appearance (stage tracking, follow-up generation)
- High visibility
- Lower priority than top 3 but still worth auditing

### FollowupGenerator (Meets Minimum)
- Meets 2 of 4 criteria (minimum threshold)
- Strong operational appearance (evidence tracking, stage-aware drafts)
- High visibility (has `/followup` command)
- Lower priority than top 3 but still worth auditing

### Why Others Were Deferred

**DemoToPilotConsole, PilotExpansionConsole, RenewalRiskConsole:**
- Meet minimum criteria (2 of 4) but lower operational appearance
- Names clearly indicate GTM/sales tooling (low ambiguity)
- Lower risk to user trust
- Can be audited in Batch 5 if needed

**TamperSimulationCenter:**
- High ambiguity and product claim overlap
- But needs deeper inspection to classify (could be real security testing)
- Better suited for Batch 5 with extra scrutiny

**All Others:**
- Insufficient evidence for selection
- Need inspection before scoring

---

## Exact Next Audit Prompt Draft for Batch 4

```
# NeuralShell — HSG Batch 4 Audit

Apply the Hollow Surface Gating (HSG) pattern documented in docs/patterns/hollow-surface-gating.md.

This is an audit and implementation lane. Audit 5 suspected surfaces, classify with evidence, gate only confirmed hollow surfaces.

## Goal

Audit and gate the next batch of hollow GTM surfaces while preserving any confirmed real surfaces.

## Surfaces to Audit (5)

1. FieldLaunchCommandCenter
2. DemoFlowConsole
3. LaunchWeekCommandCenter
4. BuyerOpsConsole
5. FollowupGenerator

## Audit Process

For each surface:

1. Check src/main.js for IPC handlers
2. Check IPC_CONTRACT.md for channel schemas
3. Check src/core/stateManager.js for persisted state fields
4. Check src/core/ and src/daemon/ for backend integration
5. Inspect component render logic for hardcoded/fake data
6. Check for real crypto operations (not localStorage-only)
7. Classify as confirmed real, confirmed hollow, or deferred

## Classification Criteria

**Confirmed Hollow:**
- localStorage-only persistence
- Hardcoded or fake metrics
- No IPC integration
- No backend service integration
- JSON export only (no real outbound integration)

**Confirmed Real:**
- Has real IPC handlers
- Persists state beyond localStorage
- Integrates with backend services
- Shows real data, not hardcoded/fake data
- Has real crypto operations

**Deferred:**
- Unclear implementation status
- Needs deeper inspection
- Not worth gating in this pass

## Implementation Pattern

For each confirmed hollow surface:

1. Add callback gate in App.jsx (ternary conditional)
2. Add direct render gate in App.jsx (conditional block)
3. Add entry point wrap in EcosystemLauncher.jsx (function check)
4. Add entry point wrap in MissionControl.jsx (function check)

Use the same flag: INTERNAL_GTM_MODE
Use the same storage key: neuralshell_internal_gtm_mode_v1

## Verification

After implementation:

1. Run full test suite (unit, contract, smoke, security, E2E)
2. Verify flag off: Gated surfaces not visible in DOM
3. Verify flag off: Entry point buttons/links not visible
4. Verify flag off: No console errors
5. Verify flag on: Gated surfaces render correctly
6. Verify flag on: Entry points visible and functional
7. Verify confirmed real surfaces visible in both modes

## Stop Rule

- Audit all 5 surfaces
- Gate only confirmed hollow
- Preserve confirmed real
- Defer anything mixed

## Documentation

Create:
- Commit message listing exact surfaces gated
- PR description with classification evidence
- Lane completion doc (docs/lanes/hsg-batch4-completion.md)
- Update HSG index (docs/lanes/hsg-index.md)

Follow HSG pattern documented in docs/patterns/hollow-surface-gating.md.
```

---

## Stop Rule Applied

This triage lane ends here. No implementation. No deep audit. Selection complete.

The recommended Batch 4 audit set is ready for execution.

---

## References

- HSG Pattern Doc: `docs/patterns/hollow-surface-gating.md`
- HSG Batch Index: `docs/lanes/hsg-index.md`
- HSG Review Checklist: `docs/checklists/hsg-review-checklist.md`
- HSG PR Template: `docs/templates/hsg-pr-snippet.md`
