# NeuralShell

<!-- neuralshell-proof-badge:start -->
[![Proof Locked](https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/proof_badge.svg)](https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/proof_badge.svg)
<!-- neuralshell-proof-badge:end -->
[![SOC2 Prep](https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/soc2_prep.svg)](https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/soc2_prep.svg)

NeuralShell is a **local-first operator shell** designed for autonomous execution and workflow coordination. Built on a hardened **React/Electron desktop workflow**, it combines an intuitive **command palette as the control plane** with a robust **workbench and trust lane model**. Under the hood, it enforces strict **hardened state and contract discipline**, ensuring stability and security before speed.

> [!TIP]
> **Source of Truth**: See [Documentation Canon](docs/CANON.md) for the authoritative release and operations document map.


## Demo Walkthrough
[Watch Founder Walkthrough (120s)](docs/static/video/proof_walkthrough.webm)

## One-Command Install

```bash
npx neuralshell-installer
```

## Beta Program (Live)

- Recruitment thread: [Call for Beta Testers](https://github.com/Z3r0DayZion-install/NeuralShell/issues/34)
- Join via forms: [Issue Intake](https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose)
- Tester checklist: [BETA_TESTER_CHECKLIST_V2.0-RC-Final.md](docs/pilots/BETA_TESTER_CHECKLIST_V2.0-RC-Final.md)
- Control tower: [Beta Control Tower](https://github.com/Z3r0DayZion-install/NeuralShell/issues/32)

## Launch Surface

- Public launch page source: [docs/index.html](docs/index.html)
- Public site asset bundle: [docs/site-assets/asset-manifest.json](docs/site-assets/asset-manifest.json)
- Pricing page: [landing/pricing.html](landing/pricing.html)
- Partners page: [landing/partners.html](landing/partners.html)
- Press kit: [PRESS_KIT_V2.0-RC-Final.md](docs/pilots/PRESS_KIT_V2.0-RC-Final.md)
- Channel submission playbook: [CHANNEL_SUBMISSION_PLAYBOOK_V2.0-RC-Final.md](docs/pilots/CHANNEL_SUBMISSION_PLAYBOOK_V2.0-RC-Final.md)

## Revenue Operations

- Billing and activation: [docs/billing/README.md](docs/billing/README.md)
- Referral ops: [docs/growth/referrals.md](docs/growth/referrals.md)
- Partner kit: [docs/partners/README.md](docs/partners/README.md)
- Generate checkout link docs: `node scripts/checkout_links.cjs`
- Generate referral link payload: `node scripts/referral_links.cjs`
- Generate launch campaign pack: `node scripts/generate_launch_pack.cjs`

## Enterprise Compliance

- SOC2 prep report output: `SOC2_PREP_REPORT.md`
- SOC2 collector: `node compliance/soc2_collector.cjs`
- Third-party attribution page: `public/about.html` (generate with `node scripts/genAttribution.cjs`)

## Agent Marketplace

- Core agent manifests live in `agents/core/*/agent.json`.
- Install/verify agents from the in-app **Settings -> Agent Marketplace** gallery.

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

## Self-Sell Proof

Run a full product-led demo flow (proof + ROI + save/lock/unlock persistence) and generate screenshots + evidence report:

```powershell
npm run proof:self-sell
```

Artifacts generated:

- `screenshots/ui_sales_quickstart.png`
- `screenshots/ui_sales_proof_output.png`
- `screenshots/ui_sales_roi_output.png`
- `screenshots/ui_sales_lock_flow.png`
- `screenshots/ui_sales_unlock_restored.png`
- `release/ui-self-sell-proof-report.json`

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

## Portable Mode

- Portable mode guide (Windows): [PORTABLE_MODE.md](docs/PORTABLE_MODE.md)

## Security Gates

- Dependency review on PRs (`high` severity fails).
- `npm audit --audit-level=high` in CI.
- Secret scan via Gitleaks.
- CodeQL analysis on `master` and PRs.

## Privacy

- Privacy policy: [PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md)

## License

MIT
