# OPEN ITEMS AND RISKS - NeuralShell

## 1. Technical Debt & Open Items
- **Pre-Push Gate Hygiene**: `.gitignore` and local drift controls exist, but strict release gating still blocks on large untracked residue sets in active workspaces.
- **LLM Recovery Strings**: While localized, the recovery strings are still hardcoded in `renderer.js`. Move to a centralized configuration file.

## 2. Release Lessons Learned
- **Draft Release Integrity**: Interrupted or timed-out `gh release create` calls can result in "untagged" draft slugs. Always verify asset count and tag association via `gh release view` immediately after upload.
- **Checksum Synchronization**: Regenerating checksums after every minor doc surgical fix is a manual risk point; a release-mode utility script should automate the Zip -> Hash -> Manifest chain.

## 3. Risks to Avoid
- **Workspace Noise**: Temporary release folders created in the root can pollute the repository. Use a dedicated `dist/` directory that is Git-ignored by default.
- **Silent Rebuilds**: Rebuilding the evidence ZIP without a formal verification step risks introducing inconsistency between the local repository and the final shippable artifact.

## 4. Repo Hygiene Targets
- [x] Add `NeuralShell_Phases2-5_GoldMaster_Release/` to `.gitignore`.
- [x] Add `NeuralShell_Distribution_Ready/` to `.gitignore`.
- [x] Implement a `scripts/release-verify.js` for automated checksum and tag validation.

Verified on 2026-04-03 against `.gitignore` and `scripts/release-verify.js`.

## 5. Remaining Finish Actions
- [ ] Classify untracked workspace residue into commit/archive/ignore buckets so `release:worktree:strict` can pass without manual intervention.
- [ ] Move LLM recovery strings out of renderer hardcoding into a centralized runtime config surface.
