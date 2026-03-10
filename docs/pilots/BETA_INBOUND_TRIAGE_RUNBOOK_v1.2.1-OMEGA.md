# NeuralShell Inbound Triage Runbook (v1.2.1-OMEGA)

Use this workflow to process inbound outreach replies in under 5 minutes.

## 1) Prepare inbound file
1. Copy `docs/pilots/BETA_INBOUND_REPLY_IMPORT_TEMPLATE.csv` to `release/inbound_replies.csv`.
2. Fill rows with actual replies:
   - `email`
   - `subject`
   - `body`
   - `received_at` (ISO UTC recommended)
   - `from_name` (optional)

## 2) Dry-run classification
```bash
npm run outreach:triage
```

Outputs:
- `release/beta-inbound-triage-report.json`
- `release/beta-inbound-action-queue.md`

## 3) Apply classification to tracker
```bash
npm run outreach:triage:apply
```

Tracker updated:
- `docs/pilots/BETA_OUTREACH_TRACKER_v1.2.1-OMEGA.csv`

## 4) Generate status snapshot
```bash
npm run outreach:status
```

Outputs:
- `release/beta-outreach-status.md`
- `release/beta-outreach-status.json`

## 5) Execute next action
- If `response_state = interested`: reply with template `1) Positive Response`.
- If `response_state = routed`: reply with template `3) Listing/Directory Routing`.
- If `response_state = declined`: close loop with template `6) Decline/Close Loop`.
- If `response_state = replied`: use template `2) Needs More Details`.
- If `response_state = bounced`: replace contact path.

## 6) Follow-up cadence
- Send follow-up at +72h only for non-responders:
```bash
npm run outreach:followup
```

