const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// 1. Setup isolation BEFORE requiring any modules
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-contract-session-"));
process.env.NEURAL_USER_DATA_DIR = tempDir;

require("./mock-electron");
const assert = require("node:assert/strict");
const sessionManager = require("../src/core/sessionManager");

/**
 * Phase 13: contract-session-schema.test.js
 * 
 * Verifies that the produced session files and index match the canonical V2 freeze.
 */

async function run() {
    console.log("Running Session Schema V2 Contract Test...");

    const sessionName = "contract-test-v2";
    const passphrase = "secure-passphrase";
    const payload = {
        chat: [{ role: "user", content: "contract test" }],
        model: "llama3",
        workflowId: "bridge_diagnostics"
    };

    try {
        // 1. Save Session and Verify Envelope
        const sessionFilePath = sessionManager.saveSession(sessionName, payload, passphrase);
        assert(fs.existsSync(sessionFilePath), "Session file must exist");

        const envelope = JSON.parse(fs.readFileSync(sessionFilePath, "utf8"));

        // Canonical V2 Envelope keys
        assert.equal(envelope.version, 2, "version must be 2");
        assert.equal(envelope.name, sessionName, "name must match");
        assert.equal(typeof envelope.createdAt, "string", "createdAt must be string (ISO)");
        assert.equal(typeof envelope.salt, "string", "salt must be hex string");
        assert.equal(typeof envelope.iv, "string", "iv must be hex string");
        assert.equal(typeof envelope.tag, "string", "tag must be hex string");
        assert.equal(typeof envelope.data, "string", "data must be base64 string");
        assert.equal(typeof envelope.checksum, "string", "checksum must be sha256 hex string");

        // 2. Verify Index Entry
        const index = sessionManager.index;
        const entry = index[sessionName];
        assert(entry, "Session must be present in index");
        assert.equal(entry.version, 2, "index entry version must be 2");
        assert.equal(typeof entry.updatedAt, "string", "index entry updatedAt must be string");
        assert.equal(entry.model, "llama3", "index entry model must match");
        assert.equal(entry.tokens, 2, "index entry tokens must match word count (contract test)");
        assert.equal(entry.workflowId, "bridge_diagnostics", "index entry workflowId must match");

        // 3. Load and Verify decrypted payload
        const loaded = sessionManager.loadSession(sessionName, passphrase);
        assert.deepEqual(loaded.chat, payload.chat, "Decrypted chat must match");
        assert.equal(loaded.model, payload.model, "Decrypted model must match");

        console.log("PASS: Session Schema V2 Contract verified.");

    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

run().catch((err) => {
    console.error("FAIL: Session Schema V2 Contract violation!");
    console.error(err);
    process.exit(1);
});
