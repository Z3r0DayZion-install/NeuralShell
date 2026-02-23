# Hardness Test Script - Proof of Execution Validation
# PowerShell version for Windows compatibility
# Exit 0 only if ALL phases pass

$ErrorActionPreference = "Continue"
$PASS_COUNT = 0
$FAIL_COUNT = 0
$PRODUCTION_READY = "NO"

Write-Host "=========================================="
Write-Host "HARDNESS TEST - PROOF OF EXECUTION"
Write-Host "=========================================="
Write-Host ""

# Phase 1: Full Test Suite
Write-Host "=========================================="
Write-Host "PHASE 1: FULL TEST SUITE"
Write-Host "=========================================="
Write-Host "Command: npm test"
Write-Host ""
try {
    npm test
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PHASE 1: PASS"
        $PASS_COUNT++
    } else {
        Write-Host "PHASE 1: FAIL"
        $FAIL_COUNT++
    }
} catch {
    Write-Host "PHASE 1: FAIL - Exception: $_"
    $FAIL_COUNT++
}
Write-Host ""

# Phase 2: Kill Switch Verification
Write-Host "=========================================="
Write-Host "PHASE 2: KILL SWITCH VERIFICATION"
Write-Host "=========================================="
Write-Host "Command: AUTONOMY_KILL_SWITCH=1 node production-server.js (5 second timeout)"
Write-Host ""
$job = Start-Job -ScriptBlock { 
    $env:AUTONOMY_KILL_SWITCH = "1"
    Set-Location $using:PWD
    node production-server.js 2>&1 
}
Start-Sleep -Seconds 5
Stop-Job -Job $job
$KILL_SWITCH_OUTPUT = Receive-Job -Job $job
Remove-Job -Job $job
Write-Host $KILL_SWITCH_OUTPUT
Write-Host ""
if ($KILL_SWITCH_OUTPUT -match "kill.?switch") {
    Write-Host "PHASE 2: PASS - Kill switch detected"
    $PASS_COUNT++
} else {
    Write-Host "PHASE 2: FAIL - Kill switch not detected"
    $FAIL_COUNT++
}
Write-Host ""

# Phase 3: DRY_RUN Verification
Write-Host "=========================================="
Write-Host "PHASE 3: DRY_RUN VERIFICATION"
Write-Host "=========================================="
Write-Host "Command: DRY_RUN=1 node production-server.js (5 second timeout)"
Write-Host ""
$job = Start-Job -ScriptBlock { 
    $env:DRY_RUN = "1"
    Set-Location $using:PWD
    node production-server.js 2>&1 
}
Start-Sleep -Seconds 5
Stop-Job -Job $job
$DRY_RUN_OUTPUT = Receive-Job -Job $job
Remove-Job -Job $job
Write-Host $DRY_RUN_OUTPUT
Write-Host ""
if ($DRY_RUN_OUTPUT -match "dry.?run") {
    Write-Host "PHASE 3: PASS - DRY_RUN mode detected"
    $PASS_COUNT++
} else {
    Write-Host "PHASE 3: FAIL - DRY_RUN mode not detected"
    $FAIL_COUNT++
}
Write-Host ""

# Phase 4: /metrics/autonomy Endpoint Validation
Write-Host "=========================================="
Write-Host "PHASE 4: /metrics/autonomy ENDPOINT"
Write-Host "=========================================="
Write-Host "Starting server in background..."
$serverJob = Start-Job -ScriptBlock { 
    Set-Location $using:PWD
    node production-server.js 2>&1 
}
Write-Host "Server Job ID: $($serverJob.Id)"
Start-Sleep -Seconds 8
Write-Host ""
Write-Host "Command: Invoke-WebRequest http://localhost:3000/metrics/autonomy"
Write-Host ""
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/metrics/autonomy" -UseBasicParsing -TimeoutSec 5
    $METRICS_OUTPUT = $response.Content
    Write-Host $METRICS_OUTPUT
    Write-Host ""
} catch {
    $METRICS_OUTPUT = "REQUEST_FAILED: $_"
    Write-Host $METRICS_OUTPUT
    Write-Host ""
}
Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
Remove-Job -Job $serverJob -ErrorAction SilentlyContinue
Write-Host ""
if ($METRICS_OUTPUT -match "# HELP" -and $METRICS_OUTPUT -match "# TYPE") {
    Write-Host "PHASE 4: PASS - Prometheus format detected"
    $PASS_COUNT++
} else {
    Write-Host "PHASE 4: FAIL - Invalid Prometheus format"
    $FAIL_COUNT++
}
Write-Host ""

