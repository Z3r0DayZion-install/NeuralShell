const { ACTION_REGISTRY } = require("./actionRegistry");

/**
 * NeuralShell Recovery Engine
 * Derives recovery actions when an orchestrated workflow fails.
 */

function deriveRecoveryChain(lastOutcome) {
    if (!lastOutcome || lastOutcome.ok) return null;

    const chain = {
        failedActionId: lastOutcome.id,
        reason: lastOutcome.reason,
        recommendations: []
    };

    switch (lastOutcome.id) {
        case "audit_package":
            if (lastOutcome.reason.includes("parse")) {
                chain.recommendations.push({
                    id: "fix_package_json",
                    label: "Fix package.json syntax",
                    prompt: "The package.json is malformed. Attempt to auto-fix common syntax errors or provide a valid structure.",
                    priority: "high"
                });
            } else {
                chain.recommendations.push({
                    id: "inspect_dependencies",
                    label: "Inspect dependencies",
                    prompt: "The audit failed. Review the dependencies manually for missing or broken links.",
                    priority: "medium"
                });
            }
            break;

        case "verify_build":
            chain.recommendations.push({
                id: "inspect_build_scripts",
                label: "Inspect build scripts",
                prompt: "The build failed. Review the scripts section in package.json and verify the local environment.",
                priority: "high"
            });
            break;

        default:
            chain.recommendations.push({
                id: "debug_failure",
                label: "Debug recent failure",
                prompt: "An unknown failure occurred. Perform a deep log analysis to identify the root cause.",
                priority: "medium"
            });
    }

    return chain;
}

module.exports = {
    deriveRecoveryChain
};
