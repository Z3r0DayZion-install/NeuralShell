# Patch Prep Checklist (V2.1.10 / Patch 1)

## 1. Readiness
- [x] Patch candidate justified (PW001).
- [ ] Worktree synchronized with latest steward baseline.
- [ ] No unrelated pending changes in the worktree.

## 2. Execution Steps
- [ ] Clean untracked residues from `docs/` and `release/` (or add to `.gitignore`).
- [ ] Verify `omega_root.pub.pem` and `verify-source-integrity.js` match the intended V2.1.10 baseline.
- [ ] Execute `node scripts/generate-source-manifest.js` to refresh `governance/source_manifest.json`.
- [ ] Commit only the re-baselined manifest and maintenance documentation.

## 3. Signoff Gates
- [ ] `npm run verify:ship` returns Green.
- [ ] `npm run security:pass:local` returns Green.
- [ ] All `v2.1.4` smoke tests pass against patched source.
