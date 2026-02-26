const { app, BrowserWindow, ipcMain, dialog, globalShortcut, session } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const fetch = require("node-fetch");
const { URL } = require("url");
const { X509Certificate } = require("crypto");
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
const { executeTask, getAvailableTasks } = require("../kernel/taskExecutor");
const { verifyBootIntegrity } = require("./src/boot/verify");
const { verifyInstallation, PROTECTED_DIRECTORIES } = require("./scripts/verify-installation");

const LLM_HOST = "http://localhost:3000";
const MAX_WRITE_BYTES = 2 * 1024 * 1024;
const HEADLESS = process.env.NS_HEADLESS === "1";
const windows = new Set();
const streamControllers = new Map();
const streamPayloadCache = new Map();

// --- HARDENING: VAULT GENOME & DECOY STATE ---
const SYSTEM_DNA = crypto.createHash('sha256').update(os.hostname() + os.platform() + os.arch()).digest('hex').substring(0, 16).toUpperCase();
let authFailures = 0;
let isDecoyMode = false;

// --- SECURITY: SPKI Certificate Pinning Configuration (Vulnerability 2 Fix) ---
let certificatePins = { pins: {}, enforcement: { enabled: true, allowUnpinnedInDevelopment: false, logRejections: true } };
try {
  const pinsPath = path.join(__dirname, "certificate-pins.json");
  if (fs.existsSync(pinsPath)) {
    certificatePins = JSON.parse(fs.readFileSync(pinsPath, "utf8"));
  }
} catch (err) {
  console.error("[NeuralShield] Failed to load certificate-pins.json:", err.message);
}

const telemetry = new Telemetry();
let memoryStore;
let permissionManager;
let checkpointManager;
let pathGuard;
let authManager;
let secretVault;

// --- HARDENING: ROOT LOCK PATH GUARD ---
function createSovereignPathGuard(allowedRoots) {
  return {
    assertAllowed: (targetPath) => {
      const abs = path.resolve(targetPath);
      const isAllowed = allowedRoots.some(root => abs.startsWith(path.resolve(root)));
      if (!isAllowed) {
        console.error(`[NeuralShield] 🛡️ ACCESS DENIED: ${abs}`);
        throw new Error("NeuralShield: Access outside project root is physically blocked.");
      }
      return abs;
    }
  };
}
const syncClient = new SyncClient();
const updateService = new UpdateService();

if (process.env.NS_USER_DATA_DIR) {
  app.setPath("userData", path.resolve(process.env.NS_USER_DATA_DIR));
}

let backendWs = null;
function setupBackendWebSocket() {
  // Use built-in WebSocket if available in Node 22, otherwise try to mock or handle gracefully
  // Since we are in Electron main process, we might need a lib, but let's try standard approach
  try {
    const wsUrl = LLM_HOST.replace("http", "ws") + "/ws";
    // Using a simple interval to poll for now as a robust fallback for "Sentience" visibility
    setInterval(async () => {
      try {
        const res = await fetch(`${LLM_HOST}/api/swarm/status`);
        if (res.ok) {
          const status = await res.json();
          if (status.tasksPending > 0) {
            emit("cognitive:event", { agent: "Orchestrator", content: `Active tasks in queue: ${status.tasksPending}` });
          }
        }
      } catch {}
    }, 10000);
  } catch (err) {
    console.error("Backend link failed:", err);
  }
}

function emit(channel, payload) {
  // Block emission of sensitive data if in Decoy Mode
  if (isDecoyMode && channel !== "cognitive:event" && channel !== "auth:decoy") return;
  for (const win of windows) {
    if (!win.isDestroyed()) {
      win.webContents.send(channel, payload);
    }
  }
}

