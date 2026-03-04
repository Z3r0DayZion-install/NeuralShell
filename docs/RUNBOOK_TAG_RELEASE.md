# Tag Release Runbook

## Preconditions

- Branch: `master`
- Commit has green workflows:
  - `CI`
  - `Merge Gate`
  - `Release Contract`
  - `Security Gate`
- Local working tree is clean for release scope:

```powershell
npm run release:worktree:strict
```

## Local Validation

```powershell
npm ci
npm run icons:generate
npm run ship:strict
```

## Publish

1. Create and push a version tag:

```powershell
git tag v1.1.0-OMEGA
git push origin v1.1.0-OMEGA
```

2. Wait for `.github/workflows/release-tag.yml` to finish.

3. Confirm release page assets include:
- Installer `.exe`
- Installer `.blockmap`
- `dist/OMEGA.yml`
- `release/manifest.json`
- `release/status.json`
- `release/provenance.json`
- `release/checksums.txt`
- `release/checksums.json`
- `CHANGELOG.md`

## Post-Release Verification

- Verify checksums from `release/checksums.txt`.
- Verify update metadata references the new installer.
- Validate a clean install + update path on Windows VM.
