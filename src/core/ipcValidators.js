const ALLOWED_LOG_LEVELS = new Set(["debug", "info", "warn", "error"]);
const ALLOWED_MESSAGE_ROLES = new Set(["user", "assistant", "system"]);
const BLOCKED_STATE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function asTrimmedString(value, field, maxLen = 2000) {
  assert(typeof value === "string", `${field} must be a string.`);
  const trimmed = value.trim();
  assert(trimmed.length > 0, `${field} is required.`);
  assert(trimmed.length <= maxLen, `${field} exceeds max length ${maxLen}.`);
  return trimmed;
}

function validateModel(value) {
  return asTrimmedString(value, "model", 128);
}

function validateMessages(messages) {
  assert(Array.isArray(messages), "messages must be an array.");
  assert(messages.length > 0, "messages cannot be empty.");
  assert(messages.length <= 200, "messages exceeds max length 200.");

  return messages.map((msg, i) => {
    assert(msg && typeof msg === "object" && !Array.isArray(msg), `message[${i}] must be an object.`);
    const role = asTrimmedString(msg.role, `message[${i}].role`, 32).toLowerCase();
    assert(ALLOWED_MESSAGE_ROLES.has(role), `message[${i}].role is invalid.`);
    const content = asTrimmedString(msg.content, `message[${i}].content`, 20000);
    return { role, content };
  });
}

function validateStateKey(key) {
  const normalized = asTrimmedString(key, "state key", 64);
  assert(!BLOCKED_STATE_KEYS.has(normalized), "state key is blocked.");
  return normalized;
}

function validateStateUpdates(updates) {
  assert(updates && typeof updates === "object" && !Array.isArray(updates), "updates must be an object.");
  const keys = Object.keys(updates);
  assert(keys.length > 0, "updates cannot be empty.");
  assert(keys.length <= 30, "updates exceeds max key count 30.");
  for (const key of keys) {
    validateStateKey(key);
  }
  return updates;
}

function validateSessionName(name, field = "session name") {
  return asTrimmedString(name, field, 120);
}

function validatePassphrase(value) {
  return asTrimmedString(value, "passphrase", 256);
}

function validateLog(level, message) {
  const normalizedLevel = asTrimmedString(level || "info", "log level", 16).toLowerCase();
  assert(ALLOWED_LOG_LEVELS.has(normalizedLevel), "log level is invalid.");
  const normalizedMessage = asTrimmedString(message || "", "log message", 4000);
  return { level: normalizedLevel, message: normalizedMessage };
}

