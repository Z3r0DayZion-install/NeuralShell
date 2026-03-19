const path = require("path");
const workflowCatalog = require("../workflowCatalog");
const verificationCatalog = require("../verificationCatalog");
const bridgeProviderCatalog = require("../bridgeProviderCatalog");
const {
  VALID_WORKSPACE_ACTION_KINDS,
  normalizeFilename
} = require("./workspaceActionPlanner");

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
const VALID_TELEMETRY_TYPES = new Set(["ui_action", "bridge_status", "session_event", "performance", "error"]);
const DEFAULT_WORKFLOW_ID =
  workflowCatalog && typeof workflowCatalog.DEFAULT_WORKFLOW_ID === "string"
    ? String(workflowCatalog.DEFAULT_WORKFLOW_ID).trim() || "bridge_diagnostics"
    : "bridge_diagnostics";
const normalizeBridgeProviderId =
  bridgeProviderCatalog && typeof bridgeProviderCatalog.normalizeBridgeProviderId === "function"
    ? bridgeProviderCatalog.normalizeBridgeProviderId
    : (value) => String(value || "ollama").trim().toLowerCase() || "ollama";
const getBridgeProvider =
  bridgeProviderCatalog && typeof bridgeProviderCatalog.getBridgeProvider === "function"
    ? bridgeProviderCatalog.getBridgeProvider
    : (value) => ({
      id: normalizeBridgeProviderId(value),
      defaultBaseUrl: "http://127.0.0.1:11434",
      requiresApiKey: false
    });

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
  const normalizedLevel = String(level || "").trim().toLowerCase();
  assert(VALID_LOG_LEVELS.has(normalizedLevel), `invalid log level: ${level}`);
  const normalizedMessage = toTrimmedString(message, "Log message");
  return {
    level: normalizedLevel,
    message: normalizedMessage
  };
}

function validateTelemetry(type, action) {
  const normalizedType = String(type || "").trim().toLowerCase();
  assert(VALID_TELEMETRY_TYPES.has(normalizedType), `invalid telemetry type: ${type}`);
  const normalizedAction = toTrimmedString(action, "Telemetry action");
  return {
    type: normalizedType,
    action: normalizedAction
  };
}

