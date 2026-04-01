const assert = require('assert');
const executionEngine = require('../src/core/executionEngine');
const path = require('path');

async function testReliabilityHardening() {
    console.log("Starting Reliability Hardening Verification...");

    const workspace = path.resolve("/projects/test-resilience");

    // 1. Duplicate Run Guard (Action)
    executionEngine.activeActions.set(`${workspace}:audit_package`, {
        id: "audit_package",
        workspacePath: workspace,
        status: "running",
        startedAt: Date.now()
    });

    const result = await executionEngine.runAction("audit_package", workspace);
    console.log(`Duplicate action run result: ${JSON.stringify(result)}`);
    assert.strictEqual(result.ok, false, "Should prevent duplicate action run");
    assert.ok(result.reason.includes("already active"), "Error should mention active status");

    // 2. Duplicate Run Guard (Chain)
    executionEngine.activeChains.set(`${workspace}:test_chain`, {
        id: "test_chain",
        title: "Test Chain",
        workspacePath: workspace,
        status: "running"
    });

    const chainResult = await executionEngine.runChain("test_chain", workspace);
    console.log(`Duplicate chain run result: ${JSON.stringify(chainResult)}`);
    assert.strictEqual(chainResult.ok, false, "Should prevent duplicate chain run");

    // 3. Stale Workload Reaping
    const frozenNow = Date.now();
    const staleActionId = `${workspace}:stale_action`;
    executionEngine.activeActions.set(staleActionId, {
        id: "stale_action",
        workspacePath: workspace,
        status: "running",
        startedAt: frozenNow - (40 * 60 * 1000) // 40 mins ago
    });

    console.log("Forcing workload reap...");
    // Manually call private method for testing
    executionEngine._reapStaleWorkloads();

    const reapedAction = executionEngine.activeActions.get(staleActionId);
    console.log(`Reaped action status: ${reapedAction.status}`);
    assert.strictEqual(reapedAction.status, "failed", "Stale action should be failed");
    assert.strictEqual(reapedAction.result.reason, "Inactivity timeout", "Reason should be timeout");

    // 4. Restore State Integrity
    const mockSavedState = {
        actions: {
            [`${workspace}:recent`]: { status: "succeeded" }
        },
        chains: {
            [`${workspace}:interrupted`]: { status: "running", title: "Broken" }
        }
    };

    console.log("Testing state restoration...");
    executionEngine.restoreState(mockSavedState);

    const restoredChain = executionEngine.activeChains.get(`${workspace}:interrupted`);
    console.log(`Restored chain status: ${restoredChain.status}`);
    assert.strictEqual(restoredChain.status, "paused", "Running chains should restore to 'paused' for safety");
    assert.ok(restoredChain.outcome.includes("restart"), "Outcome should explain the pause");

    console.log("Reliability Hardening Verification PASSED.");
    process.exit(0);
}

testReliabilityHardening().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
