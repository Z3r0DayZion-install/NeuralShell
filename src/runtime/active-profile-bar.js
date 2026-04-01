// src/runtime/active-profile-bar.js

/**
 * Derives UI rendering state for the Active Profile Governance Bar from raw state objects.
 * Does not physically manipulate DOM elements.
 */
function generateActiveProfileBarState(profile, trustState, appState) {
    if (!profile) {
        return { isHidden: true };
    }

    let badgeText = trustState || "UNKNOWN";
    let badgeClass = "badge-trust ";
    switch (trustState) {
        case "VERIFIED": badgeClass += "trust-verified"; break;
        case "DRIFTED": badgeClass += "trust-drifted"; break;
        case "MISSING_SECRET": badgeClass += "trust-missing-secret"; break;
        case "SIGNATURE_TAMPERED": badgeClass += "trust-tampered"; break;
        case "OFFLINE_LOCKED": badgeClass += "trust-offline"; break;
        default: badgeClass += "trust-invalid"; break;
    }

    const reconnect = Boolean(appState && appState.settings && appState.settings.connectOnStartup);
    const reconnectText = reconnect ? "Auto-Reconnect: ON" : "Auto-Reconnect: OFF";

    const verifiedText = profile.lastSuccessTs
        ? `Verified: ${new Date(profile.lastSuccessTs).toLocaleString()} `
        : "Never verified";

    const blocked = ["DRIFTED", "MISSING_SECRET", "SIGNATURE_TAMPERED", "INVALID"].includes(trustState);

    return {
        isHidden: false,
        nameText: profile.name || profile.id || "Unnamed",
        providerText: (profile.provider || "unknown").toUpperCase(),
        modelText: (appState && appState.model) || profile.model || "—",
        badgeText: badgeText,
        badgeClass: badgeClass,
        reconnectText: reconnectText,
        verifiedText: verifiedText,
        isBlocked: blocked,
        isOffline: trustState === "OFFLINE_LOCKED"
    };
}

if (typeof window !== 'undefined') {
    window.generateActiveProfileBarState = generateActiveProfileBarState;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateActiveProfileBarState
    };
}
