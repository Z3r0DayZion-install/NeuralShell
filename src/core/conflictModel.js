/**
 * NeuralShell Conflict Model
 * Tracks merge-sensitive states and shared dependency blockers per workspace.
 */

const CONFLICT_STATE = {
    STABLE: "stable",
    DIRTY: "dirty",
    MERGE_CONFLICT: "merge_conflict",
    LOCKED: "locked" // e.g., by another process or dependency install
};

class ConflictModel {
    constructor() {
        this.states = new Map(); // workspacePath -> CONFLICT_STATE
        this.reasons = new Map(); // workspacePath -> Set of blocker reasons
    }

    /**
     * Updates the conflict state for a workspace.
     */
    setConflict(workspacePath, state, reason = null) {
        this.states.set(workspacePath, state);
        if (!this.reasons.has(workspacePath)) this.reasons.set(workspacePath, new Set());
        if (reason) this.reasons.get(workspacePath).add(reason);
    }

    /**
     * Returns the current conflict status for a workspace.
     */
    getConflict(workspacePath) {
        return {
            state: this.states.get(workspacePath) || CONFLICT_STATE.STABLE,
            reasons: Array.from(this.reasons.get(workspacePath) || [])
        };
    }

    /**
     * Clears all conflict flags for a workspace.
     */
    clearConflict(workspacePath) {
        this.states.delete(workspacePath);
        this.reasons.delete(workspacePath);
    }

    /**
     * Checks if a workspace is in a "high sensitivity" state.
     */
    isSensitive(workspacePath) {
        const state = this.states.get(workspacePath) || CONFLICT_STATE.STABLE;
        return state === CONFLICT_STATE.MERGE_CONFLICT || state === CONFLICT_STATE.LOCKED;
    }
}

const conflictModel = new ConflictModel();
module.exports = { conflictModel, CONFLICT_STATE };
