# NeuralShell V2.1.8 — Patch Candidate Criteria

## 1. Severity Threshold
An issue is a Patch Candidate if it meets **P0 (Critical)** or **P1 (Major)** criteria as defined in `BACKLOG_PRIORITY_MODEL.md`.

## 2. Evidence Threshold
- **Reproducibility**: Must be reproducible in the standard V2.1 evaluation environment.
- **Traceability**: Must be traced to a specific module in the V2.1.4 Golden Master baseline.
- **Risk Analysis**: The risk of "Fix Side Effects" must be lower than the risk of "Decline Patch".

## 3. Disqualification
- Issues that are solely environment variance.
- Issues that are cosmetic or informational.
- Issues that require a fundamental architectural change (Graduates to new Release Line instead).

---
**Reference**: `PATCH_PIPELINE.md`
