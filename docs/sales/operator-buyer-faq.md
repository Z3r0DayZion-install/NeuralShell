# NeuralShell Operator — Buyer FAQ

**Version:** 2.1.29  
**Date:** 2026-03-29  
**Audience:** Prospective buyers, technical evaluators

---

## What is NeuralShell?

NeuralShell is a local-first desktop application (Electron 33, React 18, Node 22) that provides hardware-bound identity, encrypted session management, and autonomous execution with full audit trail.

It's designed for technically capable users who need provable security properties, not marketing claims.

Think: "AI operator shell with cryptographic hardware binding and audit chain" not "generic AI chatbot wrapper."

---

## Who is it for?

**Primary buyers:**
- Technical founders running sensitive workloads (crypto, fintech, healthcare)
- Security researchers who need audit trails and hardware binding
- Solo operators who want local LLM control without cloud exposure
- Developers who can verify cryptographic claims through code inspection

**Not for:**
- Non-technical users who need hand-holding
- Enterprise buyers requiring SOC 2 certification today
- Teams needing fleet management (single-device license only)
- Users who want a generic AI chatbot (this is an operator shell, not a chat toy)

---

## What works today?

### Fully Implemented and Tested

**Hardware binding:**
- Windows: 4 hardware sources (CPU, baseboard, BIOS, UUID), identifier validation, degraded mode, hard failure, audit logging
- macOS: 2 hardware sources (IOPlatformSerial, IOPlatformUUID), fallback chain, degraded mode, hard failure, audit logging
- Tests: 29 tests (10 Windows + 19 macOS), all passing
- Proof documents: `docs/proofs/windows-hardware-binding-hardening-proof.md`, `docs/proofs/batch1-macos-backend-proof.md`

**Encrypted session management:**
- AES-256-GCM encryption with hardware-derived keys
- Passphrase-gated unlock (scrypt key derivation)
- Autosave with 1200ms debounce (write-deduped by JSON digest)
- Tests: All passing (`tear/session-manager.test.js`)

**Audit chain:**
- Append-only, hash-chained log
- Tamper detection via hash verification
- Tests: All passing (`tear/audit-chain.test.js`)

**Autonomous execution:**
- Multi-step workflow automation
- Policy-gated safety controls (safe / advisory / high-risk tiers)
- Chain planning with failure prediction
- Tests: All passing

**LLM bridges:**
- Ollama (local, no API key required)
- OpenAI, OpenRouter, Groq, Together (remote, API key required)
- Custom OpenAI-compatible endpoints
- Bridge health polling, retry logic

**UI:**
- Command palette (primary control plane)
- Workbench rail (artifacts, patch plans, verification)
- Settings drawer (bridge config, profiles)
- Onboarding wizard

### Real-Device Verification Status

**Windows:**
- Implementation: Complete
- Unit tests: Passing (10 tests)
- Real-device verification: Pending (awaiting Windows hardware testing)

**macOS:**
- Implementation: Complete
- Unit tests: Passing (19 tests)
- Real-device verification: Pending (awaiting Mac hardware testing)

**What this means:**
- The code is written and unit-tested
- The implementation is ready for real-device testing
- Real-device verification will confirm stability across reboots (10 reboots per device)
- If you buy now, you're an early adopter helping validate real-device behavior

---

## Why no certification yet?

**Short answer:** Certification is expensive ($50K-$200K for SOC 2 Type II) and takes 6-12 months. We're prioritizing first revenue and proof artifacts over certification badges.

**Long answer:**

Certification is deferred until:
1. An enterprise buyer explicitly requires it (procurement blocker)
2. A compliance auditor rejects proof artifacts (forces certification)
3. $50K+ in revenue from compliance-driven buyers (proves ROI of certification investment)

**Why this works:**
- Technical buyers can verify claims through code inspection and test execution
- Proof artifacts (hardware binding proofs, audit chain tests, threat model) satisfy auditors for pilots
- Certification should be demand-driven, not speculative

**What you get instead:**
- Executable proof artifacts (run the tests yourself)
- Engineering documentation (hardware binding proofs, audit chain tests)
- Threat model summary (attack surface analysis, mitigations, residual risks)
- Architecture documentation (IPC contract, state versioning, security model)

For technical buyers, engineering proof is more credible than compliance badges.

---

## What proof exists?

### Proof Documents

**Hardware binding:**
- Windows: `docs/proofs/windows-hardware-binding-hardening-proof.md`
- macOS: `docs/proofs/batch1-macos-backend-proof.md`

**HSG doctrine:**
- `docs/patterns/hollow-surface-gating.md`

