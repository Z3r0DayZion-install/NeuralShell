/**
 * NeuralShell Action Registry
 * Canonical definitions for orchestration-capable actions.
 */

const ACTION_RISK = {
    SAFE: "safe",
    MEDIUM: "medium",
    HIGH: "high"
};

const ACTION_REGISTRY = {
    "audit_package": {
        id: "audit_package",
        label: "Audit package.json",
        description: "Deep audit of dependencies and scripts for security and health.",
        risk: ACTION_RISK.SAFE,
        preflight: ["has_workspace", "has_package_json"]
    },
    "run_e2e": {
        id: "run_e2e",
        label: "Run E2E Smoke Test",
        description: "Execute all Playwright smoke tests and verify the golden flows.",
        risk: ACTION_RISK.MEDIUM,
        preflight: ["has_workspace", "has_playwright", "has_node_modules"]
    },
    "review_uncommitted": {
        id: "review_uncommitted",
        label: "Review uncommitted",
        description: "Summarize and classify local git changes for drift detection.",
        risk: ACTION_RISK.SAFE,
        preflight: ["has_workspace", "has_git", "is_git_clean"]
    },
    "verify_build": {
        id: "verify_build",
        label: "Verify local build",
        description: "Run build scripts and verify integrity of the output.",
        risk: ACTION_RISK.MEDIUM,
        preflight: ["has_workspace", "has_package_json", "has_build_script"]
    },
    "debug_failure": {
        id: "debug_failure",
        label: "Debug recent failure",
        description: "Analyze core logs from the last failed session execution.",
        risk: ACTION_RISK.SAFE,
        preflight: ["has_session_history"]
    }
};

module.exports = {
    ACTION_REGISTRY,
    ACTION_RISK
};
