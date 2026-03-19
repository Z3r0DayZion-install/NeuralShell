const path = require("path");
const fs = require("fs");
const { PIPELINES } = require("./actionPipelines");
const actionRegistry = require("./actionRegistry");
const preflight = require("./preflight");
const diagnosticsLedger = require("./diagnosticsLedger");
const actionOutcomeStore = require("./actionOutcomeStore");
const workflowMemory = require("./workflowMemory");
const { analyzeProject } = require("./projectIntelligence");
const { isAutoRunPermitted, getPolicyRationale } = require("./agencyPolicy");
const kernelRepair = require("./kernelRepair");

/**
 * NeuralShell Execution Engine
 * Manages action status transitions, preflight checks, and pipeline execution.
 */
class ExecutionEngine {
    constructor() {
        this.activeActions = new Map(); // Key: workspacePath:actionId
        this.activeChains = new Map();  // Key: workspacePath:chainId
        this.interactionResolvers = new Map(); // Key: workspacePath:actionId
        this.onStateChange = null;
        this.onLog = null;
        this.onInteraction = null;

        // Wave 14A: Reliability Hardening
        this.CHAIN_TIMEOUT_MS = 1000 * 60 * 30; // 30 minutes
        this.WORKLOAD_HEARTBEAT_MS = 1000 * 60; // 1 minute
        this.heartbeatInterval = setInterval(() => this._reapStaleWorkloads(), this.WORKLOAD_HEARTBEAT_MS);
    }

    _reapStaleWorkloads() {
        const now = Date.now();
        // 1. Reap Actions
        for (const [id, state] of this.activeActions.entries()) {
            if (state.status === "running" && state.startedAt && (now - state.startedAt > this.CHAIN_TIMEOUT_MS)) {
                this.log(state.id, "Action timed out after 30 minutes of inactivity.", "error", state.workspacePath);
                diagnosticsLedger.log(state.workspacePath, "CLEANUP", state.id, "Action timed out after 30 minutes of inactivity.");
                state.status = "failed";
                state.result = { ok: false, reason: "Inactivity timeout" };
                state.completedAt = now;
            }
        }

        // 2. Reap Chains
        for (const [id, state] of this.activeChains.entries()) {
            const lastTouch = state.lastHeartbeat || state.startedAt || now;
            if (state.status === "running" && (now - lastTouch > this.CHAIN_TIMEOUT_MS)) {
                this.log(state.id, "Chain timed out after 30 minutes of inactivity.", "error", state.workspacePath);
                diagnosticsLedger.log(state.workspacePath, "CLEANUP", state.id, "Chain timed out after 30 minutes of inactivity.");
                state.status = "failed";
                state.outcome = "Inactivity timeout";
                state.completedAt = now;
            }
        }
        this.notifyChange();
    }

    restoreState(savedState) {
        if (!savedState || typeof savedState !== 'object') return;

        // Restore Actions
        if (savedState.actions) {
            for (const [id, state] of Object.entries(savedState.actions)) {
                this.activeActions.set(id, state);
            }
        }

        // Restore Chains
        if (savedState.chains) {
            for (const [id, state] of Object.entries(savedState.chains)) {
                // Chains don't restore running status automatically (safety)
                if (state.status === "running") {
                    state.status = "paused";
                    state.outcome = "System restart detected. Sequence paused for safety.";
                }
                this.activeChains.set(id, state);
            }
        }
        this.notifyChange();
    }

    notifyChange() {
        if (this.onStateChange) {
            const actions = {};
            for (const [id, state] of this.activeActions.entries()) {
                actions[id] = state;
            }

            const chains = {};
            for (const [id, state] of this.activeChains.entries()) {
                chains[id] = state;
            }

            this.onStateChange({ actions, chains });
        }
    }

    log(actionId, message, type = "info", workspacePath = null) {
        if (this.onLog) {
            const normalizedRoot = workspacePath ? path.resolve(workspacePath) : null;
            const fullId = normalizedRoot ? `${normalizedRoot}:${actionId}` : actionId;
            const state = this.activeActions.get(fullId);
            const wsPath = normalizedRoot || (state ? state.workspacePath : null);
            this.onLog({ actionId: fullId, message, type, workspacePath: wsPath, timestamp: Date.now() });
        }
    }

    async pause(actionId, request, workspacePath) {
        const fullId = `${workspacePath}:${actionId}`;
        const state = this.activeActions.get(fullId) || this.activeActions.get(actionId);
        if (!state) throw new Error(`Action ${actionId} not found.`);

        state.status = "awaiting_input";
        state.interactionRequest = request;
        state.message = "Operator acknowledgment required.";
        diagnosticsLedger.log(state.workspacePath, "GATE", actionId, `Pipeline paused: ${request.message}`);
        this.notifyChange();

        this.log(actionId, `Pipeline paused: ${request.message}`, "warn", state.workspacePath);

        // Fetch historical suggestions (Phase 11C)
        const suggestions = workflowMemory.getSuggestions(actionId, state.context || {});
        if (suggestions) {
            request.suggestions = suggestions;
        }

        if (this.onInteraction) {
            this.onInteraction({ actionId: fullId, request, workspacePath: state.workspacePath });
        }

        return new Promise((resolve) => {
            this.interactionResolvers.set(fullId, resolve);
        });
    }

