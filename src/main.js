const { app, BrowserWindow, ipcMain, session } = require("electron");
const fs = require("fs");
const path = require("path");

const intentFirewall = require("./security/intentFirewall");
const { kernel, CAP_FS, CAP_NET, CAP_PROC, CAP_CRYPTO } = require("./kernel");

const { verifyIntegrity } = require("./main/integrity/verify");
const { createRecoveryWindow } = require("./main/recovery/recoveryWindow");
const { attemptRepair } = require("./main/recovery/repair");

const { scanWorkspace } = require('./core/empireValidator');

const llmService = require("./core/llmService");
const { LLMService } = require("./core/llmService");
const { AuditChain } = require("./core/auditChain");
const identityKernel = require("./core/identityKernel");
const { DaemonWatchdog } = require("./core/daemonWatchdog");
const { enforcePolicyOnArgs, enforcePolicyOnMessages } = require("./core/policyFirewall");
const {
  validateCommandArgs,
  validateCommandName,
  validateImportedState,
  validateLog,
  validateMessages,
  validateModel,
  validatePassphrase,
  validateSettings,
  validateSessionName,
  validateStateKey,
  validateStateUpdates
} = require("./core/ipcValidators");
let logger;
let chatLogStore;
let pluginLoader;
let sessionManager;
let stateManager;
let systemMonitor;
let rgbController;
let auditChain;
let daemonWatchdog;
let xpManager;
let ritualManager;
let historyLoader;
let secretVault;
let agentController;

let mainWindow = null;
let bridgeHealthTimer = null;
let smokeFinalized = false;

if (process.env.NEURAL_USER_DATA_DIR) {
  try {
    const overrideDir = path.resolve(process.env.NEURAL_USER_DATA_DIR);
    fs.mkdirSync(overrideDir, { recursive: true });
    app.setPath("userData", overrideDir);
    console.log(`[BOOT] Using overridden userData path: ${overrideDir}`);
  } catch (err) {
    console.warn(`[BOOT] Failed to apply NEURAL_USER_DATA_DIR override: ${err.message || err}`);
  }
}

const SMOKE_MODE =
  process.argv.includes("--smoke-mode") ||
  process.env.NEURAL_SMOKE_MODE === "1";
const SMOKE_REPORT_PATH = process.env.NEURAL_SMOKE_REPORT || null;

const BUILT_IN_COMMANDS = [
  { name: "help", description: "List available commands.", args: [], source: "core" },
  { name: "clear", description: "Clear current chat.", args: [], source: "core" },
  { name: "model", description: "Set active model.", args: ["model"], source: "core" },
  { name: "theme", description: "Set theme (dark|light).", args: ["theme"], source: "core" },
  { name: "models", description: "Refresh available model list.", args: [], source: "core" },
  { name: "find", description: "Search within current chat.", args: ["text"], source: "core" },
  { name: "save", description: "Save chat session.", args: ["name", "passphrase"], source: "core" },
  { name: "load", description: "Load chat session.", args: ["name", "passphrase"], source: "core" },
  { name: "rename", description: "Rename session.", args: ["oldName", "newName"], source: "core" },
  { name: "delete", description: "Delete session.", args: ["name"], source: "core" },
  { name: "duplicate", description: "Duplicate session.", args: ["source", "target", "passphrase"], source: "core" },
  { name: "new", description: "Start a new chat.", args: [], source: "core" },
  { name: "deletelast", description: "Delete last user+assistant exchange.", args: [], source: "core" },
  { name: "copylast", description: "Copy last assistant reply text.", args: [], source: "core" },
  { name: "clearlogs", description: "Clear application logs.", args: [], source: "core" },
  { name: "selftest", description: "Run client self-checks.", args: [], source: "core" },
  { name: "stats", description: "Show basic runtime stats.", args: [], source: "core" },
  { name: "persona", description: "Set assistant personality.", args: ["profile"], source: "core" }
];

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function writeSmokeReport(payload) {
  if (!SMOKE_REPORT_PATH) return;
  try {
    const reportPath = path.isAbsolute(SMOKE_REPORT_PATH)
      ? SMOKE_REPORT_PATH
      : path.join(process.cwd(), SMOKE_REPORT_PATH);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  } catch (err) {
    console.warn(`[SMOKE] Failed writing smoke report: ${err.message || err}`);
  }
}

function finishSmoke(code, payload) {
  if (smokeFinalized) return;
  smokeFinalized = true;
  writeSmokeReport(payload);
  setTimeout(() => app.exit(code), 80);
  app.quit();
}

function waitForRendererLoad(win, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (!win || win.isDestroyed()) {
      reject(new Error("Main window is unavailable for smoke probe."));
      return;
    }

    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onFail = (_event, code, desc) => {
      cleanup();
      reject(new Error(`Renderer load failed (${code}): ${desc}`));
    };
    const onTimeout = () => {
      cleanup();
      reject(new Error(`Renderer load timed out after ${timeoutMs}ms.`));
    };
    const cleanup = () => {
      clearTimeout(timer);
      win.webContents.removeListener("did-finish-load", onLoaded);
      win.webContents.removeListener("did-fail-load", onFail);
    };

    const timer = setTimeout(onTimeout, timeoutMs);
    win.webContents.once("did-finish-load", onLoaded);
    win.webContents.once("did-fail-load", onFail);

    if (!win.webContents.isLoadingMainFrame()) {
      onLoaded();
    }
  });
}

