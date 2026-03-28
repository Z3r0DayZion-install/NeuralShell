# Hollow Surface Gating — IP Gold Deliverable

## 1. Canonical Pattern Name

**Hollow Surface Gating (HSG)** — A credibility-preservation pattern for managing unimplemented UI surfaces in production applications without removing them entirely.

Alternative names for cross-project use:
- Feature Credibility Gate
- Unimplemented Surface Quarantine
- Internal-Only Surface Isolation

---

## 2. IP Value Statement

### Why This Matters Beyond the Local Diff

Hollow surfaces—UI that appears functional but lacks backend wiring—are a silent trust killer. Users encounter them, attempt to use them, and experience either dead controls or fake data. This creates cognitive dissonance: the product claims to be production-grade but contains theatrical elements.

The Hollow Surface Gating pattern solves this without requiring immediate implementation or removal:

1. **Preserves internal workflows** — Sales, ops, and demo teams retain access to GTM surfaces via a flag
2. **Protects user trust** — Normal users never see unimplemented surfaces
3. **Enables staged rollout** — Surfaces can be implemented incrementally without UI churn
4. **Maintains audit trail** — Deferred surfaces are explicitly documented, not hidden in code comments

### Reusable Product/IP Value Created

- **Credibility framework** — A repeatable pattern for managing the gap between product vision and implementation
- **Trust metric** — Hollow surface count becomes a measurable quality gate (should trend toward zero)
- **Staged delivery model** — Enables "internal-first, user-ready" release discipline
- **Governance template** — Can be applied to any Electron/React app with similar architecture

---

## 3. Doctrine Note

Hollow surfaces destroy trust because they signal either incompleteness or deception. A user who clicks a button expecting functionality and finds a dead control or fake data learns that the product is not what it claims to be. This is worse than a missing feature—it's a broken promise. The correct treatment is internal-only gating: keep the surface accessible to teams who understand its status (sales, ops, demo), but remove it from the user-facing product until it is genuinely implemented. This preserves the ability to iterate internally while maintaining the integrity of the user-facing product. Gating is not hiding; it is honest staging.

---

## 4. Gold Changelog Entry

```markdown
### Credibility - Gated unimplemented GTM surfaces from user view

- Introduced Hollow Surface Gating (HSG) pattern for managing unimplemented UI
- Gated 5 confirmed hollow GTM surfaces behind `INTERNAL_GTM_MODE` flag
- Surfaces now visible only to internal teams (sales, ops, demo) when flag enabled
- Normal users see only production-ready surfaces
- 35 suspected surfaces documented and deferred for future audit with direct evidence
- Establishes credibility framework for staged feature rollout
```

---

## 5. Gold PR Summary

**Problem:** NeuralShell exposed 5 unimplemented GTM console surfaces to users. These surfaces had no backend wiring (localStorage-only, hardcoded fake metrics, no IPC integration) but appeared real in the UI, undermining product credibility.

**Solution:** Implemented Hollow Surface Gating (HSG) pattern: added `INTERNAL_GTM_MODE` flag (localStorage-backed, default off) to gate 5 confirmed hollow console renders, hide 5 entry points in MissionControl, and hide 5 entry point sections in EcosystemLauncher. Internal teams retain full access when flag enabled.

**Implementation:** 25 conditional gates across 3 files (10 callback gates, 5 direct renders, 5 button wraps, 5 section wraps). All tests passing.

**Impact:** Users now see only production-ready surfaces. Internal teams can continue using GTM surfaces for sales/demo workflows. Establishes reusable pattern for managing the implementation gap.

---

## 6. Reviewer Note

This PR introduces the Hollow Surface Gating pattern to manage unimplemented UI surfaces without removing them. 5 confirmed hollow GTM surfaces are now gated behind `INTERNAL_GTM_MODE` flag (default off), preserving internal access while protecting user trust. Implementation is surgical: 25 conditional gates across 3 files, all tests passing. 35 suspected surfaces remain visible and will be audited in future passes with direct evidence before gating. No scope creep.

---

## 7. Operator Note

**Internal-Only Flag Behavior:**

- **Flag name:** `INTERNAL_GTM_MODE`
- **Storage:** localStorage key `neuralshell_internal_gtm_mode_v1`
- **Default:** Off (value `'0'` or absent)
- **When off:** 5 confirmed hollow GTM surfaces are completely hidden from UI. Users cannot access them.
- **When on:** All surfaces visible. Internal teams can use GTM surfaces for sales, demo, and ops workflows.
- **To enable:** Set localStorage value to `'1'` via browser console or internal tooling.
- **Surfaces affected:** PilotConversionConsole, StrategicAccountConsole, RevenueOpsConsole, BoardOperatingPackConsole, EcosystemCommandCenter.

---

## 8. Pattern Reuse Guidance

### How to Apply HSG to the Next 35 Suspected Surfaces

1. **Audit phase** — For each suspected surface, gather direct evidence:
   - Does it have real IPC handlers? (check `src/main.js` and `IPC_CONTRACT.md`)
   - Does it persist state beyond localStorage? (check `src/core/stateManager.js`)
   - Does it integrate with backend services? (check `src/core/llmService.js`, `src/daemon/`)
   - Does it show real data or hardcoded/fake data? (inspect component render logic)

2. **Classification** — Mark as:
   - **Confirmed real** — Has backend wiring, real data, IPC integration
   - **Confirmed hollow** — localStorage-only, fake metrics, no IPC
   - **Suspected hollow** — Unclear; needs deeper inspection
   - **Deferred** — Not worth gating in this pass; revisit later

