# NeuralShell Proof Authority Update (Authoritative Gate)

## Where the proof update text is
- Repo: `C:\Users\KickA\NeuralShell\proof\PROOF_UPDATE.md`
- Desktop copy target: `C:\Users\KickA\Desktop\NeuralShell_PROOF_UPDATE.md`

## Authoritative proof gate (cannot lie)
- Gate command: `npm run proof:all`
- Implementation: `scripts/proof_all.cjs`
- What it runs (in-order): `npm run proof:spawn` -> `npm run proof:runtime` -> `npm run proof:tear` -> `npm run proof:exe` (no `shell:true`)
- Hard gate: proof fails if `scripts/runtime_proof.cjs` did not execute cold-start purge (`coldStart.purged !== true`)

## Tests are proof-gated
- `npm test` now runs proof first:
  - `package.json` -> `scripts.test = "npm run proof:all && npm run test:root"`

## Tamper-evident manifests (SHA256)
- Latest pointers:
  - `proof/latest/proof-manifest.json`
  - `proof/latest/run-pointer.json`
- Run bundles:
  - `proof/runs/<timestamp>/proof-manifest.json`
  - `proof/runs/<timestamp>/summary.json`
- Behavior:
  - Manifest verification happens before running proofs.
  - Any mismatch hard-fails with: `[proof] artifact hash mismatch detected`

## Proof artifacts (forensics)
- Phase outputs (raw):
  - `state/proofs/<timestamp>-spawn/`
  - `state/proofs/<timestamp>-runtime/`
- Orchestrator bundles these into:
  - `proof/runs/<timestamp>/spawn/`
  - `proof/runs/<timestamp>/runtime/`

## Deterministic forced failures (for proving the gate works)
- Force the proof gate to fail immediately (no side effects):
  - `set PROOF_FORCE_FAIL=1`
  - `npm run proof:all`
- Force corrupted `/metrics` payload (proof-only, localhost-only):
  - `set PROOF_FORCE_METRICS_FAIL=1`
  - `npm run proof:runtime`
  - Server-side handler is gated in `production-server.js`:
    - enabled only when `(NODE_ENV==='test' || PROOF_MODE==='1')` and request is from loopback.
- Force TEAR proof failure (artifact-backed, deterministic):
  - `set PROOF_FORCE_TEAR_FAIL=1`
  - `npm run proof:all`
- Force EXE proof failure (artifact-backed, deterministic):
  - `set PROOF_FORCE_EXE_FAIL=1`
  - `npm run proof:all`

## Anti-fake runtime behavior checks
- `scripts/runtime_proof.cjs` asserts *real mutation*:
  - fetch `/metrics` (baseline)
  - perform 3 real HTTP requests (health path)
  - fetch `/metrics` again
  - hard-fails if `neuralshell_requests_total` and `neuralshell_uptime_seconds` don’t increase:
    - `[runtime-proof] metrics did not mutate as expected`
 - Cold-start is mandatory (no spine exception):
   - Purges `state/*` (excluding `state/proofs/**`) and `NeuralShell_Desktop/.tear_runtime`
   - Summary prints: `coldStart: purged=true ...`

## CI hard gate
- Main proof gate workflow:
  - `.github/workflows/proof-gate.yml`
  - Matrix: Windows/Ubuntu × Node 20/22
  - Windows runs: `npm run verify:all`
  - Ubuntu runs `npm run test:root` (does not call `npm test`, because `npm test` is proof-gated and includes Windows EXE)
  - On failure uploads: `state/proofs/**`