function normalizeConnectionProfile(profile, index) {
  const raw = profile && typeof profile === "object" ? profile : {};
  const providerId = normalizeBridgeProviderId(raw.provider);
  const provider = getBridgeProvider(providerId);
  const id = String(raw.id || `profile-${index + 1}`).trim();
  const name = toTrimmedString(
    raw.name || `Profile ${index + 1}`,
    "Connection profile name"
  );
  const baseUrl = toTrimmedString(
    raw.baseUrl || provider.defaultBaseUrl || "http://127.0.0.1:11434",
    "Connection profile baseUrl"
  );
  const timeoutMs = Number(raw.timeoutMs);
  const retryCount = Number(raw.retryCount);
  const apiKey = raw.apiKey == null ? "" : String(raw.apiKey).trim();
  return {
    id,
    name,
    provider: providerId,
    baseUrl,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000,
    retryCount: Number.isFinite(retryCount) && retryCount >= 0 ? retryCount : 2,
    defaultModel: String(raw.defaultModel || "llama3"),
    apiKey
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
      input.connectOnStartup == null ? true : Boolean(input.connectOnStartup),
    autoLoadRecommendedContextProfile:
      input.autoLoadRecommendedContextProfile == null ? false : Boolean(input.autoLoadRecommendedContextProfile)
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
  if (payload.workflowId != null) {
    const workflowId = String(payload.workflowId).trim();
    assert(workflowCatalog.isWorkflowId(workflowId), "invalid workflowId in imported state.");
    out.workflowId = workflowId;
  }
  if (payload.outputMode != null) {
    const outputMode = String(payload.outputMode).trim();
    assert(workflowCatalog.isOutputModeId(outputMode), "invalid outputMode in imported state.");
    out.outputMode = outputMode;
  }
  if (payload.workspaceAttachment != null) {
    out.workspaceAttachment = validateWorkspaceAttachment(payload.workspaceAttachment);
  }
  if (payload.contextPack != null) {
    out.contextPack = validateContextPack(payload.contextPack);
  }
  if (payload.contextPackProfiles != null) {
    out.contextPackProfiles = validateContextPackProfiles(payload.contextPackProfiles);
  }
  if (payload.activeContextPackProfileId != null) {
    out.activeContextPackProfileId = String(payload.activeContextPackProfileId || "").trim();
  }
  if (payload.lastArtifact != null) {
    out.lastArtifact = validateArtifact(payload.lastArtifact);
  }
  if (payload.releasePacketHistory != null) {
    out.releasePacketHistory = validateReleasePacketHistory(payload.releasePacketHistory);
  }
  if (payload.patchPlan != null) {
    out.patchPlan = validatePatchPlan(payload.patchPlan);
  }
  if (payload.promotedPaletteActions != null) {
    out.promotedPaletteActions = validatePromotedPaletteActions(payload.promotedPaletteActions);
  }
  if (payload.commandPaletteShortcutScope != null) {
    const scope = String(payload.commandPaletteShortcutScope).trim().toLowerCase();
    assert(scope === "workflow" || scope === "all", "invalid commandPaletteShortcutScope in imported state.");
    out.commandPaletteShortcutScope = scope;
  }
  if (payload.verificationRunPlan != null) {
    out.verificationRunPlan = validateVerificationRunPlan(payload.verificationRunPlan);
  }
  if (payload.verificationRunHistory != null) {
    out.verificationRunHistory = validateVerificationRunHistory(payload.verificationRunHistory);
  }

  return out;
}

function validateWorkspaceAttachment(value) {
  assert(value && typeof value === "object" && !Array.isArray(value), "workspaceAttachment must be an object.");
  const rootPath = toTrimmedString(value.rootPath, "workspaceAttachment.rootPath");
  const label = toTrimmedString(value.label || rootPath, "workspaceAttachment.label");
  const attachedAt = value.attachedAt == null ? "" : String(value.attachedAt);
  const signals = Array.isArray(value.signals) ? value.signals.map((signal) => String(signal).trim()).filter(Boolean) : [];
  return {
    rootPath,
    label,
    attachedAt,
    signals
  };
}

function validateContextPack(value) {
  assert(value && typeof value === "object" && !Array.isArray(value), "contextPack must be an object.");
  const rootPath = path.resolve(toTrimmedString(value.rootPath, "contextPack.rootPath"));
  const rootLabel = toTrimmedString(value.rootLabel || rootPath, "contextPack.rootLabel");
  const filePaths = Array.isArray(value.filePaths)
    ? value.filePaths.map((item) => validatePatchPlanFilePath(item))
    : [];
  const entries = Array.isArray(value.entries)
    ? value.entries.map((entry, index) => {
      assert(entry && typeof entry === "object" && !Array.isArray(entry), `contextPack.entries[${index}] must be an object.`);
      const relativePath = validatePatchPlanFilePath(entry.relativePath);
      return {
        relativePath,
        absolutePath: entry.absolutePath == null ? "" : String(entry.absolutePath),
        modifiedAt: entry.modifiedAt == null ? "" : String(entry.modifiedAt),
        content: String(entry.content == null ? "" : entry.content)
      };
    })
    : [];
  assert(entries.length > 0, "contextPack must include at least one entry.");
  return {
    id: String(value.id || "").trim(),
    name: toTrimmedString(value.name || "Context Pack", "contextPack.name"),
    rootPath,
    rootLabel,
    builtAt: value.builtAt == null ? "" : String(value.builtAt),
    filePaths: filePaths.length ? filePaths : entries.map((entry) => entry.relativePath),
    entries
  };
}

function validateContextPackProfile(value, index) {
  assert(value && typeof value === "object" && !Array.isArray(value), `contextPackProfiles[${index}] must be an object.`);
  const workspaceRoot = path.resolve(toTrimmedString(value.workspaceRoot, `contextPackProfiles[${index}].workspaceRoot`));
  const workspaceLabel = toTrimmedString(value.workspaceLabel || workspaceRoot, `contextPackProfiles[${index}].workspaceLabel`);
  const workflowId = value.workflowId == null ? "" : String(value.workflowId).trim();
  if (workflowId) {
    assert(workflowCatalog.isWorkflowId(workflowId), `invalid contextPackProfiles[${index}].workflowId.`);
  }
  const filePaths = Array.isArray(value.filePaths)
    ? value.filePaths.map((item) => validatePatchPlanFilePath(item))
    : [];
  assert(filePaths.length > 0, `contextPackProfiles[${index}] must include at least one file path.`);
  const fileSnapshots = Array.isArray(value.fileSnapshots)
    ? value.fileSnapshots.map((item, snapshotIndex) => {
      assert(
        item && typeof item === "object" && !Array.isArray(item),
        `contextPackProfiles[${index}].fileSnapshots[${snapshotIndex}] must be an object.`
      );
      return {
        relativePath: validatePatchPlanFilePath(item.relativePath),
        modifiedAt: item.modifiedAt == null ? "" : String(item.modifiedAt)
      };
    })
    : [];
  return {
    id: String(value.id || `context-pack-profile-${index + 1}`).trim() || `context-pack-profile-${index + 1}`,
    workspaceRoot,
    workspaceLabel,
    workflowId,
    name: toTrimmedString(value.name || `Context Pack Profile ${index + 1}`, `contextPackProfiles[${index}].name`),
    filePaths,
    fileSnapshots,
    savedAt: value.savedAt == null ? "" : String(value.savedAt)
  };
}

function validateContextPackProfiles(value) {
  assert(Array.isArray(value), "contextPackProfiles must be an array.");
  return value.map((item, index) => validateContextPackProfile(item, index));
}

function validateArtifact(value) {
  assert(value && typeof value === "object" && !Array.isArray(value), "lastArtifact must be an object.");
  const workflowId = value.workflowId == null ? "" : String(value.workflowId).trim();
  const outputMode = value.outputMode == null ? "" : String(value.outputMode).trim();
  if (workflowId) {
    assert(workflowCatalog.isWorkflowId(workflowId), "invalid lastArtifact.workflowId.");
  }
  if (outputMode) {
    assert(workflowCatalog.isOutputModeId(outputMode), "invalid lastArtifact.outputMode.");
  }
  const provenance = value.provenance == null ? null : validateArtifactProvenance(value.provenance);
  return {
    id: String(value.id || "").trim(),
    title: String(value.title || "").trim(),
    workflowId,
    outputMode,
    content: String(value.content || ""),
    generatedAt: value.generatedAt == null ? "" : String(value.generatedAt),
    provenance
  };
}

function validateArtifactProvenance(value) {
  assert(value && typeof value === "object" && !Array.isArray(value), "artifact provenance must be an object.");
  let contextPack = null;
  if (value.contextPack != null) {
    assert(
      value.contextPack && typeof value.contextPack === "object" && !Array.isArray(value.contextPack),
      "artifact provenance contextPack must be an object."
    );
    contextPack = {
      id: String(value.contextPack.id || "").trim(),
      name: String(value.contextPack.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPack.fileCount)) ? Number(value.contextPack.fileCount) : 0,
      builtAt: value.contextPack.builtAt == null ? "" : String(value.contextPack.builtAt),
      filePaths: Array.isArray(value.contextPack.filePaths)
        ? value.contextPack.filePaths.map((item) => validatePatchPlanFilePath(item))
        : []
    };
  }
  let contextPackProfile = null;
  if (value.contextPackProfile != null) {
    assert(
      value.contextPackProfile && typeof value.contextPackProfile === "object" && !Array.isArray(value.contextPackProfile),
      "artifact provenance contextPackProfile must be an object."
    );
    contextPackProfile = {
      id: String(value.contextPackProfile.id || "").trim(),
      name: String(value.contextPackProfile.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPackProfile.fileCount)) ? Number(value.contextPackProfile.fileCount) : 0,
      savedAt: value.contextPackProfile.savedAt == null ? "" : String(value.contextPackProfile.savedAt)
    };
  }
  let sourceArtifact = null;
  if (value.sourceArtifact != null) {
    assert(
      value.sourceArtifact && typeof value.sourceArtifact === "object" && !Array.isArray(value.sourceArtifact),
      "artifact provenance sourceArtifact must be an object."
    );
    const sourceOutputMode = value.sourceArtifact.outputMode == null ? "" : String(value.sourceArtifact.outputMode).trim();
    if (sourceOutputMode) {
      assert(workflowCatalog.isOutputModeId(sourceOutputMode), "invalid artifact provenance sourceArtifact.outputMode.");
    }
    sourceArtifact = {
      id: String(value.sourceArtifact.id || "").trim(),
      title: String(value.sourceArtifact.title || "").trim(),
      outputMode: sourceOutputMode,
      generatedAt: value.sourceArtifact.generatedAt == null ? "" : String(value.sourceArtifact.generatedAt)
    };
  }
  let patchPlan = null;
  if (value.patchPlan != null) {
    assert(
      value.patchPlan && typeof value.patchPlan === "object" && !Array.isArray(value.patchPlan),
      "artifact provenance patchPlan must be an object."
    );
    patchPlan = {
      id: String(value.patchPlan.id || "").trim(),
      generatedAt: value.patchPlan.generatedAt == null ? "" : String(value.patchPlan.generatedAt),
      totalFiles: Number.isFinite(Number(value.patchPlan.totalFiles)) ? Number(value.patchPlan.totalFiles) : 0
    };
  }
  let verification = null;
  if (value.verification != null) {
    assert(
      value.verification && typeof value.verification === "object" && !Array.isArray(value.verification),
      "artifact provenance verification must be an object."
    );
    const runIds = Array.isArray(value.verification.runIds)
      ? value.verification.runIds.map((item, index) => toTrimmedString(item, `artifact provenance verification.runIds[${index}]`))
      : [];
    verification = {
      groupId: String(value.verification.groupId || "").trim(),
      runIds,
      executedAt: value.verification.executedAt == null ? "" : String(value.verification.executedAt),
      previousRunId: value.verification.previousRunId == null ? "" : String(value.verification.previousRunId),
      ok: value.verification.ok === true,
      selectedCount: Number.isFinite(Number(value.verification.selectedCount)) ? Number(value.verification.selectedCount) : 0,
      passedCount: Number.isFinite(Number(value.verification.passedCount)) ? Number(value.verification.passedCount) : 0,
      failedCount: Number.isFinite(Number(value.verification.failedCount)) ? Number(value.verification.failedCount) : 0,
      pendingCount: Number.isFinite(Number(value.verification.pendingCount)) ? Number(value.verification.pendingCount) : 0,
      summary: String(value.verification.summary || "").trim()
    };
  }
  let lineage = null;
  if (value.lineage != null) {
    assert(
      value.lineage && typeof value.lineage === "object" && !Array.isArray(value.lineage),
      "artifact provenance lineage must be an object."
    );
    lineage = {
      packetId: String(value.lineage.packetId || "").trim(),
      parentPacketId: String(value.lineage.parentPacketId || "").trim(),
      sourceArtifactId: String(value.lineage.sourceArtifactId || "").trim(),
      generation: Number.isFinite(Number(value.lineage.generation)) ? Number(value.lineage.generation) : 0
    };
  }
  return {
    workspaceRoot: String(value.workspaceRoot || "").trim(),
    workspaceLabel: String(value.workspaceLabel || "").trim(),
    contextPack,
    contextPackProfile,
    sourceArtifact,
    patchPlan,
    verification,
    lineage
  };
}

