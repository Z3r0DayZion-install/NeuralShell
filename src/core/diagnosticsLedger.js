/**
 * NeuralShell Diagnostics Ledger
 * Provides an append-only audit trail for autonomous strategic decisions.
 */

class DiagnosticsLedger {
    constructor() {
        this.entries = []; // Array of { timestamp, workspacePath, eventType, detail, rationale }
        this.MAX_ENTRIES = 5000;
    }

    /**
     * Records a diagnostic event.
     * @param {string} workspacePath 
     * @param {string} eventType PROPOSAL|SUPPRESSION|GATE|COMPLETION|FAILURE|CLEANUP
     * @param {string} detail Contextual detail (e.g. action ID or chain title)
     * @param {string} rationale Human-readable reason for the event
     */
    log(workspacePath, eventType, detail, rationale) {
        const entry = {
            timestamp: Date.now(),
            workspacePath,
            eventType,
            detail,
            rationale
        };
        this.entries.push(entry);

        // Keep ledger bounded
        if (this.entries.length > this.MAX_ENTRIES) {
            this.entries.shift();
        }

        console.log(`[DIAG] [${eventType}] ${workspacePath}: ${detail} - ${rationale}`);
    }

    /**
     * Returns recent entries for a workspace.
     */
    getRecent(workspacePath, limit = 50) {
        let filtered = workspacePath
            ? this.entries.filter(e => e.workspacePath === workspacePath)
            : this.entries;
        return filtered.slice(-limit).reverse();
    }

    /**
     * Clears the ledger.
     */
    clear() {
        this.entries = [];
    }
}

const diagnosticsLedger = new DiagnosticsLedger();
module.exports = diagnosticsLedger;
