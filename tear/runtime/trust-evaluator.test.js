const test = require("node:test");
const assert = require("node:assert");
const { getActiveProfile, checkProfileDrift, resolveProfileTrustState } = require("../../src/runtime/trust-evaluator.js");

test.describe("Trust Evaluator Module", () => {

    test.describe("getActiveProfile", () => {
        const mockState = {
            settings: {
                activeProfileId: "prof-1",
                connectionProfiles: [
                    { id: "prof-1", name: "Alpha", provider: "ollama" },
                    { id: "prof-2", name: "Beta", provider: "openai" }
                ]
            }
        };

        test.it("should return the matching active profile", () => {
            const result = getActiveProfile(mockState);
            assert.deepStrictEqual(result, mockState.settings.connectionProfiles[0]);
        });

        test.it("should return null if no matching profile found", () => {
            const badState = { settings: { activeProfileId: "prof-3", connectionProfiles: [] } };
            assert.equal(getActiveProfile(badState), null);
        });

        test.it("should handle null state safely", () => {
            assert.equal(getActiveProfile(null), null);
        });
    });

    test.describe("checkProfileDrift", () => {
        const mockApiState = {
            TRUST_STATES: {
                VERIFIED: "VERIFIED",
                DRIFTED: "DRIFTED",
                MISSING_SECRET: "MISSING_SECRET",
                INVALID: "INVALID",
                NEEDS_REVIEW: "NEEDS_REVIEW"
            },
            retrieveSecret: (id) => id === "prof-secret-ok",
            calculateProfileFingerprint: (p) => "fingerprint-123"
        };

        test.it("should return INVALID for null profile", () => {
            assert.equal(checkProfileDrift(null, mockApiState), "INVALID");
        });

        test.it("should check MISSING_SECRET for restricted providers without custody", () => {
            const profile = { id: "prof-secret-bad", provider: "openai" };
            assert.equal(checkProfileDrift(profile, mockApiState), "MISSING_SECRET");
        });

        test.it("should check fingerprint for VERIFIED state", () => {
            const profile = { id: "prof-secret-ok", provider: "openai", lastVerifiedFingerprint: "fingerprint-123" };
            assert.equal(checkProfileDrift(profile, mockApiState), "VERIFIED");
        });

        test.it("should check fingerprint for DRIFTED state", () => {
            const profile = { id: "prof-secret-ok", provider: "openai", lastVerifiedFingerprint: "fingerprint-wrong" };
            assert.equal(checkProfileDrift(profile, mockApiState), "DRIFTED");
        });

        test.it("should return NEEDS_REVIEW if currently flagged", () => {
            const profile = { id: "prof-ollama", provider: "ollama", trustState: "NEEDS_REVIEW" };
            assert.equal(checkProfileDrift(profile, mockApiState), "NEEDS_REVIEW");
        });

        test.it("should return unknown if NO last fingerprint or flag", () => {
            const profile = { id: "prof-ollama", provider: "ollama" };
            assert.equal(checkProfileDrift(profile, mockApiState), "unknown");
        });
    });

    test.describe("resolveProfileTrustState", () => {
        const mockApiState = {
            TRUST_STATES: {
                VERIFIED: "VERIFIED",
                DRIFTED: "DRIFTED",
                MISSING_SECRET: "MISSING_SECRET",
                INVALID: "INVALID",
                NEEDS_REVIEW: "NEEDS_REVIEW"
            },
            retrieveSecret: () => true,
            calculateProfileFingerprint: () => "fingerprint"
        };

        test.it("should return INVALID for null", () => {
            assert.equal(resolveProfileTrustState(null, mockApiState), "INVALID");
        });

        test.it("should trap SIGNATURE_TAMPERED immediately", () => {
            const profile = { id: "p", provider: "ollama", authenticity: "SIGNATURE_TAMPERED" };
            assert.equal(resolveProfileTrustState(profile, mockApiState), "SIGNATURE_TAMPERED");
        });

        test.it("should trap OFFLINE_LOCKED immediately", () => {
            const profile = { id: "p", provider: "ollama", trustState: "OFFLINE_LOCKED" };
            assert.equal(resolveProfileTrustState(profile, mockApiState), "OFFLINE_LOCKED");
        });

        test.it("should fallback to checkProfileDrift dynamically", () => {
            const profile = { id: "p", provider: "ollama", lastVerifiedFingerprint: "wrong" };
            // checkProfileDrift will evaluate to DRIFTED
            assert.equal(resolveProfileTrustState(profile, mockApiState), "DRIFTED");
        });
    });

});