function validateReleasePacketHistory(value) {
  assert(Array.isArray(value), "releasePacketHistory must be an array.");
  return value
    .map((entry, index) => {
      const artifact = validateArtifact(entry);
      assert(
        artifact.outputMode === "shipping_packet",
        `releasePacketHistory[${index}] must use shipping_packet outputMode.`
      );
      assert(
        String(artifact.content || "").trim().length > 0,
        `releasePacketHistory[${index}] must include content.`
      );
      return {
        ...artifact,
        title: artifact.title || "Release Packet",
        outputMode: "shipping_packet"
      };
    })
    .slice(0, 8);
}

function validatePatchPlanFilePath(value) {
  const normalized = String(value == null ? "" : value).trim().replace(/\\/g, "/");
  assert(normalized.length > 0, "patchPlan.files[].path is required.");
  assert(
    !normalized.startsWith("/") && !/^[a-zA-Z]:/.test(normalized),
    "patchPlan file path must stay inside the workspace."
  );
  const next = path.posix.normalize(normalized);
  assert(
    next !== "." &&
    next !== ".." &&
    !next.startsWith("../") &&
    !next.includes("/../"),
    "patchPlan file path is invalid."
  );
  return next;
}

function validatePatchPlanHunkLine(value, hunkIndex, lineIndex) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `patchPlan.files[].hunks[${hunkIndex}].lines[${lineIndex}] must be an object.`
  );
  const type = String(value.type || "").trim().toLowerCase();
  assert(
    type === "context" || type === "remove" || type === "add",
    `patchPlan.files[].hunks[${hunkIndex}].lines[${lineIndex}] type is invalid.`
  );
  return {
    type,
    text: String(value.text == null ? "" : value.text)
  };
}

