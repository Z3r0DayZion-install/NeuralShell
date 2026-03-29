# NeuralShell — HSG Batch Index

## Overview

This document tracks all completed Hollow Surface Gating (HSG) batches, cumulative progress, and links to relevant documentation.

HSG is a trust-preservation doctrine for evidence-based product visibility. It gates unimplemented UI surfaces behind an internal-only flag, preserving internal workflows while protecting user trust.

---

## Cumulative Progress

### Total Confirmed Hollow Surfaces Gated: 18
### Confirmed Real Surfaces Preserved: 2 (Batch 3)
### Remaining Suspected Surfaces: 22

---

## Batch 1 — Initial GTM Console Gating

**Status:** Complete  
**Surfaces Gated:** 5  
**Surfaces Preserved:** 0  
**Implementation:** 25 conditional gates across 3 files

### Surfaces Gated (5)
1. PilotConversionConsole — localStorage-only, no pilot tracking backend
2. StrategicAccountConsole — localStorage-only, no CRM integration
3. RevenueOpsConsole — localStorage-only, fake metrics
4. BoardOperatingPackConsole — localStorage-only, no backend
5. EcosystemCommandCenter — aggregates hollow consoles

### Implementation Details
- 10 callback gates in App.jsx (ternary conditionals)
- 5 direct render gates in App.jsx (conditional blocks)
- 5 button wraps in MissionControl.jsx (function checks)
- 5 section wraps in EcosystemLauncher.jsx (function checks)

### Verification
- Full test suite: All tests passing
- E2E tests: 14 tests passed
- Flag off: Surfaces not visible in DOM
- Flag on: Surfaces render correctly

### Documentation
- Pattern doc: `docs/patterns/hollow-surface-gating.md`
- Agent guide: `.kiro/lanes/hollow-surface-gating.md`

---

## Batch 2 — Enterprise Console Gating

**Status:** Complete  
**Surfaces Gated:** 10  
**Surfaces Preserved:** 0  
**Implementation:** 50 conditional gates across 3 files

### Surfaces Gated (10)
1. ExecutiveScaleDashboard — localStorage-only, fake metrics
2. ChannelExpansionPlanner — localStorage-only, no channel integration
3. CrossAccountRenewalMatrix — localStorage-only, no renewal tracking
4. GlobalPlanningConsole — localStorage-only, no planning backend
5. EcosystemPortfolioConsole — localStorage-only, no portfolio tracking
6. ManagedServicesConsole — localStorage-only, no services backend
7. PortfolioRolloutPlanner — localStorage-only, no rollout tracking
8. ServiceLineConsole — localStorage-only, no service integration
9. PartnerNetworkGovernance — localStorage-only, no partner backend
10. LicensedOperatorFramework — localStorage-only, no operator tracking

### Implementation Details
- 20 callback gates in App.jsx (ternary conditionals)
- 10 direct render gates in App.jsx (conditional blocks)
- 10 button wraps in MissionControl.jsx (function checks)
- 10 section wraps in EcosystemLauncher.jsx (function checks)

### Verification
- Full test suite: All tests passing
- E2E tests: All tests passed
- Flag off: Surfaces not visible in DOM
- Flag on: Surfaces render correctly

---

## Batch 3 — Ambiguous Surface Audit

**Status:** Complete  
**Surfaces Gated:** 3  
**Surfaces Preserved:** 2 (confirmed real)  
**Implementation:** 15 conditional gates across 3 files

### Surfaces Gated (3)
1. TrustFabricConsole — localStorage-only PKI prototype, no real certificate infrastructure
2. HardwareApplianceManager — localStorage-only hardware planning shell, no hardware integration
3. ContinuityDrillCenter — localStorage-only drill planning shell, no real recovery testing

### Surfaces Preserved (2)
1. OfflineUpdateConsole — Real fleet integration via `useFleetState` hook, real Ed25519 signature verification, real crypto operations, real runtime events
2. CourierTransferCenter — Real artifact verification with Ed25519 signatures, real SHA-256 hash verification, real quarantine workflow

### Implementation Details
- 3 direct render gates in App.jsx (conditional blocks)
- 6 callback gates in App.jsx (3 EcosystemLauncher + 3 MissionControl)
- 3 section wraps in EcosystemLauncher.jsx (function checks)
- 3 button wraps in MissionControl.jsx (function checks)

### Verification
- Full test suite: All tests passing (79 E2E tests, full unit/contract/smoke suite)
- Flag off: Hollow surfaces not visible in DOM, real surfaces visible
- Flag on: All surfaces render correctly

### Documentation
- Completion report: `docs/lanes/hsg-batch3-completion.md`
- Agent handoff: `.kiro/lanes/hsg-batch3-finish.md`

---

## Pattern Documentation

### Core Pattern
- **Repo-facing:** `docs/patterns/hollow-surface-gating.md`
- **Agent-facing:** `.kiro/lanes/hollow-surface-gating.md`

### Process Support
- **Batch Index:** `docs/lanes/hsg-index.md` (this file)
- **Review Checklist:** `docs/checklists/hsg-review-checklist.md`
- **PR Template:** `docs/templates/hsg-pr-snippet.md`

---

## Remaining Suspected Surfaces (22)

The following surfaces have not been audited and remain visible to all users:

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
21. (2 additional surfaces to be identified)

---

## HSG Doctrine

HSG is not a cleanup tool; it is a trust-preservation doctrine for evidence-based product visibility.

Names are noise. Evidence is signal.  
Dead controls are failures, not neutral leftovers.  
Small ambiguous batches preserve rigor.  
The goal is honest staging, not beautified hiding.

---

## Next Batch Selection Criteria

Only pick surfaces that meet at least 2 of these:
- They look operational enough to mislead users
- They overlap with real product claims
- They are ambiguous enough that the audit could go either way
- They are reachable from a high-visibility surface

---

## Batch Stop Rule

- Audit 3 to 5 surfaces
- Gate only confirmed hollow
- Preserve confirmed real
- Defer anything mixed

---

## Flag Configuration

**Flag Name:** `INTERNAL_GTM_MODE`  
**Storage Key:** `neuralshell_internal_gtm_mode_v1`  
**Default:** Off (value `'0'` or absent)  
**Location:** localStorage

**When Off (Default):**
- All gated surfaces are completely hidden from UI
- Entry point buttons/links are not visible
- No console errors from missing callbacks

**When On (Internal Mode):**
- All surfaces (gated and real) are visible
- Internal teams can use GTM surfaces for sales, demo, and ops workflows

---

## References

- Architecture rules: `ARCHITECTURE_RULES.md`
- Product steering: `.kiro/steering/product.md`
- IPC contract: `IPC_CONTRACT.md`
