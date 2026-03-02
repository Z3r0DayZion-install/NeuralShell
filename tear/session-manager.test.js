const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

const sessionManagerPath = path.resolve(__dirname, "../src/core/sessionManager.js");
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

  delete require.cache[sessionManagerPath];
  delete require.cache[stateManagerPath];
  try {
    return fn();
  } finally {
    Module._load = originalLoad;
    delete require.cache[sessionManagerPath];
    delete require.cache[stateManagerPath];
  }
}

test("SessionManager saves and loads payload with object.chat tokens metadata", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      const payload = {
        model: "llama3",
        chat: [
          { role: "user", content: "hello world" },
          { role: "assistant", content: "one two three" }
        ]
      };
      manager.saveSession("alpha", payload, "secret");
      const loaded = manager.loadSession("alpha", "secret");
      assert.deepEqual(loaded, payload);

      const meta = manager.index.alpha;
      assert.equal(meta.tokens, 5);
      assert.equal(meta.model, "llama3");
      assert.equal(meta.version, 2);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager rejects invalid names and wrong passphrase", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");

      assert.throws(() => manager.saveSession("../bad", { chat: [] }, "pw"), /Invalid|invalid/i);
      assert.throws(() => manager.saveSession("bad:name", { chat: [] }, "pw"), /invalid characters/i);

      manager.saveSession("beta", { chat: [{ role: "user", content: "x" }] }, "pw1");
      assert.throws(() => manager.loadSession("beta", "wrong"), /Decryption failed/i);
      assert.throws(() => manager.loadSession("beta", ""), /Passphrase is required/i);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager rename and delete keep index in sync", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      manager.saveSession("first", { chat: [{ role: "user", content: "hello" }] }, "pw");

      manager.renameSession("first", "renamed");
      const sessions = manager.listSessions();
      assert.ok(sessions.includes("renamed"));
      assert.ok(!sessions.includes("first"));
      assert.ok(manager.index.renamed);

      manager.deleteSession("renamed");
      const sessionsAfterDelete = manager.listSessions();
      assert.ok(!sessionsAfterDelete.includes("renamed"));
      assert.equal(manager.index.renamed, undefined);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager detects envelope checksum tampering", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      const filePath = manager.saveSession("tamper", { chat: [{ role: "user", content: "hello" }] }, "pw");
      const envelope = JSON.parse(fs.readFileSync(filePath, "utf8"));
      envelope.checksum = "broken-checksum";
      fs.writeFileSync(filePath, JSON.stringify(envelope), "utf8");

      assert.throws(() => manager.loadSession("tamper", "pw"), /checksum mismatch/i);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
