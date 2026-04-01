const assert = require('assert');
const crossChainCoordinator = require('../src/core/crossChainCoordinator');
const adaptiveIntelligence = require('../src/core/adaptiveIntelligence');

async function testCrossChainCoordination() {
    console.log("Starting Cross-Chain Coordination Verification...");

    const repoA = "/projects/service-a";
    const repoB = "/projects/service-b";

    // 1. Link them
    crossChainCoordinator.linkWorkspaces([repoA, repoB]);
    console.log(`Links for Repo B: ${crossChainCoordinator.getLinks(repoB)}`);
    assert.ok(crossChainCoordinator.getLinks(repoB).includes(repoA), "Repo B should be linked to Repo A");

    // 2. Mock Status: Repo A has a failure
    const fullStatus = {
        actions: {
            [`${repoA}:audit`]: { workspacePath: repoA, status: "failed" }
        },
        chains: {}
    };

    // 3. Analyze Urgency for Repo B
    const intelligenceB = { techStack: ["node"], health: { hasGit: true }, signals: [] };
    const urgencyB = adaptiveIntelligence.analyzeUrgency(repoB, intelligenceB, fullStatus.actions);

    console.log(`Urgency for Repo B with linked failure: ${urgencyB}`);
    // Base urgency: 0 (no failures in Repo B, no node_modules issues because intelligence.health is empty)
    // Linked failure boost: +40
    assert.strictEqual(urgencyB, 40, "Repo B should have urgency 40 due to Repo A failure");

    // 4. Mock Status: Repo A is just running (activity)
    const runningStatus = {
        actions: {
            [`${repoA}:audit`]: { workspacePath: repoA, status: "running" }
        }
    };
    const urgencyB2 = adaptiveIntelligence.analyzeUrgency(repoB, intelligenceB, runningStatus.actions);
    console.log(`Urgency for Repo B with linked activity: ${urgencyB2}`);
    assert.strictEqual(urgencyB2, 10, "Repo B should have urgency 10 due to Repo A activity");

    // 5. Unrelated repo should NOT be affected
    const repoC = "/projects/unrelated";
    const urgencyC = adaptiveIntelligence.analyzeUrgency(repoC, intelligenceB, fullStatus.actions);
    console.log(`Urgency for Unrelated Repo C: ${urgencyC}`);
    assert.strictEqual(urgencyC, 0, "Unrelated Repo C should have urgency 0");

    console.log("Cross-Chain Coordination Verification PASSED.");
}

testCrossChainCoordination().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