async function runSmokeProbe() {
  if (!SMOKE_MODE) return;

  const startedAt = Date.now();
  const report = {
    generatedAt: new Date().toISOString(),
    mode: "smoke",
    checks: {
      rendererLoad: false,
      rendererDom: false,
      ipcHandshake: false
    }
  };

  try {
    await waitForRendererLoad(mainWindow, 15000);
    report.checks.rendererLoad = true;

    const domReady = await mainWindow.webContents.executeJavaScript(
      "Boolean(document.getElementById('sendBtn'))",
      true
    );
    report.checks.rendererDom = Boolean(domReady);

    const handshake = await mainWindow.webContents.executeJavaScript(
      `(async () => {
        if (!window.api || typeof window.api.invoke !== "function") {
          return { ok: false, reason: "window.api.invoke is unavailable" };
        }
        try {
          const ping = await window.api.invoke("llm:ping");
          const stats = await window.api.invoke("system:stats");
          const statsOk = Boolean(stats && typeof stats === "object");
          return { ok: true, ping: Boolean(ping), statsOk };
        } catch (error) {
          return {
            ok: false,
            reason: error && error.message ? error.message : String(error)
          };
        }
      })()`,
      true
    );

    report.checks.ipcHandshake = Boolean(handshake && handshake.ok);
    report.handshake = handshake;
    report.passed =
      report.checks.rendererLoad &&
      report.checks.rendererDom &&
      report.checks.ipcHandshake;
    report.uptimeMs = Date.now() - startedAt;
    finishSmoke(report.passed ? 0 : 2, report);
  } catch (err) {
    report.passed = false;
    report.error = err.message || String(err);
    report.uptimeMs = Date.now() - startedAt;
    finishSmoke(2, report);
  }
}

function currentSafetyPolicy() {
  const settings = stateManager && stateManager.get("settings");
  return settings && settings.safetyPolicy ? settings.safetyPolicy : "balanced";
}

function normalizeBridgeProfiles(settings = {}) {
  const raw = Array.isArray(settings.connectionProfiles) ? settings.connectionProfiles : [];
  const profiles = raw
    .filter((p) => p && typeof p === "object" && p.name && p.baseUrl)
    .map((p, idx) => ({
      id: String(p.id || `profile-${idx + 1}`),
      name: String(p.name),
      baseUrl: String(p.baseUrl),
      timeoutMs: Number(p.timeoutMs) || 15000,
      retryCount: Number(p.retryCount) || 2,
      defaultModel: String(p.defaultModel || "llama3")
    }));
  return profiles;
}

function pickActiveBridgeProfile(settings = {}) {
  const profiles = normalizeBridgeProfiles(settings);
  if (!profiles.length) return null;
  const activeId = String(settings.activeProfileId || "");
  const selected = profiles.find((p) => p.id === activeId) || profiles[0];
  if (!settings.allowRemoteBridge) {
    try {
      const host = new URL(selected.baseUrl).hostname.toLowerCase();
      const isLocal = host === "127.0.0.1" || host === "localhost" || host === "::1";
      if (!isLocal) {
        return profiles.find((p) => {
          try {
            const h = new URL(p.baseUrl).hostname.toLowerCase();
            return h === "127.0.0.1" || h === "localhost" || h === "::1";
          } catch {
            return false;
          }
        }) || null;
      }
    } catch {
      return null;
    }
  }
  return selected;
}

function applyBridgeSettings(settings = {}) {
  const active = pickActiveBridgeProfile(settings);
  if (active) {
    llmService.configure({
      baseUrl: active.baseUrl,
      requestTimeoutMs: active.timeoutMs,
      maxRetries: active.retryCount
    });
    return active;
  }
  llmService.configure({
    baseUrl: settings.ollamaBaseUrl,
    requestTimeoutMs: settings.timeoutMs,
    maxRetries: settings.retryCount
  });
  return null;
}

function startBridgeHealthLoop() {
  if (bridgeHealthTimer) {
    clearInterval(bridgeHealthTimer);
    bridgeHealthTimer = null;
  }
  bridgeHealthTimer = setInterval(async () => {
    const settings = stateManager.get("settings") || {};
    const health = await llmService.getHealth();
    if (health && health.ok) {
      sendToRenderer("llm-status-change", "bridge_online");
      return;
    }
    if (settings.connectOnStartup) {
      applyBridgeSettings(settings);
      sendToRenderer("llm-status-change", "bridge_reconnecting");
    } else {
      sendToRenderer("llm-status-change", "bridge_offline");
    }
  }, 12000);
}

function clearConversationState() {
  stateManager.setState({
    chat: [],
    tokens: 0
  });
  return true;
}

