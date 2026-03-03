# VALIDATION COMMANDS

Run the following commands on a clean environment to cryptographically verify the integrity and security posture of NeuralShell.

## 1. Windows Validation
Open PowerShell as Administrator:
```powershell
# 1. Install dependencies securely
npm ci --ignore-scripts

# 2. Run the deterministic AST security scanner
node tools/security/ast_gate.js

# 3. Execute the OMEGA security assertions
node tests/omega_security.test.js

# 4. Run the runtime proof to verify live server constraints
node scripts/runtime_proof.cjs

# 5. Generate and sign the final Proof of Work bundle
node scripts/export_var_proof.js
```

## 2. Linux Validation
Open Bash terminal:
```bash
# 1. Install dependencies securely
npm ci --ignore-scripts

# 2. Run the deterministic AST security scanner
node tools/security/ast_gate.js

# 3. Execute the OMEGA security assertions
node tests/omega_security.test.js

# 4. Run the runtime proof
node scripts/runtime_proof.cjs

# 5. Export Proof of Work bundle
node scripts/export_var_proof.js
```

## Verification Output
Upon successful completion, navigate to `artifacts/var_proof/latest`.
Verify `ed25519.sig` against `ed25519.pub` to confirm no tampering occurred.
