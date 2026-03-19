/**
 * NeuralShell Cross-Chain Coordinator
 * Manages relationships and signal propagation between related workspaces.
 */
const { conflictModel } = require("./conflictModel");

class CrossChainCoordinator {
    constructor() {
        this.links = new Map(); // workspacePath -> Set of linked workspacePaths
    }

    /**
     * Explicitly links two or more workspaces.
     */
    linkWorkspaces(paths) {
        for (const p1 of paths) {
            if (!this.links.has(p1)) this.links.set(p1, new Set());
            for (const p2 of paths) {
                if (p1 !== p2) this.links.get(p1).add(p2);
            }
        }
    }

    /**
     * Returns all workspaces linked to the given path.
     */
    getLinks(workspacePath) {
        return Array.from(this.links.get(workspacePath) || []);
    }

    /**
     * Automatically infers linkage between workspaces (e.g., siblings in the same parent dir).
     */
    detectAutoLinks(workspacePath, allActivePaths) {
        const parent = require("path").dirname(workspacePath);
        const siblings = allActivePaths.filter(p => p !== workspacePath && require("path").dirname(p) === parent);
        if (siblings.length > 0) {
            this.linkWorkspaces([workspacePath, ...siblings]);
        }
    }

    /**
     * Aggregates coordination signals from linked workspaces.
     * @param {string} workspacePath 
     * @param {object} allWorkspaceStatus Current status of all workspaces from executionEngine
     * @returns {Array} Coordination signals
     */
    getSignals(workspacePath, allWorkspaceStatus = { actions: {}, chains: {} }) {
        const links = this.getLinks(workspacePath);
        const signals = [];

        for (const linkedPath of links) {
            // Check for failures in linked workspace
            const failedActions = Object.values(allWorkspaceStatus.actions).filter(a =>
                a.workspacePath === linkedPath && a.status === "failed"
            );

            if (failedActions.length > 0) {
                signals.push({
                    type: "linked_failure",
                    source: linkedPath,
                    reason: `Linked workspace has ${failedActions.length} failed actions.`,
                    severity: "high"
                });
            }

            // Wave 14D: Check for conflict states in linked workspace
            const conflict = conflictModel.getConflict(linkedPath);
            if (conflictModel.isSensitive(linkedPath)) {
                signals.push({
                    type: "linked_conflict",
                    source: linkedPath,
                    reason: `Linked workspace state: ${conflict.state.toUpperCase()} (${conflict.reasons.join(", ")})`,
                    severity: "high"
                });
            } else if (conflict.state === "dirty") {
                signals.push({
                    type: "linked_drift",
                    source: linkedPath,
                    reason: "Linked workspace has uncommitted drift.",
                    severity: "medium"
                });
            }

            // Check for active chains or actions in linked workspace
            const activeChains = Object.values(allWorkspaceStatus.chains || {}).filter(c =>
                c.workspacePath === linkedPath && (c.status === "running" || c.status === "paused")
            );
            const activeActions = Object.values(allWorkspaceStatus.actions || {}).filter(a =>
                a.workspacePath === linkedPath && a.status === "running"
            );

            if (activeChains.length > 0 || activeActions.length > 0) {
                signals.push({
                    type: "linked_activity",
                    source: linkedPath,
                    reason: "Linked workspace has active workload.",
                    severity: "medium"
                });
            }
        }

        return signals;
    }
}

const crossChainCoordinator = new CrossChainCoordinator();
module.exports = crossChainCoordinator;
