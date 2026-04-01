# NeuralShell V2.1.8 — Maintenance Release Checklist

## 1. Pre-Release Validation
- [ ] All patches in the release meet `PATCH_CANDIDATE_CRITERIA.md`.
- [ ] `node scripts/omega_verify.js` PASSED (Baseline re-seal).
- [ ] `npm run release:gate:strict` PASSED.
- [ ] `node scripts/release-verify.js` PASSED against the new maintenance artifact.

## 2. Documentation Update
- [ ] `MAINTENANCE_CHANGELOG.md` updated.
- [ ] `LTS_SUPPORT_MODEL.md` impact assessed.
- [ ] `walkthrough.md` updated to reflect the new maintenance baseline.

## 3. Final Decision
- [ ] GO/HOLD confirmed via `RELEASE_READINESS_DECISION_MODEL.md`.
- [ ] Maintainer Lead signoff obtained.

---
**Verified By**: Lead Steward
