
export const stateEngine = (() => {

    const tierCapabilities = {
        1: ["vector"],
        2: ["timeline"],
        3: ["patternPanel", "labToggle"],
        4: ["weightOverride", "mutationControl"],
        5: ["simulatedDrift", "killSwitch"],
        6: ["fullOverride", "forceMutation", "resetDrift", "manualReshuffle", "xpInject", "reclassify"]
    };

    let state = {
        xp: 0,
        tier: 1,
        leanHistory: [],
        patternMemory: [], // { fingerprint, count, axis }
        channels: {}, // { name: { totalBias, count } }
        timeline: [], // { timestamp, drift }
        unlocked: {},
        settings: {
            pauseAlgorithm: false,
            leanDetectEnabled: true
        },
        lab: {
            enabled: false,
            weightOverrides: {
                trigger: 1.2,
                emotion: 1.5,
                conflict: 1.3,
                authority: 0.8,
                sensational: 0.5
            },
            mutationDisabled: false,
            simulatedDrift: null
        },
        founderOverride: false,
        killSwitch: {
            active: false,
            purgeMode: false
        },
        momentum: {
            streak: 0,
            lastInteraction: 0
        }
    };

    function load() {
        const saved = localStorage.getItem("ntxr_state");
        if (saved) state = JSON.parse(saved);
    }

    function save() {
        localStorage.setItem("ntxr_state", JSON.stringify(state));
    }

    function getThresholdForTier(tier) {
        return Math.floor(150 * Math.pow(tier, 1.8));
    }

    function updateTier() {
        let tier = 1;
        while (state.xp >= getThresholdForTier(tier)) {
            tier++;
            if (tier > 10) break;
        }
        state.tier = tier;
    }

    function hasCapability(feature) {
        if (state.founderOverride) return true; // Founder has all
        const tier = state.tier;
        for (let i = tier; i >= 1; i--) {
            if (tierCapabilities[i]?.includes(feature))
                return true;
        }
        return false;
    }

    function updateMomentum() {
        const now = Date.now();
        if (now - state.momentum.lastInteraction < 300000) { // 5 mins
            state.momentum.streak += 1;
        } else {
            state.momentum.streak = 1;
        }
        state.momentum.lastInteraction = now;
        save();
    }

    function addXP(baseAmount, biasData = null) {
        if (state.killSwitch.active) return 0;

        updateMomentum();

        let multiplier = 1;
        // Momentum boost
        multiplier += state.momentum.streak * 0.05;

        // Divergence bonus
        if (biasData) {
            const divergence = Math.abs(biasData.biasScore - driftScore());
            multiplier += divergence * 0.03;
        }

        // Saturation penalty (disabled for Founder)
        const dominant = state.patternMemory.sort((a,b)=> b.count - a.count)[0];
        if (!state.founderOverride && dominant && dominant.count > 5) {
            multiplier -= dominant.count * 0.02;
        }

        multiplier = Math.max(0.5, multiplier);
        const gained = Math.round(baseAmount * multiplier);

        state.xp += gained;
        updateTier();
        save();

        return gained;
    }

    function recordBias(score) {
        state.leanHistory.push(score);
        if (state.leanHistory.length > 100)
            state.leanHistory.shift();
        save();
    }

    function driftScore() {
        if (state.killSwitch.active) return 0;
        if (state.lab.enabled && state.lab.simulatedDrift !== null && hasCapability("simulatedDrift")) {
            return state.lab.simulatedDrift;
        }
        if (!state.leanHistory.length) return 0;
        return state.leanHistory.reduce((a,b)=>a+b,0) / state.leanHistory.length;
    }

    function remember(item) {
        // Basic remember logic if needed for simple history
        // Real pattern memory is in recordPattern
        save();
    }

    function recordPattern(item, biasData) {
        const fingerprint =
            `T${biasData.vector.trigger}` +
            `-E${biasData.vector.emotion}` +
            `-C${biasData.vector.conflict}` +
            `-A${biasData.vector.authority}` +
            `-S${biasData.vector.sensational}`;

        const existing = state.patternMemory.find(p => p.fingerprint === fingerprint);

        if (existing) {
            existing.count += 1;
        } else {
            state.patternMemory.push({
                fingerprint,
                count: 1,
                axis: dominantAxis(biasData.vector)
            });
        }

        if (state.patternMemory.length > 300)
            state.patternMemory.shift();

        save();
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

    function recordChannel(item, biasData) {
        if (!state.channels) state.channels = {};
        if (!state.channels[item.channel]) {
            state.channels[item.channel] = {
                totalBias: 0,
                count: 0
            };
        }
        state.channels[item.channel].totalBias += biasData.biasScore;
        state.channels[item.channel].count += 1;
        save();
    }

    function recordTimeline() {
        if (!state.timeline) state.timeline = [];
        state.timeline.push({
            timestamp: Date.now(),
            drift: driftScore()
        });
        if (state.timeline.length > 200)
            state.timeline.shift();
        save();
    }

    // --- NeuralLab ---
    function toggleLab() {
        if (!hasCapability("labToggle")) return;
        state.lab.enabled = !state.lab.enabled;
        save();
    }
    function setLabWeight(axis, value) {
        if (!hasCapability("weightOverride") && !state.founderOverride) return;
        state.lab.weightOverrides[axis] = value;
        save();
    }
    function toggleMutation() {
        if (!hasCapability("mutationControl") && !state.founderOverride) return;
        state.lab.mutationDisabled = !state.lab.mutationDisabled;
        save();
    }
    function setSimulatedDrift(value) {
        if (!hasCapability("simulatedDrift") && !state.founderOverride) return;
        state.lab.simulatedDrift = value;
        save();
    }

    // --- Founder Override ---
    function toggleFounderOverride() {
        if (!hasCapability("fullOverride")) return;
        state.founderOverride = !state.founderOverride;
        save();
    }

    // --- Kill Switch ---
    function toggleKillSwitch() {
        if (!hasCapability("killSwitch") && !state.founderOverride) return; // Tier 5+
        state.killSwitch.active = !state.killSwitch.active;
        if (state.killSwitch.purgeMode) {
             state.leanHistory = [];
             state.patternMemory = [];
             state.channels = {};
             state.timeline = [];
        }
        save();
    }
    function togglePurgeMode() {
        state.killSwitch.purgeMode = !state.killSwitch.purgeMode;
        save();
    }

    return {
        load,
        save,
        addXP,
        recordBias,
        recordPattern,
        recordChannel,
        recordTimeline,
        driftScore,
        remember,
        get: () => state,
        hasCapability,
        // Lab
        toggleLab,
        setLabWeight,
        toggleMutation,
        setSimulatedDrift,
        // Founder
        toggleFounderOverride,
        // Kill Switch
        toggleKillSwitch,
        togglePurgeMode
    };

})();
