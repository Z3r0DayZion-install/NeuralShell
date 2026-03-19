const path = require("path");
const workspaceRegistry = require("../src/core/workspaceRegistry");
const executionEngine = require("../src/core/executionEngine");

// Mocking some dependencies
const workflowMemory = require("../src/core/workflowMemory");
const actionOutcomeStore = require("../src/core/actionOutcomeStore");
const preflightModule = require("../src/core/preflight");
preflightModule.runPreflight = async () => ({ ok: true });

async function testOrchestration() {
    console.log("--- Phase 11D: Multi-Workspace Orchestration Test ---");

    const rootA = path.resolve("./test_workspace_a");
    const rootB = path.resolve("./test_workspace_b");

    // 1. Register Workspaces
    console.log("Registering Workspace A and B...");
    workspaceRegistry.init("./tmp/storage");
    const wsA = workspaceRegistry.register(rootA, { techStack: ["Node.js"], signals: ["package.json"] });
    const wsB = workspaceRegistry.register(rootB, { techStack: ["Electron"], signals: ["main.js"] });

    if (wsA.id === wsB.id) throw new Error("Workspace IDs should be unique");
    console.log("PASSED: Registration verified.");

    // 2. Start Action in Workspace A
    console.log("\nStarting 'audit_package' in Workspace A...");
    // Mock the pipeline
    const { PIPELINES } = require("../src/core/actionPipelines");
    PIPELINES["audit_package"] = async (root, context) => {
        context.logger("Audit started in " + root);
        await new Promise(r => setTimeout(r, 50));
        return { ok: true, summary: "Audit complete" };
    };

    const runPromise = executionEngine.runAction("audit_package", rootA);

    // Give it a tick to initialize state (async preflight)
    await new Promise(r => setTimeout(r, 10));

    const stateA = executionEngine.getStatus("audit_package", rootA);
    console.log("State A:", JSON.stringify(stateA, null, 2));

    if (stateA.status !== "running" || stateA.workspacePath !== rootA) {
        throw new Error(`Action state A not correctly scoped. Status: ${stateA.status}, Path: ${stateA.workspacePath}`);
    }

    // 3. Verify Isolation in Workspace B
    console.log("Checking Workspace B isolation...");
    const stateB = executionEngine.getStatus("audit_package", rootB);
    if (stateB.status !== "ready") {
        throw new Error("Workspace B state contaminated by Workspace A");
    }
    console.log("PASSED: Isolation verified.");

    // 4. Test Switching
    console.log("\nSwitching active workspace to B...");
    workspaceRegistry.setActiveWorkspace(wsB.id);
    if (workspaceRegistry.getActiveWorkspace().id !== wsB.id) {
        throw new Error("Failed to switch active workspace");
    }
    console.log("PASSED: Active switch verified.");

    // 5. Cleanup
    await runPromise;
    console.log("\nAction in A finished. Final check...");
    const finalA = executionEngine.getStatus("audit_package", rootA);
    if (finalA.status !== "succeeded") {
        throw new Error("Action A didn't finalize correctly");
    }

    console.log("\nPASSED: Multi-Workspace Orchestration verified.");
}

testOrchestration().catch(err => {
    console.error("FAILED:", err);
    process.exit(1);
});
