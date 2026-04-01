# NeuralShell V2.1.8 — Compatibility Boundaries

## 1. Technical Baseline
The V2.1 project line assumes the following fixed environmental boundaries:
- **OS**: Windows 10/11 (Current Major Build).
- **Runtime**: Node.js V16+ (Active LTS).
- **Engine**: Chromium V100+ (for UI rendering).

## 2. API & Contractual Stability
Internal OMEGA contracts and Signal Bus protocols are **frozen** for the duration of the V2.1.x maintenance lifecycle. No breaking changes to core engines are permitted in maintenance releases.

## 3. Boundary Drift
If an environment update (e.g., OS Patch) breaks a core V2.1 assumption, the issue is escalated to the **MRB** to decide between a Maintenance Patch or declaring the environment "Out of Scope".

---
**Standard**: Boundaries-V2.1-Final
