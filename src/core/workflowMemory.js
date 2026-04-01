const fs = require("fs");
const path = require("path");

const similarityCache = new Map(); // profileA:profileB -> score

/**
 * NeuralShell Workflow Memory
 * Persists operator decisions and action outcomes to provide context-aware suggestions.
 */
class WorkflowMemory {
    constructor() {
        this.records = []; // Array of { type: 'decision'|'outcome', actionId, context, choiceId, ok, timestamp }
        this.storagePath = null;
    }

    init(storageDir) {
        this.storagePath = path.join(storageDir, "workflow_memory.json");
        if (fs.existsSync(this.storagePath)) {
            try {
                const data = JSON.parse(fs.readFileSync(this.storagePath, "utf8"));
                this.records = Array.isArray(data) ? data : [];
            } catch (err) {
                console.error("Failed to load workflow memory:", err);
                this.records = [];
            }
        }
    }

    /**
     * Records an operator decision during an interactive pause.
     */
    recordDecision(actionId, context, choiceId) {
        const record = {
            type: "decision",
            actionId,
            profile: this._deriveProfile(context),
            choiceId,
            timestamp: Date.now()
        };
        this.records.push(record);
        this._save();
    }

    /**
     * Records the final outcome of an action.
     */
    recordOutcome(actionId, context, ok, recoveryAction = null) {
        const record = {
            type: "outcome",
            actionId,
            profile: this._deriveProfile(context),
            ok,
            recoveryAction,
            timestamp: Date.now()
        };
        this.records.push(record);
        this._save();
    }

    /**
     * Records the final outcome of an autonomous chain.
     */
    recordChainOutcome(templateId, context, outcome) {
        const record = {
            type: "chain_outcome",
            templateId,
            profile: this._deriveProfile(context),
            ok: outcome.ok,
            stepsCompleted: outcome.stepsCompleted,
            totalSteps: outcome.totalSteps,
            aborted: !!outcome.aborted,
            timestamp: Date.now()
        };
        this.records.push(record);
        this._save();
    }

    /**
     * Returns suggestions and rationales for a given action and context.
     */
    getSuggestions(actionId, context) {
        // ... (existing code remains)
        const profile = this._deriveProfile(context);
        const relevant = this.records.filter(r => r.actionId === actionId);
        if (!relevant.length) return null;

        const suggestions = {
            preferredChoice: null,
            rationale: "",
            confidence: 0,
            stats: { total: 0, success: 0 }
        };

        // 1. Group by choice (for decisions)
        const decisions = relevant.filter(r => r.type === "decision");
        if (decisions.length) {
            const counts = {};
            decisions.forEach(d => {
                const similarity = this._calculateSimilarity(profile, d.profile);
                if (similarity > 0.6) {
                    counts[d.choiceId] = (counts[d.choiceId] || 0) + similarity;
                }
            });

            const sorted = Object.entries(counts).sort((_a, b) => b[1] - _a[1]);
            if (sorted.length > 0) {
                suggestions.preferredChoice = sorted[0][0];
                const isExact = decisions.some(d => d.profile.rootPath === profile.rootPath);
                suggestions.rationale = isExact
                    ? "Previously chosen in this workspace."
                    : "Commonly chosen in similar environments.";

                // Set confidence based on decision frequency (Phase 11C)
                const totalDecisionSimilarity = Object.values(counts).reduce((a, b) => a + b, 0);
                if (totalDecisionSimilarity >= 1) {
                    suggestions.confidence = 0.6; // Baseline for at least one solid match
                }
                if (totalDecisionSimilarity >= 3) {
                    suggestions.confidence = 0.8; // Higher for repeated patterns
                }
            }
        }

        // 2. Aggregate outcomes
        const outcomes = relevant.filter(r => r.type === "outcome");
        suggestions.stats.total = outcomes.length;
        suggestions.stats.success = outcomes.filter(o => o.ok).length;

        if (outcomes.length > 2 && suggestions.stats.success / outcomes.length > 0.8) {
            suggestions.confidence = 0.8;
            if (!suggestions.rationale) suggestions.rationale = "High success rate in prior runs.";
        }

        return suggestions;
    }

