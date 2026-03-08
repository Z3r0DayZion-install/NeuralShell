$ErrorActionPreference = "Stop"

Write-Host "[1] Verify ZIP hash"
Get-FileHash ".\NeuralShell_IP_Gold_Master_v1.0.0-OMEGA_FINAL.zip" -Algorithm SHA256

Write-Host "[2] Verify detached proof bundle"
# Example:
# node .\tools\verify_external_proof.js .\artifacts\var_proof\latest

Write-Host "[3] Compare against published trust anchors"
Write-Host "ROOT: 75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9"
Write-Host " GOV : 76bb525ffe1cd289ee2d078f96a01c2e1251543187fc9c0a7b84e7865f07e545"
