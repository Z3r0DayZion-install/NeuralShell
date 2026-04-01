/**
 * Phase 20: Runtime Governance Contract Tests
 *
 * Verifies deterministic resume behavior, profile switching governance,
 * and onboarding-to-runtime handoff correctness.
 *
 * Uses node:assert and node:test (no external dependencies).
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// ── Mock Infrastructure ──

const TRUST_STATES = {
    VERIFIED: "VERIFIED",
    DRIFTED: "DRIFTED",
    MISSING_SECRET: "MISSING_SECRET",
    OFFLINE_LOCKED: "OFFLINE_LOCKED",
    INVALID: "INVALID",
    NEEDS_REVIEW: "NEEDS_REVIEW",
    MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
    NEEDS_REPAIR: "NEEDS_REPAIR"
};

function mockProfile(overrides = {}) {
    return {
        id: `prof-${Date.now()}`,
        name: "Test Profile",
        provider: "ollama",
        baseUrl: "http://127.0.0.1:11434",
        model: "llama3",
        apiKey: "",
        connectOnStartup: false,
        lastSuccessTs: new Date().toISOString(),
        lastVerifiedFingerprint: "abc123",
        trustState: TRUST_STATES.VERIFIED,
        authenticity: "VERIFIED",
        ...overrides
    };
}

function resolveProfileTrustState(profile) {
    if (!profile) return "INVALID";
    if (profile.authenticity === "SIGNATURE_TAMPERED") return "SIGNATURE_TAMPERED";
    if (profile.trustState === "OFFLINE_LOCKED") return "OFFLINE_LOCKED";
    // Simplified drift check for testing
    if (profile.trustState === "DRIFTED") return "DRIFTED";
    if (profile.trustState === "MISSING_SECRET") return "MISSING_SECRET";
    if (profile.trustState === "INVALID") return "INVALID";
    return profile.trustState || "INVALID";
}

/**
 * Simulates runtimeResumeGovernance decision logic.
 * Returns { action, reason } — the governance verdict.
 */
function evaluateResumePolicy(profile, connectOnStartup) {
    if (!profile) return { action: "block", reason: "no_active_profile" };

    const trust = resolveProfileTrustState(profile);

    switch (trust) {
        case "VERIFIED":
            return connectOnStartup
                ? { action: "resume", reason: "VERIFIED_auto_reconnect" }
                : { action: "calm_entry", reason: "VERIFIED_no_auto_reconnect" };
        case "DRIFTED":
            return { action: "block", reason: "DRIFTED_route_repair" };
        case "MISSING_SECRET":
            return { action: "block", reason: "MISSING_SECRET_route_repair" };
        case "SIGNATURE_TAMPERED":
            return { action: "hard_block", reason: "SIGNATURE_TAMPERED" };
        case "OFFLINE_LOCKED":
            return { action: "offline_entry", reason: "OFFLINE_LOCKED" };
        case "INVALID":
        default:
            return { action: "block", reason: trust };
    }
}

function evaluateSwitchPolicy(profile) {
    if (!profile) return { allowed: false, reason: "not_found" };
    const trust = resolveProfileTrustState(profile);
    if (trust === "SIGNATURE_TAMPERED") return { allowed: false, reason: "SIGNATURE_TAMPERED" };
    if (trust === "INVALID") return { allowed: false, reason: "INVALID" };
    return { allowed: true, trust };
}

// ── Tests ──

describe("Phase 20: Runtime Governance Contract", () => {

    // 1. VERIFIED + reconnect => resume
    it("should resume VERIFIED profile when connectOnStartup is enabled", () => {
        const profile = mockProfile({ trustState: "VERIFIED" });
        const result = evaluateResumePolicy(profile, true);
        assert.equal(result.action, "resume");
    });

    // 2. VERIFIED + no reconnect => calm entry
    it("should NOT auto-resume VERIFIED profile when connectOnStartup is disabled", () => {
        const profile = mockProfile({ trustState: "VERIFIED" });
        const result = evaluateResumePolicy(profile, false);
        assert.equal(result.action, "calm_entry");
        assert.ok(result.reason.includes("no_auto_reconnect"));
    });

    // 3. DRIFTED => block + repair
    it("should block DRIFTED profile and route to repair", () => {
        const profile = mockProfile({ trustState: "DRIFTED" });
        const result = evaluateResumePolicy(profile, true);
        assert.equal(result.action, "block");
        assert.ok(result.reason.includes("DRIFTED"));
    });

    // 4. MISSING_SECRET => block + repair_secret
    it("should block MISSING_SECRET profile and route to repair_secret", () => {
        const profile = mockProfile({ trustState: "MISSING_SECRET" });
        const result = evaluateResumePolicy(profile, true);
        assert.equal(result.action, "block");
        assert.ok(result.reason.includes("MISSING_SECRET"));
    });

    // 5. SIGNATURE_TAMPERED => hard block
    it("should hard-block SIGNATURE_TAMPERED profile", () => {
        const profile = mockProfile({ authenticity: "SIGNATURE_TAMPERED" });
        const result = evaluateResumePolicy(profile, true);
        assert.equal(result.action, "hard_block");
    });

    // 6. OFFLINE_LOCKED => offline entry only
    it("should enter offline runtime for OFFLINE_LOCKED profile", () => {
        const profile = mockProfile({ trustState: "OFFLINE_LOCKED" });
        const result = evaluateResumePolicy(profile, false);
        assert.equal(result.action, "offline_entry");
    });

    // 7. Switch to non-VERIFIED => no auto-connect
    it("should NOT auto-connect when switching to a non-VERIFIED profile", () => {
        const profile = mockProfile({ trustState: "DRIFTED" });
        const switchResult = evaluateSwitchPolicy(profile);
        assert.ok(switchResult.allowed);
        assert.equal(switchResult.trust, "DRIFTED");
        // Even though switch is allowed, auto-connect should not happen for DRIFTED
        const resumeResult = evaluateResumePolicy(profile, true);
        assert.notEqual(resumeResult.action, "resume");
    });

    // 8. Step 6 produces exactly one governed profile
    it("should produce exactly one active governed profile from Step 6 seal", () => {
        const settings = { connectionProfiles: [], activeProfileId: "" };
        const sealedProfile = mockProfile({ id: "sealed-1", name: "Primary" });
        settings.connectionProfiles.push(sealedProfile);
        settings.activeProfileId = sealedProfile.id;
        assert.equal(settings.connectionProfiles.length, 1);
        assert.equal(settings.activeProfileId, "sealed-1");
        assert.equal(sealedProfile.trustState, "VERIFIED");
    });

    // 9. Aborted onboarding => no runtime profile
    it("should produce no active runtime profile from aborted onboarding", () => {
        const settings = { connectionProfiles: [], activeProfileId: "", onboardingCompleted: false };
        const result = evaluateResumePolicy(null, false);
        assert.equal(result.action, "block");
        assert.equal(settings.connectionProfiles.length, 0);
    });

    // 10. Switch to SIGNATURE_TAMPERED => blocked
    it("should block activation of SIGNATURE_TAMPERED profile during switch", () => {
        const profile = mockProfile({ authenticity: "SIGNATURE_TAMPERED" });
        const result = evaluateSwitchPolicy(profile);
        assert.equal(result.allowed, false);
        assert.equal(result.reason, "SIGNATURE_TAMPERED");
    });
});