**Architecture:**
- `ARCHITECTURE_RULES.md`
- `IPC_CONTRACT.md`

### Test Suite

**Run yourself:**
```bash
git clone https://github.com/neuralshell/neuralshell.git
cd neuralshell
npm install
npm test
```

**Test coverage:**
- 25+ test files (smoke, unit, contract, security, release gates)
- Windows hardening: 10 tests, all passing
- macOS backend: 19 tests, all passing
- Audit chain: All tests passing
- Session manager: All tests passing
- Policy firewall: All tests passing

### Source Code Inspection

**MIT license, full access:**
- `src/core/identityKernel.js` (hardware binding)
- `src/core/sessionManager.js` (encrypted sessions)
- `src/core/auditChain.js` (audit chain)
- `src/core/policyFirewall.js` (policy enforcement)
- `src/core/stateManager.js` (versioned state)

---

## What is still in progress?

### Real-Device Verification (Pending)

**Windows:**
- Implementation: Complete
- Unit tests: Passing
- Real-device verification: Pending (awaiting Windows hardware testing)
- What's needed: Test on 2+ Windows machines, verify stability across 10 reboots per machine

**macOS:**
- Implementation: Complete
- Unit tests: Passing
- Real-device verification: Pending (awaiting Mac hardware testing)
- What's needed: Test on 2+ Macs, verify stability across 10 reboots per machine

**What this means for buyers:**
- The code is ready and unit-tested
- Real-device verification will confirm stability in production
- Early buyers help validate real-device behavior
- If hardware binding fails on your device, we'll fix it (email support)

### Linux Support (Not Yet Implemented)

- Linux hardware binding: Not yet implemented (Work Packet 2)
- Timeline: 2-4 weeks after first revenue
- Why deferred: Windows + macOS covers 90%+ of target buyers

### Certification (Deferred)

- SOC 2 / ISO 27001 / HIPAA: Deferred until buyer demand
- Penetration test report: Commission after first sales
- Bug bounty program: Deferred until revenue supports payouts

---

## Why trust this over a generic AI shell?

### 1. Hardware binding prevents piracy
Your license is cryptographically bound to your device hardware. No phone-home required, no license server, no cloud dependency. The license simply won't activate on different hardware.

Generic AI shells use subscription models with cloud license servers. NeuralShell uses cryptographic hardware binding with no cloud dependency.

### 2. Proof over promises
Every security claim is backed by executable tests and proof documents. You can verify hardware binding, audit chain integrity, and session encryption yourself.

Generic AI shells make security claims without proof. NeuralShell provides executable proof artifacts.

### 3. Hollow surfaces are gated
NeuralShell uses Hollow Surface Gating (HSG) to hide unimplemented UI from users. 42 surfaces are currently gated behind an internal flag. You only see production-ready features.

Generic AI shells show fake dashboards and demo UI. NeuralShell hides hollow surfaces to preserve trust.

### 4. Local-first by design
Your conversations, your models, your machine. No cloud telemetry unless you explicitly configure a remote LLM bridge. Full airgap capability in Sovereign tier.

Generic AI shells require cloud services. NeuralShell is local-first by design.

### 5. Audit trail for compliance
Every action is logged to an append-only, hash-chained audit chain. Tamper detection via hash verification. Compliance-ready trail for SOC 2 / ISO 27001 / HIPAA positioning.

Generic AI shells have no audit trail. NeuralShell provides forensic-grade logging.

---

## What do I actually get for $149?

### Software License

- NeuralShell desktop app (Windows or macOS)
- Hardware-bound license (single device, one-time purchase)
- Full autonomous execution capabilities
- Encrypted session management
- Local + remote LLM bridges
- Audit chain logging
- MIT license (full source access)

### Proof Artifacts

- Hardware binding proofs (Windows + macOS)
- Audit chain tests
- Session encryption tests
- Architecture documentation
- HSG doctrine

### Support

- Email support (support@neuralshell.app)
- 72-hour response SLA
- Bug fixes and security patches
- Version updates (no additional cost)

### What You Don't Get

- SOC 2 certification (deferred until buyer demand)
- Penetration test report (commission after first sales)
- 24/7 support (email only, 72-hour SLA)
- Fleet management (single-device license only)
- Airgap mode (available in Sovereign tier $499)
- White-label builds (available in Enterprise Pilot tier $2,500/year)

---

## What happens after purchase?

### Purchase Flow

1. Visit https://gumroad.com/l/neuralshell-operator
2. Purchase Operator for $149 (Gumroad)
3. Receive license key via email
4. Download NeuralShell desktop app (Windows or macOS)
5. Install and launch app
6. Enter license key in activation screen
7. License binds to your device hardware automatically
8. Start using NeuralShell with full capabilities