function validatePatchPlanHunk(value, index) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    `patchPlan.files[].hunks[${index}] must be an object.`
  );
  const lines = Array.isArray(value.lines)
    ? value.lines.map((line, lineIndex) => validatePatchPlanHunkLine(line, index, lineIndex))
    : [];
  return {
    hunkId: String(value.hunkId || `hunk-${index + 1}`).trim() || `hunk-${index + 1}`,
    oldStart: Number.isFinite(Number(value.oldStart)) ? Number(value.oldStart) : 1,
    oldCount: Number.isFinite(Number(value.oldCount)) ? Number(value.oldCount) : 0,
    newStart: Number.isFinite(Number(value.newStart)) ? Number(value.newStart) : 1,
    newCount: Number.isFinite(Number(value.newCount)) ? Number(value.newCount) : 0,
    addedCount: Number.isFinite(Number(value.addedCount)) ? Number(value.addedCount) : lines.filter((line) => line.type === "add").length,
    removedCount: Number.isFinite(Number(value.removedCount)) ? Number(value.removedCount) : lines.filter((line) => line.type === "remove").length,
    selected: value.selected !== false,
    appliedAt: value.appliedAt == null ? "" : String(value.appliedAt),
    lines
  };
}

function validatePatchPlanProvenance(value) {
  assert(value && typeof value === "object" && !Array.isArray(value), "patchPlan.provenance must be an object.");
  let contextPack = null;
  if (value.contextPack != null) {
    assert(
      value.contextPack && typeof value.contextPack === "object" && !Array.isArray(value.contextPack),
      "patchPlan.provenance.contextPack must be an object."
    );
    contextPack = {
      id: String(value.contextPack.id || "").trim(),
      name: String(value.contextPack.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPack.fileCount)) ? Number(value.contextPack.fileCount) : 0,
      builtAt: value.contextPack.builtAt == null ? "" : String(value.contextPack.builtAt),
      filePaths: Array.isArray(value.contextPack.filePaths)
        ? value.contextPack.filePaths.map((item) => validatePatchPlanFilePath(item))
        : []
    };
  }
  let contextPackProfile = null;
  if (value.contextPackProfile != null) {
    assert(
      value.contextPackProfile && typeof value.contextPackProfile === "object" && !Array.isArray(value.contextPackProfile),
      "patchPlan.provenance.contextPackProfile must be an object."
    );
    contextPackProfile = {
      id: String(value.contextPackProfile.id || "").trim(),
      name: String(value.contextPackProfile.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPackProfile.fileCount)) ? Number(value.contextPackProfile.fileCount) : 0,
      savedAt: value.contextPackProfile.savedAt == null ? "" : String(value.contextPackProfile.savedAt)
    };
  }
  return {
    workspaceRoot: value.workspaceRoot == null || String(value.workspaceRoot).trim() === ""
      ? ""
      : path.resolve(String(value.workspaceRoot)),
    contextPack,
    contextPackProfile
  };
}

