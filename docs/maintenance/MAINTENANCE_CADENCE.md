# NeuralShell V2.1.8 — Maintenance Cadence

## 1. Stewardship Rhythms
After the V2.1 launch and closeout, the project enters **Long-Term Maintenance (LTM)**. Stewardship is performed on a routine cadence.

| Period | Activity | Objective |
| :--- | :--- | :--- |
| **Weekly** | Triage Scan | Review new signals for P0/P1 potential. |
| **Monthly** | Health Review | Re-verify baseline integrity and backlog drift. |
| **Quarterly** | LTS Assessment | Evaluate compatibility with evolving env baselines. |

## 2. Evidence Thresholds
- **Healthy Period**: <2 P2 incidents, 0 P0/P1 incidents, 100% hash verification.
- **Alert Period**: >1 P1 incident or >5 P2 incidents. High-priority review required.
- **Action Period**: Trigger `PATCH_PIPELINE.md` or `MAINTENANCE_RELEASE_CRITERIA.md`.

## 3. Review Accountability
The Maintainer Lead owns the Monthly Health Review and signsoff on the `ROUTINE_HEALTH_REVIEW_TEMPLATE.md`.

---
**Standard**: LTM-2.1.8-Ops
