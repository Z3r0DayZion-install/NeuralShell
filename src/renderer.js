const IDS = [
  "statusLabel", "statusMeta", "typingIndicator",
  "settingsMenuOpenBtn", "bridgeAutoDetectBtn",
  "modelSummary", "sessionSummary", "commandSummary", "tokenSummary",
  "workflowQuickActions", "workflowTitleText", "workflowDescriptionText", "workflowFollowupActions",
  "operatorRail",
  "missionControlGrid",
  "outputModeSelect", "workflowSeedPromptBtn",
  "modelSelect", "refreshModelsBtn",
  "chatHistory", "promptInput", "promptMetrics", "tokensUsed",
  "threadToolsTrayBtn", "assistToolsTrayBtn", "archiveToolsTrayBtn",
  "threadToolsTray", "assistToolsTray", "archiveToolsTray",
  "artifactTitleText", "artifactMetaText", "artifactPreview", "artifactHistoryList", "clearArtifactHistoryBtn",
  "copyArtifactBtn", "exportArtifactMarkdownBtn", "exportArtifactJsonBtn", "saveArtifactSessionBtn", "exportEvidenceBundleBtn",
  "patchPlanTitleText", "patchPlanMetaText", "patchPlanSummaryText", "patchPlanVerification", "patchPlanShortcutList",
  "loadArtifactPatchPlanBtn", "previewPatchPlanBtn", "applySelectedPatchPlanBtn", "applyAllPatchPlanBtn",
  "exportPatchPlanJsonBtn", "exportPatchPlanMarkdownBtn", "savePatchPlanSessionBtn", "patchPlanFileList", "patchPlanPreview",
  "verificationRunTitleText", "verificationRunMetaText", "verificationRunList", "verificationRunOutput",
  "runVerificationPlanBtn", "copyVerificationCommandsBtn", "clearVerificationPlanBtn",
  "releaseCockpitTitleText", "releaseCockpitSummaryText", "releaseCockpitMetaRow", "releaseCockpitChecklist", "releaseCockpitStatusList",
  "stageReleaseCockpitBtn", "runReleaseCockpitBtn", "buildReleasePacketBtn", "exportReleaseEvidenceBtn", "openReleasePaletteBtn",
  "workspaceEditPathInput", "workspaceEditContentInput", "loadArtifactIntoEditBtn", "previewWorkspaceEditBtn",
  "workspaceActionList", "workspaceActionPreviewTitle", "workspaceActionPreviewMeta", "workspaceActionPreview",
  "applyWorkspaceActionBtn", "clearWorkspaceActionPreviewBtn",
  "autoScrollInput", "sendBtn", "stopBtn", "retryBtn", "editLastBtn", "regenerateBtn",
  "newChatBtn", "deleteLastExchangeBtn",
  "chatSearchInput", "chatSearchBtn", "chatSearchClearBtn",
  "sessionList", "sessionName", "sessionPass", "sessionSearchInput", "sessionSortSelect", "sessionMetadataOutput", "sessionOpsSummary",
  "sessionManageTrayBtn", "sessionInspectTrayBtn", "sessionManageTray", "sessionInspectTray",
  "saveSessionBtn", "loadSessionBtn", "renameSessionBtn", "deleteSessionBtn", "duplicateSessionBtn", "repairIndexBtn",
  "refreshCommandsBtn", "commandList", "commandBusSummary", "commandBusPaletteBtn", "commandBusHelpBtn",
  "commandIndexTrayBtn", "commandRoutingTrayBtn", "commandIndexTray", "commandRoutingTray",
  "baseUrlInput", "timeoutInput", "retryInput", "themeSelect", "tokenBudgetInput",
  "autosaveNameInput", "autosaveIntervalInput", "autosaveEnabledInput", "applySettingsBtn",
  "runSelfTestBtn", "runButtonAuditBtn", "buttonAuditOutput",
  "runtimeDiagnosticsTrayBtn", "runtimeTraceTrayBtn", "runtimeOutputTrayBtn",
  "runtimeDiagnosticsTray", "runtimeTraceTray", "runtimeOutputTray",
  "runtimeAuditOutputBtn", "runtimeLogsOutputBtn", "runtimeChatLogsOutputBtn",
  "runtimeAuditOutputPanel", "runtimeLogsOutputPanel", "runtimeChatLogsOutputPanel",
  "intelFocusText", "intelCapabilityText", "intelNextActionText", "intelActionHints",
  "intelBriefTrayBtn", "intelKnowledgeTrayBtn", "intelCapabilityTrayBtn",
  "intelBriefTray", "intelKnowledgeTray", "intelCapabilityTray",
  "snippetSelect", "insertSnippetBtn",
  "shortcutHelpBtn", "shortcutOverlay", "shortcutCloseBtn", "undoBtn", "commandHelpBtn",
  "commandPaletteOpenBtn", "commandPaletteOverlay", "commandPaletteCloseBtn", "commandPaletteInput", "commandPaletteShortcutScope", "commandPaletteList",
  "onboardingOverlay", "onboardingModelSelect", "onboardingWorkflowSelect", "onboardingAutoScrollInput", "onboardingRememberInput", "onboardingStartBtn", "onboardingSkipBtn",
  "onboardingResetBtn",
  "profileSelect", "profileNameInput", "profileBaseUrlInput", "profileTimeoutInput", "profileRetryInput",
  "profileNewBtn", "profileSaveBtn", "profileDeleteBtn", "profileUseBtn",
  "settingsMenuPanel", "settingsMenuCloseBtn", "settingsMenuBackdrop", "bridgeStatusText", "workspaceModeText",
  "intelModeText", "intelBridgeText", "intelSessionText",
  "attachWorkspaceBtn", "clearWorkspaceBtn", "workspaceSummaryText", "knowledgeFeed", "capabilityGraph",
  "connectOnStartupInput", "allowRemoteBridgeInput", "bridgeHealthBtn",
  "exportChatBtn", "exportMarkdownBtn", "copyMarkdownBtn", "copyLastAssistantBtn", "importChatBtn", "importChatFile",
  "exportStateBtn", "importStateBtn", "importStateFile",
  "loadLogsBtn", "clearLogsBtn", "exportLogsBtn", "logsOutput",
  "loadChatLogsBtn", "clearChatLogsBtn", "exportChatLogsBtn", "chatLogsOutput",
  "cpuUsage", "memoryUsage", "platformInfo", "clockTime"
];

const el = {};
for (const id of IDS) {
  el[id] = document.getElementById(id);
}

const appState = {
  model: "llama3",
  chat: [],
  commands: [],
  settings: {},
  workflowId: "release_audit",
  outputMode: "checklist",
  workspaceAttachment: null,
  lastArtifact: null,
  releasePacketHistory: [],
  patchPlan: null,
  patchPlanPreviewFileId: "",
  patchPlanGroupOpenIds: null,
  promotedPaletteActions: [],
  commandPaletteShortcutScope: "workflow",
  verificationRunPlan: null,
  workspaceEditDraft: {
    relativePath: "docs/release-audit.md",
    content: ""
  },
  workspaceActionPreview: null,
  workspaceActionHistory: {},
  sessionsMeta: {},
  sessionsIndex: [],
  lastPrompt: "",
  chatFilter: "",
  chatOpsTray: "thread",
  sessionsTray: "manage",
  commandsTray: "index",
  runtimeTray: "diagnostics",
  runtimeOutputView: "audit",
  intelTray: "brief",
  streamInFlight: false,
  streamBase: [],
  streamText: "",
  statsTimer: null,
  clockTimer: null,
  autonomous: false,
  llmStatus: "booting",
  settingsMenuOpen: false,
  commandPaletteOpen: false,
  commandPaletteItems: [],
  commandPaletteIndex: 0
};

const RELEASE_PACKET_HISTORY_LIMIT = 8;

const LOCAL_COMMANDS = [
  { name: "autodetect", description: "Probe local Ollama bridge status.", args: [], source: "local" },
  { name: "health", description: "Show LLM bridge health details.", args: [], source: "local" },
  { name: "autostep", description: "Run planner+critic synthesis on active chat.", args: [], source: "local" }
];

const verificationCatalog = window.NeuralShellVerificationCatalog || {};

const PROMPT_SNIPPETS = [
  {
    id: "debug",
    label: "Debug Plan",
    text: "Diagnose this issue. List likely root causes, verification steps, and the smallest safe fix."
  },
  {
    id: "summary",
    label: "Summarize",
    text: "Summarize the current conversation into key points and concrete next actions."
  },
  {
    id: "strict",
    label: "Strict Output",
    text: "Answer with: assumptions, solution, risks, and verification checklist. Keep it concise and exact."
  },
  {
    id: "command",
    label: "Command Script",
    text: "Generate copy-paste commands with a brief explanation for each command."
  }
];

const workflowCatalog = window.NeuralShellWorkflowCatalog || {};
const WORKFLOWS = Array.isArray(workflowCatalog.WORKFLOWS) ? workflowCatalog.WORKFLOWS : [];
const OUTPUT_MODES = Array.isArray(workflowCatalog.OUTPUT_MODES) ? workflowCatalog.OUTPUT_MODES : [];

function getWorkflow(id) {
  if (workflowCatalog && typeof workflowCatalog.getWorkflow === "function") {
    return workflowCatalog.getWorkflow(id);
  }
  return WORKFLOWS.find((workflow) => workflow.id === String(id || "").trim()) || WORKFLOWS[0] || null;
}

function getOutputMode(id) {
  if (workflowCatalog && typeof workflowCatalog.getOutputMode === "function") {
    return workflowCatalog.getOutputMode(id);
  }
  return OUTPUT_MODES.find((mode) => mode.id === String(id || "").trim()) || OUTPUT_MODES[0] || null;
}

function normalizeWorkflowId(id) {
  const workflow = getWorkflow(id);
  return workflow ? workflow.id : "release_audit";
}

function normalizeOutputMode(id, workflowId) {
  const direct = getOutputMode(id);
  if (direct) return direct.id;
  const workflow = getWorkflow(workflowId);
  return workflow && workflow.defaultOutputMode ? workflow.defaultOutputMode : "brief";
}

function formatWorkspaceAttachment(summary) {
  const data = summary && typeof summary === "object" ? summary : null;
  if (!data) {
    return "No workspace attached.\nAttach one local root to carry project context into workflows and exports.";
  }
  const lines = [
    `Label: ${String(data.label || "Unknown workspace")}`,
    `Root: ${String(data.rootPath || "") || "Unavailable"}`,
    `Signals: ${Array.isArray(data.signals) && data.signals.length ? data.signals.join(", ") : "None detected"}`,
    `Attached: ${formatTimestampLabel(data.attachedAt)}`
  ];
  return lines.join("\n");
}

function slugifySegment(value, fallback = "artifact") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function formatFileStamp(value) {
  return String(value || new Date().toISOString()).replace(/[:.]/g, "-");
}

function defaultWorkspaceEditPath() {
  return `docs/${slugifySegment(appState.workflowId || "workspace", "workspace")}-draft.md`;
}

function normalizeDraftRelativePath(value) {
  const raw = String(value || "").trim().replace(/\\/g, "/");
  if (!raw) {
    throw new Error("Target path is required.");
  }
  if (raw.startsWith("/") || /^[a-zA-Z]:/.test(raw)) {
    throw new Error("Target path must stay inside the attached workspace.");
  }
  const parts = raw
    .split("/")
    .map((part) => String(part || "").trim())
    .filter(Boolean);
  if (!parts.length) {
    throw new Error("Target path is required.");
  }
  if (parts.some((part) => part === "." || part === "..")) {
    throw new Error("Target path cannot traverse outside the workspace.");
  }
  return parts.join("/");
}

function splitDraftTargetPath(relativePath) {
  const normalized = normalizeDraftRelativePath(relativePath);
  const parts = normalized.split("/");
  const filename = String(parts.pop() || "").trim();
  if (!filename) {
    throw new Error("Target filename is required.");
  }
  const directory = parts.length ? parts.join("/") : ".";
  return {
    relativePath: normalized,
    directory,
    filename
  };
}

function extractDraftContentFromArtifact() {
  const artifact = appState.lastArtifact;
  const raw = String(artifact && artifact.content ? artifact.content : "").trim();
  if (!raw) {
    throw new Error("Generate an artifact before loading a file edit draft.");
  }
  const fenced = raw.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  return fenced ? fenced[1] : raw;
}

function renderWorkspaceEditDraft() {
  const draft = appState.workspaceEditDraft || {};
  if (el.workspaceEditPathInput) {
    el.workspaceEditPathInput.value = String(draft.relativePath || defaultWorkspaceEditPath());
  }
  if (el.workspaceEditContentInput) {
    el.workspaceEditContentInput.value = String(draft.content || "");
  }
}

function syncWorkspaceEditDraftFromInputs() {
  appState.workspaceEditDraft = {
    relativePath: String((el.workspaceEditPathInput && el.workspaceEditPathInput.value) || defaultWorkspaceEditPath()).trim() || defaultWorkspaceEditPath(),
    content: String((el.workspaceEditContentInput && el.workspaceEditContentInput.value) || "")
  };
  return appState.workspaceEditDraft;
}

function setWorkspaceEditDraft(relativePath, content) {
  appState.workspaceEditDraft = {
    relativePath: String(relativePath || defaultWorkspaceEditPath()).trim() || defaultWorkspaceEditPath(),
    content: String(content || "")
  };
  renderWorkspaceEditDraft();
}

function artifactFilenameBase() {
  const workflow = getWorkflow(appState.workflowId);
  const artifact = appState.lastArtifact;
  const stamp = formatFileStamp(artifact && artifact.generatedAt ? artifact.generatedAt : new Date().toISOString());
  const slug = slugifySegment((workflow && workflow.id) || "artifact");
  return `neuralshell-${slug}-${stamp}`;
}

function getEvidenceBundleFilename() {
  return `${artifactFilenameBase()}-evidence-bundle.json`;
}

function hasReleasePacketArtifact() {
  return Boolean(
    appState.lastArtifact
    && String(appState.lastArtifact.outputMode || "").trim() === "release_packet"
    && String(appState.lastArtifact.content || "").trim()
  );
}

function normalizeArtifactValue(value, options = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const workflowId = normalizeWorkflowId(source.workflowId || options.workflowId || appState.workflowId);
  const forcedOutputMode = String(options.forceOutputMode || "").trim();
  const outputMode = forcedOutputMode
    || normalizeOutputMode(source.outputMode || options.outputMode || appState.outputMode, workflowId);
  return {
    title: String(source.title || options.title || `${((getWorkflow(workflowId) || {}).title) || "Workflow"} Artifact`).trim(),
    workflowId,
    outputMode,
    content: String(source.content || "").trim(),
    generatedAt: String(source.generatedAt || options.generatedAt || new Date().toISOString())
  };
}

function releasePacketHistoryKey(value) {
  const artifact = normalizeArtifactValue(value, {
    forceOutputMode: "release_packet",
    title: "Release Packet"
  });
  return `${artifact.generatedAt}|${artifact.title}|${artifact.content.slice(0, 160)}`;
}

function normalizeReleasePacketHistory(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (let index = 0; index < value.length; index += 1) {
    try {
      const artifact = normalizeArtifactValue(value[index], {
        forceOutputMode: "release_packet",
        title: "Release Packet"
      });
      if (!String(artifact.content || "").trim()) continue;
      const key = releasePacketHistoryKey(artifact);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(artifact);
    } catch {
      // Ignore malformed history entries and keep the rest usable.
    }
  }
  out.sort((left, right) => String(right.generatedAt || "").localeCompare(String(left.generatedAt || "")));
  return out.slice(0, RELEASE_PACKET_HISTORY_LIMIT);
}

function pushReleasePacketHistoryEntry(value) {
  const entry = normalizeArtifactValue(value, {
    forceOutputMode: "release_packet",
    title: "Release Packet"
  });
  const targetKey = releasePacketHistoryKey(entry);
  appState.releasePacketHistory = [
    entry,
    ...normalizeReleasePacketHistory(appState.releasePacketHistory).filter((item) => releasePacketHistoryKey(item) !== targetKey)
  ].slice(0, RELEASE_PACKET_HISTORY_LIMIT);
  return entry;
}

function buildArtifactRecord(content, generatedAt) {
  return {
    ...normalizeArtifactValue({
      content,
      generatedAt
    }, {
      outputMode: normalizeOutputMode(appState.outputMode, appState.workflowId)
    })
  };
}

function buildReleasePacketContent(options = {}) {
  const releaseModel = getReleaseCockpitModel();
  const generatedAt = String(options.generatedAt || new Date().toISOString());
  const workflow = getWorkflow(appState.workflowId);
  const workspace = appState.workspaceAttachment;
  const dockArtifact = appState.lastArtifact && String(appState.lastArtifact.content || "").trim()
    ? appState.lastArtifact
    : null;
  const patchPlan = appState.patchPlan;
  const selectedChecks = releaseModel.rows.filter((check) => check.selected !== false);
  const blockers = [];

  if (!hasWorkspaceAttachment()) {
    blockers.push("No workspace attached.");
  }
  if (!dockArtifact) {
    blockers.push("No dock artifact is loaded in the Artifact Dock.");
  }
  if (!getReleaseCockpitPlan()) {
    blockers.push("Release cockpit checks have not been staged yet.");
  }
  if (releaseModel.failed) {
    blockers.push(`${releaseModel.failed} release verification ${releaseModel.failed === 1 ? "check has" : "checks have"} failed.`);
  }
  if (!selectedChecks.length) {
    blockers.push("No release verification checks are selected.");
  }

  const decision = blockers.length
    ? "Blocked"
    : releaseModel.passed && releaseModel.pending === 0
      ? "Ready"
      : "Conditional";
  const packetSummary = !blockers.length && releaseModel.passed && releaseModel.pending === 0
    ? "Selected release checks passed. This packet captures the current ship decision, verification state, and next handoff actions."
    : releaseModel.summary;

  const lines = [
    "# Release Packet",
    "",
    `- Decision: ${decision}`,
    `- Workflow: ${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)}`,
    `- Workspace: ${workspace ? `${workspace.label} (${workspace.rootPath})` : "Not attached"}`,
    `- Generated: ${generatedAt}`,
    `- Dock Artifact: ${dockArtifact ? `${dockArtifact.title || "Artifact"} | ${formatTimestampLabel(dockArtifact.generatedAt)}` : "Unavailable"}`,
    `- Patch Plan: ${patchPlanHasFiles() ? `${patchPlan.totalFiles || patchPlan.files.length} files loaded` : "No patch plan loaded"}`,
    `- Evidence Bundle: ${hasWorkspaceAttachment() || appState.chat.length ? "Ready to export" : "Unavailable"}`,
    ""
  ];

  lines.push("## Release Summary");
  lines.push(packetSummary);
  lines.push("");

  lines.push("## Verification");
  for (const check of releaseModel.rows) {
    const state = check.selected === false
      ? "DESELECTED"
      : String(check.status || "pending").toUpperCase();
    const duration = check.durationMs ? ` | ${check.durationMs} ms` : "";
    const exit = check.exitCode != null ? ` | exit ${check.exitCode}` : "";
    lines.push(`- [${state}] ${check.label} -> ${check.commandLabel}${duration}${exit}`);
  }
  lines.push("");

  lines.push("## Assets");
  lines.push(`- Store screenshots: ${releaseModel.rows.some((check) => check.id === "store_screenshots" && check.status === "passed") ? "Refreshed in this run" : "Use the selected release check or top-level pipeline to refresh"}`);
  lines.push(`- Evidence bundle: ${hasWorkspaceAttachment() || appState.chat.length ? "Can be exported from the Artifact Dock or Release Cockpit" : "Unavailable until workflow state exists"}`);
  lines.push(`- Session snapshot: ${Object.keys(appState.sessionsMeta || {}).length ? "Existing sessions available for handoff" : "No saved session snapshots yet"}`);
  lines.push("");

  lines.push("## Blockers");
  if (!blockers.length) {
    lines.push("- None.");
  } else {
    for (const blocker of blockers) {
      lines.push(`- ${blocker}`);
    }
  }
  lines.push("");

  lines.push("## Next Actions");
  if (!selectedChecks.length) {
    lines.push("- Select at least one release verification check and rerun the cockpit.");
  } else if (releaseModel.failed) {
    lines.push("- Review failed verification output and rerun only the affected checks.");
  } else if (releaseModel.pending > 0) {
    lines.push("- Run the remaining selected release checks before calling the packet ready.");
  } else {
    lines.push("- Export the evidence bundle.");
    lines.push("- Save a session snapshot for handoff.");
    lines.push("- Ship only if manual review agrees with the packet decision.");
  }
  if (!dockArtifact) {
    lines.push("- Generate or restore a dock artifact so the packet references the intended release output.");
  }

  return lines.join("\n");
}

function extractJsonCandidate(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return String(fenced[1]).trim();
  }
  return text;
}

function normalizePatchPlanFileEntry(file, index) {
  if (!file || typeof file !== "object" || Array.isArray(file)) {
    throw new Error(`Patch plan file ${index + 1} is invalid.`);
  }
  const relativePath = normalizeDraftRelativePath(file.path);
  return {
    fileId: String(file.fileId || `${index + 1}-${slugifySegment(relativePath, `file-${index + 1}`)}`),
    path: relativePath,
    status: String(file.status || "").trim(),
    rationale: String(file.rationale || "").trim(),
    content: String(file.content || ""),
    diffText: String(file.diffText || ""),
    bytes: Number.isFinite(Number(file.bytes)) ? Number(file.bytes) : 0,
    lines: Number.isFinite(Number(file.lines)) ? Number(file.lines) : 0,
    selected: file.selected !== false,
    appliedAt: String(file.appliedAt || ""),
    absolutePath: String(file.absolutePath || "")
  };
}

function normalizePatchPlanValue(value, options = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const workflowId = normalizeWorkflowId(source.workflowId || options.workflowId || appState.workflowId);
  const generatedAt = String(source.generatedAt || options.generatedAt || new Date().toISOString());
  const files = Array.isArray(source.files) ? source.files.map(normalizePatchPlanFileEntry) : [];
  if (!files.length) {
    throw new Error("Patch plan must include at least one file.");
  }
  const selectedFileIds = files.filter((file) => file.selected !== false).map((file) => file.fileId);
  return {
    id: String(source.id || `patch-plan-${generatedAt}`),
    workflowId,
    outputMode: "patch_plan",
    title: String(source.title || `${(getWorkflow(workflowId) || {}).title || "Workflow"} Patch Plan`).trim(),
    summary: String(source.summary || ""),
    generatedAt,
    rootPath: String(source.rootPath || options.rootPath || "").trim(),
    verification: Array.isArray(source.verification)
      ? source.verification.map((item) => String(item || "").trim()).filter(Boolean)
      : [],
    totalFiles: Number.isFinite(Number(source.totalFiles)) ? Number(source.totalFiles) : files.length,
    newFiles: Number.isFinite(Number(source.newFiles)) ? Number(source.newFiles) : files.filter((file) => file.status === "new").length,
    modifiedFiles: Number.isFinite(Number(source.modifiedFiles)) ? Number(source.modifiedFiles) : files.filter((file) => file.status === "modify").length,
    totalBytes: Number.isFinite(Number(source.totalBytes)) ? Number(source.totalBytes) : files.reduce((sum, file) => sum + Number(file.bytes || 0), 0),
    totalLines: Number.isFinite(Number(source.totalLines)) ? Number(source.totalLines) : files.reduce((sum, file) => sum + Number(file.lines || 0), 0),
    selectedFileIds: Array.isArray(source.selectedFileIds)
      ? source.selectedFileIds.map((item) => String(item || "").trim()).filter(Boolean)
      : selectedFileIds,
    files
  };
}

function getPromotedPaletteActionId(workflowId, groupId) {
  return `shortcut-${slugifySegment(normalizeWorkflowId(workflowId), "workflow")}-${slugifySegment(groupId || "group", "group")}`;
}

function normalizeCommandPaletteShortcutScope(value) {
  return String(value || "").trim().toLowerCase() === "all" ? "all" : "workflow";
}

function normalizePromotedPaletteAction(value, index = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Promoted palette action ${index + 1} is invalid.`);
  }
  const workflowId = normalizeWorkflowId(value.workflowId || appState.workflowId);
  const groupId = String(value.groupId || "").trim() || `group-${index + 1}`;
  const groupTitle = String(value.groupTitle || value.title || groupId).trim() || `Patch Group ${index + 1}`;
  const checks = Array.isArray(value.checks)
    ? value.checks.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const filePaths = Array.isArray(value.filePaths)
    ? value.filePaths.map((item) => normalizeDraftRelativePath(item)).filter(Boolean)
    : [];
  const promptLead = String(
    value.promptLead || `Verify the ${groupTitle.toLowerCase()} changes for safety, regression risk, and required next actions.`
  ).trim();
  const label = String(value.label || `Verify ${groupTitle}`).trim() || `Verify ${groupTitle}`;
  const detail = String(
    value.detail
      || `${(getWorkflow(workflowId) || {}).title || workflowId} shortcut | ${Math.max(filePaths.length, 1)} files | ${checks[0] || "Load recommended checks"}`
  ).trim();
  return {
    id: String(value.id || getPromotedPaletteActionId(workflowId, groupId)).trim() || getPromotedPaletteActionId(workflowId, groupId),
    workflowId,
    groupId,
    groupTitle,
    label,
    detail,
    promptLead,
    checks,
    filePaths,
    promotedAt: String(value.promotedAt || new Date().toISOString())
  };
}

function normalizePromotedPaletteActions(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (let i = 0; i < value.length; i += 1) {
    try {
      const action = normalizePromotedPaletteAction(value[i], i);
      if (seen.has(action.id)) continue;
      seen.add(action.id);
      out.push(action);
    } catch {
      // Ignore malformed shortcuts and keep the rest of the state usable.
    }
  }
  return out;
}

function verificationCheckSpec(id) {
  return verificationCatalog && typeof verificationCatalog.getCheck === "function"
    ? verificationCatalog.getCheck(id)
    : null;
}

function verificationChecksForGroup(groupId) {
  return verificationCatalog && typeof verificationCatalog.getChecksForGroup === "function"
    ? verificationCatalog.getChecksForGroup(groupId)
    : [];
}

function normalizeVerificationRunCheckEntry(value, index = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Verification check ${index + 1} is invalid.`);
  }
  const spec = verificationCheckSpec(value.id);
  if (!spec) {
    throw new Error(`Verification check ${index + 1} is unavailable.`);
  }
  const status = String(value.status || "pending").trim().toLowerCase();
  return {
    id: spec.id,
    label: String(value.label || spec.label).trim() || spec.label,
    description: String(value.description || spec.description).trim() || spec.description,
    commandLabel: String(value.commandLabel || spec.commandLabel).trim() || spec.commandLabel,
    selected: value.selected !== false,
    status: status === "running" || status === "passed" || status === "failed" ? status : "pending",
    lastRunAt: String(value.lastRunAt || ""),
    exitCode: value.exitCode == null ? null : Number(value.exitCode),
    durationMs: Number.isFinite(Number(value.durationMs)) ? Number(value.durationMs) : 0,
    stdout: String(value.stdout || ""),
    stderr: String(value.stderr || ""),
    scopes: Array.isArray(spec.scopes) ? spec.scopes.slice() : []
  };
}

function normalizeVerificationRunPlanValue(value, options = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const checks = Array.isArray(source.checks)
    ? source.checks.map((check, index) => normalizeVerificationRunCheckEntry(check, index))
    : [];
  if (!checks.length) {
    throw new Error("Verification run plan must include at least one check.");
  }
  return {
    id: String(source.id || `verification-plan-${Date.now()}`),
    groupId: String(source.groupId || "").trim(),
    groupTitle: String(source.groupTitle || "Verification Surface").trim() || "Verification Surface",
    workflowId: normalizeWorkflowId(source.workflowId || options.workflowId || appState.workflowId),
    rootPath: String(source.rootPath || options.rootPath || "").trim(),
    rootLabel: String(source.rootLabel || options.rootLabel || "").trim(),
    preparedAt: String(source.preparedAt || new Date().toISOString()),
    lastRunAt: String(source.lastRunAt || ""),
    checks
  };
}

function rootPathFromWorkspaceBoundValue(value) {
  return value && typeof value === "object"
    ? String(value.rootPath || "").trim()
    : "";
}

function patchPlanConflictsWithWorkspaceAttachment(patchPlan, workspaceAttachment) {
  const planRoot = rootPathFromWorkspaceBoundValue(patchPlan);
  const workspaceRoot = rootPathFromWorkspaceBoundValue(workspaceAttachment);
  return Boolean(planRoot && workspaceRoot && planRoot !== workspaceRoot);
}

function verificationPlanMatchesWorkspaceAttachment(verificationRunPlan, workspaceAttachment) {
  const planRoot = rootPathFromWorkspaceBoundValue(verificationRunPlan);
  const workspaceRoot = rootPathFromWorkspaceBoundValue(workspaceAttachment);
  return Boolean(planRoot && workspaceRoot && planRoot === workspaceRoot);
}

function reconcileWorkspaceBoundState(previousWorkspaceRoot = "") {
  const nextWorkspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  const shouldClearPatchPlan = Boolean(
    appState.patchPlan && (
      (previousWorkspaceRoot && nextWorkspaceRoot && previousWorkspaceRoot !== nextWorkspaceRoot)
      || patchPlanConflictsWithWorkspaceAttachment(appState.patchPlan, appState.workspaceAttachment)
    )
  );

  if (shouldClearPatchPlan) {
    resetPatchPlanState();
    return;
  }

  if (
    appState.verificationRunPlan
    && !verificationPlanMatchesWorkspaceAttachment(appState.verificationRunPlan, appState.workspaceAttachment)
  ) {
    appState.verificationRunPlan = null;
  }
}

function getReleaseVerificationSpecs() {
  const ids = ["lint", "founder_e2e", "store_screenshots"];
  if (verificationCatalog && typeof verificationCatalog.listChecks === "function") {
    return verificationCatalog.listChecks(ids);
  }
  return ids.map((id) => verificationCheckSpec(id)).filter(Boolean);
}

function getReleaseCockpitPlan() {
  if (
    !appState.verificationRunPlan
    || typeof appState.verificationRunPlan !== "object"
    || String(appState.verificationRunPlan.groupId || "").trim() !== "release_cockpit"
  ) {
    return null;
  }
  return appState.verificationRunPlan;
}

function getReleaseCockpitCheckRows() {
  const plan = getReleaseCockpitPlan();
  const checks = getReleaseVerificationSpecs();
  return checks.map((spec, index) => {
    const existing = plan && Array.isArray(plan.checks)
      ? plan.checks.find((check) => check.id === spec.id)
      : null;
    return normalizeVerificationRunCheckEntry(existing || {
      id: spec.id,
      selected: true
    }, index);
  });
}

function getReleaseCockpitModel() {
  const workflow = getWorkflow(appState.workflowId);
  const rows = getReleaseCockpitCheckRows();
  const selected = rows.filter((check) => check.selected !== false);
  const passed = selected.filter((check) => check.status === "passed").length;
  const failed = selected.filter((check) => check.status === "failed").length;
  const running = selected.filter((check) => check.status === "running").length;
  const pending = selected.filter((check) => check.status === "pending").length;
  const workflowTitle = (workflow && workflow.title) || "Workflow";
  const packetReady = hasReleasePacketArtifact();
  let title = "Stage release verification";
  let summary = `Queue lint, founder e2e, and store screenshot refresh against ${hasWorkspaceAttachment() ? (appState.workspaceAttachment.label || "the attached workspace") : "one attached workspace"} before you call the release packet ready.`;
  let tone = "guard";

  if (!hasWorkspaceAttachment()) {
    title = "Attach a workspace to open the release cockpit";
    summary = "Release verification needs one attached local root so checks, evidence, and screenshots stay scoped to the same project.";
    tone = "warn";
  } else if (!getReleaseCockpitPlan()) {
    title = "Stage release verification";
    summary = `Use the cockpit to queue the guarded release lane for ${workflowTitle}. Keep expensive checks explicit and local.`;
    tone = normalizeWorkflowId(appState.workflowId) === "release_audit" ? "ok" : "guard";
  } else if (running > 0) {
    title = "Release verification running";
    summary = `${running} ${running === 1 ? "check is" : "checks are"} still running against ${appState.workspaceAttachment.label || "the attached workspace"}.`;
    tone = "ok";
  } else if (failed > 0) {
    title = "Release verification has failures";
    summary = `${failed} ${failed === 1 ? "selected check failed" : "selected checks failed"}. Inspect output, tighten the release surface, and rerun only what changed.`;
    tone = "warn";
  } else if (passed > 0 && pending === 0 && packetReady) {
    title = "Release packet ready";
    summary = "The release packet artifact is staged in the dock with a clean selected verification pass. Export evidence and handoff while the state is fresh.";
    tone = "good";
  } else if (passed > 0 && pending === 0) {
    title = "Build the release packet";
    summary = "All selected release checks passed. Build the release packet artifact, then export evidence and handoff while the verification state is fresh.";
    tone = "good";
  } else if (passed > 0) {
    title = "Release verification partially complete";
    summary = `${passed} ${passed === 1 ? "selected check has" : "selected checks have"} passed. Run the remaining checks only if the current surface still needs that proof.`;
    tone = "ok";
  }

  const checklist = !hasWorkspaceAttachment()
    ? [
        "Attach one local workspace root before staging release checks.",
        "Keep release verification local-only and explicit.",
        "Export evidence only after the workspace and checks align."
      ]
    : !getReleaseCockpitPlan()
      ? [
          "Stage lint, founder e2e, and store screenshot refresh into one guarded run plan.",
          "Uncheck expensive paths if you only need a partial proof for the current delta.",
          "Run the selected checks explicitly, then export the evidence bundle."
        ]
      : rows.map((check) => {
          if (check.selected === false) {
            return `${check.label}: deselected for this pass.`;
          }
          if (check.status === "passed") {
            return `${check.label}: passed${check.durationMs ? ` in ${check.durationMs} ms` : ""}.`;
          }
          if (check.status === "failed") {
            return `${check.label}: failed${check.exitCode != null ? ` with exit ${check.exitCode}` : ""}. Review output before rerunning.`;
          }
          if (check.status === "running") {
            return `${check.label}: running now against ${check.commandLabel}.`;
          }
          return `${check.label}: ready to run via ${check.commandLabel}.`;
        });

  if (packetReady) {
    checklist.push(`Release packet artifact: ${appState.lastArtifact.title || "Release Packet"} is ready in the dock.`);
  } else if (passed > 0 && pending === 0 && !failed) {
    checklist.push("Build the release packet artifact now so the ship decision, verification state, and blockers are captured in one dock artifact.");
  }

  return {
    title,
    summary,
    tone,
    workflowTitle,
    packetReady,
    rows,
    selected,
    passed,
    failed,
    running,
    pending,
    checklist
  };
}

