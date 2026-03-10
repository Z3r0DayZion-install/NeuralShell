# NeuralShell Beta Runboard (v1.2.1-OMEGA)

Use this as the single source of truth for the beta round.

## Targets
- Invite sent: 10 testers
- Started: 5 testers
- Completed checklist: 5 testers
- P0/P1 blockers before public push: 0

## Operating Links
- Issue forms: `https://github.com/Z3r0DayZion-install/NeuralShell/issues/new/choose`
- Triage playbook: `docs/pilots/BETA_TRIAGE_PLAYBOOK_v1.2.1-OMEGA.md`
- Immutable ledger: `governance/BETA_PILOT_LEDGER_v1.2.1-OMEGA.jsonl`
- Targeted outreach batch: `docs/pilots/BETA_TARGETED_OUTREACH_EMAIL_BATCH_v1.2.1-OMEGA.md`
- Reply templates: `docs/pilots/BETA_REPLY_TEMPLATES_v1.2.1-OMEGA.md`
- Outreach tracker: `docs/pilots/BETA_OUTREACH_TRACKER_v1.2.1-OMEGA.csv`

## Outreach Ops
- Sender script: `scripts/send_beta_outreach_emails.py`
- Follow-up script: `scripts/send_beta_followup_emails.py`
- Inbound triage script: `scripts/triage_beta_inbound_replies.py`
- Status dashboard script: `scripts/beta_outreach_status_report.py`
- Gmail inbox fetch script: `scripts/fetch_gmail_inbound_replies.py`
- Draft generator script: `scripts/generate_beta_reply_drafts.py`
- Reply outbox sender script: `scripts/send_beta_reply_outbox.py`
- One-command autopilot: `scripts/run_beta_inbound_autopilot.py`
- Follow-up cadence: one bump at +72h for `sent` / `no_response`
- Inbound import template: `docs/pilots/BETA_INBOUND_REPLY_IMPORT_TEMPLATE.csv`
- Inbound triage runbook: `docs/pilots/BETA_INBOUND_TRIAGE_RUNBOOK_v1.2.1-OMEGA.md`
- Gmail autopilot setup: `docs/pilots/BETA_GMAIL_AUTOPILOT_SETUP_v1.2.1-OMEGA.md`
- Follow-up dry run command:
  `python scripts/send_beta_followup_emails.py --dry-run --min-age-hours 72 --limit 20`
- Follow-up live command:
  `python scripts/send_beta_followup_emails.py --min-age-hours 72 --limit 20`
- Inbound triage dry run:
  `python scripts/triage_beta_inbound_replies.py --input release/inbound_replies.csv`
- Inbound triage apply:
  `python scripts/triage_beta_inbound_replies.py --input release/inbound_replies.csv --apply`
- Status snapshot:
  `python scripts/beta_outreach_status_report.py`
- Generate reply drafts:
  `python scripts/generate_beta_reply_drafts.py`
- Send reply drafts (dry run):
  `python scripts/send_beta_reply_outbox.py --dry-run`
- Send reply drafts (live):
  `python scripts/send_beta_reply_outbox.py`
- Full inbound autopilot (fetch + triage + status + drafts):
  `python scripts/run_beta_inbound_autopilot.py`

## Tester Tracker
| Tester | Invite Sent | Started | Completed | Result (`Passed X/9`) | Highest Bug Severity | Notes |
|---|---|---|---|---|---|---|
| Tester 01 |  |  |  |  |  |  |
| Tester 02 |  |  |  |  |  |  |
| Tester 03 |  |  |  |  |  |  |
| Tester 04 |  |  |  |  |  |  |
| Tester 05 |  |  |  |  |  |  |
| Tester 06 |  |  |  |  |  |  |
| Tester 07 |  |  |  |  |  |  |
| Tester 08 |  |  |  |  |  |  |
| Tester 09 |  |  |  |  |  |  |
| Tester 10 |  |  |  |  |  |  |

## Bug Triage Queue
| Bug ID | Title | Severity | Reproducible | Owner | Status | Fix Version |
|---|---|---|---|---|---|---|
| BETA-001 |  |  |  |  | New |  |
| BETA-002 |  |  |  |  | New |  |
| BETA-003 |  |  |  |  | New |  |

## Exit Criteria
1. At least 5 checklist completions.
2. No open `P0` or `P1`.
3. Any `P2` has a known workaround or a committed fix plan.
4. Installer, first launch, onboarding memory, settings persistence validated by at least 3 different testers.