function deleteLastExchangeFromState() {
  const chat = Array.isArray(stateManager.get("chat")) ? [...stateManager.get("chat")] : [];
  for (let i = chat.length - 1; i >= 0; i -= 1) {
    if (chat[i] && chat[i].role === "assistant") {
      chat.splice(i, 1);
      break;
    }
  }
  for (let i = chat.length - 1; i >= 0; i -= 1) {
    if (chat[i] && chat[i].role === "user") {
      chat.splice(i, 1);
      break;
    }
  }
  stateManager.setState({
    chat,
    tokens: countChatTokens(chat)
  });
  return chat.length;
}

function countWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean).length;
}

function countChatTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  let total = 0;
  for (const message of messages) {
    total += countWords(message && message.content);
  }
  return total;
}

function readKnowledgeEntries(limit = 200) {
  const knowledgePath = path.join(process.cwd(), "tmp", "agent-knowledge.jsonl");
  if (!fs.existsSync(knowledgePath)) {
    return [];
  }

  const max = Math.max(1, Number(limit) || 200);
  const lines = fs
    .readFileSync(knowledgePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(-max);

  return lines
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function buildCapabilityGraph(entries) {
  const buckets = new Map();
  for (const row of entries) {
    if (!row || row.type !== "CAPABILITY_ACCESS") {
      continue;
    }
    const cap = String(row.cap || "UNKNOWN");
    const target = String(row.target || "");
    const current = buckets.get(cap) || { count: 0, targets: new Set() };
    current.count += 1;
    if (target) {
      current.targets.add(target);
    }
    buckets.set(cap, current);
  }

  return Array.from(buckets.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([cap, info]) => ({
      capability: cap,
      count: info.count,
      targets: Array.from(info.targets).slice(0, 50)
    }));
}

function persistConversation(chat) {
  const safeChat = Array.isArray(chat) ? chat : [];
  stateManager.setState({
    chat: safeChat,
    tokens: countChatTokens(safeChat)
  });
}

async function runBuiltInCommand(name, args) {
  switch (name) {
    case "help":
      return {
        commands: [...BUILT_IN_COMMANDS, ...pluginLoader.listCommands()].map((cmd) => ({
          name: cmd.name,
          args: cmd.args || [],
          description: cmd.description || "",
          source: cmd.source || "plugin"
        }))
      };
    case "clear":
    case "new":
      clearConversationState();
      return { cleared: true };
    case "model": {
      const model = validateModel(args[0]);
      llmService.setModel(model);
      stateManager.set("model", model);
      return { model };
    }
    case "theme": {
      const theme = String(args[0] || "").toLowerCase();
      if (theme !== "dark" && theme !== "light") {
        throw new Error("theme must be dark or light.");
      }
      const merged = {
        ...(stateManager.get("settings") || {}),
        theme
      };
      stateManager.set("settings", merged);
      return { theme };
    }
    case "models": {
      const models = await llmService.getModelList();
      return { models };
    }
    case "find": {
      const query = String(args[0] || "").toLowerCase();
      if (!query) {
        return { matches: [] };
      }
      const chat = Array.isArray(stateManager.get("chat")) ? stateManager.get("chat") : [];
      const matches = chat.filter((msg) => {
        return msg && typeof msg.content === "string" && msg.content.toLowerCase().includes(query);
      });
      return { matches };
    }
    case "save": {
      const name = validateSessionName(args[0]);
      const passphrase = validatePassphrase(args[1]);
      const payload = {
        model: stateManager.get("model") || "llama3",
        chat: Array.isArray(stateManager.get("chat")) ? stateManager.get("chat") : [],
        settings: stateManager.get("settings") || {},
        updatedAt: new Date().toISOString()
      };
      sessionManager.saveSession(name, payload, passphrase);
      return { saved: true, name };
    }
    case "load": {
      const name = validateSessionName(args[0]);
      const passphrase = validatePassphrase(args[1]);
      const payload = sessionManager.loadSession(name, passphrase);
      const nextState = {};
      if (payload && typeof payload === "object") {
        if (Array.isArray(payload.chat)) {
          nextState.chat = payload.chat;
        }
        if (payload.model) {
          nextState.model = payload.model;
          llmService.setModel(payload.model);
        }
        if (payload.settings && typeof payload.settings === "object") {
          nextState.settings = {
            ...(stateManager.get("settings") || {}),
            ...payload.settings
          };
        }
      }
      if (Object.keys(nextState).length > 0) {
        if (Array.isArray(nextState.chat)) {
          nextState.tokens = countChatTokens(nextState.chat);
        }
        stateManager.setState(nextState);
      }
      return { loaded: true, name, payload };
    }
    case "rename": {
      const from = validateSessionName(args[0], "old session name");
      const to = validateSessionName(args[1], "new session name");
      sessionManager.renameSession(from, to);
      return { renamed: true, from, to };
    }
    case "delete": {
      const name = validateSessionName(args[0]);
      sessionManager.deleteSession(name);
      return { deleted: true, name };
    }
    case "duplicate": {
      const source = validateSessionName(args[0], "source session name");
      const target = validateSessionName(args[1], "target session name");
      const passphrase = validatePassphrase(args[2]);
      const payload = sessionManager.loadSession(source, passphrase);
      sessionManager.saveSession(target, payload, passphrase);
      return { duplicated: true, source, target };
    }
    case "deletelast":
      return { remaining: deleteLastExchangeFromState() };
    case "copylast": {
      const chat = Array.isArray(stateManager.get("chat")) ? stateManager.get("chat") : [];
      const lastAssistant = [...chat].reverse().find((msg) => msg && msg.role === "assistant");
      return {
        content: lastAssistant && typeof lastAssistant.content === "string" ? lastAssistant.content : ""
      };
    }
    case "clearlogs":
      return {
        appLogsCleared: Boolean(logger.clear()),
        chatLogsCleared: Boolean(chatLogStore.clear())
      };
    case "selftest": {
      const health = await llmService.getHealth();
      const stats = systemMonitor.getStats();
      const sessions = sessionManager.listSessions();
      const audit = auditChain ? auditChain.verify() : { ok: false, reason: "audit unavailable" };
      return {
        ok: Boolean(health && health.ok),
        model: stateManager.get("model") || "llama3",
        sessionCount: sessions.length,
        pluginCommandCount: pluginLoader.listCommands().length,
        health,
        stats,
        audit
      };
    }
    case "stats":
      return systemMonitor.getStats();
    case "persona": {
      const profile = String(args[0] || "").trim().toLowerCase();
      if (!["balanced", "engineer", "founder", "analyst", "creative"].includes(profile)) {
        throw new Error("persona must be one of: balanced, engineer, founder, analyst, creative.");
      }
      llmService.setPersona(profile);
      const merged = {
        ...(stateManager.get("settings") || {}),
        personalityProfile: profile
      };
      stateManager.set("settings", merged);
      if (rgbController) {
        rgbController.configure(merged);
        await rgbController.applyMood("focused", profile);
      }
      return { persona: profile };
    }
    default:
      return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      enableRemoteModule: false,
      webSecurity: true
    }
  });

  // Zero-Renderer Network Lockdown
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url;
    // Allow internal file loading and devtools
    if (url.startsWith('file://') || url.startsWith('devtools://')) {
      return callback({ cancel: false });
    }
    // Block ALL other outbound requests from renderer
    console.warn(`[SECURITY] Blocked renderer network request: ${url}`);
    callback({ cancel: true });
  });

  // Navigation Guards
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      console.warn(`[SECURITY] Blocked navigation to: ${url}`);
    }
  });

  mainWindow.webContents.on('new-window', (event, url) => {
    event.preventDefault();
    console.warn(`[SECURITY] Blocked new window request to: ${url}`);
  });

  // Strict CSP
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none';"]
      }
    });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadFile(path.join(__dirname, "renderer.html"));
}

