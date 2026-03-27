# SECURITY GATES

This document outlines the strict deterministic security gates enforced in the NeuralShell pipeline.

## 1. AST Enforcement Gate (`tools/security/ast_gate.js`)
- **Action:** Parses all `.js` files using Babel AST.
- **Rules:**
  - No `require('fs')`, `child_process`, `net`, `crypto` outside of `src/kernel/`.
  - Enforces `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` on BrowserWindows.
- **Fail State:** Blocks build on violation.

## 2. Integrity Boot & Recovery
- **Action:** Validates `dist/seal.manifest.sig` on startup.
- **Rules:** App will not boot if signature mismatches or file hashes drift.
- **Fail State:** Boots into self-healing recovery mode with zero network access.

## 3. Deterministic Intent Firewall
- **Action:** All IPC requests pass through `src/security/intentFirewall.js`.
- **Rules:** Strict JSON schema validation (Ajv), NFC unicode normalization, zero null-bytes.
- **Fail State:** Rejects malformed or unapproved payloads instantly.

## 4. Capability Kernel Sandboxing
- **Action:** Plugins execute in restricted `vm` contexts.
- **Rules:** Globals frozen, no ambient authority, all requests routed through `KernelBroker`.
- **Fail State:** Capability denial on access attempt.

## 5. Proof Bundle Exporter
- **Action:** `tools/security/proof_bundle.js` generates a cryptographically signed artifact.
- **Rules:** Binds current git commit, lockfile hash, and test results into a single proof-of-work bundle.
- **Fail State:** Fails CI if tests or AST gates fail.
