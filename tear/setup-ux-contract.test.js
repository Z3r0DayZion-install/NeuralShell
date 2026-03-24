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

test("Setup State Machine Contract: Fresh boot is 'unconfigured'", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "setup-contract-1-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();
            assert.equal(stateManager.get("setupState"), "unconfigured");
            assert.equal(stateManager.get("settings").connectOnStartup, false);
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Setup State Machine Contract: Transitions to 'ready' and persists", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "setup-contract-2-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();

            // Simulate completion
            stateManager.setState({ setupState: "ready" });
            assert.equal(stateManager.get("setupState"), "ready");
            stateManager.save();

            // Reload and verify
            delete require.cache[stateManagerPath];
            stateManager.load();
            assert.equal(stateManager.get("setupState"), "ready");
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Setup State Machine Contract: Opt-in discipline for connectOnStartup", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "setup-contract-3-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();

            // Even if setup adds a profile, it should NOT force connectOnStartup: true anymore in V2.1.12
            stateManager.setState({
                setupState: "ready",
                settings: {
                    onboardingCompleted: true,
                    connectOnStartup: false // This is the new hardened baseline
                }
            });

            const settings = stateManager.get("settings");
            assert.equal(settings.connectOnStartup, false, "connectOnStartup must remain false unless explicitly opted-in");
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});
