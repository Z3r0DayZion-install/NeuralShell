# NeuralShell Gmail Autopilot Setup (V2.0-RC-Final)

Use this once to enable `outreach:autopilot:full` inbox fetch and optional reply sending.

## 1) Create/rotate Google App Password
1. Go to `https://myaccount.google.com/apppasswords`.
2. Create an app password for `Mail` (or `Other: NeuralShell`).
3. Copy the 16-character password.

## 2) Set session environment variables
PowerShell:
```powershell
$env:GMAIL_USER = "your@gmail.com"
$env:GMAIL_APP_PASSWORD = "abcd efgh ijkl mnop"  # spaces are okay; scripts normalize
$env:SMTP_USER = "your@gmail.com"
$env:SMTP_FROM = "your@gmail.com"
$env:SMTP_PASS = "abcd efgh ijkl mnop"
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_PORT = "587"
```

## 3) Pull replies and process in one command
```bash
npm run outreach:autopilot:full
```

This runs:
1. Gmail inbox fetch -> `release/inbound_replies.csv`
2. Triage apply -> tracker update
3. Status snapshot
4. Reply draft generation

## 4) Optional: send generated reply outbox
Dry run:
```bash
npm run outreach:reply:send:dry
```

Live send:
```bash
npm run outreach:reply:send
```

## Security Notes
- Treat app passwords as secrets; never commit them.
- If exposed, revoke immediately and generate a new one.
- Prefer session-only env vars over storing secrets in files.

