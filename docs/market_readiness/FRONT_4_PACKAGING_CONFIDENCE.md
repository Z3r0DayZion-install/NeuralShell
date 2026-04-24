# NeuralShell Market Readiness: Front 4 — Packaging & Confidence

## 4.1 The Buyer-Facing Install Story
**Platform Support:** Windows x64 (available). macOS and Linux builds are planned but not yet published.
**Recommended Install:** `.exe` installer (Windows).
**Update Policy:** Deterministic, manual-triggered or scheduled. Rollback is native via the built-in OMEGA switcher.

## 4.2 Installation Guidance
- **Title:** "Starting Your Sovereign Workflow."
- **Step 1:** Download and run the verified installer.
- **Step 2:** Note the "Trust Status" verification on first launch.
- **Step 3:** Connect your first local model (guides for LM Studio, Ollama, or built-in CPU model).
- **Step 4:** Import context to the workbench and begin.

## 4.3 Building Confidence
- **Proof of Localism:** Simple "Offline Mode" test instructions included in the readme.
- **Signature Verification:** A 2-line PowerShell script for users to verify the installer's SHA-256 against the master registry.
- **Security Guardrails:** Clear explanation of what "Airgap Mode" actually enforces (e.g., DNS blocking, network-stack isolation).

## 4.4 Friction Reduction Plan
- [ ] Rename the final build from `neuralshell-v5-setup.exe` to `NeuralShell-2.1.29-Windows.exe`.
- [ ] Remove the "Internal Release Pack" from the public buyer zip.
- [ ] Add the `INSTALL_GUIDE_v2.md` to the installer's root.
