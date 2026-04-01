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

test("SessionManager stores workflow and release metadata in the index", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-metadata-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      manager.saveSession("workflow-metadata", {
        model: "llama3",
        chat: [{ role: "user", content: "hello release cockpit" }],
        workflowId: "release_audit",
        outputMode: "release_packet",
        workspaceAttachment: {
          label: "workspace-a"
        },
        promotedPaletteActions: [{ id: "one" }, { id: "two" }],
        verificationRunPlan: {
          checks: [{ id: "lint" }, { id: "founder_e2e" }]
        },
        releasePacketHistory: [{ title: "Release Packet" }],
        patchPlan: {
          files: [{ path: "docs/release-audit.md" }]
        }
      }, "secret");

      const meta = manager.index["workflow-metadata"];
      assert.equal(meta.workflowId, "release_audit");
      assert.equal(meta.outputMode, "release_packet");
      assert.equal(meta.workspaceLabel, "workspace-a");
      assert.equal(meta.paletteShortcuts, 2);
      assert.equal(meta.verificationChecks, 2);
      assert.equal(meta.releasePackets, 1);
      assert.equal(meta.patchPlanFiles, 1);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager stores preview text and searches across preview metadata", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-preview-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      manager.saveSession("preview-search", {
        model: "llama3",
        chat: [
          { role: "user", content: "stage the release lane" },
          { role: "assistant", content: "Focus on screenshots, verification output, and the final packet handoff." }
        ],
        workflowId: "release_audit",
        workspaceAttachment: {
          label: "preview-workspace"
        }
      }, "secret");

      const meta = manager.index["preview-search"];
      assert.match(meta.previewText, /final packet handoff/i);

      const previewMatch = manager.search("packet handoff");
      assert.equal(previewMatch.length, 1);
      assert.equal(previewMatch[0].name, "preview-search");

      const workspaceMatch = manager.search("preview-workspace");
      assert.equal(workspaceMatch.length, 1);
      assert.equal(workspaceMatch[0].name, "preview-search");
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

test("SessionManager search returns all metadata and filtered matches", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-search-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      manager.saveSession("alpha", { model: "llama3", chat: [{ role: "user", content: "one two" }] }, "pw");
      manager.saveSession("beta", { model: "mistral", chat: [{ role: "user", content: "three" }] }, "pw");

      const all = manager.search("");
      assert.equal(all.length, 2);
      assert.ok(all.every((row) => row && row.name));

      const filtered = manager.search("alp");
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].name, "alpha");
      assert.equal(filtered[0].model, "llama3");
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager repairIndex rebuilds missing in-memory index entries", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-repair-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      manager.saveSession("repairme", { chat: [{ role: "user", content: "hello" }] }, "pw");
      delete manager.index.repairme;

      const report = manager.repairIndex();
      assert.equal(report.repaired, true);
      assert.equal(report.count, 1);
      assert.ok(manager.index.repairme);
      assert.equal(manager.index.repairme.model, "unknown");
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager handles missing sessions and rename collisions", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-guards-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      manager.saveSession("from", { chat: [{ role: "user", content: "x" }] }, "pw");
      manager.saveSession("to", { chat: [{ role: "user", content: "y" }] }, "pw");

      assert.throws(() => manager.loadSession("missing", "pw"), /Session not found/i);
      assert.throws(() => manager.renameSession("from", "to"), /already exists/i);
      assert.throws(() => manager.renameSession("missing", "new"), /not found/i);

      assert.equal(manager.deleteSession("missing"), true);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

test("SessionManager exportToPeer is blocked in local test mode", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "ns5-session-export-"));
  try {
    withMockedElectron(tempRoot, () => {
      const manager = require("../src/core/sessionManager");
      assert.throws(() => manager.exportToPeer(), /not available in local test mode/i);
    });
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});