function workflowPromptLoaded() {
  const workflow = getWorkflow(appState.workflowId);
  if (!workflow || !el.promptInput) return;
  el.promptInput.value = workflowPromptTemplate(workflow);
  updatePromptMetrics();
  updateCommandHint();
  el.promptInput.focus();
  showBanner(`Workflow prompt loaded: ${workflow.title}`, "ok");
}

function createMissionMetric(label, value, tone = "guard") {
  const item = document.createElement("div");
  item.className = "mission-metric";

  const metricLabel = document.createElement("span");
  metricLabel.className = "stat-label";
  metricLabel.textContent = label;

  const metricValue = document.createElement("div");
  metricValue.className = "mission-metric-value";
  metricValue.dataset.tone = tone;
  metricValue.textContent = value;

  item.appendChild(metricLabel);
  item.appendChild(metricValue);
  return item;
}

function getMissionControlCards() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const releaseModel = getReleaseCockpitModel();
  const releasePlan = getReleaseCockpitPlan();
  const selectedChecks = releaseModel.rows.filter((check) => check.selected !== false);
  const passedChecks = selectedChecks.filter((check) => check.status === "passed").length;
  const failedChecks = selectedChecks.filter((check) => check.status === "failed").length;
  const pendingChecks = selectedChecks.filter((check) => check.status === "pending").length;
  const patchSelected = selectedPatchPlanFiles().length;
  const patchPending = unappliedSelectedPatchPlanFiles().length;
  const latestPacket = Array.isArray(appState.releasePacketHistory) && appState.releasePacketHistory.length
    ? appState.releasePacketHistory[0]
    : null;

  return [
    {
      eyebrow: "Workflow Lane",
      title: (workflow && workflow.title) || "Workflow",
      summary: outputMode
        ? `${outputMode.label} contract is active. Keep the next response structured and ready for promotion into local work.`
        : "Load a workflow and keep the next response structured.",
      tone: normalizeWorkflowId(appState.workflowId) === "release_audit" ? "good" : "ok",
      scopes: [
        { label: "Structured output", tone: "read" },
        { label: hasArtifactContent() ? "Artifact staged" : "No artifact", tone: hasArtifactContent() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Output Mode", value: (outputMode && outputMode.label) || "Unassigned", tone: "ok" },
        { label: "Chat Turns", value: `${Array.isArray(appState.chat) ? appState.chat.length : 0}`, tone: "guard" },
        { label: "Last Artifact", value: appState.lastArtifact ? formatTimestampLabel(appState.lastArtifact.generatedAt) : "Not generated", tone: appState.lastArtifact ? "good" : "warn" }
      ],
      actionLabel: "Load Workflow Prompt",
      actionClass: "btn-primary",
      action: () => { workflowPromptLoaded(); }
    },
    {
      eyebrow: "Workspace Context",
      title: hasWorkspaceAttachment() ? String(appState.workspaceAttachment.label || "Attached workspace") : "Attach a workspace",
      summary: hasWorkspaceAttachment()
        ? "One local root is attached for context, exports, and guarded apply. Keep evidence, patch plans, and release checks scoped here."
        : "Attach one local project root so workflows, evidence, and apply actions stay bounded to the same workspace.",
      tone: hasWorkspaceAttachment() ? "good" : "warn",
      scopes: [
        { label: "Local only", tone: "guard" },
        { label: hasWorkspaceAttachment() ? "Root attached" : "No root", tone: hasWorkspaceAttachment() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Signals", value: hasWorkspaceAttachment() ? `${Array.isArray(appState.workspaceAttachment.signals) ? appState.workspaceAttachment.signals.length : 0} detected` : "None", tone: hasWorkspaceAttachment() ? "ok" : "warn" },
        { label: "Sessions", value: `${Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0} indexed`, tone: "guard" },
        { label: "Attachment", value: hasWorkspaceAttachment() ? formatTimestampLabel(appState.workspaceAttachment.attachedAt) : "Pending", tone: hasWorkspaceAttachment() ? "good" : "warn" }
      ],
      actionLabel: hasWorkspaceAttachment() ? "Clear Workspace" : "Attach Workspace",
      actionClass: hasWorkspaceAttachment() ? "btn-secondary" : "btn-primary",
      action: () => (hasWorkspaceAttachment() ? clearWorkspaceAttachment() : attachWorkspaceFromDialog())
    },
    {
      eyebrow: "Apply Surface",
      title: patchPlanHasFiles() ? "Patch + Apply Deck Ready" : "Promotion Surface",
      summary: patchPlanHasFiles()
        ? `${patchPending} selected ${patchPending === 1 ? "file is" : "files are"} still unapplied. Review the plan or push a guarded write through the workspace deck.`
        : hasArtifactContent()
          ? "The latest artifact can be promoted into a patch plan, markdown report, or manual diff draft."
          : "Generate an artifact first, then move into preview-first local work.",
      tone: patchPlanHasFiles() ? (patchPending > 0 ? "ok" : "good") : (hasArtifactContent() ? "guard" : "warn"),
      scopes: [
        { label: "Preview first", tone: "read" },
        { label: hasWorkspaceActionPreview() ? "Write preview loaded" : "No preview", tone: hasWorkspaceActionPreview() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Patch Files", value: patchPlanHasFiles() ? `${appState.patchPlan.totalFiles || appState.patchPlan.files.length}` : "0", tone: patchPlanHasFiles() ? "ok" : "warn" },
        { label: "Selected", value: `${patchSelected}`, tone: patchSelected ? "good" : "guard" },
        { label: "Draft", value: workspaceDraftReady() ? "Ready" : "Empty", tone: workspaceDraftReady() ? "ok" : "warn" }
      ],
      actionLabel: patchPlanHasFiles()
        ? (patchPlanPreviewReady() ? "Apply Selected Patch Files" : "Preview Patch Plan")
        : (hasArtifactContent() ? "Load Artifact as Patch Plan" : "Preview Markdown Report"),
      actionClass: "btn-primary",
      action: () => {
        if (patchPlanHasFiles()) {
          return patchPlanPreviewReady() ? applyPatchPlanFiles(false) : previewPatchPlanFiles();
        }
        return hasArtifactContent() ? loadPatchPlanFromArtifact() : previewWorkspaceActionProposal("artifact_markdown");
      }
    },
    {
      eyebrow: "Release Lane",
      title: releaseModel.title,
      summary: `${releaseModel.summary} Packet ledger keeps ${Array.isArray(appState.releasePacketHistory) ? appState.releasePacketHistory.length : 0} local ${(Array.isArray(appState.releasePacketHistory) ? appState.releasePacketHistory.length : 0) === 1 ? "snapshot" : "snapshots"} ready for reload.`,
      tone: releaseModel.tone,
      scopes: [
        { label: "Verification scoped", tone: "read" },
        { label: hasReleasePacketArtifact() ? "Packet in dock" : "Packet pending", tone: hasReleasePacketArtifact() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Selected Checks", value: `${selectedChecks.length}`, tone: selectedChecks.length ? "ok" : "warn" },
        { label: "Passed / Failed", value: `${passedChecks} / ${failedChecks}`, tone: failedChecks ? "warn" : (passedChecks ? "good" : "guard") },
        { label: "Packet Ledger", value: latestPacket ? formatTimestampLabel(latestPacket.generatedAt) : "Empty", tone: latestPacket ? "good" : "warn" }
      ],
      actionLabel: hasReleasePacketArtifact()
        ? "Export Release Evidence"
        : releasePlan
          ? (failedChecks > 0 || pendingChecks > 0 ? "Run Release Checks" : "Build Release Packet")
          : "Stage Release Checks",
      actionClass: hasReleasePacketArtifact() ? "btn-secondary" : "btn-primary",
      action: () => {
        if (hasReleasePacketArtifact()) {
          return exportEvidenceBundle();
        }
        if (!releasePlan) {
          stageReleaseCockpit();
          return Promise.resolve();
        }
        if (failedChecks > 0 || pendingChecks > 0) {
          return runReleaseCockpitChecks();
        }
        return buildReleasePacketArtifact();
      }
    }
  ];
}

function renderMissionControl() {
  if (!el.missionControlGrid) return;
  const cards = getMissionControlCards();
  el.missionControlGrid.innerHTML = "";
  for (const cardModel of cards) {
    const card = document.createElement("section");
    card.className = "mission-card";
    card.dataset.tone = operatorPhaseTone(cardModel.tone);

    const head = document.createElement("div");
    head.className = "mission-card-head";

    const eyebrow = document.createElement("span");
    eyebrow.className = "stat-label";
    eyebrow.textContent = cardModel.eyebrow;

    const title = document.createElement("div");
    title.className = "mission-card-title";
    title.textContent = cardModel.title;

    const summary = document.createElement("p");
    summary.className = "workflow-description-text";
    summary.textContent = cardModel.summary;

    head.appendChild(eyebrow);
    head.appendChild(title);
    head.appendChild(summary);

    const scopes = document.createElement("div");
    scopes.className = "operator-scope-row";
    appendScopePills(scopes, cardModel.scopes);

    const metrics = document.createElement("div");
    metrics.className = "mission-metric-grid";
    for (const metric of cardModel.metrics) {
      metrics.appendChild(createMissionMetric(metric.label, metric.value, metric.tone));
    }

    const actions = document.createElement("div");
    actions.className = "row row-wrap action-grid";
    const button = document.createElement("button");
    button.className = cardModel.actionClass || "btn-secondary";
    button.textContent = cardModel.actionLabel || "Run";
    button.onclick = () => {
      Promise.resolve(cardModel.action && cardModel.action())
        .catch((err) => showBanner(err.message || String(err), "bad"));
    };
    actions.appendChild(button);

    card.appendChild(head);
    card.appendChild(scopes);
    card.appendChild(metrics);
    card.appendChild(actions);
    el.missionControlGrid.appendChild(card);
  }
}

function setChatOpsTray(nextTray, options = {}) {
  const normalized = String(nextTray || "").trim().toLowerCase();
  const resolved = normalized === "assist" || normalized === "archive" || normalized === "thread"
    ? normalized
    : "thread";
  appState.chatOpsTray = options.toggle && appState.chatOpsTray === resolved ? "none" : resolved;
  renderChatOpsTrays();
}

function renderChatOpsTrays() {
  const trayMap = [
    { id: "thread", button: el.threadToolsTrayBtn, panel: el.threadToolsTray },
    { id: "assist", button: el.assistToolsTrayBtn, panel: el.assistToolsTray },
    { id: "archive", button: el.archiveToolsTrayBtn, panel: el.archiveToolsTray }
  ];
  for (const tray of trayMap) {
    const isActive = appState.chatOpsTray === tray.id;
    if (tray.button) {
      tray.button.classList.toggle("is-active", isActive);
      tray.button.setAttribute("aria-expanded", String(isActive));
    }
    if (tray.panel) {
      tray.panel.classList.toggle("hidden", !isActive);
      tray.panel.hidden = !isActive;
      tray.panel.setAttribute("aria-hidden", String(!isActive));
    }
  }
}

function setRuntimeTray(nextTray, options = {}) {
  const normalized = String(nextTray || "").trim().toLowerCase();
  const resolved = normalized === "trace" || normalized === "outputs" || normalized === "diagnostics"
    ? normalized
    : "diagnostics";
  appState.runtimeTray = options.toggle && appState.runtimeTray === resolved ? "none" : resolved;
  renderRuntimeTrays();
}

function setRuntimeOutputView(nextView) {
  const normalized = String(nextView || "").trim().toLowerCase();
  appState.runtimeOutputView = normalized === "logs" || normalized === "chat"
    ? normalized
    : "audit";
  renderRuntimeTrays();
}

function renderRuntimeTrays() {
  const trayMap = [
    { id: "diagnostics", button: el.runtimeDiagnosticsTrayBtn, panel: el.runtimeDiagnosticsTray },
    { id: "trace", button: el.runtimeTraceTrayBtn, panel: el.runtimeTraceTray },
    { id: "outputs", button: el.runtimeOutputTrayBtn, panel: el.runtimeOutputTray }
  ];
  for (const tray of trayMap) {
    const isActive = appState.runtimeTray === tray.id;
    if (tray.button) {
      tray.button.classList.toggle("is-active", isActive);
      tray.button.setAttribute("aria-expanded", String(isActive));
    }
    if (tray.panel) {
      tray.panel.classList.toggle("hidden", !isActive);
      tray.panel.hidden = !isActive;
      tray.panel.setAttribute("aria-hidden", String(!isActive));
    }
  }

  const outputMap = [
    { id: "audit", button: el.runtimeAuditOutputBtn, panel: el.runtimeAuditOutputPanel },
    { id: "logs", button: el.runtimeLogsOutputBtn, panel: el.runtimeLogsOutputPanel },
    { id: "chat", button: el.runtimeChatLogsOutputBtn, panel: el.runtimeChatLogsOutputPanel }
  ];
  for (const output of outputMap) {
    const isActive = appState.runtimeOutputView === output.id;
    if (output.button) {
      output.button.classList.toggle("is-active", isActive);
      output.button.setAttribute("aria-expanded", String(isActive));
    }
    if (output.panel) {
      output.panel.classList.toggle("hidden", !isActive);
      output.panel.hidden = !isActive;
      output.panel.setAttribute("aria-hidden", String(!isActive));
    }
  }
}

function setIntelTray(nextTray, options = {}) {
  const normalized = String(nextTray || "").trim().toLowerCase();
  const resolved = normalized === "knowledge" || normalized === "capability"
    ? normalized
    : "brief";
  appState.intelTray = options.toggle && appState.intelTray === resolved ? "none" : resolved;
  renderIntelSurface();
}

function describeVerificationPlanState() {
  const plan = appState.verificationRunPlan;
  if (!plan || !Array.isArray(plan.checks) || !plan.checks.length) {
    return {
      tone: "guard",
      summary: "No verification run plan staged.",
      detail: "Promote or stage checks from a patch group when you need proof before apply."
    };
  }
  const selected = plan.checks.filter((check) => check.selected !== false);
  const running = selected.filter((check) => check.status === "running").length;
  const failed = selected.filter((check) => check.status === "failed").length;
  const passed = selected.filter((check) => check.status === "passed").length;
  const pending = selected.filter((check) => check.status === "pending").length;
  if (running > 0) {
    return {
      tone: "ok",
      summary: `${running} verification ${running === 1 ? "check running" : "checks running"}.`,
      detail: `${selected.length}/${plan.checks.length} selected against ${plan.rootLabel || plan.rootPath || "the attached workspace"}.`
    };
  }
  if (failed > 0) {
    return {
      tone: "warn",
      summary: `${failed} verification ${failed === 1 ? "check failed" : "checks failed"}.`,
      detail: "Review captured output before rerunning or applying the remaining patch surface."
    };
  }
  if (passed > 0 && pending === 0) {
    return {
      tone: "good",
      summary: "Selected verification checks passed.",
      detail: `${passed}/${selected.length} selected checks passed for ${plan.groupTitle || "the staged surface"}.`
    };
  }
  return {
    tone: "guard",
    summary: `${selected.length}/${plan.checks.length} verification checks selected.`,
    detail: "Preview exact commands or run the selected checks explicitly from the patch workflow."
  };
}

function buildIntelBriefModel() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const workspaceLabel = hasWorkspaceAttachment()
    ? String(appState.workspaceAttachment.label || "Attached workspace")
    : "No workspace attached";
  const releaseModel = getReleaseCockpitModel();
  const patchGroups = patchPlanHasFiles() ? collectPatchPlanGroups(appState.patchPlan) : [];
  const verificationState = describeVerificationPlanState();
  const packetCount = Array.isArray(appState.releasePacketHistory) ? appState.releasePacketHistory.length : 0;
  const activeArtifact = appState.lastArtifact && appState.lastArtifact.title
    ? `${appState.lastArtifact.title} @ ${formatTimestampLabel(appState.lastArtifact.generatedAt)}`
    : "No dock artifact";

  let focus = `${(workflow && workflow.title) || "Workflow"} is active with ${(outputMode && outputMode.label) || "structured"} output. ${activeArtifact}.`;
  if (patchPlanHasFiles()) {
    focus = `${(workflow && workflow.title) || "Workflow"} is carrying ${(appState.patchPlan.files || []).length} staged patch files across ${patchGroups.length || 1} grouped review surfaces.`;
  } else if (!hasArtifactContent()) {
    focus = `${(workflow && workflow.title) || "Workflow"} is active. Generate the next artifact before you promote it into patch, verification, or release work.`;
  }

  let capability = `${workspaceLabel}. `;
  if (!hasWorkspaceAttachment()) {
    capability += "Attach one local root to unlock guarded apply, evidence export, and release verification.";
  } else if (patchPlanHasFiles()) {
    capability += `${unappliedSelectedPatchPlanFiles().length} selected files still need explicit apply. ${verificationState.summary}`;
  } else if (hasArtifactContent()) {
    capability += "Artifact and evidence surfaces are ready, but no structured patch review is staged yet.";
  } else {
    capability += "The workspace is ready, but no artifact or patch surface is staged yet.";
  }

  let nextAction = "Load a workflow prompt and produce the next artifact.";
  if (!hasWorkspaceAttachment()) {
    nextAction = "Attach one local workspace root so context, apply, and release checks stay scoped to the same project.";
  } else if (!hasArtifactContent()) {
    nextAction = "Generate a structured artifact from the active workflow before opening patch or release lanes.";
  } else if (patchPlanHasFiles() && !appState.verificationRunPlan) {
    nextAction = "Stage verification checks from the patch group you trust before applying the selected files.";
  } else if (appState.verificationRunPlan && verificationState.tone !== "good") {
    nextAction = "Run the selected verification checks or narrow the plan to the exact surface that changed.";
  } else if (releaseModel.selected.length && releaseModel.pending === 0 && !releaseModel.failed && !hasReleasePacketArtifact()) {
    nextAction = "Build the release packet now so the current verification state and blockers are captured in one dock artifact.";
  } else if (hasReleasePacketArtifact()) {
    nextAction = "Export evidence or save a handoff snapshot while the current release packet is still the active source of truth.";
  }

  const hints = [
    `${(workflow && workflow.title) || "Workflow"} is the active operator lane.${outputMode ? ` Output contract: ${outputMode.label}.` : ""}`,
    hasWorkspaceAttachment()
      ? `${workspaceLabel} is attached with ${Array.isArray(appState.workspaceAttachment.signals) && appState.workspaceAttachment.signals.length ? appState.workspaceAttachment.signals.join(", ") : "no detected repo signals"}.`
      : "No workspace is attached. Keep write, verification, and release actions blocked until one local root is selected.",
    patchPlanHasFiles()
      ? `${(appState.patchPlan.files || []).length} patch files are staged. ${unappliedSelectedPatchPlanFiles().length} selected files still require explicit apply.`
      : "No patch review is staged yet. Use the dock artifact or workflow output to promote one into local review.",
    verificationState.detail,
    hasReleasePacketArtifact()
      ? `Release packet history holds ${packetCount} ${packetCount === 1 ? "snapshot" : "snapshots"} for the current workspace.`
      : "Release packet history is empty. Build a packet only after the selected checks match the intended ship surface."
  ];

  return {
    focus,
    capability,
    nextAction,
    hints
  };
}

function getIntelKnowledgeEntries() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const releaseModel = getReleaseCockpitModel();
  const verificationState = describeVerificationPlanState();
  const patchGroups = patchPlanHasFiles() ? collectPatchPlanGroups(appState.patchPlan) : [];
  const entries = [
    {
      title: "Workflow Surface",
      tone: normalizeWorkflowId(appState.workflowId) === "release_audit" ? "good" : "ok",
      state: (workflow && workflow.title) || "Workflow",
      note: outputMode
        ? `${outputMode.label} contract is active. ${hasArtifactContent() ? "A dock artifact is staged for promotion." : "No artifact is staged yet."}`
        : "No output contract is assigned."
    },
    {
      title: "Workspace Context",
      tone: hasWorkspaceAttachment() ? "good" : "warn",
      state: hasWorkspaceAttachment() ? String(appState.workspaceAttachment.label || "Attached workspace") : "No workspace",
      note: hasWorkspaceAttachment()
        ? `Signals: ${Array.isArray(appState.workspaceAttachment.signals) && appState.workspaceAttachment.signals.length ? appState.workspaceAttachment.signals.join(", ") : "none detected"} | Attached ${formatTimestampLabel(appState.workspaceAttachment.attachedAt)}`
        : "Attach one local root before applying edits, exporting evidence, or running release checks."
    },
    {
      title: "Patch Review",
      tone: patchPlanHasFiles() ? "ok" : "guard",
      state: patchPlanHasFiles() ? `${(appState.patchPlan.files || []).length} files / ${patchGroups.length || 1} groups` : "No patch plan",
      note: patchPlanHasFiles()
        ? `${unappliedSelectedPatchPlanFiles().length} selected files still need explicit apply. ${patchPlanPreviewReady() ? "Preview diffs are loaded." : "Preview the diffs before apply."}`
        : "Promote a structured patch artifact to stage grouped review."
    },
    {
      title: "Verification Lane",
      tone: verificationState.tone,
      state: verificationState.summary,
      note: verificationState.detail
    },
    {
      title: "Release Cockpit",
      tone: releaseModel.failed ? "warn" : releaseModel.packetReady ? "good" : releaseModel.passed ? "ok" : "guard",
      state: hasReleasePacketArtifact()
        ? `${Array.isArray(appState.releasePacketHistory) ? appState.releasePacketHistory.length : 0} packet snapshots`
        : `${releaseModel.selected.length}/${releaseModel.rows.length} selected checks`,
      note: releaseModel.summary
    },
    {
      title: "Session Recall",
      tone: Array.isArray(appState.sessionsIndex) && appState.sessionsIndex.length ? "ok" : "guard",
      state: Array.isArray(appState.sessionsIndex) && appState.sessionsIndex.length
        ? `${appState.sessionsIndex.length} indexed sessions`
        : "No saved sessions",
      note: String((el.sessionName && el.sessionName.value) || "").trim()
        ? `Active target: ${String(el.sessionName.value || "").trim()}`
        : "Save a snapshot when this workflow needs a stable handoff."
    }
  ];
  return entries;
}

function getIntelCapabilityCards() {
  const verificationState = describeVerificationPlanState();
  const releaseModel = getReleaseCockpitModel();
  const latestPacket = Array.isArray(appState.releasePacketHistory) && appState.releasePacketHistory.length
    ? appState.releasePacketHistory[0]
    : null;
  return [
    {
      title: "Workspace Context",
      tone: hasWorkspaceAttachment() ? "good" : "warn",
      status: hasWorkspaceAttachment() ? "Attached" : "Detached",
      detail: hasWorkspaceAttachment()
        ? "Context, apply, and export surfaces are bounded to one local root."
        : "No local root is attached, so write and release lanes should remain guarded.",
      target: hasWorkspaceAttachment()
        ? String(appState.workspaceAttachment.rootPath || appState.workspaceAttachment.label || "Attached workspace")
        : "Select one local workspace root",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: hasWorkspaceAttachment() ? "Context ready" : "Context blocked", tone: hasWorkspaceAttachment() ? "good" : "warn" }
      ]
    },
    {
      title: "Artifact Dock",
      tone: hasArtifactContent() ? "good" : "guard",
      status: hasArtifactContent() ? "Artifact staged" : "No artifact",
      detail: hasArtifactContent()
        ? "The active dock artifact can be promoted into patch review, verification, evidence, or release packet work."
        : "Generate a structured workflow artifact before promoting any downstream action.",
      target: appState.lastArtifact && appState.lastArtifact.title
        ? appState.lastArtifact.title
        : "Generate the next artifact",
      scopes: [
        { label: "Read artifact", tone: "read" },
        { label: "Export ready", tone: hasArtifactContent() ? "export" : "guard" }
      ]
    },
    {
      title: "Patch Review",
      tone: patchPlanHasFiles() ? "ok" : "guard",
      status: patchPlanHasFiles() ? `${(appState.patchPlan.files || []).length} files staged` : "No patch plan",
      detail: patchPlanHasFiles()
        ? `${collectPatchPlanGroups(appState.patchPlan).length} grouped surfaces with ${unappliedSelectedPatchPlanFiles().length} selected files still waiting on explicit apply.`
        : "Promote a patch-plan artifact to unlock grouped review, verification staging, and guarded apply.",
      target: patchPlanHasFiles()
        ? `${selectedPatchPlanFiles().length} selected | ${patchPlanPreviewReady() ? "preview ready" : "preview pending"}`
        : "Patch plan surface idle",
      scopes: [
        { label: "Preview first", tone: "guard" },
        { label: "Writes file", tone: "write" },
        { label: "Local only", tone: "local" }
      ]
    },
    {
      title: "Verification Lane",
      tone: verificationState.tone,
      status: verificationState.summary,
      detail: verificationState.detail,
      target: appState.verificationRunPlan
        ? `${appState.verificationRunPlan.groupTitle || "Verification Surface"} | ${appState.verificationRunPlan.rootLabel || appState.verificationRunPlan.rootPath || "workspace"}`
        : "Stage checks from a patch group",
      scopes: [
        { label: "Local scripts", tone: "local" },
        { label: "Explicit run", tone: "guard" },
        { label: "Command preview", tone: "read" }
      ]
    },
    {
      title: "Release Cockpit",
      tone: releaseModel.failed ? "warn" : releaseModel.packetReady ? "good" : releaseModel.passed ? "ok" : "guard",
      status: releaseModel.packetReady ? "Packet ready" : releaseModel.title,
      detail: releaseModel.summary,
      target: latestPacket && latestPacket.generatedAt
        ? `Latest packet ${formatTimestampLabel(latestPacket.generatedAt)}`
        : "No packet history yet",
      scopes: [
        { label: "Release checks", tone: "guard" },
        { label: "Evidence export", tone: "export" },
        { label: "Local only", tone: "local" }
      ]
    }
  ];
}

function renderIntelSurface() {
  updateIntelBrief();

  const trayMap = [
    { id: "brief", button: el.intelBriefTrayBtn, panel: el.intelBriefTray },
    { id: "knowledge", button: el.intelKnowledgeTrayBtn, panel: el.intelKnowledgeTray },
    { id: "capability", button: el.intelCapabilityTrayBtn, panel: el.intelCapabilityTray }
  ];
  for (const tray of trayMap) {
    const isActive = appState.intelTray === tray.id;
    if (tray.button) {
      tray.button.classList.toggle("is-active", isActive);
      tray.button.setAttribute("aria-expanded", String(isActive));
    }
    if (tray.panel) {
      tray.panel.classList.toggle("hidden", !isActive);
      tray.panel.hidden = !isActive;
      tray.panel.setAttribute("aria-hidden", String(!isActive));
    }
  }

  const brief = buildIntelBriefModel();
  if (el.intelFocusText) {
    el.intelFocusText.textContent = brief.focus;
  }
  if (el.intelCapabilityText) {
    el.intelCapabilityText.textContent = brief.capability;
  }
  if (el.intelNextActionText) {
    el.intelNextActionText.textContent = brief.nextAction;
  }
  if (el.intelActionHints) {
    el.intelActionHints.innerHTML = "";
    for (const item of brief.hints) {
      const hint = document.createElement("div");
      hint.className = "workspace-action-hint";
      hint.textContent = item;
      el.intelActionHints.appendChild(hint);
    }
  }

  if (el.knowledgeFeed) {
    el.knowledgeFeed.innerHTML = "";
    for (const entry of getIntelKnowledgeEntries()) {
      const item = document.createElement("article");
      item.className = "intel-feed-item";

      const top = document.createElement("div");
      top.className = "intel-feed-top";

      const title = document.createElement("div");
      title.className = "intel-feed-title";
      title.textContent = entry.title;

      const state = createStatusPill(entry.state, entry.tone);

      const note = document.createElement("div");
      note.className = "intel-feed-note";
      note.textContent = entry.note;

      top.appendChild(title);
      top.appendChild(state);
      item.appendChild(top);
      item.appendChild(note);
      el.knowledgeFeed.appendChild(item);
    }
  }

  if (el.capabilityGraph) {
    el.capabilityGraph.innerHTML = "";
    for (const cardModel of getIntelCapabilityCards()) {
      const card = document.createElement("article");
      card.className = "intel-capability-card";

      const head = document.createElement("div");
      head.className = "workspace-action-card-head";

      const copy = document.createElement("div");
      copy.className = "workspace-action-card-copy";
      const title = document.createElement("div");
      title.className = "workflow-title-text";
      title.textContent = cardModel.title;
      const description = document.createElement("p");
      description.textContent = cardModel.detail;
      copy.appendChild(title);
      copy.appendChild(description);
      head.appendChild(copy);
      head.appendChild(createStatusPill(cardModel.status, cardModel.tone));

      const target = document.createElement("div");
      target.className = "workspace-action-path";
      target.textContent = cardModel.target;

      const scopes = document.createElement("div");
      scopes.className = "trust-scope-row";
      appendScopePills(scopes, cardModel.scopes);

      card.appendChild(head);
      card.appendChild(target);
      card.appendChild(scopes);
      el.capabilityGraph.appendChild(card);
    }
  }
}

function setSessionsTray(nextTray, options = {}) {
  const normalized = String(nextTray || "").trim().toLowerCase();
  const resolved = normalized === "inspect" ? "inspect" : "manage";
  appState.sessionsTray = options.toggle && appState.sessionsTray === resolved ? "none" : resolved;
  renderSessionsTrays();
}

function renderSessionsTrays() {
  const trayMap = [
    { id: "manage", button: el.sessionManageTrayBtn, panel: el.sessionManageTray },
    { id: "inspect", button: el.sessionInspectTrayBtn, panel: el.sessionInspectTray }
  ];
  for (const tray of trayMap) {
    const isActive = appState.sessionsTray === tray.id;
    if (tray.button) {
      tray.button.classList.toggle("is-active", isActive);
      tray.button.setAttribute("aria-expanded", String(isActive));
    }
    if (tray.panel) {
      tray.panel.classList.toggle("hidden", !isActive);
      tray.panel.hidden = !isActive;
      tray.panel.setAttribute("aria-hidden", String(!isActive));
    }
  }
}

function setCommandsTray(nextTray, options = {}) {
  const normalized = String(nextTray || "").trim().toLowerCase();
  const resolved = normalized === "routing" ? "routing" : "index";
  appState.commandsTray = options.toggle && appState.commandsTray === resolved ? "none" : resolved;
  renderCommandsTray();
}

function renderCommandsTray() {
  const trayMap = [
    { id: "index", button: el.commandIndexTrayBtn, panel: el.commandIndexTray },
    { id: "routing", button: el.commandRoutingTrayBtn, panel: el.commandRoutingTray }
  ];
  for (const tray of trayMap) {
    const isActive = appState.commandsTray === tray.id;
    if (tray.button) {
      tray.button.classList.toggle("is-active", isActive);
      tray.button.setAttribute("aria-expanded", String(isActive));
    }
    if (tray.panel) {
      tray.panel.classList.toggle("hidden", !isActive);
      tray.panel.hidden = !isActive;
      tray.panel.setAttribute("aria-hidden", String(!isActive));
    }
  }
}

function parsePatchPlanFromArtifactContent(content, options = {}) {
  const candidate = extractJsonCandidate(content);
  if (!candidate) {
    throw new Error("Artifact content is empty.");
  }
  const parsed = JSON.parse(candidate);
  const payload = parsed && typeof parsed === "object" && parsed.patchPlan ? parsed.patchPlan : parsed;
  return normalizePatchPlanValue(payload, options);
}

