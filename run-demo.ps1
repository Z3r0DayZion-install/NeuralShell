$env:DRY_RUN="1"
$env:PORT="3000"

Write-Host "=== Running Autonomy Demo ===" -ForegroundColor Cyan

$output = node scripts/demo-autonomy.mjs 2>&1 | Out-String
$exitCode = $LASTEXITCODE

Write-Host $output
Write-Host "`nExit Code: $exitCode" -ForegroundColor $(if ($exitCode -eq 0) { "Green" } else { "Red" })

exit $exitCode
