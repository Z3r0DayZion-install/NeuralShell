// src/runtime/session-control.js

/**
 * Handles clearing live sessions, hard disconnects, and physical offline routing.
 * Returns rendering intents to the UI orchestration shell.
 */

async function performDisconnect(state, apiState) {
    // We assume getActiveProfile and resolveProfileTrustState are available globally, 
    // or they can be mocked in tests. We can extract them if passed but they are linked in HTML natively.
    const profile = typeof getActiveProfile === 'function' ? getActiveProfile(state) : null;

    // Clear live session state
    if (state) {
        state.chat = [];
        state.model = null;
    }

    // Log telemetry
    if (profile && apiState && typeof apiState.logProfileEvent === 'function') {
        await apiState.logProfileEvent(profile.id, "session_disconnected", "Operator initiated disconnect from profile bar.");
    }

    let trust = null;
    if (profile && typeof resolveProfileTrustState === 'function') {
        trust = await resolveProfileTrustState(profile, apiState);
    }

    return {
        statusText: "Disconnected",
        statusClass: "header-status-value",
        bannerMessage: "Session disconnected. Bridge stopped.",
        bannerType: "bad",
        profileToRender: profile,
        trustState: trust
    };
}

async function performOfflineEntry(state, currentProfiles, apiState) {
    const profile = typeof getActiveProfile === 'function' ? getActiveProfile(state) : null;

    if (state) {
        state.chat = [];
        state.model = null;
    }

    let pNext = profile;
    if (profile && profile.provider !== "ollama") {
        if (apiState && typeof apiState.logProfileEvent === 'function') {
            await apiState.logProfileEvent(profile.id, "session_offline", "Forced offline route to safe enclave.");
        }
        const safeLocal = currentProfiles.find(p => p.provider === "ollama") || null;
        if (safeLocal) {
            pNext = safeLocal;
        } else {
            return {
                error: "System Panic: No offline enclave (local node) available to secure the session.",
                profileToRender: profile,
                trustState: "OFFLINE_LOCKED"
            };
        }
    }

    let trust = null;
    if (pNext && typeof resolveProfileTrustState === 'function') {
        trust = await resolveProfileTrustState(pNext, apiState);
    }

    return {
        success: true,
        patchIntent: { activeProfileId: pNext ? pNext.id : "" },
        profileToRender: pNext,
        trustState: trust,
        banner: { msg: "Offline Mode active. Forced local enclave routing.", type: "ok" }
    };
}

async function evaluateProfileSwitch(profileId, state, apiState) {
    const profiles = (state && state.settings && state.settings.connectionProfiles) || [];
    const target = profiles.find(p => p.id === profileId);
    if (!target) {
        return { error: "Target profile not found in memory matrix." };
    }

    let trustState = "UNKNOWN";
    if (typeof resolveProfileTrustState === 'function') {
        trustState = await resolveProfileTrustState(target, apiState);
    }

    if (target.authenticity === "SIGNATURE_TAMPERED") {
        return { error: `Profile <${target.name}> signatures invalid. Session blocked.` };
    }

    return {
        success: true,
        patchIntent: { activeProfileId: profileId },
        profileToRender: target,
        trustState,
        banner: { msg: `Activated profile: ${target.name}`, type: "ok" },
        runAutoDetect: true
    };
}

if (typeof window !== 'undefined') {
    window.performDisconnect = performDisconnect;
    window.performOfflineEntry = performOfflineEntry;
    window.evaluateProfileSwitch = evaluateProfileSwitch;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        performDisconnect,
        performOfflineEntry,
        evaluateProfileSwitch
    };
}
