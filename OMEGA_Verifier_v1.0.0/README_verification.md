# OMEGA Independent Verification Tool
**Version:** 1.0.0
**Target System:** NeuralShell (OMEGA Enforcement Mode)

## Purpose
This tool allows you to mathematically verify the cryptographic sovereignty and deterministic integrity of any NeuralShell build, without trusting the developers, the CI environment, or the internal `@neural/omega-core` enforcement engine.

## Prerequisites
- Node.js (v20.x or higher)
- A NeuralShell `VAR_PROOF` bundle (typically downloaded alongside a release or from the `artifacts/var_proof/latest` directory)

## Quick Start (Verifying the Bundle Only)
To cryptographically prove that the bundle was generated and signed by the immutable OMEGA Root Trust Anchor:

```bash
node verify_external_proof.js <path_to_proof_bundle>
```
*Example:* `node verify_external_proof.js ./var_proof/2026-03-02T12-00-00`

## Full Deterministic Verification (Source Code + Bundle)
To prove that the physical source code on your machine matches the cryptographically signed `BUILD_HASH` byte-for-byte:

```bash
node verify_external_proof.js <path_to_proof_bundle> <path_to_source_code_directory>
```
*Example:* `node verify_external_proof.js ./var_proof/latest ./NeuralShell`

## Trust Assumption
This tool relies on a single hardcoded Trust Anchor: the `EXPECTED_PUBKEY_HASH`. 
You must independently verify that the hash contained within `expected_root_fingerprint.txt` matches the publicly published fingerprint declared by the Neural Empire. If it matches, the cryptography proves the rest.
