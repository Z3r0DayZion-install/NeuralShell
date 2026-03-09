const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const stateManagerPath = path.resolve(__dirname, "../src/core/stateManager.js");

function withMockedElectron(userDataPath, fn, options = {}) {
  const fingerprint = String(options.fingerprint || "test-fingerprint-123");
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

test("StateManager migrates v1 state to v2 bridge profile settings", () => {
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
      assert.equal(stateManager.get("stateVersion"), 3);
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
      assert.ok(raw.includes(":"), "Encrypted state file should include iv:ciphertext format.");
      assert.ok(!raw.trim().startsWith("{"), "Encrypted state file should not be plain JSON.");
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
      assert.equal(loaded.stateVersion, 3);
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

test("StateManager upgrades v2 state with existing connectionProfiles to v3", () => {
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
      assert.equal(loaded.stateVersion, 3);
      assert.equal(settings.activeProfileId, "profile-a");
      assert.equal(settings.connectionProfiles.length, 1);
      assert.equal(settings.connectionProfiles[0].id, "profile-a");
      assert.equal(settings.retryCount, 4);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
