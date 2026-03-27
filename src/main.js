const { app, BrowserWindow, dialog, ipcMain, screen, session, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const intentFirewall = require("./security/intentFirewall");
const { kernel, CAP_NET } = require("./kernel");

const { verifyIntegrity } = require("./main/integrity/verify");
const { createRecoveryWindow } = require("./main/recovery/recoveryWindow");
const { attemptRepair } = require("./main/recovery/repair");

const { scanWorkspace } = require('./core/empireValidator');
const {
  applyPatchPlan,
  applyWorkspaceAction,
  previewPatchPlan,
  previewWorkspaceAction
} = require("./core/workspaceActionPlanner");
const {
  summarizeWorkspace,
  suggestContextPackPaths,
  statWorkspaceFiles,
  readWorkspaceFile
} = require("./core/workspaceSummary");
const projectIntelligence = require("./core/projectIntelligence");
const executionEngine = require("./core/executionEngine");
const chainPlanner = require("./core/chainPlanner");
const diagnosticsLedger = require("./core/diagnosticsLedger");
const actionOutcomeStore = require("./core/actionOutcomeStore");
const agentMarketplace = require("./core/agentMarketplace");
const { getAccelStatus } = require("./core/accelStatus");
const verificationCatalog = require("./verificationCatalog");
const bridgeProviderCatalog = require("./bridgeProviderCatalog");
const airgapPolicy = require("./airgapPolicy");
const bridgeSettingsModel = require("./bridgeSettingsModel");
const { runLlmSweep } = require("./core/llmSweep");
const { getGitStatusSummary } = require("./ipc/gitStatus.cjs");
const { streamProofCommand } = require("./ipc/execProof.cjs");
const { DaemonWsBridge } = require("./daemon/ws_bridge");
const { ModelPool } = require("./daemon/modelPool");
const { LocalCollabSignalServer } = require("../collab/signalServer.cjs");
const { HostedModelProxy } = require("../gateway/hostedModelProxy.js");
const { OTelBridge } = require("../telemetry/otelBridge.js");
const { resolveCapabilities, hasCapability } = require("./core/capabilities");
const {
  verifyLicenseBlob,
  planIdToLicenseMode,
  listPlans
} = require("../billing/licenseEngine");

let exportSupportBundle = null;
let evaluateReleaseHealth = null;
try {
  ({ exportSupportBundle } = require("../scripts/export_support_bundle.cjs"));
} catch {
  exportSupportBundle = null;
}
try {
  ({ evaluateReleaseHealth } = require("../scripts/release_health_check.cjs"));
} catch {
  evaluateReleaseHealth = null;
}

const llmService = require("./core/llmService");
const { LLM_STATUS, CONNECTION_DEFAULTS } = require("./core/config");
const { LLMService } = require("./core/llmService");
const { AuditChain } = require("./core/auditChain");
const identityKernel = require("./core/identityKernel");
const telemetry = require("./core/telemetry");
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
  validatePatchPlanRequest,
  validateVerificationRunRequest,
  validateSettings,
  validateSessionName,
  validateWorkspaceActionRequest,
  validateStateKey,
  validateStateUpdates,
  validateTelemetry
} = require("./core/ipcValidators");
let logger;
let chatLogStore;
let pluginLoader;
let sessionManager;
let stateManager;
let systemMonitor;
let analyticsStore;
let rgbController;
let auditChain;
let daemonWatchdog;
let daemonWsBridge;
let collabSignalServer;
let hostedModelProxy;
let otelBridge;
let modelPool;
let xpManager;
let ritualManager;
let historyLoader;
let secretVault;
let autoUpdateLane;
let _agentController;
let activeLicenseStatus = null;

let mainWindow = null;
let bridgeHealthTimer = null;
let smokeFinalized = false;
const proofExecSessions = new Map();

function parseRuntimeEnvFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = String(line || "").trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!key) continue;
    out[key] = value;
  }
  return out;
}

function loadRuntimeEnvOverrides() {
  const candidates = [path.join(process.cwd(), "NeuralShell.runtime.env")];
  try {
    const exeDir = path.dirname(app.getPath("exe"));
    candidates.push(path.join(exeDir, "NeuralShell.runtime.env"));
  } catch {
    // ignore pre-ready path failures
  }
  for (const candidate of candidates) {
    const vars = parseRuntimeEnvFile(candidate);
    for (const [key, value] of Object.entries(vars)) {
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

function normalizeLicenseMode(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "auditor" || raw === "audit") return "auditor";
  if (raw === "operator" || raw === "pro") return "operator";
  if (raw === "enterprise" || raw === "ent") return "enterprise";
  return "preview";
}

function forcedTierFromLicenseMode(mode) {
  if (mode === "auditor") return "AUDITOR";
  if (mode === "operator") return "OPERATOR";
  if (mode === "enterprise") return "OPERATOR";
  return null;
}

loadRuntimeEnvOverrides();
const RUNTIME_LICENSE_MODE = normalizeLicenseMode(process.env.LICENSE_MODE);
const FORCED_RUNTIME_TIER = forcedTierFromLicenseMode(RUNTIME_LICENSE_MODE);

function resolveLicenseStorePath() {
  try {
    return path.join(app.getPath("userData"), "billing", "active_license.json");
  } catch {
    return path.join(process.cwd(), "state", "billing", "active_license.json");
  }
}

function persistActiveLicenseBlob(blob) {
  const targetPath = resolveLicenseStorePath();
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, `${JSON.stringify(blob, null, 2)}\n`, "utf8");
  return targetPath;
}

function clearPersistedLicenseBlob() {
  const targetPath = resolveLicenseStorePath();
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { force: true });
  }
}

function loadPersistedLicenseStatus() {
  const targetPath = resolveLicenseStorePath();
  if (!fs.existsSync(targetPath)) return null;
  const parsed = JSON.parse(fs.readFileSync(targetPath, "utf8"));
  const verified = verifyLicenseBlob(parsed, { now: new Date() });
  if (!verified || !verified.ok) return null;
  return verified;
}

function refreshActiveLicenseStatus() {
  try {
    activeLicenseStatus = loadPersistedLicenseStatus();
  } catch {
    activeLicenseStatus = null;
  }
  return activeLicenseStatus;
}

function resolveLicenseCapabilities() {
  if (!activeLicenseStatus) return null;
  if (activeLicenseStatus.status !== "active" && activeLicenseStatus.status !== "grace") return null;
  return {
    tierId: String(activeLicenseStatus.planId || "free"),
    tierLabel: String(activeLicenseStatus.planLabel || "Free"),
    capabilities: Array.isArray(activeLicenseStatus.capabilities)
      ? activeLicenseStatus.capabilities
      : [],
    source: "license"
  };
}

function licenseStatusForRenderer() {
  const status = activeLicenseStatus;
  if (!status) {
    return {
      present: false,
      status: "none",
      planId: "free",
      planLabel: "Free",
      seats: 1,
      expiresAt: "",
      graceEndsAt: "",
      graceRemainingDays: 0
    };
  }
  return {
    present: true,
    status: status.status,
    licenseId: status.licenseId,
    customer: status.customer,
    planId: status.planId,
    planLabel: status.planLabel,
    seats: status.seats,
    issuedAt: status.issuedAt,
    expiresAt: status.expiresAt,
    graceEndsAt: status.graceEndsAt,
    graceRemainingDays: status.graceRemainingDays
  };
}

function resolveEffectiveLicenseMode() {
  const forcedRuntimeMode = String(RUNTIME_LICENSE_MODE || "preview").trim().toLowerCase();
  if (forcedRuntimeMode && forcedRuntimeMode !== "preview") {
    return forcedRuntimeMode;
  }
  if (activeLicenseStatus && (activeLicenseStatus.status === "active" || activeLicenseStatus.status === "grace")) {
    return planIdToLicenseMode(activeLicenseStatus.planId);
  }
  return "preview";
}

function resolveRuntimeCapabilities(settings = {}) {
  const forcedRuntimeMode = String(RUNTIME_LICENSE_MODE || "preview").trim().toLowerCase();
  if (forcedRuntimeMode && forcedRuntimeMode !== "preview") {
    return resolveCapabilities(forcedRuntimeMode);
  }

  const fromLicense = resolveLicenseCapabilities();
  if (fromLicense) {
    return fromLicense;
  }

  const modeFromSettings = String(settings && settings.licenseMode ? settings.licenseMode : "").trim().toLowerCase();
  const licenseMode = modeFromSettings || "preview";
  return resolveCapabilities(licenseMode);
}

function enforceTierCapabilities(settings = {}) {
  const next = settings && typeof settings === "object" ? { ...settings } : {};
  const caps = resolveRuntimeCapabilities(next);

  if (!hasCapability(caps, "proof_relay_basic")) {
    next.proofRelayEnabled = false;
  }

  return next;
}

function withRuntimeTier(settings = {}) {
  const next = settings && typeof settings === "object" ? { ...settings } : {};
  if (FORCED_RUNTIME_TIER) {
    next.tier = FORCED_RUNTIME_TIER;
  }
  return next;
}

function applyUserDataOverride(dirPath, sourceLabel) {
  try {
    const resolved = path.resolve(String(dirPath || "").trim());
    if (!resolved) return false;
    fs.mkdirSync(resolved, { recursive: true });
    app.setPath("userData", resolved);
    console.log(`[BOOT] Using overridden userData path (${sourceLabel}): ${resolved}`);
    return true;
  } catch (err) {
    console.warn(`[BOOT] Failed to apply userData override (${sourceLabel}): ${err.message || err}`);
    return false;
  }
}

function resolvePortableUserDataCandidates() {
  const candidates = [];
  if (process.env.NEURAL_PORTABLE_DATA_DIR) {
    candidates.push(path.resolve(process.env.NEURAL_PORTABLE_DATA_DIR));
  }
  try {
    const exeDir = path.dirname(app.getPath("exe"));
    candidates.push(path.join(exeDir, "portable-data"));
  } catch {
    // ignore
  }
  candidates.push(path.resolve(process.cwd(), "portable-data"));
  return Array.from(new Set(candidates.filter(Boolean)));
}

const PORTABLE_MODE =
  process.argv.includes("--portable-mode") ||
  process.env.NEURAL_PORTABLE_MODE === "1";