app.whenReady().then(async () => {
  // --- INTEGRITY BOOT ---
  const report = await verifyIntegrity();
  if (!report.ok) {
    console.error('[SECURITY] Integrity check failed. Booting into Recovery Mode.');
    createRecoveryWindow(report);
    return; // Stop normal boot
  }

  logger = require("./core/logger");
  chatLogStore = require("./core/chatLogStore");
  pluginLoader = require("./core/pluginLoader");
  sessionManager = require("./core/sessionManager");
  stateManager = require("./core/stateManager");
  systemMonitor = require("./core/systemMonitor");
  rgbController = require("./core/rgbController");
  xpManager = require("./core/xpManager");
  ritualManager = require("./core/ritualManager");
  historyLoader = require("./core/historyLoader");
  secretVault = require("./core/secretVault");
  const AgentController = require("./core/agentController");
  agentController = new AgentController({ llmService, sessionManager });
  auditChain = new AuditChain(
    path.join(app.getPath("userData"), "audit-chain.jsonl")
  );

  stateManager.load();
  auditChain.init();
  await identityKernel.init();
  const settings = stateManager.get("settings") || {};
  applyBridgeSettings(settings);
  llmService.setModel(stateManager.get("model") || "llama3");
  llmService.setPersona(settings.personalityProfile || "balanced");
  rgbController.configure(settings);
  await rgbController.applyMood("idle", settings.personalityProfile || "balanced");

  llmService.onStatusChange((status) => {
    sendToRenderer("llm-status-change", status);
    const personality = (stateManager.get("settings") || {}).personalityProfile || "balanced";
    const mood = status === "online" || status === "ready"
      ? "focused"
      : status === "reconnecting"
        ? "caution"
        : status === "error" || status === "offline"
          ? "critical"
          : "idle";
    rgbController.applyMood(mood, personality).catch(() => { });
  });

  await pluginLoader.onLoad();
  startBridgeHealthLoop();
  createWindow();
  auditChain.append({ event: "app_ready", settingsVersion: Number(stateManager.get("stateVersion") || 0) });

  if (SMOKE_MODE) {
    await runSmokeProbe();
    return;
  }

  // --- DaemonWatchdog ---
  daemonWatchdog = new DaemonWatchdog();

  daemonWatchdog.on("started", (info) => {
    sendToRenderer("daemon-status", { status: "running", ...info });
    auditChain.append({ event: "daemon_started", pid: info.pid });
  });
  daemonWatchdog.on("daemon-log", (info) => {
    if (info.level === "info") {
      const match = info.line.match(/\[PROGRESS\]\s+(tx_[a-f0-9-]+)\s+(\d+)/);
      if (match) {
        sendToRenderer("transfer-progress", { id: match[1], pct: parseInt(match[2], 10) });
      }
    }
  });

  daemonWatchdog.on("stopped", (info) => {
    sendToRenderer("daemon-status", { status: "stopped", ...info });
  });
  daemonWatchdog.on("restart-scheduled", (info) => {
    sendToRenderer("daemon-status", { status: "restarting", ...info });
  });
  daemonWatchdog.on("fatal", (info) => {
    sendToRenderer("daemon-status", { status: "fatal", ...info });
    auditChain.append({ event: "daemon_fatal", message: info.message });
  });
  daemonWatchdog.on("spawn-failed", (info) => {
    sendToRenderer("daemon-status", { status: "spawn-failed", ...info });
  });

  daemonWatchdog.start();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

module.exports = { sendToRenderer };

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", async () => {
  if (bridgeHealthTimer) {
    clearInterval(bridgeHealthTimer);
    bridgeHealthTimer = null;
  }
  await pluginLoader.onShutdown();
});

