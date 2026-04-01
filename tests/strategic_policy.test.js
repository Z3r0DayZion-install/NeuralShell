const assert = require('assert');
const chainPlanner = require('../src/core/chainPlanner');
const { ACTION_RISK } = require('../src/core/actionRegistry');

async function testStrategicPolicy() {
    console.log("Starting Strategic Policy Depth Verification...");

    const workspace = "/projects/policy-test";

    // 1. Clean Environment (Standard Policy)
    const intelClean = {
        rootPath: workspace,
        signals: ["node"],
        health: { hasGit: true, hasPackageJson: true }
    };

    console.log("Testing Clean Environment...");
    const chain1 = chainPlanner.assembleChain("audit_and_review", workspace, intelClean);
    const auditStep = chain1.steps.find(s => s.actionId === "audit_package");

    console.log(`Audit step autoRun: ${auditStep.autoRun}, Rationale: ${auditStep.policyRationale}`);
    assert.strictEqual(auditStep.autoRun, true, "SAFE action should auto-run in clean environment");
    assert.ok(auditStep.policyRationale.includes("safe"), "Rationale should indicate safety");

    // 2. Dirty Tree Suppression
    const intelDirty = {
        rootPath: workspace,
        signals: ["node", "dirty_tree"],
        health: { hasGit: true, hasPackageJson: true }
    };

    console.log("Testing Dirty Tree Suppression...");
    // Force a chain with a MEDIUM risk action (build_quality_gate -> verify_build)
    const chain2 = chainPlanner.assembleChain("build_quality_gate", workspace, intelDirty);
    const buildStep = chain2.steps.find(s => s.actionId === "verify_build");

    console.log(`Build step autoRun: ${buildStep.autoRun}, Rationale: ${buildStep.policyRationale}`);
    assert.strictEqual(buildStep.autoRun, false, "MEDIUM action should be gated in dirty tree environment");
    assert.ok(buildStep.policyRationale.includes("uncommitted changes"), "Rationale should mention dirty tree");

    // 3. High Risk Action Gating (Mocked definition)
    const { ACTION_REGISTRY } = require('../src/core/actionRegistry');
    ACTION_REGISTRY["dangerous_action"] = {
        id: "dangerous_action",
        label: "Dangerous Action",
        risk: ACTION_RISK.HIGH
    };

    const template = {
        id: "dangerous_chain",
        title: "Dangerous Chain",
        steps: [{ actionId: "dangerous_action", label: "Boom" }]
    };

    // Temporarily inject template
    chainPlanner.CHAIN_TEMPLATES["dangerous_chain"] = template;

    console.log("Testing High Risk Gating...");
    const chain3 = chainPlanner.assembleChain("dangerous_chain", workspace, intelClean);
    const dangerousStep = chain3.steps[0];

    console.log(`Dangerous step autoRun: ${dangerousStep.autoRun}, Rationale: ${dangerousStep.policyRationale}`);
    assert.strictEqual(dangerousStep.autoRun, false, "HIGH risk action should always be gated");
    assert.ok(dangerousStep.policyRationale.includes("high system risk"), "Rationale should mention high risk");

    console.log("Strategic Policy Depth Verification PASSED.");
    process.exit(0);
}

testStrategicPolicy().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
