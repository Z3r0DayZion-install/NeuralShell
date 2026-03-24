# NeuralShell V2.0: GA Promotion Gates

This document defines the strict, minimal criteria required to promote the **V2.0.0-RC-FINAL** (Stage 515) baseline to **General Availability (GA)**. 

NeuralShell employs a fail-closed Sovereign Release model. All criteria below must be mathematically and operationally verified before a GA tag can be applied.

## 1. Verified Achievements (RC Final Baseline)
The following prerequisites have already been satisfied and locked within the RC Final repository surface:
- [x] **Sovereign Audit Passes**: Execute `node scripts/sovereign-audit.js` without errors. All 15 development phases (integrity, contract schemas, parallel E2E, visual regression) are verified green.
- [x] **Release Ledger Complete**: The `docs/OMEGA_RELEASE_LEDGER.md` accurately reflects the cryptographic lineage of the V2.1.29 build.
- [x] **Reproducibility Status Recorded**: Build reproducibility is formally classified (e.g., `REPRODUCIBLE-WITH-NORMALIZATION`).
- [x] **Independent Verification Passes**: The `release-verify.js` and `scripts/sovereign-audit.js` traces succeed from clean environments.
- [x] **Archival Bundle Generated**: The `release/final/` external bundle contains the normative surface cleanly separated from development history.

## 2. Blockers Preventing Immediate GA Promotion
The repository currently classifies itself as **`RC_FINAL_ARCHIVED_READY`**. It is **NOT** `GA_PROMOTION_READY` due to the following explicitly tracked blockers:

### Blocker A: Production Windows Code Signing Certificate (EV)
The current installer (`dist/NeuralShell Setup 2.1.29.exe`) lacks a production Microsoft Authenticode signature. While the internal SLSA provenance and SHA-256 tamper-proof seals are valid, Windows SmartScreen will flag the executable. 
- **Requirement**: A valid Extended Validation (EV) Code Signing Certificate must be provisioned and integrated into the `electron-builder` pipeline.

### Blocker B: Third-Party External Audit (Recommended)
While the `SOVEREIGN_AUDIT_LOG.txt` proves internal technical compliance across the 15-phase lifecycle, the `agencyPolicy.json` dictates an external review of the OMEGA persistence layer prior to public GA.

## 3. GA Promotion Procedure
Once all blockers are resolved:
1. Update `package.json` to version `2.2.0-GA`.
2. Generate a new signed release via GitHub actions (triggering the real EV certificate pipeline).
3. Validate the signed artifact using `signtool verify /pa /v <installer.exe>`.
4. Run the final `npm run release:verify:signature`.
5. Apply the git tag `v2.2.0-GA`.
