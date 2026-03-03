# NeuralShell CI Security Gate (PowerShell) — OMEGA ENFORCEMENT MODE

$ErrorActionPreference = "Stop"

Write-Host "--- STARTING NEURALSHELL OMEGA SECURITY GATE ---" -ForegroundColor Cyan

# 1. Install dependencies
Write-Host "[1/6] Installing dependencies..."
npm ci --ignore-scripts

# 2. Run AST Gate
Write-Host "[2/6] Running AST Security Gate..."
node tools/security/ast_gate.js

# 3. Run Omega Security Tests
Write-Host "[3/6] Running Omega Security Suite..."
node tests/omega_security.test.js

# 4. Run Runtime Proof
Write-Host "[4/6] Running Runtime Proof (Server & Metrics)..."
node scripts/runtime_proof.cjs

# 5. Run Legacy Unit Tests
Write-Host "[5/6] Running Project Unit Tests..."
npm test

# 6. Export Proof Bundle
Write-Host "[6/6] Exporting Signed VAR_PROOF bundle..."
node scripts/export_var_proof.js

Write-Host "--- OMEGA SECURITY GATE PASSED ---" -ForegroundColor Green
