# NeuralShell V2.1.8 — Patch Pipeline

## 1. Pipeline Activation
The Patch Pipeline is activated when an issue in the `ISSUE_REVIEW_BOARD.md` is graduated to **Patch Candidate** status.

## 2. Pipeline Stages
1. **Candidate Validation**: Reproduce findings on the V2.1.4 Golden Master baseline.
2. **Branch Cutover**: Create an isolated maintenance branch according to `PATCH_BRANCH_CUTOVER_RULES.md`.
3. **Execution**: Implement the minimal required technical fix.
4. **Verification**: Execute the `npm run release:gate:strict` suite.
5. **Release**: Transition to the `MAINTENANCE_RELEASE_CHECKLIST.md`.

## 3. Pipeline Closure
A pipeline cycle is closed only when the maintenance release is sealed and the baseline health re-verified via `ROUTINE_HEALTH_REVIEW_TEMPLATE.md`.

---
**Standard**: PipeOps-1.0
