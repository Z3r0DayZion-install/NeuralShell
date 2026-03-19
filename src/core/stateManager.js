const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bridgeProviderCatalog = require("../bridgeProviderCatalog");
const bridgeSettingsModel = require("../bridgeSettingsModel");

const STATE_VERSION = 5;
const AUTHENTICATED_STATE_PREFIX = "omega-v5";
const LEGACY_AUTHENTICATED_STATE_PREFIX = "omega-v4";
const AUTHENTICATED_STATE_AAD = Buffer.from("NeuralShell.state.v4", "utf8");

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

function deriveStateKey(bindingId) {
  return crypto
    .createHash("sha256")
    .update(`NeuralShell.state:${String(bindingId || "")}`)
    .digest();
}

function deriveLegacyStateKey(fingerprint) {
  return crypto.createHash("sha256").update(String(fingerprint || "")).digest();
}

function getBindingContext() {
  const identityKernel = require("./identityKernel");
  const hardwareBinding =
    typeof identityKernel.getHardwareFingerprint === "function"
      ? identityKernel.getHardwareFingerprint()
      : identityKernel.getFingerprint();
  const legacyFingerprint =
    typeof identityKernel.getFingerprint === "function"
      ? identityKernel.getFingerprint()
      : hardwareBinding;
  return {
    hardwareBinding: String(hardwareBinding || ""),
    legacyFingerprint: String(legacyFingerprint || "")
  };
}

function getStateBindingId() {
  return getBindingContext().hardwareBinding;
}

function getCandidateStateKeys() {
  const { hardwareBinding, legacyFingerprint } = getBindingContext();
  const candidates = [
    {
      kind: "hardware-binding",
      key: deriveStateKey(hardwareBinding)
    }
  ];
  if (legacyFingerprint) {
    const legacyKey = deriveLegacyStateKey(legacyFingerprint);
    const isDuplicate = candidates.some((candidate) => candidate.key.equals(legacyKey));
    if (!isDuplicate) {
      candidates.push({
        kind: "legacy-identity",
        key: legacyKey
      });
    }
  }
  return candidates;
}

