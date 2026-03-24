// src/runtime/runtime-governance.js

/**
 * Calculates behavioral policy matrix on application boot or profile resume.
 */

async function runtimeResumeGovernance(state, apiState) {
    const onboardingDone = state && state.settings && state.settings.onboardingCompleted;
    if (!onboardingDone) return { action: "skip_onboarding_not_done" };

    const profile = typeof getActiveProfile === 'function' ? getActiveProfile(state) : null;

    if (!profile) {
        return { action: "render_bar", profileToRender: null, trustState: "INVALID" };
    }

    const trustState = typeof resolveProfileTrustState === 'function' ? await resolveProfileTrustState(profile, apiState) : "INVALID";
    const reconnect = Boolean(state && state.settings && state.settings.connectOnStartup);

    const intent = {
        action: "apply_policy",
        profileToRender: profile,
        trustState: trustState,
        logEvent: null,
        banner: null,
        runAutoDetect: false
    };

    const TS = apiState && apiState.TRUST_STATES ? apiState.TRUST_STATES : {
        VERIFIED: "VERIFIED", DRIFTED: "DRIFTED", MISSING_SECRET: "MISSING_SECRET", OFFLINE_LOCKED: "OFFLINE_LOCKED", INVALID: "INVALID"
    };

    switch (trustState) {
        case TS.VERIFIED:
        case "VERIFIED":
            if (reconnect) {
                intent.logEvent = { id: profile.id, type: "runtime_resume_allowed", msg: "Auto-resume: VERIFIED + connectOnStartup enabled." };
                intent.runAutoDetect = true;
            } else {
                intent.logEvent = { id: profile.id, type: "runtime_resume_blocked", msg: "Calm entry: VERIFIED but connectOnStartup disabled." };
            }
            break;

        case TS.DRIFTED:
        case "DRIFTED":
            intent.banner = { msg: "Profile drift detected. Automatic resume blocked. Use Repair to re-verify.", type: "bad" };
            intent.logEvent = { id: profile.id, type: "runtime_resume_blocked", msg: "Blocked: DRIFTED. Routing to repair." };
            intent.setupState = "repair_mode";
            break;

        case TS.MISSING_SECRET:
        case "MISSING_SECRET":
            intent.banner = { msg: "Secret custody failure. Resume blocked until secret is recovered.", type: "bad" };
            intent.logEvent = { id: profile.id, type: "runtime_resume_blocked", msg: "Blocked: MISSING_SECRET. Routing to repair_secret." };
            intent.setupState = "repair_secret";
            break;

        case "SIGNATURE_TAMPERED":
            intent.banner = { msg: "CRITICAL: Profile signature tampered. Resume strictly blocked.", type: "bad" };
            intent.logEvent = { id: profile.id, type: "runtime_resume_blocked", msg: "Hard block: SIGNATURE_TAMPERED." };
            intent.setupState = "offline_locked";
            break;

        case TS.OFFLINE_LOCKED:
        case "OFFLINE_LOCKED":
            intent.logEvent = { id: profile.id, type: "offline_entry", msg: "Offline runtime entry. Remote actions disabled." };
            intent.setupState = "offline_mode";
            break;

        case TS.INVALID:
        case "INVALID":
        default:
            intent.logEvent = { id: profile.id || "unknown", type: "runtime_resume_blocked", msg: `Blocked: trust state ${trustState}.` };
            break;
    }

    return intent;
}

if (typeof window !== 'undefined') {
    window.runtimeResumeGovernance = runtimeResumeGovernance;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runtimeResumeGovernance
    };
}
