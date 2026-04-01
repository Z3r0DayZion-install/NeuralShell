/**
 * Phase 17: Forensic Fixture Generator
 * Generates static persistence payloads (State V9, Session V2, Mobility)
 * using a stable mock hardware fingerprint for reproducible auditing.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Enforce stable hardware fingerprint and isolated data dir
const FIXTURES_DIR = path.resolve(__dirname, "..", "tests", "fixtures", "persistence");
if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

process.env.NEURAL_USER_DATA_DIR = FIXTURES_DIR;
require("../tear/mock-electron"); // Applies stable MAC and paths

const stateManager = require("../src/core/stateManager");
const sessionManager = require("../src/core/sessionManager");
const profileMobility = require("../src/core/profileMobility");

function log(msg) {
    console.log(`[FIXTURES] ${msg}`);
}

async function generate() {
    log(`Generating forensic fixtures in ${FIXTURES_DIR}...`);

    // 1. Valid State V9
    stateManager.set("settings.theme", "dark");
    stateManager.save();
    const validStatePath = stateManager.stateFile;
    fs.copyFileSync(validStatePath, path.join(FIXTURES_DIR, "valid_state_v9.omega"));
    log("Generated valid_state_v9.omega");

    // 2. Legacy State (V4/V2 JSON)
    const legacyStatePath = path.join(FIXTURES_DIR, "legacy_state_v4.json");
    const legacyState = {
        stateVersion: 2,
        settings: { theme: "light" }
    };
    fs.writeFileSync(legacyStatePath, JSON.stringify(legacyState));
    log("Generated legacy_state_v4.json");

    // 3. Quarantined Corrupted State
    const corruptedStatePath = path.join(FIXTURES_DIR, "corrupted_envelope.omega");
    fs.writeFileSync(corruptedStatePath, "omega-v5:invalidiv:invalidtag:garbageciphertext");
    log("Generated corrupted_envelope.omega");

    // 4. Valid Session V2
    const sessionPassphrase = "audit-passphrase";
    const sessionData = {
        messages: [{ role: "user", content: "audit test" }],
        metadata: { tokens: 42 }
    };
    const validSessionPath = sessionManager.saveSession("audit-session", sessionData, sessionPassphrase);
    fs.copyFileSync(validSessionPath, path.join(FIXTURES_DIR, "valid_session_v2.ns5.json"));
    log("Generated valid_session_v2.ns5.json");

    // 5. Truncated File (Partial Write)
    const truncatedSessionPath = path.join(FIXTURES_DIR, "truncated_write.ns5.json");
    const validSessionContent = fs.readFileSync(validSessionPath, "utf8");
    fs.writeFileSync(truncatedSessionPath, validSessionContent.substring(0, Math.floor(validSessionContent.length / 2)));
    log("Generated truncated_write.ns5.json");

    // 6. Valid Mobility Bundle
    const profileId = "audit-profile";
    stateManager.set("settings.connectionProfiles", [{
        id: profileId,
        provider: "ollama",
        baseUrl: "http://localhost:11434"
    }]);
    stateManager.save();
    const validBundleStr = profileMobility.exportProfileBundle(profileId);
    fs.writeFileSync(path.join(FIXTURES_DIR, "valid_mobility.json"), validBundleStr);
    log("Generated valid_mobility.json");

    // 7. Tampered Mobility Bundle
    const tamperedBundle = JSON.parse(validBundleStr);
    tamperedBundle.integrity.bundleSignature = "a".repeat(64); // Break signature
    fs.writeFileSync(path.join(FIXTURES_DIR, "tampered_mobility.json"), JSON.stringify(tamperedBundle, null, 2));
    log("Generated tampered_mobility.json");

    // Cleanup active mock state so it doesn't pollute the actual test run
    fs.rmSync(stateManager.stateFile, { force: true });
    // Keep fixtures Dir, but clear internal sessions directory
    fs.rmSync(path.join(process.env.NEURAL_USER_DATA_DIR, "state", "sessions"), { recursive: true, force: true });

    log("Fixture generation complete.");
}

generate().catch(console.error);
