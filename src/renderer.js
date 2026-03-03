"use strict";

const api = window.api;

const ui = {
  modelSelect: document.getElementById("modelSelect"),
  refreshModelsBtn: document.getElementById("refreshModelsBtn"),
  statusLabel: document.getElementById("statusLabel"),
  sessionList: document.getElementById("sessionList"),
  runSelfTestBtn: document.getElementById("runSelfTestBtn"),
  runButtonAuditBtn: document.getElementById("runButtonAuditBtn"),
  loadScreen: document.getElementById("loadScreen"),
  loadScreenText: document.getElementById("loadScreenText"),
  menuFocusAllBtn: document.getElementById("menuFocusAllBtn"),
  menuFocusChatBtn: document.getElementById("menuFocusChatBtn"),
  menuFocusSessionsBtn: document.getElementById("menuFocusSessionsBtn"),
  menuFocusSettingsBtn: document.getElementById("menuFocusSettingsBtn"),
  menuFocusLogsBtn: document.getElementById("menuFocusLogsBtn"),
  menuQuickSaveBtn: document.getElementById("menuQuickSaveBtn"),
  toggleFocusModeBtn: document.getElementById("toggleFocusModeBtn"),
  toggleCommandPaletteBtn: document.getElementById("toggleCommandPaletteBtn"),
  togglePreviewBtn: document.getElementById("togglePreviewBtn"),
  toggleDensityBtn: document.getElementById("toggleDensityBtn"),
  flushQueueBtn: document.getElementById("flushQueueBtn"),
  autonomousStartBtn: document.getElementById("autonomousStartBtn"),
  autonomousStopBtn: document.getElementById("autonomousStopBtn"),
  autonomousResumeBtn: document.getElementById("autonomousResumeBtn"),
  timelineRange: document.getElementById("timelineRange"),
  timelineLabel: document.getElementById("timelineLabel"),
  commandChips: document.getElementById("commandChips"),
  chatSplitPane: document.getElementById("chatSplitPane"),
  previewDivider: document.getElementById("previewDivider"),
  chatPreviewPane: document.getElementById("chatPreviewPane"),
  chatPreviewOutput: document.getElementById("chatPreviewOutput"),
  exportBundleBtn: document.getElementById("exportBundleBtn"),
  importBundleBtn: document.getElementById("importBundleBtn"),
  macroSummarizeBtn: document.getElementById("macroSummarizeBtn"),
  macroRisksBtn: document.getElementById("macroRisksBtn"),
  macroRewriteBtn: document.getElementById("macroRewriteBtn"),
  stickyNoteInput: document.getElementById("stickyNoteInput"),
  bookmarkList: document.getElementById("bookmarkList"),
  saveSnapshotBtn: document.getElementById("saveSnapshotBtn"),
  snapshotSelect: document.getElementById("snapshotSelect"),
  loadSnapshotBtn: document.getElementById("loadSnapshotBtn"),
  templateNameInput: document.getElementById("templateNameInput"),
  templateBodyInput: document.getElementById("templateBodyInput"),
  saveTemplateBtn: document.getElementById("saveTemplateBtn"),
  templateSelect: document.getElementById("templateSelect"),
  applyTemplateBtn: document.getElementById("applyTemplateBtn"),
  commandHistoryList: document.getElementById("commandHistoryList"),
  fontScaleRange: document.getElementById("fontScaleRange"),
  autoBackupEnabledInput: document.getElementById("autoBackupEnabledInput"),
  autoBackupIntervalInput: document.getElementById("autoBackupIntervalInput"),
  saveThemeSlot1Btn: document.getElementById("saveThemeSlot1Btn"),
  applyThemeSlot1Btn: document.getElementById("applyThemeSlot1Btn"),
  saveThemeSlot2Btn: document.getElementById("saveThemeSlot2Btn"),
  applyThemeSlot2Btn: document.getElementById("applyThemeSlot2Btn"),
  saveThemeSlot3Btn: document.getElementById("saveThemeSlot3Btn"),
  applyThemeSlot3Btn: document.getElementById("applyThemeSlot3Btn"),
  undoTrailList: document.getElementById("undoTrailList"),
  settingsGuardOutput: document.getElementById("settingsGuardOutput"),
  setupWizardOverlay: document.getElementById("setupWizardOverlay"),
  wizardProfileNameInput: document.getElementById("wizardProfileNameInput"),
  wizardBaseUrlInput: document.getElementById("wizardBaseUrlInput"),
  wizardDefaultModelInput: document.getElementById("wizardDefaultModelInput"),
  wizardConnectOnStartupInput: document.getElementById("wizardConnectOnStartupInput"),
  wizardTestBtn: document.getElementById("wizardTestBtn"),
  wizardSaveBtn: document.getElementById("wizardSaveBtn"),
  wizardSkipBtn: document.getElementById("wizardSkipBtn"),
  wizardOutput: document.getElementById("wizardOutput"),
  labsThemeShuffleBtn: document.getElementById("labsThemeShuffleBtn"),
  labsPanicResetBtn: document.getElementById("labsPanicResetBtn"),
  labsToggleAmbientBtn: document.getElementById("labsToggleAmbientBtn"),
  labsSnapshotDiffBtn: document.getElementById("labsSnapshotDiffBtn"),
  labsExportTemplatesBtn: document.getElementById("labsExportTemplatesBtn"),
  labsImportTemplatesBtn: document.getElementById("labsImportTemplatesBtn"),
  labsImportTemplatesFile: document.getElementById("labsImportTemplatesFile"),
  labsRestoreBackupBtn: document.getElementById("labsRestoreBackupBtn"),
  labsFocusTimerStartBtn: document.getElementById("labsFocusTimerStartBtn"),
  labsFocusTimerStopBtn: document.getElementById("labsFocusTimerStopBtn"),
  labsRandomPromptBtn: document.getElementById("labsRandomPromptBtn"),
  labsStatusOutput: document.getElementById("labsStatusOutput"),
  autonomousGoalInput: document.getElementById("autonomousGoalInput"),
  autonomousIntervalInput: document.getElementById("autonomousIntervalInput"),
  autonomousMaxStepsInput: document.getElementById("autonomousMaxStepsInput"),
  multiAgentEnabledInput: document.getElementById("multiAgentEnabledInput"),
  multiAgentApprovalSelect: document.getElementById("multiAgentApprovalSelect"),
  autonomousPlanOutput: document.getElementById("autonomousPlanOutput"),
  autonomousStatusOutput: document.getElementById("autonomousStatusOutput"),
  autonomousCheckpointOutput: document.getElementById("autonomousCheckpointOutput"),
  multiAgentStatusOutput: document.getElementById("multiAgentStatusOutput"),
  multiAgentApproveBtn: document.getElementById("multiAgentApproveBtn"),
  autonomousReplayBtn: document.getElementById("autonomousReplayBtn"),
  autonomousClearHistoryBtn: document.getElementById("autonomousClearHistoryBtn"),
  autonomousRunList: document.getElementById("autonomousRunList"),
  missionHealth: document.getElementById("missionHealth"),
  missionAnomalies: document.getElementById("missionAnomalies"),
  missionHeatmap: document.getElementById("missionHeatmap"),
  pluginMarketplaceOutput: document.getElementById("pluginMarketplaceOutput"),
  themeAccentInput: document.getElementById("themeAccentInput"),
  themeHotInput: document.getElementById("themeHotInput"),
  themeBgStartInput: document.getElementById("themeBgStartInput"),
  saveThemePresetBtn: document.getElementById("saveThemePresetBtn"),
  resetThemePresetBtn: document.getElementById("resetThemePresetBtn"),
  notificationOutput: document.getElementById("notificationOutput"),
  commandPalette: document.getElementById("commandPalette"),
  commandPaletteInput: document.getElementById("commandPaletteInput"),
  commandPaletteList: document.getElementById("commandPaletteList"),
  commandPaletteCloseBtn: document.getElementById("commandPaletteCloseBtn"),
  settingsTabNetworkBtn: document.getElementById("settingsTabNetworkBtn"),
  settingsTabInterfaceBtn: document.getElementById("settingsTabInterfaceBtn"),
  settingsTabAutosaveBtn: document.getElementById("settingsTabAutosaveBtn"),
  sessionSearchInput: document.getElementById("sessionSearchInput"),
  sessionSortSelect: document.getElementById("sessionSortSelect"),
  sessionName: document.getElementById("sessionName"),
  sessionPass: document.getElementById("sessionPass"),
  sessionMetadataOutput: document.getElementById("sessionMetadataOutput"),
  saveSessionBtn: document.getElementById("saveSessionBtn"),
  loadSessionBtn: document.getElementById("loadSessionBtn"),
  renameSessionBtn: document.getElementById("renameSessionBtn"),
  deleteSessionBtn: document.getElementById("deleteSessionBtn"),
  duplicateSessionBtn: document.getElementById("duplicateSessionBtn"),
  chatHistory: document.getElementById("chatHistory"),
  typingIndicator: document.getElementById("typingIndicator"),
  chatSearchInput: document.getElementById("chatSearchInput"),
  chatSearchBtn: document.getElementById("chatSearchBtn"),
  chatSearchClearBtn: document.getElementById("chatSearchClearBtn"),
  newChatBtn: document.getElementById("newChatBtn"),
  deleteLastExchangeBtn: document.getElementById("deleteLastExchangeBtn"),
  promptInput: document.getElementById("promptInput"),
  promptMetrics: document.getElementById("promptMetrics"),
  autoScrollInput: document.getElementById("autoScrollInput"),
  sendBtn: document.getElementById("sendBtn"),
  stopBtn: document.getElementById("stopBtn"),
  retryBtn: document.getElementById("retryBtn"),
  editLastBtn: document.getElementById("editLastBtn"),
  snippetSelect: document.getElementById("snippetSelect"),
  insertSnippetBtn: document.getElementById("insertSnippetBtn"),
  regenerateBtn: document.getElementById("regenerateBtn"),
  exportChatBtn: document.getElementById("exportChatBtn"),
  exportMarkdownBtn: document.getElementById("exportMarkdownBtn"),
  copyMarkdownBtn: document.getElementById("copyMarkdownBtn"),
  copyLastAssistantBtn: document.getElementById("copyLastAssistantBtn"),
  shortcutHelpBtn: document.getElementById("shortcutHelpBtn"),
  importChatBtn: document.getElementById("importChatBtn"),
  importChatFile: document.getElementById("importChatFile"),
  refreshCommandsBtn: document.getElementById("refreshCommandsBtn"),
  commandList: document.getElementById("commandList"),
  baseUrlInput: document.getElementById("baseUrlInput"),
  bridgeProfileSelect: document.getElementById("bridgeProfileSelect"),
  bridgeProfileNameInput: document.getElementById("bridgeProfileNameInput"),
  connectOnStartupInput: document.getElementById("connectOnStartupInput"),
  allowRemoteBridgeInput: document.getElementById("allowRemoteBridgeInput"),
  testBridgeBtn: document.getElementById("testBridgeBtn"),
  saveBridgeProfileBtn: document.getElementById("saveBridgeProfileBtn"),
  bridgeStatusOutput: document.getElementById("bridgeStatusOutput"),
  timeoutInput: document.getElementById("timeoutInput"),
  retryInput: document.getElementById("retryInput"),
  themeSelect: document.getElementById("themeSelect"),
  personalityProfileSelect: document.getElementById("personalityProfileSelect"),
  safetyPolicySelect: document.getElementById("safetyPolicySelect"),
  tokenBudgetInput: document.getElementById("tokenBudgetInput"),
  clockEnabledInput: document.getElementById("clockEnabledInput"),
  clock24hInput: document.getElementById("clock24hInput"),
  clockUtcOffsetInput: document.getElementById("clockUtcOffsetInput"),
  rgbEnabledInput: document.getElementById("rgbEnabledInput"),
  rgbProviderSelect: document.getElementById("rgbProviderSelect"),
  rgbHostInput: document.getElementById("rgbHostInput"),
  rgbPortInput: document.getElementById("rgbPortInput"),
  rgbTargetsInput: document.getElementById("rgbTargetsInput"),
  rgbPreviewMoodBtn: document.getElementById("rgbPreviewMoodBtn"),
  rgbRunDemoBtn: document.getElementById("rgbRunDemoBtn"),
  runAutonomyBenchmarkBtn: document.getElementById("runAutonomyBenchmarkBtn"),
  verifyAuditBtn: document.getElementById("verifyAuditBtn"),
  loadAuditBtn: document.getElementById("loadAuditBtn"),
  rgbStatusOutput: document.getElementById("rgbStatusOutput"),
  auditOutput: document.getElementById("auditOutput"),
  autosaveNameInput: document.getElementById("autosaveNameInput"),
  autosaveIntervalInput: document.getElementById("autosaveIntervalInput"),
  autosaveEnabledInput: document.getElementById("autosaveEnabledInput"),
  applySettingsBtn: document.getElementById("applySettingsBtn"),
  repairIndexBtn: document.getElementById("repairIndexBtn"),
  exportStateBtn: document.getElementById("exportStateBtn"),
  importStateBtn: document.getElementById("importStateBtn"),
  importStateFile: document.getElementById("importStateFile"),
  cpuUsage: document.getElementById("cpuUsage"),
  memoryUsage: document.getElementById("memoryUsage"),
  tokensUsed: document.getElementById("tokensUsed"),
  platformInfo: document.getElementById("platformInfo"),
  clockTime: document.getElementById("clockTime"),
  statusMeta: document.getElementById("statusMeta"),
  loadLogsBtn: document.getElementById("loadLogsBtn"),
  clearLogsBtn: document.getElementById("clearLogsBtn"),
  exportLogsBtn: document.getElementById("exportLogsBtn"),
  logsOutput: document.getElementById("logsOutput"),
  loadChatLogsBtn: document.getElementById("loadChatLogsBtn"),
  clearChatLogsBtn: document.getElementById("clearChatLogsBtn"),
  exportChatLogsBtn: document.getElementById("exportChatLogsBtn"),
  chatLogsOutput: document.getElementById("chatLogsOutput"),
  buttonAuditOutput: document.getElementById("buttonAuditOutput"),
  shortcutOverlay: document.getElementById("shortcutOverlay"),
  shortcutCloseBtn: document.getElementById("shortcutCloseBtn"),
  tierBadges: document.querySelectorAll(".tierBadge"),
  ritualSelect: document.getElementById("ritualSelect"),
  ritualTriggerBtn: document.getElementById("ritualTriggerBtn"),
  ritualScheduleTime: document.getElementById("ritualScheduleTime"),
  ritualScheduleBtn: document.getElementById("ritualScheduleBtn"),
  scheduledRitualList: document.getElementById("scheduledRitualList"),
  vaultPass: document.getElementById("vaultPass"),
  vaultUnlockBtn: document.getElementById("vaultUnlockBtn"),
  vaultLockBtn: document.getElementById("vaultLockBtn"),
  vaultCompactBtn: document.getElementById("vaultCompactBtn"),
  vaultTearBtn: document.getElementById("vaultTearBtn"),
  historyFileInput: document.getElementById("historyFileInput"),
  selectHistoryBtn: document.getElementById("selectHistoryBtn"),
  injectHistoryBtn: document.getElementById("injectHistoryBtn"),
  historyFileList: document.getElementById("historyFileList"),
  nightVisionToggle: document.getElementById("nightVisionToggle"),
  glowToggle: document.getElementById("glowToggle"),
  audioToggle: document.getElementById("audioToggle"),
  typewriterToggle: document.getElementById("typewriterToggle"),
  autopilotToggle: document.getElementById("autopilotToggle"),
  detectLLMBtn: document.getElementById("detectLLMBtn"),
  scanEmpireBtn: document.getElementById("scanEmpireBtn"),
  empireStatusList: document.getElementById("empireStatusList")
};

const appBanner = document.getElementById("appBanner");
const undoBtn = document.getElementById("undoBtn");
const commandHelpBtn = document.getElementById("commandHelpBtn");