function validateSettings(settings) {
  assert(settings && typeof settings === "object" && !Array.isArray(settings), "settings must be an object.");
  const allowRemoteBridge = Boolean(settings.allowRemoteBridge);
  const safe = {};
  if (settings.ollamaBaseUrl != null) {
    safe.ollamaBaseUrl = asTrimmedString(settings.ollamaBaseUrl, "ollamaBaseUrl", 512);
  }
  if (settings.timeoutMs != null) {
    const timeoutMs = Number(settings.timeoutMs);
    assert(Number.isFinite(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 120000, "timeoutMs out of range.");
    safe.timeoutMs = Math.floor(timeoutMs);
  }
  if (settings.retryCount != null) {
    const retryCount = Number(settings.retryCount);
    assert(Number.isFinite(retryCount) && retryCount >= 0 && retryCount <= 10, "retryCount out of range.");
    safe.retryCount = Math.floor(retryCount);
  }
  if (settings.theme != null) {
    const theme = asTrimmedString(settings.theme, "theme", 16).toLowerCase();
    assert(theme === "dark" || theme === "light", "theme must be dark or light.");
    safe.theme = theme;
  }
  if (settings.clockEnabled != null) {
    safe.clockEnabled = Boolean(settings.clockEnabled);
  }
  if (settings.clock24h != null) {
    safe.clock24h = Boolean(settings.clock24h);
  }
  if (settings.clockUtcOffset != null) {
    const clockUtcOffset = asTrimmedString(String(settings.clockUtcOffset), "clockUtcOffset", 16);
    const normalized = clockUtcOffset.toLowerCase();
    assert(
      normalized === "local" || /^[+-]\d{2}:\d{2}$/.test(clockUtcOffset),
      "clockUtcOffset must be local or +/-HH:MM."
    );
    safe.clockUtcOffset = normalized === "local" ? "local" : clockUtcOffset;
  }
  if (settings.personalityProfile != null) {
    const personalityProfile = asTrimmedString(String(settings.personalityProfile), "personalityProfile", 32).toLowerCase();
    assert(
      ["balanced", "engineer", "founder", "analyst", "creative"].includes(personalityProfile),
      "personalityProfile is invalid."
    );
    safe.personalityProfile = personalityProfile;
  }
  if (settings.safetyPolicy != null) {
    const safetyPolicy = asTrimmedString(String(settings.safetyPolicy), "safetyPolicy", 32).toLowerCase();
    assert(["strict", "balanced", "off"].includes(safetyPolicy), "safetyPolicy is invalid.");
    safe.safetyPolicy = safetyPolicy;
  }
  if (settings.rgbEnabled != null) {
    safe.rgbEnabled = Boolean(settings.rgbEnabled);
  }
  if (settings.rgbProvider != null) {
    const rgbProvider = asTrimmedString(String(settings.rgbProvider), "rgbProvider", 32).toLowerCase();
    assert(["none", "openrgb"].includes(rgbProvider), "rgbProvider is invalid.");
    safe.rgbProvider = rgbProvider;
  }
  if (settings.rgbHost != null) {
    safe.rgbHost = asTrimmedString(String(settings.rgbHost), "rgbHost", 255);
  }
  if (settings.rgbPort != null) {
    const rgbPort = Number(settings.rgbPort);
    assert(Number.isFinite(rgbPort) && rgbPort >= 1 && rgbPort <= 65535, "rgbPort out of range.");
    safe.rgbPort = Math.floor(rgbPort);
  }
  if (settings.rgbTargets != null) {
    assert(Array.isArray(settings.rgbTargets), "rgbTargets must be an array.");
    assert(settings.rgbTargets.length <= 50, "rgbTargets exceeds max length 50.");
    safe.rgbTargets = settings.rgbTargets
      .map((x, i) => asTrimmedString(String(x), `rgbTargets[${i}]`, 120))
      .slice(0, 50);
  }
  if (settings.tokenBudget != null) {
    const tokenBudget = Number(settings.tokenBudget);
    assert(Number.isFinite(tokenBudget) && tokenBudget >= 0 && tokenBudget <= 200000, "tokenBudget out of range.");
    safe.tokenBudget = Math.floor(tokenBudget);
  }
  if (settings.autosaveEnabled != null) {
    safe.autosaveEnabled = Boolean(settings.autosaveEnabled);
  }
  if (settings.autosaveIntervalMin != null) {
    const autosaveIntervalMin = Number(settings.autosaveIntervalMin);
    assert(Number.isFinite(autosaveIntervalMin) && autosaveIntervalMin >= 1 && autosaveIntervalMin <= 120, "autosaveIntervalMin out of range.");
    safe.autosaveIntervalMin = Math.floor(autosaveIntervalMin);
  }
  if (settings.autosaveName != null) {
    safe.autosaveName = asTrimmedString(settings.autosaveName, "autosaveName", 120);
  }
  if (settings.connectOnStartup != null) {
    safe.connectOnStartup = Boolean(settings.connectOnStartup);
  }
  if (settings.allowRemoteBridge != null) {
    safe.allowRemoteBridge = Boolean(settings.allowRemoteBridge);
  }
  if (settings.activeProfileId != null) {
    safe.activeProfileId = asTrimmedString(String(settings.activeProfileId), "activeProfileId", 120);
  }
  if (settings.connectionProfiles != null) {
    assert(Array.isArray(settings.connectionProfiles), "connectionProfiles must be an array.");
    assert(settings.connectionProfiles.length <= 12, "connectionProfiles exceeds max length 12.");
    safe.connectionProfiles = settings.connectionProfiles.map((p, idx) => {
      assert(p && typeof p === "object" && !Array.isArray(p), `connectionProfiles[${idx}] must be an object.`);
      const name = asTrimmedString(String(p.name || ""), `connectionProfiles[${idx}].name`, 120);
      const baseUrl = asTrimmedString(String(p.baseUrl || ""), `connectionProfiles[${idx}].baseUrl`, 512);
      assert(/^https?:\/\//i.test(baseUrl), `connectionProfiles[${idx}].baseUrl must start with http(s)://`);
      if (!allowRemoteBridge) {
        let host = "";
        try {
          host = new URL(baseUrl).hostname.toLowerCase();
        } catch {
          host = "";
        }
        assert(
          host === "127.0.0.1" || host === "localhost" || host === "::1",
          `connectionProfiles[${idx}].baseUrl must be local in offline-first mode.`
        );
      }
      const timeoutMs = Number(p.timeoutMs == null ? 15000 : p.timeoutMs);
      assert(Number.isFinite(timeoutMs) && timeoutMs >= 1000 && timeoutMs <= 120000, `connectionProfiles[${idx}].timeoutMs out of range.`);
      const retryCount = Number(p.retryCount == null ? 2 : p.retryCount);
      assert(Number.isFinite(retryCount) && retryCount >= 0 && retryCount <= 10, `connectionProfiles[${idx}].retryCount out of range.`);
      const defaultModel = asTrimmedString(String(p.defaultModel || "llama3"), `connectionProfiles[${idx}].defaultModel`, 128);
      const id = p.id == null ? `profile-${idx + 1}` : asTrimmedString(String(p.id), `connectionProfiles[${idx}].id`, 120);
      return {
        id,
        name,
        baseUrl,
        timeoutMs: Math.floor(timeoutMs),
        retryCount: Math.floor(retryCount),
        defaultModel
      };
    });
  }
  return safe;
}

function validateCommandName(name) {
  const value = asTrimmedString(name, "command name", 64).toLowerCase();
  assert(/^[a-z0-9:_-]+$/.test(value), "command name is invalid.");
  return value;
}

function validateCommandArgs(args) {
  assert(Array.isArray(args), "command args must be an array.");
  assert(args.length <= 20, "too many command args.");
  return args.map((arg, idx) => asTrimmedString(String(arg), `arg[${idx}]`, 2000));
}

function validateImportedState(payload) {
  assert(payload && typeof payload === "object" && !Array.isArray(payload), "state import payload must be an object.");

  const safe = {};

  if (payload.model != null) {
    safe.model = validateModel(payload.model);
  }

  if (payload.theme != null) {
    const theme = asTrimmedString(payload.theme, "theme", 16).toLowerCase();
    assert(theme === "dark" || theme === "light", "theme must be dark or light.");
    safe.theme = theme;
  }

  if (payload.tokens != null) {
    const tokens = Number(payload.tokens);
    assert(Number.isFinite(tokens) && tokens >= 0 && tokens <= 100000000, "tokens out of range.");
    safe.tokens = Math.floor(tokens);
  }

  if (payload.chat != null) {
    assert(Array.isArray(payload.chat), "chat must be an array.");
    assert(payload.chat.length <= 5000, "chat exceeds max length 5000.");
    safe.chat = payload.chat.map((m, idx) => {
      assert(m && typeof m === "object" && !Array.isArray(m), `chat[${idx}] must be an object.`);
      const role = asTrimmedString(m.role, `chat[${idx}].role`, 32).toLowerCase();
      assert(ALLOWED_MESSAGE_ROLES.has(role), `chat[${idx}].role is invalid.`);
      const content = asTrimmedString(m.content, `chat[${idx}].content`, 50000);
      const ts = m.timestamp == null ? null : asTrimmedString(String(m.timestamp), `chat[${idx}].timestamp`, 64);
      return ts ? { role, content, timestamp: ts } : { role, content };
    });
  }

  if (payload.settings != null) {
    safe.settings = validateSettings(payload.settings);
  }

  return safe;
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
