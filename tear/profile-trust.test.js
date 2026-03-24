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
        if (request === "electron" || request === "node:electron") {
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
                getFingerprint: () => "trust-fingerprint",
                getHardwareFingerprint: () => "trust-hardware",
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

test("Profile Trust: calculateProfileFingerprint is deterministic", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "profile-trust-1-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            const p1 = { provider: "ollama", baseUrl: "x", apiKey: "y" };
            const f1 = stateManager.calculateProfileFingerprint(p1);
            const f2 = stateManager.calculateProfileFingerprint(p1);
            assert.equal(f1, f2);
            assert.ok(f1.length > 0);

            const p2 = { provider: "ollama", baseUrl: "x", apiKey: "z" };
            const f3 = stateManager.calculateProfileFingerprint(p2);
            assert.notEqual(f1, f3);
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Profile Trust: drifted state is detected", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "profile-trust-2-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            const p1 = { provider: "ollama", baseUrl: "x", apiKey: "y" };
            const fingerprint = stateManager.calculateProfileFingerprint(p1);

            p1.lastVerifiedFingerprint = fingerprint;

            // No change
            const currentFingerprint = stateManager.calculateProfileFingerprint(p1);
            assert.equal(currentFingerprint, p1.lastVerifiedFingerprint);

            // Change base URL
            p1.baseUrl = "z";
            const driftedFingerprint = stateManager.calculateProfileFingerprint(p1);
            assert.notEqual(driftedFingerprint, p1.lastVerifiedFingerprint);
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});

test("Profile Trust: repairTelemetryLog persists events", () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "profile-trust-3-"));
    try {
        withMockedElectron(tempRoot, () => {
            const stateManager = require("../src/core/stateManager");
            stateManager.load();
            stateManager.addRepairTelemetry({ profileId: "p1", type: "test", reason: "unit test" });

            const settings = stateManager.get("settings");
            assert.equal(settings.repairTelemetryLog.length, 1);
            assert.equal(settings.repairTelemetryLog[0].type, "test");
        });
    } finally {
        fs.rmSync(tempRoot, { recursive: true, force: true });
    }
});
