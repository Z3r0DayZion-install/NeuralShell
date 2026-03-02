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
          getPath(name) {
            if (name === "userData") return userDataPath;
            return userDataPath;
          }
        }
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
      assert.equal(stateManager.get("stateVersion"), 2);
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