// ---------------- LLM IPC ----------------

ipcMain.handle("llm:ping", async () => {
  const health = await llmService.getHealth();
  return Boolean(health && health.ok);
});

ipcMain.handle("llm:listModels", async () => {
  const models = await llmService.getModelList();
  return models;
});

ipcMain.handle("llm:health", async () => {
  return llmService.getHealth();
});

ipcMain.handle("llm:chat", async (_event, messages) => {
  const payload = validateMessages(messages);
  const verdict = enforcePolicyOnMessages(currentSafetyPolicy(), payload);
  if (verdict.blocked) {
    logger.log("warn", "llm:chat blocked by safety policy", { verdict });
    auditChain.append({ event: "safety_block", op: "llm:chat", verdict });
    throw new Error(verdict.reason || "Blocked by safety policy.");
  }
  const latestMessage = payload[payload.length - 1];

  if (latestMessage) {
    await pluginLoader.onMessage(latestMessage, payload);
    chatLogStore.append("user_message", {
      model: stateManager.get("model") || "unknown",
      content: latestMessage.content
    });
  }

  const response = await llmService.chat(payload, false);
  const assistantContent = response && response.message ? response.message.content || "" : "";
  const assistantMessage = {
    role: "assistant",
    content: String(assistantContent || "")
  };
  const nextChat = [...payload, assistantMessage];
  persistConversation(nextChat);
  systemMonitor.addTokens(countWords(assistantContent));
  chatLogStore.append("assistant_message", {
    model: stateManager.get("model") || "unknown",
    content: assistantContent
  });
  return response;
});

ipcMain.handle("llm:stream", async (_event, messages) => {
  const payload = validateMessages(messages);
  const verdict = enforcePolicyOnMessages(currentSafetyPolicy(), payload);
  if (verdict.blocked) {
    logger.log("warn", "llm:stream blocked by safety policy", { verdict });
    auditChain.append({ event: "safety_block", op: "llm:stream", verdict });
    throw new Error(verdict.reason || "Blocked by safety policy.");
  }
  const latestMessage = payload[payload.length - 1];

  if (latestMessage) {
    await pluginLoader.onMessage(latestMessage, payload);
    chatLogStore.append("user_message", {
      model: stateManager.get("model") || "unknown",
      content: latestMessage.content
    });
  }

  try {
    let assistantBuffer = "";
    const iterator = await llmService.chat(payload, true);
    for await (const chunk of iterator) {
      const token = chunk && chunk.message ? chunk.message.content || "" : "";
      assistantBuffer += token;
      sendToRenderer("llm-stream-data", chunk);
    }
    const assistantMessage = {
      role: "assistant",
      content: String(assistantBuffer || "")
    };
    persistConversation([...payload, assistantMessage]);
    systemMonitor.addTokens(countWords(assistantBuffer));
    chatLogStore.append("assistant_message_stream", {
      model: stateManager.get("model") || "unknown",
      content: assistantBuffer
    });
    sendToRenderer("llm-stream-complete");
    return true;
  } catch (err) {
    const message = err && err.message ? err.message : "Streaming failed";
    sendToRenderer("llm-stream-error", message);
    return false;
  }
});

ipcMain.handle("llm:cancelStream", async () => {
  llmService.cancelStream();
  return true;
});

ipcMain.handle("model:set", async (_event, model) => {
  const safeModel = validateModel(model);
  llmService.setModel(safeModel);
  stateManager.set("model", safeModel);
  return safeModel;
});

// ---------------- STATE IPC ----------------

ipcMain.handle("state:get", async () => stateManager.getState());

ipcMain.handle("state:set", async (_event, key, value) => {
  const safeKey = validateStateKey(key);
  if (safeKey === "model") {
    const safeModel = validateModel(value);
    llmService.setModel(safeModel);
    stateManager.set("model", safeModel);
    return true;
  }
  if (safeKey === "settings") {
    const merged = {
      ...(stateManager.get("settings") || {}),
      ...validateSettings(value)
    };
    stateManager.set("settings", merged);
    llmService.setPersona(merged.personalityProfile || "balanced");
    applyBridgeSettings(merged);
    return true;
  }
  if (safeKey === "chat") {
    const safeChat = validateMessages(value);
    persistConversation(safeChat);
    return true;
  }
  stateManager.set(safeKey, value);
  return true;
});

