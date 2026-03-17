# NeuralShell Founder Review Guide  v1.2.1

## Manual Flow 1 — Hidden Patch Preview
1. Open the patch surface.
2. Trigger a patch preview.
3. Switch to another surface while the preview is pending.
4. Let the preview promise resolve (use `window.previewPlanResolver` or wait until `window.previewPlanRequested` is true).
5. Return to the patch surface.

### Expected
- The baseline state remains visible while the preview surface is hidden.
- No stale banners or duplicate renders appear.
- The latest patch plan renders only after the surface is re-opened, preventing stale mutations.

### Regression signs
- Hidden patch resurfacing immediately with new content.
- Stale preview data overwriting currently displayed plan.
- Duplicate banners or inconsistent titles when returning.

## Manual Flow 2 — Release Cockpit Reload
1. Load or reload a saved release session (e.g., `ReleasePacketHistory`).
2. Open the release cockpit/history surface.
3. Confirm the history stack populates with loaded release packets and action buttons are enabled.

### Expected
- History cards repopulate deterministically after session load.
- Controls (stage/run/build) remain visible and actionable without manual rerender.
- No blank or partially rendered cockpit appears.

### Regression signs
- Missing history cards or empty cockpit despite valid history.
- Controls only appear after manual refresh.
- Release cockpit flickers or shows stale blocker state.

## Manual Flow 3 — Rapid Preview Race
1. Trigger a patch preview (A).
2. Trigger another preview (B) before the first completes.
3. Observe the final patch plan in the right rail.

### Expected
- The stale preview (A) is ignored.
- The latest preview (B) wins and renders after its token/epoch check passes.
- No UI flicker into stale content.

### Regression signs
- Earlier preview content overriding the latest preview.
- Inconsistent patch plan summary or verification steps.
- Hidden-surface mutation while the surface was inactive.

## Useful inspection hooks
- `window.appState` and `window.appState.surfaceEpochs`
- `window.NeuralShellRenderer.getWorkbenchSurfaceEpoch(surface)`
- `window.NeuralShellRenderer.reserveWorkbenchSurfaceRefreshToken(surface)`
- `window.NeuralShellRenderer.getSurfaceDiagnostics()` (inspects token/epoch events)

## Review acceptance
The RC is acceptable only if:
- All flows behave correctly without stale async mutation.
- Release history is stable after session load.
- Surface gating remains deterministic (no hidden-surface flicker).