const state = {
  chat: [],
  selectedSession: "",
  selectedModel: "llama3",
  lastUserPrompt: "",
  isBusy: false,
  autosaveTimer: null,
  pinnedMessages: [],
  notifications: [],
  splitPreview: false,
  denseMode: false,
  focusMode: false,
  paletteCommands: [],
  lastLogsSnapshot: [],
  promptQueue: [],
  commandHistory: [],
  snapshots: [],
  templates: [],
  undoTrail: [],
  backupTimer: null,
  focusTimer: null,
  focusTimerRemaining: 0,
  ambientFxDisabled: false,
  bridgeProfiles: [],
  activeBridgeProfileId: "",
  autonomousEnabled: false,
  autonomousTimer: null,
  autonomousSteps: 0,
  autonomousRunId: "",
  autonomousStartedAt: "",
  autonomousRunLog: [],
  autonomousLastCheckpoint: null,
  autonomousConsecutiveFailures: 0,
  multiAgentPendingApproval: null,
  multiAgentApprovalGranted: false,
  multiAgentLastPlan: "",
  multiAgentLastVerification: "",
  xp: 0,
  tier: 0,
  historyFiles: [],
  scheduledRituals: [],
  autopilotActive: false
};

const ONBOARD_FLAG = "ns5_onboarded_v1";
const NOTES_KEY = "ns5_notes_v1";
const BOOKMARKS_KEY = "ns5_bookmarks_v1";
const THEME_STUDIO_KEY = "ns5_theme_studio_v1";
const SNAPSHOTS_KEY = "ns5_snapshots_v1";
const TEMPLATES_KEY = "ns5_templates_v1";
const HISTORY_KEY = "ns5_cmd_history_v1";
const QUEUE_KEY = "ns5_prompt_queue_v1";
const FONT_SCALE_KEY = "ns5_font_scale_v1";
const BACKUP_KEY = "ns5_backup_cfg_v1";
const THEME_SLOTS_KEY = "ns5_theme_slots_v1";
const UNDO_TRAIL_KEY = "ns5_undo_trail_v1";
const AUTONOMY_LOG_KEY = "ns5_autonomy_log_v1";
const AUTONOMY_CHECKPOINT_KEY = "ns5_autonomy_checkpoint_v1";
const AUTONOMY_MULTI_CFG_KEY = "ns5_autonomy_multi_cfg_v1";
let lastFocusedBeforeOverlay = null;

function showBanner(text, kind = "info") {
  if (!appBanner) {
    return;
  }
  appBanner.textContent = String(text || "");
  appBanner.className = "";
  appBanner.classList.add("show");
  appBanner.classList.add(kind);
  clearTimeout(showBanner.timer);
  showBanner.timer = setTimeout(() => {
    appBanner.className = "";
  }, 1800);
  state.notifications.unshift(`${new Date().toLocaleTimeString()} | ${kind.toUpperCase()} | ${String(text || "")}`);
  state.notifications = state.notifications.slice(0, 60);
  renderNotifications();
}

function renderNotifications() {
  if (!ui.notificationOutput) return;
  ui.notificationOutput.textContent = state.notifications.join("\n");
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function setLabsStatus(text) {
  if (ui.labsStatusOutput) {
    ui.labsStatusOutput.textContent = String(text || "");
  }
}

function randomColor() {
  const n = Math.floor(Math.random() * 0xffffff);
  return `#${n.toString(16).padStart(6, "0")}`;
}

function panicResetUiModes() {
  setFocusMode(false);
  setDensityMode(false);
  setSplitPreview(false);
  closeCommandPalette();
  closeShortcutOverlay();
  document.body.classList.remove("ambient-off");
  state.ambientFxDisabled = false;
  setLabsStatus("UI modes reset.");
}

function snapshotDiffSummary() {
  if (state.snapshots.length < 2) {
    return "Need at least 2 snapshots.";
  }
  const a = state.snapshots[0];
  const b = state.snapshots[1];
  const aChat = Array.isArray(a.payload && a.payload.chat) ? a.payload.chat.length : 0;
  const bChat = Array.isArray(b.payload && b.payload.chat) ? b.payload.chat.length : 0;
  const aModel = a.payload && a.payload.model ? a.payload.model : "n/a";
  const bModel = b.payload && b.payload.model ? b.payload.model : "n/a";
  return `Chat delta: ${aChat - bChat >= 0 ? "+" : ""}${aChat - bChat}, Model: ${aModel} vs ${bModel}`;
}

function startFocusTimer(minutes = 25) {
  const total = Math.max(1, Number(minutes) || 25) * 60;
  if (state.focusTimer) clearInterval(state.focusTimer);
  state.focusTimerRemaining = total;
  setLabsStatus(`Focus timer started (${minutes}m).`);
  state.focusTimer = setInterval(() => {
    state.focusTimerRemaining -= 1;
    if (state.focusTimerRemaining <= 0) {
      clearInterval(state.focusTimer);
      state.focusTimer = null;
      setLabsStatus("Focus timer completed.");
      showBanner("Focus timer completed.", "good");
      return;
    }
    if (state.focusTimerRemaining % 60 === 0) {
      setLabsStatus(`Focus timer: ${Math.floor(state.focusTimerRemaining / 60)}m left`);
    }
  }, 1000);
}

function stopFocusTimer() {
  if (state.focusTimer) {
    clearInterval(state.focusTimer);
    state.focusTimer = null;
  }
  state.focusTimerRemaining = 0;
  setLabsStatus("Focus timer stopped.");
}

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setWizardOutput(text) {
  if (ui.wizardOutput) {
    ui.wizardOutput.textContent = String(text || "");
  }
}

function setBridgeStatus(text) {
  if (ui.bridgeStatusOutput) {
    ui.bridgeStatusOutput.textContent = String(text || "");
  }
}

function openSetupWizard() {
  if (!ui.setupWizardOverlay) return;
  ui.setupWizardOverlay.hidden = false;
  ui.setupWizardOverlay.setAttribute("aria-hidden", "false");
}

function closeSetupWizard() {
  if (!ui.setupWizardOverlay) return;
  ui.setupWizardOverlay.hidden = true;
  ui.setupWizardOverlay.setAttribute("aria-hidden", "true");
}

function normalizeProfilesFromSettings(settings = {}) {
  const source = Array.isArray(settings.connectionProfiles) ? settings.connectionProfiles : [];
  const profiles = source
    .filter((p) => p && typeof p === "object" && p.name && p.baseUrl)
    .map((p, idx) => ({
      id: p.id || `profile-${idx + 1}`,
      name: String(p.name),
      baseUrl: String(p.baseUrl),
      timeoutMs: Number(p.timeoutMs) || 15000,
      retryCount: Number(p.retryCount) || 2,
      defaultModel: String(p.defaultModel || "llama3")
    }));
  if (!profiles.length && settings.ollamaBaseUrl) {
    profiles.push({
      id: "default",
      name: "Default",
      baseUrl: String(settings.ollamaBaseUrl),
      timeoutMs: Number(settings.timeoutMs) || 15000,
      retryCount: Number(settings.retryCount) || 2,
      defaultModel: state.selectedModel || "llama3"
    });
  }
  return {
    profiles,
    activeProfileId: String(settings.activeProfileId || (profiles[0] && profiles[0].id) || ""),
    connectOnStartup: settings.connectOnStartup !== false
  };
}

function renderBridgeProfiles() {
  if (!ui.bridgeProfileSelect) return;
  ui.bridgeProfileSelect.innerHTML = "";
  if (!state.bridgeProfiles.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No bridge profiles";
    ui.bridgeProfileSelect.appendChild(option);
    return;
  }
  state.bridgeProfiles.forEach((p) => {
    const option = document.createElement("option");
    option.value = p.id;
    option.textContent = `${p.name} (${p.baseUrl})`;
    option.selected = p.id === state.activeBridgeProfileId;
    ui.bridgeProfileSelect.appendChild(option);
  });
}

function getActiveBridgeProfile() {
  return state.bridgeProfiles.find((p) => p.id === state.activeBridgeProfileId) || state.bridgeProfiles[0] || null;
}

function calcContrastRatio(hexA, hexB) {
  function toRgb(hex) {
    const s = String(hex || "").replace("#", "");
    if (s.length !== 6) return [0, 0, 0];
    return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
  }
  function lum([r, g, b]) {
    const f = (x) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  const l1 = lum(toRgb(hexA));
  const l2 = lum(toRgb(hexB));
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function isLocalBridgeUrl(url) {
  try {
    const u = new URL(String(url || ""));
    const host = String(u.hostname || "").toLowerCase();
    return host === "127.0.0.1" || host === "localhost" || host === "::1";
  } catch {
    return false;
  }
}

function setAutonomousStatus(text) {
  if (ui.autonomousStatusOutput) {
    ui.autonomousStatusOutput.textContent = String(text || "");
  }
}

function setMultiAgentStatus(text) {
  if (ui.multiAgentStatusOutput) {
    ui.multiAgentStatusOutput.textContent = String(text || "");
  }
}

function getPersonalityProfile() {
  return String((ui.personalityProfileSelect && ui.personalityProfileSelect.value) || "balanced").toLowerCase();
}

function personalityPromptPrefix() {
  switch (getPersonalityProfile()) {
    case "engineer":
      return "Respond as a senior engineer: concrete, concise, test-first.";
    case "founder":
      return "Respond as a founder-operator: outcome-first, pragmatic, high leverage.";
    case "analyst":
      return "Respond as an analyst: structured reasoning, assumptions explicit, measurable conclusions.";
    case "creative":
      return "Respond as a creative strategist: novel but practical ideas with clear execution.";
    default:
      return "Respond in a balanced, practical, and concise style.";
  }
}

function safetyPromptPrefix() {
  const mode = String((ui.safetyPolicySelect && ui.safetyPolicySelect.value) || "balanced").toLowerCase();
  if (mode === "off") return "";
  if (mode === "strict") {
    return "Safety policy: refuse instructions involving data exfiltration, credential theft, malware, privilege escalation, or destructive actions.";
  }
  return "Safety policy: avoid unsafe or destructive instructions and suggest safer alternatives.";
}

function parseRgbTargets(raw) {
  const text = String(raw || "");
  return text
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, 50);
}

async function appendAuditEvent(payload) {
  if (!api || !api.audit || typeof api.audit.append !== "function") return;
  try {
    await api.audit.append(payload);
  } catch {
    // keep UI resilient when audit append fails
  }
}

async function syncRgbMood(mood) {
  if (!api || !api.rgb || typeof api.rgb.applyMood !== "function") {
    return;
  }
  try {
    const result = await api.rgb.applyMood({
      mood: String(mood || "idle"),
      personality: getPersonalityProfile()
    });
    if (ui.rgbStatusOutput) {
      ui.rgbStatusOutput.textContent = JSON.stringify(result || {}, null, 2);
    }
  } catch (err) {
    if (ui.rgbStatusOutput) {
      ui.rgbStatusOutput.textContent = `RGB sync failed: ${err.message}`;
    }
  }
}

async function requestAssistantText(prompt) {
  const policy = safetyPromptPrefix();
  const response = await api.llm.chat([
    { role: "system", content: [personalityPromptPrefix(), policy].filter(Boolean).join("\n") },
    { role: "user", content: String(prompt || "") }
  ]);
  if (!response || !response.message) return "";
  return String(response.message.content || "").trim();
}

async function runMultiAgentStep(goal, maxSteps) {
  const recent = state.chat.slice(-8).map((m) => `${m.role}: ${m.content}`).join("\n");
  const plannerPrompt = [
    "You are the Planner agent.",
    `Goal: ${goal}`,
    `Current step: ${state.autonomousSteps}/${maxSteps}`,
    "Return a concise next-step plan with exactly 3 bullet points.",
    `Recent context:\n${recent || "(none)"}`
  ].join("\n");
  setMultiAgentStatus("Planner is building next step...");
  const plan = await requestAssistantText(plannerPrompt);
  state.multiAgentLastPlan = plan;
  pushAutonomyLog({
    runId: state.autonomousRunId,
    step: state.autonomousSteps,
    status: "planner",
    planner: plan
  });

  const approvalMode = String(ui.multiAgentApprovalSelect.value || "auto");
  if (approvalMode === "manual") {
    if (!state.multiAgentApprovalGranted) {
      state.multiAgentPendingApproval = {
        at: new Date().toISOString(),
        runId: state.autonomousRunId,
        step: state.autonomousSteps,
        goal,
        plan
      };
      setMultiAgentStatus("Awaiting manual approval for next execution step.");
      setAutonomousStatus(`Paused for approval at step ${state.autonomousSteps}/${maxSteps}.`);
      updateAutonomousCheckpoint({ awaitingApproval: true, lastPlan: plan });
      return { ok: false, paused: true };
    }
    state.multiAgentApprovalGranted = false;
    state.multiAgentPendingApproval = null;
  }

  const executorPrompt = [
    "You are the Executor agent.",
    `Goal: ${goal}`,
    "Execute the plan below and produce the best next assistant response.",
    `Plan:\n${plan}`,
    "Return only the assistant response content."
  ].join("\n");
  setMultiAgentStatus("Executor is producing output...");
  const execution = await requestAssistantText(executorPrompt);

  const verifierPrompt = [
    "You are the Verifier agent.",
    `Goal: ${goal}`,
    "Check if this execution is safe, on-goal, and useful.",
    "Answer with first token APPROVE or REVISE, then short rationale.",
    `Plan:\n${plan}`,
    `Execution:\n${execution}`
  ].join("\n");
  setMultiAgentStatus("Verifier is reviewing output...");
  const verification = await requestAssistantText(verifierPrompt);
  state.multiAgentLastVerification = verification;
  const approved = /^approve\b/i.test(verification);

  pushAutonomyLog({
    runId: state.autonomousRunId,
    step: state.autonomousSteps,
    status: approved ? "verifier:approve" : "verifier:revise",
    verifier: verification
  });

  if (!approved) {
    setMultiAgentStatus("Verifier requested revise.");
    updateAutonomousCheckpoint({ lastPlan: plan, lastVerification: verification, approved: false });
    return { ok: false, paused: false };
  }

  const userPrompt = `Goal: ${goal}\n\nPlan:\n${plan}\n\nExecution:\n${execution}`;
  ui.promptInput.value = userPrompt;
  updatePromptMetrics();
  const ok = await sendPrompt();
  if (ok) {
    setMultiAgentStatus("Verifier approved and execution sent.");
  } else {
    setMultiAgentStatus("Execution failed to send.");
  }
  updateAutonomousCheckpoint({
    lastPlan: plan,
    lastVerification: verification,
    approved: true
  });
  return { ok, paused: false };
}

function renderAutonomousPlan() {
  if (!ui.autonomousPlanOutput) return;
  const goal = String(ui.autonomousGoalInput.value || "").trim() || "(none)";
  const interval = Math.max(3, Number(ui.autonomousIntervalInput.value || 12));
  const maxSteps = Math.max(1, Number(ui.autonomousMaxStepsInput.value || 20));
  const mode = ui.multiAgentEnabledInput && ui.multiAgentEnabledInput.checked ? "multi-agent" : "single-agent";
  const approval = String((ui.multiAgentApprovalSelect && ui.multiAgentApprovalSelect.value) || "auto");
  ui.autonomousPlanOutput.textContent = `Plan: goal="${goal}" | interval=${interval}s | maxSteps=${maxSteps} | mode=${mode} | approval=${approval} | persona=${getPersonalityProfile()}`;
}

function renderAutonomousCheckpoint() {
  if (!ui.autonomousCheckpointOutput) return;
  const cp = state.autonomousLastCheckpoint;
  if (!cp || typeof cp !== "object") {
    ui.autonomousCheckpointOutput.textContent = "Checkpoint: none.";
    return;
  }
  ui.autonomousCheckpointOutput.textContent = `Checkpoint: run=${cp.runId || "n/a"} | step=${cp.step || 0}/${cp.maxSteps || "?"} | ${cp.at || "unknown time"}`;
}

function renderAutonomousRunLog() {
  if (!ui.autonomousRunList) return;
  ui.autonomousRunList.innerHTML = "";
  if (!Array.isArray(state.autonomousRunLog) || !state.autonomousRunLog.length) {
    const li = document.createElement("li");
    li.textContent = "No autonomous runs yet.";
    ui.autonomousRunList.appendChild(li);
    return;
  }
  state.autonomousRunLog.slice(0, 40).forEach((entry) => {
    const li = document.createElement("li");
    const when = entry && entry.at ? new Date(entry.at).toLocaleTimeString() : "--:--";
    const info = entry && entry.status ? entry.status : "unknown";
    li.textContent = `${when} | ${entry.runId || "run"} | step ${entry.step || 0} | ${info}`;
    ui.autonomousRunList.appendChild(li);
  });
}

function persistAutonomyState() {
  saveLocal(AUTONOMY_LOG_KEY, Array.isArray(state.autonomousRunLog) ? state.autonomousRunLog.slice(0, 200) : []);
  saveLocal(AUTONOMY_CHECKPOINT_KEY, state.autonomousLastCheckpoint || null);
}

function pushAutonomyLog(entry) {
  state.autonomousRunLog.unshift({
    at: new Date().toISOString(),
    ...entry
  });
  state.autonomousRunLog = state.autonomousRunLog.slice(0, 200);
  persistAutonomyState();
  renderAutonomousRunLog();
  appendAuditEvent({
    source: "renderer.autonomy",
    runId: entry && entry.runId ? entry.runId : state.autonomousRunId,
    step: entry && entry.step ? entry.step : state.autonomousSteps,
    status: entry && entry.status ? entry.status : "event"
  });
}

function updateAutonomousCheckpoint(details) {
  state.autonomousLastCheckpoint = {
    runId: state.autonomousRunId || "",
    step: state.autonomousSteps,
    goal: String(ui.autonomousGoalInput.value || "").trim(),
    intervalSec: Math.max(3, Number(ui.autonomousIntervalInput.value || 12)),
    maxSteps: Math.max(1, Number(ui.autonomousMaxStepsInput.value || 20)),
    at: new Date().toISOString(),
    ...details
  };
  persistAutonomyState();
  renderAutonomousCheckpoint();
}

function stopAutonomousMode(reason = "idle") {
  if (state.autonomousTimer) {
    clearInterval(state.autonomousTimer);
    state.autonomousTimer = null;
  }
  state.autonomousEnabled = false;
  if (reason === "manual") {
    setAutonomousStatus("Autonomous mode stopped.");
  } else if (reason === "completed") {
    setAutonomousStatus("Autonomous mode completed.");
  } else if (reason === "error") {
    setAutonomousStatus("Autonomous mode stopped after repeated failures.");
  } else {
    setAutonomousStatus("Autonomous mode idle.");
  }
  state.multiAgentPendingApproval = null;
  state.multiAgentApprovalGranted = false;
  setMultiAgentStatus("Multi-agent: idle.");
  syncRgbMood(reason === "error" ? "critical" : "idle").catch(() => { });
  renderMissionControl();
}

async function autonomousTick() {
  if (!state.autonomousEnabled || state.isBusy) return;
  if (state.multiAgentPendingApproval && !state.multiAgentApprovalGranted) {
    setAutonomousStatus("Paused for manual approval.");
    setMultiAgentStatus("Awaiting approval. Click Approve Next Step.");
    return;
  }
  const maxSteps = Math.max(1, Number(ui.autonomousMaxStepsInput.value || 20));
  if (state.autonomousSteps >= maxSteps) {
    stopAutonomousMode("completed");
    showBanner("Autonomous mode completed max steps.", "info");
    return;
  }
  const settings = getSettingsFromUI();
  if (!settings.allowRemoteBridge && !isLocalBridgeUrl(settings.ollamaBaseUrl)) {
    stopAutonomousMode("error");
    showBanner("Autonomous blocked: bridge URL must be local in offline-first mode.", "bad");
    return;
  }
  if (document.activeElement === ui.promptInput && ui.promptInput.value.trim()) {
    setAutonomousStatus("Paused: manual draft in prompt box.");
    return;
  }
  const goal = ui.autonomousGoalInput.value.trim() || "Advance the current objective.";
  state.autonomousSteps += 1;
  renderAutonomousPlan();
  const multiMode = Boolean(ui.multiAgentEnabledInput && ui.multiAgentEnabledInput.checked);
  const prompt = state.chat.length
    ? `Continue autonomously toward this goal: ${goal}\nReturn the next action and result.`
    : `Start working autonomously on this goal: ${goal}`;
  updateAutonomousCheckpoint({ lastPrompt: prompt, mode: multiMode ? "multi" : "single" });
  const logEntry = {
    runId: state.autonomousRunId,
    step: state.autonomousSteps,
    goal,
    prompt: multiMode ? "(multi-agent-generated)" : prompt,
    status: "running"
  };
  pushAutonomyLog(logEntry);
  setAutonomousStatus(`Running step ${state.autonomousSteps}/${maxSteps}...`);
  let ok = false;
  let pausedForApproval = false;
  if (multiMode) {
    const res = await runMultiAgentStep(goal, maxSteps);
    ok = Boolean(res && res.ok);
    pausedForApproval = Boolean(res && res.paused);
  } else {
    ui.promptInput.value = prompt;
    updatePromptMetrics();
    ok = await sendPrompt();
  }
  if (pausedForApproval) {
    return;
  }
  if (ok) {
    state.autonomousConsecutiveFailures = 0;
    pushAutonomyLog({
      runId: state.autonomousRunId,
      step: state.autonomousSteps,
      goal,
      status: "ok",
      chatSize: state.chat.length
    });
    updateAutonomousCheckpoint({ lastResult: "ok", chatSize: state.chat.length });
    return;
  }
  state.autonomousConsecutiveFailures += 1;
  pushAutonomyLog({
    runId: state.autonomousRunId,
    step: state.autonomousSteps,
    goal,
    status: `failed(${state.autonomousConsecutiveFailures})`
  });
  updateAutonomousCheckpoint({ lastResult: "failed", failures: state.autonomousConsecutiveFailures });
  if (state.autonomousConsecutiveFailures >= 3) {
    stopAutonomousMode("error");
    showBanner("Autonomous halted after 3 consecutive failures.", "bad");
  }
}

function startAutonomousMode(opts = {}) {
  const intervalSec = Math.max(3, Number(ui.autonomousIntervalInput.value || 12));
  const resumeCheckpoint = opts.resume && state.autonomousLastCheckpoint ? state.autonomousLastCheckpoint : null;
  state.autonomousSteps = resumeCheckpoint ? Number(resumeCheckpoint.step || 0) : 0;
  state.autonomousConsecutiveFailures = 0;
  state.autonomousRunId = resumeCheckpoint && resumeCheckpoint.runId
    ? String(resumeCheckpoint.runId)
    : `auto-${Date.now()}`;
  state.autonomousStartedAt = new Date().toISOString();
  state.autonomousEnabled = true;
  state.multiAgentPendingApproval = null;
  state.multiAgentApprovalGranted = false;
  if (state.autonomousTimer) clearInterval(state.autonomousTimer);
  state.autonomousTimer = setInterval(() => {
    autonomousTick().catch(() => { });
  }, intervalSec * 1000);
  renderAutonomousPlan();
  updateAutonomousCheckpoint({ resumed: Boolean(resumeCheckpoint) });
  setAutonomousStatus(`Autonomous mode active (${intervalSec}s interval).`);
  pushAutonomyLog({
    runId: state.autonomousRunId,
    step: state.autonomousSteps,
    goal: String(ui.autonomousGoalInput.value || "").trim(),
    status: resumeCheckpoint ? "resumed" : "started"
  });
  setMultiAgentStatus(ui.multiAgentEnabledInput && ui.multiAgentEnabledInput.checked
    ? "Multi-agent mode active."
    : "Multi-agent mode disabled.");
  syncRgbMood("creative").catch(() => { });
  renderMissionControl();
  autonomousTick().catch(() => { });
}

function renderBookmarks() {
  if (!ui.bookmarkList) return;
  ui.bookmarkList.innerHTML = "";
  if (!state.pinnedMessages.length) {
    const li = document.createElement("li");
    li.textContent = "No bookmarks yet.";
    ui.bookmarkList.appendChild(li);
    return;
  }
  state.pinnedMessages.forEach((item, idx) => {
    const li = document.createElement("li");
    li.textContent = `${idx + 1}. ${item.role}: ${String(item.content || "").slice(0, 70)}`;
    li.addEventListener("click", () => {
      ui.promptInput.value = String(item.content || "");
      ui.promptInput.focus();
      updatePromptMetrics();
    });
    ui.bookmarkList.appendChild(li);
  });
}

function trackCommandHistory(entry) {
  state.commandHistory.unshift(`${new Date().toLocaleTimeString()} | ${entry}`);
  state.commandHistory = state.commandHistory.slice(0, 60);
  saveLocal(HISTORY_KEY, state.commandHistory);
  renderCommandHistory();
}

function renderCommandHistory() {
  if (!ui.commandHistoryList) return;
  ui.commandHistoryList.innerHTML = "";
  if (!state.commandHistory.length) {
    const li = document.createElement("li");
    li.textContent = "No command history.";
    ui.commandHistoryList.appendChild(li);
    return;
  }
  state.commandHistory.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ui.commandHistoryList.appendChild(li);
  });
}