function validatePatchPlan(value) {
  assert(value && typeof value === "object" && !Array.isArray(value), "patchPlan must be an object.");
  const workflowId = value.workflowId == null ? "" : String(value.workflowId).trim();
  if (workflowId) {
    assert(workflowCatalog.isWorkflowId(workflowId), "invalid patchPlan.workflowId.");
  }
  const outputMode = value.outputMode == null ? "patch_plan" : String(value.outputMode).trim();
  assert(outputMode === "patch_plan", "patchPlan.outputMode must be patch_plan.");
  const rootPath = value.rootPath == null || String(value.rootPath).trim() === ""
    ? ""
    : path.resolve(toTrimmedString(value.rootPath, "patchPlan.rootPath"));
  const files = Array.isArray(value.files) ? value.files : [];
  assert(files.length > 0, "patchPlan must include at least one file.");

  return {
    id: String(value.id || "").trim(),
    workflowId: workflowId || DEFAULT_WORKFLOW_ID,
    outputMode,
    title: String(value.title || "").trim(),
    summary: String(value.summary || ""),
    generatedAt: value.generatedAt == null ? "" : String(value.generatedAt),
    rootPath,
    provenance: value.provenance == null ? null : validatePatchPlanProvenance(value.provenance),
    verification: Array.isArray(value.verification)
      ? value.verification.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    totalFiles: Number.isFinite(Number(value.totalFiles)) ? Number(value.totalFiles) : 0,
    newFiles: Number.isFinite(Number(value.newFiles)) ? Number(value.newFiles) : 0,
    modifiedFiles: Number.isFinite(Number(value.modifiedFiles)) ? Number(value.modifiedFiles) : 0,
    totalBytes: Number.isFinite(Number(value.totalBytes)) ? Number(value.totalBytes) : 0,
    totalLines: Number.isFinite(Number(value.totalLines)) ? Number(value.totalLines) : 0,
    selectedFileIds: Array.isArray(value.selectedFileIds)
      ? value.selectedFileIds.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    files: files.map((file, index) => {
      assert(file && typeof file === "object" && !Array.isArray(file), "patchPlan file entry is invalid.");
      const status = file.status == null ? "" : String(file.status).trim();
      if (status) {
        assert(status === "new" || status === "modify", "patchPlan file status must be new or modify.");
      }
      return {
        fileId: String(file.fileId || `file-${index + 1}`).trim() || `file-${index + 1}`,
        path: validatePatchPlanFilePath(file.path),
        status,
        rationale: String(file.rationale || ""),
        content: String(file.content || ""),
        originalContent: String(file.originalContent || ""),
        diffText: String(file.diffText || ""),
        bytes: Number.isFinite(Number(file.bytes)) ? Number(file.bytes) : 0,
        lines: Number.isFinite(Number(file.lines)) ? Number(file.lines) : 0,
        selected: file.selected !== false,
        appliedAt: file.appliedAt == null ? "" : String(file.appliedAt),
        absolutePath: file.absolutePath == null ? "" : String(file.absolutePath),
        hunks: Array.isArray(file.hunks)
          ? file.hunks.map((hunk, hunkIndex) => validatePatchPlanHunk(hunk, hunkIndex))
          : []
      };
    })
  };
}

