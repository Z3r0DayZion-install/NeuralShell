/**
 * Phase 23: Runtime Governance Contract Test
 * 
 * Validates all 7 trust-state entry scenarios (A–G) and 5 control-surface actions.
 * Runs all module code + test assertions inside a shared vm context to properly
 * replicate browser global scope where all <script> tags share a namespace.
 */

const test = require("node:test");
const assert = require("node:assert");
const vm = require("node:vm");
const fs = require("node:fs");
const path = require("node:path");

// Load all module source code
const runtimeDir = path.join(__dirname, "..", "src", "runtime");
const moduleFiles = [
    "trust-evaluator.js",
    "session-control.js",
    "profile-switcher.js",
    "runtime-governance.js",
    "active-profile-bar.js"
];
const moduleCode = moduleFiles.map(f => fs.readFileSync(path.join(runtimeDir, f), "utf8")).join("\n;\n");

// Shared mock API state
const mockApiState = {
    TRUST_STATES: {
        VERIFIED: "VERIFIED",
        DRIFTED: "DRIFTED",
        MISSING_SECRET: "MISSING_SECRET",
        OFFLINE_LOCKED: "OFFLINE_LOCKED",
        INVALID: "INVALID",
        SIGNATURE_TAMPERED: "SIGNATURE_TAMPERED",
        NEEDS_REVIEW: "NEEDS_REVIEW"
    },
    logProfileEvent: () => { },
    retrieveSecret: (id) => id !== "prof-missing-secret",
    calculateProfileFingerprint: (p) => p._expectedFingerprint || "fingerprint-live"
};

/**
 * Evaluate an expression inside a vm context that has all modules loaded.
 * The expression receives `state` and `api` as globals.
 */
function evalInModuleScope(expr, state) {
    const ctx = vm.createContext({ console, setTimeout, clearTimeout, module: { exports: {} } });
    vm.runInContext(moduleCode, ctx);
    ctx._state = state;
    ctx._api = mockApiState;
    return vm.runInContext(expr, ctx);
}

// ═══════════════════════════════════════════════════════
// Section 1: Runtime Entry Scenarios (A–G)
// ═══════════════════════════════════════════════════════

