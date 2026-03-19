const fs = require("fs");
const path = require("path");
const actionOutcomeStore = require("./actionOutcomeStore");
const { deriveRecoveryChain } = require("./recoveryEngine");
const workflowMemory = require("./workflowMemory");
const adaptiveIntelligence = require("./adaptiveIntelligence");

/**
 * NeuralShell Project Intelligence Broker
 * Handles deep workspace inference, action ranking, and situational guidance.
 */

const INTELLIGENCE_TTL = 5000; // 5 seconds
const intelligenceCache = new Map();

function analyzeProject(rootPath) {
    const normalizedRoot = path.resolve(String(rootPath || "").trim());

    // Wave 14B: Performance - check cache
    const cached = intelligenceCache.get(normalizedRoot);
    if (cached && (Date.now() - cached.timestamp < INTELLIGENCE_TTL)) {
        return cached.data;
    }
    if (!fs.existsSync(normalizedRoot) || !fs.statSync(normalizedRoot).isDirectory()) {
        return { ok: false, reason: "Invalid root path" };
    }

    const result = {
        ok: true,
        rootPath: normalizedRoot,
        techStack: [],
        health: {
            hasReadme: false,
            hasPackageJson: false,
            hasGit: false,
            docsCount: 0,
            scriptsCount: 0
        },
        signals: [],
        lowConfidence: false,
        urgency: 0
    };

    try {
        const entries = fs.readdirSync(normalizedRoot, { withFileTypes: true });
        const fileNames = new Set(entries.filter(e => e.isFile()).map(e => e.name));
        const dirNames = new Set(entries.filter(e => e.isDirectory()).map(e => e.name));

        // Basic Health
        result.health.hasPackageJson = fileNames.has("package.json");
        result.health.hasGit = dirNames.has(".git");
        result.health.hasReadme = Array.from(fileNames).some(n => /^readme(\.[^.]+)?$/i.test(n));

        if (result.health.hasPackageJson) {
            const pkgPath = path.join(normalizedRoot, "package.json");
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

            if (deps.electron) result.techStack.push("electron");
            if (deps.playwright) result.techStack.push("playwright");
            if (deps.vitest || deps.jest) result.techStack.push("testing");
            if (deps.typescript) result.techStack.push("typescript");
            if (deps.tailwindcss) result.techStack.push("tailwind");

            if (pkg.scripts) {
                result.health.scriptsCount = Object.keys(pkg.scripts).length;
            }
        }

        const docsPath = path.join(normalizedRoot, "docs");
        if (dirNames.has("docs") && fs.existsSync(docsPath)) {
            result.health.docsCount = fs.readdirSync(docsPath).filter(f => /\.(md|txt)$/i.test(f)).length;
        }

        // Build overall signals list (Wave 2 compatibility + enhancements)
        if (result.health.hasPackageJson) result.signals.push("node");
        if (result.health.hasGit) result.signals.push("git");
        result.techStack.forEach(t => result.signals.push(t));

        if (result.signals.length < 2) {
            result.lowConfidence = true;
        }

    } catch (err) {
        result.ok = false;
        result.reason = err.message;
    }

    intelligenceCache.set(normalizedRoot, { data: result, timestamp: Date.now() });
    return result;
}

function analyzeUrgency(rootPath, intelligence, actionStatus = {}) {
    return adaptiveIntelligence.analyzeUrgency(rootPath, intelligence, actionStatus);
}