function validatePromotedPaletteAction(value, index) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "promoted palette action must be an object."
  );
  const workflowId = value.workflowId == null ? "" : String(value.workflowId).trim();
  if (workflowId) {
    assert(workflowCatalog.isWorkflowId(workflowId), "invalid promotedPaletteActions[].workflowId.");
  }
  const groupId = toTrimmedString(
    value.groupId || `group-${index + 1}`,
    "promotedPaletteActions[].groupId"
  );
  const filePaths = Array.isArray(value.filePaths)
    ? value.filePaths.map((item) => validatePatchPlanFilePath(item))
    : [];
  return {
    id: String(value.id || `${workflowId || DEFAULT_WORKFLOW_ID}:${groupId}`).trim() || `${workflowId || DEFAULT_WORKFLOW_ID}:${groupId}`,
    workflowId: workflowId || DEFAULT_WORKFLOW_ID,
    groupId,
    groupTitle: String(value.groupTitle || "").trim(),
    label: toTrimmedString(
      value.label || `Verify ${String(value.groupTitle || groupId).trim() || groupId}`,
      "promotedPaletteActions[].label"
    ),
    detail: String(value.detail || "").trim(),
    promptLead: String(value.promptLead || "").trim(),
    checks: Array.isArray(value.checks)
      ? value.checks.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    filePaths,
    promotedAt: value.promotedAt == null ? "" : String(value.promotedAt)
  };
}

