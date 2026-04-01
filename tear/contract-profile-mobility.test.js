const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// 1. Setup isolation BEFORE requiring any modules
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-contract-mobility-"));
process.env.NEURAL_USER_DATA_DIR = tempDir;

require("./mock-electron");
const assert = require("node:assert/strict");
const stateManager = require("../src/core/stateManager");
const profileMobility = require("../src/core/profileMobility");

/**
 * Phase 14: contract-profile-mobility.test.js
 * 
 * Verifies profile export/import, authenticity, and integrity.
 */

async function run() {
    console.log("Running Profile Mobility Contract Tests...");

    // Seed a profile
    const profileId = "node-alpha";
    const testProfile = {
        id: profileId,
        name: "Alpha Node",
        provider: "local",
        baseUrl: "http://localhost:11434",
        trustState: stateManager.TRUST_STATES.VERIFIED
    };
    stateManager.set("settings.connectionProfiles", [testProfile]);
    stateManager.secureStoreSecret(profileId, "apiKey", "sk-test-123");
    stateManager.save();

    try {
        // 1. Test Export (Metadata Only)
        console.log("  - Testing Metadata-Only Export...");
        const metaBundleJson = profileMobility.exportProfileBundle(profileId, false);
        const metaBundle = JSON.parse(metaBundleJson);
        assert.equal(metaBundle.schemaVersion, "V2.1.29", "Schema version must be correct");
        assert(!metaBundle.secrets, "Secrets must NOT be included by default");
        assert(metaBundle.integrity.bundleSignature, "Signature must be present");

        // 2. Test Export (With Secrets)
        console.log("  - Testing Export with Secrets...");
        const fullBundleJson = profileMobility.exportProfileBundle(profileId, true);
        const fullBundle = JSON.parse(fullBundleJson);
        assert(fullBundle.secrets && fullBundle.secrets.apiKey === "sk-test-123", "Secret must be included");

        // 3. Test Import (Verified)
        console.log("  - Testing Verified Import (Same Machine)...");
        const imported = profileMobility.importProfileBundle(fullBundleJson);
        assert.equal(imported.authenticity, "VERIFIED", "Signature should be verified on same machine");
        assert.equal(imported.trustState, stateManager.TRUST_STATES.DRIFTED, "Imported profiles must reset to DRIFTED");

        // 4. Test Negative: Integrity Tamper (Modify Data)
        console.log("  - Testing Data Tamper Detection...");
        const tamperedData = JSON.parse(fullBundleJson);
        tamperedData.profile.provider = "remote-evil";
        assert.throws(() => profileMobility.importProfileBundle(JSON.stringify(tamperedData)), /Integrity Validation Failed/i);

        // 5. Test Negative: Signature Tamper
        console.log("  - Testing Signature Tamper Detection...");
        const tamperedSig = JSON.parse(fullBundleJson);
        tamperedSig.integrity.bundleSignature = "deadbeef";
        const importedTampered = profileMobility.importProfileBundle(JSON.stringify(tamperedSig));
        assert.equal(importedTampered.authenticity, "SIGNATURE_TAMPERED", "Should detect tampered signature");

        console.log("PASS: Profile Mobility Contract verified.");

    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

run().catch((err) => {
    console.error("FAIL: Profile Mobility Contract violation!");
    console.error(err);
    process.exit(1);
});
