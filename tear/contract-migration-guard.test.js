const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// 1. Setup isolation BEFORE requiring any modules
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-contract-migration-"));
process.env.NEURAL_USER_DATA_DIR = tempDir;

require("./mock-electron");
const assert = require("node:assert/strict");
const crypto = require("node:crypto"); // Keep existing require
const stateManager = require("../src/core/stateManager");
const sessionManager = require("../src/core/sessionManager");

/**
 * Phase 13: contract-migration-guard.test.js
 * 
 * Verifies legacy normalization, quarantine behavior, and negative guards.
 */

async function run() {
    console.log("Running Migration & Negative Guard Contract Tests...");

    // const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-contract-migration-")); // Moved
    // process.env.NEURAL_USER_DATA_DIR = tempDir; // Isolation // Moved

    const stateFile = stateManager.stateFile; // Changed to use stateManager's path
    fs.mkdirSync(path.dirname(stateFile), { recursive: true });

    try {
        // 1. Verify Legacy (V1/V2) Normalization
        console.log("  - Testing Legacy (V1/V2) Normalization...");
        const legacyState = {
            stateVersion: 2,
            model: "llama2",
            settings: {
                timeoutMs: 8000,
                theme: "light"
            }
        };
        fs.writeFileSync(stateFile, JSON.stringify(legacyState), "utf8");

        // Load should normalize to V9 and encrypt it
        const loaded = stateManager.load();
        assert.equal(loaded.stateVersion, 9, "Should normalize to V9");
        assert.equal(loaded.model, "llama2", "Should preserve model");
        assert.equal(loaded.settings.timeoutMs, 8000, "Should preserve setting");
        assert.equal(loaded.settings.theme, "light", "Should preserve theme");

        // Check that it's now encrypted on disk
        const onDisk = fs.readFileSync(stateFile, "utf8");
        assert(onDisk.startsWith("omega-v5:"), "Should be re-encrypted in OMEGA format (v5 prefix)");

        // 2. Verify Quarantine on Corrupted Secure Envelope
        console.log("  - Testing Quarantine on Corruption...");
        fs.writeFileSync(stateFile, "omega-v5:bad:iv:data", "utf8");

        const countBefore = fs.readdirSync(path.dirname(stateFile)).length;
        const quarantinedState = stateManager.load(); // Should fail to decrypt and quarantine
        const countAfter = fs.readdirSync(path.dirname(stateFile)).length;

        assert.equal(quarantinedState.stateVersion, 9, "Should return fresh default state");
        assert.equal(quarantinedState.model, null, "Should be fresh start");
        assert(countAfter > countBefore, "A quarantine .bak file should have been created");

        const files = fs.readdirSync(path.dirname(stateFile));
        assert(files.some(f => f.includes(".bak")), "Quarantined file missing from directory");

        // 3. Verify Negative Guards (StateManager)
        console.log("  - Testing StateManager Negative Guards...");
        // IPC Validators should block these if called via bridge, but we test the manager's logic too
        assert.throws(() => stateManager.set("__proto__", "bad"), "Should not allow proto pollution");

        // 4. Verify Negative Guards (SessionManager)
        console.log("  - Testing SessionManager Negative Guards...");
        assert.throws(() => sessionManager.saveSession("../evil", {}, "pass"), /invalid/i, "Should block path traversal in name");
        assert.throws(() => sessionManager.saveSession("con", {}, "pass"), /invalid/i, "Should block reserved Windows names");
        assert.throws(() => sessionManager.saveSession("  ", {}, "pass"), /invalid/i, "Should block empty/whitespace names");

        console.log("PASS: Migration & Negative Guards verified.");

    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

run().catch((err) => {
    console.error("FAIL: Migration & Negative Guard Contract violation!");
    console.error(err);
    process.exit(1);
});
