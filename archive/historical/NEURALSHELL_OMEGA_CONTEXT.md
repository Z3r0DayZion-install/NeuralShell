# NeuralShell™ OMEGA: Golden Master Specification (LLM CONTEXT)

**State:** Level 5 OMEGA ENFORCEMENT
**Governance:** DMAGS (Deterministic Multi-Agent Governance System)
**Architecture:** Capability-Based Microkernel + Sovereign Swarm

## 1. Core Security Stack
- **Microkernel (`@neural/omega-core`)**: Central broker for all privileged operations. Symbols `CAP_FS`, `CAP_NET`, `CAP_PROC` guard access. No direct usage of Node.js `fs` or `child_process` allowed.
- **Silicon Anchor**: Ed25519 identity is SHA-256 hashed with CPUID and Baseboard Serial.
- **Hardware Lock**: `state.omega` is AES-256 encrypted using a key derived from the physical silicon. Decryption fails on cloned hardware.
- **Intent Firewall**: JSON-schema gated request scrubbed by `intentFirewall.js`.

## 2. Autonomous Intelligence
- **Agent Controller**: Manages the `Research -> Plan -> Implementation -> Test` lifecycle.
- **Test-Driven Autonomy (TDD)**: The agent MUST generate unit tests for every implementation. The kernel only installs code if tests pass 100% in the sandbox.
- **Red-Teaming**: The `--red-team` trigger simulates adversarial attacks to find bypasses.
- **Auto-Patching**: Proposes JSON security patches for the Firewall upon successful exploit detection.

## 3. Distributed Swarm Logic
- **Threat Ledger**: `governance/THREAT_LEDGER.jsonl` contains P2P security advisories.
- **Consensus Quorum**: Security patches require a cryptographically verified **2/3 Guardian signatures** before activation.
- **Agent-SDK**: Standardized interface (`fetch`, `read`, `write`, `installPlugin`, `logKnowledge`) used by all agent scripts.

## 4. Verification & Audit Tools
- `.\VERIFY_RELEASE.ps1`: Full integrity scan (Certificate, Silicon, Manifest, Kernel).
- `.\ci-gate.ps1`: CI suite (AST Gate, Security Tests, Runtime Proofs, Unit Tests).
- `node verifiable_proof.js`: Direct mathematical proof of identity and kernel lockdown.

## 5. Current Tasklist / Bounties
- [Mission: Sovereign Proxy] (COMPLETED): Anonymous HTTPS fetch with header scrubbing.
- [Mission: Recursive Auditor] (OPEN): Continuous file integrity monitoring.

---
**Usage for LLM:** Use this file to understand the strict OMEGA rules. NEVER suggest raw `require('fs')` or `http` calls. ALWAYS use the `Neural-SDK` and assume a test-driven, sandbox-isolated environment.
