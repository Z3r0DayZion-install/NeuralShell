# HSG Review Checklist

Use this checklist when reviewing Hollow Surface Gating (HSG) PRs to ensure classification discipline, implementation consistency, and verification completeness.

---

## 1. Audit Evidence Quality

### Classification Evidence
- [ ] Each gated surface has documented evidence (not just naming intuition)
- [ ] IPC handler check performed (checked `src/main.js` and `IPC_CONTRACT.md`)
- [ ] State persistence check performed (checked `src/core/stateManager.js`)
- [ ] Backend integration check performed (checked `src/core/`, `src/daemon/`)
- [ ] Data source check performed (real vs hardcoded/fake data)
- [ ] Crypto operations check performed (real vs localStorage-only)

### Evidence Documentation
- [ ] Classification evidence is included in PR description or lane doc
- [ ] localStorage keys are documented for hollow surfaces
- [ ] Real integration points are documented for preserved surfaces
- [ ] Deferred surfaces have clear reason for deferral

---

## 2. Classification Discipline

### Confirmed Hollow
- [ ] Only surfaces with direct evidence are classified as confirmed hollow
- [ ] No suspected surfaces gated without proof
- [ ] All gated surfaces meet hollow criteria (localStorage-only, no IPC, no backend, fake data)

### Confirmed Real
- [ ] Real surfaces are explicitly preserved (not gated)
- [ ] Real integration points are documented
- [ ] Real surfaces have IPC handlers, backend integration, or real crypto operations

### Deferred
- [ ] Deferred surfaces have insufficient evidence for classification
- [ ] Deferred surfaces are documented for future audit
- [ ] Deferred surfaces remain visible (not gated)

---

## 3. Implementation Consistency

### 4-Layer Gating Pattern
- [ ] Direct render gates use conditional blocks: `{internalGtmMode && (<Component />)}`
- [ ] Callback gates use ternary conditionals: `internalGtmMode ? callback : undefined`
- [ ] Section wraps check callback existence: `{typeof callback === 'function' && (...)}`
- [ ] Button wraps check callback existence: `{typeof callback === 'function' && (<button />)}`

### Flag Usage
- [ ] Same flag name used: `INTERNAL_GTM_MODE`
- [ ] Same storage key used: `neuralshell_internal_gtm_mode_v1`
- [ ] Flag defaults to off (localStorage absent or `'0'`)
- [ ] Flag state is managed in App.jsx or equivalent root component

### No Visible-But-Inert Controls
- [ ] All entry points are completely hidden when flag is off
- [ ] No buttons visible with undefined callbacks
- [ ] No sections visible with undefined callbacks
- [ ] No console errors from missing callbacks

---

## 4. Scope Discipline

### No Scope Creep
- [ ] Only confirmed hollow surfaces are touched
- [ ] No refactoring of unrelated code
- [ ] No changes to confirmed real surfaces (unless preserving them)
- [ ] No changes to deferred surfaces

### Batch Size
- [ ] Batch size is 3–10 surfaces (small enough for rigorous review)
- [ ] Ambiguous surfaces are audited in small batches (3–5)
- [ ] No giant cleanup batches

---

## 5. Verification Completeness

### Test Coverage
- [ ] Full test suite run and passing (unit, contract, smoke, security)
- [ ] E2E tests run and passing
- [ ] No test regressions
- [ ] Tests verify surfaces are hidden when flag is off
- [ ] Tests verify surfaces appear when flag is on

### Behavior Verification
- [ ] Flag off: Gated surfaces not rendered in DOM
- [ ] Flag off: Entry point buttons/links not visible
- [ ] Flag off: No console errors
- [ ] Flag on: Gated surfaces render correctly
- [ ] Flag on: Entry points visible and functional
- [ ] Confirmed real surfaces visible in both modes

---

## 6. Counts and Math

### Surface Counts
- [ ] Total gated surfaces count is correct
- [ ] Confirmed real surfaces count is correct (if any)
- [ ] Remaining suspected surfaces count is correct
- [ ] Batch count matches implementation (gates match surfaces)

### Gate Counts
- [ ] Direct render gates count is correct
- [ ] Callback gates count is correct
- [ ] Section wraps count is correct
- [ ] Button wraps count is correct
- [ ] Total gates count matches breakdown

### Diff Math
- [ ] Files modified count is correct
- [ ] Lines added/removed are reasonable for scope
- [ ] No unexpected file changes

---

## 7. Documentation Quality

### Commit Message
- [ ] Lists exact surfaces gated
- [ ] Includes implementation summary (gate counts)
- [ ] References HSG pattern doc
- [ ] Uses correct prefix: `feat(ui)` for batches, `fix(ui)` for consistency fixes, `docs(hsg)` for docs

### PR Description
- [ ] Includes classification evidence
- [ ] Lists surfaces gated and preserved
- [ ] Documents deferred surfaces (if any)
- [ ] References HSG pattern doc
- [ ] Includes verification results

### Lane Documentation
- [ ] Completion report created (if batch complete)
- [ ] Agent handoff created (if needed for next batch)
- [ ] HSG index updated with batch summary

---

## 8. Pattern Adherence

### HSG Doctrine
- [ ] Classification is evidence-based, not name-based
- [ ] Small ambiguous batches preserve rigor
- [ ] No suspected surfaces gated without proof
- [ ] Confirmed real surfaces are preserved
- [ ] Deferred surfaces are documented

### Batch Selection Criteria (for Batch 4+)
- [ ] Surfaces meet at least 2 of 4 criteria:
  - Look operational enough to mislead users
  - Overlap with real product claims
  - Ambiguous enough that audit could go either way
  - Reachable from high-visibility surface

### Stop Rule
- [ ] Batch audits 3–5 surfaces (not more)
- [ ] Only confirmed hollow surfaces are gated
- [ ] Confirmed real surfaces are preserved
- [ ] Mixed/unclear surfaces are deferred

---

## 9. Reviewer Sign-Off

### Final Checks
- [ ] All checklist items above are verified
- [ ] Implementation is surgical (no scope creep)
- [ ] Tests are green
- [ ] Documentation is complete
- [ ] Pattern is followed consistently

### Reviewer Notes
- [ ] Any concerns or questions documented
- [ ] Any follow-up actions identified
- [ ] Any pattern improvements suggested

---

## Quick Reference

**HSG Pattern Doc:** `docs/patterns/hollow-surface-gating.md`  
**HSG Batch Index:** `docs/lanes/hsg-index.md`  
**HSG PR Template:** `docs/templates/hsg-pr-snippet.md`

**Flag Name:** `INTERNAL_GTM_MODE`  
**Storage Key:** `neuralshell_internal_gtm_mode_v1`  
**Default:** Off

**4-Layer Pattern:**
1. Direct renders (App.jsx)
2. Callbacks (App.jsx)
3. Sections (EcosystemLauncher.jsx)
4. Buttons (MissionControl.jsx)

---

## Doctrine Reminder

HSG is not a cleanup tool; it is a trust-preservation doctrine for evidence-based product visibility.

Names are noise. Evidence is signal.  
Dead controls are failures, not neutral leftovers.  
Small ambiguous batches preserve rigor.  
The goal is honest staging, not beautified hiding.
