#!/bin/bash
# NeuralShell CI Security Gate — OMEGA ENFORCEMENT MODE

set -e

echo "--- STARTING NEURALSHELL OMEGA SECURITY GATE ---"

# 1. Install dependencies (ignoring scripts for safety)
echo "[1/5] Installing dependencies..."
npm ci --ignore-scripts

# 2. Run AST Gate
echo "[2/5] Running AST Security Gate..."
node tools/security/ast_gate.js

# 3. Run Omega Security Tests
echo "[3/5] Running Omega Security Suite..."
node tests/omega_security.test.js

# 4. Run Legacy Unit Tests
echo "[4/5] Running Project Unit Tests..."
npm test

# 5. Export Proof Bundle
echo "[5/5] Exporting VAR_PROOF bundle..."
node scripts/export_var_proof.js

echo "--- OMEGA SECURITY GATE PASSED ---"
