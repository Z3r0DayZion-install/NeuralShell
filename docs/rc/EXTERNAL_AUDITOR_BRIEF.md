# NeuralShell External Auditor Brief

**Target Version:** V2.0.0-RC-FINAL (Stage 515)
**Classification:** `EXTERNAL_AUDIT_SEND_READY`

## 1. Audit Scope
This audit assesses the core matrix of **NeuralShell V2.0**, focusing exclusively on the execution sandbox, hardware-bound persistence cryptography, and sovereign governance loops. The auditor is requested to evaluate the resilience of the system against external data tampering, unauthorized component execution, and isolation bypasses.

## 2. Proven Internal Guarantees
The `release/audit/` bundle contains the cryptographic ledgers and test harnesses that mathematically assert the following guarantees:
- **Sandbox Sovereignty**: Total isolation of untrusted AI worker threads from the core Node context.
- **Fail-Closed Persistence (OMEGA)**: Unparseable, corrupted, or cryptographically tampered state/session files trigger immediate quarantine without polluting the active namespace.
- **Hardware-Binding**: OMEGA profiles and identities are inextricably locked to the hardware fingerprint of their origin machine. Cross-machine migration without a valid, signed OMEGA envelope is programmatically denied.

## 3. Explicit Blocker Acknowledgment
- **Windows EV Code Signing**: The current Windows distribution (`NeuralShell Setup 2.1.29.exe`) remains natively unsigned. The procurement of physical EV Code Signing material is an ongoing external blocker. The auditor should expect the installer to flag an "Unknown Publisher / SmartScreen" warning during OS deployment. This is an accepted and declared trust gap.

## 4. Declared Non-Goals
The following axes are explicitly excluded from this audit assignment:
- **UI/UX Aesthetics**: The visual presentation and style system are out of scope.
- **Speculative Features**: Future roadmap functionality (e.g., decentralized training overlays) are out of scope.
- **Upstream Electron/Chromium Zero-Days**: Findings relying solely on generic browser exploits unmitigated by NeuralShell-specific surface abstractions should be logged with a low project severity.

## 5. Clean-Room Execution Commands
The auditor should unpack the bundle and execute the native verification scripts to reproduce the internal findings:

**Trace the Sovereign Development Matrix:**
```bash
node bin/sovereign-audit.js
```

**Execute the Persistence Forgery/Quarantine Harness:**
```bash
node bin/run-persistence-audit-pack.js
```

## 6. Findings Submission
All findings must be reported using the exact schema provided in `EXTERNAL_AUDIT_FINDINGS_TEMPLATE.md`. Submissions lacking reproducible step-by-step documentation will be deprioritized.
