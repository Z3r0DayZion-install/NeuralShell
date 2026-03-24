const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const stateManagerPath = path.resolve(__dirname, "../src/core/stateManager.js");

function withMockedElectron(userDataPath, fn) {
    const originalLoad = Module._load;
    Module._load = function patchedLoad(request, parent, isMain) {
        if (request === "electron") {
            return {
                app: {
                    getPath(_name) { return userDataPath; },
                    getAppPath() { return userDataPath; }
                },
                safeStorage: {
                    isEncryptionAvailable() { return false; }
                }
            };
        }
        if (request === "@neural/omega-core") {
            return {
                createKernel: () => ({ request: async () => ({}) }),
                CAP_FS: "fs", CAP_NET: "net", CAP_PROC: "proc", CAP_CRYPTO: "crypto", CAP_KEYCHAIN: "keychain"
            };
        }
        if (request.endsWith("identityKernel") || request === "./identityKernel") {
            return {
                getFingerprint: () => "test-fingerprint",
                getHardwareFingerprint: () => "test-hardware-binding",
                init: async () => true
            };
        }
        return originalLoad.call(this, request, parent, isMain);
    };

    delete require.cache[stateManagerPath];
    try {
        return fn();
    } finally {
        Module._load = originalLoad;
        delete require.cache[stateManagerPath];
    }
}

test("Recovery Contract: Saved profiles are correctly initialized in defaultSettings", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "recovery-contract-1-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();
            const settings = stateManager.get("settings");
            assert.ok(Array.isArray(settings.connectionProfiles));
            // In NeuralShell, a fresh boot seeds a "local-default" profile via bridgeSettingsModel
            assert.equal(settings.connectionProfiles.length, 1);
            assert.equal(settings.connectionProfiles[0].id, "local-default");
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Recovery Contract: STATE_VERSION 6 is enforced", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "recovery-contract-2-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();
            assert.equal(stateManager.get("stateVersion"), 6);
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Recovery Contract: connectOnStartup is false unless opted-in", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "recovery-contract-3-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();

            // Seed a profile
            stateManager.setState({
                settings: {
                    connectionProfiles: [{ id: "p1", name: "Test", provider: "ollama", baseUrl: "x" }],
                    activeProfileId: "p1",
                    connectOnStartup: false
                }
            });
            stateManager.save();

            // Reload
            delete require.cache[stateManagerPath];
            stateManager.load();
            assert.equal(stateManager.get("settings").connectOnStartup, false);
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});