# Phase 5: Stress Test (200 concurrent requests)
Write-Host "=========================================="
Write-Host "PHASE 5: STRESS TEST (200 CONCURRENT)"
Write-Host "=========================================="
Write-Host "Starting server in background..."
$serverJob = Start-Job -ScriptBlock { 
    Set-Location $using:PWD
    node production-server.js 2>&1 
}
Write-Host "Server Job ID: $($serverJob.Id)"
Start-Sleep -Seconds 8
Write-Host ""
Write-Host "Command: 200 concurrent requests to /metrics/autonomy"
Write-Host ""
$jobs = @()
for ($i = 1; $i -le 200; $i++) {
    $jobs += Start-Job -ScriptBlock { 
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/metrics/autonomy" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
            if ($response.StatusCode -eq 200) { return 1 } else { return 0 }
        } catch {
            return 0
        }
    }
}
$results = $jobs | Wait-Job | Receive-Job
$SUCCESS_COUNT = ($results | Measure-Object -Sum).Sum
$jobs | Remove-Job
Write-Host "Successful requests: $SUCCESS_COUNT / 200"
Write-Host ""
Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
Remove-Job -Job $serverJob -ErrorAction SilentlyContinue
Write-Host ""
if ($SUCCESS_COUNT -ge 180) {
    Write-Host "PHASE 5: PASS - $SUCCESS_COUNT/200 requests succeeded (>= 90%)"
    $PASS_COUNT++
} else {
    Write-Host "PHASE 5: FAIL - Only $SUCCESS_COUNT/200 requests succeeded (< 90%)"
    $FAIL_COUNT++
}
Write-Host ""

# Phase 6: Demo Validation
Write-Host "=========================================="
Write-Host "PHASE 6: DEMO VALIDATION"
Write-Host "=========================================="
Write-Host "Command: npm run autonomy:demo"
Write-Host ""
try {
    npm run autonomy:demo
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PHASE 6: PASS - Demo completed successfully"
        $PASS_COUNT++
    } else {
        Write-Host "PHASE 6: FAIL - Demo failed"
        $FAIL_COUNT++
    }
} catch {
    Write-Host "PHASE 6: FAIL - Exception: $_"
    $FAIL_COUNT++
}
Write-Host ""

# Final Results Table
Write-Host "=========================================="
Write-Host "FINAL RESULTS"
Write-Host "=========================================="
Write-Host ""
Write-Host ("{0,-40} | {1,-10}" -f "PHASE", "STATUS")
Write-Host "---------------------------------------------------"
$phase1Status = if ($PASS_COUNT -ge 1) { "PASS" } else { "FAIL" }
$phase2Status = if ($PASS_COUNT -ge 2) { "PASS" } else { "FAIL" }
$phase3Status = if ($PASS_COUNT -ge 3) { "PASS" } else { "FAIL" }
$phase4Status = if ($PASS_COUNT -ge 4) { "PASS" } else { "FAIL" }
$phase5Status = if ($PASS_COUNT -ge 5) { "PASS" } else { "FAIL" }
$phase6Status = if ($PASS_COUNT -ge 6) { "PASS" } else { "FAIL" }
Write-Host ("{0,-40} | {1,-10}" -f "Phase 1: Full Test Suite", $phase1Status)
Write-Host ("{0,-40} | {1,-10}" -f "Phase 2: Kill Switch Verification", $phase2Status)
Write-Host ("{0,-40} | {1,-10}" -f "Phase 3: DRY_RUN Verification", $phase3Status)
Write-Host ("{0,-40} | {1,-10}" -f "Phase 4: /metrics/autonomy Endpoint", $phase4Status)
Write-Host ("{0,-40} | {1,-10}" -f "Phase 5: Stress Test (200 concurrent)", $phase5Status)
Write-Host ("{0,-40} | {1,-10}" -f "Phase 6: Demo Validation", $phase6Status)
Write-Host "---------------------------------------------------"
Write-Host ("{0,-40} | {1,-10}" -f "TOTAL PASSED", "$PASS_COUNT / 6")
Write-Host ("{0,-40} | {1,-10}" -f "TOTAL FAILED", "$FAIL_COUNT / 6")
Write-Host ""

# Determine production readiness
if ($PASS_COUNT -eq 6 -and $FAIL_COUNT -eq 0) {
    $PRODUCTION_READY = "YES"
    Write-Host "PRODUCTION_READY: YES"
    exit 0
} else {
    $PRODUCTION_READY = "NO"
    Write-Host "PRODUCTION_READY: NO"
    exit 1
}
