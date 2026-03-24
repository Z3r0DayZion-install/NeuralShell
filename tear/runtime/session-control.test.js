const test = require("node:test");
const assert = require('assert');

// Mock global dependencies before requiring the module
global.getActiveProfile = (state) => {
    if (state && state.settings && state.settings.activeProfileId === "prof-1") {
        return { id: "prof-1", name: "Mock Profile", trustState: "VERIFIED" };
    }
    return null;
};

global.resolveProfileTrustState = (profile, apiState) => {
    return profile.trustState;
};

const { performDisconnect, performOfflineEntry } = require("../../src/runtime/session-control.js");

test.describe("Session Control Module", () => {

    test.describe("performDisconnect", () => {
        test.it("should clear chat and model state", () => {
            const state = { chat: [{ role: "user" }], model: "llama3", settings: { activeProfileId: "prof-1" } };
            const apiState = { logProfileEvent: () => { } };

            const result = performDisconnect(state, apiState);

            assert.deepStrictEqual(state.chat, []);
            assert.strictEqual(state.model, null);
            assert.strictEqual(result.statusText, "Disconnected");
            assert.strictEqual(result.trustState, "VERIFIED");
            assert.deepStrictEqual(result.profileToRender, { id: "prof-1", name: "Mock Profile", trustState: "VERIFIED" });
        });

        test.it("should handle null state gracefully", () => {
            const result = performDisconnect(null, null);
            assert.strictEqual(result.profileToRender, null);
            assert.strictEqual(result.trustState, null);
            assert.strictEqual(result.statusText, "Disconnected");
        });

        test.it("should log telemetry if profile and apiState exist", () => {
            const state = { settings: { activeProfileId: "prof-1" } };
            let loggedId = null;
            let loggedType = null;
            const apiState = {
                logProfileEvent: (id, type) => {
                    loggedId = id;
                    loggedType = type;
                }
            };

            performDisconnect(state, apiState);
            assert.strictEqual(loggedId, "prof-1");
            assert.strictEqual(loggedType, "session_disconnected");
        });
    });

    test.describe("performOfflineEntry", () => {
        test.it("should clear session state and lock profile to offline", () => {
            const state = { chat: [{ role: "user" }], model: "llama3", settings: { activeProfileId: "prof-1" } };
            const profiles = [{ id: "prof-1", trustState: "VERIFIED" }];
            const apiState = { logProfileEvent: () => { } };

            const result = performOfflineEntry(state, profiles, apiState);

            assert.deepStrictEqual(state.chat, []);
            assert.strictEqual(state.model, null);

            assert.strictEqual(result.profileToRender.id, "prof-1");
            assert.strictEqual(result.profileToRender.trustState, "OFFLINE_LOCKED");
            assert.strictEqual(result.trustState, "OFFLINE_LOCKED");
            assert.deepStrictEqual(result.settingsPatch, { connectionProfiles: profiles });
            assert.strictEqual(result.setOfflineCheckbox, true);
        });

        test.it("should handle offline entry without active profile", () => {
            const state = { settings: { activeProfileId: "none" } };
            let loggedId = null;
            const apiState = {
                logProfileEvent: (id) => { loggedId = id; }
            };

            const result = performOfflineEntry(state, [], apiState);

            assert.strictEqual(result.profileToRender, null);
            assert.strictEqual(result.trustState, null);
            assert.strictEqual(loggedId, "unknown");
        });
    });

});
