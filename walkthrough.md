# NeuralShell V2.1.4 Golden Master - Maintenance Operations Activation

This document records the activation of maintenance operations on top of the sealed NeuralShell Golden Master baseline.

## Baseline Authority
- Public shipping artifact: NeuralShell V2.1.4 Golden Master
- Artifact authority is unchanged in this pass.
- This pass activates operations only; it does not relabel the shipping artifact.

## Preserved Release and Verification History
- OMEGA and Golden Master verification history remains part of the sealed release record.
- Golden Master distribution and operator enablement history remain preserved.
- V2.1.8 maintenance governance and LTS ratification remain preserved.

## Preserved V2.1.8 Governance and LTS Policy
The existing maintenance governance policy remains authoritative:
- Active Maintenance: 12 months from GM seal
- Security-Only Support: 24 months from GM seal
- End of Life: next major LTS baseline, or end of the 24-month security-only period

## V2.1.9 Maintenance Operations Pack
This activation adds an operational layer in `docs/maintops/` with practical runbooks, checklists, and review templates for:
- first steward cycle execution
- routine evidence review and signal tracking
- backlog review board operation
- patch-watch operation and escalation logic
- LTS compliance and support horizon checks
- compatibility and deprecation review
- maintainer handoff

## Operating Model in Use
### 1. Steward Cycle
- Weekly and monthly reviews are now executable through explicit runbooks and signoff templates.
- Each cycle produces a review summary and a recorded decision trail.

### 2. Routine Evidence Review
- Evidence is reviewed in weekly and monthly cadence.
- Repeated signals are tracked; one-off noise is contained unless trend or impact changes.

### 3. Backlog Operations
- Intake, state transitions, and closure rules are evidence-based.
- Board decisions are recorded with owner, due date, and verification notes.

### 4. Patch Watch
- Patch-watch opens only on defined trigger conditions.
- Watch can close with no action when evidence does not justify a patch.
- Escalation to patch planning requires reproducible impact.

### 5. LTS Compliance
- Monthly horizon checks operationalize the 12-month and 24-month policy windows.
- Compatibility/deprecation reviews identify when communication is required.

## What Maintainers Use Now
- `docs/maintops/FIRST_STEWARD_CYCLE_RUNBOOK.md`
- `docs/maintops/STEWARD_CYCLE_CHECKLIST.md`
- `docs/maintops/ROUTINE_EVIDENCE_REVIEW.md`
- `docs/maintops/BACKLOG_OPERATIONS_RUNBOOK.md`
- `docs/maintops/PATCH_WATCH_MODEL.md`
- `docs/maintops/LTS_COMPLIANCE_REVIEW.md`
- `docs/maintops/MAINTOPS_HANDOFF.md`

## Maintenance Patch Record
### Patch 1 (V2.1.10) - 2026-03-19
- **Problem Fixed**: Baseline integrity reconciliation; 20 hash violations and untracked residues.
- **Action Taken**: Re-baselined `source_manifest.json` post-cleanup to align with the V2.1.9 maintenance state.
- **Verification**: All gates (`verify:ship`, `security:pass:local`, `omega_verify`) are Green.
- **Authority**: Authoritative shipping artifact remains **NeuralShell V2.1.4 Golden Master**; repository baseline advanced to **V2.1.10 Patch 1**.

Status: SEALED (V2.1.10 Maintenance Patch 1 Applied)
