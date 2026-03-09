const BLOCKED_STATE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const VALID_ROLES = new Set(["system", "user", "assistant"]);
const VALID_THEMES = new Set(["dark", "light"]);
const VALID_SAFETY_POLICIES = new Set(["strict", "balanced", "off"]);
const VALID_PERSONALITY_PROFILES = new Set([
  "balanced",
  "engineer",
  "founder",
  "analyst",
  "creative"
]);
const VALID_RGB_PROVIDERS = new Set(["openrgb", "none"]);
const VALID_LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function toTrimmedString(value, label) {
  const text = String(value == null ? "" : value).trim();
  assert(text.length > 0, `${label} is required.`);
  return text;
}

function normalizeUtcOffset(value) {
  const raw = value == null ? "+00:00" : String(value).trim();
  assert(
    /^[+-](0\d|1\d|2[0-3]):[0-5]\d$/.test(raw),
    "clockUtcOffset must be in +/-HH:MM format."
  );
  return raw;
}

function validateMessages(messages) {
  assert(Array.isArray(messages), "messages must be an array.");
  return messages.map((entry) => {
    assert(entry && typeof entry === "object", "invalid message payload.");
    const role = String(entry.role || "")
      .trim()
      .toLowerCase();
    const content = String(entry.content || "");
    assert(VALID_ROLES.has(role), `invalid message role: ${entry.role}`);
    assert(content.trim().length > 0, "invalid message content.");
    return {
      role,
      content
    };
  });
}

function validateStateKey(key) {
  const normalized = toTrimmedString(key, "State key");
  assert(
    !BLOCKED_STATE_KEYS.has(normalized),
    `State key is blocked: ${normalized}`
  );
  return normalized;
}

function validateStateUpdates(updates) {
  assert(
    updates && typeof updates === "object" && !Array.isArray(updates),
    "State updates must be an object."
  );
  return updates;
}

function validateSessionName(name, label = "Session name") {
  const normalized = toTrimmedString(name, label);
  assert(
    !normalized.includes("/") && !normalized.includes("\\"),
    "Session name contains invalid characters."
  );
  assert(!normalized.includes(".."), "Invalid session name path traversal.");
  assert(
    /^[a-zA-Z0-9._-]+$/.test(normalized),
    "Session name contains invalid characters."
  );
  return normalized;
}

function validatePassphrase(value) {
  return toTrimmedString(value, "Passphrase");
}

function validateModel(value) {
  return toTrimmedString(value, "Model");
}

function validateLog(level, message) {
  const normalizedLevel = String(level || "")
    .trim()
    .toLowerCase();
  assert(VALID_LOG_LEVELS.has(normalizedLevel), `invalid log level: ${level}`);
  const normalizedMessage = toTrimmedString(message, "Log message");
  return {
    level: normalizedLevel,
    message: normalizedMessage
  };
}

function normalizeConnectionProfile(profile, index) {
  const raw = profile && typeof profile === "object" ? profile : {};
  const id = String(raw.id || `profile-${index + 1}`).trim();
  const name = toTrimmedString(
    raw.name || `Profile ${index + 1}`,
    "Connection profile name"
  );
  const baseUrl = toTrimmedString(
    raw.baseUrl || "http://127.0.0.1:11434",
    "Connection profile baseUrl"
  );
  const timeoutMs = Number(raw.timeoutMs);
  const retryCount = Number(raw.retryCount);
  return {
    id,
    name,
    baseUrl,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000,
    retryCount: Number.isFinite(retryCount) && retryCount >= 0 ? retryCount : 2,
    defaultModel: String(raw.defaultModel || "llama3")
  };
}

