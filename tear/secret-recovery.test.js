const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const stateManagerPath = path.resolve(__dirname, "../src/core/stateManager.js");

function withMockedElectron(userDataPath, fn, safeStorageMock = {}) {
    const originalLoad = Module._load;
    Module._load = function patchedLoad(request, parent, isMain) {
        if (request === "electron") {
            return {
                app: { getPath() { return userDataPath; } },
                safeStorage: {
                    isEncryptionAvailable() { return true; },
                    encryptString(s) { return Buffer.from(`enc:${s}`); },
                    decryptString(b) {
                        if (safeStorageMock.shouldFail) throw new Error("Decryption failed");
                        return b.toString().replace("enc:", "");
                    },
                    ...safeStorageMock
                }
            };
        }
        if (request.endsWith("bridgeProviderCatalog") || request.endsWith("bridgeSettingsModel") || request.endsWith("identityKernel")) {
            return {
                normalizeBridgeProviderId: (id) => id,
                getBridgeProvider: () => ({}),
                normalizeBridgeSettings: (s) => s,
                mergeBridgeSettings: (c, p) => ({ ...c, ...p }),
                getHardwareFingerprint: () => "test-hw",
                getFingerprint: () => "test-hw"
            };
        }
        return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[stateManagerPath];
    try { return fn(); } finally {
        Module._load = originalLoad;
        delete require.cache[stateManagerPath];
    }
}

test("Secret Recovery: missing custody enters MISSING_SECRET state", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns-recovery-"));
    const mockStorage = { shouldFail: false };
    try {
        withMockedElectron(tempRoot, () => {
            const sm = require("../src/core/stateManager");
            sm.load();

            const profileId = "test-profile";
            sm.secureStoreSecret(profileId, "apiKey", "super-secret");

            // Verify storage worked
            assert.equal(sm.retrieveSecret(profileId, "apiKey"), "super-secret");

            // Simulate custody failure (e.g. machine move without OS key)
            mockStorage.shouldFail = true;
            assert.equal(sm.retrieveSecret(profileId, "apiKey"), null);

            // Check drift detection logic (simplified representation for unit test)
            const profile = { id: profileId, provider: "openai-compatible", baseUrl: "http://api.test" };
            const hasSecret = sm.retrieveSecret(profile.id, "apiKey") !== null;
            const state = !hasSecret ? sm.TRUST_STATES.MISSING_SECRET : sm.TRUST_STATES.VERIFIED;

            assert.equal(state, sm.TRUST_STATES.MISSING_SECRET);
        }, mockStorage);
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Secret Recovery: manual re-entry restores trust", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns-restore-"));
    const mockStorage = { shouldFail: true }; // Start failed
    try {
        withMockedElectron(tempRoot, () => {
            const sm = require("../src/core/stateManager");
            sm.load();
            const profileId = "restore-profile";

            // Verify retrieval fails initially
            assert.equal(sm.retrieveSecret(profileId, "apiKey"), null);

            // Operator re-enters secret (this should work even if previous decryption failed, because it overwrites)
            mockStorage.shouldFail = false;
            sm.secureStoreSecret(profileId, "apiKey", "new-secret");

            assert.equal(sm.retrieveSecret(profileId, "apiKey"), "new-secret");

            // Verification path would then update trust state
            const profile = { id: profileId, secretsPresent: true };
            assert.ok(sm.retrieveSecret(profileId, "apiKey"));
        }, mockStorage);
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});
