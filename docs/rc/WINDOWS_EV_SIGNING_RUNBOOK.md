# NeuralShell Windows EV Signing Runbook

**Status:** `BLOCKED_BY_CERTIFICATE_MATERIAL`
**Target:** `dist/NeuralShell Setup 2.1.29.exe`

This runbook documents the explicit, pre-scripted workflow required to seal the final Windows native trust gap holding NeuralShell V2.0 RC Final back from General Availability (GA). 

The underlying automation (`scripts/sign-windows-exe.js`) is highly tested and fully integrated. It only requires the physical injection of the EV certificate material to execute the live `signtool.exe` pass.

---

## 1. Accepted Certificate Sources & Configuration

The signing automation securely supports three distinct certificate provisioning pathways depending on the procured EV token format (Hardware USB Token vs. Cloud-based HSM vs. PFX).

### Option A: Base64 CI Secret (Cloud / Remote HSM)
If the EV certificate is provided as a Base64 encoded string, inject it directly into the environment:
- `WIN_CERT_BASE64`: The raw Base64 string of the `.pfx` or token export.
- `WIN_CERT_PASS`: The password required to unlock the certificate.

### Option B: Local / CI Windows Certificate Store (Hardware Token / YubiKey)
If the physical EV USB token is plugged into the build machine, the certificate will reside in the Windows Certificate Store:
- `WIN_CERT_THUMBPRINT`: The SHA-1 thumbprint of the EV certificate.
- *OR* `WIN_CERT_SUBJECT`: The exact Subject Name of the EV certificate.

### Option C: Physical File Drop
If a raw `.pfx` file is available:
- Place the file at the repository root as `NeuralShell.pfx`
- Set `WIN_CERT_PASS` in the environment.
- *Alternatively*, specify a custom path using `CERTIFICATE_PFX`.

---

## 2. Execution Command
Once the environment variables align with the chosen provisioning method, execute the signing script from the repository root:

```bash
node scripts/sign-windows-exe.js
```

### Underlying Toolchain Verification
The script programmatically invokes the Windows 10 SDK `signtool.exe` using the exact Digicert RFC 3161 timestamp server:
```text
signtool sign /f "<pfx>" /p "<pass>" /tr "http://timestamp.digicert.com" /td sha256 /fd sha256 "dist/NeuralShell Setup 2.1.29.exe"
```

---

## 3. Verification & Success Criteria
Immediately after signing, the operator must verify the authenticode signature integrity:

```bash
node scripts/verify-windows-signature.js
```

**Success looks like:**
- `STATUS: Signature Verification SUCCESS`
- `[SIGNER-WIN] Real Windows Signature: SUCCESS`
- The `windows-signing-report.json` in `release/` reads `"status": "SUCCESS"`.
- Launching the installer directly skips the blue "Windows Protected Your PC (Unknown Publisher)" SmartScreen block.

---

## 4. Known Failure Modes
- **SmartScreen Still Blocks:** The certificate used was standard OD (Organizational Validation), not EV (Extended Validation), meaning it lacks immediate Windows SmartScreen reputation.
- **Timestamp Fails:** `http://timestamp.digicert.com` is unreachable from the build runner, resulting in an invalid signature.
- **Hardware Token Prompt Timeout:** If using Option B with a physical USB token, the user must physically tap the token when `signtool` invokes the hardware prompt.

---

## 5. Pre-Flight Readiness Checklist
Before declaring EV closure and moving to the GA Promotion Gate, ensure:
- [ ] Valid EV Code Signing Material is procured.
- [ ] Certificate Password or Token PIN is known.
- [ ] Windows 10/11 SDK (`signtool.exe`) is installed on the runner.
- [ ] Port 80/443 access to `http://timestamp.digicert.com` is open.
- [ ] `node scripts/sign-windows-exe.js` completes with `SUCCESS`.
- [ ] `node scripts/verify-windows-signature.js` completes with `SUCCESS`.
- [ ] The OMEGA Ledger (`docs/OMEGA_RELEASE_LEDGER.md`) is updated to reflect the new installer SHA-256 post-signing.