function validateSettings(input) {
  assert(
    input && typeof input === "object" && !Array.isArray(input),
    "settings must be an object."
  );

  const settings = {
    ollamaBaseUrl:
      input.ollamaBaseUrl == null
        ? "http://127.0.0.1:11434"
        : toTrimmedString(input.ollamaBaseUrl, "ollamaBaseUrl"),
    timeoutMs: Number.isFinite(Number(input.timeoutMs))
      ? Number(input.timeoutMs)
      : 15000,
    retryCount: Number.isFinite(Number(input.retryCount))
      ? Number(input.retryCount)
      : 2,
    theme: input.theme == null ? "dark" : String(input.theme).toLowerCase(),
    clockEnabled:
      input.clockEnabled == null ? true : Boolean(input.clockEnabled),
    clock24h: input.clock24h == null ? true : Boolean(input.clock24h),
    clockUtcOffset: normalizeUtcOffset(input.clockUtcOffset),
    personalityProfile:
      input.personalityProfile == null
        ? "balanced"
        : String(input.personalityProfile).toLowerCase(),
    safetyPolicy:
      input.safetyPolicy == null
        ? "balanced"
        : String(input.safetyPolicy).toLowerCase(),
    rgbEnabled: input.rgbEnabled == null ? false : Boolean(input.rgbEnabled),
    rgbProvider:
      input.rgbProvider == null
        ? "openrgb"
        : String(input.rgbProvider).toLowerCase(),
    rgbHost: input.rgbHost == null ? "127.0.0.1" : String(input.rgbHost),
    rgbPort: Number.isFinite(Number(input.rgbPort))
      ? Number(input.rgbPort)
      : 6742,
    rgbTargets: input.rgbTargets == null ? ["keyboard"] : input.rgbTargets,
    tokenBudget: Number.isFinite(Number(input.tokenBudget))
      ? Number(input.tokenBudget)
      : 1200,
    autosaveEnabled:
      input.autosaveEnabled == null ? false : Boolean(input.autosaveEnabled),
    autosaveIntervalMin: Number.isFinite(Number(input.autosaveIntervalMin))
      ? Number(input.autosaveIntervalMin)
      : 10,
    autosaveName:
      input.autosaveName == null
        ? "autosave-main"
        : toTrimmedString(input.autosaveName, "autosaveName"),
    onboardingCompleted:
      input.onboardingCompleted == null
        ? false
        : Boolean(input.onboardingCompleted),
    onboardingSeenAt:
      input.onboardingSeenAt == null
        ? ""
        : String(input.onboardingSeenAt),
    onboardingVersion:
      input.onboardingVersion == null
        ? ""
        : String(input.onboardingVersion),
    allowRemoteBridge: Boolean(input.allowRemoteBridge),
    connectionProfiles: Array.isArray(input.connectionProfiles)
      ? input.connectionProfiles.map(normalizeConnectionProfile)
      : [],
    activeProfileId:
      input.activeProfileId == null ? "" : String(input.activeProfileId),
    connectOnStartup:
      input.connectOnStartup == null ? true : Boolean(input.connectOnStartup)
  };

  assert(
    settings.timeoutMs >= 250 && settings.timeoutMs <= 300000,
    "timeoutMs out of range."
  );
  assert(
    settings.retryCount >= 0 && settings.retryCount <= 10,
    "retryCount out of range."
  );
  assert(VALID_THEMES.has(settings.theme), `invalid theme: ${settings.theme}`);
  assert(
    VALID_SAFETY_POLICIES.has(settings.safetyPolicy),
    `invalid safetyPolicy: ${settings.safetyPolicy}`
  );
  assert(
    VALID_PERSONALITY_PROFILES.has(settings.personalityProfile),
    `invalid personalityProfile: ${settings.personalityProfile}`
  );
  assert(
    VALID_RGB_PROVIDERS.has(settings.rgbProvider),
    `invalid rgbProvider: ${settings.rgbProvider}`
  );
  assert(
    settings.rgbPort >= 1 && settings.rgbPort <= 65535,
    "rgbPort out of range."
  );
  assert(Array.isArray(settings.rgbTargets), "rgbTargets must be an array.");
  assert(
    settings.rgbTargets.every((target) => String(target).trim().length > 0),
    "rgbTargets entries must be non-empty."
  );
  assert(
    settings.tokenBudget >= 1 && settings.tokenBudget <= 200000,
    "tokenBudget out of range."
  );
  assert(
    settings.autosaveIntervalMin >= 1 && settings.autosaveIntervalMin <= 1440,
    "autosaveIntervalMin out of range."
  );

  return settings;
}

function validateCommandName(value) {
  const normalized = toTrimmedString(value, "Command name").toLowerCase();
  assert(/^[a-z0-9._-]+$/.test(normalized), "invalid command name.");
  return normalized;
}

function validateCommandArgs(args) {
  assert(Array.isArray(args), "Command args must be an array.");
  return args.map((arg) => String(arg == null ? "" : arg));
}

function validateImportedState(payload) {
  assert(
    payload && typeof payload === "object" && !Array.isArray(payload),
    "Imported state must be an object."
  );
  const out = {};

  if (payload.model != null) {
    out.model = validateModel(payload.model);
  }
  if (payload.theme != null) {
    const theme = String(payload.theme).toLowerCase();
    assert(VALID_THEMES.has(theme), "invalid theme in imported state.");
    out.theme = theme;
  }
  if (payload.tokens != null) {
    const tokens = Number(payload.tokens);
    assert(
      Number.isFinite(tokens) && tokens >= 0,
      "invalid tokens in imported state."
    );
    out.tokens = tokens;
  }
  if (payload.chat != null) {
    out.chat = validateMessages(payload.chat);
  }
  if (payload.settings != null) {
    out.settings = validateSettings(payload.settings);
  }

  return out;
}

module.exports = {
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
};
