// src/runtime/profile-switcher.js

/**
 * Handles profile activation guards, tampered signature blocks, and switch policy.
 * Outputs intent bundles for the orchestration shell to execute.
 */

function evaluateProfileSwitch(profileId, state, apiState) {
    const profiles = (state && state.settings && state.settings.connectionProfiles) || [];
    const target = profiles.find(p => p.id === profileId);

    if (!target) {
        return { error: "Profile not found." };
    }

    const trustState = typeof resolveProfileTrustState === 'function' ? resolveProfileTrustState(target, apiState) : "INVALID";

    if (trustState === "SIGNATURE_TAMPERED") {
        if (apiState) apiState.logProfileEvent(profileId, "runtime_resume_blocked", "Switch blocked: SIGNATURE_TAMPERED.");
        return { error: "Cannot activate: SIGNATURE_TAMPERED. This profile is blocked." };
    }

    if (trustState === "INVALID") {
        if (apiState) apiState.logProfileEvent(profileId, "runtime_resume_blocked", "Switch blocked: INVALID.");
        return { error: "Cannot activate: Profile is invalid or corrupted." };
    }

    if (apiState) {
        apiState.logProfileEvent(profileId, "profile_switch", `Switched to profile: ${target.name || profileId}.`);
    }

    let banner = null;
    let runAutoDetect = false;

    if (trustState === "VERIFIED" && state && state.settings && state.settings.connectOnStartup) {
        runAutoDetect = true;
    } else if (trustState === "DRIFTED") {
        banner = { msg: "Switched to drifted profile. Re-verification required.", type: "bad" };
    } else if (trustState === "MISSING_SECRET") {
        banner = { msg: "Switched to profile with missing secret. Recovery required.", type: "bad" };
    } else if (trustState === "OFFLINE_LOCKED") {
        banner = { msg: "Entered offline mode. Remote actions disabled.", type: "bad" };
    }

    return {
        success: true,
        patchIntent: { activeProfileId: profileId },
        profileToRender: target,
        trustState: trustState,
        banner: banner,
        runAutoDetect: runAutoDetect
    };
}

function buildProfileSwitchList(state, apiState) {
    const profiles = (state && state.settings && state.settings.connectionProfiles) || [];
    if (profiles.length === 0) {
        return { error: "No profiles available." };
    }

    const activeId = (state && state.settings && state.settings.activeProfileId) || "";

    const listData = profiles.map(profile => {
        const trust = typeof resolveProfileTrustState === 'function' ? resolveProfileTrustState(profile, apiState) : "INVALID";
        const isActive = profile.id === activeId;
        const blocked = trust === "SIGNATURE_TAMPERED" || trust === "INVALID";

        return {
            id: profile.id,
            name: profile.name || profile.id,
            provider: (profile.provider || "unknown").toUpperCase(),
            trustState: trust,
            isActive: isActive,
            isBlocked: blocked
        };
    });

    return { profiles: listData };
}

if (typeof window !== 'undefined') {
    window.evaluateProfileSwitch = evaluateProfileSwitch;
    window.buildProfileSwitchList = buildProfileSwitchList;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        evaluateProfileSwitch,
        buildProfileSwitchList
    };
}
