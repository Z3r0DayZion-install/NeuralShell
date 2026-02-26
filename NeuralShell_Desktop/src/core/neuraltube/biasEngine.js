
import { stateEngine } from "./stateEngine.js";

export const biasEngine = (() => {

    const triggerWords = {
        "exposed": 2, "leaked": 3, "revealed": 2, "collapse": 3,
        "confiscation": 4, "ban": 2, "truth": 1, "bombshell": 3,
        "conspiracy": 2, "insider": 2
    };

    const emotionalWords = {
        "shocking": 3, "outrage": 3, "panic": 2, "terrifying": 4,
        "massive": 2, "unbelievable": 3, "disturbing": 2, "urgent": 2
    };

    const authorityWords = {
        "official": 2, "government": 1, "policy": 1, "court": 2,
        "federal": 1, "expert": 1, "science": 1, "certified": 2
    };

    const conflictWords = {
        "war": 3, "attack": 2, "vs": 2, "fight": 2, "battle": 3,
        "clash": 2, "hostile": 2, "betrayal": 3
    };

    function scoreCategory(text, dictionary) {
        let score = 0;
        const lower = text.toLowerCase();
        for (let word in dictionary) {
            if (lower.includes(word)) {
                score += dictionary[word];
            }
        }
        return score;
    }

    function analyze(item) {
        const text = `${item.title} ${item.description || ""}`;

        const vector = {
            trigger: scoreCategory(text, triggerWords),
            emotion: scoreCategory(text, emotionalWords),
            authority: scoreCategory(text, authorityWords),
            conflict: scoreCategory(text, conflictWords),
            sensational: (text.match(/!|\?/g) || []).length
        };

        const weights = stateEngine.get().lab.enabled
            ? stateEngine.get().lab.weightOverrides
            : {
                trigger: 1.2,
                emotion: 1.5,
                conflict: 1.3,
                authority: 0.8,
                sensational: 0.5
              };

        const biasScore =
            vector.trigger * weights.trigger +
            vector.emotion * weights.emotion +
            vector.conflict * weights.conflict +
            vector.sensational * weights.sensational +
            vector.authority * weights.authority;

        let classification = "neutral";
        if (biasScore > 10) classification = "high-intensity";
        else if (biasScore > 5) classification = "elevated";

        return {
            biasScore: Number(biasScore.toFixed(2)),
            vector,
            classification,
            confidence: Math.min(1, biasScore / 15)
        };
    }

    return { analyze };

})();
