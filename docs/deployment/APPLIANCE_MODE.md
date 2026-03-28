# Appliance Mode

NeuralShell appliance mode is a constrained operator profile for trusted environments where the runtime is used as a relay/control appliance.

## Properties

- Distinct appliance identity and badge in the UI.
- Stricter defaults: offline-first, remote bridge disabled, locked update lane.
- Reduced module surface to operational consoles.
- Explicit runtime logging for critical appliance actions.

## Generate Appliance Artifact

```bash
node scripts/gen_appliance_build.cjs
```

Output: `release/appliance-build/<profile>-<timestamp>/`

## Runtime Expectations

- Appliance mode does not bypass policy/proof/audit safeguards.
- Unverified update artifacts remain blocked.
- Mode transitions are recorded in the runtime event feed.