ipcMain.handle("state:update", async (_event, updates) => {
  const safeUpdates = validateStateUpdates(updates);
  if (safeUpdates.model != null) {
    llmService.setModel(validateModel(safeUpdates.model));
  }
  if (safeUpdates.settings != null) {
    const merged = {
      ...(stateManager.get("settings") || {}),
      ...validateSettings(safeUpdates.settings)
    };
    safeUpdates.settings = merged;
    llmService.setPersona(merged.personalityProfile || "balanced");
    applyBridgeSettings(merged);
  }
  if (safeUpdates.chat != null) {
    safeUpdates.chat = validateMessages(safeUpdates.chat);
    safeUpdates.tokens = countChatTokens(safeUpdates.chat);
  }
  stateManager.setState(safeUpdates);
  return true;
});

ipcMain.handle("state:export", async () => {
  return stateManager.getState();
});

ipcMain.handle("state:import", async (_event, payload) => {
  const safeState = validateImportedState(payload);
  if (safeState.model) {
    llmService.setModel(safeState.model);
  }
  if (safeState.settings) {
    const mergedSettings = {
      ...(stateManager.get("settings") || {}),
      ...safeState.settings
    };
    safeState.settings = mergedSettings;
    llmService.setPersona(mergedSettings.personalityProfile || "balanced");
    applyBridgeSettings(mergedSettings);
    if (rgbController) {
      rgbController.configure(mergedSettings);
    }
  }
  if (safeState.chat) {
    safeState.tokens = countChatTokens(safeState.chat);
  }
  stateManager.setState(safeState);
  chatLogStore.append("state_import", { keys: Object.keys(safeState) });
  return true;
});

// ---------------- SETTINGS IPC ----------------

ipcMain.handle("settings:get", async () => {
  return stateManager.get("settings") || {};
});

ipcMain.handle("settings:update", async (_event, settings) => {
  const safeSettings = validateSettings(settings);
  const merged = {
    ...(stateManager.get("settings") || {}),
    ...safeSettings
  };
  stateManager.set("settings", merged);
  llmService.setPersona(merged.personalityProfile || "balanced");
  applyBridgeSettings(merged);
  if (rgbController) {
    rgbController.configure(merged);
    await rgbController.applyMood("idle", merged.personalityProfile || "balanced");
  }
  return merged;
});

ipcMain.handle("llm:bridge:get", async () => {
  const settings = stateManager.get("settings") || {};
  const profiles = normalizeBridgeProfiles(settings);
  return {
    profiles,
    activeProfileId: settings.activeProfileId || (profiles[0] && profiles[0].id) || "",
    connectOnStartup: settings.connectOnStartup !== false,
    allowRemoteBridge: Boolean(settings.allowRemoteBridge)
  };
});

ipcMain.handle("llm:bridge:test", async (_event, rawProfile) => {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const baseUrl = String(profile.baseUrl || "").trim();
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("Bridge baseUrl must start with http:// or https://");
  }
  const settings = stateManager.get("settings") || {};
  if (!settings.allowRemoteBridge) {
    const host = new URL(baseUrl).hostname.toLowerCase();
    const isLocal = host === "127.0.0.1" || host === "localhost" || host === "::1";
    if (!isLocal) {
      throw new Error("Remote bridges are disabled in offline-first mode.");
    }
  }
  const timeoutMs = Number(profile.timeoutMs) || 15000;
  const retryCount = Number(profile.retryCount) || 2;
  const model = String(profile.defaultModel || stateManager.get("model") || "llama3");
  const probe = new LLMService({
    requestTimeoutMs: timeoutMs,
    maxRetries: retryCount
  });
  probe.configure({
    baseUrl,
    requestTimeoutMs: timeoutMs,
    maxRetries: retryCount
  });
  probe.setModel(model);
  const models = await probe.getModelList();
  const health = await probe.getHealth();
  return {
    ok: Boolean(health && health.ok),
    baseUrl,
    models: models.slice(0, 20),
    modelCount: models.length,
    health
  };
});

ipcMain.handle("llm:bridge:save", async (_event, payload) => {
  const data = payload && typeof payload === "object" ? payload : {};
  const settings = stateManager.get("settings") || {};
  const next = {
    ...settings,
    connectionProfiles: Array.isArray(data.profiles) ? data.profiles : settings.connectionProfiles || [],
    activeProfileId: String(data.activeProfileId || settings.activeProfileId || ""),
    connectOnStartup: data.connectOnStartup == null ? settings.connectOnStartup !== false : Boolean(data.connectOnStartup),
    allowRemoteBridge: data.allowRemoteBridge == null ? Boolean(settings.allowRemoteBridge) : Boolean(data.allowRemoteBridge)
  };
  const safeSettings = validateSettings(next);
  stateManager.set("settings", {
    ...settings,
    ...safeSettings
  });
  applyBridgeSettings(stateManager.get("settings") || {});
  return true;
});

ipcMain.handle("rgb:status", async () => {
  if (!rgbController) {
    return { ok: false, error: "rgb controller not loaded" };
  }
  return rgbController.getStatus();
});

