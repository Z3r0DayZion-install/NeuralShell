const executionEngine = require("../src/core/executionEngine");
const projectIntelligence = require("../src/core/projectIntelligence");
const workflowMemory = require("../src/core/workflowMemory");
const { ACTION_REGISTRY } = require("../src/core/actionRegistry");
const { PIPELINES } = require("../src/core/actionPipelines");
const path = require("path");
const fs = require("fs");

async function testE2ESimulation() {
    console.log("--- E2E Simulation: Cross-Workflow Memory ---");
    const testDir = path.join(__dirname, "../tmp/test_e2e_memory");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    workflowMemory.init(testDir);
    workflowMemory.records = [];

    // Mock an interactive pipeline
    PIPELINES["audit_package"] = async (root, context) => {
        const decision = await context.pause({
            type: "confirm",
            message: "Continue audit?",
            choices: [{ id: "continue", label: "Continue" }, { id: "abort", label: "Abort" }]
        });
        return { ok: true, summary: "Decision: " + decision.choiceId };
    };

    const rootPath = process.cwd();
    const intelligence = projectIntelligence.analyzeProject(rootPath);

    // 1. First Run: Record a decision
    console.log("Run 1: Launching action and choosing 'abort'...");
    const run1 = executionEngine.runAction("audit_package", intelligence);

    // Simulate operator choosing 'abort'
    setTimeout(() => {
        const status = executionEngine.getStatus("audit_package");
        console.log("Interaction Prompt suggestions:", status.interactionRequest.suggestions);
        executionEngine.submitResponse("audit_package", { choiceId: "abort" });
    }, 50);

    const res1 = await run1;
    console.log("Run 1 Result:", res1.summary);

    // 2. Second Run: Verify suggestion in interaction request
    console.log("\nRun 2: Launching again, checking suggestions...");
    const run2 = executionEngine.runAction("audit_package", intelligence);

    await new Promise(resolve => setTimeout(resolve, 50));
    const status2 = executionEngine.getStatus("audit_package");
    const suggestion = status2.interactionRequest.suggestions;

    console.log("Run 2 Suggestion Choice:", suggestion.preferredChoice);
    console.log("Run 2 Suggestion Rationale:", suggestion.rationale);

    if (suggestion.preferredChoice !== "abort") throw new Error("Suggestion missing or wrong");

    executionEngine.submitResponse("audit_package", { choiceId: "abort" });
    await run2;

    // 3. Verify Intelligence Ranking Boost
    console.log("\nVerifying Intelligence Ranking Boost...");
    const actions = projectIntelligence.rankActions(intelligence);
    const auditAction = actions.find(a => a.id === "audit_package");

    console.log("Action Label:", auditAction.label);
    console.log("Action Reason:", auditAction.reason);
    console.log("Action History Rationale:", auditAction.historyRationale);

    if (!auditAction.historyRationale || !auditAction.reason.includes("Recommended")) {
        throw new Error("Intelligence boost or rationale missing from ranking");
    }

    console.log("\nPASSED: E2E Simulation verified.");
}

testE2ESimulation().catch(err => {
    console.error("FAILED:", err);
    process.exit(1);
});
