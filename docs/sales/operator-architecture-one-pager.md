# NeuralShell Operator — Architecture One-Pager

**Version:** 2.1.29  
**Date:** 2026-03-29  
**Audience:** Technical buyers, security researchers, compliance auditors

---

## Product Architecture Summary

NeuralShell is a local-first Electron desktop application (Electron 33, React 18, Node 22) that provides hardware-bound identity, encrypted session management, and autonomous execution with full audit trail.

The architecture enforces strict security boundaries:
- IPC preload whitelist (no nodeIntegration in renderer)
- Hardware-bound identity (Ed25519 + SHA-256 hardware fingerprint)
- Encrypted session storage (AES-256-GCM with hardware-derived keys)
- Append-only audit chain (hash-chained log with tamper detection)
- Policy firewall (safe / advisory / high-risk action tiers)

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Renderer Process                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React 18 UI (Vite-built)                              │ │
│  │  - Command Palette (primary control plane)             │ │
│  │  - Workbench Rail (artifacts, patch plans)             │ │
│  │  - Settings Drawer (bridge config, profiles)           │ │
│  │  - ShellContext (global state: UI/Domain/System)       │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│                    IPC Boundary                              │
│              (preload.js whitelist, ~100 channels)           │
│                           ↕                                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Main Process                            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Core Services (47 modules)                            │ │
│  │  - identityKernel.js (Ed25519, hardware fingerprint)   │ │
│  │  - sessionManager.js (AES-256-GCM encryption)          │ │
│  │  - stateManager.js (versioned persistence)             │ │
│  │  - secretVault.js (hardware-bound secret storage)      │ │
│  │  - auditChain.js (append-only hash-chained log)        │ │
│  │  - policyFirewall.js (safety policy enforcement)       │ │
│  │  - llmService.js (LLM provider bridging)               │ │
│  │  - executionEngine.js (autonomous action runner)       │ │
│  │  - chainPlanner.js (multi-step workflow sequencing)    │ │
│  │  - agencyPolicy.js (auto-run policy, hot-reloadable)   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│                    Kernel Layer                              │
│              (execution.js, capability enforcement)          │
│                           ↕                                  │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    External Systems                          │
│  - Local LLM (Ollama)                                        │
│  - Remote LLM (OpenAI, OpenRouter, Groq, Together)          │
│  - File System (workspace operations)                        │
│  - Hardware (CPU, baseboard, BIOS for fingerprinting)       │
└─────────────────────────────────────────────────────────────┘
```

---

## Trust-Bound Systems

### 1. Hardware-Bound Identity

**What it does:**
- Generates Ed25519 keypair tied to device hardware
- Computes SHA-256 hardware fingerprint from immutable hardware identifiers
- Binds license to device (prevents piracy without phone-home)
- Logs all hardware binding events to audit chain

**How it works:**

**Windows:**
- Extracts 4 hardware sources: CPU ProcessorId, Baseboard Serial, BIOS Serial, System UUID
- Validates identifiers (rejects placeholders, empty values, all-zeros)
- Constructs composite: `cpu:X|board:Y|bios:Z|uuid:W`
- Computes SHA-256 hash → 64-char hex fingerprint
- Degraded mode: Uses single identifier if <2 available (logs warning)
- Hard failure: Throws error if 0 identifiers available (no hostname fallback)

**macOS:**
- Extracts 2 hardware sources: IOPlatformSerialNumber, IOPlatformUUID
- Fallback chain: ioreg → system_profiler → degraded mode
- Constructs composite: `${serial}:${uuid}` or `${uuid}` (degraded)
- Computes SHA-256 hash → 64-char hex fingerprint
- Hard failure: Throws error if both identifiers unavailable

**Proof:**
- Windows: `docs/proofs/windows-hardware-binding-hardening-proof.md`
- macOS: `docs/proofs/batch1-macos-backend-proof.md`
- Tests: `tear/identity-kernel-windows-hardening.test.js`, `tear/identity-kernel-macos-*.test.js`

---

### 2. Encrypted Session Management

**What it does:**
- Encrypts conversation contexts with AES-256-GCM
- Derives encryption keys from hardware fingerprint
- Requires passphrase to unlock sessions
- Autosaves with 1200ms debounce (write-deduped by JSON digest)

**How it works:**
- Session data encrypted with AES-256-GCM
- Authenticated data (AAD) prevents tampering
- Hardware-derived key ensures sessions are device-bound
- Passphrase-gated unlock (scrypt key derivation)
- Session index stored separately (encrypted metadata)

**Proof:**
- Tests: `tear/session-manager.test.js`
- Implementation: `src/core/sessionManager.js`

---

### 3. Audit Chain

**What it does:**
- Logs all security-relevant events to append-only log
- Hash-chains entries (each entry includes prevHash)
- Detects tampering via hash verification
- Provides forensic trail for compliance

**How it works:**
- Each entry: `{ index, timestamp, prevHash, payload, hash }`
- Hash computed: `SHA-256(index + timestamp + prevHash + JSON.stringify(payload))`
- Tamper detection: Verify hash chain integrity
- Append-only: No deletion or modification of entries

**Proof:**
- Tests: `tear/audit-chain.test.js`
- Implementation: `src/core/auditChain.js`

---

### 4. Policy Firewall

**What it does:**
- Classifies actions by risk tier (safe / advisory / high-risk)
- Enforces auto-run policy (hot-reloadable from `agencyPolicy.json`)
- Suppresses auto-run based on context (dirty git tree, anomaly risk score)
- Requires approval for high-risk actions

**How it works:**
- Action registry: `src/core/actionRegistry.js` (risk classification)
- Agency policy: `src/core/agencyPolicy.js` (auto-run rules)
- Policy firewall: `src/core/policyFirewall.js` (enforcement)
- Context-aware: Dirty git tree suppresses auto-run for non-safe actions

**Proof:**
- Tests: `tear/policy-firewall.test.js`
- Implementation: `src/core/policyFirewall.js`

---

### 5. Versioned State Management

**What it does:**
- Persists application state with schema versioning
- Migrates state across schema versions
- Provides atomic updates and rollback capability
- IPC-backed persistence

**How it works:**
- State schema version: `STATE_VERSION` constant
- Migration functions: `stateManager.js` (version-specific migrators)
- Atomic writes: Write-deduped by JSON digest
- Rollback: Previous state versions preserved

**Proof:**
- Tests: `tear/state-manager.test.js`
- Implementation: `src/core/stateManager.js`

---

## What Is Real Today

### Implemented and Tested

- Hardware binding (Windows hardened, macOS implemented)
- Encrypted session management (AES-256-GCM)
- Audit chain (append-only, hash-chained)
- Policy firewall (safe / advisory / high-risk tiers)
- Versioned state management (schema versioning, migration)
- LLM bridges (Ollama, OpenAI, OpenRouter, Groq, Together)
- Autonomous execution (multi-step workflows, chain planning)
- Command palette (primary control plane)
- Workbench rail (artifacts, patch plans, verification)
- IPC boundary (preload whitelist, no nodeIntegration)

### Test Coverage

- 25+ test files (smoke, unit, contract, security, release gates)
- Full test suite: `npm test`
- Coverage check: `npm run coverage:check`
- E2E tests: `npm run test:e2e` (Playwright)

---

## What Is Intentionally Gated/Deferred

### Hollow Surface Gating (HSG)

NeuralShell uses Hollow Surface Gating to hide unimplemented UI from users:
- 42 surfaces currently gated behind `INTERNAL_GTM_MODE` flag
- Surfaces include: enterprise consoles, fleet management, revenue ops, partner ops, board reporting
- Gated surfaces are not visible to users (default flag off)
- Internal teams retain access when flag enabled (localStorage-backed)

**Why this matters:**
- Prevents hollow surfaces from destroying user trust
- Preserves credibility by showing only production-ready features
- Allows internal teams to use GTM tooling without exposing theater to users

**Proof:**
- HSG doctrine: `docs/patterns/hollow-surface-gating.md`
- Gated surfaces: 42 surfaces across 3 files

### Deferred Features

- Linux support (not yet implemented)
- HSM/TPM integration (deferred to Batch 2)
- Fleet management (not implemented)
- Remote attestation (not implemented)
- SOC 2 certification (deferred until buyer demand)
- Penetration test report (commission after first sales)

---

## Proof Posture

### Verifiable Claims

All security claims are verifiable through:
1. **Source code inspection** - MIT license, full access to `src/core/`
2. **Test suite execution** - `npm test` runs 25+ test files
3. **Proof artifacts** - `docs/proofs/` contains hardware binding proofs, audit chain tests
4. **Architecture documentation** - `ARCHITECTURE_RULES.md`, `IPC_CONTRACT.md`

### Proof Documents

- Hardware binding (Windows): `docs/proofs/windows-hardware-binding-hardening-proof.md`
- Hardware binding (macOS): `docs/proofs/batch1-macos-backend-proof.md`
- HSG doctrine: `docs/patterns/hollow-surface-gating.md`
- Architecture rules: `ARCHITECTURE_RULES.md`
- IPC contract: `IPC_CONTRACT.md`

### Test Results

- Windows hardening: 10 tests, all passing
- macOS backend: 19 tests, all passing
- Audit chain: All tests passing
- Session manager: All tests passing
- Policy firewall: All tests passing

---

## Why This Matters To The Buyer

### For Technical Founders

- **Hardware binding prevents piracy** - License is cryptographically bound to device
- **Proof over promises** - Every claim is verifiable through tests and proof documents
- **Local-first sovereignty** - No cloud telemetry, full airgap capability
- **Audit trail for compliance** - Hash-chained log for SOC 2 / ISO 27001 / HIPAA positioning

### For Security Researchers

- **Verifiable security properties** - Run the tests yourself, inspect the source
- **No certification theater** - Engineering proof, not compliance badges
- **Audit chain for forensics** - Append-only log with tamper detection
- **Hollow surfaces gated** - Only production-ready features visible to users

### For Compliance-Driven Operators

- **Hardware binding for device attestation** - Cryptographic proof of device identity
- **Audit chain for compliance trail** - Hash-chained log for auditors
- **Encrypted session storage** - AES-256-GCM with hardware-derived keys
- **Threat model available** - Attack surface analysis, mitigations, residual risks

---

## Concise Technical Credibility Summary

NeuralShell is a local-first Electron desktop application with:
- Hardware-bound identity (Ed25519 + SHA-256 hardware fingerprint)
- Encrypted session management (AES-256-GCM with hardware-derived keys)
- Append-only audit chain (hash-chained log with tamper detection)
- Policy firewall (safe / advisory / high-risk action tiers)
- Versioned state management (schema versioning, migration)
- IPC boundary enforcement (preload whitelist, no nodeIntegration)
- Hollow Surface Gating (42 surfaces gated, only production-ready features visible)

All claims are verifiable through:
- Source code inspection (MIT license)
- Test suite execution (25+ test files)
- Proof artifacts (hardware binding proofs, audit chain tests)
- Architecture documentation (IPC contract, state versioning, security model)

**Real-device verification status:**
- Windows: Implementation complete, real-device verification pending
- macOS: Implementation complete, real-device verification pending
- Linux: Not yet implemented

**Certification status:**
- SOC 2 / ISO 27001 / HIPAA: Deferred until buyer demand
- Penetration test: Commission after first sales

**The architecture is real. The proof is executable. The product is ready to sell.**

---

**NeuralShell Operator: Hardware-bound AI operator shell with encrypted sessions and full audit trail.**

**Architecture: Electron 33 + React 18 + Node 22**  
**Security: Ed25519 + AES-256-GCM + SHA-256 + Hash-chained audit**  
**Proof: 25+ tests, all passing**  
**Price: $149 one-time**
