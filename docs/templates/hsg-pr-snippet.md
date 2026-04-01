# HSG PR Template Snippet

Use this template when creating PRs that apply the Hollow Surface Gating (HSG) pattern.

---

## One-Line Reference

```
This PR applies the Hollow Surface Gating (HSG) pattern documented in docs/patterns/hollow-surface-gating.md to gate [N] confirmed hollow surfaces behind the INTERNAL_GTM_MODE flag.
```

---

## Full PR Template

### Problem

[Brief description of the trust issue: which surfaces are hollow, why they undermine credibility, what users would experience if they encountered them]

Example:
> NeuralShell exposed 3 unimplemented enterprise console surfaces to users. These surfaces had no backend wiring (localStorage-only, hardcoded fake metrics, no IPC integration) but appeared real in the UI, undermining product credibility.

---

### Solution

[Brief description of the HSG implementation: flag added, surfaces gated, entry points hidden, internal access preserved]

Example:
> Implemented Hollow Surface Gating (HSG) pattern: added `INTERNAL_GTM_MODE` flag (localStorage-backed, default off) to gate 3 confirmed hollow console renders, hide 3 entry points in MissionControl, and hide 3 entry point sections in EcosystemLauncher. Internal teams retain full access when flag enabled.

---

### Classification Outcome

**Surfaces Gated ([N] Confirmed Hollow):**
1. [SurfaceName] — [Evidence: localStorage-only, no IPC, no backend, fake data]
2. [SurfaceName] — [Evidence: localStorage-only, no IPC, no backend, fake data]
3. [SurfaceName] — [Evidence: localStorage-only, no IPC, no backend, fake data]

**Surfaces Preserved ([N] Confirmed Real):**
1. [SurfaceName] — [Evidence: real IPC handlers, real backend integration, real crypto operations]
2. [SurfaceName] — [Evidence: real IPC handlers, real backend integration, real crypto operations]

**Surfaces Deferred ([N] Suspected):**
- [List of surfaces deferred for future audit with reason]

---

### Implementation

**Total Gates:** [N] conditional gates across [N] files

**Breakdown:**
- [N] direct render gates in App.jsx (conditional blocks)
- [N] callback gates in App.jsx (ternary conditionals)
- [N] section wraps in EcosystemLauncher.jsx (function checks)
- [N] button wraps in MissionControl.jsx (function checks)

**Files Modified:**
- `src/renderer/src/App.jsx`
- `src/renderer/src/components/EcosystemLauncher.jsx`
- `src/renderer/src/components/MissionControl.jsx`

---

### Tests Run

**Full Test Suite:**
- ✓ Unit tests: All passing
- ✓ Contract tests: All passing
- ✓ Smoke tests: All passing
- ✓ Security tests: All passing
- ✓ E2E tests: [N] tests passed

**Behavior Verification:**
- ✓ Flag off: Gated surfaces not visible in DOM
- ✓ Flag off: Entry point buttons/links not visible
- ✓ Flag off: No console errors
- ✓ Flag on: Gated surfaces render correctly
- ✓ Flag on: Entry points visible and functional
- ✓ Confirmed real surfaces visible in both modes

---

### Impact

[Brief description of the user-facing and internal impact]

Example:
> Users now see only production-ready surfaces. Internal teams can continue using GTM surfaces for sales/demo workflows. Establishes reusable pattern for managing the implementation gap.

---

### Reviewer Note

[Brief summary for reviewers: what changed, why it matters, what to verify]

Example:
> This PR applies the Hollow Surface Gating (HSG) pattern to gate 3 confirmed hollow surfaces behind `INTERNAL_GTM_MODE` flag (default off), preserving internal access while protecting user trust. Implementation is surgical: 15 conditional gates across 3 files, all tests passing. 5 suspected surfaces remain visible and will be audited in future passes with direct evidence before gating. No scope creep.

---

## Commit Message Template

```
[feat|fix|docs](ui|hsg): [brief description]

This commit applies the Hollow Surface Gating (HSG) pattern documented in
docs/patterns/hollow-surface-gating.md to gate [N] confirmed hollow surfaces
behind the INTERNAL_GTM_MODE flag.

Surfaces gated:
- [SurfaceName] ([evidence])
- [SurfaceName] ([evidence])
- [SurfaceName] ([evidence])

Surfaces preserved (confirmed real):
- [SurfaceName] ([evidence])
- [SurfaceName] ([evidence])

Implementation: [N] conditional gates across [N] files
- [N] direct render gates in App.jsx
- [N] callback gates in App.jsx
- [N] section wraps in EcosystemLauncher.jsx
- [N] button wraps in MissionControl.jsx

All tests passing ([N] E2E tests, full unit/contract/smoke suite).

Follows HSG pattern documented in docs/patterns/hollow-surface-gating.md.
```

---

## Quick Reference

**HSG Pattern Doc:** `docs/patterns/hollow-surface-gating.md`  
**HSG Batch Index:** `docs/lanes/hsg-index.md`  
**HSG Review Checklist:** `docs/checklists/hsg-review-checklist.md`

**Flag Name:** `INTERNAL_GTM_MODE`  
**Storage Key:** `neuralshell_internal_gtm_mode_v1`  
**Default:** Off

**4-Layer Pattern:**
1. Direct renders (App.jsx) — `{internalGtmMode && (<Component />)}`
2. Callbacks (App.jsx) — `internalGtmMode ? callback : undefined`
3. Sections (EcosystemLauncher.jsx) — `{typeof callback === 'function' && (...)}`
4. Buttons (MissionControl.jsx) — `{typeof callback === 'function' && (<button />)}`

---

## Doctrine Reminder

HSG is not a cleanup tool; it is a trust-preservation doctrine for evidence-based product visibility.

Names are noise. Evidence is signal.  
Dead controls are failures, not neutral leftovers.  
Small ambiguous batches preserve rigor.  
The goal is honest staging, not beautified hiding.