function rankActions(intelligence, workflowId, sessionHistory = []) {
    const actions = [];
    const signals = new Set(intelligence.signals || []);

    // 1. Framework Specific Actions
    if (signals.has("playwright")) {
        actions.push({
            id: "run_e2e",
            label: "Run E2E Smoke Test",
            prompt: "Execute all Playwright smoke tests and verify the golden flows.",
            score: 80,
            reason: "Playwright detected in devDependencies."
        });
    }

    if (signals.has("node")) {
        actions.push({
            id: "audit_package",
            label: "Audit package.json",
            prompt: "Perform a deep audit of the package.json and identify any outdated or unvouched dependencies.",
            score: 60,
            reason: "Node.js project detected."
        });
    }

    if (signals.has("git")) {
        actions.push({
            id: "review_uncommitted",
            label: "Review uncommitted",
            prompt: "Analyze the current git diff and summarize uncommitted changes for a potential local drift record.",
            score: 55,
            reason: "Git repository detected."
        });
    }

    // 2. Situational Adjustments (Workflow Context)
    if (workflowId === "shipping_audit") {
        actions.forEach(a => {
            if (a.id === "audit_package") a.score += 30;
        });
        actions.push({
            id: "verify_build",
            label: "Verify build scripts",
            prompt: "Analyze the build scripts and verify that the local environment is ready for a production-grade build.",
            score: 85,
            reason: "High priority for shipping audits."
        });
    }

    // 3. Situational Adjustments (Session History)
    const lastInteraction = sessionHistory[sessionHistory.length - 1];
    if (lastInteraction && lastInteraction.role === "assistant" && lastInteraction.content.toLowerCase().includes("failed")) {
        actions.push({
            id: "debug_failure",
            label: "Debug recent failure",
            prompt: "Review the logs from the last failed execution and propose a root cause analysis.",
            score: 95,
            reason: "Last interaction indicated a failure state."
        });
    }

    // 4. Learning from Outcomes (Wave 3)
    const outcomes = actionOutcomeStore.getHistory();
    actions.forEach(a => {
        const actionOutcomes = outcomes.filter(o => o.id === a.id);
        if (actionOutcomes.length) {
            const lastOne = actionOutcomes[actionOutcomes.length - 1];
            if (lastOne.ok) {
                // Diminish urgency if recently succeeded
                a.score -= 10;
                a.reason += " (Last run succeeded)";
            } else {
                // Boost urgency if recently failed
                a.score += 20;
                a.reason += " (Last run failed)";
            }
        }
    });

    // 5. Recovery Chains (Wave 4)
    if (outcomes.length) {
        const lastOne = outcomes[outcomes.length - 1];
        if (!lastOne.ok) {
            const chain = deriveRecoveryChain(lastOne);
            if (chain && chain.recommendations) {
                for (const rec of chain.recommendations) {
                    actions.push({
                        id: rec.id,
                        label: rec.label,
                        prompt: rec.prompt,
                        score: rec.priority === "high" ? 98 : 90,
                        reason: `Recovery: ${chain.reason}`
                    });
                }
            }
        }
    }

    // 6. Workflow Memory Boosts (Phase 11C)
    const memoryBoosts = workflowMemory.getRecoveryBoosts(intelligence);
    actions.forEach(a => {
        if (memoryBoosts[a.id]) {
            a.score += memoryBoosts[a.id];
            a.reason += ` (Boosted by prior recovery success)`;
        }

        const suggestions = workflowMemory.getSuggestions(a.id, intelligence);
        if (suggestions && suggestions.confidence > 0.5) {
            a.score += 15;
            a.reason += ` (Recommended from history)`;
            a.historyStats = suggestions.stats;
            a.historyRationale = suggestions.rationale;
        }
    });

    // 7. Low Confidence Cap (Phase 10B)
    if (intelligence.lowConfidence) {
        actions.forEach(a => {
            if (a.score > 40) a.score = 40;
            a.reason = "Low Confidence: " + a.reason;
        });
    }

    // 8. Failure Anticipation (Wave 12B)
    actions.forEach(a => {
        const prediction = adaptiveIntelligence.predictFailure(a.id, intelligence.rootPath, intelligence);
        if (prediction) {
            a.predictedBlocker = prediction;
            a.score -= 40; // Deprioritize predicted failures
            a.reason = `⚠️ Predicted Failure: ${prediction.reason} (${a.reason})`;
        }

        // Enhance rationale
        a.strategicRationale = adaptiveIntelligence.getStrategicRationale(a.id, intelligence.rootPath, outcomes);
    });

    // Sort by score
    return actions.sort((a, b) => b.score - a.score);
}

module.exports = {
    analyzeProject,
    rankActions,
    analyzeUrgency
};