if (process.env.NEURAL_USER_DATA_DIR) {
  applyUserDataOverride(process.env.NEURAL_USER_DATA_DIR, "env:NEURAL_USER_DATA_DIR");
} else if (PORTABLE_MODE) {
  const candidates = resolvePortableUserDataCandidates();
  let applied = false;
  for (const candidate of candidates) {
    if (applyUserDataOverride(candidate, `portable-mode:${candidate}`)) {
      applied = true;
      break;
    }
  }
  if (!applied) {
    console.warn("[BOOT] Portable mode requested but no writable portable userData directory could be established.");
  }
} else {
  // Check for smoke-override.json next to the executable
  try {
    const exeDir = path.dirname(app.getPath("exe"));
    const overrideFile = path.join(exeDir, "smoke-override.json");
    const fallbackOverrideFile = process.env.APPDATA ? path.join(process.env.APPDATA, "neuralshell-v5", "smoke-override.json") : null;

    let targetFile = null;
    if (fs.existsSync(overrideFile)) targetFile = overrideFile;
    else if (fallbackOverrideFile && fs.existsSync(fallbackOverrideFile)) targetFile = fallbackOverrideFile;

    if (targetFile) {
      const overrideData = JSON.parse(fs.readFileSync(targetFile, "utf8"));
      if (overrideData.NEURAL_USER_DATA_DIR) {
        applyUserDataOverride(overrideData.NEURAL_USER_DATA_DIR, `file:${targetFile}`);
      }
    }
  } catch (err) {
    console.warn(`[BOOT] Failed to parse smoke-override.json: ${err.message || err}`);
  }
}

const SMOKE_MODE =
  process.argv.includes("--smoke-mode") ||
  process.env.NEURAL_SMOKE_MODE === "1";
const SMOKE_REPORT_PATH = process.env.NEURAL_SMOKE_REPORT || null;
const REACT_RENDERER_DEV_URL = String(process.env.NEURAL_RENDERER_DEV_URL || "http://localhost:5173").replace(/\/+$/, "");
const PROOF_RELAY_CONFIG_PATH = process.env.NEURAL_PROOF_RELAY_CONFIG
  ? path.resolve(String(process.env.NEURAL_PROOF_RELAY_CONFIG))
  : path.join(process.cwd(), "release", "proof-relay-settings.json");

function readProofRelayConfig() {
  if (!fs.existsSync(PROOF_RELAY_CONFIG_PATH)) {
    return {
      enabled: false,
      channel: "auto"
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(PROOF_RELAY_CONFIG_PATH, "utf8"));
    const base = {
      enabled: Boolean(parsed && parsed.enabled),
      channel: String(parsed && parsed.channel ? parsed.channel : "auto")
    };
    if (RUNTIME_LICENSE_MODE === "auditor") {
      return {
        ...base,
        enabled: false,
        forcedOff: true
      };
    }
    return base;
  } catch {
    return {
      enabled: false,
      channel: "auto"
    };
  }
}

