#!/bin/bash
set -e

echo "--- PHASE 9: SUPPLY CHAIN LOCKDOWN ---"
npm ci --ignore-scripts
npm audit --omit=dev --audit-level=high

echo "--- PHASE 10: AST SECURITY GATES ---"
node tools/security/ast_gate.js --self-test
node tools/security/ast_gate.js

echo "--- SECURITY UNIT TESTS ---"
npm test tests/renderer_zero_network.test.js
npm test tests/kernel_safeFetch_pinning.test.js
npm test tests/boot_integrity_root.test.js
npm test tests/ast_gate_enforcement.test.js

echo "--- PROOF GENERATION ---"
node scripts/export_var_proof.js

echo "✅ RELEASE READY: v4.1 PROOF GENERATED"