function trackUndoTrail(label) {
  state.undoTrail.unshift(`${new Date().toLocaleTimeString()} | ${label}`);
  state.undoTrail = state.undoTrail.slice(0, 40);
  saveLocal(UNDO_TRAIL_KEY, state.undoTrail);
  renderUndoTrail();
}

function renderUndoTrail() {
  if (!ui.undoTrailList) return;
  ui.undoTrailList.innerHTML = "";
  if (!state.undoTrail.length) {
    const li = document.createElement("li");
    li.textContent = "No undo actions yet.";
    ui.undoTrailList.appendChild(li);
    return;
  }
  state.undoTrail.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ui.undoTrailList.appendChild(li);
  });
}

function renderSnapshots() {
  if (!ui.snapshotSelect) return;
  ui.snapshotSelect.innerHTML = "";
  if (!state.snapshots.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No snapshots";
    ui.snapshotSelect.appendChild(option);
    return;
  }
  state.snapshots.forEach((snap) => {
    const option = document.createElement("option");
    option.value = snap.id;
    option.textContent = snap.name;
    ui.snapshotSelect.appendChild(option);
  });
}

function renderTemplates() {
  if (!ui.templateSelect) return;
  ui.templateSelect.innerHTML = "";
  if (!state.templates.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No templates";
    ui.templateSelect.appendChild(option);
    return;
  }
  state.templates.forEach((tpl) => {
    const option = document.createElement("option");
    option.value = tpl.id;
    option.textContent = tpl.name;
    ui.templateSelect.appendChild(option);
  });
}

function validateSettingsLocally(settings) {
  const problems = [];
  if (!/^https?:\/\//i.test(settings.ollamaBaseUrl || "")) problems.push("Base URL must start with http(s)://");
  if (!Number.isFinite(settings.timeoutMs) || settings.timeoutMs < 1000 || settings.timeoutMs > 120000) problems.push("Timeout out of range");
  if (!Number.isFinite(settings.retryCount) || settings.retryCount < 0 || settings.retryCount > 10) problems.push("Retry count out of range");
  if (!Number.isFinite(settings.autosaveIntervalMin) || settings.autosaveIntervalMin < 1 || settings.autosaveIntervalMin > 120) problems.push("Autosave interval out of range");
  if (!["balanced", "engineer", "founder", "analyst", "creative"].includes(String(settings.personalityProfile || "").toLowerCase())) {
    problems.push("Personality profile invalid");
  }
  if (!["strict", "balanced", "off"].includes(String(settings.safetyPolicy || "").toLowerCase())) {
    problems.push("Safety policy invalid");
  }
  if (settings.clockUtcOffset != null) {
    const offsetRaw = String(settings.clockUtcOffset).trim().toLowerCase();
    if (offsetRaw !== "local" && parseUtcOffsetMinutes(settings.clockUtcOffset) == null) {
      problems.push("Clock UTC offset must be local or +/-HH:MM");
    }
  }
  if (!["none", "openrgb"].includes(String(settings.rgbProvider || "").toLowerCase())) {
    problems.push("RGB provider invalid");
  }
  if (!Number.isFinite(settings.rgbPort) || settings.rgbPort < 1 || settings.rgbPort > 65535) {
    problems.push("RGB port out of range");
  }
  if (!Array.isArray(settings.rgbTargets)) {
    problems.push("RGB targets must be an array");
  }
  const profiles = Array.isArray(settings.connectionProfiles) ? settings.connectionProfiles : [];
  if (!profiles.length) problems.push("At least one bridge profile is required");
  profiles.forEach((p, idx) => {
    if (!/^https?:\/\//i.test(String(p.baseUrl || ""))) problems.push(`Profile ${idx + 1} URL invalid`);
    if (!settings.allowRemoteBridge && !isLocalBridgeUrl(p.baseUrl)) {
      problems.push(`Profile ${idx + 1} must be local (127.0.0.1/localhost/::1) in offline-first mode`);
    }
  });
  if (ui.settingsGuardOutput) {
    ui.settingsGuardOutput.textContent = problems.length ? `Problems: ${problems.join("; ")}` : "Ready";
  }
  return problems;
}

function setFontScale(value) {
  const num = Math.min(130, Math.max(85, Number(value) || 100));
  document.documentElement.style.setProperty("--chat-font-scale", String(num));
  if (ui.fontScaleRange) {
    ui.fontScaleRange.value = String(num);
  }
  saveLocal(FONT_SCALE_KEY, num);
}

function setupAutoBackup() {
  if (state.backupTimer) {
    clearInterval(state.backupTimer);
    state.backupTimer = null;
  }
  const enabled = Boolean(ui.autoBackupEnabledInput && ui.autoBackupEnabledInput.checked);
  const minutes = Number(ui.autoBackupIntervalInput && ui.autoBackupIntervalInput.value) || 5;
  saveLocal(BACKUP_KEY, { enabled, minutes });
  if (!enabled) return;
  const ms = Math.max(1, minutes) * 60 * 1000;
  state.backupTimer = setInterval(async () => {
    const fullState = await api.state.export();
    const backups = loadLocal("ns5_backups_v1", []);
    backups.unshift({
      at: new Date().toISOString(),
      state: fullState,
      chat: state.chat.slice(-100)
    });
    saveLocal("ns5_backups_v1", backups.slice(0, 12));
    showBanner("Auto backup captured", "info");
  }, ms);
}

function queuePrompt(prompt) {
  const text = String(prompt || "").trim();
  if (!text) return;
  state.promptQueue.push(text);
  saveLocal(QUEUE_KEY, state.promptQueue);
}

async function flushPromptQueue() {
  if (!state.promptQueue.length) {
    showBanner("Queue is empty", "info");
    return;
  }
  const next = state.promptQueue.shift();
  saveLocal(QUEUE_KEY, state.promptQueue);
  ui.promptInput.value = next;
  updatePromptMetrics();
  await sendPrompt();
  showBanner("Flushed one queued prompt", "good");
}

function replayLastAutonomousRunPrompts() {
  if (!Array.isArray(state.autonomousRunLog) || !state.autonomousRunLog.length) {
    showBanner("No autonomous run history to replay.", "bad");
    return;
  }
  const runId = state.autonomousRunLog.find((entry) => entry && entry.runId)?.runId;
  if (!runId) {
    showBanner("No run id available for replay.", "bad");
    return;
  }
  const prompts = state.autonomousRunLog
    .filter((entry) => entry && entry.runId === runId && typeof entry.prompt === "string" && entry.prompt.trim())
    .map((entry) => entry.prompt)
    .reverse();
  if (!prompts.length) {
    showBanner("No prompts recorded for latest run.", "bad");
    return;
  }
  const [first, ...rest] = prompts;
  ui.promptInput.value = first;
  updatePromptMetrics();
  ui.promptInput.focus();
  if (rest.length) {
    state.promptQueue = rest.concat(state.promptQueue);
    saveLocal(QUEUE_KEY, state.promptQueue);
  }
  showBanner(`Replayed ${prompts.length} autonomous prompts.`, "good");
}

function clearAutonomousRunHistory() {
  state.autonomousRunLog = [];
  state.autonomousLastCheckpoint = null;
  persistAutonomyState();
  renderAutonomousRunLog();
  renderAutonomousCheckpoint();
  showBanner("Autonomous history cleared.", "info");
}

function saveThemeSlot(slot) {
  const slots = loadLocal(THEME_SLOTS_KEY, {});
  slots[slot] = {
    accent: ui.themeAccentInput.value,
    hot: ui.themeHotInput.value,
    bgStart: ui.themeBgStartInput.value
  };
  saveLocal(THEME_SLOTS_KEY, slots);
  showBanner(`Saved theme slot ${slot}`, "good");
}

function applyThemeSlot(slot) {
  const slots = loadLocal(THEME_SLOTS_KEY, {});
  const data = slots[slot];
  if (!data) {
    showBanner(`Theme slot ${slot} is empty`, "bad");
    return;
  }
  ui.themeAccentInput.value = data.accent || ui.themeAccentInput.value;
  ui.themeHotInput.value = data.hot || ui.themeHotInput.value;
  ui.themeBgStartInput.value = data.bgStart || ui.themeBgStartInput.value;
  applyThemeStudioVars(ui.themeAccentInput.value, ui.themeHotInput.value, ui.themeBgStartInput.value);
  showBanner(`Applied theme slot ${slot}`, "good");
}

function updateTimeline() {
  if (!ui.timelineRange || !ui.timelineLabel) return;
  const total = state.chat.length;
  ui.timelineRange.max = String(Math.max(0, total - 1));
  ui.timelineRange.value = String(Math.max(0, total - 1));
  ui.timelineLabel.textContent = `${total ? total : 0} / ${total}`;
}

function renderCommandChips() {
  if (!ui.commandChips) return;
  ui.commandChips.innerHTML = "";
  const chips = [
    "Summarize the latest thread in 5 bullets.",
    "Give risks and mitigations for this plan.",
    "Rewrite this response for clarity and brevity.",
    "Generate an action checklist.",
    "Compare two options with tradeoffs."
  ];
  chips.forEach((text) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text.slice(0, 22);
    btn.title = text;
    btn.addEventListener("click", () => {
      ui.promptInput.value = text;
      ui.promptInput.focus();
      updatePromptMetrics();
    });
    ui.commandChips.appendChild(btn);
  });
}

function updatePreviewPane() {
  if (!ui.chatPreviewOutput || !state.splitPreview) return;
  const latest = state.chat.slice(-8).map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  ui.chatPreviewOutput.textContent = latest || "No messages yet.";
}

function setSplitPreview(enabled) {
  state.splitPreview = Boolean(enabled);
  if (!ui.chatSplitPane || !ui.chatPreviewPane || !ui.previewDivider) return;
  ui.chatSplitPane.classList.toggle("is-split", state.splitPreview);
  ui.chatPreviewPane.hidden = !state.splitPreview;
  ui.previewDivider.hidden = !state.splitPreview;
  updatePreviewPane();
}

function setDensityMode(enabled) {
  state.denseMode = Boolean(enabled);
  document.body.classList.toggle("dense", state.denseMode);
}

function setFocusMode(enabled) {
  state.focusMode = Boolean(enabled);
  document.body.classList.toggle("focus-mode", state.focusMode);
}

function renderPaletteList(filter = "") {
  if (!ui.commandPaletteList) return;
  const q = String(filter || "").toLowerCase();
  const filtered = state.paletteCommands.filter((cmd) => cmd.name.toLowerCase().includes(q));
  ui.commandPaletteList.innerHTML = "";
  filtered.forEach((cmd) => {
    const li = document.createElement("li");
    li.textContent = `/${cmd.name} ${Array.isArray(cmd.args) ? cmd.args.join(" ") : ""}`.trim();
    li.addEventListener("click", async () => {
      closeCommandPalette();
      try {
        const result = await api.command.run(cmd.name, []);
        trackCommandHistory(`palette.run /${cmd.name}`);
        showBanner(`Ran /${cmd.name}: ${JSON.stringify(result).slice(0, 90)}`, "good");
      } catch (err) {
        showBanner(`Command failed: ${err.message}`, "bad");
      }
    });
    ui.commandPaletteList.appendChild(li);
  });
}

function openCommandPalette() {
  if (!ui.commandPalette) return;
  ui.commandPalette.hidden = false;
  ui.commandPalette.setAttribute("aria-hidden", "false");
  ui.commandPaletteInput.value = "";
  renderPaletteList("");
  ui.commandPaletteInput.focus();
}

function closeCommandPalette() {
  if (!ui.commandPalette) return;
  ui.commandPalette.hidden = true;
  ui.commandPalette.setAttribute("aria-hidden", "true");
}

function applyThemeStudioVars(accent, hot, bgStart) {
  if (accent) document.documentElement.style.setProperty("--accent", accent);
  if (hot) document.documentElement.style.setProperty("--accent-hot", hot);
  if (bgStart) document.documentElement.style.setProperty("--bg-start", bgStart);
}

function renderMissionControl(stats = null) {
  if (!ui.missionHealth || !ui.missionAnomalies || !ui.missionHeatmap) return;
  const healthText = String(ui.statusLabel.textContent || "unknown");
  ui.missionHealth.textContent = `Health: ${healthText}`;
  const anomalies = state.lastLogsSnapshot.filter((row) => String(row.level || "").toLowerCase() === "error").length;
  ui.missionAnomalies.textContent = `Anomalies: ${anomalies}`;
  const hours = new Array(24).fill(0);
  state.chat.forEach((m) => {
    const h = new Date(m.timestamp || Date.now()).getHours();
    hours[h] += 1;
  });
  const bars = hours.map((v) => (v > 9 ? "*" : String(v))).join(" ");
  ui.missionHeatmap.textContent = `Activity: ${bars}`;
  if (stats && stats.platform) {
    ui.missionHealth.textContent += ` | ${stats.platform}`;
  }
  const autoState = state.autonomousEnabled
    ? `Autonomy ON (${state.autonomousSteps} steps)`
    : "Autonomy OFF";
  ui.missionHeatmap.textContent += ` | ${autoState}`;
}

function setLoadStatus(text) {
  if (ui.loadScreenText) {
    ui.loadScreenText.textContent = String(text || "");
  }
}

function hideLoadScreen() {
  if (!ui.loadScreen) {
    return;
  }
  ui.loadScreen.classList.add("is-hidden");
  setTimeout(() => {
    ui.loadScreen.hidden = true;
  }, 260);
}

function setSettingsTab(tab) {
  const target = tab === "interface" || tab === "autosave" ? tab : "network";
  const sections = Array.from(document.querySelectorAll("[data-settings-section]"));
  sections.forEach((section) => {
    section.hidden = section.getAttribute("data-settings-section") !== target;
  });
  const tabs = Array.from(document.querySelectorAll("[data-settings-tab]"));
  tabs.forEach((button) => {
    button.classList.toggle("is-active", button.getAttribute("data-settings-tab") === target);
  });
}

function focusArea(mode) {
  if (mode === "chat") {
    ui.chatHistory.scrollIntoView({ behavior: "smooth", block: "center" });
    ui.promptInput.focus();
    return;
  }
  if (mode === "sessions") {
    const panel = document.getElementById("sessionManager");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
    ui.sessionSearchInput.focus();
    return;
  }
  if (mode === "settings") {
    const panel = document.getElementById("settingsPanel");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
    ui.baseUrlInput.focus();
    return;
  }
  if (mode === "logs") {
    const panel = document.getElementById("llmStatus");
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "center" });
    ui.loadLogsBtn.click();
    return;
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function copyText(value) {
  const text = String(value || "");
  if (!text) {
    return false;
  }
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "true");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return Boolean(ok);
  } catch {
    return false;
  }
}

