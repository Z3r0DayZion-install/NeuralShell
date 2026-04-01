# Hollow Surface Gating (HSG)

## Pattern Name

**Hollow Surface Gating (HSG)** — A credibility-preservation pattern for managing unimplemented UI surfaces in production applications without removing them entirely.

## Problem It Solves

Hollow surfaces—UI that appears functional but lacks backend wiring—destroy user trust. Users encounter them, attempt to use them, and experience either dead controls or fake data. This creates cognitive dissonance: the product claims to be production-grade but contains theatrical elements.

Removing hollow surfaces entirely disrupts internal workflows (sales demos, ops tooling, GTM planning). Leaving them exposed to users undermines credibility.

HSG solves this by gating hollow surfaces behind an internal-only flag: internal teams retain access, users see only production-ready surfaces.

## When to Use It

Use HSG when:
- A UI surface exists but has no backend implementation
- The surface is used by internal teams (sales, ops, demo, support)
- Removing the surface would disrupt internal workflows
- The surface will be implemented eventually but not immediately
- User exposure to the surface would damage product credibility

## When Not to Use It

Do not use HSG when:
- The surface is fully implemented and production-ready
- The surface is not used by anyone (remove it instead)
- The surface is partially implemented and can be completed quickly (finish it instead)
- The surface is misleading even for internal use (remove it instead)
- The surface duplicates existing functionality without value (merge or remove instead)

## Classification Model

Before gating, classify each surface:

### Confirmed Real
- Has real IPC handlers (check `src/main.js`, `IPC_CONTRACT.md`)
- Persists state beyond localStorage (check `src/core/stateManager.js`)
- Integrates with backend services (check `src/core/`, `src/daemon/`)
- Shows real data, not hardcoded or fake data
- **Treatment:** Keep visible to all users

### Confirmed Hollow
- localStorage-only persistence
- Hardcoded or fake metrics
- No IPC integration
- No backend service integration
- **Treatment:** Gate behind internal-only flag

### Suspected / Deferred
- Unclear implementation status
- Needs deeper inspection
- Not worth gating in current pass
- **Treatment:** Document and defer to future audit

## Treatment Options

For each surface, choose one:

1. **Keep** — Surface is real and production-ready; no changes needed
2. **Relabel** — Surface is real but has misleading labels; rename only
3. **Gate** — Surface is hollow but used internally; apply HSG pattern
4. **Hide** — Surface is too early to show anyone; remove from UI entirely
5. **Remove** — Surface is confusing or unused; delete code
6. **Defer** — Surface status is unclear; document and revisit later

## Implementation Pattern

### Step 1: Add Internal-Only Flag

```javascript
// In App.jsx or equivalent root component
const INTERNAL_GTM_MODE_KEY = 'neuralshell_internal_gtm_mode_v1';

function readInternalGtmMode() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  return window.localStorage.getItem(INTERNAL_GTM_MODE_KEY) === '1';
}

const [internalGtmMode, setInternalGtmMode] = React.useState(() => readInternalGtmMode());

React.useEffect(() => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(INTERNAL_GTM_MODE_KEY, internalGtmMode ? '1' : '0');
}, [internalGtmMode]);
```

### Step 2: Gate Callback Props

```javascript
// In parent component passing callbacks to child components
<ChildComponent
  onOpenConfirmedHollow={internalGtmMode ? () => {
    setShowConfirmedHollow(true);
  } : undefined}
/>
```

### Step 3: Gate Direct Renders

```javascript
// In parent component rendering hollow surfaces
{internalGtmMode && (
  <ConfirmedHollowConsole
    open={showConfirmedHollow}
    onClose={() => setShowConfirmedHollow(false)}
  />
)}
```

### Step 4: Wrap Entry Points in Child Components

```javascript
// In child component (launcher, menu, control panel)
{typeof onOpenConfirmedHollow === 'function' && (
  <button onClick={onOpenConfirmedHollow}>
    Open Confirmed Hollow
  </button>
)}
```

## Verification Pattern

After implementation, verify:

1. **Flag off (default):**
   - Hollow surfaces are not rendered in DOM
   - Entry point buttons/links are not visible
   - No console errors from missing callbacks
   - All tests pass

2. **Flag on (internal mode):**
   - Hollow surfaces render when opened
   - Entry point buttons/links are visible
   - Callbacks execute correctly
   - All tests pass

3. **Test coverage:**
   - E2E tests verify surfaces are hidden by default
   - E2E tests verify surfaces appear when flag is enabled
   - Unit tests verify callback gating logic
   - No regressions in unrelated surfaces

## Reviewer Checklist

