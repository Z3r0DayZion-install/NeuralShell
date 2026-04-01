# State Snapshots

Δ11 adds local runtime snapshots for side-by-side operational workflows.

## Split Workspace
- Left: command deck quick actions.
- Center: primary runtime/workflow context.
- Right: dynamic result pane + snapshot manager.

## Snapshot Operations
- Capture snapshot
- Restore snapshot
- Compare snapshots

## Captured Payload
- provider/model
- vault lock metadata
- policy profile
- proof status
- active panel hints
- collab room/peer metadata
- selected mission cards

## Security Hygiene
- Secret-like keys are redacted in snapshot payloads.
- Snapshot storage is local only.
- No automatic export of sensitive runtime material.

## Result Pane Modes
- proof stdout
- watchdog alerts
- release health
- runtime snapshots
- snapshot compare

## Files
- `src/renderer/src/components/SplitWorkspace.jsx`
- `src/renderer/src/components/ResultPaneRouter.jsx`
- `src/renderer/src/components/SnapshotManager.jsx`
- `src/renderer/src/runtime/snapshots/stateSnapshot.ts`