function setStatus(label, meta) {
  ui.statusLabel.textContent = label;
  ui.statusMeta.textContent = meta || "";
  const normalized = String(label || "").toLowerCase();
  const tone = normalized.includes("fail") || normalized.includes("offline")
    ? "bad"
    : normalized.includes("online") || normalized.includes("ready")
      ? "good"
      : "info";
  ui.statusLabel.dataset.tone = tone;
  ui.statusLabel.classList.toggle("is-pulse", tone === "good" || tone === "bad");
  renderMissionControl();
}

function setBusy(isBusy, typing) {
  state.isBusy = Boolean(isBusy);
  ui.sendBtn.disabled = state.isBusy;
  ui.stopBtn.disabled = !state.isBusy;
  ui.retryBtn.disabled = state.chat.length === 0;
  ui.typingIndicator.textContent = typing || "";
  ui.statusLabel.classList.toggle("is-pulse", state.isBusy);
}

function toMessage(role, content) {
  return {
    role,
    content: String(content || "").trim(),
    timestamp: new Date().toISOString()
  };
}

function scrollChatToBottom() {
  if (ui.autoScrollInput.checked) {
    ui.chatHistory.scrollTop = ui.chatHistory.scrollHeight;
  }
}

function renderChat(messages = state.chat) {
  ui.chatHistory.innerHTML = "";
  if (!messages.length) {
    const empty = document.createElement("div");
    empty.className = "emptyState";
    empty.textContent = "Start a conversation. Use snippets or ask anything.";
    ui.chatHistory.appendChild(empty);
    ui.retryBtn.disabled = true;
    return;
  }
  messages.forEach((msg) => {
    const row = document.createElement("div");
    row.className = `message ${msg.role}`;

    const meta = document.createElement("div");
    meta.className = "messageMeta";
    const ts = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : "";
    meta.textContent = `${msg.role}${ts ? ` | ${ts}` : ""}`;

    const body = document.createElement("div");
    body.className = "messageText";
    body.innerHTML = renderRichMessage(msg.content);

    const actions = document.createElement("div");
    actions.className = "messageActions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "messageActionBtn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", async () => {
      try {
        const ok = await copyText(String(msg.content || ""));
        if (!ok) {
          showBanner("Copy unavailable in this environment", "bad");
          return;
        }
        showBanner("Message copied", "good");
      } catch {
        showBanner("Copy failed", "bad");
      }
    });
    actions.appendChild(copyBtn);

    const pinBtn = document.createElement("button");
    pinBtn.type = "button";
    pinBtn.className = "messageActionBtn";
    pinBtn.textContent = "Pin";
    pinBtn.addEventListener("click", () => {
      state.pinnedMessages.unshift({ role: msg.role, content: msg.content, timestamp: msg.timestamp });
      state.pinnedMessages = state.pinnedMessages.slice(0, 30);
      saveLocal(BOOKMARKS_KEY, state.pinnedMessages);
      renderBookmarks();
      showBanner("Bookmarked message", "good");
    });
    actions.appendChild(pinBtn);

    const repromptBtn = document.createElement("button");
    repromptBtn.type = "button";
    repromptBtn.className = "messageActionBtn";
    repromptBtn.textContent = "Re-prompt";
    repromptBtn.addEventListener("click", () => {
      ui.promptInput.value = `Improve this response:\n\n${String(msg.content || "")}`;
      ui.promptInput.focus();
      updatePromptMetrics();
    });
    actions.appendChild(repromptBtn);

    if (msg.role === "user") {
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "messageActionBtn";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        ui.promptInput.value = String(msg.content || "");
        ui.promptInput.focus();
        updatePromptMetrics();
      });
      actions.appendChild(editBtn);
    } else if (msg.role === "assistant") {
      const assistants = messages.filter((m) => m.role === "assistant");
      const idx = assistants.findIndex((m) => m === msg);
      if (idx > 0) {
        const prev = assistants[idx - 1];
        const diffBtn = document.createElement("button");
        diffBtn.type = "button";
        diffBtn.className = "messageActionBtn";
        diffBtn.textContent = "Diff";
        diffBtn.addEventListener("click", () => {
          const oldLen = String(prev.content || "").length;
          const newLen = String(msg.content || "").length;
          showBanner(`Diff length: ${newLen - oldLen >= 0 ? "+" : ""}${newLen - oldLen} chars`, "info");
        });
        actions.appendChild(diffBtn);
      }
    }

    row.appendChild(meta);
    row.appendChild(body);
    row.appendChild(actions);
    ui.chatHistory.appendChild(row);
  });
  scrollChatToBottom();
  ui.retryBtn.disabled = state.chat.length === 0;
  updateTimeline();
  updatePreviewPane();
  renderMissionControl();
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderRichMessage(text) {
  const safe = escapeHtml(text);
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const chunks = [];
  let lastIndex = 0;
  let match;
  while ((match = codeBlockRegex.exec(safe)) !== null) {
    if (match.index > lastIndex) {
      chunks.push(`<p>${safe.slice(lastIndex, match.index).replace(/\n/g, "<br>")}</p>`);
    }
    chunks.push(`<pre class="codeBlock"><code>${match[1]}</code></pre>`);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < safe.length) {
    chunks.push(`<p>${safe.slice(lastIndex).replace(/\n/g, "<br>")}</p>`);
  }
  return chunks.join("");
}

function updatePromptMetrics() {
  const raw = ui.promptInput.value || "";
  const trimmed = raw.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const tokens = Math.ceil(raw.length / 4);
  ui.promptMetrics.textContent = `Chars: ${raw.length} | Words: ${words} | Tokens~: ${tokens}`;
}

function applyTheme(theme) {
  const safeTheme = theme === "light" ? "light" : "dark";
  document.body.classList.toggle("theme-light", safeTheme === "light");
  ui.themeSelect.value = safeTheme;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getSessionPayload() {
  return {
    model: state.selectedModel,
    chat: state.chat,
    settings: getSettingsFromUI(),
    updatedAt: new Date().toISOString()
  };
}

async function persistChatState() {
  await api.state.update({
    chat: state.chat,
    tokens: state.chat.length
  });
}

async function testBridgeProfile(profile) {
  const target = profile || getActiveBridgeProfile();
  if (!target) {
    setBridgeStatus("No profile selected.");
    return null;
  }
  try {
    const result = await api.bridge.test(target);
    setBridgeStatus(JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    setBridgeStatus(`Bridge test failed: ${err.message}`);
    return null;
  }
}

function getSettingsFromUI() {
  const profiles = state.bridgeProfiles.map((p) => ({
    id: p.id,
    name: p.name,
    baseUrl: p.baseUrl,
    timeoutMs: p.timeoutMs,
    retryCount: p.retryCount,
    defaultModel: p.defaultModel
  }));
  return {
    ollamaBaseUrl: ui.baseUrlInput.value.trim() || "http://127.0.0.1:11434",
    timeoutMs: Number(ui.timeoutInput.value || 15000),
    retryCount: Number(ui.retryInput.value || 2),
    theme: ui.themeSelect.value || "dark",
    personalityProfile: getPersonalityProfile(),
    safetyPolicy: (ui.safetyPolicySelect && ui.safetyPolicySelect.value) || "balanced",
    clockEnabled: Boolean(ui.clockEnabledInput && ui.clockEnabledInput.checked),
    clock24h: Boolean(ui.clock24hInput && ui.clock24hInput.checked),
    clockUtcOffset: (ui.clockUtcOffsetInput && ui.clockUtcOffsetInput.value.trim()) || "local",
    rgbEnabled: Boolean(ui.rgbEnabledInput && ui.rgbEnabledInput.checked),
    rgbProvider: (ui.rgbProviderSelect && ui.rgbProviderSelect.value) || "none",
    rgbHost: (ui.rgbHostInput && ui.rgbHostInput.value.trim()) || "127.0.0.1",
    rgbPort: Number((ui.rgbPortInput && ui.rgbPortInput.value) || 6742),
    rgbTargets: parseRgbTargets(ui.rgbTargetsInput && ui.rgbTargetsInput.value),
    tokenBudget: Number(ui.tokenBudgetInput.value || 0),
    autosaveEnabled: Boolean(ui.autosaveEnabledInput.checked),
    autosaveIntervalMin: Number(ui.autosaveIntervalInput.value || 5),
    autosaveName: ui.autosaveNameInput.value.trim() || "autosave",
    connectionProfiles: profiles,
    activeProfileId: state.activeBridgeProfileId || (profiles[0] && profiles[0].id) || "",
    connectOnStartup: Boolean(ui.connectOnStartupInput.checked),
    allowRemoteBridge: Boolean(ui.allowRemoteBridgeInput.checked)
  };
}

function parseTs(value) {
  const ts = Date.parse(value || "");
  return Number.isFinite(ts) ? ts : 0;
}

function listToSortedNames(list, metadata = {}) {
  const names = (list || []).map((item) => (typeof item === "string" ? item : item.name || "")).filter(Boolean);
  const query = ui.sessionSearchInput.value.trim().toLowerCase();
  const filtered = names.filter((n) => n.toLowerCase().includes(query));
  const mode = ui.sessionSortSelect.value;
  const sorted = filtered.sort((a, b) => {
    if (mode === "time_desc" || mode === "time_asc") {
      const aTs = parseTs(metadata[a] && metadata[a].timestamp);
      const bTs = parseTs(metadata[b] && metadata[b].timestamp);
      return mode === "time_desc" ? bTs - aTs : aTs - bTs;
    }
    const cmp = a.localeCompare(b);
    return mode === "name_desc" ? -cmp : cmp;
  });
  return sorted;
}

function renderSessionList(items, metadata = {}) {
  const names = listToSortedNames(items, metadata);
  ui.sessionList.innerHTML = "";
  if (!names.length) {
    const li = document.createElement("li");
    li.textContent = "No sessions found.";
    li.className = "is-empty";
    ui.sessionList.appendChild(li);
    return;
  }
  names.forEach((name) => {
    const li = document.createElement("li");
    const meta = metadata[name] || {};
    const model = meta.model || "n/a";
    const tokens = Number.isFinite(meta.tokens) ? meta.tokens : 0;

    const textSpan = document.createElement("span");
    textSpan.textContent = `${name} | ${model} | ${tokens} tk`;
    textSpan.style.flex = "1";
    li.appendChild(textSpan);

    const transportBtn = document.createElement("button");
    transportBtn.textContent = "🚀";
    transportBtn.title = "Transport via NeuralLink™";
    transportBtn.className = "icon-btn";
    transportBtn.style.marginLeft = "10px";
    transportBtn.style.padding = "2px 5px";
    transportBtn.style.fontSize = "0.8em";
    transportBtn.onclick = async (e) => {
      e.stopPropagation();
      const peerId = prompt("Enter Target Peer ID for NeuralLink™ Transport:");
      if (!peerId) return;
      const pass = prompt(`Enter passphrase for '${name}' to unlock for transport:`);
      if (pass === null) return;
      try {
        showBanner(`Bundling and Sending '${name}' to ${peerId}...`, "caution");
        const result = await api.session.export(name, peerId, pass);
        showBanner(`Transport Initiated: ${result}`, "good");
      } catch (err) {
        showBanner(`Transport Failed: ${err.message}`, "bad");
      }
    };
    li.appendChild(transportBtn);

    li.addEventListener("click", () => {
      state.selectedSession = name;
      ui.sessionName.value = name;
    });
    ui.sessionList.appendChild(li);
  });
}

async function refreshSessions() {
  try {
    const sessions = await api.session.list();
    const metadata = await api.session.metadata();
    renderSessionList(sessions, metadata || {});
    ui.sessionMetadataOutput.textContent = JSON.stringify(metadata || {}, null, 2);
  } catch (err) {
    showBanner(`Session refresh failed: ${err.message}`, "bad");
  }
}

async function refreshModels() {
  try {
    const models = await api.llm.listModels();
    const active = state.selectedModel || ui.modelSelect.value;
    ui.modelSelect.innerHTML = "";
    (models || []).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      option.selected = name === active;
      ui.modelSelect.appendChild(option);
    });
    if (!ui.modelSelect.value && active) {
      ui.modelSelect.value = active;
    }
    setStatus("Online", `${(models || []).length} model(s)`);
  } catch (err) {
    setStatus("Offline", err.message);
  }
}

