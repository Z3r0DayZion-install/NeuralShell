const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const { AutonomousEngine } = require("./src/core/autoEngine");
const { PersistentMemoryStore } = require("./src/core/persistentMemoryStore");
const { PermissionManager } = require("./src/core/permissionManager");
const { Telemetry } = require("./src/core/telemetry");
const { CheckpointManager } = require("./src/core/checkpointManager");
const { createPathGuard } = require("./src/core/pathGuard");
const { AuthManager } = require("./src/core/authManager");
const { SecretVault } = require("./src/core/secretVault");
const { SyncClient } = require("./src/core/syncClient");
const { UpdateService } = require("./src/core/updateService");
const { registerSecurityIpcHandlers } = require("./src/main/securityIpc");

const LLM_HOST = "http://127.0.0.1:11434";
const MAX_WRITE_BYTES = 2 * 1024 * 1024;
const HEADLESS = process.env.NS_HEADLESS === "1";
const windows = new Set();
const streamControllers = new Map();
const streamPayloadCache = new Map();

const telemetry = new Telemetry();
let memoryStore;
let permissionManager;
let checkpointManager;
let pathGuard;
let authManager;
let secretVault;
const syncClient = new SyncClient();
const updateService = new UpdateService();

function emit(channel, payload) {
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

const autonomousEngine = new AutonomousEngine((tick) => {
  emit("auto:tick", tick);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, "src", "assets", "app.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile("src/renderer.html");
  windows.add(win);
  win.on("closed", () => windows.delete(win));
}

function assertPath(input) {
  if (typeof input !== "string" || !input.trim()) throw new Error("Invalid path");
  return input;
}

function assertText(input) {
  if (typeof input !== "string") throw new Error("Invalid data payload");
  if (Buffer.byteLength(input, "utf8") > MAX_WRITE_BYTES) throw new Error("Payload too large");
  return input;
}

function requirePermission(key) {
  if (!permissionManager?.allowed(key)) {
    throw new Error(`Permission denied: ${key}`);
  }
}

function registerHandle(route, fn) {
  ipcMain.handle(route, telemetry.wrap(route, async (...args) => fn(...args)));
}

async function forwardStream({ streamId, payload }) {
  requirePermission("llmStream");
  if (!streamId || typeof streamId !== "string") throw new Error("streamId required");
  if (!payload || typeof payload !== "object") throw new Error("Invalid stream payload");
  streamPayloadCache.set(streamId, payload);
  const maxRetries = 2;
  let attempt = 0;
  let combined = "";
  while (attempt <= maxRetries) {
    const controller = new AbortController();
    streamControllers.set(streamId, controller);
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch(`${LLM_HOST}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, stream: true }),
        signal: controller.signal
      });
      if (!res.ok || !res.body) throw new Error(`Stream request failed (${res.status})`);

      let buffer = "";
      for await (const chunk of res.body) {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const row = JSON.parse(line);
            const piece = row?.message?.content || row?.response || "";
            if (piece) {
              combined += piece;
              emit("llm:stream:event", { type: "chunk", streamId, chunk: piece });
            }
            if (row.done) {
              emit("llm:stream:event", { type: "end", streamId, text: combined });
            }
          } catch {
            emit("llm:stream:event", { type: "chunk", streamId, chunk: line });
          }
        }
      }
      if (buffer.trim()) emit("llm:stream:event", { type: "chunk", streamId, chunk: buffer.trim() });
      emit("llm:stream:event", { type: "end", streamId, text: combined });
      clearTimeout(timeout);
      streamControllers.delete(streamId);
      streamPayloadCache.delete(streamId);
      return { ok: true };
    } catch (err) {
      clearTimeout(timeout);
      const isAbort = err && (err.name === "AbortError" || /aborted|abort/i.test(err.message || ""));
      streamControllers.delete(streamId);
      if (isAbort) {
        emit("llm:stream:event", { type: "cancelled", streamId });
        streamPayloadCache.delete(streamId);
        return { ok: true, cancelled: true };
      }
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        attempt += 1;
        continue;
      }
      emit("llm:stream:event", { type: "error", streamId, error: err.message || "stream failed" });
      streamPayloadCache.delete(streamId);
      throw err;
    }
  }
  return { ok: false };
}

app.whenReady().then(async () => {
  const dataDir = path.join(app.getPath("userData"), "neuralshell_runtime");
  pathGuard = createPathGuard([
    app.getPath("userData"),
    process.cwd(),
    path.join(process.cwd(), "dist"),
    dataDir,
    app.getPath("documents"),
    app.getPath("downloads"),
    app.getPath("desktop")
  ]);
  memoryStore = new PersistentMemoryStore(path.join(dataDir, "memory"));
  permissionManager = new PermissionManager(path.join(dataDir, "security"));
  checkpointManager = new CheckpointManager(path.join(dataDir, "checkpoints"));
  authManager = new AuthManager(path.join(dataDir, "auth"));
  secretVault = new SecretVault(path.join(dataDir, "vault"));
  await Promise.all([memoryStore.init(), permissionManager.init(), checkpointManager.init(), authManager.init(), secretVault.init()]);

  if (!HEADLESS) {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }

  registerHandle("read-file", async (_evt, filePath) => {
    requirePermission("fileRead");
    const safePath = pathGuard.assertAllowed(assertPath(filePath));
    await permissionManager.audit("read-file", safePath, "renderer");
    return fs.promises.readFile(safePath, "utf8");
  });

  registerHandle("write-file", async (_evt, filePath, data) => {
    authManager.requireAdmin();
    requirePermission("fileWrite");
    const safePath = pathGuard.assertAllowed(assertPath(filePath));
    const safeData = assertText(data);
    await permissionManager.audit("write-file", safePath, "renderer", safeData.length);
    await fs.promises.writeFile(safePath, safeData, "utf8");
    return true;
  });

  registerHandle("select-file", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ["openFile"] });
    return canceled ? null : filePaths[0];
  });

  registerHandle("select-save-path", async (_evt, options = {}) => {
    const cfg = {
      title: typeof options.title === "string" ? options.title : "Save File",
      defaultPath: typeof options.defaultPath === "string" ? options.defaultPath : undefined,
      filters: Array.isArray(options.filters) ? options.filters : undefined
    };
    const { canceled, filePath } = await dialog.showSaveDialog(cfg);
    return canceled ? null : filePath;
  });

  registerHandle("llm-ping", async () => {
    const res = await fetch(`${LLM_HOST}/api/tags`);
    return res.ok;
  });

  registerHandle("llm-chat", async (_e, body) => {
    if (!body || typeof body !== "object") throw new Error("Invalid chat payload");
    const res = await fetch(`${LLM_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return res.json();
  });

  registerHandle("llm-stream:start", async (_evt, payload) => forwardStream(payload));
  registerHandle("llm-stream:cancel", async (_evt, streamId) => {
    const ctl = streamControllers.get(streamId);
    if (ctl) ctl.abort();
    streamControllers.delete(streamId);
    streamPayloadCache.delete(streamId);
    emit("llm:stream:event", { type: "cancelled", streamId });
    return { ok: true };
  });
  registerHandle("llm-stream:resume", async (_evt, streamId) => {
    const payload = streamPayloadCache.get(streamId);
    if (!payload) throw new Error("No cached stream payload");
    return forwardStream({ streamId, payload });
  });

  registerHandle("auto:start", async (_evt, payload) => {
    requirePermission("autoMode");
    await permissionManager.audit("auto-start", "autoMode", "renderer", payload?.goal || "");
    return autonomousEngine.start(payload || {});
  });
  registerHandle("auto:stop", async () => autonomousEngine.stop());
  registerHandle("auto:status", async () => autonomousEngine.status());

  registerHandle("memory:add", async (_evt, record) => memoryStore.add(record || {}));
  registerHandle("memory:list", async (_evt, limit) => memoryStore.list(limit));
  registerHandle("memory:search", async (_evt, query, limit) => memoryStore.search(query, limit));
  registerHandle("memory:compact", async (_evt, sessionId) => memoryStore.compact(sessionId));

  registerHandle("checkpoint:save", async (_evt, state, reason) => {
    requirePermission("checkpointWrite");
    return checkpointManager.save(state || {}, reason || "manual");
  });
  registerHandle("checkpoint:list", async () => checkpointManager.list());
  registerHandle("checkpoint:latest", async () => checkpointManager.latest());
  registerHandle("checkpoint:load", async (_evt, name) => checkpointManager.load(name));

  registerHandle("auth:login", async (_evt, pin) => authManager.login(pin));
  registerHandle("auth:logout", async () => authManager.logout());
  registerHandle("auth:status", async () => authManager.status());
  registerSecurityIpcHandlers({
    registerHandle,
    authManager,
    permissionManager,
    secretVault,
    syncClient,
    dialog
  });

  registerHandle("update:check", async (_evt, feedUrl) => {
    return updateService.check(app.getVersion(), feedUrl);
  });
  registerHandle("permissions:audit", async (_evt, limit) => permissionManager.auditTail(limit));

  registerHandle("telemetry:get", async () => telemetry.snapshot());

  if (process.env.NS_E2E_SMOKE === "1") {
    setTimeout(() => app.quit(), 4000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
