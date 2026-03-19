const assert = require('assert');
const { conflictModel, CONFLICT_STATE } = require('../src/core/conflictModel');
const crossChainCoordinator = require('../src/core/crossChainCoordinator');
const adaptiveIntelligence = require('../src/core/adaptiveIntelligence');

async function testConflictSafeCoordination() {
    console.log("Starting Conflict-Safe Multi-Repo Coordination Verification...");

    const repoA = "/projects/service-a";
    const repoB = "/projects/service-b";

    // 1. Setup Linkage
    crossChainCoordinator.linkWorkspaces([repoA, repoB]);
    console.log(`Linked ${repoA} and ${repoB}`);

    // 2. Test Merge Conflict Propagation
    console.log("Testing Merge Conflict Propagation...");
    conflictModel.setConflict(repoA, CONFLICT_STATE.MERGE_CONFLICT, "Conflict in main.js");

    const signalsB = crossChainCoordinator.getSignals(repoB, { actions: {}, chains: {} });
    const conflictSignal = signalsB.find(s => s.type === "linked_conflict");

    console.log(`Signals for Repo B: ${JSON.stringify(signalsB)}`);
    assert.ok(conflictSignal, "Repo B should receive a linked_conflict signal");
    assert.strictEqual(conflictSignal.source, repoA);
    assert.ok(conflictSignal.reason.includes("MERGE_CONFLICT"), "Signal should mention the conflict state");

    const intelB = { rootPath: repoB, signals: [], health: { hasGit: true } };
    const urgencyB = adaptiveIntelligence.analyzeUrgency(repoB, intelB, {});
    console.log(`Urgency for Repo B with linked conflict: ${urgencyB}`);
    assert.strictEqual(urgencyB, 50, "Urgency should be 50 due to linked conflict");

    // 3. Test Locked State Propagation
    console.log("Testing Locked State (Dependency Install) Propagation...");
    conflictModel.setConflict(repoA, CONFLICT_STATE.LOCKED, "npm install active");

    const signalsB2 = crossChainCoordinator.getSignals(repoB, { actions: {}, chains: {} });
    const lockSignal = signalsB2.find(s => s.type === "linked_conflict");

    assert.ok(lockSignal, "Repo B should receive a linked_conflict signal for locked state");
    assert.ok(lockSignal.reason.includes("LOCKED"), "Signal should mention the locked state");

    // 4. Test Advisory Drift
    console.log("Testing Advisory Drift Propagation...");
    conflictModel.clearConflict(repoA);
    conflictModel.setConflict(repoA, CONFLICT_STATE.DIRTY, "Uncommitted drift");

    // Wait for Urgency TTL (Wave 14B protection)
    console.log("Waiting for Urgency TTL (1.1s)...");
    await new Promise(resolve => setTimeout(resolve, 1100));

    const signalsB3 = crossChainCoordinator.getSignals(repoB, { actions: {}, chains: {} });
    const driftSignal = signalsB3.find(s => s.type === "linked_drift");

    assert.ok(driftSignal, "Repo B should receive a linked_drift signal");
    const urgencyB2 = adaptiveIntelligence.analyzeUrgency(repoB, intelB, {});
    console.log(`Urgency for Repo B with linked drift: ${urgencyB2}`);
    assert.strictEqual(urgencyB2, 20, "Urgency should be 20 due to linked drift");

    console.log("Conflict-Safe Multi-Repo Coordination Verification PASSED.");
    process.exit(0);
}

testConflictSafeCoordination().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
