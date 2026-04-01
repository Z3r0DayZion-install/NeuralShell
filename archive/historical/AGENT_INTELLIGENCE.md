# NeuralShell Agent Intelligence Guide

Purpose: operating instructions for AI coding agents contributing to NeuralShell.

## 1. Project Priorities

1. Security correctness over feature speed.
2. Deterministic, testable changes.
3. Release gate compatibility (`tear/` and release scripts).
4. Truthful documentation and proof artifacts.

## 2. Required Local Loop

For non-trivial changes, run:

```powershell
node --check src/main.js src/preload.js src/renderer.js
npm test
```

If release flow touched, also run:

```powershell
npm run release:manifest
npm run release:status
npm run release:checksums
npm run release:verify:fresh
```

## 3. IPC and Security Rules

1. Do not add unrestricted IPC channels.
2. Update validators in `src/core/ipcValidators.js` when IPC payloads change.
3. Keep `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: true`.
4. Avoid `eval`, dynamic code execution, and implicit trust of user input.

## 4. LLM Runtime Rules

1. Treat bridge availability as unreliable; keep fallback paths.
2. Preserve cancellation semantics and timeout handling.
3. Keep model/persona state in sync across renderer/main.
4. Never hardcode machine-specific absolute paths.

## 5. Proof and Release Hygiene

1. Proof docs must cite existing artifacts, not placeholders.
2. Hash values must come from generated release outputs only.
3. Do not commit secrets, private keys, or tokens.
4. Update `MASTER_PROOF.md` and hard proof docs when verification scope changes.

## 6. Documentation Standards

1. Label assumptions as assumptions.
2. Separate "verified" from "planned" claims.
3. Avoid legal/compliance claims without external evidence links.

## 7. Agent Output Format

When delivering changes, include:

1. what changed
2. why it changed
3. test commands executed
4. known gaps or follow-ups
