# Profile Trust & Secret Custody (V2.1.26)

> This document is the trust mechanics and secret custody reference. For current release status, see `docs/release/V2_1_27_GOVERNANCE_SNAPSHOT.md`.

## Overview
NeuralShell V2.1.19 hardens the setup lifecycle by converging the onboarding wizard with formal profile and trust governance. This build ensures that profiles are materialized deterministically and that air-gapped (offline) sessions remain strictly isolated from remote connection logic.

## 1. Secret Custody & Recovery
API keys and other sensitive credentials are encrypted using OS-level credentials (via `electron.safeStorage`).

- **Onboarding Gating**: For remote providers, secret material must be provided during Step 2 before the operator can progress to model selection or the final seal.
- **Storage**: Secrets are linked to a profile UUID and stored in a machine-local encrypted vault.
- **Custody Failure**: If decrypted access fails (e.g., machine migration), the profile enters the `MISSING_SECRET` state.
- **Recovery Flow**: A dedicated `repair_secret` UI allows the operator to manually re-enter the secret. 
- **Enforcement**: Resumption of any profile in `MISSING_SECRET` state is strictly blocked until recovery is completed.

## 2. Onboarding & Materialization Governance
To prevent profile storage pollution, NeuralShell enforces "Late Materialization":

- **Draft State**: Setup progress is saved to a `setupDraft` but no governed profile is created until the final "Seal" step.
- **`VERIFIED` Status**: Profiles created via the 6-step wizard are stamped with an initial `VERIFIED` trust state upon successful connectivity proof.
- **`OFFLINE_LOCKED` Status**: Intentional use of "Offline Mode" seals the shell in an air-gapped state. This prevents accidental resumption of remote-bridge settings or draft data.
- **Abort Hygiene**: Abandoning the wizard preserves the draft for resume but does NOT populate the `connectionProfiles` list.

## 3. Cryptographic Bundle Authenticity
All exported profile bundles are cryptographically signed to prevent unauthorized modification.

- **Signature**: Uses HMAC-SHA256 based on the profile's immutable identity (ID, Provider, and Base URL).
- **Verification**: Imported bundles are automatically verified.
- **Governance**: Any bundle marked as `SIGNATURE_TAMPERED` is strictly blocked from admission or resume.

## 4. Professional Forensic Auditing
Each profile maintains a persistent history of trust-critical events, exportable for external audit.

- **Event Timeline**: Tracks `VERIFIED`, `DRIFT_DETECTED`, `EXPORT_CREATED`, `IMPORT_ACCEPTED`, `SECRET_REENTERED`, and `RESUME_BLOCKED`.
- **Forensic Export**: Operators can generate raw JSON or professional Markdown reports detailing the full lifecycle.

---
*Maintenance Status: V2.1.26 Canonical Ledger & Governance Snapshot*
