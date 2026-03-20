# NeuralShell V2.1.8 — Backlog Governance

## 1. Intake & Triage
Signals from the support queue or stewardship reviews enter the **Maintenance Backlog** via the `ISSUE_REVIEW_BOARD.md`.

## 2. Classification Logic
| Class | Action | Persistence |
| :--- | :--- | :--- |
| **Doc-Only** | Update `docs/` only. | Discard once merged. |
| **Env-Variance** | Note in `ENVIRONMENT_VARIANCE_NOTES.md`. | Persistent. |
| **Deferred** | Register in `BACKLOG_GOVERNANCE.md`. | Periodic Review. |
| **Candidate** | Graduate to `PATCH_PIPELINE.md`. | Active Pipeline. |

## 3. Priority Model
- **Blockers**: Prevents boot, destroys data, fails OMEGA. (Immediate action).
- **Regressions**: Feature used to work, now fails. (Next maintenance release).
- **Hardening**: Improvement to existing resilient logic. (Deferred).

## 4. Work Item Lifecycle
All work items must follow the `WORK_ITEM_TEMPLATE.md` (if used) or be tracked in the `ISSUE_REVIEW_BOARD.md` with explicit technical evidence.

---
**Authority**: Maintainer Lead
