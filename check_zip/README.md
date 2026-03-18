# NeuralShell

NeuralShell is an Electron workstation with strict IPC validation, offline-first defaults, and release provenance gates.

## Beta Program (Live)

- Recruitment thread: [Call for Beta Testers](https://github.com/Z3r0DayZion-install/NeuralShell/issues/34)
- Join via forms: [Issue Intake](https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose)
- Tester checklist: [BETA_TESTER_CHECKLIST_v1.2.1-OMEGA.md](docs/pilots/BETA_TESTER_CHECKLIST_v1.2.1-OMEGA.md)
- Control tower: [Beta Control Tower](https://github.com/Z3r0DayZion-install/NeuralShell/issues/32)

## Launch Surface

- Public launch page source: [docs/index.html](docs/index.html)
- Public site asset bundle: [docs/site-assets/asset-manifest.json](docs/site-assets/asset-manifest.json)
- Press kit: [PRESS_KIT_v1.2.1-OMEGA.md](docs/pilots/PRESS_KIT_v1.2.1-OMEGA.md)
- Channel submission playbook: [CHANNEL_SUBMISSION_PLAYBOOK_v1.2.1-OMEGA.md](docs/pilots/CHANNEL_SUBMISSION_PLAYBOOK_v1.2.1-OMEGA.md)

## Quick Start

1. Install dependencies:

```powershell
nvm use 22.12.0
npm ci
```

2. Install local git hooks (recommended):

```powershell
npm run hooks:install
```

3. Run tests:

```powershell
npm test
```

4. Run app:

```powershell
npm start
```

## Build

Generate icons first, then package:

```powershell
npm run icons:generate
npm run build
```

Prepare public site assets and social card:

```powershell
npm run channel:site:prepare
```

## Release Flow

Standard release verification:

```powershell
npm run ship
```

Strict release verification (clean tree + strict packaged smoke):

```powershell
npm run ship:strict
```

Tag release workflow (GitHub Actions):

1. Ensure `master` commit has successful `CI`, `Merge Gate`, `Release Contract`, and `Security Gate` runs.
2. Push a tag like `v1.1.0-OMEGA`.
3. `Release Tag` workflow publishes installer + checksums + provenance + changelog snapshot.

Detailed operator guide: [RUNBOOK_TAG_RELEASE.md](docs/RUNBOOK_TAG_RELEASE.md)

## Rollback

1. Identify prior stable tag from Releases.
2. Re-point update channel to previous release artifacts (`dist/OMEGA.yml` + installer + blockmap).
3. If needed, mark current release as superseded and publish rollback note.

Hotfix/rollback guide: [RUNBOOK_HOTFIX.md](docs/RUNBOOK_HOTFIX.md)

## Troubleshooting

- Packaged startup issues:

```powershell
npm run diagnose:packaged
```

- Strict packaged smoke only:

```powershell
npm run smoke:packaged:strict
```

- Verify release metadata freshness:

```powershell
npm run release:verify:fresh
npm run release:verify:fresh:strict
```

- Offline checksum verification:

```powershell
.\scripts\verify.ps1 -SelfTest
.\scripts\verify.ps1
.\scripts\verify.ps1 -Installer
```

- Bypass local pre-push gate once:

```powershell
$env:NEURAL_SKIP_PREPUSH="1"
git push
```

## Security Gates

- Dependency review on PRs (`high` severity fails).
- `npm audit --audit-level=high` in CI.
- Secret scan via Gitleaks.
- CodeQL analysis on `master` and PRs.

## Privacy

- Privacy policy: [PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)

## License

MIT