- [ ] Classification evidence is documented (IPC handlers, state persistence, backend integration)
- [ ] Only confirmed hollow surfaces are gated (no suspected surfaces without evidence)
- [ ] Callback gates use ternary conditionals (`internalGtmMode ? callback : undefined`)
- [ ] Direct renders use conditional blocks (`{internalGtmMode && (<Component />)}`)
- [ ] Entry points use function checks (`{typeof callback === 'function' && (<button />)}`)
- [ ] Flag defaults to off (localStorage absent or `'0'`)
- [ ] All tests pass (unit, E2E, smoke, contract, security)
- [ ] Deferred surfaces are documented in PR description
- [ ] Commit message lists exact surfaces gated
- [ ] No scope creep (only confirmed hollow surfaces touched)

## Reuse Guidance for Future Lanes

### Batch 4 Selection Criteria

Only pick surfaces that meet at least two of these:
- They look operational enough to mislead users
- They overlap with real product claims
- They are ambiguous enough that the audit could go either way
- They are reachable from a high-visibility surface

### Batch 4 Stop Rule

- Audit 3 to 5 surfaces
- Gate only confirmed hollow
- Preserve confirmed real
- Defer anything mixed

### Batch Size
Gate 3–10 surfaces per lane. Smaller batches reduce risk and enable faster review.

### Audit Template
For each suspected surface:
1. Check `src/main.js` for IPC handlers
2. Check `IPC_CONTRACT.md` for channel schemas
3. Check `src/core/stateManager.js` for persisted state fields
4. Check `src/core/` and `src/daemon/` for backend integration
5. Inspect component render logic for hardcoded/fake data
6. Classify as confirmed real, confirmed hollow, or deferred

### Gate Template
For each confirmed hollow surface:
1. Add callback gate in parent component (ternary conditional)
2. Add direct render gate in parent component (conditional block)
3. Add entry point wrap in child components (function check)
4. Verify all tests pass
5. Document in commit message and PR description

### Naming Consistency
Use the same flag name (`INTERNAL_GTM_MODE`) and storage key (`neuralshell_internal_gtm_mode_v1`) across all lanes. Do not create multiple flags for different surface categories.

### Documentation Standard
Each lane should produce:
- Commit message listing exact surfaces gated
- PR description with classification evidence
- Changelog entry suitable for product history
- Updated deferred surface list

## Example: NeuralShell Batch 1 (5 Surfaces)

**Surfaces Gated:**
- PilotConversionConsole — localStorage-only, no pilot tracking backend
- StrategicAccountConsole — localStorage-only, no CRM integration
- RevenueOpsConsole — localStorage-only, fake metrics
- BoardOperatingPackConsole — localStorage-only, no backend
- EcosystemCommandCenter — aggregates hollow consoles

**Implementation:**
- 10 callback gates in App.jsx (ternary conditionals)
- 5 direct render gates in App.jsx (conditional blocks)
- 5 button wraps in MissionControl.jsx (function checks)
- 5 section wraps in EcosystemLauncher.jsx (function checks)
- Total: 25 conditional gates across 3 files

**Verification:**
- Full test suite: All tests passing (0 failures)
- E2E tests: 14 tests passed (12.8s)
- Flag off: Surfaces not visible in DOM
- Flag on: Surfaces render correctly

**Deferred:**
35 suspected surfaces documented for future audit with direct evidence.

## PR Reference Template

Use this sentence in future PRs that apply HSG:

```
This PR applies the Hollow Surface Gating (HSG) pattern documented in docs/patterns/hollow-surface-gating.md to gate [N] confirmed hollow surfaces behind the INTERNAL_GTM_MODE flag.
```

## References

- Initial implementation: Commit `[hash]` (feat: gate confirmed hollow GTM surfaces)
- Pattern documentation: `docs/patterns/hollow-surface-gating.md`
- Agent reuse guide: `.kiro/lanes/hollow-surface-gating.md`
- Architecture rules: `ARCHITECTURE_RULES.md`
- Product steering: `.kiro/steering/product.md`

## Doctrine

HSG is not a cleanup tool; it is a trust-preservation doctrine for evidence-based product visibility.

Hollow surfaces destroy trust because they signal either incompleteness or deception. A user who clicks a button expecting functionality and finds a dead control or fake data learns that the product is not what it claims to be. This is worse than a missing feature—it's a broken promise. The correct treatment is internal-only gating: keep the surface accessible to teams who understand its status (sales, ops, demo), but remove it from the user-facing product until it is genuinely implemented. This preserves the ability to iterate internally while maintaining the integrity of the user-facing product. Gating is not hiding; it is honest staging.