    submitResponse(actionId, response, workspacePath) {
        const normalizedRoot = workspacePath ? path.resolve(workspacePath) : null;
        const fullId = normalizedRoot ? `${normalizedRoot}:${actionId}` : actionId;
        const resolver = this.interactionResolvers.get(fullId);

        if (!resolver) {
            return { ok: false, reason: "No active interaction request for this action." };
        }

        const state = this.activeActions.get(fullId);
        if (state) {
            state.status = "running";
            state.interactionRequest = null;
            state.message = null; // Clear message after interaction
            this.notifyChange();
        }

        this.interactionResolvers.delete(fullId);

        // Record decision in memory (Phase 11C)
        if (response && response.choiceId && state) {
            workflowMemory.recordDecision(actionId, state.context || {}, response.choiceId);
        }

        resolver(response);
        return { ok: true };
    }

    async runAction(actionId, rootPath, context = {}) {
        let normalizedRoot = rootPath;
        let finalContext = context;
        if (typeof rootPath === 'object') {
            finalContext = rootPath;
            normalizedRoot = finalContext.rootPath;
        }
        normalizedRoot = path.resolve(String(normalizedRoot || "").trim());

        const actionDef = actionRegistry.ACTION_REGISTRY[actionId];
        if (!actionDef) {
            return { ok: false, reason: `Action ${actionId} not found in registry.` };
        }

        const fullId = `${normalizedRoot}:${actionId}`;

        // Wave 14A: Duplicate run guard
        const existing = this.activeActions.get(fullId);
        if (existing && (existing.status === "running" || existing.status === "awaiting_input")) {
            kernelRepair.heartbeat(normalizedRoot); // Heartbeat on attempt
            return { ok: false, reason: `Action ${actionId} is already active in this workspace.` };
        }

        const pipeline = PIPELINES[actionId];
        if (!pipeline) {
            return { ok: false, reason: `Pipeline for action ${actionId} not implemented.` };
        }

        // Run Preflight
        const preflightResult = await preflight.runPreflight(actionDef, normalizedRoot, finalContext);
        if (!preflightResult.ok) {
            const state = {
                id: actionId,
                fullId,
                workspacePath: normalizedRoot,
                status: "blocked",
                reason: preflightResult.reason,
                steps: [],
                result: preflightResult
            };
            this.activeActions.set(fullId, state);
            this.notifyChange();
            return preflightResult;
        }

        // Initialize state
        const state = {
            id: actionId,
            fullId,
            workspacePath: normalizedRoot,
            status: "running",
            interactionRequest: null,
            result: null,
            startedAt: Date.now(),
            steps: []
        };
        this.activeActions.set(fullId, state);
        kernelRepair.startMonitoring(normalizedRoot);
        kernelRepair.heartbeat(normalizedRoot);

        // Wave 14C: Check for auto-run permission
        const autoRun = isAutoRunPermitted(actionId, finalContext);
        if (!autoRun) {
            const rationale = getPolicyRationale(actionId, finalContext);
            const request = {
                type: "confirm",
                message: `Action ${actionId} requires manual approval (Policy: ${rationale})`,
                context: finalContext
            };

            state.status = "awaiting_input";
            state.interactionRequest = request;
            state.message = "Operator acknowledgment required.";
            diagnosticsLedger.log(normalizedRoot, "GATE", actionId, `Policy requires operator verification for this action. Rationale: ${rationale}`);
            this.notifyChange();
            return { ok: true, status: "awaiting_input" };
        }

        // Attach logger and pause to context
        finalContext.logger = (msg, type) => this.log(actionId, msg, type, normalizedRoot);
        finalContext.pause = (req) => this.pause(actionId, req, normalizedRoot);
        this.log(actionId, `Starting action: ${actionDef.label}`, "system", normalizedRoot);

        try {
            kernelRepair.heartbeat(normalizedRoot);
            const result = await pipeline(normalizedRoot, finalContext);
            state.status = result.ok ? "succeeded" : "failed";
            state.steps = result.steps || [];
            state.result = result;
            state.completedAt = Date.now();

            // Record outcome
            actionOutcomeStore.recordOutcome({ id: actionId, ok: result.ok, reason: result.reason, summary: result.summary });
            workflowMemory.recordOutcome(actionId, finalContext, result.ok);

            this.notifyChange();
            diagnosticsLedger.log(normalizedRoot, result.ok ? "COMPLETION" : "FAILURE", actionId, result.ok ? "Action succeeded." : (result.reason || "Action failed."));
            return result;
        } catch (err) {
            state.status = "failed";
            state.result = { ok: false, reason: err.message };
            state.completedAt = Date.now();
            workflowMemory.recordOutcome(actionId, finalContext, false);
            this.notifyChange();
            diagnosticsLedger.log(normalizedRoot, "FAILURE", actionId, err.message);
            return state.result;
        }
    }

