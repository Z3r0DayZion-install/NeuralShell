# PKI_TRUST_FABRIC

## Objective

NeuralShell PKI Trust Fabric adds certificate-backed trust identity on top of existing signed artifacts and trust registry controls.

## Core Capabilities

- local CA creation and key rotation
- certificate issuance for `node`, `appliance`, `fleet`, and `org`
- expiry visibility and 30-day warning window
- revocation list (CRL) enforcement
- trust-chain viewer export for audit/support/board evidence

## Lifecycle Flow

1. initialize local CA
2. issue certificates per operational entity
3. monitor expiry and rotate before deadline
4. revoke compromised/stale identities immediately
5. export trust-chain view for evidence packs

## Revocation Behavior

- revoked certificate IDs are persisted in local CRL state.
- trust-chain viewer marks revoked entries immediately.
- revoked entries are considered invalid trust paths regardless of signature validity.

## Bindings

Issued certificate payloads include policy/evidence bindings:

- `rolloutPolicyBinding`
- `evidenceExchangeBinding`

These fields explicitly attach certificate identity to rollout and evidence workflows where required.

## Security Boundaries

- CA key material stays local.
- no cloud dependency is required for issue/verify/revoke operations.
- trust-state changes are inspectable from the console and exportable.
