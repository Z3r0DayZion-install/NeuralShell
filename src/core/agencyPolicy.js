const fs = require('fs');
const path = require('path');
const { ACTION_RISK } = require("./actionRegistry");

/**
 * Wave 14C: Strategic Policy Tiers
 */
const RISK_TIERS = {
    SAFE: "safe",       // Auto-run permitted
    ADVISORY: "advisory", // Requires explicit ACK for the first run in a session
    HIGH_RISK: "high_risk" // Always requires approval
};

/**
 * Wave 15B: Hot-Reloadable Policy
 */
const POLICY_PATH = path.join(__dirname, "../../agencyPolicy.json");

let AGENCY_POLICY = {
    defaultAutoRun: {
        [ACTION_RISK.SAFE]: true,
        [ACTION_RISK.MEDIUM]: false,
        [ACTION_RISK.HIGH]: false
    },
    constraints: {
        dirtyTreeScaleDown: true,
        lowConfidenceScaleDown: true,
        maxAnomalyRisk: 50 // Wave 15C: Max risk before auto-run is suppressed
    }
};

function loadPolicy() {
    try {
        if (fs.existsSync(POLICY_PATH)) {
            const data = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));
            AGENCY_POLICY = {
                defaultAutoRun: {
                    [ACTION_RISK.SAFE]: data.defaultAutoRun.safe,
                    [ACTION_RISK.MEDIUM]: data.defaultAutoRun.medium,
                    [ACTION_RISK.HIGH]: data.defaultAutoRun.high
                },
                constraints: data.constraints || {}
            };
            process.stdout.write(`[POLICY] Hot-reloaded strategic rules from ${POLICY_PATH}\n`);
        }
    } catch (err) {
        process.stderr.write(`[POLICY] Failed to reload policy: ${err.message}\n`);
    }
}

// Initial Load
loadPolicy();

// Wave 15B: File Watcher - Disabled for files inside ASAR (read-only archive)
if (fs.existsSync(POLICY_PATH) && !POLICY_PATH.includes("app.asar")) {
    fs.watch(POLICY_PATH, (event) => {
        if (event === 'change') loadPolicy();
    });
}

/**
 * Checks if an action is permitted to auto-run under the current policy.
 * @param {string} actionId 
 * @param {object} context 
 * @returns {boolean}
 */
function isAutoRunPermitted(actionId, context = {}) {
    // 1. Check for manual operator override in context
    if (context.forceApproval === true) return false;
    if (context.forceAutoRun === true) return true;

    const { ACTION_REGISTRY } = require("./actionRegistry");
    const adaptiveIntelligence = require("./adaptiveIntelligence");
    const actionDef = ACTION_REGISTRY[actionId];
    if (!actionDef) return false;

    // 2. Wave 15C: Check for anomaly risk
    const normalizedRoot = context.workspacePath ? path.resolve(context.workspacePath) : null;
    if (normalizedRoot && AGENCY_POLICY.constraints.maxAnomalyRisk) {
        const anomalyRisk = adaptiveIntelligence.analyzeAnomalyRisk(normalizedRoot, context.intelligence || {}, context.outcomes || []);
        if (anomalyRisk > AGENCY_POLICY.constraints.maxAnomalyRisk) {
            return false; // Suppress auto-run if system behavior is anomalous
        }
    }

    // 3. Wave 14C: Check for environmental constraints
    if (AGENCY_POLICY.constraints.dirtyTreeScaleDown && context.intelligence && context.intelligence.signals) {
        if (context.intelligence.signals.includes("dirty_tree") && actionDef.risk !== ACTION_RISK.SAFE) {
            return false; // Force approval if tree is dirty and action is not safe
        }
    }

    // 3. Fallback to default risk-based policy
    return AGENCY_POLICY.defaultAutoRun[actionDef.risk] || false;
}

/**
 * Returns a human-readable rationale for a policy decision.
 */
function getPolicyRationale(actionId, context = {}) {
    const { ACTION_REGISTRY } = require("./actionRegistry");
    const actionDef = ACTION_REGISTRY[actionId];
    if (!actionDef) return "Unknown action.";

    const autoRun = isAutoRunPermitted(actionId, context);
    if (autoRun) return "Action classified as safe for autonomous execution.";

    if (context.intelligence && context.intelligence.signals && context.intelligence.signals.includes("dirty_tree") && actionDef.risk !== ACTION_RISK.SAFE) {
        return "Gated: Local workspace has uncommitted changes. Manual verification required.";
    }

    if (actionDef.risk === ACTION_RISK.HIGH) {
        return "Gated: Action carries high system risk (potential data mutation or irreversible change).";
    }

    return "Gated: Requires operator acknowledgment for session baseline.";
}

module.exports = {
    isAutoRunPermitted,
    getPolicyRationale,
    AGENCY_POLICY,
    RISK_TIERS
};
