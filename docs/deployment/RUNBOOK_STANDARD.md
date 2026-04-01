# RUNBOOK_STANDARD

## Standard Desktop Runbook

1. Run preflight checks.
2. Install signed package.
3. Launch strict smoke and verify readiness.
4. Validate trust and policy posture.
5. Capture post-install report and operator sign-off.

## Rollback

- Freeze update lane.
- Restore prior signed release.
- Re-run post-install validation.

## Decommission

- Export required evidence.
- Remove runtime and residual user data according to policy.
- Record decommission attestation.