ipcMain.handle("rgb:applyMood", async (_event, payload) => {
  if (!rgbController) {
    return { ok: false, error: "rgb controller not loaded" };
  }
  const data = payload && typeof payload === "object" ? payload : {};
  const settings = stateManager.get("settings") || {};
  const mood = String(data.mood || "idle");
  const personality = String(data.personality || settings.personalityProfile || "balanced");
  return rgbController.applyMood(mood, personality);
});

ipcMain.handle("audit:append", async (_event, payload) => {
  if (!auditChain) {
    return { ok: false, error: "audit chain unavailable" };
  }
  const row = auditChain.append(payload && typeof payload === "object" ? payload : { value: String(payload || "") });
  return { ok: true, row };
});

ipcMain.handle("audit:tail", async (_event, limit) => {
  if (!auditChain) return [];
  return auditChain.tail(limit);
});

ipcMain.handle("audit:verify", async () => {
  if (!auditChain) return { ok: false, reason: "audit chain unavailable" };
  return auditChain.verify();
});

// ---------------- SESSION IPC ----------------

ipcMain.handle("session:list", async () => sessionManager.listSessions());

ipcMain.handle("session:save", async (_event, name, data, passphrase) => {
  const safeName = validateSessionName(name);
  const safePassphrase = validatePassphrase(passphrase);
  sessionManager.saveSession(safeName, data, safePassphrase);
  chatLogStore.append("session_save", { name: safeName });
  return true;
});

ipcMain.handle("session:load", async (_event, name, passphrase) => {
  const safeName = validateSessionName(name);
  const safePassphrase = validatePassphrase(passphrase);
  const loaded = sessionManager.loadSession(safeName, safePassphrase);
  chatLogStore.append("session_load", { name: safeName });
  return loaded;
});

ipcMain.handle("session:search", async (_event, query) => {
  return sessionManager.search(String(query || ""));
});

ipcMain.handle("session:delete", async (_event, name) => {
  const safeName = validateSessionName(name);
  sessionManager.deleteSession(safeName);
  return true;
});

ipcMain.handle("session:rename", async (_event, oldName, newName) => {
  const safeOldName = validateSessionName(oldName, "old session name");
  const safeNewName = validateSessionName(newName, "new session name");
  sessionManager.renameSession(safeOldName, safeNewName);
  return true;
});

ipcMain.handle("session:metadata", async () => {
  return sessionManager.index || {};
});

ipcMain.handle("session:repairIndex", async () => {
  return sessionManager.repairIndex();
});

ipcMain.handle("session:export", async (_event, name, peerId, passphrase) => {
  const safeName = validateSessionName(name);
  const safePassphrase = passphrase ? validatePassphrase(passphrase) : null;
  if (!peerId) throw new Error("Peer ID required for export.");
  return sessionManager.exportToPeer(safeName, peerId, safePassphrase);
});

ipcMain.handle("session:import-bundle", async (_event, bundlePath, targetPassphrase) => {
  const vaultCoupling = require("./core/vaultCoupling");
  const safePassphrase = targetPassphrase ? validatePassphrase(targetPassphrase) : null;
  return vaultCoupling.verifyAndImportSession(bundlePath, safePassphrase);
});

// ---------------- IDENTITY IPC ----------------

ipcMain.handle("identity:pubkey", async () => {
  return {
    pem: identityKernel.getPublicKeyPem(),
    fingerprint: identityKernel.getFingerprint()
  };
});

ipcMain.handle("identity:trust-peer", async (_event, deviceId, pubKeyPem, label) => {
  return identityKernel.trustPeer(deviceId, pubKeyPem, label);
});

ipcMain.handle("identity:revoke-peer", async (_event, deviceId) => {
  return identityKernel.revokePeer(deviceId);
});

ipcMain.handle("identity:list-peers", async () => {
  return identityKernel.listPeers();
});

ipcMain.handle("identity:rotate", async () => {
  auditChain.append({ event: "identity_key_rotation" });
  return identityKernel.rotate();
});

// ---------------- DAEMON IPC ----------------

ipcMain.handle("daemon:status", async () => {
  if (!daemonWatchdog) return { status: "not-started" };
  return {
    status: daemonWatchdog.isAlive() ? "running" : "stopped",
    pid: daemonWatchdog._proc?.pid ?? null
  };
});

// ---------------- COMMAND IPC ----------------

ipcMain.handle("command:list", async () => {
  return [...BUILT_IN_COMMANDS, ...pluginLoader.listCommands()];
});

ipcMain.handle("command:run", async (_event, rawName, rawArgs) => {
  const name = validateCommandName(rawName);
  const args = validateCommandArgs(Array.isArray(rawArgs) ? rawArgs : []);
  const verdict = enforcePolicyOnArgs(currentSafetyPolicy(), args);
  if (verdict.blocked) {
    logger.log("warn", "command:run blocked by safety policy", { name, verdict });
    auditChain.append({ event: "safety_block", op: "command:run", name, verdict });
    throw new Error(verdict.reason || "Blocked by safety policy.");
  }
  const builtInResult = await runBuiltInCommand(name, args);
  if (builtInResult !== null) {
    return { ok: true, result: builtInResult };
  }
  const result = await pluginLoader.runCommand(name, {
    args,
    state: stateManager.getState(),
    sessionManager,
    llmService
  });
  return result;
});

