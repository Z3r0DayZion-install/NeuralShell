# NEXT_CYCLE_PLAN.md

**Current protected RC:**
- `neuralshell-v1.2.1-async-gating`

**Active branch:**
- `post-rc-next-work`

## Next 3 Tasks
1. **UX Confusion Audit & Consolidation**: Consolidate the redundant Hero section and Global Bar. Remove repetitive status strips (Hero vs. Global vs. Chat Task Strip).
2. **Terminology & Label Refactor**: Simplify jargon ("Posture", "Readiness Lanes") and clean up workbench/inspector labels for better first-use clarity.
3. **Empty State & First-Use Flow**: Improve the "No workspace attached" and "Offline Mode" visual feedback to be less text-dense and more action-oriented.

## Do Not Touch
- **RC Tag**: `neuralshell-v1.2.1-async-gating` must remain a protected checkpoint.
- **Async Gating Architecture**: Do not modify the core gating logic unless a regression is found.
- **Release Proof Flow**: Keep the verification and checksum scripts intact.