function patchPlanFilenameBase() {
  const plan = appState.patchPlan;
  const workflowId = normalizeWorkflowId(plan && plan.workflowId ? plan.workflowId : appState.workflowId);
  return `neuralshell-${slugifySegment(workflowId, "patch-plan")}-patch-plan-${formatFileStamp(plan && plan.generatedAt ? plan.generatedAt : new Date().toISOString())}`;
}

function patchPlanAsJson() {
  return JSON.stringify(appState.patchPlan || {}, null, 2);
}

function patchPlanAsMarkdown() {
  const plan = appState.patchPlan;
  if (!plan || !Array.isArray(plan.files) || !plan.files.length) return "";
  const lines = [
    `# ${plan.title || "Patch Plan"}`,
    "",
    `- Workflow: ${(getWorkflow(plan.workflowId) || {}).title || plan.workflowId || normalizeWorkflowId(appState.workflowId)}`,
    `- Files: ${plan.totalFiles || plan.files.length}`,
    `- New: ${plan.newFiles || 0}`,
    `- Modified: ${plan.modifiedFiles || 0}`,
    `- Generated: ${plan.generatedAt || new Date().toISOString()}`,
    ""
  ];
  if (plan.summary) {
    lines.push(plan.summary, "");
  }
  if (Array.isArray(plan.verification) && plan.verification.length) {
    lines.push("## Verification");
    for (const step of plan.verification) lines.push(`- ${step}`);
    lines.push("");
  }
  lines.push("## Files");
  for (const file of plan.files) {
    lines.push(`- ${file.path} (${file.status || "pending"})`);
    if (file.rationale) lines.push(`  - ${file.rationale}`);
  }
  return lines.join("\n");
}

function resetPatchPlanState() {
  appState.patchPlan = null;
  appState.patchPlanPreviewFileId = "";
  appState.patchPlanGroupOpenIds = null;
  appState.verificationRunPlan = null;
}

function setPatchPlan(value, options = {}) {
  appState.patchPlan = value ? normalizePatchPlanValue(value, options) : null;
  appState.patchPlanPreviewFileId = appState.patchPlan && appState.patchPlan.files[0]
    ? appState.patchPlan.files[0].fileId
    : "";
  appState.patchPlanGroupOpenIds = null;
  appState.verificationRunPlan = null;
  renderPatchPlanPanel();
}

function syncPatchPlanFromArtifact() {
  if (!appState.lastArtifact || normalizeOutputMode(appState.outputMode, appState.workflowId) !== "patch_plan") {
    resetPatchPlanState();
    renderPatchPlanPanel();
    return;
  }
  try {
    appState.patchPlan = parsePatchPlanFromArtifactContent(appState.lastArtifact.content, {
      generatedAt: appState.lastArtifact.generatedAt,
      workflowId: appState.workflowId
    });
    appState.patchPlanGroupOpenIds = null;
    appState.verificationRunPlan = null;
    const firstFile = appState.patchPlan.files[0];
    appState.patchPlanPreviewFileId = firstFile ? firstFile.fileId : "";
  } catch {
    resetPatchPlanState();
  }
  renderPatchPlanPanel();
}

function syncArtifactFromChat() {
  const assistant = lastAssistant();
  if (!assistant || !String(assistant.content || "").trim()) {
    resetPatchPlanState();
    renderPatchPlanPanel();
    renderArtifactPanel();
    return;
  }
  appState.lastArtifact = buildArtifactRecord(assistant.content);
  resetWorkspaceActions();
  syncPatchPlanFromArtifact();
  renderArtifactPanel();
}

function artifactAsMarkdown() {
  const artifact = appState.lastArtifact;
  const workflow = getWorkflow(artifact && artifact.workflowId ? artifact.workflowId : appState.workflowId);
  const outputMode = getOutputMode(artifact && artifact.outputMode ? artifact.outputMode : appState.outputMode);
  if (!artifact || !artifact.content) return "";
  return [
    `# ${artifact.title || (workflow ? workflow.title : "Artifact")}`,
    "",
    `- Workflow: ${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)}`,
    `- Output Mode: ${(outputMode && outputMode.label) || normalizeOutputMode(appState.outputMode, appState.workflowId)}`,
    `- Generated: ${artifact.generatedAt || new Date().toISOString()}`,
    "",
    artifact.content
  ].join("\n");
}

function artifactAsJson() {
  return JSON.stringify(appState.lastArtifact || buildArtifactRecord(""), null, 2);
}

async function copyArtifactToClipboard() {
  const artifact = appState.lastArtifact;
  const ok = await copyText(artifact && artifact.content ? artifact.content : "");
  showBanner(ok ? "Artifact copied." : "No artifact to copy.", ok ? "ok" : "bad");
}

function exportArtifactMarkdown() {
  const content = artifactAsMarkdown();
  if (!content) {
    showBanner("No artifact to export.", "bad");
    return;
  }
  download(`${artifactFilenameBase()}.md`, content, "text/markdown;charset=utf-8");
  showBanner("Artifact markdown exported.", "ok");
}

function exportArtifactJson() {
  const artifact = appState.lastArtifact;
  if (!artifact || !artifact.content) {
    showBanner("No artifact to export.", "bad");
    return;
  }
  download(`${artifactFilenameBase()}.json`, artifactAsJson(), "application/json;charset=utf-8");
  showBanner("Artifact JSON exported.", "ok");
}

async function saveArtifactSessionSnapshot() {
  const name = String((el.sessionName && el.sessionName.value) || "").trim();
  const pass = String((el.sessionPass && el.sessionPass.value) || "").trim();
  if (!name || !pass) {
    showBanner("Session name and passphrase are required.", "bad");
    return;
  }
  await window.api.session.save(name, {
    model: appState.model,
    chat: appState.chat,
    workflowId: appState.workflowId,
    outputMode: appState.outputMode,
    workspaceAttachment: appState.workspaceAttachment,
    lastArtifact: appState.lastArtifact,
    releasePacketHistory: appState.releasePacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
    verificationRunPlan: appState.verificationRunPlan,
    settings: appState.settings,
    updatedAt: new Date().toISOString()
  }, pass);
  await refreshSessions();
  showBanner(`Session snapshot saved: ${name}`, "ok");
}

async function exportEvidenceBundle() {
  const bundle = await buildEvidenceBundle();
  download(
    getEvidenceBundleFilename(),
    JSON.stringify(bundle, null, 2),
    "application/json;charset=utf-8"
  );
  showBanner("Evidence bundle exported.", "ok");
  return bundle;
}

function resetWorkspaceActions(clearHistory = true) {
  appState.workspaceActionPreview = null;
  if (clearHistory) {
    appState.workspaceActionHistory = {};
  }
}

function hasArtifactContent() {
  return Boolean(appState.lastArtifact && String(appState.lastArtifact.content || "").trim());
}

function hasWorkspaceAttachment() {
  return Boolean(appState.workspaceAttachment && String(appState.workspaceAttachment.rootPath || "").trim());
}

function patchPlanPreviewReady() {
  return Boolean(
    appState.patchPlan &&
    Array.isArray(appState.patchPlan.files) &&
    appState.patchPlan.files.some((file) => (
      String(file && file.diffText ? file.diffText : "").trim() ||
      String(file && file.absolutePath ? file.absolutePath : "").trim()
    ))
  );
}

function selectedPatchPlanFiles() {
  if (!patchPlanHasFiles()) return [];
  return appState.patchPlan.files.filter((file) => file.selected !== false);
}

function unappliedSelectedPatchPlanFiles() {
  return selectedPatchPlanFiles().filter((file) => !String(file && file.appliedAt ? file.appliedAt : "").trim());
}

function hasWorkspaceActionPreview() {
  return Boolean(appState.workspaceActionPreview && appState.workspaceActionPreview.request);
}

function workspaceDraftReady() {
  const draft = appState.workspaceEditDraft || {};
  return Boolean(String(draft.content || "").trim());
}

function artifactLooksLikePatchPlan() {
  if (!hasArtifactContent()) return false;
  try {
    parsePatchPlanFromArtifactContent(appState.lastArtifact.content, {
      workflowId: appState.workflowId
    });
    return true;
  } catch {
    return false;
  }
}

function operatorPhaseTone(tone) {
  const normalized = String(tone || "").trim().toLowerCase();
  return normalized || "ok";
}

function createScopePill(scope) {
  const pill = document.createElement("span");
  pill.className = "operator-scope-pill";
  pill.dataset.tone = String(scope && scope.tone ? scope.tone : "guard");
  pill.textContent = String(scope && scope.label ? scope.label : "");
  return pill;
}

function appendScopePills(container, scopes) {
  const list = Array.isArray(scopes) ? scopes : [];
  for (const scope of list) {
    container.appendChild(createScopePill(scope));
  }
}

function createStatusPill(label, tone = "ok") {
  const pill = document.createElement("span");
  pill.className = "operator-action-status workspace-action-state";
  pill.dataset.tone = String(tone || "ok");
  pill.textContent = String(label || "");
  return pill;
}

function describeWorkspaceProposalState(proposal, previewReady, appliedAt, actionable) {
  if (appliedAt) {
    return {
      label: `Applied ${formatTimestampLabel(appliedAt)}`,
      tone: "good"
    };
  }
  if (previewReady) {
    return {
      label: "Preview ready",
      tone: "ok"
    };
  }
  if (!actionable) {
    return {
      label: "Awaiting artifact",
      tone: "warn"
    };
  }
  if (proposal && proposal.kind === "evidence_bundle_json") {
    return {
      label: "Archive ready",
      tone: "ok"
    };
  }
  return {
    label: "Ready to preview",
    tone: "guard"
  };
}

function getWorkspaceProposalScopes(proposal) {
  const scopes = [
    { label: "Local only", tone: "local" },
    { label: "Preview first", tone: "guard" }
  ];
  if (proposal && proposal.requiresArtifact) {
    scopes.push({ label: "Reads artifact", tone: "read" });
  }
  if (proposal && proposal.kind === "evidence_bundle_json") {
    scopes.push({ label: "Export", tone: "export" });
  } else {
    scopes.push({ label: "Writes file", tone: "write" });
  }
  return scopes;
}

function describePatchPlanFileState(file) {
  if (file && file.appliedAt) {
    return {
      label: `Applied ${formatTimestampLabel(file.appliedAt)}`,
      tone: "good"
    };
  }
  if (file && file.selected === false) {
    return {
      label: "Deselected",
      tone: "warn"
    };
  }
  if (file && String(file.diffText || "").trim()) {
    return {
      label: "Reviewed diff",
      tone: "ok"
    };
  }
  if (file && String(file.status || "").trim()) {
    return {
      label: `${String(file.status).toUpperCase()} queued`,
      tone: "guard"
    };
  }
  return {
    label: "Awaiting preview",
    tone: "warn"
  };
}

function getPatchPlanFileScopes(file) {
  return [
    { label: "Local only", tone: "local" },
    { label: "Writes file", tone: "write" },
    { label: "Explicit apply", tone: "guard" },
    { label: file && file.selected === false ? "Excluded" : "Selected", tone: "read" }
  ];
}

function getPatchPlanGroupDescriptor(file) {
  const relativePath = String(file && file.path ? file.path : "").trim().replace(/\\/g, "/").toLowerCase();
  if (
    relativePath.endsWith(".md")
    || relativePath.endsWith(".txt")
    || relativePath.includes("docs/")
    || relativePath.startsWith("readme")
  ) {
    return {
      id: "documentation",
      title: "Documentation Surface",
      note: "Docs, handoff notes, prompts, and exported copy that shape the operator-facing story."
    };
  }
  if (
    relativePath.includes("e2e/")
    || relativePath.includes("tests/")
    || relativePath.includes("tear/")
    || relativePath.includes("scripts/")
    || relativePath.endsWith(".spec.js")
  ) {
    return {
      id: "automation",
      title: "Automation Surface",
      note: "Test, capture, and automation files that validate or package the product flow."
    };
  }
  if (
    relativePath.includes("renderer")
    || relativePath.endsWith(".html")
    || relativePath.endsWith(".css")
  ) {
    return {
      id: "interface",
      title: "Interface Surface",
      note: "Renderer, layout, and styling files that change the operator-facing product surface."
    };
  }
  if (
    relativePath.includes("src/main")
    || relativePath.includes("src/preload")
    || relativePath.includes("src/core/")
    || relativePath.includes("ipc")
    || relativePath.includes("security")
    || relativePath.includes("kernel/")
    || relativePath === "package.json"
  ) {
    return {
      id: "runtime",
      title: "Runtime Surface",
      note: "Bridge, IPC, and guarded execution files with broader application blast radius."
    };
  }
  return {
    id: "project",
    title: "Project Surface",
    note: "General project files that do not fit a narrower surface bucket."
  };
}

function patchPlanGroupSortValue(groupId) {
  const order = {
    runtime: 0,
    interface: 1,
    automation: 2,
    documentation: 3,
    project: 4
  };
  return Object.prototype.hasOwnProperty.call(order, String(groupId || "").trim())
    ? order[String(groupId || "").trim()]
    : 99;
}

function riskToneRank(tone) {
  const normalized = String(tone || "").trim().toLowerCase();
  if (normalized === "warn") return 3;
  if (normalized === "ok") return 2;
  if (normalized === "good") return 1;
  return 0;
}

function collectPatchPlanGroups(plan) {
  if (!plan || !Array.isArray(plan.files)) return [];
  const groups = new Map();
  for (const file of plan.files) {
    const descriptor = getPatchPlanGroupDescriptor(file);
    const risk = getPatchPlanFileRisk(file);
    let group = groups.get(descriptor.id);
    if (!group) {
      group = {
        ...descriptor,
        files: [],
        selectedCount: 0,
        unappliedCount: 0,
        reviewedCount: 0,
        highestRisk: risk,
        highestRiskRank: riskToneRank(risk.tone)
      };
      groups.set(descriptor.id, group);
    }
    group.files.push(file);
    if (file.selected !== false) group.selectedCount += 1;
    if (file.selected !== false && !String(file.appliedAt || "").trim()) group.unappliedCount += 1;
    if (String(file.diffText || "").trim()) group.reviewedCount += 1;
    const nextRiskRank = riskToneRank(risk.tone);
    if (nextRiskRank > group.highestRiskRank) {
      group.highestRisk = risk;
      group.highestRiskRank = nextRiskRank;
    }
  }
  return Array.from(groups.values()).sort((a, b) => {
    const byOrder = patchPlanGroupSortValue(a.id) - patchPlanGroupSortValue(b.id);
    if (byOrder !== 0) return byOrder;
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

function getPatchPlanOpenGroupSet(groups) {
  const ids = Array.isArray(groups) ? groups.map((group) => group.id) : [];
  if (!Array.isArray(appState.patchPlanGroupOpenIds)) {
    appState.patchPlanGroupOpenIds = ids;
  } else {
    appState.patchPlanGroupOpenIds = appState.patchPlanGroupOpenIds.filter((id) => ids.includes(id));
  }
  return new Set(appState.patchPlanGroupOpenIds);
}

function togglePatchPlanGroup(groupId) {
  if (!patchPlanHasFiles()) return;
  if (!Array.isArray(appState.patchPlanGroupOpenIds)) {
    appState.patchPlanGroupOpenIds = collectPatchPlanGroups(appState.patchPlan).map((group) => group.id);
  }
  const normalized = String(groupId || "").trim();
  if (!normalized) return;
  if (appState.patchPlanGroupOpenIds.includes(normalized)) {
    appState.patchPlanGroupOpenIds = appState.patchPlanGroupOpenIds.filter((id) => id !== normalized);
  } else {
    appState.patchPlanGroupOpenIds = [...appState.patchPlanGroupOpenIds, normalized];
  }
  renderPatchPlanPanel();
}

function getPatchPlanGroupById(groupId) {
  if (!patchPlanHasFiles()) return null;
  const normalized = String(groupId || "").trim();
  if (!normalized) return null;
  return collectPatchPlanGroups(appState.patchPlan).find((group) => group.id === normalized) || null;
}

function getPatchPlanGroupVerificationPlan(group) {
  const current = group && typeof group === "object" ? group : {};
  switch (String(current.id || "").trim()) {
    case "documentation":
      return {
        checks: [
          "Review copy and exported artifact output.",
          "Refresh screenshots only if store-visible wording changed."
        ],
        promptLead: "Verify the documentation and narrative surfaces for clarity, accuracy, and store-facing consistency."
      };
    case "interface":
      return {
        checks: [
          "Run lint and founder e2e after apply.",
          "Verify workflow, patch-plan, and apply surfaces in the desktop UI."
        ],
        promptLead: "Verify the interface changes for layout quality, interaction safety, and visual regressions."
      };
    case "runtime":
      return {
        checks: [
          "Run lint and founder e2e after apply.",
          "Verify bridge, IPC, and guarded local-write behavior manually."
        ],
        promptLead: "Verify the runtime and guarded execution surfaces for safety, bridge health, and regression risk."
      };
    case "automation":
      return {
        checks: [
          "Run the affected automation path after apply.",
          "Confirm seeded copy and assertions still match the UI flow."
        ],
        promptLead: "Verify the automation and test surfaces against the current product flow and seeded data."
      };
    default:
      return {
        checks: [
          "Run lint and the most relevant local verification path.",
          "Check the touched surface manually before exporting evidence."
        ],
        promptLead: "Verify the grouped project surfaces and summarize pass/fail, residual risks, and next actions."
      };
  }
}

function patchPlanGroupVerificationText(group) {
  const plan = getPatchPlanGroupVerificationPlan(group);
  const lines = [
    `${group && group.title ? group.title : "Patch Group"} verification`,
    ...plan.checks.map((check, index) => `${index + 1}. ${check}`)
  ];
  return lines.join("\n");
}

function buildPatchPlanVerificationPrompt(payload = {}) {
  const title = String(payload.title || "Patch Group").trim() || "Patch Group";
  const filePaths = Array.isArray(payload.filePaths)
    ? payload.filePaths.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const checks = Array.isArray(payload.checks)
    ? payload.checks.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const promptLead = String(
    payload.promptLead || "Verify the selected changes for correctness, regression risk, and required next actions."
  ).trim();
  return [
    promptLead,
    "",
    `Patch group: ${title}`,
    `Files: ${filePaths.length ? filePaths.join(", ") : "Use the current attached workspace context."}`,
    "",
    "Checks:",
    ...checks.map((check, index) => `${index + 1}. ${check}`),
    "",
    "Return pass/fail status, regressions found, and the next required actions."
  ].join("\n");
}

function getPromotedPaletteActionByGroup(groupId, workflowId = appState.workflowId) {
  const shortcutId = getPromotedPaletteActionId(workflowId, groupId);
  return (appState.promotedPaletteActions || []).find((action) => action.id === shortcutId) || null;
}

function patchPlanGroupHasPromotedShortcut(groupId, workflowId = appState.workflowId) {
  return Boolean(getPromotedPaletteActionByGroup(groupId, workflowId));
}

function loadPatchPlanGroupVerificationPrompt(groupId) {
  const group = getPatchPlanGroupById(groupId);
  if (!group) {
    throw new Error("Patch group is unavailable.");
  }
  if (!el.promptInput) {
    throw new Error("Prompt input is unavailable.");
  }
  const plan = getPatchPlanGroupVerificationPlan(group);
  const prompt = buildPatchPlanVerificationPrompt({
    title: group.title,
    filePaths: group.files.map((file) => file.path),
    checks: plan.checks,
    promptLead: plan.promptLead
  });
  el.promptInput.value = prompt;
  updatePromptMetrics();
  updateCommandHint();
  el.promptInput.focus();
  showBanner(`Verification prompt loaded: ${group.title}`, "ok");
}

async function copyPatchPlanGroupVerificationChecks(groupId) {
  const group = getPatchPlanGroupById(groupId);
  if (!group) {
    throw new Error("Patch group is unavailable.");
  }
  const ok = await copyText(patchPlanGroupVerificationText(group));
  showBanner(ok ? `Verification checks copied: ${group.title}` : "Verification copy failed.", ok ? "ok" : "bad");
}

async function setPromotedPaletteActions(nextActions, options = {}) {
  appState.promotedPaletteActions = normalizePromotedPaletteActions(nextActions);
  renderPatchPlanPanel();
  renderCommandPaletteList();
  if (options.persist !== false) {
    await persistChatState();
  }
}

async function setCommandPaletteShortcutScope(scope, options = {}) {
  appState.commandPaletteShortcutScope = normalizeCommandPaletteShortcutScope(scope);
  if (el.commandPaletteShortcutScope) {
    el.commandPaletteShortcutScope.value = appState.commandPaletteShortcutScope;
  }
  renderCommandPaletteList();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(
      appState.commandPaletteShortcutScope === "all"
        ? "Palette shortcut scope: all workflows"
        : "Palette shortcut scope: current workflow",
      "ok"
    );
  }
}

async function promotePatchPlanGroupToPalette(groupId) {
  const group = getPatchPlanGroupById(groupId);
  if (!group) {
    throw new Error("Patch group is unavailable.");
  }
  const verificationPlan = getPatchPlanGroupVerificationPlan(group);
  const workflow = getWorkflow(appState.workflowId);
  const shortcut = normalizePromotedPaletteAction({
    workflowId: appState.workflowId,
    groupId: group.id,
    groupTitle: group.title,
    label: `Verify ${group.title}`,
    detail: `${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)} shortcut | ${group.files.length} files | ${verificationPlan.checks[0] || "Load recommended checks"}`,
    promptLead: verificationPlan.promptLead,
    checks: verificationPlan.checks,
    filePaths: group.files.map((file) => file.path),
    promotedAt: new Date().toISOString()
  });
  const existed = patchPlanGroupHasPromotedShortcut(group.id, appState.workflowId);
  await setPromotedPaletteActions([
    shortcut,
    ...(appState.promotedPaletteActions || []).filter((action) => action.id !== shortcut.id)
  ]);
  showBanner(existed ? `Palette shortcut refreshed: ${group.title}` : `Palette shortcut added: ${group.title}`, "ok");
}

function findPromotedPaletteAction(actionId) {
  const normalized = String(actionId || "").trim();
  if (!normalized) return null;
  return (appState.promotedPaletteActions || []).find((action) => action.id === normalized) || null;
}

function loadPromotedPaletteActionPrompt(actionId) {
  const action = findPromotedPaletteAction(actionId);
  if (!action) {
    throw new Error("Palette shortcut is unavailable.");
  }
  if (!el.promptInput) {
    throw new Error("Prompt input is unavailable.");
  }
  const liveGroup = normalizeWorkflowId(appState.workflowId) === normalizeWorkflowId(action.workflowId)
    ? getPatchPlanGroupById(action.groupId)
    : null;
  const verificationPlan = liveGroup ? getPatchPlanGroupVerificationPlan(liveGroup) : null;
  el.promptInput.value = buildPatchPlanVerificationPrompt({
    title: liveGroup ? liveGroup.title : action.groupTitle,
    filePaths: liveGroup ? liveGroup.files.map((file) => file.path) : action.filePaths,
    checks: verificationPlan ? verificationPlan.checks : action.checks,
    promptLead: verificationPlan ? verificationPlan.promptLead : action.promptLead
  });
  updatePromptMetrics();
  updateCommandHint();
  el.promptInput.focus();
  showBanner(`Palette shortcut loaded: ${action.groupTitle}`, "ok");
}

async function movePromotedPaletteAction(actionId, delta) {
  const normalized = String(actionId || "").trim();
  if (!normalized) {
    throw new Error("Palette shortcut is unavailable.");
  }
  const list = Array.isArray(appState.promotedPaletteActions) ? appState.promotedPaletteActions.slice() : [];
  const index = list.findIndex((action) => action.id === normalized);
  if (index === -1) {
    throw new Error("Palette shortcut is unavailable.");
  }
  const nextIndex = clampNumber(index + Number(delta || 0), 0, list.length - 1, index);
  if (nextIndex === index) {
    return;
  }
  const [action] = list.splice(index, 1);
  list.splice(nextIndex, 0, action);
  await setPromotedPaletteActions(list);
  showBanner(`Palette shortcut reordered: ${action.groupTitle}`, "ok");
}

async function removePromotedPaletteAction(actionId) {
  const action = findPromotedPaletteAction(actionId);
  if (!action) {
    throw new Error("Palette shortcut is unavailable.");
  }
  await setPromotedPaletteActions((appState.promotedPaletteActions || []).filter((item) => item.id !== action.id));
  showBanner(`Palette shortcut removed: ${action.groupTitle}`, "ok");
}

function verificationRunStatusTone(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "passed":
      return "good";
    case "failed":
      return "warn";
    case "running":
      return "ok";
    default:
      return "guard";
  }
}

function setVerificationRunPlan(plan, options = {}) {
  appState.verificationRunPlan = plan ? normalizeVerificationRunPlanValue(plan, options) : null;
  renderPatchPlanPanel();
  if (options.persist !== false) {
    persistChatState().catch(() => {});
  }
}

function clearVerificationRunPlan(options = {}) {
  appState.verificationRunPlan = null;
  renderPatchPlanPanel();
  if (options.persist !== false) {
    persistChatState().catch(() => {});
  }
  if (options.announce !== false) {
    showBanner("Verification run plan cleared.", "ok");
  }
}

function setVerificationRunCheckSelection(checkId, selected) {
  if (!appState.verificationRunPlan || !Array.isArray(appState.verificationRunPlan.checks)) return;
  appState.verificationRunPlan.checks = appState.verificationRunPlan.checks.map((check) => (
    check.id === checkId
      ? { ...check, selected: Boolean(selected) }
      : check
  ));
  renderPatchPlanPanel();
  persistChatState().catch(() => {});
}

function stageVerificationRunPlanForGroup(groupId) {
  if (!hasWorkspaceAttachment()) {
    throw new Error("Attach a workspace before staging verification runs.");
  }
  const group = getPatchPlanGroupById(groupId);
  if (!group) {
    throw new Error("Patch group is unavailable.");
  }
  const checks = verificationChecksForGroup(group.id).map((check) => ({
    id: check.id,
    selected: true
  }));
  if (!checks.length) {
    throw new Error("No runnable verification checks are configured for this group.");
  }
  setVerificationRunPlan({
    id: `verification-${normalizeWorkflowId(appState.workflowId)}-${group.id}`,
    groupId: group.id,
    groupTitle: group.title,
    workflowId: appState.workflowId,
    rootPath: String(appState.workspaceAttachment.rootPath || ""),
    rootLabel: String(appState.workspaceAttachment.label || ""),
    preparedAt: new Date().toISOString(),
    checks
  });
  showBanner(`Verification run plan staged: ${group.title}`, "ok");
}

function verificationRunCommandsText() {
  const plan = appState.verificationRunPlan;
  if (!plan || !Array.isArray(plan.checks) || !plan.checks.length) {
    throw new Error("Verification run plan is unavailable.");
  }
  return plan.checks
    .filter((check) => check.selected !== false)
    .map((check, index) => `${index + 1}. ${check.commandLabel}`)
    .join("\n");
}

async function copyVerificationRunCommands() {
  const ok = await copyText(verificationRunCommandsText());
  showBanner(ok ? "Verification commands copied." : "Verification command copy failed.", ok ? "ok" : "bad");
}

function formatVerificationRunOutput(plan) {
  if (!plan || !Array.isArray(plan.checks) || !plan.checks.length) {
    return "No verification run plan staged yet.";
  }
  const ranChecks = plan.checks.filter((check) => String(check.lastRunAt || "").trim());
  if (!ranChecks.length) {
    return "No verification checks have been run yet.";
  }
  const lines = [];
  for (const check of ranChecks) {
    lines.push(`[${String(check.status || "pending").toUpperCase()}] ${check.label}`);
    lines.push(`Command: ${check.commandLabel}`);
    if (check.lastRunAt) lines.push(`Completed: ${formatTimestampLabel(check.lastRunAt)}`);
    if (check.exitCode != null) lines.push(`Exit: ${check.exitCode}`);
    if (check.durationMs) lines.push(`Duration: ${Math.max(0, Number(check.durationMs || 0))} ms`);
    if (check.stdout) {
      lines.push("");
      lines.push(check.stdout.trim());
    }
    if (check.stderr) {
      lines.push("");
      lines.push(check.stderr.trim());
    }
    lines.push("");
  }
  return lines.join("\n").trim() || "No verification checks have been run yet.";
}

async function runVerificationRunPlanSelectedChecks() {
  const plan = appState.verificationRunPlan;
  if (!plan || !Array.isArray(plan.checks) || !plan.checks.length) {
    throw new Error("Verification run plan is unavailable.");
  }
  if (!verificationPlanMatchesWorkspaceAttachment(plan, appState.workspaceAttachment)) {
    appState.verificationRunPlan = null;
    renderPatchPlanPanel();
    await persistChatState();
    throw new Error("Attach the matching workspace before running this verification plan.");
  }
  const selectedChecks = plan.checks.filter((check) => check.selected !== false);
  if (!selectedChecks.length) {
    throw new Error("Select at least one verification check to run.");
  }
  if (!window.api || !window.api.verification) {
    throw new Error("Verification runner is unavailable.");
  }
  appState.verificationRunPlan = {
    ...plan,
    checks: plan.checks.map((check) => (
      selectedChecks.some((row) => row.id === check.id)
        ? { ...check, status: "running" }
        : check
    ))
  };
  renderPatchPlanPanel();
  let result;
  try {
    result = await window.api.verification.run({
      rootPath: plan.rootPath,
      checkIds: selectedChecks.map((check) => check.id)
    });
  } catch (err) {
    appState.verificationRunPlan = {
      ...plan,
      checks: plan.checks.map((check) => (
        selectedChecks.some((row) => row.id === check.id)
          ? {
              ...check,
              status: "failed",
              lastRunAt: new Date().toISOString(),
              stderr: String(err && err.message ? err.message : err || "Verification run failed.")
            }
          : check
      ))
    };
    renderPatchPlanPanel();
    await persistChatState();
    throw err;
  }
  const resultsById = new Map((Array.isArray(result && result.results) ? result.results : []).map((row) => [row.id, row]));
  appState.verificationRunPlan = {
    ...plan,
    lastRunAt: String((result && result.executedAt) || new Date().toISOString()),
    checks: plan.checks.map((check) => {
      const next = resultsById.get(check.id);
      if (!next) return check;
      return {
        ...check,
        status: next.ok ? "passed" : "failed",
        lastRunAt: String(next.completedAt || result.executedAt || new Date().toISOString()),
        exitCode: next.exitCode == null ? null : Number(next.exitCode),
        durationMs: Number(next.durationMs || 0),
        stdout: String(next.stdout || ""),
        stderr: String(next.stderr || "")
      };
    })
  };
  renderPatchPlanPanel();
  await persistChatState();
  showBanner(result && result.ok ? "Verification run complete." : "Verification run completed with failures.", result && result.ok ? "ok" : "bad");
}

function stageReleaseCockpit() {
  if (!hasWorkspaceAttachment()) {
    throw new Error("Attach a workspace before staging release verification.");
  }
  const checks = getReleaseVerificationSpecs().map((check) => ({
    id: check.id,
    selected: true
  }));
  if (!checks.length) {
    throw new Error("Release verification checks are unavailable.");
  }
  setVerificationRunPlan({
    id: `release-cockpit-${normalizeWorkflowId(appState.workflowId)}`,
    groupId: "release_cockpit",
    groupTitle: "Release Cockpit",
    workflowId: appState.workflowId,
    rootPath: String(appState.workspaceAttachment.rootPath || ""),
    rootLabel: String(appState.workspaceAttachment.label || ""),
    preparedAt: new Date().toISOString(),
    checks
  });
  showBanner("Release cockpit staged.", "ok");
}

async function runReleaseCockpitChecks() {
  if (!getReleaseCockpitPlan()) {
    stageReleaseCockpit();
  }
  await runVerificationRunPlanSelectedChecks();
}

async function buildReleasePacketArtifact(options = {}) {
  if (!hasWorkspaceAttachment()) {
    throw new Error("Attach a workspace before building the release packet.");
  }
  const generatedAt = String(options.generatedAt || new Date().toISOString());
  appState.lastArtifact = pushReleasePacketHistoryEntry({
    title: "Release Packet",
    workflowId: normalizeWorkflowId(appState.workflowId),
    outputMode: "release_packet",
    content: buildReleasePacketContent({ generatedAt }),
    generatedAt
  });
  renderArtifactPanel();
  renderReleaseCockpit();
  renderOperatorRail();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Release packet built.", "ok");
  }
  return appState.lastArtifact;
}

function openReleasePalette() {
  setCommandPaletteOpen(true);
  if (el.commandPaletteInput) {
    el.commandPaletteInput.value = "Release";
    renderCommandPaletteList();
    el.commandPaletteInput.focus();
  }
}

