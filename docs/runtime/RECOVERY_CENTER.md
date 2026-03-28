# Recovery Center

Recovery Center handles sealed backup and restore for operational state.

## Bundle Scope

- policy profiles
- NodeChain rules
- runtime snapshots
- operator layouts
- release truth cache
- marketplace receipts
- fleet config
- optional analytics bundles

## Controls

- signed export
- signature/hash verification before restore
- restore preview diff
- full/partial/safe-mode restore

## Safety

- secrets excluded by default
- safe-mode restore applies offline-only + frozen update posture