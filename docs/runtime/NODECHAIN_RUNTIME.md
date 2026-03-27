# NodeChain Runtime

NodeChain is a local rule engine and scheduler for runtime automation.

## Guarantees
- Local-only execution path.
- Explicit action allowlist for script execution.
- Per-rule enable/disable control.
- Dry-run simulation for deterministic preview.
- Execution log capture for every rule dispatch.

## Event Types
Supported baseline events:
- `provider.sweep.passed`
- `provider.sweep.failed`
- `vault.unlocked`
- `vault.locked`
- `proof.started`
- `proof.passed`
- `proof.failed`
- `relay.sent`
- `relay.failed`
- `policy.changed`
- `update.verification.failed`
- `collab.peer.joined`
- `collab.peer.left`
- `runtime.watchdog.alert`

## Actions
- show alert
- open panel
- share proof badge
- snapshot state
- disable relay
- block update apply
- prompt vault save
- write audit log
- switch safe policy
- run allowlisted local script

## Starter Rules
Shipped in `src/renderer/src/config/nodechain_starter_rules.json`:
1. Provider sweep success -> prompt vault save.
2. Proof pass -> share badge + snapshot.
3. Policy change -> log + snapshot.
4. Update verification fail -> block apply + alert.
5. Relay failure x3 -> disable relay + alert.
6. Collab disconnect -> degraded session alert/log.

## Runtime Integration
- Global NodeChain engine subscribes to runtime events from `runtimeEventBus`.
- NodeChain panel allows manual event dispatch, editing, and log inspection.
- Rule changes persisted in local storage key `neuralshell_nodechain_rules_v1`.