function renderReleaseCockpit() {
  const model = getReleaseCockpitModel();
  if (el.releaseCockpitTitleText) {
    el.releaseCockpitTitleText.textContent = model.title;
  }
  if (el.releaseCockpitSummaryText) {
    el.releaseCockpitSummaryText.textContent = model.summary;
  }
  if (el.releaseCockpitMetaRow) {
    el.releaseCockpitMetaRow.innerHTML = "";
    el.releaseCockpitMetaRow.appendChild(createStatusPill(model.workflowTitle, normalizeWorkflowId(appState.workflowId) === "release_audit" ? "good" : "guard"));
    el.releaseCockpitMetaRow.appendChild(createStatusPill(
      hasWorkspaceAttachment() ? String(appState.workspaceAttachment.label || "Workspace attached") : "No workspace",
      hasWorkspaceAttachment() ? "good" : "warn"
    ));
    el.releaseCockpitMetaRow.appendChild(createStatusPill(`${model.selected.length}/${model.rows.length} selected`, model.selected.length ? "ok" : "warn"));
    el.releaseCockpitMetaRow.appendChild(createStatusPill(hasArtifactContent() ? "Artifact ready" : "No artifact", hasArtifactContent() ? "good" : "guard"));
    el.releaseCockpitMetaRow.appendChild(createStatusPill(model.packetReady ? "Packet built" : "Packet pending", model.packetReady ? "good" : "guard"));
    if (model.running) {
      el.releaseCockpitMetaRow.appendChild(createStatusPill(`${model.running} running`, "ok"));
    } else if (model.failed) {
      el.releaseCockpitMetaRow.appendChild(createStatusPill(`${model.failed} failed`, "warn"));
    } else if (model.passed) {
      el.releaseCockpitMetaRow.appendChild(createStatusPill(`${model.passed} passed`, model.pending === 0 ? "good" : "ok"));
    } else {
      el.releaseCockpitMetaRow.appendChild(createStatusPill(`${model.pending} pending`, "guard"));
    }
  }
  if (el.releaseCockpitChecklist) {
    el.releaseCockpitChecklist.innerHTML = "";
    for (const item of model.checklist) {
      const row = document.createElement("div");
      row.className = "workspace-action-hint";
      row.textContent = item;
      el.releaseCockpitChecklist.appendChild(row);
    }
  }
  if (el.releaseCockpitStatusList) {
    el.releaseCockpitStatusList.innerHTML = "";
    for (const check of model.rows) {
      const card = document.createElement("div");
      card.className = "workspace-action-card";
      if (check.status === "passed") card.classList.add("is-applied");
      if (check.status === "running") card.classList.add("is-previewed");

      const head = document.createElement("div");
      head.className = "workspace-action-card-head";
      const copy = document.createElement("div");
      copy.className = "workspace-action-card-copy";
      const title = document.createElement("div");
      title.className = "workflow-title-text";
      title.textContent = check.label;
      const description = document.createElement("p");
      description.textContent = check.description || check.commandLabel;
      copy.appendChild(title);
      copy.appendChild(description);
      head.appendChild(copy);
      head.appendChild(createStatusPill(
        check.selected === false ? "Skipped" : check.status === "passed" ? "Passed" : check.status === "failed" ? "Failed" : check.status === "running" ? "Running" : "Ready",
        check.selected === false ? "guard" : verificationRunStatusTone(check.status)
      ));

      const meta = document.createElement("div");
      meta.className = "trust-scope-row";
      meta.appendChild(createStatusPill(check.commandLabel, "guard"));
      appendScopePills(meta, check.scopes);
      if (check.selected === false) {
        meta.appendChild(createStatusPill("Deselected", "warn"));
      }
      if (check.exitCode != null) {
        meta.appendChild(createStatusPill(`Exit ${check.exitCode}`, check.exitCode === 0 ? "good" : "warn"));
      }

      card.appendChild(head);
      card.appendChild(meta);
      el.releaseCockpitStatusList.appendChild(card);
    }
  }
  if (el.stageReleaseCockpitBtn) {
    el.stageReleaseCockpitBtn.disabled = !hasWorkspaceAttachment();
  }
  if (el.runReleaseCockpitBtn) {
    el.runReleaseCockpitBtn.disabled = !hasWorkspaceAttachment() || !model.selected.length;
  }
  if (el.buildReleasePacketBtn) {
    el.buildReleasePacketBtn.disabled = !hasWorkspaceAttachment();
  }
  if (el.exportReleaseEvidenceBtn) {
    el.exportReleaseEvidenceBtn.disabled = !hasWorkspaceAttachment() && !hasArtifactContent() && !appState.chat.length;
  }
  renderIntelSurface();
  renderMissionControl();
}

function getPatchPlanFileRisk(file) {
  const relativePath = String(file && file.path ? file.path : "").trim().toLowerCase();
  const lineCount = Number(file && file.lines ? file.lines : 0);
  const isDocSurface = relativePath.endsWith(".md")
    || relativePath.endsWith(".txt")
    || relativePath.includes("docs/")
    || relativePath.startsWith("readme");
  const isCoreRuntimeSurface = relativePath.includes("src/main")
    || relativePath.includes("src/preload")
    || relativePath.includes("ipc")
    || relativePath.includes("security")
    || relativePath.includes("kernel/")
    || relativePath === "package.json";
  const isUiSurface = relativePath.includes("renderer")
    || relativePath.endsWith(".html")
    || relativePath.endsWith(".css")
    || relativePath.endsWith(".js");

  if (isDocSurface) {
    return {
      label: "Low risk",
      tone: "good",
      detail: "Docs and narrative surfaces have limited runtime blast radius."
    };
  }
  if (isCoreRuntimeSurface || lineCount >= 220) {
    return {
      label: "High risk",
      tone: "warn",
      detail: "Core runtime or large-scope changes need stronger verification before apply."
    };
  }
  if (isUiSurface || relativePath.includes("e2e/") || relativePath.includes("scripts/")) {
    return {
      label: "Medium risk",
      tone: "ok",
      detail: "Product or automation surfaces can shift behavior outside this one workflow."
    };
  }
  return {
    label: "Medium risk",
    tone: "ok",
    detail: "Check the affected surface and verification path before apply."
  };
}

function getPatchPlanFileVerificationHints(file) {
  const relativePath = String(file && file.path ? file.path : "").trim().toLowerCase();
  const isDocSurface = relativePath.endsWith(".md")
    || relativePath.endsWith(".txt")
    || relativePath.includes("docs/")
    || relativePath.startsWith("readme");
  const isCoreRuntimeSurface = relativePath.includes("src/main")
    || relativePath.includes("src/preload")
    || relativePath.includes("ipc")
    || relativePath.includes("security")
    || relativePath.includes("kernel/")
    || relativePath === "package.json";
  const isUiSurface = relativePath.includes("renderer")
    || relativePath.endsWith(".html")
    || relativePath.endsWith(".css");
  const isAutomationSurface = relativePath.includes("e2e/")
    || relativePath.includes("scripts/")
    || relativePath.endsWith(".spec.js");

  if (isDocSurface) {
    return [
      "Review copy and exported artifact output.",
      "Refresh screenshots only if store-visible wording changed."
    ];
  }
  if (isCoreRuntimeSurface) {
    return [
      "Run lint and founder e2e after apply.",
      "Verify bridge, IPC, and guarded local-write behavior manually."
    ];
  }
  if (isUiSurface) {
    return [
      "Run lint and founder e2e after apply.",
      "Verify workflow, patch-plan, and apply surfaces in the desktop UI."
    ];
  }
  if (isAutomationSurface) {
    return [
      "Run the affected automation path after apply.",
      "Confirm seeded copy and assertions still match the UI flow."
    ];
  }
  return [
    "Run lint and the most relevant local verification path.",
    "Check the touched surface manually before exporting evidence."
  ];
}

function getOperatorPhaseModel() {
  const workflow = getWorkflow(appState.workflowId);
  const workflowTitle = workflow ? workflow.title : "Workflow";
  const promptValue = String((el.promptInput && el.promptInput.value) || "").trim();
  const bridgeCopy = describeLlmStatus(appState.llmStatus);
  const bridgeNeedsAttention = ["booting", "bridge_offline", "bridge_reconnecting", "error"].includes(String(appState.llmStatus || "").trim());
  if (!hasWorkspaceAttachment()) {
    return {
      title: "Attach a Local Workspace",
      summary: `${workflowTitle} is armed, but guarded writes and project context stay disabled until one local root is attached.`,
      step: "workspace",
      tone: "warn"
    };
  }
  if (!hasArtifactContent()) {
    if (bridgeNeedsAttention) {
      return {
        title: "Stabilize the Local Bridge",
        summary: bridgeCopy.detail,
        step: "workflow",
        tone: bridgeCopy.tone || "warn"
      };
    }
    if (promptValue) {
      return {
        title: "Generate the First Artifact",
        summary: `Dispatch the active ${workflowTitle} prompt and lock the output contract before exporting or applying anything local.`,
        step: "artifact",
        tone: "ok"
      };
    }
    return {
      title: "Seed the Workflow Prompt",
      summary: `Load the starter prompt for ${workflowTitle} or write a sharper operator request before dispatch.`,
      step: "workflow",
      tone: "ok"
    };
  }
  if (patchPlanHasFiles()) {
    if (!patchPlanPreviewReady()) {
      return {
        title: "Review the Patch Plan",
        summary: `A multi-file plan is loaded. Preview the exact diffs before any file in the attached workspace becomes writable.`,
        step: "patch",
        tone: "ok"
      };
    }
    const unapplied = unappliedSelectedPatchPlanFiles();
    if (unapplied.length) {
      return {
        title: "Apply Reviewed Changes",
        summary: `${unapplied.length} selected ${unapplied.length === 1 ? "file is" : "files are"} ready for explicit local apply inside the attached workspace.`,
        step: "apply",
        tone: "good"
      };
    }
    return {
      title: "Capture Evidence and Handoff",
      summary: "The reviewed patch plan is already applied. Export the evidence bundle or save the session snapshot while the context is still hot.",
      step: "apply",
      tone: "good"
    };
  }
  if (hasWorkspaceActionPreview()) {
    return {
      title: "Apply the Previewed Workspace Write",
      summary: "A guarded local write is previewed with an exact file target. Apply it or clear the preview before generating the next action.",
      step: "apply",
      tone: "ok"
    };
  }
  if (workspaceDraftReady()) {
    return {
      title: "Review the Draft Diff",
      summary: "The file edit draft is loaded. Preview the exact diff before any replacement is allowed inside the attached workspace.",
      step: "apply",
      tone: "ok"
    };
  }
  return {
    title: artifactLooksLikePatchPlan() ? "Promote the Artifact into a Patch Plan" : "Promote the Artifact into Local Work",
    summary: artifactLooksLikePatchPlan()
      ? "The latest artifact can be parsed into a multi-file patch plan. Preview it, then decide what actually gets written."
      : "The latest artifact is ready for export, guarded report writes, evidence capture, or a manual draft diff inside the attached workspace.",
    step: "artifact",
    tone: "ok"
  };
}

function getOperatorProgressItems(activeStep) {
  const hasPatch = patchPlanHasFiles();
  const patchReady = patchPlanPreviewReady();
  const applyHistory = Object.keys(appState.workspaceActionHistory || {}).length > 0;
  const allSelectedApplied = selectedPatchPlanFiles().length > 0 && unappliedSelectedPatchPlanFiles().length === 0;
  return [
    {
      label: "Workflow",
      state: activeStep === "workflow"
        ? "active"
        : hasArtifactContent() || patchReady || allSelectedApplied
          ? "complete"
          : "pending"
    },
    {
      label: "Workspace",
      state: hasWorkspaceAttachment()
        ? "complete"
        : activeStep === "workspace"
          ? "active"
          : "pending"
    },
    {
      label: "Artifact",
      state: hasArtifactContent()
        ? "complete"
        : activeStep === "artifact"
          ? "active"
          : "pending"
    },
    {
      label: "Patch Plan",
      state: patchReady
        ? "complete"
        : hasPatch || activeStep === "patch"
          ? "active"
          : "pending"
    },
    {
      label: "Apply",
      state: allSelectedApplied || applyHistory
        ? "complete"
        : hasWorkspaceActionPreview() || workspaceDraftReady() || activeStep === "apply"
          ? "active"
          : "pending"
    }
  ];
}

function getOperatorRailActions() {
  const actions = [];
  const promptValue = String((el.promptInput && el.promptInput.value) || "").trim();
  const addAction = (entry) => {
    if (!entry || actions.some((item) => item.id === entry.id)) return;
    actions.push(entry);
  };
  const openPaletteAction = {
    id: "open-palette",
    title: "Route Through Palette",
    note: "Open the command palette for less-common actions and keyboard-first routing.",
    status: "Fast route",
    scopes: [
      { label: "UI only", tone: "read" },
      { label: "Keyboard route", tone: "guard" }
    ],
    buttonLabel: "Open Palette",
    buttonClass: "btn-secondary",
    run: async () => { setCommandPaletteOpen(true); }
  };

  if (!hasWorkspaceAttachment()) {
    addAction({
      id: "attach-workspace",
      title: "Attach Workspace",
      note: "Enable guarded local writes, project signals, and evidence exports against one local root.",
      status: "Required",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Read scope", tone: "read" }
      ],
      buttonLabel: "Attach",
      buttonClass: "btn-primary",
      run: async () => { await attachWorkspaceFromDialog(); }
    });
    addAction({
      id: "open-settings",
      title: "Inspect Bridge Settings",
      note: "Open the drawer and verify the active bridge profile, timeout, and local-only posture.",
      status: "Review",
      scopes: [
        { label: "UI only", tone: "read" },
        { label: "Bridge aware", tone: "bridge" }
      ],
      buttonLabel: "Open Settings",
      buttonClass: "btn-secondary",
      run: async () => { setSettingsMenuOpen(true); }
    });
    addAction(openPaletteAction);
    return actions.slice(0, 4);
  }

  if (!hasArtifactContent()) {
    if (["booting", "bridge_offline", "bridge_reconnecting", "error"].includes(String(appState.llmStatus || "").trim())) {
      addAction({
        id: "detect-bridge",
        title: "Detect Local Bridge",
        note: "Probe the configured local bridge and refresh model posture before dispatch.",
        status: "Recovery",
        scopes: [
          { label: "Local only", tone: "local" },
          { label: "Bridge", tone: "bridge" }
        ],
        buttonLabel: "Detect",
        buttonClass: "btn-primary",
        run: async () => { await runBridgeAutoDetect(); }
      });
      addAction({
        id: "bridge-health",
        title: "Run Bridge Health",
        note: "Check the active bridge profile without changing the current workflow context.",
        status: "Review",
        scopes: [
          { label: "Read only", tone: "read" },
          { label: "Bridge", tone: "bridge" }
        ],
        buttonLabel: "Health Check",
        buttonClass: "btn-secondary",
        run: async () => { await runBridgeHealthCheck(); }
      });
    }
    addAction(promptValue
      ? {
          id: "send-prompt",
          title: "Generate Artifact",
          note: "Dispatch the active prompt and lock a structured output into the artifact dock.",
          status: "Ready",
          scopes: [
            { label: "Bridge", tone: "bridge" },
            { label: "Structured output", tone: "guard" }
          ],
          buttonLabel: "Send Prompt",
          buttonClass: "btn-primary",
          run: async () => { await sendPrompt(); }
        }
      : {
          id: "load-workflow-prompt",
          title: "Load Workflow Prompt",
          note: "Seed the prompt box with the built-in starter prompt for the active workflow.",
          status: "Ready",
          scopes: [
            { label: "UI only", tone: "read" },
            { label: "Workflow seed", tone: "guard" }
          ],
          buttonLabel: "Load Prompt",
          buttonClass: "btn-primary",
          run: async () => { seedStarterPrompt(); }
        });
    addAction(openPaletteAction);
    return actions.slice(0, 4);
  }

  if (patchPlanHasFiles()) {
    if (!patchPlanPreviewReady()) {
      addAction({
        id: "preview-patch-plan",
        title: "Preview Patch Plan",
        note: "Generate per-file diffs so every target path and replacement is inspectable before apply.",
        status: "Review",
        scopes: [
          { label: "Local only", tone: "local" },
          { label: "Preview first", tone: "guard" },
          { label: "Writes files", tone: "write" }
        ],
        buttonLabel: "Preview Plan",
        buttonClass: "btn-primary",
        run: async () => { await previewPatchPlanFiles(); }
      });
    }
    if (patchPlanPreviewReady() && unappliedSelectedPatchPlanFiles().length) {
      addAction({
        id: "apply-selected-patch",
        title: "Apply Selected Patch Files",
        note: "Write only the selected reviewed files from the current patch plan.",
        status: `${unappliedSelectedPatchPlanFiles().length} pending`,
        scopes: [
          { label: "Local only", tone: "local" },
          { label: "Writes files", tone: "write" },
          { label: "Explicit apply", tone: "guard" }
        ],
        buttonLabel: "Apply Selected",
        buttonClass: "btn-primary",
        run: async () => { await applyPatchPlanFiles(false); }
      });
      addAction({
        id: "apply-all-patch",
        title: "Apply Entire Patch Plan",
        note: "Write every file in the reviewed patch plan inside the attached workspace.",
        status: "High impact",
        scopes: [
          { label: "Local only", tone: "local" },
          { label: "Writes files", tone: "write" },
          { label: "Explicit apply", tone: "guard" }
        ],
        buttonLabel: "Apply All",
        buttonClass: "btn-secondary",
        run: async () => { await applyPatchPlanFiles(true); }
      });
    }
    addAction({
      id: "export-evidence-bundle",
      title: "Export Evidence Bundle",
      note: "Capture workflow state, logs, runtime posture, artifact state, and patch-plan evidence.",
      status: "Archive",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Export", tone: "export" }
      ],
      buttonLabel: "Export Bundle",
      buttonClass: "btn-secondary",
      run: async () => { await exportEvidenceBundle(); }
    });
    addAction(openPaletteAction);
    return actions.slice(0, 4);
  }

  const releaseModel = getReleaseCockpitModel();
  if (normalizeWorkflowId(appState.workflowId) === "release_audit" && releaseModel.passed > 0 && releaseModel.pending === 0 && !releaseModel.failed && !releaseModel.packetReady) {
    addAction({
      id: "build-release-packet",
      title: "Build Release Packet",
      note: "Capture the current release decision, selected checks, blockers, and handoff actions into the Artifact Dock.",
      status: "Ship packet",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Dock artifact", tone: "read" },
        { label: "Release report", tone: "guard" }
      ],
      buttonLabel: "Build Packet",
      buttonClass: "btn-primary",
      run: async () => { await buildReleasePacketArtifact(); }
    });
  }

  if (hasWorkspaceActionPreview()) {
    addAction({
      id: "apply-previewed-action",
      title: "Apply Previewed Action",
      note: "Write the exact preview already loaded in the apply deck.",
      status: "Ready",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Writes files", tone: "write" },
        { label: "Explicit apply", tone: "guard" }
      ],
      buttonLabel: "Apply Preview",
      buttonClass: "btn-primary",
      run: async () => {
        if (!appState.workspaceActionPreview) {
          throw new Error("No workspace action preview is loaded.");
        }
        await applyWorkspaceActionProposal(appState.workspaceActionPreview.proposalId);
      }
    });
    addAction({
      id: "clear-preview",
      title: "Clear Preview",
      note: "Drop the staged preview before building the next local write.",
      status: "Reset",
      scopes: [
        { label: "UI only", tone: "read" },
        { label: "Guard reset", tone: "guard" }
      ],
      buttonLabel: "Clear Preview",
      buttonClass: "btn-secondary",
      run: async () => { clearWorkspaceActionPreview(); }
    });
    addAction({
      id: "export-evidence-bundle",
      title: "Export Evidence Bundle",
      note: "Capture the previewed action state alongside workflow, logs, and runtime posture.",
      status: "Archive",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Export", tone: "export" }
      ],
      buttonLabel: "Export Bundle",
      buttonClass: "btn-secondary",
      run: async () => { await exportEvidenceBundle(); }
    });
    addAction(openPaletteAction);
    return actions.slice(0, 4);
  }

  if (workspaceDraftReady()) {
    addAction({
      id: "preview-file-diff",
      title: "Preview File Diff",
      note: "Render the exact replacement diff for the current draft path and content.",
      status: "Review",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Preview first", tone: "guard" },
        { label: "Writes files", tone: "write" }
      ],
      buttonLabel: "Preview Diff",
      buttonClass: "btn-primary",
      run: async () => { await previewWorkspaceEditDraft(); }
    });
  } else {
    addAction({
      id: "load-artifact-draft",
      title: "Load Artifact into Draft",
      note: "Copy the current artifact content into the file edit draft for local refinement.",
      status: "Stage",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Reads artifact", tone: "read" }
      ],
      buttonLabel: "Load Draft",
      buttonClass: "btn-primary",
      run: async () => {
        const currentPath = String((el.workspaceEditPathInput && el.workspaceEditPathInput.value) || defaultWorkspaceEditPath()).trim() || defaultWorkspaceEditPath();
        setWorkspaceEditDraft(currentPath, extractDraftContentFromArtifact());
        showBanner("Artifact loaded into file edit draft.", "ok");
      }
    });
  }
  if (artifactLooksLikePatchPlan()) {
    addAction({
      id: "load-artifact-patch-plan",
      title: "Load Artifact as Patch Plan",
      note: "Parse the latest artifact as a multi-file patch plan and move into reviewed local changes.",
      status: "Promote",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Reads artifact", tone: "read" },
        { label: "Patch plan", tone: "guard" }
      ],
      buttonLabel: "Load Plan",
      buttonClass: "btn-secondary",
      run: async () => { await loadPatchPlanFromArtifact(); }
    });
  } else {
    addAction({
      id: "preview-markdown-report",
      title: "Preview Markdown Report",
      note: "Stage the current structured artifact as a guarded markdown write inside the workspace.",
      status: "Review",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Preview first", tone: "guard" },
        { label: "Writes files", tone: "write" }
      ],
      buttonLabel: "Preview Report",
      buttonClass: "btn-secondary",
      run: async () => { await previewWorkspaceActionProposal("artifact_markdown"); }
    });
  }
  addAction({
    id: "export-evidence-bundle",
    title: "Export Evidence Bundle",
    note: "Package workflow state, logs, runtime posture, and the latest artifact without writing into the workspace.",
    status: "Archive",
    scopes: [
      { label: "Local only", tone: "local" },
      { label: "Export", tone: "export" }
    ],
    buttonLabel: "Export Bundle",
    buttonClass: "btn-secondary",
    run: async () => { await exportEvidenceBundle(); }
  });
  addAction(openPaletteAction);
  return actions.slice(0, 4);
}

function getWorkspaceActionProposals() {
  const workflow = getWorkflow(appState.workflowId);
  const workflowSlug = slugifySegment(workflow && workflow.id ? workflow.id : "workflow", "workflow");
  const base = artifactFilenameBase();
  return [
    {
      id: "artifact_markdown",
      kind: "artifact_markdown",
      title: "Write Markdown Report",
      description: "Save the current structured artifact as a readable markdown report inside the attached workspace.",
      directory: `reports/${workflowSlug}`,
      filename: `${base}.md`,
      requiresArtifact: true
    },
    {
      id: "artifact_json",
      kind: "artifact_json",
      title: "Write JSON Artifact",
      description: "Persist the current artifact payload for tooling, replay, and local audit trails.",
      directory: `reports/${workflowSlug}`,
      filename: `${base}.json`,
      requiresArtifact: true
    },
    {
      id: "evidence_bundle_json",
      kind: "evidence_bundle_json",
      title: "Write Evidence Bundle",
      description: "Package workflow state, runtime posture, logs, and the latest artifact into one guarded JSON bundle.",
      directory: `evidence/${workflowSlug}`,
      filename: `${base}-bundle.json`,
      requiresArtifact: false
    }
  ];
}

async function buildWorkspaceActionRequest(proposal) {
  if (!proposal) {
    throw new Error("Workspace action proposal is unavailable.");
  }
  if (!appState.workspaceAttachment || !appState.workspaceAttachment.rootPath) {
    throw new Error("Attach a workspace before previewing local actions.");
  }
  let content = "";
  if (proposal.kind === "artifact_markdown") {
    content = artifactAsMarkdown();
  } else if (proposal.kind === "artifact_json") {
    content = artifactAsJson();
  } else if (proposal.kind === "evidence_bundle_json") {
    content = JSON.stringify(await buildEvidenceBundle(), null, 2);
  }
  if (!String(content || "").trim()) {
    throw new Error("Generate an artifact before previewing this action.");
  }
  return {
    proposalId: proposal.id,
    kind: proposal.kind,
    title: proposal.title,
    description: proposal.description,
    rootPath: appState.workspaceAttachment.rootPath,
    directory: proposal.directory,
    filename: proposal.filename,
    content
  };
}

async function previewWorkspaceEditDraft() {
  if (!appState.workspaceAttachment || !appState.workspaceAttachment.rootPath) {
    throw new Error("Attach a workspace before previewing file edits.");
  }
  const draft = syncWorkspaceEditDraftFromInputs();
  const target = splitDraftTargetPath(draft.relativePath);
  const content = String(draft.content || "");
  if (!content.trim()) {
    throw new Error("Draft content is required.");
  }
  const request = {
    proposalId: "file_replace",
    kind: "file_replace",
    title: `File Edit: ${target.relativePath}`,
    description: "Previewed replacement inside the attached workspace.",
    rootPath: appState.workspaceAttachment.rootPath,
    directory: target.directory,
    filename: target.filename,
    content
  };
  if (!window.api || !window.api.workspace || typeof window.api.workspace.previewAction !== "function") {
    throw new Error("Workspace preview IPC is unavailable.");
  }
  const preview = await window.api.workspace.previewAction(request);
  appState.workspaceActionPreview = {
    ...preview,
    request
  };
  renderWorkspaceActionDeck();
  showBanner(`Diff preview ready: ${preview.relativePath}`, "ok");
  return preview;
}

async function previewWorkspaceActionProposal(proposalId) {
  const proposal = getWorkspaceActionProposals().find((entry) => entry.id === proposalId);
  const request = await buildWorkspaceActionRequest(proposal);
  if (!window.api || !window.api.workspace || typeof window.api.workspace.previewAction !== "function") {
    throw new Error("Workspace preview IPC is unavailable.");
  }
  const preview = await window.api.workspace.previewAction(request);
  appState.workspaceActionPreview = {
    ...preview,
    request
  };
  renderWorkspaceActionDeck();
  showBanner(`Preview ready: ${preview.relativePath}`, "ok");
  return preview;
}

async function applyWorkspaceActionProposal(proposalId) {
  const preview = appState.workspaceActionPreview;
  if (!preview || !preview.request || preview.proposalId !== proposalId) {
    throw new Error("Preview the selected action before applying it.");
  }
  if (!window.api || !window.api.workspace || typeof window.api.workspace.applyAction !== "function") {
    throw new Error("Workspace apply IPC is unavailable.");
  }
  const applied = await window.api.workspace.applyAction(preview.request);
  appState.workspaceActionPreview = {
    ...applied,
    request: preview.request
  };
  appState.workspaceActionHistory = {
    ...(appState.workspaceActionHistory || {}),
    [proposalId]: applied.appliedAt
  };
  renderWorkspaceActionDeck();
  showBanner(`Workspace write applied: ${applied.relativePath}`, "ok");
  return applied;
}

function clearWorkspaceActionPreview() {
  appState.workspaceActionPreview = null;
  renderWorkspaceActionDeck();
  showBanner("Workspace action preview cleared.", "ok");
}

function patchPlanHasFiles() {
  return Boolean(appState.patchPlan && Array.isArray(appState.patchPlan.files) && appState.patchPlan.files.length);
}

function currentPatchPlanPreviewFile() {
  if (!patchPlanHasFiles()) return null;
  const plan = appState.patchPlan;
  return plan.files.find((file) => file.fileId === appState.patchPlanPreviewFileId) || plan.files[0] || null;
}

function setPatchPlanFileSelection(fileId, selected) {
  if (!patchPlanHasFiles()) return;
  appState.patchPlan.files = appState.patchPlan.files.map((file) => (
    file.fileId === fileId
      ? { ...file, selected: Boolean(selected) }
      : file
  ));
  appState.patchPlan.selectedFileIds = appState.patchPlan.files
    .filter((file) => file.selected !== false)
    .map((file) => file.fileId);
  renderPatchPlanPanel();
  persistChatState().catch(() => {});
}

function setPatchPlanGroupSelection(groupId, selected) {
  if (!patchPlanHasFiles()) return;
  const normalized = String(groupId || "").trim();
  if (!normalized) return;
  appState.patchPlan.files = appState.patchPlan.files.map((file) => {
    const descriptor = getPatchPlanGroupDescriptor(file);
    if (descriptor.id !== normalized) return file;
    return {
      ...file,
      selected: Boolean(selected)
    };
  });
  appState.patchPlan.selectedFileIds = appState.patchPlan.files
    .filter((file) => file.selected !== false)
    .map((file) => file.fileId);
  renderPatchPlanPanel();
  persistChatState().catch(() => {});
}

function setPatchPlanPreviewFile(fileId) {
  appState.patchPlanPreviewFileId = String(fileId || "");
  renderPatchPlanPanel();
}

