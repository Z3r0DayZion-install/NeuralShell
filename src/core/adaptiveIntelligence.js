// const fs = require("fs");
// const path = require("path");
// // const { ACTION_REGISTRY } = require("./actionRegistry");
// const actionOutcomeStore = require("./actionOutcomeStore");
const crossChainCoordinator = require("./crossChainCoordinator");

/**
 * NeuralShell Adaptive Intelligence Module
 * Provides failure anticipation, urgency ranking, and strategic rationales.
 */

const URGENCY_TTL = 1000; // 1 second
const urgencyCache = new Map();

/**
 * Calculates a workspace urgency score (0-100).
 * @param {string} workspacePath 
 * @param {object} intelligence Project intelligence snapshot
 * @param {object} actionStatus Current action state from executionEngine
 * @returns {number} Urgency score
 */
function analyzeUrgency(workspacePath, intelligence, actionStatus = {}) {
    // Wave 14B: Performance - check cache
    const cached = urgencyCache.get(workspacePath);
    if (cached && (Date.now() - cached.timestamp < URGENCY_TTL)) {
        return cached.score;
    }

    let score = 0;

    // 1. Critical Failures (Major urgency)
    const hasFailedAction = Object.keys(actionStatus).some(id =>
        id.startsWith(workspacePath) && actionStatus[id].status === "failed"
    );
    if (hasFailedAction) score += 60;

    // 2. Human-in-the-loop Blocks (High urgency)
    const isAwaitingInput = Object.keys(actionStatus).some(id =>
        id.startsWith(workspacePath) && actionStatus[id].status === "awaiting_input"
    );
    if (isAwaitingInput) score += 80;

    // 3. Environmental Friction (Medium urgency)
    if (intelligence.techStack && intelligence.techStack.includes("node")) {
        const hasNodeModules = fs.existsSync(path.join(workspacePath, "node_modules"));
        if (!hasNodeModules && intelligence.health && intelligence.health.hasPackageJson) {
            score += 30; // Missing dependencies
        }
    }

    if (intelligence.health && !intelligence.health.hasGit) {
        score += 10; // No source control (drift risk)
    }

    // 4. Activity (Low urgency boost)
    const isActive = Object.keys(actionStatus).some(id =>
        id.startsWith(workspacePath) && actionStatus[id].status === "running"
    );
    if (isActive) score += 20;

    // 5. Cross-Chain Coordination (Wave 13C/14D)
    const linkedSignals = crossChainCoordinator.getSignals(workspacePath, { actions: actionStatus, chains: {} });
    for (const signal of linkedSignals) {
        if (signal.type === "linked_failure") {
            score += 40; // Escalation due to failure in related area
        } else if (signal.type === "linked_conflict") {
            score += 50; // High urgency: sibling is in a sensitive state
        } else if (signal.type === "linked_drift") {
            score += 20; // Medium urgency: sibling has uncommitted code
        } else if (signal.type === "linked_activity") {
            score += 10; // Contextual awareness
        }
    }

    const finalScore = Math.min(100, score);
    urgencyCache.set(workspacePath, { score: finalScore, timestamp: Date.now() });
    return finalScore;
}

/**
 * Wave 15C: Analyzes behavioral anomaly risk (0-100).
 */
function analyzeAnomalyRisk(workspacePath, intelligence, outcomes = []) {
    let risk = 0;

    // 1. Failure Trend Anomaly
    const recent = outcomes.filter(o => o.workspacePath === workspacePath).slice(-5);
    if (recent.length >= 3) {
        const failureCount = recent.filter(o => !o.ok).length;
        if (failureCount / recent.length > 0.5) {
            risk += 40; // High failure density is an anomaly
        }
    }

    // 2. Intelligence Drift Anomaly
    if (intelligence.health && intelligence.health.driftScale > 0.7) {
        risk += 30; // High drift in a stable repo is anomalous
    }

    // 3. Coordination Anomaly
    const signals = crossChainCoordinator.getSignals(workspacePath, { actions: {}, chains: {} });
    const conflictSignals = signals.filter(s => s.type === "linked_conflict");
    if (conflictSignals.length > 2) {
        risk += 30; // Multi-point conflict linkage is anomalous
    }

    return Math.min(100, risk);
}

/**
 * Predicts if an action is likely to fail based on environment signals.
 * @param {string} actionId 
 * @param {string} workspacePath 
 * @param {object} intelligence 
 * @returns {object|null} Blocked status or null
 */
function predictFailure(actionId, workspacePath, intelligence) {
    // Rule: npm install/audit fails without package.json
    if ((actionId === "audit_package" || actionId === "install_deps") && intelligence.health && !intelligence.health.hasPackageJson) {
        return {
            blocked: true,
            reason: "package.json missing in workspace root.",
            recommendation: "Run initialization or verify project structure."
        };
    }

    // Rule: Git actions fail without .git
    if (actionId === "review_uncommitted" && intelligence.health && !intelligence.health.hasGit) {
        return {
            blocked: true,
            reason: "Git repository not initialized.",
            recommendation: "Run 'git init' or attach a valid git root."
        };
    }

    // Rule: Lock-file contention
    if (actionId === "install_deps") {
        const lockFile = path.join(workspacePath, "package-lock.json");
        if (fs.existsSync(lockFile)) {
            try {
                // Check if lockfile is being modified (simplistic check for this demo)
                const stat = fs.statSync(lockFile);
                const ageSec = (Date.now() - stat.mtimeMs) / 1000;
                if (ageSec < 5) { // If modified in last 5 seconds, might be an active install
                    return {
                        blocked: true,
                        reason: "Contention detected: package-lock.json was recently modified.",
                        recommendation: "Wait for background processes to finish."
                    };
                }
            } catch (_e) {
                // Ignore stat errors for missing lockfiles
            }
        }
    }

    return null;
}

/**
 * Generates a strategic rationale for an action.
 */
function getStrategicRationale(actionId, workspacePath, outcomes = []) {
    const actionHistory = outcomes.filter(o => o.id === actionId);
    if (!actionHistory.length) return "Initial capability exploration.";

    const lastOne = actionHistory[actionHistory.length - 1];
    if (!lastOne.ok) {
        return `Recovery required following failure at ${new Date(lastOne.timestamp).toLocaleTimeString()}.`;
    }

    return `Standard verification following ${actionHistory.length} successful iterations.`;
}

module.exports = {
    analyzeUrgency,
    analyzeAnomalyRisk,
    predictFailure,
    getStrategicRationale
};
