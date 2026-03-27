# Launch Pack Generator

Generate release-ready copy for X, Discord, Reddit, email, and changelog snippets.

```powershell
node scripts/generate_launch_pack.cjs
```

Output is written to:

- `release/launch-pack/<timestamp>/x.md`
- `release/launch-pack/<timestamp>/discord.md`
- `release/launch-pack/<timestamp>/reddit.md`
- `release/launch-pack/<timestamp>/email.md`
- `release/launch-pack/<timestamp>/changelog.md`
- `release/launch-pack/<timestamp>/manifest.json`

The generator reads:

- `package.json` version
- `release/proof-bundle-summary.json`
- `release/ui-self-sell-proof-report-packaged.json`
- templates in `docs/marketing/templates/`
