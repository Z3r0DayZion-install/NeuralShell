const workflowMemory = require("../src/core/workflowMemory");
const path = require("path");
const fs = require("fs");

async function testMemory() {
    console.log("--- Testing WorkflowMemory ---");
    const testDir = path.join(__dirname, "../tmp/test_memory");
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });

    workflowMemory.init(testDir);
    workflowMemory.records = []; // Clear for test

    const nodeContext = {
        rootPath: "/work/node-app",
        techStack: ["node", "electron"],
        signals: ["node", "git"]
    };

    const similarNodeContext = {
        rootPath: "/work/other-node-app",
        techStack: ["node", "electron", "playwright"],
        signals: ["node", "git"]
    };

    const pythonContext = {
        rootPath: "/work/py-app",
        techStack: ["python"],
        signals: ["git"]
    };

    // 1. Record decision in nodeContext
    console.log("Recording decision in Node context...");
    workflowMemory.recordDecision("audit_package", nodeContext, "continue");

    // 2. Check suggestion for exact match
    console.log("Checking exact match...");
    const exact = workflowMemory.getSuggestions("audit_package", nodeContext);
    console.log("Exact Choice:", exact.preferredChoice);
    if (exact.preferredChoice !== "continue") throw new Error("Exact match failed");

    // 3. Check suggestion for similar match
    console.log("Checking similar match...");
    const similar = workflowMemory.getSuggestions("audit_package", similarNodeContext);
    console.log("Similar Choice:", similar.preferredChoice);
    console.log("Similar Rationale:", similar.rationale);
    if (similar.preferredChoice !== "continue") throw new Error("Similar match failed");
    if (!similar.rationale.includes("similar")) throw new Error("Similarity rationale missing");

    // 4. Check suggestion for unrelated context
    console.log("Checking unrelated match...");
    const unrelated = workflowMemory.getSuggestions("audit_package", pythonContext);
    if (unrelated && unrelated.preferredChoice) {
        // High similarity should not exist
        console.log("Unrelated choice found (unexpected):", unrelated.preferredChoice);
    } else {
        console.log("No unrelated choice found (correct).");
    }

    // 5. Test Recovery Boost
    console.log("Testing Recovery Boost...");
    workflowMemory.recordOutcome("git_push", nodeContext, false, "review_uncommitted");

    const boosts = workflowMemory.getRecoveryBoosts(similarNodeContext);
    console.log("Boosts for similar context:", boosts);
    if (!boosts["review_uncommitted"] || boosts["review_uncommitted"] <= 0) {
        throw new Error("Recovery boost failed for similar context");
    }

    console.log("PASSED: WorkflowMemory logic verified.");
}

testMemory().catch(err => {
    console.error("FAILED:", err);
    process.exit(1);
});