function renderPatchPlanPanel() {
  const plan = appState.patchPlan;
  if (el.patchPlanTitleText) {
    el.patchPlanTitleText.textContent = plan && plan.title
      ? plan.title
      : "No patch plan loaded";
  }
  if (el.patchPlanMetaText) {
    el.patchPlanMetaText.textContent = plan
      ? `${plan.totalFiles || (plan.files || []).length} files | ${plan.newFiles || 0} new | ${plan.modifiedFiles || 0} modified | ${plan.totalLines || 0} lines`
      : "Set Output Mode to Patch Plan and return valid JSON to populate this surface.";
  }
  if (el.patchPlanSummaryText) {
    el.patchPlanSummaryText.textContent = plan && plan.summary
      ? plan.summary
      : "No structured patch plan is available yet.";
  }
  if (el.patchPlanVerification) {
    el.patchPlanVerification.textContent = plan && Array.isArray(plan.verification) && plan.verification.length
      ? plan.verification.map((step, index) => `${index + 1}. ${step}`).join("\n")
      : "Verification steps will appear here once a patch plan is loaded.";
  }
  if (el.patchPlanShortcutList) {
    el.patchPlanShortcutList.innerHTML = "";
    const shortcuts = Array.isArray(appState.promotedPaletteActions) ? appState.promotedPaletteActions : [];
    if (!shortcuts.length) {
      const emptyShortcuts = document.createElement("div");
      emptyShortcuts.className = "workspace-action-card";
      emptyShortcuts.textContent = "No promoted verification shortcuts yet. Promote one from a patch group to keep it reusable in the command palette.";
      el.patchPlanShortcutList.appendChild(emptyShortcuts);
    } else {
      for (let index = 0; index < shortcuts.length; index += 1) {
        const action = shortcuts[index];
        const card = document.createElement("div");
        card.className = "workspace-action-card patch-plan-shortcut-card";
        if (normalizeWorkflowId(action.workflowId) === normalizeWorkflowId(appState.workflowId)) {
          card.classList.add("is-previewed");
        }

        const head = document.createElement("div");
        head.className = "workspace-action-card-head";

        const copy = document.createElement("div");
        copy.className = "workspace-action-card-copy";
        const title = document.createElement("div");
        title.className = "workflow-title-text";
        title.textContent = action.label;
        const description = document.createElement("p");
        description.textContent = action.detail || "Reusable verification prompt for command palette routing.";
        copy.appendChild(title);
        copy.appendChild(description);

        const state = createStatusPill(`Shortcut ${index + 1}`, "good");
        head.appendChild(copy);
        head.appendChild(state);

        const meta = document.createElement("div");
        meta.className = "trust-scope-row";
        meta.appendChild(createStatusPill(
          String((getWorkflow(action.workflowId) && getWorkflow(action.workflowId).title) || action.workflowId || "Workflow"),
          normalizeWorkflowId(action.workflowId) === normalizeWorkflowId(appState.workflowId) ? "good" : "guard"
        ));
        meta.appendChild(createStatusPill(action.groupTitle || "Patch Group", "ok"));
        meta.appendChild(createStatusPill(`${Array.isArray(action.filePaths) ? action.filePaths.length : 0} files`, "guard"));
        meta.appendChild(createStatusPill("Palette route", "good"));

        const checks = document.createElement("div");
        checks.className = "workspace-action-hint-list";
        const checkRows = Array.isArray(action.checks) && action.checks.length
          ? action.checks.slice(0, 2)
          : ["Load this shortcut into the prompt input, then verify the targeted surface."];
        for (const check of checkRows) {
          const checkItem = document.createElement("div");
          checkItem.className = "workspace-action-hint";
          checkItem.textContent = check;
          checks.appendChild(checkItem);
        }

        const controls = document.createElement("div");
        controls.className = "row row-wrap action-grid patch-plan-group-controls";

        const loadBtn = document.createElement("button");
        loadBtn.className = "btn-secondary";
        loadBtn.textContent = "Load Shortcut";
        loadBtn.onclick = () => {
          try {
            loadPromotedPaletteActionPrompt(action.id);
          } catch (err) {
            showBanner(err.message || String(err), "bad");
          }
        };

        const moveUpBtn = document.createElement("button");
        moveUpBtn.className = "btn-secondary";
        moveUpBtn.textContent = "Move Up";
        moveUpBtn.disabled = index === 0;
        moveUpBtn.onclick = () => {
          movePromotedPaletteAction(action.id, -1).catch((err) => showBanner(err.message || String(err), "bad"));
        };

        const moveDownBtn = document.createElement("button");
        moveDownBtn.className = "btn-secondary";
        moveDownBtn.textContent = "Move Down";
        moveDownBtn.disabled = index === shortcuts.length - 1;
        moveDownBtn.onclick = () => {
          movePromotedPaletteAction(action.id, 1).catch((err) => showBanner(err.message || String(err), "bad"));
        };

        const removeBtn = document.createElement("button");
        removeBtn.className = "btn-danger";
        removeBtn.textContent = "Remove";
        removeBtn.onclick = () => {
          removePromotedPaletteAction(action.id).catch((err) => showBanner(err.message || String(err), "bad"));
        };

        controls.appendChild(loadBtn);
        controls.appendChild(moveUpBtn);
        controls.appendChild(moveDownBtn);
        controls.appendChild(removeBtn);

        card.appendChild(head);
        card.appendChild(meta);
        card.appendChild(checks);
        card.appendChild(controls);
        el.patchPlanShortcutList.appendChild(card);
      }
    }
  }
  if (el.verificationRunTitleText) {
    el.verificationRunTitleText.textContent = appState.verificationRunPlan
      ? `${appState.verificationRunPlan.groupTitle} Verification`
      : "No verification run plan staged";
  }
  if (el.verificationRunMetaText) {
    el.verificationRunMetaText.textContent = appState.verificationRunPlan
      ? `${appState.verificationRunPlan.checks.filter((check) => check.selected !== false).length}/${appState.verificationRunPlan.checks.length} selected | ${appState.verificationRunPlan.rootLabel || appState.verificationRunPlan.rootPath || "workspace"}`
      : "Stage a plan from a patch group to preview the exact local scripts.";
  }
  if (el.verificationRunList) {
    el.verificationRunList.innerHTML = "";
    if (!appState.verificationRunPlan || !Array.isArray(appState.verificationRunPlan.checks) || !appState.verificationRunPlan.checks.length) {
      const emptyRunPlan = document.createElement("div");
      emptyRunPlan.className = "workspace-action-card";
      emptyRunPlan.textContent = "No verification run plan is loaded. Use a patch-group action to stage one.";
      el.verificationRunList.appendChild(emptyRunPlan);
    } else {
      for (const check of appState.verificationRunPlan.checks) {
        const card = document.createElement("div");
        card.className = "workspace-action-card";
        if (check.status === "passed") card.classList.add("is-applied");
        if (check.status === "running") card.classList.add("is-previewed");

        const head = document.createElement("div");
        head.className = "workspace-action-card-head";
        const copy = document.createElement("div");
        copy.className = "workspace-action-card-copy";
        const title = document.createElement("div");
        title.className = "workflow-title-text";
        title.textContent = check.label;
        const description = document.createElement("p");
        description.textContent = check.description || check.commandLabel;
        copy.appendChild(title);
        copy.appendChild(description);

        const state = createStatusPill(
          check.status === "passed" ? "Passed" : check.status === "failed" ? "Failed" : check.status === "running" ? "Running" : "Ready",
          verificationRunStatusTone(check.status)
        );
        head.appendChild(copy);
        head.appendChild(state);

        const meta = document.createElement("div");
        meta.className = "workspace-action-card-meta";
        const commandPath = document.createElement("div");
        commandPath.className = "workspace-action-path";
        commandPath.textContent = check.commandLabel;
        meta.appendChild(commandPath);

        const scopes = document.createElement("div");
        scopes.className = "trust-scope-row";
        appendScopePills(scopes, check.scopes);
        if (check.exitCode != null) {
          scopes.appendChild(createStatusPill(`Exit ${check.exitCode}`, check.exitCode === 0 ? "good" : "warn"));
        }
        if (check.durationMs) {
          scopes.appendChild(createStatusPill(`${check.durationMs} ms`, "guard"));
        }

        const toggleLabel = document.createElement("label");
        toggleLabel.className = "field-inline checkbox-field";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = check.selected !== false;
        checkbox.onchange = () => setVerificationRunCheckSelection(check.id, checkbox.checked);
        const checkboxText = document.createElement("span");
        checkboxText.textContent = "Include in next run";
        toggleLabel.appendChild(checkbox);
        toggleLabel.appendChild(checkboxText);

        card.appendChild(head);
        card.appendChild(meta);
        card.appendChild(scopes);
        card.appendChild(toggleLabel);
        el.verificationRunList.appendChild(card);
      }
    }
  }
  if (el.verificationRunOutput) {
    el.verificationRunOutput.textContent = formatVerificationRunOutput(appState.verificationRunPlan);
    el.verificationRunOutput.classList.toggle("verification-run-output-empty", !appState.verificationRunPlan || !appState.verificationRunPlan.lastRunAt);
  }
  if (el.runVerificationPlanBtn) {
    el.runVerificationPlanBtn.disabled = !appState.verificationRunPlan || !appState.verificationRunPlan.checks.some((check) => check.selected !== false);
  }
  if (el.copyVerificationCommandsBtn) {
    el.copyVerificationCommandsBtn.disabled = !appState.verificationRunPlan || !appState.verificationRunPlan.checks.some((check) => check.selected !== false);
  }
  if (el.clearVerificationPlanBtn) {
    el.clearVerificationPlanBtn.disabled = !appState.verificationRunPlan;
  }
  if (el.patchPlanFileList) {
    el.patchPlanFileList.innerHTML = "";
    if (!patchPlanHasFiles()) {
      const empty = document.createElement("div");
      empty.className = "workspace-action-card";
      empty.textContent = "No patch plan files yet. Load one from a patch-plan artifact or preview a generated plan.";
      el.patchPlanFileList.appendChild(empty);
    } else {
      const groups = collectPatchPlanGroups(plan);
      const openGroupIds = getPatchPlanOpenGroupSet(groups);
      for (const group of groups) {
        const groupShell = document.createElement("section");
        groupShell.className = "patch-plan-group-shell";
        const isOpen = openGroupIds.has(group.id);
        if (isOpen) groupShell.classList.add("is-open");

        const groupHead = document.createElement("div");
        groupHead.className = "patch-plan-group-head";

        const groupCopy = document.createElement("div");
        groupCopy.className = "workspace-action-card-copy";
        const groupTitle = document.createElement("div");
        groupTitle.className = "workflow-title-text";
        groupTitle.textContent = group.title;
        const groupNote = document.createElement("p");
        groupNote.textContent = group.note;
        groupCopy.appendChild(groupTitle);
        groupCopy.appendChild(groupNote);

        const groupStatus = createStatusPill(
          `${group.files.length} files | ${group.selectedCount} selected`,
          group.selectedCount === 0 ? "warn" : group.unappliedCount ? "ok" : "good"
        );

        groupHead.appendChild(groupCopy);
        groupHead.appendChild(groupStatus);

        const groupMeta = document.createElement("div");
        groupMeta.className = "trust-scope-row";
        groupMeta.appendChild(createStatusPill(group.highestRisk.label, group.highestRisk.tone));
        groupMeta.appendChild(createStatusPill(`${group.reviewedCount} reviewed`, group.reviewedCount === group.files.length ? "good" : "guard"));
        if (group.unappliedCount) {
          groupMeta.appendChild(createStatusPill(`${group.unappliedCount} pending apply`, "warn"));
        }
        if (patchPlanGroupHasPromotedShortcut(group.id)) {
          groupMeta.appendChild(createStatusPill("Palette shortcut", "good"));
        }

        const groupControls = document.createElement("div");
        groupControls.className = "row row-wrap action-grid patch-plan-group-controls";
        const groupToggleLabel = document.createElement("label");
        groupToggleLabel.className = "field-inline checkbox-field";
        const groupCheckbox = document.createElement("input");
        groupCheckbox.type = "checkbox";
        groupCheckbox.checked = group.selectedCount === group.files.length;
        groupCheckbox.indeterminate = group.selectedCount > 0 && group.selectedCount < group.files.length;
        groupCheckbox.onchange = () => setPatchPlanGroupSelection(group.id, groupCheckbox.checked);
        const groupToggleText = document.createElement("span");
        groupToggleText.textContent = "Select group";
        groupToggleLabel.appendChild(groupCheckbox);
        groupToggleLabel.appendChild(groupToggleText);

        const collapseBtn = document.createElement("button");
        collapseBtn.className = "btn-secondary";
        collapseBtn.textContent = isOpen ? "Collapse Group" : "Expand Group";
        collapseBtn.onclick = () => togglePatchPlanGroup(group.id);

        groupControls.appendChild(groupToggleLabel);
        groupControls.appendChild(collapseBtn);

        const verificationPlan = getPatchPlanGroupVerificationPlan(group);
        const verificationBlock = document.createElement("div");
        verificationBlock.className = "patch-plan-group-verification";
        const verificationTitle = document.createElement("div");
        verificationTitle.className = "workspace-action-path";
        verificationTitle.textContent = "Recommended checks";
        const verificationList = document.createElement("div");
        verificationList.className = "workspace-action-hint-list";
        for (const check of verificationPlan.checks) {
          const checkItem = document.createElement("div");
          checkItem.className = "workspace-action-hint";
          checkItem.textContent = check;
          verificationList.appendChild(checkItem);
        }
        const verificationControls = document.createElement("div");
        verificationControls.className = "row row-wrap action-grid patch-plan-group-controls";
        const loadChecksBtn = document.createElement("button");
        loadChecksBtn.className = "btn-secondary";
        loadChecksBtn.textContent = "Load Checks";
        loadChecksBtn.onclick = () => {
          try {
            loadPatchPlanGroupVerificationPrompt(group.id);
          } catch (err) {
            showBanner(err.message || String(err), "bad");
          }
        };
        const copyChecksBtn = document.createElement("button");
        copyChecksBtn.className = "btn-secondary";
        copyChecksBtn.textContent = "Copy Checks";
        copyChecksBtn.onclick = () => {
          copyPatchPlanGroupVerificationChecks(group.id).catch((err) => showBanner(err.message || String(err), "bad"));
        };
        const promoteBtn = document.createElement("button");
        promoteBtn.className = "btn-secondary";
        promoteBtn.textContent = patchPlanGroupHasPromotedShortcut(group.id) ? "Update Shortcut" : "Promote to Palette";
        promoteBtn.onclick = () => {
          promotePatchPlanGroupToPalette(group.id).catch((err) => showBanner(err.message || String(err), "bad"));
        };
        const stageRunPlanBtn = document.createElement("button");
        stageRunPlanBtn.className = "btn-secondary";
        stageRunPlanBtn.textContent = "Stage Run Plan";
        stageRunPlanBtn.disabled = !hasWorkspaceAttachment();
        stageRunPlanBtn.onclick = () => {
          try {
            stageVerificationRunPlanForGroup(group.id);
          } catch (err) {
            showBanner(err.message || String(err), "bad");
          }
        };
        verificationControls.appendChild(loadChecksBtn);
        verificationControls.appendChild(copyChecksBtn);
        verificationControls.appendChild(promoteBtn);
        verificationControls.appendChild(stageRunPlanBtn);
        verificationBlock.appendChild(verificationTitle);
        verificationBlock.appendChild(verificationList);
        verificationBlock.appendChild(verificationControls);

        const groupBody = document.createElement("div");
        groupBody.className = "patch-plan-group-body";
        if (!isOpen) {
          groupBody.classList.add("hidden");
        }

        for (const file of group.files) {
          const card = document.createElement("div");
          card.className = "workspace-action-card";
          if (file.fileId === appState.patchPlanPreviewFileId) {
            card.classList.add("is-previewed");
          }
          if (file.appliedAt) {
            card.classList.add("is-applied");
          }

          const head = document.createElement("div");
          head.className = "workspace-action-card-head";

          const copy = document.createElement("div");
          copy.className = "workspace-action-card-copy";
          const title = document.createElement("div");
          title.className = "workflow-title-text";
          title.textContent = file.path;
          const description = document.createElement("p");
          description.textContent = file.rationale || "No rationale provided.";
          copy.appendChild(title);
          copy.appendChild(description);

          const stateModel = describePatchPlanFileState(file);
          const state = createStatusPill(stateModel.label, stateModel.tone);

          head.appendChild(copy);
          head.appendChild(state);

          const meta = document.createElement("div");
          meta.className = "workspace-action-card-meta";
          const stats = document.createElement("div");
          stats.className = "workspace-action-path";
          stats.textContent = `${file.status || "pending"} | ${file.bytes || 0} bytes | ${file.lines || 0} lines`;
          meta.appendChild(stats);

          const impactRow = document.createElement("div");
          impactRow.className = "trust-scope-row";
          const risk = getPatchPlanFileRisk(file);
          impactRow.appendChild(createStatusPill(risk.label, risk.tone));

          const hintBlock = document.createElement("div");
          hintBlock.className = "workspace-action-card-copy workspace-action-card-hints";
          const hintTitle = document.createElement("div");
          hintTitle.className = "workspace-action-path";
          hintTitle.textContent = risk.detail;
          const hintList = document.createElement("div");
          hintList.className = "workspace-action-hint-list";
          for (const hint of getPatchPlanFileVerificationHints(file)) {
            const hintItem = document.createElement("div");
            hintItem.className = "workspace-action-hint";
            hintItem.textContent = hint;
            hintList.appendChild(hintItem);
          }
          hintBlock.appendChild(hintTitle);
          hintBlock.appendChild(hintList);

          const scopeRow = document.createElement("div");
          scopeRow.className = "trust-scope-row";
          appendScopePills(scopeRow, getPatchPlanFileScopes(file));

          const controls = document.createElement("div");
          controls.className = "row row-wrap action-grid";

          const toggleLabel = document.createElement("label");
          toggleLabel.className = "field-inline checkbox-field";
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.checked = file.selected !== false;
          checkbox.onchange = () => setPatchPlanFileSelection(file.fileId, checkbox.checked);
          const toggleText = document.createElement("span");
          toggleText.textContent = "Selected";
          toggleLabel.appendChild(checkbox);
          toggleLabel.appendChild(toggleText);

          const showBtn = document.createElement("button");
          showBtn.className = "btn-secondary";
          showBtn.textContent = "Show Diff";
          showBtn.onclick = () => setPatchPlanPreviewFile(file.fileId);

          controls.appendChild(toggleLabel);
          controls.appendChild(showBtn);

          card.appendChild(head);
          card.appendChild(meta);
          card.appendChild(impactRow);
          card.appendChild(hintBlock);
          card.appendChild(scopeRow);
          card.appendChild(controls);
          groupBody.appendChild(card);
        }

        groupShell.appendChild(groupHead);
        groupShell.appendChild(groupMeta);
        groupShell.appendChild(groupControls);
        groupShell.appendChild(verificationBlock);
        groupShell.appendChild(groupBody);
        el.patchPlanFileList.appendChild(groupShell);
      }
    }
  }

  const previewFile = currentPatchPlanPreviewFile();
  if (el.patchPlanPreview) {
    el.patchPlanPreview.textContent = previewFile
      ? `${previewFile.absolutePath ? `Path: ${previewFile.absolutePath}\n\n` : ""}${previewFile.diffText || "Preview the patch plan to render unified diffs."}`
      : "No patch file selected.\nPreview a patch plan and choose a file to inspect its diff.";
  }

  const hasPlan = patchPlanHasFiles();
  if (el.previewPatchPlanBtn) el.previewPatchPlanBtn.disabled = !hasPlan || !appState.workspaceAttachment;
  if (el.applySelectedPatchPlanBtn) {
    el.applySelectedPatchPlanBtn.disabled = !hasPlan || !appState.workspaceAttachment || !(plan && Array.isArray(plan.selectedFileIds) && plan.selectedFileIds.length);
  }
  if (el.applyAllPatchPlanBtn) el.applyAllPatchPlanBtn.disabled = !hasPlan || !appState.workspaceAttachment;
  if (el.exportPatchPlanJsonBtn) el.exportPatchPlanJsonBtn.disabled = !hasPlan;
  if (el.exportPatchPlanMarkdownBtn) el.exportPatchPlanMarkdownBtn.disabled = !hasPlan;
  if (el.savePatchPlanSessionBtn) el.savePatchPlanSessionBtn.disabled = !hasPlan;
  renderReleaseCockpit();
  renderOperatorRail();
  renderMissionControl();
}

async function loadPatchPlanFromArtifact() {
  if (!appState.lastArtifact || !String(appState.lastArtifact.content || "").trim()) {
    throw new Error("Generate an artifact before loading a patch plan.");
  }
  appState.outputMode = "patch_plan";
  appState.patchPlan = parsePatchPlanFromArtifactContent(appState.lastArtifact.content, {
    generatedAt: appState.lastArtifact.generatedAt,
    workflowId: appState.workflowId
  });
  appState.patchPlanGroupOpenIds = null;
  appState.patchPlanPreviewFileId = appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "";
  renderWorkflowSummary();
  renderPatchPlanPanel();
  await persistChatState();
  showBanner(`Patch plan loaded: ${appState.patchPlan.title}`, "ok");
}

async function previewPatchPlanFiles() {
  if (!patchPlanHasFiles()) {
    throw new Error("Load a patch plan before previewing it.");
  }
  if (!appState.workspaceAttachment || !appState.workspaceAttachment.rootPath) {
    throw new Error("Attach a workspace before previewing the patch plan.");
  }
  if (!window.api || !window.api.workspace || typeof window.api.workspace.previewPatchPlan !== "function") {
    throw new Error("Patch plan preview IPC is unavailable.");
  }
  const preview = await window.api.workspace.previewPatchPlan({
    rootPath: appState.workspaceAttachment.rootPath,
    plan: appState.patchPlan
  });
  appState.patchPlan = normalizePatchPlanValue(preview, {
    workflowId: appState.workflowId
  });
  appState.patchPlanGroupOpenIds = null;
  appState.patchPlanPreviewFileId = currentPatchPlanPreviewFile()
    ? currentPatchPlanPreviewFile().fileId
    : (appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "");
  renderPatchPlanPanel();
  await persistChatState();
  showBanner(`Patch plan previewed: ${appState.patchPlan.files.length} files`, "ok");
  return preview;
}

async function applyPatchPlanFiles(applyAll = false) {
  if (!patchPlanHasFiles()) {
    throw new Error("Load a patch plan before applying it.");
  }
  if (!appState.workspaceAttachment || !appState.workspaceAttachment.rootPath) {
    throw new Error("Attach a workspace before applying the patch plan.");
  }
  if (!window.api || !window.api.workspace || typeof window.api.workspace.applyPatchPlan !== "function") {
    throw new Error("Patch plan apply IPC is unavailable.");
  }
  const selectedFileIds = applyAll
    ? appState.patchPlan.files.map((file) => file.fileId)
    : appState.patchPlan.files.filter((file) => file.selected !== false).map((file) => file.fileId);
  const applied = await window.api.workspace.applyPatchPlan({
    rootPath: appState.workspaceAttachment.rootPath,
    plan: appState.patchPlan,
    selectedFileIds
  });
  appState.patchPlan = normalizePatchPlanValue(applied, {
    workflowId: appState.workflowId
  });
  appState.patchPlanGroupOpenIds = null;
  appState.patchPlanPreviewFileId = appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "";
  renderPatchPlanPanel();
  await persistChatState();
  showBanner(`Patch plan applied: ${selectedFileIds.length} files`, "ok");
  return applied;
}

function exportPatchPlanJson() {
  if (!patchPlanHasFiles()) {
    showBanner("No patch plan to export.", "bad");
    return;
  }
  download(`${patchPlanFilenameBase()}.json`, patchPlanAsJson(), "application/json;charset=utf-8");
  showBanner("Patch plan JSON exported.", "ok");
}

function exportPatchPlanMarkdown() {
  const content = patchPlanAsMarkdown();
  if (!content) {
    showBanner("No patch plan to export.", "bad");
    return;
  }
  download(`${patchPlanFilenameBase()}.md`, content, "text/markdown;charset=utf-8");
  showBanner("Patch plan markdown exported.", "ok");
}

function renderOperatorRail() {
  if (!el.operatorRail) return;
  const phase = getOperatorPhaseModel();
  const progressItems = getOperatorProgressItems(phase.step);
  const actions = getOperatorRailActions();
  el.operatorRail.innerHTML = "";

  const topGrid = document.createElement("div");
  topGrid.className = "operator-rail-grid";

  const phaseCard = document.createElement("section");
  phaseCard.className = "operator-stage-panel";
  phaseCard.dataset.tone = operatorPhaseTone(phase.tone);

  const phaseLabel = document.createElement("span");
  phaseLabel.className = "stat-label";
  phaseLabel.textContent = "Current Phase";
  const phaseTitle = document.createElement("div");
  phaseTitle.className = "operator-stage-text";
  phaseTitle.textContent = phase.title;
  const phaseSummary = document.createElement("p");
  phaseSummary.className = "workflow-description-text";
  phaseSummary.textContent = phase.summary;

  phaseCard.appendChild(phaseLabel);
  phaseCard.appendChild(phaseTitle);
  phaseCard.appendChild(phaseSummary);

  const progressCard = document.createElement("section");
  progressCard.className = "operator-progress-panel";
  const progressLabel = document.createElement("span");
  progressLabel.className = "stat-label";
  progressLabel.textContent = "Flow Progress";
  const progressList = document.createElement("div");
  progressList.className = "operator-progress-list";
  for (const item of progressItems) {
    const step = document.createElement("div");
    step.className = "operator-progress-step";
    step.classList.add(`is-${item.state}`);
    const stepLabel = document.createElement("span");
    stepLabel.className = "operator-progress-label";
    stepLabel.textContent = item.label;
    const stepState = document.createElement("span");
    stepState.className = "operator-progress-state";
    stepState.textContent = item.state;
    step.appendChild(stepLabel);
    step.appendChild(stepState);
    progressList.appendChild(step);
  }
  progressCard.appendChild(progressLabel);
  progressCard.appendChild(progressList);

  topGrid.appendChild(phaseCard);
  topGrid.appendChild(progressCard);
  el.operatorRail.appendChild(topGrid);

  const actionGrid = document.createElement("div");
  actionGrid.className = "operator-action-grid";
  for (const action of actions) {
    const card = document.createElement("section");
    card.className = "operator-action-card";

    const head = document.createElement("div");
    head.className = "operator-action-card-head";

    const copy = document.createElement("div");
    copy.className = "operator-action-copy";
    const title = document.createElement("div");
    title.className = "workflow-title-text";
    title.textContent = action.title;
    const note = document.createElement("p");
    note.className = "workflow-description-text";
    note.textContent = action.note;
    copy.appendChild(title);
    copy.appendChild(note);

    const status = document.createElement("span");
    status.className = "operator-action-status";
    status.textContent = action.status || "Ready";

    head.appendChild(copy);
    head.appendChild(status);

    const scopeRow = document.createElement("div");
    scopeRow.className = "operator-scope-row";
    appendScopePills(scopeRow, action.scopes);

    const controls = document.createElement("div");
    controls.className = "row row-wrap action-grid";
    const button = document.createElement("button");
    button.className = action.buttonClass || "btn-secondary";
    button.textContent = action.buttonLabel || "Run";
    button.onclick = () => {
      Promise.resolve(action.run && action.run())
        .catch((err) => showBanner(err.message || String(err), "bad"));
    };
    controls.appendChild(button);

    card.appendChild(head);
    card.appendChild(scopeRow);
    card.appendChild(controls);
    actionGrid.appendChild(card);
  }

  el.operatorRail.appendChild(actionGrid);
}

function renderWorkspaceActionDeck() {
  const proposals = getWorkspaceActionProposals();
  renderWorkspaceEditDraft();
  if (el.workspaceActionList) {
    el.workspaceActionList.innerHTML = "";
    if (!appState.workspaceAttachment) {
      const empty = document.createElement("div");
      empty.className = "workspace-action-card";
      empty.textContent = "Attach one local workspace to enable guarded file writes.";
      el.workspaceActionList.appendChild(empty);
    } else {
      for (const proposal of proposals) {
        const previewReady = Boolean(
          appState.workspaceActionPreview &&
          appState.workspaceActionPreview.proposalId === proposal.id
        );
        const appliedAt = appState.workspaceActionHistory
          ? appState.workspaceActionHistory[proposal.id]
          : "";
        const actionable = !proposal.requiresArtifact || hasArtifactContent();

        const card = document.createElement("div");
        card.className = "workspace-action-card";
        if (previewReady) card.classList.add("is-previewed");
        if (appliedAt) card.classList.add("is-applied");

        const head = document.createElement("div");
        head.className = "workspace-action-card-head";

        const copy = document.createElement("div");
        copy.className = "workspace-action-card-copy";
        const title = document.createElement("div");
        title.className = "workflow-title-text";
        title.textContent = proposal.title;
        const description = document.createElement("p");
        description.textContent = proposal.description;
        copy.appendChild(title);
        copy.appendChild(description);

        const stateModel = describeWorkspaceProposalState(proposal, previewReady, appliedAt, actionable);
        const state = createStatusPill(stateModel.label, stateModel.tone);

        head.appendChild(copy);
        head.appendChild(state);

        const meta = document.createElement("div");
        meta.className = "workspace-action-card-meta";
        const pathLine = document.createElement("div");
        pathLine.className = "workspace-action-path";
        pathLine.textContent = `Target ${proposal.directory}/${proposal.filename}`;
        meta.appendChild(pathLine);

        const scopeRow = document.createElement("div");
        scopeRow.className = "trust-scope-row";
        appendScopePills(scopeRow, getWorkspaceProposalScopes(proposal));

        const controls = document.createElement("div");
        controls.className = "row row-wrap action-grid";
        const previewBtn = document.createElement("button");
        previewBtn.className = "btn-secondary";
        previewBtn.textContent = "Preview";
        previewBtn.disabled = !actionable;
        previewBtn.onclick = () => {
          previewWorkspaceActionProposal(proposal.id).catch((err) => showBanner(err.message || String(err), "bad"));
        };
        const applyBtn = document.createElement("button");
        applyBtn.className = "btn-primary";
        applyBtn.textContent = "Apply";
        applyBtn.disabled = !previewReady;
        applyBtn.onclick = () => {
          applyWorkspaceActionProposal(proposal.id).catch((err) => showBanner(err.message || String(err), "bad"));
        };
        controls.appendChild(previewBtn);
        controls.appendChild(applyBtn);

        card.appendChild(head);
        card.appendChild(meta);
        card.appendChild(scopeRow);
        card.appendChild(controls);
        el.workspaceActionList.appendChild(card);
      }
    }
  }

  const preview = appState.workspaceActionPreview;
  if (el.workspaceActionPreviewTitle) {
    el.workspaceActionPreviewTitle.textContent = preview
      ? preview.title || "Workspace Action Preview"
      : "Workspace Action Preview";
  }
  if (el.workspaceActionPreviewMeta) {
    el.workspaceActionPreviewMeta.textContent = preview
      ? `${preview.relativePath} | ${preview.bytes} bytes | ${preview.lines} lines | ${preview.previewKind === "diff" ? "Diff preview" : "Content preview"} | ${preview.exists ? "Overwrite" : "New file"}`
      : "Select Preview on a proposal to inspect the exact file path and content before writing.";
  }
  if (el.workspaceActionPreview) {
    el.workspaceActionPreview.textContent = preview
      ? `Path: ${preview.absolutePath}\n\n${preview.previewText}`
      : "No preview loaded.\nUse Preview on a proposed action to inspect the file target and content.";
  }
  if (el.applyWorkspaceActionBtn) {
    el.applyWorkspaceActionBtn.disabled = !preview;
  }
  renderOperatorRail();
}

function artifactHistorySummaryLine(artifact) {
  const lines = String(artifact && artifact.content ? artifact.content : "")
    .split("\n")
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  return lines.find((line) => line.startsWith("- Decision:"))
    || lines.find((line) => !line.startsWith("#"))
    || "Release packet snapshot";
}

async function loadReleasePacketHistoryEntry(index, options = {}) {
  const entry = normalizeReleasePacketHistory(appState.releasePacketHistory)[index];
  if (!entry) {
    throw new Error("Release packet history entry not found.");
  }
  appState.lastArtifact = { ...entry };
  renderArtifactPanel();
  renderReleaseCockpit();
  renderOperatorRail();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Release packet loaded into the dock.", "ok");
  }
  return appState.lastArtifact;
}

async function clearReleasePacketHistory(options = {}) {
  appState.releasePacketHistory = [];
  renderArtifactPanel();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Release packet history cleared.", "ok");
  }
}

function renderArtifactHistory() {
  if (!el.artifactHistoryList) return;
  const history = normalizeReleasePacketHistory(appState.releasePacketHistory);
  appState.releasePacketHistory = history;
  el.artifactHistoryList.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "artifact-history-empty";
    empty.textContent = "No release packets yet. Build one from the Release Cockpit to keep a local handoff ledger.";
    el.artifactHistoryList.appendChild(empty);
  } else {
    history.forEach((artifact, index) => {
      const card = document.createElement("div");
      const isActive = Boolean(
        appState.lastArtifact
        && String(appState.lastArtifact.outputMode || "").trim() === "release_packet"
        && releasePacketHistoryKey(appState.lastArtifact) === releasePacketHistoryKey(artifact)
      );
      card.className = `workspace-action-card artifact-history-card${isActive ? " is-active" : ""}`;

      const head = document.createElement("div");
      head.className = "workspace-action-card-head";

      const copy = document.createElement("div");
      copy.className = "workspace-action-card-copy";

      const title = document.createElement("div");
      title.className = "workflow-title-text";
      title.textContent = artifact.title || "Release Packet";

      const summary = document.createElement("p");
      summary.textContent = artifactHistorySummaryLine(artifact);

      copy.appendChild(title);
      copy.appendChild(summary);

      const state = document.createElement("div");
      state.className = "workspace-action-state";
      state.textContent = isActive ? "Loaded" : "History";

      head.appendChild(copy);
      head.appendChild(state);

      const meta = document.createElement("div");
      meta.className = "trust-scope-row";
      meta.appendChild(createStatusPill(formatTimestampLabel(artifact.generatedAt), "read"));
      meta.appendChild(createStatusPill((getWorkflow(artifact.workflowId) || {}).title || normalizeWorkflowId(artifact.workflowId), "guard"));
      meta.appendChild(createStatusPill("Release packet", "ok"));

      const actions = document.createElement("div");
      actions.className = "row row-wrap action-grid artifact-history-actions";

      const loadButton = document.createElement("button");
      loadButton.className = isActive ? "btn-primary" : "btn-secondary";
      loadButton.textContent = isActive ? "Loaded in Dock" : "Load to Dock";
      loadButton.disabled = isActive;
      loadButton.onclick = () => {
        loadReleasePacketHistoryEntry(index).catch((err) => showBanner(err.message || String(err), "bad"));
      };
      actions.appendChild(loadButton);

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(actions);
      el.artifactHistoryList.appendChild(card);
    });
  }
  if (el.clearArtifactHistoryBtn) {
    el.clearArtifactHistoryBtn.disabled = history.length === 0;
  }
}

function renderArtifactPanel() {
  const artifact = appState.lastArtifact;
  const workflow = getWorkflow(artifact && artifact.workflowId ? artifact.workflowId : appState.workflowId);
  const outputMode = getOutputMode(artifact && artifact.outputMode ? artifact.outputMode : appState.outputMode);
  if (el.artifactTitleText) {
    el.artifactTitleText.textContent = artifact && artifact.title
      ? artifact.title
      : `${(workflow && workflow.title) || "Workflow"} Artifact`;
  }
  if (el.artifactMetaText) {
    el.artifactMetaText.textContent = artifact && artifact.generatedAt
      ? `${(outputMode && outputMode.label) || "Output"} | ${formatTimestampLabel(artifact.generatedAt)}`
      : `${(outputMode && outputMode.label) || "Output"} | No generated artifact yet`;
  }
  if (el.artifactPreview) {
    el.artifactPreview.textContent = artifact && artifact.content
      ? artifact.content
      : "No artifact yet.\nGenerate a response from the active workflow to preview structured output here.";
  }
  renderArtifactHistory();
  renderWorkspaceActionDeck();
  renderReleaseCockpit();
  renderMissionControl();
}

function renderWorkspaceAttachment() {
  if (el.workspaceSummaryText) {
    el.workspaceSummaryText.textContent = formatWorkspaceAttachment(appState.workspaceAttachment);
  }
  renderWorkspaceActionDeck();
  renderReleaseCockpit();
  renderMissionControl();
}

function renderWorkflowFollowups(workflow) {
  if (!el.workflowFollowupActions) return;
  el.workflowFollowupActions.innerHTML = "";
  const actions = Array.isArray(workflow && workflow.followUpActions) ? workflow.followUpActions : [];
  for (const action of actions) {
    const button = document.createElement("button");
    button.className = "btn-secondary workflow-followup-btn";
    button.textContent = String(action);
    button.onclick = () => {
      if (!el.promptInput) return;
      el.promptInput.value = String(action);
      updatePromptMetrics();
      updateCommandHint();
      el.promptInput.focus();
      showBanner("Follow-up prompt loaded.", "ok");
    };
    el.workflowFollowupActions.appendChild(button);
  }
}

function renderWorkflowQuickActions() {
  if (!el.workflowQuickActions) return;
  el.workflowQuickActions.innerHTML = "";
  for (const workflow of WORKFLOWS) {
    const button = document.createElement("button");
    button.className = "btn-secondary workflow-quick-btn";
    button.textContent = workflow.title;
    button.dataset.workflowId = workflow.id;
    button.classList.toggle("is-active", workflow.id === appState.workflowId);
    button.onclick = () => {
      activateWorkflow(workflow.id).catch((err) => showBanner(err.message || String(err), "bad"));
    };
    el.workflowQuickActions.appendChild(button);
  }
}

