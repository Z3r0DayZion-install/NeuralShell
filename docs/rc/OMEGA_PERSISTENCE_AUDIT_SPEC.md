# OMEGA Persistence Audit Specification

**Target:** NeuralShell V2.0.0-RC-FINAL (Stage 515)
**Status:** EXTERNAL_AUDIT_READY

This document defines the exact technical boundaries, cryptographic guarantees, and fail-closed recovery mechanics of the NeuralShell persistence layer. It is written objectively for third-party forensic auditors.

## 1. Persistence Domains

NeuralShell operates two primary on-disk data stores:
1. **Global State (`stateManager.js`)**: Hardware-locked, AES-256-GCM encrypted blob storing telemetry, workspace configuration, and connection profiles.
2. **Session Envelopes (`sessionManager.js`)**: Encrypted, checksum-verified discrete files representing conversational workflows and thread history.

### A. State V9 (Global Scope)
- **Path**: `<userData>/state/state.enc`
- **Format**: Hardware-Bound Authenticated Envelope (`omega-v5:<iv>:<tag>:<ciphertext>`)
- **Key Derivation**: `SHA-256(Hardware Fingerprint)`
- **Encryption**: AES-256-GCM
- **Schema**: Enforced State V9 (settings merge resolution, `connectionProfiles` array).
- **Prototype Guards**: `__proto__`, `constructor`, `prototype` are aggressively blocked during `set()`.

### B. Session V2 (Per-Thread Scope)
- **Path**: `<userData>/state/sessions/<name>.session`
- **Format**: JSON Envelope with PBKDF2-AES-GCM ciphertext.
- **Envelope Structure**:
  ```json
  {
      "version": 2,
      "name": "session-name",
      "createdAt": "...",
      "salt": "hex",
      "iv": "hex",
      "tag": "hex",
      "data": "base64",
      "checksum": "hex"
  }
  ```
- **Integrity**: `checksum` is an `HMAC-SHA256` or `SHA-256` of the envelope metadata + payload. If the file is truncated or manually edited, the checksum invalidates the load.
- **Name Gating**: Rejects Windows reserved device names (`CON`, `NUL`, `AUX`) and directory traversal.

### C. Mobility Bundles (Cross-Machine Scope)
- **Format**: Canonical Profile JSON (V2.1.29).
- **Protections**:
    - `integrity.profileFingerprint`: Assures data matches metadata.
    - `integrity.bundleSignature`: `HMAC-SHA256` signed using the origin machine's OMEGA key.
- **Import Policy**: External bundles with mismatched or missing signatures are forcibly demoted to a `DRIFTED` trust state, immediately suspending automated execution until explicitly re-verified by the Operator.

## 2. Forensic Handling & Quarantine Semantics

NeuralShell is engineered to **fail closed**. It prioritizes continuous operation and data destruction over returning compromised or internally inconsistent state.

### Corruption Isolation (Quarantine)
If an AES-GCM authentication tag fails (tampering), or if the JSON payload is unparseable (crash-truncation / bit rot):
1. **Detection**: `JSON.parse` or Decipher throws.
2. **Quarantine**: The corrupted file is moved to `<userData>/state/quarantine/<timestamp>-corrupted.enc`.
3. **Rebuild**: The system regenerates a fresh, uncompromised factory-default V9 state and resumes boot.
4. **Result**: Complete isolation of the fault. No malformed data enters the runtime.

### Migration Guard
- Legacy state formats (V1-V4) are detected at startup.
- Unauthenticated or legacy-encrypted states are synchronously migrated to the authenticated `omega-v5` envelope.
- Profiles lacking an `id` or structural integrity during migration are actively pruned.

### Crash Recovery
- **Index Corruption**: Loss of the `session_index.json` is automatically healed by `repairIndex()`, which fully regenerates metadata by opening and decrypting all physical `.session` files.
- **Write Truncation**: `fs.writeFileSync` is used synchronously for critical saves. If a power loss occurs mid-write, the resultant invalid JSON triggers the Quarantine path on the next boot, sacrificing the corrupted file to save the application loop.

## 3. Known Constraints & Audit Exclusions

Auditors should note the following declared limitations:
- **No Journaling**: NeuralShell does not use Write-Ahead Logs (WAL) for JSON writes; partial writes yield a total quarantine of the affected file.
- **Hardware Binding Lockout**: Because State V9 is keyed to the host machine's hardware fingerprint, migrating the `<userData>/state/` folder to a new PC will result in an unrecoverable `MAC check failed` error. This is a deliberate defense mechanism, not a bug.
