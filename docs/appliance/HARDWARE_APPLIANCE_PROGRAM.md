# HARDWARE_APPLIANCE_PROGRAM

## Objective

Provide reproducible appliance deployment variants with profile-specific provisioning and support workflows.

## Profile Catalog

Source:

- `appliance/hardware/hardwareProfiles.json`

Profiles:

- `desktop_appliance`
- `mini_node_appliance`
- `relay_appliance`
- `oversight_appliance`

## Build Generation

Run:

```bash
npm run hardware:build
```

Output:

- `release/hardware-appliance/hardware-build-<timestamp>/`
- per-profile `build_manifest.json`
- per-profile `support_bundle_profile.json`
- per-profile `decommission_checklist.json`
- root `manifest.json` with reproducibility digest

## Provisioning

The Hardware Appliance Manager includes:

- first-boot provisioning wizard
- role binding capture
- baseline controls checklist
- profile-specific diagnostics scope

## Support Bundle Scope

Support bundles are intentionally constrained to profile diagnostics only to reduce spillover of unrelated runtime data.

## Retirement / Decommission

Exportable decommission checklist includes:

1. freeze runtime policy and update lane
2. export scoped diagnostics
3. revoke appliance certificate
4. secure erase with verification
5. retirement attestation handoff
