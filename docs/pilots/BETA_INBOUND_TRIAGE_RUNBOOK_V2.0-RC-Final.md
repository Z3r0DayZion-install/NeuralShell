# NeuralShell Inbound Triage Runbook (V2.0-RC-Final)

Use this workflow to process inbound outreach replies in under 5 minutes.

## Fast Path (Autopilot)
```bash
npm run outreach:autopilot
```

Full path with Gmail inbox fetch:
```bash
npm run outreach:autopilot:full
```

Notes:
- `outreach:autopilot` expects `release/inbound_replies.csv` to already exist.
- `outreach:autopilot:full` requires Gmail credentials (see `BETA_GMAIL_AUTOPILOT_SETUP_V2.0-RC-Final.md`).

## 1) Prepare inbound file
1. Copy `docs/pilots/BETA_INBOUND_REPLY_IMPORT_TEMPLATE.csv` to `release/inbound_replies.csv`.
2. Fill rows with actual replies:
   - `email`
   - `subject`
   - `body`
   - `received_at` (ISO UTC recommended)
   - `from_name` (optional)

## 2) (Optional) Pull inbox replies from Gmail
```bash
npm run outreach:inbox:fetch
```

Output:
- `release/inbound_replies.csv`

## 3) Dry-run classification
```bash
npm run outreach:triage
```

Outputs:
- `release/beta-inbound-triage-report.json`
- `release/beta-inbound-action-queue.md`

## 4) Apply classification to tracker
```bash
npm run outreach:triage:apply
```

Tracker updated:
- `docs/pilots/BETA_OUTREACH_TRACKER_V2.0-RC-Final.csv`

## 5) Generate status snapshot
```bash
npm run outreach:status
```

Outputs:
- `release/beta-outreach-status.md`
- `release/beta-outreach-status.json`

## 6) Generate reply drafts and outbox
```bash
npm run outreach:drafts
```

Outputs:
- `release/beta-reply-drafts.md`
- `release/beta-reply-outbox.csv`

## 7) Execute next action
- If `response_state = interested`: reply with template `1) Positive Response`.
- If `response_state = routed`: reply with template `3) Listing/Directory Routing`.
- If `response_state = declined`: close loop with template `6) Decline/Close Loop`.
- If `response_state = replied`: use template `2) Needs More Details`.
- If `response_state = bounced`: replace contact path.
- Dry run outbox send:
```bash
npm run outreach:reply:send:dry
```
- Live outbox send:
```bash
npm run outreach:reply:send
```

## 8) Follow-up cadence
- Send follow-up at +72h only for non-responders:
```bash
npm run outreach:followup
```