// ---------------- SYSTEM & LOGGING IPC ----------------

ipcMain.handle("system:stats", async () => systemMonitor.getStats());

ipcMain.handle("log:log", async (_event, level, message, meta) => {
  const payload = validateLog(level, message);
  logger.log(payload.level, payload.message, meta && typeof meta === "object" ? meta : {});
  return true;
});

ipcMain.handle("log:tail", async (_event, lines) => {
  return logger.tail(lines);
});

ipcMain.handle("log:clear", async () => {
  return logger.clear();
});

ipcMain.handle("log:export", async () => {
  return logger.exportText();
});

ipcMain.handle("log:tailKnowledge", async (_event, lines) => {
  return readKnowledgeEntries(lines);
});

ipcMain.handle("log:getCapabilityGraph", async () => {
  const entries = readKnowledgeEntries(5000);
  return buildCapabilityGraph(entries);
});

// ---------------- CHAT LOG IPC ----------------

ipcMain.handle("chatlog:tail", async (_event, limit) => {
  return chatLogStore.tail(limit);
});

ipcMain.handle("chatlog:export", async () => {
  return chatLogStore.exportText();
});

ipcMain.handle("chatlog:clear", async () => {
  return chatLogStore.clear();
});

// ---------------- XP IPC ----------------

ipcMain.handle("xp:status", async () => xpManager.getStatus());

ipcMain.handle("xp:add", async (_event, amount) => {
  const res = xpManager.addXP(Number(amount));
  if (res.leveledUp) {
    sendToRenderer("xp-update", { leveledUp: true, tier: res.tier });
  }
  return res;
});

// ---------------- RITUAL IPC ----------------

ipcMain.handle("ritual:list", async () => ritualManager.getRituals());

ipcMain.handle("ritual:execute", async (_event, id) => {
  const res = ritualManager.execute(id);
  if (res.success) {
    sendToRenderer("ritual-triggered", res);
  }
  return res;
});

ipcMain.handle("ritual:schedule", async (_event, id, timestamp) => {
  return ritualManager.schedule(id, timestamp);
});

ipcMain.handle("ritual:setAutoTrigger", async (_event, criteria) => {
  return ritualManager.setAutoTrigger(criteria);
});

ipcMain.handle("ritual:scheduled", async () => ritualManager.getScheduled());

// ---------------- HISTORY IPC ----------------

ipcMain.handle("history:parse", async (_event, filePath) => {
  return historyLoader.parse(filePath);
});

ipcMain.handle("history:format", async (_event, logs) => {
  return historyLoader.formatForInjection(logs);
});

// ---------------- VAULT IPC ----------------

ipcMain.handle("vault:lock", async () => {
  return secretVault.lock();
});

ipcMain.handle("vault:unlock", async (_event, password) => {
  return secretVault.unlock(password);
});

ipcMain.handle("vault:compact", async (_event, data, format) => {
  return secretVault.compact(data, format);
});

// ---------------- ENHANCED LLM IPC ----------------

ipcMain.handle("llm:autoDetect", async () => {
  return llmService.autoDetectLocalLLM();
});

ipcMain.handle("llm:setPersona", async (_event, personaId) => {
  const result = llmService.setPersona(personaId);
  const merged = {
    ...(stateManager.get("settings") || {}),
    personalityProfile: result.persona
  };
  stateManager.set("settings", merged);
  return result;
});

// ---------------- RECOVERY IPC ----------------

ipcMain.handle("recovery:repair", async () => {
  const report = await verifyIntegrity();
  if (report.ok) return true;
  return await attemptRepair(report.failedFiles);
});

ipcMain.handle("recovery:restart", () => {
  app.relaunch();
  app.exit(0);
});

// ---------------- EMPIRE IPC ----------------

ipcMain.handle("empire:scan", async () => {
  // Scan one level up from NeuralShell (the GitHub workspace root)
  const workspaceRoot = path.join(__dirname, '../../');
  return await scanWorkspace(workspaceRoot);
});

// ---------------- KERNEL IPC ----------------

ipcMain.handle("kernel:request", async (_event, intent, payload) => {
  try {
    // 1. Validate intent and payload via Firewall
    const transaction = await intentFirewall.validate(intent, payload);

    // 2. Human-in-the-loop approval if required
    if (transaction.requiresApproval) {
      // For this prototype, we'll log and auto-approve, or prompt if UI exists
      console.log(`[FIREWALL] Intent "${intent}" requires approval. Processing...`);
    }

    // 3. Route to Capability Kernel
    switch (intent) {
      case 'kernel:net:fetch':
        return await kernel.request(CAP_NET, 'safeFetch', transaction.payload);
      case 'session:save':
        // Legacy routing for now, or migrate sessionManager to CAP_FS
        return await runBuiltInCommand('save', [payload.name, payload.passphrase]);
      default:
        throw new Error(`Intent "${intent}" not yet routed in kernel.`);
    }
  } catch (err) {
    logger.log("warn", `kernel:request denied: ${err.message}`, { intent, payload });
    throw err;
  }
});
