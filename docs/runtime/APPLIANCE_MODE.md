# Appliance Mode (Runtime)

Appliance mode provides an operator-focused runtime profile for hardened relay/control deployments.

## Runtime Behavior

- explicit appliance badge
- reduced ecosystem module surface
- stricter defaults (offline-first, locked updates)
- action logging with appliance context

## Build Artifact

Generate reproducible appliance profile artifact with:

```bash
node scripts/gen_appliance_build.cjs
```