3. **Gating implementation** — For each confirmed hollow surface:
   - Add callback gate in App.jsx (ternary conditional: `internalGtmMode ? () => {...} : undefined`)
   - Add direct render gate in App.jsx (conditional: `{internalGtmMode && (<Component ...)}`)
   - Add button/entry point wrap in child components (conditional: `{typeof onOpen* === 'function' && (<button ...)}`)
   - Verify all tests pass before committing

4. **Documentation** — For each batch:
   - Update changelog with surfaces gated
   - Document deferred surfaces in PR description
   - Link to audit evidence in commit message

### Reusable Gate Template

```jsx
// In App.jsx: callback gate (ternary)
onOpenConfirmedHollow={internalGtmMode ? () => {
  setShowEcosystem(false);
  setShowConfirmedHollow(true);
} : undefined}

// In App.jsx: direct render gate (conditional)
{internalGtmMode && (
  <ConfirmedHollowConsole
    open={showConfirmedHollow}
    onClose={() => setShowConfirmedHollow(false)}
  />
)}

// In child component: entry point wrap (conditional)
{typeof onOpenConfirmedHollow === 'function' && (
  <button onClick={onOpenConfirmedHollow}>
    Open Confirmed Hollow
  </button>
)}
```

---

## 9. Next Lane Recommendation

### Highest-Value Follow-Up: **Audit + Gate Batch 1 (10 Suspected Surfaces)**

**Justification:**

1. **Momentum** — HSG pattern is now proven and documented; next batch can move faster
2. **High-confidence targets** — Several suspected surfaces have obvious hollow indicators:
   - `RevenueOpsConsole` — Already gated; similar surfaces likely hollow
   - `StrategicAccountConsole` — Already gated; related surfaces likely hollow
   - `ExecutiveScaleDashboard` — Name suggests reporting; check for real data sources
   - `PartnerNetworkGovernance` — Name suggests multi-node coordination; check for IPC
   - `EcosystemPortfolioConsole` — Name suggests aggregation; check for real data

3. **Measurable outcome** — Audit 10 surfaces, gate 3–5 confirmed hollow, defer 5–7 for later
4. **Credibility gain** — Each batch reduces hollow surface count; visible progress toward "production-ready"
5. **Reuse validation** — Applying HSG pattern to 10 more surfaces will reveal any gaps in the template

**Estimated effort:** 2–3 hours (audit + implementation + testing)

---

## 10. Archive Note

The Hollow Surface Gating lane established the credibility-preservation pattern for NeuralShell. Rather than removing unimplemented UI surfaces or leaving them exposed to users, HSG introduced a staged approach: gate surfaces behind an internal-only flag, preserve internal workflows, and document deferred surfaces for future audit. This pattern became foundational to NeuralShell's release discipline, enabling the product to ship with incomplete features visible only to internal teams while maintaining user-facing integrity. The lane produced 25 conditional gates across 3 files, established a reusable audit template, and created a measurable quality metric (hollow surface count trending toward zero). Future lanes should apply HSG to the remaining 35 suspected surfaces in batches, using the audit template and gate template defined here.

---

## Implementation Artifacts

### Files Modified
- `src/renderer/src/App.jsx` — 10 callback gates + 5 direct render gates + 1 flag + 1 helper + 1 state + 1 effect
- `src/renderer/src/components/MissionControl.jsx` — 5 button render wraps
- `src/renderer/src/components/EcosystemLauncher.jsx` — 5 entry point section wraps

### Test Results
- Full test suite: All tests passing (0 failures)
- E2E tests: 14 tests passed (12.8s)
- Smoke tests: Passing
- Unit tests: Passing
- Contract tests: Passing
- Security tests: Passing

### Surfaces Gated (5 Confirmed Hollow)
1. PilotConversionConsole — localStorage-only, no pilot tracking backend
2. StrategicAccountConsole — localStorage-only, no CRM integration
3. RevenueOpsConsole — localStorage-only, fake metrics
4. BoardOperatingPackConsole — localStorage-only, no backend
5. EcosystemCommandCenter — aggregates hollow consoles

### Surfaces Deferred (35 Suspected)
Procurement Command Center, Tamper Simulation Center, Institutional Command Console, Demo Flow Console, Deployment Program Center, Training Delivery Center, Support Ops Console, Buyer Evaluation Center, Commercial Package Console, Field Launch Command Center, Partner Rollout Console, Buyer Ops Console, Demo To Pilot Console, Pilot Expansion Console, Renewal Risk Console, Launch Week Command Center, Followup Generator, Field Feedback Console, Partner Certification Hub, Managed Services Console, Portfolio Rollout Planner, Channel Expansion Planner, Cross Account Renewal Matrix, Executive Scale Dashboard, Ecosystem Portfolio Console, Service Line Console, Partner Network Governance, Global Planning Console, Ecosystem Revenue Planner, Licensed Operator Framework, Trust Fabric Console, Hardware Appliance Manager, Courier Transfer Center, Continuity Drill Center, Offline Update Console.

---

## Reuse Checklist

- [ ] Pattern name is clear and reusable across projects
- [ ] IP value statement explains why this matters beyond the local diff
- [ ] Doctrine note is concise and principle-based
- [ ] Changelog entry is suitable for product history
- [ ] PR summary is tight and factual
- [ ] Reviewer note is skimmable and honest
- [ ] Operator note explains flag behavior clearly
- [ ] Reuse guidance includes audit template and gate template
- [ ] Next lane recommendation is justified and measurable
- [ ] Archive note explains how this lane should be remembered
- [ ] No overstatement, fake percentages, vague praise, or weak naming
- [ ] All artifacts are documented and linked
