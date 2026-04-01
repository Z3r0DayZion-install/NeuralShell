/**
 * NeuralShell Contextual Action Evolution
 * Adapts action metadata, prompts, and parameters to specific workspace conventions.
 */

const EVOLUTION_RULES = [
    {
        id: "electron_specialization",
        match: (profile) => profile.techStack.includes("electron"),
        evolve: (action) => {
            if (action.actionId === "audit_package") {
                return {
                    label: "Electron Security Audit",
                    rationale: "Deep-scanning Electron-specific dependency risks and native module health.",
                    prompt: "Perform security audit with --production and check for common Electron vulnerabilities."
                };
            }
            return null;
        }
    },
    {
        id: "git_conservative",
        match: (profile) => !profile.signals.includes("has_git") || profile.lowConfidence,
        evolve: (action) => {
            if (action.actionId === "review_uncommitted") {
                return {
                    label: "Safe Scope Review",
                    rationale: "Weak project signals detected. Restricting review to immediate file drift.",
                    prompt: "Summarize changes in current directory only, focusing on high-risk drift."
                };
            }
            return null;
        }
    },
    {
        id: "node_heavy",
        match: (profile) => profile.techStack.includes("node") && profile.techStack.length === 1,
        evolve: (action) => {
            if (action.actionId === "verify_build") {
                return {
                    label: "Node.js Environment Check",
                    rationale: "Generic Node.js environment detected. Verifying scripts and engine compatibility.",
                    prompt: "Check npm scripts for 'build' or 'start' and verify Node.js version alignment."
                };
            }
            return null;
        }
    }
];

/**
 * Evolves an action definition based on the workspace profile.
 * @param {object} action Standard action definition
 * @param {object} profile Workspace profile from workflowMemory
 * @returns {object} Tuned action properties
 */
function evolveAction(action, profile) {
    let adjustments = {
        label: action.label,
        rationale: action.rationale,
        prompt: action.prompt,
        tuningRationale: ""
    };

    for (const rule of EVOLUTION_RULES) {
        if (rule.match(profile)) {
            const result = rule.evolve(action);
            if (result) {
                adjustments = { ...adjustments, ...result };
                adjustments.tuningRationale = (adjustments.tuningRationale || "") + ` [${rule.id}]`;
            }
        }
    }

    return adjustments;
}

module.exports = {
    evolveAction
};