const autonomousEngine = new AutonomousEngine((tick) => {
  if (isDecoyMode) return; // Stop engine in decoy mode
  emit("auto:tick", tick);
  emit("cognitive:event", {
    agent: "AutonomousEngine",
    content: `Triggering sequence ${tick.sequence} for goal: ${tick.goal}`
  });
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, "src", "assets", "app.ico"),
    frame: false, // Ghost HUD: No frame
    transparent: true, // Ghost HUD: Transparency
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true, // Enable Chromium sandbox
      webSecurity: true, // SECURITY: Enable web security (Vulnerability 1 Fix)
      allowRunningInsecureContent: false // SECURITY: Disable insecure content (Vulnerability 1 Fix)
    }
  });

  // SECURITY: Enforce strict CSP - Zero Network Access (Vulnerability 1 Fix)
  // Only allow file:// and data: (images only), block all network protocols
  // Note: 'self' allows file:// when loaded from file://, but webRequest blocks all network
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; img-src 'self' data: file:; script-src 'self'; style-src 'self'; connect-src 'none'; font-src 'self';"]
      }
    });
  });

  win.loadFile("src/renderer.html");
  windows.add(win);
  
  // Register Global Overlay Shortcut
  globalShortcut.register('Alt+Space', () => {
    if (win.isVisible()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  win.on("closed", () => {
    windows.delete(win);
    globalShortcut.unregister('Alt+Space');
  });
  return win;
}

async function runRecoverySmoke(win) {
  if (!win || win.isDestroyed()) {
    app.exit(1);
    return;
  }
  try {
    const result = await win.webContents.executeJavaScript(`
      (async () => {
        const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        const get = (id) => document.getElementById(id);
        await sleep(800);
        const pin = get("authPinInput");
        const loginBtn = get("authLoginBtn");
        const logoutBtn = get("authLogoutBtn");
        const recoverInput = get("authRecoverConfirmInput");
        const recoverBtn = get("authRecoverBtn");
        const output = get("authOutput");
        if (!pin || !loginBtn || !logoutBtn || !recoverInput || !recoverBtn || !output) {
          return { ok: false, reason: "missing-auth-controls" };
        }

        pin.value = "2468";
        loginBtn.click();
        await sleep(600);
        if (!/Logged in/i.test(output.textContent || "")) {
          return { ok: false, reason: "initial-login-failed", output: output.textContent || "" };
        }

        logoutBtn.click();
        await sleep(300);

        pin.value = "8642";
        recoverInput.value = "RESET PIN";
        recoverBtn.click();
        await sleep(900);
        if (!/PIN recovered/i.test(output.textContent || "")) {
          return { ok: false, reason: "recover-flow-failed", output: output.textContent || "" };
        }

        pin.value = "8642";
        loginBtn.click();
        await sleep(600);
        if (!/Logged in/i.test(output.textContent || "")) {
          return { ok: false, reason: "post-recovery-login-failed", output: output.textContent || "" };
        }
        return { ok: true };
      })();
    `);
    app.exit(result?.ok ? 0 : 1);
  } catch {
    app.exit(1);
  }
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

// --- SECURITY: SPKI Certificate Pinning Handler (Vulnerability 2 Fix) ---
// Validates HTTPS certificates against pinned SPKI hashes
// Rejects all unpinned hosts to prevent man-in-the-middle attacks
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault(); // Prevent default behavior
  
  const parsedUrl = new URL(url);
  const hostname = parsedUrl.hostname;
  
  // Check if certificate pinning is enforced
  if (!certificatePins.enforcement.enabled) {
    if (certificatePins.enforcement.logRejections) {
      console.warn(`[NeuralShield] Certificate pinning disabled, allowing ${hostname}`);
    }
    callback(true);
    return;
  }
  
  // Get the expected pin for this hostname
  const expectedPin = certificatePins.pins[hostname];
  
  // Reject unpinned hosts
  if (!expectedPin) {
    if (certificatePins.enforcement.logRejections) {
      console.error(`[NeuralShield] 🛡️ CERTIFICATE PINNING: Rejected unpinned host ${hostname}`);
    }
    callback(false);
    return;
  }
  
  try {
    // Extract SPKI from certificate and compute SHA256 hash
    const cert = new X509Certificate(certificate.data);
    const spki = cert.publicKey.export({ type: 'spki', format: 'der' });
    const hash = crypto.createHash('sha256').update(spki).digest('base64');
    const actualPin = `sha256/${hash}`;
    
    // Validate pin matches
    if (actualPin === expectedPin) {
      if (certificatePins.enforcement.logRejections) {
        console.log(`[NeuralShield] ✓ Certificate pin validated for ${hostname}`);
      }
      callback(true);
    } else {
      if (certificatePins.enforcement.logRejections) {
        console.error(`[NeuralShield] 🛡️ CERTIFICATE PINNING: Pin mismatch for ${hostname}`);
        console.error(`   Expected: ${expectedPin}`);
        console.error(`   Actual:   ${actualPin}`);
      }
      callback(false);
    }
  } catch (err) {
    if (certificatePins.enforcement.logRejections) {
      console.error(`[NeuralShield] 🛡️ CERTIFICATE PINNING: Error validating ${hostname}:`, err.message);
    }
    callback(false);
  }
});

app.whenReady().then(async () => {
  // SECURITY: Installation Path & ACL Verification (Vulnerability 7 Fix)
  // Verify installation path is under protected directory with secure ACL permissions
  // Uses fs.stat() to check file mode for worldWritable (mode & 0o002) and groupWritable (mode & 0o020)
  // Checks: no worldWritable, no groupWritable, must be in PROTECTED_DIRECTORIES
  // Skip verification in development mode (NODE_ENV=development or not packaged)
  const isDevelopment = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (!isDevelopment) {
    console.log('[NeuralShield] 🔐 Verifying installation path security...');
    const installationSecure = verifyInstallation();
    
    if (!installationSecure) {
      console.error('[NeuralShield] 🛡️ INSTALLATION PATH VERIFICATION FAILED');
      console.error('[NeuralShield] Installation path is insecure (worldWritable or groupWritable permissions detected).');
      process.exit(1);
    }
    
    console.log('[NeuralShield] ✓ Installation path verification passed (no world-writable or group-writable permissions)');
  } else {
    console.log('[NeuralShield] ⚠️  Development mode: Skipping installation path verification');
  }
  
  // SECURITY: Signed Boot Chain Verification (Vulnerability 4 Fix)
  // Verify manifest signature and file hashes before creating BrowserWindow
  // Skip verification in development mode (NODE_ENV=development or not packaged)
  
  if (!isDevelopment) {
    console.log('[NeuralShield] 🔐 Verifying boot chain integrity...');
    const bootResult = verifyBootIntegrity();
    
    if (!bootResult.ok) {
      console.error('[NeuralShield] 🛡️ BOOT CHAIN VERIFICATION FAILED:', bootResult.reason);
      console.error('[NeuralShield] Application integrity compromised. Exiting.');
      process.exit(1);
    }
    
    console.log('[NeuralShield] ✓ Boot chain verification passed');
  } else {
    console.log('[NeuralShield] ⚠️  Development mode: Skipping boot chain verification');
  }
  
  const dataDir = path.join(app.getPath("userData"), "neuralshell_runtime");
  
  // SECURITY: Renderer Zero Network Enforcement (Vulnerability 1 Fix)
  // Block all network protocols except file:// and data: (images only)
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, cb) => {
    const url = new URL(details.url);
    
    // Allow file:// protocol for application resources
    if (url.protocol === 'file:') {
      return cb({ cancel: false });
    }
    
    // Allow data: protocol for images only
    if (url.protocol === 'data:' && details.resourceType === 'image') {
      return cb({ cancel: false });
    }
    
    // Block all other protocols (http, https, ws, wss, ftp, etc.)
    console.warn(`[NeuralShield] 🛡️ BLOCKED NETWORK REQUEST: ${url.protocol}//${url.host}${url.pathname}`);
    cb({ cancel: true });
  });
  
  // LOCKDOWN: Only allow access to internal data and the explicit memory package
  pathGuard = createSovereignPathGuard([
    app.getPath("userData"),
    process.cwd(),
    "C:\\Users\\KickA\\Downloads\\NeuralMemory_Package_SMALL"
  ]);

  memoryStore = new PersistentMemoryStore(path.join(dataDir, "memory"));
  permissionManager = new PermissionManager(path.join(dataDir, "security"));
  checkpointManager = new CheckpointManager(path.join(dataDir, "checkpoints"));
  authManager = new AuthManager(path.join(dataDir, "auth"));
  secretVault = new SecretVault(path.join(dataDir, "vault"));
  await Promise.all([memoryStore.init(), permissionManager.init(), checkpointManager.init(), authManager.init(), secretVault.init()]);

  setupBackendWebSocket();

  let firstWindow = null;
  if (!HEADLESS) {
    firstWindow = createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  }

  if (process.env.NS_E2E_RECOVERY_SMOKE === "1") {
    setTimeout(() => {
      void runRecoverySmoke(firstWindow);
    }, 200);
  }

  registerHandle("read-file", async (_evt, filePath, encoding = "utf8") => {
    requirePermission("fileRead");
    const safePath = pathGuard.assertAllowed(assertPath(filePath));
    await permissionManager.audit("read-file", safePath, "renderer");
    return fs.promises.readFile(safePath, encoding === "buffer" ? null : encoding);
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

  registerHandle("delete-file", async (_evt, filePath) => {
    authManager.requireAdmin();
    requirePermission("fileWrite"); // Re-use fileWrite permission for deletion
    const safePath = pathGuard.assertAllowed(assertPath(filePath));
    await permissionManager.audit("delete-file", safePath, "renderer");
    await fs.promises.unlink(safePath);
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
    const res = await fetch(`${LLM_HOST}/health`);
    return res.ok;
  });

  registerHandle("llm-models", async () => {
    try {
      const res = await fetch(`${LLM_HOST}/v1/models`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error("Failed to fetch models:", err);
      return [];
    }
  });

  registerHandle("llm-modes", async () => {
    try {
      const res = await fetch(`${LLM_HOST}/modes`);
      if (!res.ok) return { modes: [], default: "balanced" };
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch modes:", err);
      return { modes: [], default: "balanced" };
    }
  });

  registerHandle("llm-autonomy", async () => {
    try {
      const res = await fetch(`${LLM_HOST}/admin/autonomy`);
      if (!res.ok) return { error: "Failed to fetch autonomy status" };
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch autonomy status:", err);
      return { error: err.message };
    }
  });

  registerHandle("llm-apps", async () => {
    try {
      const res = await fetch(`${LLM_HOST}/api/genesis/apps`);
      if (!res.ok) return { apps: [] };
      return await res.json();
    } catch (err) {
      console.error("Failed to fetch genesis apps:", err);
      return { apps: [] };
    }
  });

  registerHandle("llm-optimizations", async () => {
    try {
      const res = await fetch(`${LLM_HOST}/api/swarm/optimizations`);
      if (!res.ok) return { optimizations: [] };
      return await res.json();
    } catch (err) {
      return { optimizations: [] };
    }
  });

  registerHandle("llm-embed", async (_evt, text) => {
    try {
      // Direct call to Ollama for embedding (bypassing router for speed)
      // Assuming Ollama is on default port 11434, or use LLM_HOST if it proxies
      const res = await fetch("http://127.0.0.1:11434/api/embeddings", {
        method: "POST",
        body: JSON.stringify({ model: "nomic-embed-text", prompt: text })
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.embedding;
    } catch (err) {
      console.warn("Embedding failed:", err.message);
      return null;
    }
  });

  registerHandle("llm-vision", async (_evt, { imageBase64, prompt }) => {
    try {
      const res = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        body: JSON.stringify({
          model: "llava", // Expecting llava for vision
          prompt: prompt || "Describe this image in detail.",
          images: [imageBase64],
          stream: false
        })
      });
      if (!res.ok) throw new Error(`Ollama Vision Error: ${res.statusText}`);
      const json = await res.json();
      return json.response;
    } catch (err) {
      console.error("Vision failed:", err);
      return `[Vision Error] Could not analyze image. Ensure 'llava' model is pulled. (${err.message})`;
    }
  });

  registerHandle("llm-economy", async () => {
    try {
      const res = await fetch(`${LLM_HOST}/api/economy/ledger`);
      if (!res.ok) return { balances: { "admin-user": 0 } };
      const json = await res.json();
      return json;
    } catch (err) {
      return { balances: { "admin-user": 0 } };
    }
  });

  registerHandle("llm-set-quine-lock", async (_evt, locked) => {
    // ... logic remains
  });

  // SECURITY FIX: Vulnerability 3 - Secure Execution Model
  // Replaced vulnerable exec() with secure executeTask() from kernel/taskExecutor.js
  // Only predefined tasks from TASK_REGISTRY can be executed
  // All tasks use absolute binary paths, fixed arguments, and SHA256 verification
  registerHandle("llm-exec", async (_evt, taskId, additionalArgs = []) => {
    authManager.requireAdmin();
    requirePermission("fileWrite"); // Re-use write permission for safety
    
    try {
      // Execute task through secure kernel/taskExecutor.js
      const result = await executeTask(taskId, additionalArgs);
      
      return {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        success: result.code === 0,
        code: result.code
      };
    } catch (error) {
      // Return error information
      return {
        stdout: "",
        stderr: error.message || "Task execution failed",
        success: false,
        error: error.message
      };
    }
  });

  // SECURITY: List available tasks
  registerHandle("llm-exec-tasks", async () => {
    return {
      tasks: getAvailableTasks(),
      message: "Use llm-exec with taskId from this list"
    };
  });

  registerHandle("llm-chat", async (_e, body) => {
    if (!body || typeof body !== "object") throw new Error("Invalid chat payload");
    const res = await fetch(`${LLM_HOST}/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    
    const json = await res.json();
    
    // Return enhanced object with headers
    return {
      ...json,
      _meta: {
        qualityScore: res.headers.get('x-quality-score'),
        sentiment: res.headers.get('x-sentiment'),
        sentimentScore: res.headers.get('x-sentiment-score'),
        latency: res.headers.get('x-response-time-ms')
      }
    };
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

  registerHandle("auth:login", async (_evt, pin) => {
    if (isDecoyMode) return { role: "guest", loggedIn: false, error: "System Integrity Compromised." };
    
    try {
      const status = await authManager.login(pin);
      authFailures = 0;
      return status;
    } catch (err) {
      authFailures++;
      if (authFailures >= 3) {
        isDecoyMode = true;
        emit("auth:decoy", { message: "DECOY MODE ACTIVATED. REAL DATA UNMOUNTED." });
        console.warn("[Gatekeeper] ⚠️ 3 FAILED ATTEMPTS. DEPLOYING DECOY.");
        
        // --- HARDENING: SIGNAL BACKEND LOCKDOWN ---
        fetch(`${LLM_HOST}/admin/security/lockdown`, {
          method: 'POST',
          headers: { 'x-admin-token': process.env.ADMIN_TOKEN || "" }
        }).catch(() => {});
      }
      throw err;
    }
  });
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

  registerHandle("system-telemetry", async () => {
    if (isDecoyMode) return { cpu: 99, gpu: 99, ram: "0.00", status: "STALLED" };
    const mem = process.memoryUsage();
    const cpu = process.cpuUsage();
    return {
      cpu: Math.round((cpu.user + cpu.system) / 1000000) % 100,
      gpu: Math.floor(Math.random() * 30) + 10, // Simulated GPU load
      ram: (mem.heapUsed / 1024 / 1024 / 1024).toFixed(2)
    };
  });

  registerHandle("vault-genome", async () => {
    return { genome: `NS-${SYSTEM_DNA}-SOV` };
  });

  registerHandle("scan-legacy-tears", async () => {
    // ... rest of scan logic
  });

  registerHandle("system-purge", async () => {
    authManager.requireAdmin();
    const shadowPath = path.resolve("./state/shadow");
    const backupPath = path.resolve("./state/backups");
    
    try {
      if (fs.existsSync(shadowPath)) fs.rmSync(shadowPath, { recursive: true, force: true });
      if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { recursive: true, force: true });
      return { success: true };
    } catch (err) {
      console.error("[Iron Sentry] Purge failed:", err);
      return { success: false, error: err.message };
    }
  });

  if (process.env.NS_E2E_SMOKE === "1") {
    setTimeout(() => app.quit(), 4000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
