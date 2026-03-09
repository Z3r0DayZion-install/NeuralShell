# NeuralShell v1.1.9-OMEGA Stability Report

Generated: 2026-03-09 (America/Los_Angeles)  
Release tag: `v1.1.9-OMEGA`  
Release URL: https://github.com/Z3r0DayZion-install/NeuralShell/releases/tag/v1.1.9-OMEGA  
Release workflow run: https://github.com/Z3r0DayZion-install/NeuralShell/actions/runs/22869881699

## Scope

- Post-release canary validation across short, medium, hard, and longer-hard profiles.
- Real-machine upgrade probe from `1.1.8-OMEGA` to `1.1.9-OMEGA`.
- Installer and release asset publication verification.

## Canary Results

| Profile | File | Passed | Cycles | Uptime Threshold | Min Uptime | Max Uptime | Avg Uptime |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Short | `canary-gate.short.json` | Yes | 3 | 750 ms | 886 ms | 902 ms | 892.3 ms |
| Medium | `canary-gate.medium.json` | Yes | 8 | 750 ms | 873 ms | 893 ms | 883.1 ms |
| Hard | `canary-gate.hard.json` | Yes | 16 | 850 ms | 850 ms | 904 ms | 877.3 ms |
| Harder | `canary-gate.harder.json` | Yes | 24 | 850 ms | 854 ms | 895 ms | 874.5 ms |

Artifacts:

- `release/postrelease/v1.1.9-OMEGA/canary-gate.short.json`
- `release/postrelease/v1.1.9-OMEGA/canary-gate.medium.json`
- `release/postrelease/v1.1.9-OMEGA/canary-gate.hard.json`
- `release/postrelease/v1.1.9-OMEGA/canary-gate.harder.json`

## Real-Machine Upgrade Probe

Report file: `release/postrelease/v1.1.9-OMEGA/realpath-upgrade-validation.json`

- Mode: `forced-installdir-silent-upgrade-probe`
- Source installer: `NeuralShell.Setup.1.1.8-OMEGA.exe`
- Target installer: `NeuralShell.Setup.1.1.9-OMEGA.exe`
- Old installer exit: `0`
- New installer exit: `0`
- Old smoke exit: `0` (uptime: `883 ms`)
- New smoke exit: `0` (uptime: `881 ms`)
- Findings: none
- Verdict: pass

## Final Verdict

`v1.1.9-OMEGA` meets release stability criteria from automated post-release evidence in this repository and is approved as a stable line.
