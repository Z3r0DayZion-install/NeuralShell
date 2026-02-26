
import { stateEngine } from "./stateEngine.js";

export const rankEngine = (() => {

    function engagementRatio(item) {
        if (!item.views || !item.likes) return 0;
        return item.likes / item.views;
    }

    function noveltyPenalty(item) {
        const memory = stateEngine.get().patternMemory;
        // Simple novelty check: if we've seen this exact ID before
        // This is a placeholder for real history tracking
        return 1; 
    }

    function divergenceScore(biasScore) {
        const drift = stateEngine.driftScore();
        return Math.abs(biasScore - drift);
    }

    function dominantAxis(vector) {
        let maxKey = null;
        let maxVal = 0;
        for (let key in vector) {
            if (vector[key] > maxVal) {
                maxVal = vector[key];
                maxKey = key;
            }
        }
        return maxKey;
    }

    function saturationPenalty(biasData) {
        if (stateEngine.get().founderOverride) return 1;

        const memory = stateEngine.get().patternMemory;
        const axis = dominantAxis(biasData.vector);
        const match = memory.find(p => p.axis === axis);

        if (!match) return 1;
        // heavy repetition reduces worth
        return Math.max(0.4, 1 - (match.count * 0.05));
    }

    function heatLevel(biasScore) {
        const drift = stateEngine.driftScore();
        const divergence = Math.abs(biasScore - drift);

        if (divergence > 12) return "critical";
        if (divergence > 7) return "elevated";
        if (divergence > 3) return "moderate";
        return "stable";
    }

    function calculateWorth(item, biasData) {
        if (stateEngine.get().killSwitch.active) {
            return { worth: 1, heat: "stable" };
        }

        const engage = engagementRatio(item);
        const divergence = divergenceScore(biasData.biasScore);
        const novelty = noveltyPenalty(item);
        const saturation = saturationPenalty(biasData);
        const tierBoost = stateEngine.get().tier * 0.1;

        let worth = (divergence * 2) + (engage * 10);
        worth *= novelty;
        worth *= saturation;
        worth += tierBoost;

        return {
            worth: Math.max(1, Math.round(worth)),
            heat: heatLevel(biasData.biasScore)
        };
    }

    return { calculateWorth };

})();