### License Activation

- License key is HMAC-SHA256 signed blob
- License binds to device hardware (Ed25519 + SHA-256 fingerprint)
- No phone-home required (license verification is local)
- License is valid forever (one-time purchase, no expiration)

### Support

- Email: support@neuralshell.app
- Response SLA: 72 hours
- Bug fixes: Included (no additional cost)
- Version updates: Included (no additional cost)

### Refund Policy

**Status:** Pending (to be defined)

**Likely policy:**
- 30-day money-back guarantee
- No questions asked refund
- Email support@neuralshell.app to request refund

**Why pending:**
- Need to verify refund process with Gumroad (primary checkout)
- Need to define refund abuse prevention
- Will be documented on pricing page before launch

---

## Is this enterprise-ready?

**Short answer:** No, not yet. This is a single-device license for solo operators and small teams.

**Long answer:**

**What works for enterprise pilots:**
- Hardware binding (device attestation)
- Audit chain (compliance trail)
- Encrypted sessions (data protection)
- Proof artifacts (auditor documentation)

**What doesn't work for enterprise yet:**
- No fleet management (single-device license only)
- No centralized policy rollout
- No SOC 2 certification
- Email support only (no 24/7 support)
- No multi-device licenses

**Enterprise Pilot tier ($2,500/year, 5 seats):**
- 5 hardware-bound licenses
- Fleet deployment pack
- White-label configuration
- Priority support (24-hour SLA)
- Custom compliance documentation

**When to buy Enterprise Pilot:**
- You need 5+ licenses
- You need fleet deployment assistance
- You need custom compliance documentation
- You need priority support (24-hour SLA)

**When to start with Operator:**
- You're evaluating NeuralShell for enterprise use
- You need a single-device license for pilot
- You want to verify claims before enterprise commitment
- You're a solo operator or small team

---

## Is this a beta?

**Short answer:** No. This is a production release with real-device verification pending.

**Long answer:**

**What's production-ready:**
- Hardware binding (implemented, unit-tested)
- Encrypted sessions (implemented, tested)
- Audit chain (implemented, tested)
- Autonomous execution (implemented, tested)
- LLM bridges (implemented, tested)
- UI (command palette, workbench, settings)

**What's pending:**
- Real-device verification (Windows + macOS)
- Linux support (not yet implemented)
- Penetration test report (commission after first sales)
- SOC 2 certification (deferred until buyer demand)

**What this means:**
- The code is production-ready (unit-tested, proof artifacts exist)
- Real-device verification will confirm stability in production
- Early buyers help validate real-device behavior
- If you encounter bugs, we'll fix them (email support)

**Beta vs. Production:**
- Beta: Unstable, frequent breaking changes, no support
- Production: Stable, versioned releases, email support

NeuralShell is production-ready with real-device verification pending. It's not a beta.

---

## What is the refund / support posture?

### Support

**Email support:**
- Email: support@neuralshell.app
- Response SLA: 72 hours
- Coverage: Bug fixes, feature questions, license issues

**What's included:**
- Bug fixes (no additional cost)
- Version updates (no additional cost)
- License activation support
- Feature usage questions

**What's not included:**
- 24/7 support (email only, 72-hour SLA)
- Custom development
- Deployment assistance (available in Enterprise Pilot tier)
- Training (self-service documentation only)

### Refund Policy

**Status:** Pending (to be defined before launch)

**Likely policy:**
- 30-day money-back guarantee
- No questions asked refund
- Email support@neuralshell.app to request refund

**Why pending:**
- Need to verify refund process with Gumroad (primary checkout)
- Need to define refund abuse prevention
- Will be documented on pricing page before launch

**What happens if hardware binding fails:**
- Email support@neuralshell.app
- We'll investigate and fix the issue
- If unfixable, full refund (no questions asked)

---

## Additional Questions?

**Email:** support@neuralshell.app  
**Response SLA:** 72 hours

**Want to verify claims first?**

1. Clone the repo: `git clone https://github.com/neuralshell/neuralshell.git`
2. Run the test suite: `npm test`
3. Read the proof artifacts: `docs/proofs/`
4. Inspect the source: `src/core/identityKernel.js`, `src/core/sessionManager.js`, `src/core/auditChain.js`

**Ready to buy?**

Visit https://gumroad.com/l/neuralshell-operator to purchase Operator for $149 one-time.

---

**NeuralShell Operator: Hardware-bound AI operator shell with encrypted sessions and full audit trail.**

**$149 one-time. No subscription. No cloud dependency.**


