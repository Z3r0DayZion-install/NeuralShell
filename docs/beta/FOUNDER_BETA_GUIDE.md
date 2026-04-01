# NeuralShell Founder Beta — Operator's Guide

## 1. Welcome to the Console
NeuralShell is a security-hardened, local-first AI operator surface. This Founder Beta is a limited technical preview for professionals who require deterministic, private AI workflows.

## 2. Fast Local Setup (The 30-Second Win)
1. **Launch the App**: Open the `NeuralShell.exe` installer.
2. **Connect AI Engine**: Select "Ollama" or "LM Studio" in the onboarding wizard. Ensure your local server is running (default: `http://127.0.0.1:11434`).
3. **Finish & Seal**: Click through the verification checks to enter the main workspace.
4. **First Action**: Hit `Ctrl+K` to open the Command Palette and run `/status` to verify kernel connectivity.

## 3. Core Workflow: Active Persistence
- **Workflows (Left Rail)**: Your work is organized into encrypted sessions. Switching between sessions restores the full chat history and model context.
- **Composer (Center)**: Primary surface for inference. Use `/help` to see available local commands.
- **Workbench (Right)**: System health, integrity indicators, and the Ritual Terminal for low-level execution.

## 4. Security & Portability
- **Local-First**: No data leaves your machine unless you explicitly connect a remote bridge.
- **Hardened IPC**: All communication between the UI and the Kernel is gated by a security intent firewall.
- **Portability**: The canonical active link layer is portability-clean. Active logic uses environment-relative paths.

## 5. Known Limitations (v2.1.29)
- **Export execution log**: Currently disabled in the production UI (scheduled for v2.2).
- **Secret Recovery**: Passphrase recovery is intentionally hidden; do not lose your session passphrase.
- **Airgap Enforcement**: DNS blocking is active by default; some remote model providers may require manual policy bypass in `Settings`.

## 6. Feedback Loop
Your signal is the primary driver for v2.2.
- **Discord**: Join the `#operator-beta` channel for real-time triage.
- **Email**: Send detailed friction reports to `beta@neuralshell.app`.

---
*Seal Verified: March 24, 2026*