    /**
     * Returns success metrics for a chain template in a given context.
     */
    getChainSuggestions(templateId, context) {
        const profile = this._deriveProfile(context);
        const relevant = this.records.filter(r => r.type === "chain_outcome" && r.templateId === templateId);

        if (!relevant.length) return null;

        let totalSimilarity = 0;
        let weightedSuccess = 0;
        let weightedCompletion = 0;

        relevant.forEach(r => {
            const similarity = this._calculateSimilarity(profile, r.profile);
            if (similarity > 0.5) {
                const weight = similarity;
                totalSimilarity += weight;
                if (r.ok) weightedSuccess += weight;
                weightedCompletion += (r.stepsCompleted / r.totalSteps) * weight;
            }
        });

        if (totalSimilarity === 0) return null;

        const successRate = weightedSuccess / totalSimilarity;
        const completionRate = weightedCompletion / totalSimilarity;

        let rationale = "";
        if (successRate > 0.8 && totalSimilarity > 2) {
            rationale = "Historically reliable in similar environments.";
        } else if (completionRate < 0.5 && totalSimilarity > 2) {
            rationale = "Often stalls or requires manual intervention here.";
        }

        return {
            successRate,
            completionRate,
            confidence: Math.min(0.9, totalSimilarity * 0.2),
            rationale
        };
    }

    /**
     * Returns recovery recommendations based on history.
     */
    getRecoveryBoosts(context) {
        const profile = this._deriveProfile(context);
        const failedOutcomes = this.records.filter(r => r.type === "outcome" && !r.ok && r.recoveryAction);

        const boosts = {}; // recoveryAction -> score
        failedOutcomes.forEach(o => {
            const similarity = this._calculateSimilarity(profile, o.profile);
            if (similarity > 0.7) {
                boosts[o.recoveryAction] = (boosts[o.recoveryAction] || 0) + (similarity * 20);
            }
        });

        return boosts;
    }

    /**
     * Derives a stable profile for similarity matching.
     */
    _deriveProfile(context) {
        let signals = context.signals || [];
        if (signals && typeof signals === 'object' && !Array.isArray(signals)) {
            signals = Object.entries(signals).filter(([_k, _v]) => !!_v).map(([k, _v]) => k);
        }
        return {
            rootPath: context.rootPath || "",
            techStack: context.techStack || [],
            signals: signals,
            lowConfidence: !!context.lowConfidence
        };
    }

    /**
     * calculates similarity score (0-1) between two profiles.
     */
    _calculateSimilarity(p1, p2) {
        const key = [p1.id || p1.rootPath, p2.id || p2.rootPath].sort().join(":");
        if (similarityCache.has(key)) return similarityCache.get(key);

        if (p1.rootPath === p2.rootPath) {
            similarityCache.set(key, 1.0);
            return 1.0;
        }

        const stackMatchCount = (p1.techStack || []).filter(t => (p2.techStack || []).includes(t)).length;
        const totalStackCount = new Set([...(p1.techStack || []), ...(p2.techStack || [])]).size;
        const stackScore = totalStackCount > 0 ? stackMatchCount / totalStackCount : 0;

        const signalMatchCount = (p1.signals || []).filter(s => (p2.signals || []).includes(s)).length;
        const totalSignalCount = new Set([...(p1.signals || []), ...(p2.signals || [])]).size;
        const signalScore = totalSignalCount > 0 ? signalMatchCount / totalSignalCount : 0;

        const score = (stackScore * 0.5) + (signalScore * 0.5);
        similarityCache.set(key, score);
        return score;
    }

    _save() {
        if (!this.storagePath) return;
        try {
            // Keep memory bounded (e.g., last 1000 records)
            if (this.records.length > 1000) {
                this.records = this.records.slice(-1000);
            }
            fs.writeFileSync(this.storagePath, JSON.stringify(this.records, null, 2));
        } catch (err) {
            console.error("Failed to save workflow memory:", err);
        }
    }
}

const workflowMemory = new WorkflowMemory();
module.exports = workflowMemory;