async function refreshCommands() {
  try {
    const commands = await api.command.list();
    state.paletteCommands = Array.isArray(commands) ? commands : [];
    ui.commandList.innerHTML = "";
    if (ui.pluginMarketplaceOutput) {
      ui.pluginMarketplaceOutput.innerHTML = "";
    }
    (commands || []).forEach((cmd) => {
      const li = document.createElement("li");
      const args = Array.isArray(cmd.args) && cmd.args.length ? ` ${cmd.args.join(" ")}` : "";
      li.textContent = `/${cmd.name}${args} - ${cmd.description || ""}`;
      ui.commandList.appendChild(li);
      if (ui.pluginMarketplaceOutput && cmd.source && cmd.source !== "core") {
        const card = document.createElement("div");
        card.className = "pluginCard";
        card.textContent = `${cmd.source} | /${cmd.name} | ${(cmd.description || "No description")}`;
        ui.pluginMarketplaceOutput.appendChild(card);
      }
    });
    renderPaletteList(ui.commandPaletteInput ? ui.commandPaletteInput.value : "");
  } catch (err) {
    showBanner(`Command refresh failed: ${err.message}`, "bad");
  }
}

async function refreshSystemStats() {
  try {
    const stats = await api.system.getStats();
    const cpuPercent = Number.isFinite(Number(stats && stats.cpuPercent))
      ? Number(stats.cpuPercent)
      : Number(stats && stats.cpu) || 0;
    const memoryMb = Number.isFinite(Number(stats && stats.memoryMb))
      ? Number(stats.memoryMb)
      : Math.round(Number(stats && stats.memory && stats.memory.used) / (1024 * 1024)) || 0;
    const tokensUsed = Number.isFinite(Number(stats && stats.tokensUsed))
      ? Number(stats.tokensUsed)
      : Number(stats && stats.tokens) || 0;

    ui.cpuUsage.textContent = `CPU: ${cpuPercent}%`;
    ui.memoryUsage.textContent = `Memory: ${memoryMb} MB`;
    ui.tokensUsed.textContent = `Tokens: ${tokensUsed}`;
    ui.platformInfo.textContent = `Platform: ${stats.platform || "unknown"}`;
    renderMissionControl(stats);
  } catch {
    ui.cpuUsage.textContent = "CPU: unavailable";
    ui.memoryUsage.textContent = "Memory: unavailable";
    renderMissionControl();
  }
  ui.clockTime.textContent = `Clock: ${formatClockTime(new Date())}`;
}

function parseUtcOffsetMinutes(value) {
  const raw = String(value || "").trim();
  if (!raw || raw.toLowerCase() === "local") return null;
  const m = raw.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!m) return null;
  const sign = m[1] === "-" ? -1 : 1;
  const hh = Number(m[2]);
  const mm = Number(m[3]);
  if (hh > 14 || mm > 59) return null;
  return sign * (hh * 60 + mm);
}

