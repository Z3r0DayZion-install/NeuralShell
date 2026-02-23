#!/bin/bash
# Hardness Test Script - Proof of Execution Validation
# UTF-8 encoding, LF line endings
# Exit 0 only if ALL phases pass

set -e
set -o pipefail

PASS_COUNT=0
FAIL_COUNT=0
PRODUCTION_READY="NO"

echo "=========================================="
echo "HARDNESS TEST - PROOF OF EXECUTION"
echo "=========================================="
echo ""

# Phase 1: Full Test Suite
echo "=========================================="
echo "PHASE 1: FULL TEST SUITE"
echo "=========================================="
echo "Command: npm test"
echo ""
if npm test; then
    echo "PHASE 1: PASS"
    ((PASS_COUNT++))
else
    echo "PHASE 1: FAIL"
    ((FAIL_COUNT++))
fi
echo ""

# Phase 2: Kill Switch Verification
echo "=========================================="
echo "PHASE 2: KILL SWITCH VERIFICATION"
echo "=========================================="
echo "Command: AUTONOMY_KILL_SWITCH=1 timeout 5 node production-server.js"
echo ""
KILL_SWITCH_OUTPUT=$(AUTONOMY_KILL_SWITCH=1 timeout 5 node production-server.js 2>&1 || true)
echo "$KILL_SWITCH_OUTPUT"
echo ""
if echo "$KILL_SWITCH_OUTPUT" | grep -qi "kill switch"; then
    echo "PHASE 2: PASS - Kill switch detected"
    ((PASS_COUNT++))
else
    echo "PHASE 2: FAIL - Kill switch not detected"
    ((FAIL_COUNT++))
fi
echo ""

# Phase 3: DRY_RUN Verification
echo "=========================================="
echo "PHASE 3: DRY_RUN VERIFICATION"
echo "=========================================="
echo "Command: DRY_RUN=1 timeout 5 node production-server.js"
echo ""
DRY_RUN_OUTPUT=$(DRY_RUN=1 timeout 5 node production-server.js 2>&1 || true)
echo "$DRY_RUN_OUTPUT"
echo ""
if echo "$DRY_RUN_OUTPUT" | grep -qi "dry.run"; then
    echo "PHASE 3: PASS - DRY_RUN mode detected"
    ((PASS_COUNT++))
else
    echo "PHASE 3: FAIL - DRY_RUN mode not detected"
    ((FAIL_COUNT++))
fi
echo ""

# Phase 4: /metrics/autonomy Endpoint Validation
echo "=========================================="
echo "PHASE 4: /metrics/autonomy ENDPOINT"
echo "=========================================="
echo "Starting server in background..."
node production-server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 5
echo ""
echo "Command: curl -s http://localhost:3000/metrics/autonomy"
echo ""
METRICS_OUTPUT=$(curl -s http://localhost:3000/metrics/autonomy || echo "CURL_FAILED")
echo "$METRICS_OUTPUT"
echo ""
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo ""
if echo "$METRICS_OUTPUT" | grep -q "# HELP" && echo "$METRICS_OUTPUT" | grep -q "# TYPE"; then
    echo "PHASE 4: PASS - Prometheus format detected"
    ((PASS_COUNT++))
else
    echo "PHASE 4: FAIL - Invalid Prometheus format"
    ((FAIL_COUNT++))
fi
echo ""

# Phase 5: Stress Test (200 concurrent requests)
echo "=========================================="
echo "PHASE 5: STRESS TEST (200 CONCURRENT)"
echo "=========================================="
echo "Starting server in background..."
node production-server.js > /tmp/server-stress.log 2>&1 &
SERVER_PID=$!
echo "Server PID: $SERVER_PID"
sleep 5
echo ""
echo "Command: 200 concurrent curl requests to /metrics/autonomy"
echo ""
SUCCESS_COUNT=0
for i in {1..200}; do
    if curl -s -f http://localhost:3000/metrics/autonomy > /dev/null 2>&1; then
        ((SUCCESS_COUNT++))
    fi &
done
wait
echo "Successful requests: $SUCCESS_COUNT / 200"
echo ""
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo ""
if [ $SUCCESS_COUNT -ge 180 ]; then
    echo "PHASE 5: PASS - $SUCCESS_COUNT/200 requests succeeded (>= 90%)"
    ((PASS_COUNT++))
else
    echo "PHASE 5: FAIL - Only $SUCCESS_COUNT/200 requests succeeded (< 90%)"
    ((FAIL_COUNT++))
fi
echo ""

# Phase 6: Demo Validation
echo "=========================================="
echo "PHASE 6: DEMO VALIDATION"
echo "=========================================="
echo "Command: npm run autonomy:demo"
echo ""
if npm run autonomy:demo; then
    echo "PHASE 6: PASS - Demo completed successfully"
    ((PASS_COUNT++))
else
    echo "PHASE 6: FAIL - Demo failed"
    ((FAIL_COUNT++))
fi
echo ""

# Final Results Table
echo "=========================================="
echo "FINAL RESULTS"
echo "=========================================="
echo ""
printf "%-40s | %-10s\n" "PHASE" "STATUS"
echo "---------------------------------------------------"
printf "%-40s | %-10s\n" "Phase 1: Full Test Suite" "$([ $PASS_COUNT -ge 1 ] && echo 'PASS' || echo 'FAIL')"
printf "%-40s | %-10s\n" "Phase 2: Kill Switch Verification" "$([ $PASS_COUNT -ge 2 ] && echo 'PASS' || echo 'FAIL')"
printf "%-40s | %-10s\n" "Phase 3: DRY_RUN Verification" "$([ $PASS_COUNT -ge 3 ] && echo 'PASS' || echo 'FAIL')"
printf "%-40s | %-10s\n" "Phase 4: /metrics/autonomy Endpoint" "$([ $PASS_COUNT -ge 4 ] && echo 'PASS' || echo 'FAIL')"
printf "%-40s | %-10s\n" "Phase 5: Stress Test (200 concurrent)" "$([ $PASS_COUNT -ge 5 ] && echo 'PASS' || echo 'FAIL')"
printf "%-40s | %-10s\n" "Phase 6: Demo Validation" "$([ $PASS_COUNT -ge 6 ] && echo 'PASS' || echo 'FAIL')"
echo "---------------------------------------------------"
printf "%-40s | %-10s\n" "TOTAL PASSED" "$PASS_COUNT / 6"
printf "%-40s | %-10s\n" "TOTAL FAILED" "$FAIL_COUNT / 6"
echo ""

# Determine production readiness
if [ $PASS_COUNT -eq 6 ] && [ $FAIL_COUNT -eq 0 ]; then
    PRODUCTION_READY="YES"
    echo "PRODUCTION_READY: YES"
    exit 0
else
    PRODUCTION_READY="NO"
    echo "PRODUCTION_READY: NO"
    exit 1
fi
