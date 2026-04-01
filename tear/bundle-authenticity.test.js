const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("crypto");

// Phase 15 Mock Model: Real HMAC Signing with stable key
const mockStateManager = {
    calculateProfileFingerprint: (p) => `${p.id}-fingerprint`,
    getBundleSigningKey: () => "test-signing-seed-v1"
};

// Import logic from profileMobility (simulated for contract test)
function calculateBundleSignature(profile) {
    if (!profile) return "";
    const manifest = `${profile.id}|${profile.provider}|${profile.baseUrl}|${profile.lastVerifiedFingerprint || "none"}`;
    const key = mockStateManager.getBundleSigningKey();
    return crypto.createHmac("sha256", key).update(manifest).digest("hex");
}

function exportProfileBundle(profile) {
    return JSON.stringify({
        schemaVersion: "V2.1.16",
        profile: { ...profile },
        integrity: {
            profileFingerprint: mockStateManager.calculateProfileFingerprint(profile),
            bundleSignature: calculateBundleSignature(profile)
        }
    });
}

function verifyBundleAuthenticity(bundleJson) {
    const bundle = JSON.parse(bundleJson);
    const profile = bundle.profile;
    const integrity = bundle.integrity;

    const expectedSignature = calculateBundleSignature(profile);
    const isAuthentic = (integrity.bundleSignature === expectedSignature);

    // Canonical Phase 15 Vocabulary
    return isAuthentic ? "VERIFIED" : (integrity.bundleSignature ? "SIGNATURE_TAMPERED" : "UNSIGNED");
}

test("Phase 15: Bundle Signing & Authenticity (Canonical Model)", async (t) => {
    const mockProfile = {
        id: "test-auth-profile",
        provider: "ollama",
        baseUrl: "http://localhost:11434",
        lastVerifiedFingerprint: "stable-fingerprint"
    };

    await t.test("should generate a valid HMAC-SHA256 signature on export", () => {
        const bundleJson = exportProfileBundle(mockProfile);
        const bundle = JSON.parse(bundleJson);
        assert.ok(bundle.integrity.bundleSignature, "Signature should be present");
        assert.equal(bundle.integrity.bundleSignature.length, 64, "Should be a 256-bit hex signature");
    });

    await t.test("should verify a valid signature as VERIFIED", () => {
        const bundleJson = exportProfileBundle(mockProfile);
        const status = verifyBundleAuthenticity(bundleJson);
        assert.equal(status, "VERIFIED");
    });

    await t.test("should detect metadata tampering as SIGNATURE_TAMPERED", () => {
        const bundleJson = exportProfileBundle(mockProfile);
        const bundle = JSON.parse(bundleJson);

        // Tamper with endpoint
        bundle.profile.baseUrl = "http://malicious-host:11434";

        const status = verifyBundleAuthenticity(JSON.stringify(bundle));
        assert.equal(status, "SIGNATURE_TAMPERED", "Tampered endpoint should be detected");
    });

    await t.test("should detect signature tampering directly", () => {
        const bundleJson = exportProfileBundle(mockProfile);
        const bundle = JSON.parse(bundleJson);
        bundle.integrity.bundleSignature = "a".repeat(64);

        const status = verifyBundleAuthenticity(JSON.stringify(bundle));
        assert.equal(status, "TAMPERED");
    });

    await t.test("should handle unsigned legacy bundles as UNSIGNED", () => {
        const bundle = {
            profile: { ...mockProfile },
            integrity: { profileFingerprint: "abc" }
        };
        const status = verifyBundleAuthenticity(JSON.stringify(bundle));
        assert.equal(status, "UNSIGNED");
    });

    await t.test("should detect key rotation (mismatched machine key) as SIGNATURE_TAMPERED", () => {
        const bundleJson = exportProfileBundle(mockProfile);

        // Simulate machine-local key change
        const originalGetKey = mockStateManager.getBundleSigningKey;
        mockStateManager.getBundleSigningKey = () => "new-rotated-key";

        const status = verifyBundleAuthenticity(bundleJson);
        assert.equal(status, "SIGNATURE_TAMPERED", "Signature from a different machine/key must be marked as tampered");

        // Restore
        mockStateManager.getBundleSigningKey = originalGetKey;
    });
});
