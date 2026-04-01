# AIR_GAPPED_OPERATIONS

## Scope

NeuralShell air-gapped mode is a first-class runtime posture for sealed networks with manual import/export boundaries.

## Runtime Controls

- `AirGap Operations Center` enforces transfer-chain visibility.
- `AirGap Lock` prevents outbound bridge assumptions in critical paths.
- every inbound artifact requires signature + hash verification before activation.
- unverified artifacts are quarantined and cannot be released.

## Bundle Generation

Use:

```bash
npm run airgap:bundle
```

This creates a signed air-gap bundle under `release/airgap/` with:

- `airgap_bundle.signed.json`
- `manifest.json`
- reproducibility digest for deterministic content validation

## Bundle Verification

Use:

```bash
npm run airgap:verify -- --bundle release/airgap/<bundle>/airgap_bundle.signed.json
```

Validation checks:

- payload hash integrity
- signer signature validity
- air-gap lock policy values (`allowExternalNetwork=false`)
- import/export station checklist presence
- artifact verification flags across installer/update/provider/docs/trust sets

## Import / Export Station Checklist

Import:

1. validate media serial and chain-of-custody
2. verify signature and hash for each artifact
3. quarantine failed artifacts
4. apply dual-operator approval before activation

Export:

1. assign courier class label
2. sign outbound manifest
3. record handoff in transfer ledger
4. confirm destination receipt hash

## Evidence and Auditability

- transfer events are stored in local transfer-chain ledger state.
- activation records capture transfer IDs and activation timestamp.
- no cloud service is required for verification or activation.