function validatePromotedPaletteActions(value) {
  assert(Array.isArray(value), "promotedPaletteActions must be an array.");
  return value.map((item, index) => validatePromotedPaletteAction(item, index));
}

function validateVerificationRunCheck(value, index) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "verificationRunPlan check entry is invalid."
  );
  const id = toTrimmedString(
    value.id || `check-${index + 1}`,
    "verificationRunPlan.checks[].id"
  );
  assert(verificationCatalog.isCheckId(id), "invalid verificationRunPlan.checks[].id.");
  const status = String(value.status == null ? "pending" : value.status).trim().toLowerCase();
  assert(
    status === "pending" || status === "running" || status === "passed" || status === "failed",
    "invalid verificationRunPlan.checks[].status."
  );
  return {
    id,
    label: String(value.label || "").trim(),
    description: String(value.description || "").trim(),
    commandLabel: String(value.commandLabel || "").trim(),
    selected: value.selected !== false,
    status,
    lastRunAt: value.lastRunAt == null ? "" : String(value.lastRunAt),
    exitCode: value.exitCode == null ? null : Number(value.exitCode),
    durationMs: Number.isFinite(Number(value.durationMs)) ? Number(value.durationMs) : 0,
    stdout: String(value.stdout || ""),
    stderr: String(value.stderr || "")
  };
}

function validateVerificationRunPlan(value) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "verificationRunPlan must be an object."
  );
  const workflowId = value.workflowId == null ? "" : String(value.workflowId).trim();
  if (workflowId) {
    assert(workflowCatalog.isWorkflowId(workflowId), "invalid verificationRunPlan.workflowId.");
  }
  const rootPath = path.resolve(toTrimmedString(value.rootPath, "verificationRunPlan.rootPath"));
  const checks = Array.isArray(value.checks) ? value.checks.map((check, index) => validateVerificationRunCheck(check, index)) : [];
  return {
    id: String(value.id || "").trim(),
    groupId: String(value.groupId || "").trim(),
    groupTitle: String(value.groupTitle || "").trim(),
    workflowId: workflowId || DEFAULT_WORKFLOW_ID,
    rootPath,
    rootLabel: String(value.rootLabel || "").trim(),
    preparedAt: value.preparedAt == null ? "" : String(value.preparedAt),
    lastRunAt: value.lastRunAt == null ? "" : String(value.lastRunAt),
    checks
  };
}

