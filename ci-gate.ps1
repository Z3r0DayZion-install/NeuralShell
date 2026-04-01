# NeuralShell CI Security Gate (PowerShell) — OMEGA ENFORCEMENT MODE

$ErrorActionPreference = "Stop"

Write-Host "--- STARTING NEURALSHELL OMEGA SECURITY GATE ---" -ForegroundColor Cyan

# 1. Install dependencies
Write-Host "[1/4] Installing dependencies..." -ForegroundColor Cyan
npm ci --ignore-scripts

# 2. Bit-for-bit Determinism
Write-Host "[2/4] Verifying Determinism..." -ForegroundColor Cyan
npm run determinism:test

# 3. OMEGA Constitutional Meta-Verification
Write-Host "[3/4] Running OMEGA meta-verifier..." -ForegroundColor Cyan
node scripts/omega_verify.js

# 4. Final Proof Export
Write-Host "[4/4] Finalizing VAR_PROOF..." -ForegroundColor Cyan
node scripts/export_var_proof.js

Write-Host "--- OMEGA SECURITY GATE PASSED ---" -ForegroundColor Green
