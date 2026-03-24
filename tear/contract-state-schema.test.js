const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

// 1. Setup isolation BEFORE requiring any modules
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-contract-state-"));
process.env.NEURAL_USER_DATA_DIR = tempDir;

require("./mock-electron");
const assert = require("node:assert/strict");
const stateManager = require("../src/core/stateManager");

/**
 * Phase 13: contract-state-schema.test.js
 * 
 * Verifies that the produced state matches the canonical V9 freeze.
 */

async function run() {
    console.log("Running State Schema V9 Contract Test...");

    // Load state (will be defaultState if clean)
    const state = stateManager.load();

    // 1. Top Level Schema Verification
    assert.equal(state.stateVersion, 9, "stateVersion must be 9");
    assert.equal(typeof state.setupState, "string", "setupState must be a string");
    assert(state.nodeId === null || typeof state.nodeId === "string", "nodeId must be string or null");
    assert(state.model === null || typeof state.model === "string", "model must be string or null");
    assert(Array.isArray(state.chat), "chat must be an array");
    assert.equal(typeof state.tokens, "number", "tokens must be a number");
    assert.equal(typeof state.workflowId, "string", "workflowId must be a string");
    assert.equal(typeof state.outputMode, "string", "outputMode must be a string");
    assert(state.workspaceAttachment === null || typeof state.workspaceAttachment === "object", "workspaceAttachment must be object or null");
    assert(state.contextPack === null || typeof state.contextPack === "object", "contextPack must be object or null");
    assert(Array.isArray(state.contextPackProfiles), "contextPackProfiles must be an array");
    assert.equal(typeof state.activeContextPackProfileId, "string", "activeContextPackProfileId must be a string");
    assert(state.lastArtifact === null || typeof state.lastArtifact === "object", "lastArtifact must be object or null");
    assert(Array.isArray(state.releasePacketHistory), "releasePacketHistory must be an array");
    assert(state.patchPlan === null || typeof state.patchPlan === "object", "patchPlan must be object or null");
    assert(Array.isArray(state.promotedPaletteActions), "promotedPaletteActions must be an array");
    assert.equal(typeof state.commandPaletteShortcutScope, "string", "commandPaletteShortcutScope must be a string");
    assert(state.verificationRunPlan === null || typeof state.verificationRunPlan === "object", "verificationRunPlan must be object or null");
    assert(Array.isArray(state.verificationRunHistory), "verificationRunHistory must be an array");
    assert.equal(typeof state.settings, "object", "settings must be an object");

    // 2. Settings Schema Verification
    const s = state.settings;
    assert.equal(typeof s.ollamaBaseUrl, "string", "settings.ollamaBaseUrl must be a string");
    assert.equal(typeof s.timeoutMs, "number", "settings.timeoutMs must be a number");
    assert.equal(typeof s.retryCount, "number", "settings.retryCount must be a number");
    assert.equal(typeof s.theme, "string", "settings.theme must be a string");
    assert.equal(typeof s.clockEnabled, "boolean", "settings.clockEnabled must be a boolean");
    assert.equal(typeof s.personalityProfile, "string", "settings.personalityProfile must be a string");
    assert.equal(typeof s.safetyPolicy, "string", "settings.safetyPolicy must be a string");
    assert.equal(typeof s.onboardingCompleted, "boolean", "settings.onboardingCompleted must be a boolean");
    assert.equal(typeof s.onboardingSeenAt, "string", "settings.onboardingSeenAt must be a string");
    assert.equal(typeof s.onboardingVersion, "string", "settings.onboardingVersion must be a string");
    assert.equal(typeof s.allowRemoteBridge, "boolean", "settings.allowRemoteBridge must be a boolean");
    assert.equal(typeof s.activeProfileId, "string", "settings.activeProfileId must be a string");
    assert.equal(typeof s.connectOnStartup, "boolean", "settings.connectOnStartup must be a boolean");
    assert.equal(typeof s.autoLoadRecommendedContextProfile, "boolean", "settings.autoLoadRecommendedContextProfile must be a boolean");
    assert(Array.isArray(s.connectionProfiles), "settings.connectionProfiles must be an array");

    console.log("PASS: State Schema V9 Contract verified.");
}

run().catch((err) => {
    console.error("FAIL: State Schema V9 Contract violation!");
    console.error(err);
    process.exit(1);
});