function validateVerificationRunHistoryEntry(value, index) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "verificationRunHistory entry is invalid."
  );
  const workflowId = value.workflowId == null ? "" : String(value.workflowId).trim();
  if (workflowId) {
    assert(workflowCatalog.isWorkflowId(workflowId), "invalid verificationRunHistory[].workflowId.");
  }
  const rootPath = path.resolve(toTrimmedString(
    value.rootPath,
    `verificationRunHistory[${index}].rootPath`
  ));
  const checks = Array.isArray(value.checks)
    ? value.checks.map((check, checkIndex) => validateVerificationRunCheck(check, checkIndex))
    : [];
  assert(checks.length > 0, "verificationRunHistory entry must include checks.");
  const selectedCheckIds = Array.isArray(value.selectedCheckIds)
    ? value.selectedCheckIds.map((item) => toTrimmedString(item, `verificationRunHistory[${index}].selectedCheckIds[]`))
    : checks.filter((check) => check.selected !== false).map((check) => check.id);
  for (const id of selectedCheckIds) {
    assert(verificationCatalog.isCheckId(id), `invalid verificationRunHistory selected check: ${id}`);
  }
  return {
    runId: String(value.runId || value.id || "").trim(),
    planId: String(value.planId || "").trim(),
    groupId: String(value.groupId || "").trim(),
    groupTitle: String(value.groupTitle || "").trim(),
    workflowId: workflowId || DEFAULT_WORKFLOW_ID,
    rootPath,
    rootLabel: String(value.rootLabel || "").trim(),
    preparedAt: value.preparedAt == null ? "" : String(value.preparedAt),
    executedAt: value.executedAt == null ? "" : String(value.executedAt),
    ok: value.ok === true,
    selectedCheckIds,
    checks: checks.map((check) => ({
      ...check,
      selected: selectedCheckIds.includes(check.id)
    }))
  };
}

function validateVerificationRunHistory(value) {
  assert(Array.isArray(value), "verificationRunHistory must be an array.");
  return value.map((entry, index) => validateVerificationRunHistoryEntry(entry, index));
}

function validateWorkspaceActionRequest(value) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "workspace action payload must be an object."
  );

  const kind = toTrimmedString(value.kind, "workspace action kind");
  assert(
    VALID_WORKSPACE_ACTION_KINDS.has(kind),
    `unsupported workspace action kind: ${kind}`
  );

  const rootPath = path.resolve(toTrimmedString(value.rootPath, "workspace action rootPath"));
  const directory = String(value.directory || "").trim().replace(/\\/g, "/");
  const filename = normalizeFilename(value.filename);
  const content = String(value.content == null ? "" : value.content);

  const normalizedDirectory = directory.length === 0 ? "." : path.posix.normalize(directory);
  if (normalizedDirectory !== ".") {
    assert(
      normalizedDirectory !== ".." &&
      !normalizedDirectory.startsWith("../") &&
      !normalizedDirectory.includes("/../") &&
      !normalizedDirectory.startsWith("/"),
      "workspace action directory is invalid."
    );
  }
  assert(content.trim().length > 0, "workspace action content is required.");

  return {
    proposalId: value.proposalId == null ? kind : String(value.proposalId).trim() || kind,
    kind,
    title: String(value.title || "").trim(),
    description: String(value.description || "").trim(),
    rootPath,
    directory: normalizedDirectory,
    filename,
    content
  };
}

function validatePatchPlanRequest(value) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "patch plan payload must be an object."
  );
  const rootPath = path.resolve(toTrimmedString(value.rootPath, "patch plan rootPath"));
  const plan = validatePatchPlan(value.plan);
  const selectedFileIds = Array.isArray(value.selectedFileIds)
    ? value.selectedFileIds.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  return {
    rootPath,
    plan,
    selectedFileIds
  };
}

function validateVerificationRunRequest(value) {
  assert(
    value && typeof value === "object" && !Array.isArray(value),
    "verification run payload must be an object."
  );
  const rootPath = path.resolve(toTrimmedString(value.rootPath, "verification run rootPath"));
  const checkIds = Array.isArray(value.checkIds)
    ? value.checkIds.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  assert(checkIds.length > 0, "verification run must include at least one check.");
  for (const id of checkIds) {
    assert(verificationCatalog.isCheckId(id), `unsupported verification check: ${id}`);
  }
  return {
    rootPath,
    checkIds
  };
}

module.exports = {
  validateCommandArgs,
  validateCommandName,
  validateImportedState,
  validateLog,
  validateMessages,
  validateModel,
  validatePassphrase,
  validatePatchPlanRequest,
  validateVerificationRunRequest,
  validateVerificationRunHistory,
  validateSettings,
  validateSessionName,
  validateWorkspaceActionRequest,
  validateStateKey,
  validateStateUpdates,
  validateTelemetry
};
