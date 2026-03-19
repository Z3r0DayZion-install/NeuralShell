const executionEngine = require("../src/core/executionEngine");
const { ACTION_REGISTRY } = require("../src/core/actionRegistry");
const { PIPELINES } = require("../src/core/actionPipelines");

async function testInteraction() {
    console.log("--- Testing ExecutionEngine Interaction ---");

    // 1. Mock an interaction-heavy pipeline
    PIPELINES["test_interaction"] = async (root, context) => {
        context.logger("Step 1 started", "system");
        const decision = await context.pause({
            type: "confirm",
            message: "Test interaction question?",
            choices: [{ id: "yes", label: "Yes" }, { id: "no", label: "No" }]
        });
        context.logger(`Operator chose: ${decision.choiceId}`, "success");
        return { ok: true, summary: `End with choice: ${decision.choiceId}` };
    };

    ACTION_REGISTRY["test_interaction"] = { id: "test_interaction", label: "Test Interaction" };

    // 2. Run the action
    console.log("Launching action...");
    const runPromise = executionEngine.runAction("test_interaction", { rootPath: process.cwd() });

    // 3. Wait for pause
    setTimeout(() => {
        const status = executionEngine.getStatus("test_interaction");
        console.log("Current status:", status.status);
        if (status.status !== "awaiting_input") {
            console.error("FAILED: Expected status awaiting_input");
            process.exit(1);
        }
        console.log("Interaction request:", status.interactionRequest.message);

        // 4. Submit response
        console.log("Submitting response...");
        executionEngine.submitResponse("test_interaction", { choiceId: "yes" });
    }, 100);

    const result = await runPromise;
    console.log("Final result:", result.summary);

    if (result.ok && result.summary.includes("yes")) {
        console.log("PASSED: Interaction loop verified.");
    } else {
        console.error("FAILED: Pipeline did not resume correctly.");
        process.exit(1);
    }
}

testInteraction().catch(err => {
    console.error(err);
    process.exit(1);
});