function writeProofRelayConfig(config = {}) {
  const next = {
    enabled: Boolean(config.enabled),
    channel: String(config.channel || "auto")
  };
  if (RUNTIME_LICENSE_MODE === "auditor") {
    next.enabled = false;
    next.forcedOff = true;
  }
  fs.mkdirSync(path.dirname(PROOF_RELAY_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(PROOF_RELAY_CONFIG_PATH, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return next;
}

const PROOF_RELAY_MAP_VAULT_PROFILE = "proof-relay-map";
const PROOF_RELAY_MAP_VAULT_KEY = "relay_map_json";

async function readProofRelayMapFromVault() {
  if (!secretVault || typeof secretVault.getSecret !== "function") {
    return {};
  }
  try {
    const raw = await secretVault.getSecret(PROOF_RELAY_MAP_VAULT_PROFILE, PROOF_RELAY_MAP_VAULT_KEY);
    const parsed = raw ? JSON.parse(String(raw)) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out = {};
    for (const [repo, mapping] of Object.entries(parsed)) {
      const safeRepo = String(repo || "").trim();
      if (!safeRepo) continue;
      const row = mapping && typeof mapping === "object" ? mapping : {};
      out[safeRepo] = {
        slackWebhook: String(row.slackWebhook || "").trim(),
        discordWebhook: String(row.discordWebhook || "").trim()
      };
    }
    return out;
  } catch {
    return {};
  }
}

async function writeProofRelayMapToVault(mapPayload = {}) {
  if (!secretVault || typeof secretVault.setSecret !== "function") {
    throw new Error("Vault is unavailable for relay map storage.");
  }
  const source = mapPayload && typeof mapPayload === "object" ? mapPayload : {};
  const normalized = {};
  for (const [repo, mapping] of Object.entries(source)) {
    const safeRepo = String(repo || "").trim();
    if (!safeRepo) continue;
    const row = mapping && typeof mapping === "object" ? mapping : {};
    normalized[safeRepo] = {
      slackWebhook: String(row.slackWebhook || "").trim(),
      discordWebhook: String(row.discordWebhook || "").trim()
    };
  }
  await secretVault.setSecret(
    PROOF_RELAY_MAP_VAULT_PROFILE,
    PROOF_RELAY_MAP_VAULT_KEY,
    JSON.stringify(normalized)
  );
  return normalized;
}

function ensureHostedModelProxy() {
  if (!hostedModelProxy) {
    hostedModelProxy = new HostedModelProxy({
      host: "127.0.0.1",
      port: Number(process.env.NS_HOSTED_PROXY_PORT || 55117),
      providerApiKey: String(process.env.TOGETHER_API_KEY || ""),
      logger: (event, payload) => {
        if (logger && typeof logger.log === "function") {
          logger.log("info", `hosted_proxy:${event}`, payload || {});
        }
      }
    });
  }
  return hostedModelProxy;
}

function ensureCollabSignalServer() {
  if (!collabSignalServer) {
    collabSignalServer = new LocalCollabSignalServer({
      host: "127.0.0.1",
      port: Number(process.env.NS_COLLAB_SIGNAL_PORT || 55116),
      logger: (event, payload) => {
        if (logger && typeof logger.log === "function") {
          logger.log("info", `collab_signal:${event}`, payload || {});
        }
      }
    });
  }
  return collabSignalServer;
}

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
  { name: "stats", description: "Show basic performance stats.", args: [], source: "core" },
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
    userDataPath: app.getPath("userData"),
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
      `(async () => {
        const startedAt = Date.now();
        const timeoutMs = 15000;
        while (Date.now() - startedAt < timeoutMs) {
          const hasRoot = Boolean(document.getElementById("root"));
          const hasTopStatus = Boolean(document.querySelector('[data-testid="top-status-bar"]'));
          const ready = document.readyState === "complete" || document.readyState === "interactive";
          if (ready && (hasTopStatus || hasRoot)) {
            return true;
          }
          await new Promise((resolve) => setTimeout(resolve, 80));
        }
        return Boolean(
          document.querySelector('[data-testid="top-status-bar"]')
          || document.getElementById("root")
        );
      })()`,
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

function normalizeBridgeProviderId(id) {
  if (bridgeProviderCatalog && typeof bridgeProviderCatalog.normalizeBridgeProviderId === "function") {
    return bridgeProviderCatalog.normalizeBridgeProviderId(id);
  }
  return String(id || "ollama").trim().toLowerCase() || "ollama";
}

const ENV_BRIDGE_PROVIDER_BINDINGS = [
  {
    providerId: "openai",
    apiKeyEnv: "OPENAI_API_KEY",
    baseUrlEnv: "OPENAI_BASE_URL",
    modelEnv: "OPENAI_MODEL"
  },
  {
    providerId: "openrouter",
    apiKeyEnv: "OPENROUTER_API_KEY",
    baseUrlEnv: "OPENROUTER_BASE_URL",
    modelEnv: "OPENROUTER_MODEL"
  },
  {
    providerId: "groq",
    apiKeyEnv: "GROQ_API_KEY",
    baseUrlEnv: "GROQ_BASE_URL",
    modelEnv: "GROQ_MODEL"
  },
  {
    providerId: "together",
    apiKeyEnv: "TOGETHER_API_KEY",
    baseUrlEnv: "TOGETHER_BASE_URL",
    modelEnv: "TOGETHER_MODEL"
  },
  {
    providerId: "custom_openai",
    apiKeyEnv: "CUSTOM_OPENAI_API_KEY",
    baseUrlEnv: "CUSTOM_OPENAI_BASE_URL",
    modelEnv: "CUSTOM_OPENAI_MODEL",
    requireBaseUrl: true
  }
];

function bridgeSettingsOptions(settings = {}) {
  return {
    fallbackModel: String(settings.model || stateManager && stateManager.get("model") || "llama3").trim() || "llama3",
    normalizeProviderId: normalizeBridgeProviderId,
    getProvider: (providerId) => (
      bridgeProviderCatalog
        && typeof bridgeProviderCatalog.getBridgeProvider === "function"
        ? bridgeProviderCatalog.getBridgeProvider(providerId)
        : { id: providerId, defaultBaseUrl: "http://127.0.0.1:11434", suggestedModels: [] }
    ),
    defaultLocalBaseUrl: "http://127.0.0.1:11434",
    defaultTimeoutMs: CONNECTION_DEFAULTS.REQUEST_TIMEOUT_MS,
    defaultRetryCount: CONNECTION_DEFAULTS.RETRY_COUNT,
    defaultAllowRemoteBridge: false,
    defaultConnectOnStartup: true,
    defaultAutoLoadRecommendedContextProfile: false
  };
}

function normalizeBridgeSettings(settings = {}) {
  return bridgeSettingsModel.normalizeBridgeSettings(settings, bridgeSettingsOptions(settings));
}

function mergeBridgeSettings(current, patch) {
  const merged = {
    ...(current && typeof current === "object" ? current : {}),
    ...(patch && typeof patch === "object" ? patch : {})
  };
  return bridgeSettingsModel.mergeBridgeSettings(current, patch, bridgeSettingsOptions(merged));
}

function normalizeBridgeProfiles(settings = {}) {
  return normalizeBridgeSettings(settings).connectionProfiles;
}

function providerRequiresApiKey(providerId) {
  const provider = bridgeProviderCatalog && typeof bridgeProviderCatalog.getBridgeProvider === "function"
    ? bridgeProviderCatalog.getBridgeProvider(providerId)
    : { requiresApiKey: providerId !== "ollama" };
  return Boolean(provider && provider.requiresApiKey);
}

function buildTransientProfileId(profile = {}) {
  const provider = String(profile.provider || "ollama").trim().toLowerCase() || "ollama";
  const baseUrl = String(profile.baseUrl || "").trim().toLowerCase();
  return `transient:${provider}:${baseUrl}`;
}

async function resolveStoredApiKey(profileId) {
  if (!secretVault || typeof secretVault.getSecret !== "function") return "";
  try {
    return String(await secretVault.getSecret(profileId, "apiKey") || "").trim();
  } catch {
    return "";
  }
}

async function resolveProfileApiKey(profile = {}, settings = {}) {
  const inline = String(profile.apiKey || "").trim();
  if (inline) return inline;

  const profileId = String(profile.id || "").trim();
  if (profileId) {
    return resolveStoredApiKey(profileId);
  }

  const profiles = normalizeBridgeProfiles(settings);
  const provider = String(profile.provider || "").trim().toLowerCase();
  const baseUrl = String(profile.baseUrl || "").trim();
  const matched = profiles.find((candidate) => (
    String(candidate && candidate.provider || "").trim().toLowerCase() === provider
    && String(candidate && candidate.baseUrl || "").trim() === baseUrl
  ));

  if (matched && matched.id) {
    return resolveStoredApiKey(matched.id);
  }

  const activeProfileId = String(settings.activeProfileId || "").trim();
  if (activeProfileId) {
    return resolveStoredApiKey(activeProfileId);
  }

  return "";
}

async function buildProviderOverridesFromSettings(settings = {}) {
  const overrides = {};
  const profiles = normalizeBridgeProfiles(settings);

  for (const profile of profiles) {
    if (!profile || typeof profile !== "object") continue;
    const providerId = normalizeBridgeProviderId(profile.provider);
    if (!providerId || overrides[providerId]) continue;
    const apiKey = await resolveProfileApiKey(profile, settings);
    overrides[providerId] = {
      apiKey: String(apiKey || "").trim(),
      baseUrl: String(profile.baseUrl || "").trim(),
      model: String(profile.defaultModel || stateManager.get("model") || "llama3").trim() || "llama3"
    };
  }

  return overrides;
}

async function sanitizeBridgeSettingsSecrets(settings = {}) {
  const normalized = normalizeBridgeSettings(settings);
  const profiles = Array.isArray(normalized.connectionProfiles)
    ? normalized.connectionProfiles.map((profile) => ({ ...profile }))
    : [];

  const sanitizedProfiles = [];
  for (const profile of profiles) {
    const providerId = String(profile.provider || "ollama").trim().toLowerCase() || "ollama";
    const profileId = String(profile.id || buildTransientProfileId(profile)).trim();
    const requiresKey = providerRequiresApiKey(providerId);
    const inlineKey = String(profile.apiKey || "").trim();

    if (requiresKey && inlineKey) {
      try {
        if (secretVault && typeof secretVault.setSecret === "function") {
          await secretVault.setSecret(profileId, "apiKey", inlineKey);
        }
      } catch (err) {
        logger && logger.log("warn", "vault secret persist failed", {
          profileId,
          providerId,
          reason: err && err.message ? err.message : String(err)
        });
      }
    }

    let present = false;
    if (requiresKey) {
      present = inlineKey.length > 0 || Boolean(await resolveStoredApiKey(profileId));
    }

    sanitizedProfiles.push({
      ...profile,
      id: profileId,
      apiKey: "",
      apiKeyPresent: present
    });
  }

  const activeProfileId = String(
    normalized.activeProfileId
    || (sanitizedProfiles[0] && sanitizedProfiles[0].id)
    || ""
  ).trim();

  const legacyApiKey = String(normalized.apiKey || "").trim();
  if (legacyApiKey && activeProfileId) {
    try {
      if (secretVault && typeof secretVault.setSecret === "function") {
        await secretVault.setSecret(activeProfileId, "apiKey", legacyApiKey);
      }
    } catch (err) {
      logger && logger.log("warn", "vault legacy apiKey persist failed", {
        profileId: activeProfileId,
        reason: err && err.message ? err.message : String(err)
      });
    }
  }

  const activeProfile = sanitizedProfiles.find((item) => item.id === activeProfileId) || null;

  return {
    ...normalized,
    connectionProfiles: sanitizedProfiles,
    activeProfileId,
    apiKey: "",
    apiKeyPresent: Boolean(activeProfile && activeProfile.apiKeyPresent)
  };
}

async function decorateBridgeProfiles(settings = {}) {
  const normalized = normalizeBridgeSettings(settings);
  const profiles = Array.isArray(normalized.connectionProfiles)
    ? normalized.connectionProfiles
    : [];
  const out = [];

  for (const profile of profiles) {
    const providerId = String(profile.provider || "ollama").trim().toLowerCase() || "ollama";
    const requiresKey = providerRequiresApiKey(providerId);
    const profileId = String(profile.id || buildTransientProfileId(profile)).trim();
    const storedApiKey = requiresKey ? await resolveStoredApiKey(profileId) : "";
    out.push({
      ...profile,
      id: profileId,
      apiKey: "",
      apiKeyPresent: Boolean(storedApiKey)
    });
  }

  return out;
}

function providerEnvStatusEntries(settings = {}) {
  const profiles = normalizeBridgeProfiles(settings);
  return ENV_BRIDGE_PROVIDER_BINDINGS.map((binding) => {
    const provider = bridgeProviderCatalog && typeof bridgeProviderCatalog.getBridgeProvider === "function"
      ? bridgeProviderCatalog.getBridgeProvider(binding.providerId)
      : { id: binding.providerId, label: binding.providerId, defaultBaseUrl: "" };
    const apiKey = String(process.env[binding.apiKeyEnv] || "").trim();
    const baseUrlOverride = String(process.env[binding.baseUrlEnv] || "").trim();
    const modelOverride = String(process.env[binding.modelEnv] || "").trim();
    const existingProfile = profiles.find((profile) => profile.id === `env-${provider.id}`) || null;
    const ready = Boolean(apiKey) && (!binding.requireBaseUrl || Boolean(baseUrlOverride));
    const incompleteReason = !apiKey
      ? `Missing ${binding.apiKeyEnv}`
      : binding.requireBaseUrl && !baseUrlOverride
        ? `Missing ${binding.baseUrlEnv}`
        : "";
    return {
      providerId: provider.id,
      label: provider.label,
      apiKeyEnv: binding.apiKeyEnv,
      baseUrlEnv: binding.baseUrlEnv || "",
      modelEnv: binding.modelEnv || "",
      apiKeyPresent: Boolean(apiKey),
      ready,
      imported: Boolean(existingProfile),
      profileId: existingProfile ? existingProfile.id : `env-${provider.id}`,
      baseUrl: baseUrlOverride || String(provider.defaultBaseUrl || ""),
      defaultModel: modelOverride || (Array.isArray(provider.suggestedModels) && provider.suggestedModels[0]) || "llama3",
      incompleteReason
    };
  });
}

function importEnvBackedBridgeProfiles(settings = {}) {
  const statuses = providerEnvStatusEntries(settings);
  const connectionProfiles = normalizeBridgeProfiles(settings).map((profile) => ({ ...profile }));
  const importedProfiles = [];

  for (const status of statuses) {
    if (!status.ready) continue;
    const provider = bridgeProviderCatalog && typeof bridgeProviderCatalog.getBridgeProvider === "function"
      ? bridgeProviderCatalog.getBridgeProvider(status.providerId)
      : { id: status.providerId, label: status.providerId };
    const apiKey = String(process.env[status.apiKeyEnv] || "").trim();
    const nextProfile = {
      id: `env-${provider.id}`,
      name: `${provider.label} (Env)`,
      provider: provider.id,
      baseUrl: String(status.baseUrl || provider.defaultBaseUrl || "").trim(),
      timeoutMs: Number(settings.timeoutMs) || 15000,
      retryCount: Number(settings.retryCount) || 2,
      defaultModel: String(status.defaultModel || "llama3").trim() || "llama3",
      apiKey
    };
    const existingIndex = connectionProfiles.findIndex((profile) => profile.id === nextProfile.id);
    if (existingIndex >= 0) connectionProfiles[existingIndex] = nextProfile;
    else connectionProfiles.push(nextProfile);
    importedProfiles.push({
      id: nextProfile.id,
      name: nextProfile.name,
      providerId: provider.id,
      baseUrl: nextProfile.baseUrl,
      defaultModel: nextProfile.defaultModel
    });
  }

  return {
    settings: {
      ...settings,
      connectionProfiles,
      allowRemoteBridge: importedProfiles.length ? true : Boolean(settings.allowRemoteBridge)
    },
    importedProfiles,
    statuses
  };
}

function pickActiveBridgeProfile(settings = {}) {
  const profiles = normalizeBridgeProfiles(settings);
  const selection = airgapPolicy.resolveBridgeSelection({
    profiles,
    activeProfileId: String(settings.activeProfileId || ""),
    allowRemoteBridge: Boolean(settings.allowRemoteBridge),
    isRemoteProvider: (providerId) => Boolean(
      bridgeProviderCatalog
      && typeof bridgeProviderCatalog.isRemoteBridgeProvider === "function"
      && bridgeProviderCatalog.isRemoteBridgeProvider(providerId)
    )
  });
  return selection.liveProfile || null;
}

async function applyBridgeSettings(settings = {}) {
  const active = pickActiveBridgeProfile(settings);
  if (active) {
    const resolvedApiKey = await resolveProfileApiKey(active, settings);
    llmService.configure({
      baseUrl: active.baseUrl,
      provider: active.provider,
      apiKey: resolvedApiKey,
      requestTimeoutMs: active.timeoutMs,
      maxRetries: active.retryCount
    });
    return {
      ...active,
      apiKey: "",
      apiKeyPresent: Boolean(resolvedApiKey)
    };
  }
  llmService.configure({
    baseUrl: settings.ollamaBaseUrl,
    provider: "ollama",
    apiKey: "",
    requestTimeoutMs: settings.timeoutMs,
    maxRetries: settings.retryCount
  });
  return null;
}

async function persistBridgeSettings(nextSettings = {}) {
  const guarded = validateSettings(enforceTierCapabilities(withRuntimeTier(nextSettings)));
  const vaulted = await sanitizeBridgeSettingsSecrets(guarded);
  stateManager.set("settings", vaulted);
  const saved = stateManager.get("settings") || vaulted;

  if (analyticsStore) {
    analyticsStore.setEnabled(Boolean(saved.analyticsEnabled));
  }

  writeProofRelayConfig({
    enabled: Boolean(saved.proofRelayEnabled),
    channel: readProofRelayConfig().channel || "auto"
  });

  if (autoUpdateLane) {
    const currentPolicy = autoUpdateLane.getPolicy();
    autoUpdateLane.setPolicy({
      enabled: Boolean(saved.autoUpdateEnabled),
      channel: currentPolicy.channel || "stable"
    });
  }

  if (saved.hostedProxyEnabled) {
    const proxy = ensureHostedModelProxy();
    if (!proxy.status().running) {
      await proxy.start();
    }
  } else if (hostedModelProxy && hostedModelProxy.status().running) {
    hostedModelProxy.stop();
  }

  if (otelBridge) {
    otelBridge.setEnabled(Boolean(saved.otelExportEnabled));
  }

  await applyBridgeSettings(saved);
  return saved;
}

async function settingsForRenderer(settings = {}) {
  const profiles = await decorateBridgeProfiles(settings);
  const activeProfileId = String(settings.activeProfileId || "").trim();
  const active = profiles.find((profile) => profile.id === activeProfileId) || null;
  const proxyStatus = hostedModelProxy && typeof hostedModelProxy.status === "function"
    ? hostedModelProxy.status()
    : { running: false, enabled: false };
  const capabilities = resolveRuntimeCapabilities(settings);
  const licenseStatus = licenseStatusForRenderer();
  return {
    ...settings,
    tierId: capabilities.tierId,
    tierLabel: capabilities.tierLabel,
    capabilities: capabilities.capabilities,
    capabilitySource: String(capabilities.source || "runtime"),
    licenseStatus,
    connectionProfiles: profiles,
    apiKey: "",
    apiKeyPresent: Boolean(active && active.apiKeyPresent),
    hostedProxyStatus: proxyStatus,
    otelStatus: otelBridge ? otelBridge.status() : { enabled: false, host: "127.0.0.1", port: 4317 }
  };
}

let _isBridgeHealthCheckInProgress = false;
let _lastBridgeStatusSent = null;

function startBridgeHealthLoop() {
  if (bridgeHealthTimer) {
    clearInterval(bridgeHealthTimer);
    bridgeHealthTimer = null;
  }

  // Immediate probe on start
  _runBridgeHealthCheck();

  bridgeHealthTimer = setInterval(_runBridgeHealthCheck, CONNECTION_DEFAULTS.BRIDGE_HEALTH_INTERVAL_MS);
}

async function _runBridgeHealthCheck() {
  if (_isBridgeHealthCheckInProgress) return;
  _isBridgeHealthCheckInProgress = true;

  try {
    const settings = stateManager.get("settings") || {};
    const health = await llmService.getHealth();
    if (modelPool && typeof modelPool.tickUnload === "function") {
      modelPool.tickUnload();
    }

    let nextStatus = LLM_STATUS.OFFLINE;
    if (health && health.ok) {
      nextStatus = LLM_STATUS.ONLINE;
    } else if (settings.connectOnStartup) {
      // Only attempt configuration if we aren't already trying or if we're definitively offline
      if (_lastBridgeStatusSent !== LLM_STATUS.RECONNECTING) {
        await applyBridgeSettings(settings);
      }
      nextStatus = LLM_STATUS.RECONNECTING;
    }

    if (nextStatus !== _lastBridgeStatusSent) {
      _lastBridgeStatusSent = nextStatus;
      sendToRenderer("llm-status-change", nextStatus);
    }
  } catch (_err) { // eslint-disable-line no-unused-vars
    if (_lastBridgeStatusSent !== LLM_STATUS.ERROR) {
      _lastBridgeStatusSent = LLM_STATUS.ERROR;
      sendToRenderer("llm-status-change", LLM_STATUS.ERROR);
    }
  } finally {
    _isBridgeHealthCheckInProgress = false;
  }
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

function clampWindowMetric(value, min, max) {
  const safeMin = Math.min(min, max);
  return Math.min(max, Math.max(safeMin, value));
}

function getDisplayWorkArea(display) {
  if (
    display
    && display.workArea
    && Number.isFinite(display.workArea.width)
    && Number.isFinite(display.workArea.height)
  ) {
    return display.workArea;
  }
  if (
    display
    && display.workAreaSize
    && Number.isFinite(display.workAreaSize.width)
    && Number.isFinite(display.workAreaSize.height)
  ) {
    return {
      x: 0,
      y: 0,
      width: display.workAreaSize.width,
      height: display.workAreaSize.height
    };
  }
  return {
    x: 0,
    y: 0,
    width: 1600,
    height: 1000
  };
}

function getAdaptiveWindowMetrics(display) {
  const workArea = getDisplayWorkArea(display);
  const workWidth = Number(workArea.width) > 0 ? Number(workArea.width) : 1600;
  const workHeight = Number(workArea.height) > 0 ? Number(workArea.height) : 1000;
  const compactDisplay = workWidth < 1440 || workHeight < 920;
  const minWidth = Math.min(workWidth, Math.max(640, Math.min(1220, workWidth - 40)));
  const minHeight = Math.min(workHeight, Math.max(480, Math.min(820, workHeight - 40)));
  const maxWidth = Math.max(minWidth, workWidth - (compactDisplay ? 20 : 48));
  const maxHeight = Math.max(minHeight, workHeight - (compactDisplay ? 24 : 52));
  const width = clampWindowMetric(
    Math.round(workWidth * (compactDisplay ? 0.96 : 0.9)),
    minWidth,
    maxWidth
  );
  const height = clampWindowMetric(
    Math.round(workHeight * (compactDisplay ? 0.95 : 0.9)),
    minHeight,
    maxHeight
  );
  return {
    workArea,
    width,
    height,
    minWidth,
    minHeight,
    shouldMaximize: workWidth <= 1024 || workHeight <= 600
  };
}

function fitWindowToDisplay(targetWindow, options = {}) {
  if (!targetWindow || targetWindow.isDestroyed()) return;
  const force = Boolean(options.force);
  const display = screen.getDisplayMatching(targetWindow.getBounds());
  const metrics = getAdaptiveWindowMetrics(display);
  const workArea = metrics.workArea;
  targetWindow.setMinimumSize(metrics.minWidth, metrics.minHeight);
  if (metrics.shouldMaximize && !targetWindow.isFullScreen()) {
    targetWindow.maximize();
    return;
  }
  if (targetWindow.isMaximized() || targetWindow.isFullScreen()) return;
  const current = targetWindow.getBounds();
  const exceedsWorkArea =
    current.width > workArea.width
    || current.height > workArea.height
    || current.x < workArea.x
    || current.y < workArea.y
    || current.x + current.width > workArea.x + workArea.width
    || current.y + current.height > workArea.y + workArea.height;
  if (!force && !exceedsWorkArea) return;
  const nextWidth = force
    ? metrics.width
    : clampWindowMetric(current.width, metrics.minWidth, workArea.width);
  const nextHeight = force
    ? metrics.height
    : clampWindowMetric(current.height, metrics.minHeight, workArea.height);
  const maxX = workArea.x + Math.max(0, workArea.width - nextWidth);
  const maxY = workArea.y + Math.max(0, workArea.height - nextHeight);
  const nextX = force
    ? Math.round(workArea.x + ((workArea.width - nextWidth) / 2))
    : clampWindowMetric(current.x, workArea.x, maxX);
  const nextY = force
    ? Math.round(workArea.y + ((workArea.height - nextHeight) / 2))
    : clampWindowMetric(current.y, workArea.y, maxY);
  targetWindow.setBounds({
    x: nextX,
    y: nextY,
    width: nextWidth,
    height: nextHeight
  });
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

function appendLimitedText(current, chunk, limit = 60000) {
  const next = `${current || ""}${chunk || ""}`;
  if (next.length <= limit) {
    return next;
  }
  return next.slice(next.length - limit);
}

function runVerificationProcess(spec, rootPath) {
  return new Promise((resolve) => {
    const commandParts = Array.isArray(spec && spec.command) ? spec.command : [];
    const rawCommand = String(commandParts[0] || "").trim();
    const args = commandParts.slice(1).map((arg) => String(arg));
    const startedAt = new Date();
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let settled = false;

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      resolve(payload);
    };

    const child = spawn(rawCommand, args, {
      cwd: rootPath,
      env: {
        ...process.env,
        CI: process.env.CI || "1"
      },
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });

    const timeoutMs = Math.max(1000, Number(spec && spec.timeoutMs) || 180000);
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout = appendLimitedText(stdout, String(chunk), 80000);
    });
    child.stderr.on("data", (chunk) => {
      stderr = appendLimitedText(stderr, String(chunk), 80000);
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      finish({
        id: String(spec.id || ""),
        label: String(spec.label || spec.id || ""),
        commandLabel: String(spec.commandLabel || rawCommand),
        ok: false,
        exitCode: null,
        durationMs: Date.now() - startedAt.getTime(),
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        stdout,
        stderr: appendLimitedText(stderr, String(err && err.message ? err.message : err), 80000),
        timedOut
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      finish({
        id: String(spec.id || ""),
        label: String(spec.label || spec.id || ""),
        commandLabel: String(spec.commandLabel || rawCommand),
        ok: !timedOut && code === 0,
        exitCode: code,
        durationMs: Date.now() - startedAt.getTime(),
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
        stdout,
        stderr,
        timedOut
      });
    });
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
        workflowId: String(stateManager.get("workflowId") || "bridge_diagnostics"),
        outputMode: String(stateManager.get("outputMode") || "checklist"),
        workspaceAttachment: stateManager.get("workspaceAttachment") || null,
        contextPack: stateManager.get("contextPack") || null,
        contextPackProfiles: Array.isArray(stateManager.get("contextPackProfiles")) ? stateManager.get("contextPackProfiles") : [],
        activeContextPackProfileId: String(stateManager.get("activeContextPackProfileId") || ""),
        lastArtifact: stateManager.get("lastArtifact") || null,
        shippingPacketHistory: Array.isArray(stateManager.get("shippingPacketHistory")) ? stateManager.get("shippingPacketHistory") : [],
        patchPlan: stateManager.get("patchPlan") || null,
        promotedPaletteActions: Array.isArray(stateManager.get("promotedPaletteActions")) ? stateManager.get("promotedPaletteActions") : [],
        commandPaletteShortcutScope: String(stateManager.get("commandPaletteShortcutScope") || "workflow"),
        verificationRunPlan: stateManager.get("verificationRunPlan") || null,
        verificationRunHistory: Array.isArray(stateManager.get("verificationRunHistory")) ? stateManager.get("verificationRunHistory") : [],
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
        if (payload.workflowId) {
          nextState.workflowId = String(payload.workflowId);
        }
        if (payload.outputMode) {
          nextState.outputMode = String(payload.outputMode);
        }
        if (Object.prototype.hasOwnProperty.call(payload, "workspaceAttachment")) {
          nextState.workspaceAttachment = payload.workspaceAttachment || null;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "contextPack")) {
          nextState.contextPack = payload.contextPack || null;
        }
        if (Array.isArray(payload.contextPackProfiles)) {
          nextState.contextPackProfiles = payload.contextPackProfiles;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "activeContextPackProfileId")) {
          nextState.activeContextPackProfileId = String(payload.activeContextPackProfileId || "");
        }
        if (Object.prototype.hasOwnProperty.call(payload, "lastArtifact")) {
          nextState.lastArtifact = payload.lastArtifact || null;
        }
        if (Array.isArray(payload.shippingPacketHistory)) {
          nextState.shippingPacketHistory = payload.shippingPacketHistory;
        }
        if (Object.prototype.hasOwnProperty.call(payload, "patchPlan")) {
          nextState.patchPlan = payload.patchPlan || null;
        }
        if (Array.isArray(payload.promotedPaletteActions)) {
          nextState.promotedPaletteActions = payload.promotedPaletteActions;
        }
        if (payload.commandPaletteShortcutScope) {
          nextState.commandPaletteShortcutScope = String(payload.commandPaletteShortcutScope);
        }
        if (Object.prototype.hasOwnProperty.call(payload, "verificationRunPlan")) {
          nextState.verificationRunPlan = payload.verificationRunPlan || null;
        }
        if (Array.isArray(payload.verificationRunHistory)) {
          nextState.verificationRunHistory = payload.verificationRunHistory;
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
  const metrics = getAdaptiveWindowMetrics(screen.getPrimaryDisplay());
  mainWindow = new BrowserWindow({
    width: metrics.width,
    height: metrics.height,
    minWidth: metrics.minWidth,
    minHeight: metrics.minHeight,
    center: true,
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
    const isDev = process.env.NODE_ENV === "development";
    
    // Allow internal file loading and devtools
    if (url.startsWith('file://') || url.startsWith('devtools://')) {
      return callback({ cancel: false });
    }
    
    // Allow localhost in dev mode for Vite/HMR
    if (isDev && url.startsWith(REACT_RENDERER_DEV_URL)) {
      return callback({ cancel: false });
    }

    // Block ALL other outbound requests from renderer
    console.warn(`[SECURITY] Blocked renderer network request: ${url}`);
    callback({ cancel: true });
  });

  // Navigation Guards
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDev = process.env.NODE_ENV === "development";
    if (!url.startsWith('file://') && !(isDev && url.startsWith(REACT_RENDERER_DEV_URL))) {
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
    const isDev = process.env.NODE_ENV === "development";
    const connectSrc = isDev
      ? `connect-src 'self' ws://localhost:5173 ${REACT_RENDERER_DEV_URL};`
      : "connect-src 'none';";
    const scriptSrc = isDev
      ? `script-src 'self' 'unsafe-eval' ${REACT_RENDERER_DEV_URL};`
      : "script-src 'self';";
    
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`default-src 'none'; ${scriptSrc} style-src 'self' 'unsafe-inline'; img-src 'self' data:; ${connectSrc}`]
      }
    });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.once("ready-to-show", () => {
    fitWindowToDisplay(mainWindow, { force: true });
  });

  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL(REACT_RENDERER_DEV_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist-renderer", "index.html"));
  }
}

app.whenReady().then(async () => {
  // --- INTEGRITY BOOT ---
  const report = await verifyIntegrity();
  const ignoreIntegrity = process.env.NEURAL_IGNORE_INTEGRITY === "1";
  if (!report.ok && !ignoreIntegrity) {
    console.error('[SECURITY] Integrity check failed. Booting into Recovery Mode.');
    createRecoveryWindow(report);
    return; // Stop normal boot
  } else if (ignoreIntegrity) {
    console.warn('[SECURITY] Integrity check bypass active (NEURAL_IGNORE_INTEGRITY=1). Proceeding with normal boot.');
  }

  logger = require("./core/logger");
  chatLogStore = require("./core/chatLogStore");
  pluginLoader = require("./core/pluginLoader");
  sessionManager = require("./core/sessionManager");
  stateManager = require("./core/stateManager");
  systemMonitor = require("./core/systemMonitor");
  const { createAnalyticsStore } = require("./core/analyticsStore");
  analyticsStore = createAnalyticsStore();
  rgbController = require("./core/rgbController");
  xpManager = require("./core/xpManager");
  ritualManager = require("./core/ritualManager");
  historyLoader = require("./core/historyLoader");
  secretVault = require("./core/secretVault");
  const { createAutoUpdateLane } = require("../auto_update/lane");
  autoUpdateLane = createAutoUpdateLane({
    userDataPath: app.getPath("userData"),
    logger
  });
  otelBridge = new OTelBridge({
    host: "127.0.0.1",
    port: 4317,
    enabled: false,
    logger: (event, payload) => {
      if (logger && typeof logger.log === "function") {
        logger.log("info", `otel:${event}`, payload || {});
      }
    }
  });
  modelPool = new ModelPool({
    idleMs: 60 * 60 * 1000,
    coldStartTargetMs: 4000,
    logger: (event, payload) => {
      if (logger && typeof logger.log === "function") {
        logger.log("info", `model_pool:${event}`, payload || {});
      }
    }
  });
  const AgentController = require("./core/agentController");
  _agentController = new AgentController({ llmService, sessionManager });
  auditChain = new AuditChain(
    path.join(app.getPath("userData"), "audit-chain.jsonl")
  );
  actionOutcomeStore.init(app.getPath("userData"));
  const workflowMemory = require("./core/workflowMemory");
  workflowMemory.init(app.getPath("userData"));
  const workspaceRegistry = require("./core/workspaceRegistry");
  workspaceRegistry.init(app.getPath("userData"));

  if (autoUpdateLane) {
    try {
      const swapResult = autoUpdateLane.applyPendingSwap();
      if (swapResult && swapResult.applied) {
        logger.log("info", "auto update swap applied", swapResult);
      }
    } catch (err) {
      logger.log("warn", "auto update pending swap failed", {
        reason: err && err.message ? err.message : String(err)
      });
    }
  }

  // --- ORCHESTRATION HARDENING (Phase 10B) ---
  const savedActionStatus = stateManager.get("actionStatus");
  if (savedActionStatus) {
    executionEngine.restoreState(savedActionStatus);
  }
  executionEngine.onStateChange = (newState) => {
    stateManager.set("actionStatus", newState);
  };

  executionEngine.onLog = (logEntry) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send("action:log", logEntry);
    });
  };

  executionEngine.onInteraction = (interaction) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send("action:interaction", interaction);
    });
  };

  await identityKernel.init();
  stateManager.load();
  refreshActiveLicenseStatus();
  auditChain.init();
  const settings = await persistBridgeSettings(
    validateSettings(withRuntimeTier(stateManager.get("settings") || {}))
  );
  llmService.setModel(stateManager.get("model") || "llama3");
  llmService.setPersona(settings.personalityProfile || "balanced");
  if (analyticsStore) {
    analyticsStore.setEnabled(Boolean(settings.analyticsEnabled));
  }
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
  const refitMainWindow = () => {
    fitWindowToDisplay(mainWindow);
  };
  screen.on("display-metrics-changed", refitMainWindow);
  screen.on("display-added", refitMainWindow);
  screen.on("display-removed", refitMainWindow);
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

  daemonWsBridge = new DaemonWsBridge({
    host: "127.0.0.1",
    port: Number(process.env.NS_DAEMON_WS_PORT || 55015),
    secret: process.env.NS_DAEMON_JWT_SECRET || "",
    logger: (event, payload) => {
      if (logger && typeof logger.log === "function") {
        logger.log("info", `daemon_ws:${event}`, payload || {});
      }
    }
  });
  daemonWsBridge.start();

  const collabServer = ensureCollabSignalServer();
  collabServer.start();
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
  if (daemonWsBridge && typeof daemonWsBridge.stop === "function") {
    daemonWsBridge.stop();
  }
  if (collabSignalServer && typeof collabSignalServer.stop === "function") {
    collabSignalServer.stop();
  }
  if (hostedModelProxy && typeof hostedModelProxy.stop === "function") {
    hostedModelProxy.stop();
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

  const chatStartedAt = Date.now();
  if (modelPool && typeof modelPool.markUsage === "function") {
    modelPool.markUsage(stateManager.get("model") || "unknown");
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

    if (analyticsStore) {
      const settings = stateManager.get("settings") || {};
      const activeProfile = pickActiveBridgeProfile(settings);
      const latestPromptTokens = latestMessage ? countWords(latestMessage.content) : 0;
      const completionTokens = countWords(assistantContent);
      const latencyMs = Date.now() - chatStartedAt;
      analyticsStore.recordEvent({
        ts: new Date().toISOString(),
        provider: activeProfile ? activeProfile.provider : "ollama",
        model: stateManager.get("model") || "unknown",
        latencyMs,
        promptTokens: latestPromptTokens,
        completionTokens,
        totalTokens: latestPromptTokens + completionTokens
      });
      if (otelBridge && typeof otelBridge.exportMetric === "function") {
        otelBridge.exportMetric({
          metric: "llm_latency_ms",
          value: latencyMs,
          provider: activeProfile ? activeProfile.provider : "ollama",
          model: stateManager.get("model") || "unknown"
        }).catch(() => {});
      }
    }

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
    const streamStartedAt = Date.now();
    if (modelPool && typeof modelPool.markUsage === "function") {
      modelPool.markUsage(stateManager.get("model") || "unknown");
    }
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

    if (analyticsStore) {
      const settings = stateManager.get("settings") || {};
      const activeProfile = pickActiveBridgeProfile(settings);
      const latestPromptTokens = latestMessage ? countWords(latestMessage.content) : 0;
      const completionTokens = countWords(assistantBuffer);
      const latencyMs = Date.now() - streamStartedAt;
      analyticsStore.recordEvent({
        ts: new Date().toISOString(),
        provider: activeProfile ? activeProfile.provider : "ollama",
        model: stateManager.get("model") || "unknown",
        latencyMs,
        promptTokens: latestPromptTokens,
        completionTokens,
        totalTokens: latestPromptTokens + completionTokens
      });
      if (otelBridge && typeof otelBridge.exportMetric === "function") {
        otelBridge.exportMetric({
          metric: "llm_stream_latency_ms",
          value: latencyMs,
          provider: activeProfile ? activeProfile.provider : "ollama",
          model: stateManager.get("model") || "unknown"
        }).catch(() => {});
      }
    }

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
    const merged = mergeBridgeSettings(
      stateManager.get("settings") || {},
      validateSettings(value)
    );
    const savedSettings = await persistBridgeSettings(merged);
    llmService.setPersona(savedSettings.personalityProfile || "balanced");
    if (rgbController) {
      rgbController.configure(savedSettings);
    }
    return true;
  }
  if (safeKey === "chat") {
    const safeChat = validateMessages(value);
    persistConversation(safeChat);
    return true;
  }
  stateManager.set(safeKey, value);
  sendToRenderer("state-updated", { [safeKey]: value });
  return true;
});

