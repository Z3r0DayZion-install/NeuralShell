# NeuralShell Desktop

## Run
```bash
npm install
npm start
```

## Run Headless (No Window)
```bash
npm run start:headless
```

## Run TEAR Runtime (Non-Electron)
```bash
npm run start:tear
```

Default API:
- `GET http://127.0.0.1:4173/health`
- Runtime data directory: `./.tear_runtime` (override with `NS_RUNTIME_DIR`)

Useful env vars:
- `NS_TEAR_HOST` (default `127.0.0.1`)
- `NS_TEAR_PORT` (default `4173`)
- `NS_LLM_HOST` (default `http://127.0.0.1:11434`)
- `NS_VAULT_KEY` (optional local vault encryption key for non-Electron runtime)

## Build TEAR Runtime EXE (Non-Electron)
```bash
npm run build:tear:exe
```

On first auth login, the app requires PIN setup. Enter a PIN in the auth field and use Login to initialize it.
If you forget the PIN, enter a new PIN, type `RESET PIN`, and use `Recover PIN` to rotate credentials locally.

## What is Included
- Local Electron shell for NeuralShell
- LLM bridge to local Ollama-style endpoint (`127.0.0.1:11434`)
- Timestamped chat UI with persistent session history
- Built-in diagnostics (self-test + button audit)

## Utility Scripts
```bash
npm run lint:js
npm run lint:tear
npm run checksums
npm run test:serial
# Optional full suite with Electron-spawn E2E tests:
set NS_ENABLE_E2E=1&& npm run test:serial
```

## Windows Code Signing (CI)
- Add repository secrets:
  - `WIN_CSC_LINK` (base64 PFX or file URL accepted by electron-builder)
  - `WIN_CSC_KEY_PASSWORD` (certificate password)
- CI uses these secrets automatically during `build:win` and `build:portable`.
- If secrets are missing, builds still run unsigned.

## Release Assets
- `CI Release` now uploads:
  - installer/portable executables
  - blockmap/yml metadata
  - `dist/RELEASE_CHECKSUMS.txt`
  - `RELEASE_NOTES.md`
- Tag pushes matching `v*` publish a GitHub release with those assets.