function populateOutputModeSelect() {
  if (!el.outputModeSelect) return;
  if (el.outputModeSelect.options.length === 0) {
    for (const mode of OUTPUT_MODES) {
      const option = document.createElement("option");
      option.value = mode.id;
      option.textContent = mode.label;
      el.outputModeSelect.appendChild(option);
    }
  }
  el.outputModeSelect.value = normalizeOutputMode(appState.outputMode, appState.workflowId);
}

function populateOnboardingWorkflowSelect() {
  if (!el.onboardingWorkflowSelect) return;
  el.onboardingWorkflowSelect.innerHTML = "";
  for (const workflow of WORKFLOWS) {
    const option = document.createElement("option");
    option.value = workflow.id;
    option.textContent = workflow.title;
    el.onboardingWorkflowSelect.appendChild(option);
  }
  el.onboardingWorkflowSelect.value = normalizeWorkflowId(appState.workflowId);
}

function renderWorkflowSummary() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  if (el.workflowTitleText) {
    el.workflowTitleText.textContent = workflow ? workflow.title : "Workflow";
  }
  if (el.workflowDescriptionText) {
    const parts = [];
    if (workflow && workflow.description) parts.push(workflow.description);
    if (outputMode && outputMode.instruction) parts.push(`Output contract: ${outputMode.instruction}`);
    el.workflowDescriptionText.textContent = parts.join(" ");
  }
  populateOutputModeSelect();
  populateOnboardingWorkflowSelect();
  renderWorkflowFollowups(workflow);
  renderWorkflowQuickActions();
  renderReleaseCockpit();
  renderOperatorRail();
  renderMissionControl();
}

function workflowPromptTemplate(workflow) {
  return workflow && workflow.starterPrompt ? String(workflow.starterPrompt) : "";
}

function workflowSystemInstruction() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const workspace = appState.workspaceAttachment;
  const lines = [
    `[WORKFLOW] ${(workflow && workflow.title) || "Workflow"}`,
    workflow && workflow.description ? workflow.description : "",
    outputMode ? `[OUTPUT MODE] ${outputMode.label}: ${outputMode.instruction}` : ""
  ];
  if (workspace && typeof workspace === "object") {
    const workspaceSignals = Array.isArray(workspace.signals) && workspace.signals.length
      ? workspace.signals.join(", ")
      : "none";
    lines.push(
      `[WORKSPACE] label=${String(workspace.label || "")} root=${String(workspace.rootPath || "")} signals=${workspaceSignals}`
    );
  } else {
    lines.push("[WORKSPACE] No workspace attached.");
  }
  return lines.filter(Boolean).join("\n");
}

async function persistChatState() {
  if (!window.api || !window.api.state) return;
  await window.api.state.update({
    chat: appState.chat,
    tokens: countTokens(appState.chat),
    model: appState.model,
    workflowId: normalizeWorkflowId(appState.workflowId),
    outputMode: normalizeOutputMode(appState.outputMode, appState.workflowId),
    workspaceAttachment: appState.workspaceAttachment,
    lastArtifact: appState.lastArtifact,
    releasePacketHistory: appState.releasePacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
    verificationRunPlan: appState.verificationRunPlan
  });
}

async function activateWorkflow(workflowId, options = {}) {
  const workflow = getWorkflow(workflowId);
  if (!workflow) return;
  const shouldSeedPrompt = options.seedPrompt !== false;
  const shouldPersist = options.persist !== false;
  const shouldAnnounce = options.announce !== false;
  appState.workflowId = workflow.id;
  appState.outputMode = normalizeOutputMode(options.outputMode || workflow.defaultOutputMode, workflow.id);
  resetPatchPlanState();
  resetWorkspaceActions();
  renderWorkflowSummary();
  renderPatchPlanPanel();
  renderArtifactPanel();
  if (shouldSeedPrompt && el.promptInput) {
    el.promptInput.value = workflowPromptTemplate(workflow);
    updatePromptMetrics();
    updateCommandHint();
    el.promptInput.focus();
  }
  if (shouldPersist) {
    await persistChatState();
  }
  if (shouldAnnounce) {
    showBanner(`Workflow loaded: ${workflow.title}`, "ok");
  }
}

async function setOutputMode(outputModeId, options = {}) {
  appState.outputMode = normalizeOutputMode(outputModeId, appState.workflowId);
  resetPatchPlanState();
  if (appState.outputMode === "patch_plan" && appState.lastArtifact) {
    try {
      appState.patchPlan = parsePatchPlanFromArtifactContent(appState.lastArtifact.content, {
        generatedAt: appState.lastArtifact.generatedAt,
        workflowId: appState.workflowId
      });
      appState.patchPlanGroupOpenIds = null;
      appState.patchPlanPreviewFileId = appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "";
    } catch {
      appState.patchPlan = null;
      appState.patchPlanGroupOpenIds = null;
    }
  }
  resetWorkspaceActions();
  renderWorkflowSummary();
  renderPatchPlanPanel();
  renderArtifactPanel();
  if (options.persist !== false) {
    await persistChatState();
  }
}

async function setWorkspaceAttachment(summary, options = {}) {
  const previousWorkspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  appState.workspaceAttachment = summary && typeof summary === "object" ? summary : null;
  reconcileWorkspaceBoundState(previousWorkspaceRoot);
  resetWorkspaceActions();
  renderWorkspaceAttachment();
  renderWorkflowSummary();
  renderPatchPlanPanel();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(
      appState.workspaceAttachment
        ? `Workspace attached: ${String(appState.workspaceAttachment.label || "workspace")}`
        : "Workspace cleared.",
      "ok"
    );
  }
}

async function attachWorkspaceFromDialog() {
  if (!window.api || !window.api.workspace) return;
  const summary = await window.api.workspace.pickRoot();
  if (!summary) return;
  await setWorkspaceAttachment(summary);
}

async function clearWorkspaceAttachment() {
  if (window.api && window.api.workspace) {
    await window.api.workspace.clear();
  }
  await setWorkspaceAttachment(null);
}

async function buildEvidenceBundle() {
  const [state, logRows, chatRows, stats] = await Promise.all([
    window.api && window.api.state ? window.api.state.export() : {},
    window.api && window.api.logger ? window.api.logger.tail(120) : [],
    window.api && window.api.chatlog ? window.api.chatlog.tail(120) : [],
    window.api && window.api.system ? window.api.system.getStats() : {}
  ]);
  let bridgeHealth = null;
  try {
    bridgeHealth = window.api && window.api.llm ? await window.api.llm.health() : null;
  } catch (err) {
    bridgeHealth = { ok: false, reason: err.message || String(err) };
  }
  return {
    generatedAt: new Date().toISOString(),
    workflowId: normalizeWorkflowId(appState.workflowId),
    outputMode: normalizeOutputMode(appState.outputMode, appState.workflowId),
    commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
    chat: getCurrentChat(),
    sessionMetadata: appState.sessionsMeta,
    settings: appState.settings,
    workspaceAttachment: appState.workspaceAttachment,
    runtimeSummary: {
      systemStats: stats,
      llmStatus: appState.llmStatus,
      bridgeHealth
    },
    recentLogs: logRows,
    recentChatLogs: chatRows,
    artifact: appState.lastArtifact,
    releasePacketHistory: appState.releasePacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    verificationRunPlan: appState.verificationRunPlan,
    state
  };
}

function showBanner(message, tone = "ok") {
  if (el.statusLabel) {
    el.statusLabel.textContent = `[${tone}] ${message}`;
    el.statusLabel.dataset.tone = tone;
  }
}

function describeLlmStatus(status) {
  const normalized = String(status || "unknown").trim().toLowerCase();
  switch (normalized) {
    case "online":
    case "bridge_online":
      return {
        short: "Local bridge online.",
        detail: "NeuralShell can reach the active model bridge.",
        tone: "ok"
      };
    case "busy":
      return {
        short: "Bridge busy.",
        detail: "A request is in flight.",
        tone: "ok"
      };
    case "cancelled":
      return {
        short: "Request cancelled.",
        detail: "Generation was cancelled cleanly.",
        tone: "bad"
      };
    case "reconnecting":
    case "bridge_reconnecting":
      return {
        short: "Local bridge unavailable.",
        detail: "Start Ollama or use Detect Local Bridge from the toolbar or settings menu.",
        tone: "bad"
      };
    case "bridge_offline":
      return {
        short: "Bridge offline.",
        detail: "Reconnect is disabled until you apply settings or start the local bridge.",
        tone: "bad"
      };
    case "error":
      return {
        short: "Bridge error.",
        detail: "The last request failed. Check the base URL, timeout, or local bridge process.",
        tone: "bad"
      };
    case "booting":
      return {
        short: "Checking local bridge...",
        detail: "NeuralShell is probing the configured model bridge.",
        tone: "ok"
      };
    default:
      return {
        short: `LLM status: ${normalized || "unknown"}.`,
        detail: "Use the settings menu to inspect the active bridge profile.",
        tone: "ok"
      };
  }
}

function updateIntelBrief() {
  const localOnly = !appState.settings.allowRemoteBridge;
  const reconnect = appState.settings.connectOnStartup !== false;
  if (el.intelModeText) {
    const theme = String(appState.settings.theme || "dark");
    el.intelModeText.textContent = `${localOnly ? "Local-only bridge" : "Remote bridge allowed"} | ${reconnect ? "auto reconnect" : "manual reconnect"} | ${theme}`;
  }
  if (el.intelBridgeText) {
    const copy = describeLlmStatus(appState.llmStatus);
    el.intelBridgeText.textContent = copy.short;
    el.intelBridgeText.dataset.tone = copy.tone;
  }
  if (el.intelSessionText) {
    const count = Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0;
    const activeName = String((el.sessionName && el.sessionName.value) || "").trim();
    if (!count) {
      el.intelSessionText.textContent = "No session index loaded.";
      return;
    }
    el.intelSessionText.textContent = activeName
      ? `${count} indexed | Active ${activeName}`
      : `${count} indexed | No active session`;
  }
}

function updateWorkspaceModeText() {
  if (!el.workspaceModeText) return;
  const localOnly = !appState.settings.allowRemoteBridge;
  const reconnect = appState.settings.connectOnStartup !== false;
  const segments = [
    localOnly ? "Local-only bridge" : "Remote bridge allowed",
    reconnect ? "auto reconnect on" : "manual reconnect",
    String(appState.settings.theme || "dark")
  ];
  el.workspaceModeText.textContent = segments.join(" | ");
  updateIntelBrief();
  renderIntelSurface();
}

function applyLlmStatus(status) {
  appState.llmStatus = String(status || "unknown");
  const copy = describeLlmStatus(appState.llmStatus);
  if (el.statusMeta) {
    el.statusMeta.textContent = copy.short;
    el.statusMeta.dataset.tone = copy.tone;
  }
  if (el.bridgeStatusText) {
    el.bridgeStatusText.textContent = copy.detail;
  }
  updateWorkspaceModeText();
  renderOperatorRail();
  if (!appState.chat.length) {
    renderChat(appState.chat);
  }
}

function setSettingsMenuOpen(open) {
  const next = Boolean(open);
  if (next && appState.commandPaletteOpen) {
    setCommandPaletteOpen(false);
  }
  appState.settingsMenuOpen = next;
  if (document && document.body) {
    document.body.classList.toggle("settings-menu-open", next);
  }
  if (el.settingsMenuOpenBtn) {
    el.settingsMenuOpenBtn.setAttribute("aria-expanded", String(next));
  }
  if (el.settingsMenuPanel) {
    el.settingsMenuPanel.classList.toggle("hidden", !next);
    el.settingsMenuPanel.classList.toggle("is-open", next);
    el.settingsMenuPanel.setAttribute("aria-hidden", String(!next));
  }
  if (el.settingsMenuBackdrop) {
    el.settingsMenuBackdrop.classList.toggle("hidden", !next);
    el.settingsMenuBackdrop.setAttribute("aria-hidden", String(!next));
  }
  if (next) {
    setTimeout(() => {
      if (el.settingsMenuCloseBtn) el.settingsMenuCloseBtn.focus();
    }, 0);
  } else {
    setTimeout(() => {
      if (el.settingsMenuOpenBtn) el.settingsMenuOpenBtn.focus();
    }, 0);
  }
}

function seedStarterPrompt() {
  if (!el.promptInput) return;
  const workflow = getWorkflow(appState.workflowId);
  el.promptInput.value = workflowPromptTemplate(workflow) || "Diagnose the local bridge, recommend the smallest safe fix, and keep the workflow offline-first.";
  updatePromptMetrics();
  updateCommandHint();
  el.promptInput.focus();
  showBanner("Starter prompt loaded.", "ok");
}

async function runBridgeAutoDetect() {
  if (!window.api || !window.api.llm) return;
  showBanner("Detecting local bridge...", "ok");
  try {
    const result = await window.api.llm.autoDetect();
    if (result && result.ok) {
      await refreshModels();
      applyLlmStatus("bridge_online");
      showBanner(`Local bridge detected at ${result.baseUrl}.`, "ok");
      return result;
    }
    applyLlmStatus(appState.settings.connectOnStartup !== false ? "bridge_reconnecting" : "bridge_offline");
    showBanner(`Local bridge not detected: ${result && result.reason ? result.reason : "offline"}`, "bad");
    return result;
  } catch (err) {
    applyLlmStatus("error");
    showBanner(`Bridge detect failed: ${err.message || String(err)}`, "bad");
    throw err;
  }
}

async function runBridgeHealthCheck() {
  if (!window.api || !window.api.llm) return;
  showBanner("Checking bridge health...", "ok");
  try {
    const health = await window.api.llm.health();
    applyLlmStatus(health && health.ok ? "bridge_online" : "bridge_offline");
    showBanner(
      health && health.ok
        ? `Bridge healthy at ${health.baseUrl}.`
        : `Bridge health failed: ${health && health.reason ? health.reason : "offline"}`,
      health && health.ok ? "ok" : "bad"
    );
    return health;
  } catch (err) {
    applyLlmStatus("error");
    showBanner(`Bridge health failed: ${err.message || String(err)}`, "bad");
    throw err;
  }
}

