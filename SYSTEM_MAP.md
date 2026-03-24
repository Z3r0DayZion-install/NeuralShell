# SYSTEM MAP — NEURALSHELL V2.1.29 GA

## Architecture Overview
Capability-based Microkernel with strictly isolated privileged operations.

## Component Breakdown

### 1. Trusted Computing Base (TCB) — src/kernel/
Only these modules have access to Node.js privileged APIs.
- **filesystem.js**: Gated access to appData and appPath.
- **network.js**: Secure fetch with SPKI pinning (HTTPS only).
- **execution.js**: Secure process spawning with environment scrubbing.
- **crypto.js**: Centralized hashing and encryption (AES-256-GCM).
- **index.js**: Frozen broker interface using Symbol tokens.

### 2. Security Layer — src/security/
- **intentFirewall.js**: Deterministic validation of all IPC payloads via Ajv schemas. Enforces NFC normalization and null-byte rejection.

### 3. Core Services — src/core/ (Legacy/Refactoring)
High-level application logic consuming kernel capabilities.
- **llmService.js**: LLM communication and persona management.
- **xpManager.js**: Gamification and progression engine.
- **ritualManager.js**: Automation and behavioral triggers.

### 4. Interface — src/
- **main.js**: Hardened Electron entry point. Enforces zero-renderer-network and secure window flags.
- **preload.js**: Exposed API gating IPC to the kernel broker.
- **renderer.js**: Unprivileged UI logic.

## Information Flow
Renderer -> Preload -> IPC -> Intent Firewall -> Kernel Broker -> System API
