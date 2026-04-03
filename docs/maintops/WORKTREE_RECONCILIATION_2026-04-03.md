# Worktree Reconciliation - 2026-04-03

## Objective
Normalize all active local worktrees to the same `origin/master` baseline while preserving every divergent local history for forensic recovery.

## Baseline
- Canonical commit: `3552587d25268fac6fcd2e62b9c7b2bac633b6ca`
- Canonical date: 2026-04-03

## Actions Executed

### 1. Remote Hygiene (Merged/Stale Only)
- Deleted merged remote branch:
  - `origin/devin/1772585778-security-fixes`
- Open PR heads were excluded from deletion (`launch-surface-and-channel-automation`, PR #40).

### 2. Diverged History Preservation (Durable)
The following archive branches were pushed to `origin`:
- `archive/proof-master-diverged-20260403` -> `bd7d0e3b897f0db43493e2c9e81a63d1863ef94e`
- `archive/storefront-sync-final-diverged-20260403` -> `e9ebfd31d6ccc5d84906e31887a944bed284ab20`
- `archive/storefront-refined-live-diverged-20260403` -> `4a1562599941907255e748dcc9e34ac29658d06e`
- `archive/v219-maintops-diverged-20260403` -> `67bacc24b1a8b3b1468e248e2a780561deb27795`

### 3. Worktree Convergence to Baseline
| Worktree Path | Active Branch (After) | Head (After) | Status |
|---|---|---|---|
| `C:/Users/KickA/Documents/GitHub/NeuralShell` | `synced/master-2026-04-03` | `3552587...` | clean |
| `C:/Users/KickA/Documents/GitHub/NeuralShell-storefront-sync` | `synced/storefront-sync-2026-04-03` | `3552587...` | clean |
| `C:/Users/KickA/Documents/GitHub/NeuralShell_deploy_master` | `synced/deploy-master-2026-04-03` | `3552587...` | clean |
| `C:/Users/KickA/Documents/GitHub/NeuralShell_release_master_proof` | `master` | `3552587...` | clean |
| `C:/Users/KickA/Documents/GitHub/NeuralShell_v219_maintops` | `synced/v219-maintops-2026-04-03` | `3552587...` | clean |

### 4. Proof Artifact Preservation
- Moved unmanaged screenshot out of repository worktree noise:
  - `C:/Users/KickA/Documents/GitHub/NeuralShell_proof_artifacts/docs-index-proof-console-master-2026-03-30-full.png`

### 5. Baseline Proof Run
Command executed on baseline commit:

```powershell
npm run verify:ship
```

Result:
- Exit code: `0`
- Release status timestamp: `2026-04-03T22:13:28.553Z`
- Provenance commit in `release/status.json`: `3552587d25268fac6fcd2e62b9c7b2bac633b6ca`
- Key strict gates passed: packaged smoke, installer smoke, native trust, canary gate, diagnose packaged, signature verify, freshness strict, KPI gate, SLO gate, perf gate.

Note:
- Coverage threshold diagnostics continue to print a known `BYPASSED` message path after threshold failure output; release flow completed successfully and still returned exit `0`.

## Residual Remote Branches Intentionally Not Pruned
- `origin/launch-surface-and-channel-automation` (open PR #40 head).
- Unmerged non-default heads (no merged/stale criteria met): `origin/codex/storefront-refined-live-20260330`, `origin/main`, `origin/chore/checksums-installer-smoke`, `origin/docs/phase29-seal-corrections`, `origin/feature/hardening-delta6+`, `origin/post-rc-next-work`, `origin/release/allout-launch-v3-master`.