ipcMain.handle("state:calculateProfileFingerprint", async (_event, profile) => {
  return stateManager.calculateProfileFingerprint(profile);
});

ipcMain.handle("state:retrieveSecret", async (_event, profileId, key) => {
  return stateManager.retrieveSecret(profileId, key);
});

ipcMain.handle("state:logProfileEvent", async (_event, profileId, type, msg) => {
  return stateManager.logProfileEvent(profileId, type, msg);
});

ipcMain.handle("state:update", async (_event, updates) => {
  const safeUpdates = validateStateUpdates(updates);
  if (safeUpdates.model != null) {
    llmService.setModel(validateModel(safeUpdates.model));
  }
  if (safeUpdates.settings != null) {
    const merged = mergeBridgeSettings(
      stateManager.get("settings") || {},
      validateSettings(safeUpdates.settings)
    );
    const savedSettings = await persistBridgeSettings(merged);
    safeUpdates.settings = await settingsForRenderer(savedSettings);
    llmService.setPersona(savedSettings.personalityProfile || "balanced");
    if (rgbController) {
      rgbController.configure(savedSettings);
    }
  }
  if (safeUpdates.chat != null) {
    safeUpdates.chat = validateMessages(safeUpdates.chat);
    safeUpdates.tokens = countChatTokens(safeUpdates.chat);
  }
  stateManager.setState(safeUpdates);
  sendToRenderer("state-updated", safeUpdates);
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
    const mergedSettings = mergeBridgeSettings(stateManager.get("settings") || {}, safeState.settings);
    const savedSettings = await persistBridgeSettings(mergedSettings);
    safeState.settings = await settingsForRenderer(savedSettings);
    llmService.setPersona(savedSettings.personalityProfile || "balanced");
    if (rgbController) {
      rgbController.configure(savedSettings);
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
  const current = validateSettings(withRuntimeTier(stateManager.get("settings") || {}));
  const vaulted = await sanitizeBridgeSettingsSecrets(current);
  stateManager.set("settings", vaulted);
  const rendererSettings = await settingsForRenderer(stateManager.get("settings") || vaulted);
  return {
    ...rendererSettings,
    licenseMode: resolveEffectiveLicenseMode()
  };
});

ipcMain.handle("settings:update", async (_event, settings) => {
  const safeSettings = validateSettings(settings);
  const merged = mergeBridgeSettings(stateManager.get("settings") || {}, safeSettings);
  const savedSettings = await persistBridgeSettings(merged);
  llmService.setPersona(savedSettings.personalityProfile || "balanced");
  if (rgbController) {
    rgbController.configure(savedSettings);
    await rgbController.applyMood("idle", savedSettings.personalityProfile || "balanced");
  }
  const rendererSettings = await settingsForRenderer(savedSettings);
  return {
    ...rendererSettings,
    licenseMode: resolveEffectiveLicenseMode()
  };
});

ipcMain.handle("license:status", async () => {
  refreshActiveLicenseStatus();
  const status = licenseStatusForRenderer();
  return {
    ...status,
    plans: listPlans()
  };
});

ipcMain.handle("license:activateBlob", async (_event, rawBlob) => {
  const blob = typeof rawBlob === "string" ? JSON.parse(rawBlob) : rawBlob;
  const verification = verifyLicenseBlob(blob, { now: new Date() });
  if (!verification || !verification.ok) {
    return {
      ok: false,
      status: verification && verification.status ? verification.status : "invalid",
      reason: verification && verification.reason ? verification.reason : "license_verification_failed"
    };
  }
  const storagePath = persistActiveLicenseBlob(blob);
  activeLicenseStatus = verification;
  if (logger && typeof logger.log === "function") {
    logger.log("info", "license_activated", {
      planId: verification.planId,
      seats: verification.seats,
      storagePath
    });
  }
  if (auditChain && typeof auditChain.append === "function") {
    auditChain.append({
      event: "license_activated",
      planId: verification.planId,
      seats: verification.seats,
      at: new Date().toISOString()
    });
  }
  return {
    ok: true,
    status: verification.status,
    planId: verification.planId,
    planLabel: verification.planLabel,
    seats: verification.seats,
    expiresAt: verification.expiresAt,
    graceEndsAt: verification.graceEndsAt,
    graceRemainingDays: verification.graceRemainingDays
  };
});

ipcMain.handle("license:clear", async () => {
  clearPersistedLicenseBlob();
  activeLicenseStatus = null;
  if (auditChain && typeof auditChain.append === "function") {
    auditChain.append({
      event: "license_cleared",
      at: new Date().toISOString()
    });
  }
  return {
    ok: true
  };
});

ipcMain.handle("proofRelay:getConfig", async () => {
  return readProofRelayConfig();
});

ipcMain.handle("proofRelay:setConfig", async (_event, payload) => {
  const caps = resolveRuntimeCapabilities(stateManager.get("settings") || {});
  if (!hasCapability(caps, "proof_relay_basic")) {
    return {
      ok: false,
      reason: "tier_capability_required",
      required: "proof_relay_basic"
    };
  }
  const input = payload && typeof payload === "object" ? payload : {};
  const next = writeProofRelayConfig({
    enabled: Boolean(input.enabled),
    channel: String(input.channel || "auto")
  });
  const currentSettings = stateManager.get("settings") || {};
  await persistBridgeSettings({
    ...currentSettings,
    proofRelayEnabled: Boolean(next.enabled)
  });
  return {
    ok: true,
    ...next
  };
});

ipcMain.handle("proofRelay:getRepoMap", async () => {
  const map = await readProofRelayMapFromVault();
  return {
    ok: true,
    map
  };
});

ipcMain.handle("proofRelay:setRepoMap", async (_event, payload) => {
  const caps = resolveRuntimeCapabilities(stateManager.get("settings") || {});
  if (!hasCapability(caps, "proof_relay_map")) {
    return {
      ok: false,
      reason: "tier_capability_required",
      required: "proof_relay_map"
    };
  }
  const input = payload && typeof payload === "object" ? payload : {};
  const nextMap = await writeProofRelayMapToVault(input.map || {});
  return {
    ok: true,
    map: nextMap
  };
});

ipcMain.handle("autoUpdate:getPolicy", async () => {
  if (!autoUpdateLane) {
    return {
      enabled: false,
      channel: "stable",
      available: false
    };
  }
  return {
    ...autoUpdateLane.getPolicy(),
    available: true
  };
});

ipcMain.handle("autoUpdate:setPolicy", async (_event, payload) => {
  if (!autoUpdateLane) {
    return {
      ok: false,
      reason: "auto_update_lane_unavailable"
    };
  }
  const input = payload && typeof payload === "object" ? payload : {};
  const next = autoUpdateLane.setPolicy({
    enabled: input.enabled,
    channel: input.channel
  });
  const currentSettings = stateManager.get("settings") || {};
  await persistBridgeSettings({
    ...currentSettings,
    autoUpdateEnabled: Boolean(next.enabled)
  });
  return {
    ok: true,
    ...autoUpdateLane.getPolicy(),
    available: true
  };
});

ipcMain.handle("autoUpdate:pending", async () => {
  if (!autoUpdateLane) {
    return {
      pending: false,
      available: false
    };
  }
  return {
    ...autoUpdateLane.pendingSwapStatus(),
    available: true
  };
});

ipcMain.handle("autoUpdate:verifyPackage", async (_event, payload) => {
  if (!autoUpdateLane) {
    return {
      ok: false,
      reason: "auto_update_lane_unavailable"
    };
  }
  const input = payload && typeof payload === "object" ? payload : {};
  return autoUpdateLane.verifyLatestYmlAndPackage(
    input.latestYmlPath,
    input.packagePath,
    {
      expectedSha256: input.expectedSha256,
      signaturePath: input.signaturePath,
      signatureBase64: input.signatureBase64,
      publicKeyPath: input.publicKeyPath,
      publicKeyPem: input.publicKeyPem,
      algorithm: input.algorithm
    }
  );
});

ipcMain.handle("autoUpdate:scheduleSwap", async (_event, payload) => {
  if (!autoUpdateLane) {
    return {
      ok: false,
      reason: "auto_update_lane_unavailable"
    };
  }
  const input = payload && typeof payload === "object" ? payload : {};
  return autoUpdateLane.scheduleSwapOnRestart({
    packagePath: input.packagePath,
    expectedSha256: input.expectedSha256,
    targetPath: input.targetPath,
    signaturePath: input.signaturePath,
    signatureBase64: input.signatureBase64,
    publicKeyPath: input.publicKeyPath,
    publicKeyPem: input.publicKeyPem,
    algorithm: input.algorithm,
    requireSignature: input.requireSignature
  });
});

ipcMain.handle("analytics:getDashboard", async (_event, days) => {
  if (!analyticsStore) {
    return {
      enabled: false,
      eventCount: 0,
      totalTokens: 0,
      medianLatencyMs: 0,
      modelMix: [],
      providerMix: [],
      latencySeries: []
    };
  }
  return analyticsStore.getDashboard(days);
});

ipcMain.handle("analytics:setEnabled", async (_event, enabled) => {
  if (!analyticsStore) {
    return {
      ok: false,
      reason: "analytics_store_unavailable"
    };
  }
  const nextEnabled = analyticsStore.setEnabled(Boolean(enabled));
  const currentSettings = stateManager.get("settings") || {};
  await persistBridgeSettings({
    ...currentSettings,
    analyticsEnabled: nextEnabled
  });
  return {
    ok: true,
    enabled: nextEnabled
  };
});

ipcMain.handle("analytics:clear", async () => {
  if (!analyticsStore) {
    return {
      ok: false,
      reason: "analytics_store_unavailable"
    };
  }
  return analyticsStore.clear();
});

ipcMain.handle("support:exportBundle", async (_event, payload) => {
  if (typeof exportSupportBundle !== "function") {
    return {
      ok: false,
      reason: "support_bundle_exporter_unavailable"
    };
  }
  const input = payload && typeof payload === "object" ? payload : {};
  return exportSupportBundle({
    output: input.outputPath || "",
    includeUserText: Boolean(input.includeUserText)
  });
});

ipcMain.handle("releaseHealth:check", async () => {
  if (typeof evaluateReleaseHealth !== "function") {
    return {
      generatedAt: new Date().toISOString(),
      status: "red",
      summary: {
        total: 0,
        passing: 0,
        criticalMissing: 1,
        optionalMissing: 0
      },
      rows: [],
      reason: "release_health_checker_unavailable"
    };
  }
  return evaluateReleaseHealth();
});

ipcMain.handle("otel:status", async () => {
  return otelBridge ? otelBridge.status() : { enabled: false, host: "127.0.0.1", port: 4317 };
});

ipcMain.handle("otel:setEnabled", async (_event, enabled) => {
  const currentSettings = stateManager.get("settings") || {};
  await persistBridgeSettings({
    ...currentSettings,
    otelExportEnabled: Boolean(enabled)
  });
  return otelBridge ? otelBridge.status() : { enabled: false, host: "127.0.0.1", port: 4317 };
});

ipcMain.handle("otel:verify", async () => {
  if (!otelBridge) {
    return {
      ok: false,
      reason: "otel_bridge_unavailable"
    };
  }
  return otelBridge.verifyConnection();
});

ipcMain.handle("llm:bridge:get", async () => {
  const normalizedSettings = normalizeBridgeSettings(stateManager.get("settings") || {});
  const profiles = await decorateBridgeProfiles(normalizedSettings);
  const proxyStatus = hostedModelProxy && typeof hostedModelProxy.status === "function"
    ? hostedModelProxy.status()
    : { running: false, enabled: false };
  return {
    profiles,
    activeProfileId: normalizedSettings.activeProfileId,
    connectOnStartup: normalizedSettings.connectOnStartup !== false,
    allowRemoteBridge: Boolean(normalizedSettings.allowRemoteBridge),
    hostedProxyEnabled: Boolean(normalizedSettings.hostedProxyEnabled),
    hostedProxyStatus: proxyStatus
  };
});

ipcMain.handle("llm:bridge:envStatus", async () => {
  const settings = stateManager.get("settings") || {};
  return {
    providers: providerEnvStatusEntries(settings)
  };
});

ipcMain.handle("llm:bridge:sweep", async () => {
  const settings = stateManager.get("settings") || {};
  const providerOverrides = await buildProviderOverridesFromSettings(settings);
  const hostedProxyEnabled = Boolean(settings.hostedProxyEnabled);
  if (hostedProxyEnabled) {
    const proxy = ensureHostedModelProxy();
    if (!proxy.status().running) {
      await proxy.start();
    }
    providerOverrides.together = {
      ...(providerOverrides.together || {}),
      baseUrl: proxy.baseUrl(),
      apiKey: String(process.env.TOGETHER_API_KEY || "")
    };
  }
  const sweep = await runLlmSweep({
    strict: false,
    allowRemote: Boolean(settings.allowRemoteBridge),
    providerOverrides,
    requestTimeoutMs: 12000,
    maxRetries: 0
  });
  return {
    ...sweep,
    hostedProxy: hostedProxyEnabled
      ? ensureHostedModelProxy().status()
      : {
        running: false,
        enabled: false
      }
  };
});

ipcMain.handle("llm:bridge:test", async (_event, rawProfile) => {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const providerId = normalizeBridgeProviderId(profile.provider);
  const provider = bridgeProviderCatalog && typeof bridgeProviderCatalog.getBridgeProvider === "function"
    ? bridgeProviderCatalog.getBridgeProvider(providerId)
    : { id: providerId, label: providerId, requiresApiKey: false };
  const baseUrl = String(profile.baseUrl || "").trim();
  if (!/^https?:\/\//i.test(baseUrl)) {
    throw new Error("Bridge baseUrl must start with http:// or https://");
  }
  const settings = stateManager.get("settings") || {};
  if (
    !settings.allowRemoteBridge
    && airgapPolicy.profileNeedsRemoteAccess({ provider: providerId, baseUrl }, {
      isRemoteProvider: (candidateId) => Boolean(
        bridgeProviderCatalog
        && typeof bridgeProviderCatalog.isRemoteBridgeProvider === "function"
        && bridgeProviderCatalog.isRemoteBridgeProvider(candidateId)
      )
    })
  ) {
    throw new Error(airgapPolicy.OFFLINE_MODE_BLOCKED_MESSAGE);
  }
  const timeoutMs = Number(profile.timeoutMs) || 15000;
  const retryCount = Number(profile.retryCount) || 2;
  const model = String(profile.defaultModel || stateManager.get("model") || "llama3");
  const apiKey = String(profile.apiKey || "").trim() || await resolveProfileApiKey({ ...profile, provider: providerId, baseUrl }, settings);
  if (provider.requiresApiKey && !apiKey) {
    throw new Error(`${provider.label} requires an API key.`);
  }
  const probe = new LLMService({
    provider: providerId,
    apiKey,
    requestTimeoutMs: timeoutMs,
    maxRetries: retryCount
  });
  probe.configure({
    baseUrl,
    provider: providerId,
    apiKey,
    requestTimeoutMs: timeoutMs,
    maxRetries: retryCount
  });
  probe.setModel(model);
  const models = await probe.getModelList();
  const health = await probe.getHealth();
  return {
    ok: Boolean(health && health.ok),
    baseUrl,
    provider: providerId,
    models: models.slice(0, 20),
    modelCount: models.length,
    health
  };
});

ipcMain.handle("llm:bridge:save", async (_event, payload) => {
  const data = payload && typeof payload === "object" ? payload : {};
  const settings = stateManager.get("settings") || {};
  const next = mergeBridgeSettings(settings, {
    connectionProfiles: Array.isArray(data.profiles) ? data.profiles : settings.connectionProfiles || [],
    activeProfileId: String(data.activeProfileId || settings.activeProfileId || ""),
    connectOnStartup: data.connectOnStartup == null ? settings.connectOnStartup !== false : Boolean(data.connectOnStartup),
    allowRemoteBridge: data.allowRemoteBridge == null ? Boolean(settings.allowRemoteBridge) : Boolean(data.allowRemoteBridge)
  });
  await persistBridgeSettings(next);
  return true;
});

ipcMain.handle("llm:bridge:importEnvProfiles", async () => {
  const settings = stateManager.get("settings") || {};
  const imported = importEnvBackedBridgeProfiles(settings);
  const savedSettings = await persistBridgeSettings(normalizeBridgeSettings(imported.settings));
  return {
    ok: true,
    importedProfiles: imported.importedProfiles,
    providers: providerEnvStatusEntries(savedSettings)
  };
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
  const result = identityKernel.rotate();
  stateManager.save();
  auditChain.append({ event: "identity_key_rotation", fingerprint: result.fingerprint });
  return result;
});

// ---------------- DAEMON IPC ----------------

ipcMain.handle("daemon:status", async () => {
  if (!daemonWatchdog) return { status: "not-started" };
  return {
    status: daemonWatchdog.isAlive() ? "running" : "stopped",
    pid: daemonWatchdog._proc?.pid ?? null,
    wsBridge: daemonWsBridge ? daemonWsBridge.status() : { running: false },
    collabSignal: collabSignalServer ? collabSignalServer.status() : { running: false }
  };
});

ipcMain.handle("daemon:wsAuthToken", async () => {
  if (!daemonWsBridge) {
    throw new Error("Daemon WS bridge is unavailable.");
  }
  return {
    ok: true,
    host: "127.0.0.1",
    port: Number(process.env.NS_DAEMON_WS_PORT || 55015),
    token: daemonWsBridge.issueToken({
      sub: "renderer",
      scope: "proof:run"
    })
  };
});

ipcMain.handle("collab:getStatus", async () => {
  const server = ensureCollabSignalServer();
  if (!server.status().running) {
    server.start();
  }
  return {
    ok: true,
    ...server.status()
  };
});

ipcMain.handle("modelPool:status", async () => {
  return modelPool ? modelPool.snapshot() : { models: [], idleMs: 0, coldStartTargetMs: 4000 };
});

// ---------------- AGENT MARKETPLACE IPC ----------------

ipcMain.handle("agents:list", async () => {
  return agentMarketplace.listCoreAgents();
});

ipcMain.handle("agents:install", async (_event, agentId, options) => {
  return agentMarketplace.installAgent(agentId, options || {});
});

ipcMain.handle("agents:run", async (_event, agentId, context) => {
  const payload = context && typeof context === "object" ? context : {};
  return agentMarketplace.runAgentInSandbox(agentId, payload);
});

ipcMain.handle("agents:receipts", async () => {
  return agentMarketplace.listInstallReceipts();
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

ipcMain.handle("verification:run", async (_event, payload) => {
  const request = validateVerificationRunRequest(payload);
  if (!fs.existsSync(request.rootPath)) {
    throw new Error(`Verification workspace not found: ${request.rootPath}`);
  }
  const results = [];
  for (const checkId of request.checkIds) {
    const spec = verificationCatalog.getCheck(checkId);
    if (!spec) {
      throw new Error(`Verification check is unavailable: ${checkId}`);
    }
    logger.log("info", "verification run started", {
      checkId,
      command: spec.commandLabel,
      rootPath: request.rootPath
    });
    if (auditChain) {
      auditChain.append({
        event: "verification_run_started",
        checkId,
        command: spec.commandLabel,
        rootPath: request.rootPath
      });
    }
    const result = await runVerificationProcess(spec, request.rootPath);
    results.push(result);
    logger.log(result.ok ? "info" : "warn", "verification run completed", {
      checkId,
      command: spec.commandLabel,
      rootPath: request.rootPath,
      ok: result.ok,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      durationMs: result.durationMs
    });
    if (auditChain) {
      auditChain.append({
        event: "verification_run_completed",
        checkId,
        command: spec.commandLabel,
        rootPath: request.rootPath,
        ok: result.ok,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        durationMs: result.durationMs
      });
    }
  }
  return {
    ok: results.every((item) => item.ok),
    rootPath: request.rootPath,
    executedAt: new Date().toISOString(),
    results
  };
});

ipcMain.handle("proof:exec", async (_event, payload) => {
  const input = payload && typeof payload === "object" ? payload : {};
  const command = String(input.command || "").trim().toLowerCase();
  if (command !== "proof" && command !== "unit-test") {
    throw new Error("Unsupported proof command. Allowed: proof, unit-test.");
  }

  const sessionId = `proof-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cancel = streamProofCommand(command, {
    onChunk: (line) => {
      sendToRenderer("proof:stdout", {
        sessionId,
        command,
        line: String(line || ""),
        done: false,
        at: new Date().toISOString()
      });
    },
    onDone: (meta = {}) => {
      sendToRenderer("proof:stdout", {
        sessionId,
        command,
        line: "",
        done: true,
        cancelled: Boolean(meta.cancelled),
        at: new Date().toISOString()
      });
      proofExecSessions.delete(sessionId);
    }
  });

  proofExecSessions.set(sessionId, cancel);
  return { ok: true, sessionId, command };
});

ipcMain.handle("proof:cancel", async (_event, sessionId) => {
  const safeId = String(sessionId || "").trim();
  if (!safeId) return false;
  const cancel = proofExecSessions.get(safeId);
  if (!cancel) return false;
  try {
    cancel();
  } catch {
    // ignore cancellation errors
  }
  proofExecSessions.delete(safeId);
  return true;
});

// ---------------- SYSTEM & LOGGING IPC ----------------

ipcMain.handle("system:stats", async () => systemMonitor.getStats());
ipcMain.handle("accel:status", async () => getAccelStatus());

const ALLOWED_EXTERNAL_HOSTS = new Set([
  "gumroad.com",
  "www.gumroad.com",
  "discord.gg",
  "discord.com",
  "github.com",
  "www.github.com"
]);

ipcMain.handle("system:openExternal", async (_event, rawUrl) => {
  const value = String(rawUrl || "").trim();
  if (!value) {
    throw new Error("A URL is required.");
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (parsed.protocol !== "https:") {
    throw new Error("Only https:// links are allowed.");
  }

  if (!ALLOWED_EXTERNAL_HOSTS.has(String(parsed.hostname || "").toLowerCase())) {
    throw new Error("Blocked external destination.");
  }

  await shell.openExternal(parsed.toString());
  return { ok: true, url: parsed.toString() };
});

ipcMain.handle("log:log", async (_event, level, message, meta) => {
  const payload = validateLog(level, message);
  logger.log(payload.level, payload.message, meta && typeof meta === "object" ? meta : {});
  return true;
});

ipcMain.handle("telemetry:log", async (_event, type, action, meta) => {
  const payload = validateTelemetry(type, action);
  telemetry.track(payload.type, payload.action, meta && typeof meta === "object" ? meta : {});
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

// ---------------- WORKSPACE IPC ----------------

ipcMain.handle("workspace:pickRoot", async () => {
  const targetWindow = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
  const result = await dialog.showOpenDialog(targetWindow || undefined, {
    title: "Attach Workspace",
    properties: ["openDirectory"]
  });
  if (result.canceled || !Array.isArray(result.filePaths) || !result.filePaths[0]) {
    return null;
  }
  return summarizeWorkspace(result.filePaths[0]);
});

ipcMain.handle("workspace:summarize", async (_event, rootPath) => {
  return summarizeWorkspace(rootPath);
});

ipcMain.handle("workspace:suggestContextPack", async (_event, rootPath, workflowId) => {
  return suggestContextPackPaths(rootPath, workflowId);
});

ipcMain.handle("workspace:statFiles", async (_event, rootPath, relativePaths) => {
  return statWorkspaceFiles(rootPath, relativePaths);
});

ipcMain.handle("workspace:readFile", async (_event, rootPath, relativePath, maxChars) => {
  return readWorkspaceFile(rootPath, relativePath, maxChars);
});

ipcMain.handle("workspace:clear", async () => {
  return { cleared: true };
});

ipcMain.handle("workspace:gitStatus", async (_event, rootPath) => {
  return getGitStatusSummary(rootPath || "");
});

ipcMain.handle("workspace:previewAction", async (_event, payload) => {
  const safePayload = validateWorkspaceActionRequest(payload);
  return previewWorkspaceAction(safePayload);
});

ipcMain.handle("workspace:applyAction", async (_event, payload) => {
  const safePayload = validateWorkspaceActionRequest(payload);
  return applyWorkspaceAction(safePayload);
});

ipcMain.handle("workspace:previewPatchPlan", async (_event, payload) => {
  const safePayload = validatePatchPlanRequest(payload);
  return previewPatchPlan(safePayload);
});

ipcMain.handle("workspace:applyPatchPlan", async (_event, payload) => {
  const safePayload = validatePatchPlanRequest(payload);
  return applyPatchPlan(safePayload);
});

ipcMain.handle("project:analyze", async (_event, rootPath, workflowId, sessionHistory) => {
  const intelligence = projectIntelligence.analyzeProject(rootPath);
  if (!intelligence.ok) return intelligence;

  // Wave 12B: Factor in action status for urgency
  const actions = {};
  executionEngine.activeActions.forEach((v, k) => {
    if (k.startsWith(rootPath)) {
      actions[k] = v;
    }
  });
  intelligence.urgency = projectIntelligence.analyzeUrgency(rootPath, intelligence, actions);

  const rankedActions = projectIntelligence.rankActions(intelligence, workflowId, sessionHistory);
  return {
    ...intelligence,
    rankedActions
  };
});

ipcMain.handle("action:run", async (_event, actionId, context) => {
  const workspaceRegistry = require("./core/workspaceRegistry");
  const { analyzeProject } = require("./core/projectIntelligence");

  let rootPath = context ? context.rootPath : null;
  if (!rootPath) {
    const activeWs = workspaceRegistry.getActiveWorkspace();
    rootPath = activeWs ? activeWs.path : process.cwd();
  }

  // Ensure workspace is registered
  const intel = analyzeProject(rootPath);
  workspaceRegistry.register(rootPath, intel);

  return await executionEngine.runAction(actionId, rootPath, context);
});

// --- WORKSPACE IPC (Phase 11D) ---
ipcMain.handle("workspace:get-all", () => {
  const workspaceRegistry = require("./core/workspaceRegistry");
  return workspaceRegistry.getWorkspaces();
});

ipcMain.handle("workspace:get-active", () => {
  const workspaceRegistry = require("./core/workspaceRegistry");
  return workspaceRegistry.getActiveWorkspace();
});

ipcMain.handle("workspace:set-active", (event, id) => {
  const workspaceRegistry = require("./core/workspaceRegistry");
  const success = workspaceRegistry.setActiveWorkspace(id);
  if (success) {
    const active = workspaceRegistry.getActiveWorkspace();
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send("workspace:changed", active);
    });
  }
  return success;
});

ipcMain.handle("workspace:register", (event, pathStr) => {
  const workspaceRegistry = require("./core/workspaceRegistry");
  const { analyzeProject } = require("./core/projectIntelligence");
  const intel = analyzeProject(pathStr);
  const ws = workspaceRegistry.register(pathStr, intel);
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send("workspace:list-updated", workspaceRegistry.getWorkspaces());
  });
  return ws;
});

ipcMain.handle("action:status", async (_event, actionId, workspacePath) => {
  return executionEngine.getStatus(actionId, workspacePath);
});

ipcMain.handle("action:checkReady", async (_event, actionId, context) => {
  return await executionEngine.checkReady(actionId, context);
});

ipcMain.handle("action:respond", async (_event, actionId, response, workspacePath) => {
  return executionEngine.submitResponse(actionId, response, workspacePath);
});

ipcMain.handle("action:cancel", async (_event, actionId, workspacePath) => {
  return executionEngine.cancelAction(actionId, workspacePath);
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

ipcMain.handle("vault:setSecret", async (_event, profileId, key, value) => {
  return secretVault.setSecret(profileId, key, value);
});

ipcMain.handle("vault:getSecret", async (_event, profileId, key) => {
  const value = await secretVault.getSecret(profileId, key);
  return {
    ok: true,
    profileId: String(profileId || ""),
    key: String(key || "apiKey"),
    value
  };
});

ipcMain.handle("vault:hasSecret", async (_event, profileId, key) => {
  return {
    ok: true,
    profileId: String(profileId || ""),
    key: String(key || "apiKey"),
    present: await secretVault.hasSecret(profileId, key)
  };
});

ipcMain.handle("vault:deleteSecret", async (_event, profileId, key) => {
  return secretVault.deleteSecret(profileId, key);
});

ipcMain.handle("vault:export", async (_event, passphrase) => {
  return secretVault.exportVault(passphrase);
});

ipcMain.handle("vault:import", async (_event, blob, passphrase, options) => {
  return secretVault.importVault(blob, passphrase, options && typeof options === "object" ? options : {});
});

// ---------------- ENHANCED LLM IPC ----------------

ipcMain.handle("llm:autoDetect", async () => {
  const settings = stateManager.get("settings") || {};
  const profiles = normalizeBridgeProfiles(settings);
  const localProfile = profiles.find((profile) => {
    try {
      const host = new URL(profile.baseUrl).hostname.toLowerCase();
      return host === "127.0.0.1" || host === "localhost" || host === "::1";
    } catch {
      return false;
    }
  });
  const probe = new LLMService({
    provider: "ollama",
    baseUrl: localProfile ? localProfile.baseUrl : (settings.ollamaBaseUrl || "http://127.0.0.1:11434"),
    requestTimeoutMs: localProfile ? localProfile.timeoutMs : settings.timeoutMs,
    maxRetries: localProfile ? localProfile.retryCount : settings.retryCount
  });
  return probe.autoDetectLocalLLM();
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

ipcMain.handle("diagnostics:get-recent", (event, { workspacePath, limit }) => {
  return diagnosticsLedger.getRecent(workspacePath, limit);
});

ipcMain.handle("diagnostics:clear", () => {
  diagnosticsLedger.clear();
  return true;
});

ipcMain.handle("intelligence:get-signals", async (event, { workspacePath }) => {
  try {
    const intelligence = await projectIntelligence.analyzeProject(workspacePath);
    // Factor in urgency for proposals (Wave 12B)
    const actions = {};
    executionEngine.activeActions.forEach((v, k) => {
      actions[k] = v;
    });
    intelligence.urgency = projectIntelligence.analyzeUrgency(workspacePath, intelligence, actions);
    return intelligence;
  } catch (_err) {
    logger.log("error", `Failed to get signals: ${_err.message}`, { workspacePath });
    return { signals: [], health: {}, urgency: 0 };
  }
});

// ---------------- ADVANCED AGENCY IPC ----------------

ipcMain.handle("workspace:get-chain-proposals", async (_event, workspacePath) => {
  try {
    const intelligence = await projectIntelligence.analyzeProject(workspacePath);
    // Factor in urgency for proposals (Wave 12B)
    const actions = {};
    executionEngine.activeActions.forEach((v, k) => {
      actions[k] = v;
    });
    intelligence.urgency = projectIntelligence.analyzeUrgency(workspacePath, intelligence, actions);

    return chainPlanner.proposeChains(workspacePath, intelligence);
  } catch (err) {
    logger.log("error", `Failed to get chain proposals: ${err.message}`, { workspacePath });
    return [];
  }
});

ipcMain.handle("action:run-chain", async (_event, templateId, workspacePath) => {
  try {
    const chain = chainPlanner.assembleChain(templateId, workspacePath);
    if (!chain) throw new Error(`Template "${templateId}" not found.`);

    executionEngine.activeChains.set(`${workspacePath}:${chain.id}`, chain);
    return await executionEngine.runChain(chain.id, workspacePath);
  } catch (err) {
    logger.log("error", `Failed to run chain: ${err.message}`, { templateId, workspacePath });
    return { ok: false, reason: err.message };
  }
});

ipcMain.handle("action:resume-chain", async (_event, chainId, workspacePath) => {
  try {
    return await executionEngine.resumeChain(chainId, workspacePath);
  } catch (err) {
    logger.log("error", `Failed to resume chain: ${err.message}`, { chainId, workspacePath });
    return { ok: false, reason: err.message };
  }
}); // end resume-chain





























