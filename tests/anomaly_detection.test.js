const assert = require('assert');
const path = require('path');
const agencyPolicy = require('../src/core/agencyPolicy');
const adaptiveIntelligence = require('../src/core/adaptiveIntelligence');
const _crossChainCoordinator = require("../src/core/crossChainCoordinator");

async function testAnomalyDetection() {
    console.log("Starting Anomaly Detection Verification...");

    const workspace = path.resolve("/projects/anomaly-test");

    // 1. Normal Conditions
    console.log("Testing normal conditions (0 outcomes)...");
    const normalPerm = agencyPolicy.isAutoRunPermitted("audit_package", {
        workspacePath: workspace,
        outcomes: [],
        intelligence: { health: { driftScale: 0.1 } }
    });
    assert.strictEqual(normalPerm, true, "SAFE action should auto-run under normal conditions");

    // 2. Anomaly: Failure Spike
    console.log("Testing failure spike anomaly...");
    const badHistory = [
        { workspacePath: workspace, ok: false, timestamp: Date.now() - 1000 },
        { workspacePath: workspace, ok: false, timestamp: Date.now() - 2000 },
        { workspacePath: workspace, ok: true, timestamp: Date.now() - 3000 },
        { workspacePath: workspace, ok: false, timestamp: Date.now() - 4000 }
    ];

    const risk = adaptiveIntelligence.analyzeAnomalyRisk(workspace, {}, badHistory);
    console.log(`Calculated anomaly risk (failure spike): ${risk}`);
    assert.ok(risk >= 40, "Risk should be high due to failure density");

    const anomaliesPerm = agencyPolicy.isAutoRunPermitted("audit_package", {
        workspacePath: workspace,
        outcomes: badHistory,
        intelligence: { health: { driftScale: 0.1 } }
    });
    assert.strictEqual(anomaliesPerm, false, "SAFE action should be GATED when failure anomaly is detected");

    // 3. Anomaly: High Drift
    console.log("Testing high drift anomaly...");
    const driftRisk = adaptiveIntelligence.analyzeAnomalyRisk(workspace, { health: { driftScale: 0.9 } }, []);
    console.log(`Calculated anomaly risk (high drift): ${driftRisk}`);
    assert.ok(driftRisk >= 30, "Risk should be elevated due to high drift");

    console.log("Anomaly Detection Verification PASSED.");
    process.exit(0);
}

testAnomalyDetection().catch(err => {
    console.error("Test Failed:", err);
    process.exit(1);
});
