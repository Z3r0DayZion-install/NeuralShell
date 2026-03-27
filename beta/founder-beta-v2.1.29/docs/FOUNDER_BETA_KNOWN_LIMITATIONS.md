# NeuralShell Founder Beta Known Limitations

## Scope Limits

- This package is validated for Windows packaged execution (`dist/win-unpacked` + NSIS installer path).
- The beta focuses on the proof flow, not full production hardening of every surface.

## Product Limits In This Beta

- Model/provider behavior depends on local environment and provider setup.
- Some advanced integrations and edge workflows are still evolving.
- UI copy and hierarchy are optimized for proof flow first, not full onboarding depth.
- Error messaging is improving but can still be terse in some failure paths.

## Operational Limits

- SmartScreen or local policy prompts may appear depending on machine trust policy.
- Session unlock depends on passphrase ownership; no passphrase recovery is provided.
- Performance can vary by hardware and local model/runtime footprint.

## Evidence Limits

- Proof screenshots/reports reflect this build and test machine conditions.
- Packaged parity is verified for the defined proof checks (`proof`, `roi`, `lockFlow`), not every command variant.

## What This Beta Is Not

- Not a claim of full GA readiness.
- Not a blanket guarantee across all providers, networks, and enterprise controls.
