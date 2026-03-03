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

## SOVEREIGN TRUST ANCHOR

The integrity of every NeuralShell build is verified by a signed `VAR_PROOF` bundle. These bundles are signed using the **OMEGA Root Key**. 

To verify the sovereignty of this repository, ensure the root public key matches the following fingerprint:

**OMEGA Root Fingerprint (SHA-256):**
`75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9`

## Verification & Build

To perform a full security audit and generate a signed proof bundle:

```powershell
./ci-gate.ps1
```

This will execute the AST enforcement gate, the Omega security suite, the runtime proofs, and the self-verifying proof exporter.
