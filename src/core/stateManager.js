const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function safeUserDataPath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return app.getPath("userData");
    }
  } catch {
    // Fallback for non-electron test environments.
  }
  return path.join(process.cwd(), "state");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeShallow(base, updates) {
  return {
    ...(base || {}),
    ...(updates || {})
  };
}

function hashId(input) {
  return crypto.createHash("sha256").update(String(input)).digest("hex").slice(0, 12);
}

function defaultSettings() {
  return {
    ollamaBaseUrl: "http://127.0.0.1:11434",
    timeoutMs: 15000,
    retryCount: 2,
    theme: "dark",
    clockEnabled: true,
    clock24h: true,
    clockUtcOffset: "+00:00",
    personalityProfile: "balanced",
    safetyPolicy: "balanced",
    rgbEnabled: false,
    rgbProvider: "openrgb",
    rgbHost: "127.0.0.1",
    rgbPort: 6742,
    rgbTargets: ["keyboard"],
    tokenBudget: 1200,
    autosaveEnabled: false,
    autosaveIntervalMin: 10,
    autosaveName: "autosave-main",
    allowRemoteBridge: false,
    connectionProfiles: [
      {
        id: "local-default",
        name: "Local Ollama",
        baseUrl: "http://127.0.0.1:11434",
        timeoutMs: 15000,
        retryCount: 2,
        defaultModel: "llama3"
      }
    ],
    activeProfileId: "local-default",
    connectOnStartup: true
  };
}

function defaultState() {
  return {
    stateVersion: 2,
    model: "llama3",
    chat: [],
    tokens: 0,
    settings: defaultSettings()
  };
}

function migrateLegacyState(raw) {
  const base = defaultState();
  const input = raw && typeof raw === "object" ? raw : {};
  const rawSettings = input.settings && typeof input.settings === "object" ? input.settings : {};
  const rawVersion = Number(input.stateVersion);
  const looksLegacy = !Number.isFinite(rawVersion) || rawVersion < 2;
  const merged = {
    ...base,
    ...input,
    settings: mergeShallow(base.settings, rawSettings)
  };

  const inputHasProfiles = Array.isArray(rawSettings.connectionProfiles) && rawSettings.connectionProfiles.length > 0;
  const needsBridgeMigration = looksLegacy && !inputHasProfiles;
  if (needsBridgeMigration) {
    const baseUrl = String(rawSettings.ollamaBaseUrl || merged.settings.ollamaBaseUrl || base.settings.ollamaBaseUrl);
    const timeoutMs = Number(rawSettings.timeoutMs || merged.settings.timeoutMs || base.settings.timeoutMs);
    const retryCount = Number(rawSettings.retryCount || merged.settings.retryCount || base.settings.retryCount);
    const id = `legacy-${hashId(baseUrl)}`;
    merged.settings.connectionProfiles = [
      {
        id,
        name: "Migrated Legacy Profile",
        baseUrl,
        timeoutMs,
        retryCount,
        defaultModel: String(merged.model || "llama3")
      }
    ];
    merged.settings.activeProfileId = id;
    merged.settings.connectOnStartup = true;
  }

  merged.stateVersion = 2;
  return merged;
}

const userDataDir = safeUserDataPath();
const stateDir = path.join(userDataDir, "state");
const stateFile = path.join(stateDir, "state.json");
fs.mkdirSync(path.dirname(stateFile), { recursive: true });

let state = defaultState();

function save() {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function load() {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  if (!fs.existsSync(stateFile)) {
    state = defaultState();
    save();
    return state;
  }

  const parsed = JSON.parse(fs.readFileSync(stateFile, "utf8"));
  state = migrateLegacyState(parsed);
  save();
  return state;
}

function getState() {
  return deepClone(state);
}

function get(key) {
  return state[key];
}

function set(key, value) {
  if (key === "settings" && value && typeof value === "object" && !Array.isArray(value)) {
    state.settings = mergeShallow(state.settings, value);
  } else {
    state[key] = value;
  }
  save();
  return true;
}

function setState(updates) {
  const next = updates && typeof updates === "object" ? updates : {};
  state = {
    ...state,
    ...next,
    settings: next.settings && typeof next.settings === "object" && !Array.isArray(next.settings)
      ? mergeShallow(state.settings, next.settings)
      : state.settings
  };
  save();
  return state;
}

module.exports = {
  get,
  getState,
  load,
  save,
  set,
  setState,
  stateFile
};
