# NeuralShell RC Delta Summary  v1.2.1

## Main changes
- Hardened the workbench visibility model and centralized active-surface routing.
- Added async refresh-token/epoch gating so stale payloads are ignored naturally.
- Ensured hidden surfaces queue and apply async updates only when reactivated.
- Repaired the Playwright founder-flow suite to align with the async renderer.
- Refreshed the Microsoft Store screenshot assets.

## Key behavioral contract
- Async results may complete while a surface is hidden; the UI records, queues, and replays results only after validation.
- Hidden surfaces do not rerender stale content while inactive.
- Active surfaces apply only valid payloads once tokens/epochs confirm freshness.
- Stale responses are dropped by the refresh-token/epoch model without manual intervention.

## Observability additions
- `window.NeuralShellRenderer.getSurfaceDiagnostics()` exposes the last ~40 surface events that mention token reservations, epoch bumps, and stale checks, giving reviewers traceable reasons for render decisions.
- Release cockpit history now calls `renderReleaseCockpit()` and the artifact history helper after session load so tests and reviewers see the populated list immediately.

## Test status target
- `npm run lint`
- `npm run test:e2e`
- `npm run channel:store:screenshots`

## Remaining low-severity risks
- Release history rendering relies on explicit rerender calls; future auto-render changes will require adapting the harness.
- The hidden patch preview stub mirrors the current renderer; if the preview completion hook changes, the test stub and diagnostics will need updates.

## Recommended release checkpoint
- `neuralshell-v1.2.1-async-gating`
