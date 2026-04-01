# VNEXT BRANCHING & NAMING PLAN

## 1. Branching Strategy
- **Recommended Branch Name**: `vnext-main` (branched from the archived baseline).
- **Workflow**: 
  1. `git checkout neuralshell-phases2-5-goldmaster`
  2. `git checkout -b vnext-main`
- **Preservation Rule**: The `neuralshell-phases2-5-goldmaster` tag and its associated artifacts must remain untouched and read-only.

## 2. Naming Schemes
- **Next Tag Scheme**: `v2.0.0-rc[N]` for release candidates; `v2.0.0-OMEGA` for final masters.
- **Next Artifact Scheme**: `NeuralShell_V2_Package_v[version].zip`

## 3. Maintenance Rule
Commit history on the `vnext-main` branch will start from the `neuralshell-phases2-5-goldmaster` commit. Any hotfixes for the previous version line (if strictly required) must be performed on a dedicated legacy branch and will not touch the archived gold master ZIP.
