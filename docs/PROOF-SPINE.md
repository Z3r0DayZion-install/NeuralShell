# NeuralShell Proof Spine (Deterministic Verification Contract)

This document defines the **Proof Spine**: a deterministic, fail-closed verification gate for NeuralShell.

## One Command

Run:

`npm run verify:all`

This must:

- **Fail closed** on any error, non-zero exit code, or timing budget breach.
- Produce machine-auditable artifacts under `state/proofs/` for the run.
- Produce a portable proof bundle under `state/proof_bundles/` for the run.

## Concurrency Lock

`verify:all` is single-flight:

- The runner acquires `.locks/verify_runner.lock`.
- If the lock exists and the owning PID is still alive, the spine fails closed.
- If the lock exists but the PID is dead, the runner removes the stale lock and continues.

## Phases

`verify:all` runs phases in order:

1) `proof:all` (node + TEAR + EXE parity proof chain)
2) `test:root` (root server unit/integration tests)

### Timing Budgets

Budgets are enforced by the runner:

- `proof_all`: 150000ms
- `test_root`: 60000ms

If a phase exceeds its budget, the runner force-kills the process tree and fails the spine.

## Required Artifacts (per phase)

For each phase, `verify:all` creates:

`state/proofs/<RUN_TS>-<PHASE_SLUG>/`

The directory must include, at minimum:

- `runner_config.json`
- `runner_metadata.json` (contains `durationMs`, `budgetMs`, and `exitCode`)
- `runner_stdout.log`
- `runner_stderr.log`
- `stdout.log`
- `stderr.log`
- `config.json`
- `metrics.txt`
- `metadata.json`
- `sha256.txt`

## Spine Marker

On PASS, `verify:all` writes a deterministic marker:

- `state/proofs/<RUN_TS>-spine.marker`

This is a fast “CI green” indicator and should only exist for fully PASS runs.

## Proof Bundle

On PASS, `verify:all` produces a portable bundle:

`state/proof_bundles/<RUN_TS>/`

Files:

- `bundle.manifest.json` (file list + sha256)
- `bundle.sha256.txt` (manifest hash + file hashes)
- `proof-bundle-<RUN_TS>.tar.gz`
- `proof-bundle-<RUN_TS>.tar.gz.sha256`

The tarball is written deterministically (stable ordering, fixed mtimes).

## Proof-Only Endpoints

The production server exposes proof-only endpoints **only** in proof mode:

- Enabled when `PROOF_MODE=1` or `NODE_ENV=test`
- Requests must be loopback-only (remote address is checked)
- Requests must include `x-neuralshell-proof-token` matching `NS_PROOF_TOKEN`

This prevents accidental exposure and ensures proofs are self-contained.
