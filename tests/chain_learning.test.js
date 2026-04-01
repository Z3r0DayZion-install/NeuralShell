const fs = require('fs');
const path = require('path');
const assert = require('assert');
const workflowMemory = require('../src/core/workflowMemory');
const chainPlanner = require('../src/core/chainPlanner');

// Mock storage
const tmpDir = path.join(__dirname, '../tmp');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
const memFile = path.join(tmpDir, "workflow_memory.json");
if (fs.existsSync(memFile)) fs.unlinkSync(memFile);

workflowMemory.init(tmpDir);

async function testChainLearning() {
    console.log("Starting Chain Learning Verification...");

    const context = {
        rootPath: "/mock/project-a",
        techStack: ["node", "electron"],
        capabilities: { has_build_script: true },
        signals: {}
    };

    const templateId = "build_quality_gate";

    // 1. Initial proposal (no memory)
    let proposals = chainPlanner.proposeChains(context.rootPath, context);
    let gateItem = proposals.find(p => p.templateId === templateId);
    console.log(`Initial Urgency: ${gateItem.urgency}`);
    assert.strictEqual(!!gateItem.memory, false, "Should not have memory yet");

    // 2. Record 3 successful outcomes
    console.log("Recording 3 successful chain outcomes...");
    for (let i = 0; i < 3; i++) {
        workflowMemory.recordChainOutcome(templateId, context, {
            ok: true,
            stepsCompleted: 2,
            totalSteps: 2
        });
    }

    // 3. Verify proposal boost
    proposals = chainPlanner.proposeChains(context.rootPath, context);
    gateItem = proposals.find(p => p.templateId === templateId);
    console.log(`Boosted Urgency: ${gateItem.urgency}`);
    assert.ok(gateItem.memory, "Should have memory now");
    assert.ok(gateItem.memory.successRate > 0.9, "Should have high success rate");
    assert.ok(gateItem.urgency > 10, "Urgency should be boosted");

    // 4. Record many failures for an unrelated context
    console.log("Recording failures for unrelated context...");
    const unrelatedContext = { rootPath: "/other/project", techStack: ["python"] };
    for (let i = 0; i < 5; i++) {
        workflowMemory.recordChainOutcome(templateId, unrelatedContext, {
            ok: false,
            stepsCompleted: 0,
            totalSteps: 2
        });
    }

    // 5. Verify no contamination
    proposals = chainPlanner.proposeChains(context.rootPath, context);
    gateItem = proposals.find(p => p.templateId === templateId);
    console.log(`Urgency after unrelated failures: ${gateItem.urgency}`);
    assert.ok(gateItem.memory.successRate > 0.9, "Success rate should remain high for original context");

    console.log("Chain Learning Verification PASSED.");

    // Cleanup
    const memFile = path.join(tmpDir, "workflow_memory.json");
    if (fs.existsSync(memFile)) fs.unlinkSync(memFile);
}

testChainLearning().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
