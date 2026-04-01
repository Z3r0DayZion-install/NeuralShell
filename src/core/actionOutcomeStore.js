const fs = require("fs");
const path = require("path");

/**
 * NeuralShell Action Outcome Store
 * Persists structured results of orchestrated actions to improve future ranking.
 */

class ActionOutcomeStore {
    constructor() {
        this.history = [];
        this.storagePath = null;
    }

    init(storageDir) {
        this.storagePath = path.join(storageDir, "action_outcomes.json");
        if (fs.existsSync(this.storagePath)) {
            try {
                this.history = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
            } catch (err) {
                console.error("Failed to load action outcomes:", err);
                this.history = [];
            }
        }
    }

    recordOutcome(outcome) {
        const entry = {
            ...outcome,
            timestamp: Date.now()
        };
        this.history.push(entry);
        this.save();
        return entry;
    }

    getHistory(actionId = null) {
        if (actionId) {
            return this.history.filter(h => h.id === actionId);
        }
        return this.history;
    }

    getRecentOutcomes(limit = 10) {
        return this.history.slice(-limit).reverse();
    }

    save() {
        if (!this.storagePath) return;
        try {
            fs.writeFileSync(this.storagePath, JSON.stringify(this.history, null, 2));
        } catch (err) {
            console.error("Failed to save action outcomes:", err);
        }
    }
}

const actionOutcomeStore = new ActionOutcomeStore();

module.exports = actionOutcomeStore;
