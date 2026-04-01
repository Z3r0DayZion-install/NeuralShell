# Workbench Visibility Model

## Composer Head Purpose
The composer head is the grounding strip above the collapsed workbench that keeps the operator aware of the active purpose: workflow, provider, context, and streaming posture. It also surfaces the active workspace/LLM combination and any pending command state so the user always knows which surface is responsible for the right-rail content.

## Workbench Cards and Active Surfaces
- Each card (artifact, patch, apply) is a `workbenchSurface` and is driven by a dedicated render function that only runs when that surface is active or when a queued refresh explicitly forces it.
- A `surfaceEpoch` lifecycle per surface ensures stale renders are dropped: every meaningful state change increments the epoch and any asynchronous render (preview, apply, verification) passes the epoch it was built with.
- Switching surfaces no longer invalidates queued updates; instead, re-rendering happens on the next activation so hidden panels stay deterministic and do not repaint mid-transition.

## Right-Rail Rendering Contract
- Right-rail panels only paint if `appState.workbenchSurface` matches the target surface, unless a forced render is explicitly allowed (now limited to when the surface is visible).
- `forceRender` is gated by `appState.workbenchSurface === <surface>`, so hidden surfaces keep their DOM untouched until they are shown via `setWorkbenchSurface`.
- The patch/apply/ artifact renderers also respect `surfaceEpoch` to make sure only the most recent generation can mutate the DOM.

## Async Refresh Contract
- Each surface (artifact, patch, apply) exposes a `surfaceRefreshToken`. Every asynchronous refresh (`previewPatchPlanFiles`, `applyPatchPlanFiles`, `previewWorkspaceActionProposal`, `applyWorkspaceActionProposal`, `runVerificationRunPlanSelectedChecks`, etc.) captures a token at the start of the operation via `reserveSurfaceRefreshToken`.
- Before applying results, the renderer checks `isSurfaceRefreshTokenCurrent`. If the capture is stale, the response is ignored; only the latest request per surface can update `appState`.
- Visible renderings occur only when the request is still current **and** the surface is active. Hidden surfaces only update their stored state in the background; their DOM refresh is deferred until the user reactivates the surface via `setWorkbenchSurface`, which itself always reruns the appropriate render path.
- Session loads, workspace edits, and navigation continue to call `ensureSurfaceEpoch` so the epoch metadata stays in sync with right-rail snapshots.

## Reset Conditions
- Switching sessions, attaching a new workspace, or reloading the workspace summary invalidates and flushes patch plans, verification plans, and release cockpits before the inspector re-renders.
- `setWorkbenchSurface` drives the inspector stack by setting `appState.inspectorSurface` to `workbench` and ensuring the newly active surface is rendered with a fresh epoch.

## Inbox Ranking Summary
- Inbox entries are ranked by pinned/live/staged/unread flags such that actionable, high-priority items surface at the top. Rich tags, timestamps, and workspace linkages are rendered so the control center reads like a triage board rather than a dump.
- Partial metadata gracefully falls back to contextual copy while tags are collapsed if necessary to limit clutter.

## Empty / Loading / Error Expectations
- Each surface renders a descriptive empty state when no artifact, patch plan, or workspace action exists, outlining the next user action.
- Skeleton loading states are only shown when the surface is active; asynchronous responses do not trigger loading visuals on hidden surfaces.
- Errors and retryable failures surface both in the surface-specific copy and through banners, and `showBanner` is only called after an asynchronous refresh survives the current refresh token guard.

## Known Edge Cases
- Out-of-order verification runs are handled by the refresh token guard, but future verification integrations must capture the token before calling the `window.api.verification.run` channel.
- Hidden asynchronous previews still mutate `appState`; therefore any new right-rail surface must hook into the same `reserveSurfaceRefreshToken` / `isSurfaceRefreshTokenCurrent` discipline.

## Test Coverage Map
- The Playwright e2e suite now includes targeted fixtures that cover stale render epochs (`reserveWorkbenchSurfaceEpoch`), hidden panel silencing, and async patch/apply previews while the surface is switched away.
- The new _hidden patch surface_ test verifies that an async preview updates the active DOM only after `setWorkbenchSurface("patch")`, ensuring hidden surfaces do not repaint prematurely while remaining ready with the latest data.
- Existing tests for `previewPatchPlanFiles` and `previewWorkspaceActionProposal` already assert that `appState` keeps the newest payload and that stale results are dropped.

## Observability hooks
- `window.NeuralShellRenderer.getSurfaceDiagnostics()` exposes the most recent surface events so reviewers can see token/reserved/epoch transitions and whether a response was accepted or dropped.
- Surface diagnostic entries include `category` (e.g., `reserve-token`, `token-current`, `stale-token`, `new-epoch`), `surface`, and timestamps linked to the current epoch/token pair, making it easier to trace why an update was rendered.

## Remaining Risks
- None identified.
