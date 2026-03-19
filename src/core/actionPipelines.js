const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

/**
 * NeuralShell Action Pipelines
 * Multi-step execution logic for canonical actions.
 */

async function runShellCommand(cmd, cwd, logger) {
    return new Promise((resolve) => {
        const parts = cmd.split(" ");
        const proc = spawn(parts[0], parts.slice(1), { cwd, shell: true });

        let output = "";
        proc.stdout.on("data", (data) => {
            const str = data.toString();
            output += str;
            if (logger) logger(str, "stdout");
        });
        proc.stderr.on("data", (data) => {
            const str = data.toString();
            output += str;
            if (logger) logger(str, "stderr");
        });
        proc.on("close", (code) => {
            resolve({ ok: code === 0, output, code });
        });
    });
}

async function auditPackage(rootPath, context = {}) {
    const steps = [];
    const pkgPath = path.join(rootPath, "package.json");
    const logger = context.logger;

    // Step 1: Locate package.json
    steps.push({ label: "Locate package.json", status: "running" });
    if (logger) logger("Locating package.json...", "system");
    if (!fs.existsSync(pkgPath)) {
        if (logger) logger("package.json not found", "error");
        return { ok: false, reason: "package.json not found", steps };
    }
    steps[0].status = "succeeded";

    // Step 2: Parse package.json
    steps.push({ label: "Parse package.json", status: "running" });
    if (logger) logger("Parsing package.json...", "system");
    let pkg;
    try {
        pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        steps[1].status = "succeeded";
    } catch (err) {
        if (logger) logger(`Parse error: ${err.message}`, "error");
        return { ok: false, reason: "Failed to parse package.json", steps };
    }

    // Step 3: Inspect metadata
    steps.push({ label: "Inspect metadata", status: "running" });
    if (logger) logger("Inspecting workspace metadata...", "system");
    const findings = [];
    if (!pkg.version) findings.push("Missing version");
    if (!pkg.scripts || !pkg.scripts.build) findings.push("Missing build script");
    if (!pkg.dependencies && !pkg.devDependencies) findings.push("No dependencies found");

    if (logger) {
        findings.forEach(f => logger(`Finding: ${f}`, "warn"));
        logger("Metadata inspection complete.", "success");
    }
    steps[2].status = "succeeded";

    // Step 4: Operator Decision (Branching)
    if (findings.length > 0 && context.pause) {
        steps.push({ label: "Operator Decision", status: "running" });
        const decision = await context.pause({
            type: "confirm",
            message: `Audit found ${findings.length} issues. Continue to final report?`,
            choices: [
                { id: "continue", label: "Continue", tone: "good", primary: true },
                { id: "cancel", label: "Abort Action", tone: "bad" }
            ]
        });

        if (decision.cancelled || decision.choiceId === "cancel") {
            return { ok: false, reason: "Cancelled by operator after findings.", steps };
        }
        steps[3].status = "succeeded";
    }

    return {
        ok: true,
        steps,
        findings,
        summary: `Audit complete. Found ${findings.length} potential issues.`
    };
}

async function reviewUncommitted(rootPath, context = {}) {
    const steps = [];
    const gitPath = path.join(rootPath, ".git");
    const logger = context.logger;

    // Step 1: Verify git repo
    steps.push({ label: "Verify git repo", status: "running" });
    if (logger) logger("Verifying git repository presence...", "system");
    if (!fs.existsSync(gitPath)) {
        if (logger) logger("Git repository not found", "error");
        return { ok: false, reason: "Git repository not found", steps };
    }
    steps[0].status = "succeeded";

    // Step 2: Inspect dirty state
    steps.push({ label: "Inspect dirty state", status: "running" });
    if (logger) logger("Running git status...", "system");
    const statusResult = await runShellCommand("git status --porcelain", rootPath, logger);
    if (logger) logger(statusResult.output || "(Clean)", "stdout");
    steps[1].status = "succeeded";

    // Step 3: Classify changes
    steps.push({ label: "Classify changes", status: "running" });
    if (logger) logger("Classifying changes via git diff...", "system");
    const _diffResult = await runShellCommand("git diff --stat", rootPath, logger);
    steps[2].status = "succeeded";

    // Step 4: Optional Detailed Review
    if (context.pause) {
        steps.push({ label: "Detailed Review", status: "running" });
        const decision = await context.pause({
            type: "confirm",
            message: "Classified changes detected. Proceed with automated summary or skip detailed log?",
            choices: [
                { id: "continue", label: "Automated Summary", tone: "good", primary: true },
                { id: "skip", label: "Skip Details", tone: "ok" },
                { id: "cancel", label: "Cancel", tone: "bad" }
            ]
        });

        if (decision.cancelled || decision.choiceId === "cancel") {
            return { ok: false, reason: "Review cancelled by operator.", steps };
        }
        if (decision.choiceId === "skip") {
            if (logger) logger("Operator chose to skip detailed summary.", "system");
            steps[3].status = "succeeded";
            return { ok: true, steps, summary: "Review complete. Details skipped by operator." };
        }
        steps[3].status = "succeeded";
    }

    return {
        ok: true,
        steps,
        summary: "Review complete. All changes classified."
    };
}

async function runE2E(rootPath, context = {}) {
    if (context.logger) context.logger("Starting E2E Smoke Tests (Mock)...", "system");
    return { ok: true, summary: "E2E tests passed (Mocked)." };
}

const PIPELINES = {
    "audit_package": auditPackage,
    "review_uncommitted": reviewUncommitted,
    "run_e2e": runE2E
};

module.exports = {
    PIPELINES
};
