# Phase 10: Reproducible Build Parity & Release Repeatability Proof

## Overview
This document proves the reproducibility of the NeuralShell release artifact set. The primary goal was to determine if repeated clean builds from the same source baseline produce identical output or honestly characterize any remaining nondeterminism.

## Source Baseline
- **Version:** 2.1.29
- **Git Commit:** `e24c9b7437ddd76e3b6be569a04dda3e0386d6bf`
- **Build Command:** `node scripts/sign-and-verify-omegapak.js`

## Reproducibility Harness
- **Tool:** `scripts/rebuild-compare-omegapak.js`
- **Method:** Two clean builds were performed in isolated directories (`.repro-builds/build-1` and `.repro-builds/build-2`). All release artifacts were captured and compared using SHA-256 hashes.

## Results Summary
- **Overall Status:** **REPRODUCIBLE-WITH-NORMALIZATION**
- **Installer Parity:** **BIT-FOR-BIT MATCH**
- **Drift Classification:** **BOUNDED_TIMESTAMP_DRIFT**

### Artifact Comparison Table

| Artifact | Reproducibility | Hash Match | Drift Source |
|---|---|---|---|
| **NeuralShell Setup 2.1.29.exe** | **Bit-for-bit** | **YES** | None |
| SBOM (`latest.json`) | Normalized | NO | `generatedAt` timestamp |
| Manifest (`manifest.json`) | Normalized | NO | `timestamp` field |
| Provenance (`provenance.json`) | **Bit-for-bit** | **YES** | None |
| Attestation (`attestation.json`) | **Bit-for-bit** | **YES** | None |
| Signature (`manifest.sig`) | Expected Drift | NO | Cryptographic response to Manifest drift |
| Autonomy Benchmark | Normalized | NO | `timestamp` field |
| Checksums Metadata | Normalized | NO | `generatedAt` timestamp |
| Checksums Flat | Expected Drift | NO | Response to Manifest/Signature drift |

## Bounded Drift Analysis
The drift detected is strictly bounded to metadata fields (timestamps, generation dates) and their cryptographic consequences (signatures, checksums of drifting files). 

1. **Installer Stability:** The distributed executable (`.exe`) is 100% deterministic. This ensures that the user receives exactly what was verified at the source.
2. **Trust Artifact Stability:** After stripping timestamp fields, the JSON trust artifacts (SBOM, Manifest, Benchmark) match bit-for-bit.
3. **Verification Integrity:** Despite the timestamp drift, the independent verifier (`release/verify/veritas.js`) passes successfully on both builds, proving that the trust chain remains valid and unbroken.

## Conclusion
NeuralShell achieves **Reproducible Build Parity** for its primary release artifact (the installer) and **Reproducibility with Normalization** for its trust artifact set. All nondeterminism is characterized as bounded timestamp drift.

---
**Verification Date:** 2026-03-23
**Verified By:** NeuralShell Reproducibility Harness
