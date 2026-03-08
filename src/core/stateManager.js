const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * NeuralShell State Manager — HARDWARE-LOCKED (OMEGA)
 * 
 * All settings, logic, and controls are physically bound to this PC.
 * State is encrypted with a key derived from the Hardware Fingerprint.
 */

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

function getHardwareKey() {
  const identityKernel = require("./identityKernel");
  // The hardware key is derived from the immutable Silicon Anchor
  const fingerprint = identityKernel.getFingerprint();
  return crypto.createHash("sha256").update(fingerprint).digest();
}

function encrypt(text) {
  const key = getHardwareKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text) {
  try {
    const key = getHardwareKey();
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    throw new Error("HARDWARE_LOCK_FAILURE: Failed to decrypt state. Is this the original hardware?");
  }
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

function defaultSettings() {
  return {
    ollamaBaseUrl: "http://127.0.0.1:11434",
    timeoutMs: 15000,
    retryCount: 2,
    theme: "dark",
    clockEnabled: true,
    personalityProfile: "balanced",
    safetyPolicy: "balanced",
    allowRemoteBridge: false,
    activeProfileId: "local-default",
    connectOnStartup: true
  };
}

function defaultState() {
  return {
    stateVersion: 3, // Version 3: Hardware Bound
    nodeId: null,
    model: "llama3",
    chat: [],
    tokens: 0,
    settings: defaultSettings()
  };
}

const userDataDir = safeUserDataPath();
const stateDir = path.join(userDataDir, "state");
const stateFile = path.join(stateDir, "state.omega"); // Renamed to .omega to signify hardware lock
fs.mkdirSync(path.dirname(stateFile), { recursive: true });

let state = defaultState();

function quarantineStateFile(reason = "invalid") {
  if (!fs.existsSync(stateFile)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = path.join(stateDir, `state.${reason}.${stamp}.bak`);
  try {
    fs.renameSync(stateFile, backup);
    return backup;
  } catch {
    return null;
  }
}

function save() {
  const identityKernel = require("./identityKernel");
  state.nodeId = identityKernel.getFingerprint(); // Link state record to physical node ID
  
  const rawJson = JSON.stringify(state, null, 2);
  const encrypted = encrypt(rawJson);
  
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, encrypted, "utf8");
}

function load() {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  if (!fs.existsSync(stateFile)) {
    state = defaultState();
    save();
    return state;
  }

  const raw = fs.readFileSync(stateFile, "utf8");
  let parsed;

  try {
    const decrypted = decrypt(raw);
    parsed = JSON.parse(decrypted);
  } catch (err) {
    // Attempt migration of raw JSON state files (legacy v1/v2)
    try {
      parsed = JSON.parse(raw);
      if (parsed.stateVersion && parsed.stateVersion >= 3) {
        // Version 3+ MUST be encrypted. If it's not, it's a security breach or corruption.
        throw new Error("SECURE_LOAD_FAILURE: Version 3 state must be hardware-locked (encrypted).");
      }
    } catch (jsonErr) {
      quarantineStateFile("hardware-lock-failure");
      state = defaultState();
      save();
      return state;
    }
  }

  // Migration logic from v1/v2 to v3
  if (!parsed.stateVersion || parsed.stateVersion < 3) {
    if (!parsed.settings) parsed.settings = defaultSettings();
    
    // Migrate v1 to v2: create connection profiles
    if (!parsed.settings.connectionProfiles) {
      const baseUrl = parsed.settings.ollamaBaseUrl || "http://127.0.0.1:11434";
      parsed.settings.connectionProfiles = [
        {
          id: "local-default",
          name: "Local Ollama",
          baseUrl: baseUrl
        }
      ];
      parsed.settings.activeProfileId = "local-default";
    }

    // Upgrade to v3
    parsed.stateVersion = 3;
    state = { ...defaultState(), ...parsed, settings: { ...defaultSettings(), ...parsed.settings } };
    save(); // This will encrypt it and bind it to the hardware
    return state;
  }

  // Final Hardware Check (for v3+)
  const identityKernel = require("./identityKernel");
  if (parsed.nodeId && parsed.nodeId !== identityKernel.getFingerprint()) {
    quarantineStateFile("hardware-mismatch");
    state = defaultState();
    save();
    return state;
  }

  state = parsed;
  return state;
}

function getState() { return deepClone(state); }
function get(key) { return state[key]; }

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
