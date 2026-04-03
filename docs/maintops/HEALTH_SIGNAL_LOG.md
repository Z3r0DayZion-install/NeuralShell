# Health Signal Log

Use one row per signal entry. Keep wording factual and reproducible.

| Date | Source | Symptom | Frequency | Impact | Current State | Next Action | Owner | Due Date |
|---|---|---|---|---|---|---|---|---|
| 2026-03-20 | Steward (26WW11) | `FIRST_STEWARD_CYCLE_RUNBOOK.md` references non-existent scripts (`verify:ui`, `build:wrapper`, `verify`, `audit:final`). | One-off | Medium | Backlog | Update Runbook to map to actual `verify:ship` and `security:pass:local` scripts. | Steward | 2026-03-21 |
| 2026-04-03 | Steward (26WW14) | `release:worktree:strict` blocks release verification due high-volume untracked residue across `docs/`, `screenshots/`, `audit-pack/`, and `tear/`. | Repeated | High | Backlog | Classify residue into commit/archive/ignore buckets and restore strict clean-worktree readiness. | Steward | 2026-04-05 |
| 2026-04-03 | Steward (26WW14) | Launch command name drift in docs (`field:launch:health` vs `field-launch:health`) caused operator confusion. | One-off | Low | Closed | Command reference corrected in `FIELD_LAUNCH_COMMAND_CENTER.md`; keep command names synced with `package.json`. | Steward | 2026-04-03 |
| 2026-04-03 | Steward (26WW14) | Master branch protection required legacy contexts (`CI`, `Merge Gate`, `Release Contract`, `Security Gate`) that no longer emitted commit statuses on PR merge SHAs. | Repeated | High | Closed | Required contexts updated to emitted checks (`build_windows`, `ship_readiness`, `release_contract`, `security_pass`). | Steward | 2026-04-03 |
| 2026-04-03 | Steward (26WW14) | Non-required workflows (`audit`, `lighthouse_mobile_gate`, `soc2_prep`, `verify_ui_serial`) were red on PR #50 and obscured signal quality. | Repeated | Medium | Closed | Hardened workflow gates/fixtures and Linux UI launch strategy; revalidated RC with `npm run verify:ship` (exit 0). | Steward | 2026-04-03 |
