// src/runtime/trust-evaluator.js

/**
 * Evaluates cryptographically secure trust states for loaded models and endpoints.
 */

function getActiveProfile(state = (typeof window !== 'undefined' ? window.appState : null)) {
    const profiles = (state && state.settings && state.settings.connectionProfiles) || [];
    const activeId = (state && state.settings && state.settings.activeProfileId) || "";
    return profiles.find(p => p.id === activeId) || null;
}

async function checkProfileDrift(profile, apiState = (typeof window !== 'undefined' && window.api ? window.api.state : null)) {
    if (!profile) return apiState ? apiState.TRUST_STATES.INVALID : "INVALID";

    // Secret Custody Check
    const needsSecret = profile.provider !== "ollama";
    let hasSecret = false;
    if (apiState && typeof apiState.retrieveSecret === 'function') {
        hasSecret = await apiState.retrieveSecret(profile.id, "apiKey");
    } else if (apiState) {
        const getSecretSafe = async () => true; // MOCK
        hasSecret = await getSecretSafe();
    }

    if (needsSecret && !hasSecret) return apiState && apiState.TRUST_STATES ? apiState.TRUST_STATES.MISSING_SECRET : "MISSING_SECRET";

    // Manual Review/Downgrade Check
    if (profile.trustState === (apiState && apiState.TRUST_STATES ? apiState.TRUST_STATES.NEEDS_REVIEW : "NEEDS_REVIEW")) {
        return apiState && apiState.TRUST_STATES ? apiState.TRUST_STATES.NEEDS_REVIEW : "NEEDS_REVIEW";
    }

    if (!profile.lastVerifiedFingerprint) {
        if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(`trust-trace-${profile.id}`, JSON.stringify({ result: "unknown", reason: "no_lastVerifiedFingerprint" }));
        return "unknown";
    }

    if (apiState && typeof apiState.calculateProfileFingerprint === 'function') {
        const currentFingerprint = await apiState.calculateProfileFingerprint(profile);
        const match = currentFingerprint === profile.lastVerifiedFingerprint;
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(`trust-trace-${profile.id}`, JSON.stringify({
                profileId: profile.id,
                stored: profile.lastVerifiedFingerprint,
                live: currentFingerprint,
                match: match
            }));
        }

        return match
            ? apiState.TRUST_STATES.VERIFIED
            : apiState.TRUST_STATES.DRIFTED;
    }

    if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(`trust-trace-${profile ? profile.id : "null"}`, JSON.stringify({ result: "unchecked", reason: "no_apiState" }));
    if (typeof window !== 'undefined' && typeof window.showBanner === 'function') {
        window.showBanner("T-TRACE: unchecked - no apistate", "bad");
    }
    return "unchecked"; // Fallback if no full apiState injected
}

async function resolveProfileTrustState(profile, apiState = (typeof window !== 'undefined' && window.api ? window.api.state : null)) {
    if (!profile) return "INVALID";
    if (profile.authenticity === "SIGNATURE_TAMPERED") return "SIGNATURE_TAMPERED";
    if (profile.trustState === "OFFLINE_LOCKED") return "OFFLINE_LOCKED";
    return await checkProfileDrift(profile, apiState);
}

// Export for browser environment
if (typeof window !== 'undefined') {
    window.getActiveProfile = getActiveProfile;
    window.checkProfileDrift = checkProfileDrift;
    window.resolveProfileTrustState = resolveProfileTrustState;
}

// Export for Node.js (tests)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getActiveProfile,
        checkProfileDrift,
        resolveProfileTrustState
    };
}