    async checkReady(actionId, context = {}) {
        const actionDef = actionRegistry.ACTION_REGISTRY[actionId];
        if (!actionDef) return { ok: false, status: "blocked", reason: "Action not in registry" };
        return await preflight.runPreflight(actionDef, context.rootPath, context);
    }

    getStatus(actionId, workspacePath) {
        const fullId = workspacePath ? `${path.resolve(workspacePath)}:${actionId}` : actionId;
        return this.activeActions.get(fullId) || { id: actionId, status: "ready" };
    }

    cancelAction(actionId, workspacePath) {
        const fullId = workspacePath ? `${path.resolve(workspacePath)}:${actionId}` : actionId;
        const resolver = this.interactionResolvers.get(fullId);
        if (resolver) {
            this.interactionResolvers.delete(fullId);
            resolver({ cancelled: true });
        }

        const state = this.activeActions.get(fullId);
        if (state) {
            state.status = "cancelled";
            state.completedAt = Date.now();
            this.notifyChange();
        }
        this.log(actionId, "Action cancelled by operator.", "error", workspacePath);
        diagnosticsLedger.log(workspacePath, "CANCELLATION", actionId, "Action cancelled by operator.");
    }

    clearStatus(actionId) {
        this.activeActions.delete(actionId);
    }

    async runChain(chainId, workspacePath) {
        const fullChainId = `${workspacePath}:${chainId}`;
        const chain = this.activeChains.get(fullChainId);
        if (!chain) return { ok: false, reason: "Chain not found." };

        if (chain.status === "running" || chain.status === "paused") {
            return { ok: false, reason: `Chain ${chain.title} is already active.` };
        }

        chain.status = "running";
        chain.startedAt = Date.now();
        chain.lastHeartbeat = Date.now();
        this.notifyChange();

        kernelRepair.startMonitoring(workspacePath);
        kernelRepair.heartbeat(workspacePath);

        this.log(chainId, `Starting chain: ${chain.title}`, "system", workspacePath);
        return await this.executeNextChainStep(chainId, workspacePath);
    }

    async executeNextChainStep(chainId, workspacePath) {
        const fullChainId = `${workspacePath}:${chainId}`;
        const chain = this.activeChains.get(fullChainId);
        if (!chain || (chain.status !== "running" && chain.status !== "idle" && chain.status !== "paused")) return;

        const step = chain.steps[chain.currentStepIndex];
        if (!step) {
            chain.status = "completed";
            chain.completedAt = Date.now();
            chain.outcome = "Chain completed successfully.";
            this.notifyChange();
            this.log(chainId, "Chain completed.", "success", workspacePath);
            workflowMemory.recordChainOutcome(chain.templateId, { rootPath: workspacePath }, {
                ok: true,
                stepsCompleted: chain.steps.length,
                totalSteps: chain.steps.length
            });
            return;
        }

        chain.status = "running";
        chain.lastHeartbeat = Date.now();
        kernelRepair.heartbeat(workspacePath);
        step.status = "running";
        this.notifyChange();

        const result = await this.runAction(step.actionId, workspacePath, {
            chainId: fullChainId,
            stepIndex: chain.currentStepIndex
        });

        if (!result.ok) {
            step.status = "failed";
            chain.status = "failed";
            chain.outcome = `Chain failed at step ${step.label}: ${result.reason}`;
            this.notifyChange();
            workflowMemory.recordChainOutcome(chain.templateId, { rootPath: workspacePath }, {
                ok: false,
                stepsCompleted: chain.currentStepIndex,
                totalSteps: chain.steps.length
            });
            return;
        }

        step.status = "succeeded";
        chain.currentStepIndex++;
        this.notifyChange();

        const nextStep = chain.steps[chain.currentStepIndex];
        if (nextStep) {
            if (nextStep.autoRun) {
                return await this.executeNextChainStep(chainId, workspacePath);
            } else {
                chain.status = "paused";
                this.notifyChange();
            }
        } else {
            return await this.executeNextChainStep(chainId, workspacePath);
        }
    }

    async resumeChain(chainId, workspacePath) {
        const fullChainId = `${workspacePath}:${chainId}`;
        const chain = this.activeChains.get(fullChainId);
        if (!chain || chain.status !== "paused") return { ok: false, reason: "Chain not in resumable state." };

        chain.status = "running";
        this.notifyChange();
        return await this.executeNextChainStep(chainId, workspacePath);
    }
}

const executionEngine = new ExecutionEngine();
module.exports = executionEngine;
