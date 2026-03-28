# RUNBOOK_AIRGAP

## Air-Gapped Install Runbook

1. Validate transfer media custody.
2. Verify air-gap bundle signatures and hashes.
3. Import artifacts through controlled station flow.
4. Lock air-gap mode and disable remote bridge paths.
5. Capture trust-chain and courier ledger evidence.

## Update and Rollback

- Promote only verified update packs.
- Roll back to last signed local package if verification fails.

## Decommission

- Revoke certificates tied to retired nodes/appliances.
- Archive export ledger and compliance evidence.