function renderChatEmptyState() {
  const empty = document.createElement("div");
  empty.className = "chat-empty chat-empty-rich";

  const title = document.createElement("div");
  title.className = "chat-empty-title";
  title.textContent = "No active conversation yet.";

  const note = document.createElement("p");
  note.className = "chat-empty-note";
  note.textContent = describeLlmStatus(appState.llmStatus).detail;

  const actions = document.createElement("div");
  actions.className = "chat-empty-actions";

  const detectBtn = document.createElement("button");
  detectBtn.textContent = "Detect Local Bridge";
  detectBtn.onclick = () => {
    runBridgeAutoDetect().catch((err) => showBanner(err.message || String(err), "bad"));
  };

  const settingsBtn = document.createElement("button");
  settingsBtn.textContent = "Open Settings Menu";
  settingsBtn.onclick = () => {
    setSettingsMenuOpen(true);
  };

  const promptBtn = document.createElement("button");
  promptBtn.textContent = "Load Starter Prompt";
  promptBtn.onclick = () => {
    seedStarterPrompt();
  };

  actions.appendChild(detectBtn);
  actions.appendChild(settingsBtn);
  actions.appendChild(promptBtn);
  empty.appendChild(title);
  empty.appendChild(note);
  empty.appendChild(actions);
  return empty;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function formatTimestampLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "No timestamp";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Timestamp unavailable";
  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function updateDashboardSummary() {
  if (el.modelSummary) {
    el.modelSummary.textContent = String(appState.model || "offline");
  }
  if (el.sessionSummary) {
    const count = Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0;
    el.sessionSummary.textContent = count > 0 ? `${count} indexed` : "No sessions";
  }
  if (el.commandSummary) {
    const count = Array.isArray(appState.commands) ? appState.commands.length : 0;
    el.commandSummary.textContent = count > 0 ? `${count} loaded` : "No commands";
  }
  if (el.tokenSummary) {
    const total = countTokens(appState.chat);
    el.tokenSummary.textContent = total > 0 ? `${total} tokens` : "Cold start";
  }
  updateIntelBrief();
  renderMissionControl();
}

function countTokens(messages) {
  if (!Array.isArray(messages)) return 0;
  let n = 0;
  for (const row of messages) {
    const text = String(row && row.content ? row.content : "").trim();
    if (text) n += text.split(/\s+/).length;
  }
  return n;
}

function filteredChat(messages) {
  const q = String(appState.chatFilter || "").trim().toLowerCase();
  if (!q) return messages;
  return messages.filter((m) => `${m.role || ""} ${m.content || ""}`.toLowerCase().includes(q));
}

function renderChat(messages = [], options = {}) {
  appState.chat = Array.isArray(messages) ? messages.slice() : [];
  if (el.chatHistory) {
    const list = filteredChat(appState.chat);
    el.chatHistory.innerHTML = "";
    for (let i = 0; i < list.length; i += 1) {
      const row = list[i] || {};
      const role = String(row.role || "assistant").toLowerCase();
      const item = document.createElement("article");
      item.className = `chat-msg role-${role}`;
      const head = document.createElement("header");
      head.className = "chat-head";
      const roleTag = document.createElement("span");
      roleTag.className = "chat-head-role";
      roleTag.textContent = role;
      const turnTag = document.createElement("span");
      turnTag.className = "chat-head-index";
      turnTag.textContent = `Turn ${i + 1}`;
      const body = document.createElement("pre");
      body.className = "chat-content";
      body.textContent = String(row.content || "");
      head.appendChild(roleTag);
      head.appendChild(turnTag);
      item.appendChild(head);
      item.appendChild(body);
      el.chatHistory.appendChild(item);
    }
    if (!list.length) {
      el.chatHistory.appendChild(renderChatEmptyState());
    }
    const auto = !el.autoScrollInput || el.autoScrollInput.checked;
    if (auto) {
      el.chatHistory.scrollTop = el.chatHistory.scrollHeight;
    }
  }
  const totalTokens = countTokens(appState.chat);
  if (el.tokensUsed) el.tokensUsed.textContent = `Token Load ${totalTokens}`;
  if (options.syncArtifact !== false) {
    syncArtifactFromChat();
  }
  updateDashboardSummary();
}

function getCurrentChat() {
  return appState.chat.slice();
}

function setTyping(on) {
  if (el.typingIndicator) el.typingIndicator.textContent = on ? "Assistant streaming response..." : "";
}

function updatePromptMetrics() {
  if (!el.promptInput || !el.promptMetrics) return;
  const text = String(el.promptInput.value || "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  el.promptMetrics.textContent = `Prompt ${text.length}c / ${words}w`;
}

function markdown(messages) {
  return (messages || []).map((m) => `### ${m.role}\n\n${m.content || ""}`).join("\n\n");
}

function lastAssistant() {
  for (let i = appState.chat.length - 1; i >= 0; i -= 1) {
    if (appState.chat[i] && appState.chat[i].role === "assistant") return appState.chat[i];
  }
  return null;
}

function download(filename, text, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([String(text || "")], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

async function copyText(value) {
  const text = String(value || "");
  if (!text) return false;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back below.
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return Boolean(ok);
}

function renderSessions(items) {
  if (!el.sessionList) return;
  const rows = Array.isArray(items) ? items.slice() : [];
  appState.sessionsIndex = rows
    .map((row) => typeof row === "string" ? row : String(row && row.name || ""))
    .filter(Boolean);
  if (el.sessionOpsSummary) {
    const activeName = String((el.sessionName && el.sessionName.value) || "").trim();
    el.sessionOpsSummary.textContent = rows.length
      ? `${rows.length} indexed sessions. Keep save/load visible, then open trays only for maintenance or deep metadata.`
      : "No saved sessions yet. Use this deck to stage the first encrypted snapshot.";
    if (activeName) {
      el.sessionOpsSummary.textContent += ` Active target: ${activeName}.`;
    }
  }
  el.sessionList.innerHTML = "";
  if (!rows.length) {
    const li = document.createElement("li");
    li.className = "list-empty";
    li.textContent = "No saved sessions yet.";
    el.sessionList.appendChild(li);
    updateDashboardSummary();
    renderIntelSurface();
    return;
  }
  for (const row of rows) {
    const name = typeof row === "string" ? row : String(row.name || "");
    if (!name) continue;
    const meta = appState.sessionsMeta[name] || {};
    const li = document.createElement("li");
    li.className = "session-item";
    if (el.sessionName && String(el.sessionName.value || "").trim() === name) {
      li.classList.add("is-active");
    }
    const top = document.createElement("div");
    top.className = "list-item-top";
    const title = document.createElement("div");
    title.className = "list-item-name";
    title.textContent = name;
    const badge = document.createElement("span");
    badge.className = "list-item-badge";
    badge.textContent = meta.workflowId
      ? String((getWorkflow(meta.workflowId) && getWorkflow(meta.workflowId).title) || meta.workflowId)
      : `${meta.tokens || 0} tok`;
    const metaLine = document.createElement("div");
    metaLine.className = "list-item-meta";
    const metaParts = [`Updated ${formatTimestampLabel(meta.updatedAt)}`];
    if (meta.outputMode) metaParts.push(`Mode ${meta.outputMode}`);
    if (meta.workspaceLabel) metaParts.push(`Workspace ${meta.workspaceLabel}`);
    if (meta.paletteShortcuts) metaParts.push(`Shortcuts ${meta.paletteShortcuts}`);
    if (meta.verificationChecks) metaParts.push(`Verify ${meta.verificationChecks} checks`);
    if (meta.patchPlanFiles) metaParts.push(`Patch ${meta.patchPlanFiles} files`);
    metaLine.textContent = metaParts.join(" | ");
    top.appendChild(title);
    top.appendChild(badge);
    li.appendChild(top);
    li.appendChild(metaLine);
    li.onclick = () => {
      if (el.sessionName) el.sessionName.value = name;
      for (const node of Array.from(el.sessionList.children)) {
        node.classList.remove("is-active");
      }
      li.classList.add("is-active");
      updateDashboardSummary();
      renderIntelSurface();
    };
    el.sessionList.appendChild(li);
  }
  updateDashboardSummary();
  renderIntelSurface();
}

async function refreshSessions() {
  if (!window.api || !window.api.session) return;
  const [names, metadata] = await Promise.all([
    window.api.session.list(),
    window.api.session.metadata()
  ]);
  appState.sessionsMeta = metadata && typeof metadata === "object" ? metadata : {};
  const rows = (Array.isArray(names) ? names : []).map((name) => ({ name }));
  const mode = String((el.sessionSortSelect && el.sessionSortSelect.value) || "name_asc");
  rows.sort((a, b) => String(a.name).localeCompare(String(b.name)));
  if (mode === "name_desc") rows.reverse();
  if (mode === "updated_desc") {
    rows.sort((a, b) => {
      const aTime = String((appState.sessionsMeta[a.name] || {}).updatedAt || "");
      const bTime = String((appState.sessionsMeta[b.name] || {}).updatedAt || "");
      return bTime.localeCompare(aTime);
    });
  }
  renderSessions(rows);
  if (el.sessionMetadataOutput) el.sessionMetadataOutput.textContent = JSON.stringify(appState.sessionsMeta, null, 2);
}

function setModelOptions(models) {
  if (!el.modelSelect) return;
  const all = Array.from(new Set([appState.model, ...(models || [])].filter(Boolean)));
  el.modelSelect.innerHTML = "";
  for (const model of all) {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    el.modelSelect.appendChild(option);
  }
  el.modelSelect.value = appState.model;
  updateDashboardSummary();
}

async function refreshModels() {
  if (!window.api || !window.api.llm) return;
  try {
    const models = await window.api.llm.listModels();
    setModelOptions(Array.isArray(models) ? models : []);
    populateOnboardingModelSelect();
    applyLlmStatus("bridge_online");
    showBanner("Models refreshed.", "ok");
  } catch (err) {
    setModelOptions([appState.model]);
    populateOnboardingModelSelect();
    applyLlmStatus(appState.settings.connectOnStartup !== false ? "bridge_reconnecting" : "bridge_offline");
    showBanner(`Model refresh failed: ${err.message || String(err)}`, "bad");
  }
}

function renderCommandList(commands) {
  if (!el.commandList) return;
  el.commandList.innerHTML = "";
  const rows = Array.isArray(commands) ? commands : [];
  if (el.commandBusSummary) {
    const localCount = rows.filter((cmd) => String((cmd && cmd.source) || "").toLowerCase() === "local").length;
    const coreCount = rows.filter((cmd) => String((cmd && cmd.source) || "").toLowerCase() !== "local").length;
    el.commandBusSummary.textContent = rows.length
      ? `${rows.length} commands indexed (${localCount} local, ${coreCount} core/plugin). Use the palette first, then open the raw index only for low-level recall.`
      : "No commands discovered. Refresh the bus or route through the palette once the catalog is available.";
  }
  if (!rows.length) {
    const li = document.createElement("li");
    li.className = "list-empty";
    li.textContent = "No commands discovered.";
    el.commandList.appendChild(li);
    updateDashboardSummary();
    return;
  }
  for (const cmd of rows) {
    const li = document.createElement("li");
    li.className = "command-item";
    const args = Array.isArray(cmd.args) && cmd.args.length ? ` ${(cmd.args || []).join(" ")}` : "";
    const top = document.createElement("div");
    top.className = "list-item-top";
    const title = document.createElement("div");
    title.className = "list-item-name";
    title.textContent = `/${cmd.name}${args}`;
    const badge = document.createElement("span");
    badge.className = "list-item-badge";
    badge.textContent = String(cmd.source || "core");
    const meta = document.createElement("div");
    meta.className = "list-item-meta";
    meta.textContent = String(cmd.description || "No description available.");
    top.appendChild(title);
    top.appendChild(badge);
    li.appendChild(top);
    li.appendChild(meta);
    el.commandList.appendChild(li);
  }
  updateDashboardSummary();
}

function mergeCommandCatalog(remoteCommands) {
  const merged = [];
  const seen = new Set();
  for (const cmd of [...(Array.isArray(remoteCommands) ? remoteCommands : []), ...LOCAL_COMMANDS]) {
    const name = String(cmd && cmd.name || "").trim().toLowerCase();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    merged.push({
      name,
      description: String(cmd && cmd.description || ""),
      args: Array.isArray(cmd && cmd.args) ? cmd.args.map((arg) => String(arg)) : [],
      source: String(cmd && cmd.source || "core")
    });
  }
  return merged;
}

function initializePromptSnippets() {
  if (!el.snippetSelect || el.snippetSelect.options.length > 0) return;
  for (const snippet of PROMPT_SNIPPETS) {
    const option = document.createElement("option");
    option.value = snippet.id;
    option.textContent = snippet.label;
    el.snippetSelect.appendChild(option);
  }
  if (PROMPT_SNIPPETS[0]) {
    el.snippetSelect.value = PROMPT_SNIPPETS[0].id;
  }
}

async function refreshCommands() {
  if (!window.api || !window.api.command) return;
  const commands = await window.api.command.list();
  appState.commands = mergeCommandCatalog(commands);
  renderCommandList(appState.commands);
  renderCommandPaletteList();
}

function getCommandPaletteActions() {
  const promotedActions = (appState.promotedPaletteActions || [])
    .filter((action) => (
      appState.commandPaletteShortcutScope === "all"
        ? true
        : normalizeWorkflowId(action.workflowId) === normalizeWorkflowId(appState.workflowId)
    ))
    .map((action) => ({
    label: action.label,
    detail: action.detail,
    badge: "shortcut",
    run: async () => { loadPromotedPaletteActionPrompt(action.id); }
    }));

  const localActions = [
    {
      label: "Send Prompt",
      detail: "Send current prompt input to model",
      run: async () => { await sendPrompt(); }
    },
    {
      label: "Refresh Models",
      detail: "Reload available model list",
      run: async () => { await refreshModels(); }
    },
    {
      label: "Refresh Sessions",
      detail: "Reload session index and metadata",
      run: async () => { await refreshSessions(); }
    },
    {
      label: "Refresh Commands",
      detail: "Reload slash command catalog",
      run: async () => { await refreshCommands(); }
    },
    {
      label: "LLM Health Check",
      detail: "Run /health command",
      run: async () => { await sendPromptFromText("/health", null, false); }
    },
    {
      label: "Auto Detect Bridge",
      detail: "Run /autodetect command",
      run: async () => { await runBridgeAutoDetect(); }
    },
    {
      label: "Open Settings Menu",
      detail: "Open the drawer for bridge and interface settings",
      run: async () => { setSettingsMenuOpen(true); }
    },
    {
      label: "Bridge Health Check",
      detail: "Probe the active bridge profile",
      run: async () => { await runBridgeHealthCheck(); }
    },
    {
      label: "Open Onboarding",
      detail: "Show first-run quick setup overlay",
      run: async () => { setOnboardingOpen(true); }
    },
    {
      label: "Attach Workspace",
      detail: "Pick one local workspace root for workflow context",
      run: async () => { await attachWorkspaceFromDialog(); }
    },
    {
      label: "Clear Workspace",
      detail: "Remove the current attached workspace summary",
      run: async () => { await clearWorkspaceAttachment(); }
    },
    {
      label: "Export Evidence Bundle",
      detail: "Package workflow, logs, runtime posture, and session state into one JSON artifact",
      run: async () => { await exportEvidenceBundle(); }
    },
    {
      label: "Preview Markdown Report",
      detail: "Preview a guarded markdown write inside the attached workspace",
      run: async () => { await previewWorkspaceActionProposal("artifact_markdown"); }
    },
    {
      label: "Preview Evidence Write",
      detail: "Preview the local evidence bundle write path and payload",
      run: async () => { await previewWorkspaceActionProposal("evidence_bundle_json"); }
    },
    {
      label: "Load Artifact as Patch Plan",
      detail: "Parse the latest artifact into a multi-file patch plan",
      run: async () => { await loadPatchPlanFromArtifact(); }
    },
    {
      label: "Preview Patch Plan",
      detail: "Preview all file diffs in the current patch plan",
      run: async () => { await previewPatchPlanFiles(); }
    },
    {
      label: "Apply Selected Patch Files",
      detail: "Apply only the selected files from the current patch plan",
      run: async () => { await applyPatchPlanFiles(false); }
    },
    {
      label: "Apply Entire Patch Plan",
      detail: "Apply every file in the current patch plan",
      run: async () => { await applyPatchPlanFiles(true); }
    },
    {
      label: "Run Verification Plan",
      detail: "Run the selected local checks from the staged verification plan",
      run: async () => { await runVerificationRunPlanSelectedChecks(); }
    },
    {
      label: "Stage Release Verification",
      detail: "Queue lint, founder e2e, and store screenshot refresh into the release cockpit",
      run: async () => { stageReleaseCockpit(); }
    },
    {
      label: "Run Release Verification",
      detail: "Run the selected checks from the staged release cockpit plan",
      run: async () => { await runReleaseCockpitChecks(); }
    },
    {
      label: "Build Release Packet",
      detail: "Generate a dock-ready release packet from the current cockpit, artifact, and verification state",
      run: async () => { await buildReleasePacketArtifact(); }
    },
    {
      label: "Copy Verification Commands",
      detail: "Copy the selected npm commands from the staged verification plan",
      run: async () => { await copyVerificationRunCommands(); }
    },
    {
      label: "Load Artifact Into File Draft",
      detail: "Copy the latest artifact content into the diff edit draft",
      run: async () => {
        const currentPath = String((el.workspaceEditPathInput && el.workspaceEditPathInput.value) || defaultWorkspaceEditPath()).trim() || defaultWorkspaceEditPath();
        setWorkspaceEditDraft(currentPath, extractDraftContentFromArtifact());
      }
    },
    {
      label: "Preview File Diff",
      detail: "Preview the targeted file replacement diff inside the attached workspace",
      run: async () => { await previewWorkspaceEditDraft(); }
    },
    {
      label: "Apply Previewed Action",
      detail: "Write the currently previewed action into the attached workspace",
      run: async () => {
        if (!appState.workspaceActionPreview) {
          throw new Error("No workspace action preview is loaded.");
        }
        await applyWorkspaceActionProposal(appState.workspaceActionPreview.proposalId);
      }
    },
    {
      label: "Toggle Theme",
      detail: "Switch between dark and light theme",
      run: async () => {
        const nextTheme = String((appState.settings && appState.settings.theme) || "dark") === "dark" ? "light" : "dark";
        await applySettingsPatch({ theme: nextTheme });
        if (el.themeSelect) el.themeSelect.value = nextTheme;
      }
    }
  ];

  const workflowActions = WORKFLOWS.map((workflow) => ({
    label: `Workflow: ${workflow.title}`,
    detail: workflow.description,
    run: async () => { await activateWorkflow(workflow.id); }
  }));

  const slashActions = (appState.commands || []).map((cmd) => {
    const name = String(cmd && cmd.name || "").trim();
    const args = Array.isArray(cmd && cmd.args) && cmd.args.length ? ` ${(cmd.args || []).join(" ")}` : "";
    return {
      label: `/${name}${args}`,
      detail: String(cmd && cmd.description || "Execute slash command"),
      run: async () => { await sendPromptFromText(`/${name}`, null, false); }
    };
  });

  return [...promotedActions, ...localActions, ...workflowActions, ...slashActions];
}

function renderCommandPaletteList() {
  if (!el.commandPaletteList) return;
  const q = String((el.commandPaletteInput && el.commandPaletteInput.value) || "").trim().toLowerCase();
  appState.commandPaletteItems = getCommandPaletteActions()
    .filter((item) => {
      if (!q) return true;
      return `${item.label} ${item.detail}`.toLowerCase().includes(q);
    })
    .slice(0, 40);
  appState.commandPaletteIndex = clampNumber(appState.commandPaletteIndex || 0, 0, Math.max(0, appState.commandPaletteItems.length - 1), 0);

  el.commandPaletteList.innerHTML = "";
  for (let i = 0; i < appState.commandPaletteItems.length; i += 1) {
    const action = appState.commandPaletteItems[i];
    const li = document.createElement("li");
    li.className = "palette-item";
    li.classList.toggle("is-active", i === appState.commandPaletteIndex);
    const top = document.createElement("div");
    top.className = "list-item-top";
    const title = document.createElement("strong");
    title.className = "list-item-name";
    title.textContent = action.label;
    const badge = document.createElement("span");
    badge.className = "list-item-badge";
    badge.textContent = String(action.badge || (action.label.startsWith("/") ? "slash" : "action"));
    const detail = document.createElement("div");
    detail.textContent = action.detail;
    detail.className = "list-item-meta";
    top.appendChild(title);
    top.appendChild(badge);
    li.appendChild(top);
    li.appendChild(detail);
    li.onclick = () => {
      appState.commandPaletteIndex = i;
      executeCommandPaletteAction(i);
    };
    el.commandPaletteList.appendChild(li);
  }
  if (!appState.commandPaletteItems.length) {
    const li = document.createElement("li");
    li.className = "list-empty";
    li.textContent = "No matching actions.";
    el.commandPaletteList.appendChild(li);
  }
}

function moveCommandPaletteSelection(delta) {
  if (!appState.commandPaletteItems.length) return;
  const next = (appState.commandPaletteIndex + Number(delta || 0) + appState.commandPaletteItems.length) % appState.commandPaletteItems.length;
  appState.commandPaletteIndex = next;
  renderCommandPaletteList();
  if (!el.commandPaletteList) return;
  const active = el.commandPaletteList.children[next];
  if (active && typeof active.scrollIntoView === "function") {
    active.scrollIntoView({ block: "nearest" });
  }
}

function executeCommandPaletteAction(index) {
  const i = clampNumber(index, 0, Math.max(0, appState.commandPaletteItems.length - 1), 0);
  const action = appState.commandPaletteItems[i];
  if (!action) return;
  Promise.resolve(action.run())
    .then(() => {
      setCommandPaletteOpen(false);
      showBanner(`Palette action: ${action.label}`, "ok");
    })
    .catch((err) => showBanner(`Palette action failed: ${err.message || String(err)}`, "bad"));
}

function setCommandPaletteOpen(open) {
  const next = Boolean(open);
  if (next && appState.settingsMenuOpen) {
    setSettingsMenuOpen(false);
  }
  appState.commandPaletteOpen = next;
  if (el.commandPaletteOverlay) {
    el.commandPaletteOverlay.classList.toggle("hidden", !next);
    el.commandPaletteOverlay.setAttribute("aria-hidden", String(!next));
  }
  if (el.commandPaletteShortcutScope) {
    el.commandPaletteShortcutScope.value = normalizeCommandPaletteShortcutScope(appState.commandPaletteShortcutScope);
  }
  if (!next) return;
  appState.commandPaletteIndex = 0;
  if (el.commandPaletteInput) {
    el.commandPaletteInput.value = "";
    setTimeout(() => {
      renderCommandPaletteList();
      el.commandPaletteInput && el.commandPaletteInput.focus();
    }, 0);
    return;
  }
  renderCommandPaletteList();
}

function parseCommandTokens(input) {
  const tokens = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = re.exec(input)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3]);
  }
  return tokens;
}

function parseSlashCommand(text) {
  const raw = String(text || "").trim();
  if (!raw.startsWith("/")) return null;
  const payload = raw.slice(1).trim();
  if (!payload) return { name: "help", args: [] };
  const tokens = parseCommandTokens(payload);
  if (!tokens.length) return { name: "help", args: [] };
  return { name: String(tokens[0] || "").toLowerCase(), args: tokens.slice(1).map(String) };
}

function formatCommandResult(result) {
  if (result == null) return "ok";
  if (typeof result === "string") return result;
  if (typeof result === "number" || typeof result === "boolean") return String(result);
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

function extractAssistantContent(response) {
  if (response && response.message && typeof response.message.content === "string") {
    return response.message.content;
  }
  if (response && typeof response.content === "string") {
    return response.content;
  }
  if (typeof response === "string") {
    return response;
  }
  try {
    return JSON.stringify(response);
  } catch {
    return String(response || "");
  }
}

function normalizeCommandResult(result) {
  if (!result || typeof result !== "object") {
    return result;
  }
  if (Object.prototype.hasOwnProperty.call(result, "ok") && result.ok === false) {
    throw new Error(String(result.error || "Command failed."));
  }
  if (Object.prototype.hasOwnProperty.call(result, "result")) {
    return result.result;
  }
  return result;
}

function updateCommandHint() {
  if (!el.promptInput) return;
  const raw = String(el.promptInput.value || "").trim();
  if (!raw.startsWith("/")) return;
  const name = raw.slice(1).split(/\s+/)[0].toLowerCase();
  const matches = appState.commands
    .filter((cmd) => String(cmd && cmd.name || "").toLowerCase().startsWith(name))
    .slice(0, 5)
    .map((cmd) => `/${cmd.name}`);
  if (el.statusMeta) {
    el.statusMeta.textContent = matches.length ? `Commands: ${matches.join(", ")}` : "No matching commands.";
  }
}

async function runSlashCommand(rawCommand) {
  const parsed = parseSlashCommand(rawCommand);
  if (!parsed || !window.api || !window.api.command) return false;

  if (!appState.commands.length) {
    await refreshCommands();
  }

  try {
    if (parsed.name === "autostep") {
      if (parsed.args.length > 0) {
        throw new Error("/autostep does not take arguments.");
      }
      await runMultiAgentStep({ commandLabel: String(rawCommand || "").trim() });
      showBanner("Command executed: /autostep", "ok");
      return true;
    }

    let outputText = "";
    if (parsed.name === "help") {
      outputText = (appState.commands || [])
        .map((cmd) => {
          const args = Array.isArray(cmd.args) && cmd.args.length ? ` ${(cmd.args || []).join(" ")}` : "";
          return `/${cmd.name}${args} - ${cmd.description || ""}`;
        })
        .join("\n");
    } else if (parsed.name === "health") {
      outputText = formatCommandResult(await runBridgeHealthCheck());
    } else if (parsed.name === "autodetect") {
      outputText = formatCommandResult(await runBridgeAutoDetect());
    } else {
      const result = await window.api.command.run(parsed.name, parsed.args);
      outputText = formatCommandResult(normalizeCommandResult(result));
    }

    const next = [
      ...getCurrentChat(),
      { role: "user", content: String(rawCommand || "").trim() },
      { role: "assistant", content: outputText || "ok" }
    ];
    renderChat(next);
    await persistChatState();
    showBanner(`Command executed: /${parsed.name}`, "ok");
    return true;
  } catch (err) {
    const message = String(err && err.message ? err.message : err || "Command failed.");
    const next = [
      ...getCurrentChat(),
      { role: "user", content: String(rawCommand || "").trim() },
      { role: "assistant", content: `Command failed: ${message}` }
    ];
    renderChat(next);
    await persistChatState();
    showBanner(`Command failed: /${parsed.name}`, "bad");
    return false;
  }
}

function resetStreamState() {
  appState.streamInFlight = false;
  appState.streamBase = [];
  appState.streamText = "";
  setTyping(false);
}

function handleStreamData(detail) {
  if (!appState.streamInFlight) return;
  const token = detail && detail.message && typeof detail.message.content === "string" ? detail.message.content : "";
  if (!token) return;
  appState.streamText += token;
  renderChat([...appState.streamBase, { role: "assistant", content: appState.streamText }]);
}

async function handleStreamComplete() {
  if (!appState.streamInFlight) return;
  renderChat([...appState.streamBase, { role: "assistant", content: appState.streamText }]);
  await persistChatState();
  resetStreamState();
  showBanner("Response received.", "ok");
}

async function handleStreamError(event) {
  if (!appState.streamInFlight) return;
  if (appState.streamText.trim()) {
    await handleStreamComplete();
    return;
  }
  renderChat(appState.streamBase);
  resetStreamState();
  showBanner(`Stream failed: ${String(event && event.detail ? event.detail : "unknown error")}`, "bad");
}

async function sendPromptFromText(inputText, baseMessages, preferStream = true) {
  const text = String(inputText || "").trim();
  if (!text || !window.api || !window.api.llm || appState.streamInFlight) return false;

  const slash = parseSlashCommand(text);
  if (slash) {
    if (el.promptInput && el.promptInput.value.trim() === text) {
      el.promptInput.value = "";
      updatePromptMetrics();
    }
    await runSlashCommand(text);
    return true;
  }

  const base = Array.isArray(baseMessages) ? baseMessages.slice() : getCurrentChat();
  const displayMessages = [...base, { role: "user", content: text }];
  const messages = [...base, { role: "system", content: workflowSystemInstruction() }, { role: "user", content: text }];
  appState.lastPrompt = text;

  if (el.promptInput && el.promptInput.value.trim() === text) {
    el.promptInput.value = "";
    updatePromptMetrics();
  }

  if (preferStream) {
    appState.streamInFlight = true;
    appState.streamBase = displayMessages;
    appState.streamText = "";
    setTyping(true);
    renderChat([...displayMessages, { role: "assistant", content: "" }]);
    showBanner("Streaming...", "ok");
    try {
      const started = await window.api.llm.streamChat(messages);
      if (started === true) {
        return true;
      }
      throw new Error("stream_unavailable");
    } catch (err) {
      const reason = String(err && err.message ? err.message : "stream unavailable");
      renderChat(displayMessages);
      resetStreamState();
      showBanner(`Streaming unavailable (${reason}). Falling back...`, "bad");
    }
  }

  setTyping(true);
  showBanner("Sending...", "ok");
  try {
    const response = await window.api.llm.chat(messages);
    const content = extractAssistantContent(response);
    renderChat([...displayMessages, { role: "assistant", content }]);
    await persistChatState();
    showBanner("Response received.", "ok");
    return true;
  } catch (err) {
    showBanner(`Send failed: ${err.message || String(err)}`, "bad");
    return false;
  } finally {
    setTyping(false);
  }
}

async function sendPrompt() {
  const text = el.promptInput ? String(el.promptInput.value || "") : "";
  return sendPromptFromText(text);
}

function updateAutonomousCheckpoint() {
  appState.autonomous = true;
}

async function runMultiAgentStep(options = {}) {
  if (!window.api || !window.api.llm) return { ok: false, reason: "llm_api_unavailable" };
  const base = getCurrentChat();
  if (!base.length) return { ok: false, reason: "empty_chat" };

  const commandLabel = options && typeof options.commandLabel === "string" ? options.commandLabel.trim() : "";
  const plannerPrompt = [
    "[AUTO][PLANNER] Produce a concise plan for the best next assistant response.",
    "Output 3-5 concrete bullets focused on correctness and user intent."
  ].join(" ");

  setTyping(true);
  try {
    showBanner("Autostep: planning...", "ok");
    const plannerResponse = await window.api.llm.chat([...base, { role: "user", content: plannerPrompt }]);
    const plan = extractAssistantContent(plannerResponse).trim();
    if (!plan) throw new Error("Planner produced empty output.");

    showBanner("Autostep: critique...", "ok");
    const criticPrompt = [
      "[AUTO][CRITIC] Review the plan and tighten weak points.",
      "Return short bullet fixes and risk checks.",
      `Plan:\n${plan}`
    ].join("\n\n");
    const criticResponse = await window.api.llm.chat([...base, { role: "user", content: criticPrompt }]);
    const critique = extractAssistantContent(criticResponse).trim();
    if (!critique) throw new Error("Critic produced empty output.");

    showBanner("Autostep: synthesizing...", "ok");
    const synthesisPrompt = [
      "[AUTO][SYNTHESIZER] Generate the final reply to the user.",
      "Use the plan and critique. Do not mention internal agent stages unless user asked for them.",
      `Plan:\n${plan}`,
      `Critique:\n${critique}`
    ].join("\n\n");
    const finalResponse = await window.api.llm.chat([...base, { role: "user", content: synthesisPrompt }]);
    const content = extractAssistantContent(finalResponse).trim();
    if (!content) throw new Error("Synthesis produced empty output.");

    const next = [
      ...base,
      ...(commandLabel ? [{ role: "user", content: commandLabel }] : []),
      { role: "assistant", content }
    ];
    renderChat(next);
    await persistChatState();
    showBanner("Autostep complete.", "ok");
    return { ok: true, plan, critique, content };
  } catch (err) {
    const message = String(err && err.message ? err.message : err || "autostep failed");
    showBanner(`Autostep failed: ${message}`, "bad");
    return { ok: false, error: message };
  } finally {
    setTyping(false);
  }
}

function syncSettingsInputsFromState() {
  if (el.baseUrlInput) el.baseUrlInput.value = String(appState.settings.ollamaBaseUrl || "http://127.0.0.1:11434");
  if (el.timeoutInput) el.timeoutInput.value = String(appState.settings.timeoutMs || 15000);
  if (el.retryInput) el.retryInput.value = String(appState.settings.retryCount || 2);
  if (el.tokenBudgetInput) el.tokenBudgetInput.value = String(appState.settings.tokenBudget || 1200);
  if (el.autosaveNameInput) el.autosaveNameInput.value = String(appState.settings.autosaveName || "autosave-main");
  if (el.autosaveIntervalInput) el.autosaveIntervalInput.value = String(appState.settings.autosaveIntervalMin || 10);
  if (el.autosaveEnabledInput) el.autosaveEnabledInput.checked = Boolean(appState.settings.autosaveEnabled);
  if (el.connectOnStartupInput) el.connectOnStartupInput.checked = appState.settings.connectOnStartup !== false;
  if (el.allowRemoteBridgeInput) el.allowRemoteBridgeInput.checked = Boolean(appState.settings.allowRemoteBridge);

  if (el.themeSelect && el.themeSelect.options.length === 0) {
    for (const theme of ["dark", "light"]) {
      const option = document.createElement("option");
      option.value = theme;
      option.textContent = theme;
      el.themeSelect.appendChild(option);
    }
  }
  if (el.themeSelect) el.themeSelect.value = String(appState.settings.theme || "dark");
  document.documentElement.setAttribute("data-theme", String(appState.settings.theme || "dark"));
  populateProfileEditor();
  updateWorkspaceModeText();
}

function profileIdFromName(name) {
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "profile";
}

function normalizeProfile(rawProfile, fallbackModel, fallbackId) {
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const profileName = String(profile.name || "Local Ollama").trim() || "Local Ollama";
  return {
    id: String(profile.id || fallbackId || profileIdFromName(profileName)).trim() || "profile",
    name: profileName,
    baseUrl: String(profile.baseUrl || "http://127.0.0.1:11434").trim() || "http://127.0.0.1:11434",
    timeoutMs: clampNumber(profile.timeoutMs, 1000, 120000, 15000),
    retryCount: clampNumber(profile.retryCount, 0, 10, 2),
    defaultModel: String(profile.defaultModel || fallbackModel || "llama3").trim() || "llama3"
  };
}

function getNormalizedProfiles(settings) {
  const current = settings && typeof settings === "object" ? settings : {};
  const fallbackModel = String(appState.model || "llama3");
  let profiles = Array.isArray(current.connectionProfiles) ? current.connectionProfiles.slice() : [];
  if (!profiles.length) {
    profiles = [{
      id: "local-default",
      name: "Local Ollama",
      baseUrl: String(current.ollamaBaseUrl || "http://127.0.0.1:11434"),
      timeoutMs: clampNumber(current.timeoutMs, 1000, 120000, 15000),
      retryCount: clampNumber(current.retryCount, 0, 10, 2),
      defaultModel: fallbackModel
    }];
  }

  const seen = new Set();
  const normalized = [];
  for (const row of profiles) {
    let profile = normalizeProfile(row, fallbackModel);
    let id = profile.id;
    let suffix = 1;
    while (seen.has(id)) {
      id = `${profile.id}-${suffix}`;
      suffix += 1;
    }
    seen.add(id);
    profile = { ...profile, id };
    normalized.push(profile);
  }
  return normalized;
}

function resolveActiveProfileId(settings, profiles) {
  const requested = String((settings && settings.activeProfileId) || "").trim();
  if (requested && profiles.some((row) => row.id === requested)) return requested;
  return profiles[0] ? profiles[0].id : "local-default";
}

function findProfileById(profiles, id) {
  return profiles.find((row) => String(row.id) === String(id)) || null;
}

function populateProfileEditor() {
  if (!el.profileSelect) return;
  const profiles = getNormalizedProfiles(appState.settings);
  const activeId = resolveActiveProfileId(appState.settings, profiles);
  appState.settings.connectionProfiles = profiles;
  appState.settings.activeProfileId = activeId;

  el.profileSelect.innerHTML = "";
  for (const profile of profiles) {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = `${profile.name} (${profile.baseUrl})`;
    el.profileSelect.appendChild(option);
  }
  el.profileSelect.value = activeId;

  const active = findProfileById(profiles, activeId) || profiles[0];
  if (!active) return;
  if (el.profileNameInput) el.profileNameInput.value = active.name;
  if (el.profileBaseUrlInput) el.profileBaseUrlInput.value = active.baseUrl;
  if (el.profileTimeoutInput) el.profileTimeoutInput.value = String(active.timeoutMs);
  if (el.profileRetryInput) el.profileRetryInput.value = String(active.retryCount);
}

function readProfileDraftFromForm() {
  const selectedId = String((el.profileSelect && el.profileSelect.value) || "").trim();
  const name = String((el.profileNameInput && el.profileNameInput.value) || "").trim() || "Local Ollama";
  const profile = normalizeProfile({
    id: selectedId || profileIdFromName(name),
    name,
    baseUrl: String((el.profileBaseUrlInput && el.profileBaseUrlInput.value) || "http://127.0.0.1:11434").trim(),
    timeoutMs: (el.profileTimeoutInput && el.profileTimeoutInput.value) || 15000,
    retryCount: (el.profileRetryInput && el.profileRetryInput.value) || 2,
    defaultModel: appState.model
  }, appState.model, selectedId || profileIdFromName(name));
  return profile;
}

function updateProfileFormFromSelected() {
  const profiles = getNormalizedProfiles(appState.settings);
  const activeId = String((el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(appState.settings, profiles));
  const active = findProfileById(profiles, activeId);
  if (!active) return;
  if (el.profileNameInput) el.profileNameInput.value = active.name;
  if (el.profileBaseUrlInput) el.profileBaseUrlInput.value = active.baseUrl;
  if (el.profileTimeoutInput) el.profileTimeoutInput.value = String(active.timeoutMs);
  if (el.profileRetryInput) el.profileRetryInput.value = String(active.retryCount);
}

async function applySettingsPatch(patch) {
  if (!window.api || !window.api.settings) return appState.settings;
  const current = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
  const merged = {
    ...current,
    ...patch
  };
  const connectionProfiles = getNormalizedProfiles(merged);
  const activeProfileId = resolveActiveProfileId(merged, connectionProfiles);
  const active = findProfileById(connectionProfiles, activeProfileId) || connectionProfiles[0];
  const next = {
    ...merged,
    connectionProfiles,
    activeProfileId
  };
  if (active) {
    next.ollamaBaseUrl = active.baseUrl;
    next.timeoutMs = active.timeoutMs;
    next.retryCount = active.retryCount;
  }
  appState.settings = await window.api.settings.update(next);
  syncSettingsInputsFromState();
  return appState.settings;
}

function populateOnboardingModelSelect() {
  if (!el.onboardingModelSelect || !el.modelSelect) return;
  const candidates = [];
  for (const option of Array.from(el.modelSelect.options || [])) {
    candidates.push(String(option.value || ""));
  }
  const unique = Array.from(new Set(candidates.filter(Boolean)));
  el.onboardingModelSelect.innerHTML = "";
  for (const model of unique) {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    el.onboardingModelSelect.appendChild(option);
  }
  if (unique.length > 0) {
    const preferred = unique.includes(appState.model) ? appState.model : unique[0];
    el.onboardingModelSelect.value = preferred;
  }
  if (el.onboardingAutoScrollInput) {
    el.onboardingAutoScrollInput.checked = !el.autoScrollInput || el.autoScrollInput.checked;
  }
  if (el.onboardingRememberInput) {
    el.onboardingRememberInput.checked = true;
  }
  populateOnboardingWorkflowSelect();
}

function setOnboardingOpen(open) {
  const next = Boolean(open);
  if (next && appState.commandPaletteOpen) {
    setCommandPaletteOpen(false);
  }
  if (next && appState.settingsMenuOpen) {
    setSettingsMenuOpen(false);
  }
  if (el.onboardingOverlay) {
    el.onboardingOverlay.classList.toggle("hidden", !next);
    el.onboardingOverlay.setAttribute("aria-hidden", String(!next));
  }
  if (!next) return;
  populateOnboardingModelSelect();
}

async function completeOnboarding(skip) {
  const shouldSkip = Boolean(skip);
  const remember = !el.onboardingRememberInput || el.onboardingRememberInput.checked;
  if (!shouldSkip && el.onboardingModelSelect) {
    const selected = String(el.onboardingModelSelect.value || "").trim();
    if (selected) {
      appState.model = selected;
      if (el.modelSelect) el.modelSelect.value = selected;
      if (window.api && window.api.llm) {
        await window.api.llm.setModel(selected);
      }
      await persistChatState();
    }
  }
  if (!shouldSkip && el.onboardingWorkflowSelect) {
    await activateWorkflow(String(el.onboardingWorkflowSelect.value || appState.workflowId), {
      seedPrompt: true,
      persist: false,
      announce: false
    });
  }
  if (el.autoScrollInput && el.onboardingAutoScrollInput) {
    el.autoScrollInput.checked = Boolean(el.onboardingAutoScrollInput.checked);
  }
  await applySettingsPatch({
    onboardingCompleted: remember,
    onboardingSeenAt: new Date().toISOString(),
    onboardingVersion: "v1.2.0-pack2"
  });
  setOnboardingOpen(false);
  if (el.statusMeta) {
    el.statusMeta.textContent = remember
      ? `Onboarding remembered (${new Date().toISOString().slice(0, 19).replace("T", " ")})`
      : "Onboarding will be shown again on next launch.";
  }
  showBanner(shouldSkip ? "Onboarding skipped." : "Onboarding complete.", "ok");
}

async function loadInitialState() {
  if (!window.api || !window.api.state) return;
  const state = await window.api.state.get();
  appState.model = String((state && state.model) || "llama3");
  appState.chat = Array.isArray(state && state.chat) ? state.chat.slice() : (Array.isArray(state && state.chatHistory) ? state.chatHistory.slice() : []);
  appState.settings = state && typeof state.settings === "object" ? state.settings : {};
  appState.workflowId = normalizeWorkflowId(state && state.workflowId);
  appState.outputMode = normalizeOutputMode(state && state.outputMode, appState.workflowId);
  appState.commandPaletteShortcutScope = normalizeCommandPaletteShortcutScope(state && state.commandPaletteShortcutScope);
  appState.workspaceAttachment = state && state.workspaceAttachment && typeof state.workspaceAttachment === "object"
    ? state.workspaceAttachment
    : null;
  try {
    appState.verificationRunPlan = state && state.verificationRunPlan && typeof state.verificationRunPlan === "object"
      ? normalizeVerificationRunPlanValue(state.verificationRunPlan, { workflowId: appState.workflowId })
      : null;
  } catch {
    appState.verificationRunPlan = null;
  }
  appState.promotedPaletteActions = normalizePromotedPaletteActions(state && state.promotedPaletteActions);
  appState.lastArtifact = state && state.lastArtifact && typeof state.lastArtifact === "object"
    ? normalizeArtifactValue(state.lastArtifact, {
      workflowId: appState.workflowId,
      outputMode: appState.outputMode
    })
    : null;
  appState.releasePacketHistory = normalizeReleasePacketHistory(state && state.releasePacketHistory);
  if (!appState.releasePacketHistory.length && hasReleasePacketArtifact()) {
    appState.releasePacketHistory = [normalizeArtifactValue(appState.lastArtifact, {
      forceOutputMode: "release_packet",
      title: "Release Packet"
    })];
  }
  try {
    appState.patchPlan = state && state.patchPlan && typeof state.patchPlan === "object"
      ? normalizePatchPlanValue(state.patchPlan, { workflowId: appState.workflowId })
      : null;
    appState.patchPlanGroupOpenIds = null;
  } catch {
    appState.patchPlan = null;
    appState.patchPlanGroupOpenIds = null;
  }
  if (!appState.patchPlan && appState.lastArtifact && normalizeOutputMode(appState.outputMode, appState.workflowId) === "patch_plan") {
    try {
      appState.patchPlan = parsePatchPlanFromArtifactContent(appState.lastArtifact.content, {
        generatedAt: appState.lastArtifact.generatedAt,
        workflowId: appState.workflowId
      });
      appState.patchPlanGroupOpenIds = null;
    } catch {
      appState.patchPlan = null;
      appState.patchPlanGroupOpenIds = null;
    }
  }
  reconcileWorkspaceBoundState();
  appState.patchPlanPreviewFileId = appState.patchPlan && Array.isArray(appState.patchPlan.files) && appState.patchPlan.files[0]
    ? String(appState.patchPlan.files[0].fileId || "")
    : "";
  renderWorkflowSummary();
  renderWorkspaceAttachment();
  renderPatchPlanPanel();
  renderArtifactPanel();
  renderChatOpsTrays();
  renderSessionsTrays();
  renderCommandsTray();
  renderRuntimeTrays();
  renderIntelSurface();
  if (el.commandPaletteShortcutScope) {
    el.commandPaletteShortcutScope.value = appState.commandPaletteShortcutScope;
  }
  renderChat(appState.chat, { syncArtifact: false });
  syncSettingsInputsFromState();
}

async function updateStats() {
  if (!window.api || !window.api.system) return;
  try {
    const stats = await window.api.system.getStats();
    if (el.cpuUsage) el.cpuUsage.textContent = `${Number(stats.cpuPercent || 0).toFixed(1)}%`;
    if (el.memoryUsage) el.memoryUsage.textContent = `${stats.memoryMb || 0} MB`;
    if (el.platformInfo) el.platformInfo.textContent = String(stats.platform || "");
  } catch {
    // ignore stats errors
  }
  if (el.clockTime) el.clockTime.textContent = new Date().toISOString().replace("T", " ").slice(0, 19);
}

function bindEvents() {
  if (window.api && typeof window.api.on === "function") {
    window.api.on("llm-status-change", (status) => {
      applyLlmStatus(status);
    });
  }
  window.addEventListener("llm-stream-data", (event) => handleStreamData(event.detail));
  window.addEventListener("llm-stream-complete", () => { handleStreamComplete().catch(() => {}); });
  window.addEventListener("llm-stream-error", (event) => { handleStreamError(event).catch(() => {}); });

  if (el.promptInput) {
    el.promptInput.addEventListener("input", updatePromptMetrics);
    el.promptInput.addEventListener("input", updateCommandHint);
    el.promptInput.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && String(event.key || "").toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        sendPrompt().catch(() => {});
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendPrompt().catch(() => {});
      }
    });
  }
  if (el.sessionName) {
    el.sessionName.addEventListener("input", () => {
      updateDashboardSummary();
      renderIntelSurface();
    });
  }
  if (el.outputModeSelect) {
    el.outputModeSelect.onchange = () => {
      setOutputMode(String(el.outputModeSelect.value || appState.outputMode)).catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.workflowSeedPromptBtn) {
    el.workflowSeedPromptBtn.onclick = () => {
      workflowPromptLoaded();
    };
  }
  if (el.loadArtifactPatchPlanBtn) {
    el.loadArtifactPatchPlanBtn.onclick = () => {
      loadPatchPlanFromArtifact().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.previewPatchPlanBtn) {
    el.previewPatchPlanBtn.onclick = () => {
      previewPatchPlanFiles().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.applySelectedPatchPlanBtn) {
    el.applySelectedPatchPlanBtn.onclick = () => {
      applyPatchPlanFiles(false).catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.applyAllPatchPlanBtn) {
    el.applyAllPatchPlanBtn.onclick = () => {
      applyPatchPlanFiles(true).catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.exportPatchPlanJsonBtn) {
    el.exportPatchPlanJsonBtn.onclick = () => exportPatchPlanJson();
  }
  if (el.exportPatchPlanMarkdownBtn) {
    el.exportPatchPlanMarkdownBtn.onclick = () => exportPatchPlanMarkdown();
  }
  if (el.savePatchPlanSessionBtn) {
    el.savePatchPlanSessionBtn.onclick = () => {
      saveArtifactSessionSnapshot().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.runVerificationPlanBtn) {
    el.runVerificationPlanBtn.onclick = () => {
      runVerificationRunPlanSelectedChecks().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.copyVerificationCommandsBtn) {
    el.copyVerificationCommandsBtn.onclick = () => {
      copyVerificationRunCommands().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.clearVerificationPlanBtn) {
    el.clearVerificationPlanBtn.onclick = () => {
      clearVerificationRunPlan();
    };
  }
  if (el.stageReleaseCockpitBtn) {
    el.stageReleaseCockpitBtn.onclick = () => {
      try {
        stageReleaseCockpit();
      } catch (err) {
        showBanner(err.message || String(err), "bad");
      }
    };
  }
  if (el.runReleaseCockpitBtn) {
    el.runReleaseCockpitBtn.onclick = () => {
      runReleaseCockpitChecks().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.buildReleasePacketBtn) {
    el.buildReleasePacketBtn.onclick = () => {
      buildReleasePacketArtifact().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.exportReleaseEvidenceBtn) {
    el.exportReleaseEvidenceBtn.onclick = () => {
      exportEvidenceBundle().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.openReleasePaletteBtn) {
    el.openReleasePaletteBtn.onclick = () => {
      openReleasePalette();
    };
  }
  if (el.workspaceEditPathInput) {
    el.workspaceEditPathInput.addEventListener("input", () => {
      syncWorkspaceEditDraftFromInputs();
    });
  }
  if (el.workspaceEditContentInput) {
    el.workspaceEditContentInput.addEventListener("input", () => {
      syncWorkspaceEditDraftFromInputs();
    });
  }
  if (el.loadArtifactIntoEditBtn) {
    el.loadArtifactIntoEditBtn.onclick = () => {
      try {
        const nextContent = extractDraftContentFromArtifact();
        const currentPath = String((el.workspaceEditPathInput && el.workspaceEditPathInput.value) || defaultWorkspaceEditPath()).trim() || defaultWorkspaceEditPath();
        setWorkspaceEditDraft(currentPath, nextContent);
        showBanner("Artifact loaded into file edit draft.", "ok");
      } catch (err) {
        showBanner(err.message || String(err), "bad");
      }
    };
  }
  if (el.previewWorkspaceEditBtn) {
    el.previewWorkspaceEditBtn.onclick = () => {
      previewWorkspaceEditDraft().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }

  window.addEventListener("keydown", (event) => {
    const key = String(event.key || "").toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "k") {
      event.preventDefault();
      setCommandPaletteOpen(true);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === ",") {
      event.preventDefault();
      setSettingsMenuOpen(!appState.settingsMenuOpen);
      return;
    }
    if (key === "escape" && appState.commandPaletteOpen) {
      event.preventDefault();
      setCommandPaletteOpen(false);
      return;
    }
    if (key === "escape" && appState.settingsMenuOpen) {
      event.preventDefault();
      setSettingsMenuOpen(false);
      return;
    }
    if (key === "escape" && el.onboardingOverlay && !el.onboardingOverlay.classList.contains("hidden")) {
      event.preventDefault();
      completeOnboarding(true).catch((err) => showBanner(err.message || String(err), "bad"));
    }
  });

  if (el.settingsMenuOpenBtn) el.settingsMenuOpenBtn.onclick = () => {
    setSettingsMenuOpen(true);
  };
  if (el.settingsMenuCloseBtn) el.settingsMenuCloseBtn.onclick = () => {
    setSettingsMenuOpen(false);
  };
  if (el.settingsMenuBackdrop) el.settingsMenuBackdrop.onclick = () => {
    setSettingsMenuOpen(false);
  };
  if (el.bridgeAutoDetectBtn) el.bridgeAutoDetectBtn.onclick = () => {
    runBridgeAutoDetect().catch((err) => showBanner(err.message || String(err), "bad"));
  };
  if (el.bridgeHealthBtn) el.bridgeHealthBtn.onclick = () => {
    runBridgeHealthCheck().catch((err) => showBanner(err.message || String(err), "bad"));
  };
  if (el.threadToolsTrayBtn) {
    el.threadToolsTrayBtn.onclick = () => {
      setChatOpsTray("thread", { toggle: true });
    };
  }
  if (el.assistToolsTrayBtn) {
    el.assistToolsTrayBtn.onclick = () => {
      setChatOpsTray("assist", { toggle: true });
    };
  }
  if (el.archiveToolsTrayBtn) {
    el.archiveToolsTrayBtn.onclick = () => {
      setChatOpsTray("archive", { toggle: true });
    };
  }
  if (el.sessionManageTrayBtn) {
    el.sessionManageTrayBtn.onclick = () => {
      setSessionsTray("manage", { toggle: true });
    };
  }
  if (el.sessionInspectTrayBtn) {
    el.sessionInspectTrayBtn.onclick = () => {
      setSessionsTray("inspect", { toggle: true });
    };
  }
  if (el.commandIndexTrayBtn) {
    el.commandIndexTrayBtn.onclick = () => {
      setCommandsTray("index", { toggle: true });
    };
  }
  if (el.commandRoutingTrayBtn) {
    el.commandRoutingTrayBtn.onclick = () => {
      setCommandsTray("routing", { toggle: true });
    };
  }
  if (el.runtimeDiagnosticsTrayBtn) {
    el.runtimeDiagnosticsTrayBtn.onclick = () => {
      setRuntimeTray("diagnostics", { toggle: true });
    };
  }
  if (el.runtimeTraceTrayBtn) {
    el.runtimeTraceTrayBtn.onclick = () => {
      setRuntimeTray("trace", { toggle: true });
    };
  }
  if (el.runtimeOutputTrayBtn) {
    el.runtimeOutputTrayBtn.onclick = () => {
      setRuntimeTray("outputs", { toggle: true });
    };
  }
  if (el.intelBriefTrayBtn) {
    el.intelBriefTrayBtn.onclick = () => {
      setIntelTray("brief", { toggle: true });
    };
  }
  if (el.intelKnowledgeTrayBtn) {
    el.intelKnowledgeTrayBtn.onclick = () => {
      setIntelTray("knowledge", { toggle: true });
    };
  }
  if (el.intelCapabilityTrayBtn) {
    el.intelCapabilityTrayBtn.onclick = () => {
      setIntelTray("capability", { toggle: true });
    };
  }
  if (el.runtimeAuditOutputBtn) {
    el.runtimeAuditOutputBtn.onclick = () => {
      setRuntimeTray("outputs");
      setRuntimeOutputView("audit");
    };
  }
  if (el.runtimeLogsOutputBtn) {
    el.runtimeLogsOutputBtn.onclick = () => {
      setRuntimeTray("outputs");
      setRuntimeOutputView("logs");
    };
  }
  if (el.runtimeChatLogsOutputBtn) {
    el.runtimeChatLogsOutputBtn.onclick = () => {
      setRuntimeTray("outputs");
      setRuntimeOutputView("chat");
    };
  }
  if (el.sendBtn) el.sendBtn.onclick = () => sendPrompt().catch((err) => showBanner(err.message || String(err), "bad"));
  if (el.stopBtn) el.stopBtn.onclick = async () => {
    if (!appState.streamInFlight) return;
    await window.api.llm.cancelStream();
    if (appState.streamText.trim()) await handleStreamComplete(); else { renderChat(appState.streamBase); resetStreamState(); }
    showBanner("Generation cancelled.", "bad");
  };
  if (el.retryBtn) el.retryBtn.onclick = () => sendPromptFromText(appState.lastPrompt).catch(() => {});
  if (el.editLastBtn) el.editLastBtn.onclick = () => {
    for (let i = appState.chat.length - 1; i >= 0; i -= 1) {
      if (appState.chat[i] && appState.chat[i].role === "user") {
        if (el.promptInput) {
          el.promptInput.value = String(appState.chat[i].content || "");
          updatePromptMetrics();
        }
        return;
      }
    }
  };
  if (el.newChatBtn) el.newChatBtn.onclick = async () => {
    appState.lastArtifact = null;
    resetPatchPlanState();
    resetWorkspaceActions();
    renderChat([]);
    await persistChatState();
    showBanner("Chat cleared.", "ok");
  };
  if (el.deleteLastExchangeBtn) el.deleteLastExchangeBtn.onclick = async () => {
    const next = getCurrentChat();
    for (let i = next.length - 1; i >= 0; i -= 1) {
      if (next[i] && next[i].role === "assistant") {
        next.splice(i, 1);
        break;
      }
    }
    for (let i = next.length - 1; i >= 0; i -= 1) {
      if (next[i] && next[i].role === "user") {
        next.splice(i, 1);
        break;
      }
    }
    if (!next.some((row) => row && row.role === "assistant")) {
      appState.lastArtifact = null;
      resetPatchPlanState();
      resetWorkspaceActions();
    }
    renderChat(next);
    await persistChatState();
  };
  if (el.regenerateBtn) el.regenerateBtn.onclick = async () => {
    let assistantIndex = -1;
    for (let i = appState.chat.length - 1; i >= 0; i -= 1) {
      if (appState.chat[i] && appState.chat[i].role === "assistant") {
        assistantIndex = i;
        break;
      }
    }
    if (assistantIndex <= 0 || !appState.chat[assistantIndex - 1] || appState.chat[assistantIndex - 1].role !== "user") {
      showBanner("No assistant response to regenerate.", "bad");
      return;
    }
    const prompt = String(appState.chat[assistantIndex - 1].content || "");
    const base = appState.chat.slice(0, assistantIndex - 1);
    appState.lastArtifact = null;
    resetPatchPlanState();
    resetWorkspaceActions();
    renderChat(base);
    await persistChatState();
    await sendPromptFromText(prompt, base);
  };
  if (el.insertSnippetBtn) el.insertSnippetBtn.onclick = () => {
    const id = String((el.snippetSelect && el.snippetSelect.value) || "");
    const snippet = PROMPT_SNIPPETS.find((item) => item.id === id) || PROMPT_SNIPPETS[0];
    if (!snippet || !el.promptInput) return;
    const existing = String(el.promptInput.value || "");
    const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
    el.promptInput.value = `${existing}${separator}${snippet.text}`;
    updatePromptMetrics();
    updateCommandHint();
    el.promptInput.focus();
    showBanner(`Snippet inserted: ${snippet.label}`, "ok");
  };
  if (el.chatSearchBtn) el.chatSearchBtn.onclick = () => { appState.chatFilter = String((el.chatSearchInput && el.chatSearchInput.value) || ""); renderChat(appState.chat); };
  if (el.chatSearchClearBtn) el.chatSearchClearBtn.onclick = () => { appState.chatFilter = ""; if (el.chatSearchInput) el.chatSearchInput.value = ""; renderChat(appState.chat); };
  if (el.refreshModelsBtn) el.refreshModelsBtn.onclick = () => refreshModels().catch((err) => showBanner(err.message || String(err), "bad"));
  if (el.modelSelect) el.modelSelect.onchange = async () => { appState.model = String(el.modelSelect.value || "llama3"); await window.api.llm.setModel(appState.model); await persistChatState(); };

  if (el.saveSessionBtn) el.saveSessionBtn.onclick = async () => {
    const name = String((el.sessionName && el.sessionName.value) || "").trim();
    const pass = String((el.sessionPass && el.sessionPass.value) || "").trim();
    if (!name || !pass) {
      showBanner("Session name and passphrase are required.", "bad");
      return;
    }
    await window.api.session.save(name, {
      model: appState.model,
      chat: appState.chat,
      workflowId: appState.workflowId,
      outputMode: appState.outputMode,
      workspaceAttachment: appState.workspaceAttachment,
      lastArtifact: appState.lastArtifact,
      releasePacketHistory: appState.releasePacketHistory,
      patchPlan: appState.patchPlan,
      promotedPaletteActions: appState.promotedPaletteActions,
      commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
      verificationRunPlan: appState.verificationRunPlan,
      settings: appState.settings,
      updatedAt: new Date().toISOString()
    }, pass);
    await refreshSessions();
    showBanner(`Session saved: ${name}`, "ok");
  };
  if (el.loadSessionBtn) el.loadSessionBtn.onclick = async () => {
    const name = String((el.sessionName && el.sessionName.value) || "").trim();
    const pass = String((el.sessionPass && el.sessionPass.value) || "").trim();
    if (!name || !pass) {
      showBanner("Session name and passphrase are required.", "bad");
      return;
    }
    const api = window.api;
    const payload = await api.session.load(name, pass);
    appState.chat = Array.isArray(payload && payload.chat) ? payload.chat.slice() : [];
    appState.model = String((payload && payload.model) || appState.model);
    appState.workflowId = normalizeWorkflowId(payload && payload.workflowId ? payload.workflowId : appState.workflowId);
    appState.outputMode = normalizeOutputMode(payload && payload.outputMode ? payload.outputMode : appState.outputMode, appState.workflowId);
    appState.commandPaletteShortcutScope = normalizeCommandPaletteShortcutScope(payload && payload.commandPaletteShortcutScope);
    appState.workspaceAttachment = payload && payload.workspaceAttachment && typeof payload.workspaceAttachment === "object"
      ? payload.workspaceAttachment
      : null;
    try {
      appState.verificationRunPlan = payload && payload.verificationRunPlan && typeof payload.verificationRunPlan === "object"
        ? normalizeVerificationRunPlanValue(payload.verificationRunPlan, { workflowId: appState.workflowId })
        : null;
    } catch {
      appState.verificationRunPlan = null;
    }
    appState.promotedPaletteActions = normalizePromotedPaletteActions(payload && payload.promotedPaletteActions);
    appState.lastArtifact = payload && payload.lastArtifact && typeof payload.lastArtifact === "object"
      ? normalizeArtifactValue(payload.lastArtifact, {
        workflowId: appState.workflowId,
        outputMode: appState.outputMode
      })
      : null;
    appState.releasePacketHistory = normalizeReleasePacketHistory(payload && payload.releasePacketHistory);
    if (!appState.releasePacketHistory.length && hasReleasePacketArtifact()) {
      appState.releasePacketHistory = [normalizeArtifactValue(appState.lastArtifact, {
        forceOutputMode: "release_packet",
        title: "Release Packet"
      })];
    }
    try {
      appState.patchPlan = payload && payload.patchPlan && typeof payload.patchPlan === "object"
        ? normalizePatchPlanValue(payload.patchPlan, { workflowId: appState.workflowId })
        : null;
      appState.patchPlanGroupOpenIds = null;
    } catch {
      appState.patchPlan = null;
      appState.patchPlanGroupOpenIds = null;
    }
    reconcileWorkspaceBoundState();
    appState.patchPlanPreviewFileId = appState.patchPlan && Array.isArray(appState.patchPlan.files) && appState.patchPlan.files[0]
      ? String(appState.patchPlan.files[0].fileId || "")
      : "";
    resetWorkspaceActions();
    if (payload && typeof payload.settings === "object") {
      appState.settings = { ...appState.settings, ...payload.settings };
      appState.settings = await api.settings.update(appState.settings);
    }
    const state = { selectedModel: appState.model };
    await api.llm.setModel(state.selectedModel);
    await api.state.set("model", state.selectedModel);
    renderWorkflowSummary();
    renderWorkspaceAttachment();
    renderPatchPlanPanel();
    renderArtifactPanel();
    if (el.commandPaletteShortcutScope) {
      el.commandPaletteShortcutScope.value = appState.commandPaletteShortcutScope;
    }
    renderChat(appState.chat, { syncArtifact: false });
    await persistChatState();
    await refreshModels();
    showBanner(`Session loaded: ${name}`, "ok");
  };
  if (el.renameSessionBtn) el.renameSessionBtn.onclick = async () => {
    const from = String((el.sessionName && el.sessionName.value) || "").trim();
    const to = window.prompt("New session name:");
    if (!from || !to) return;
    await window.api.session.rename(from, String(to).trim());
    if (el.sessionName) el.sessionName.value = String(to).trim();
    await refreshSessions();
  };
  if (el.deleteSessionBtn) el.deleteSessionBtn.onclick = async () => {
    const name = String((el.sessionName && el.sessionName.value) || "").trim();
    if (!name) return;
    await window.api.session.delete(name);
    await refreshSessions();
  };
  if (el.duplicateSessionBtn) el.duplicateSessionBtn.onclick = async () => {
    const from = String((el.sessionName && el.sessionName.value) || "").trim();
    const pass = String((el.sessionPass && el.sessionPass.value) || "").trim();
    const to = window.prompt("Duplicate as session name:");
    if (!from || !pass || !to) return;
    const payload = await window.api.session.load(from, pass);
    await window.api.session.save(String(to).trim(), payload, pass);
    await refreshSessions();
  };
  if (el.repairIndexBtn) el.repairIndexBtn.onclick = async () => {
    const out = await window.api.session.repairIndex();
    showBanner(`Session index repaired (${out.count || 0}).`, "ok");
    await refreshSessions();
  };
  if (el.sessionSearchInput) el.sessionSearchInput.oninput = async () => {
    const rows = await window.api.session.search(String(el.sessionSearchInput.value || ""));
    renderSessions(Array.isArray(rows) ? rows : []);
  };
  if (el.sessionSortSelect) {
    if (el.sessionSortSelect.options.length === 0) {
      [["name_asc", "Name (A-Z)"], ["name_desc", "Name (Z-A)"], ["updated_desc", "Updated"]].forEach(([v, t]) => {
        const option = document.createElement("option");
        option.value = v;
        option.textContent = t;
        el.sessionSortSelect.appendChild(option);
      });
    }
    el.sessionSortSelect.onchange = () => refreshSessions().catch(() => {});
  }
  if (el.attachWorkspaceBtn) {
    el.attachWorkspaceBtn.onclick = () => {
      attachWorkspaceFromDialog().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.clearWorkspaceBtn) {
    el.clearWorkspaceBtn.onclick = () => {
      clearWorkspaceAttachment().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.copyArtifactBtn) {
    el.copyArtifactBtn.onclick = () => {
      copyArtifactToClipboard().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.exportArtifactMarkdownBtn) {
    el.exportArtifactMarkdownBtn.onclick = () => exportArtifactMarkdown();
  }
  if (el.exportArtifactJsonBtn) {
    el.exportArtifactJsonBtn.onclick = () => exportArtifactJson();
  }
  if (el.saveArtifactSessionBtn) {
    el.saveArtifactSessionBtn.onclick = () => {
      saveArtifactSessionSnapshot().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.exportEvidenceBundleBtn) {
    el.exportEvidenceBundleBtn.onclick = () => {
      exportEvidenceBundle().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.clearArtifactHistoryBtn) {
    el.clearArtifactHistoryBtn.onclick = () => {
      clearReleasePacketHistory().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.applyWorkspaceActionBtn) {
    el.applyWorkspaceActionBtn.onclick = () => {
      if (!appState.workspaceActionPreview) {
        showBanner("Preview a workspace action before applying it.", "bad");
        return;
      }
      applyWorkspaceActionProposal(appState.workspaceActionPreview.proposalId)
        .catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.clearWorkspaceActionPreviewBtn) {
    el.clearWorkspaceActionPreviewBtn.onclick = () => {
      clearWorkspaceActionPreview();
    };
  }

  if (el.applySettingsBtn) el.applySettingsBtn.onclick = async () => {
    const current = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
    const timeoutMs = clampNumber((el.timeoutInput && el.timeoutInput.value) || current.timeoutMs || 15000, 1000, 120000, 15000);
    const retryCount = clampNumber((el.retryInput && el.retryInput.value) || current.retryCount || 2, 0, 10, 2);
    const tokenBudget = clampNumber((el.tokenBudgetInput && el.tokenBudgetInput.value) || current.tokenBudget || 1200, 128, 200000, 1200);
    const autosaveIntervalMin = clampNumber((el.autosaveIntervalInput && el.autosaveIntervalInput.value) || current.autosaveIntervalMin || 10, 1, 1440, 10);
    const normalizedBaseUrl = String((el.baseUrlInput && el.baseUrlInput.value) || current.ollamaBaseUrl || "http://127.0.0.1:11434").trim();
    const existingProfiles = getNormalizedProfiles(current);
    const selectedProfileId = String((el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(current, existingProfiles));
    const fallbackProfile = findProfileById(existingProfiles, selectedProfileId) || existingProfiles[0];
    const editedProfile = normalizeProfile({
      id: selectedProfileId || (fallbackProfile && fallbackProfile.id) || "local-default",
      name: String((el.profileNameInput && el.profileNameInput.value) || (fallbackProfile && fallbackProfile.name) || "Local Ollama").trim(),
      baseUrl: String((el.profileBaseUrlInput && el.profileBaseUrlInput.value) || normalizedBaseUrl).trim(),
      timeoutMs: (el.profileTimeoutInput && el.profileTimeoutInput.value) || timeoutMs,
      retryCount: (el.profileRetryInput && el.profileRetryInput.value) || retryCount,
      defaultModel: appState.model
    }, appState.model, selectedProfileId || "local-default");
    const connectionProfiles = existingProfiles.map((row) => ({ ...row }));
    const profileIndex = connectionProfiles.findIndex((row) => row.id === editedProfile.id);
    if (profileIndex >= 0) connectionProfiles[profileIndex] = editedProfile;
    else connectionProfiles.push(editedProfile);

    const next = {
      ...current,
      ollamaBaseUrl: editedProfile.baseUrl,
      timeoutMs: editedProfile.timeoutMs,
      retryCount: editedProfile.retryCount,
      theme: String((el.themeSelect && el.themeSelect.value) || current.theme || "dark"),
      tokenBudget,
      autosaveName: String((el.autosaveNameInput && el.autosaveNameInput.value) || current.autosaveName || "autosave-main"),
      autosaveIntervalMin,
      autosaveEnabled: Boolean(el.autosaveEnabledInput && el.autosaveEnabledInput.checked),
      connectionProfiles,
      activeProfileId: editedProfile.id,
      connectOnStartup: Boolean(el.connectOnStartupInput ? el.connectOnStartupInput.checked : current.connectOnStartup !== false),
      allowRemoteBridge: Boolean(el.allowRemoteBridgeInput ? el.allowRemoteBridgeInput.checked : current.allowRemoteBridge),
      personalityProfile: String(current.personalityProfile || "balanced"),
      safetyPolicy: String(current.safetyPolicy || "balanced"),
      clockEnabled: current.clockEnabled !== false,
      clock24h: current.clock24h !== false,
      clockUtcOffset: String(current.clockUtcOffset || "+00:00"),
      rgbEnabled: Boolean(current.rgbEnabled),
      rgbProvider: String(current.rgbProvider || "openrgb"),
      rgbHost: String(current.rgbHost || "127.0.0.1"),
      rgbPort: Number(current.rgbPort || 6742),
      rgbTargets: Array.isArray(current.rgbTargets) ? current.rgbTargets : ["keyboard"]
    };
    appState.settings = await applySettingsPatch(next);
    if (el.timeoutInput) el.timeoutInput.value = String(editedProfile.timeoutMs);
    if (el.retryInput) el.retryInput.value = String(editedProfile.retryCount);
    if (el.tokenBudgetInput) el.tokenBudgetInput.value = String(tokenBudget);
    if (el.autosaveIntervalInput) el.autosaveIntervalInput.value = String(autosaveIntervalMin);
    applyLlmStatus(appState.llmStatus);
    showBanner("Settings applied.", "ok");
  };

  if (el.refreshCommandsBtn) el.refreshCommandsBtn.onclick = () => refreshCommands().catch((err) => showBanner(err.message || String(err), "bad"));
  if (el.commandBusPaletteBtn) {
    el.commandBusPaletteBtn.onclick = () => {
      setCommandPaletteOpen(true);
    };
  }
  if (el.commandBusHelpBtn) {
    el.commandBusHelpBtn.onclick = () => {
      if (el.shortcutOverlay) el.shortcutOverlay.textContent = "Use /help for slash command details, or Ctrl/Cmd+K to route through the command palette.";
    };
  }
  if (el.commandHelpBtn) el.commandHelpBtn.onclick = () => {
    if (el.promptInput) {
      el.promptInput.value = "/help";
      updatePromptMetrics();
      updateCommandHint();
      el.promptInput.focus();
    }
  };
  if (el.commandPaletteOpenBtn) el.commandPaletteOpenBtn.onclick = () => {
    setCommandPaletteOpen(true);
  };
  if (el.commandPaletteCloseBtn) el.commandPaletteCloseBtn.onclick = () => {
    setCommandPaletteOpen(false);
  };
  if (el.commandPaletteShortcutScope) {
    el.commandPaletteShortcutScope.onchange = () => {
      setCommandPaletteShortcutScope(String(el.commandPaletteShortcutScope.value || appState.commandPaletteShortcutScope)).catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.commandPaletteInput) {
    el.commandPaletteInput.oninput = () => {
      appState.commandPaletteIndex = 0;
      renderCommandPaletteList();
    };
    el.commandPaletteInput.onkeydown = (event) => {
      const key = String(event.key || "").toLowerCase();
      if (key === "escape") {
        event.preventDefault();
        setCommandPaletteOpen(false);
        return;
      }
      if (key === "arrowdown") {
        event.preventDefault();
        moveCommandPaletteSelection(1);
        return;
      }
      if (key === "arrowup") {
        event.preventDefault();
        moveCommandPaletteSelection(-1);
        return;
      }
      if (key === "enter") {
        event.preventDefault();
        executeCommandPaletteAction(appState.commandPaletteIndex || 0);
      }
    };
  }
  if (el.profileSelect) {
    el.profileSelect.onchange = () => updateProfileFormFromSelected();
  }
  if (el.profileNewBtn) el.profileNewBtn.onclick = async () => {
    const currentProfiles = getNormalizedProfiles(appState.settings);
    const seedName = `Profile ${currentProfiles.length + 1}`;
    const seedIdBase = profileIdFromName(seedName);
    let seedId = seedIdBase;
    let suffix = 1;
    while (currentProfiles.some((row) => row.id === seedId)) {
      seedId = `${seedIdBase}-${suffix}`;
      suffix += 1;
    }
    const nextProfile = normalizeProfile({
      id: seedId,
      name: seedName,
      baseUrl: String((el.baseUrlInput && el.baseUrlInput.value) || appState.settings.ollamaBaseUrl || "http://127.0.0.1:11434"),
      timeoutMs: (el.timeoutInput && el.timeoutInput.value) || appState.settings.timeoutMs || 15000,
      retryCount: (el.retryInput && el.retryInput.value) || appState.settings.retryCount || 2,
      defaultModel: appState.model
    }, appState.model, seedId);
    await applySettingsPatch({
      connectionProfiles: [...currentProfiles, nextProfile],
      activeProfileId: nextProfile.id
    });
    showBanner(`Profile created: ${nextProfile.name}`, "ok");
  };
  if (el.profileSaveBtn) el.profileSaveBtn.onclick = async () => {
    const draft = readProfileDraftFromForm();
    const profiles = getNormalizedProfiles(appState.settings).map((row) => ({ ...row }));
    const ix = profiles.findIndex((row) => row.id === draft.id);
    if (ix >= 0) profiles[ix] = draft;
    else profiles.push(draft);
    await applySettingsPatch({
      connectionProfiles: profiles,
      activeProfileId: draft.id
    });
    showBanner(`Profile saved: ${draft.name}`, "ok");
  };
  if (el.profileDeleteBtn) el.profileDeleteBtn.onclick = async () => {
    const profiles = getNormalizedProfiles(appState.settings);
    if (profiles.length <= 1) {
      showBanner("At least one profile must remain.", "bad");
      return;
    }
    const activeId = String((el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(appState.settings, profiles));
    const nextProfiles = profiles.filter((row) => row.id !== activeId);
    const fallback = nextProfiles[0];
    await applySettingsPatch({
      connectionProfiles: nextProfiles,
      activeProfileId: fallback ? fallback.id : "local-default"
    });
    showBanner("Profile deleted.", "ok");
  };
  if (el.profileUseBtn) el.profileUseBtn.onclick = async () => {
    const profiles = getNormalizedProfiles(appState.settings);
    const activeId = String((el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(appState.settings, profiles));
    const profile = findProfileById(profiles, activeId);
    if (!profile) {
      showBanner("Select a profile first.", "bad");
      return;
    }
    if (el.baseUrlInput) el.baseUrlInput.value = profile.baseUrl;
    if (el.timeoutInput) el.timeoutInput.value = String(profile.timeoutMs);
    if (el.retryInput) el.retryInput.value = String(profile.retryCount);
    await applySettingsPatch({
      activeProfileId: profile.id,
      ollamaBaseUrl: profile.baseUrl,
      timeoutMs: profile.timeoutMs,
      retryCount: profile.retryCount
    });
    showBanner(`Profile active: ${profile.name}`, "ok");
  };
  if (el.undoBtn) el.undoBtn.onclick = () => {
    if (el.deleteLastExchangeBtn && typeof el.deleteLastExchangeBtn.onclick === "function") {
      el.deleteLastExchangeBtn.onclick();
    }
  };
  if (el.shortcutHelpBtn) el.shortcutHelpBtn.onclick = () => {
    if (el.shortcutOverlay) el.shortcutOverlay.textContent = "Enter send | Shift+Enter newline | Ctrl+Enter send | Ctrl/Cmd+K command palette | /help commands";
  };
  if (el.shortcutCloseBtn) el.shortcutCloseBtn.onclick = () => {
    if (el.shortcutOverlay) el.shortcutOverlay.textContent = "";
  };
  if (el.onboardingStartBtn) el.onboardingStartBtn.onclick = () => {
    completeOnboarding(false).catch((err) => showBanner(err.message || String(err), "bad"));
  };
  if (el.onboardingSkipBtn) el.onboardingSkipBtn.onclick = () => {
    completeOnboarding(true).catch((err) => showBanner(err.message || String(err), "bad"));
  };
  if (el.onboardingResetBtn) el.onboardingResetBtn.onclick = async () => {
    await applySettingsPatch({ onboardingCompleted: false });
    setOnboardingOpen(true);
    showBanner("Onboarding reset.", "ok");
  };
  if (el.exportChatBtn) el.exportChatBtn.onclick = () => download("neuralshell-chat.json", JSON.stringify(appState.chat, null, 2), "application/json;charset=utf-8");
  if (el.exportMarkdownBtn) el.exportMarkdownBtn.onclick = () => download("neuralshell-chat.md", markdown(appState.chat), "text/markdown;charset=utf-8");
  if (el.copyMarkdownBtn) el.copyMarkdownBtn.onclick = () => copyText(markdown(appState.chat)).then((ok) => showBanner(ok ? "Markdown copied." : "Copy failed.", ok ? "ok" : "bad"));
  if (el.copyLastAssistantBtn) el.copyLastAssistantBtn.onclick = () => copyText((lastAssistant() || {}).content || "").then((ok) => showBanner(ok ? "Copied." : "Nothing to copy.", ok ? "ok" : "bad"));
  if (el.importChatBtn) el.importChatBtn.onclick = async () => {
    const file = el.importChatFile && el.importChatFile.files ? el.importChatFile.files[0] : null;
    if (!file) return;
    const payload = JSON.parse(await file.text());
    if (!Array.isArray(payload)) throw new Error("Chat import must be an array.");
    appState.chat = payload
      .filter((x) => x && typeof x === "object")
      .map((x) => ({ role: String(x.role || "user"), content: String(x.content || "") }))
      .filter((x) => x.content.trim().length > 0);
    renderChat(appState.chat);
    await persistChatState();
  };
  if (el.exportStateBtn) el.exportStateBtn.onclick = async () => {
    download("neuralshell-state.json", JSON.stringify(await window.api.state.export(), null, 2), "application/json;charset=utf-8");
  };
  if (el.importStateBtn) el.importStateBtn.onclick = async () => {
    const file = el.importStateFile && el.importStateFile.files ? el.importStateFile.files[0] : null;
    if (!file) return;
    try {
      await window.api.state.import(JSON.parse(await file.text()));
      await loadInitialState();
      await refreshModels();
      await refreshSessions();
      showBanner("State import completed.", "ok");
    } catch (err) {
      showBanner(`State import failed: ${err.message}`, "bad");
    }
  };
  if (el.runSelfTestBtn) el.runSelfTestBtn.onclick = async () => {
    const result = await window.api.command.run("selftest", []);
    if (el.logsOutput) el.logsOutput.textContent = JSON.stringify(result, null, 2);
    setRuntimeTray("outputs");
    setRuntimeOutputView("logs");
  };
  if (el.runButtonAuditBtn) el.runButtonAuditBtn.onclick = () => {
    const missing = IDS.filter((id) => !el[id]);
    if (el.buttonAuditOutput) el.buttonAuditOutput.textContent = JSON.stringify({ total: IDS.length, missing }, null, 2);
    setRuntimeTray("outputs");
    setRuntimeOutputView("audit");
  };

  if (el.loadLogsBtn) el.loadLogsBtn.onclick = async () => {
    const rows = await window.api.logger.tail(300);
    if (el.logsOutput) el.logsOutput.textContent = (rows || []).map((r) => `${r.ts} [${r.level}] ${r.message} ${JSON.stringify(r.meta)}`).join("\n");
    setRuntimeTray("outputs");
    setRuntimeOutputView("logs");
  };
  if (el.clearLogsBtn) el.clearLogsBtn.onclick = async () => {
    await window.api.logger.clear();
    if (el.loadLogsBtn) el.loadLogsBtn.onclick();
  };
  if (el.exportLogsBtn) el.exportLogsBtn.onclick = async () => {
    download("neuralshell-logs.txt", await window.api.logger.export());
  };
  if (el.loadChatLogsBtn) el.loadChatLogsBtn.onclick = async () => {
    const rows = await window.api.chatlog.tail(300);
    if (el.chatLogsOutput) el.chatLogsOutput.textContent = (rows || []).map((r) => `${r.ts} [${r.type}] ${JSON.stringify(r.payload)}`).join("\n");
    setRuntimeTray("outputs");
    setRuntimeOutputView("chat");
  };
  if (el.clearChatLogsBtn) el.clearChatLogsBtn.onclick = async () => {
    await window.api.chatlog.clear();
    if (el.loadChatLogsBtn) el.loadChatLogsBtn.onclick();
  };
  if (el.exportChatLogsBtn) el.exportChatLogsBtn.onclick = async () => {
    download("neuralshell-chatlogs.txt", await window.api.chatlog.export());
  };
}

async function bootstrap() {
  bindEvents();
  initializePromptSnippets();
  await loadInitialState();
  applyLlmStatus(appState.settings.connectOnStartup !== false ? "booting" : "bridge_offline");
  await Promise.all([refreshModels(), refreshSessions(), refreshCommands(), updateStats()]);
  renderWorkflowSummary();
  renderWorkspaceAttachment();
  renderPatchPlanPanel();
  renderArtifactPanel();
  renderWorkspaceActionDeck();
  renderChatOpsTrays();
  renderSessionsTrays();
  renderCommandsTray();
  renderRuntimeTrays();
  renderIntelSurface();
  populateOnboardingModelSelect();
  setCommandPaletteOpen(false);
  setSettingsMenuOpen(false);
  if (appState.settings.onboardingCompleted !== true) {
    setOnboardingOpen(true);
  } else {
    setOnboardingOpen(false);
  }
  if (appState.statsTimer) clearInterval(appState.statsTimer);
  appState.statsTimer = setInterval(() => {
    updateStats().catch(() => {});
  }, 3000);
  if (appState.clockTimer) clearInterval(appState.clockTimer);
  appState.clockTimer = setInterval(() => {
    if (el.clockTime) el.clockTime.textContent = new Date().toISOString().replace("T", " ").slice(0, 19);
  }, 1000);
  updatePromptMetrics();
  showBanner("NeuralShell ready.", "ok");
}

bootstrap().catch((err) => showBanner(`Bootstrap failed: ${err.message || String(err)}`, "bad"));

window.NeuralShellRenderer = {
  applyPatchPlanFiles,
  applyWorkspaceActionProposal,
  activateWorkflow,
  buildEvidenceBundle,
  buildWorkspaceActionRequest,
  clearReleasePacketHistory,
  clearVerificationRunPlan,
  clearWorkspaceActionPreview,
  exportEvidenceBundle,
  exportPatchPlanJson,
  exportPatchPlanMarkdown,
  getEvidenceBundleFilename,
  loadPatchPlanFromArtifact,
  loadReleasePacketHistoryEntry,
  previewPatchPlanFiles,
  previewWorkspaceActionProposal,
  previewWorkspaceEditDraft,
  promotePatchPlanGroupToPalette,
  buildReleasePacketArtifact,
  removePromotedPaletteAction,
  runVerificationRunPlanSelectedChecks,
  renderArtifactPanel,
  renderIntelSurface,
  renderPatchPlanPanel,
  renderReleaseCockpit,
  renderWorkspaceActionDeck,
  renderChat,
  refreshCommands,
  refreshModels,
  refreshSessions,
  runBridgeAutoDetect,
  runMultiAgentStep,
  movePromotedPaletteAction,
  setVerificationRunPlan,
  setCommandPaletteShortcutScope,
  setIntelTray,
  setOutputMode,
  setPatchPlan,
  setPromotedPaletteActions,
  setWorkspaceEditDraft,
  setWorkspaceAttachment,
  stageReleaseCockpit,
  stageVerificationRunPlanForGroup,
  sendPrompt,
  showBanner,
  runReleaseCockpitChecks,
  updateAutonomousCheckpoint
};
