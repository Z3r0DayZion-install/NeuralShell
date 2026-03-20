# First Steward Cycle Runbook

## Purpose
Activate the first real maintenance cycle for the sealed NeuralShell baseline.

## Baseline
- Public shipping artifact: NeuralShell V2.1.4 Golden Master
- Lifecycle stage for this operations layer: V2.1.9 Maintenance Operations Ready

## Cycle Cadence
- Weekly review: every Tuesday, fixed team slot, 45 minutes
- Monthly review: first business day of each month, 90 minutes

## First Weekly Review Execution
1. Open `docs/maintops/HEALTH_SIGNAL_LOG.md` and append the current week row.
2. Review evidence from `npm test`, `npm run verify:ship`, `npm run security:pass:local`, and `node scripts/omega_verify.js`.
3. Compare current signals against prior two weekly rows.
4. Classify each signal as observation-only, backlog candidate, or patch-watch candidate.
5. Record decisions in `docs/maintops/reviews/[DATE]_weekly_steward_review.md`.
6. Run steward signoff using `docs/maintops/records/[DATE]_steward_cycle_signoff.md`.

## First Monthly Review Execution
1. Aggregate weekly signal rows for the month.
2. Run LTS horizon checks in `docs/maintops/LTS_COMPLIANCE_REVIEW.md` and `docs/maintops/SUPPORT_HORIZON_CHECKLIST.md`.
3. Re-evaluate deferred backlog items using `docs/maintops/BACKLOG_REVIEW_TEMPLATE.md`.
4. Confirm patch-watch status using `docs/maintops/PATCH_WATCH_REVIEW_TEMPLATE.md`.
5. Publish a single monthly review summary.

## Artifacts Reviewed Each Cycle
- Current gate outputs and build logs
- Health signal log entries
- Backlog board state and movement decisions
- Patch-watch state and trigger evidence
- LTS horizon and compatibility review notes

## Signoff Flow
1. Primary steward drafts cycle summary.
2. Secondary steward verifies evidence links and classifications.
3. Maintainer signoff closes the cycle.

## Escalation Path
- Weekly blocker: escalate to patch-watch within the same day.
- Repeat signal over two weekly cycles: escalate to backlog state change.
- Trust-breaking or release-risk signal: escalate immediately to hardening planning.
