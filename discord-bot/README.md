# NeuralShell Discord Proof-Drop Bot

## Command

- `!drop` posts:
  - SHA-256 manifest attachment
  - hash count
  - computed Sovereign Score (0-100)

## Local run

```bash
cd discord-bot
npm ci
DISCORD_BOT_TOKEN=... NS_MANIFEST_PATH=../dist/SHA256SUMS.txt npm run dev
```
