# CI Secrets Reference

NeuralShell workflows use GitHub Actions secrets for release packaging, plugin signing, and automation hooks.

## Required Secrets

| Secret | Scope Needed | Used By |
|---|---|---|
| `NPM_TOKEN` | npm publish automation token | `publish.yml` |
| `DISCORD_BOT_TOKEN` | Discord bot token | `proof-drop-friday.yml` |
| `DISCORD_WEBHOOK` | webhook URL only | `proof-drop-friday.yml` |
| `GH_PAT_PAGES` | `repo`, `pages:write` | `pages.yml` |

## Optional Secrets

| Secret | Scope Needed | Used By |
|---|---|---|
| `AC_USERNAME` | Apple ID | `notarize.yml` |
| `AC_PASSWORD` | app-specific password / notary profile | `notarize.yml` |
| `AC_TEAM_ID` | Apple team id | `notarize.yml` |
| `VSIX_SIGNING_CERT_CHAIN` | cert chain PEM | `plugins.yml` |
| `VSIX_SIGNING_PRIVATE_KEY` | private key PEM | `plugins.yml` |
| `VSIX_SIGNING_PRIVATE_KEY_PASSWORD` | key passphrase | `plugins.yml` |
| `JB_CERT_CHAIN` | cert chain PEM | `plugins.yml` |
| `JB_PRIVATE_KEY` | private key PEM | `plugins.yml` |
| `JB_PRIVATE_KEY_PASSWORD` | key passphrase | `plugins.yml` |
| `TWITTER_BEARER_TOKEN` | Twitter API bearer token | `scripts/auto_tweet.cjs` |

## Bootstrap Script

Print setup commands:

```bash
node scripts/setup_ci_secrets.cjs
```

Validate required secrets:

```bash
node scripts/setup_ci_secrets.cjs --check
```

Use org or repo scope:

```bash
node scripts/setup_ci_secrets.cjs --org=YOUR_ORG
node scripts/setup_ci_secrets.cjs --repo=OWNER/REPO
```
