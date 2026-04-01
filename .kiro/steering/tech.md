---
inclusion: always
---

# NeuralShell — Technical Steering

## Stack

| Layer | Technology |
|---|---|
| Desktop runtime | Electron 33.x |
| UI framework | React 18, Vite 5 |
| Styling | Tailwind CSS 3 (design tokens: `text-shell-*`, `bg-shell-*`) |
| State (renderer) | ShellContext (React Context + useState) + Zustand for isolated slices |
| State (main) | stateManager.js — versioned, migrated, IPC-backed |
| IPC boundary | preload.js whitelist — no nodeIntegration, no require() in renderer |
| Crypto | Node.js `crypto` — AES-256-GCM, Ed25519, SHA-256, scrypt |
| Secret storage | keytar (primary) → Electron safeStorage → hardware-bound AES fallback |
| Testing | Custom test runner (`tear/`), Playwright E2E (`e2e/`) |
| Build | electron-builder 26.x, NSIS (Windows), DMG (macOS), AppImage (Linux) |
| Node version | 22.12.x (pinned in `.nvmrc`) |

## Architecture Constraints

These are hard rules. Violations require explicit justification and review.

1. No renderer component may use `require('electron')` or bypass the preload/IPC boundary.
2. No new IPC channel without a schema entry in `IPC_CONTRACT.md`.
3. No new persisted state field without incrementing `STATE_VERSION` and adding a migrator in `stateManager.js`.
4. No new command registered outside `moduleRegistry.registerModule()`.
5. No new workbench panel without compact/default/drill-down rendering modes.
6. No machine-local paths (`C:\Users\...`, `/home/...`) in any distribution artifact or active logic. Use `path.join`, `process.cwd()`, or `app.getPath()`.
7. No duplicate action across surfaces without justification.

## IPC Pattern

All renderer-to-main communication goes through `window.api.*` (exposed via `src/preload.js`). The preload maintains an explicit allowlist of ~100 channels. Adding a channel requires:

1. Adding it to `ALLOWED_INVOKE_CHANNELS` in `src/preload.js`
2. Adding a handler in `src/main.js`
3. Adding input validation in `src/core/ipcValidators.js`
4. Documenting the schema in `IPC_CONTRACT.md`

## State Architecture

ShellContext (`src/renderer/src/state/ShellContext.jsx`) owns all renderer-global state, categorized as:

- `UI` — drawer open, palette open, layout mode
- `Domain` — sessions, chat log, model, workflow ID, output mode
- `System` — bridge connectivity, stats, hydration status

Components consume via `useShell()`. No prop drilling for shell-global state.

Autosave: 1200ms debounce, write-deduped by JSON digest, flushed on `beforeunload` and `visibilitychange`.

## LLM Bridge

`src/core/llmService.js` handles all provider communication. Supported protocols:

- `ollama` — Ollama REST API (local, no key required)
- `openai` — OpenAI chat completions (and all OpenAI-compatible endpoints)

Providers: Ollama, OpenAI, OpenRouter, Groq, Together, custom OpenAI-compatible.

Bridge health is polled every 5000ms. Retry: 3 attempts, 1000ms base delay, exponential backoff.

Remote bridges require explicit `allowRemoteBridge: true` in settings. Airgap mode blocks all remote traffic.

## Security Model

- IPC boundary: preload whitelist, no nodeIntegration
- Identity: Ed25519 keypair per device, hardware-bound (CPU ID + baseboard serial via wmic, SHA-256 fingerprint)
- Secrets: AES-256-GCM with hardware-derived key, keytar integration, authenticated data (AAD)
- Policy firewall: off / balanced / strict modes, pattern-matched on message content and command args
- Audit chain: append-only, hash-chained log in `src/core/auditChain.js`
- License: HMAC-SHA256 signed blobs. `NS_LICENSE_SIGNING_KEY` must be set in production — the dev fallback string must never ship

## Agency Policy

Actions are classified as `safe`, `medium`, or `high` risk in `src/core/actionRegistry.js`. Auto-run is governed by `src/core/agencyPolicy.js` (hot-reloadable from `agencyPolicy.json`). Constraints:

- Dirty git tree suppresses auto-run for non-safe actions
- Anomaly risk score > 50 suppresses auto-run
- `forceApproval` context flag always gates regardless of risk tier

## Testing

Run the full suite: `npm test`

This executes 25+ test files in `tear/` covering:
- Smoke tests (React architecture, packaged app, installer)
- Unit tests (IPC validators, bridge models, session/state managers)
- Contract tests (state schema, session schema, hardware binding, release artifacts)
- Security tests (policy firewall, audit chain, abuse simulation)

E2E (Playwright, requires built app): `npm run test:e2e`

Coverage check: `npm run coverage:check`

Do not use watch mode in CI. Use `--run` flag for single-pass execution.

## Release Discipline

1. `npm run release:worktree` — verify clean git state
2. `npm run release:manifest` — generate SHA-256 manifest of dist artifacts
3. `npm run release:sign` — sign the manifest
4. `npm run release:gate` — run full release gate (smoke, packaged, installer)
5. `npm run release:checksums` — generate checksums file

Signed artifacts live in `artifacts/var_proof/`. Release gate report in `release/release-gate.json`. Autonomy benchmark required at `release/autonomy-benchmark.json` before gate passes.

## Known Technical Debt

- `billing/licenseEngine.js`: dev signing key fallback must be removed before production
- `telemetry/otelBridge.js`: TCP ping only, not real OTLP — do not describe as OpenTelemetry
- `src/renderer.html` + `src/renderer.js`: dead files, safe to delete
- `telemetry/otelBridge.ts`, `gateway/hostedModelProxy.ts`, `src/daemon/modelPool.ts`, `src/daemon/ws_bridge.ts`: duplicate `.ts` stubs alongside `.js` implementations — pick one or delete
- `src/core/ritualManager.js`: stub, returns timestamps only
- `src/core/rgbController.js`: in-memory only, no hardware connection
