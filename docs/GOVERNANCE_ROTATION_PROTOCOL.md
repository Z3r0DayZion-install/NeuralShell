# OMEGA Governance Key Rotation Protocol
**Version:** 1.0 (Constitutional Requirement)
**Status:** Mandatory Procedure

## 1. Abstract
The Governance Root Key (`governance_root`) is the anchor of ecosystem authority. This document defines the formal, non-silent procedure for rotating this key without compromising the legitimacy of the OMEGA Compliance Registry.

## 2. Rotation Triggers
Key rotation must occur if:
1. The current private key is suspected of compromise.
2. Maintainer change requires a transfer of authority.
3. Periodic institutional hardening (every 2 years).

## 3. Mandatory Procedure

### Step 1: Generation
Generate a new Ed25519 keypair in a secure, off-network environment. 
`governance_root_v2.key.pem`
`governance_root_v2.pub.pem`

### Step 2: Cross-Signing (The Chain of Trust)
The *current* active Governance Key must sign an attestation of the *new* public key fingerprint.
```javascript
{
  "event": "GOVERNANCE_KEY_ROTATION",
  "new_public_key_fingerprint": "...",
  "reason": "...",
  "effective_at": "..."
}
```
This attestation must be included in the `OMEGA_RELEASE_LEDGER.md`.

### Step 3: Global Notification
The new fingerprint must be published to all external trust anchors (README, external static sites, social channels).

### Step 4: Registry Cut-over
1. Update the `governance_fingerprint` field in `OMEGA_COMPLIANCE_REGISTRY.json` to the new fingerprint.
2. Sign the first update of the new registry version using the **new** private key.
3. Increment the `registry_version`.

### Step 5: Deprecation
Securely destroy the old private key. Retain the old public key for historical audit of previous registry versions.

## 4. Verification Logic
The `EmpireValidator` must be updated to support a list of trusted fingerprints or follow the cross-signed rotation chain to remain compliant during the transition window.

## 5. Non-Compliance
Any key swap performed without following this protocol results in an immediate **[UNTRUSTED]** state for the entire ecosystem.
