# NeuralShell V2.0 Alpha: Advanced Agency

We are proud to announce the **NeuralShell V2.0 Alpha** release, a major milestone in autonomous system agency and operator transparency. This release focuses on the "Advanced Agency" (Stage 12) phase, transitioning from individual action pipelines to high-level, multi-step autonomous chains.

## Key Features

### 🔗 Autonomous Chaining (Wave 12A)
NeuralShell can now assemble and execute multi-step action sequences based on workspace signals.
- **Approval Boundaries**: High-risk actions (e.g., file writes, destructive commands) automagically gate for operator review, while safe reconnaissance actions auto-run for speed.
- **Chain Progress Visualization**: A real-time progress header in the Terminal Overlay keeps the operator informed throughout as sequences unfold.

### 🧠 Adaptive Intelligence (Wave 12B)
The system now anticipates friction and prioritizes the operator's attention where it matters most.
- **Failure Anticipation**: Using predictive heuristics, NeuralShell identifies potential blocks (e.g., missing configs, lockfile contention) before execution starts.
- **Attention Arbitration**: The Workspace Switcher now uses an urgency-weighted attention ranking to highlight workspaces that require immediate human-in-the-loop interaction or have critical failures.
- **Strategic Rationales**: Action recommendations now include contextual rationales based on workspace history and current signals.

### 🛡️ Core Integrity & Security
Building on the foundations of Phase 11 and Z3r0DayZion:
- **TEAR Protocol (v3.1.0)**: Perfect Forward Secrecy for decentralized logging.
- **Hardware Binding**: ECDSA licenses bound to CPU/MAC for secure node ownership.
- **Airgap Policy Persistence**: Strict control over external communication, enforced by the kernel.

## Getting Started
To experience the V2.0 Alpha features:
1. Open the **Intelligence Surface** (Right Pane) to see "Proposed Autonomous Chains."
2. Observe the **Workspace Switcher** for real-time priority sorting and "PRIORITY" badges.
3. Use the **Terminal Overlay** to monitor autonomous chain progress and predictive warnings.

---
*NeuralShell V2.0 Alpha - Advancing to Strategic Sovereignty (Beta).*
