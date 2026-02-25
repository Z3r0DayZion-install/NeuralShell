# NeuralShell Production Release Runbook (Deterministic, Fail-Closed)

This repo treats “production” as: **a tagged commit that passes the full proof spine, produces signed Windows artifacts, and publishes a proof bundle + hashes**.

## One-command production gate

Run locally (or in CI):

- `npm run release:gate`

`release:gate` fails closed on:
- any failing test/proof
- missing proof bundle
- missing release manifest
- dirty git working tree (root + `NeuralShell_Desktop` submodule)
- (when `NS_REQUIRE_SIGNING=1`) any unsigned `.exe` in `NeuralShell_Desktop/dist`

Outputs:
- `state/proof_bundles/<RUN_TS>/proof-bundle-<RUN_TS>.tar.gz` + `.sha256`
- `state/releases/<RUN_TS>/release.manifest.json` + `.sha256`
- `state/releases/<RUN_TS>/release.receipt.json` + `.sha256`
- `state/releases/<RUN_TS>/release.sha256.txt`

`release:gate` enforces these root gates:
- `npm run security:audit`
- `npm run ast-gate`
- `npm test`
- `npm run verify:all`

## Release preconditions (must be true)

1) **Submodule is committed + pinned**
- Commit changes inside `NeuralShell_Desktop/`
- Update the parent repo submodule gitlink to that exact Desktop commit

2) **Working tree is clean**
- `git status --porcelain` is empty in root and in `NeuralShell_Desktop/`

3) **Signing is configured for CI**
- Provide signing secrets for `electron-builder`:
  - `CSC_LINK`
  - `CSC_KEY_PASSWORD`
- Ensure `signtool.exe` is available (Windows SDK). If not auto-discoverable, set:
  - `NS_SIGNTOOL_PATH`

## Production release (fully automated)

Push a tag matching `v*` (example: `v0.2.0`) to trigger:
- `.github/workflows/release-windows.yml`

That workflow runs `npm run release:gate` with `NS_REQUIRE_SIGNING=1`, uploads artifacts, and creates a GitHub Release containing:
- Desktop installer/portable artifacts from `NeuralShell_Desktop/dist/`
- proof bundle tarball + sha256
- deterministic release manifest + hashes
