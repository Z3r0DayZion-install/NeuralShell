/**
 * NeuralShell Chain Planner
 * Proposes and assembles multi-step action sequences based on workspace signals and triggers.
 */

const { isAutoRunPermitted, getPolicyRationale } = require("./agencyPolicy");
const adaptiveIntelligence = require("./adaptiveIntelligence");
const workflowMemory = require("./workflowMemory");
const contextualEvolution = require("./contextualEvolution");
const diagnosticsLedger = require("./diagnosticsLedger");

const CHAIN_TEMPLATES = {
    "audit_and_review": {
        id: "audit_and_review",
        title: "Standard Audit & Review",
        trigger: "manual",
        steps: [
            {
                actionId: "audit_package",
                label: "Audit dependencies",
                rationale: "Discover potential security and health issues in package.json."
            },
            {
                actionId: "review_uncommitted",
                label: "Review uncommitted changes",
                rationale: "Classify existing drift before proposing fixes.",
                autoRun: true
            }
        ]
    },
    "preflight_recovery": {
        id: "preflight_recovery",
        title: "Preflight Recovery: Dirty Tree",
        trigger: "git_dirty_block",
        steps: [
            {
                actionId: "review_uncommitted",
                label: "Review uncommitted changes",
                rationale: "A dirty git tree blocked a restricted action. Reviewing changes to assess safety."
            }
        ]
    },
    "build_quality_gate": {
        id: "build_quality_gate",
        title: "Build & Quality Gate",
        trigger: "manual",
        steps: [
            {
                actionId: "verify_build",
                label: "Verify local build",
                rationale: "Ensuring codebase builds before executing tests."
            },
            {
                actionId: "run_e2e",
                label: "Execute E2E smoke tests",
                rationale: "Full integrity check of the current branch."
            }
        ]
    }
};

/**
 * Proposes potential chains for a workspace based on its current state.
 * @param {string} workspacePath 
 * @param {object} intelligence 
 * @returns {Array}
 */
function proposeChains(workspacePath, intelligence = {}) {
    const proposals = [];

    // Wave 14A: Suppress proposals if an active chain already exists for this workspace
    const executionEngine = require("./executionEngine");
    const activeChainId = Array.from(executionEngine.activeChains.keys()).find(k => k.startsWith(workspacePath));
    if (activeChainId) {
        const chain = executionEngine.activeChains.get(activeChainId);
        if (chain.status === "running" || chain.status === "paused") {
            diagnosticsLedger.log(workspacePath, "SUPPRESSION", activeChainId, `Skipping new proposals while ${chain.title} is active.`);
            return []; // Skip proposals while busy
        }
    }

    // 1. Always offer the Standard Audit chain
    proposals.push(assembleChain("audit_and_review", workspacePath, intelligence));

    // 2. If git tree is likely dirty, offer recovery
    if (intelligence.signals && intelligence.signals.dirty_tree) {
        proposals.push(assembleChain("preflight_recovery", workspacePath, intelligence));
    }

    // 3. If workspace has build scripts, offer quality gate
    if (intelligence.capabilities && intelligence.capabilities.has_build_script) {
        proposals.push(assembleChain("build_quality_gate", workspacePath, intelligence));
    }
    // Wave 12B: Add urgency to proposals
    // Wave 13A: Add memory-based suggestions and weighting
    return proposals.filter(Boolean).map(chain => {
        chain.urgency = intelligence.urgency || 0;

        const memory = workflowMemory.getChainSuggestions(chain.templateId, intelligence);
        if (memory) {
            chain.memory = memory;
            // Boost urgency or add rationale if success is high
            if (memory.successRate > 0.8) {
                chain.urgency = Math.min(100, chain.urgency + 20);
            }
        }

        return chain;
    });
}

/**
 * Assembles a full chain object from a template and workspace path.
 * @param {string} templateId 
 * @param {string} workspacePath 
 * @param {object} intelligence
 * @returns {object}
 */
function assembleChain(templateId, workspacePath, intelligence = {}) {
    const template = CHAIN_TEMPLATES[templateId];
    if (!template) return null;

    // Wave 13B: Standardize profile for evolution
    const profile = workflowMemory._deriveProfile(intelligence);

    const chain = {
        id: `${templateId}_${Date.now()}`,
        templateId,
        title: template.title,
        workspacePath,
        trigger: template.trigger,
        steps: template.steps.map(s => {
            const prediction = adaptiveIntelligence.predictFailure(s.actionId, workspacePath, intelligence);
            const policyContext = { intelligence, rootPath: workspacePath };

            // Wave 13B: Apply contextual evolution
            const evolved = contextualEvolution.evolveAction(s, profile);

            return {
                ...s,
                ...evolved,
                status: "pending",
                autoRun: s.autoRun !== undefined ? s.autoRun : (prediction ? false : isAutoRunPermitted(s.actionId, policyContext)),
                policyRationale: getPolicyRationale(s.actionId, policyContext),
                predictedBlocker: prediction
            };
        }),
        currentStepIndex: 0,
        status: "idle",
        startedAt: null,
        completedAt: null,
        outcome: null
    };

    diagnosticsLedger.log(workspacePath, "PROPOSAL", templateId, `Assembled ${chain.steps.length}-step sequence.`);
    return chain;
}

module.exports = {
    proposeChains,
    assembleChain,
    CHAIN_TEMPLATES
};
