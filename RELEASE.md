# Release Runbook

## Runtime and Tooling
- Required Node version: `22.12.0` (see `.nvmrc` and `package.json` `engines`).
- Install dependencies with `npm ci`.

## Local Verification
1. `npm run icons:generate`
2. `npm test`
3. `npm run build`

## Update Server Configuration
- Auto-update publish endpoint is configured in `package.json`:
  - `build.publish[0].url = https://updates.neuralshell.app/desktop/`
- Host these files from that endpoint per release:
  - `latest.yml`
  - `*.exe`
  - `*.blockmap`

## Signing and Notarization Notes
- Windows installer signing is performed by `electron-builder` with the available code-signing setup.
- Ensure signing certificate and timestamp configuration are present in the build environment before release.
- For macOS release enable notarization in CI by setting Apple signing credentials and targeting mac builds.

## CI
- Workflow file: `.github/workflows/ci.yml`
- `test` job runs tests on Node `22.12.0`.
- `build_windows` job produces and uploads Windows artifacts.

## Release Checklist
1. Ensure tests pass on CI.
2. Validate installer launch on clean VM.
3. Upload artifacts to update host.
4. Publish release notes and tag.
