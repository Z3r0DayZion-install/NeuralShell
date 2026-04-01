const assert = require('assert');
const path = require('path');
const fs = require('fs');
const kernelRepair = require('../src/core/kernelRepair');
const _executionEngine = require("../src/core/executionEngine");
const diagnosticsLedger = require('../src/core/diagnosticsLedger');

async function testKernelRepair() {
    console.log("Starting Kernel Repair Verification...");

    const workspace = path.resolve("/projects/repair-test");
    if (!fs.existsSync(workspace)) fs.mkdirSync(workspace, { recursive: true });

    diagnosticsLedger.clear();

    // 1. Setup Monitor
    kernelRepair.startMonitoring(workspace);
    const watcher = kernelRepair.watchers.get(workspace);
    assert.ok(watcher, "Watcher should be established for workspace");

    // 2. Simulate Stall
    console.log("Simulating service stall...");
    watcher.lastHeartbeat = Date.now() - (10 * 60 * 1000); // 10 mins ago (stalled)

    let repairInitiated = false;
    kernelRepair.once('repair_initiated', (data) => {
        if (data.targetId === workspace) repairInitiated = true;
    });

    // 3. Trigger Health Check
    await kernelRepair.perfomHealthCheck(workspace);

    // 4. Assert Repair Actions
    assert.strictEqual(watcher.status, "stalled", "Status should be 'stalled'");
    assert.ok(repairInitiated, "Repair event should be emitted");

    const entries = diagnosticsLedger.getRecent(workspace);
    const repairLog = entries.find(e => e.eventType === "CLEANUP" && e.detail === "REPAIR");
    assert.ok(repairLog, "Repair attempt should be logged to diagnostics ledger");
    assert.ok(repairLog.rationale.includes("Tactical reset"), "Rationale should explain the repair");

    console.log("Kernel Repair Verification PASSED.");
    process.exit(0);
}

testKernelRepair().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
