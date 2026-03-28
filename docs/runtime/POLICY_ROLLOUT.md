# Fleet Policy Rollout

NeuralShell policy rollout coordinates signed policy profile changes across imported fleet nodes.

## Flow

1. Import signed policy bundle.
2. Verify signature before trust.
3. Preview policy diff on selected targets.
4. Apply immediate or scheduled rollout.
5. Track rollout history and rollback actions.

## Guardrails

- Unsigned/invalid bundles are rejected.
- Rollout and rollback are recorded in runtime event feed.
- Node-level status remains visible after failed rollout attempts.