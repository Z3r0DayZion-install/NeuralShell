# NeuralShell Beta Triage Playbook (v1.2.1-OMEGA)

Use this playbook to process incoming beta issues with consistent speed and severity.

## Intake Channels
1. `Beta Bug Report` issue form for defects.
2. `Beta Test Result` issue form for checklist completion.
3. `docs/pilots/BETA_RUNBOARD_v1.2.1-OMEGA.md` for aggregated tracking.
4. `governance/BETA_PILOT_LEDGER_v1.2.1-OMEGA.jsonl` for immutable event log.

## Severity Policy
- `P0`: install/launch blocked, data loss, security compromise, unrecoverable crash.
- `P1`: major feature broken with no practical workaround.
- `P2`: partial break with workaround.
- `P3`: cosmetic/minor friction with no functional block.

## Triage SLA
- `P0`: acknowledge in 15 minutes, assign owner immediately, hotfix path same day.
- `P1`: acknowledge in 60 minutes, assign owner same day.
- `P2`: acknowledge within 1 business day.
- `P3`: batch into next patch or UX pass.

## Required Actions Per Bug
1. Confirm reproducibility with exact steps.
2. Confirm affected scope (all users vs environment-specific).
3. Assign owner and target fix version.
4. Update runboard row and ledger event.
5. Close only after fix verification on a clean run.

## Exit Gate To Public
1. Zero open `P0`.
2. Zero open `P1`.
3. Any open `P2` has documented workaround and scheduled fix.
4. At least 5 completed beta result forms.
