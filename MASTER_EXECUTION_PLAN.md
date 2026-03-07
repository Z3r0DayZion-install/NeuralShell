# MASTER EXECUTION PLAN — NEURALSHELL v5.2.0 (OMEGA)

**Project:** NeuralShell
**Governance:** Deterministic Multi-Agent Governance System (DMAGS)
**Security Posture:** OMEGA ENFORCEMENT MODE (Level 5) + Sovereign Swarm

## 1. OMEGA Architectural Rules

NeuralShell operates under strict OMEGA rules to ensure total system integrity and hardware-rooted sovereignty:

1.  **Capability-Based Kernel (TCB)**: All privileged operations (Network, FileSystem, Process Execution) are routed through `@neural/omega-core`. Direct usage of Node.js primitives (`fs`, `child_process`, `https`) outside the broker is strictly forbidden and verified via AST gating.
2.  **Intent Firewall**: All user and agent requests are evaluated against a strict JSON schema registry. Unauthorized intents are blocked before reaching the kernel.
3.  **Hardware-Bound Identity (Silicon Anchor)**: The node's Ed25519 cryptographic identity is irrevocably bound to the physical hardware (CPU ID + Baseboard Serial) via the OMEGA-gated `wmic` broker. Node fingerprints cannot be spoofed or transferred.
4.  **Distributed Threat Intelligence (Swarm Consensus)**: The system utilizes a P2P Threat Ledger (`governance/THREAT_LEDGER.jsonl`). Security patches and autonomous updates require a cryptographically verified **Quorum of Guardians (2/3 nodes)** before execution.
5.  **Test-Driven Autonomy**: The internal Code Agent cannot modify the system without generating and passing a sandbox-executed Unit Test suite.

## 2. VAR_PROOF Artifact Schema

The system produces a deterministic, cryptographically signed `VAR_PROOF` bundle to mathematically guarantee the integrity of a build.

*   **Location:** `artifacts/var_proof/<timestamp>/` (and `artifacts/var_proof/latest/`)
*   **Contents:**
    *   `manifest.json`: Contains the Git commit hash, `package-lock.json` hash, deterministic machine ID, and the exact pass/fail status of all enforcement gates (AST, Security Suite, Runtime).
    *   `signature.sig`: An Ed25519 signature of the `manifest.json`, signed by the hardware-bound Governance Root Key.

## 3. Local Reproduction & Audit Commands

To independently verify the OMEGA CI Gate and system integrity, an auditor must execute the following sequence:

1.  **Dependency Alignment:** `npm ci`
2.  **Comprehensive Unit Tests:** `npm test`
3.  **OMEGA Security Suite (8 Assertions):** `node tests/omega_security.test.js`
4.  **Deterministic Runtime & Metrics Proof:** `node scripts/runtime_proof.cjs`
5.  **Sovereign Integrity Proof (Hardware & Swarm):** `node verifiable_proof.js`
6.  **Seal the Build:** `node scripts/export_var_proof.js`

*For automated continuous integration, execute:* `.\ci-gate.ps1`

## 4. Current Status

**ACHIEVED**: The system has successfully passed the OMEGA Finish Acceptance Checklist. The TCB is locked, the agent is sovereign, and the hardware identity is bound. The repository is ready for a Golden Master release.

## 5. Sovereign Bounties (Active Missions)

The following missions are authorized for the Autonomous Evolution ritual:

1.  **Mission: "Sovereign Proxy"**
    *   **Goal:** Build a plugin that implements a secure, local HTTPS proxy using the `Neural-SDK`.
    *   **Requirement:** It must scrub all `User-Agent` and `Cookie` headers from outbound requests to ensure total anonymity.
    *   **Status:** OPEN

2.  **Mission: "Recursive Auditor"**
    *   **Goal:** Build a plugin that performs a daily scan of `src/plugins/autonomous/` and verifies the SHA256 of every file against the `THREAT_LEDGER`.
    *   **Status:** OPEN
