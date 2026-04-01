# OPEN ITEMS AND RISKS - NeuralShell

## 1. Technical Debt & Open Items
- **Pre-Push Gate Hygiene**: The `prepush-gate.js` script currently blocks pushes when untracked release folders exist. This requires a dedicated "Skip Release Folders" flag or `.gitignore` refinement.
- **LLM Recovery Strings**: While localized, the recovery strings are still hardcoded in `renderer.js`. Move to a centralized configuration file.

## 2. Release Lessons Learned
- **Draft Release Integrity**: Interrupted or timed-out `gh release create` calls can result in "untagged" draft slugs. Always verify asset count and tag association via `gh release view` immediately after upload.
- **Checksum Synchronization**: Regenerating checksums after every minor doc surgical fix is a manual risk point; a release-mode utility script should automate the Zip -> Hash -> Manifest chain.

## 3. Risks to Avoid
- **Workspace Noise**: Temporary release folders created in the root can pollute the repository. Use a dedicated `dist/` directory that is Git-ignored by default.
- **Silent Rebuilds**: Rebuilding the evidence ZIP without a formal verification step risks introducing inconsistency between the local repository and the final shippable artifact.

## 4. Repo Hygiene Targets
- [ ] Add `NeuralShell_Phases2-5_GoldMaster_Release/` to `.gitignore`.
- [ ] Add `NeuralShell_Distribution_Ready/` to `.gitignore`.
- [ ] Implement a `scripts/release-verify.js` for automated checksum and tag validation.