test.describe("Runtime Entry Governance Contract", () => {

    test.describe("Scenario A: VERIFIED + reconnect ON", () => {
        test.it("should allow auto-resume with runAutoDetect", () => {
            const result = evalInModuleScope(`
                const intent = runtimeResumeGovernance(_state, _api);
                JSON.stringify(intent);
            `, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: true,
                    activeProfileId: "prof-v",
                    connectionProfiles: [{
                        id: "prof-v", name: "Verified Profile", provider: "ollama",
                        lastVerifiedFingerprint: "fingerprint-live", _expectedFingerprint: "fingerprint-live",
                        lastSuccessTs: "2026-03-20T00:00:00Z"
                    }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.action, "apply_policy");
            assert.strictEqual(intent.trustState, "VERIFIED");
            assert.strictEqual(intent.runAutoDetect, true);
            assert.strictEqual(intent.logEvent.type, "runtime_resume_allowed");
            assert.strictEqual(intent.banner, null);
        });

        test.it("APB should show VERIFIED state with reconnect ON", () => {
            const result = evalInModuleScope(`
                const p = getActiveProfile(_state);
                JSON.stringify(generateActiveProfileBarState(p, "VERIFIED", _state));
            `, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: true,
                    activeProfileId: "prof-v",
                    connectionProfiles: [{
                        id: "prof-v", name: "Verified Profile", provider: "ollama",
                        lastVerifiedFingerprint: "fingerprint-live", lastSuccessTs: "2026-03-20T00:00:00Z"
                    }]
                }
            });
            const apb = JSON.parse(result);
            assert.strictEqual(apb.isHidden, false);
            assert.strictEqual(apb.isBlocked, false);
            assert.strictEqual(apb.isOffline, false);
            assert.ok(apb.badgeClass.includes("trust-verified"));
            assert.strictEqual(apb.reconnectText, "Auto-Reconnect: ON");
            assert.strictEqual(apb.nameText, "Verified Profile");
        });
    });

    test.describe("Scenario B: VERIFIED + reconnect OFF", () => {
        test.it("should enter calmly without auto-resume", () => {
            const result = evalInModuleScope(`JSON.stringify(runtimeResumeGovernance(_state, _api));`, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: false,
                    activeProfileId: "prof-v",
                    connectionProfiles: [{
                        id: "prof-v", name: "Calm Profile", provider: "ollama",
                        lastVerifiedFingerprint: "fingerprint-live", _expectedFingerprint: "fingerprint-live"
                    }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.trustState, "VERIFIED");
            assert.strictEqual(intent.runAutoDetect, false);
            assert.strictEqual(intent.logEvent.type, "runtime_resume_blocked");
            assert.ok(intent.logEvent.msg.includes("Calm entry"));
            assert.strictEqual(intent.banner, null);
        });

        test.it("APB should show reconnect OFF", () => {
            const result = evalInModuleScope(`
                const p = getActiveProfile(_state);
                JSON.stringify(generateActiveProfileBarState(p, "VERIFIED", _state));
            `, {
                settings: { connectOnStartup: false, activeProfileId: "p", connectionProfiles: [{ id: "p", name: "P", provider: "ollama" }] }
            });
            const apb = JSON.parse(result);
            assert.strictEqual(apb.reconnectText, "Auto-Reconnect: OFF");
        });
    });

    test.describe("Scenario C: DRIFTED profile", () => {
        test.it("should block auto-resume and show repair banner", () => {
            const result = evalInModuleScope(`JSON.stringify(runtimeResumeGovernance(_state, _api));`, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: true,
                    activeProfileId: "prof-d",
                    connectionProfiles: [{
                        id: "prof-d", name: "Drifted", provider: "ollama",
                        lastVerifiedFingerprint: "fingerprint-old", _expectedFingerprint: "fingerprint-live"
                    }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.trustState, "DRIFTED");
            assert.strictEqual(intent.runAutoDetect, false);
            assert.strictEqual(intent.logEvent.type, "runtime_resume_blocked");
            assert.ok(intent.banner.msg.includes("drift"));
            assert.strictEqual(intent.banner.type, "bad");
        });

        test.it("APB should show DRIFTED blocked state", () => {
            const result = evalInModuleScope(`
                JSON.stringify(generateActiveProfileBarState({ name: "D", provider: "ollama" }, "DRIFTED", _state));
            `, { settings: {} });
            const apb = JSON.parse(result);
            assert.strictEqual(apb.isBlocked, true);
            assert.ok(apb.badgeClass.includes("trust-drifted"));
        });
    });

    test.describe("Scenario D: MISSING_SECRET profile", () => {
        test.it("should block and route to secret recovery", () => {
            const result = evalInModuleScope(`JSON.stringify(runtimeResumeGovernance(_state, _api));`, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: true,
                    activeProfileId: "prof-missing-secret",
                    connectionProfiles: [{
                        id: "prof-missing-secret", name: "Missing Secret", provider: "openai",
                        lastVerifiedFingerprint: "fingerprint-live", _expectedFingerprint: "fingerprint-live"
                    }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.trustState, "MISSING_SECRET");
            assert.strictEqual(intent.runAutoDetect, false);
            assert.strictEqual(intent.logEvent.type, "runtime_resume_blocked");
            assert.ok(intent.banner.msg.includes("Secret"));
        });

        test.it("APB should show MISSING_SECRET blocked", () => {
            const result = evalInModuleScope(`
                JSON.stringify(generateActiveProfileBarState({ name: "MS", provider: "openai" }, "MISSING_SECRET", _state));
            `, { settings: {} });
            const apb = JSON.parse(result);
            assert.strictEqual(apb.isBlocked, true);
            assert.ok(apb.badgeClass.includes("trust-missing-secret"));
        });
    });

    test.describe("Scenario E: SIGNATURE_TAMPERED profile", () => {
        test.it("should hard block with critical banner", () => {
            const result = evalInModuleScope(`JSON.stringify(runtimeResumeGovernance(_state, _api));`, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: true,
                    activeProfileId: "prof-t",
                    connectionProfiles: [{
                        id: "prof-t", name: "Tampered", provider: "ollama",
                        authenticity: "SIGNATURE_TAMPERED"
                    }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.trustState, "SIGNATURE_TAMPERED");
            assert.strictEqual(intent.runAutoDetect, false);
            assert.ok(intent.banner.msg.includes("CRITICAL"));
        });

        test.it("APB should show hard block", () => {
            const result = evalInModuleScope(`
                JSON.stringify(generateActiveProfileBarState({ name: "T", provider: "ollama" }, "SIGNATURE_TAMPERED", _state));
            `, { settings: {} });
            const apb = JSON.parse(result);
            assert.strictEqual(apb.isBlocked, true);
            assert.ok(apb.badgeClass.includes("trust-tampered"));
        });
    });

    test.describe("Scenario F: OFFLINE_LOCKED profile", () => {
        test.it("should enter offline mode without remote actions", () => {
            const result = evalInModuleScope(`JSON.stringify(runtimeResumeGovernance(_state, _api));`, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: false,
                    activeProfileId: "prof-o",
                    connectionProfiles: [{
                        id: "prof-o", name: "Offline", provider: "ollama",
                        trustState: "OFFLINE_LOCKED"
                    }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.trustState, "OFFLINE_LOCKED");
            assert.strictEqual(intent.runAutoDetect, false);
            assert.strictEqual(intent.logEvent.type, "offline_entry");
            assert.strictEqual(intent.banner, null);
        });

        test.it("APB should show offline posture", () => {
            const result = evalInModuleScope(`
                JSON.stringify(generateActiveProfileBarState({ name: "O", provider: "ollama" }, "OFFLINE_LOCKED", _state));
            `, { settings: {} });
            const apb = JSON.parse(result);
            assert.strictEqual(apb.isOffline, true);
            assert.strictEqual(apb.isBlocked, false);
            assert.ok(apb.badgeClass.includes("trust-offline"));
        });
    });

    test.describe("Scenario G: INVALID profile", () => {
        test.it("should block runtime activation", () => {
            const result = evalInModuleScope(`JSON.stringify(runtimeResumeGovernance(_state, _api));`, {
                settings: {
                    onboardingCompleted: true, connectOnStartup: true,
                    activeProfileId: "prof-i",
                    connectionProfiles: [{ id: "prof-i", name: "Invalid", provider: "ollama" }]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.runAutoDetect, false);
            assert.strictEqual(intent.logEvent.type, "runtime_resume_blocked");
        });
    });
});

// ═══════════════════════════════════════════════════════
// Section 2: Control-Surface Actions
// ═══════════════════════════════════════════════════════

test.describe("Control-Surface Action Contract", () => {

    test.describe("Switch Profile (allowed)", () => {
        test.it("should return success intent with new profile", () => {
            const result = evalInModuleScope(`JSON.stringify(evaluateProfileSwitch("prof-2", _state, _api));`, {
                settings: {
                    connectOnStartup: true, activeProfileId: "prof-1",
                    connectionProfiles: [
                        { id: "prof-1", name: "Primary", provider: "ollama", lastVerifiedFingerprint: "fingerprint-live", _expectedFingerprint: "fingerprint-live" },
                        { id: "prof-2", name: "Secondary", provider: "ollama", lastVerifiedFingerprint: "fingerprint-live", _expectedFingerprint: "fingerprint-live" }
                    ]
                }
            });
            const intent = JSON.parse(result);
            assert.strictEqual(intent.success, true);
            assert.strictEqual(intent.patchIntent.activeProfileId, "prof-2");
            assert.strictEqual(intent.trustState, "VERIFIED");
        });
    });

    test.describe("Switch Profile (blocked — SIGNATURE_TAMPERED)", () => {
        test.it("should return error and block activation", () => {
            const result = evalInModuleScope(`JSON.stringify(evaluateProfileSwitch("prof-t", _state, _api));`, {
                settings: {
                    activeProfileId: "prof-1",
                    connectionProfiles: [
                        { id: "prof-1", name: "OK", provider: "ollama" },
                        { id: "prof-t", name: "Tampered", provider: "ollama", authenticity: "SIGNATURE_TAMPERED" }
                    ]
                }
            });
            const intent = JSON.parse(result);
            assert.ok(intent.error);
            assert.ok(intent.error.includes("SIGNATURE_TAMPERED"));
        });
    });

    test.describe("Disconnect", () => {
        test.it("should clear session and return disconnect intent", () => {
            const result = evalInModuleScope(`
                _state.chat = [{ role: "user" }]; _state.model = "llama3";
                const r = performDisconnect(_state, _api);
                JSON.stringify({ chat: _state.chat, model: _state.model, status: r.statusText, bannerType: r.bannerType });
            `, {
                settings: { activeProfileId: "p", connectionProfiles: [{ id: "p", name: "P", provider: "ollama" }] }
            });
            const r = JSON.parse(result);
            assert.strictEqual(r.chat.length, 0);
            assert.strictEqual(r.model, null);
            assert.strictEqual(r.status, "Disconnected");
            assert.strictEqual(r.bannerType, "bad");
        });
    });

    test.describe("Offline Entry", () => {
        test.it("should lock profile to OFFLINE_LOCKED and clear session", () => {
            const result = evalInModuleScope(`
                _state.chat = [{ role: "user" }]; _state.model = "llama3";
                const profiles = _state.settings.connectionProfiles;
                const r = performOfflineEntry(_state, profiles, _api);
                JSON.stringify({ chat: _state.chat, model: _state.model, trustState: r.trustState, offline: r.setOfflineCheckbox, status: r.statusText });
            `, {
                settings: { activeProfileId: "p", connectionProfiles: [{ id: "p", name: "P", provider: "ollama" }] }
            });
            const r = JSON.parse(result);
            assert.strictEqual(r.chat.length, 0);
            assert.strictEqual(r.model, null);
            assert.strictEqual(r.trustState, "OFFLINE_LOCKED");
            assert.strictEqual(r.offline, true);
            assert.strictEqual(r.status, "Offline");
        });
    });

    test.describe("Profile Switch List", () => {
        test.it("should list all profiles with correct trust states", () => {
            const result = evalInModuleScope(`JSON.stringify(buildProfileSwitchList(_state, _api));`, {
                settings: {
                    activeProfileId: "prof-1",
                    connectionProfiles: [
                        { id: "prof-1", name: "Primary", provider: "ollama", lastVerifiedFingerprint: "fingerprint-live", _expectedFingerprint: "fingerprint-live" },
                        { id: "prof-t", name: "Tampered", provider: "ollama", authenticity: "SIGNATURE_TAMPERED" }
                    ]
                }
            });
            const list = JSON.parse(result);
            assert.strictEqual(list.profiles.length, 2);
            const primary = list.profiles.find(p => p.id === "prof-1");
            assert.strictEqual(primary.isActive, true);
            assert.strictEqual(primary.trustState, "VERIFIED");
            assert.strictEqual(primary.isBlocked, false);
            const tampered = list.profiles.find(p => p.id === "prof-t");
            assert.strictEqual(tampered.isBlocked, true);
            assert.strictEqual(tampered.trustState, "SIGNATURE_TAMPERED");
        });
    });
});