function encrypt(text) {
  const key = deriveStateKey(getStateBindingId());
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AUTHENTICATED_STATE_AAD);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();
  return `${AUTHENTICATED_STATE_PREFIX}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decryptAuthenticated(text, key) {
  const parts = String(text || "").split(":");
  if (
    parts.length !== 4 ||
    (parts[0] !== AUTHENTICATED_STATE_PREFIX &&
      parts[0] !== LEGACY_AUTHENTICATED_STATE_PREFIX)
  ) {
    throw new Error("Invalid authenticated state envelope.");
  }
  const [prefix, ivHex, tagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAAD(AUTHENTICATED_STATE_AAD);
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]);
  return {
    plaintext: decrypted.toString("utf8"),
    prefix
  };
}

function decryptLegacy(text, key) {
  const parts = String(text || "").split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function decrypt(text) {
  const raw = String(text || "");
  const candidateKeys = getCandidateStateKeys();
  const isAuthenticatedEnvelope =
    raw.startsWith(`${AUTHENTICATED_STATE_PREFIX}:`) ||
    raw.startsWith(`${LEGACY_AUTHENTICATED_STATE_PREFIX}:`);

  for (const candidate of candidateKeys) {
    try {
      if (isAuthenticatedEnvelope) {
        const result = decryptAuthenticated(raw, candidate.key);
        return {
          plaintext: result.plaintext,
          keyKind: candidate.kind,
          envelopeKind: result.prefix
        };
      }
      return {
        plaintext: decryptLegacy(raw, candidate.key),
        keyKind: candidate.kind,
        envelopeKind: "legacy-cbc"
      };
    } catch {
      // Try the next candidate key.
    }
  }
  throw new Error("HARDWARE_LOCK_FAILURE: Failed to decrypt state. Is this the original hardware?");
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
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
    onboardingCompleted: false,
    onboardingSeenAt: "",
    onboardingVersion: "",
    allowRemoteBridge: false,
    activeProfileId: "local-default",
    connectOnStartup: true,
    autoLoadRecommendedContextProfile: false
  };
}

function defaultState() {
  return {
    stateVersion: STATE_VERSION, // Version 5: stable hardware binding + authenticated encryption
    nodeId: null,
    model: "llama3",
    chat: [],
    tokens: 0,
    workflowId: "bridge_diagnostics",
    outputMode: "checklist",
    workspaceAttachment: null,
    contextPack: null,
    contextPackProfiles: [],
    activeContextPackProfileId: "",
    lastArtifact: null,
    releasePacketHistory: [],
    patchPlan: null,
    promotedPaletteActions: [],
    commandPaletteShortcutScope: "workflow",
    verificationRunPlan: null,
    verificationRunHistory: [],
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

function bridgeSettingsOptions(fallbackModel = "llama3") {
  return {
    fallbackModel: String(fallbackModel || "llama3").trim() || "llama3",
    normalizeProviderId: bridgeProviderCatalog.normalizeBridgeProviderId,
    getProvider: bridgeProviderCatalog.getBridgeProvider,
    defaultLocalBaseUrl: "http://127.0.0.1:11434",
    defaultTimeoutMs: 15000,
    defaultRetryCount: 2,
    defaultAllowRemoteBridge: false,
    defaultConnectOnStartup: true,
    defaultAutoLoadRecommendedContextProfile: false
  };
}

function normalizeSettingsValue(settings = {}, fallbackModel = "llama3") {
  return bridgeSettingsModel.normalizeBridgeSettings({
    ...defaultSettings(),
    ...(settings && typeof settings === "object" ? settings : {})
  }, bridgeSettingsOptions(fallbackModel));
}

function mergeSettingsValue(current, patch, fallbackModel = "llama3") {
  return bridgeSettingsModel.mergeBridgeSettings({
    ...defaultSettings(),
    ...(current && typeof current === "object" ? current : {})
  }, patch, bridgeSettingsOptions(fallbackModel));
}

function normalizeLoadedState(parsed) {
  return {
    ...defaultState(),
    ...(parsed && typeof parsed === "object" ? parsed : {}),
    stateVersion: STATE_VERSION,
    settings: normalizeSettingsValue(parsed && parsed.settings, parsed && parsed.model)
  };
}

function save() {
  state.nodeId = getStateBindingId(); // Link state record to the stable hardware binding

  const rawJson = JSON.stringify(state, null, 2);
  const encrypted = encrypt(rawJson);

  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, encrypted, "utf8");
}

function load() {
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  if (!fs.existsSync(stateFile)) {
    state = normalizeLoadedState(defaultState());
    save();
    return state;
  }

  const raw = fs.readFileSync(stateFile, "utf8");
  let parsed;
  let shouldRewriteStateFile = false;

  try {
    const decrypted = decrypt(raw);
    parsed = JSON.parse(decrypted.plaintext);
    shouldRewriteStateFile =
      decrypted.keyKind !== "hardware-binding" ||
      decrypted.envelopeKind !== AUTHENTICATED_STATE_PREFIX;
  } catch {
    // Attempt migration of raw JSON state files (legacy v1/v2)
    try {
      parsed = JSON.parse(raw);
      if (parsed.stateVersion && parsed.stateVersion >= 3) {
        // Version 3+ MUST be encrypted. If it's not, it's a security breach or corruption.
        throw new Error("SECURE_LOAD_FAILURE: Version 3+ state must be hardware-locked (encrypted).");
      }
      shouldRewriteStateFile = true;
    } catch {
      quarantineStateFile("hardware-lock-failure");
      state = defaultState();
      save();
      return state;
    }
  }

  // Migration logic from v1/v2/v3/v4 to v5
  if (!parsed.stateVersion || parsed.stateVersion < 3) {
    state = normalizeLoadedState(parsed);
    save(); // Re-encrypt in the authenticated v5 format and bind it to the stable hardware anchor
    return state;
  }

  state = normalizeLoadedState(parsed);
  const requiresBindingRewrite = parsed.nodeId !== getStateBindingId();
  const requiresProfileNormalization =
    !parsed.settings ||
    !Array.isArray(parsed.settings.connectionProfiles) ||
    parsed.settings.connectionProfiles.length === 0 ||
    !parsed.settings.activeProfileId;
  if (
    parsed.stateVersion !== STATE_VERSION ||
    shouldRewriteStateFile ||
    requiresProfileNormalization ||
    requiresBindingRewrite
  ) {
    save();
  }
  return state;
}

function getState() { return deepClone(state); }
function get(key) { return state[key]; }

function set(key, value) {
  if (key === "settings" && value && typeof value === "object" && !Array.isArray(value)) {
    state.settings = mergeSettingsValue(state.settings, value, state.model);
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
      ? mergeSettingsValue(state.settings, next.settings, next.model || state.model)
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



