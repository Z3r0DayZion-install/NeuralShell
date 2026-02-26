
import { stateEngine } from "./stateEngine.js";

export const feedEngine = (() => {

    let cache = [];

    function normalize(raw, platform) {
        return {
            id: raw.id || raw.title,
            platform: platform || raw.platform || "unknown",
            title: raw.title,
            description: raw.description || "",
            views: raw.views || 0,
            likes: raw.likes || 0,
            channel: raw.channel || "Unknown Channel",
            timestamp: raw.timestamp || Date.now()
        };
    }

    function ingest(data, platform) {
        const normalized = data.map(d => normalize(d, platform));
        normalized.forEach(item => {
            if (!cache.some(c => c.id === item.id)) {
                cache.push(item);
            }
        });
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

    function mutateFeed(feed) {
        const state = stateEngine.get();
        if (state.killSwitch.active) {
            return [...feed].sort((a,b)=> a.timestamp - b.timestamp);
        }
        if (state.founderOverride) return feed;
        if (state.lab.enabled && state.lab.mutationDisabled) return feed;

        const memory = state.patternMemory;
        if (!memory.length) return feed;

        const dominant = [...memory].sort((a,b)=> b.count - a.count)[0];

        return [...feed].sort((a,b) => {
            const axisA = dominantAxis(a.bias.vector);
            const axisB = dominantAxis(b.bias.vector);

            // suppress dominant axis
            if (axisA === dominant.axis && axisB !== dominant.axis) return 1;
            if (axisB === dominant.axis && axisA !== dominant.axis) return -1;

            return b.worth - a.worth;
        });
    }

    function getFeed() {
        return cache;
    }

    return { ingest, getFeed, mutateFeed };

})();
