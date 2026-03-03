# NeuralShell™

NeuralShell is a cryptographically sovereign, capability-based microkernel workstation. It is designed for high-security environments where execution integrity and network isolation are non-negotiable.

## OMEGA ENFORCEMENT MODE

NeuralShell operates in **OMEGA ENFORCEMENT MODE**, which provides a Level 10 security posture:
- **Capability Microkernel:** All privileged OS operations are brokered via `Symbol` capability tokens.
- **Zero-Renderer Network:** The renderer process has zero network authority. All traffic is brokered by the kernel.
- **SPKI Pinning:** Outbound connections strictly enforce SHA-256 certificate pinning.
- **Intent Firewall:** Deterministic IPC validation via strict JSON schemas and NFC normalization.
- **Binary Hash Anchors:** Every executable task is hashed and verified before spawning.
- **Self-Healing Boot:** Signed manifests detect tampering and trigger automated recovery from trusted snapshots.

## SOVEREIGN TRUST ANCHORS

The integrity and governance of the Neural Empire are secured by two independent Ed25519 trust anchors. To verify the sovereignty of this environment, ensure the public key fingerprints match the following:

### 1. OMEGA Root Fingerprint (Technical Integrity)
Used to sign `VAR_PROOF` bundles and verify artifact bit-for-bit parity.
- **Fingerprint (SHA-256):** `75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9`

### 2. OMEGA Governance Fingerprint (Ecosystem Authority)
Used to sign the `OMEGA_COMPLIANCE_REGISTRY.json` and grant `ACTIVE` status to modules.
- **Fingerprint (SHA-256):** `76bb525ffe1cd289ee2d078f96a01c2e1251543187fc9c0a7b84e7865f07e545`

## Verification & Build

To perform a full security audit and generate a signed proof bundle:

```powershell
./ci-gate.ps1
```

This will execute the AST enforcement gate, the Omega security suite, the runtime proofs, and the self-verifying proof exporter.
