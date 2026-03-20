# NeuralShell V2.1.8 — Patch Branch Cutover Rules

## 1. Branch Strategy
- **Base Version**: `v2.1.4-gm` (Tag).
- **Patch Branch**: `maint/v2.1-hf-xxxx`.
- **Merge Target**: The maintenance branch remains isolated until a formal maintenance release is cut.

## 2. Permissible Changes
- **Targeted Fixes**: Only code directly resolving the P0/P1 candidate issue.
- **No Refactoring**: Descriptive refactoring or unrelated cleanup is strictly prohibited.
- **Doc Updates**: Only `CHANGELOG.md` and related lifecycle docs.

## 3. Conflict Resolution
In the event of a conflict with the Golden Master baseline, the Golden Master **always** takes precedence unless the patch intent is to specifically correct an identified error in that baseline.

---
**Authority**: Engineering Lead
