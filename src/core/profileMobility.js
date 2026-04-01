const crypto = require("crypto");
const stateManager = require("./stateManager");

/**
 * Phase 14.2: Bundle Signing & Authenticity
 * Generates a deterministic signature for the profile bundle.
 */
function calculateBundleSignature(profile) {
    if (!profile) return "";
    // Canonical manifest for signing (V2.1.29)
    const manifest = `${profile.id}|${profile.provider}|${profile.baseUrl}|${profile.lastVerifiedFingerprint || "none"}|V2.1.29`;
    const key = stateManager.getBundleSigningKey();
    return crypto.createHmac("sha256", key).update(manifest).digest("hex");
}

function exportProfileBundle(profileId, includeSecrets = false) {
    const settings = stateManager.get("settings") || {};
    const profile = (settings.connectionProfiles || []).find(p => p.id === profileId);
    if (!profile) throw new Error("Profile not found");

    const bundle = {
        schemaVersion: "V2.1.29",
        exportTs: new Date().toISOString(),
        profile: { ...profile },
        integrity: {
            profileFingerprint: stateManager.calculateProfileFingerprint(profile),
            lastVerifiedFingerprint: profile.lastVerifiedFingerprint || null,
            bundleSignature: calculateBundleSignature(profile)
        }
    };

    // Metadata-only by default
    if (includeSecrets) {
        const secret = stateManager.retrieveSecret(profileId, "apiKey");
        if (secret) {
            bundle.secrets = { apiKey: secret };
        }
    }

    return JSON.stringify(bundle, null, 2);
}

function importProfileBundle(json) {
    let bundle;
    try {
        bundle = JSON.parse(json);
    } catch (e) {
        throw new Error("Invalid bundle format");
    }

    if (bundle.schemaVersion !== "V2.1.29") {
        // Upgrade legacy bundles (e.g. V2.1.16) if needed
    }

    const profile = bundle.profile;
    const integrity = bundle.integrity;

    if (!profile || !integrity) throw new Error("Malformed profile bundle");

    // Validate integrity metadata
    const calculatedFingerprint = stateManager.calculateProfileFingerprint(profile);
    if (calculatedFingerprint !== integrity.profileFingerprint) {
        throw new Error("Integrity Validation Failed: Profile data does not match fingerprint.");
    }

    // Phase 14.2 & 15.2: Authenticity Check (Canonical)
    const expectedSignature = calculateBundleSignature(profile);
    const isAuthentic = (integrity.bundleSignature === expectedSignature);
    const authenticityStatus = isAuthentic ? "VERIFIED" : (integrity.bundleSignature ? "SIGNATURE_TAMPERED" : "UNSIGNED");

    // Seed into state
    const settings = stateManager.get("settings") || {};
    const profiles = settings.connectionProfiles || [];

    // Update or Add
    const existingIdx = profiles.findIndex(p => p.id === profile.id);

    const importedProfile = {
        ...profile,
        provenance: {
            source: "imported",
            importedAt: new Date().toISOString(),
            exportTs: bundle.exportTs
        },
        // Imports are always unverified until first local test
        trustState: stateManager.TRUST_STATES.DRIFTED,
        authenticity: authenticityStatus
    };

    if (existingIdx >= 0) {
        profiles[existingIdx] = importedProfile;
    } else {
        profiles.push(importedProfile);
    }

    stateManager.set("settings.connectionProfiles", profiles);

    // Handle secrets if present
    if (bundle.secrets && bundle.secrets.apiKey) {
        stateManager.secureStoreSecret(profile.id, "apiKey", bundle.secrets.apiKey);
    }

    stateManager.save();
    return importedProfile;
}

module.exports = {
    exportProfileBundle,
    importProfileBundle
};
