# Release Runbook

## Runtime and Tooling
- Required Node version: `20.x` (see `package.json` `engines`).
- Install dependencies with `npm ci`.

## Local Verification
1. `npm run release:worktree:strict`
2. `npm run icons:generate`
3. `npm run ship:strict`

## Update Server Configuration
- Auto-update publish endpoint is configured in `package.json`:
  - `build.publish[0].url = https://updates.neuralshell.app/desktop/`
- Host these files from that endpoint per release:
  - `OMEGA.yml` (or `latest.yml` for compatibility)
  - `*.exe`
  - `*.blockmap`
  - `release/checksums.txt`
  - `release/provenance.json`

## Signing and Notarization Notes
- Windows installer signing is performed by `electron-builder` with the available code-signing setup.
- Ensure signing certificate and timestamp configuration are present in the build environment before release.
- For macOS release enable notarization in CI by setting Apple signing credentials and targeting mac builds.

## CI
- Workflow files:
  - `.github/workflows/ci.yml`
  - `.github/workflows/merge-gate.yml`
  - `.github/workflows/release-contract.yml`
  - `.github/workflows/security-gate.yml`
  - `.github/workflows/release-tag.yml`

## Release Checklist
1. Ensure tests pass on CI.
2. Push release tag `v*-OMEGA*`.
3. Validate packaged smoke report and release assets.
4. Verify checksums/provenance and updater metadata on update host.
