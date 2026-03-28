# Incident Mode

Incident Mode provides a dedicated degraded/critical response flow inside NeuralShell.

## Capabilities

- Declare incidents with severity and affected nodes.
- Auto-capture runtime events into incident timelines.
- Apply recovery playbooks from a local, inspectable catalog.
- Trigger safe-mode policy posture directly from incident workflow.
- Export incident bundles for support/audit handoff.

## Included Playbooks

- provider bridge failure
- repeated relay failure
- proof engine stall
- policy corruption
- update verification failure
- vault access failure
- fleet node degraded/unreachable

## Operational Guardrails

- No hidden cloud dependency.
- Timeline and exports remain local by default.
- Safety actions are logged in runtime event feed.