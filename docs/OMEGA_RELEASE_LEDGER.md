# OMEGA RELEASE LEDGER
**System:** NeuralShell 
**Trust Anchor (SHA-256):** `75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9`

This ledger provides a chronological cryptographic lineage of all constitutional releases. It serves as public evidence that the system's execution state corresponds directly to the verified source code via deterministic bit-for-bit hashes.

---

### Release: v1.0.0-OMEGA
**Date:** 2026-03-03
**Status:** Constitutional Baseline established.
**Git Commit Hash:** `2ef3fed9bcbfcbb5a439635f58ea622c2d16eff1`
**Git Tag:** `v1.0.0-OMEGA`

#### Attestations
- **BUILD_HASH:** `30ae09287914294d2ee067ebc8a10a59b3546b9df23249aa44fe68bda3d39eb2`
- **SBOM_HASH:** `e3eaeb88b9eeda549b8731d88016be4116c310d3f39838ccc154bc25ffb0465a`

#### Enforcement Results
- `omegaSecuritySuite`: **PASS**
- `runtimeProof`: **PASS**
- `metricsProof`: **PASS**
- `astGate`: **PASS**

---

### Release: v2.1.29
**Date:** 2026-03-22
**Status:** Verification complete.
**Git Commit Hash:** `e24c9b7437ddd76e3b6be569a04dda3e0386d6bf`
**Git Tag:** `v2.1.29`

#### Attestations
- **BUILD_ARTIFACT:** `NeuralShell Setup 2.1.29.exe`
- **BUILD_HASH:** `9fe7c5cd05b7154f7a41580818ba50a5f37b3a64637ae38d82e6a57a873fb756`
- **SBOM_ARTIFACT:** `latest.json`
- **SBOM_HASH:** `9e73d5a7807af87782808039ceb68f4a188837b84704b781e6d0ed828641e45d`
- **CI_WORKFLOW:** `provenance.yml`
- **CI_IDENTITY:** `https://github.com/KickA/NeuralShell/.github/workflows/provenance.yml@refs/heads/master`
- **ATTESTATION_TYPE:** `SLSA v1.0 (Predicate: https://slsa.dev/provenance/v1)`
- **SIGNATURE_ARTIFACT:** `manifest.sig`
- **PROVENANCE_ARTIFACT:** `provenance.json`
- **PROVENANCE_POLICY:** **Fail-Closed (Mandatory)**
- **SECURITY_SCORECARD:** **Active (OpenSSF)**
- **DEPENDENCY_GATE:** **Enforced (npm audit)**
- **WINDOWS_SIGNATURE:** **Absent (Blocked by Certificate Material)**
- **TIMESTAMP_STATUS:** **Absent**
- **CI_VERIFICATION:** **SUCCESS**
- **INDEPENDENT_VERIFICATION:** `node release/verify/veritas.js .`
- **WINDOWS_VERIFICATION_PREREQUISITE:** **Supply WIN_CERT_BASE64 or Store Thumbprint**
- **WINDOWS_VERIFICATION_COMMAND:** `signtool verify /pa /v "NeuralShell Setup 2.1.29.exe"`
- **WINDOWS_VERIFICATION_RESULT:** **FAIL**
- **TAMPER_PROOF:** **Verified (Artifact, SBOM, Signature, Provenance)**
- **VERIFICATION_COMMAND:** `npm run release:verify:signature`
- **VERIFICATION_RESULT:** **PASS**
- **REPRO_BUILD_STATUS:** **REPRODUCIBLE-WITH-NORMALIZATION**
- **REPRO_SCOPE:** **NeuralShell Release Artifact Set (Full)**
- **REPRO_VERIFICATION_COMMAND:** `node scripts/rebuild-compare-omegapak.js`
- **DRIFT_CLASSIFICATION:** **BOUNDED_TIMESTAMP_DRIFT**
- **TIMESTAMP:** `2026-03-23T00:28:27.605Z`
#### Enforcement Results
- `npm run lint`: **PASS**
- `npm test`: **PASS**
- `npm run test:e2e`: **PASS**

---
*End of Ledger.*
