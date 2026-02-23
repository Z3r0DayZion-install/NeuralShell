$ErrorActionPreference = "Stop"

Write-Host "--- PHASE 9: SUPPLY CHAIN LOCKDOWN ---" -ForegroundColor Cyan
npm ci --ignore-scripts
npm audit --omit=dev --audit-level=high

Write-Host "--- PHASE 10: AST SECURITY GATES ---" -ForegroundColor Cyan
node tools/security/ast_gate.js --self-test
node tools/security/ast_gate.js

Write-Host "--- SECURITY UNIT TESTS ---" -ForegroundColor Cyan
npm test tests/renderer_zero_network.test.js
npm test tests/kernel_safeFetch_pinning.test.js
npm test tests/boot_integrity_root.test.js
npm test tests/ast_gate_enforcement.test.js

Write-Host "--- PROOF GENERATION ---" -ForegroundColor Cyan
node scripts/export_var_proof.js

Write-Host "✅ RELEASE READY: v4.1 PROOF GENERATED" -ForegroundColor Green
