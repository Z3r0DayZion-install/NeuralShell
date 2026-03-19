const assert = require('assert');
const chainPlanner = require('../src/core/chainPlanner');

async function testContextualEvolution() {
    console.log("Starting Contextual Evolution Verification...");

    // 1. Electron Workspace
    const electronContext = {
        rootPath: "/projects/electron-app",
        techStack: ["node", "electron"],
        capabilities: { has_build_script: true },
        signals: { has_git: true }
    };

    const electronProposals = chainPlanner.proposeChains(electronContext.rootPath, electronContext);
    const auditChain = electronProposals.find(p => p.templateId === "audit_and_review");
    const auditStep = auditChain.steps.find(s => s.actionId === "audit_package");

    console.log(`Electron Audit Label: ${auditStep.label}`);
    assert.strictEqual(auditStep.label, "Electron Security Audit", "Should evolve to Electron specialization");
    assert.ok(auditStep.tuningRationale.includes("electron_specialization"), "Should include tuning rationale");

    // 2. Generic Node Workspace
    const nodeContext = {
        rootPath: "/projects/node-cli",
        techStack: ["node"],
        capabilities: { has_build_script: true },
        signals: { has_git: true }
    };

    const nodeProposals = chainPlanner.proposeChains(nodeContext.rootPath, nodeContext);
    const buildChain = nodeProposals.find(p => p.templateId === "build_quality_gate");
    const buildStep = buildChain.steps.find(s => s.actionId === "verify_build");

    console.log(`Node Build Label: ${buildStep.label}`);
    assert.strictEqual(buildStep.label, "Node.js Environment Check", "Should evolve to Node specialization");

    // 3. Low Confidence / No Git Workspace
    const cautiousContext = {
        rootPath: "/projects/sketchy-ref",
        techStack: ["node"],
        capabilities: {},
        signals: {}, // No git
        lowConfidence: true
    };

    const cautiousProposals = chainPlanner.proposeChains(cautiousContext.rootPath, cautiousContext);
    const reviewChain = cautiousProposals.find(p => p.templateId === "audit_and_review");
    const reviewStep = reviewChain.steps.find(s => s.actionId === "review_uncommitted");

    console.log(`Cautious Review Label: ${reviewStep.label}`);
    assert.strictEqual(reviewStep.label, "Safe Scope Review", "Should evolve to conservative Git behavior");

    console.log("Contextual Evolution Verification PASSED.");
}

testContextualEvolution().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
