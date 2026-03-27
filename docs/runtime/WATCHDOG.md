# Watchdog

Runtime Watchdog is the Δ11 supervisor layer for failure detection and recovery.

## Monitored Systems
- Provider bridge availability.
- Relay path error state.
- Update verification integrity state.
- Vault lock/export/import health.

## Severity Levels
- `info`
- `warning`
- `degraded`
- `critical`

## Alert Model
Each alert carries:
- source
- severity
- message
- suggested action
- timestamp
- sticky flag
- acknowledged flag
- optional recovery timestamp

## Recovery Behaviors
- retry provider probes
- disable broken relay path
- freeze update auto-apply lane on verification failures
- switch to safe policy posture when needed

## UI Surfaces
- Top bar watchdog status badge with alert count.
- Runtime Alerts Drawer for full alert review and acknowledgment.
- Mission Control watchdog status card.

## Non-Silent Failure Rule
Sticky degraded/critical alerts remain visible until acknowledged.

## Security Constraint
Watchdog never auto-applies unverified updates.