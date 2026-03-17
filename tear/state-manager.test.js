const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const stateManagerPath = path.resolve(__dirname, "../src/core/stateManager.js");

function withMockedElectron(userDataPath, fn, options = {}) {
  const fingerprint = String(options.fingerprint || "test-fingerprint-123");
  const hardwareFingerprint = String(options.hardwareFingerprint || "test-hardware-binding-123");
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
    // Mock identityKernel to return a stable fingerprint for tests
    if (request.endsWith("identityKernel") || request === "./identityKernel") {
      return {
        getFingerprint: () => fingerprint,
        getHardwareFingerprint: () => hardwareFingerprint,
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

function encryptLegacyStatePayload(payload, fingerprint = "test-fingerprint-123") {
  const key = crypto.createHash("sha256").update(String(fingerprint)).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(payload, null, 2), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function encryptLegacyAuthenticatedStatePayload(
  payload,
  fingerprint = "test-fingerprint-123"
) {
  const key = crypto.createHash("sha256").update(String(fingerprint)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("NeuralShell.state.v4", "utf8"));
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload, null, 2), "utf8"),
    cipher.final()
  ]);
  return `omega-v4:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

test("StateManager setState merges nested settings instead of replacing", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      stateManager.load();
      stateManager.setState({ settings: { retryCount: 9 } });
      const settings = stateManager.get("settings");

      assert.equal(settings.retryCount, 9);
      assert.equal(settings.timeoutMs, 15000);
      assert.equal(settings.ollamaBaseUrl, "http://127.0.0.1:11434");
      assert.equal(settings.theme, "dark");
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager load seeds workflow and release defaults on a fresh profile", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-defaults-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      const loaded = stateManager.load();

      assert.equal(loaded.workflowId, "bridge_diagnostics");
      assert.equal(loaded.outputMode, "checklist");
      assert.equal(loaded.workspaceAttachment, null);
      assert.deepEqual(loaded.releasePacketHistory, []);
      assert.deepEqual(loaded.promotedPaletteActions, []);
      assert.equal(loaded.commandPaletteShortcutScope, "workflow");
      assert.equal(loaded.verificationRunPlan, null);
      assert.ok(Array.isArray(loaded.settings.connectionProfiles));
      assert.equal(loaded.settings.connectionProfiles.length, 1);
      assert.equal(loaded.settings.activeProfileId, "local-default");
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager migrates v1 state to v5 bridge profile settings", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-migrate-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      const legacy = {
        model: "mistral",
        settings: {
          ollamaBaseUrl: "http://localhost:11434",
          timeoutMs: 9000,
          retryCount: 1
        }
      };
      fs.writeFileSync(stateManager.stateFile, JSON.stringify(legacy, null, 2), "utf8");
      stateManager.load();
      const settings = stateManager.get("settings");
      assert.equal(stateManager.get("stateVersion"), 5);
      assert.ok(Array.isArray(settings.connectionProfiles));
      assert.equal(settings.connectionProfiles.length, 1);
      assert.equal(settings.connectionProfiles[0].baseUrl, "http://localhost:11434");
      assert.equal(settings.activeProfileId, settings.connectionProfiles[0].id);
      assert.equal(settings.connectOnStartup, true);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager set updates keys and writes encrypted state", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-set-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      stateManager.load();
      stateManager.set("tokens", 99);
      stateManager.set("settings", { theme: "light" });

      const state = stateManager.getState();
      assert.equal(state.tokens, 99);
      assert.equal(state.settings.theme, "light");

      const raw = fs.readFileSync(stateManager.stateFile, "utf8");
      assert.ok(raw.startsWith("omega-v5:"), "Encrypted state file should use the authenticated omega-v5 format.");
      assert.ok(!raw.trim().startsWith("{"), "Encrypted state file should not be plain JSON.");
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager setState ignores non-object updates and recovers null settings", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-setstate-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      stateManager.load();
      stateManager.set("settings", null);
      stateManager.set("settings", { retryCount: 7 });
      const repairedSettings = stateManager.get("settings");
      assert.equal(repairedSettings.retryCount, 7);
      assert.equal(repairedSettings.timeoutMs, 15000);

      const before = stateManager.getState();
      stateManager.setState(null);
      const after = stateManager.getState();
      assert.equal(after.workflowId, before.workflowId);
      assert.equal(after.outputMode, before.outputMode);
      assert.deepEqual(after.settings, before.settings);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager quarantines corrupted state and regenerates defaults", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-corrupt-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      fs.mkdirSync(path.dirname(stateManager.stateFile), { recursive: true });
      fs.writeFileSync(stateManager.stateFile, "not-valid-state", "utf8");

      const loaded = stateManager.load();
      assert.equal(loaded.stateVersion, 5);
      assert.equal(loaded.model, "llama3");
      assert.ok(Array.isArray(loaded.chat));

      const files = fs.readdirSync(path.dirname(stateManager.stateFile));
      assert.ok(
        files.some((name) => name.includes("hardware-lock-failure") && name.endsWith(".bak")),
        "Expected hardware-lock-failure quarantine backup."
      );
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager upgrades v2 state with existing connectionProfiles to v5", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-v2-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      const legacyV2 = {
        stateVersion: 2,
        model: "llama3",
        settings: {
          connectionProfiles: [
            {
              id: "profile-a",
              name: "Primary",
              baseUrl: "http://127.0.0.1:11434"
            }
          ],
          activeProfileId: "profile-a",
          retryCount: 4
        }
      };
      fs.writeFileSync(stateManager.stateFile, JSON.stringify(legacyV2, null, 2), "utf8");
      const loaded = stateManager.load();
      const settings = loaded.settings;
      assert.equal(loaded.stateVersion, 5);
      assert.equal(settings.activeProfileId, "profile-a");
      assert.equal(settings.connectionProfiles.length, 1);
      assert.equal(settings.connectionProfiles[0].id, "profile-a");
      assert.equal(settings.retryCount, 4);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager migrates legacy encrypted v3 state into the authenticated v5 format", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-v3-"));
  const fingerprint = "legacy-state-fingerprint";
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      const legacyV3 = {
        stateVersion: 3,
        nodeId: fingerprint,
        model: "phi4",
        tokens: 42,
        settings: {
          theme: "light",
          ollamaBaseUrl: "http://127.0.0.1:11434",
          retryCount: 5
        }
      };
      fs.writeFileSync(
        stateManager.stateFile,
        encryptLegacyStatePayload(legacyV3, fingerprint),
        "utf8"
      );

      const loaded = stateManager.load();
      const rewritten = fs.readFileSync(stateManager.stateFile, "utf8");

      assert.equal(loaded.stateVersion, 5);
      assert.equal(loaded.model, "phi4");
      assert.equal(loaded.tokens, 42);
      assert.equal(loaded.settings.theme, "light");
      assert.ok(rewritten.startsWith("omega-v5:"));
    }, { fingerprint });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager quarantines tampered authenticated state and regenerates defaults", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-tamper-"));
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      stateManager.load();
      stateManager.set("model", "tamper-model");

      const raw = fs.readFileSync(stateManager.stateFile, "utf8");
      const tampered = raw.replace(/([0-9a-f])(?=[0-9a-f]*$)/i, (char) =>
        char.toLowerCase() === "a" ? "b" : "a"
      );
      fs.writeFileSync(stateManager.stateFile, tampered, "utf8");

      const loaded = stateManager.load();
      assert.equal(loaded.stateVersion, 5);
      assert.equal(loaded.model, "llama3");

      const files = fs.readdirSync(path.dirname(stateManager.stateFile));
      assert.ok(
        files.some((name) => name.includes("hardware-lock-failure") && name.endsWith(".bak")),
        "Expected hardware-lock-failure quarantine backup after tamper detection."
      );
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager migrates legacy authenticated v4 state to the stable hardware-bound v5 format", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-v4-"));
  const hardwareFingerprint = "stable-hardware-binding-001";
  const fingerprint = "legacy-identity-fingerprint-001";
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      const legacyV4 = {
        stateVersion: 4,
        nodeId: fingerprint,
        model: "llama3.2",
        tokens: 77,
        settings: {
          theme: "light",
          retryCount: 6
        }
      };

      fs.writeFileSync(
        stateManager.stateFile,
        encryptLegacyAuthenticatedStatePayload(legacyV4, fingerprint),
        "utf8"
      );

      const loaded = stateManager.load();
      const rewritten = fs.readFileSync(stateManager.stateFile, "utf8");

      assert.equal(loaded.stateVersion, 5);
      assert.equal(loaded.model, "llama3.2");
      assert.equal(loaded.tokens, 77);
      assert.equal(loaded.nodeId, hardwareFingerprint);
      assert.ok(rewritten.startsWith("omega-v5:"));
    }, { fingerprint, hardwareFingerprint });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("StateManager preserves state across identity rotation when hardware binding is stable", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-state-rotate-"));
  const hardwareFingerprint = "stable-hardware-binding-rotate";
  try {
    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      stateManager.load();
      stateManager.set("tokens", 321);
      stateManager.set("model", "persisted-model");
    }, {
      fingerprint: "identity-before-rotate",
      hardwareFingerprint
    });

    withMockedElectron(tempRoot, () => {
      const stateManager = require("../src/core/stateManager");
      const loaded = stateManager.load();

      assert.equal(loaded.stateVersion, 5);
      assert.equal(loaded.tokens, 321);
      assert.equal(loaded.model, "persisted-model");
      assert.equal(loaded.nodeId, hardwareFingerprint);

      const raw = fs.readFileSync(stateManager.stateFile, "utf8");
      assert.ok(raw.startsWith("omega-v5:"));
    }, {
      fingerprint: "identity-after-rotate",
      hardwareFingerprint
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

