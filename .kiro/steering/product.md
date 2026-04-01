---
inclusion: always
---

# NeuralShell — Product Steering

## What NeuralShell Is

NeuralShell is a local-first operator shell for autonomous execution and workflow coordination. It runs as a hardened Electron desktop application. The primary interface is a command palette backed by a structured workbench. The product is designed for operators who need deterministic, auditable, privacy-respecting AI-assisted workflows — not a chat toy.

The core value proposition: bring your own model (local or remote), work in encrypted sessions, execute multi-step autonomous actions against your workspace, and maintain a full audit trail. Everything runs on your machine unless you explicitly configure a remote bridge.

## What NeuralShell Is Not

- Not a SaaS dashboard
- Not a general-purpose chatbot wrapper
- Not a sales ops tool (those scripts are internal tooling, not product)
- Not a demo environment pretending to be production

## Implemented and Shippable

These surfaces are real, tested, and production-grade:

- LLM bridge (Ollama, OpenAI, OpenRouter, Groq, Together, custom OpenAI-compatible)
- Encrypted session management (AES-256-GCM, passphrase-gated, autosave with debounce)
- Command palette as primary control plane
- Workspace scanning, patch planning, file operations
- Provider sweep (auto-detect local LLM)
- First-boot onboarding wizard
- Settings drawer with bridge config and profiles
- License activation and tier-gated capabilities (free / operator / enterprise)
- Hardware-bound identity (Ed25519 keypair, hardware fingerprint)
- Secret vault (keytar + AES-256-GCM fallback)
- Audit chain (append-only, hash-chained)
- Autonomous action execution with agency policy (safe / advisory / high-risk tiers)
- Multi-step chain planning with failure prediction and memory
- Workbench rail (artifacts, patch plans, verification)

## Not Implemented — Do Not Present as Features

The following components exist in the codebase but have no real backend wiring. They must not be described as product features until implemented:

- RGB controller (stores a color in memory, no hardware connection)
- OTel bridge (TCP ping only, no OTLP protocol)
- Ritual manager (returns timestamps, executes nothing)
- XP/progression system (reads/writes a number, not connected to behavior)
- Voice panel (normalizes a payload object, no audio)
- All ~80 enterprise console components (FleetControlPanel, RevenueOpsConsole, SalesConsole, PartnerConsole, BoardConsole, EcosystemCommandCenter, etc.) — UI shells with no backend

## Tier Model

- `free` / Audit-Only: read-only proof and status commands
- `operator` / Pro: full autonomous execution, session management, workspace actions
- `enterprise`: fleet, policy rollout, appliance mode, advanced compliance (when implemented)

Capabilities are resolved from `config/tiers.json` via `src/core/capabilities.js`. License blobs are HMAC-signed. The signing key must be set via `NS_LICENSE_SIGNING_KEY` env var — the dev fallback must never reach production.

## Naming Conventions

- "bridge" = the configured LLM provider connection (not "API", not "backend")
- "session" = an encrypted, named conversation context
- "workflow" = the active session identifier used internally
- "operator" = the human user of the shell
- "action" = a discrete autonomous task executed by the engine
- "chain" = a multi-step sequence of actions
- "proof" = a verifiable, signed execution artifact
- "tier" = the license capability level

Use these terms consistently across UI copy, IPC channel names, and documentation.

## Quality Bar

- No placeholder UI that implies functionality that doesn't exist
- No fake metrics, sample data presented as live data, or demo mode masquerading as real state
- Every IPC channel must have a schema in `IPC_CONTRACT.md`
- Every new persisted field must increment `STATE_VERSION` and include a migrator
- Every new command must be registered via `moduleRegistry.registerModule()`
