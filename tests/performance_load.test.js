const assert = require('assert');
const projectIntelligence = require('../src/core/projectIntelligence');
const adaptiveIntelligence = require('../src/core/adaptiveIntelligence');

async function testPerformanceLoad() {
    console.log("Starting Performance & Load Stability Verification...");

    const workspace = process.cwd();

    // 1. Intelligence Caching
    console.log("Testing Intelligence Caching...");
    const start1 = Date.now();
    const intel1 = projectIntelligence.analyzeProject(workspace);
    const end1 = Date.now();

    const start2 = Date.now();
    const intel2 = projectIntelligence.analyzeProject(workspace);
    const end2 = Date.now();

    console.log(`First scan: ${end1 - start1}ms, Second scan (cached): ${end2 - start2}ms`);
    assert.strictEqual(intel1, intel2, "Cached intelligence should be the same object instance");

    // 2. Urgency Throttling
    console.log("Testing Urgency Throttling...");
    const mockActionStatus = {
        [`${workspace}:run_e2e`]: { status: "running" }
    };

    const urgency1 = adaptiveIntelligence.analyzeUrgency(workspace, intel1, mockActionStatus);

    // Change status to failure (should increase score by 40)
    mockActionStatus[`${workspace}:run_e2e`].status = "failed";

    const urgency2 = adaptiveIntelligence.analyzeUrgency(workspace, intel1, mockActionStatus);
    console.log(`Urgency 1: ${urgency1}, Urgency 2 (throttled): ${urgency2}`);

    assert.strictEqual(urgency1, urgency2, "Urgency should be throttled within 1 second window");

    // Wait for TTL to expire
    console.log("Waiting for Urgency TTL (1.1s)...");
    await new Promise(resolve => setTimeout(resolve, 1100));

    const urgency3 = adaptiveIntelligence.analyzeUrgency(workspace, intel1, mockActionStatus);
    console.log(`Urgency 3 (expired): ${urgency3}`);
    assert.notStrictEqual(urgency1, urgency3, "Urgency should update after TTL expires");
    assert.ok(urgency3 > urgency1, "Urgency should have increased after failure detection");

    console.log("Performance & Load Stability Verification PASSED.");
    process.exit(0);
}

testPerformanceLoad().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