function formatClockTime(now) {
  const enabled = !ui.clockEnabledInput || Boolean(ui.clockEnabledInput.checked);
  if (!enabled) return "hidden";
  const use24h = ui.clock24hInput && Boolean(ui.clock24hInput.checked);
  const offset = parseUtcOffsetMinutes(ui.clockUtcOffsetInput ? ui.clockUtcOffsetInput.value : "");
  if (offset == null) {
    return now.toLocaleTimeString([], {
      hour12: !use24h,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const zoned = new Date(utcMs + (offset * 60000));
  const hh = zoned.getUTCHours();
  const mm = zoned.getUTCMinutes();
  const ss = zoned.getUTCSeconds();
  if (use24h) {
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} (UTC${ui.clockUtcOffsetInput.value.trim()})`;
  }
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")} ${ap} (UTC${ui.clockUtcOffsetInput.value.trim()})`;
}

function buildLlmRequestMessages(chat) {
  const policy = safetyPromptPrefix();
  const prefix = [personalityPromptPrefix(), policy].filter(Boolean).join("\n");
  const history = Array.isArray(chat) ? chat : [];
  return [
    { role: "system", content: prefix },
    ...history.map(({ role, content }) => ({ role, content }))
  ];
}

async function sendPrompt() {
  const prompt = ui.promptInput.value.trim();
  if (!prompt || state.isBusy) {
    return false;
  }
  const user = toMessage("user", prompt);
  state.lastUserPrompt = prompt;
  state.chat.push(user);
  renderChat();
  ui.promptInput.value = "";
  updatePromptMetrics();
  setBusy(true, "Assistant is thinking...");
  syncRgbMood("focused").catch(() => { });

  try {
    const reply = await api.llm.chat(buildLlmRequestMessages(state.chat));
    const text = reply && reply.message ? reply.message.content || "" : "";
    state.chat.push(toMessage("assistant", text));
    renderChat();
    await api.xp.add(10);
    await persistChatState();
    setStatus("Ready", `${state.chat.length} messages`);
    appendAuditEvent({
      source: "renderer.chat",
      status: "success",
      chatSize: state.chat.length
    });
    return true;
  } catch (err) {
    showBanner(`Send failed: ${err.message}`, "bad");
    queuePrompt(prompt);
    showBanner("Prompt queued for retry", "info");
    await api.logger.log("error", "sendPrompt failed", { error: err.message });
    appendAuditEvent({
      source: "renderer.chat",
      status: "failed",
      error: err.message
    });
    return false;
  } finally {
    setBusy(false, "");
    syncRgbMood("idle").catch(() => { });
  }
}

function asMarkdown(messages) {
  return messages
    .map((m) => `### ${m.role}\n\n${m.content}`)
    .join("\n\n");
}

async function loadLogs() {
  const rows = await api.logger.tail(200);
  state.lastLogsSnapshot = Array.isArray(rows) ? rows : [];
  ui.logsOutput.textContent = Array.isArray(rows) ? rows.map(formatLogRow).join("\n") : String(rows || "");
  renderMissionControl();
}

async function loadChatLogs() {
  const rows = await api.chatlog.tail(200);
  if (Array.isArray(rows)) {
    ui.chatLogsOutput.textContent = rows.map(formatLogRow).join("\n");
    return;
  }
  ui.chatLogsOutput.textContent = String(rows || "");
}

function formatLogRow(row) {
  if (row && typeof row === "object") {
    return JSON.stringify(row);
  }
  return String(row || "");
}

async function withBusyButton(button, task) {
  if (!button || button.disabled) {
    return;
  }
  const original = button.textContent;
  button.disabled = true;
  button.textContent = `${original}...`;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function runButtonAudit() {
  const ids = Array.from(document.querySelectorAll("button[id]")).map((btn) => {
    return `${btn.id} | disabled=${btn.disabled}`;
  });
  ui.buttonAuditOutput.textContent = ids.join("\n");
}

function setupAutosave() {
  if (state.autosaveTimer) {
    clearInterval(state.autosaveTimer);
    state.autosaveTimer = null;
  }
  const settings = getSettingsFromUI();
  if (!settings.autosaveEnabled) {
    return;
  }
  const ms = Math.max(1, settings.autosaveIntervalMin) * 60 * 1000;
  state.autosaveTimer = setInterval(async () => {
    try {
      await api.session.save(settings.autosaveName, getSessionPayload(), ui.sessionPass.value.trim() || "autosave");
    } catch {
      // Ignore autosave transient failures.
    }
  }, ms);
}

function bindUi() {
  setSettingsTab("network");

  ui.settingsTabNetworkBtn.addEventListener("click", () => setSettingsTab("network"));
  ui.settingsTabInterfaceBtn.addEventListener("click", () => setSettingsTab("interface"));
  ui.settingsTabAutosaveBtn.addEventListener("click", () => setSettingsTab("autosave"));
  [ui.baseUrlInput, ui.timeoutInput, ui.retryInput, ui.autosaveIntervalInput, ui.allowRemoteBridgeInput, ui.clockEnabledInput, ui.clock24hInput, ui.clockUtcOffsetInput, ui.personalityProfileSelect, ui.safetyPolicySelect, ui.rgbEnabledInput, ui.rgbProviderSelect, ui.rgbHostInput, ui.rgbPortInput, ui.rgbTargetsInput].forEach((el) => {
    el.addEventListener("input", () => validateSettingsLocally(getSettingsFromUI()));
  });
  [ui.clockEnabledInput, ui.clock24hInput, ui.clockUtcOffsetInput].forEach((el) => {
    el.addEventListener("input", () => {
      ui.clockTime.textContent = `Clock: ${formatClockTime(new Date())}`;
    });
  });
  ui.personalityProfileSelect.addEventListener("change", () => {
    renderAutonomousPlan();
    syncRgbMood("focused").catch(() => { });
  });
  ui.rgbPreviewMoodBtn.addEventListener("click", () => {
    const mood = state.isBusy ? "focused" : "idle";
    syncRgbMood(mood).catch(() => { });
  });
  ui.rgbRunDemoBtn.addEventListener("click", async () => {
    const sequence = ["idle", "focused", "creative", "caution", "critical", "calm"];
    for (const mood of sequence) {
      await syncRgbMood(mood);
      // small pause without blocking UI responsiveness significantly
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 220));
    }
  });
  ui.runAutonomyBenchmarkBtn.addEventListener("click", async () => {
    try {
      const result = await api.command.run("selftest", []);
      const rows = [
        "Autonomy benchmark snapshot:",
        `messages=${state.chat.length}`,
        `queue=${state.promptQueue.length}`,
        `autonomyRuns=${state.autonomousRunLog.length}`,
        `selftestOk=${Boolean(result && result.result && result.result.ok)}`
      ];
      ui.rgbStatusOutput.textContent = rows.join("\n");
    } catch (err) {
      ui.rgbStatusOutput.textContent = `Benchmark failed: ${err.message}`;
    }
  });
  ui.verifyAuditBtn.addEventListener("click", async () => {
    try {
      const result = await api.audit.verify();
      ui.auditOutput.textContent = JSON.stringify(result || {}, null, 2);
    } catch (err) {
      ui.auditOutput.textContent = `Audit verify failed: ${err.message}`;
    }
  });
  ui.loadAuditBtn.addEventListener("click", async () => {
    try {
      const rows = await api.audit.tail(80);
      ui.auditOutput.textContent = JSON.stringify(rows || [], null, 2);
    } catch (err) {
      ui.auditOutput.textContent = `Audit tail failed: ${err.message}`;
    }
  });

  ui.bridgeProfileSelect.addEventListener("change", () => {
    state.activeBridgeProfileId = ui.bridgeProfileSelect.value;
    const active = getActiveBridgeProfile();
    if (active) {
      ui.bridgeProfileNameInput.value = active.name;
      ui.baseUrlInput.value = active.baseUrl;
      ui.timeoutInput.value = String(active.timeoutMs);
      ui.retryInput.value = String(active.retryCount);
      state.selectedModel = active.defaultModel || state.selectedModel;
    }
  });
  ui.saveBridgeProfileBtn.addEventListener("click", () => {
    const name = ui.bridgeProfileNameInput.value.trim() || `Profile ${state.bridgeProfiles.length + 1}`;
    const baseUrl = ui.baseUrlInput.value.trim();
    const timeoutMs = Number(ui.timeoutInput.value || 15000);
    const retryCount = Number(ui.retryInput.value || 2);
    const defaultModel = state.selectedModel || "llama3";
    const id = state.activeBridgeProfileId || `profile-${Date.now()}`;
    const existing = state.bridgeProfiles.find((p) => p.id === id);
    if (existing) {
      existing.name = name;
      existing.baseUrl = baseUrl;
      existing.timeoutMs = timeoutMs;
      existing.retryCount = retryCount;
      existing.defaultModel = defaultModel;
    } else {
      state.bridgeProfiles.unshift({ id, name, baseUrl, timeoutMs, retryCount, defaultModel });
      state.activeBridgeProfileId = id;
    }
    renderBridgeProfiles();
    setBridgeStatus(`Saved profile: ${name}`);
  });
  ui.testBridgeBtn.addEventListener("click", async () => {
    const active = getActiveBridgeProfile() || {
      id: "temp",
      name: ui.bridgeProfileNameInput.value.trim() || "Temp",
      baseUrl: ui.baseUrlInput.value.trim(),
      timeoutMs: Number(ui.timeoutInput.value || 15000),
      retryCount: Number(ui.retryInput.value || 2),
      defaultModel: state.selectedModel || "llama3"
    };
    await testBridgeProfile(active);
  });

  ui.wizardTestBtn.addEventListener("click", async () => {
    const profile = {
      id: "wizard-temp",
      name: ui.wizardProfileNameInput.value.trim() || "Wizard Profile",
      baseUrl: ui.wizardBaseUrlInput.value.trim() || "http://127.0.0.1:11434",
      timeoutMs: 15000,
      retryCount: 2,
      defaultModel: ui.wizardDefaultModelInput.value.trim() || "llama3"
    };
    const result = await testBridgeProfile(profile);
    setWizardOutput(JSON.stringify(result || { ok: false }, null, 2));
  });
  ui.wizardSaveBtn.addEventListener("click", async () => {
    const profile = {
      id: `profile-${Date.now()}`,
      name: ui.wizardProfileNameInput.value.trim() || "Local Bridge",
      baseUrl: ui.wizardBaseUrlInput.value.trim() || "http://127.0.0.1:11434",
      timeoutMs: 15000,
      retryCount: 2,
      defaultModel: ui.wizardDefaultModelInput.value.trim() || "llama3"
    };
    state.bridgeProfiles = [profile, ...state.bridgeProfiles.filter((p) => p.baseUrl !== profile.baseUrl)];
    state.activeBridgeProfileId = profile.id;
    ui.connectOnStartupInput.checked = Boolean(ui.wizardConnectOnStartupInput.checked);
    renderBridgeProfiles();
    const settings = getSettingsFromUI();
    await api.settings.update(settings);
    setWizardOutput("Saved. You can edit profiles in Settings > Network.");
    closeSetupWizard();
  });
  ui.wizardSkipBtn.addEventListener("click", closeSetupWizard);

  ui.menuFocusAllBtn.addEventListener("click", () => focusArea("all"));
  ui.menuFocusChatBtn.addEventListener("click", () => focusArea("chat"));
  ui.menuFocusSessionsBtn.addEventListener("click", () => focusArea("sessions"));
  ui.menuFocusSettingsBtn.addEventListener("click", () => focusArea("settings"));
  ui.menuFocusLogsBtn.addEventListener("click", () => focusArea("logs"));
  ui.menuQuickSaveBtn.addEventListener("click", async () => {
    const name = ui.sessionName.value.trim() || `quick-${new Date().toISOString().replace(/[:.]/g, "-")}`;
    const pass = ui.sessionPass.value.trim() || "quicksave";
    ui.sessionName.value = name;
    await api.session.save(name, getSessionPayload(), pass);
    await refreshSessions();
    trackCommandHistory(`session.quicksave ${name}`);
    showBanner(`Quick saved: ${name}`, "good");
  });
  ui.toggleFocusModeBtn.addEventListener("click", () => {
    setFocusMode(!state.focusMode);
  });
  ui.toggleDensityBtn.addEventListener("click", () => {
    setDensityMode(!state.denseMode);
  });
  ui.flushQueueBtn.addEventListener("click", flushPromptQueue);
  ui.autonomousStartBtn.addEventListener("click", startAutonomousMode);
  ui.autonomousStopBtn.addEventListener("click", () => stopAutonomousMode("manual"));
  ui.autonomousResumeBtn.addEventListener("click", () => startAutonomousMode({ resume: true }));
  ui.autonomousReplayBtn.addEventListener("click", replayLastAutonomousRunPrompts);
  ui.autonomousClearHistoryBtn.addEventListener("click", clearAutonomousRunHistory);
  ui.multiAgentApproveBtn.addEventListener("click", () => {
    state.multiAgentApprovalGranted = true;
    setMultiAgentStatus("Manual approval granted for next step.");
  });
  ui.autonomousGoalInput.addEventListener("input", renderAutonomousPlan);
  ui.autonomousIntervalInput.addEventListener("input", renderAutonomousPlan);
  ui.autonomousMaxStepsInput.addEventListener("input", renderAutonomousPlan);
  ui.multiAgentEnabledInput.addEventListener("change", () => {
    saveLocal(AUTONOMY_MULTI_CFG_KEY, {
      enabled: Boolean(ui.multiAgentEnabledInput.checked),
      approval: String(ui.multiAgentApprovalSelect.value || "auto")
    });
    renderAutonomousPlan();
  });
  ui.multiAgentApprovalSelect.addEventListener("change", () => {
    saveLocal(AUTONOMY_MULTI_CFG_KEY, {
      enabled: Boolean(ui.multiAgentEnabledInput.checked),
      approval: String(ui.multiAgentApprovalSelect.value || "auto")
    });
    renderAutonomousPlan();
  });
  ui.togglePreviewBtn.addEventListener("click", () => {
    setSplitPreview(!state.splitPreview);
  });
  ui.toggleCommandPaletteBtn.addEventListener("click", openCommandPalette);
  ui.commandPaletteCloseBtn.addEventListener("click", closeCommandPalette);
  ui.commandPalette.addEventListener("click", (evt) => {
    if (evt.target === ui.commandPalette) closeCommandPalette();
  });
  ui.commandPaletteInput.addEventListener("input", () => {
    renderPaletteList(ui.commandPaletteInput.value);
  });

  ui.timelineRange.addEventListener("input", () => {
    const idx = Number(ui.timelineRange.value || 0);
    ui.timelineLabel.textContent = `${idx + 1} / ${Math.max(1, state.chat.length)}`;
    const row = ui.chatHistory.children[idx];
    if (row && typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  ui.macroSummarizeBtn.addEventListener("click", () => {
    ui.promptInput.value = "Summarize this conversation in 5 bullets.";
    updatePromptMetrics();
    ui.promptInput.focus();
  });
  ui.macroRisksBtn.addEventListener("click", () => {
    ui.promptInput.value = "List risks and mitigations for the latest plan.";
    updatePromptMetrics();
    ui.promptInput.focus();
  });
  ui.macroRewriteBtn.addEventListener("click", () => {
    ui.promptInput.value = "Rewrite the latest assistant response for clarity and brevity.";
    updatePromptMetrics();
    ui.promptInput.focus();
  });

  ui.exportBundleBtn.addEventListener("click", async () => {
    const [appLogs, chatLogs, fullState] = await Promise.all([
      api.logger.export(),
      api.chatlog.export(),
      api.state.export()
    ]);
    const bundle = {
      exportedAt: new Date().toISOString(),
      state: fullState,
      chat: state.chat,
      appLogs,
      chatLogs
    };
    downloadText(`bundle-${Date.now()}.json`, JSON.stringify(bundle, null, 2));
  });

  if (ui.importBundleBtn) {
    ui.importBundleBtn.addEventListener("click", async () => {
      try {
        const filePath = prompt("Enter path to NeuralLink™ Bundle (.nlb):");
        if (!filePath) return;
        const targetPass = prompt("Enter NEW local passphrase to secure the imported session:");
        if (targetPass === null) return;
        showBanner("Verifying Sovereign Integrity...", "caution");
        const result = await api.session.importBundle(filePath.trim(), targetPass);
        showBanner(`Imported '${result.name}' successfully${result.reEncrypted ? " (Re-encrypted for Local Vault)" : ""}.`, "good");
        await refreshSessions();
      } catch (err) {
        showBanner(`Import Failed: ${err.message}`, "bad");
      }
    });
  }

  // --- Identity Panel ---
  async function refreshIdentityPanel() {
    try {
      const el = document.getElementById("identityFingerprint");
      const listEl = document.getElementById("identityPeerList");
      if (!el || !listEl) return;
      const identity = await api.identity.pubkey();
      el.textContent = `Fingerprint: ${identity.fingerprint}`;
      const peers = await api.identity.listPeers();
      listEl.innerHTML = "";
      if (peers.length === 0) {
        const li = document.createElement("li"); li.textContent = "No trusted peers."; listEl.appendChild(li);
      } else {
        peers.forEach(p => {
          const li = document.createElement("li");
          li.textContent = `${p.label} — ${p.fingerprint}`;
          listEl.appendChild(li);
        });
      }
    } catch (err) {
      const el = document.getElementById("identityFingerprint");
      if (el) el.textContent = `Identity unavailable: ${err.message}`;
    }
  }

  const identityRotateBtn = document.getElementById("identityRotateBtn");
  if (identityRotateBtn) {
    identityRotateBtn.addEventListener("click", async () => {
      if (!confirm("Rotate device keypair? Peers will need your new public key to verify future bundles.")) return;
      try {
        const result = await api.identity.rotate();
        showBanner(`Key rotated. New fingerprint: ${result.fingerprint}`, "good");
        await refreshIdentityPanel();
      } catch (err) {
        showBanner(`Rotation failed: ${err.message}`, "bad");
      }
    });
  }

  void refreshIdentityPanel();

  // ─── Audit Dashboard ─────────────────────────────────────────────────────

  const AUDIT_EVENT_COLORS = {
    daemon_started: "#4caf50",
    daemon_fatal: "#f44336",
    identity_key_rotation: "#ff9800",
    UNTRUSTED_PEER: "#f44336",
    app_ready: "#2196f3",
    transfer_completed: "#4caf50",
    transfer_failed: "#f44336",
    bundle_imported: "#9c27b0",
  };

  function renderAuditFeed(entries) {
    const feed = document.getElementById("auditFeed");
    if (!feed) return;
    feed.innerHTML = "";
    const rows = [...entries].reverse(); // newest first
    rows.forEach(row => {
      const li = document.createElement("li");
      const evt = row?.payload?.event || "unknown";
      const color = AUDIT_EVENT_COLORS[evt] || "#aaa";
      const ts = row.at ? new Date(row.at).toLocaleTimeString() : "?";
      li.style.cssText = `padding:2px 0; border-left:3px solid ${color}; padding-left:5px; margin-bottom:2px;`;
      li.textContent = `${ts} — ${evt}`;
      li.title = JSON.stringify(row.payload, null, 2);
      feed.appendChild(li);
    });
  }

  async function refreshAuditDashboard() {
    try {
      const entries = await api.audit.tail(40);
      renderAuditFeed(entries || []);
    } catch (err) {
      const feed = document.getElementById("auditFeed");
      if (feed) feed.innerHTML = `<li style="color:#f44">Audit tail failed: ${err.message}</li>`;
    }
    // Update daemon badge via poll
    try {
      const d = await api.daemon.status();
      const badge = document.getElementById("daemonStatusBadge");
      if (badge) {
        const COLOR = { running: "#4caf50", stopped: "#f44336", restarting: "#ff9800", fatal: "#f44336", "not-started": "#888", "spawn-failed": "#f44" };
        badge.style.background = COLOR[d.status] || "#444";
        badge.style.color = "#fff";
        badge.textContent = `daemon: ${d.status}${d.pid ? ` (pid ${d.pid})` : ""}`;
      }
    } catch { /* non-fatal */ }
  }

  // Live daemon status badge via push events
  if (api.daemon?.onStatus) {
    api.daemon.onStatus((data) => {
      const badge = document.getElementById("daemonStatusBadge");
      if (!badge) return;
      const COLOR = { running: "#4caf50", stopped: "#f44336", restarting: "#ff9800", fatal: "#f44336", "spawn-failed": "#f44" };
      badge.style.background = COLOR[data.status] || "#444";
      badge.style.color = "#fff";
      badge.textContent = `daemon: ${data.status}${data.pid ? ` (pid ${data.pid})` : ""}`;
    });
  }

  // Active Transfers HUD via IPC Phase 9
  if (api.daemon && typeof api.daemon.onTransferProgress === "function") {
    api.daemon.onTransferProgress((data) => {
      const container = document.getElementById("activeTransfersContainer");
      if (!container) return;
      let barContainer = document.getElementById(`tx-hud-${data.id}`);
      if (!barContainer) {
        barContainer = document.createElement("div");
        barContainer.id = `tx-hud-${data.id}`;
        barContainer.style.cssText = "margin-top:6px; font-size:10px; font-family:monospace;";

        const label = document.createElement("div");
        label.id = `tx-hud-label-${data.id}`;
        label.style.opacity = "0.8";
        label.textContent = `TX ${data.id.substring(0, 12)}... [0%]`;

        const track = document.createElement("div");
        track.style.cssText = "width:100%; height:4px; background:#333; border-radius:2px; overflow:hidden; margin-top:2px;";

        const fill = document.createElement("div");
        fill.id = `tx-hud-fill-${data.id}`;
        fill.style.cssText = "height:100%; background:var(--accent); width:0%; transition:width 0.3s ease;";

        track.appendChild(fill);
        barContainer.appendChild(label);
        barContainer.appendChild(track);
        container.appendChild(barContainer);
      }

      const fill = document.getElementById(`tx-hud-fill-${data.id}`);
      const label = document.getElementById(`tx-hud-label-${data.id}`);
      if (fill && label) {
        fill.style.width = `${data.pct}%`;
        label.textContent = `TX ${data.id.substring(0, 12)}... [${data.pct}%]`;
        if (data.pct >= 100) {
          fill.style.background = "#4caf50";
          setTimeout(() => {
            if (barContainer.parentNode) barContainer.parentNode.removeChild(barContainer);
          }, 3500);
        }
      }
    });
  }

  const auditRefreshBtn = document.getElementById("auditRefreshBtn");
  if (auditRefreshBtn) {
    auditRefreshBtn.addEventListener("click", refreshAuditDashboard);
  }

  const auditVerifyBtn = document.getElementById("auditVerifyBtn");
  if (auditVerifyBtn) {
    auditVerifyBtn.addEventListener("click", async () => {
      try {
        const result = await api.audit.verify();
        showBanner(result.ok
          ? `Chain OK — ${result.checked} entries verified.`
          : `Chain BROKEN at entry ${result.index}: ${result.reason}`, result.ok ? "good" : "bad");
      } catch (err) {
        showBanner(`Verify failed: ${err.message}`, "bad");
      }
    });
  }

  // Poll audit log every 10s
  setInterval(refreshAuditDashboard, 10_000);
  void refreshAuditDashboard();

  ui.saveSnapshotBtn.addEventListener("click", async () => {
    const id = `snap-${Date.now()}`;
    const name = `Snapshot ${new Date().toLocaleTimeString()}`;
    const fullState = await api.state.export();
    state.snapshots.unshift({ id, name, payload: fullState });
    state.snapshots = state.snapshots.slice(0, 25);
    saveLocal(SNAPSHOTS_KEY, state.snapshots);
    renderSnapshots();
    showBanner("Snapshot saved", "good");
  });
  ui.loadSnapshotBtn.addEventListener("click", async () => {
    const id = ui.snapshotSelect.value;
    const target = state.snapshots.find((s) => s.id === id);
    if (!target) {
      showBanner("No snapshot selected", "bad");
      return;
    }
    await api.state.import(target.payload);
    await bootstrapFromState();
    showBanner("Snapshot loaded", "good");
  });

  ui.saveTemplateBtn.addEventListener("click", () => {
    const name = ui.templateNameInput.value.trim();
    const body = ui.templateBodyInput.value.trim();
    if (!name || !body) {
      showBanner("Template name/body required", "bad");
      return;
    }
    state.templates.unshift({ id: `tpl-${Date.now()}`, name, body });
    state.templates = state.templates.slice(0, 40);
    saveLocal(TEMPLATES_KEY, state.templates);
    renderTemplates();
    trackCommandHistory(`template.save ${name}`);
    showBanner("Template saved", "good");
  });
  ui.applyTemplateBtn.addEventListener("click", () => {
    const id = ui.templateSelect.value;
    const tpl = state.templates.find((t) => t.id === id);
    if (!tpl) {
      showBanner("No template selected", "bad");
      return;
    }
    ui.promptInput.value = tpl.body;
    ui.promptInput.focus();
    updatePromptMetrics();
    trackCommandHistory(`template.apply ${tpl.name}`);
  });

  ui.fontScaleRange.addEventListener("input", () => {
    setFontScale(ui.fontScaleRange.value);
  });

  ui.autoBackupEnabledInput.addEventListener("change", setupAutoBackup);
  ui.autoBackupIntervalInput.addEventListener("change", setupAutoBackup);

  ui.saveThemeSlot1Btn.addEventListener("click", () => saveThemeSlot("1"));
  ui.applyThemeSlot1Btn.addEventListener("click", () => applyThemeSlot("1"));
  ui.saveThemeSlot2Btn.addEventListener("click", () => saveThemeSlot("2"));
  ui.applyThemeSlot2Btn.addEventListener("click", () => applyThemeSlot("2"));
  ui.saveThemeSlot3Btn.addEventListener("click", () => saveThemeSlot("3"));
  ui.applyThemeSlot3Btn.addEventListener("click", () => applyThemeSlot("3"));

  ui.labsThemeShuffleBtn.addEventListener("click", () => {
    const accent = randomColor();
    const hot = randomColor();
    const bg = randomColor();
    ui.themeAccentInput.value = accent;
    ui.themeHotInput.value = hot;
    ui.themeBgStartInput.value = bg;
    applyThemeStudioVars(accent, hot, bg);
    setLabsStatus(`Theme shuffled: ${accent}, ${hot}, ${bg}`);
  });
  ui.labsPanicResetBtn.addEventListener("click", panicResetUiModes);
  ui.labsToggleAmbientBtn.addEventListener("click", () => {
    state.ambientFxDisabled = !state.ambientFxDisabled;
    document.body.classList.toggle("ambient-off", state.ambientFxDisabled);
    setLabsStatus(state.ambientFxDisabled ? "Ambient FX disabled." : "Ambient FX enabled.");
  });
  ui.labsSnapshotDiffBtn.addEventListener("click", () => {
    const summary = snapshotDiffSummary();
    setLabsStatus(summary);
    showBanner(summary, "info");
  });
  ui.labsExportTemplatesBtn.addEventListener("click", () => {
    downloadText(`templates-${Date.now()}.json`, JSON.stringify(state.templates, null, 2));
    setLabsStatus("Templates exported.");
  });
  ui.labsImportTemplatesBtn.addEventListener("click", () => ui.labsImportTemplatesFile.click());
  ui.labsImportTemplatesFile.addEventListener("change", async (evt) => {
    const file = evt.target.files && evt.target.files[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error("Template file must be an array.");
      state.templates = parsed.filter((x) => x && typeof x.name === "string" && typeof x.body === "string").slice(0, 40);
      saveLocal(TEMPLATES_KEY, state.templates);
      renderTemplates();
      setLabsStatus(`Imported ${state.templates.length} templates.`);
    } catch (err) {
      setLabsStatus(`Template import failed: ${err.message}`);
    }
  });
  ui.labsRestoreBackupBtn.addEventListener("click", async () => {
    const backups = loadLocal("ns5_backups_v1", []);
    if (!Array.isArray(backups) || !backups.length) {
      setLabsStatus("No backup available.");
      return;
    }
    const latest = backups[0];
    await api.state.import(latest.state || {});
    await bootstrapFromState();
    setLabsStatus(`Restored backup from ${latest.at || "unknown time"}.`);
    showBanner("Latest backup restored.", "good");
  });
  ui.labsFocusTimerStartBtn.addEventListener("click", () => startFocusTimer(25));
  ui.labsFocusTimerStopBtn.addEventListener("click", stopFocusTimer);
  ui.labsRandomPromptBtn.addEventListener("click", () => {
    const prompts = [
      "Design a robust rollback plan for this project.",
      "Generate a test matrix for this feature set.",
      "Summarize risks, owners, and mitigations.",
      "Write a concise release checklist.",
      "Refactor this idea into an implementation plan."
    ];
    ui.promptInput.value = prompts[Math.floor(Math.random() * prompts.length)];
    ui.promptInput.focus();
    updatePromptMetrics();
    setLabsStatus("Random prompt injected.");
  });

  ui.stickyNoteInput.addEventListener("input", () => {
    saveLocal(NOTES_KEY, { value: ui.stickyNoteInput.value });
  });

  ui.saveThemePresetBtn.addEventListener("click", () => {
    const preset = {
      accent: ui.themeAccentInput.value,
      hot: ui.themeHotInput.value,
      bgStart: ui.themeBgStartInput.value
    };
    applyThemeStudioVars(preset.accent, preset.hot, preset.bgStart);
    saveLocal(THEME_STUDIO_KEY, preset);
    const ratio = calcContrastRatio(preset.accent, preset.bgStart);
    showBanner(`Theme preset saved (contrast ${ratio.toFixed(2)}:1)`, ratio >= 4.5 ? "good" : "warn");
  });
  ui.resetThemePresetBtn.addEventListener("click", () => {
    applyThemeStudioVars("#34d1bf", "#ff8f3f", "#091321");
    saveLocal(THEME_STUDIO_KEY, null);
    ui.themeAccentInput.value = "#34d1bf";
    ui.themeHotInput.value = "#ff8f3f";
    ui.themeBgStartInput.value = "#091321";
    showBanner("Theme preset reset", "info");
  });
  ui.themeAccentInput.addEventListener("input", () => applyThemeStudioVars(ui.themeAccentInput.value, null, null));
  ui.themeHotInput.addEventListener("input", () => applyThemeStudioVars(null, ui.themeHotInput.value, null));
  ui.themeBgStartInput.addEventListener("input", () => applyThemeStudioVars(null, null, ui.themeBgStartInput.value));

  let draggingDivider = false;
  ui.previewDivider.addEventListener("mousedown", () => {
    if (!state.splitPreview) return;
    draggingDivider = true;
  });
  document.addEventListener("mouseup", () => {
    draggingDivider = false;
  });
  document.addEventListener("mousemove", (evt) => {
    if (!draggingDivider || !state.splitPreview) return;
    const rect = ui.chatSplitPane.getBoundingClientRect();
    const leftPct = Math.min(80, Math.max(30, ((evt.clientX - rect.left) / rect.width) * 100));
    ui.chatHistory.style.width = `${leftPct}%`;
    ui.chatPreviewPane.style.width = `${100 - leftPct}%`;
  });

  ui.refreshModelsBtn.addEventListener("click", () => withBusyButton(ui.refreshModelsBtn, refreshModels));
  ui.modelSelect.addEventListener("change", async () => {
    state.selectedModel = ui.modelSelect.value;
    await api.llm.setModel(state.selectedModel);
    await api.state.set("model", state.selectedModel);
  });

  ui.sendBtn.addEventListener("click", () => withBusyButton(ui.sendBtn, sendPrompt));
  ui.promptInput.addEventListener("input", updatePromptMetrics);
  ui.promptInput.addEventListener("keydown", (evt) => {
    if (evt.key === "Enter" && !evt.shiftKey) {
      evt.preventDefault();
      sendPrompt();
    }
    if (evt.key === "Enter" && evt.ctrlKey) {
      evt.preventDefault();
      sendPrompt();
    }
  });
  ui.stopBtn.addEventListener("click", async () => {
    await api.llm.cancelStream();
    setBusy(false, "Cancelled");
  });
  ui.retryBtn.addEventListener("click", () => {
    if (!state.lastUserPrompt) {
      return;
    }
    ui.promptInput.value = state.lastUserPrompt;
    sendPrompt();
  });
  ui.regenerateBtn.addEventListener("click", () => {
    ui.retryBtn.click();
  });
  ui.editLastBtn.addEventListener("click", () => {
    const lastUser = [...state.chat].reverse().find((m) => m.role === "user");
    if (lastUser) {
      ui.promptInput.value = lastUser.content;
      updatePromptMetrics();
    }
  });

  ui.newChatBtn.addEventListener("click", async () => {
    state.chat = [];
    renderChat();
    await persistChatState();
    trackUndoTrail("new chat");
    showBanner("New chat started", "good");
  });
  ui.deleteLastExchangeBtn.addEventListener("click", async () => {
    for (let i = state.chat.length - 1; i >= 0; i -= 1) {
      if (state.chat[i].role === "assistant") {
        state.chat.splice(i, 1);
        break;
      }
    }
    for (let i = state.chat.length - 1; i >= 0; i -= 1) {
      if (state.chat[i].role === "user") {
        state.chat.splice(i, 1);
        break;
      }
    }
    renderChat();
    await persistChatState();
    trackUndoTrail("delete last exchange");
  });
  undoBtn.addEventListener("click", async () => {
    state.chat.pop();
    renderChat();
    await persistChatState();
    trackUndoTrail("undo one message");
  });

  ui.chatSearchBtn.addEventListener("click", () => {
    const query = ui.chatSearchInput.value.trim().toLowerCase();
    if (!query) {
      renderChat();
      return;
    }
    renderChat(state.chat.filter((m) => m.content.toLowerCase().includes(query)));
  });
  ui.chatSearchClearBtn.addEventListener("click", () => {
    ui.chatSearchInput.value = "";
    renderChat();
  });

  ui.insertSnippetBtn.addEventListener("click", () => {
    const snippet = ui.snippetSelect.value;
    if (snippet) {
      ui.promptInput.value = `${ui.promptInput.value}${ui.promptInput.value ? "\n" : ""}${snippet}`;
      updatePromptMetrics();
    }
  });

  ui.copyLastAssistantBtn.addEventListener("click", async () => {
    const last = [...state.chat].reverse().find((m) => m.role === "assistant");
    if (!last) {
      return;
    }
    const ok = await copyText(last.content);
    showBanner(ok ? "Last assistant reply copied" : "Copy unavailable in this environment", ok ? "good" : "bad");
  });
  ui.copyMarkdownBtn.addEventListener("click", async () => {
    const ok = await copyText(asMarkdown(state.chat));
    showBanner(ok ? "Markdown copied" : "Copy unavailable in this environment", ok ? "good" : "bad");
  });
  ui.exportMarkdownBtn.addEventListener("click", () => {
    downloadText(`chat-${Date.now()}.md`, asMarkdown(state.chat));
  });
  ui.exportChatBtn.addEventListener("click", () => {
    downloadText(`chat-${Date.now()}.json`, JSON.stringify(state.chat, null, 2));
  });
  ui.importChatBtn.addEventListener("click", () => ui.importChatFile.click());
  ui.importChatFile.addEventListener("change", async (evt) => {
    const file = evt.target.files && evt.target.files[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    try {
      const payload = JSON.parse(text);
      state.chat = Array.isArray(payload) ? payload : payload.chat || [];
      renderChat();
      await persistChatState();
      showBanner("Chat imported", "good");
    } catch (err) {
      const lowerName = String(file.name || "").toLowerCase();
      if (lowerName.endsWith(".md") || lowerName.endsWith(".txt")) {
        state.chat = [toMessage("user", text)];
        renderChat();
        await persistChatState();
        showBanner("Text chat imported", "good");
        return;
      }
      showBanner(`Import failed: ${err.message}`, "bad");
    }
  });

  ui.saveSessionBtn.addEventListener("click", async () => {
    const name = ui.sessionName.value.trim();
    const pass = ui.sessionPass.value.trim();
    await api.session.save(name, getSessionPayload(), pass);
    await refreshSessions();
    trackCommandHistory(`session.save ${name}`);
    showBanner(`Saved session: ${name}`, "good");
  });
  ui.loadSessionBtn.addEventListener("click", async () => {
    const name = ui.sessionName.value.trim();
    const pass = ui.sessionPass.value.trim();
    const payload = await api.session.load(name, pass);
    state.chat = Array.isArray(payload.chat) ? payload.chat : [];
    state.selectedModel = payload.model || state.selectedModel;
    await api.llm.setModel(state.selectedModel);
    await api.state.set("model", state.selectedModel);
    await persistChatState();
    renderChat();
    await refreshModels();
    trackCommandHistory(`session.load ${name}`);
    showBanner(`Loaded session: ${name}`, "good");
  });
  ui.renameSessionBtn.addEventListener("click", async () => {
    const from = state.selectedSession || ui.sessionName.value.trim();
    const to = prompt("New session name:", from || "");
    if (!to) {
      return;
    }
    await api.session.rename(from, to);
    ui.sessionName.value = to;
    state.selectedSession = to;
    await refreshSessions();
    trackCommandHistory(`session.rename ${from}->${to}`);
  });
  ui.deleteSessionBtn.addEventListener("click", async () => {
    const name = state.selectedSession || ui.sessionName.value.trim();
    if (!name) {
      return;
    }
    await api.session.delete(name);
    if (state.selectedSession === name) {
      state.selectedSession = "";
      ui.sessionName.value = "";
    }
    await refreshSessions();
    trackCommandHistory(`session.delete ${name}`);
  });
  ui.duplicateSessionBtn.addEventListener("click", async () => {
    const source = state.selectedSession || ui.sessionName.value.trim();
    if (!source) {
      showBanner("Select a session to duplicate", "bad");
      return;
    }
    const target = `${source}-copy`;
    const pass = ui.sessionPass.value.trim();
    const payload = await api.session.load(source, pass);
    await api.session.save(target, payload, pass);
    await refreshSessions();
    trackCommandHistory(`session.duplicate ${source}->${target}`);
  });
  ui.sessionSearchInput.addEventListener("input", refreshSessions);
  ui.sessionSortSelect.addEventListener("change", refreshSessions);

  ui.applySettingsBtn.addEventListener("click", () => withBusyButton(ui.applySettingsBtn, async () => {
    const next = getSettingsFromUI();
    const localProblems = validateSettingsLocally(next);
    if (localProblems.length) {
      showBanner("Fix settings before applying", "bad");
      return;
    }
    const saved = await api.settings.update(next);
    await api.bridge.save({
      profiles: state.bridgeProfiles,
      activeProfileId: state.activeBridgeProfileId,
      connectOnStartup: Boolean(ui.connectOnStartupInput.checked),
      allowRemoteBridge: Boolean(ui.allowRemoteBridgeInput.checked)
    });
    applyTheme(saved.theme || next.theme);
    setupAutosave();
    await syncRgbMood(state.isBusy ? "focused" : "idle");
    if (ui.rgbStatusOutput) {
      try {
        ui.rgbStatusOutput.textContent = JSON.stringify(await api.rgb.status(), null, 2);
      } catch {
        ui.rgbStatusOutput.textContent = "RGB status unavailable.";
      }
    }
    appendAuditEvent({
      source: "renderer.settings",
      status: "applied",
      personality: getPersonalityProfile(),
      safetyPolicy: next.safetyPolicy,
      rgbEnabled: Boolean(next.rgbEnabled)
    });
    trackCommandHistory("settings.apply");
    showBanner("Settings applied", "good");
  }));
  ui.repairIndexBtn.addEventListener("click", () => withBusyButton(ui.repairIndexBtn, async () => {
    const result = await api.session.repairIndex();
    ui.sessionMetadataOutput.textContent = JSON.stringify(result || {}, null, 2);
  }));
  ui.exportStateBtn.addEventListener("click", async () => {
    const fullState = await api.state.export();
    downloadText(`state-${Date.now()}.json`, JSON.stringify(fullState, null, 2));
  });
  ui.importStateBtn.addEventListener("click", () => ui.importStateFile.click());
  ui.importStateFile.addEventListener("change", async (evt) => {
    const file = evt.target.files && evt.target.files[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await api.state.import(payload);
      await bootstrapFromState();
      showBanner("State imported", "good");
    } catch (err) {
      showBanner(`State import failed: ${err.message}`, "bad");
    }
  });

  ui.refreshCommandsBtn.addEventListener("click", () => withBusyButton(ui.refreshCommandsBtn, refreshCommands));
  ui.shortcutHelpBtn.addEventListener("click", openShortcutOverlay);
  ui.shortcutCloseBtn.addEventListener("click", closeShortcutOverlay);
  ui.shortcutOverlay.addEventListener("click", (evt) => {
    if (evt.target === ui.shortcutOverlay) {
      closeShortcutOverlay();
    }
  });
  commandHelpBtn.addEventListener("click", () => {
    showBanner("Use /command [args] from plugin list.", "info");
  });
  ui.runSelfTestBtn.addEventListener("click", async () => {
    try {
      const result = await api.command.run("selftest", []);
      setStatus("Self-test", JSON.stringify(result));
      trackCommandHistory("command.selftest");
    } catch (err) {
      setStatus("Self-test failed", err.message);
    }
  });
  ui.runButtonAuditBtn.addEventListener("click", runButtonAudit);

  ui.loadLogsBtn.addEventListener("click", () => withBusyButton(ui.loadLogsBtn, loadLogs));
  ui.clearLogsBtn.addEventListener("click", async () => {
    await api.logger.clear();
    ui.logsOutput.textContent = "";
  });
  ui.exportLogsBtn.addEventListener("click", async () => {
    const text = await api.logger.export();
    downloadText(`app-logs-${Date.now()}.log`, text);
  });

  ui.loadChatLogsBtn.addEventListener("click", () => withBusyButton(ui.loadChatLogsBtn, loadChatLogs));
  ui.clearChatLogsBtn.addEventListener("click", async () => {
    await api.chatlog.clear();
    ui.chatLogsOutput.textContent = "";
  });
  ui.exportChatLogsBtn.addEventListener("click", async () => {
    const text = await api.chatlog.export();
    downloadText(`chat-logs-${Date.now()}.log`, text);
  });

  api.on("llm-status-change", (status) => {
    setStatus(String(status || "unknown"), "");
    const normalized = String(status || "").toLowerCase();
    const mood = normalized.includes("online") || normalized.includes("ready")
      ? "focused"
      : normalized.includes("reconnect")
        ? "caution"
        : normalized.includes("offline") || normalized.includes("error")
          ? "critical"
          : "idle";
    syncRgbMood(mood).catch(() => { });
  });
}

async function bootstrapFromState() {
  const fullState = await api.state.get();
  const settings = (fullState && fullState.settings) || {};
  state.chat = Array.isArray(fullState.chat) ? fullState.chat : [];
  state.selectedModel = fullState.model || "llama3";

  ui.baseUrlInput.value = settings.ollamaBaseUrl || "http://127.0.0.1:11434";
  ui.timeoutInput.value = String(settings.timeoutMs || 15000);
  ui.retryInput.value = String(settings.retryCount || 2);
  ui.tokenBudgetInput.value = String(settings.tokenBudget || 0);
  ui.personalityProfileSelect.value = settings.personalityProfile || "balanced";
  ui.safetyPolicySelect.value = settings.safetyPolicy || "balanced";
  ui.clockEnabledInput.checked = settings.clockEnabled !== false;
  ui.clock24hInput.checked = Boolean(settings.clock24h);
  ui.clockUtcOffsetInput.value = settings.clockUtcOffset || "local";
  ui.rgbEnabledInput.checked = Boolean(settings.rgbEnabled);
  ui.rgbProviderSelect.value = settings.rgbProvider || "none";
  ui.rgbHostInput.value = settings.rgbHost || "127.0.0.1";
  ui.rgbPortInput.value = String(settings.rgbPort || 6742);
  ui.rgbTargetsInput.value = Array.isArray(settings.rgbTargets) ? settings.rgbTargets.join(", ") : "";
  ui.autosaveEnabledInput.checked = Boolean(settings.autosaveEnabled);
  ui.autosaveIntervalInput.value = String(settings.autosaveIntervalMin || 5);
  ui.autosaveNameInput.value = settings.autosaveName || "autosave";
  const bridgeInfo = normalizeProfilesFromSettings(settings);
  state.bridgeProfiles = bridgeInfo.profiles;
  state.activeBridgeProfileId = bridgeInfo.activeProfileId;
  ui.connectOnStartupInput.checked = Boolean(bridgeInfo.connectOnStartup);
  ui.allowRemoteBridgeInput.checked = Boolean(settings.allowRemoteBridge);
  renderBridgeProfiles();
  const active = getActiveBridgeProfile();
  if (active) {
    ui.bridgeProfileNameInput.value = active.name;
    ui.baseUrlInput.value = active.baseUrl;
    ui.timeoutInput.value = String(active.timeoutMs || settings.timeoutMs || 15000);
    ui.retryInput.value = String(active.retryCount || settings.retryCount || 2);
  }
  applyTheme(settings.theme || "dark");

  const savedNotes = loadLocal(NOTES_KEY, { value: "" });
  ui.stickyNoteInput.value = savedNotes && typeof savedNotes.value === "string" ? savedNotes.value : "";

  const savedBookmarks = loadLocal(BOOKMARKS_KEY, []);
  state.pinnedMessages = Array.isArray(savedBookmarks) ? savedBookmarks : [];
  renderBookmarks();

  state.snapshots = Array.isArray(loadLocal(SNAPSHOTS_KEY, [])) ? loadLocal(SNAPSHOTS_KEY, []) : [];
  renderSnapshots();
  state.templates = Array.isArray(loadLocal(TEMPLATES_KEY, [])) ? loadLocal(TEMPLATES_KEY, []) : [];
  renderTemplates();
  state.commandHistory = Array.isArray(loadLocal(HISTORY_KEY, [])) ? loadLocal(HISTORY_KEY, []) : [];
  renderCommandHistory();
  state.promptQueue = Array.isArray(loadLocal(QUEUE_KEY, [])) ? loadLocal(QUEUE_KEY, []) : [];
  state.undoTrail = Array.isArray(loadLocal(UNDO_TRAIL_KEY, [])) ? loadLocal(UNDO_TRAIL_KEY, []) : [];
  renderUndoTrail();
  state.autonomousRunLog = Array.isArray(loadLocal(AUTONOMY_LOG_KEY, [])) ? loadLocal(AUTONOMY_LOG_KEY, []) : [];
  state.autonomousLastCheckpoint = loadLocal(AUTONOMY_CHECKPOINT_KEY, null);
  const multiCfg = loadLocal(AUTONOMY_MULTI_CFG_KEY, { enabled: false, approval: "auto" });
  if (ui.multiAgentEnabledInput) {
    ui.multiAgentEnabledInput.checked = Boolean(multiCfg && multiCfg.enabled);
  }
  if (ui.multiAgentApprovalSelect) {
    ui.multiAgentApprovalSelect.value = multiCfg && multiCfg.approval === "manual" ? "manual" : "auto";
  }
  renderAutonomousRunLog();
  renderAutonomousCheckpoint();
  if (state.autonomousLastCheckpoint && typeof state.autonomousLastCheckpoint === "object") {
    if (state.autonomousLastCheckpoint.goal) {
      ui.autonomousGoalInput.value = String(state.autonomousLastCheckpoint.goal);
    }
    if (state.autonomousLastCheckpoint.intervalSec) {
      ui.autonomousIntervalInput.value = String(state.autonomousLastCheckpoint.intervalSec);
    }
    if (state.autonomousLastCheckpoint.maxSteps) {
      ui.autonomousMaxStepsInput.value = String(state.autonomousLastCheckpoint.maxSteps);
    }
  }
  renderAutonomousPlan();
  setMultiAgentStatus(ui.multiAgentEnabledInput && ui.multiAgentEnabledInput.checked ? "Multi-agent ready." : "Multi-agent disabled.");
  try {
    const rgbStatus = await api.rgb.status();
    if (ui.rgbStatusOutput) {
      ui.rgbStatusOutput.textContent = JSON.stringify(rgbStatus || {}, null, 2);
    }
  } catch {
    if (ui.rgbStatusOutput) {
      ui.rgbStatusOutput.textContent = "RGB status unavailable.";
    }
  }
  try {
    const audit = await api.audit.verify();
    if (ui.auditOutput) {
      ui.auditOutput.textContent = JSON.stringify(audit || {}, null, 2);
    }
  } catch {
    if (ui.auditOutput) {
      ui.auditOutput.textContent = "Audit verify unavailable.";
    }
  }

  const themePreset = loadLocal(THEME_STUDIO_KEY, null);
  if (themePreset && typeof themePreset === "object") {
    applyThemeStudioVars(themePreset.accent, themePreset.hot, themePreset.bgStart);
    if (themePreset.accent) ui.themeAccentInput.value = themePreset.accent;
    if (themePreset.hot) ui.themeHotInput.value = themePreset.hot;
    if (themePreset.bgStart) ui.themeBgStartInput.value = themePreset.bgStart;
  }

  const fontScale = Number(loadLocal(FONT_SCALE_KEY, 100)) || 100;
  setFontScale(fontScale);
  const backupCfg = loadLocal(BACKUP_KEY, { enabled: false, minutes: 5 });
  ui.autoBackupEnabledInput.checked = Boolean(backupCfg && backupCfg.enabled);
  ui.autoBackupIntervalInput.value = String((backupCfg && backupCfg.minutes) || 5);
  setupAutoBackup();

  renderChat();
  updatePromptMetrics();
  renderCommandChips();
  updateTimeline();
  setupAutosave();

  if (!state.bridgeProfiles.length || !/^https?:\/\//i.test(String(ui.baseUrlInput.value || ""))) {
    openSetupWizard();
  }
}

async function init() {
  setLoadStatus("Connecting to secure bridge...");
  if (!api) {
    setStatus("Error", "window.api is not available");
    return;
  }
  setLoadStatus("Binding interactive controls...");
  bindUi();
  setLoadStatus("Loading saved state...");
  await bootstrapFromState();
  setLoadStatus("Loading bridge profiles...");
  try {
    const bridge = await api.bridge.get();
    if (bridge && Array.isArray(bridge.profiles) && bridge.profiles.length) {
      state.bridgeProfiles = bridge.profiles;
      state.activeBridgeProfileId = bridge.activeProfileId || bridge.profiles[0].id;
      ui.connectOnStartupInput.checked = bridge.connectOnStartup !== false;
      ui.allowRemoteBridgeInput.checked = Boolean(bridge.allowRemoteBridge);
      renderBridgeProfiles();
    }
  } catch {
    // keep local state fallback
  }
  setLoadStatus("Refreshing models...");
  await refreshModels();
  setLoadStatus("Refreshing sessions...");
  await refreshSessions();
  setLoadStatus("Loading command menu...");
  await refreshCommands();
  setLoadStatus("Loading logs...");
  await loadLogs();
  await loadChatLogs();
  setLoadStatus("Starting monitors...");
  await refreshSystemStats();
  runOnboarding();
  wireGlobalShortcuts();
  wireNewFeatures();
  await updateXPStatus();
  await refreshRituals();
  setInterval(refreshSystemStats, 5000);
  hideLoadScreen();
}

function runOnboarding() {
  try {
    if (localStorage.getItem(ONBOARD_FLAG)) {
      return;
    }
    showBanner("Welcome to NeuralShell. Press Ctrl+Enter to send quickly.", "info");
    ui.promptInput.placeholder = "Ask for analysis, drafting, coding, debugging, or architecture planning...";
    localStorage.setItem(ONBOARD_FLAG, "1");
  } catch {
    // Ignore localStorage restrictions.
  }
}

function wireGlobalShortcuts() {
  document.addEventListener("keydown", (evt) => {
    const target = evt.target;
    const inInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");

    if (evt.key === "/" && !inInput) {
      evt.preventDefault();
      ui.chatSearchInput.focus();
      return;
    }

    if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "k") {
      evt.preventDefault();
      ui.promptInput.focus();
    }

    if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "p") {
      evt.preventDefault();
      openCommandPalette();
    }

    if (evt.key === "Escape") {
      closeShortcutOverlay();
      closeCommandPalette();
    }

    if (evt.key === "?" || (evt.shiftKey && evt.key === "/")) {
      if (!inInput) {
        evt.preventDefault();
        openShortcutOverlay();
      }
    }
  });
}

function openShortcutOverlay() {
  lastFocusedBeforeOverlay = document.activeElement;
  ui.shortcutOverlay.hidden = false;
  ui.shortcutOverlay.setAttribute("aria-hidden", "false");
  ui.shortcutCloseBtn.focus();
}
async function updateXPStatus() {
  const status = await api.xp.status();
  state.xp = status.xp;
  state.tier = status.tier;
  ui.tierBadges.forEach(badge => {
    badge.classList.toggle('is-active', badge.dataset.tier == state.tier);
  });
  if (ui.xpSpan) ui.xpSpan.textContent = `XP: ${state.xp}`;
}

async function refreshRituals() {
  const rituals = await api.ritual.list();
  ui.ritualSelect.innerHTML = rituals.map(r => `<option value="${r.id}">${r.name} (+${r.xpAward} XP)</option>`).join('');
  const scheduled = await api.ritual.getScheduled();
  ui.scheduledRitualList.innerHTML = scheduled.map(s => `<li>${s.ritualId} @ ${new Date(s.timestamp).toLocaleTimeString()}</li>`).join('');
}

async function refreshHistoryFiles() {
  ui.historyFileList.innerHTML = state.historyFiles.map((f, i) => `<li>${f.name} <button onclick="removeHistoryFile(${i})">x</button></li>`).join('');
}

window.removeHistoryFile = (index) => {
  state.historyFiles.splice(index, 1);
  refreshHistoryFiles();
};

function startAutopilot() {
  if (state.autopilotInterval) clearInterval(state.autopilotInterval);
  state.autopilotInterval = setInterval(async () => {
    if (state.isBusy) return;
    const prompts = [
      "Analyze the current system state.",
      "Are there any anomalies in the audit log?",
      "Summarize our progress so far.",
      "Check LLM health and connection stability.",
      "Perform a quick self-test."
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    ui.promptInput.value = randomPrompt;
    await sendPrompt();
  }, 30000);
}

function stopAutopilot() {
  if (state.autopilotInterval) {
    clearInterval(state.autopilotInterval);
    state.autopilotInterval = null;
  }
}

function wireNewFeatures() {
  // XP & Tiers
  api.xp.onUpdate((data) => {
    if (data.leveledUp) {
      showBanner(`LEVEL UP! You are now ${data.tier}.`, 'good');
    }
    updateXPStatus();
  });

  // Rituals
  ui.ritualTriggerBtn.addEventListener('click', async () => {
    const id = ui.ritualSelect.value;
    const res = await api.ritual.execute(id);
    if (res.success) {
      showBanner(`Ritual executed: ${res.ritual}`, 'good');
    }
  });

  ui.ritualScheduleBtn.addEventListener('click', async () => {
    const id = ui.ritualSelect.value;
    const time = new Date(ui.ritualScheduleTime.value).getTime();
    const res = await api.ritual.schedule(id, time);
    if (res.success) {
      showBanner('Ritual scheduled', 'info');
      refreshRituals();
    }
  });

  api.on('ritual-triggered', (res) => {
    showBanner(`Scheduled Ritual Triggered: ${res.ritual}`, 'good');
    refreshRituals();
  });

  // Vault
  ui.vaultUnlockBtn.addEventListener('click', async () => {
    const pass = ui.vaultPass.value;
    const res = await api.vault.unlock(pass);
    if (res) showBanner('Vault Unlocked', 'good');
  });

  ui.vaultLockBtn.addEventListener('click', async () => {
    await api.vault.lock();
    showBanner('Vault Locked', 'warn');
  });

  ui.vaultCompactBtn.addEventListener('click', async () => {
    const data = { chat: state.chat, xp: state.xp, tier: state.tier };
    const path = await api.vault.compact(data, 'neurovault');
    showBanner(`Vault compacted: ${path}`, 'good');
  });

  ui.vaultTearBtn.addEventListener('click', async () => {
    const data = { chat: state.chat, xp: state.xp, tier: state.tier };
    const path = await api.vault.compact(data, 'tear');
    showBanner(`Vault encrypted: ${path}`, 'good');
  });

  // History
  ui.selectHistoryBtn.addEventListener('click', () => ui.historyFileInput.click());
  ui.historyFileInput.addEventListener('change', (evt) => {
    state.historyFiles = Array.from(evt.target.files);
    refreshHistoryFiles();
  });

  ui.injectHistoryBtn.addEventListener('click', async () => {
    if (!state.historyFiles.length) return;
    for (const file of state.historyFiles) {
      const res = await api.history.parse(file.path);
      if (res.success) {
        const formatted = await api.history.format(res.logs);
        ui.promptInput.value += `\n\n[Injected History from ${file.name}]:\n${formatted}`;
      }
    }
    updatePromptMetrics();
    showBanner('History injected into prompt', 'info');
  });

  // FX & Toggles
  ui.nightVisionToggle.addEventListener('change', () => {
    document.body.classList.toggle('night-vision', ui.nightVisionToggle.checked);
  });

  ui.autopilotToggle.addEventListener('change', () => {
    if (ui.autopilotToggle.checked) startAutopilot();
    else stopAutopilot();
  });

  ui.detectLLMBtn.addEventListener('click', async () => {
    const res = await api.llm.autoDetect();
    if (res.success) {
      showBanner(`Ollama detected at ${res.url}`, 'good');
      ui.baseUrlInput.value = res.url;
    } else {
      showBanner('Ollama not detected locally', 'bad');
    }
  });

  ui.personalityProfileSelect.addEventListener('change', async () => {
    const persona = ui.personalityProfileSelect.value;
    if (['override', 'god'].includes(persona)) {
      await api.llm.setPersona(persona);
      showBanner(`Persona set to ${persona}`, 'warn');
    }
  });

  // Empire Control Plane
  if (ui.scanEmpireBtn) {
    ui.scanEmpireBtn.addEventListener('click', async () => {
      ui.scanEmpireBtn.disabled = true;
      ui.scanEmpireBtn.textContent = 'Scanning Workspace...';
      ui.empireStatusList.innerHTML = '<span style="color: var(--muted)">Initializing OMEGA AST Scanners...</span>';
      
      try {
        const results = await api.empire.scan();
        if (!results || results.length === 0) {
          ui.empireStatusList.innerHTML = '<span style="color: var(--warn)">No empire modules detected in workspace.</span>';
        } else {
          ui.empireStatusList.innerHTML = results.map(r => {
            const color = r.compliant ? 'var(--good)' : 'var(--bad)';
            const statusText = r.compliant ? 'OMEGA COMPLIANT' : 'UNTRUSTED';
            const capStr = r.capabilities.length ? r.capabilities.join(', ') : 'None';
            const violationsHTML = r.violations.length 
              ? `<div style="color: var(--bad); margin-top: 4px;">Violations: ${r.violations.length}</div>` 
              : '';

            return `
              <div style="border: 1px solid ${color}; padding: 6px; margin-bottom: 6px; border-radius: 4px; background: rgba(0,0,0,0.5);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: var(--text)">${r.module}</strong>
                  <span style="color: ${color}; font-weight: bold;">[${statusText}]</span>
                </div>
                <div style="color: var(--muted); margin-top: 4px;">Caps: ${capStr}</div>
                ${violationsHTML}
              </div>
            `;
          }).join('');
        }
        showBanner('Empire scan complete.', 'info');
      } catch (err) {
        ui.empireStatusList.innerHTML = `<span style="color: var(--bad)">Scan Failed: ${err.message}</span>`;
      } finally {
        ui.scanEmpireBtn.disabled = false;
        ui.scanEmpireBtn.textContent = 'Scan Workspace';
      }
    });
  }
}

function closeShortcutOverlay() {
  ui.shortcutOverlay.hidden = true;
  ui.shortcutOverlay.setAttribute("aria-hidden", "true");
  if (lastFocusedBeforeOverlay && typeof lastFocusedBeforeOverlay.focus === "function") {
    lastFocusedBeforeOverlay.focus();
  }
}

init().catch((err) => {
  setStatus("Init failed", err.message);
  setLoadStatus(`Init failed: ${err.message}`);
  hideLoadScreen();
});
