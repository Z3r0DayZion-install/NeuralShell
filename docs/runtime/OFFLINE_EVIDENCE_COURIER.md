# OFFLINE_EVIDENCE_COURIER

## Purpose

Offline Evidence Courier provides a controlled transfer chain for artifacts moving across restricted environments.

## Package Generation

Run:

```bash
npm run courier:package
```

Produces:

- signed courier package (`courier_package.signed.json`)
- manifest metadata (`manifest.json`)

Payload includes:

- courier class (`standard|sensitive|sealed|emergency`)
- sender/receiver metadata
- artifact list with hashes
- manifest root hash (hash tree root)
- quarantine-required flag

## Verification

Run:

```bash
npm run courier:verify -- --bundle release/courier/<bundle>/courier_package.signed.json
```

Checks:

- payload hash
- signature validity
- manifest root recomputation
- quarantine policy flag

## Transfer Chain

The Courier Transfer Center records:

- import handoff
- receipt verification
- quarantine release

Release is blocked until verification is complete.

## Tamper Handling

Tampered package content fails signature/hash validation and remains quarantined.
