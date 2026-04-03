const IDS = [
  "statusLabel", "statusMeta", "typingIndicator",
  "settingsMenuOpenBtn", "bridgeAutoDetectBtn",
  "heroWorkflowBadge", "heroProviderBadge", "heroWorkflowSummaryText", "heroFocusSummaryText", "activeSessionNameHeader",
  "globalBridgeStatusText", "globalWorkspaceStatusText", "globalNextActionText", "globalProviderStatusText",
  "toggleRightPaneBtn", "resetPaneLayoutBtn", "focusInboxBtn", "focusSystemBtn",
  "workspaceTopology", "leftPaneResizeHandle", "rightPaneResizeHandle",
  "modelSummary", "sessionSummary", "commandSummary", "tokenSummary",
  "offlineModeInput", "offlineModeSummaryText",
  "inboxGroupStatusText", "inboxFocusText", "inboxFilterSummaryText", "inboxSearchInput", "inboxFilterAllBtn", "inboxFilterPinnedBtn", "inboxFilterUnreadBtn",
  "workflowQuickActions", "workflowTitleText", "workflowDescriptionText", "workflowFollowupActions",
  "threadTaskFocusText", "threadTaskCapabilityText", "threadTaskActionText",
  "actionBarStatusText", "composerSummaryText", "composerMetaText",
  "workbenchArtifactBtn", "workbenchPatchBtn", "workbenchApplyBtn",
  "workbenchArtifactStateText", "workbenchArtifactSummaryText",
  "workbenchPatchStateText", "workbenchPatchSummaryText",
  "workbenchApplyStateText", "workbenchApplySummaryText",
  "workbenchArtifactSection", "workbenchPatchSection", "workbenchApplySection",
  "systemSummaryText", "systemWorkbenchBtn", "systemPerformanceBtn", "systemShippingBtn", "systemContextBtn",
  "systemWorkbenchStateText", "systemWorkbenchSummaryText",
  "systemPerformanceStateText", "systemPerformanceSummaryText",
  "systemShippingStateText", "systemShippingSummaryText",
  "systemContextStateText", "systemContextSummaryText",
  "systemWorkbenchSection", "systemPerformanceSection", "systemShippingSection", "systemContextSection",
  "operatorMemorySummaryText", "operatorMemoryDraftText", "restoreDraftBtn", "clearDraftBtn", "recentPromptList", "recentWorkspaceList",
  "operatorRail",
  "missionControlGrid",
  "outputModeSelect", "workflowSeedPromptBtn",
  "modelSelect", "refreshModelsBtn",
  "chatHistory", "promptInput", "promptMetrics", "tokensUsed",
  "threadRailSummaryText", "sessionChatHeadRail",
  "threadToolsTrayBtn", "assistToolsTrayBtn", "archiveToolsTrayBtn",
  "threadToolsTray", "assistToolsTray", "archiveToolsTray",
  "artifactTitleText", "artifactMetaText", "artifactPreview", "artifactHistoryList", "clearArtifactHistoryBtn",
  "artifactCompareMetaText", "artifactCompareDiffList", "artifactCompareLeftTitle", "artifactCompareLeftMeta", "artifactCompareLeftPreview",
  "artifactCompareRightTitle", "artifactCompareRightMeta", "artifactCompareRightPreview", "clearArtifactCompareBtn",
  "copyArtifactBtn", "exportArtifactMarkdownBtn", "exportArtifactJsonBtn", "saveArtifactSessionBtn", "exportEvidenceBundleBtn",
  "patchPlanTitleText", "patchPlanMetaText", "patchPlanSummaryText", "patchPlanProvenanceText", "patchPlanVerification", "patchPlanShortcutList",
  "loadArtifactPatchPlanBtn", "previewPatchPlanBtn", "applySelectedPatchPlanBtn", "applyAllPatchPlanBtn",
  "exportPatchPlanJsonBtn", "exportPatchPlanMarkdownBtn", "savePatchPlanSessionBtn", "patchPlanFileList", "patchPlanPreview",
  "verificationRunTitleText", "verificationRunMetaText", "verificationRunList", "verificationRunOutput",
  "runVerificationPlanBtn", "copyVerificationCommandsBtn", "clearVerificationPlanBtn",
  "verificationRunHistoryWorkflowFilter", "verificationRunHistoryGroupFilter", "verificationRunHistoryWorkspaceFilter", "resetVerificationRunHistoryFiltersBtn",
  "verificationRunHistoryMetaText", "verificationRunHistoryList", "clearVerificationRunHistoryBtn",
  "shippingCockpitTitleText", "shippingCockpitSummaryText", "shippingCockpitMetaRow", "shippingCockpitChecklist", "shippingCockpitBlockerList", "shippingCockpitStatusList",
  "stageShippingCockpitBtn", "runShippingCockpitBtn", "buildShippingPacketBtn", "exportShippingEvidenceBtn", "openShippingPaletteBtn",
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
  "settingsModelSelect", "settingsProviderSummaryText", "settingsConnectionModeText", "refreshSettingsModelsBtn", "settingsDetectBridgeBtn", "providerPresetList", "importEnvProfilesBtn", "runProviderSweepBtn", "providerSweepSummaryText", "providerSweepList", "envProfileSummaryText", "settingsQuickstartList",
  "baseUrlInput", "timeoutInput", "retryInput", "themeSelect", "tokenBudgetInput",
  "autosaveNameInput", "autosaveIntervalInput", "autosaveEnabledInput", "applySettingsBtn",
  "runSelfTestBtn", "runButtonAuditBtn", "buttonAuditOutput",
  "performanceDiagnosticsTrayBtn", "performanceTraceTrayBtn", "performanceOutputTrayBtn",
  "performanceDiagnosticsTray", "performanceTraceTray", "performanceOutputTray",
  "performanceAuditOutputBtn", "performanceLogsOutputBtn", "performanceChatLogsOutputBtn",
  "performanceAuditOutputPanel", "performanceLogsOutputPanel", "performanceChatLogsOutputPanel",
  "intelligencePanel", "intelFocusText", "intelCapabilityText", "intelNextActionText", "intelActionHints",
  "intelBriefTrayBtn", "intelKnowledgeTrayBtn", "intelCapabilityTrayBtn",
  "intelBriefTray", "intelKnowledgeTray", "intelCapabilityTray",
  "snippetSelect", "insertSnippetBtn",
  "shortcutHelpBtn", "shortcutOverlay", "shortcutCloseBtn", "undoBtn", "commandHelpBtn",
  "commandPaletteOpenBtn", "commandPaletteOverlay", "commandPaletteCloseBtn", "commandPaletteInput", "commandPaletteShortcutScope", "commandPaletteList",
  "onboardingOverlay", "onboardingStepHome", "onboardingStepProvider", "onboardingStepEndpoint", "onboardingStepModel", "onboardingStepVerify", "onboardingStepSummary", "onboardingStepOffline",
  "onboardingRecoveryGroup", "onboardingRecoverySecretInput",
  "onboardingBackBtn", "onboardingNextBtn", "onboardingStartBtn", "onboardingSkipBtn",
  "onboardingSavedProfilesList", "onboardingModelStatus",
  "onboardingOfflineBanner",
  "onboardingProviderSelect", "onboardingBaseUrlInput", "onboardingApiKeyInput", "onboardingApiKeyField", "onboardingTestResult",
  "onboardingModelSelect",
  "onboardingResetBtn", "verifyValProvider", "verifyValEndpoint", "verifyValSecret",
  "summaryProvider", "summaryModel", "summaryTrust",
  "profileSelect", "profileNameInput", "profileBaseUrlInput", "profileProviderSelect", "profileTimeoutInput", "profileRetryInput", "profileDefaultModelSelect", "profileApiKeyInput", "profileProviderHintText", "profileTestResultText", "profileTestHintText",
  "profileNewBtn", "profileTestBtn", "profileSaveBtn", "profileDeleteBtn", "profileUseBtn",
  "criticalStopBtn", "settingsMenuPanel", "settingsMenuCloseBtn", "settingsMenuBackdrop", "bridgeStatusText", "workspaceModeText",
  "intelModeText", "intelBridgeText", "intelSessionText",
  "attachWorkspaceBtn", "clearWorkspaceBtn", "workspaceSummaryText", "knowledgeFeed", "capabilityGraph",
  "contextPackProfileSelect", "saveContextPackProfileBtn", "loadContextPackProfileBtn", "refreshContextPackProfileBtn", "deleteContextPackProfileBtn",
  "contextPackNameInput", "contextPackPathsInput", "suggestContextPackFilesBtn", "buildContextPackBtn", "clearContextPackBtn", "contextPackProfileStatusText", "contextPackWorkflowLinkText", "loadRecommendedContextPackProfileBtn", "contextPackSummaryText", "contextPackPreview",
  "connectOnStartupInput", "allowRemoteBridgeInput", "autoLoadRecommendedContextProfileInput", "bridgeHealthBtn",
  "exportChatBtn", "exportMarkdownBtn", "copyMarkdownBtn", "copyLastAssistantBtn", "importChatBtn", "importChatFile",
  "exportStateBtn", "importStateBtn", "importStateFile",
  "loadLogsBtn", "clearLogsBtn", "exportLogsBtn", "logsOutput",
  "loadChatLogsBtn", "clearChatLogsBtn", "exportChatLogsBtn", "chatLogsOutput",
  "cpuUsage", "memoryUsage", "platformInfo", "clockTime",
  "trustReportOverlay", "trustReportContent", "trustReportCloseBtn",
  "trustReportExportJsonBtn", "trustReportExportMdBtn",
  "onboardingRecoverySubmitBtn", "onboardingRecoveryCancelBtn", "onboardingRecoveryClearBtn",
  "tierBadge", "discordSupportBtn",
  "apbProfileName", "apbProvider", "apbModel", "apbTrustBadge",
  "apbReconnectPolicy", "apbLastVerified",
  "apbVerifyBtn", "apbRepairBtn", "apbSwitchBtn", "apbOfflineBtn", "apbDisconnectBtn",
  "profileSwitchList", "profileSwitchCloseBtn"
];

function esc(str) {
  if (str == null) return "";
  const text = String(str);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const el = {};

for (const id of IDS) {
  el[id] = document.getElementById(id);
}

const FALLBACK_WORKFLOW_ID = "bridge_diagnostics";
const FALLBACK_WORKSPACE_EDIT_PATH = "docs/bridge-diagnostics-draft.md";

const appState = {
  model: null,
  chat: [],
  commands: [],
  settings: { clockUtcOffset: 0, tier: "PREVIEW" },
  setupState: "unconfigured",
  workflowId: FALLBACK_WORKFLOW_ID,
  outputMode: "checklist",
  workspaceAttachment: null,
  projectIntelligence: null,
  actionStatus: {},
  contextPack: null,
  contextPackProfiles: [],
  activeContextPackProfileId: "",
  bridgeEnvStatus: [],
  contextPackProfileStatus: null,
  contextPackProfileStatuses: {},
  lastArtifact: null,
  shippingPacketHistory: [],
  shippingPacketCompareIds: {
    left: "",
    right: ""
  },
  patchPlan: null,
  patchPlanPreviewFileId: "",
  patchPlanGroupOpenIds: null,
  promotedPaletteActions: [],
  commandPaletteShortcutScope: "workflow",
  verificationRunPlan: null,
  verificationRunHistory: [],
  verificationRunHistoryFilters: {
    workflow: "all",
    group: "all",
    workspace: "all",
    groupFilter: "all"
  },
  onboardingDraft: null,
  onboardingCompleted: false,
  workspaceEditDraft: {
    relativePath: FALLBACK_WORKSPACE_EDIT_PATH,
    content: ""
  },
  workspaceActionPreview: null,
  workspaceActionHistory: {},
  sessionsMeta: {},
  sessionsIndex: [],
  sessionsRows: [],
  pinnedSessionNames: [],
  sessionReadMarkers: {},
  inboxFilter: "all",
  inboxSearchQuery: "",
  activeSessionName: "",
  draftPrompt: "",
  recentPrompts: [],
  recentWorkspaces: [],
  lastPrompt: "",
  chatFilter: "",
  restored: false,
  restoredSessionName: "",
  chatOpsTray: "thread",
  sessionsTray: "manage",
  commandsTray: "index",
  systemSurface: "workbench",
  workbenchSurface: "artifact",
  performanceTray: "diagnostics",
  performanceOutputView: "audit",
  intelTray: "brief",
  leftPaneWidth: 308,
  rightPaneWidth: 392,
  rightPaneCollapsed: false,
  requestInFlight: false,
  streamInFlight: false,
  streamBase: [],
  streamText: "",
  surfaceEpochs: {
    artifact: 0,
    patch: 0,
    apply: 0
  },
  surfaceRefreshTokens: {
    artifact: 0,
    patch: 0,
    apply: 0
  },
  surfaceDiagnostics: [],
  statsTimer: null,
  clockTimer: null,
  autonomous: false,
  llmStatus: "unconfigured",
  llmStatusEpoch: 0,
  settingsMenuOpen: false,
  commandPaletteOpen: false,
  commandPaletteItems: [],
  commandPaletteIndex: 0
};

const SHIPPING_PACKET_HISTORY_LIMIT = 8;
const VERIFICATION_RUN_HISTORY_LIMIT = 16;
const CONTEXT_PACK_FILE_LIMIT = 6;
const CONTEXT_PACK_READ_LIMIT = 3200;
const CONTEXT_PACK_PROMPT_CHAR_LIMIT = 600;
const WORKSPACE_LAYOUT_BREAKPOINT = 980;
const DEFAULT_LEFT_PANE_WIDTH = 308;
const DEFAULT_RIGHT_PANE_WIDTH = 392;
const MIN_LEFT_PANE_WIDTH = 260;
const MAX_LEFT_PANE_WIDTH = 420;
const MIN_RIGHT_PANE_WIDTH = 320;
const MAX_RIGHT_PANE_WIDTH = 560;

let paneResizeSession = null;

const LOCAL_COMMANDS = [
  { name: "autodetect", description: "Probe local Ollama bridge status.", args: [], source: "local" },
  { name: "health", description: "Show LLM bridge health details.", args: [], source: "local" },
  { name: "autostep", description: "Run planner+critic synthesis on active chat.", args: [], source: "local" }
];

const verificationCatalog = window.NeuralShellVerificationCatalog || {};
const bridgeProviderCatalog = window.NeuralShellBridgeProviderCatalog || {};
const BRIDGE_PROVIDERS = Array.isArray(bridgeProviderCatalog.PROVIDERS) ? bridgeProviderCatalog.PROVIDERS : [];
const airgapPolicy = window.NeuralShellAirgapPolicy || {
  OFFLINE_MODE_BLOCKED_MESSAGE: "Offline Mode is on. Hosted bridges are blocked.",
  isLoopbackHost: (hostname) => ["127.0.0.1", "localhost", "::1"].includes(String(hostname || "").trim().toLowerCase()),
  offlineModeEnabled: (settings) => !(settings && settings.allowRemoteBridge),
  profileNeedsRemoteAccess: (profile, options = {}) => {
    if (!profile || typeof profile !== "object") return false;
    const providerRemote = typeof options.isRemoteProvider === "function"
      ? Boolean(options.isRemoteProvider(profile.provider))
      : Boolean(profile.remote);
    const raw = String(profile.baseUrl || "").trim();
    if (!raw) return providerRemote;
    try {
      return !["127.0.0.1", "localhost", "::1"].includes(new URL(raw).hostname.toLowerCase());
    } catch {
      return providerRemote;
    }
  },
  resolveBridgeSelection: (options = {}) => {
    const profiles = Array.isArray(options.profiles)
      ? options.profiles.filter((profile) => profile && typeof profile === "object")
      : [];
    const requestedId = String(options.activeProfileId || "").trim();
    const selectedProfile = (requestedId && profiles.find((profile) => String(profile.id || "").trim() === requestedId))
      || profiles[0]
      || null;
    let liveProfile = selectedProfile;
    if (
      selectedProfile
      && options.allowRemoteBridge !== true
      && airgapPolicy.profileNeedsRemoteAccess(selectedProfile, { isRemoteProvider: options.isRemoteProvider })
    ) {
      liveProfile = profiles.find((profile) => !airgapPolicy.profileNeedsRemoteAccess(profile, { isRemoteProvider: options.isRemoteProvider })) || null;
    }
    return {
      profiles,
      selectedProfile,
      liveProfile,
      blockedByRemoteToggle: Boolean(
        selectedProfile
        && liveProfile
        && String(selectedProfile.id || "") !== String(liveProfile.id || "")
      )
    };
  },
  settingsConnectionModeText: (options = {}) => {
    const liveAllowRemote = Boolean(options.liveAllowRemote);
    const draftAllowRemote = Boolean(options.draftAllowRemote);
    if (draftAllowRemote !== liveAllowRemote) {
      return draftAllowRemote
        ? "Draft change: hosted access will turn on after Apply Settings."
        : "Draft change: Offline Mode will turn on after Apply Settings.";
    }
    return liveAllowRemote
      ? "Hosted lane is active. Saved remote profiles can take live traffic."
      : "Local-only group is active. Hosted providers are blocked.";
  },
  offlineModeSummaryText: (allowRemoteBridge) => allowRemoteBridge
    ? "Offline Mode is off. Hosted profiles are available whenever you intentionally select them."
    : "Offline Mode is on. Hosted providers stay blocked and NeuralShell stays local-only."
};

/**
 * Integrated Terminal Overlay (Phase 11A)
 * Provides real-time visibility into orchestrated action execution.
 */
class TerminalOverlay {
  constructor() {
    this.container = null;
    this.body = null;
    this.titleText = null;
    this.isVisible = false;
    this.isExpanded = true;
    this.logLimit = 500;
    this.activeWorkspace = null;
    this.init();
  }

  init() {
    const shell = document.createElement("div");
    shell.className = "terminal-overlay-shell";
    shell.innerHTML = `
      <div class="terminal-header">
        <div class="terminal-title">
          <div class="terminal-status-dot"></div>
          <span class="terminal-text">Action Runtime</span>
          <span class="workspace-context"></span>
        </div>
        <div class="terminal-controls">
          <div id="termRiskBadge" class="risk-tier-badge" data-tier="low">Risk: Low</div>
          <button class="btn-icon" id="term-close" style="background:transparent; border:0; color:var(--text); font-size:16px; cursor:pointer; padding:4px;">✕</button>
        </div>
      </div>
      <div class="chain-status-bar" id="chainStatusBar">
        <div class="chain-timeline" id="chainTimeline"></div>
      </div>
      <div class="terminal-body scrollable"></div>
      <div class="terminal-footer">
        <div class="terminal-prompt-prefix">></div>
        <div class="terminal-prompt-input" id="termPromptLine" contenteditable="true" spellcheck="false"></div>
      </div>
    `;
    document.body.appendChild(shell);
    this.container = shell;
    this.body = shell.querySelector(".terminal-body");
    this.titleText = shell.querySelector(".terminal-text");
    this.wsContext = shell.querySelector(".workspace-context");
    this.riskBadge = shell.querySelector("#termRiskBadge");
    this.chainBar = shell.querySelector("#chainStatusBar");
    this.chainTimeline = shell.querySelector("#chainTimeline");
    this.promptLine = shell.querySelector("#termPromptLine");

    shell.querySelector(".terminal-header").onclick = () => this.toggleSize();
    shell.querySelector("#term-close").onclick = (e) => {
      e.stopPropagation();
      this.hide();
    };

    if (window.api && window.api.action && window.api.action.onLog) {
      window.api.action.onLog((entry) => this.appendLog(entry));
    }

    if (window.api && window.api.action && window.api.action.onInteraction) {
      window.api.action.onInteraction((data) => this.handleInteraction(data));
    }
  }

  show(actionLabel = "Action Runtime") {
    this.titleText.textContent = actionLabel;
    this.isVisible = true;
    this.container.classList.add("is-visible");
    this.container.classList.add("is-expanded");
    this.clear();
  }

  hide() {
    this.isVisible = false;
    this.container.classList.remove("is-visible");
  }

  toggleSize() {
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.container.classList.add("is-expanded");
      this.container.classList.remove("is-minimized");
    } else {
      this.container.classList.remove("is-expanded");
      this.container.classList.add("is-minimized");
    }
  }

  appendLog(entry) {
    // Phase 11D: Filter by active workspace
    const currentWs = window.workspaceSwitcher ? window.workspaceSwitcher.activeWorkspace : null;
    if (currentWs && entry.workspacePath && entry.workspacePath !== currentWs.path) {
      // Log is for another workspace. We could show a notification/badge here.
      if (window.workspaceSwitcher) window.workspaceSwitcher.notifyAttention(entry.workspacePath);
      return;
    }

    if (!this.isVisible) this.show();

    // Update header context if provided
    if (entry.workspacePath) {
      this.wsContext.textContent = `| ${window.api.utils.basename(entry.workspacePath)}`;
    }

    const line = document.createElement("div");
    line.className = `terminal-log-line log-${entry.type || "stdout"}`;
    line.textContent = entry.message;
    this.body.appendChild(line);

    // Prune history
    if (this.body.children.length > this.logLimit) {
      this.body.removeChild(this.body.firstChild);
    }

    // Auto-scroll
    this.body.scrollTop = this.body.scrollHeight;

    // Phase 12A: Update Chain Progress if applicable
    if (entry.chainId && window.appState && window.appState.chains) {
      const chain = window.appState.chains[entry.chainId];
      if (chain) {
        this.updateChainProgress(chain);
      } else {
        this.chainProgress.style.display = "none";
      }
    } else if (!entry.chainId) {
      this.chainProgress.style.display = "none";
    }
  }

  updateChainProgress(chain) {
    if (!chain || !chain.steps || !chain.steps.length) {
      if (this.chainBar) this.chainBar.style.display = "none";
      return;
    }

    if (this.chainBar) this.chainBar.style.display = "block";
    if (this.chainTimeline) {
      this.chainTimeline.innerHTML = "";
      chain.steps.forEach((step, idx) => {
        const dot = document.createElement("div");
        dot.className = `chain-step-dot step-${step.status || "pending"}`;
        dot.title = `${step.label || "Step " + (idx + 1)}: ${step.status}`;
        this.chainTimeline.appendChild(dot);

        if (idx < chain.steps.length - 1) {
          const line = document.createElement("div");
          line.className = "chain-step-connector";
          this.chainTimeline.appendChild(line);
        }
      });
    }

    if (this.titleText) {
      const activeIdx = chain.steps.findIndex(s => s.status === "running");
      const displayIdx = activeIdx >= 0 ? activeIdx + 1 : chain.steps.length;
      this.titleText.textContent = `${chain.title} (${displayIdx}/${chain.steps.length})`;
    }
  }

  clear() {
    this.body.innerHTML = "";
  }

  handleInteraction(data) {
    const { actionId, request, workspacePath } = data;

    // Phase 11D: Routing & Attention
    const currentWs = window.workspaceSwitcher ? window.workspaceSwitcher.activeWorkspace : null;
    if (currentWs && workspacePath && workspacePath !== currentWs.path) {
      if (window.workspaceSwitcher) window.workspaceSwitcher.notifyAttention(workspacePath, true);
      return;
    }

    if (!this.isVisible) this.show(request.message);
    else this.titleText.textContent = `Awaiting Interaction`;

    if (workspacePath) {
      this.wsContext.textContent = `| ${window.api.utils.basename(workspacePath)}`;
    }

    const promptDiv = document.createElement("div");
    promptDiv.className = "terminal-interaction-prompt";

    let rationaleHtml = "";
    if (request.suggestions && request.suggestions.rationale) {
      rationaleHtml = `<div class="interaction-rationale">${request.suggestions.rationale}</div>`;
    }

    promptDiv.innerHTML = `
      ${rationaleHtml}
      <div class="interaction-message">${request.message}</div>
      <div class="interaction-choices"></div>
    `;

    const choicesDiv = promptDiv.querySelector(".interaction-choices");
    request.choices.forEach(choice => {
      const btn = document.createElement("button");
      let btnClass = `btn-interaction ${choice.tone || "ok"}`;

      // Highlight suggested choice (Phase 11C)
      if (request.suggestions && request.suggestions.preferredChoice === choice.id) {
        btnClass += " suggested";
      }

      btn.className = btnClass;
      btn.textContent = choice.label;
      btn.onclick = () => this.submitChoice(actionId, choice.id, choice.label);
      choicesDiv.appendChild(btn);
    });

    this.body.appendChild(promptDiv);
    this.body.scrollTop = this.body.scrollHeight;
  }

  async submitChoice(actionId, choiceId, choiceLabel) {
    // Remove all interaction prompts for this action
    const prompts = this.body.querySelectorAll(".terminal-interaction-prompt");
    prompts.forEach(p => p.remove());

    this.appendLog({
      actionId,
      message: `Operator Decision: [${choiceLabel}]`,
      type: "system"
    });

    if (window.api && window.api.action && window.api.action.respond) {
      await window.api.action.respond(actionId, { choiceId });
    }

    this.titleText.textContent = "Action Runtime";
  }
}

const terminalOverlay = new TerminalOverlay();
const bridgeProfileModel = window.NeuralShellBridgeProfileModel || {};
const bridgeSettingsModel = window.NeuralShellBridgeSettingsModel || {};
const bridgeSettingsFeatureCatalog = window.NeuralShellBridgeSettingsFeature || {};
const commandDeckConfig = window.NeuralShellCommandDeckConfig || {};
const operatorMemoryStore = window.NeuralShellOperatorMemory || {
  loadDraftPrompt: () => "",
  saveDraftPrompt: () => "",
  clearDraftPrompt: () => "",
  recordPrompt: () => [],
  listRecentPrompts: () => [],
  recordWorkspace: () => [],
  listRecentWorkspaces: () => [],
  removeWorkspace: () => [],
  loadLayoutPrefs: () => ({}),
  saveLayoutPrefs: () => ({})
};

const DEFAULT_PROMPT_SNIPPETS = [
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
  },
  {
    id: "release",
    label: "Release Gate",
    text: "Audit release readiness, list blockers first, and finish with explicit pass/fail gates plus verification."
  },
  {
    id: "modular",
    label: "Modular Refactor",
    text: "Refactor this surface into smaller modules, preserve behavior, and call out risks before changing public contracts."
  }
];

const PROMPT_SNIPPETS = Array.isArray(commandDeckConfig.PROMPT_SNIPPETS) && commandDeckConfig.PROMPT_SNIPPETS.length
  ? commandDeckConfig.PROMPT_SNIPPETS
  : DEFAULT_PROMPT_SNIPPETS;

const workflowCatalog = window.NeuralShellWorkflowCatalog || {};
const WORKFLOWS = Array.isArray(workflowCatalog.WORKFLOWS) ? workflowCatalog.WORKFLOWS : [];
const OUTPUT_MODES = Array.isArray(workflowCatalog.OUTPUT_MODES) ? workflowCatalog.OUTPUT_MODES : [];
const DEFAULT_WORKFLOW_ID = String(workflowCatalog.DEFAULT_WORKFLOW_ID || FALLBACK_WORKFLOW_ID).trim() || FALLBACK_WORKFLOW_ID;

function normalizeBridgeProviderId(id) {
  if (bridgeProviderCatalog && typeof bridgeProviderCatalog.normalizeBridgeProviderId === "function") {
    return bridgeProviderCatalog.normalizeBridgeProviderId(id);
  }
  return String(id || "ollama").trim().toLowerCase() || "ollama";
}

function getBridgeProvider(id) {
  if (bridgeProviderCatalog && typeof bridgeProviderCatalog.getBridgeProvider === "function") {
    return bridgeProviderCatalog.getBridgeProvider(id);
  }
  return BRIDGE_PROVIDERS.find((provider) => provider.id === normalizeBridgeProviderId(id)) || BRIDGE_PROVIDERS[0] || {
    id: "ollama",
    label: "Ollama (Local)",
    defaultBaseUrl: "http://127.0.0.1:11434",
    remote: false,
    requiresApiKey: false,
    suggestedModels: []
  };
}

function suggestedModelsForProvider(id) {
  if (bridgeProviderCatalog && typeof bridgeProviderCatalog.suggestedModelsForProvider === "function") {
    return bridgeProviderCatalog.suggestedModelsForProvider(id);
  }
  const provider = getBridgeProvider(id);
  return Array.isArray(provider.suggestedModels) ? provider.suggestedModels.slice() : [];
}

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
  return workflow ? workflow.id : DEFAULT_WORKFLOW_ID;
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
    `Label: ${String(data.label || "Unknown workspace")} `,
    `Root: ${String(data.rootPath || "") || "Unavailable"} `,
    `Signals: ${Array.isArray(data.signals) && data.signals.length ? data.signals.join(", ") : "None detected"} `,
    `Attached: ${formatTimestampLabel(data.attachedAt)} `
  ];
  return lines.join("\n");
}

function defaultContextPackName() {
  const workflow = getWorkflow(appState.workflowId);
  const workspace = appState.workspaceAttachment;
  if (workflow && workflow.title) {
    return `${workflow.title} Context Pack`;
  }
  if (workspace && workspace.label) {
    return `${workspace.label} Context Pack`;
  }
  return "Context Pack";
}

function defaultContextPackPaths(workspace = appState.workspaceAttachment) {
  const summary = workspace && typeof workspace === "object" ? workspace : null;
  if (!summary) return [];
  const signals = Array.isArray(summary.signals) ? summary.signals : [];
  const paths = [];
  if (signals.includes("README")) {
    paths.push("README.md");
  }
  if (signals.includes("package.json")) {
    paths.push("package.json");
  }
  return paths;
}

function activeContextPackSuggestionWorkflowId(fallback = appState.workflowId) {
  return normalizeWorkflowId(fallback || appState.workflowId);
}

function parseContextPackPathsInput(value) {
  const raw = String(value || "");
  const items = raw
    .split(/\r?\n|,/)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map((item) => normalizeDraftRelativePath(item));
  return Array.from(new Set(items)).slice(0, CONTEXT_PACK_FILE_LIMIT);
}

function compactContextPackContent(value, maxChars = CONTEXT_PACK_PROMPT_CHAR_LIMIT) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > maxChars ? `${text.slice(0, maxChars)} \n...[truncated]` : text;
}

function normalizeContextPackValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const rootPath = String(value.rootPath || "").trim();
  const rootLabel = String(value.rootLabel || rootPath || "").trim();
  const entries = Array.isArray(value.entries)
    ? value.entries
      .map((entry) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
          return null;
        }
        const relativePath = normalizeDraftRelativePath(entry.relativePath);
        return {
          relativePath,
          absolutePath: String(entry.absolutePath || "").trim(),
          modifiedAt: String(entry.modifiedAt || "").trim(),
          content: String(entry.content || "")
        };
      })
      .filter(Boolean)
    : [];
  if (!rootPath || !entries.length) {
    return null;
  }
  const filePaths = Array.isArray(value.filePaths) && value.filePaths.length
    ? value.filePaths.map((item) => normalizeDraftRelativePath(item))
    : entries.map((entry) => entry.relativePath);
  return {
    id: String(value.id || `context - pack - ${formatFileStamp(value.builtAt || new Date().toISOString())} `).trim(),
    name: String(value.name || defaultContextPackName()).trim() || defaultContextPackName(),
    rootPath,
    rootLabel,
    builtAt: String(value.builtAt || new Date().toISOString()),
    filePaths,
    entries
  };
}

function contextPackMatchesWorkspaceAttachment(contextPack, workspaceAttachment) {
  const packRoot = rootPathFromWorkspaceBoundValue(contextPack);
  const workspaceRoot = rootPathFromWorkspaceBoundValue(workspaceAttachment);
  return Boolean(packRoot && workspaceRoot && packRoot === workspaceRoot);
}

function hasContextPack() {
  return Boolean(appState.contextPack && Array.isArray(appState.contextPack.entries) && appState.contextPack.entries.length);
}

function contextPackSummaryText(contextPack = appState.contextPack) {
  if (!contextPack) {
    return hasWorkspaceAttachment()
      ? "No context pack loaded.\nBuild one from README, package metadata, or selected docs to ground workflow prompts locally."
      : "Attach a workspace before building a context pack.";
  }
  const files = Array.isArray(contextPack.filePaths) ? contextPack.filePaths : [];
  return [
    `Pack: ${contextPack.name} `,
    `Workspace: ${contextPack.rootLabel || contextPack.rootPath} `,
    `Files: ${files.length} | ${files.join(", ")} `,
    `Built: ${formatTimestampLabel(contextPack.builtAt)} `
  ].join("\n");
}

function contextPackPreviewText(contextPack = appState.contextPack) {
  if (!contextPack) {
    return "No context pack loaded.\nUse relative workspace paths like README.md or package.json.";
  }
  return contextPack.entries
    .map((entry) => {
      const content = compactContextPackContent(entry.content, 720);
      return [`### ${entry.relativePath} `, content || "(empty file)"].join("\n");
    })
    .join("\n\n");
}

function contextPackPromptLead(contextPack = appState.contextPack) {
  if (!contextPack) return "";
  const paths = Array.isArray(contextPack.filePaths) ? contextPack.filePaths.slice(0, 3) : [];
  const suffix = paths.length ? ` Files: ${paths.join(", ")}.` : "";
  return `Use the active context pack "${contextPack.name}"(${contextPack.entries.length} local file${contextPack.entries.length === 1 ? "" : "s"}) as project memory.${suffix} `;
}

function contextPackSystemLines(contextPack = appState.contextPack) {
  if (!contextPack) {
    return ["[CONTEXT PACK] None loaded."];
  }
  const lines = [
    `[CONTEXT PACK] ${contextPack.name} | ${contextPack.entries.length} file${contextPack.entries.length === 1 ? "" : "s"} | built ${contextPack.builtAt} `
  ];
  for (const entry of contextPack.entries) {
    lines.push(`[CONTEXT FILE] ${entry.relativePath} `);
    lines.push(compactContextPackContent(entry.content));
  }
  return lines;
}

function normalizeContextPackProfileValue(value, index = 0) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const workspaceRoot = String(value.workspaceRoot || "").trim();
  const filePaths = Array.isArray(value.filePaths)
    ? Array.from(new Set(value.filePaths.map((item) => normalizeDraftRelativePath(item))))
    : [];
  if (!workspaceRoot || !filePaths.length) {
    return null;
  }
  const workflowId = WORKFLOWS.some((workflow) => workflow.id === String(value.workflowId || "").trim())
    ? String(value.workflowId || "").trim()
    : "";
  const fileSnapshots = Array.isArray(value.fileSnapshots)
    ? value.fileSnapshots
      .map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return null;
        return {
          relativePath: normalizeDraftRelativePath(item.relativePath),
          modifiedAt: String(item.modifiedAt || "").trim()
        };
      })
      .filter(Boolean)
    : [];
  return {
    id: String(value.id || `context - pack - profile - ${index + 1} `).trim() || `context - pack - profile - ${index + 1} `,
    workspaceRoot,
    workspaceLabel: String(value.workspaceLabel || workspaceRoot).trim() || workspaceRoot,
    workflowId,
    name: String(value.name || `Context Pack Profile ${index + 1} `).trim() || `Context Pack Profile ${index + 1} `,
    filePaths,
    fileSnapshots,
    savedAt: String(value.savedAt || new Date().toISOString())
  };
}

function normalizeContextPackProfiles(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (let index = 0; index < value.length; index += 1) {
    try {
      const profile = normalizeContextPackProfileValue(value[index], index);
      if (!profile) continue;
      if (seen.has(profile.id)) continue;
      seen.add(profile.id);
      out.push(profile);
    } catch {
      // Ignore malformed context-pack profiles and keep the rest usable.
    }
  }
  return out.sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

function currentWorkspaceContextPackProfiles() {
  const workspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  if (!workspaceRoot) return [];
  return normalizeContextPackProfiles(appState.contextPackProfiles).filter((profile) => profile.workspaceRoot === workspaceRoot);
}

function currentContextPackProfile() {
  const target = String(appState.activeContextPackProfileId || "").trim();
  if (!target) return null;
  const workspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  return normalizeContextPackProfiles(appState.contextPackProfiles).find((profile) => (
    profile.id === target
    && (!workspaceRoot || profile.workspaceRoot === workspaceRoot)
  )) || null;
}

function contextPackProfileWorkflow(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return null;
  }
  const workflowId = String(profile.workflowId || "").trim();
  return WORKFLOWS.find((workflow) => workflow.id === workflowId) || null;
}

function recommendedContextPackProfile(workflowId = appState.workflowId) {
  const targetWorkflowId = normalizeWorkflowId(workflowId);
  const profiles = currentWorkspaceContextPackProfiles()
    .filter((profile) => String(profile.workflowId || "").trim() === targetWorkflowId)
    .sort((left, right) => String(right.savedAt || "").localeCompare(String(left.savedAt || "")));
  return profiles[0] || null;
}

function reusableContextPackProfileForSave(contextPack = appState.contextPack, options = {}) {
  if (!contextPack || typeof contextPack !== "object" || Array.isArray(contextPack)) {
    return null;
  }
  const explicitProfileId = String(options.profileId || "").trim();
  if (explicitProfileId) {
    return normalizeContextPackProfiles(appState.contextPackProfiles).find((profile) => profile.id === explicitProfileId) || null;
  }
  const workflowId = normalizeWorkflowId(options.workflowId || appState.workflowId);
  const selectedProfile = currentContextPackProfile();
  if (selectedProfile && normalizeWorkflowId(selectedProfile.workflowId) === workflowId) {
    return selectedProfile;
  }
  const workflowProfiles = currentWorkspaceContextPackProfiles().filter(
    (profile) => normalizeWorkflowId(profile.workflowId) === workflowId
  );
  const matchingLoadedProfile = workflowProfiles.find((profile) => contextPackProfileMatchesLoadedPack(profile, contextPack));
  if (matchingLoadedProfile) {
    return matchingLoadedProfile;
  }
  return workflowProfiles.find((profile) => String(profile.name || "").trim() === String(contextPack.name || "").trim()) || null;
}

function contextPackProfileMatchesLoadedPack(profile, contextPack = appState.contextPack) {
  if (!profile || !contextPack) {
    return false;
  }
  if (String(profile.workspaceRoot || "").trim() !== String(contextPack.rootPath || "").trim()) {
    return false;
  }
  const profilePaths = Array.isArray(profile.filePaths)
    ? [...profile.filePaths].map((item) => normalizeDraftRelativePath(item)).sort()
    : [];
  const packPaths = Array.isArray(contextPack.filePaths)
    ? [...contextPack.filePaths].map((item) => normalizeDraftRelativePath(item)).sort()
    : [];
  if (profilePaths.length !== packPaths.length) {
    return false;
  }
  return profilePaths.every((value, index) => value === packPaths[index]);
}

function contextPackWorkflowLinkModel(workflowId = appState.workflowId) {
  const workflow = getWorkflow(workflowId);
  const profiles = currentWorkspaceContextPackProfiles();
  const recommendedProfile = recommendedContextPackProfile(workflowId);
  const recommendedLoaded = recommendedProfile && contextPackProfileMatchesLoadedPack(recommendedProfile);
  if (!hasWorkspaceAttachment()) {
    return {
      tone: "ok",
      text: "Attach a workspace to link saved context-pack profiles to workflows.",
      profile: null,
      canLoad: false
    };
  }
  if (!profiles.length) {
    return {
      tone: "ok",
      text: `Save a ${workflow ? workflow.title : "workflow"} context-pack profile to make workflow switching repo-aware.`,
      profile: null,
      canLoad: false
    };
  }
  if (!recommendedProfile) {
    return {
      tone: "warn",
      text: `No saved context-pack profile is linked to ${(workflow && workflow.title) || normalizeWorkflowId(workflowId)}. Save or update a profile from this workflow to recommend it here.`,
      profile: null,
      canLoad: false
    };
  }
  return {
    tone: recommendedLoaded ? "ok" : "warn",
    text: recommendedLoaded
      ? `${(workflow && workflow.title) || normalizeWorkflowId(workflowId)} recommends ${recommendedProfile.name}. It is already loaded for this workspace.`
      : `${(workflow && workflow.title) || normalizeWorkflowId(workflowId)} recommends ${recommendedProfile.name}${recommendedProfile.savedAt ? ` | saved ${formatTimestampLabel(recommendedProfile.savedAt)}` : ""}. Load it to refresh repo memory for this workflow.`,
    profile: recommendedProfile,
    canLoad: !recommendedLoaded
  };
}

function contextProfileStatusForCard(profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    return {
      state: "No linked profile",
      tone: "warn",
      stale: false,
      known: false
    };
  }
  const liveStatus = getContextPackProfileStatus(profile.id);
  if (!liveStatus) {
    return {
      state: "Status pending",
      tone: "guard",
      stale: false,
      known: false
    };
  }
  return {
    state: liveStatus.stale ? "Stale" : "Fresh",
    tone: liveStatus.stale ? "warn" : "good",
    stale: liveStatus.stale === true,
    known: true
  };
}

function buildPatchPlanContextProvenance(options = {}) {
  const rootPath = String(options.rootPath || rootPathFromWorkspaceBoundValue(appState.workspaceAttachment) || "").trim();
  const contextPack = options.contextPack === undefined ? appState.contextPack : options.contextPack;
  const contextPackProfile = options.contextPackProfile === undefined ? currentContextPackProfile() : options.contextPackProfile;
  if (!rootPath && !contextPack && !contextPackProfile) {
    return null;
  }
  return {
    workspaceRoot: rootPath,
    contextPack: contextPack && typeof contextPack === "object" && !Array.isArray(contextPack)
      ? {
        id: String(contextPack.id || "").trim(),
        name: String(contextPack.name || "").trim(),
        fileCount: Array.isArray(contextPack.filePaths) ? contextPack.filePaths.length : Array.isArray(contextPack.entries) ? contextPack.entries.length : 0,
        builtAt: String(contextPack.builtAt || "").trim(),
        filePaths: Array.isArray(contextPack.filePaths)
          ? contextPack.filePaths.map((item) => String(item || "").trim()).filter(Boolean)
          : []
      }
      : null,
    contextPackProfile: contextPackProfile && typeof contextPackProfile === "object" && !Array.isArray(contextPackProfile)
      ? {
        id: String(contextPackProfile.id || "").trim(),
        name: String(contextPackProfile.name || "").trim(),
        fileCount: Array.isArray(contextPackProfile.filePaths) ? contextPackProfile.filePaths.length : 0,
        savedAt: String(contextPackProfile.savedAt || "").trim()
      }
      : null
  };
}

function normalizePatchPlanContextProvenance(value, options = {}) {
  const fallback = buildPatchPlanContextProvenance(options);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }
  const workspaceRoot = String(value.workspaceRoot || fallback && fallback.workspaceRoot || "").trim();
  const contextPack = value.contextPack && typeof value.contextPack === "object" && !Array.isArray(value.contextPack)
    ? {
      id: String(value.contextPack.id || "").trim(),
      name: String(value.contextPack.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPack.fileCount)) ? Number(value.contextPack.fileCount) : 0,
      builtAt: String(value.contextPack.builtAt || "").trim(),
      filePaths: Array.isArray(value.contextPack.filePaths)
        ? value.contextPack.filePaths.map((item) => normalizeDraftRelativePath(item)).filter(Boolean)
        : []
    }
    : null;
  const contextPackProfile = value.contextPackProfile && typeof value.contextPackProfile === "object" && !Array.isArray(value.contextPackProfile)
    ? {
      id: String(value.contextPackProfile.id || "").trim(),
      name: String(value.contextPackProfile.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPackProfile.fileCount)) ? Number(value.contextPackProfile.fileCount) : 0,
      savedAt: String(value.contextPackProfile.savedAt || "").trim()
    }
    : null;
  if (!workspaceRoot && !contextPack && !contextPackProfile) {
    return fallback;
  }
  return {
    workspaceRoot,
    contextPack,
    contextPackProfile
  };
}

function ensurePatchPlanContextProvenance() {
  if (!appState.patchPlan) {
    return null;
  }
  const existing = appState.patchPlan.provenance;
  if (existing && (existing.contextPack || existing.contextPackProfile || existing.workspaceRoot)) {
    return existing;
  }
  const next = buildPatchPlanContextProvenance({
    rootPath: String(appState.patchPlan.rootPath || rootPathFromWorkspaceBoundValue(appState.workspaceAttachment) || "").trim()
  });
  if (!next) {
    return null;
  }
  appState.patchPlan = {
    ...appState.patchPlan,
    provenance: next
  };
  return next;
}

function setContextPackProfileStatus(value) {
  const normalized = value && typeof value === "object" && !Array.isArray(value)
    ? {
      profileId: String(value.profileId || "").trim(),
      stale: value.stale === true,
      changedPaths: Array.isArray(value.changedPaths) ? value.changedPaths.map((item) => String(item || "").trim()).filter(Boolean) : [],
      missingPaths: Array.isArray(value.missingPaths) ? value.missingPaths.map((item) => String(item || "").trim()).filter(Boolean) : [],
      checkedAt: String(value.checkedAt || "").trim(),
      message: String(value.message || "").trim()
    }
    : null;
  if (!normalized || !normalized.profileId) {
    appState.contextPackProfileStatus = null;
  } else {
    appState.contextPackProfileStatuses = {
      ...(appState.contextPackProfileStatuses && typeof appState.contextPackProfileStatuses === "object" ? appState.contextPackProfileStatuses : {}),
      [normalized.profileId]: normalized
    };
    if (String(appState.activeContextPackProfileId || "").trim() === normalized.profileId) {
      appState.contextPackProfileStatus = normalized;
    }
  }
  renderMissionControl();
}

function getContextPackProfileStatus(profileId = appState.activeContextPackProfileId) {
  const targetId = String(profileId || "").trim();
  if (!targetId) return null;
  const statuses = appState.contextPackProfileStatuses && typeof appState.contextPackProfileStatuses === "object"
    ? appState.contextPackProfileStatuses
    : {};
  const status = statuses[targetId];
  return status && typeof status === "object" && !Array.isArray(status)
    ? status
    : null;
}

function syncSelectedContextPackProfileStatus() {
  appState.contextPackProfileStatus = getContextPackProfileStatus(appState.activeContextPackProfileId);
  return appState.contextPackProfileStatus;
}

function pruneContextPackProfileStatuses(profiles = currentWorkspaceContextPackProfiles()) {
  const allowed = new Set((Array.isArray(profiles) ? profiles : []).map((profile) => String(profile.id || "").trim()).filter(Boolean));
  const statuses = appState.contextPackProfileStatuses && typeof appState.contextPackProfileStatuses === "object"
    ? appState.contextPackProfileStatuses
    : {};
  const next = {};
  for (const [profileId, status] of Object.entries(statuses)) {
    if (allowed.has(String(profileId || "").trim())) {
      next[profileId] = status;
    }
  }
  appState.contextPackProfileStatuses = next;
  syncSelectedContextPackProfileStatus();
}

function contextPackProfileStatusText() {
  const status = getContextPackProfileStatus();
  if (!status || !status.profileId) {
    return hasWorkspaceAttachment()
      ? "Save reusable profiles per workspace, then reload them against current repo files when you need fresh local memory."
      : "Attach a workspace to generate suggestions and save reusable context-pack profiles.";
  }
  return status.message || "Profile status unavailable.";
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
  const workflowSlug = String(appState.workflowId || "workspace").replace(/_/g, "-");
  return `docs / ${slugifySegment(workflowSlug, "workspace")} -draft.md`;
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
  const fenced = raw.match(/^```[a - zA - Z0 -9_ -] *\n([\s\S] *?) \n```$/);
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
  renderWorkbenchNavigation();
  return appState.workspaceEditDraft;
}

function setWorkspaceEditDraft(relativePath, content) {
  appState.workspaceEditDraft = {
    relativePath: String(relativePath || defaultWorkspaceEditPath()).trim() || defaultWorkspaceEditPath(),
    content: String(content || "")
  };
  renderWorkspaceEditDraft();
  renderWorkbenchNavigation();
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

function hasShippingPacketArtifact() {
  return Boolean(
    appState.lastArtifact
    && String(appState.lastArtifact.outputMode || "").trim() === "shipping_packet"
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
  const generatedAt = String(source.generatedAt || options.generatedAt || new Date().toISOString());
  const title = String(source.title || options.title || `${((getWorkflow(workflowId) || {}).title) || "Workflow"} Artifact`).trim();
  return {
    id: String(source.id || options.id || buildArtifactId({
      workflowId,
      outputMode,
      generatedAt,
      title
    })).trim(),
    title,
    workflowId,
    outputMode,
    content: String(source.content || "").trim(),
    generatedAt,
    provenance: normalizeArtifactProvenanceValue(source.provenance)
  };
}

function buildArtifactId(value) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const workflowId = normalizeWorkflowId(source.workflowId || appState.workflowId);
  const outputMode = normalizeOutputMode(source.outputMode || appState.outputMode, workflowId);
  const generatedAt = String(source.generatedAt || new Date().toISOString());
  const title = String(source.title || "artifact");
  return [
    slugifySegment(outputMode, "output"),
    slugifySegment(workflowId, "workflow"),
    formatFileStamp(generatedAt),
    slugifySegment(title, "artifact")
  ].join("-");
}

function normalizeArtifactProvenanceValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const contextPack = value.contextPack && typeof value.contextPack === "object" && !Array.isArray(value.contextPack)
    ? {
      id: String(value.contextPack.id || "").trim(),
      name: String(value.contextPack.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPack.fileCount)) ? Number(value.contextPack.fileCount) : 0,
      builtAt: String(value.contextPack.builtAt || "").trim(),
      filePaths: Array.isArray(value.contextPack.filePaths)
        ? value.contextPack.filePaths.map((item) => normalizeDraftRelativePath(item)).filter(Boolean)
        : []
    }
    : null;
  const contextPackProfile = value.contextPackProfile && typeof value.contextPackProfile === "object" && !Array.isArray(value.contextPackProfile)
    ? {
      id: String(value.contextPackProfile.id || "").trim(),
      name: String(value.contextPackProfile.name || "").trim(),
      fileCount: Number.isFinite(Number(value.contextPackProfile.fileCount)) ? Number(value.contextPackProfile.fileCount) : 0,
      savedAt: String(value.contextPackProfile.savedAt || "").trim()
    }
    : null;
  const sourceArtifact = value.sourceArtifact && typeof value.sourceArtifact === "object" && !Array.isArray(value.sourceArtifact)
    ? {
      id: String(value.sourceArtifact.id || "").trim(),
      title: String(value.sourceArtifact.title || "").trim(),
      outputMode: String(value.sourceArtifact.outputMode || "").trim(),
      generatedAt: String(value.sourceArtifact.generatedAt || "").trim()
    }
    : null;
  const patchPlan = value.patchPlan && typeof value.patchPlan === "object" && !Array.isArray(value.patchPlan)
    ? {
      id: String(value.patchPlan.id || "").trim(),
      generatedAt: String(value.patchPlan.generatedAt || "").trim(),
      totalFiles: Number.isFinite(Number(value.patchPlan.totalFiles)) ? Number(value.patchPlan.totalFiles) : 0
    }
    : null;
  const verification = value.verification && typeof value.verification === "object" && !Array.isArray(value.verification)
    ? {
      groupId: String(value.verification.groupId || "").trim(),
      runIds: Array.isArray(value.verification.runIds)
        ? value.verification.runIds.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
      executedAt: String(value.verification.executedAt || "").trim(),
      previousRunId: String(value.verification.previousRunId || "").trim(),
      ok: value.verification.ok === true,
      selectedCount: Number.isFinite(Number(value.verification.selectedCount)) ? Number(value.verification.selectedCount) : 0,
      passedCount: Number.isFinite(Number(value.verification.passedCount)) ? Number(value.verification.passedCount) : 0,
      failedCount: Number.isFinite(Number(value.verification.failedCount)) ? Number(value.verification.failedCount) : 0,
      pendingCount: Number.isFinite(Number(value.verification.pendingCount)) ? Number(value.verification.pendingCount) : 0,
      summary: String(value.verification.summary || "").trim()
    }
    : null;
  const lineage = value.lineage && typeof value.lineage === "object" && !Array.isArray(value.lineage)
    ? {
      packetId: String(value.lineage.packetId || "").trim(),
      parentPacketId: String(value.lineage.parentPacketId || "").trim(),
      sourceArtifactId: String(value.lineage.sourceArtifactId || "").trim(),
      generation: Number.isFinite(Number(value.lineage.generation)) ? Number(value.lineage.generation) : 0
    }
    : null;
  const workspaceRoot = String(value.workspaceRoot || "").trim();
  const workspaceLabel = String(value.workspaceLabel || "").trim();
  if (!workspaceRoot && !workspaceLabel && !contextPack && !contextPackProfile && !sourceArtifact && !patchPlan && !verification && !lineage) {
    return null;
  }
  return {
    workspaceRoot,
    workspaceLabel,
    contextPack,
    contextPackProfile,
    sourceArtifact,
    patchPlan,
    verification,
    lineage
  };
}

function shippingPacketLinkedRunCount(artifact) {
  const provenance = artifact && artifact.provenance && typeof artifact.provenance === "object"
    ? artifact.provenance
    : null;
  return provenance && provenance.verification && Array.isArray(provenance.verification.runIds)
    ? provenance.verification.runIds.length
    : 0;
}

function compactArtifactId(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.length > 18 ? `${text.slice(0, 18)}...` : text;
}

function shippingPacketProvenanceSummaryLine(artifact) {
  const provenance = artifact && artifact.provenance && typeof artifact.provenance === "object"
    ? artifact.provenance
    : null;
  if (!provenance) return "";
  if (provenance.lineage && provenance.lineage.generation) {
    return provenance.lineage.parentPacketId
      ? `Revision ${provenance.lineage.generation} from ${compactArtifactId(provenance.lineage.parentPacketId)} `
      : `Revision ${provenance.lineage.generation} `;
  }
  if (provenance.verification && provenance.verification.summary) {
    return provenance.verification.summary;
  }
  if (provenance.sourceArtifact && provenance.sourceArtifact.title) {
    return `Source artifact: ${provenance.sourceArtifact.title} `;
  }
  if (provenance.contextPackProfile && provenance.contextPackProfile.name) {
    return `Context profile: ${provenance.contextPackProfile.name} `;
  }
  if (provenance.contextPack && provenance.contextPack.name) {
    return `Context pack: ${provenance.contextPack.name} `;
  }
  if (provenance.workspaceLabel || provenance.workspaceRoot) {
    return `Scoped to ${provenance.workspaceLabel || provenance.workspaceRoot} `;
  }
  return "";
}

function shippingPacketDecisionLabel(artifact) {
  const lines = String(artifact && artifact.content ? artifact.content : "")
    .split("\n")
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  const decisionLine = lines.find((line) => line.startsWith("- Decision:"));
  return decisionLine ? decisionLine.replace("- Decision:", "").trim() : "";
}

function shippingPacketWorkspaceLabel(artifact) {
  const provenance = artifact && artifact.provenance && typeof artifact.provenance === "object"
    ? artifact.provenance
    : null;
  return provenance && (provenance.workspaceLabel || provenance.workspaceRoot)
    ? String(provenance.workspaceLabel || provenance.workspaceRoot)
    : "";
}

function getShippingPacketArtifactById(artifactId) {
  const target = String(artifactId || "").trim();
  if (!target) return null;
  return normalizeShippingPacketHistory(appState.shippingPacketHistory).find((item) => String(item.id || "") === target) || null;
}

function reconcileShippingPacketCompareSelection() {
  const history = normalizeShippingPacketHistory(appState.shippingPacketHistory);
  const currentLeft = getShippingPacketArtifactById(appState.shippingPacketCompareIds.left);
  const currentRight = getShippingPacketArtifactById(appState.shippingPacketCompareIds.right);
  if (currentLeft && currentRight && currentLeft.id !== currentRight.id) {
    return;
  }
  const left = history[0] || null;
  const right = history[1] || null;
  appState.shippingPacketCompareIds = {
    left: left ? String(left.id || "") : "",
    right: right ? String(right.id || "") : ""
  };
}

function setShippingPacketCompareSlot(slot, artifactId) {
  if (slot !== "left" && slot !== "right") return;
  const artifact = getShippingPacketArtifactById(artifactId);
  if (!artifact) {
    throw new Error("Shipping Packet compare target is unavailable.");
  }
  const oppositeSlot = slot === "left" ? "right" : "left";
  const oppositeId = String(appState.shippingPacketCompareIds[oppositeSlot] || "").trim();
  if (artifact.id === oppositeId) {
    throw new Error("Compare slots must target two different shipping packets.");
  }
  appState.shippingPacketCompareIds = {
    ...appState.shippingPacketCompareIds,
    [slot]: artifact.id
  };
  renderArtifactPanel();
  showBanner(`Shipping Packet loaded into compare ${slot === "left" ? "A" : "B"}.`, "ok");
}

function clearShippingPacketCompareSelection() {
  appState.shippingPacketCompareIds = { left: "", right: "" };
  reconcileShippingPacketCompareSelection();
  renderArtifactPanel();
  showBanner("Shipping Packet compare reset to the latest pair.", "ok");
}

function getShippingPacketCompareModel() {
  const history = normalizeShippingPacketHistory(appState.shippingPacketHistory);
  const left = getShippingPacketArtifactById(appState.shippingPacketCompareIds.left) || history[0] || null;
  const right = getShippingPacketArtifactById(appState.shippingPacketCompareIds.right) || history[1] || null;
  if (!left || !right || left.id === right.id) {
    return {
      left: left || null,
      right: right || null,
      ready: false,
      diffs: []
    };
  }
  const leftLinkedRuns = shippingPacketLinkedRunCount(left);
  const rightLinkedRuns = shippingPacketLinkedRunCount(right);
  const leftDecision = shippingPacketDecisionLabel(left);
  const rightDecision = shippingPacketDecisionLabel(right);
  const leftGeneration = left.provenance && left.provenance.lineage ? Number(left.provenance.lineage.generation || 0) : 0;
  const rightGeneration = right.provenance && right.provenance.lineage ? Number(right.provenance.lineage.generation || 0) : 0;
  const leftPatchFiles = left.provenance && left.provenance.patchPlan ? Number(left.provenance.patchPlan.totalFiles || 0) : 0;
  const rightPatchFiles = right.provenance && right.provenance.patchPlan ? Number(right.provenance.patchPlan.totalFiles || 0) : 0;
  const leftWorkspace = shippingPacketWorkspaceLabel(left);
  const rightWorkspace = shippingPacketWorkspaceLabel(right);
  const diffs = [
    {
      label: "Decision",
      left: leftDecision || "Unknown",
      right: rightDecision || "Unknown",
      tone: leftDecision === rightDecision ? "guard" : "warn"
    },
    {
      label: "Revision",
      left: leftGeneration ? `Rev ${leftGeneration} ` : "Untracked",
      right: rightGeneration ? `Rev ${rightGeneration} ` : "Untracked",
      tone: leftGeneration === rightGeneration ? "guard" : "ok"
    },
    {
      label: "Linked Runs",
      left: String(leftLinkedRuns),
      right: String(rightLinkedRuns),
      tone: leftLinkedRuns === rightLinkedRuns ? "guard" : "ok"
    },
    {
      label: "Patch Files",
      left: String(leftPatchFiles || 0),
      right: String(rightPatchFiles || 0),
      tone: leftPatchFiles === rightPatchFiles ? "guard" : "ok"
    },
    {
      label: "Workspace",
      left: leftWorkspace || "Unknown",
      right: rightWorkspace || "Unknown",
      tone: leftWorkspace === rightWorkspace ? "guard" : "warn"
    }
  ];
  return {
    left,
    right,
    ready: true,
    diffs
  };
}

function shippingPacketHistoryKey(value) {
  const artifact = normalizeArtifactValue(value, {
    forceOutputMode: "shipping_packet",
    title: "Shipping Packet"
  });
  return String(artifact.id || `${artifact.generatedAt}| ${artifact.title}| ${artifact.content.slice(0, 160)} `);
}

function normalizeShippingPacketHistory(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (let index = 0; index < value.length; index += 1) {
    try {
      const artifact = normalizeArtifactValue(value[index], {
        forceOutputMode: "shipping_packet",
        title: "Shipping Packet"
      });
      if (!String(artifact.content || "").trim()) continue;
      const key = shippingPacketHistoryKey(artifact);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(artifact);
    } catch {
      // Ignore malformed history entries and keep the rest usable.
    }
  }
  out.sort((left, right) => String(right.generatedAt || "").localeCompare(String(left.generatedAt || "")));
  return out.slice(0, SHIPPING_PACKET_HISTORY_LIMIT);
}

function pushShippingPacketHistoryEntry(value) {
  const entry = normalizeArtifactValue(value, {
    forceOutputMode: "shipping_packet",
    title: "Shipping Packet"
  });
  const targetKey = shippingPacketHistoryKey(entry);
  appState.shippingPacketHistory = [
    entry,
    ...normalizeShippingPacketHistory(appState.shippingPacketHistory).filter((item) => shippingPacketHistoryKey(item) !== targetKey)
  ].slice(0, SHIPPING_PACKET_HISTORY_LIMIT);
  return entry;
}

function normalizeVerificationRunHistoryEntry(value, index = 0) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const workflowId = normalizeWorkflowId(source.workflowId || appState.workflowId);
  const rawChecks = Array.isArray(source.checks)
    ? source.checks.map((check, checkIndex) => normalizeVerificationRunCheckEntry(check, checkIndex))
    : [];
  if (!rawChecks.length) {
    throw new Error(`Verification run history entry ${index + 1} must include at least one check.`);
  }
  const selectedCheckIds = Array.isArray(source.selectedCheckIds) && source.selectedCheckIds.length
    ? source.selectedCheckIds.map((item) => String(item || "").trim()).filter((id) => verificationCheckSpec(id))
    : rawChecks.filter((check) => check.selected !== false).map((check) => check.id);
  const selectedSet = new Set(selectedCheckIds);
  const checks = rawChecks.map((check) => ({
    ...check,
    selected: selectedSet.size ? selectedSet.has(check.id) : check.selected !== false
  }));
  const executedAt = String(source.executedAt || source.lastRunAt || new Date().toISOString());
  return {
    runId: String(source.runId || source.id || `verification - run - ${Date.now()} -${index + 1} `),
    planId: String(source.planId || source.id || "").trim(),
    groupId: String(source.groupId || "").trim(),
    groupTitle: String(source.groupTitle || "Verification Surface").trim() || "Verification Surface",
    workflowId,
    rootPath: String(source.rootPath || "").trim(),
    rootLabel: String(source.rootLabel || "").trim(),
    preparedAt: String(source.preparedAt || ""),
    executedAt,
    ok: source.ok === true || checks.filter((check) => check.selected !== false).every((check) => check.status === "passed"),
    selectedCheckIds: checks.filter((check) => check.selected !== false).map((check) => check.id),
    checks
  };
}

function verificationRunHistoryKey(value) {
  const entry = normalizeVerificationRunHistoryEntry(value);
  return String(entry.runId || `${entry.executedAt}| ${entry.groupId}| ${entry.rootPath} `);
}

function normalizeVerificationRunHistory(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  for (let index = 0; index < value.length; index += 1) {
    try {
      const entry = normalizeVerificationRunHistoryEntry(value[index], index);
      const key = verificationRunHistoryKey(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(entry);
    } catch {
      // Ignore malformed verification snapshots and keep the rest usable.
    }
  }
  out.sort((left, right) => String(right.executedAt || "").localeCompare(String(left.executedAt || "")));
  return out.slice(0, VERIFICATION_RUN_HISTORY_LIMIT);
}

function pushVerificationRunHistoryEntry(value) {
  const entry = normalizeVerificationRunHistoryEntry(value);
  const targetKey = verificationRunHistoryKey(entry);
  appState.verificationRunHistory = [
    entry,
    ...normalizeVerificationRunHistory(appState.verificationRunHistory).filter((item) => verificationRunHistoryKey(item) !== targetKey)
  ].slice(0, VERIFICATION_RUN_HISTORY_LIMIT);
  return entry;
}

function verificationRunCounts(value) {
  const entry = normalizeVerificationRunHistoryEntry(value);
  const selected = entry.checks.filter((check) => check.selected !== false);
  return {
    selected: selected.length,
    passed: selected.filter((check) => check.status === "passed").length,
    failed: selected.filter((check) => check.status === "failed").length,
    running: selected.filter((check) => check.status === "running").length,
    pending: selected.filter((check) => check.status === "pending").length
  };
}

function findVerificationRunHistoryEntry(runId) {
  const target = String(runId || "").trim();
  if (!target) return null;
  return normalizeVerificationRunHistory(appState.verificationRunHistory).find((entry) => entry.runId === target) || null;
}

function verificationRunHistoryForGroup(groupId, rootPath = "") {
  const normalizedGroupId = String(groupId || "").trim();
  const normalizedRootPath = String(rootPath || "").trim();
  return normalizeVerificationRunHistory(appState.verificationRunHistory).filter((entry) => (
    (!normalizedGroupId || entry.groupId === normalizedGroupId)
    && (!normalizedRootPath || entry.rootPath === normalizedRootPath)
  ));
}

function previousVerificationRunHistoryEntry(entry) {
  if (!entry) return null;
  return verificationRunHistoryForGroup(entry.groupId, entry.rootPath)
    .filter((item) => item.runId !== entry.runId)[0] || null;
}

function verificationRunDeltaSummary(currentEntry, previousEntry) {
  if (!currentEntry) {
    return "No verification snapshots captured yet.";
  }
  if (!previousEntry) {
    return "First recorded run for this verification surface.";
  }
  const previousChecks = new Map(
    previousEntry.checks
      .filter((check) => check.selected !== false)
      .map((check) => [check.id, check])
  );
  const changed = currentEntry.checks
    .filter((check) => check.selected !== false)
    .map((check) => {
      const previous = previousChecks.get(check.id);
      if (!previous) {
        return `${check.label} ${String(check.status || "pending").toUpperCase()} `;
      }
      if (previous.status === check.status) {
        return "";
      }
      return `${check.label}: ${String(previous.status || "pending").toUpperCase()} -> ${String(check.status || "pending").toUpperCase()} `;
    })
    .filter(Boolean);
  if (!changed.length) {
    return "No status change from the previous run.";
  }
  return changed.slice(0, 2).join(" | ") + (changed.length > 2 ? ` | +${changed.length - 2} more` : "");
}

function verificationRunHistoryFilterValue(slot) {
  return appState.verificationRunHistoryFilters && typeof appState.verificationRunHistoryFilters === "object"
    ? String(appState.verificationRunHistoryFilters[slot] || "all").trim() || "all"
    : "all";
}

function setVerificationRunHistoryFilter(slot, value) {
  if (slot !== "workflow" && slot !== "group" && slot !== "workspace") return;
  appState.verificationRunHistoryFilters = {
    ...appState.verificationRunHistoryFilters,
    [slot]: String(value || "all").trim() || "all"
  };
  renderPatchPlanPanel();
}

function resetVerificationRunHistoryFilters() {
  appState.verificationRunHistoryFilters = {
    workflow: "all",
    group: "all",
    workspace: "all"
  };
  renderPatchPlanPanel();
  showBanner("Verification history filters reset.", "ok");
}

function verificationRunHistoryOptions(history) {
  const workflowEntries = new Map();
  const groupEntries = new Map();
  const workspaceEntries = new Map();
  for (const entry of history) {
    const workflowId = normalizeWorkflowId(entry.workflowId);
    if (!workflowEntries.has(workflowId)) {
      workflowEntries.set(workflowId, (getWorkflow(workflowId) || {}).title || workflowId);
    }
    const groupId = String(entry.groupId || "").trim() || "ungrouped";
    if (!groupEntries.has(groupId)) {
      groupEntries.set(groupId, String(entry.groupTitle || groupId).trim() || groupId);
    }
    const workspaceRoot = String(entry.rootPath || "").trim();
    if (workspaceRoot && !workspaceEntries.has(workspaceRoot)) {
      workspaceEntries.set(workspaceRoot, String(entry.rootLabel || workspaceRoot));
    }
  }
  return {
    workflows: [
      { value: "all", label: "All workflows" },
      { value: "current", label: `Current workflow${getWorkflow(appState.workflowId) ? ` (${getWorkflow(appState.workflowId).title})` : ""} ` },
      ...Array.from(workflowEntries.entries())
        .sort((left, right) => left[1].localeCompare(right[1]))
        .map(([value, label]) => ({ value, label }))
    ],
    groups: [
      { value: "all", label: "All groups" },
      ...Array.from(groupEntries.entries())
        .sort((left, right) => left[1].localeCompare(right[1]))
        .map(([value, label]) => ({ value, label }))
    ],
    workspaces: [
      { value: "all", label: "All workspaces" },
      { value: "current", label: `Current workspace${appState.workspaceAttachment ? ` (${appState.workspaceAttachment.label || appState.workspaceAttachment.rootPath})` : ""} ` },
      ...Array.from(workspaceEntries.entries())
        .sort((left, right) => left[1].localeCompare(right[1]))
        .map(([value, label]) => ({ value, label }))
    ]
  };
}

function filteredVerificationRunHistory() {
  const history = normalizeVerificationRunHistory(appState.verificationRunHistory);
  const workflowFilter = verificationRunHistoryFilterValue("workflow");
  const groupFilter = verificationRunHistoryFilterValue("group");
  const workspaceFilter = verificationRunHistoryFilterValue("workspace");
  const currentWorkflowId = normalizeWorkflowId(appState.workflowId);
  const currentWorkspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  return history.filter((entry) => {
    if (workflowFilter === "current" && normalizeWorkflowId(entry.workflowId) !== currentWorkflowId) {
      return false;
    }
    if (workflowFilter !== "all" && workflowFilter !== "current" && normalizeWorkflowId(entry.workflowId) !== workflowFilter) {
      return false;
    }
    if (groupFilter !== "all" && String(entry.groupId || "").trim() !== groupFilter) {
      return false;
    }
    if (workspaceFilter === "current" && String(entry.rootPath || "").trim() !== currentWorkspaceRoot) {
      return false;
    }
    if (workspaceFilter !== "all" && workspaceFilter !== "current" && String(entry.rootPath || "").trim() !== workspaceFilter) {
      return false;
    }
    return true;
  });
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

function buildShippingPacketProvenance(options = {}) {
  const workspace = appState.workspaceAttachment;
  const sourceArtifact = appState.lastArtifact && String(appState.lastArtifact.content || "").trim()
    ? normalizeArtifactValue(appState.lastArtifact, {
      workflowId: appState.workflowId,
      outputMode: appState.outputMode
    })
    : null;
  const latestPacket = normalizeShippingPacketHistory(appState.shippingPacketHistory)[0] || null;
  const parentPacket = sourceArtifact && sourceArtifact.outputMode === "shipping_packet"
    ? sourceArtifact
    : latestPacket;
  const parentGeneration = parentPacket
    && parentPacket.provenance
    && parentPacket.provenance.lineage
    && Number.isFinite(Number(parentPacket.provenance.lineage.generation))
    ? Number(parentPacket.provenance.lineage.generation)
    : 0;
  const patchPlanContextProvenance = appState.patchPlan
    ? normalizePatchPlanContextProvenance(appState.patchPlan.provenance, {
      rootPath: workspace ? workspace.rootPath : "",
      contextPack: appState.contextPack,
      contextPackProfile: currentContextPackProfile()
    })
    : null;
  const contextProvenance = patchPlanContextProvenance || buildPatchPlanContextProvenance({
    rootPath: workspace ? workspace.rootPath : "",
    contextPack: appState.contextPack,
    contextPackProfile: currentContextPackProfile()
  });
  const patchPlan = patchPlanHasFiles() && appState.patchPlan
    ? {
      id: String(appState.patchPlan.id || "").trim(),
      generatedAt: String(appState.patchPlan.generatedAt || "").trim(),
      totalFiles: Number(appState.patchPlan.totalFiles || (Array.isArray(appState.patchPlan.files) ? appState.patchPlan.files.length : 0))
    }
    : null;
  const latestReleaseRun = verificationRunHistoryForGroup("release_cockpit", workspace ? workspace.rootPath : "")[0] || null;
  const previousReleaseRun = previousVerificationRunHistoryEntry(latestReleaseRun);
  const counts = latestReleaseRun ? verificationRunCounts(latestReleaseRun) : null;
  return normalizeArtifactProvenanceValue({
    workspaceRoot: workspace ? String(workspace.rootPath || "") : "",
    workspaceLabel: workspace ? String(workspace.label || "") : "",
    contextPack: contextProvenance && contextProvenance.contextPack ? contextProvenance.contextPack : null,
    contextPackProfile: contextProvenance && contextProvenance.contextPackProfile ? contextProvenance.contextPackProfile : null,
    sourceArtifact: sourceArtifact
      ? {
        title: String(sourceArtifact.title || "").trim(),
        outputMode: String(sourceArtifact.outputMode || "").trim(),
        generatedAt: String(sourceArtifact.generatedAt || "").trim()
      }
      : null,
    patchPlan,
    verification: latestReleaseRun
      ? {
        groupId: latestReleaseRun.groupId,
        runIds: [latestReleaseRun.runId],
        executedAt: latestReleaseRun.executedAt,
        previousRunId: previousReleaseRun ? previousReleaseRun.runId : "",
        ok: latestReleaseRun.ok === true,
        selectedCount: counts ? counts.selected : 0,
        passedCount: counts ? counts.passed : 0,
        failedCount: counts ? counts.failed : 0,
        pendingCount: counts ? counts.pending : 0,
        summary: verificationRunDeltaSummary(latestReleaseRun, previousReleaseRun)
      }
      : null,
    lineage: {
      packetId: String(options.packetId || "").trim(),
      parentPacketId: parentPacket ? String(parentPacket.id || "") : "",
      sourceArtifactId: sourceArtifact ? String(sourceArtifact.id || "") : "",
      generation: parentGeneration + 1
    }
  });
}

function buildShippingPacketContent(options = {}) {
  const releaseModel = getShippingCockpitModel();
  const generatedAt = String(options.generatedAt || new Date().toISOString());
  const workflow = getWorkflow(appState.workflowId);
  const workspace = appState.workspaceAttachment;
  const dockArtifact = appState.lastArtifact && String(appState.lastArtifact.content || "").trim()
    ? appState.lastArtifact
    : null;
  const patchPlan = appState.patchPlan;
  const selectedChecks = releaseModel.rows.filter((check) => check.selected !== false);
  const latestReleaseRun = verificationRunHistoryForGroup("release_cockpit", workspace ? workspace.rootPath : "")[0] || null;
  const previousReleaseRun = previousVerificationRunHistoryEntry(latestReleaseRun);
  const provenance = options.provenance || buildShippingPacketProvenance();
  const contextPack = provenance && provenance.contextPack ? provenance.contextPack : null;
  const contextPackProfile = provenance && provenance.contextPackProfile ? provenance.contextPackProfile : null;
  const blockers = Array.isArray(releaseModel.blockers) ? releaseModel.blockers : [];
  const decision = releaseModel.decision || (
    blockers.length
      ? "Blocked"
      : releaseModel.passed && releaseModel.pending === 0
        ? "Ready"
        : "Conditional"
  );
  const packetSummary = !blockers.length && releaseModel.passed && releaseModel.pending === 0
    ? "Selected Shipping checks passed. This packet captures the current ship decision, verification state, and next handoff actions."
    : releaseModel.summary;

  const lines = [
    "# Shipping Packet",
    "",
    `- Decision: ${decision} `,
    `- Workflow: ${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)} `,
    `- Workspace: ${workspace ? `${workspace.label} (${workspace.rootPath})` : "Not attached"} `,
    `- Context Pack: ${contextPack ? `${contextPack.name} | ${contextPack.fileCount} files${contextPack.builtAt ? ` | built ${contextPack.builtAt}` : ""}` : "Not captured"} `,
    `- Context Pack Profile: ${contextPackProfile ? `${contextPackProfile.name} | ${contextPackProfile.fileCount} files${contextPackProfile.savedAt ? ` | saved ${contextPackProfile.savedAt}` : ""}` : "Not captured"} `,
    `- Generated: ${generatedAt} `,
    `- Dock Artifact: ${dockArtifact ? `${dockArtifact.title || "Artifact"} | ${formatTimestampLabel(dockArtifact.generatedAt)}` : "Unavailable"} `,
    `- Patch Plan: ${patchPlanHasFiles() ? `${patchPlan.totalFiles || patchPlan.files.length} files loaded` : "No patch plan loaded"} `,
    `- Evidence Bundle: ${hasWorkspaceAttachment() || appState.chat.length ? "Ready to export" : "Unavailable"} `,
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
    const exit = check.exitCode != null ? ` | exit ${check.exitCode} ` : "";
    lines.push(`- [${state}] ${check.label} -> ${check.commandLabel}${duration}${exit} `);
  }
  lines.push("");

  lines.push("## Verification Provenance");
  if (!latestReleaseRun) {
    lines.push("- No Shipping verification snapshot has been captured yet.");
  } else {
    const counts = verificationRunCounts(latestReleaseRun);
    lines.push(`- Snapshot ID: ${latestReleaseRun.runId} `);
    lines.push(`- Executed: ${latestReleaseRun.executedAt} `);
    lines.push(`- Outcome: ${counts.passed}/${counts.selected} passed${counts.failed ? ` | ${counts.failed} failed` : ""
      }${counts.pending ? ` | ${counts.pending} pending` : ""} `);
    lines.push(`- Delta: ${verificationRunDeltaSummary(latestReleaseRun, previousReleaseRun)} `);
  }
  if (contextPack) {
    lines.push(`- Context Pack Snapshot: ${contextPack.name || "Unnamed pack"}${contextPack.fileCount ? ` | ${contextPack.fileCount} files` : ""}${contextPack.builtAt ? ` | built ${contextPack.builtAt}` : ""} `);
    if (Array.isArray(contextPack.filePaths) && contextPack.filePaths.length) {
      lines.push(`- Context Pack Files: ${contextPack.filePaths.slice(0, 4).join(", ")}${contextPack.filePaths.length > 4 ? ` (+${contextPack.filePaths.length - 4} more)` : ""} `);
    }
  } else {
    lines.push("- Context Pack Snapshot: Not captured");
  }
  if (contextPackProfile) {
    lines.push(`- Context Pack Profile: ${contextPackProfile.name || "Unnamed profile"}${contextPackProfile.fileCount ? ` | ${contextPackProfile.fileCount} files` : ""}${contextPackProfile.savedAt ? ` | saved ${contextPackProfile.savedAt}` : ""} `);
  } else {
    lines.push("- Context Pack Profile: Not captured");
  }
  if (provenance && provenance.sourceArtifact && provenance.sourceArtifact.title) {
    lines.push(`- Source Artifact: ${provenance.sourceArtifact.title}${provenance.sourceArtifact.generatedAt ? ` | ${formatTimestampLabel(provenance.sourceArtifact.generatedAt)}` : ""} `);
  }
  if (provenance && provenance.patchPlan && provenance.patchPlan.totalFiles) {
    lines.push(`- Patch Plan: ${provenance.patchPlan.totalFiles} files${provenance.patchPlan.id ? ` | ${provenance.patchPlan.id}` : ""} `);
  }
  if (provenance && provenance.lineage && provenance.lineage.packetId) {
    lines.push(`- Packet ID: ${provenance.lineage.packetId} `);
    if (provenance.lineage.parentPacketId) {
      lines.push(`- Parent Packet: ${provenance.lineage.parentPacketId} `);
    }
    if (provenance.lineage.sourceArtifactId) {
      lines.push(`- Source Artifact ID: ${provenance.lineage.sourceArtifactId} `);
    }
    if (provenance.lineage.generation) {
      lines.push(`- Packet Revision: ${provenance.lineage.generation} `);
    }
  }
  lines.push("");

  lines.push("## Assets");
  lines.push(`- Store screenshots: ${releaseModel.rows.some((check) => check.id === "store_screenshots" && check.status === "passed") ? "Refreshed in this run" : "Use the selected release check or top-level pipeline to refresh"} `);
  lines.push(`- Evidence bundle: ${hasWorkspaceAttachment() || appState.chat.length ? "Can be exported from the Artifact Dock or Shipping Cockpit" : "Unavailable until workflow state exists"} `);
  lines.push(`- Session snapshot: ${Object.keys(appState.sessionsMeta || {}).length ? "Existing sessions available for handoff" : "No saved session snapshots yet"} `);
  lines.push("");

  lines.push("## Blockers");
  if (!blockers.length) {
    lines.push("- None.");
  } else {
    for (const blocker of blockers) {
      lines.push(`- ${blocker} `);
    }
  }
  lines.push("");

  lines.push("## Next Actions");
  if (!selectedChecks.length) {
    lines.push("- Select at least one Shipping verification check and rerun the cockpit.");
  } else if (releaseModel.failed) {
    lines.push("- Review failed verification output and rerun only the affected checks.");
  } else if (releaseModel.pending > 0) {
    lines.push("- Run the remaining selected Shipping checks before calling the packet ready.");
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
  const fenced = text.match(/```(?: json) ?\s * ([\s\S] *?)```/i);
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
  const hunks = Array.isArray(file.hunks)
    ? file.hunks.map((hunk, hunkIndex) => normalizePatchPlanHunkEntry(hunk, hunkIndex))
    : [];
  const selected = hunks.length
    ? hunks.some((hunk) => hunk.selected !== false)
    : file.selected !== false;
  return {
    fileId: String(file.fileId || `${index + 1} -${slugifySegment(relativePath, `file-${index + 1}`)} `),
    path: relativePath,
    status: String(file.status || "").trim(),
    rationale: String(file.rationale || "").trim(),
    content: String(file.content || ""),
    originalContent: String(file.originalContent || ""),
    diffText: String(file.diffText || ""),
    bytes: Number.isFinite(Number(file.bytes)) ? Number(file.bytes) : 0,
    lines: Number.isFinite(Number(file.lines)) ? Number(file.lines) : 0,
    selected,
    appliedAt: String(file.appliedAt || ""),
    absolutePath: String(file.absolutePath || ""),
    hunks
  };
}

function normalizePatchPlanHunkEntry(hunk, index) {
  if (!hunk || typeof hunk !== "object" || Array.isArray(hunk)) {
    throw new Error(`Patch plan hunk ${index + 1} is invalid.`);
  }
  const lines = Array.isArray(hunk.lines)
    ? hunk.lines.map((line, lineIndex) => {
      if (!line || typeof line !== "object" || Array.isArray(line)) {
        throw new Error(`Patch plan hunk ${index + 1} line ${lineIndex + 1} is invalid.`);
      }
      const type = String(line.type || "").trim().toLowerCase();
      if (type !== "context" && type !== "remove" && type !== "add") {
        throw new Error(`Patch plan hunk ${index + 1} line ${lineIndex + 1} type is invalid.`);
      }
      return {
        type,
        text: String(line.text == null ? "" : line.text)
      };
    })
    : [];
  return {
    hunkId: String(hunk.hunkId || `hunk - ${index + 1} `),
    oldStart: Number.isFinite(Number(hunk.oldStart)) ? Number(hunk.oldStart) : 1,
    oldCount: Number.isFinite(Number(hunk.oldCount)) ? Number(hunk.oldCount) : 0,
    newStart: Number.isFinite(Number(hunk.newStart)) ? Number(hunk.newStart) : 1,
    newCount: Number.isFinite(Number(hunk.newCount)) ? Number(hunk.newCount) : 0,
    addedCount: Number.isFinite(Number(hunk.addedCount)) ? Number(hunk.addedCount) : lines.filter((line) => line.type === "add").length,
    removedCount: Number.isFinite(Number(hunk.removedCount)) ? Number(hunk.removedCount) : lines.filter((line) => line.type === "remove").length,
    selected: hunk.selected !== false,
    appliedAt: String(hunk.appliedAt || ""),
    lines
  };
}

function normalizePatchPlanValue(value, options = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const workflowId = normalizeWorkflowId(source.workflowId || options.workflowId || appState.workflowId);
  const generatedAt = String(source.generatedAt || options.generatedAt || new Date().toISOString());
  const rootPath = String(source.rootPath || options.rootPath || "").trim();
  const files = Array.isArray(source.files) ? source.files.map(normalizePatchPlanFileEntry) : [];
  if (!files.length) {
    throw new Error("Patch plan must include at least one file.");
  }
  const selectedFileIds = files.filter((file) => file.selected !== false).map((file) => file.fileId);
  return {
    id: String(source.id || `patch - plan - ${generatedAt} `),
    workflowId,
    outputMode: "patch_plan",
    title: String(source.title || `${(getWorkflow(workflowId) || {}).title || "Workflow"} Patch Plan`).trim(),
    summary: String(source.summary || ""),
    generatedAt,
    rootPath,
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
    provenance: normalizePatchPlanContextProvenance(source.provenance, {
      rootPath,
      contextPack: options.contextPack,
      contextPackProfile: options.contextPackProfile
    }),
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
  const groupId = String(value.groupId || "").trim() || `group - ${index + 1} `;
  const groupTitle = String(value.groupTitle || value.title || groupId).trim() || `Patch Group ${index + 1} `;
  const checks = Array.isArray(value.checks)
    ? value.checks.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const filePaths = Array.isArray(value.filePaths)
    ? value.filePaths.map((item) => normalizeDraftRelativePath(item)).filter(Boolean)
    : [];
  const promptLead = String(
    value.promptLead || `Verify the ${groupTitle.toLowerCase()} changes for safety, regression risk, and required next actions.`
  ).trim();
  const label = String(value.label || `Verify ${groupTitle} `).trim() || `Verify ${groupTitle} `;
  const detail = String(
    value.detail
    || `${(getWorkflow(workflowId) || {}).title || workflowId} shortcut | ${Math.max(filePaths.length, 1)} files | ${checks[0] || "Load recommended checks"} `
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
    id: String(source.id || `verification - plan - ${Date.now()} `),
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
  const shouldClearContextPack = Boolean(
    appState.contextPack && (
      (previousWorkspaceRoot && nextWorkspaceRoot && previousWorkspaceRoot !== nextWorkspaceRoot)
      || !contextPackMatchesWorkspaceAttachment(appState.contextPack, appState.workspaceAttachment)
    )
  );
  const shouldClearPatchPlan = Boolean(
    appState.patchPlan && (
      (previousWorkspaceRoot && nextWorkspaceRoot && previousWorkspaceRoot !== nextWorkspaceRoot)
      || patchPlanConflictsWithWorkspaceAttachment(appState.patchPlan, appState.workspaceAttachment)
    )
  );

  if (shouldClearContextPack) {
    appState.contextPack = null;
  }
  if (appState.activeContextPackProfileId && !currentContextPackProfile()) {
    appState.activeContextPackProfileId = "";
  }

  if (shouldClearPatchPlan) {
    resetPatchPlanState();
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

function getShippingCockpitPlan() {
  if (
    !appState.verificationRunPlan
    || typeof appState.verificationRunPlan !== "object"
    || String(appState.verificationRunPlan.groupId || "").trim() !== "release_cockpit"
  ) {
    return null;
  }
  return appState.verificationRunPlan;
}

function isShippingCockpitEngaged(workflowId = appState.workflowId) {
  const normalizedWorkflowId = normalizeWorkflowId(workflowId);
  const workspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  return (
    normalizedWorkflowId === "shipping_audit"
    || Boolean(getShippingCockpitPlan())
    || hasShippingPacketArtifact()
    || normalizeShippingPacketHistory(appState.shippingPacketHistory).length > 0
    || verificationRunHistoryForGroup("release_cockpit", workspaceRoot).length > 0
  );
}

function getShippingCockpitCheckRows() {
  const plan = getShippingCockpitPlan();
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

function getShippingCockpitBlockers(options = {}) {
  const workflowId = normalizeWorkflowId(options.workflowId || appState.workflowId);
  const selected = Array.isArray(options.selected) ? options.selected : [];
  const failed = Number(options.failed || 0);
  const pending = Number(options.pending || 0);
  const recommendedProfile = options.recommendedProfile === undefined ? recommendedContextPackProfile(workflowId) : options.recommendedProfile;
  const recommendedProfileLoaded = Boolean(
    options.recommendedProfileLoaded === undefined
      ? recommendedProfile && contextPackProfileMatchesLoadedPack(recommendedProfile)
      : options.recommendedProfileLoaded
  );
  const recommendedProfileStatus = options.recommendedProfileStatus || contextProfileStatusForCard(recommendedProfile);
  const engaged = options.engaged === undefined ? isShippingCockpitEngaged(workflowId) : Boolean(options.engaged);
  const blockers = [];

  if (!engaged) {
    return blockers;
  }

  if (!hasWorkspaceAttachment()) {
    blockers.push("No workspace attached.");
  }
  if (!hasArtifactContent()) {
    blockers.push("No dock artifact is loaded in the Artifact Dock.");
  }
  if (!getShippingCockpitPlan()) {
    blockers.push("Shipping Cockpit checks have not been staged yet.");
  }
  if (!selected.length) {
    blockers.push("No Shipping verification checks are selected.");
  }
  if (failed > 0) {
    blockers.push(`${failed} Shipping verification ${failed === 1 ? "check has" : "checks have"} failed.`);
  } else if (selected.length && pending > 0) {
    blockers.push(`${pending} selected Shipping verification ${pending === 1 ? "check is" : "checks are"} still pending.`);
  }
  if (patchPlanHasFiles() && unappliedSelectedPatchPlanFiles().length > 0) {
    blockers.push(`${unappliedSelectedPatchPlanFiles().length} selected patch - plan ${unappliedSelectedPatchPlanFiles().length === 1 ? "file is" : "files are"} still unapplied.`);
  }

  if (workflowId === "shipping_audit") {
    if (!recommendedProfile) {
      blockers.push("No workflow-linked release context profile is saved.");
    } else if (recommendedProfileStatus.stale) {
      blockers.push(`${recommendedProfile.name} is stale and should be refreshed.`);
    } else if (!recommendedProfileLoaded) {
      blockers.push(`${recommendedProfile.name} is recommended for Shipping work but is not loaded.`);
    }
  }

  return blockers;
}

function getShippingCockpitModel() {
  const workflow = getWorkflow(appState.workflowId);
  const workflowId = normalizeWorkflowId(appState.workflowId);
  const engaged = isShippingCockpitEngaged(workflowId);
  const rows = getShippingCockpitCheckRows();
  const selected = rows.filter((check) => check.selected !== false);
  const passed = selected.filter((check) => check.status === "passed").length;
  const failed = selected.filter((check) => check.status === "failed").length;
  const running = selected.filter((check) => check.status === "running").length;
  const pending = selected.filter((check) => check.status === "pending").length;
  const workflowTitle = (workflow && workflow.title) || "Workflow";
  const packetReady = hasShippingPacketArtifact();
  const recommendedProfile = recommendedContextPackProfile();
  const recommendedProfileLoaded = recommendedProfile && contextPackProfileMatchesLoadedPack(recommendedProfile);
  const recommendedProfileStatus = contextProfileStatusForCard(recommendedProfile);
  const autoLoadRecommended = Boolean(appState.settings && appState.settings.autoLoadRecommendedContextProfile);
  const blockers = getShippingCockpitBlockers({
    workflowId,
    engaged,
    selected,
    failed,
    pending,
    recommendedProfile,
    recommendedProfileLoaded,
    recommendedProfileStatus
  });
  let title = "Stage Shipping verification";
  let summary = `Queue lint, founder e2e, and store screenshot refresh against ${hasWorkspaceAttachment() ? (appState.workspaceAttachment.label || "the attached workspace") : "one attached workspace"} before you call the shipping packet ready.`;
  let tone = "guard";

  if (!engaged) {
    title = "Shipping lane idle";
    summary = "Use this lane when you are ready to run lint, founder e2e, screenshots, and a shipping packet. It stays quiet during bridge setup, bug triage, and normal chat work.";
    tone = "guard";
  } else if (!hasWorkspaceAttachment()) {
    title = "Attach a workspace to open the Shipping Cockpit";
    summary = "Shipping verification needs one attached local root so checks, evidence, and screenshots stay scoped to the same project.";
    tone = "warn";
  } else if (!getShippingCockpitPlan()) {
    title = "Stage Shipping verification";
    summary = `Use the cockpit to queue the guarded Shipping lane for ${workflowTitle}.Keep expensive checks explicit and local.`;
    tone = normalizeWorkflowId(appState.workflowId) === "shipping_audit" ? "ok" : "guard";
  } else if (running > 0) {
    title = "Shipping verification running";
    summary = `${running} ${running === 1 ? "check is" : "checks are"} still running against ${appState.workspaceAttachment.label || "the attached workspace"}.`;
    tone = "ok";
  } else if (failed > 0) {
    title = "Shipping verification has failures";
    summary = `${failed} ${failed === 1 ? "selected check failed" : "selected checks failed"}. Inspect output, tighten the Shipping surface, and rerun only what changed.`;
    tone = "warn";
  } else if (passed > 0 && pending === 0 && packetReady) {
    title = "Shipping Packet ready";
    summary = "The shipping packet is docked with a clean selected verification pass. Export evidence and handoff while the state is fresh.";
    tone = "good";
  } else if (passed > 0 && pending === 0) {
    title = "Build the shipping packet";
    summary = "All selected Shipping checks passed. Build the shipping packet, then export evidence while the verification state is fresh.";
    tone = "good";
  } else if (passed > 0) {
    title = "Shipping verification partially complete";
    summary = `${passed} ${passed === 1 ? "selected check has" : "selected checks have"} passed.Run the remaining checks only if the current surface still needs that proof.`;
    tone = "ok";
  }

  if (blockers.length) {
    title = "Shipping blockers active";
    summary = `${blockers.length} ship ${blockers.length === 1 ? "blocker remains" : "blockers remain"}. Clear them before you trust or export the Shipping lane.`;
    tone = "warn";
  }

  const checklist = !engaged
    ? [
      "Stay in diagnostics or workflow mode until you are ready to verify a release.",
      "Attach a workspace only when you want lint, founder e2e, screenshots, and a shipping packet in one lane.",
      "When Shipping work starts, stage the checks explicitly and keep the packet/evidence current."
    ]
    : !hasWorkspaceAttachment()
      ? [
        "Attach one local workspace root before staging Shipping checks.",
        "Keep Shipping verification local-only and explicit.",
        "Export evidence only after the workspace and checks align."
      ]
      : !getShippingCockpitPlan()
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
    checklist.push(`Shipping Packet artifact: ${appState.lastArtifact.title || "Shipping Packet"} is ready in the dock.`);
  } else if (passed > 0 && pending === 0 && !failed) {
    checklist.push("Build the shipping packet now so the ship decision, verification state, and blockers are captured in one dock artifact.");
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
    checklist,
    blockers,
    decision: blockers.length
      ? "Blocked"
      : passed > 0 && pending === 0 && !failed
        ? "Ready"
        : engaged
          ? "Conditional"
          : "Idle",
    engaged,
    autoLoadRecommended,
    recommendedProfile,
    recommendedProfileLoaded,
    recommendedProfileStatus
  };
}

function workflowPromptLoaded() {
  const workflow = getWorkflow(appState.workflowId);
  if (!workflow || !el.promptInput) return;
  setPromptEditorValue(workflowPromptTemplate(workflow), { focus: true });
  showBanner(`Workflow prompt loaded: ${workflow.title} `, "ok");
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
  const releaseModel = getShippingCockpitModel();
  const releasePlan = getShippingCockpitPlan();
  const contextPack = hasContextPack() ? appState.contextPack : null;
  const recommendedProfile = recommendedContextPackProfile();
  const recommendedLoaded = recommendedProfile && contextPackProfileMatchesLoadedPack(recommendedProfile);
  const recommendedStatus = contextProfileStatusForCard(recommendedProfile);
  const autoLoadRecommended = Boolean(appState.settings && appState.settings.autoLoadRecommendedContextProfile);
  const selectedChecks = releaseModel.rows.filter((check) => check.selected !== false);
  const passedChecks = selectedChecks.filter((check) => check.status === "passed").length;
  const failedChecks = selectedChecks.filter((check) => check.status === "failed").length;
  const pendingChecks = selectedChecks.filter((check) => check.status === "pending").length;
  const patchSelected = selectedPatchPlanFiles().length;
  const patchPending = unappliedSelectedPatchPlanFiles().length;
  const latestPacket = Array.isArray(appState.shippingPacketHistory) && appState.shippingPacketHistory.length
    ? appState.shippingPacketHistory[0]
    : null;

  return [
    {
      eyebrow: "Workflow Lane",
      title: (workflow && workflow.title) || "Workflow",
      summary: outputMode
        ? `${outputMode.label} contract is active.Keep the next response structured and ready for promotion into local work.`
        : "Load a workflow and keep the next response structured.",
      tone: normalizeWorkflowId(appState.workflowId) === "shipping_audit" ? "good" : "ok",
      scopes: [
        { label: "Structured output", tone: "read" },
        { label: hasArtifactContent() ? "Artifact staged" : "No artifact", tone: hasArtifactContent() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Output Mode", value: (outputMode && outputMode.label) || "Unassigned", tone: "ok" },
        { label: "Chat Turns", value: `${Array.isArray(appState.chat) ? appState.chat.length : 0} `, tone: "guard" },
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
        ? "One local root is attached for context, exports, and guarded apply. Keep evidence, patch plans, and Shipping checks scoped here."
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
      eyebrow: "Context Lane",
      title: recommendedProfile
        ? recommendedProfile.name
        : contextPack
          ? contextPack.name
          : "Link workflow context",
      summary: !hasWorkspaceAttachment()
        ? "Attach one workspace before linking workflow-aware repo memory."
        : !recommendedProfile
          ? `No saved profile is linked to ${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)} yet.Save one from this workflow to make the context lane actionable.`
          : recommendedLoaded
            ? `${recommendedProfile.name} is ${recommendedStatus.state.toLowerCase()} and feeding ${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)}.${autoLoadRecommended ? " Auto-load stays armed on workflow switch." : " Auto-load is off, so switches only recommend it."} `
            : `${recommendedProfile.name} is the recommended repo memory for ${(workflow && workflow.title) || normalizeWorkflowId(appState.workflowId)}.${recommendedStatus.known ? ` It is currently ${recommendedStatus.state.toLowerCase()}.` : ""} Load it before you stage the next artifact or patch.`,
      tone: !hasWorkspaceAttachment()
        ? "warn"
        : !recommendedProfile
          ? "warn"
          : recommendedStatus.stale
            ? "warn"
            : recommendedLoaded
              ? "good"
              : "ok",
      scopes: [
        { label: autoLoadRecommended ? "Auto-load on" : "Auto-load off", tone: autoLoadRecommended ? "good" : "guard" },
        { label: recommendedStatus.state, tone: recommendedStatus.tone }
      ],
      metrics: [
        { label: "Current Pack", value: contextPack ? contextPack.name : "None", tone: contextPack ? "ok" : "warn" },
        { label: "Recommended", value: recommendedProfile ? recommendedProfile.name : "Unlinked", tone: recommendedProfile ? "good" : "warn" },
        { label: "Profile State", value: recommendedLoaded ? "Loaded" : recommendedProfile ? "Not loaded" : "Pending", tone: recommendedLoaded ? "good" : (recommendedProfile ? "guard" : "warn") }
      ],
      actionLabel: !hasWorkspaceAttachment()
        ? "Attach Workspace"
        : !recommendedProfile
          ? "Suggest Files"
          : recommendedStatus.stale
            ? "Refresh Profile"
            : recommendedLoaded
              ? "Refresh Profile"
              : "Load Recommended",
      actionClass: !hasWorkspaceAttachment() || !recommendedProfile ? "btn-secondary" : "btn-primary",
      action: () => {
        if (!hasWorkspaceAttachment()) {
          return attachWorkspaceFromDialog();
        }
        if (!recommendedProfile) {
          return suggestContextPackFiles();
        }
        if (recommendedStatus.stale || recommendedLoaded) {
          return refreshContextPackProfile(recommendedProfile.id);
        }
        return loadContextPackProfile(recommendedProfile.id);
      }
    },
    {
      eyebrow: "Apply Surface",
      title: patchPlanHasFiles() ? "Patch + Apply Deck Ready" : "Promotion Surface",
      summary: patchPlanHasFiles()
        ? `${patchPending} selected ${patchPending === 1 ? "file is" : "files are"} still unapplied.Review the plan or push a guarded write through the workspace deck.`
        : hasArtifactContent()
          ? "The latest artifact can be promoted into a patch plan, markdown report, or manual diff draft."
          : "Generate an artifact first, then move into preview-first local work.",
      tone: patchPlanHasFiles() ? (patchPending > 0 ? "ok" : "good") : (hasArtifactContent() ? "guard" : "warn"),
      scopes: [
        { label: "Preview first", tone: "read" },
        { label: hasWorkspaceActionPreview() ? "Write preview loaded" : "No preview", tone: hasWorkspaceActionPreview() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Patch Files", value: patchPlanHasFiles() ? `${appState.patchPlan.totalFiles || appState.patchPlan.files.length} ` : "0", tone: patchPlanHasFiles() ? "ok" : "warn" },
        { label: "Selected", value: `${patchSelected} `, tone: patchSelected ? "good" : "guard" },
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
      eyebrow: "Shipping lane",
      title: releaseModel.title,
      summary: `${releaseModel.summary} Packet ledger: ${Array.isArray(appState.shippingPacketHistory) ? appState.shippingPacketHistory.length : 0} local ${(Array.isArray(appState.shippingPacketHistory) ? appState.shippingPacketHistory.length : 0) === 1 ? "snapshot" : "snapshots"} ready.`,
      tone: releaseModel.tone,
      scopes: [
        { label: "Verification scoped", tone: "read" },
        { label: hasShippingPacketArtifact() ? "Packet in dock" : "Packet pending", tone: hasShippingPacketArtifact() ? "good" : "warn" }
      ],
      metrics: [
        { label: "Selected Checks", value: `${selectedChecks.length} `, tone: selectedChecks.length ? "ok" : "warn" },
        { label: "Passed / Failed", value: `${passedChecks} / ${failedChecks}`, tone: failedChecks ? "warn" : (passedChecks ? "good" : "guard") },
        { label: "Packet Ledger", value: latestPacket ? formatTimestampLabel(latestPacket.generatedAt) : "Empty", tone: latestPacket ? "good" : "warn" }
      ],
      actionLabel: hasShippingPacketArtifact()
        ? "Export Release Evidence"
        : releasePlan
          ? (failedChecks > 0 || pendingChecks > 0 ? "Run Shipping checks" : "Build Shipping Packet")
          : "Stage Shipping checks",
      actionClass: hasShippingPacketArtifact() ? "btn-secondary" : "btn-primary",
      action: () => {
        if (hasShippingPacketArtifact()) {
          return exportEvidenceBundle();
        }
        if (!releasePlan) {
          stageShippingCockpit();
          return Promise.resolve();
        }
        if (failedChecks > 0 || pendingChecks > 0) {
          return runShippingCockpitChecks();
        }
        return buildShippingPacketArtifact();
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
    actions.className = "mission-card-actions row row-wrap action-grid";
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
  const resolved = normalizeChatOpsTrayId(nextTray);
  appState.chatOpsTray = normalizeChatOpsTrayId(options.toggle && appState.chatOpsTray === resolved ? "none" : resolved);
  renderChatOpsTrays();
  persistOperatorLayoutPreferences();
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

function setPerformanceTray(nextTray, options = {}) {
  const resolved = normalizePerformanceTrayId(nextTray);
  appState.performanceTray = normalizePerformanceTrayId(options.toggle && appState.performanceTray === resolved ? "none" : resolved);
  appState.systemSurface = "performance";
  renderPerformanceTrays();
  renderSystemNavigation();
  persistOperatorLayoutPreferences();
}

function setRuntimeOutputView(nextView) {
  appState.performanceOutputView = normalizeRuntimeOutputViewId(nextView);
  renderPerformanceTrays();
  persistOperatorLayoutPreferences();
}

function renderPerformanceTrays() {
  const trayMap = [
    { id: "diagnostics", button: el.performanceDiagnosticsTrayBtn, panel: el.performanceDiagnosticsTray },
    { id: "trace", button: el.performanceTraceTrayBtn, panel: el.performanceTraceTray },
    { id: "outputs", button: el.performanceOutputTrayBtn, panel: el.performanceOutputTray }
  ];
  for (const tray of trayMap) {
    const isActive = appState.performanceTray === tray.id;
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
    { id: "audit", button: el.performanceAuditOutputBtn, panel: el.performanceAuditOutputPanel },
    { id: "logs", button: el.performanceLogsOutputBtn, panel: el.performanceLogsOutputPanel },
    { id: "chat", button: el.performanceChatLogsOutputBtn, panel: el.performanceChatLogsOutputPanel }
  ];
  for (const output of outputMap) {
    const isActive = appState.performanceOutputView === output.id;
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
  const resolved = normalizeIntelTrayId(nextTray);
  appState.intelTray = normalizeIntelTrayId(options.toggle && appState.intelTray === resolved ? "none" : resolved);
  renderIntelSurface();
  persistOperatorLayoutPreferences();
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
  const contextPack = hasContextPack() ? appState.contextPack : null;
  const releaseModel = getShippingCockpitModel();
  const patchGroups = patchPlanHasFiles() ? collectPatchPlanGroups(appState.patchPlan) : [];
  const verificationState = describeVerificationPlanState();
  const packetCount = Array.isArray(appState.shippingPacketHistory) ? appState.shippingPacketHistory.length : 0;
  const activeArtifact = appState.lastArtifact && appState.lastArtifact.title
    ? `${appState.lastArtifact.title} @ ${formatTimestampLabel(appState.lastArtifact.generatedAt)}`
    : "No dock artifact";

  let focus = `${(workflow && workflow.title) || "Workflow"} is active with ${(outputMode && outputMode.label) || "structured"} output. ${activeArtifact}.`;
  if (patchPlanHasFiles()) {
    focus = `${(workflow && workflow.title) || "Workflow"} is carrying ${(appState.patchPlan.files || []).length} staged patch files across ${patchGroups.length || 1} grouped review surfaces.`;
  } else if (!hasArtifactContent()) {
    focus = `${(workflow && workflow.title) || "Workflow"} is active. Generate the next artifact before you promote it into patch, verification, or Shipping work.`;
  }

  let capability = `${workspaceLabel}. `;
  if (!hasWorkspaceAttachment()) {
    capability += "Attach one local root to unlock guarded apply, evidence export, and Shipping verification.";
  } else if (!contextPack) {
    capability += "No context pack is loaded yet, so workflow prompts are still relying on workspace signals instead of selected project memory.";
  } else if (patchPlanHasFiles()) {
    capability += `${contextPack.entries.length} context files loaded. ${unappliedSelectedPatchPlanFiles().length} selected files still need explicit apply. ${verificationState.summary}`;
  } else if (hasArtifactContent()) {
    capability += `${contextPack.entries.length} context files loaded. Artifact and evidence surfaces are ready, but no structured patch review is staged yet.`;
  } else {
    capability += `${contextPack.entries.length} context files loaded, but no artifact or patch surface is staged yet.`;
  }

  let nextAction = "Load a workflow prompt and produce the next artifact.";
  if (!hasWorkspaceAttachment()) {
    nextAction = "Attach one local workspace root so context, apply, and Shipping checks stay scoped to the same project.";
  } else if (!hasArtifactContent()) {
    nextAction = "Generate a structured artifact from the active workflow before opening patch or Shipping lanes.";
  } else if (hasWorkspaceAttachment() && !contextPack) {
    nextAction = "Build a context pack from the local repo files so workflow prompts carry trusted project memory instead of only workspace signals.";
  } else if (patchPlanHasFiles() && !appState.verificationRunPlan) {
    nextAction = "Stage verification checks from the patch group you trust before applying the selected files.";
  } else if (appState.verificationRunPlan && verificationState.tone !== "good") {
    nextAction = "Run the selected verification checks or narrow the plan to the exact surface that changed.";
  } else if (releaseModel.selected.length && releaseModel.pending === 0 && !releaseModel.failed && !hasShippingPacketArtifact()) {
    nextAction = "Build the shipping packet now so the current verification state and blockers are captured in one dock artifact.";
  } else if (hasShippingPacketArtifact()) {
    nextAction = "Export evidence or save a handoff snapshot while the current shipping packet is still the active source of truth.";
  }

  const hints = [
    `${(workflow && workflow.title) || "Workflow"} is the active operator lane.${outputMode ? ` Output contract: ${outputMode.label}.` : ""}`,
    hasWorkspaceAttachment()
      ? `${workspaceLabel} is attached with ${Array.isArray(appState.workspaceAttachment.signals) && appState.workspaceAttachment.signals.length ? appState.workspaceAttachment.signals.join(", ") : "no detected repo signals"}.`
      : "No workspace is attached. Keep write, verification, and release actions blocked until one local root is selected.",
    contextPack
      ? `${contextPack.name} is loaded with ${contextPack.entries.length} file${contextPack.entries.length === 1 ? "" : "s"}: ${contextPack.filePaths.join(", ")}.`
      : "No context pack is loaded. Build one from selected repo files to ground the next workflow prompt locally.",
    patchPlanHasFiles()
      ? `${(appState.patchPlan.files || []).length} patch files are staged. ${unappliedSelectedPatchPlanFiles().length} selected files still require explicit apply.`
      : "No patch review is staged yet. Use the dock artifact or workflow output to promote one into local review.",
    verificationState.detail,
    hasShippingPacketArtifact()
      ? `Shipping Packet history holds ${packetCount} ${packetCount === 1 ? "snapshot" : "snapshots"} for the current workspace.`
      : "Shipping Packet history is empty. Build a packet only after the selected checks match the intended ship surface."
  ];

  const starterActions = [];
  if (appState.projectIntelligence && Array.isArray(appState.projectIntelligence.rankedActions)) {
    for (const action of appState.projectIntelligence.rankedActions) {
      starterActions.push(action);
    }
  } else if (hasWorkspaceAttachment()) {
    const signals = new Set(Array.isArray(appState.workspaceAttachment.signals) ? appState.workspaceAttachment.signals : []);
    if (signals.has("node") || signals.has("npm")) {
      starterActions.push({ label: "Audit package.json", prompt: "Perform a deep audit of the package.json and identify any outdated or unvouched dependencies." });
      starterActions.push({ label: "Verify local build", prompt: "Analyze the build scripts and verify that the local environment is ready for a production-grade build." });
    }
    if (signals.has("git")) {
      starterActions.push({ label: "Review uncommitted", prompt: "Summarize all uncommitted changes in the current workspace and evaluate their impact on system stability." });
    }
    if (signals.has("electron")) {
      starterActions.push({ label: "Verify main/preload", prompt: "Audit the communication bridge between the Electron main process and preload script for any security leaks." });
    }
    if (starterActions.length === 0) {
      starterActions.push({ label: "Discover signals", prompt: "Scan the workspace root for any build, dependency, or version control signals that can be used to ground future prompts." });
    }
  }

  return {
    focus,
    capability,
    nextAction,
    hints,
    starterActions
  };
}

function renderHeroSpotlight() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const brief = buildIntelBriefModel();
  const liveProfile = liveBridgeProfile() || currentBridgeProfile();
  const provider = getBridgeProvider(liveProfile ? liveProfile.provider : "ollama");
  const bridge = describeLlmStatus(appState.llmStatus);
  const workspaceLabel = hasWorkspaceAttachment()
    ? String(appState.workspaceAttachment.label || "Attached workspace")
    : "No workspace attached";
  const providerLabel = liveProfile && liveProfile.name
    ? String(liveProfile.name)
    : String(provider.label || "Local bridge");

  if (el.heroWorkflowBadge) {
    el.heroWorkflowBadge.textContent = (workflow && workflow.title) || "Workflow";
  }
  if (el.heroProviderBadge) {
    const providerParts = [
      offlineModeEnabled() ? "Offline Mode" : (provider.remote ? "Hosted Lane" : "Local Lane")
    ];
    if (outputMode && outputMode.label) {
      providerParts.push(outputMode.label);
    }
    el.heroProviderBadge.textContent = providerParts.join(" · ");
  }
  if (el.heroWorkflowSummaryText) {
    const summary = [
      `${(workflow && workflow.title) || "Workflow"} is active with ${(outputMode && outputMode.label) || "structured"} output.`,
      bridge.short,
      hasWorkspaceAttachment()
        ? `Vouching for ${workspaceLabel}. Project signals are grounded.`
        : "Attach one workspace before you move into apply or Shipping lanes."
    ].join(" ");
    el.heroWorkflowSummaryText.textContent = truncateInlineText(summary, 186);
  }
  if (el.heroFocusSummaryText) {
    el.heroFocusSummaryText.textContent = truncateInlineText(`${providerLabel}. ${brief.nextAction}`, 210);
  }
}

function getIntelKnowledgeEntries() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const releaseModel = getShippingCockpitModel();
  const verificationState = describeVerificationPlanState();
  const patchGroups = patchPlanHasFiles() ? collectPatchPlanGroups(appState.patchPlan) : [];
  const contextPack = hasContextPack() ? appState.contextPack : null;
  const entries = [
    {
      title: "Workflow Surface",
      tone: normalizeWorkflowId(appState.workflowId) === "shipping_audit" ? "good" : "ok",
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
        : "Attach one local root before applying edits, exporting evidence, or running Shipping checks."
    },
    {
      title: "Context Pack",
      tone: contextPack ? "good" : "guard",
      state: contextPack ? `${contextPack.entries.length} local file${contextPack.entries.length === 1 ? "" : "s"}` : "No context pack",
      note: contextPack
        ? `${contextPack.name} | ${contextPack.filePaths.join(", ")}`
        : "Build one from README, package metadata, or selected docs so workflow prompts keep trusted repo memory."
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
      title: "Shipping Cockpit",
      tone: releaseModel.failed ? "warn" : releaseModel.packetReady ? "good" : releaseModel.passed ? "ok" : "guard",
      state: hasShippingPacketArtifact()
        ? `${Array.isArray(appState.shippingPacketHistory) ? appState.shippingPacketHistory.length : 0} packet snapshots`
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
  const releaseModel = getShippingCockpitModel();
  const latestPacket = Array.isArray(appState.shippingPacketHistory) && appState.shippingPacketHistory.length
    ? appState.shippingPacketHistory[0]
    : null;
  return [
    {
      title: "Workspace Context",
      tone: hasWorkspaceAttachment() ? "good" : "warn",
      status: hasWorkspaceAttachment() ? "Attached" : "Detached",
      detail: hasWorkspaceAttachment()
        ? "Context, apply, and export surfaces are bounded to one local root."
        : "No local root is attached, so write and Shipping lanes should remain guarded.",
      target: hasWorkspaceAttachment()
        ? String(appState.workspaceAttachment.rootPath || appState.workspaceAttachment.label || "Attached workspace")
        : "Select one local workspace root",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: hasWorkspaceAttachment() ? "Context ready" : "Context blocked", tone: hasWorkspaceAttachment() ? "good" : "warn" }
      ]
    },
    {
      title: "Context Pack",
      tone: hasContextPack() ? "good" : "guard",
      status: hasContextPack() ? "Loaded" : "Not loaded",
      detail: hasContextPack()
        ? "Selected repo files are packaged as local memory and flow into workflow prompts, evidence, and Shipping surfaces."
        : "Workflow prompts can still run, but they are missing curated repo memory from trusted local files.",
      target: hasContextPack()
        ? `${appState.contextPack.name} | ${appState.contextPack.entries.length} files`
        : "Build from README.md, package.json, or selected docs",
      scopes: [
        { label: "Local files", tone: "local" },
        { label: hasContextPack() ? "Prompt ready" : "Prompt thin", tone: hasContextPack() ? "good" : "warn" }
      ]
    },
    {
      title: "Artifact Dock",
      tone: hasArtifactContent() ? "good" : "guard",
      status: hasArtifactContent() ? "Artifact staged" : "No artifact",
      detail: hasArtifactContent()
        ? "The active dock artifact can be promoted into patch review, verification, evidence, or shipping packet work."
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
      title: "Shipping Cockpit",
      tone: releaseModel.failed ? "warn" : releaseModel.packetReady ? "good" : releaseModel.passed ? "ok" : "guard",
      status: releaseModel.packetReady ? "Packet ready" : releaseModel.title,
      detail: releaseModel.summary,
      target: latestPacket && latestPacket.generatedAt
        ? `Latest packet ${formatTimestampLabel(latestPacket.generatedAt)}`
        : "No packet history yet",
      scopes: [
        { label: "Shipping checks", tone: "guard" },
        { label: "Evidence export", tone: "export" },
        { label: "Local only", tone: "local" }
      ]
    }
  ];
}

function renderIntelSurface() {
  if (el.intelActionHints && !el.intelActionHints.querySelector(".workspace-switcher")) {
    const switcherContainer = document.createElement("div");
    switcherContainer.className = "workspace-switcher-mount";
    el.intelActionHints.prepend(switcherContainer);
    window.workspaceSwitcher = new WorkspaceSwitcher(switcherContainer);
    window.workspaceSwitcher.init();
  }

  updateIntelBrief();
  renderThreadTaskStrip();

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
    const switcher = el.intelActionHints.querySelector(".workspace-switcher-mount");
    el.intelActionHints.innerHTML = "";
    if (switcher) {
      el.intelActionHints.appendChild(switcher);
    }
    if (Array.isArray(brief.starterActions) && brief.starterActions.length) {
      const group = document.createElement("div");
      group.className = "workspace-starter-actions";
      const label = document.createElement("div");
      label.className = "cluster-note";
      label.style.marginBottom = "8px";
      label.textContent = "Starter Actions (Workspace Grounded)";
      group.appendChild(label);

      // Phase 12A: Proposed Action Chains
      const currentWs = window.workspaceSwitcher ? window.workspaceSwitcher.activeWorkspace : null;
      if (currentWs) {
        renderChainProposals(group, currentWs.path);
      }

      if (brief.intelligence && brief.intelligence.lowConfidence) {
        const warning = document.createElement("div");
        warning.className = "workspace-action-hint";
        warning.style.borderColor = "rgba(255, 209, 102, 0.3)";
        warning.style.color = "#ffd166";
        warning.style.marginBottom = "12px";
        warning.textContent = "⚠️ Limited Workspace Signals: Recommendations are low-confidence.";
        group.appendChild(warning);
      }

      const grid = document.createElement("div");
      grid.className = "row row-wrap action-grid";
      brief.starterActions.forEach((action, index) => {
        const actionState = appState.actionStatus[action.id] || { status: "ready", ready: { ok: true } };
        const status = typeof actionState === 'string' ? actionState : actionState.status;
        const ready = actionState.ready || { ok: true };

        const container = document.createElement("div");
        container.className = "action-card-container";
        container.style.marginBottom = "12px";

        const btn = document.createElement("button");
        const isRecovery = action.id && (action.id.startsWith("fix_") || action.id === "debug_failure" || (action.reason && action.reason.includes("Recovery:")));

        btn.className = isRecovery ? "btn-amber" : (index === 0 ? "btn-primary" : "btn-secondary");
        btn.style.width = "100%";

        let labelText = action.label;
        if (status === "running") labelText = `Running ${action.label}...`;
        if (status === "awaiting_input") labelText = `⚠️ ${action.label} (Pending Decision)`;
        if (status === "succeeded") labelText = `${action.label} (Done)`;
        if (status === "failed") labelText = `${action.label} (Failed)`;
        if (status === "cancelled") labelText = `${action.label} (Cancelled)`;
        if (!ready.ok) labelText = `${action.label} (Blocked)`;

        btn.textContent = labelText;
        if (status === "running") btn.disabled = true;

        if (status === "awaiting_input") {
          btn.className = "btn-amber"; // Highlight pending decision
          btn.disabled = false; // Allow re-opening the terminal
        }

        // History Badge (Phase 11C)
        if (action.historyRationale) {
          const badge = document.createElement("div");
          badge.className = "history-badge";
          badge.innerHTML = `<span>📜</span> ${action.historyRationale}`;
          btn.appendChild(badge);
        }

        // Risk Indicator (Wave 2)
        const riskLevel = action.risk || "safe";
        const dot = document.createElement("span");
        dot.className = `risk-dot risk-${riskLevel}`;
        dot.title = `Risk Level: ${riskLevel.toUpperCase()}`;
        btn.prepend(dot);

        if (action.predictedBlocker) {
          btn.style.border = "1px dashed var(--attention)";
          btn.title = `⚠️ Failure Predicted: ${action.predictedBlocker.reason}`;
          const warning = document.createElement("div");
          warning.className = "predicted-failure-badge";
          warning.style.color = "var(--attention)";
          warning.style.fontSize = "10px";
          warning.style.marginTop = "2px";
          warning.textContent = "⚠️ Friction Predicted: " + action.predictedBlocker.reason;
          container.appendChild(warning);
        }

        if (!ready.ok) {
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.title = `Blocked: ${ready.reason}`;
        } else if (index === 0 && action.reason) {
          btn.title = `Recommended: ${action.reason}`;
        }

        btn.onclick = () => {
          if (action.id) {
            if (typeof terminalOverlay !== "undefined") {
              terminalOverlay.show(action.label);
            }
            runAction(action.id);
          } else {
            setPromptEditorValue(action.prompt, { focus: true });
            showBanner(`Action loaded: ${action.label}`, "ok");
          }
        };

        container.appendChild(btn);

        if (action.reason || action.strategicRationale) {
          const rationale = document.createElement("div");
          rationale.className = "action-rationale";
          rationale.style.fontSize = "11px";
          rationale.style.opacity = "0.7";
          rationale.style.marginTop = "4px";
          rationale.style.fontStyle = "italic";
          rationale.textContent = `→ ${action.strategicRationale || action.reason}`;
          container.appendChild(rationale);
        }

        grid.appendChild(container);
      });
      group.appendChild(grid);
      const hr = document.createElement("hr");
      hr.className = "panel-hr";
      group.appendChild(hr);
      el.intelActionHints.appendChild(group);
    }
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
  const resolved = normalizeSessionsTrayId(nextTray);
  appState.sessionsTray = normalizeSessionsTrayId(options.toggle && appState.sessionsTray === resolved ? "none" : resolved);
  renderSessionsTrays();
  persistOperatorLayoutPreferences();
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
  const resolved = normalizeCommandsTrayId(nextTray);
  appState.commandsTray = normalizeCommandsTrayId(options.toggle && appState.commandsTray === resolved ? "none" : resolved);
  renderCommandsTray();
  persistOperatorLayoutPreferences();
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

function workbenchArtifactCardModel() {
  const artifact = appState.lastArtifact;
  const historyCount = normalizeShippingPacketHistory(appState.shippingPacketHistory).length;
  if (artifact && String(artifact.content || "").trim()) {
    const artifactTitle = String(artifact.title || (getOutputMode(artifact.outputMode) || {}).label || "Latest artifact").trim();
    const detailParts = [
      artifact.generatedAt ? formatTimestampLabel(artifact.generatedAt) : "",
      historyCount ? `${historyCount} packet${historyCount === 1 ? "" : "s"} in history` : "Export, compare, or snapshot it"
    ].filter(Boolean);
    return {
      state: artifactTitle,
      summary: truncateInlineText(detailParts.join(" | "), 128),
      tone: "ok"
    };
  }
  if (historyCount) {
    return {
      state: `${historyCount} packet${historyCount === 1 ? "" : "s"} ready`,
      summary: "Reload shipping packet history into the dock or compare revisions side by side.",
      tone: "good"
    };
  }
  return {
    state: "No artifact yet",
    summary: "The latest structured output lands here first, then export, compare, or save it as a thread snapshot.",
    tone: "guard"
  };
}

function workbenchPatchCardModel() {
  const runPlan = appState.verificationRunPlan;
  const patchPlan = appState.patchPlan;
  if (runPlan && Array.isArray(runPlan.checks) && runPlan.checks.length) {
    const selected = runPlan.checks.filter((check) => check.selected !== false).length;
    const running = runPlan.checks.filter((check) => check.status === "running").length;
    const failed = runPlan.checks.filter((check) => check.status === "failed").length;
    const passed = runPlan.checks.filter((check) => check.status === "passed").length;
    const summaryParts = [
      `${selected}/${runPlan.checks.length} selected`,
      passed ? `${passed} passed` : "",
      failed ? `${failed} failed` : "",
      running ? `${running} running` : "",
      patchPlanHasFiles() ? `${(patchPlan.files || []).length} patch files` : ""
    ].filter(Boolean);
    return {
      state: running ? "Verification running" : failed ? "Verification needs review" : "Verification staged",
      summary: truncateInlineText(`${runPlan.groupTitle || "Run plan"} | ${summaryParts.join(" | ")}`, 128),
      tone: failed ? "warn" : running ? "ok" : "good"
    };
  }
  if (patchPlanHasFiles()) {
    const fileCount = Array.isArray(patchPlan && patchPlan.files) ? patchPlan.files.length : 0;
    const selectedCount = Array.isArray(patchPlan && patchPlan.selectedFileIds) ? patchPlan.selectedFileIds.length : 0;
    const groupCount = Array.isArray(patchPlan && patchPlan.groups) ? patchPlan.groups.length : 0;
    return {
      state: `${fileCount} file${fileCount === 1 ? "" : "s"} staged`,
      summary: truncateInlineText(
        `${groupCount} group${groupCount === 1 ? "" : "s"} | ${selectedCount}/${fileCount} selected | Preview grouped diffs before any apply.`,
        128
      ),
      tone: selectedCount ? "ok" : "warn"
    };
  }
  return {
    state: "No patch plan",
    summary: "Load an artifact as a patch plan or stage verification here when code changes become real.",
    tone: "guard"
  };
}

function workbenchApplyCardModel() {
  const preview = appState.workspaceActionPreview;
  if (preview) {
    return {
      state: "Preview ready",
      summary: truncateInlineText(
        `${preview.relativePath || preview.path || "workspace action"} | ${preview.previewKind === "diff" ? "Diff preview" : "Content preview"} | Apply remains explicit.`,
        128
      ),
      tone: "good"
    };
  }
  const draft = appState.workspaceEditDraft || {};
  const draftPath = String(
    (el.workspaceEditPathInput && el.workspaceEditPathInput.value) || draft.relativePath || defaultWorkspaceEditPath()
  ).trim() || defaultWorkspaceEditPath();
  const draftContent = String(
    (el.workspaceEditContentInput && el.workspaceEditContentInput.value) || draft.content || ""
  ).trim();
  if (draftContent) {
    const wordCount = draftContent.split(/\s+/).filter(Boolean).length;
    return {
      state: "Draft loaded",
      summary: truncateInlineText(`${draftPath} | ${wordCount} words staged for diff preview.`, 128),
      tone: hasWorkspaceAttachment() ? "ok" : "warn"
    };
  }
  return {
    state: hasWorkspaceAttachment() ? "No apply draft" : "No workspace",
    summary: hasWorkspaceAttachment()
      ? `Target ${draftPath} when you are ready to preview a guarded local write.`
      : "Attach a workspace before staging guarded local writes.",
    tone: hasWorkspaceAttachment() ? "guard" : "warn"
  };
}

function refreshWorkbenchSystemChrome() {
  const model = workbenchSystemCardModel();
  if (el.systemWorkbenchBtn) {
    el.systemWorkbenchBtn.dataset.tone = String(model.tone || "guard");
    el.systemWorkbenchBtn.title = model.summary;
  }
  if (el.systemWorkbenchStateText) {
    el.systemWorkbenchStateText.textContent = model.state;
    el.systemWorkbenchStateText.dataset.tone = String(model.tone || "guard");
  }
  if (el.systemWorkbenchSummaryText) {
    el.systemWorkbenchSummaryText.textContent = model.summary;
  }
  if (appState.systemSurface === "workbench" && el.systemSummaryText) {
    el.systemSummaryText.textContent = model.summary;
  }
  renderGlobalControlBar();
}

function renderWorkbenchNavigation() {
  const surfaceMap = [
    {
      id: "artifact",
      button: el.workbenchArtifactBtn,
      section: el.workbenchArtifactSection,
      stateNode: el.workbenchArtifactStateText,
      summaryNode: el.workbenchArtifactSummaryText,
      ...workbenchArtifactCardModel()
    },
    {
      id: "patch",
      button: el.workbenchPatchBtn,
      section: el.workbenchPatchSection,
      stateNode: el.workbenchPatchStateText,
      summaryNode: el.workbenchPatchSummaryText,
      ...workbenchPatchCardModel()
    },
    {
      id: "apply",
      button: el.workbenchApplyBtn,
      section: el.workbenchApplySection,
      stateNode: el.workbenchApplyStateText,
      summaryNode: el.workbenchApplySummaryText,
      ...workbenchApplyCardModel()
    }
  ];
  for (const surface of surfaceMap) {
    const isActive = appState.workbenchSurface === surface.id;
    if (surface.button) {
      surface.button.classList.toggle("is-active", isActive);
      surface.button.setAttribute("aria-expanded", String(isActive));
      surface.button.setAttribute("aria-pressed", String(isActive));
      surface.button.dataset.tone = String(surface.tone || "guard");
      surface.button.title = `${surface.state} | ${surface.summary}`;
    }
    if (surface.stateNode) {
      surface.stateNode.textContent = surface.state;
      surface.stateNode.dataset.tone = String(surface.tone || "guard");
    }
    if (surface.summaryNode) {
      surface.summaryNode.textContent = surface.summary;
    }
    if (surface.section) {
      surface.section.classList.toggle("is-active", isActive);
      surface.section.classList.toggle("hidden", !isActive);
      surface.section.setAttribute("aria-hidden", String(!isActive));
      if (isActive) {
        surface.section.hidden = false;
        surface.section.removeAttribute("hidden");
      } else {
        surface.section.hidden = true;
        surface.section.setAttribute("hidden", "hidden");
      }
    }
  }
  refreshWorkbenchSystemChrome();
}

function trimTrailingPeriod(value) {
  return String(value || "")
    .replace(/\.+$/u, "")
    .trim();
}

function workbenchSystemCardModel() {
  const plan = appState.verificationRunPlan;
  const patchPlan = appState.patchPlan;
  const artifact = appState.lastArtifact;
  const workbenchSurface = normalizeWorkbenchSurfaceId(appState.workbenchSurface);
  const activeLabel = workbenchSurface === "patch"
    ? "Patch review active"
    : workbenchSurface === "apply"
      ? "Apply deck active"
      : "Artifact dock active";
  if (plan && Array.isArray(plan.checks) && plan.checks.length) {
    const selected = plan.checks.filter((check) => check.selected !== false).length;
    const running = plan.checks.some((check) => check.status === "running");
    const failed = plan.checks.some((check) => check.status === "failed");
    return {
      state: activeLabel,
      summary: truncateInlineText(
        `${plan.groupTitle || "Verification plan"} | ${selected}/${plan.checks.length} checks selected${patchPlanHasFiles() ? ` | ${(patchPlan.files || []).length} patch files` : ""}`,
        132
      ),
      tone: failed ? "warn" : running ? "ok" : "good"
    };
  }
  if (patchPlanHasFiles()) {
    const fileCount = Array.isArray(patchPlan && patchPlan.files) ? patchPlan.files.length : 0;
    const groupCount = Array.isArray(patchPlan && patchPlan.groups) ? patchPlan.groups.length : 0;
    return {
      state: workbenchSurface === "patch" ? activeLabel : "Patch plan ready",
      summary: truncateInlineText(
        `${fileCount} file${fileCount === 1 ? "" : "s"}${groupCount ? ` | ${groupCount} group${groupCount === 1 ? "" : "s"}` : ""} | Guarded preview and apply stay here.`,
        132
      ),
      tone: "ok"
    };
  }
  if (appState.workspaceActionPreview) {
    const target = String(appState.workspaceActionPreview.relativePath || appState.workspaceActionPreview.path || "workspace draft");
    return {
      state: workbenchSurface === "apply" ? activeLabel : "Apply draft staged",
      summary: truncateInlineText(`${target} is staged for guarded local apply.`, 132),
      tone: "guard"
    };
  }
  if (artifact && String(artifact.content || "").trim()) {
    const artifactTitle = String(artifact.title || artifact.outputMode || "Latest artifact");
    return {
      state: workbenchSurface === "artifact" ? activeLabel : "Artifact dock ready",
      summary: truncateInlineText(`${artifactTitle} is ready for export, compare, or patch extraction.`, 132),
      tone: "ok"
    };
  }
  return {
    state: "Workbench idle",
    summary: "Artifacts, patch review, and guarded apply stay here so the center thread can stay clean.",
    tone: "guard"
  };
}

function performanceSystemCardModel() {
  const bridge = describeLlmStatus(appState.llmStatus);
  const liveProfile = liveBridgeProfile() || currentBridgeProfile();
  const provider = getBridgeProvider(liveProfile ? liveProfile.provider : "ollama");
  const trayLabel = appState.performanceTray === "trace"
    ? "Trace lane"
    : appState.performanceTray === "outputs"
      ? `Outputs · ${appState.performanceOutputView === "logs" ? "logs" : appState.performanceOutputView === "chat" ? "chat" : "audit"}`
      : "Diagnostics";
  const modeLabel = offlineModeEnabled() ? "Offline Mode on" : "Hosted access available";
  return {
    state: offlineModeEnabled() ? "Offline guarded" : trimTrailingPeriod(bridge.short),
    summary: truncateInlineText(`${provider.label || "Bridge"} | ${modeLabel} | ${trayLabel}`, 132),
    tone: bridge.tone === "bad" ? "warn" : bridge.tone,
    ready: appState.bridgeStatus !== "connected"
  };
}

function shippingSystemCardModel() {
  const model = getShippingCockpitModel();
  const selectedCount = Array.isArray(model.selected) ? model.selected.length : 0;
  const summaryParts = [];
  if (selectedCount) summaryParts.push(`${selectedCount} selected`);
  if (model.passed) summaryParts.push(`${model.passed} passed`);
  if (model.failed) summaryParts.push(`${model.failed} failed`);
  if (model.running) summaryParts.push(`${model.running} running`);
  if (model.pending && getShippingCockpitPlan()) summaryParts.push(`${model.pending} pending`);
  if (model.packetReady) summaryParts.push("Packet docked");
  if (!model.packetReady && model.blockers.length) {
    summaryParts.push(`${model.blockers.length} blocker${model.blockers.length === 1 ? "" : "s"}`);
  }
  return {
    state: model.packetReady
      ? "Packet ready"
      : model.running > 0
        ? "Verification running"
        : getShippingCockpitPlan()
          ? "Verification staged"
          : model.blockers.length
            ? "Shipping blocked"
            : model.engaged
              ? "Shipping active"
              : "Shipping group idle",
    summary: truncateInlineText(summaryParts.join(" | ") || model.summary, 132),
    tone: model.tone,
    ready: model.packetReady || model.passed > 0
  };
}

function contextSystemCardModel() {
  const workspaceLabel = hasWorkspaceAttachment()
    ? String(appState.workspaceAttachment.label || "Attached workspace")
    : "No workspace attached";
  const entryCount = appState.contextPack && Array.isArray(appState.contextPack.entries)
    ? appState.contextPack.entries.length
    : 0;
  const profiles = currentWorkspaceContextPackProfiles();
  const activeProfile = profiles.find((profile) => String(profile.id || "") === String(appState.activeContextPackProfileId || "").trim()) || null;
  const parts = [workspaceLabel];
  if (entryCount) {
    parts.push(`${entryCount} context file${entryCount === 1 ? "" : "s"}`);
  }
  if (activeProfile) {
    parts.push(`Profile ${truncateInlineText(activeProfile.name || activeProfile.label || activeProfile.id || "active", 40)}`);
  } else if (profiles.length) {
    parts.push(`${profiles.length} saved profile${profiles.length === 1 ? "" : "s"}`);
  } else {
    parts.push("No saved context profile");
  }
  return {
    state: hasWorkspaceAttachment() ? "Workspace grounded" : "No workspace",
    summary: truncateInlineText(parts.join(" | "), 132),
    tone: hasWorkspaceAttachment() ? (entryCount || activeProfile ? "good" : "ok") : "guard",
    ready: !hasWorkspaceAttachment()
  };
}

function renderSystemNavigation() {
  const surfaceMap = [
    {
      id: "workbench",
      button: el.systemWorkbenchBtn,
      section: el.systemWorkbenchSection,
      stateNode: el.systemWorkbenchStateText,
      summaryNode: el.systemWorkbenchSummaryText,
      ...workbenchSystemCardModel()
    },
    {
      id: "performance",
      button: el.systemPerformanceBtn,
      section: el.systemPerformanceSection,
      stateNode: el.systemPerformanceStateText,
      summaryNode: el.systemPerformanceSummaryText,
      ...performanceSystemCardModel()
    },
    {
      id: "shipping",
      button: el.systemShippingBtn,
      section: el.systemShippingSection,
      stateNode: el.systemShippingStateText,
      summaryNode: el.systemShippingSummaryText,
      ...shippingSystemCardModel()
    },
    {
      id: "context",
      button: el.systemContextBtn,
      section: el.systemContextSection,
      stateNode: el.systemContextStateText,
      summaryNode: el.systemContextSummaryText,
      ...contextSystemCardModel()
    }
  ];
  let activeSummary = "Switch between workbench, performance, shipping, and context surfaces without crowding the center thread.";
  for (const surface of surfaceMap) {
    const isActive = appState.systemSurface === surface.id;
    if (surface.button) {
      surface.button.classList.toggle("is-active", isActive);
      surface.button.classList.toggle("ready-to-act", !!surface.ready);
      surface.button.setAttribute("aria-expanded", String(isActive));
      surface.button.setAttribute("aria-pressed", String(isActive));
      surface.button.setAttribute("aria-selected", String(isActive));
      surface.button.dataset.tone = String(surface.tone || "guard");
      surface.button.title = surface.summary;
    }
    if (surface.stateNode) {
      surface.stateNode.textContent = surface.state;
      surface.stateNode.dataset.tone = String(surface.tone || "guard");
    }
    if (surface.summaryNode) {
      surface.summaryNode.textContent = surface.summary;
    }
    if (surface.section) {
      surface.section.classList.toggle("is-active", isActive);
      surface.section.classList.toggle("is-subtle", !isActive);
      surface.section.classList.toggle("hidden", !isActive);
      if (isActive) {
        surface.section.hidden = false;
        surface.section.removeAttribute("hidden");
      } else {
        surface.section.hidden = true;
        surface.section.setAttribute("hidden", "hidden");
      }
      surface.section.setAttribute("aria-hidden", String(!isActive));
    }
    if (isActive) {
      activeSummary = surface.summary;
    }
  }
  if (el.systemSummaryText) {
    el.systemSummaryText.textContent = activeSummary;
  }
  renderGlobalControlBar();
}

function setSystemSurface(nextSurface, options = {}) {
  appState.systemSurface = normalizeSystemSurfaceId(nextSurface);
  renderSystemNavigation();
  if (options.persist !== false) {
    persistOperatorLayoutPreferences({ render: false });
  }
  const target = appState.systemSurface === "performance"
    ? el.systemPerformanceSection
    : appState.systemSurface === "shipping"
      ? el.systemShippingSection
      : appState.systemSurface === "context"
        ? el.systemContextSection
        : el.systemWorkbenchSection;
  if (options.scroll !== false && target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({
      behavior: options.behavior || "smooth",
      block: "start"
    });
  }
  if (options.focus) {
    setTimeout(() => focusSurface(".workspace-right-column"), 0);
  }
}
function setWorkbenchSurface(nextSurface, options = {}) {
  const resolved = normalizeWorkbenchSurfaceId(nextSurface);
  appState.workbenchSurface = resolved;
  ensureSurfaceEpoch(resolved);
  appState.systemSurface = "workbench";
  renderWorkbenchNavigation();
  renderSystemNavigation();
  if (resolved === "artifact") {
    renderArtifactPanel({ forceRender: true });
  } else if (resolved === "patch") {
    renderPatchPlanPanel({ forceRender: true });
  } else if (resolved === "apply") {
    renderWorkspaceActionDeck({ forceRender: true });
  }
  if (options.persist !== false) {
    persistOperatorLayoutPreferences();
  }
  if (options.scroll === false) {
    return;
  }
  const target = resolved === "patch"
    ? el.workbenchPatchSection
    : resolved === "apply"
      ? el.workbenchApplySection
      : el.workbenchArtifactSection;
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({
      behavior: options.behavior || "smooth",
      block: "start"
    });
  }
}

function preferredWorkbenchSurfaceFromLoadedState() {
  if (appState.verificationRunPlan && Array.isArray(appState.verificationRunPlan.checks) && appState.verificationRunPlan.checks.length) {
    return "patch";
  }
  if (patchPlanHasFiles()) {
    return "patch";
  }
  return "artifact";
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
  if (plan.provenance && (plan.provenance.contextPack || plan.provenance.contextPackProfile || plan.provenance.workspaceRoot)) {
    lines.push("## Context Provenance");
    lines.push(`- Workspace Root: ${plan.provenance.workspaceRoot || "Unavailable"}`);
    if (plan.provenance.contextPack) {
      lines.push(`- Context Pack: ${plan.provenance.contextPack.name || "Unnamed pack"}${plan.provenance.contextPack.fileCount ? ` | ${plan.provenance.contextPack.fileCount} files` : ""}${plan.provenance.contextPack.builtAt ? ` | built ${plan.provenance.contextPack.builtAt}` : ""}`);
      if (Array.isArray(plan.provenance.contextPack.filePaths) && plan.provenance.contextPack.filePaths.length) {
        lines.push(`- Context Files: ${plan.provenance.contextPack.filePaths.join(", ")}`);
      }
    } else {
      lines.push("- Context Pack: Not captured");
    }
    if (plan.provenance.contextPackProfile) {
      lines.push(`- Context Pack Profile: ${plan.provenance.contextPackProfile.name || "Unnamed profile"}${plan.provenance.contextPackProfile.fileCount ? ` | ${plan.provenance.contextPackProfile.fileCount} files` : ""}${plan.provenance.contextPackProfile.savedAt ? ` | saved ${plan.provenance.contextPackProfile.savedAt}` : ""}`);
    } else {
      lines.push("- Context Pack Profile: Not captured");
    }
    lines.push("");
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
    if (patchPlanFileHunks(file).length) {
      lines.push(`  - Hunks: ${selectedPatchPlanHunks(file).length}/${patchPlanFileHunks(file).length} accepted`);
    }
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
  syncPatchPlanSelections();
  appState.patchPlanPreviewFileId = appState.patchPlan && appState.patchPlan.files[0]
    ? appState.patchPlan.files[0].fileId
    : "";
  appState.patchPlanGroupOpenIds = null;
  appState.verificationRunPlan = null;
  renderPatchPlanPanel();
  if (appState.patchPlan) {
    setWorkbenchSurface("patch", { persist: false, scroll: false });
  }
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
    syncPatchPlanSelections();
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
    shippingPacketHistory: appState.shippingPacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
    verificationRunPlan: appState.verificationRunPlan,
    verificationRunHistory: appState.verificationRunHistory,
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

function resetWorkspaceActions(clearHistory = true, options = {}) {
  appState.workspaceActionPreview = null;
  if (clearHistory) {
    appState.workspaceActionHistory = {};
  }
  if (options.render !== false) {
    renderWorkspaceActionDeck();
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
      (Array.isArray(file && file.hunks) && file.hunks.length > 0) ||
      String(file && file.diffText ? file.diffText : "").trim() ||
      String(file && file.absolutePath ? file.absolutePath : "").trim()
    ))
  );
}

function patchPlanFileHunks(file) {
  return Array.isArray(file && file.hunks) ? file.hunks : [];
}

function selectedPatchPlanHunks(file) {
  return patchPlanFileHunks(file).filter((hunk) => hunk.selected !== false);
}

function appliedPatchPlanHunks(file) {
  return patchPlanFileHunks(file).filter((hunk) => String(hunk.appliedAt || "").trim());
}

function patchPlanFileHasPendingSelectedHunks(file) {
  const selected = selectedPatchPlanHunks(file);
  if (!selected.length) {
    return false;
  }
  return selected.some((hunk) => !String(hunk.appliedAt || "").trim());
}

function patchPlanFileFullyApplied(file) {
  const hunks = patchPlanFileHunks(file);
  if (hunks.length) {
    const selected = selectedPatchPlanHunks(file);
    return selected.length > 0 && selected.every((hunk) => String(hunk.appliedAt || "").trim());
  }
  return Boolean(file && String(file.appliedAt || "").trim());
}

function selectedPatchPlanFiles() {
  if (!patchPlanHasFiles()) return [];
  return appState.patchPlan.files.filter((file) => file.selected !== false || selectedPatchPlanHunks(file).length > 0);
}

function unappliedSelectedPatchPlanFiles() {
  return selectedPatchPlanFiles().filter((file) => patchPlanFileHasPendingSelectedHunks(file) || !patchPlanFileFullyApplied(file));
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

function inferOperatorActionTone(action = {}) {
  const buttonClass = String(action.buttonClass || "").trim().toLowerCase();
  const status = String(action.status || "").trim().toLowerCase();
  if (buttonClass.includes("danger") || /required|blocked|high impact/.test(status)) {
    return "warn";
  }
  if (/archive|ship packet|ready|fast route/.test(status) || buttonClass.includes("primary")) {
    return "good";
  }
  if (/review|recovery|pending|reset/.test(status)) {
    return "ok";
  }
  return "guard";
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
  const hunkCount = patchPlanFileHunks(file).length;
  const selectedHunkCount = selectedPatchPlanHunks(file).length;
  const appliedHunkCount = appliedPatchPlanHunks(file).length;
  if (file && !hunkCount && String(file.appliedAt || "").trim()) {
    return {
      label: `Applied ${formatTimestampLabel(file.appliedAt)}`,
      tone: "good"
    };
  }
  if (file && hunkCount && selectedHunkCount > 0 && appliedHunkCount === selectedHunkCount) {
    return {
      label: `${appliedHunkCount}/${selectedHunkCount} hunks applied`,
      tone: "good"
    };
  }
  if (file && hunkCount && appliedHunkCount > 0) {
    return {
      label: `${appliedHunkCount}/${Math.max(selectedHunkCount, hunkCount)} hunks applied`,
      tone: "ok"
    };
  }
  if (file && file.selected === false) {
    return {
      label: "Deselected",
      tone: "warn"
    };
  }
  if (file && hunkCount && selectedHunkCount === 0) {
    return {
      label: `${hunkCount} hunks skipped`,
      tone: "warn"
    };
  }
  if (file && hunkCount && selectedHunkCount > 0) {
    return {
      label: `${selectedHunkCount}/${hunkCount} hunks accepted`,
      tone: "ok"
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
  const hunks = patchPlanFileHunks(file);
  return [
    { label: "Local only", tone: "local" },
    { label: "Writes file", tone: "write" },
    { label: "Explicit apply", tone: "guard" },
    ...(hunks.length ? [{ label: `${selectedPatchPlanHunks(file).length}/${hunks.length} hunks`, tone: "ok" }] : []),
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
  setPromptEditorValue(prompt, { focus: true });
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
  setPromptEditorValue(buildPatchPlanVerificationPrompt({
    title: liveGroup ? liveGroup.title : action.groupTitle,
    filePaths: liveGroup ? liveGroup.files.map((file) => file.path) : action.filePaths,
    checks: verificationPlan ? verificationPlan.checks : action.checks,
    promptLead: verificationPlan ? verificationPlan.promptLead : action.promptLead
  }), { focus: true });
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
  renderShippingCockpit();
  if (options.persist !== false) {
    persistChatState().catch(() => { });
  }
}

function clearVerificationRunPlan(options = {}) {
  appState.verificationRunPlan = null;
  renderPatchPlanPanel();
  renderShippingCockpit();
  if (options.persist !== false) {
    persistChatState().catch(() => { });
  }
  if (options.announce !== false) {
    showBanner("Verification run plan cleared.", "ok");
  }
}

function clearVerificationRunHistory(options = {}) {
  appState.verificationRunHistory = [];
  renderPatchPlanPanel();
  renderShippingCockpit();
  if (options.persist !== false) {
    persistChatState().catch(() => { });
  }
  if (options.announce !== false) {
    showBanner("Verification run history cleared.", "ok");
  }
}

function setVerificationRunHistory(history, options = {}) {
  appState.verificationRunHistory = normalizeVerificationRunHistory(history);
  renderPatchPlanPanel();
  renderShippingCockpit();
  if (options.persist !== false) {
    persistChatState().catch(() => { });
  }
}

async function loadVerificationRunHistoryEntry(runId, options = {}) {
  const entry = findVerificationRunHistoryEntry(runId);
  if (!entry) {
    throw new Error("Verification snapshot is unavailable.");
  }
  setVerificationRunPlan({
    id: `verification-${entry.groupId || "surface"}-${Date.now()}`,
    groupId: entry.groupId,
    groupTitle: entry.groupTitle,
    workflowId: entry.workflowId,
    rootPath: entry.rootPath,
    rootLabel: entry.rootLabel,
    preparedAt: new Date().toISOString(),
    checks: entry.checks.map((check) => ({
      id: check.id,
      selected: check.selected !== false
    }))
  }, { persist: false });
  renderPatchPlanPanel();
  renderShippingCockpit();
  setWorkbenchSurface("patch", { persist: false, scroll: false });
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(`Verification plan loaded from history: ${entry.groupTitle}`, "ok");
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
  renderShippingCockpit();
  persistChatState().catch(() => { });
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
  }, { persist: false });
  setWorkbenchSurface("patch", { persist: false, scroll: false });
  persistChatState().catch(() => { });
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

function buildVerificationRunHistoryEntryFromPlan(plan, options = {}) {
  return normalizeVerificationRunHistoryEntry({
    runId: options.runId || `verification-run-${Date.now()}-${slugifySegment(plan.groupId || "surface", "surface")}`,
    planId: plan.id,
    groupId: plan.groupId,
    groupTitle: plan.groupTitle,
    workflowId: plan.workflowId,
    rootPath: plan.rootPath,
    rootLabel: plan.rootLabel,
    preparedAt: plan.preparedAt,
    executedAt: options.executedAt || plan.lastRunAt || new Date().toISOString(),
    ok: options.ok === true,
    selectedCheckIds: plan.checks.filter((check) => check.selected !== false).map((check) => check.id),
    checks: plan.checks
  });
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
  const refreshToken = reserveSurfaceRefreshToken("patch");
  const selectedChecks = plan.checks.filter((check) => check.selected !== false);
  if (!selectedChecks.length) {
    throw new Error("Select at least one verification check to run.");
  }
  if (!window.api || !window.api.verification) {
    throw new Error("Verification runner is unavailable.");
  }
  const runId = `verification-run-${Date.now()}-${slugifySegment(plan.groupId || "surface", "surface")}`;
  appState.verificationRunPlan = {
    ...plan,
    checks: plan.checks.map((check) => (
      selectedChecks.some((row) => row.id === check.id)
        ? {
          ...check,
          status: "running",
          lastRunAt: "",
          exitCode: null,
          durationMs: 0,
          stdout: "",
          stderr: ""
        }
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
    if (!isSurfaceRefreshTokenCurrent("patch", refreshToken)) {
      throw err;
    }
    appState.verificationRunPlan = {
      ...plan,
      lastRunAt: new Date().toISOString(),
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
    pushVerificationRunHistoryEntry(buildVerificationRunHistoryEntryFromPlan(appState.verificationRunPlan, {
      runId,
      executedAt: appState.verificationRunPlan.lastRunAt,
      ok: false
    }));
    if (appState.workbenchSurface === "patch") {
      const patchEpoch = ensureSurfaceEpoch("patch");
      renderPatchPlanPanel({ surfaceEpoch: patchEpoch, forceRender: true });
    }
    renderShippingCockpit();
    if (String(plan.groupId || "").trim() === "release_cockpit") {
      setSystemSurface("shipping", { persist: false, scroll: false });
    }
    await persistChatState();
    throw err;
  }
  const resultsById = new Map((Array.isArray(result && result.results) ? result.results : []).map((row) => [row.id, row]));
  if (!isSurfaceRefreshTokenCurrent("patch", refreshToken)) {
    return result;
  }
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
  pushVerificationRunHistoryEntry(buildVerificationRunHistoryEntryFromPlan(appState.verificationRunPlan, {
    runId,
    executedAt: appState.verificationRunPlan.lastRunAt,
    ok: Boolean(result && result.ok)
  }));
  if (appState.workbenchSurface === "patch") {
    const patchEpoch = ensureSurfaceEpoch("patch");
    renderPatchPlanPanel({ surfaceEpoch: patchEpoch, forceRender: true });
  }
  renderShippingCockpit();
  if (String(plan.groupId || "").trim() === "release_cockpit") {
    setSystemSurface("shipping", { persist: false, scroll: false });
  }
  await persistChatState();
  showBanner(result && result.ok ? "Verification run complete." : "Verification run completed with failures.", result && result.ok ? "ok" : "bad");
}

function stageShippingCockpit() {
  if (!hasWorkspaceAttachment()) {
    throw new Error("Attach a workspace before staging Shipping verification.");
  }
  const checks = getReleaseVerificationSpecs().map((check) => ({
    id: check.id,
    selected: true
  }));
  if (!checks.length) {
    throw new Error("Shipping verification checks are unavailable.");
  }
  setVerificationRunPlan({
    id: `release-cockpit-${normalizeWorkflowId(appState.workflowId)}`,
    groupId: "release_cockpit",
    groupTitle: "Shipping Cockpit",
    workflowId: appState.workflowId,
    rootPath: String(appState.workspaceAttachment.rootPath || ""),
    rootLabel: String(appState.workspaceAttachment.label || ""),
    preparedAt: new Date().toISOString(),
    checks
  }, { persist: false });
  setWorkbenchSurface("patch", { persist: false, scroll: false });
  persistChatState().catch(() => { });
  showBanner("Shipping Cockpit staged. Review the selected checks in Workbench before you run them.", "ok");
}

async function runShippingCockpitChecks() {
  if (!getShippingCockpitPlan()) {
    stageShippingCockpit();
  }
  setSystemSurface("shipping", { persist: false });
  await runVerificationRunPlanSelectedChecks();
}

async function buildShippingPacketArtifact(options = {}) {
  if (!hasWorkspaceAttachment()) {
    throw new Error("Attach a workspace before building the shipping packet.");
  }
  const generatedAt = String(options.generatedAt || new Date().toISOString());
  const packetId = String(options.packetId || buildArtifactId({
    workflowId: normalizeWorkflowId(appState.workflowId),
    outputMode: "shipping_packet",
    generatedAt,
    title: "Shipping Packet"
  }));
  const provenance = buildShippingPacketProvenance({ packetId });
  appState.lastArtifact = pushShippingPacketHistoryEntry({
    id: packetId,
    title: "Shipping Packet",
    workflowId: normalizeWorkflowId(appState.workflowId),
    outputMode: "shipping_packet",
    content: buildShippingPacketContent({ generatedAt, provenance }),
    generatedAt,
    provenance
  });
  renderArtifactPanel();
  setWorkbenchSurface("artifact", { persist: false, scroll: false });
  renderShippingCockpit();
  renderOperatorRail();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Shipping Packet built.", "ok");
  }
  return appState.lastArtifact;
}

function openShippingPalette() {
  setCommandPaletteOpen(true);
  if (el.commandPaletteInput) {
    el.commandPaletteInput.value = "Release";
    renderCommandPaletteList();
    el.commandPaletteInput.focus();
  }
}

function renderShippingCockpit() {
  const model = getShippingCockpitModel();
  if (el.shippingCockpitTitleText) {
    el.shippingCockpitTitleText.textContent = model.title;
  }
  if (el.shippingCockpitSummaryText) {
    el.shippingCockpitSummaryText.textContent = model.summary;
  }
  if (el.shippingCockpitMetaRow) {
    el.shippingCockpitMetaRow.innerHTML = "";
    el.shippingCockpitMetaRow.appendChild(createStatusPill(model.workflowTitle, normalizeWorkflowId(appState.workflowId) === "shipping_audit" ? "good" : "guard"));
    el.shippingCockpitMetaRow.appendChild(createStatusPill(
      hasWorkspaceAttachment() ? String(appState.workspaceAttachment.label || "Workspace attached") : model.engaged ? "No workspace" : "Workspace optional",
      hasWorkspaceAttachment() ? "good" : model.engaged ? "warn" : "guard"
    ));
    el.shippingCockpitMetaRow.appendChild(createStatusPill(
      model.decision,
      model.decision === "Ready" ? "good" : model.decision === "Conditional" ? "ok" : model.decision === "Idle" ? "guard" : "warn"
    ));
    el.shippingCockpitMetaRow.appendChild(createStatusPill(
      model.engaged ? `${model.selected.length}/${model.rows.length} selected` : "Checks not staged",
      model.engaged ? (model.selected.length ? "ok" : "warn") : "guard"
    ));
    el.shippingCockpitMetaRow.appendChild(createStatusPill(
      hasArtifactContent() ? "Artifact ready" : model.engaged ? "No artifact" : "Artifact optional",
      hasArtifactContent() ? "good" : "guard"
    ));
    el.shippingCockpitMetaRow.appendChild(createStatusPill(model.packetReady ? "Packet built" : "Packet pending", model.packetReady ? "good" : "guard"));
    if (model.blockers.length) {
      el.shippingCockpitMetaRow.appendChild(createStatusPill(`${model.blockers.length} blocker${model.blockers.length === 1 ? "" : "s"}`, "warn"));
    }
    if (model.running) {
      el.shippingCockpitMetaRow.appendChild(createStatusPill(`${model.running} running`, "ok"));
    } else if (model.failed) {
      el.shippingCockpitMetaRow.appendChild(createStatusPill(`${model.failed} failed`, "warn"));
    } else if (model.passed) {
      el.shippingCockpitMetaRow.appendChild(createStatusPill(`${model.passed} passed`, model.pending === 0 ? "good" : "ok"));
    } else {
      el.shippingCockpitMetaRow.appendChild(createStatusPill(`${model.pending} pending`, "guard"));
    }
  }
  if (el.shippingCockpitChecklist) {
    el.shippingCockpitChecklist.innerHTML = "";
    for (const item of model.checklist) {
      const row = document.createElement("div");
      row.className = "workspace-action-hint";
      row.textContent = item;
      el.shippingCockpitChecklist.appendChild(row);
    }
  }
  if (el.shippingCockpitBlockerList) {
    el.shippingCockpitBlockerList.innerHTML = "";
    if (model.blockers.length) {
      for (const blocker of model.blockers) {
        const row = document.createElement("div");
        row.className = "workspace-action-card release-blocker-card";
        const head = document.createElement("div");
        head.className = "workspace-action-card-head";
        const copy = document.createElement("div");
        copy.className = "workspace-action-card-copy";
        const title = document.createElement("div");
        title.className = "workflow-title-text";
        title.textContent = "Ship Blocker";
        const description = document.createElement("p");
        description.textContent = blocker;
        copy.appendChild(title);
        copy.appendChild(description);
        head.appendChild(copy);
        head.appendChild(createStatusPill("Blocked", "warn"));
        row.appendChild(head);
        el.shippingCockpitBlockerList.appendChild(row);
      }
    } else {
      const clearRow = document.createElement("div");
      clearRow.className = "workspace-action-hint";
      clearRow.textContent = model.engaged
        ? "No active ship blockers. Keep the shipping packet and evidence current while the shipping state stays green."
        : "Shipping group idle. Stage checks only when you are ready to verify a release.";
      el.shippingCockpitBlockerList.appendChild(clearRow);
    }
  }
  if (el.shippingCockpitStatusList) {
    el.shippingCockpitStatusList.innerHTML = "";
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
      el.shippingCockpitStatusList.appendChild(card);
    }
  }
  if (el.stageShippingCockpitBtn) {
    el.stageShippingCockpitBtn.disabled = !hasWorkspaceAttachment();
  }
  if (el.runShippingCockpitBtn) {
    el.runShippingCockpitBtn.disabled = !hasWorkspaceAttachment() || !model.selected.length;
  }
  if (el.buildShippingPacketBtn) {
    el.buildShippingPacketBtn.disabled = !hasWorkspaceAttachment();
  }
  if (el.exportShippingEvidenceBtn) {
    el.exportShippingEvidenceBtn.disabled = !hasWorkspaceAttachment() && !hasArtifactContent() && !appState.chat.length;
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

  const releaseModel = getShippingCockpitModel();
  if (normalizeWorkflowId(appState.workflowId) === "shipping_audit" && releaseModel.passed > 0 && releaseModel.pending === 0 && !releaseModel.failed && !releaseModel.packetReady) {
    addAction({
      id: "build-release-packet",
      title: "Build Shipping Packet",
      note: "Capture the current release decision, selected checks, blockers, and handoff actions into the Artifact Dock.",
      status: "Ship packet",
      scopes: [
        { label: "Local only", tone: "local" },
        { label: "Dock artifact", tone: "read" },
        { label: "Shipping report", tone: "guard" }
      ],
      buttonLabel: "Build Packet",
      buttonClass: "btn-primary",
      run: async () => { await buildShippingPacketArtifact(); }
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
  const refreshToken = reserveSurfaceRefreshToken("apply");
  const preview = await window.api.workspace.previewAction(request);
  if (!isSurfaceRefreshTokenCurrent("apply", refreshToken)) {
    return preview;
  }
  appState.workspaceActionPreview = {
    ...preview,
    request
  };
  const applyEpoch = ensureSurfaceEpoch("apply");
  renderWorkspaceActionDeck({ surfaceEpoch: applyEpoch, forceRender: true });
  setWorkbenchSurface("apply", { persist: false, scroll: false });
  showBanner(`Diff preview ready: ${preview.relativePath}`, "ok");
  return preview;
}

async function previewWorkspaceActionProposal(proposalId) {
  const proposal = getWorkspaceActionProposals().find((entry) => entry.id === proposalId);
  const request = await buildWorkspaceActionRequest(proposal);
  if (!window.api || !window.api.workspace || typeof window.api.workspace.previewAction !== "function") {
    throw new Error("Workspace preview IPC is unavailable.");
  }
  const refreshToken = reserveSurfaceRefreshToken("apply");
  const preview = await window.api.workspace.previewAction(request);
  if (!isSurfaceRefreshTokenCurrent("apply", refreshToken)) {
    return preview;
  }
  appState.workspaceActionPreview = {
    ...preview,
    request
  };
  const applyEpoch = ensureSurfaceEpoch("apply");
  renderWorkspaceActionDeck({ surfaceEpoch: applyEpoch, forceRender: true });
  setWorkbenchSurface("apply", { persist: false, scroll: false });
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
  const refreshToken = reserveSurfaceRefreshToken("apply");
  const applied = await window.api.workspace.applyAction(preview.request);
  if (!isSurfaceRefreshTokenCurrent("apply", refreshToken)) {
    return applied;
  }
  appState.workspaceActionPreview = {
    ...applied,
    request: preview.request
  };
  appState.workspaceActionHistory = {
    ...(appState.workspaceActionHistory || {}),
    [proposalId]: applied.appliedAt
  };
  const applyEpoch = ensureSurfaceEpoch("apply");
  renderWorkspaceActionDeck({ surfaceEpoch: applyEpoch, forceRender: true });
  setWorkbenchSurface("apply", { persist: false, scroll: false });
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

function patchPlanHasPendingDiffs() {
  return Boolean(
    patchPlanHasFiles() &&
    appState.patchPlan.files.some((file) => patchPlanFileHunks(file).length > 0)
  );
}

function currentPatchPlanPreviewFile() {
  if (!patchPlanHasFiles()) return null;
  const plan = appState.patchPlan;
  return plan.files.find((file) => file.fileId === appState.patchPlanPreviewFileId) || plan.files[0] || null;
}

function syncPatchPlanSelections() {
  if (!patchPlanHasFiles()) return;
  appState.patchPlan.files = appState.patchPlan.files.map((file) => {
    const hunks = patchPlanFileHunks(file);
    const selected = hunks.length ? hunks.some((hunk) => hunk.selected !== false) : file.selected !== false;
    return {
      ...file,
      selected,
      hunks
    };
  });
  appState.patchPlan.selectedFileIds = appState.patchPlan.files
    .filter((file) => file.selected !== false)
    .map((file) => file.fileId);
}

function setPatchPlanFileSelection(fileId, selected) {
  if (!patchPlanHasFiles()) return;
  appState.patchPlan.files = appState.patchPlan.files.map((file) => {
    if (file.fileId !== fileId) return file;
    const nextSelected = Boolean(selected);
    const hunks = patchPlanFileHunks(file).map((hunk) => ({
      ...hunk,
      selected: nextSelected
    }));
    return {
      ...file,
      selected: nextSelected,
      hunks
    };
  });
  syncPatchPlanSelections();
  renderPatchPlanPanel();
  persistChatState().catch(() => { });
}

function setPatchPlanHunkSelection(fileId, hunkId, selected) {
  if (!patchPlanHasFiles()) return;
  const normalizedFileId = String(fileId || "").trim();
  const normalizedHunkId = String(hunkId || "").trim();
  if (!normalizedFileId || !normalizedHunkId) return;
  appState.patchPlan.files = appState.patchPlan.files.map((file) => {
    if (file.fileId !== normalizedFileId) return file;
    return {
      ...file,
      hunks: patchPlanFileHunks(file).map((hunk) => (
        hunk.hunkId === normalizedHunkId
          ? { ...hunk, selected: Boolean(selected) }
          : hunk
      ))
    };
  });
  syncPatchPlanSelections();
  renderPatchPlanPanel();
  persistChatState().catch(() => { });
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
      selected: Boolean(selected),
      hunks: patchPlanFileHunks(file).map((hunk) => ({
        ...hunk,
        selected: Boolean(selected)
      }))
    };
  });
  syncPatchPlanSelections();
  renderPatchPlanPanel();
  persistChatState().catch(() => { });
}

function setPatchPlanPreviewFile(fileId) {
  appState.patchPlanPreviewFileId = String(fileId || "");
  renderPatchPlanPanel();
}

function patchPlanHunkStatusModel(hunk) {
  if (String(hunk && hunk.appliedAt ? hunk.appliedAt : "").trim()) {
    return {
      label: "Applied",
      tone: "good"
    };
  }
  if (hunk && hunk.selected === false) {
    return {
      label: "Rejected",
      tone: "warn"
    };
  }
  return {
    label: "Accepted",
    tone: "ok"
  };
}

function formatPatchPlanHunkHeader(hunk) {
  return `@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`;
}

function formatPatchPlanHunkLines(hunk) {
  return (Array.isArray(hunk && hunk.lines) ? hunk.lines : [])
    .map((line) => `${line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}${line.text}`)
    .join("\n");
}

function formatPatchPlanHunkSnippet(hunk) {
  const lines = formatPatchPlanHunkLines(hunk).split("\n");
  return [formatPatchPlanHunkHeader(hunk), ...lines.slice(0, 8)].join("\n");
}

function formatPatchPlanPreviewText(file) {
  if (!file) {
    return "No patch file selected.\nPreview a patch plan and choose a file to inspect its diff.";
  }
  const lines = [];
  if (file.absolutePath) {
    lines.push(`Path: ${file.absolutePath}`);
    lines.push("");
  }
  if (patchPlanFileHunks(file).length) {
    lines.push(`--- a/${file.path}`);
    lines.push(`+++ b/${file.path}`);
    for (const hunk of patchPlanFileHunks(file)) {
      const status = patchPlanHunkStatusModel(hunk);
      lines.push(`${formatPatchPlanHunkHeader(hunk)} [${status.label}]`);
      const hunkLines = formatPatchPlanHunkLines(hunk);
      if (hunkLines) {
        lines.push(hunkLines);
      }
    }
    return lines.join("\n");
  }
  lines.push(file.diffText || "Preview the patch plan to render unified diffs.");
  return lines.join("\n");
}

function patchPlanProvenanceSummaryText(plan = appState.patchPlan) {
  if (!plan || !plan.provenance) {
    return "Context provenance is captured when a patch plan is staged with an active repo context pack.";
  }
  const parts = [];
  if (plan.provenance.contextPack) {
    parts.push(`Context Pack: ${plan.provenance.contextPack.name || "Unnamed pack"}${plan.provenance.contextPack.fileCount ? ` | ${plan.provenance.contextPack.fileCount} files` : ""}`);
  }
  if (plan.provenance.contextPackProfile) {
    parts.push(`Profile: ${plan.provenance.contextPackProfile.name || "Unnamed profile"}${plan.provenance.contextPackProfile.savedAt ? ` | saved ${formatTimestampLabel(plan.provenance.contextPackProfile.savedAt)}` : ""}`);
  }
  if (plan.provenance.workspaceRoot) {
    parts.push(`Workspace: ${plan.provenance.workspaceRoot}`);
  }
  return parts.length ? parts.join(" | ") : "Context provenance is unavailable for this patch plan.";
}

function renderPatchPlanPanel(options = {}) {
  const surface = "patch";
  const isActive = appState.workbenchSurface === surface;
  const epochValid = options.surfaceEpoch == null || isSurfaceEpochValid(surface, options.surfaceEpoch);
  if ((!isActive && !options.forceRender) || !epochValid) {
    return;
  }
  ensurePatchPlanContextProvenance();
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
  if (el.patchPlanProvenanceText) {
    el.patchPlanProvenanceText.textContent = patchPlanProvenanceSummaryText(plan);
    el.patchPlanProvenanceText.dataset.tone = plan && plan.provenance && (plan.provenance.contextPack || plan.provenance.contextPackProfile)
      ? "ok"
      : "guard";
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
      ? `${appState.verificationRunPlan.checks.filter((check) => check.selected !== false).length}/${appState.verificationRunPlan.checks.length} selected | ${appState.verificationRunPlan.rootLabel || appState.verificationRunPlan.rootPath || "workspace"} | ${normalizeVerificationRunHistory(appState.verificationRunHistory).length} snapshot${normalizeVerificationRunHistory(appState.verificationRunHistory).length === 1 ? "" : "s"}`
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
  if (el.verificationRunHistoryMetaText) {
    const history = filteredVerificationRunHistory();
    const latest = history[0] || null;
    const previous = previousVerificationRunHistoryEntry(latest);
    el.verificationRunHistoryMetaText.textContent = !history.length
      ? "Recent local verification snapshots will appear here after you run a staged plan."
      : `${history.length} snapshot${history.length === 1 ? "" : "s"} | ${formatTimestampLabel(latest.executedAt)} | ${verificationRunDeltaSummary(latest, previous)}`;
  }
  const allVerificationHistory = normalizeVerificationRunHistory(appState.verificationRunHistory);
  const verificationHistoryOptions = verificationRunHistoryOptions(allVerificationHistory);
  const syncHistorySelect = (node, options, value) => {
    if (!node) return;
    const allowed = new Set(options.map((option) => option.value));
    const nextValue = allowed.has(value) ? value : "all";
    node.innerHTML = "";
    for (const option of options) {
      const elOption = document.createElement("option");
      elOption.value = option.value;
      elOption.textContent = option.label;
      node.appendChild(elOption);
    }
    node.value = nextValue;
    if (node.value !== nextValue) {
      node.value = "all";
    }
    if (value !== node.value) {
      appState.verificationRunHistoryFilters = {
        ...appState.verificationRunHistoryFilters,
        [node === el.verificationRunHistoryWorkflowFilter ? "workflow" : node === el.verificationRunHistoryGroupFilter ? "group" : "workspace"]: node.value
      };
    }
  };
  syncHistorySelect(el.verificationRunHistoryWorkflowFilter, verificationHistoryOptions.workflows, verificationRunHistoryFilterValue("workflow"));
  syncHistorySelect(el.verificationRunHistoryGroupFilter, verificationHistoryOptions.groups, verificationRunHistoryFilterValue("group"));
  syncHistorySelect(el.verificationRunHistoryWorkspaceFilter, verificationHistoryOptions.workspaces, verificationRunHistoryFilterValue("workspace"));
  if (el.verificationRunHistoryList) {
    el.verificationRunHistoryList.innerHTML = "";
    const history = filteredVerificationRunHistory();
    if (!history.length) {
      const emptyHistory = document.createElement("div");
      emptyHistory.className = "artifact-history-empty";
      emptyHistory.textContent = allVerificationHistory.length
        ? "No verification runs match the current filters. Reset filters or widen the workflow/group/workspace scope."
        : "No verification runs recorded yet. Stage a patch-group or release run plan, run it explicitly, then reload or compare the snapshots here.";
      el.verificationRunHistoryList.appendChild(emptyHistory);
    } else {
      for (const entry of history) {
        const counts = verificationRunCounts(entry);
        const previous = previousVerificationRunHistoryEntry(entry);

        const card = document.createElement("div");
        card.className = "workspace-action-card artifact-history-card";

        const head = document.createElement("div");
        head.className = "workspace-action-card-head";
        const copy = document.createElement("div");
        copy.className = "workspace-action-card-copy";
        const title = document.createElement("div");
        title.className = "workflow-title-text";
        title.textContent = entry.groupTitle;
        const description = document.createElement("p");
        description.textContent = `${formatTimestampLabel(entry.executedAt)} | ${entry.rootLabel || entry.rootPath || "workspace"}`;
        copy.appendChild(title);
        copy.appendChild(description);
        head.appendChild(copy);
        head.appendChild(createStatusPill(
          entry.ok ? "Passed" : counts.failed ? "Failed" : counts.pending ? "Pending" : "Captured",
          entry.ok ? "good" : counts.failed ? "warn" : "guard"
        ));

        const meta = document.createElement("div");
        meta.className = "trust-scope-row";
        meta.appendChild(createStatusPill(`${counts.selected} selected`, counts.selected ? "ok" : "warn"));
        meta.appendChild(createStatusPill(`${counts.passed} passed`, counts.passed ? "good" : "guard"));
        if (counts.failed) meta.appendChild(createStatusPill(`${counts.failed} failed`, "warn"));
        if (counts.pending) meta.appendChild(createStatusPill(`${counts.pending} pending`, "guard"));
        meta.appendChild(createStatusPill(entry.runId, "guard"));

        const delta = document.createElement("div");
        delta.className = "workspace-action-hint";
        delta.textContent = verificationRunDeltaSummary(entry, previous);

        const controls = document.createElement("div");
        controls.className = "row row-wrap artifact-history-actions";

        const loadBtn = document.createElement("button");
        loadBtn.className = "btn-secondary";
        loadBtn.textContent = "Load Plan";
        loadBtn.onclick = () => {
          loadVerificationRunHistoryEntry(entry.runId).catch((err) => showBanner(err.message || String(err), "bad"));
        };

        const copyBtn = document.createElement("button");
        copyBtn.className = "btn-secondary";
        copyBtn.textContent = "Copy Summary";
        copyBtn.onclick = () => {
          copyText([
            `${entry.groupTitle} | ${entry.runId}`,
            `${formatTimestampLabel(entry.executedAt)} | ${entry.rootLabel || entry.rootPath || "workspace"}`,
            verificationRunDeltaSummary(entry, previous),
            formatVerificationRunOutput(entry)
          ].join("\n\n")).then((ok) => {
            showBanner(ok ? "Verification snapshot copied." : "Verification snapshot copy failed.", ok ? "ok" : "bad");
          });
        };

        controls.appendChild(loadBtn);
        controls.appendChild(copyBtn);

        card.appendChild(head);
        card.appendChild(meta);
        card.appendChild(delta);
        card.appendChild(controls);
        el.verificationRunHistoryList.appendChild(card);
      }
    }
  }
  if (el.clearVerificationRunHistoryBtn) {
    el.clearVerificationRunHistoryBtn.disabled = !Array.isArray(appState.verificationRunHistory) || appState.verificationRunHistory.length === 0;
  }
  if (el.resetVerificationRunHistoryFiltersBtn) {
    el.resetVerificationRunHistoryFiltersBtn.disabled = verificationRunHistoryFilterValue("workflow") === "all"
      && verificationRunHistoryFilterValue("group") === "all"
      && verificationRunHistoryFilterValue("workspace") === "all";
  }
  if (el.patchPlanFileList) {
    el.patchPlanFileList.innerHTML = "";
    if (!patchPlanHasFiles()) {
      const empty = document.createElement("div");
      empty.className = "workspace-action-card";
      empty.textContent = "No patch plan files yet. Load one from a patch-plan artifact or preview a generated plan.";
      el.patchPlanFileList.appendChild(empty);
    } else {
      if (plan && plan.provenance && (plan.provenance.contextPack || plan.provenance.contextPackProfile || plan.provenance.workspaceRoot)) {
        const provenanceCard = document.createElement("div");
        provenanceCard.className = "workspace-action-card";

        const provenanceHead = document.createElement("div");
        provenanceHead.className = "workspace-action-card-head";
        const provenanceCopy = document.createElement("div");
        provenanceCopy.className = "workspace-action-card-copy";
        const provenanceTitle = document.createElement("div");
        provenanceTitle.className = "workflow-title-text";
        provenanceTitle.textContent = "Context Provenance";
        const provenanceNote = document.createElement("p");
        provenanceNote.textContent = "This patch plan was staged against the active repo memory so review and apply stay grounded in the same local context.";
        provenanceCopy.appendChild(provenanceTitle);
        provenanceCopy.appendChild(provenanceNote);
        provenanceHead.appendChild(provenanceCopy);
        provenanceHead.appendChild(createStatusPill("Context-linked", "good"));

        const provenanceMeta = document.createElement("div");
        provenanceMeta.className = "trust-scope-row";
        if (plan.provenance.contextPack) {
          provenanceMeta.appendChild(createStatusPill(`${plan.provenance.contextPack.name || "Context Pack"}${plan.provenance.contextPack.fileCount ? ` | ${plan.provenance.contextPack.fileCount} files` : ""}`, "good"));
        }
        if (plan.provenance.contextPackProfile) {
          provenanceMeta.appendChild(createStatusPill(`${plan.provenance.contextPackProfile.name || "Profile"}${plan.provenance.contextPackProfile.savedAt ? ` | ${formatTimestampLabel(plan.provenance.contextPackProfile.savedAt)}` : ""}`, "ok"));
        }
        if (plan.provenance.workspaceRoot) {
          provenanceMeta.appendChild(createStatusPill("Local workspace", "local"));
        }

        const provenanceHints = document.createElement("div");
        provenanceHints.className = "workspace-action-hint-list";
        const contextFiles = plan.provenance.contextPack && Array.isArray(plan.provenance.contextPack.filePaths)
          ? plan.provenance.contextPack.filePaths.slice(0, 3)
          : [];
        const hintRows = contextFiles.length
          ? [`Grounded by: ${contextFiles.join(", ")}`]
          : ["No context file list was captured for this patch plan."];
        if (plan.provenance.workspaceRoot) {
          hintRows.push(`Workspace root: ${plan.provenance.workspaceRoot}`);
        }
        for (const hint of hintRows) {
          const hintItem = document.createElement("div");
          hintItem.className = "workspace-action-hint";
          hintItem.textContent = hint;
          provenanceHints.appendChild(hintItem);
        }

        provenanceCard.appendChild(provenanceHead);
        provenanceCard.appendChild(provenanceMeta);
        provenanceCard.appendChild(provenanceHints);
        el.patchPlanFileList.appendChild(provenanceCard);
      }
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
          if (file.appliedAt || appliedPatchPlanHunks(file).length > 0) {
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
          stats.textContent = `${file.status || "pending"} | ${file.bytes || 0} bytes | ${file.lines || 0} lines${patchPlanFileHunks(file).length ? ` | ${patchPlanFileHunks(file).length} hunks` : ""}`;
          meta.appendChild(stats);

          const impactRow = document.createElement("div");
          impactRow.className = "trust-scope-row";
          const risk = getPatchPlanFileRisk(file);
          impactRow.appendChild(createStatusPill(risk.label, risk.tone));
          if (patchPlanFileHunks(file).length) {
            impactRow.appendChild(createStatusPill(
              `${selectedPatchPlanHunks(file).length}/${patchPlanFileHunks(file).length} hunks accepted`,
              selectedPatchPlanHunks(file).length ? "ok" : "warn"
            ));
          }

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

          const hunkList = document.createElement("div");
          hunkList.className = "patch-plan-hunk-list";
          if (patchPlanFileHunks(file).length) {
            for (const hunk of patchPlanFileHunks(file)) {
              const hunkCard = document.createElement("div");
              hunkCard.className = "patch-plan-hunk-card";
              if (String(hunk.appliedAt || "").trim()) hunkCard.classList.add("is-applied");
              if (hunk.selected !== false) hunkCard.classList.add("is-selected");

              const hunkHead = document.createElement("div");
              hunkHead.className = "workspace-action-card-head";

              const hunkCopy = document.createElement("div");
              hunkCopy.className = "workspace-action-card-copy";
              const hunkTitle = document.createElement("div");
              hunkTitle.className = "workflow-title-text";
              hunkTitle.textContent = formatPatchPlanHunkHeader(hunk);
              const hunkDescription = document.createElement("p");
              hunkDescription.textContent = `${hunk.addedCount || 0} added | ${hunk.removedCount || 0} removed`;
              hunkCopy.appendChild(hunkTitle);
              hunkCopy.appendChild(hunkDescription);

              const hunkState = patchPlanHunkStatusModel(hunk);
              hunkHead.appendChild(hunkCopy);
              hunkHead.appendChild(createStatusPill(hunkState.label, hunkState.tone));

              const hunkToggle = document.createElement("label");
              hunkToggle.className = "field-inline checkbox-field";
              const hunkCheckbox = document.createElement("input");
              hunkCheckbox.type = "checkbox";
              hunkCheckbox.checked = hunk.selected !== false;
              hunkCheckbox.onchange = () => setPatchPlanHunkSelection(file.fileId, hunk.hunkId, hunkCheckbox.checked);
              const hunkToggleText = document.createElement("span");
              hunkToggleText.textContent = "Accept hunk";
              hunkToggle.appendChild(hunkCheckbox);
              hunkToggle.appendChild(hunkToggleText);

              const hunkSnippet = document.createElement("pre");
              hunkSnippet.className = "patch-plan-hunk-snippet";
              hunkSnippet.textContent = formatPatchPlanHunkSnippet(hunk);

              hunkCard.appendChild(hunkHead);
              hunkCard.appendChild(hunkToggle);
              hunkCard.appendChild(hunkSnippet);
              hunkList.appendChild(hunkCard);
            }
          } else {
            const hunkEmpty = document.createElement("div");
            hunkEmpty.className = "workspace-action-hint";
            hunkEmpty.textContent = String(file.diffText || "").includes("@@ no changes @@")
              ? "No remaining hunks. The current workspace file already matches the staged target."
              : "Preview the patch plan to split this file into reviewable hunks.";
            hunkList.appendChild(hunkEmpty);
          }

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
          card.appendChild(hunkList);
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
    el.patchPlanPreview.textContent = formatPatchPlanPreviewText(previewFile);
  }

  const hasPlan = patchPlanHasFiles();
  if (el.previewPatchPlanBtn) el.previewPatchPlanBtn.disabled = !hasPlan || !appState.workspaceAttachment;
  if (el.applySelectedPatchPlanBtn) {
    el.applySelectedPatchPlanBtn.disabled = !hasPlan || !appState.workspaceAttachment || !(plan && Array.isArray(plan.selectedFileIds) && plan.selectedFileIds.length);
  }
  if (el.applyAllPatchPlanBtn) el.applyAllPatchPlanBtn.disabled = !hasPlan || !appState.workspaceAttachment || !patchPlanHasPendingDiffs();
  if (el.exportPatchPlanJsonBtn) el.exportPatchPlanJsonBtn.disabled = !hasPlan;
  if (el.exportPatchPlanMarkdownBtn) el.exportPatchPlanMarkdownBtn.disabled = !hasPlan;
  if (el.savePatchPlanSessionBtn) el.savePatchPlanSessionBtn.disabled = !hasPlan;
  renderShippingCockpit();
  renderOperatorRail();
  renderMissionControl();
  renderWorkbenchNavigation();
}

async function loadPatchPlanFromArtifact() {
  if (!appState.lastArtifact || !String(appState.lastArtifact.content || "").trim()) {
    throw new Error("Generate an artifact before loading a patch plan.");
  }
  const patchEpoch = ensureSurfaceEpoch("patch");
  appState.outputMode = "patch_plan";
  appState.patchPlan = parsePatchPlanFromArtifactContent(appState.lastArtifact.content, {
    generatedAt: appState.lastArtifact.generatedAt,
    workflowId: appState.workflowId
  });
  syncPatchPlanSelections();
  appState.patchPlanGroupOpenIds = null;
  appState.patchPlanPreviewFileId = appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "";
  renderWorkflowSummary();
  renderPatchPlanPanel({ surfaceEpoch: patchEpoch, forceRender: true });
  setWorkbenchSurface("patch", { persist: false, scroll: false });
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
  const refreshToken = reserveSurfaceRefreshToken("patch");
  const preview = await window.api.workspace.previewPatchPlan({
    rootPath: appState.workspaceAttachment.rootPath,
    plan: appState.patchPlan
  });
  if (!isSurfaceRefreshTokenCurrent("patch", refreshToken)) {
    return preview;
  }
  appState.patchPlan = normalizePatchPlanValue(preview, {
    workflowId: appState.workflowId
  });
  syncPatchPlanSelections();
  appState.patchPlanGroupOpenIds = null;
  appState.patchPlanPreviewFileId = currentPatchPlanPreviewFile()
    ? currentPatchPlanPreviewFile().fileId
    : (appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "");
  const patchEpoch = ensureSurfaceEpoch("patch");
  renderPatchPlanPanel({ surfaceEpoch: patchEpoch, forceRender: true });
  setWorkbenchSurface("patch", { persist: false, scroll: false });
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
    ? appState.patchPlan.files.filter((file) => patchPlanFileHunks(file).length > 0).map((file) => file.fileId)
    : appState.patchPlan.files.filter((file) => file.selected !== false && patchPlanFileHunks(file).length > 0).map((file) => file.fileId);
  if (!selectedFileIds.length) {
    throw new Error("Select at least one accepted hunk before applying the patch plan.");
  }
  const refreshToken = reserveSurfaceRefreshToken("patch");
  const applied = await window.api.workspace.applyPatchPlan({
    rootPath: appState.workspaceAttachment.rootPath,
    plan: appState.patchPlan,
    selectedFileIds
  });
  if (!isSurfaceRefreshTokenCurrent("patch", refreshToken)) {
    return applied;
  }
  appState.patchPlan = normalizePatchPlanValue(applied, {
    workflowId: appState.workflowId
  });
  syncPatchPlanSelections();
  appState.patchPlanGroupOpenIds = null;
  appState.patchPlanPreviewFileId = appState.patchPlan.files[0] ? appState.patchPlan.files[0].fileId : "";
  const patchEpoch = ensureSurfaceEpoch("patch");
  renderPatchPlanPanel({ surfaceEpoch: patchEpoch, forceRender: true });
  setWorkbenchSurface("patch", { persist: false, scroll: false });
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
    const tone = inferOperatorActionTone(action);
    const card = document.createElement("section");
    card.className = "operator-action-card";
    card.dataset.tone = tone;

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
    status.dataset.tone = tone;

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

function renderWorkspaceActionDeck(options = {}) {
  const surface = "apply";
  const isActive = appState.workbenchSurface === surface;
  const epochValid = options.surfaceEpoch == null || isSurfaceEpochValid(surface, options.surfaceEpoch);
  if ((!isActive && !options.forceRender) || !epochValid) {
    return;
  }
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
  renderWorkbenchNavigation();
}

function artifactHistorySummaryLine(artifact) {
  const provenanceSummary = shippingPacketProvenanceSummaryLine(artifact);
  if (provenanceSummary) {
    return provenanceSummary;
  }
  const lines = String(artifact && artifact.content ? artifact.content : "")
    .split("\n")
    .map((line) => String(line || "").trim())
    .filter(Boolean);
  return lines.find((line) => line.startsWith("- Decision:"))
    || lines.find((line) => !line.startsWith("#"))
    || "Shipping Packet snapshot";
}

async function loadShippingPacketHistoryEntry(index, options = {}) {
  const entry = normalizeShippingPacketHistory(appState.shippingPacketHistory)[index];
  if (!entry) {
    throw new Error("Shipping Packet history entry not found.");
  }
  appState.lastArtifact = { ...entry };
  const artifactEpoch = ensureSurfaceEpoch("artifact");
  renderArtifactPanel({ surfaceEpoch: artifactEpoch, forceRender: true });
  setWorkbenchSurface("artifact", { persist: false, scroll: false });
  renderShippingCockpit();
  renderOperatorRail();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Shipping Packet loaded into the dock.", "ok");
  }
  return appState.lastArtifact;
}

async function clearShippingPacketHistory(options = {}) {
  appState.shippingPacketHistory = [];
  appState.shippingPacketCompareIds = { left: "", right: "" };
  renderArtifactPanel();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Shipping Packet history cleared.", "ok");
  }
}

function renderArtifactComparePanel() {
  const model = getShippingPacketCompareModel();
  if (el.artifactCompareMetaText) {
    el.artifactCompareMetaText.textContent = !model.ready
      ? "Build at least two shipping packets to compare revisions side by side."
      : `${artifactHistorySummaryLine(model.left)} vs ${artifactHistorySummaryLine(model.right)}`;
  }
  if (el.artifactCompareDiffList) {
    el.artifactCompareDiffList.innerHTML = "";
    if (!model.ready) {
      const empty = document.createElement("div");
      empty.className = "artifact-history-empty";
      empty.textContent = "Compare needs two shipping packets. Build a second packet or reload another history entry into compare slots.";
      el.artifactCompareDiffList.appendChild(empty);
    } else {
      for (const diff of model.diffs) {
        const row = document.createElement("div");
        row.className = "workspace-action-card";

        const head = document.createElement("div");
        head.className = "workspace-action-card-head";
        const label = document.createElement("div");
        label.className = "workflow-title-text";
        label.textContent = diff.label;
        head.appendChild(label);
        head.appendChild(createStatusPill(diff.label, diff.tone));

        const grid = document.createElement("div");
        grid.className = "artifact-compare-row";

        const left = document.createElement("div");
        left.className = "artifact-compare-cell";
        const leftLabel = document.createElement("span");
        leftLabel.className = "cluster-note";
        leftLabel.textContent = "A";
        const leftValue = document.createElement("strong");
        leftValue.textContent = diff.left;
        left.appendChild(leftLabel);
        left.appendChild(leftValue);

        const right = document.createElement("div");
        right.className = "artifact-compare-cell";
        const rightLabel = document.createElement("span");
        rightLabel.className = "cluster-note";
        rightLabel.textContent = "B";
        const rightValue = document.createElement("strong");
        rightValue.textContent = diff.right;
        right.appendChild(rightLabel);
        right.appendChild(rightValue);

        grid.appendChild(left);
        grid.appendChild(right);

        row.appendChild(head);
        row.appendChild(grid);
        el.artifactCompareDiffList.appendChild(row);
      }
    }
  }

  const leftPreview = model.left && model.left.content
    ? model.left.content
    : "No shipping packet loaded in compare slot A.";
  const rightPreview = model.right && model.right.content
    ? model.right.content
    : "No shipping packet loaded in compare slot B.";

  if (el.artifactCompareLeftTitle) {
    el.artifactCompareLeftTitle.textContent = model.left ? `${model.left.title || "Shipping Packet"} A` : "Compare A";
  }
  if (el.artifactCompareLeftMeta) {
    el.artifactCompareLeftMeta.textContent = model.left
      ? `${formatTimestampLabel(model.left.generatedAt)} | ${artifactHistorySummaryLine(model.left)}`
      : "Select a shipping packet from history.";
  }
  if (el.artifactCompareLeftPreview) {
    el.artifactCompareLeftPreview.textContent = leftPreview;
  }
  if (el.artifactCompareRightTitle) {
    el.artifactCompareRightTitle.textContent = model.right ? `${model.right.title || "Shipping Packet"} B` : "Compare B";
  }
  if (el.artifactCompareRightMeta) {
    el.artifactCompareRightMeta.textContent = model.right
      ? `${formatTimestampLabel(model.right.generatedAt)} | ${artifactHistorySummaryLine(model.right)}`
      : "Select a second shipping packet from history.";
  }
  if (el.artifactCompareRightPreview) {
    el.artifactCompareRightPreview.textContent = rightPreview;
  }
  if (el.clearArtifactCompareBtn) {
    el.clearArtifactCompareBtn.disabled = !normalizeShippingPacketHistory(appState.shippingPacketHistory).length;
  }
}

function renderArtifactHistory() {
  if (!el.artifactHistoryList) return;
  const history = normalizeShippingPacketHistory(appState.shippingPacketHistory);
  appState.shippingPacketHistory = history;
  reconcileShippingPacketCompareSelection();
  el.artifactHistoryList.innerHTML = "";
  if (!history.length) {
    const empty = document.createElement("div");
    empty.className = "artifact-history-empty";
    empty.textContent = "No shipping packets yet. Build one from the Shipping Cockpit to keep a local handoff ledger.";
    el.artifactHistoryList.appendChild(empty);
  } else {
    history.forEach((artifact, index) => {
      const card = document.createElement("div");
      const isActive = Boolean(
        appState.lastArtifact
        && String(appState.lastArtifact.outputMode || "").trim() === "shipping_packet"
        && shippingPacketHistoryKey(appState.lastArtifact) === shippingPacketHistoryKey(artifact)
      );
      card.className = `workspace-action-card artifact-history-card${isActive ? " is-active" : ""}`;

      const head = document.createElement("div");
      head.className = "workspace-action-card-head";

      const copy = document.createElement("div");
      copy.className = "workspace-action-card-copy";

      const title = document.createElement("div");
      title.className = "workflow-title-text";
      title.textContent = artifact.title || "Shipping Packet";

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
      meta.appendChild(createStatusPill("Shipping Packet", "ok"));
      if (artifact.provenance && artifact.provenance.lineage && artifact.provenance.lineage.generation) {
        meta.appendChild(createStatusPill(`Rev ${artifact.provenance.lineage.generation}`, "guard"));
      }
      if (shippingPacketLinkedRunCount(artifact)) {
        meta.appendChild(createStatusPill(`${shippingPacketLinkedRunCount(artifact)} linked run${shippingPacketLinkedRunCount(artifact) === 1 ? "" : "s"}`, "good"));
      }
      if (artifact.provenance && artifact.provenance.contextPackProfile && artifact.provenance.contextPackProfile.name) {
        meta.appendChild(createStatusPill(artifact.provenance.contextPackProfile.name, "read"));
      } else if (artifact.provenance && artifact.provenance.contextPack && artifact.provenance.contextPack.name) {
        meta.appendChild(createStatusPill(artifact.provenance.contextPack.name, "read"));
      }
      if (artifact.provenance && artifact.provenance.sourceArtifact && artifact.provenance.sourceArtifact.title) {
        meta.appendChild(createStatusPill(artifact.provenance.sourceArtifact.title, "guard"));
      }
      if (artifact.provenance && artifact.provenance.patchPlan && artifact.provenance.patchPlan.totalFiles) {
        meta.appendChild(createStatusPill(`${artifact.provenance.patchPlan.totalFiles} patch files`, "guard"));
      }

      const actions = document.createElement("div");
      actions.className = "row row-wrap action-grid artifact-history-actions";

      const loadButton = document.createElement("button");
      loadButton.className = isActive ? "btn-primary" : "btn-secondary";
      loadButton.textContent = isActive ? "Loaded in Dock" : "Load to Dock";
      loadButton.disabled = isActive;
      loadButton.onclick = () => {
        loadShippingPacketHistoryEntry(index).catch((err) => showBanner(err.message || String(err), "bad"));
      };
      actions.appendChild(loadButton);

      const compareLeftButton = document.createElement("button");
      compareLeftButton.className = "btn-secondary";
      compareLeftButton.textContent = String(appState.shippingPacketCompareIds.left || "") === String(artifact.id || "") ? "Compare A" : "Set Compare A";
      compareLeftButton.disabled = String(appState.shippingPacketCompareIds.left || "") === String(artifact.id || "");
      compareLeftButton.onclick = () => {
        try {
          setShippingPacketCompareSlot("left", artifact.id);
        } catch (err) {
          showBanner(err.message || String(err), "bad");
        }
      };
      actions.appendChild(compareLeftButton);

      const compareRightButton = document.createElement("button");
      compareRightButton.className = "btn-secondary";
      compareRightButton.textContent = String(appState.shippingPacketCompareIds.right || "") === String(artifact.id || "") ? "Compare B" : "Set Compare B";
      compareRightButton.disabled = String(appState.shippingPacketCompareIds.right || "") === String(artifact.id || "");
      compareRightButton.onclick = () => {
        try {
          setShippingPacketCompareSlot("right", artifact.id);
        } catch (err) {
          showBanner(err.message || String(err), "bad");
        }
      };
      actions.appendChild(compareRightButton);

      card.appendChild(head);
      card.appendChild(meta);
      card.appendChild(actions);
      el.artifactHistoryList.appendChild(card);
    });
  }
  if (el.clearArtifactHistoryBtn) {
    el.clearArtifactHistoryBtn.disabled = history.length === 0;
  }
  renderArtifactComparePanel();
}

function renderArtifactPanel(options = {}) {
  const surface = "artifact";
  const isActive = appState.workbenchSurface === surface;
  const epochValid = options.surfaceEpoch == null || isSurfaceEpochValid(surface, options.surfaceEpoch);
  if ((!isActive && !options.forceRender) || !epochValid) {
    return;
  }
  const artifact = appState.lastArtifact;
  const workflow = getWorkflow(artifact && artifact.workflowId ? artifact.workflowId : appState.workflowId);
  const outputMode = getOutputMode(artifact && artifact.outputMode ? artifact.outputMode : appState.outputMode);
  if (el.artifactTitleText) {
    el.artifactTitleText.textContent = artifact && artifact.title
      ? artifact.title
      : `${(workflow && workflow.title) || "Workflow"} Artifact`;
  }
  if (el.artifactMetaText) {
    const linkedRuns = shippingPacketLinkedRunCount(artifact);
    const provenanceSummary = artifact && artifact.outputMode === "shipping_packet"
      ? shippingPacketProvenanceSummaryLine(artifact)
      : "";
    el.artifactMetaText.textContent = artifact && artifact.generatedAt
      ? `${(outputMode && outputMode.label) || "Output"} | ${formatTimestampLabel(artifact.generatedAt)}${linkedRuns ? ` | ${linkedRuns} linked run${linkedRuns === 1 ? "" : "s"}` : ""}${provenanceSummary ? ` | ${provenanceSummary}` : ""}`
      : `${(outputMode && outputMode.label) || "Output"} | No generated artifact yet`;
  }
  if (el.artifactPreview) {
    el.artifactPreview.textContent = artifact && artifact.content
      ? artifact.content
      : "No artifact yet.\nGenerate a response from the active workflow to preview structured output here.";
  }

  renderArtifactHistory();
  renderWorkspaceActionDeck();
  renderShippingCockpit();
  renderMissionControl();
  renderOperatorRail();
}

function renderWorkspaceAttachment() {
  if (el.workspaceSummaryText) {
    el.workspaceSummaryText.textContent = formatWorkspaceAttachment(appState.workspaceAttachment);
  }
  renderContextPackSurface({ seedDefaults: true });
  renderWorkspaceActionDeck();
  renderShippingCockpit();
  renderMissionControl();
}

function renderContextPackSurface(options = {}) {
  const contextPack = hasContextPack() ? appState.contextPack : null;
  const profiles = currentWorkspaceContextPackProfiles();
  const selectedProfile = currentContextPackProfile();
  const recommendedProfileModel = contextPackWorkflowLinkModel();
  const defaultName = defaultContextPackName();
  const defaultPaths = defaultContextPackPaths().join("\n");
  if (el.contextPackProfileSelect) {
    el.contextPackProfileSelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = profiles.length ? "New profile from current pack" : "No saved profiles for this workspace";
    el.contextPackProfileSelect.appendChild(defaultOption);
    for (const profile of profiles) {
      const option = document.createElement("option");
      option.value = profile.id;
      const workflow = contextPackProfileWorkflow(profile);
      option.textContent = `${profile.name} | ${profile.filePaths.length} file${profile.filePaths.length === 1 ? "" : "s"}${workflow ? ` | ${workflow.title}` : ""}`;
      el.contextPackProfileSelect.appendChild(option);
    }
    el.contextPackProfileSelect.value = profiles.some((profile) => profile.id === appState.activeContextPackProfileId)
      ? appState.activeContextPackProfileId
      : "";
    el.contextPackProfileSelect.disabled = !hasWorkspaceAttachment();
  }
  if (el.contextPackNameInput) {
    el.contextPackNameInput.placeholder = defaultName;
    if (options.resetInputs) {
      el.contextPackNameInput.value = "";
    } else if (contextPack) {
      el.contextPackNameInput.value = contextPack.name;
    } else if (options.seedDefaults && !String(el.contextPackNameInput.value || "").trim()) {
      el.contextPackNameInput.value = defaultName;
    }
  }
  if (el.contextPackPathsInput) {
    el.contextPackPathsInput.placeholder = defaultPaths || "README.md\npackage.json";
    if (options.resetInputs) {
      el.contextPackPathsInput.value = "";
    } else if (contextPack) {
      el.contextPackPathsInput.value = contextPack.filePaths.join("\n");
    } else if (options.seedDefaults && !String(el.contextPackPathsInput.value || "").trim() && defaultPaths) {
      el.contextPackPathsInput.value = defaultPaths;
    }
  }
  if (el.contextPackProfileStatusText) {
    el.contextPackProfileStatusText.textContent = contextPackProfileStatusText();
    const status = getContextPackProfileStatus();
    el.contextPackProfileStatusText.dataset.tone = status && status.stale ? "warn" : "ok";
  }
  if (el.contextPackWorkflowLinkText) {
    el.contextPackWorkflowLinkText.textContent = recommendedProfileModel.text;
    el.contextPackWorkflowLinkText.dataset.tone = recommendedProfileModel.tone;
  }
  if (el.loadRecommendedContextPackProfileBtn) {
    el.loadRecommendedContextPackProfileBtn.disabled = !recommendedProfileModel.canLoad;
    el.loadRecommendedContextPackProfileBtn.textContent = recommendedProfileModel.profile
      ? recommendedProfileModel.canLoad
        ? "Load Recommended"
        : "Recommended Loaded"
      : "No Recommendation";
  }
  if (el.contextPackSummaryText) {
    el.contextPackSummaryText.textContent = contextPackSummaryText(contextPack);
  }
  if (el.contextPackPreview) {
    el.contextPackPreview.textContent = contextPackPreviewText(contextPack);
  }
  if (el.suggestContextPackFilesBtn) {
    el.suggestContextPackFilesBtn.disabled = !hasWorkspaceAttachment();
  }
  if (el.buildContextPackBtn) {
    el.buildContextPackBtn.disabled = !hasWorkspaceAttachment();
  }
  if (el.clearContextPackBtn) {
    el.clearContextPackBtn.disabled = !contextPack;
  }
  if (el.saveContextPackProfileBtn) {
    el.saveContextPackProfileBtn.disabled = !contextPack;
    el.saveContextPackProfileBtn.textContent = selectedProfile ? "Update Profile" : "Save Profile";
  }
  if (el.loadContextPackProfileBtn) {
    el.loadContextPackProfileBtn.disabled = !selectedProfile || !hasWorkspaceAttachment();
  }
  if (el.refreshContextPackProfileBtn) {
    el.refreshContextPackProfileBtn.disabled = !selectedProfile || !hasWorkspaceAttachment();
  }
  if (el.deleteContextPackProfileBtn) {
    el.deleteContextPackProfileBtn.disabled = !selectedProfile;
  }
}

async function suggestContextPackFiles(options = {}) {
  if (!hasWorkspaceAttachment() || !window.api || !window.api.workspace || typeof window.api.workspace.suggestContextPack !== "function") {
    throw new Error("Attach a workspace before requesting context-pack suggestions.");
  }
  const rootPath = String(appState.workspaceAttachment.rootPath || "").trim();
  const workflowId = activeContextPackSuggestionWorkflowId(options.workflowId);
  const workflow = getWorkflow(workflowId);
  const suggestions = await window.api.workspace.suggestContextPack(rootPath, workflowId);
  const filePaths = Array.isArray(suggestions)
    ? suggestions.map((item) => normalizeDraftRelativePath(item.relativePath))
    : [];
  if (!filePaths.length) {
    throw new Error("No safe context-pack suggestions were found for this workspace.");
  }
  if (el.contextPackPathsInput) {
    el.contextPackPathsInput.value = filePaths.join("\n");
  }
  if (el.contextPackNameInput && !String(el.contextPackNameInput.value || "").trim()) {
    el.contextPackNameInput.value = defaultContextPackName();
  }
  if (options.announce !== false) {
    showBanner(
      `Suggested ${filePaths.length} context-pack file${filePaths.length === 1 ? "" : "s"} for ${(workflow && workflow.title) || "the active workflow"}.`,
      "ok"
    );
  }
  return filePaths;
}

async function refreshContextPackProfileStatus(profileId = appState.activeContextPackProfileId) {
  const targetId = String(profileId || "").trim();
  if (!targetId) {
    syncSelectedContextPackProfileStatus();
    renderContextPackSurface({ seedDefaults: true });
    renderMissionControl();
    return null;
  }
  const profile = currentWorkspaceContextPackProfiles().find((item) => item.id === targetId);
  if (!profile || !window.api || !window.api.workspace || typeof window.api.workspace.statFiles !== "function") {
    pruneContextPackProfileStatuses();
    renderContextPackSurface({ seedDefaults: true });
    renderMissionControl();
    return null;
  }
  const stats = await window.api.workspace.statFiles(profile.workspaceRoot, profile.filePaths);
  const snapshotMap = new Map(
    (Array.isArray(profile.fileSnapshots) ? profile.fileSnapshots : []).map((item) => [item.relativePath, item.modifiedAt])
  );
  const changedPaths = [];
  const missingPaths = [];
  for (const row of Array.isArray(stats) ? stats : []) {
    const relativePath = normalizeDraftRelativePath(row.relativePath);
    if (row.exists === false) {
      missingPaths.push(relativePath);
      continue;
    }
    const previousModifiedAt = String(snapshotMap.get(relativePath) || "").trim();
    if (previousModifiedAt && previousModifiedAt !== String(row.modifiedAt || "").trim()) {
      changedPaths.push(relativePath);
    }
  }
  const stale = changedPaths.length > 0 || missingPaths.length > 0;
  const message = stale
    ? `Selected profile is stale. ${changedPaths.length ? `Changed: ${changedPaths.join(", ")}.` : ""}${missingPaths.length ? `${changedPaths.length ? " " : ""}Missing: ${missingPaths.join(", ")}.` : ""} Use Refresh Profile to reload current repo files and update the saved snapshot.`
    : `Selected profile is current for ${profile.workspaceLabel}. Saved ${formatTimestampLabel(profile.savedAt)}.`;
  setContextPackProfileStatus({
    profileId: profile.id,
    stale,
    changedPaths,
    missingPaths,
    checkedAt: new Date().toISOString(),
    message
  });
  renderContextPackSurface({ seedDefaults: true });
  return getContextPackProfileStatus(profile.id);
}

async function refreshRelevantContextPackProfileStatuses(options = {}) {
  if (!hasWorkspaceAttachment()) {
    appState.contextPackProfileStatuses = {};
    appState.contextPackProfileStatus = null;
    renderContextPackSurface({ seedDefaults: true });
    renderMissionControl();
    return [];
  }
  const profiles = currentWorkspaceContextPackProfiles();
  if (!profiles.length) {
    appState.contextPackProfileStatuses = {};
    appState.contextPackProfileStatus = null;
    renderContextPackSurface({ seedDefaults: true });
    renderMissionControl();
    return [];
  }

  pruneContextPackProfileStatuses(profiles);
  const targetIds = new Set();
  if (options.all === true) {
    for (const profile of profiles) {
      targetIds.add(String(profile.id || "").trim());
    }
  } else {
    if (appState.activeContextPackProfileId) {
      targetIds.add(String(appState.activeContextPackProfileId || "").trim());
    }
    const recommended = recommendedContextPackProfile(options.workflowId || appState.workflowId);
    if (recommended && recommended.id) {
      targetIds.add(String(recommended.id || "").trim());
    }
  }

  const refreshes = [];
  for (const profileId of targetIds) {
    if (!profileId) continue;
    refreshes.push(
      refreshContextPackProfileStatus(profileId).catch(() => null)
    );
  }
  const results = await Promise.all(refreshes);
  syncSelectedContextPackProfileStatus();
  renderContextPackSurface({ seedDefaults: true });
  renderMissionControl();
  return results.filter(Boolean);
}

async function setContextPack(value, options = {}) {
  const next = normalizeContextPackValue(value);
  if (next && !contextPackMatchesWorkspaceAttachment(next, appState.workspaceAttachment)) {
    throw new Error("Context pack must stay inside the attached workspace.");
  }
  appState.contextPack = next;
  renderContextPackSurface({ syncInputs: true });
  renderWorkflowSummary();
  renderIntelSurface();
  renderShippingCockpit();
  renderMissionControl();
  if (appState.activeContextPackProfileId && options.skipProfileStatusRefresh !== true) {
    refreshContextPackProfileStatus(appState.activeContextPackProfileId).catch(() => { });
  }
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(next ? `Context pack built: ${next.name}` : "Context pack cleared.", "ok");
  }
  return next;
}

async function clearContextPack(options = {}) {
  appState.contextPack = null;
  renderContextPackSurface({ resetInputs: true, seedDefaults: true });
  renderWorkflowSummary();
  renderIntelSurface();
  renderShippingCockpit();
  renderMissionControl();
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner("Context pack cleared.", "ok");
  }
}

async function setContextPackProfiles(value, options = {}) {
  appState.contextPackProfiles = normalizeContextPackProfiles(value);
  if (!currentContextPackProfile()) {
    appState.activeContextPackProfileId = "";
  }
  if (!appState.activeContextPackProfileId) {
    setContextPackProfileStatus(null);
  }
  renderContextPackSurface({ seedDefaults: true });
  renderMissionControl();
  refreshRelevantContextPackProfileStatuses({ all: true }).catch(() => { });
  if (options.persist !== false) {
    await persistChatState();
  }
  return appState.contextPackProfiles;
}

async function saveCurrentContextPackProfile(options = {}) {
  if (!hasContextPack()) {
    throw new Error("Build a context pack before saving a reusable profile.");
  }
  const contextPack = appState.contextPack;
  const selectedProfile = reusableContextPackProfileForSave(contextPack, options);
  const savedAt = String(options.savedAt || new Date().toISOString());
  const workflowId = normalizeWorkflowId(options.workflowId || appState.workflowId);
  const nextProfile = {
    id: selectedProfile ? selectedProfile.id : `context-pack-profile-${slugifySegment(contextPack.name, "context-pack")}-${formatFileStamp(new Date().toISOString())}`,
    workspaceRoot: contextPack.rootPath,
    workspaceLabel: contextPack.rootLabel || contextPack.rootPath,
    workflowId,
    name: contextPack.name,
    filePaths: contextPack.filePaths,
    fileSnapshots: contextPack.entries.map((entry) => ({
      relativePath: entry.relativePath,
      modifiedAt: String(entry.modifiedAt || "").trim()
    })),
    savedAt
  };
  appState.contextPackProfiles = normalizeContextPackProfiles([
    nextProfile,
    ...normalizeContextPackProfiles(appState.contextPackProfiles).filter((profile) => profile.id !== nextProfile.id)
  ]);
  appState.activeContextPackProfileId = nextProfile.id;
  setContextPackProfileStatus({
    profileId: nextProfile.id,
    stale: false,
    changedPaths: [],
    missingPaths: [],
    checkedAt: nextProfile.savedAt,
    message: String(options.statusMessage || `Selected profile is current for ${nextProfile.workspaceLabel}. Saved ${formatTimestampLabel(nextProfile.savedAt)}.`)
  });
  renderContextPackSurface({ seedDefaults: true });
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(selectedProfile ? `Context pack profile updated: ${nextProfile.name}` : `Context pack profile saved: ${nextProfile.name}`, "ok");
  }
  return nextProfile;
}

async function relinkContextPackProfileToWorkflow(profileId, workflowId = appState.workflowId, options = {}) {
  const targetId = String(profileId || (el.contextPackProfileSelect && el.contextPackProfileSelect.value) || appState.activeContextPackProfileId || "").trim();
  const profile = normalizeContextPackProfiles(appState.contextPackProfiles).find((item) => item.id === targetId);
  if (!profile) {
    throw new Error("Select a saved context-pack profile first.");
  }
  const nextWorkflowId = normalizeWorkflowId(workflowId);
  if (normalizeWorkflowId(profile.workflowId) === nextWorkflowId) {
    return profile;
  }
  const workflow = getWorkflow(nextWorkflowId);
  const linkedAt = String(options.savedAt || new Date().toISOString());
  const nextProfile = {
    ...profile,
    workflowId: nextWorkflowId,
    savedAt: linkedAt
  };
  appState.contextPackProfiles = normalizeContextPackProfiles([
    nextProfile,
    ...normalizeContextPackProfiles(appState.contextPackProfiles).filter((item) => item.id !== nextProfile.id)
  ]);
  appState.activeContextPackProfileId = nextProfile.id;
  renderContextPackSurface({ seedDefaults: true });
  renderMissionControl();
  refreshRelevantContextPackProfileStatuses({ workflowId: nextWorkflowId }).catch(() => { });
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(`Context pack profile linked to ${(workflow && workflow.title) || nextWorkflowId}: ${nextProfile.name}`, "ok");
  }
  return nextProfile;
}

async function loadRecommendedContextPackProfile(options = {}) {
  const recommended = recommendedContextPackProfile(options.workflowId || appState.workflowId);
  if (!recommended) {
    throw new Error("No workflow-linked context-pack profile is available for the active workflow.");
  }
  return loadContextPackProfile(recommended.id, options);
}

async function refreshContextPackProfile(profileId, options = {}) {
  const targetId = String(profileId || (el.contextPackProfileSelect && el.contextPackProfileSelect.value) || "").trim();
  const profile = normalizeContextPackProfiles(appState.contextPackProfiles).find((item) => item.id === targetId);
  if (!profile) {
    throw new Error("Select a saved context-pack profile first.");
  }
  const status = await refreshContextPackProfileStatus(targetId);
  if (status && Array.isArray(status.missingPaths) && status.missingPaths.length) {
    throw new Error(`Cannot refresh a profile with missing repo files. Missing: ${status.missingPaths.join(", ")}`);
  }
  await loadContextPackProfile(targetId, {
    persist: false,
    announce: false
  });
  const savedAt = new Date().toISOString();
  const refreshedProfile = await saveCurrentContextPackProfile({
    profileId: targetId,
    workflowId: profile.workflowId,
    persist: options.persist,
    announce: false,
    savedAt,
    statusMessage: `Profile snapshot refreshed from current repo files. Saved ${formatTimestampLabel(savedAt)}.`
  });
  if (options.announce !== false) {
    showBanner(`Context pack profile refreshed: ${refreshedProfile.name}`, "ok");
  }
  return refreshedProfile;
}

async function loadContextPackProfile(profileId, options = {}) {
  const targetId = String(profileId || (el.contextPackProfileSelect && el.contextPackProfileSelect.value) || "").trim();
  const profile = normalizeContextPackProfiles(appState.contextPackProfiles).find((item) => item.id === targetId);
  if (!profile) {
    throw new Error("Select a saved context-pack profile first.");
  }
  if (!hasWorkspaceAttachment() || profile.workspaceRoot !== rootPathFromWorkspaceBoundValue(appState.workspaceAttachment)) {
    throw new Error("Attach the profile workspace before loading this context pack.");
  }
  const stats = await window.api.workspace.statFiles(profile.workspaceRoot, profile.filePaths);
  const snapshotMap = new Map(
    (Array.isArray(profile.fileSnapshots) ? profile.fileSnapshots : []).map((item) => [item.relativePath, item.modifiedAt])
  );
  const changedPaths = [];
  const missingPaths = [];
  for (const row of Array.isArray(stats) ? stats : []) {
    const relativePath = normalizeDraftRelativePath(row.relativePath);
    if (row.exists === false) {
      missingPaths.push(relativePath);
      continue;
    }
    const previousModifiedAt = String(snapshotMap.get(relativePath) || "").trim();
    if (previousModifiedAt && previousModifiedAt !== String(row.modifiedAt || "").trim()) {
      changedPaths.push(relativePath);
    }
  }
  const entries = await Promise.all(
    profile.filePaths.map((relativePath) => window.api.workspace.readFile(profile.workspaceRoot, relativePath, CONTEXT_PACK_READ_LIMIT))
  );
  appState.activeContextPackProfileId = profile.id;
  const result = await setContextPack({
    id: `context-pack-${slugifySegment(profile.name, "context-pack")}-${formatFileStamp(new Date().toISOString())}`,
    name: profile.name,
    rootPath: profile.workspaceRoot,
    rootLabel: profile.workspaceLabel,
    builtAt: new Date().toISOString(),
    filePaths: profile.filePaths,
    entries
  }, {
    ...options,
    skipProfileStatusRefresh: true
  });
  setContextPackProfileStatus({
    profileId: profile.id,
    stale: changedPaths.length > 0 || missingPaths.length > 0,
    changedPaths,
    missingPaths,
    checkedAt: new Date().toISOString(),
    message: changedPaths.length > 0 || missingPaths.length > 0
      ? `Profile refreshed from changed repo files. ${changedPaths.length ? `Changed: ${changedPaths.join(", ")}.` : ""}${missingPaths.length ? `${changedPaths.length ? " " : ""}Missing: ${missingPaths.join(", ")}.` : ""}`
      : `Selected profile is current for ${profile.workspaceLabel}. Saved ${formatTimestampLabel(profile.savedAt)}.`
  });
  renderContextPackSurface({ seedDefaults: true });
  return result;
}

async function deleteContextPackProfile(profileId, options = {}) {
  const targetId = String(profileId || (el.contextPackProfileSelect && el.contextPackProfileSelect.value) || "").trim();
  if (!targetId) {
    throw new Error("Select a saved context-pack profile first.");
  }
  const existing = normalizeContextPackProfiles(appState.contextPackProfiles).find((profile) => profile.id === targetId);
  if (!existing) {
    throw new Error("Saved context-pack profile is unavailable.");
  }
  appState.contextPackProfiles = normalizeContextPackProfiles(appState.contextPackProfiles).filter((profile) => profile.id !== targetId);
  if (appState.activeContextPackProfileId === targetId) {
    appState.activeContextPackProfileId = "";
  }
  if (appState.contextPackProfileStatus && appState.contextPackProfileStatus.profileId === targetId) {
    setContextPackProfileStatus(null);
  }
  pruneContextPackProfileStatuses();
  renderContextPackSurface({ seedDefaults: true });
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(`Context pack profile removed: ${existing.name}`, "ok");
  }
}

async function buildContextPackFromInputs(options = {}) {
  if (!hasWorkspaceAttachment() || !window.api || !window.api.workspace) {
    throw new Error("Attach a workspace before building a context pack.");
  }
  const rootPath = String(appState.workspaceAttachment.rootPath || "").trim();
  const rootLabel = String(appState.workspaceAttachment.label || rootPath).trim();
  const name = String((el.contextPackNameInput && el.contextPackNameInput.value) || "").trim() || defaultContextPackName();
  const typedPaths = parseContextPackPathsInput((el.contextPackPathsInput && el.contextPackPathsInput.value) || "");
  const filePaths = typedPaths.length ? typedPaths : defaultContextPackPaths(appState.workspaceAttachment);
  if (!filePaths.length) {
    throw new Error("Enter at least one relative workspace path for the context pack.");
  }
  const entries = await Promise.all(
    filePaths.map((relativePath) => window.api.workspace.readFile(rootPath, relativePath, CONTEXT_PACK_READ_LIMIT))
  );
  return setContextPack({
    id: `context-pack-${slugifySegment(name, "context-pack")}-${formatFileStamp(new Date().toISOString())}`,
    name,
    rootPath,
    rootLabel,
    builtAt: new Date().toISOString(),
    filePaths,
    entries
  }, options);
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
      setPromptEditorValue(String(action), { focus: true });
      showBanner("Follow-up prompt loaded.", "ok");
    };
    el.workflowFollowupActions.appendChild(button);
  }
}

function renderWorkflowQuickActions() {
  if (!el.workflowQuickActions) return;
  el.workflowQuickActions.innerHTML = "";
  for (const workflow of WORKFLOWS) {
    const defaultMode = getOutputMode(workflow.defaultOutputMode);
    const detailParts = [];
    if (defaultMode && defaultMode.label) {
      detailParts.push(defaultMode.label);
    }
    if (workflow.description) {
      detailParts.push(truncateInlineText(workflow.description, 72));
    }
    const button = document.createElement("button");
    button.className = "btn-secondary workflow-quick-btn";
    button.title = String(workflow.description || workflow.title || "");
    button.dataset.workflowId = workflow.id;
    button.classList.toggle("is-active", workflow.id === appState.workflowId);

    const title = document.createElement("span");
    title.className = "workflow-quick-title";
    title.textContent = workflow.title;
    button.appendChild(title);

    if (detailParts.length) {
      const note = document.createElement("span");
      note.className = "workflow-quick-note";
      note.textContent = detailParts.join(" · ");
      button.appendChild(note);
    }

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

function updateSessionStatusHeader() {
  if (el.activeSessionNameHeader) {
    const name = appState.activeSessionName || "Draft";
    const status = appState.restored ? " (Restored)" : "";
    el.activeSessionNameHeader.textContent = `${name}${status}`;
  }
}

function renderWorkflowSummary() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  updateDynamicChrome();
  renderHeroSpotlight();
  renderGlobalControlBar();
  renderSystemNavigation();
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
  renderShippingCockpit();
  renderOperatorRail();
  renderMissionControl();
}

function workflowPromptTemplate(workflow) {
  const base = workflow && workflow.starterPrompt ? String(workflow.starterPrompt) : "";
  const contextLead = contextPackPromptLead();
  return [base, contextLead].filter(Boolean).join("\n\n");
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
  lines.push(...contextPackSystemLines());
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
    contextPack: appState.contextPack,
    contextPackProfiles: appState.contextPackProfiles,
    activeContextPackProfileId: appState.activeContextPackProfileId,
    lastArtifact: appState.lastArtifact,
    shippingPacketHistory: appState.shippingPacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
    verificationRunPlan: appState.verificationRunPlan,
    verificationRunHistory: appState.verificationRunHistory
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
  const recommendedProfile = recommendedContextPackProfile(workflow.id);
  let autoLoadedProfile = null;
  let autoLoadError = "";
  if (
    options.autoLoadRecommendedProfile !== false
    && Boolean(appState.settings && appState.settings.autoLoadRecommendedContextProfile)
    && hasWorkspaceAttachment()
    && recommendedProfile
    && !contextPackProfileMatchesLoadedPack(recommendedProfile)
  ) {
    try {
      await loadContextPackProfile(recommendedProfile.id, {
        persist: false,
        announce: false
      });
      autoLoadedProfile = recommendedProfile;
    } catch (err) {
      autoLoadError = err && err.message ? err.message : String(err);
    }
  }
  if (workflow.id === "shipping_audit") {
    appState.systemSurface = "shipping";
  } else if (workflow.id === "bridge_diagnostics") {
    appState.systemSurface = "performance";
  }
  renderWorkflowSummary();
  renderContextPackSurface({ seedDefaults: true });
  renderIntelSurface();
  renderPatchPlanPanel();
  renderArtifactPanel();
  refreshRelevantContextPackProfileStatuses({ workflowId: workflow.id }).catch(() => { });
  if (shouldSeedPrompt && el.promptInput) {
    setPromptEditorValue(workflowPromptTemplate(workflow), { focus: true });
  }
  if (shouldPersist) {
    await persistChatState();
  }
  if (shouldAnnounce) {
    showBanner(
      autoLoadedProfile
        ? `Workflow loaded: ${workflow.title}. Auto-loaded context profile: ${autoLoadedProfile.name}`
        : autoLoadError
          ? `Workflow loaded: ${workflow.title}. Recommended profile failed to load: ${autoLoadError}`
          : recommendedProfile
            ? `Workflow loaded: ${workflow.title}. Recommended context profile: ${recommendedProfile.name}`
            : `Workflow loaded: ${workflow.title}`,
      autoLoadError ? "bad" : "ok"
    );
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
      syncPatchPlanSelections();
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
  if (appState.outputMode === "patch_plan") {
    setWorkbenchSurface("patch", { persist: false, scroll: false });
  }
  if (options.persist !== false) {
    await persistChatState();
  }
}

async function setWorkspaceAttachment(summary, options = {}) {
  const previousWorkspaceRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  appState.workspaceAttachment = summary && typeof summary === "object" ? summary : null;
  if (appState.workspaceAttachment) {
    recordAttachedWorkspace(appState.workspaceAttachment, { render: false });
  }
  reconcileWorkspaceBoundState(previousWorkspaceRoot);
  resetWorkspaceActions();
  renderWorkspaceAttachment();
  renderWorkflowSummary();
  renderPatchPlanPanel();
  renderIntelSurface();
  renderOperatorMemorySurface();
  if (appState.workspaceAttachment) {
    analyzeProjectIntelligence();
  }
  if (hasWorkspaceAttachment() && !hasContextPack() && el.contextPackPathsInput && !String(el.contextPackPathsInput.value || "").trim()) {
    suggestContextPackFiles({ announce: false }).catch(() => { });
  }
  refreshRelevantContextPackProfileStatuses({ all: true }).catch(() => { });
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
  ensurePatchPlanContextProvenance();
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
    contextPack: appState.contextPack,
    contextPackProfiles: appState.contextPackProfiles,
    activeContextPackProfileId: appState.activeContextPackProfileId,
    runtimeSummary: {
      systemStats: stats,
      llmStatus: appState.llmStatus,
      bridgeHealth
    },
    recentLogs: logRows,
    recentChatLogs: chatRows,
    artifact: appState.lastArtifact,
    shippingPacketHistory: appState.shippingPacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    verificationRunPlan: appState.verificationRunPlan,
    verificationRunHistory: appState.verificationRunHistory,
    state
  };
}

function showBanner(message, tone = "ok") {
  // Phase 16: Suppress distraction during onboarding
  const onboardingCompleted = appState.settings ? appState.settings.onboardingCompleted : false;
  if (!onboardingCompleted && tone === "bad" && appState.setupState !== "ready") {
    console.warn("[Onboarding] Banner Suppressed:", message);
    return;
  }
  if (el.statusLabel) {
    el.statusLabel.textContent = `[${tone}] ${message}`;
    el.statusLabel.dataset.tone = tone;
  }
}

function formatTemplateString(template, values = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => {
    if (!Object.prototype.hasOwnProperty.call(values, key)) return "";
    const raw = values[key];
    return raw == null ? "" : String(raw);
  });
}

function recoveryCopy() {
  const config = window.NeuralShellConfig || {};
  return config.RECOVERY_COPY || {};
}

function recoveryBannerCopy(key, fallback, values = {}) {
  const copy = recoveryCopy();
  const banners = copy && copy.BANNERS && typeof copy.BANNERS === "object"
    ? copy.BANNERS
    : {};
  return formatTemplateString(banners[key] || fallback, values);
}

function recoveryFallbackStatusDetail() {
  const fallback = "Open LLM Setup in the settings drawer to inspect the active bridge, model, and connection rules.";
  const value = recoveryCopy().FALLBACK_STATUS_DETAIL;
  return String(value || fallback).trim() || fallback;
}

function recoveryStarterPromptFallback() {
  const fallback = "Diagnose the local bridge, recommend the smallest safe fix, and keep the workflow offline-first.";
  const value = recoveryCopy().STARTER_PROMPT_FALLBACK;
  return String(value || fallback).trim() || fallback;
}

function recoveryEmptyStateTitle() {
  const fallback = "No active conversation yet.";
  const emptyState = recoveryCopy().EMPTY_STATE || {};
  return String(emptyState.TITLE || fallback).trim() || fallback;
}

function recoveryEmptyStateHints() {
  const fallback = [
    "1. Detect the bridge and confirm the base URL.",
    "2. Pick a model in Chat Ops or LLM Setup.",
    "3. Load a workflow prompt when you want a guided next step."
  ];
  const emptyState = recoveryCopy().EMPTY_STATE || {};
  return Array.isArray(emptyState.HINTS) && emptyState.HINTS.length ? emptyState.HINTS : fallback;
}

function recoveryEmptyStateActionLabel(key, fallback) {
  const emptyState = recoveryCopy().EMPTY_STATE || {};
  const actions = emptyState.ACTIONS || {};
  return String(actions[key] || fallback).trim() || fallback;
}

function describeLlmStatus(status) {
  const normalized = String(status || "unknown").trim().toLowerCase();
  const config = window.NeuralShellConfig || {};
  const messages = config.LLM_STATUS_MESSAGES || {};
  return messages[normalized] || messages.UNKNOWN || {
    short: `LLM status: ${normalized}.`,
    detail: recoveryFallbackStatusDetail(),
    tone: "ok"
  };
}

function offlineModeEnabled() {
  return airgapPolicy.offlineModeEnabled(appState.settings);
}

function updateSettingsConnectionModeText() {
  if (!el.settingsConnectionModeText) return;
  const liveAllowRemote = Boolean(appState.settings && appState.settings.allowRemoteBridge);
  const draftAllowRemote = el.allowRemoteBridgeInput ? Boolean(el.allowRemoteBridgeInput.checked) : liveAllowRemote;
  el.settingsConnectionModeText.textContent = airgapPolicy.settingsConnectionModeText({
    liveAllowRemote,
    draftAllowRemote
  });
}

function renderConnectionModeControls() {
  const allowRemote = Boolean(appState.settings && appState.settings.allowRemoteBridge);
  if (el.offlineModeInput) {
    el.offlineModeInput.checked = !allowRemote;
  }
  if (el.allowRemoteBridgeInput) {
    el.allowRemoteBridgeInput.checked = allowRemote;
  }
  if (el.offlineModeSummaryText) {
    el.offlineModeSummaryText.textContent = airgapPolicy.offlineModeSummaryText(allowRemote);
  }
  renderHeroSpotlight();
  renderGlobalControlBar();
  updateSettingsConnectionModeText();
}

async function persistOfflineModePreference(offlineEnabled) {
  if (!window.api || !window.api.settings || typeof window.api.settings.update !== "function") {
    renderConnectionModeControls();
    return {
      ok: false,
      reason: "settings_unavailable"
    };
  }
  const allowRemoteBridge = !offlineEnabled;
  if (Boolean(appState.settings && appState.settings.allowRemoteBridge) === allowRemoteBridge) {
    renderConnectionModeControls();
    return {
      ok: true,
      changed: false
    };
  }
  const current = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
  const next = mergeBridgeSettingsState(current, {
    allowRemoteBridge
  });
  appState.settings = await window.api.settings.update(next);
  const activeProfile = currentBridgeProfile();
  renderConnectionModeControls();
  const fallbackSync = await syncModelToLiveBridgeFallback({ announce: false });
  const draftProfile = readProfileDraftFromForm();
  if (draftProfile) {
    syncProfileTestMessaging(draftProfile);
    renderProviderProfileHelp(draftProfile.provider);
  } else {
    renderProviderProfileHelp((activeProfile && activeProfile.provider) || "ollama");
  }
  renderProviderPresetList();
  applyLlmStatus(appState.llmStatus);
  if (!allowRemoteBridge && fallbackSync.bridgeSelection && fallbackSync.bridgeSelection.liveProfile) {
    showBanner(
      recoveryBannerCopy("OFFLINE_MODE_REVERTED", "Offline Mode turned on. Live bridge reverted to {profileName}.", {
        profileName: fallbackSync.bridgeSelection.liveProfile.name
      }),
      "ok"
    );
  } else if (!allowRemoteBridge) {
    showBanner(recoveryBannerCopy("OFFLINE_MODE_BLOCKED", "Offline Mode turned on. Hosted profiles are blocked."), "ok");
  } else {
    showBanner(
      recoveryBannerCopy("OFFLINE_MODE_HOSTED_AVAILABLE", "Offline Mode turned off. Hosted profiles are available again."),
      "ok"
    );
  }
  return {
    ok: true,
    changed: true,
    fallbackSync
  };
}

function updateIntelBrief() {
  const localOnly = offlineModeEnabled();
  const reconnect = appState.settings.connectOnStartup !== false;
  if (el.intelModeText) {
    const theme = String(appState.settings.theme || "dark");
    el.intelModeText.textContent = `${localOnly ? "Offline Mode on" : "Hosted access on"} | ${reconnect ? "auto reconnect" : "manual reconnect"} | ${theme}`;
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
  const localOnly = offlineModeEnabled();
  const reconnect = appState.settings.connectOnStartup !== false;
  const segments = [
    localOnly ? "Offline Mode on" : "Hosted access on",
    reconnect ? "auto reconnect on" : "manual reconnect",
    String(appState.settings.theme || "dark")
  ];
  el.workspaceModeText.textContent = segments.join(" | ");
  renderConnectionModeControls();
  renderHeroSpotlight();
  renderGlobalControlBar();
  renderThreadTaskStrip();
  renderSettingsQuickstartHints();
  updateIntelBrief();
  renderIntelSurface();
}

function applyLlmStatus(status, options = {}) {
  const config = window.NeuralShellConfig || {};
  const LLM_STATUS = config.LLM_STATUS || {};
  const nextStatus = String(status || LLM_STATUS.OFFLINE || "bridge_offline");
  const previousStatus = appState.llmStatus;

  // Manual actions always win and increment the epoch.
  // Heartbeat updates from IPC are ignored if a newer epoch exists.
  if (options.manual) {
    appState.llmStatusEpoch += 1;
  } else if (options.epoch != null && options.epoch < appState.llmStatusEpoch) {
    return; // Ignore stale heartbeat
  }

  // Deduplicate updates unless forced or manual
  if (nextStatus === previousStatus && !options.force && !options.manual) {
    return;
  }

  appState.llmStatus = nextStatus;
  const copy = describeLlmStatus(appState.llmStatus);

  // Provide immediate banner feedback for background transitions
  if (nextStatus !== previousStatus && !options.manual) {
    if (nextStatus === LLM_STATUS.ONLINE) {
      showBanner(recoveryBannerCopy("BRIDGE_CONNECTED", "Bridge connection established."), "ok");
      document.getElementById("recoveryBanner").classList.add("hidden");
    } else if (nextStatus === LLM_STATUS.RECONNECTING || nextStatus === LLM_STATUS.OFFLINE) {
      showBanner(recoveryBannerCopy("BRIDGE_DISCONNECTED", "Bridge connection lost."), "warn");
      document.getElementById("recoveryBanner").classList.remove("hidden");
    }
  }

  // Track status change
  if (window.api && window.api.invoke) {
    window.api.invoke("telemetry:log", "bridge_status", nextStatus, {
      epoch: appState.llmStatusEpoch,
      manual: !!options.manual
    }).catch(() => { });
  }
  if (el.statusMeta) {
    el.statusMeta.textContent = copy.short;
    el.statusMeta.dataset.tone = copy.tone;
  }
  if (el.bridgeStatusText) {
    el.bridgeStatusText.textContent = copy.detail;
  }
  renderSettingsQuickstartHints();
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
  setPromptEditorValue(
    workflowPromptTemplate(workflow) || recoveryStarterPromptFallback(),
    { focus: true }
  );
  showBanner(recoveryBannerCopy("STARTER_PROMPT_LOADED", "Starter prompt loaded."), "ok");
}

async function runBridgeAutoDetect() {
  if (!window.api || !window.api.llm) return;
  showBanner(recoveryBannerCopy("DETECTING_LOCAL_BRIDGE", "Detecting local bridge..."), "ok");
  try {
    const result = await window.api.llm.autoDetect();
    if (result && result.ok) {
      await refreshModels();
      applyLlmStatus("bridge_online", { manual: true });
      showBanner(
        recoveryBannerCopy("LOCAL_BRIDGE_DETECTED", "Local bridge detected at {baseUrl}.", {
          baseUrl: result.baseUrl
        }),
        "ok"
      );
      return result;
    }
    applyLlmStatus(appState.settings.connectOnStartup !== false ? "bridge_reconnecting" : "bridge_offline", { manual: true });
    showBanner(
      recoveryBannerCopy("LOCAL_BRIDGE_NOT_DETECTED", "Local bridge not detected: {reason}", {
        reason: result && result.reason ? result.reason : "offline"
      }),
      "bad"
    );
    return result;
  } catch (err) {
    applyLlmStatus("error", { manual: true });
    showBanner(
      recoveryBannerCopy("BRIDGE_DETECT_FAILED", "Bridge detect failed: {reason}", {
        reason: err.message || String(err)
      }),
      "bad"
    );
    throw err;
  }
}

async function runBridgeHealthCheck() {
  if (!window.api || !window.api.llm) return;
  showBanner(recoveryBannerCopy("CHECKING_BRIDGE_HEALTH", "Checking bridge health..."), "ok");
  try {
    const health = await window.api.llm.health();
    applyLlmStatus(health && health.ok ? "bridge_online" : "bridge_offline", { manual: true });
    showBanner(
      health && health.ok
        ? recoveryBannerCopy("BRIDGE_HEALTHY", "Bridge healthy at {baseUrl}.", {
          baseUrl: health.baseUrl
        })
        : recoveryBannerCopy("BRIDGE_HEALTH_FAILED", "Bridge health failed: {reason}", {
          reason: health && health.reason ? health.reason : "offline"
        }),
      health && health.ok ? "ok" : "bad"
    );
    return health;
  } catch (err) {
    applyLlmStatus("error", { manual: true });
    showBanner(
      recoveryBannerCopy("BRIDGE_HEALTH_FAILED", "Bridge health failed: {reason}", {
        reason: err.message || String(err)
      }),
      "bad"
    );
    throw err;
  }
}

function renderChatEmptyState() {
  const empty = document.createElement("div");
  empty.className = "chat-empty chat-empty-rich";

  const title = document.createElement("div");
  title.className = "chat-empty-title";
  title.textContent = recoveryEmptyStateTitle();

  const note = document.createElement("p");
  note.className = "chat-empty-note";
  note.textContent = describeLlmStatus(appState.llmStatus).detail;

  const hints = document.createElement("div");
  hints.className = "chat-empty-hints";
  recoveryEmptyStateHints().forEach((item) => {
    const row = document.createElement("div");
    row.className = "workspace-action-hint";
    row.textContent = item;
    hints.appendChild(row);
  });

  const actions = document.createElement("div");
  actions.className = "chat-empty-actions";

  const detectBtn = document.createElement("button");
  detectBtn.textContent = recoveryEmptyStateActionLabel("DETECT_LOCAL_BRIDGE", "Detect Local Bridge");
  detectBtn.onclick = () => {
    runBridgeAutoDetect().catch((err) => showBanner(err.message || String(err), "bad"));
  };

  const settingsBtn = document.createElement("button");
  settingsBtn.textContent = recoveryEmptyStateActionLabel("OPEN_SETTINGS_MENU", "Open Settings Menu");
  settingsBtn.onclick = () => {
    setSettingsMenuOpen(true);
  };

  const promptBtn = document.createElement("button");
  promptBtn.textContent = recoveryEmptyStateActionLabel("LOAD_STARTER_PROMPT", "Load Starter Prompt");
  promptBtn.onclick = () => {
    seedStarterPrompt();
  };

  actions.appendChild(detectBtn);
  actions.appendChild(settingsBtn);
  actions.appendChild(promptBtn);
  empty.appendChild(title);
  empty.appendChild(note);
  empty.appendChild(hints);
  empty.appendChild(actions);
  return empty;
}

function truncateInlineText(value, maxLength = 96) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

const WORKFLOW_CHROME_PALETTES = {
  bridge_diagnostics: {
    brand: "#26c9b4",
    brand2: "#ffd166",
    accentSpotA: "rgba(38, 201, 180, 0.24)",
    accentSpotB: "rgba(93, 154, 255, 0.2)",
    accentSpotC: "rgba(255, 209, 102, 0.14)",
    panelStart: "rgba(8, 22, 34, 0.95)",
    panelEnd: "rgba(19, 38, 54, 0.92)",
    surfaceStart: "rgba(7, 17, 29, 0.5)",
    surfaceEnd: "rgba(10, 21, 32, 0.3)",
    chatUserTint: "rgba(38, 201, 180, 0.18)",
    chatAssistantTint: "rgba(93, 154, 255, 0.2)",
    chatSystemTint: "rgba(255, 209, 102, 0.18)"
  },
  shipping_audit: {
    brand: "#ff8c61",
    brand2: "#ffd166",
    accentSpotA: "rgba(255, 140, 97, 0.24)",
    accentSpotB: "rgba(255, 99, 132, 0.18)",
    accentSpotC: "rgba(255, 209, 102, 0.14)",
    panelStart: "rgba(28, 18, 21, 0.96)",
    panelEnd: "rgba(55, 27, 24, 0.9)",
    surfaceStart: "rgba(27, 14, 18, 0.48)",
    surfaceEnd: "rgba(20, 14, 16, 0.28)",
    chatUserTint: "rgba(255, 140, 97, 0.16)",
    chatAssistantTint: "rgba(255, 99, 132, 0.18)",
    chatSystemTint: "rgba(255, 209, 102, 0.18)"
  },
  bug_triage: {
    brand: "#ff6f7d",
    brand2: "#88e0ff",
    accentSpotA: "rgba(255, 111, 125, 0.24)",
    accentSpotB: "rgba(136, 224, 255, 0.2)",
    accentSpotC: "rgba(255, 174, 92, 0.14)",
    panelStart: "rgba(31, 14, 20, 0.96)",
    panelEnd: "rgba(39, 21, 34, 0.92)",
    surfaceStart: "rgba(25, 13, 20, 0.5)",
    surfaceEnd: "rgba(17, 15, 24, 0.3)",
    chatUserTint: "rgba(255, 111, 125, 0.18)",
    chatAssistantTint: "rgba(136, 224, 255, 0.2)",
    chatSystemTint: "rgba(255, 174, 92, 0.18)"
  },
  spec_writer: {
    brand: "#84d26b",
    brand2: "#ffd166",
    accentSpotA: "rgba(132, 210, 107, 0.22)",
    accentSpotB: "rgba(88, 191, 255, 0.18)",
    accentSpotC: "rgba(255, 209, 102, 0.14)",
    panelStart: "rgba(15, 25, 21, 0.95)",
    panelEnd: "rgba(24, 40, 34, 0.92)",
    surfaceStart: "rgba(12, 20, 18, 0.5)",
    surfaceEnd: "rgba(13, 21, 19, 0.3)",
    chatUserTint: "rgba(132, 210, 107, 0.18)",
    chatAssistantTint: "rgba(88, 191, 255, 0.18)",
    chatSystemTint: "rgba(255, 209, 102, 0.18)"
  },
  session_handoff: {
    brand: "#67c7ff",
    brand2: "#ffe082",
    accentSpotA: "rgba(103, 199, 255, 0.22)",
    accentSpotB: "rgba(99, 120, 255, 0.18)",
    accentSpotC: "rgba(255, 224, 130, 0.16)",
    panelStart: "rgba(13, 22, 34, 0.95)",
    panelEnd: "rgba(20, 33, 52, 0.92)",
    surfaceStart: "rgba(10, 17, 28, 0.5)",
    surfaceEnd: "rgba(10, 18, 28, 0.3)",
    chatUserTint: "rgba(103, 199, 255, 0.18)",
    chatAssistantTint: "rgba(99, 120, 255, 0.18)",
    chatSystemTint: "rgba(255, 224, 130, 0.18)"
  }
};

function chromePaletteForState() {
  const workflowId = normalizeWorkflowId(appState.workflowId);
  const base = WORKFLOW_CHROME_PALETTES[workflowId] || WORKFLOW_CHROME_PALETTES.shipping_audit;
  const liveProfile = liveBridgeProfile() || currentBridgeProfile();
  const provider = getBridgeProvider(liveProfile ? liveProfile.provider : "ollama");
  if (!provider.remote) {
    return base;
  }
  return {
    ...base,
    accentSpotB: "rgba(129, 122, 255, 0.22)",
    accentSpotC: "rgba(255, 126, 179, 0.14)",
    chatAssistantTint: "rgba(129, 122, 255, 0.2)"
  };
}

function updateDynamicChrome() {
  const palette = chromePaletteForState();
  const root = document.documentElement;
  root.style.setProperty("--brand", palette.brand);
  root.style.setProperty("--brand-2", palette.brand2);
  root.style.setProperty("--accent-spot-a", palette.accentSpotA);
  root.style.setProperty("--accent-spot-b", palette.accentSpotB);
  root.style.setProperty("--accent-spot-c", palette.accentSpotC);
  root.style.setProperty("--panel-gradient-start", palette.panelStart);
  root.style.setProperty("--panel-gradient-end", palette.panelEnd);
  root.style.setProperty("--surface-gradient-start", palette.surfaceStart);
  root.style.setProperty("--surface-gradient-end", palette.surfaceEnd);
  root.style.setProperty("--chat-user-tint", palette.chatUserTint);
  root.style.setProperty("--chat-assistant-tint", palette.chatAssistantTint);
  root.style.setProperty("--chat-system-tint", palette.chatSystemTint);
  root.style.setProperty("--glow-cyan", palette.accentSpotA);
  root.style.setProperty("--glow-cyan-strong", palette.accentSpotB);
  document.body.dataset.workflowId = normalizeWorkflowId(appState.workflowId);
  const liveProfile = liveBridgeProfile() || currentBridgeProfile();
  document.body.dataset.providerId = normalizeBridgeProviderId(liveProfile ? liveProfile.provider : "ollama");
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

function initialsFromLabel(label, fallback = "NS") {
  const tokens = String(label || "")
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);
  if (!tokens.length) {
    return fallback;
  }
  return tokens.map((token) => token[0].toUpperCase()).join("");
}

function currentDraftPreviewText() {
  const draftText = String(appState.draftPrompt || "").trim();
  if (draftText) {
    return truncateInlineText(draftText, 96);
  }
  const latestMessage = Array.isArray(appState.chat) && appState.chat.length
    ? appState.chat[appState.chat.length - 1]
    : null;
  if (!latestMessage || !String(latestMessage.content || "").trim()) {
    return "Fresh draft. Start typing here or jump into an encrypted session.";
  }
  return truncateInlineText(String(latestMessage.content || ""), 96);
}

function normalizeChatOpsTrayId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "assist" || normalized === "archive" || normalized === "none"
    ? normalized
    : "thread";
}

function normalizePerformanceTrayId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "trace" || normalized === "outputs" || normalized === "none"
    ? normalized
    : "diagnostics";
}

function normalizeRuntimeOutputViewId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "logs" || normalized === "chat"
    ? normalized
    : "audit";
}

function normalizeIntelTrayId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "knowledge" || normalized === "capability" || normalized === "none"
    ? normalized
    : "brief";
}

function normalizeSessionsTrayId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "inspect" || normalized === "none"
    ? normalized
    : "manage";
}

function normalizeCommandsTrayId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "routing" || normalized === "none"
    ? normalized
    : "index";
}

function normalizeInboxFilterId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "pinned" || normalized === "unread"
    ? normalized
    : "all";
}

function normalizeSystemSurfaceId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  if (normalized === "performance" || normalized === "runtime") return "performance";
  if (normalized === "shipping" || normalized === "release") return "shipping";
  if (normalized === "context") return "context";
  return "workbench";
}

function normalizePinnedSessionNames(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || "").trim()).filter(Boolean)))
    : [];
}

function normalizeSessionReadMarkers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const out = {};
  for (const [name, updatedAt] of Object.entries(value)) {
    const normalizedName = String(name || "").trim();
    const normalizedUpdatedAt = String(updatedAt || "").trim();
    if (normalizedName && normalizedUpdatedAt) {
      out[normalizedName] = normalizedUpdatedAt;
    }
  }
  return out;
}

function normalizeWorkbenchSurfaceId(id) {
  const normalized = String(id || "").trim().toLowerCase();
  return normalized === "patch" || normalized === "apply"
    ? normalized
    : "artifact";
}

function recordSurfaceDiagnostic(surface, category, detail) {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  const entry = {
    surface: normalized || surface,
    category: String(category || "event"),
    detail: String(detail || ""),
    timestamp: new Date().toISOString(),
    epoch: normalized ? (appState.surfaceEpochs[normalized] || 0) : null,
    token: normalized ? (appState.surfaceRefreshTokens[normalized] || 0) : null
  };
  const diagnostics = Array.isArray(appState.surfaceDiagnostics) ? appState.surfaceDiagnostics.slice() : [];
  diagnostics.push(entry);
  if (diagnostics.length > 40) diagnostics.shift();
  appState.surfaceDiagnostics = diagnostics;
}

function reserveSurfaceRefreshToken(surface) {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  if (!normalized) return null;
  const next = (appState.surfaceRefreshTokens[normalized] || 0) + 1;
  appState.surfaceRefreshTokens[normalized] = next;
  recordSurfaceDiagnostic(normalized, "reserve-token", `reserved ${next}`);
  return next;
}

function isSurfaceRefreshTokenCurrent(surface, token) {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  if (!normalized || typeof token !== "number") return false;
  const valid = (appState.surfaceRefreshTokens[normalized] || 0) === token;
  recordSurfaceDiagnostic(
    normalized,
    valid ? "token-current" : "stale-token",
    `token ${token} is ${valid ? "current" : "stale"}`
  );
  return valid;
}

function currentSurfaceRefreshToken(surface) {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  return normalized ? (appState.surfaceRefreshTokens[normalized] || 0) : 0;
}

function ensureSurfaceEpoch(surface) {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  if (!normalized) return null;
  appState.surfaceEpochs[normalized] = (appState.surfaceEpochs[normalized] || 0) + 1;
  recordSurfaceDiagnostic(normalized, "new-epoch", `epoch ${appState.surfaceEpochs[normalized]}`);
  return appState.surfaceEpochs[normalized];
}

function isSurfaceEpochValid(surface, epoch) {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  if (!normalized || typeof epoch !== "number") return false;
  return appState.surfaceEpochs[normalized] === epoch;
}

function workspaceLayoutIsCompact() {
  return typeof window !== "undefined" && window.innerWidth <= WORKSPACE_LAYOUT_BREAKPOINT;
}

function normalizeLeftPaneWidth(value) {
  return clampNumber(value, MIN_LEFT_PANE_WIDTH, MAX_LEFT_PANE_WIDTH, DEFAULT_LEFT_PANE_WIDTH);
}

function normalizeRightPaneWidth(value) {
  return clampNumber(value, MIN_RIGHT_PANE_WIDTH, MAX_RIGHT_PANE_WIDTH, DEFAULT_RIGHT_PANE_WIDTH);
}

function applyWorkspaceLayout() {
  if (!el.workspaceTopology) return;
  appState.leftPaneWidth = normalizeLeftPaneWidth(appState.leftPaneWidth);
  appState.rightPaneWidth = normalizeRightPaneWidth(appState.rightPaneWidth);
  const compact = workspaceLayoutIsCompact();
  el.workspaceTopology.style.setProperty("--pane-left-width", `${appState.leftPaneWidth}px`);
  el.workspaceTopology.style.setProperty("--pane-right-width", `${appState.rightPaneWidth}px`);
  el.workspaceTopology.classList.toggle("is-compact", compact);
  el.workspaceTopology.classList.toggle("is-right-collapsed", !compact && appState.rightPaneCollapsed);
  if (el.leftPaneResizeHandle) {
    el.leftPaneResizeHandle.disabled = compact;
  }
  if (el.rightPaneResizeHandle) {
    el.rightPaneResizeHandle.disabled = compact || appState.rightPaneCollapsed;
  }
  if (el.toggleRightPaneBtn) {
    const label = compact
      ? "System Stack"
      : (appState.rightPaneCollapsed ? "Open System" : "Collapse System");
    el.toggleRightPaneBtn.textContent = label;
    el.toggleRightPaneBtn.setAttribute("aria-pressed", String(!compact && !appState.rightPaneCollapsed));
  }
}

function renderGlobalControlBar() {
  const brief = buildIntelBriefModel();
  const bridge = describeLlmStatus(appState.llmStatus);
  const liveProfile = liveBridgeProfile() || currentBridgeProfile();
  const provider = getBridgeProvider(liveProfile ? liveProfile.provider : "ollama");
  const workspaceLabel = hasWorkspaceAttachment()
    ? String(appState.workspaceAttachment.label || "Attached workspace")
    : "No workspace";
  const signalCount = hasWorkspaceAttachment() && Array.isArray(appState.workspaceAttachment.signals)
    ? appState.workspaceAttachment.signals.length
    : 0;
  const sessionCount = Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0;
  const providerLabel = liveProfile && liveProfile.name
    ? String(liveProfile.name)
    : String(provider.label || "Local bridge");
  const connectionLabel = offlineModeEnabled() ? "Offline Mode on" : "Hosted access on";

  if (el.globalBridgeStatusText) {
    el.globalBridgeStatusText.textContent = truncateInlineText(
      `${provider.label} | ${bridge.short} | ${connectionLabel}`,
      140
    );
  }
  if (el.globalWorkspaceStatusText) {
    const workspaceText = hasWorkspaceAttachment()
      ? `${workspaceLabel} | ${signalCount} ${signalCount === 1 ? "signal" : "signals"} | ${sessionCount} ${sessionCount === 1 ? "thread" : "threads"}`
      : `No workspace attached | ${sessionCount} ${sessionCount === 1 ? "thread" : "threads"} saved`;
    el.globalWorkspaceStatusText.textContent = truncateInlineText(workspaceText, 148);
  }
  if (el.globalNextActionText) {
    el.globalNextActionText.textContent = truncateInlineText(brief.nextAction, 158);
  }
  if (el.globalProviderStatusText) {
    el.globalProviderStatusText.textContent = truncateInlineText(
      `${providerLabel} | Model ${String(appState.model || "offline")} | ${workspaceLayoutIsCompact() ? "stacked system" : (appState.rightPaneCollapsed ? "system collapsed" : `${appState.systemSurface} system`)}`,
      148
    );
  }
  applyWorkspaceLayout();
}

function setRightPaneCollapsed(collapsed, options = {}) {
  appState.rightPaneCollapsed = workspaceLayoutIsCompact() ? false : Boolean(collapsed);
  applyWorkspaceLayout();
  renderGlobalControlBar();
  if (options.persist !== false) {
    persistOperatorLayoutPreferences({ render: false });
  }
  if (options.focus && !appState.rightPaneCollapsed) {
    setTimeout(() => focusSurface(".workspace-right-column"), 0);
  }
}

function toggleRightPaneCollapsed() {
  if (workspaceLayoutIsCompact()) {
    focusSurface(".workspace-right-column");
    return;
  }
  setRightPaneCollapsed(!appState.rightPaneCollapsed, { focus: true });
}

function resetWorkspacePaneLayout(options = {}) {
  appState.leftPaneWidth = DEFAULT_LEFT_PANE_WIDTH;
  appState.rightPaneWidth = DEFAULT_RIGHT_PANE_WIDTH;
  appState.rightPaneCollapsed = false;
  applyWorkspaceLayout();
  renderGlobalControlBar();
  if (options.persist !== false) {
    persistOperatorLayoutPreferences({ render: false });
  }
  if (options.announce !== false) {
    showBanner("Workspace layout reset.", "ok");
  }
}

function handleWorkspacePaneResize(event) {
  if (!paneResizeSession) return;
  const delta = Number(event.clientX || 0) - paneResizeSession.startX;
  if (paneResizeSession.side === "left") {
    appState.leftPaneWidth = normalizeLeftPaneWidth(paneResizeSession.startWidth + delta);
  } else {
    appState.rightPaneWidth = normalizeRightPaneWidth(paneResizeSession.startWidth - delta);
  }
  applyWorkspaceLayout();
  renderGlobalControlBar();
}

function handleWorkspacePaneMouseResize(event) {
  handleWorkspacePaneResize(event);
}

function endWorkspacePaneResize() {
  if (!paneResizeSession) return;
  paneResizeSession = null;
  if (document && document.body) {
    document.body.classList.remove("pane-resizing");
  }
  window.removeEventListener("pointermove", handleWorkspacePaneResize);
  window.removeEventListener("pointerup", endWorkspacePaneResize);
  window.removeEventListener("mousemove", handleWorkspacePaneMouseResize);
  window.removeEventListener("mouseup", endWorkspacePaneResize);
  persistOperatorLayoutPreferences({ render: false });
}

function beginWorkspacePaneResize(side, event) {
  if (workspaceLayoutIsCompact()) return;
  if (side === "right" && appState.rightPaneCollapsed) return;
  event.preventDefault();
  const isPointerEvent = String(event && event.type || "").startsWith("pointer");
  paneResizeSession = {
    side,
    startX: Number(event.clientX || 0),
    startWidth: side === "left" ? appState.leftPaneWidth : appState.rightPaneWidth
  };
  if (isPointerEvent && typeof event.pointerId === "number" && event.currentTarget?.setPointerCapture) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  if (document && document.body) {
    document.body.classList.add("pane-resizing");
  }
  window.addEventListener("pointermove", handleWorkspacePaneResize);
  window.addEventListener("pointerup", endWorkspacePaneResize);
  window.addEventListener("mousemove", handleWorkspacePaneMouseResize);
  window.addEventListener("mouseup", endWorkspacePaneResize);
}

function nudgeWorkspacePane(side, delta) {
  if (workspaceLayoutIsCompact()) return;
  if (side === "left") {
    appState.leftPaneWidth = normalizeLeftPaneWidth(appState.leftPaneWidth + delta);
  } else if (!appState.rightPaneCollapsed) {
    appState.rightPaneWidth = normalizeRightPaneWidth(appState.rightPaneWidth + delta);
  }
  applyWorkspaceLayout();
  renderGlobalControlBar();
  persistOperatorLayoutPreferences({ render: false });
}

function refreshOperatorMemoryState() {
  appState.draftPrompt = String(operatorMemoryStore.loadDraftPrompt() || "");
  const recentPrompts = operatorMemoryStore.listRecentPrompts(6);
  const recentWorkspaces = operatorMemoryStore.listRecentWorkspaces(6);
  appState.recentPrompts = Array.isArray(recentPrompts) ? recentPrompts : [];
  appState.recentWorkspaces = Array.isArray(recentWorkspaces) ? recentWorkspaces : [];
}

function persistOperatorLayoutPreferences(options = {}) {
  operatorMemoryStore.saveLayoutPrefs({
    chatOpsTray: normalizeChatOpsTrayId(appState.chatOpsTray),
    performanceTray: normalizePerformanceTrayId(appState.performanceTray),
    performanceOutputView: normalizeRuntimeOutputViewId(appState.performanceOutputView),
    intelTray: normalizeIntelTrayId(appState.intelTray),
    sessionsTray: normalizeSessionsTrayId(appState.sessionsTray),
    commandsTray: normalizeCommandsTrayId(appState.commandsTray),
    systemSurface: normalizeSystemSurfaceId(appState.systemSurface),
    workbenchSurface: normalizeWorkbenchSurfaceId(appState.workbenchSurface),
    leftPaneWidth: normalizeLeftPaneWidth(appState.leftPaneWidth),
    rightPaneWidth: normalizeRightPaneWidth(appState.rightPaneWidth),
    rightPaneCollapsed: Boolean(appState.rightPaneCollapsed),
    inboxFilter: normalizeInboxFilterId(appState.inboxFilter),
    inboxSearchQuery: String(appState.inboxSearchQuery || "").trim(),
    pinnedSessionNames: normalizePinnedSessionNames(appState.pinnedSessionNames),
    sessionReadMarkers: normalizeSessionReadMarkers(appState.sessionReadMarkers),
    autoScroll: Boolean(el.autoScrollInput && el.autoScrollInput.checked)
  });
  if (options.render !== false) {
    renderOperatorMemorySurface();
  }
}

function restoreOperatorExperience() {
  refreshOperatorMemoryState();
  const layoutPrefs = operatorMemoryStore.loadLayoutPrefs();
  appState.chatOpsTray = normalizeChatOpsTrayId(layoutPrefs.chatOpsTray || appState.chatOpsTray);
  appState.performanceTray = normalizePerformanceTrayId(layoutPrefs.performanceTray || appState.performanceTray);
  appState.performanceOutputView = normalizeRuntimeOutputViewId(layoutPrefs.performanceOutputView || appState.performanceOutputView);
  appState.intelTray = normalizeIntelTrayId(layoutPrefs.intelTray || appState.intelTray);
  appState.sessionsTray = normalizeSessionsTrayId(layoutPrefs.sessionsTray || appState.sessionsTray);
  appState.commandsTray = normalizeCommandsTrayId(layoutPrefs.commandsTray || appState.commandsTray);
  appState.systemSurface = normalizeSystemSurfaceId(layoutPrefs.systemSurface || appState.systemSurface);
  appState.workbenchSurface = normalizeWorkbenchSurfaceId(layoutPrefs.workbenchSurface || appState.workbenchSurface);
  appState.leftPaneWidth = normalizeLeftPaneWidth(layoutPrefs.leftPaneWidth || appState.leftPaneWidth);
  appState.rightPaneWidth = normalizeRightPaneWidth(layoutPrefs.rightPaneWidth || appState.rightPaneWidth);
  appState.rightPaneCollapsed = Boolean(layoutPrefs.rightPaneCollapsed);
  appState.inboxFilter = normalizeInboxFilterId(layoutPrefs.inboxFilter || appState.inboxFilter);
  appState.inboxSearchQuery = String(layoutPrefs.inboxSearchQuery || "").trim();
  appState.pinnedSessionNames = normalizePinnedSessionNames(layoutPrefs.pinnedSessionNames);
  appState.sessionReadMarkers = normalizeSessionReadMarkers(layoutPrefs.sessionReadMarkers);
  if (typeof layoutPrefs.autoScroll === "boolean" && el.autoScrollInput) {
    el.autoScrollInput.checked = layoutPrefs.autoScroll;
  }
  if (!String((el.promptInput && el.promptInput.value) || "").trim() && String(appState.draftPrompt || "").trim()) {
    setPromptEditorValue(appState.draftPrompt, { render: false });
  } else {
    updatePromptMetrics();
    updateCommandHint();
  }
  if (el.inboxSearchInput) {
    el.inboxSearchInput.value = appState.inboxSearchQuery;
  }
  applyWorkspaceLayout();
  renderWorkbenchNavigation();
  renderSystemNavigation();
  renderGlobalControlBar();
}
function operatorMemoryPromptPreview(value = appState.draftPrompt, maxLength = 132) {
  const normalized = String(value || "").trim();
  return normalized
    ? truncateInlineText(normalized, maxLength)
    : "No saved draft. Use the prompt editor and NeuralShell will keep the local draft warm between launches.";
}

function setPromptEditorValue(value, options = {}) {
  if (!el.promptInput) return false;
  el.promptInput.value = String(value || "");
  updatePromptMetrics();
  updateCommandHint();
  rememberPromptDraft(el.promptInput.value, { render: options.render !== false });
  if (options.focus) {
    el.promptInput.focus();
  }
  return true;
}

function rememberPromptDraft(text, options = {}) {
  const normalized = String(text || "");
  if (normalized.trim()) {
    operatorMemoryStore.saveDraftPrompt(normalized);
    appState.draftPrompt = normalized;
  } else {
    operatorMemoryStore.clearDraftPrompt();
    appState.draftPrompt = "";
  }
  if (options.render !== false) {
    renderOperatorMemorySurface();
  }
  return appState.draftPrompt;
}

function recordSubmittedPrompt(text, options = {}) {
  const normalized = String(text || "").trim();
  if (!normalized) return appState.recentPrompts;
  const recentPrompts = operatorMemoryStore.recordPrompt(normalized);
  appState.recentPrompts = Array.isArray(recentPrompts) ? recentPrompts : [];
  if (options.render !== false) {
    renderOperatorMemorySurface();
  }
  return appState.recentPrompts;
}

function recordAttachedWorkspace(summary, options = {}) {
  const rootPath = rootPathFromWorkspaceBoundValue(summary);
  if (!rootPath) return appState.recentWorkspaces;
  const recentWorkspaces = operatorMemoryStore.recordWorkspace(summary);
  appState.recentWorkspaces = Array.isArray(recentWorkspaces) ? recentWorkspaces : [];
  if (options.render !== false) {
    renderOperatorMemorySurface();
  }
  return appState.recentWorkspaces;
}

async function analyzeProjectIntelligence() {
  if (!appState.workspaceAttachment || !window.api || !window.api.project) return;
  const rootPath = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
  if (!rootPath) return;

  try {
    appState.projectIntelligence = await window.api.project.analyze(rootPath, appState.workflowId, appState.chat);

    // Proactively check readiness for all ranked actions
    if (appState.projectIntelligence.rankedActions) {
      for (const action of appState.projectIntelligence.rankedActions) {
        if (action.id) {
          const ready = await window.api.action.checkReady(action.id, { rootPath, chat: appState.chat });
          if (!appState.actionStatus[action.id] || typeof appState.actionStatus[action.id] === 'string') {
            appState.actionStatus[action.id] = { status: "ready", ready };
          } else {
            appState.actionStatus[action.id].ready = ready;
          }
        }
      }
    }

    renderIntelSurface();
    renderHeroSpotlight();
    updateSessionStatusHeader();
  } catch (err) {
    console.error("Failed to analyze project intelligence:", err);
  }
}

async function runAction(actionId) {
  if (!window.api || !window.api.action) return;
  const rootPath = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);

  appState.actionStatus[actionId] = "running";
  renderIntelSurface();
  showBanner(`Starting action: ${actionId}`, "ok");

  try {
    const result = await window.api.action.run(actionId, { rootPath });
    appState.actionStatus[actionId] = result.ok ? "succeeded" : "failed";

    if (result.ok) {
      showBanner(`Action completed: ${actionId}`, "ok");
      if (result.findings && result.findings.length) {
        setPromptEditorValue(`Analyzed project. Findings: ${result.findings.join(", ")}`, { focus: true });
      }
    } else {
      showBanner(`Action failed: ${result.reason}`, "bad");
    }

    renderIntelSurface();
    renderHeroSpotlight();
    updateSessionStatusHeader();
  } catch (err) {
    appState.actionStatus[actionId] = "failed";
    console.error("Action execution error:", err);
    showBanner(`Execution error: ${err.message}`, "bad");
    renderIntelSurface();
  }
}

function restoreSavedDraft(options = {}) {
  refreshOperatorMemoryState();
  const draft = String(appState.draftPrompt || "").trim();
  if (!draft) {
    if (options.announce !== false) {
      showBanner("No saved draft to restore.", "bad");
    }
    return false;
  }
  setPromptEditorValue(draft, { focus: options.focus !== false });
  if (options.announce !== false) {
    showBanner("Draft restored.", "ok");
  }
  return true;
}

function clearSavedDraft(options = {}) {
  const hadDraft = Boolean(String(appState.draftPrompt || operatorMemoryStore.loadDraftPrompt() || "").trim());
  operatorMemoryStore.clearDraftPrompt();
  appState.draftPrompt = "";
  if (options.clearEditor !== false) {
    setPromptEditorValue("", {
      focus: Boolean(options.focus),
      render: options.render !== false
    });
  } else if (options.render !== false) {
    renderOperatorMemorySurface();
  }
  if (options.announce !== false) {
    showBanner(hadDraft ? "Draft cleared." : "No saved draft to clear.", hadDraft ? "ok" : "bad");
  }
  return hadDraft;
}

async function attachRecentWorkspace(rootPath, options = {}) {
  const targetRoot = String(rootPath || "").trim();
  if (!targetRoot) {
    throw new Error("Recent workspace is unavailable.");
  }
  let summary = (appState.recentWorkspaces || []).find((entry) => String(entry && entry.rootPath || "").trim() === targetRoot) || null;
  if (window.api && window.api.workspace && typeof window.api.workspace.summarize === "function") {
    const liveSummary = await window.api.workspace.summarize(targetRoot);
    if (liveSummary) {
      summary = liveSummary;
    }
  }
  if (!summary) {
    throw new Error("Workspace summary is unavailable.");
  }
  await setWorkspaceAttachment(summary, {
    announce: options.announce !== false
  });
  return summary;
}

function removeRecentWorkspace(rootPath, options = {}) {
  const targetRoot = String(rootPath || "").trim();
  if (!targetRoot) return false;
  const recentWorkspaces = operatorMemoryStore.removeWorkspace(targetRoot);
  appState.recentWorkspaces = Array.isArray(recentWorkspaces) ? recentWorkspaces : [];
  if (options.render !== false) {
    renderOperatorMemorySurface();
  }
  if (options.announce !== false) {
    showBanner("Workspace removed from operator memory.", "ok");
  }
  return true;
}

function renderOperatorMemorySurface() {
  if (
    !el.operatorMemorySummaryText
    && !el.operatorMemoryDraftText
    && !el.recentPromptList
    && !el.recentWorkspaceList
  ) {
    return;
  }

  const promptEntries = Array.isArray(appState.recentPrompts) ? appState.recentPrompts : [];
  const workspaceEntries = Array.isArray(appState.recentWorkspaces) ? appState.recentWorkspaces : [];
  const hasDraft = Boolean(String(appState.draftPrompt || "").trim());
  const layoutPrefs = operatorMemoryStore.loadLayoutPrefs();
  const layoutSummary = Object.keys(layoutPrefs || {}).length ? "layout memory active" : "layout defaults";

  if (el.operatorMemorySummaryText) {
    const parts = [
      hasDraft ? "Draft hot" : "No saved draft",
      `${promptEntries.length} prompt recall${promptEntries.length === 1 ? "" : "s"}`,
      `${workspaceEntries.length} workspace recall${workspaceEntries.length === 1 ? "" : "s"}`,
      layoutSummary
    ];
    el.operatorMemorySummaryText.textContent = parts.join(" | ");
  }

  if (el.operatorMemoryDraftText) {
    el.operatorMemoryDraftText.textContent = operatorMemoryPromptPreview();
  }

  if (el.restoreDraftBtn) {
    el.restoreDraftBtn.disabled = !hasDraft;
  }

  if (el.clearDraftBtn) {
    el.clearDraftBtn.disabled = !hasDraft && !String((el.promptInput && el.promptInput.value) || "").trim();
  }

  const renderEmptyList = (target, message) => {
    if (!target) return;
    target.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "operator-memory-empty";
    empty.textContent = message;
    target.appendChild(empty);
  };

  if (el.recentPromptList) {
    el.recentPromptList.innerHTML = "";
    if (!promptEntries.length) {
      renderEmptyList(el.recentPromptList, "No reusable prompts yet. Send or stage one strong prompt and it will show up here.");
    } else {
      for (const entry of promptEntries) {
        const item = document.createElement("div");
        item.className = "operator-memory-item";
        const head = document.createElement("div");
        head.className = "operator-memory-item-head";
        const copy = document.createElement("div");
        copy.className = "operator-memory-copy";
        const title = document.createElement("div");
        title.className = "operator-memory-item-title";
        title.textContent = truncateInlineText(String(entry && entry.text || ""), 112);
        const meta = document.createElement("div");
        meta.className = "operator-memory-item-meta";
        meta.textContent = formatTimestampLabel(entry && entry.updatedAt);
        copy.appendChild(title);
        copy.appendChild(meta);
        head.appendChild(copy);
        const actions = document.createElement("div");
        actions.className = "operator-memory-actions";
        const useBtn = document.createElement("button");
        useBtn.type = "button";
        useBtn.className = "btn-secondary";
        useBtn.textContent = "Use Prompt";
        useBtn.onclick = () => {
          setPromptEditorValue(String(entry && entry.text || ""), { focus: true });
          showBanner("Recent prompt loaded.", "ok");
        };
        actions.appendChild(useBtn);
        item.appendChild(head);
        item.appendChild(actions);
        el.recentPromptList.appendChild(item);
      }
    }
  }

  if (el.recentWorkspaceList) {
    el.recentWorkspaceList.innerHTML = "";
    if (!workspaceEntries.length) {
      renderEmptyList(el.recentWorkspaceList, "No recent workspaces yet. Attach one local root and it will stay one click away.");
    } else {
      const activeRoot = rootPathFromWorkspaceBoundValue(appState.workspaceAttachment);
      for (const entry of workspaceEntries) {
        const item = document.createElement("div");
        item.className = "operator-memory-item";
        const head = document.createElement("div");
        head.className = "operator-memory-item-head";
        const copy = document.createElement("div");
        copy.className = "operator-memory-copy";
        const title = document.createElement("div");
        title.className = "operator-memory-item-title";
        title.textContent = String(entry && (entry.label || entry.rootPath) || "Recent workspace");
        const meta = document.createElement("div");
        meta.className = "operator-memory-item-meta";
        const metaParts = [
          truncateInlineText(String(entry && entry.rootPath || ""), 82),
          Array.isArray(entry && entry.signals) && entry.signals.length ? entry.signals.join(", ") : "No signals",
          formatTimestampLabel(entry && (entry.updatedAt || entry.attachedAt))
        ];
        meta.textContent = metaParts.join(" | ");
        copy.appendChild(title);
        copy.appendChild(meta);
        head.appendChild(copy);
        const actions = document.createElement("div");
        actions.className = "operator-memory-actions";
        const attachBtn = document.createElement("button");
        attachBtn.type = "button";
        attachBtn.className = "btn-secondary";
        const rootPath = String(entry && entry.rootPath || "").trim();
        const isActive = rootPath && activeRoot === rootPath;
        attachBtn.textContent = isActive ? "Attached" : "Attach";
        attachBtn.disabled = isActive;
        attachBtn.onclick = () => {
          attachRecentWorkspace(rootPath).catch((err) => showBanner(err.message || String(err), "bad"));
        };
        const forgetBtn = document.createElement("button");
        forgetBtn.type = "button";
        forgetBtn.className = "btn-secondary";
        forgetBtn.textContent = "Forget";
        forgetBtn.onclick = () => {
          removeRecentWorkspace(rootPath);
        };
        actions.appendChild(attachBtn);
        actions.appendChild(forgetBtn);
        item.appendChild(head);
        item.appendChild(actions);
        el.recentWorkspaceList.appendChild(item);
      }
    }
  }
}

function sessionThreadSubtitle(name, meta = {}) {
  const workflow = meta.workflowId ? getWorkflow(meta.workflowId) : null;
  const parts = [];
  if (workflow && workflow.title) {
    parts.push(workflow.title);
  }
  if (meta.workspaceLabel) {
    parts.push(String(meta.workspaceLabel));
  } else if (meta.outputMode) {
    parts.push(String(meta.outputMode).replace(/_/g, " "));
  } else if (name) {
    parts.push(`${Number(meta.tokens || 0)} tokens`);
  }
  return parts.slice(0, 2).join(" | ");
}

function sessionUpdatedAtValue(meta = {}) {
  return String(meta && meta.updatedAt || "").trim();
}

function sessionIsPinned(name) {
  const normalizedName = String(name || "").trim();
  return normalizedName
    ? normalizePinnedSessionNames(appState.pinnedSessionNames).includes(normalizedName)
    : false;
}

function sessionIsUnread(name, meta = {}) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName || String(appState.activeSessionName || "").trim() === normalizedName) {
    return false;
  }
  const updatedAt = sessionUpdatedAtValue(meta);
  if (!updatedAt) {
    return false;
  }
  return String((appState.sessionReadMarkers && appState.sessionReadMarkers[normalizedName]) || "").trim() !== updatedAt;
}

function sessionPreviewText(name, meta = {}, options = {}) {
  if (options.liveThread) {
    return currentDraftPreviewText();
  }
  const savedPreview = String(meta.previewText || "").trim();
  if (savedPreview) {
    return truncateInlineText(savedPreview, 112);
  }
  if (meta.workspaceLabel) {
    return truncateInlineText(`${sessionThreadSubtitle(name, meta) || "Encrypted session"}. Workspace ${meta.workspaceLabel}.`, 112);
  }
  return truncateInlineText(`${sessionThreadSubtitle(name, meta) || "Encrypted session"}. ${Number(meta.tokens || 0)} tokens captured.`, 112);
}

function sessionPriorityVector(name, meta = {}) {
  const normalizedName = String(name || "").trim();
  const activeName = String(appState.activeSessionName || "").trim();
  const stagedName = stagedThreadName();
  const hasStructuredWork = Boolean(
    Number(meta.patchPlanFiles || 0)
    || Number(meta.verificationChecks || 0)
    || Number(meta.ShippingPackets || 0)
    || Number(meta.contextPackFiles || 0)
  );
  return [
    Number(activeName === normalizedName),
    Number(stagedName === normalizedName && activeName !== normalizedName),
    Number(sessionIsPinned(normalizedName)),
    Number(sessionIsUnread(normalizedName, meta)),
    Number(hasStructuredWork)
  ];
}

function sessionSupportSummary(meta = {}) {
  const parts = [];
  if (meta.workspaceLabel) parts.push(`Workspace ${meta.workspaceLabel}`);
  if (meta.contextPackFiles) parts.push(`Context ${meta.contextPackFiles} file${meta.contextPackFiles === 1 ? "" : "s"}`);
  if (meta.patchPlanFiles) parts.push(`Patch ${meta.patchPlanFiles} file${meta.patchPlanFiles === 1 ? "" : "s"}`);
  if (meta.verificationChecks) parts.push(`Verify ${meta.verificationChecks} check${meta.verificationChecks === 1 ? "" : "s"}`);
  if (meta.ShippingPackets) parts.push(`Packet ${meta.ShippingPackets}`);
  if (meta.paletteShortcuts) parts.push(`Shortcut ${meta.paletteShortcuts}`);
  return parts.slice(0, 3).join(" | ");
}

function sortedSessionRows(rows = appState.sessionsRows) {
  return (Array.isArray(rows) ? rows.slice() : [])
    .sort((leftRow, rightRow) => {
      const leftName = typeof leftRow === "string" ? leftRow : String(leftRow && leftRow.name || "");
      const rightName = typeof rightRow === "string" ? rightRow : String(rightRow && rightRow.name || "");
      const leftMeta = appState.sessionsMeta[leftName] || {};
      const rightMeta = appState.sessionsMeta[rightName] || {};
      const leftPriority = sessionPriorityVector(leftName, leftMeta);
      const rightPriority = sessionPriorityVector(rightName, rightMeta);
      for (let index = 0; index < leftPriority.length; index += 1) {
        const delta = rightPriority[index] - leftPriority[index];
        if (delta !== 0) {
          return delta;
        }
      }
      const leftTime = sessionUpdatedAtValue(leftMeta);
      const rightTime = sessionUpdatedAtValue(rightMeta);
      return rightTime.localeCompare(leftTime) || leftName.localeCompare(rightName);
    });
}

function sessionMatchesInboxQuery(name, meta = {}, query = "") {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  const workflow = meta.workflowId ? getWorkflow(meta.workflowId) : null;
  const haystack = [
    name,
    workflow && workflow.title ? workflow.title : "",
    meta.workspaceLabel,
    meta.outputMode,
    meta.previewText,
    sessionThreadSubtitle(name, meta)
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return haystack.includes(normalizedQuery);
}

function visibleSessionRows(rows = appState.sessionsRows) {
  const filter = normalizeInboxFilterId(appState.inboxFilter);
  const query = String(appState.inboxSearchQuery || "").trim().toLowerCase();
  return sortedSessionRows(rows).filter((row) => {
    const name = typeof row === "string" ? row : String(row && row.name || "");
    if (!name) {
      return false;
    }
    const meta = appState.sessionsMeta[name] || {};
    if (filter === "pinned" && !sessionIsPinned(name)) {
      return false;
    }
    if (filter === "unread" && !sessionIsUnread(name, meta)) {
      return false;
    }
    return sessionMatchesInboxQuery(name, meta, query);
  });
}

function recentSessionThreadNames(limit = 7) {
  return visibleSessionRows()
    .map((row) => typeof row === "string" ? row : String(row && row.name || ""))
    .filter(Boolean)
    .slice(0, limit);
}

function markSessionAsRead(name, updatedAt, options = {}) {
  const normalizedName = String(name || "").trim();
  const normalizedUpdatedAt = String(updatedAt || "").trim();
  if (!normalizedName || !normalizedUpdatedAt) {
    return;
  }
  appState.sessionReadMarkers = normalizeSessionReadMarkers({
    ...appState.sessionReadMarkers,
    [normalizedName]: normalizedUpdatedAt
  });
  if (options.persist !== false) {
    persistOperatorLayoutPreferences({ render: false });
  }
  if (options.render !== false) {
    renderSessions(appState.sessionsRows);
  }
}

function togglePinnedSession(name) {
  const normalizedName = String(name || "").trim();
  if (!normalizedName) {
    return;
  }
  const current = normalizePinnedSessionNames(appState.pinnedSessionNames);
  appState.pinnedSessionNames = current.includes(normalizedName)
    ? current.filter((item) => item !== normalizedName)
    : [normalizedName, ...current].slice(0, 12);
  persistOperatorLayoutPreferences({ render: false });
  renderSessions(appState.sessionsRows);
}

function setInboxFilter(nextFilter) {
  appState.inboxFilter = normalizeInboxFilterId(nextFilter);
  persistOperatorLayoutPreferences({ render: false });
  renderSessions(appState.sessionsRows);
}

function setInboxSearchQuery(value) {
  appState.inboxSearchQuery = String(value || "").trim();
  persistOperatorLayoutPreferences({ render: false });
  renderSessions(appState.sessionsRows);
}

function renderInboxFilters() {
  const totalCount = Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0;
  const pinnedCount = normalizePinnedSessionNames(appState.pinnedSessionNames).filter((name) => appState.sessionsIndex.includes(name)).length;
  const unreadCount = (Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex : []).filter((name) => sessionIsUnread(name, appState.sessionsMeta[name] || {})).length;
  const visibleCount = visibleSessionRows().length;
  const filter = normalizeInboxFilterId(appState.inboxFilter);
  const filterSummary = filter === "pinned"
    ? "Pinned threads only"
    : filter === "unread"
      ? "Unread threads only"
      : "All saved threads";
  if (el.inboxFilterAllBtn) {
    el.inboxFilterAllBtn.classList.toggle("is-active", filter === "all");
    el.inboxFilterAllBtn.setAttribute("aria-pressed", String(filter === "all"));
  }
  if (el.inboxFilterPinnedBtn) {
    el.inboxFilterPinnedBtn.classList.toggle("is-active", filter === "pinned");
    el.inboxFilterPinnedBtn.setAttribute("aria-pressed", String(filter === "pinned"));
  }
  if (el.inboxFilterUnreadBtn) {
    el.inboxFilterUnreadBtn.classList.toggle("is-active", filter === "unread");
    el.inboxFilterUnreadBtn.setAttribute("aria-pressed", String(filter === "unread"));
  }
  if (el.inboxSearchInput && el.inboxSearchInput.value !== String(appState.inboxSearchQuery || "")) {
    el.inboxSearchInput.value = String(appState.inboxSearchQuery || "");
  }
  if (el.inboxFilterSummaryText) {
    el.inboxFilterSummaryText.textContent = `${filterSummary}. ${visibleCount}/${totalCount} visible | ${pinnedCount} pinned | ${unreadCount} unread.`;
  }
}

function makeThreadHeadTag(label, tone = "neutral") {
  const tag = document.createElement("span");
  tag.className = "thread-head-tag";
  if (tone !== "neutral") {
    tag.dataset.tone = tone;
  }
  tag.textContent = label;
  return tag;
}
function stagedThreadName() {
  return String((el.sessionName && el.sessionName.value) || "").trim();
}

function activeThreadLabel() {
  const activeName = String(appState.activeSessionName || "").trim();
  const stagedName = stagedThreadName();
  if (activeName) return activeName;
  if (stagedName) return `${stagedName} staged`;
  return "Current draft";
}

function renderInboxOverview() {
  const count = Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0;
  const pinnedCount = normalizePinnedSessionNames(appState.pinnedSessionNames).filter((name) => appState.sessionsIndex.includes(name)).length;
  const unreadCount = (Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex : []).filter((name) => sessionIsUnread(name, appState.sessionsMeta[name] || {})).length;
  const visibleCount = visibleSessionRows().length;
  const passphraseReady = Boolean(String((el.sessionPass && el.sessionPass.value) || "").trim());
  const activeName = String(appState.activeSessionName || "").trim();
  const stagedName = stagedThreadName();
  if (el.inboxGroupStatusText) {
    const parts = [
      count > 0 ? `${count} saved thread${count === 1 ? "" : "s"}` : "No saved threads",
      pinnedCount > 0 ? `${pinnedCount} pinned` : "No pins yet",
      unreadCount > 0 ? `${unreadCount} unread` : "All read",
      passphraseReady ? "unlock ready" : "locked until passphrase",
      appState.streamInFlight ? "assistant live" : "idle"
    ];
    el.inboxGroupStatusText.textContent = parts.join(" | ");
  }
  if (el.inboxFocusText) {
    const focus = activeName
      ? `${activeName} is loaded now.`
      : stagedName
        ? `${stagedName} is staged and ready to load.`
        : "Current draft is in focus.";
    const filterNote = count && visibleCount !== count
      ? ` ${visibleCount} thread${visibleCount === 1 ? "" : "s"} match the current inbox filter.`
      : "";
    const follow = count
      ? ` ${recentSessionThreadNames(1)[0] ? `Most recent visible thread: ${recentSessionThreadNames(1)[0]}.` : "No visible threads match this filter."}`
      : " Save one thread to build the inbox.";
    el.inboxFocusText.textContent = `${focus}${filterNote}${follow}`.trim();
  }
  renderInboxFilters();
}
function renderThreadTaskStrip() {
  if (!el.threadTaskFocusText && !el.threadTaskCapabilityText && !el.threadTaskActionText) return;
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const workspaceLabel = hasWorkspaceAttachment()
    ? String(appState.workspaceAttachment.label || "Attached workspace")
    : "No workspace";
  const brief = buildIntelBriefModel();
  const bridge = describeLlmStatus(appState.llmStatus);
  if (el.threadTaskFocusText) {
    const focusParts = [
      activeThreadLabel(),
      (workflow && workflow.title) || "Workflow",
      outputMode ? outputMode.label : ""
    ].filter(Boolean);
    el.threadTaskFocusText.textContent = focusParts.join(" | ");
  }
  if (el.threadTaskCapabilityText) {
    const postureParts = [
      bridge.short,
      offlineModeEnabled() ? "Offline Mode on" : "Hosted access on",
      workspaceLabel
    ];
    el.threadTaskCapabilityText.textContent = truncateInlineText(postureParts.join(" | "), 156);
  }
  if (el.threadTaskActionText) {
    el.threadTaskActionText.textContent = truncateInlineText(brief.nextAction || "Load a workflow prompt and produce the next structured artifact.", 164);
  }
}

function syncSessionSelectionState() {
  const stagedName = stagedThreadName();
  const activeName = String(appState.activeSessionName || "").trim();
  if (el.sessionList) {
    for (const node of Array.from(el.sessionList.children)) {
      const sessionName = String(node.dataset.sessionName || "").trim();
      if (!sessionName) continue;
      node.classList.toggle("is-active", sessionName === stagedName);
      node.classList.toggle("is-live", sessionName === activeName);
    }
  }
  renderInboxOverview();
  renderChatThreadRail();
}

function renderChatThreadRail() {
  if (!el.sessionChatHeadRail) return;
  const stagedName = stagedThreadName();
  const activeName = String(appState.activeSessionName || "").trim();
  const passphraseReady = Boolean(String((el.sessionPass && el.sessionPass.value) || "").trim());
  const filter = normalizeInboxFilterId(appState.inboxFilter);
  const visibleRows = visibleSessionRows();
  const recentNames = visibleRows
    .map((row) => typeof row === "string" ? row : String(row && row.name || ""))
    .filter(Boolean);

  if (el.threadRailSummaryText) {
    if (!Array.isArray(appState.sessionsIndex) || !appState.sessionsIndex.length) {
      el.threadRailSummaryText.textContent = "Current draft lives here first. Save a session to keep more threads one tap away.";
    } else if (!recentNames.length) {
      el.threadRailSummaryText.textContent = "No saved threads match the current inbox filter. Clear the search or switch filters to widen the rail again.";
    } else {
      const pinnedCount = recentNames.filter((name) => sessionIsPinned(name)).length;
      const unreadCount = recentNames.filter((name) => sessionIsUnread(name, appState.sessionsMeta[name] || {})).length;
      const filterLabel = filter === "pinned"
        ? "Pinned only"
        : filter === "unread"
          ? "Unread only"
          : "All visible";
      el.threadRailSummaryText.textContent = `${filterLabel} | ${recentNames.length} thread${recentNames.length === 1 ? "" : "s"} | ${pinnedCount} pinned | ${unreadCount} unread. Click a head to stage it, or load immediately when the passphrase is already filled.`;
    }
  }

  el.sessionChatHeadRail.innerHTML = "";

  const draftCard = document.createElement("button");
  draftCard.type = "button";
  draftCard.className = "thread-head-card is-draft";
  draftCard.classList.toggle("is-active", !activeName);
  draftCard.title = "Current draft";
  draftCard.onclick = () => {
    appState.activeSessionName = "";
    syncSessionSelectionState();
    if (el.promptInput) {
      el.promptInput.focus();
    }
    showBanner("Current draft ready.", "ok");
  };
  const draftOrb = document.createElement("span");
  draftOrb.className = "thread-head-orb";
  draftOrb.textContent = "NS";
  const draftBody = document.createElement("div");
  draftBody.className = "thread-head-body";
  const draftTop = document.createElement("div");
  draftTop.className = "thread-head-top";
  const draftCopy = document.createElement("div");
  draftCopy.className = "thread-head-copy";
  const draftTitle = document.createElement("div");
  draftTitle.className = "thread-head-title";
  draftTitle.textContent = "Current Draft";
  const draftMeta = document.createElement("div");
  draftMeta.className = "thread-head-meta";
  draftMeta.textContent = activeName
    ? "Draft stays local until you save it as a named session."
    : "Live thread";
  draftCopy.appendChild(draftTitle);
  draftCopy.appendChild(draftMeta);
  draftTop.appendChild(draftCopy);
  const draftTags = document.createElement("div");
  draftTags.className = "thread-head-tags";
  draftTags.appendChild(makeThreadHeadTag(activeName ? "Draft" : "Live", activeName ? "neutral" : "good"));
  const draftPreview = document.createElement("div");
  draftPreview.className = "thread-head-preview";
  draftPreview.textContent = sessionPreviewText("draft", {}, { liveThread: true });
  draftBody.appendChild(draftTop);
  draftBody.appendChild(draftTags);
  draftBody.appendChild(draftPreview);
  draftCard.appendChild(draftOrb);
  draftCard.appendChild(draftBody);
  el.sessionChatHeadRail.appendChild(draftCard);

  for (const row of visibleRows) {
    const name = typeof row === "string" ? row : String(row && row.name || "");
    if (!name) continue;
    const meta = appState.sessionsMeta[name] || {};
    const isPinned = sessionIsPinned(name);
    const isUnread = sessionIsUnread(name, meta);
    const card = document.createElement("button");
    card.type = "button";
    card.className = "thread-head-card";
    card.dataset.sessionName = name;
    card.classList.toggle("is-active", activeName === name);
    card.classList.toggle("is-staged", stagedName === name && activeName !== name);
    card.classList.toggle("is-locked", !passphraseReady);
    card.classList.toggle("is-pinned", isPinned);
    card.classList.toggle("is-unread", isUnread);
    card.title = `${name}${passphraseReady ? " | click to load" : " | click to stage"}`;
    card.onclick = async () => {
      if (el.sessionName) {
        el.sessionName.value = name;
      }
      syncSessionSelectionState();
      if (!passphraseReady) {
        showBanner(`Thread staged: ${name}. Enter the passphrase to load it.`, "ok");
        return;
      }
      await loadSessionTarget(name, { announce: true });
    };

    const orb = document.createElement("span");
    orb.className = "thread-head-orb";
    orb.textContent = initialsFromLabel(name, "NS");

    const body = document.createElement("div");
    body.className = "thread-head-body";
    const top = document.createElement("div");
    top.className = "thread-head-top";
    const copy = document.createElement("div");
    copy.className = "thread-head-copy";
    const title = document.createElement("div");
    title.className = "thread-head-title";
    title.textContent = name;
    const metaLine = document.createElement("div");
    metaLine.className = "thread-head-meta";
    const subtitle = sessionThreadSubtitle(name, meta);
    metaLine.textContent = [subtitle, sessionUpdatedAtValue(meta) ? formatTimestampLabel(meta.updatedAt) : ""]
      .filter(Boolean)
      .join(" | ");
    copy.appendChild(title);
    copy.appendChild(metaLine);
    top.appendChild(copy);

    const pinButton = document.createElement("button");
    pinButton.type = "button";
    pinButton.className = "thread-head-pin";
    pinButton.textContent = isPinned ? "Unpin" : "Pin";
    pinButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedSession(name);
    };
    top.appendChild(pinButton);

    const tagRow = document.createElement("div");
    tagRow.className = "thread-head-tags";
    if (isPinned) {
      tagRow.appendChild(makeThreadHeadTag("Pinned", "good"));
    }
    if (isUnread) {
      tagRow.appendChild(makeThreadHeadTag("Unread", "warn"));
    }
    if (activeName === name) {
      tagRow.appendChild(makeThreadHeadTag("Live", "good"));
    } else if (stagedName === name) {
      tagRow.appendChild(makeThreadHeadTag("Staged", "warn"));
    }

    const preview = document.createElement("div");
    preview.className = "thread-head-preview";
    preview.textContent = sessionPreviewText(name, meta, {
      liveThread: activeName === name
    });
    body.appendChild(top);
    if (tagRow.childElementCount) {
      body.appendChild(tagRow);
    }
    body.appendChild(preview);
    card.appendChild(orb);
    card.appendChild(body);
    el.sessionChatHeadRail.appendChild(card);
  }
  renderInboxOverview();
}
function updateDashboardSummary() {
  updateDynamicChrome();
  renderHeroSpotlight();
  renderGlobalControlBar();
  syncSessionSelectionState();
  if (el.modelSummary) {
    el.modelSummary.textContent = String(appState.model || "offline");
  }
  if (el.sessionSummary) {
    const count = Array.isArray(appState.sessionsIndex) ? appState.sessionsIndex.length : 0;
    el.sessionSummary.textContent = count > 0 ? `${count} threads` : "No threads";
  }
  if (el.commandSummary) {
    const count = Array.isArray(appState.commands) ? appState.commands.length : 0;
    el.commandSummary.textContent = count > 0 ? `${count} ready` : "No commands";
  }
  if (el.tokenSummary) {
    const total = countTokens(appState.chat);
    el.tokenSummary.textContent = total > 0 ? `${total} tokens` : "Cold start";
  }
  renderInboxOverview();
  renderThreadTaskStrip();
  renderComposerState();
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
  const spotlight = document.getElementById("starterActionsSpotlight");
  if (!appState.chat.length) {
    if (spotlight) spotlight.classList.remove("hidden");
  } else {
    if (spotlight) spotlight.classList.add("hidden");
  }

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
      const lead = document.createElement("div");
      lead.className = "chat-head-lead";
      const avatar = document.createElement("span");
      avatar.className = "chat-head-avatar";
      avatar.textContent =
        role === "assistant"
          ? "AI"
          : role === "user"
            ? "YU"
            : "SYS";
      const labels = document.createElement("div");
      labels.className = "chat-head-labels";
      const roleTag = document.createElement("span");
      roleTag.className = "chat-head-role";
      roleTag.textContent = role;
      const turnTag = document.createElement("span");
      turnTag.className = "chat-head-index";
      turnTag.textContent = `Turn ${i + 1}`;
      const body = document.createElement("pre");
      body.className = "chat-content";
      body.textContent = String(row.content || "");
      labels.appendChild(roleTag);
      labels.appendChild(turnTag);
      lead.appendChild(avatar);
      lead.appendChild(labels);
      head.appendChild(lead);
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
  renderPrimaryActionState();
}

function getCurrentChat() {
  return appState.chat.slice();
}

function currentPromptDraftText() {
  return String((el.promptInput && el.promptInput.value) || "").trim();
}

function renderComposerState() {
  const workflow = getWorkflow(appState.workflowId);
  const outputMode = getOutputMode(appState.outputMode);
  const liveProfile = liveBridgeProfile() || currentBridgeProfile();
  const provider = getBridgeProvider(liveProfile ? liveProfile.provider : "ollama");
  const promptText = currentPromptDraftText();
  let composerState = "Idle draft";
  let tone = "guard";

  if (appState.streamInFlight) {
    composerState = "Streaming live";
    tone = "ok";
  } else if (appState.requestInFlight) {
    composerState = "Awaiting response";
    tone = "ok";
  } else if (promptText.startsWith("/")) {
    composerState = "Command ready";
    tone = "warn";
  } else if (promptText) {
    composerState = "Draft ready";
    tone = "good";
  } else if (String(appState.lastPrompt || "").trim()) {
    composerState = "Retry ready";
    tone = "ok";
  }

  if (el.composerSummaryText) {
    const summaryParts = [
      (workflow && workflow.title) || "Workflow",
      outputMode ? outputMode.label : "",
      liveProfile && liveProfile.name ? liveProfile.name : provider.label,
      offlineModeEnabled() ? "Offline Mode on" : "Hosted access on",
      hasWorkspaceAttachment() ? `${appState.workspaceAttachment.label || "Workspace"} attached` : "No workspace yet"
    ].filter(Boolean);
    el.composerSummaryText.textContent = truncateInlineText(summaryParts.join(" | "), 164);
  }
  if (el.composerMetaText) {
    el.composerMetaText.textContent = composerState;
    el.composerMetaText.dataset.tone = tone;
  }
}

function renderPrimaryActionState() {
  const promptText = currentPromptDraftText();
  const hasPrompt = Boolean(promptText);
  const hasLastPrompt = Boolean(String(appState.lastPrompt || "").trim());
  const isStreaming = Boolean(appState.streamInFlight);
  const isBusy = Boolean(appState.requestInFlight);
  const isSlashCommand = hasPrompt && promptText.startsWith("/");
  const canRetry = !isBusy && !hasPrompt && hasLastPrompt;

  if (el.sendBtn) {
    el.sendBtn.hidden = isStreaming;
    el.sendBtn.disabled = isBusy || !hasPrompt;
    el.sendBtn.textContent = isBusy && !isStreaming
      ? "Sending..."
      : isSlashCommand
        ? "Run Command"
        : "Send";
    el.sendBtn.setAttribute("aria-hidden", String(isStreaming));
  }
  if (el.stopBtn) {
    el.stopBtn.hidden = !isStreaming;
    el.stopBtn.disabled = !isStreaming;
    el.stopBtn.setAttribute("aria-hidden", String(!isStreaming));
  }
  if (el.retryBtn) {
    el.retryBtn.hidden = !canRetry;
    el.retryBtn.disabled = !canRetry;
    el.retryBtn.setAttribute("aria-hidden", String(!canRetry));
  }
  if (el.actionBarStatusText) {
    if (isStreaming) {
      el.actionBarStatusText.textContent = "Assistant is streaming. Stop is live until the response settles.";
    } else if (isBusy) {
      el.actionBarStatusText.textContent = "Request in flight. Wait for the response before sending the next turn.";
    } else if (isSlashCommand) {
      el.actionBarStatusText.textContent = `Local command ready: ${truncateInlineText(promptText, 72)}.`;
    } else if (hasPrompt) {
      el.actionBarStatusText.textContent = `Draft ready for ${String(appState.model || "the active model")}. Press Send or Ctrl+Enter.`;
    } else if (canRetry) {
      el.actionBarStatusText.textContent = "Composer is clear. Retry replays the last submitted prompt.";
    } else {
      el.actionBarStatusText.textContent = "Composer is empty. Start with a prompt or restore a saved draft.";
    }
  }
  renderComposerState();
}

function setTyping(on) {
  if (el.typingIndicator) el.typingIndicator.textContent = on ? "Assistant streaming response..." : "";
  renderPrimaryActionState();
}

function updatePromptMetrics() {
  const text = String((el.promptInput && el.promptInput.value) || "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if (el.promptMetrics) {
    el.promptMetrics.textContent = `Prompt ${text.length}c / ${words}w`;
  }
  renderPrimaryActionState();
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
  const visibleRows = visibleSessionRows(rows);
  appState.sessionsRows = rows.slice();
  appState.sessionsIndex = rows
    .map((row) => typeof row === "string" ? row : String(row && row.name || ""))
    .filter(Boolean);
  const stagedName = stagedThreadName();
  const activeName = String(appState.activeSessionName || "").trim();
  if (el.sessionOpsSummary) {
    const pinnedCount = normalizePinnedSessionNames(appState.pinnedSessionNames).filter((name) => appState.sessionsIndex.includes(name)).length;
    const unreadCount = appState.sessionsIndex.filter((name) => sessionIsUnread(name, appState.sessionsMeta[name] || {})).length;
    el.sessionOpsSummary.textContent = rows.length
      ? `${rows.length} saved threads | ${visibleRows.length} visible | ${pinnedCount} pinned | ${unreadCount} unread. Keep save/load visible, then open the trays only for maintenance or deep metadata.`
      : "No saved threads yet. Use this deck to stage the first encrypted snapshot.";
    if (stagedName) {
      el.sessionOpsSummary.textContent += ` Staged target: ${stagedName}.`;
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
  if (!visibleRows.length) {
    const li = document.createElement("li");
    li.className = "list-empty";
    li.textContent = "No saved sessions match the current inbox filter.";
    el.sessionList.appendChild(li);
    updateDashboardSummary();
    renderIntelSurface();
    return;
  }
  for (const row of visibleRows) {
    const name = typeof row === "string" ? row : String(row.name || "");
    if (!name) continue;
    const meta = appState.sessionsMeta[name] || {};
    const isPinned = sessionIsPinned(name);
    const isUnread = sessionIsUnread(name, meta);
    const isLive = activeName === name;
    const isStaged = stagedName === name && !isLive;
    const li = document.createElement("li");
    li.className = "session-item";
    li.dataset.sessionName = name;
    li.classList.toggle("is-active", isStaged);
    li.classList.toggle("is-live", isLive);
    li.classList.toggle("is-pinned", isPinned);
    li.classList.toggle("is-unread", isUnread);
    const top = document.createElement("div");
    top.className = "list-item-top";
    const title = document.createElement("div");
    title.className = "list-item-name";
    title.textContent = name;
    const topActions = document.createElement("div");
    topActions.className = "list-item-actions";
    const badge = document.createElement("span");
    badge.className = "list-item-badge";
    badge.textContent = meta.workflowId
      ? String((getWorkflow(meta.workflowId) && getWorkflow(meta.workflowId).title) || meta.workflowId)
      : `${meta.tokens || 0} tok`;
    topActions.appendChild(badge);
    const pinButton = document.createElement("button");
    pinButton.type = "button";
    pinButton.className = "list-item-pin btn-secondary";
    pinButton.textContent = isPinned ? "Unpin" : "Pin";
    pinButton.onclick = (event) => {
      event.preventDefault();
      event.stopPropagation();
      togglePinnedSession(name);
    };
    topActions.appendChild(pinButton);
    top.appendChild(title);
    top.appendChild(topActions);
    const statusRow = document.createElement("div");
    statusRow.className = "session-status-row";
    if (isLive) {
      statusRow.appendChild(makeThreadHeadTag("Live", "good"));
    }
    if (isStaged) {
      statusRow.appendChild(makeThreadHeadTag("Staged", "warn"));
    }
    if (isPinned) {
      statusRow.appendChild(makeThreadHeadTag("Pinned", "good"));
    }
    if (isUnread) {
      statusRow.appendChild(makeThreadHeadTag("Unread", "warn"));
    }
    if (meta.outputMode) {
      statusRow.appendChild(makeThreadHeadTag(String(meta.outputMode).replace(/_/g, " "), "neutral"));
    }
    const metaLine = document.createElement("div");
    metaLine.className = "list-item-meta";
    const metaParts = [`Updated ${formatTimestampLabel(meta.updatedAt)}`];
    if (meta.workspaceLabel) metaParts.push(meta.workspaceLabel);
    if (meta.model) metaParts.push(meta.model);
    metaLine.textContent = metaParts.join(" | ");
    const support = document.createElement("div");
    support.className = "session-support-line";
    const supportText = sessionSupportSummary(meta);
    support.textContent = supportText || "Encrypted thread, ready to stage or load into the active lane.";
    const preview = document.createElement("div");
    preview.className = "list-item-preview";
    preview.textContent = sessionPreviewText(name, meta);
    li.appendChild(top);
    if (statusRow.childElementCount) {
      li.appendChild(statusRow);
    }
    li.appendChild(metaLine);
    li.appendChild(support);
    li.appendChild(preview);
    li.onclick = () => {
      if (el.sessionName) el.sessionName.value = name;
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
    rows.sort((a, b) => sessionUpdatedAtValue(appState.sessionsMeta[b.name] || {}).localeCompare(sessionUpdatedAtValue(appState.sessionsMeta[a.name] || {})));
  }
  if (appState.activeSessionName && !rows.some((row) => String(row.name || row) === String(appState.activeSessionName))) {
    appState.activeSessionName = "";
  }
  if (appState.activeSessionName) {
    const activeMeta = appState.sessionsMeta[appState.activeSessionName] || {};
    markSessionAsRead(appState.activeSessionName, sessionUpdatedAtValue(activeMeta), {
      persist: false,
      render: false
    });
  }
  renderSessions(rows);
  if (el.sessionMetadataOutput) el.sessionMetadataOutput.textContent = JSON.stringify(appState.sessionsMeta, null, 2);
}
async function loadSessionTarget(sessionName, options = {}) {
  const name = String(sessionName || (el.sessionName && el.sessionName.value) || "").trim();
  const pass = String((el.sessionPass && el.sessionPass.value) || "").trim();
  if (!name || !pass) {
    showBanner("Session name and passphrase are required.", "bad");
    return null;
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
    appState.contextPack = payload && payload.contextPack && typeof payload.contextPack === "object"
      ? normalizeContextPackValue(payload.contextPack)
      : null;
  } catch {
    appState.contextPack = null;
  }
  appState.contextPackProfiles = normalizeContextPackProfiles(payload && payload.contextPackProfiles);
  appState.activeContextPackProfileId = String((payload && payload.activeContextPackProfileId) || "").trim();
  try {
    appState.verificationRunPlan = payload && payload.verificationRunPlan && typeof payload.verificationRunPlan === "object"
      ? normalizeVerificationRunPlanValue(payload.verificationRunPlan, { workflowId: appState.workflowId })
      : null;
  } catch {
    appState.verificationRunPlan = null;
  }
  appState.verificationRunHistory = normalizeVerificationRunHistory(payload && payload.verificationRunHistory);
  appState.promotedPaletteActions = normalizePromotedPaletteActions(payload && payload.promotedPaletteActions);
  appState.lastArtifact = payload && payload.lastArtifact && typeof payload.lastArtifact === "object"
    ? normalizeArtifactValue(payload.lastArtifact, {
      workflowId: appState.workflowId,
      outputMode: appState.outputMode
    })
    : null;
  appState.shippingPacketHistory = normalizeShippingPacketHistory(payload && payload.shippingPacketHistory);
  if (!appState.shippingPacketHistory.length && hasShippingPacketArtifact()) {
    appState.shippingPacketHistory = [normalizeArtifactValue(appState.lastArtifact, {
      forceOutputMode: "shipping_packet",
      title: "Shipping Packet"
    })];
  }
  try {
    appState.patchPlan = payload && payload.patchPlan && typeof payload.patchPlan === "object"
      ? normalizePatchPlanValue(payload.patchPlan, { workflowId: appState.workflowId })
      : null;
    syncPatchPlanSelections();
    appState.patchPlanGroupOpenIds = null;
  } catch {
    appState.patchPlan = null;
    appState.patchPlanGroupOpenIds = null;
  }
  reconcileWorkspaceBoundState();
  if (appState.workspaceAttachment) {
    recordAttachedWorkspace(appState.workspaceAttachment, { render: false });
  }
  appState.patchPlanPreviewFileId = appState.patchPlan && Array.isArray(appState.patchPlan.files) && appState.patchPlan.files[0]
    ? String(appState.patchPlan.files[0].fileId || "")
    : "";
  resetWorkspaceActions();
  setWorkbenchSurface(preferredWorkbenchSurfaceFromLoadedState(), { persist: false, scroll: false });
  if (payload && typeof payload.settings === "object") {
    appState.settings = { ...appState.settings, ...payload.settings };
    appState.settings = await api.settings.update(appState.settings);
  }
  appState.activeSessionName = name;
  markSessionAsRead(name, sessionUpdatedAtValue(appState.sessionsMeta[name] || {}), {
    persist: false,
    render: false
  });
  const state = { selectedModel: appState.model };
  await api.llm.setModel(state.selectedModel);
  await api.state.set("model", state.selectedModel);
  renderWorkflowSummary();
  renderWorkspaceAttachment();
  renderPatchPlanPanel();
  renderArtifactPanel();
  renderOperatorMemorySurface();
  appState.contextPackProfileStatuses = {};
  syncSelectedContextPackProfileStatus();
  refreshRelevantContextPackProfileStatuses({ all: true }).catch(() => { });
  if (el.commandPaletteShortcutScope) {
    el.commandPaletteShortcutScope.value = appState.commandPaletteShortcutScope;
  }
  renderChat(appState.chat, { syncArtifact: false });
  await persistChatState();
  await refreshModels();
  if (options.announce !== false) {
    showBanner(`Session loaded: ${name}`, "ok");
  }
  appState.restored = true;
  appState.restoredSessionName = name;
  updateSessionStatusHeader();
  return payload;
}

function availableModelOptions(models = [], providerId = "") {
  const normalizedProviderId = normalizeBridgeProviderId(providerId || "");
  const profileModels = getNormalizedProfiles(appState.settings)
    .filter((profile) => !normalizedProviderId || normalizeBridgeProviderId(profile.provider) === normalizedProviderId)
    .map((profile) => profile.defaultModel);
  const providerModels = suggestedModelsForProvider(providerId);
  return Array.from(new Set([
    "llama3",
    appState.model,
    ...(models || []),
    ...profileModels,
    ...providerModels
  ].map((item) => String(item || "").trim()).filter(Boolean)));
}

function fillModelSelect(select, models, preferredValue, providerId = "") {
  if (!select) return;
  const preferred = String(preferredValue || appState.model || "llama3").trim() || "llama3";
  const values = Array.from(new Set([preferred, ...availableModelOptions(models, providerId)]));
  select.innerHTML = "";
  for (const model of values) {
    const option = document.createElement("option");
    option.value = model;
    option.textContent = model;
    select.appendChild(option);
  }
  select.value = values.includes(preferred) ? preferred : values[0] || "llama3";
}

function setModelOptions(models) {
  const activeProfile = liveBridgeProfile() || currentBridgeProfile();
  const activeProviderId = activeProfile ? activeProfile.provider : "ollama";
  const values = availableModelOptions(models, activeProviderId);
  fillModelSelect(el.modelSelect, values, appState.model, activeProviderId);
  fillModelSelect(el.settingsModelSelect, values, appState.model, activeProviderId);
  fillModelSelect(
    el.profileDefaultModelSelect,
    values,
    (el.profileDefaultModelSelect && el.profileDefaultModelSelect.value) || (activeProfile ? activeProfile.defaultModel : appState.model),
    (el.profileProviderSelect && el.profileProviderSelect.value) || activeProviderId
  );
  updateDashboardSummary();
}

async function setActiveModel(modelId, options = {}) {
  const selected = String(modelId || "").trim() || "llama3";
  appState.model = selected;
  if (window.api && window.api.llm && typeof window.api.llm.setModel === "function") {
    await window.api.llm.setModel(selected);
  }
  setModelOptions([]);
  populateOnboardingModelSelect();
  await persistChatState();
  if (options.announce !== false) {
    showBanner(`Active model: ${selected}`, "ok");
  }
}

async function refreshModels() {
  if (!window.api || !window.api.llm) return;
  try {
    const models = await window.api.llm.listModels();
    setModelOptions(Array.isArray(models) ? models : []);
    populateOnboardingModelSelect();
    applyLlmStatus("bridge_online", { manual: true });
    showBanner("Models refreshed.", "ok");
  } catch (err) {
    setModelOptions([appState.model]);
    populateOnboardingModelSelect();
    applyLlmStatus(appState.settings.connectOnStartup !== false ? "bridge_reconnecting" : "bridge_offline", { manual: true });
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
      ? `${rows.length} commands indexed (${localCount} local, ${coreCount} core/plugin). Keep the palette as the front door, then open the raw rail only for low-level recall.`
      : "No commands discovered. Refresh the rail or route through the palette once the catalog is available.";
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

function focusSurface(selector) {
  const node = document.querySelector(selector);
  if (node && typeof node.scrollIntoView === "function") {
    node.scrollIntoView({ block: "start" });
  }
}

const DEFAULT_COMMAND_PALETTE_PREFIXES = {
  action: ["action", "actions"],
  artifact: ["artifact", "artifacts", "dock"],
  apply: ["apply", "patch", "diff"],
  command: ["command", "commands"],
  context: ["context", "repo"],
  memory: ["memory", "draft", "recent"],
  profile: ["profile", "profiles"],
  release: ["release", "ship"],
  session: ["session", "sessions"],
  shortcut: ["shortcut", "shortcuts"],
  workflow: ["workflow", "workflows"],
  slash: ["slash"]
};

const COMMAND_PALETTE_PREFIXES = commandDeckConfig && commandDeckConfig.COMMAND_PALETTE_PREFIXES
  ? commandDeckConfig.COMMAND_PALETTE_PREFIXES
  : DEFAULT_COMMAND_PALETTE_PREFIXES;

const DEFAULT_COMMAND_PALETTE_SECTION_ORDER = [
  "Context Profiles",
  "Repo Context",
  "Workflow Actions",
  "Release Controls",
  "Apply Deck",
  "Artifact Dock",
  "Session Controls",
  "Operator Memory",
  "Shortcuts",
  "Interface Controls",
  "Command Catalog",
  "Slash Commands",
  "Other Actions"
];

const COMMAND_PALETTE_SECTION_ORDER = Array.isArray(commandDeckConfig.COMMAND_PALETTE_SECTION_ORDER) && commandDeckConfig.COMMAND_PALETTE_SECTION_ORDER.length
  ? commandDeckConfig.COMMAND_PALETTE_SECTION_ORDER
  : DEFAULT_COMMAND_PALETTE_SECTION_ORDER;

function palettePrefixKeyForToken(token) {
  const normalized = String(token || "").trim().toLowerCase();
  return Object.entries(COMMAND_PALETTE_PREFIXES).find(([, aliases]) => aliases.includes(normalized))?.[0] || "";
}

function parseCommandPaletteQuery(rawQuery) {
  const raw = String(rawQuery || "").trim();
  const match = raw.match(/^([a-z_]+):(.*)$/i);
  if (!match) {
    return {
      prefix: "",
      query: raw.toLowerCase()
    };
  }
  return {
    prefix: palettePrefixKeyForToken(match[1]),
    query: String(match[2] || "").trim().toLowerCase()
  };
}

function paletteQueryTokens(query) {
  return [...new Set(
    String(query || "")
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)
  )];
}

function fuzzySequenceScore(text, query) {
  const haystack = String(text || "").toLowerCase();
  const needle = String(query || "").toLowerCase().replace(/\s+/g, "");
  if (!haystack || !needle) return 0;
  let lastIndex = -1;
  let spanStart = -1;
  for (const char of needle) {
    const nextIndex = haystack.indexOf(char, lastIndex + 1);
    if (nextIndex < 0) {
      return 0;
    }
    if (spanStart < 0) {
      spanStart = nextIndex;
    }
    lastIndex = nextIndex;
  }
  const span = lastIndex - spanStart + 1;
  return Math.max(0, 90 - span);
}

function scorePaletteField(text, query, tokens) {
  const value = String(text || "").toLowerCase();
  if (!value) return 0;
  let score = 0;
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (normalizedQuery) {
    if (value === normalizedQuery) {
      score += 480;
    } else if (value.startsWith(normalizedQuery)) {
      score += 340;
    } else {
      const queryIndex = value.indexOf(normalizedQuery);
      if (queryIndex >= 0) {
        score += Math.max(180, 300 - queryIndex * 4);
      }
    }
  }
  let tokenHits = 0;
  for (const token of tokens) {
    const tokenIndex = value.indexOf(token);
    if (tokenIndex >= 0) {
      tokenHits += 1;
      score += Math.max(40, 120 - tokenIndex * 3);
    }
  }
  if (tokens.length && tokenHits === tokens.length) {
    score += 80;
  }
  if (!score && normalizedQuery) {
    score += fuzzySequenceScore(value, normalizedQuery);
  }
  return score;
}

function getPaletteMatchModel(action, queryModel) {
  const normalizedQuery = String(queryModel && queryModel.query || "").trim().toLowerCase();
  const tokens = paletteQueryTokens(normalizedQuery);
  if (!normalizedQuery) {
    return {
      score: 0,
      tokens
    };
  }
  const labelScore = scorePaletteField(action.label, normalizedQuery, tokens);
  const detailScore = scorePaletteField(action.detail, normalizedQuery, tokens);
  const searchScore = scorePaletteField(action.searchText, normalizedQuery, tokens);
  const total = labelScore * 3 + detailScore * 2 + searchScore;
  if (total <= 0) {
    return null;
  }
  return {
    score: total,
    tokens
  };
}

function appendHighlightedText(target, text, queryModel) {
  if (!target) return;
  const value = String(text || "");
  const tokens = paletteQueryTokens(queryModel && queryModel.query);
  if (!tokens.length) {
    target.textContent = value;
    return;
  }
  const lower = value.toLowerCase();
  const ranges = [];
  for (const token of [...tokens].sort((left, right) => right.length - left.length)) {
    if (!token) continue;
    let startIndex = 0;
    while (startIndex < lower.length) {
      const matchIndex = lower.indexOf(token, startIndex);
      if (matchIndex < 0) break;
      const nextRange = [matchIndex, matchIndex + token.length];
      const overlaps = ranges.some(([start, end]) => !(nextRange[1] <= start || nextRange[0] >= end));
      if (!overlaps) {
        ranges.push(nextRange);
      }
      startIndex = matchIndex + token.length;
    }
  }
  if (!ranges.length) {
    target.textContent = value;
    return;
  }
  ranges.sort((left, right) => left[0] - right[0]);
  target.textContent = "";
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) {
      target.appendChild(document.createTextNode(value.slice(cursor, start)));
    }
    const mark = document.createElement("mark");
    mark.className = "palette-match";
    mark.textContent = value.slice(start, end);
    target.appendChild(mark);
    cursor = end;
  }
  if (cursor < value.length) {
    target.appendChild(document.createTextNode(value.slice(cursor)));
  }
}

function commandPaletteSectionRank(section) {
  const index = COMMAND_PALETTE_SECTION_ORDER.indexOf(String(section || ""));
  return index >= 0 ? index : COMMAND_PALETTE_SECTION_ORDER.length;
}

function commandPaletteSectionMatches(prefix, action) {
  if (!prefix) return true;
  const prefixes = Array.isArray(action && action.prefixes) ? action.prefixes : [];
  return prefixes.includes(prefix);
}

function decoratePaletteAction(action, extra = {}) {
  return {
    section: "Other Actions",
    prefixes: ["action"],
    searchText: "",
    ...action,
    ...extra
  };
}

async function selectContextPackProfile(profileId, options = {}) {
  const targetId = String(profileId || "").trim();
  const profile = normalizeContextPackProfiles(appState.contextPackProfiles).find((item) => item.id === targetId);
  if (!profile) {
    throw new Error("Saved context-pack profile is unavailable.");
  }
  if (!hasWorkspaceAttachment() || profile.workspaceRoot !== rootPathFromWorkspaceBoundValue(appState.workspaceAttachment)) {
    throw new Error("Attach the profile workspace before selecting this context profile.");
  }
  appState.activeContextPackProfileId = profile.id;
  syncSelectedContextPackProfileStatus();
  renderContextPackSurface({ seedDefaults: true });
  renderMissionControl();
  refreshRelevantContextPackProfileStatuses({ workflowId: appState.workflowId }).catch(() => { });
  if (options.persist !== false) {
    await persistChatState();
  }
  if (options.announce !== false) {
    showBanner(`Context profile selected: ${profile.name}`, "ok");
  }
  return profile;
}

function getContextPaletteActions() {
  if (!hasWorkspaceAttachment()) {
    return [];
  }
  const workflow = getWorkflow(appState.workflowId);
  const workflowTitle = (workflow && workflow.title) || "the active workflow";
  const workspaceLabel = String(
    (appState.workspaceAttachment && (appState.workspaceAttachment.label || appState.workspaceAttachment.rootPath)) || "the attached workspace"
  ).trim();
  const recommendedProfile = recommendedContextPackProfile(appState.workflowId);
  const recommendedLoaded = recommendedProfile && contextPackProfileMatchesLoadedPack(recommendedProfile);
  const recommendedStatus = contextProfileStatusForCard(recommendedProfile);
  const selectedProfile = currentContextPackProfile();
  const selectedProfileWorkflow = contextPackProfileWorkflow(selectedProfile);
  const saveTargetProfile = hasContextPack() ? reusableContextPackProfileForSave(appState.contextPack, { workflowId: appState.workflowId }) : null;
  const workspaceProfiles = currentWorkspaceContextPackProfiles();
  const actions = [];

  actions.push(decoratePaletteAction({
    label: "Suggest Context Files",
    detail: `Populate the Intel context builder with ${workflowTitle}-ranked repo files for ${workspaceLabel}.`,
    badge: "context",
    suppressSuccessBanner: true,
    run: async () => {
      await suggestContextPackFiles({ workflowId: appState.workflowId });
      focusSurface(".panel-intel");
    }
  }, {
    section: "Repo Context",
    prefixes: ["context"],
    searchText: `${workflowTitle} ${workspaceLabel} suggest files`
  }));

  if (hasContextPack()) {
    actions.push(decoratePaletteAction({
      label: "Save Current Context Pack as Workflow Profile",
      detail: saveTargetProfile
        ? `Update ${saveTargetProfile.name} as the reusable ${workflowTitle} profile from the currently loaded context pack.`
        : `Save ${appState.contextPack.name} as a reusable ${workflowTitle} context profile for ${workspaceLabel}.`,
      badge: "context",
      suppressSuccessBanner: true,
      run: async () => {
        await saveCurrentContextPackProfile();
        focusSurface(".panel-intel");
      }
    }, {
      section: "Context Profiles",
      prefixes: ["context", "profile"],
      searchText: `${workflowTitle} save current pack profile ${appState.contextPack.name}`
    }));
  }

  if (recommendedProfile && !recommendedLoaded) {
    actions.push(decoratePaletteAction({
      label: "Load Recommended Context Profile",
      detail: `${workflowTitle} recommends ${recommendedProfile.name}${recommendedStatus.known ? ` (${recommendedStatus.stale ? "stale" : "fresh"})` : ""}. Load it into the active context lane.`,
      badge: "context",
      suppressSuccessBanner: true,
      run: async () => {
        await loadRecommendedContextPackProfile({ workflowId: appState.workflowId });
        focusSurface(".panel-intel");
      }
    }, {
      section: "Context Profiles",
      prefixes: ["context", "profile"],
      searchText: `${workflowTitle} recommended profile load ${recommendedProfile.name}`
    }));
  }

  if (recommendedProfile) {
    actions.push(decoratePaletteAction({
      label: "Refresh Recommended Context Profile",
      detail: recommendedStatus.known && recommendedStatus.stale
        ? `Reload ${recommendedProfile.name} from current repo files and update its saved snapshot for ${workflowTitle}.`
        : `Rebuild the saved snapshot for ${recommendedProfile.name} against current repo files for ${workflowTitle}.`,
      badge: "context",
      suppressSuccessBanner: true,
      run: async () => {
        await refreshContextPackProfile(recommendedProfile.id);
        focusSurface(".panel-intel");
      }
    }, {
      section: "Context Profiles",
      prefixes: ["context", "profile"],
      searchText: `${workflowTitle} recommended profile refresh ${recommendedProfile.name}`
    }));
  }

  if (selectedProfile && normalizeWorkflowId(selectedProfile.workflowId) !== normalizeWorkflowId(appState.workflowId)) {
    actions.push(decoratePaletteAction({
      label: "Re-link Selected Context Profile to Current Workflow",
      detail: `Link ${selectedProfile.name} to ${workflowTitle} instead of ${(selectedProfileWorkflow && selectedProfileWorkflow.title) || normalizeWorkflowId(selectedProfile.workflowId)} without changing its saved file snapshot.`,
      badge: "context",
      suppressSuccessBanner: true,
      run: async () => {
        await relinkContextPackProfileToWorkflow(selectedProfile.id, appState.workflowId);
        focusSurface(".panel-intel");
      }
    }, {
      section: "Context Profiles",
      prefixes: ["context", "profile"],
      searchText: `${workflowTitle} relink selected profile ${selectedProfile.name}`
    }));
  }

  for (const profile of workspaceProfiles) {
    const profileWorkflow = contextPackProfileWorkflow(profile);
    const profileStatus = contextProfileStatusForCard(profile);
    const profileLoaded = contextPackProfileMatchesLoadedPack(profile);
    const profileSelected = String(profile.id || "").trim() === String(appState.activeContextPackProfileId || "").trim();

    actions.push(decoratePaletteAction({
      label: `Select Context Profile: ${profile.name}`,
      detail: `${(profileWorkflow && profileWorkflow.title) || normalizeWorkflowId(profile.workflowId)} | ${profileStatus.known ? (profileStatus.stale ? "stale" : "fresh") : "status pending"} | ${profile.filePaths.length} file${profile.filePaths.length === 1 ? "" : "s"}. Target refresh, relink, and delete actions at this saved profile.`,
      badge: profileSelected ? "selected" : "profile",
      suppressSuccessBanner: true,
      run: async () => {
        await selectContextPackProfile(profile.id);
        focusSurface(".panel-intel");
      }
    }, {
      section: "Context Profiles",
      prefixes: ["context", "profile"],
      searchText: `${profile.name} ${(profileWorkflow && profileWorkflow.title) || profile.workflowId} select`
    }));

    if (!profileLoaded) {
      actions.push(decoratePaletteAction({
        label: `Load Context Profile: ${profile.name}`,
        detail: `${(profileWorkflow && profileWorkflow.title) || normalizeWorkflowId(profile.workflowId)} | ${profile.filePaths.length} file${profile.filePaths.length === 1 ? "" : "s"}. Load this saved repo-memory snapshot into the active context lane.`,
        badge: "profile",
        suppressSuccessBanner: true,
        run: async () => {
          await loadContextPackProfile(profile.id);
          focusSurface(".panel-intel");
        }
      }, {
        section: "Context Profiles",
        prefixes: ["context", "profile"],
        searchText: `${profile.name} ${(profileWorkflow && profileWorkflow.title) || profile.workflowId} load`
      }));
    }

    actions.push(decoratePaletteAction({
      label: `Delete Context Profile: ${profile.name}`,
      detail: `Remove the saved ${(profileWorkflow && profileWorkflow.title) || normalizeWorkflowId(profile.workflowId)} profile from ${workspaceLabel}.`,
      badge: "danger",
      suppressSuccessBanner: true,
      run: async () => {
        await deleteContextPackProfile(profile.id);
        focusSurface(".panel-intel");
      }
    }, {
      section: "Context Profiles",
      prefixes: ["context", "profile"],
      searchText: `${profile.name} ${(profileWorkflow && profileWorkflow.title) || profile.workflowId} delete remove`
    }));
  }

  return actions;
}

function getOperatorMemoryPaletteActions() {
  const actions = [];
  const draftText = String(appState.draftPrompt || "").trim();

  if (draftText) {
    actions.push(decoratePaletteAction({
      label: "Restore Saved Draft",
      detail: `Reload the saved local draft into the prompt editor: ${operatorMemoryPromptPreview(draftText, 96)}`,
      badge: "memory",
      suppressSuccessBanner: true,
      run: async () => {
        restoreSavedDraft({ focus: true });
      }
    }, {
      section: "Operator Memory",
      prefixes: ["memory"],
      searchText: `restore saved draft ${draftText}`
    }));

    actions.push(decoratePaletteAction({
      label: "Clear Saved Draft",
      detail: "Clear the local prompt draft so the next launch starts cold.",
      badge: "memory",
      suppressSuccessBanner: true,
      run: async () => {
        clearSavedDraft({ focus: true });
      }
    }, {
      section: "Operator Memory",
      prefixes: ["memory"],
      searchText: "clear saved draft memory"
    }));
  }

  for (const entry of (appState.recentPrompts || []).slice(0, 4)) {
    const promptText = String(entry && entry.text || "").trim();
    if (!promptText) continue;
    actions.push(decoratePaletteAction({
      label: `Recent Prompt: ${truncateInlineText(promptText, 42)}`,
      detail: `${truncateInlineText(promptText, 110)} | ${formatTimestampLabel(entry && entry.updatedAt)}`,
      badge: "memory",
      suppressSuccessBanner: true,
      run: async () => {
        setPromptEditorValue(promptText, { focus: true });
        showBanner("Recent prompt loaded.", "ok");
      }
    }, {
      section: "Operator Memory",
      prefixes: ["memory"],
      searchText: `recent prompt ${promptText}`
    }));
  }

  for (const entry of (appState.recentWorkspaces || []).slice(0, 4)) {
    const rootPath = String(entry && entry.rootPath || "").trim();
    if (!rootPath) continue;
    const label = String(entry && (entry.label || entry.rootPath) || "Recent workspace").trim();
    actions.push(decoratePaletteAction({
      label: `Attach Workspace: ${label}`,
      detail: `${truncateInlineText(rootPath, 92)} | ${formatTimestampLabel(entry && (entry.updatedAt || entry.attachedAt))}`,
      badge: "memory",
      suppressSuccessBanner: true,
      run: async () => {
        await attachRecentWorkspace(rootPath);
      }
    }, {
      section: "Operator Memory",
      prefixes: ["memory", "context"],
      searchText: `${label} ${rootPath} attach recent workspace`
    }));

    actions.push(decoratePaletteAction({
      label: `Forget Workspace: ${label}`,
      detail: `Remove ${truncateInlineText(rootPath, 92)} from local operator memory.`,
      badge: "memory",
      suppressSuccessBanner: true,
      run: async () => {
        removeRecentWorkspace(rootPath);
      }
    }, {
      section: "Operator Memory",
      prefixes: ["memory"],
      searchText: `${label} ${rootPath} forget workspace`
    }));
  }

  return actions;
}

function getCommandPaletteActions() {
  const promotedActions = (appState.promotedPaletteActions || [])
    .filter((action) => (
      appState.commandPaletteShortcutScope === "all"
        ? true
        : normalizeWorkflowId(action.workflowId) === normalizeWorkflowId(appState.workflowId)
    ))
    .map((action) => decoratePaletteAction({
      label: action.label,
      detail: action.detail,
      badge: "shortcut",
      run: async () => { loadPromotedPaletteActionPrompt(action.id); }
    }, {
      section: "Shortcuts",
      prefixes: ["shortcut"],
      searchText: `${action.groupTitle || ""} ${action.workflowId || ""} promoted shortcut`
    }));

  const contextActions = getContextPaletteActions();
  const memoryActions = getOperatorMemoryPaletteActions();

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
      label: "Stage Shipping verification",
      detail: "Queue lint, founder e2e, and store screenshot refresh into the Shipping Cockpit",
      run: async () => { stageShippingCockpit(); }
    },
    {
      label: "Run Shipping verification",
      detail: "Run the selected checks from the staged Shipping Cockpit plan",
      run: async () => { await runShippingCockpitChecks(); }
    },
    {
      label: "Build Shipping Packet",
      detail: "Generate a dock-ready shipping packet from the current cockpit, artifact, and verification state",
      run: async () => { await buildShippingPacketArtifact(); }
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
  ].map((action) => {
    let section = "Other Actions";
    let prefixes = ["action"];
    if (["Send Prompt"].includes(action.label)) {
      section = "Workflow Actions";
      prefixes = ["workflow", "action"];
    } else if (["Refresh Sessions"].includes(action.label)) {
      section = "Session Controls";
      prefixes = ["session", "action"];
    } else if (["Refresh Commands", "LLM Health Check", "Auto Detect Bridge", "Bridge Health Check"].includes(action.label)) {
      section = "Command Catalog";
      prefixes = ["command", "action"];
    } else if (["Refresh Models", "Open Settings Menu", "Open Onboarding", "Toggle Theme"].includes(action.label)) {
      section = "Interface Controls";
      prefixes = ["action"];
    } else if (["Attach Workspace", "Clear Workspace"].includes(action.label)) {
      section = "Repo Context";
      prefixes = ["context", "action"];
    } else if (["Export Evidence Bundle"].includes(action.label)) {
      section = "Artifact Dock";
      prefixes = ["artifact", "action"];
    } else if (["Preview Markdown Report", "Preview Evidence Write", "Load Artifact as Patch Plan", "Preview Patch Plan", "Apply Selected Patch Files", "Apply Entire Patch Plan", "Load Artifact Into File Draft", "Preview File Diff", "Apply Previewed Action"].includes(action.label)) {
      section = action.label.includes("Apply") || action.label.includes("Patch") || action.label.includes("Diff")
        ? "Apply Deck"
        : "Artifact Dock";
      prefixes = section === "Apply Deck" ? ["apply", "artifact"] : ["artifact", "apply"];
    } else if (["Run Verification Plan", "Stage Shipping verification", "Run Shipping verification", "Build Shipping Packet", "Copy Verification Commands"].includes(action.label)) {
      section = "Release Controls";
      prefixes = ["release", "action"];
    }
    return decoratePaletteAction(action, {
      section,
      prefixes,
      searchText: `${action.label} ${section}`
    });
  });

  const workflowActions = WORKFLOWS.map((workflow) => decoratePaletteAction({
    label: `Workflow: ${workflow.title}`,
    detail: workflow.description,
    run: async () => { await activateWorkflow(workflow.id); }
  }, {
    section: "Workflow Actions",
    prefixes: ["workflow"],
    searchText: `${workflow.id} ${workflow.title}`
  }));

  const slashActions = (appState.commands || []).map((cmd) => {
    const name = String(cmd && cmd.name || "").trim();
    const args = Array.isArray(cmd && cmd.args) && cmd.args.length ? ` ${(cmd.args || []).join(" ")}` : "";
    return decoratePaletteAction({
      label: `/${name}${args}`,
      detail: String(cmd && cmd.description || "Execute slash command"),
      run: async () => { await sendPromptFromText(`/${name}`, null, false); }
    }, {
      section: "Slash Commands",
      prefixes: ["slash", "command"],
      searchText: `${name} ${(cmd && cmd.source) || ""}`
    });
  });

  return [...promotedActions, ...contextActions, ...memoryActions, ...localActions, ...workflowActions, ...slashActions]
    .map((action, index) => ({
      ...action,
      sortWeight: Number.isFinite(Number(action.sortWeight)) ? Number(action.sortWeight) : index
    }))
    .sort((left, right) => {
      const sectionCompare = commandPaletteSectionRank(left.section) - commandPaletteSectionRank(right.section);
      if (sectionCompare !== 0) return sectionCompare;
      return Number(left.sortWeight || 0) - Number(right.sortWeight || 0);
    });
}

function renderCommandPaletteList() {
  if (!el.commandPaletteList) return;
  const queryModel = parseCommandPaletteQuery((el.commandPaletteInput && el.commandPaletteInput.value) || "");
  appState.commandPaletteItems = getCommandPaletteActions()
    .map((item) => {
      if (!commandPaletteSectionMatches(queryModel.prefix, item)) {
        return null;
      }
      const match = getPaletteMatchModel(item, queryModel);
      if (queryModel.query && !match) {
        return null;
      }
      return {
        ...item,
        matchScore: match ? match.score : 0
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const sectionCompare = commandPaletteSectionRank(left.section) - commandPaletteSectionRank(right.section);
      if (sectionCompare !== 0) return sectionCompare;
      const scoreCompare = Number(right.matchScore || 0) - Number(left.matchScore || 0);
      if (scoreCompare !== 0) return scoreCompare;
      return Number(left.sortWeight || 0) - Number(right.sortWeight || 0);
    })
    .slice(0, 40);
  appState.commandPaletteIndex = clampNumber(appState.commandPaletteIndex || 0, 0, Math.max(0, appState.commandPaletteItems.length - 1), 0);

  el.commandPaletteList.innerHTML = "";
  let lastSection = "";
  for (let i = 0; i < appState.commandPaletteItems.length; i += 1) {
    const action = appState.commandPaletteItems[i];
    if (action.section && action.section !== lastSection) {
      lastSection = action.section;
      const section = document.createElement("li");
      section.className = "palette-section";
      section.textContent = action.section;
      el.commandPaletteList.appendChild(section);
    }
    const li = document.createElement("li");
    li.className = "palette-item";
    li.classList.toggle("is-active", i === appState.commandPaletteIndex);
    const top = document.createElement("div");
    top.className = "list-item-top";
    const title = document.createElement("strong");
    title.className = "list-item-name";
    appendHighlightedText(title, action.label, queryModel);
    const badge = document.createElement("span");
    badge.className = "list-item-badge";
    badge.textContent = String(action.badge || (action.label.startsWith("/") ? "slash" : "action"));
    const detail = document.createElement("div");
    detail.className = "list-item-meta";
    appendHighlightedText(detail, action.detail, queryModel);
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
    li.textContent = queryModel.prefix
      ? `No matching ${queryModel.prefix} actions.`
      : "No matching actions.";
    el.commandPaletteList.appendChild(li);
  }
}

function moveCommandPaletteSelection(delta) {
  if (!appState.commandPaletteItems.length) return;
  const next = (appState.commandPaletteIndex + Number(delta || 0) + appState.commandPaletteItems.length) % appState.commandPaletteItems.length;
  appState.commandPaletteIndex = next;
  renderCommandPaletteList();
  if (!el.commandPaletteList) return;
  const active = el.commandPaletteList.querySelector(".palette-item.is-active");
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
      if (!action.suppressSuccessBanner) {
        showBanner(`Palette action: ${action.label}`, "ok");
      }
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

function resetStreamState(options = {}) {
  appState.streamInFlight = false;
  appState.streamBase = [];
  appState.streamText = "";
  if (options.clearRequest !== false) {
    appState.requestInFlight = false;
  }
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
  if (!text || !window.api || !window.api.llm || appState.requestInFlight || appState.streamInFlight) return false;

  const slash = parseSlashCommand(text);
  if (slash) {
    if (el.promptInput && el.promptInput.value.trim() === text) {
      setPromptEditorValue("", { render: true });
    }
    await runSlashCommand(text);
    return true;
  }

  const base = Array.isArray(baseMessages) ? baseMessages.slice() : getCurrentChat();
  const displayMessages = [...base, { role: "user", content: text }];
  const messages = [...base, { role: "system", content: workflowSystemInstruction() }, { role: "user", content: text }];
  appState.lastPrompt = text;
  recordSubmittedPrompt(text, { render: false });

  if (el.promptInput && el.promptInput.value.trim() === text) {
    setPromptEditorValue("", { render: true });
  } else {
    renderOperatorMemorySurface();
  }

  appState.requestInFlight = true;
  renderPrimaryActionState();

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
      resetStreamState({ clearRequest: false });
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
    appState.requestInFlight = false;
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

let bridgeSettingsFeature = null;
function getBridgeSettingsFeature() {
  if (!bridgeSettingsFeature) {
    if (!bridgeSettingsFeatureCatalog || typeof bridgeSettingsFeatureCatalog.createBridgeSettingsFeature !== "function") {
      throw new Error("Bridge settings feature module unavailable.");
    }
    bridgeSettingsFeature = bridgeSettingsFeatureCatalog.createBridgeSettingsFeature({
      window,
      document,
      appState,
      el,
      fillModelSelect,
      renderConnectionModeControls,
      currentBridgeProfile,
      liveBridgeProfile,
      populateProfileEditor,
      renderProviderProfileHelp,
      renderProviderPresetList,
      renderEnvProfileSummary,
      refreshBridgeEnvStatus,
      renderSettingsQuickstartHints,
      updateWorkspaceModeText,
      renderMissionControl,
      updateDynamicChrome,
      bridgeProviders: BRIDGE_PROVIDERS,
      getBridgeProvider,
      applySettingsPatch,
      setActiveModel,
      setModelOptions,
      syncModelToLiveBridgeFallback,
      applyLlmStatus,
      showBanner,
      getNormalizedProfiles,
      resolveActiveProfileId,
      findProfileById,
      normalizeProfile,
      profileIdFromName,
      activateBridgeProfile,
      testDraftBridgeProfile,
      readProfileDraftFromForm,
      updateProfileFormFromSelected,
      syncProfileProviderPreset,
      clampNumber,
      refreshModels,
      runBridgeAutoDetect,
      updateSettingsConnectionModeText,
      persistOfflineModePreference
    });
  }
  return bridgeSettingsFeature;
}

function syncSettingsInputsFromState() {
  return getBridgeSettingsFeature().syncSettingsInputsFromState();
}

function bindBridgeSettingsEvents() {
  return getBridgeSettingsFeature().bindBridgeSettingsEvents();
}
function renderSettingsQuickstartHints() {
  if (!el.settingsQuickstartList) return;
  el.settingsQuickstartList.innerHTML = "";
  const hints = [];
  const bridgeSelection = getBridgeSelectionState(appState.settings);
  const activeProfile = bridgeSelection.selectedProfile;
  const liveProfile = bridgeSelection.liveProfile || activeProfile;
  const activeProvider = getBridgeProvider(activeProfile ? activeProfile.provider : "ollama");
  const bridgeStatus = String(appState.llmStatus || "").trim().toLowerCase();

  if (bridgeStatus === "bridge_online" || bridgeStatus === "online") {
    hints.push(`Bridge is online. Keep ${String(appState.model || "the active model")} selected, then send a prompt or load a workflow starter.`);
  } else if (bridgeStatus === "busy") {
    hints.push("A bridge request is already running. Wait for it to finish before you switch profiles or models.");
  } else {
    hints.push("Start Ollama or your bridge process, then use Detect Local Bridge to confirm the base URL is reachable.");
  }

  hints.push(`Save ${activeProfile ? activeProfile.name : "a bridge profile"} with a default model so reopening the app does not drop you into manual setup.`);

  if (activeProvider.requiresApiKey && !(activeProfile && String(activeProfile.apiKey || "").trim())) {
    hints.push(`${activeProvider.label} needs an API key in the active profile before hosted model calls will work.`);
  }

  if (bridgeSelection.blockedByRemoteToggle && activeProfile && liveProfile) {
    hints.push(`${activeProfile.name} stays selected, but live traffic is using ${liveProfile.name} until you turn Offline Mode off.`);
  }

  const readyEnvProviders = Array.isArray(appState.bridgeEnvStatus)
    ? appState.bridgeEnvStatus.filter((entry) => entry.ready && !entry.imported)
    : [];
  if (readyEnvProviders.length) {
    hints.push(`Environment-backed hosted profiles are ready for ${readyEnvProviders.map((entry) => entry.label).join(", ")}. Use Import Env Profiles for one-click setup.`);
  }

  if (activeProvider.remote && !(appState.settings && appState.settings.allowRemoteBridge)) {
    hints.push(`${activeProvider.label} is a hosted provider. Turn Offline Mode off before you expect it to connect.`);
  } else if (appState.settings && appState.settings.allowRemoteBridge) {
    hints.push("Offline Mode is off. Point the base URL at a hosted or OpenAI-compatible gateway only when you intend to leave localhost.");
  } else {
    hints.push("Offline Mode is on. Leave it on for local-only work, and turn it off only when you really need a hosted bridge.");
  }

  hints.push(hasWorkspaceAttachment()
    ? "Workspace is attached. Use patch plans, verification, and Shipping work only when you want repo-scoped actions."
    : "Attach a workspace only when you want patch plans, verification, or shipping packets tied to one repo.");

  for (const hint of hints.slice(0, 4)) {
    const row = document.createElement("div");
    row.className = "workspace-action-hint";
    row.textContent = hint;
    el.settingsQuickstartList.appendChild(row);
  }
}

function profileIdFromName(name) {
  if (bridgeProfileModel && typeof bridgeProfileModel.profileIdFromName === "function") {
    return bridgeProfileModel.profileIdFromName(name);
  }
  const base = String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "profile";
}

function normalizeProfile(rawProfile, fallbackModel, fallbackId) {
  if (bridgeProfileModel && typeof bridgeProfileModel.normalizeBridgeProfile === "function") {
    return bridgeProfileModel.normalizeBridgeProfile(rawProfile, {
      fallbackModel,
      fallbackId,
      normalizeProviderId: normalizeBridgeProviderId,
      getProvider: getBridgeProvider,
      defaultLocalBaseUrl: "http://127.0.0.1:11434",
      defaultTimeoutMs: 15000,
      defaultRetryCount: 2
    });
  }
  const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
  const providerId = normalizeBridgeProviderId(profile.provider || "ollama");
  const provider = getBridgeProvider(providerId);
  const profileName = String(profile.name || "Local Ollama").trim() || "Local Ollama";
  return {
    id: String(profile.id || fallbackId || profileIdFromName(profileName)).trim() || "profile",
    name: profileName,
    provider: providerId,
    baseUrl: String(profile.baseUrl || provider.defaultBaseUrl || "http://127.0.0.1:11434").trim() || String(provider.defaultBaseUrl || "http://127.0.0.1:11434"),
    timeoutMs: clampNumber(profile.timeoutMs, 1000, 120000, 15000),
    retryCount: clampNumber(profile.retryCount, 0, 10, 2),
    defaultModel: String(profile.defaultModel || fallbackModel || suggestedModelsForProvider(providerId)[0] || "llama3").trim() || "llama3",
    apiKey: String(profile.apiKey || "").trim()
  };
}

function getNormalizedProfiles(settings) {
  if (bridgeProfileModel && typeof bridgeProfileModel.normalizeBridgeProfiles === "function") {
    return bridgeProfileModel.normalizeBridgeProfiles(settings, {
      fallbackModel: String(appState.model || "llama3"),
      normalizeProviderId: normalizeBridgeProviderId,
      getProvider: getBridgeProvider,
      defaultLocalBaseUrl: "http://127.0.0.1:11434",
      defaultTimeoutMs: 15000,
      defaultRetryCount: 2
    });
  }
  const current = settings && typeof settings === "object" ? settings : {};
  const fallbackModel = String(appState.model || "llama3");
  let profiles = Array.isArray(current.connectionProfiles) ? current.connectionProfiles.slice() : [];
  if (!profiles.length) {
    profiles = [{
      id: "local-default",
      name: "Local Ollama",
      provider: "ollama",
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
  if (bridgeProfileModel && typeof bridgeProfileModel.resolveActiveProfileId === "function") {
    return bridgeProfileModel.resolveActiveProfileId(settings, profiles);
  }
  const requested = String((settings && settings.activeProfileId) || "").trim();
  if (requested && profiles.some((row) => row.id === requested)) return requested;
  return profiles[0] ? profiles[0].id : "local-default";
}

function findProfileById(profiles, id) {
  if (bridgeProfileModel && typeof bridgeProfileModel.findBridgeProfileById === "function") {
    return bridgeProfileModel.findBridgeProfileById(profiles, id);
  }
  return profiles.find((row) => String(row.id) === String(id)) || null;
}

function mergeBridgeSettingsState(current, patch) {
  if (bridgeSettingsModel && typeof bridgeSettingsModel.mergeBridgeSettings === "function") {
    return bridgeSettingsModel.mergeBridgeSettings(current, patch, {
      fallbackModel: String(appState.model || "llama3"),
      normalizeProviderId: normalizeBridgeProviderId,
      getProvider: getBridgeProvider,
      defaultLocalBaseUrl: "http://127.0.0.1:11434",
      defaultTimeoutMs: 15000,
      defaultRetryCount: 2,
      defaultAllowRemoteBridge: false,
      defaultConnectOnStartup: true,
      defaultAutoLoadRecommendedContextProfile: false
    });
  }
  const merged = {
    ...(current && typeof current === "object" ? current : {}),
    ...(patch && typeof patch === "object" ? patch : {})
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
  return next;
}

function currentBridgeProfile() {
  return getBridgeSelectionState(appState.settings).selectedProfile;
}


function bridgeProfileNeedsRemoteAccess(profile) {
  return airgapPolicy.profileNeedsRemoteAccess(profile, {
    isRemoteProvider: (providerId) => Boolean(getBridgeProvider(providerId).remote)
  });
}

function getBridgeSelectionState(settings = appState.settings) {
  const profiles = getNormalizedProfiles(settings);
  return airgapPolicy.resolveBridgeSelection({
    profiles,
    activeProfileId: resolveActiveProfileId(settings, profiles),
    allowRemoteBridge: Boolean(settings && settings.allowRemoteBridge),
    isRemoteProvider: (providerId) => Boolean(getBridgeProvider(providerId).remote)
  });
}

function liveBridgeProfile() {
  return getBridgeSelectionState(appState.settings).liveProfile;
}

function preferredProfileForProvider(providerId, profiles = getNormalizedProfiles(appState.settings)) {
  const normalizedProviderId = normalizeBridgeProviderId(providerId);
  const matches = profiles.filter((profile) => normalizeBridgeProviderId(profile.provider) === normalizedProviderId);
  if (!matches.length) return null;
  const selectedProfile = currentBridgeProfile();
  return (
    matches.find((profile) => selectedProfile && profile.id === selectedProfile.id)
    || matches.find((profile) => profile.id === `env-${normalizedProviderId}`)
    || matches[0]
  );
}

function syncProfileTestMessaging(profile) {
  if (
    profile
    && bridgeProfileNeedsRemoteAccess(profile)
    && !(appState.settings && appState.settings.allowRemoteBridge)
  ) {
    setProfileTestResult(`${profile.name} is saved, but Offline Mode is on.`, "warn");
    setProfileTestHint("Turn Offline Mode off in LLM Setup before using or testing this profile.", "warn");
    return;
  }
  setProfileTestResult("Test the current draft before saving or using it.", "guard");
  setProfileTestHint("The test result will explain the next fix for this provider.", "guard");
}

async function syncModelToLiveBridgeFallback(options = {}) {
  const bridgeSelection = getBridgeSelectionState(appState.settings);
  if (!bridgeSelection.blockedByRemoteToggle || !bridgeSelection.liveProfile) {
    return {
      changed: false,
      bridgeSelection
    };
  }
  const nextModel =
    String(bridgeSelection.liveProfile.defaultModel || appState.model || "llama3").trim() || "llama3";
  if (nextModel !== appState.model) {
    await setActiveModel(nextModel, { announce: options.announce });
    return {
      changed: true,
      bridgeSelection,
      model: nextModel
    };
  }
  setModelOptions([]);
  return {
    changed: false,
    bridgeSelection,
    model: nextModel
  };
}

function populateProviderSelect(select, providerId = "ollama") {
  if (!select) return;
  const normalizedProviderId = normalizeBridgeProviderId(providerId);
  select.innerHTML = "";
  for (const provider of BRIDGE_PROVIDERS) {
    const option = document.createElement("option");
    option.value = provider.id;
    option.textContent = provider.label;
    select.appendChild(option);
  }
  select.value = normalizedProviderId;
}

function renderProviderProfileHelp(providerId) {
  const provider = getBridgeProvider(providerId);
  if (el.profileProviderHintText) {
    const apiKeyCopy = provider.requiresApiKey
      ? "Requires an API key stored in local encrypted state."
      : "Does not require an API key.";
    el.profileProviderHintText.textContent = `${provider.hint || provider.label}. ${apiKeyCopy}`;
  }
  if (el.settingsProviderSummaryText) {
    const bridgeSelection = getBridgeSelectionState(appState.settings);
    const selectedProfile = bridgeSelection.selectedProfile;
    const liveProfile = bridgeSelection.liveProfile;
    const selectedProvider = getBridgeProvider(selectedProfile ? selectedProfile.provider : provider.id);
    const liveProvider = getBridgeProvider(liveProfile ? liveProfile.provider : selectedProvider.id);
    if (bridgeSelection.blockedByRemoteToggle && selectedProfile && liveProfile) {
      el.settingsProviderSummaryText.textContent =
        `${selectedProvider.label} selected | live bridge: ${liveProvider.label} | Offline Mode on`;
      return;
    }
    const liveCopy = liveProvider.remote ? "Hosted provider live" : "Local provider live";
    el.settingsProviderSummaryText.textContent =
      `${liveProvider.label} | ${liveCopy}${selectedProfile && selectedProfile.name ? ` | ${selectedProfile.name}` : ""}`;
  }
}

function bridgeEnvStatusForProvider(providerId) {
  const normalized = normalizeBridgeProviderId(providerId);
  return Array.isArray(appState.bridgeEnvStatus)
    ? appState.bridgeEnvStatus.find((entry) => normalizeBridgeProviderId(entry.providerId) === normalized) || null
    : null;
}

function renderProviderPresetList() {
  if (!el.providerPresetList) return;
  el.providerPresetList.innerHTML = "";
  const bridgeSelection = getBridgeSelectionState(appState.settings);
  const profiles = bridgeSelection.profiles;
  const selectedProfile = bridgeSelection.selectedProfile;
  const liveProfile = bridgeSelection.liveProfile;
  for (const provider of BRIDGE_PROVIDERS) {
    const envStatus = bridgeEnvStatusForProvider(provider.id);
    const providerProfiles = profiles.filter((profile) => normalizeBridgeProviderId(profile.provider) === provider.id);
    const preferredProfile = preferredProfileForProvider(provider.id, profiles);
    const isSelectedProvider = Boolean(
      selectedProfile && normalizeBridgeProviderId(selectedProfile.provider) === provider.id
    );
    const isLiveProvider = Boolean(
      liveProfile && normalizeBridgeProviderId(liveProfile.provider) === provider.id
    );
    const card = document.createElement("div");
    card.className = "provider-preset-card";
    card.dataset.providerId = provider.id;
    card.classList.toggle("is-active", isLiveProvider);
    card.classList.toggle("is-selected", isSelectedProvider && !isLiveProvider);

    const copy = document.createElement("div");
    copy.className = "provider-preset-copy";
    const title = document.createElement("div");
    title.className = "workflow-title-text";
    title.textContent = provider.label;
    const description = document.createElement("p");
    description.className = "panel-note";
    description.textContent = provider.hint || provider.label;
    const detail = document.createElement("p");
    detail.className = "panel-note provider-preset-detail";
    if (preferredProfile) {
      const savedCopy = `${providerProfiles.length} saved profile${providerProfiles.length === 1 ? "" : "s"}`;
      detail.textContent = `${savedCopy} | Quick switch uses ${preferredProfile.name} | ${preferredProfile.defaultModel}`;
    } else if (envStatus && envStatus.ready && !envStatus.imported) {
      detail.textContent = "Env keys detected. Import Env Profiles to create a one-click switch target.";
    } else {
      detail.textContent = "No saved profile yet. Load the preset to stage one in the editor.";
    }
    copy.appendChild(title);
    copy.appendChild(description);
    copy.appendChild(detail);

    const meta = document.createElement("div");
    meta.className = "provider-preset-meta";
    meta.appendChild(createStatusPill(provider.remote ? "Hosted" : "Local", provider.remote ? "ok" : "good"));
    meta.appendChild(createStatusPill(provider.requiresApiKey ? "API key" : "No key", "guard"));
    if (preferredProfile) {
      meta.appendChild(createStatusPill("Saved profile", "read"));
    }
    if (envStatus && envStatus.ready) {
      meta.appendChild(createStatusPill(envStatus.imported ? "Env imported" : "Env ready", "good"));
    } else if (envStatus && envStatus.apiKeyPresent) {
      meta.appendChild(createStatusPill("Env incomplete", "warn"));
    }
    if (isSelectedProvider && isLiveProvider) {
      meta.appendChild(createStatusPill("Active", "good"));
    } else if (isSelectedProvider) {
      meta.appendChild(createStatusPill("Selected", "warn"));
    } else if (isLiveProvider) {
      meta.appendChild(createStatusPill("Live bridge", "good"));
    }

    const actions = document.createElement("div");
    actions.className = "row row-wrap action-grid settings-inline-actions";
    const presetBtn = document.createElement("button");
    presetBtn.type = "button";
    presetBtn.className = "btn-secondary";
    presetBtn.textContent = "Load Preset";
    presetBtn.onclick = () => loadProviderPresetIntoForm(provider.id);
    actions.appendChild(presetBtn);
    if (preferredProfile) {
      const useBtn = document.createElement("button");
      useBtn.type = "button";
      useBtn.className = "btn-secondary";
      useBtn.textContent = isLiveProvider ? "Live Now" : "Use Profile";
      useBtn.disabled = Boolean(
        preferredProfile
        && liveProfile
        && String(preferredProfile.id) === String(liveProfile.id)
      );
      useBtn.onclick = () => {
        activateBridgeProfile(preferredProfile.id).catch((err) => showBanner(err.message || String(err), "bad"));
      };
      actions.appendChild(useBtn);
    }

    card.appendChild(copy);
    card.appendChild(meta);
    card.appendChild(actions);
    el.providerPresetList.appendChild(card);
  }
}

function renderEnvProfileSummary() {
  if (!el.envProfileSummaryText) return;
  const statuses = Array.isArray(appState.bridgeEnvStatus) ? appState.bridgeEnvStatus : [];
  const ready = statuses.filter((entry) => entry.ready);
  const imported = ready.filter((entry) => entry.imported);
  const incomplete = statuses.filter((entry) => entry.apiKeyPresent && !entry.ready);
  if (!ready.length && !incomplete.length) {
    el.envProfileSummaryText.textContent = "No env-backed hosted providers detected yet.";
    return;
  }
  const parts = [];
  if (ready.length) {
    parts.push(`${ready.length} env-backed provider${ready.length === 1 ? "" : "s"} ready`);
  }
  if (imported.length) {
    parts.push(`${imported.length} already imported`);
  }
  if (incomplete.length) {
    parts.push(`${incomplete.length} incomplete`);
  }
  el.envProfileSummaryText.textContent = parts.join(" | ");
}

async function refreshBridgeEnvStatus() {
  if (!window.api || !window.api.bridge || typeof window.api.bridge.envStatus !== "function") {
    appState.bridgeEnvStatus = [];
    renderProviderPresetList();
    renderEnvProfileSummary();
    return [];
  }
  const result = await window.api.bridge.envStatus();
  appState.bridgeEnvStatus = result && Array.isArray(result.providers) ? result.providers : [];
  renderProviderPresetList();
  renderEnvProfileSummary();
  renderSettingsQuickstartHints();
  return appState.bridgeEnvStatus;
}

function loadProviderPresetIntoForm(providerId) {
  const provider = getBridgeProvider(providerId);
  const envStatus = bridgeEnvStatusForProvider(provider.id);
  if (el.profileProviderSelect) {
    el.profileProviderSelect.value = provider.id;
  }
  syncProfileProviderPreset(provider.id);
  if (el.profileNameInput) {
    el.profileNameInput.value = `${provider.label} Profile`;
  }
  if (el.profileBaseUrlInput) {
    el.profileBaseUrlInput.value = String(provider.defaultBaseUrl || "");
  }
  if (el.profileApiKeyInput) {
    el.profileApiKeyInput.value = "";
  }
  fillModelSelect(
    el.profileDefaultModelSelect,
    suggestedModelsForProvider(provider.id),
    suggestedModelsForProvider(provider.id)[0] || appState.model,
    provider.id
  );
  setProfileTestResult(`${provider.label} preset loaded into the draft.`, "ok");
  if (
    bridgeProfileNeedsRemoteAccess({ provider: provider.id, baseUrl: provider.defaultBaseUrl })
    && !(appState.settings && appState.settings.allowRemoteBridge)
  ) {
    if (envStatus && envStatus.ready && !envStatus.imported) {
      setProfileTestHint(`Turn Offline Mode off, then use Import Env Profiles for ${provider.label}.`, "warn");
    } else if (provider.requiresApiKey) {
      setProfileTestHint(
        `Turn Offline Mode off, then paste an API key for ${provider.label} or use Import Env Profiles if it already exists in your environment.`,
        "warn"
      );
    } else {
      setProfileTestHint("Turn Offline Mode off before you test or use a hosted provider.", "warn");
    }
  } else if (envStatus && envStatus.ready && !envStatus.imported) {
    setProfileTestHint(`Environment keys are ready for ${provider.label}. Use Import Env Profiles for a one-click hosted profile.`, "ok");
  } else if (provider.requiresApiKey) {
    setProfileTestHint(`Paste an API key for ${provider.label} or use Import Env Profiles if the key already exists in your environment.`, "guard");
  } else {
    setProfileTestHint(`This preset targets ${provider.label}. Test it before saving or using it.`, "guard");
  }
}

async function activateBridgeProfile(profileId, options = {}) {
  const profiles = getNormalizedProfiles(appState.settings);
  const profile = findProfileById(profiles, profileId);
  if (!profile) {
    showBanner("Select a profile first.", "bad");
    return {
      ok: false,
      reason: "missing_profile"
    };
  }
  const provider = getBridgeProvider(profile.provider);
  if (!(appState.settings && appState.settings.allowRemoteBridge) && bridgeProfileNeedsRemoteAccess(profile)) {
    if (el.profileSelect) {
      el.profileSelect.value = profile.id;
    }
    updateProfileFormFromSelected();
    if (el.allowRemoteBridgeInput && typeof el.allowRemoteBridgeInput.focus === "function") {
      el.allowRemoteBridgeInput.focus();
    }
    updateSettingsConnectionModeText();
    setProfileTestResult(`${profile.name} is ready, but Offline Mode is on.`, "warn");
    setProfileTestHint("Turn Offline Mode off in LLM Setup, apply settings, then use this profile again.", "warn");
    showBanner(`Turn Offline Mode off before using ${provider.label}.`, "bad");
    return {
      ok: false,
      reason: "remote_disabled",
      profile
    };
  }
  if (el.baseUrlInput) el.baseUrlInput.value = profile.baseUrl;
  if (el.timeoutInput) el.timeoutInput.value = String(profile.timeoutMs);
  if (el.retryInput) el.retryInput.value = String(profile.retryCount);
  appState.settings = await applySettingsPatch({
    activeProfileId: profile.id,
    ollamaBaseUrl: profile.baseUrl,
    timeoutMs: profile.timeoutMs,
    retryCount: profile.retryCount
  });
  if (profile.defaultModel && profile.defaultModel !== appState.model) {
    await setActiveModel(profile.defaultModel, { announce: false });
  } else {
    setModelOptions([]);
  }
  if (el.profileSelect) {
    el.profileSelect.value = profile.id;
  }
  updateProfileFormFromSelected();
  if (options.announce !== false) {
    showBanner(`Profile active: ${profile.name}`, "ok");
  }
  return {
    ok: true,
    profile
  };
}

function setProfileTestResult(message, tone = "guard") {
  if (!el.profileTestResultText) return;
  el.profileTestResultText.textContent = String(message || "");
  el.profileTestResultText.dataset.tone = String(tone || "guard");
}

function setProfileTestHint(message, tone = "guard") {
  if (!el.profileTestHintText) return;
  el.profileTestHintText.textContent = String(message || "");
  el.profileTestHintText.dataset.tone = String(tone || "guard");
}

function profileTestGuidance(draft, reason = "", ok = false) {
  const provider = getBridgeProvider(draft && draft.provider);
  const normalizedReason = String(reason || "").trim().toLowerCase();

  if (ok) {
    if (provider.remote) {
      return `Hosted profile is reachable. Save it, then use it whenever Offline Mode is off and you want ${provider.label}.`;
    }
    return "Local bridge is reachable. Save or use this profile to make it the active local lane.";
  }

  if (provider.requiresApiKey && !String(draft && draft.apiKey || "").trim()) {
    return `Add an API key for ${provider.label}, then test the profile again.`;
  }

  if (provider.remote && !(appState.settings && appState.settings.allowRemoteBridge)) {
    return "Turn Offline Mode off in LLM Setup before testing hosted providers.";
  }

  if (provider.id === "ollama" && /fetch failed|connection refused|timed out|offline|not detected|failed to fetch/.test(normalizedReason)) {
    return "Start Ollama locally, confirm the base URL, then run Detect Local Bridge or Test Profile again.";
  }

  if (provider.remote && /401|403|unauthorized|forbidden|api key/.test(normalizedReason)) {
    return `Check the ${provider.label} API key and make sure the selected model is allowed for that account.`;
  }

  if (provider.remote) {
    return `Check the ${provider.label} base URL, API key, selected model, and whether Offline Mode is still on, then test again.`;
  }

  return "Check the base URL, timeout, retry count, and bridge process, then test again.";
}

async function testDraftBridgeProfile() {
  if (!window.api || !window.api.bridge || typeof window.api.bridge.test !== "function") {
    throw new Error("Bridge test IPC is unavailable.");
  }
  const draft = readProfileDraftFromForm();
  setProfileTestResult(`Testing ${draft.name}...`, "ok");
  setProfileTestHint("Waiting for bridge response...", "ok");
  try {
    const result = await window.api.bridge.test(draft);
    if (result && result.ok) {
      const modelSummary = Array.isArray(result.models) && result.models.length
        ? result.models.slice(0, 3).join(", ")
        : "No models returned";
      setProfileTestResult(
        `${draft.name} responded via ${getBridgeProvider(draft.provider).label}. ${result.modelCount || 0} models detected. ${modelSummary}`,
        "good"
      );
      setProfileTestHint(profileTestGuidance(draft, "", true), "good");
      return result;
    }
    const reason = result && result.health && result.health.reason
      ? result.health.reason
      : result && result.reason
        ? result.reason
        : "Bridge test failed.";
    setProfileTestResult(`${draft.name} failed: ${reason}`, "warn");
    setProfileTestHint(profileTestGuidance(draft, reason, false), "warn");
    return result;
  } catch (err) {
    const reason = err && err.message ? err.message : String(err);
    setProfileTestResult(`${draft.name} failed: ${reason}`, "warn");
    setProfileTestHint(profileTestGuidance(draft, reason, false), "warn");
    return {
      ok: false,
      reason
    };
  }
}

function syncProfileProviderPreset(nextProviderId) {
  const provider = getBridgeProvider(nextProviderId);
  const currentBaseUrl = String((el.profileBaseUrlInput && el.profileBaseUrlInput.value) || "").trim();
  const profiles = getNormalizedProfiles(appState.settings);
  const selectedProfile = findProfileById(profiles, (el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(appState.settings, profiles));
  const previousDefaultBaseUrl = selectedProfile ? String(getBridgeProvider(selectedProfile.provider).defaultBaseUrl || "").trim() : "";
  if (el.profileBaseUrlInput && (!currentBaseUrl || currentBaseUrl === previousDefaultBaseUrl)) {
    el.profileBaseUrlInput.value = String(provider.defaultBaseUrl || "");
  }
  fillModelSelect(
    el.profileDefaultModelSelect,
    suggestedModelsForProvider(provider.id),
    (el.profileDefaultModelSelect && el.profileDefaultModelSelect.value) || suggestedModelsForProvider(provider.id)[0] || appState.model,
    provider.id
  );
  renderProviderProfileHelp(provider.id);
  setProfileTestResult("Provider changed. Test this draft before saving or using it.", "guard");
  setProfileTestHint("Switching provider changes the required setup and models. Run Test Profile before saving.", "guard");
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
    option.textContent = `${profile.name} (${getBridgeProvider(profile.provider).label} | ${profile.baseUrl})`;
    el.profileSelect.appendChild(option);
  }
  el.profileSelect.value = activeId;

  const active = findProfileById(profiles, activeId) || profiles[0];
  if (!active) return;
  if (el.profileNameInput) el.profileNameInput.value = active.name;
  if (el.profileBaseUrlInput) el.profileBaseUrlInput.value = active.baseUrl;
  populateProviderSelect(el.profileProviderSelect, active.provider);
  if (el.profileTimeoutInput) el.profileTimeoutInput.value = String(active.timeoutMs);
  if (el.profileRetryInput) el.profileRetryInput.value = String(active.retryCount);
  fillModelSelect(el.profileDefaultModelSelect, [], active.defaultModel || appState.model, active.provider);
  if (el.profileApiKeyInput) el.profileApiKeyInput.value = String(active.apiKey || "");
  renderProviderProfileHelp(active.provider);
  syncProfileTestMessaging(active);
}

function readProfileDraftFromForm() {
  const selectedId = String((el.profileSelect && el.profileSelect.value) || "").trim();
  const name = String((el.profileNameInput && el.profileNameInput.value) || "").trim() || "Local Ollama";
  const profile = normalizeProfile({
    id: selectedId || profileIdFromName(name),
    name,
    baseUrl: String((el.profileBaseUrlInput && el.profileBaseUrlInput.value) || "http://127.0.0.1:11434").trim(),
    provider: (el.profileProviderSelect && el.profileProviderSelect.value) || "ollama",
    timeoutMs: (el.profileTimeoutInput && el.profileTimeoutInput.value) || 15000,
    retryCount: (el.profileRetryInput && el.profileRetryInput.value) || 2,
    defaultModel: (el.profileDefaultModelSelect && el.profileDefaultModelSelect.value) || appState.model,
    apiKey: (el.profileApiKeyInput && el.profileApiKeyInput.value) || ""
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
  populateProviderSelect(el.profileProviderSelect, active.provider);
  if (el.profileTimeoutInput) el.profileTimeoutInput.value = String(active.timeoutMs);
  if (el.profileRetryInput) el.profileRetryInput.value = String(active.retryCount);
  fillModelSelect(el.profileDefaultModelSelect, [], active.defaultModel || appState.model, active.provider);
  if (el.profileApiKeyInput) el.profileApiKeyInput.value = String(active.apiKey || "");
  renderProviderProfileHelp(active.provider);
  syncProfileTestMessaging(active);
}

async function applySettingsPatch(patch) {
  if (!window.api || !window.api.settings) return appState.settings;
  const current = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
  const next = mergeBridgeSettingsState(current, patch);
  try {
    appState.settings = await window.api.settings.update(next);
  } catch (err) {
    console.error("Settings save failed:", err);
    showBanner(`Failed to save settings: ${err.message}`, "bad");
    return appState.settings; // Return unmodified state
  }
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
  if (el.onboardingProfileImportBtn) {
    el.onboardingProfileImportBtn.addEventListener("click", handleProfileImport);
  }
  populateOnboardingWorkflowSelect();
}

function setOnboardingOpen(open, state = "unconfigured") {
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

  // Phase 9/20: Restore to specified or unconfigured state
  appState.setupState = state;
  renderOnboardingStep();
}

async function onboardingUseOffline() {
  appState.setupState = "offline_locked";
  await applySettingsPatch({
    allowRemoteBridge: false,
    onboardingCompleted: true,
    setupDraft: null // Clear draft on completion
  });
  renderOnboardingStep();
  showBanner("Sovereign Offline Mode Sealed.", "ok");
  setOnboardingOpen(false);
}

async function prepareVerificationStep() {
  const provider = el.onboardingProviderSelect ? el.onboardingProviderSelect.value : "ollama";
  const baseUrl = el.onboardingBaseUrlInput ? el.onboardingBaseUrlInput.value : "";
  const apiKey = el.onboardingApiKeyInput ? el.onboardingApiKeyInput.value : "";

  if (el.verifyValProvider) el.verifyValProvider.textContent = provider;
  if (el.verifyValEndpoint) el.verifyValEndpoint.textContent = baseUrl || "[MISSING]";

  const requiresSecret = provider !== "ollama" && provider !== "lmstudio";
  if (el.verifyValSecret) {
    if (requiresSecret) {
      el.verifyValSecret.textContent = apiKey ? "STORED" : "MISSING";
      el.verifyValSecret.className = apiKey ? "verify-val tone-ok" : "verify-val tone-bad";
    } else {
      el.verifyValSecret.textContent = "NOT REQUIRED";
      el.verifyValSecret.className = "verify-val";
    }
  }

  if (el.verifyValTrust) {
    el.verifyValTrust.textContent = "VERIFIED";
    el.verifyValTrust.className = "verify-val tone-ok";
  }
}

async function prepareSummaryStep() {
  if (el.summaryProvider) el.summaryProvider.textContent = el.onboardingProviderSelect ? el.onboardingProviderSelect.value : "---";
  if (el.summaryModel) el.summaryModel.textContent = el.onboardingModelSelect ? el.onboardingModelSelect.value : "---";
  if (el.summaryTrust) {
    el.summaryTrust.textContent = "VERIFIED";
    el.summaryTrust.className = "verify-val tone-ok";
  }
  if (el.onboardingReconnectStartup) {
    el.onboardingReconnectStartup.checked = false; // Default to disciplied discipline
  }
}

async function onboardingNext() {
  const state = appState.setupState || "unconfigured";

  if (state === "unconfigured") {
    appState.setupState = "setup_provider";
  } else if (state === "setup_provider") {
    appState.setupState = "setup_endpoint";
  } else if (state === "setup_endpoint" || state === "endpoint_failed") {
    const ok = await onboardingTestConnection();
    if (ok) appState.setupState = "endpoint_verified";
  } else if (state === "endpoint_verified") {
    appState.setupState = "model_selection";
  } else if (state === "model_selection" || state === "models_failed") {
    appState.setupState = "ready";
  } else if (state === "ready") {
    await completeOnboarding(false);
  }

  await syncOnboardingDraft();
  renderOnboardingStep();
}

function onboardingBack() {
  const state = appState.setupState || "unconfigured";

  if (state === "setup_provider") {
    appState.setupState = "unconfigured";
  } else if (state === "setup_endpoint" || state === "endpoint_failed") {
    appState.setupState = "setup_provider";
  } else if (state === "endpoint_verified") {
    appState.setupState = "setup_endpoint";
  } else if (state === "model_selection" || state === "models_failed") {
    appState.setupState = "endpoint_verified";
  } else if (state === "ready") {
    appState.setupState = "model_selection";
  }

  syncOnboardingDraft().catch(() => { });
  renderOnboardingStep();
}

async function syncOnboardingDraft() {
  const draft = {
    state: appState.setupState,
    provider: el.onboardingProviderSelect ? el.onboardingProviderSelect.value : "ollama",
    baseUrl: el.onboardingBaseUrlInput ? el.onboardingBaseUrlInput.value.trim() : "",
    apiKey: el.onboardingApiKeyInput ? el.onboardingApiKeyInput.value.trim() : "",
    model: el.onboardingModelSelect ? el.onboardingModelSelect.value : null,
    reconnectStartup: el.onboardingReconnectStartup ? el.onboardingReconnectStartup.checked : false
  };
  appState.onboardingDraft = draft;
  await applySettingsPatch({ setupDraft: draft });
}

async function onboardingTestConnection() {
  const provider = el.onboardingProviderSelect ? el.onboardingProviderSelect.value : "ollama";
  const baseUrl = el.onboardingBaseUrlInput ? el.onboardingBaseUrlInput.value.trim() : "";
  const apiKey = el.onboardingApiKeyInput ? el.onboardingApiKeyInput.value.trim() : "";

  // Secret Gating Rule (Phase 17.4)
  const requiresSecret = provider !== "ollama" && provider !== "lmstudio";
  if (requiresSecret && !apiKey) {
    showBanner(`API key required before continuing for ${provider}.`, "bad");
    return false;
  }

  if (!baseUrl) {
    showBanner("Endpoint URL is required.", "bad");
    return false;
  }

  appState.setupState = "testing_endpoint";
  if (el.onboardingTestResult) {
    el.onboardingTestResult.textContent = "Probing endpoint...";
    el.onboardingTestResult.className = "panel-note onboarding-test-result";
  }
  renderOnboardingStep();

  try {
    const mockProfile = { provider, baseUrl, apiKey };
    const result = await window.api.bridge.test(mockProfile);

    if (result && result.ok) {
      if (el.onboardingTestResult) {
        el.onboardingTestResult.textContent = "Connection Successful!";
        el.onboardingTestResult.className = "panel-note onboarding-test-result tone-ok";
      }

      // Populate models for Step 4
      const models = result.models || [];
      if (el.onboardingModelSelect) {
        el.onboardingModelSelect.innerHTML = "";
        if (models.length === 0) {
          const opt = document.createElement("option");
          opt.textContent = "No models found on endpoint";
          opt.disabled = true;
          el.onboardingModelSelect.appendChild(opt);
          // Don't transition if no models
          appState.setupState = "models_failed";
          renderOnboardingStep();
          return false;
        } else {
          for (const m of models) {
            const opt = document.createElement("option");
            opt.value = m;
            opt.textContent = m;
            el.onboardingModelSelect.appendChild(opt);
          }
        }
      }
      return true;
    } else {
      appState.setupState = "endpoint_failed";
      if (el.onboardingTestResult) {
        el.onboardingTestResult.textContent = `Failure: ${result ? result.reason : "Unknown Provider Error"}`;
        el.onboardingTestResult.className = "panel-note onboarding-test-result tone-bad";
      }
      renderOnboardingStep();
      return false;
    }
  } catch (err) {
    appState.setupState = "endpoint_failed";
    if (el.onboardingTestResult) {
      el.onboardingTestResult.textContent = `Critical: ${err.message}`;
      el.onboardingTestResult.className = "panel-note onboarding-test-result tone-bad";
    }
    renderOnboardingStep();
    return false;
  }
}



async function completeOnboarding(skip) {
  const shouldSkip = Boolean(skip);
  const draft = appState.onboardingDraft || {};

  if (!shouldSkip && draft.provider && draft.baseUrl) {
    // Phase 17: Canonical Profile Materialization
    const profile = {
      id: `profile-${Date.now()}`,
      name: `Profile — ${new Date().toLocaleDateString()}`,
      provider: draft.provider,
      baseUrl: draft.baseUrl,
      apiKey: draft.apiKey,
      defaultModel: draft.model,
      lastSuccessTs: new Date().toISOString(),
      trustState: "VERIFIED",
      lastVerifiedFingerprint: "", // Will be calculated on first use
      timeoutMs: 15000,
      retryCount: 2
    };

    // Update profiles list
    const profiles = (appState.settings && Array.isArray(appState.settings.connectionProfiles)) ? [...appState.settings.connectionProfiles] : [];
    profiles.push(profile);

    // Save and seal
    await applySettingsPatch({
      connectionProfiles: profiles,
      activeProfileId: profile.id,
      onboardingCompleted: true,
      setupDraft: null,
      connectOnStartup: Boolean(draft.reconnectStartup)
    });

    appState.setupState = "ready";
    if (draft.model) appState.model = draft.model;
  } else {
    // Phase 31.10: Finalize state even when skipped
    await applySettingsPatch({
      onboardingCompleted: true,
      setupDraft: null
    });
    appState.setupState = "ready";
  }

  setOnboardingOpen(false);
  showBanner(shouldSkip ? "Onboarding skipped." : "Setup complete. Profile materialized.", "ok");
}

function renderOnboardingStep() {
  const state = appState.setupState || "unconfigured";

  // Phase 16: Canonical Wizard Mapping
  const isHome = state === "unconfigured";
  const isProvider = state === "setup_provider";
  const isEndpoint = state === "setup_endpoint" || state === "testing_endpoint" || state === "endpoint_failed";
  const isVerify = state === "endpoint_verified";
  const isModel = state === "model_selection" || state === "fetching_models" || state === "models_failed";
  const isSummary = state === "ready";
  const isOffline = state === "onboarding_offline" || state === "offline_locked";
  const isRepair = state === "repair_mode" || state === "profile_invalid";
  const isRecovery = state === "repair_secret";

  // Toggle step sections via IDS mapping
  const steps = [
    "onboardingStepHome", "onboardingStepProvider", "onboardingStepEndpoint",
    "onboardingStepVerify", "onboardingStepModel", "onboardingStepSummary",
    "onboardingStepOffline", "onboardingStepRepair", "onboardingRecoveryGroup"
  ];

  steps.forEach(s => {
    if (el[s]) el[s].classList.add("hidden");
  });

  if (isHome && el.onboardingStepHome) el.onboardingStepHome.classList.remove("hidden");
  if (isProvider && el.onboardingStepProvider) el.onboardingStepProvider.classList.remove("hidden");
  if (isEndpoint && el.onboardingStepEndpoint) el.onboardingStepEndpoint.classList.remove("hidden");
  if (isVerify && el.onboardingStepVerify) el.onboardingStepVerify.classList.remove("hidden");
  if (isModel && el.onboardingStepModel) el.onboardingStepModel.classList.remove("hidden");
  if (isSummary && el.onboardingStepSummary) el.onboardingStepSummary.classList.remove("hidden");
  if (isOffline && el.onboardingStepOffline) el.onboardingStepOffline.classList.remove("hidden");
  if (isRepair && el.onboardingStepRepair) el.onboardingStepRepair.classList.remove("hidden");
  if (isRecovery && el.onboardingRecoveryGroup) el.onboardingRecoveryGroup.classList.remove("hidden");

  // Suppress Header/Shell Noise
  const isSetupActive = state !== "ready" && state !== "offline_mode";

  // Navigation Logic
  if (el.onboardingBackBtn) {
    el.onboardingBackBtn.classList.toggle("hidden", isHome || isRepair || isRecovery || isOffline);
  }
  if (el.onboardingNextBtn) {
    el.onboardingNextBtn.classList.toggle("hidden", isSummary || isRepair || isRecovery || isOffline);

    // Taxonomy pass
    if (state === "setup_endpoint") el.onboardingNextBtn.textContent = "Test Connection";
    else if (state === "testing_endpoint") el.onboardingNextBtn.textContent = "Testing...";
    else if (state === "endpoint_verified") el.onboardingNextBtn.textContent = "Pick Model";
    else if (state === "model_selection") el.onboardingNextBtn.textContent = "Sealing Check";
    else el.onboardingNextBtn.textContent = "Next";
  }

  if (el.onboardingStartBtn) {
    el.onboardingStartBtn.classList.toggle("hidden", !isSummary);
  }

  if (el.onboardingSkipBtn) {
    el.onboardingSkipBtn.classList.toggle("hidden", !isHome);
  }
}

function populateOnboardingProviderSelect() {
  if (!el.onboardingProviderSelect) return;
  el.onboardingProviderSelect.innerHTML = "";
  const providers = [
    { id: "ollama", label: "Ollama (Local Node)" },
    { id: "lmstudio", label: "LM Studio (Local Bridge)" },
    { id: "openai-compatible", label: "OpenAI-Compatible (Remote)" },
    { id: "openrouter", label: "OpenRouter (Hosted)" }
  ];
  for (const p of providers) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.label;
    el.onboardingProviderSelect.appendChild(opt);
  }
}

function populateOnboardingEndpointFields() {
  const provider = el.onboardingProviderSelect ? el.onboardingProviderSelect.value : "ollama";
  if (el.onboardingBaseUrlInput) {
    el.onboardingBaseUrlInput.value = provider === "ollama" ? "http://127.0.0.1:11434" : "";
  }
  if (el.onboardingApiKeyField) {
    el.onboardingApiKeyField.classList.toggle("hidden", provider === "ollama");
  }
}

async function getTrustBadge(profile, state) {
  let drift = await checkProfileDrift(profile);
  const TS = window.api.state.TRUST_STATES;
  const auth = profile.authenticity || "UNSIGNED";

  let html = "";
  if (state === "offline_locked") {
    html = `<span class='badge-trust tone-info'>[LOCKED]</span>`;
  } else if (drift === TS.MISSING_SECRET) {
    html = `<span class='badge-trust tone-bad'>[MISSING_SECRET]</span>`;
  } else if (drift === TS.DRIFTED) {
    html = `<span class='badge-trust tone-warn'>[DRIFTED]</span>`;
  } else if (drift === TS.VERIFIED) {
    html = `<span class='badge-trust tone-good'>[VERIFIED]</span>`;
  } else if (drift === TS.NEEDS_REVIEW) {
    html = `<span class='badge-trust tone-warn'>[NEEDS_REVIEW]</span>`;
  } else {
    html = "<span class='badge-trust'>[UNVERIFIED]</span>";
  }

  // Phase 15.2: Authenticity Normalization
  if (auth === "SIGNATURE_TAMPERED") {
    html += ` <span class='badge-auth tone-bad' title='CRITICAL: Signature Mismatch detected!'>[SIGNATURE_TAMPERED]</span>`;
  } else if (auth === "UNSIGNED") {
    html += ` <span class='badge-auth' title='Legacy or Unsigned Bundle'>[UNSIGNED]</span>`;
  }

  return html;
}

async function renderSavedProfiles() {
  const profiles = (appState.settings && Array.isArray(appState.settings.connectionProfiles)) ? appState.settings.connectionProfiles : [];
  if (el.onboardingSavedProfilesSection) {
    el.onboardingSavedProfilesSection.classList.toggle("hidden", profiles.length === 0);
  }
  if (el.onboardingSavedProfilesList) {
    el.onboardingSavedProfilesList.innerHTML = "";
    for (const p of profiles) {
      const item = document.createElement("div");
      item.className = "onboarding-profile-item row";

      const info = document.createElement("div");
      info.className = "profile-info col";
      const name = document.createElement("span");
      name.className = "profile-name";
      name.textContent = p.name || "Unnamed Profile";
      const meta = document.createElement("span");
      meta.className = "profile-meta";
      const lastSeen = p.lastSuccessTs ? new Date(p.lastSuccessTs).toLocaleString() : "Never verified";

      // Phase 12.1: Trust State Badge & Drift Detection
      const trustBadge = await getTrustBadge(p, appState.setupState);
      meta.innerHTML = `${p.provider} — ${p.baseUrl} — Last verified: ${lastSeen} ${trustBadge}`;

      info.appendChild(name);
      info.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "profile-actions row";
      const resumeBtn = document.createElement("button");
      resumeBtn.className = "btn-secondary btn-small";
      resumeBtn.textContent = "Resume";
      resumeBtn.onclick = () => loadConnectionProfile(p.id);
      actions.appendChild(resumeBtn);

      const reportBtn = document.createElement("button");
      reportBtn.className = "btn-ghost btn-small";
      reportBtn.textContent = "Report";
      reportBtn.onclick = () => showTrustReport(p.id);
      actions.appendChild(reportBtn);

      const exportBtn = document.createElement("button");
      exportBtn.className = "btn-ghost btn-small";
      exportBtn.textContent = "Export";
      exportBtn.onclick = () => handleProfileExport(p.id);
      actions.appendChild(exportBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn-ghost btn-small";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => deleteConnectionProfile(p.id);
      actions.appendChild(deleteBtn);

      item.appendChild(info);
      item.appendChild(actions);
      el.onboardingSavedProfilesList.appendChild(item);
    }
  }
}

async function loadConnectionProfile(profileId) {
  const profiles = (appState.settings && Array.isArray(appState.settings.connectionProfiles)) ? appState.settings.connectionProfiles : [];
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  if (!profile.baseUrl || !profile.provider) {
    appState.setupState = "profile_invalid";
    if (el.onboardingRepairError) {
      el.onboardingRepairError.textContent = "Profile configuration is corrupted or incomplete.";
    }
    renderOnboardingStep();
    return;
  }

  appState.setupState = "profile_loaded";
  renderOnboardingStep();

  // Populate fields
  if (el.onboardingProviderSelect) el.onboardingProviderSelect.value = profile.provider || "ollama";
  if (el.onboardingBaseUrlInput) el.onboardingBaseUrlInput.value = profile.baseUrl || "";
  if (el.onboardingApiKeyInput) el.onboardingApiKeyInput.value = profile.apiKey || "";

  // Attempt verification
  if (el.onboardingTestResult) {
    el.onboardingTestResult.textContent = `Restoring profile: ${profile.name}...`;
    el.onboardingTestResult.className = "panel-note onboarding-test-result";
  }

  let drift = await checkProfileDrift(profile);
  const TS = window.api.state.TRUST_STATES;
  const isVerified = (drift === TS.VERIFIED);

  // Phase 20/25: Enact local governance overriding renderer evaluation
  if (profile.trustState === TS.VERIFIED) drift = TS.VERIFIED;

  // Phase 15.2: Authenticity Normalization
  if (profile.authenticity === "SIGNATURE_TAMPERED") {
    alert("CRITICAL: Resume Blocked. This profile bundle has a SIGNATURE_TAMPERED signature. It cannot be used for sessions until the source is verified or the profile is re-saved locally.");
    window.api.state.logProfileEvent(profile.id, "RESUME_BLOCKED", "Resume blocked due to signature tamper detection.");
    return;
  }

  // Phase 14: Secret Recovery Block
  if (drift === TS.MISSING_SECRET) {
    appState.setupState = "repair_secret";
    appState.repairProfileId = profile.id; // Track which profile is being recovered
    if (el.onboardingRepairError) {
      el.onboardingRepairError.textContent = "Secret Custody failure: Profile requires a secret that is no longer available.";
    }
    window.api.state.logProfileEvent(profile.id, "SECRET_RECOVERY_REQUIRED", "Resume blocked: Secret unavailable on this machine. Routing to recovery.");
    renderOnboardingStep();
    return;
  }

  // Phase 12.3: Tiered Resume Policy
  if (!isVerified) {
    if (drift === TS.DRIFTED) {
      if (el.onboardingTestResult) {
        el.onboardingTestResult.textContent = "Profile drift detected. Re-verifying endpoint...";
        el.onboardingTestResult.className = "panel-note onboarding-test-result tone-warn";
      }
    } else {
      if (el.onboardingTestResult) {
        el.onboardingTestResult.textContent = "Unverified profile. Initiating verification...";
        el.onboardingTestResult.className = "panel-note onboarding-test-result";
      }
    }
  }

  try {
    const result = await window.api.bridge.test(profile);
    if (result && result.ok) {
      if (!isVerified) {
        // Successful re-verification of a drifted/unverified profile
        profile.lastSuccessTs = new Date().toISOString();
        profile.lastVerifiedFingerprint = window.api.state.calculateProfileFingerprint(profile);
        await applySettingsPatch({ connectionProfiles: appState.settings.connectionProfiles });
      }

      const models = result.health && Array.isArray(result.health.models) ? result.health.models : [];
      if (profile.defaultModel && !models.includes(profile.defaultModel)) {
        // Hard-block: Default model missing
        appState.setupState = "repair_mode";
        if (el.onboardingRepairError) {
          el.onboardingRepairError.textContent = `Model Missing: ${profile.defaultModel} is no longer available on this endpoint.`;
        }

        window.api.state.addRepairTelemetry({
          profileId: profile.id,
          profileName: profile.name,
          type: "missing_model",
          reason: `Model ${profile.defaultModel} missing from endpoint.`
        });
        renderOnboardingStep();
        return;
      }

      appState.activeProfileId = profile.id;
      appState.model = profile.defaultModel || (models[0] || null);

      await applySettingsPatch({
        activeProfileId: profile.id,
        ollamaBaseUrl: profile.baseUrl,
        onboardingCompleted: true
      });

      appState.setupState = "ready";
      if (appState.model && window.api.llm) {
        await window.api.llm.setModel(appState.model);
      }

      await syncModelToLiveBridgeFallback({ announce: true });
      completeOnboarding(false);
    } else {
      appState.setupState = "repair_mode";
      const reason = result ? result.reason : "Connection Error";
      if (el.onboardingRepairError) {
        el.onboardingRepairError.textContent = `Resume failed: ${reason}`;
      }

      // Phase 12.2: Telemetry
      window.api.state.addRepairTelemetry({
        profileId: profile.id,
        profileName: profile.name,
        type: "resume_failure",
        reason: reason
      });
      renderOnboardingStep();
    }
  } catch (err) {
    appState.setupState = "repair_mode";
    const reason = err.message || "Unknown Critical Error";
    if (el.onboardingRepairError) el.onboardingRepairError.textContent = `Resume Critical: ${reason}`;

    // Phase 12.2: Telemetry
    window.api.state.addRepairTelemetry({
      profileId: profile.id,
      profileName: profile.name,
      type: "resume_critical",
      reason: reason
    });
    renderOnboardingStep();
  }
}

async function deleteConnectionProfile(profileId) {
  const profiles = (appState.settings && Array.isArray(appState.settings.connectionProfiles)) ? appState.settings.connectionProfiles : [];
  const nextProfiles = profiles.filter(p => p.id !== profileId);
  await applySettingsPatch({ connectionProfiles: nextProfiles });
  renderSavedProfiles();
}

/**
 * Phase 11.1: Background Heartbeat for Connectivity Proof
 */
let connectivityHeartbeatInterval = null;
function startConnectivityHeartbeat() {
  if (connectivityHeartbeatInterval) return;
  connectivityHeartbeatInterval = setInterval(async () => {
    if (appState.isOfflineMode || appState.setupState !== "ready") return;

    const activeProfileId = appState.settings.activeProfileId;
    const profiles = appState.settings.connectionProfiles || [];
    const profile = profiles.find(p => p.id === activeProfileId);
    if (!profile) return;

    try {
      const result = await window.api.bridge.test(profile);
      if (result && result.ok) {
        profile.lastSuccessTs = new Date().toISOString();
        await applySettingsPatch({ connectionProfiles: profiles });
        renderSavedProfiles();
      }
    } catch {
      // Background heartbeat failures are silent, we rely on resume-re-verify for explicit failures.
    }
  }, 300000); // 5 minutes
}

async function showTrustReport(profileId) {
  const settings = (appState.settings && typeof appState.settings === "object") ? appState.settings : {};
  const profiles = settings.connectionProfiles || [];
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) return;

  const events = (settings.profileTrustHistory || []).filter(e => e.profileId === profileId);
  const drift = await checkProfileDrift(profile);
  const TS = window.api.state.TRUST_STATES;

  let html = `
      <div class="trust-summary" style="padding:10px; background:var(--bg-accent); border-radius:4px; margin-bottom:15px;">
        <div class="summary-line"><strong>Name:</strong> ${esc(profile.name)}</div>
        <div class="summary-line"><strong>Status:</strong> ${await getTrustBadge(profile, "")}</div>
        <div class="summary-line"><strong>Provider:</strong> ${esc(profile.provider)}</div>
        <div class="summary-line"><strong>Endpoint:</strong> ${esc(profile.baseUrl)}</div>
        <div class="summary-line"><strong>Secret Custody:</strong> ${profile.provider === "local" ? "N/A" : (window.api.state.retrieveSecret(profileId, "apiKey") ? "PRESENT" : "MISSING")}</div>
      </div>
      <div class="timeline-title" style="font-weight:bold; color:var(--tone-accent); margin-bottom:10px;">Forensic History</div>
      <div class="timeline-list" style="max-height:300px; overflow-y:auto; border-top:1px solid var(--border-color); padding-top:10px;">
    `;

  if (events.length === 0) {
    html += "<div class='timeline-empty' style='opacity:0.6; font-style:italic;'>No forensic events recorded.</div>";
  } else {
    events.slice().reverse().forEach(e => {
      html += `
          <div class="timeline-event" style="margin-bottom:12px; font-size:0.85em; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">
            <div class="event-meta" style="opacity:0.7;">
              <span class="event-ts">${new Date(e.ts).toLocaleString()}</span>
              <span class="event-type" style="color:var(--tone-guard); margin-left:8px;">[${esc(e.type)}]</span>
            </div>
            <div class="event-summary" style="margin-top:2px;">${esc(e.summary)}</div>
          </div>
        `;
    });
  }

  html += "</div>";

  appState.activeReportProfileId = profileId; // Phase 14.3: Track for export
  if (el.trustReportContent) el.trustReportContent.innerHTML = html;
  if (el.trustReportOverlay) el.trustReportOverlay.classList.remove("hidden");
}

async function handleTrustReportExport(profileId, format) {
  if (!profileId) return;
  const report = window.api.state.getProfileTrustReport(profileId);
  if (!report) return;

  let content = "";
  let filename = `trust-report-${profileId}`;
  let type = "text/plain";

  if (format === "json") {
    content = JSON.stringify(report, null, 2);
    filename += ".json";
    type = "application/json";
  } else if (format === "md") {
    filename += ".md";
    type = "text/markdown";
    const m = report.metadata;
    content = `# NeuralShell Trust Report: ${m.name}\n\n`;
    content += `## Metadata\n`;
    content += `- **Profile UUID**: \`${m.id}\`\n`;
    content += `- **Provider**: ${m.provider}\n`;
    content += `- **Endpoint**: ${m.baseUrl}\n`;
    content += `- **Trust State**: ${m.trustState}\n`;
    content += `- **Authenticity**: ${m.authenticity}\n`;
    content += `- **Signing Method**: ${m.signingMethod}\n`;
    content += `- **Fingerprint**: \`${m.fingerprint || "None"}\`\n`;
    content += `- **Last Successful Verification**: ${m.lastSuccess || "Never"}\n`;
    content += `- **Secret Custody**: ${m.secretCustody}\n\n`;
    content += `## Forensic History (Last 200 events)\n\n`;
    content += `| Timestamp | Type | Summary |\n`;
    content += `| :--- | :--- | :--- |\n`;
    (report.forensics.history || []).forEach(h => {
      content += `| ${new Date(h.ts).toLocaleString()} | ${h.type} | ${h.summary} |\n`;
    });
    content += `\n## Repair Telemetry\n\n`;
    (report.forensics.repairLog || []).forEach(r => {
      content += `- [${new Date(r.ts).toLocaleString()}] **${r.type}**: ${r.reason}\n`;
    });
    content += `\n---\n*Generated by NeuralShell Forensic Engine V2.1.16*`;
  }

  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  window.api.state.logProfileEvent(profileId, "REPORT_EXPORTED", `Forensic trust report exported as ${format.toUpperCase()}.`);
}

async function handleSecretRecoverySubmit() {
  const secret = el.onboardingRecoverySecretInput ? el.onboardingRecoverySecretInput.value.trim() : "";
  const profileId = appState.repairProfileId;
  if (!secret || !profileId) return;

  try {
    // Store the new secret in custody
    await window.api.state.secureStoreSecret(profileId, "apiKey", secret);

    // Log the event
    window.api.state.logProfileEvent(profileId, "SECRET_REENTERED", "Operator manually re-entered secret to restore custody.");

    // Return to load flow to force fresh verification
    loadConnectionProfile(profileId);
  } catch (err) {
    console.error("Recovery failed:", err);
    alert(`Recovery Failed: ${err.message}`);
  }
}

async function handleSecretRecoveryCancel() {
  const profileId = appState.repairProfileId;
  if (profileId) {
    window.api.state.logProfileEvent(profileId, "SECRET_RECOVERY_ABORTED", "Operator aborted secret recovery flow.");
  }
  appState.setupState = "unconfigured";
  appState.repairProfileId = null;
  renderOnboardingStep();
}

async function handleSecretRecoveryClear() {
  const profileId = appState.repairProfileId;
  if (!profileId) return;

  const confirm = window.confirm("CUTION: This will clear the secret reference and downgrade the profile to metadata-only. It will be unusable until a secret is re-entered. Proceed?");
  if (!confirm) return;

  try {
    const profiles = appState.settings ? appState.settings.connectionProfiles : [];
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      profile.apiKey = ""; // Clear plaintext reference if any
      profile.trustState = window.api.state.TRUST_STATES.NEEDS_REVIEW;
      await applySettingsPatch({ connectionProfiles: profiles });

      window.api.state.logProfileEvent(profileId, "SECRET_CLEARED", "Operator cleared secret custody. Profile downgraded to NEEDS_REVIEW.");
    }
    appState.setupState = "unconfigured";
    renderSavedProfiles();
    renderOnboardingStep();
  } catch (err) {
    console.error("Clear failed:", err);
  }
}

async function handleProfileExport(profileId) {
  try {
    const bundle = window.api.bridge.exportProfileBundle(profileId);
    const blob = new Blob([bundle], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neural-profile-${profileId}.json`;
    a.click();
    URL.revokeObjectURL(url);

    window.api.state.logProfileEvent(profileId, "EXPORT_CREATED", "Profile bundle exported (metadata-only).");
  } catch (err) {
    console.error("Export failed:", err);
  }
}

async function handleProfileImport() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json";
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const profile = window.api.bridge.importProfileBundle(evt.target.result);

        // Phase 15.2: Authenticity Normalization
        if (profile.authenticity === "SIGNATURE_TAMPERED") {
          alert("CAUTION: This profile bundle has a SIGNATURE_TAMPERED signature! It may have been modified or corrupted after export. Exercise extreme caution.");
        }

        window.api.state.logProfileEvent(profile.id, "IMPORT_ACCEPTED", `Profile bundle imported (${profile.authenticity || "UNSIGNED"}).`, {
          toState: window.api.state.TRUST_STATES.DRIFTED,
          authenticity: profile.authenticity
        });
        renderSavedProfiles();
      } catch (err) {
        console.error("Import failed:", err);
        alert(`Import Failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}


async function loadInitialState() {
  if (!window.api || !window.api.state) return;
  const state = await window.api.state.get();
  appState.model = String((state && state.model) || "llama3");
  appState.chat = Array.isArray(state && state.chat) ? state.chat.slice() : (Array.isArray(state && state.chatHistory) ? state.chatHistory.slice() : []);
  appState.settings = state && typeof state.settings === "object" ? state.settings : {};

  // Phase 17: Onboarding Resume Logic
  const onboardingCompleted = appState.settings.onboardingCompleted || false;
  const setupDraft = appState.settings.setupDraft;
  if (!onboardingCompleted && setupDraft) {
    appState.setupState = setupDraft.state || "unconfigured";
    appState.onboardingDraft = setupDraft;

    // Restore UI values from draft
    if (el.onboardingProviderSelect) el.onboardingProviderSelect.value = setupDraft.provider || "ollama";
    if (el.onboardingBaseUrlInput) el.onboardingBaseUrlInput.value = setupDraft.baseUrl || "";
    if (el.onboardingApiKeyInput) el.onboardingApiKeyInput.value = setupDraft.apiKey || "";
    if (el.onboardingModelSelect) {
      if (setupDraft.model) {
        const opt = document.createElement("option");
        opt.value = setupDraft.model;
        opt.textContent = setupDraft.model;
        el.onboardingModelSelect.appendChild(opt);
        el.onboardingModelSelect.value = setupDraft.model;
      }
    }
    if (el.onboardingReconnectStartup) el.onboardingReconnectStartup.checked = Boolean(setupDraft.reconnectStartup);
  } else {
    appState.setupState = onboardingCompleted ? "ready" : "unconfigured";
  }

  appState.workflowId = normalizeWorkflowId(state && state.workflowId);
  appState.outputMode = normalizeOutputMode(state && state.outputMode, appState.workflowId);
  appState.commandPaletteShortcutScope = normalizeCommandPaletteShortcutScope(state && state.commandPaletteShortcutScope);
  appState.workspaceAttachment = state && state.workspaceAttachment && typeof state.workspaceAttachment === "object"
    ? state.workspaceAttachment
    : null;
  try {
    appState.contextPack = state && state.contextPack && typeof state.contextPack === "object"
      ? normalizeContextPackValue(state.contextPack)
      : null;
  } catch {
    appState.contextPack = null;
  }
  appState.contextPackProfiles = normalizeContextPackProfiles(state && state.contextPackProfiles);
  appState.activeContextPackProfileId = String((state && state.activeContextPackProfileId) || "").trim();
  try {
    appState.verificationRunPlan = state && state.verificationRunPlan && typeof state.verificationRunPlan === "object"
      ? normalizeVerificationRunPlanValue(state.verificationRunPlan, { workflowId: appState.workflowId })
      : null;
  } catch {
    appState.verificationRunPlan = null;
  }
  appState.verificationRunHistory = normalizeVerificationRunHistory(state && state.verificationRunHistory);
  appState.promotedPaletteActions = normalizePromotedPaletteActions(state && state.promotedPaletteActions);
  appState.lastArtifact = state && state.lastArtifact && typeof state.lastArtifact === "object"
    ? normalizeArtifactValue(state.lastArtifact, {
      workflowId: appState.workflowId,
      outputMode: appState.outputMode
    })
    : null;
  appState.shippingPacketHistory = normalizeShippingPacketHistory(state && state.shippingPacketHistory);
  if (!appState.shippingPacketHistory.length && hasShippingPacketArtifact()) {
    appState.shippingPacketHistory = [normalizeArtifactValue(appState.lastArtifact, {
      forceOutputMode: "shipping_packet",
      title: "Shipping Packet"
    })];
  }
  try {
    appState.patchPlan = state && state.patchPlan && typeof state.patchPlan === "object"
      ? normalizePatchPlanValue(state.patchPlan, { workflowId: appState.workflowId })
      : null;
    syncPatchPlanSelections();
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
      syncPatchPlanSelections();
      appState.patchPlanGroupOpenIds = null;
    } catch {
      appState.patchPlan = null;
      appState.patchPlanGroupOpenIds = null;
    }
  }
}

initEventListeners();

function initEventListeners() {
  if (el.promptInput) {
    el.promptInput.addEventListener("input", updatePromptMetrics);
    el.promptInput.addEventListener("input", updateCommandHint);
    el.promptInput.addEventListener("input", () => {
      rememberPromptDraft(el.promptInput.value, { render: true });
    });
    el.promptInput.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && String(event.key || "").toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        sendPrompt().catch(() => { });
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendPrompt().catch(() => { });
      }
    });
  }
  if (el.sessionName) {
    el.sessionName.addEventListener("input", () => {
      updateDashboardSummary();
      renderIntelSurface();
    });
  }
  if (el.sessionPass) {
    el.sessionPass.addEventListener("input", () => {
      renderChatThreadRail();
    });
  }
  if (el.inboxFilterAllBtn) {
    el.inboxFilterAllBtn.onclick = () => {
      setInboxFilter("all");
    };
  }
  if (el.inboxFilterPinnedBtn) {
    el.inboxFilterPinnedBtn.onclick = () => {
      setInboxFilter("pinned");
    };
  }
  if (el.inboxFilterUnreadBtn) {
    el.inboxFilterUnreadBtn.onclick = () => {
      setInboxFilter("unread");
    };
  }
  if (el.inboxSearchInput) {
    el.inboxSearchInput.oninput = () => {
      setInboxSearchQuery(el.inboxSearchInput.value);
    };
  }
  if (el.autoScrollInput) {
    el.autoScrollInput.addEventListener("change", () => {
      persistOperatorLayoutPreferences();
    });
  }
  if (el.restoreDraftBtn) {
    el.restoreDraftBtn.onclick = () => {
      restoreSavedDraft({ focus: true });
    };
  }
  if (el.clearDraftBtn) {
    el.clearDraftBtn.onclick = () => {
      clearSavedDraft({ focus: true });
    };
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
  if (el.systemWorkbenchBtn) {
    el.systemWorkbenchBtn.onclick = () => {
      setSystemSurface("workbench", { focus: true });
    };
  }
  if (el.systemPerformanceBtn) {
    el.systemPerformanceBtn.onclick = () => {
      setSystemSurface("performance", { focus: true });
    };
  }
  if (el.systemShippingBtn) {
    el.systemShippingBtn.onclick = () => {
      setSystemSurface("shipping", { focus: true });
    };
  }
  if (el.systemContextBtn) {
    el.systemContextBtn.onclick = () => {
      setSystemSurface("context", { focus: true });
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
  if (el.clearVerificationRunHistoryBtn) {
    el.clearVerificationRunHistoryBtn.onclick = () => {
      clearVerificationRunHistory();
    };
  }
  if (el.verificationRunHistoryWorkflowFilter) {
    el.verificationRunHistoryWorkflowFilter.onchange = () => {
      setVerificationRunHistoryFilter("workflow", el.verificationRunHistoryWorkflowFilter.value);
    };
  }
  if (el.verificationRunHistoryGroupFilter) {
    el.verificationRunHistoryGroupFilter.onchange = () => {
      setVerificationRunHistoryFilter("group", el.verificationRunHistoryGroupFilter.value);
    };
  }
  if (el.verificationRunHistoryWorkspaceFilter) {
    el.verificationRunHistoryWorkspaceFilter.onchange = () => {
      setVerificationRunHistoryFilter("workspace", el.verificationRunHistoryWorkspaceFilter.value);
    };
  }
  if (el.resetVerificationRunHistoryFiltersBtn) {
    el.resetVerificationRunHistoryFiltersBtn.onclick = () => {
      resetVerificationRunHistoryFilters();
    };
  }
  if (el.stageShippingCockpitBtn) {
    el.stageShippingCockpitBtn.onclick = () => {
      try {
        stageShippingCockpit();
      } catch (err) {
        showBanner(err.message || String(err), "bad");
      }
    };
  }
  if (el.runShippingCockpitBtn) {
    el.runShippingCockpitBtn.onclick = () => {
      runShippingCockpitChecks().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.buildShippingPacketBtn) {
    el.buildShippingPacketBtn.onclick = () => {
      buildShippingPacketArtifact().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.exportShippingEvidenceBtn) {
    el.exportShippingEvidenceBtn.onclick = () => {
      exportEvidenceBundle().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.openShippingPaletteBtn) {
    el.openShippingPaletteBtn.onclick = () => {
      openShippingPalette();
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

  if (el.onboardingStartBtn) {
    el.onboardingStartBtn.onclick = () => {
      completeOnboarding(false).catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.onboardingSkipBtn) {
    el.onboardingSkipBtn.onclick = () => {
      completeOnboarding(true).catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.onboardingNextBtn) {
    el.onboardingNextBtn.onclick = () => {
      onboardingNext().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.onboardingBackBtn) {
    el.onboardingBackBtn.onclick = () => {
      onboardingBack();
    };
  }
  if (el.onboardingConfigLocalBtn) {
    el.onboardingConfigLocalBtn.onclick = () => {
      if (el.onboardingProviderSelect) el.onboardingProviderSelect.value = "ollama";
      appState.setupState = "endpoint_pending_test";
      renderOnboardingStep();
    };
  }
  if (el.onboardingConfigRemoteBtn) {
    el.onboardingConfigRemoteBtn.onclick = () => {
      appState.setupState = "provider_selected";
      renderOnboardingStep();
    };
  }
  if (el.onboardingUseOfflineBtn1) {
    el.onboardingUseOfflineBtn1.onclick = () => {
      onboardingUseOffline().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.onboardingUseOfflineBtn2) {
    el.onboardingUseOfflineBtn2.onclick = () => {
      onboardingUseOffline().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.onboardingUseOfflineBtn3) {
    el.onboardingUseOfflineBtn3.onclick = () => {
      onboardingUseOffline().catch((err) => showBanner(err.message || String(err), "bad"));
    };
  }
  if (el.onboardingRepairEndpointBtn) {
    el.onboardingRepairEndpointBtn.onclick = () => {
      appState.setupState = "endpoint_pending_test";
      renderOnboardingStep();
    };
  }
  if (el.onboardingRepairOfflineBtn) {
    el.onboardingRepairOfflineBtn.onclick = () => {
      onboardingUseOffline();
    };
  }
  if (el.onboardingRepairAbortBtn) {
    el.onboardingRepairAbortBtn.onclick = () => {
      appState.setupState = "unconfigured";
      renderOnboardingStep();
    };
  }

  if (el.onboardingProviderSelect) {
    el.onboardingProviderSelect.onchange = () => {
      populateOnboardingEndpointFields();
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

  window.addEventListener("resize", () => {
    if (paneResizeSession) {
      endWorkspacePaneResize();
    }
    applyWorkspaceLayout();
    renderGlobalControlBar();
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

  // Phase 20: Governed Runtime Entry — replaces raw Cold Boot Suppression
  // bootstrapGovernance().catch(err => console.error("[Governance] Bootstrap error:", err));
}

// ═══════════════════════════════════════════════════════
// Phase 20: Runtime Governance Layer
// ═══════════════════════════════════════════════════════

async function bootstrapGovernance() {
  const intent = await window.runtimeResumeGovernance(appState, window.api.state);
  if (intent.action === "skip_onboarding_not_done") return;

  if (intent.action === "render_bar" || intent.action === "apply_policy") {
    renderActiveProfileBar(intent.profileToRender, intent.trustState);
  }

  if (intent.banner) {
    showBanner(intent.banner.msg, intent.banner.type);
  }

  if (intent.logEvent) {
    window.api.state.logProfileEvent(intent.logEvent.id, intent.logEvent.type, intent.logEvent.msg);
  }

  if (intent.runAutoDetect) {
    runBridgeAutoDetect().catch(() => { });
  }
}

function renderActiveProfileBar(profile, trustState) {
  if (!el.activeProfileBar) return;
  const state = window.generateActiveProfileBarState(profile, trustState, appState);

  if (state.isHidden) {
    el.activeProfileBar.classList.add("hidden");
    return;
  }

  el.activeProfileBar.classList.remove("hidden");
  el.activeProfileBar.classList.remove("apb-blocked", "apb-offline");

  if (el.apbProfileName) el.apbProfileName.textContent = state.nameText;
  if (el.apbProvider) el.apbProvider.textContent = state.providerText;
  if (el.apbModel) el.apbModel.textContent = state.modelText;

  if (el.apbTrustBadge) {
    el.apbTrustBadge.textContent = state.badgeText;
    el.apbTrustBadge.className = state.badgeClass;
  }

  if (el.apbReconnectPolicy) el.apbReconnectPolicy.textContent = state.reconnectText;
  if (el.apbLastVerified) el.apbLastVerified.textContent = state.verifiedText;

  if (state.isBlocked) el.activeProfileBar.classList.add("apb-blocked");
  if (state.isOffline) el.activeProfileBar.classList.add("apb-offline");
}

async function uiSwitchActiveProfile(profileId) {
  const intent = await window.evaluateProfileSwitch(profileId, appState, window.api.state);

  if (intent.error) {
    showBanner(intent.error, "bad");
    return;
  }

  if (intent.success) {
    await applySettingsPatch(intent.patchIntent);
    renderActiveProfileBar(intent.profileToRender, intent.trustState);
  }

  if (intent.banner) {
    showBanner(intent.banner.msg, intent.banner.type);
  }

  if (intent.runAutoDetect) {
    runBridgeAutoDetect().catch(() => { });
  }
}

// Phase 20: APB Button Handlers
if (el.apbVerifyBtn) el.apbVerifyBtn.onclick = () => {
  const profile = getActiveProfile();
  if (profile) {
    window.api.state.logProfileEvent(profile.id, "verification_requested", "Manual re-verification initiated from profile bar.");
    runBridgeAutoDetect().catch((err) => showBanner(err.message || String(err), "bad"));
  }
};
if (el.apbRepairBtn) el.apbRepairBtn.onclick = () => {
  const profile = getActiveProfile();
  if (profile) {
    const trustState = resolveProfileTrustState(profile);
    window.api.state.logProfileEvent(profile.id, "repair_mode_entered", `Repair entered from profile bar. Trust: ${trustState}.`);
    if (trustState === "MISSING_SECRET") {
      appState.setupState = "repair_secret";
      appState.repairProfileId = profile.id;
    } else {
      appState.setupState = "repair_mode";
      appState.repairProfileId = profile.id;
    }
    renderOnboardingStep();
  }
};
// Phase 21: Real APB Button Handlers

if (el.apbSwitchBtn) el.apbSwitchBtn.onclick = () => {
  openProfileSwitchPanel();
};
if (el.apbOfflineBtn) el.apbOfflineBtn.onclick = () => {
  uiPerformOfflineEntry();
};
if (el.apbDisconnectBtn) el.apbDisconnectBtn.onclick = () => {
  uiPerformDisconnect();
};

// Phase 21: Profile Switch Panel
function openProfileSwitchPanel() {
  if (!el.profileSwitchOverlay || !el.profileSwitchList) return;

  const result = window.buildProfileSwitchList(appState, window.api.state);
  if (result.error) {
    showBanner(result.error, "bad");
    return;
  }

  el.profileSwitchList.innerHTML = "";
  for (const profile of result.profiles) {
    const item = document.createElement("div");
    item.className = "psp-item" + (profile.isActive ? " psp-item-active" : "");

    const info = document.createElement("div");
    info.className = "psp-item-info";

    const name = document.createElement("span");
    name.className = "psp-item-name";
    name.textContent = profile.name + (profile.isActive ? " (active)" : "");

    const meta = document.createElement("span");
    meta.className = "psp-item-meta";
    meta.textContent = `${profile.provider} · ${profile.trustState}`;

    info.appendChild(name);
    info.appendChild(meta);
    item.appendChild(info);

    if (!profile.isActive) {
      if (profile.isBlocked) {
        const warn = document.createElement("span");
        warn.className = "psp-item-meta";
        warn.textContent = "BLOCKED";
        warn.style.color = "var(--bad)";
        item.appendChild(warn);

        item.onclick = () => {
          showBanner(`Cannot switch to ${profile.name}: ${profile.trustState}.`, "bad");
        };
      } else {
        item.onclick = () => {
          uiSwitchActiveProfile(profile.id).then(() => {
            closeProfileSwitchPanel();
          }).catch(() => { });
        };
      }
    }

    el.profileSwitchList.appendChild(item);
  }

  el.profileSwitchOverlay.classList.remove("hidden");
}

function closeProfileSwitchPanel() {
  if (el.profileSwitchOverlay) el.profileSwitchOverlay.classList.add("hidden");
}

if (el.profileSwitchCloseBtn) el.profileSwitchCloseBtn.onclick = closeProfileSwitchPanel;
if (el.profileSwitchOverlay) el.profileSwitchOverlay.onclick = (e) => {
  if (e.target === el.profileSwitchOverlay) closeProfileSwitchPanel();
};

// Phase 21: Real Disconnect Flow
function uiPerformDisconnect() {
  const result = window.performDisconnect(appState, window.api.state);

  if (el.globalBridgeStatusText) {
    el.globalBridgeStatusText.textContent = result.statusText;
    el.globalBridgeStatusText.className = result.statusClass;
  }

  if (result.profileToRender) {
    renderActiveProfileBar(result.profileToRender, result.trustState);
  }

  showBanner(result.bannerMessage, result.bannerType);
}

// Phase 21: Hardened Offline Entry
function uiPerformOfflineEntry() {
  const profilesRaw = appState.settings && appState.settings.connectionProfiles;
  const result = window.performOfflineEntry(appState, profilesRaw, window.api.state);

  if (el.globalBridgeStatusText) {
    el.globalBridgeStatusText.textContent = result.statusText;
    el.globalBridgeStatusText.className = result.statusClass;
  }

  if (result.settingsPatch) {
    applySettingsPatch(result.settingsPatch);
  }

  if (result.profileToRender) {
    renderActiveProfileBar(result.profileToRender, result.trustState);
  }

  if (result.setOfflineCheckbox && el.offlineModeInput) {
    el.offlineModeInput.checked = true;
  }

  showBanner(result.bannerMessage, result.bannerType);
}

if (el.toggleRightPaneBtn) el.toggleRightPaneBtn.onclick = () => {
  toggleRightPaneCollapsed();
};
if (el.resetPaneLayoutBtn) el.resetPaneLayoutBtn.onclick = () => {
  resetWorkspacePaneLayout();
};
if (el.focusInboxBtn) el.focusInboxBtn.onclick = () => {
  focusSurface(".workspace-left-column");
};
if (el.focusInspectorBtn) el.focusInspectorBtn.onclick = () => {
  if (appState.rightPaneCollapsed) {
    setRightPaneCollapsed(false, { focus: true });
    return;
  }
  focusSurface(".workspace-right-column");
};
if (el.inboxFilterAllBtn) {
  el.inboxFilterAllBtn.onclick = () => {
    setInboxFilter("all");
  };
}
if (el.inboxFilterPinnedBtn) {
  el.inboxFilterPinnedBtn.onclick = () => {
    setInboxFilter("pinned");
  };
}
if (el.inboxFilterUnreadBtn) {
  el.inboxFilterUnreadBtn.onclick = () => {
    setInboxFilter("unread");
  };
}
if (el.inboxSearchInput) {
  el.inboxSearchInput.oninput = () => {
    setInboxSearchQuery(el.inboxSearchInput.value);
  };
}
if (el.systemWorkbenchBtn) {
  el.systemWorkbenchBtn.onclick = () => {
    setSystemSurface("workbench", { focus: true });
  };
}
if (el.systemPerformanceBtn) {
  el.systemPerformanceBtn.onclick = () => {
    setSystemSurface("performance", { focus: true });
  };
}
if (el.systemShippingBtn) {
  el.systemShippingBtn.onclick = () => {
    setSystemSurface("shipping", { focus: true });
  };
};
if (el.leftPaneResizeHandle) {
  el.leftPaneResizeHandle.onpointerdown = (event) => {
    beginWorkspacePaneResize("left", event);
  };
  el.leftPaneResizeHandle.onmousedown = (event) => {
    beginWorkspacePaneResize("left", event);
  };
  el.leftPaneResizeHandle.onkeydown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeWorkspacePane("left", -16);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeWorkspacePane("left", 16);
    }
  };
}
if (el.rightPaneResizeHandle) {
  el.rightPaneResizeHandle.onpointerdown = (event) => {
    beginWorkspacePaneResize("right", event);
  };
  el.rightPaneResizeHandle.onmousedown = (event) => {
    beginWorkspacePaneResize("right", event);
  };
  el.rightPaneResizeHandle.onkeydown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      nudgeWorkspacePane("right", 16);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      nudgeWorkspacePane("right", -16);
    }
  };
}
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
if (el.workbenchArtifactBtn) {
  el.workbenchArtifactBtn.onclick = () => {
    setWorkbenchSurface("artifact");
  };
}
if (el.workbenchPatchBtn) {
  el.workbenchPatchBtn.onclick = () => {
    setWorkbenchSurface("patch");
  };
}
if (el.workbenchApplyBtn) {
  el.workbenchApplyBtn.onclick = () => {
    setWorkbenchSurface("apply");
  };
}
if (el.performanceDiagnosticsTrayBtn) {
  el.performanceDiagnosticsTrayBtn.onclick = () => {
    setPerformanceTray("diagnostics", { toggle: true });
  };
}
if (el.performanceTraceTrayBtn) {
  el.performanceTraceTrayBtn.onclick = () => {
    setPerformanceTray("trace", { toggle: true });
  };
}
if (el.performanceOutputTrayBtn) {
  el.performanceOutputTrayBtn.onclick = () => {
    setPerformanceTray("outputs", { toggle: true });
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
if (el.performanceAuditOutputBtn) {
  el.performanceAuditOutputBtn.onclick = () => {
    setPerformanceTray("outputs");
    setRuntimeOutputView("audit");
  };
}
if (el.performanceLogsOutputBtn) {
  el.performanceLogsOutputBtn.onclick = () => {
    setPerformanceTray("outputs");
    setRuntimeOutputView("logs");
  };
}
if (el.performanceChatLogsOutputBtn) {
  el.performanceChatLogsOutputBtn.onclick = () => {
    setPerformanceTray("outputs");
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
if (el.retryBtn) el.retryBtn.onclick = () => sendPromptFromText(appState.lastPrompt).catch(() => { });
if (el.editLastBtn) el.editLastBtn.onclick = () => {
  for (let i = appState.chat.length - 1; i >= 0; i -= 1) {
    if (appState.chat[i] && appState.chat[i].role === "user") {
      setPromptEditorValue(String(appState.chat[i].content || ""), { focus: true });
      return;
    }
  }
};
if (el.newChatBtn) el.newChatBtn.onclick = async () => {
  appState.activeSessionName = "";
  appState.lastArtifact = null;
  resetPatchPlanState();
  resetWorkspaceActions();
  setWorkbenchSurface("artifact", { persist: false, scroll: false });
  renderChat([]);
  await persistChatState();
  if (window.api && window.api.invoke) {
    window.api.invoke("telemetry:log", "ui_action", "chat_clear", { source: "button" }).catch(() => { });
  }
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
  setPromptEditorValue(`${existing}${separator}${snippet.text}`, { focus: true });
  showBanner(`Snippet inserted: ${snippet.label}`, "ok");
};
if (el.chatSearchBtn) el.chatSearchBtn.onclick = () => { appState.chatFilter = String((el.chatSearchInput && el.chatSearchInput.value) || ""); renderChat(appState.chat); };
if (el.chatSearchClearBtn) el.chatSearchClearBtn.onclick = () => { appState.chatFilter = ""; if (el.chatSearchInput) el.chatSearchInput.value = ""; renderChat(appState.chat); };
if (el.modelSelect) el.modelSelect.onchange = () => {
  setActiveModel(String(el.modelSelect.value || appState.model)).catch((err) => showBanner(err.message || String(err), "bad"));
};
if (el.refreshModelsBtn) el.refreshModelsBtn.onclick = () => refreshModels().catch((err) => showBanner(err.message || String(err), "bad"));
bindBridgeSettingsEvents();
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
    contextPack: appState.contextPack,
    contextPackProfiles: appState.contextPackProfiles,
    activeContextPackProfileId: appState.activeContextPackProfileId,
    lastArtifact: appState.lastArtifact,
    shippingPacketHistory: appState.shippingPacketHistory,
    patchPlan: appState.patchPlan,
    promotedPaletteActions: appState.promotedPaletteActions,
    commandPaletteShortcutScope: appState.commandPaletteShortcutScope,
    verificationRunPlan: appState.verificationRunPlan,
    verificationRunHistory: appState.verificationRunHistory,
    settings: appState.settings,
    updatedAt: new Date().toISOString()
  }, pass);
  appState.activeSessionName = name;
  await refreshSessions();
  markSessionAsRead(name, sessionUpdatedAtValue(appState.sessionsMeta[name] || {}), {
    persist: false,
    render: false
  });
  showBanner(`Session saved: ${name}`, "ok");
};
if (el.loadSessionBtn) el.loadSessionBtn.onclick = async () => {
  await loadSessionTarget();
};
if (el.renameSessionBtn) el.renameSessionBtn.onclick = async () => {
  const from = String((el.sessionName && el.sessionName.value) || "").trim();
  const to = window.prompt("New session name:");
  if (!from || !to) return;
  await window.api.session.rename(from, String(to).trim());
  if (appState.activeSessionName === from) {
    appState.activeSessionName = String(to).trim();
  }
  if (el.sessionName) el.sessionName.value = String(to).trim();
  await refreshSessions();
};
if (el.deleteSessionBtn) el.deleteSessionBtn.onclick = async () => {
  const name = String((el.sessionName && el.sessionName.value) || "").trim();
  if (!name) return;
  await window.api.session.delete(name);
  if (appState.activeSessionName === name) {
    appState.activeSessionName = "";
  }
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
  el.sessionSortSelect.onchange = () => refreshSessions().catch(() => { });
}
if (el.attachWorkspaceBtn) {
  el.attachWorkspaceBtn.onclick = () => {
    attachWorkspaceFromDialog().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.buildContextPackBtn) {
  el.buildContextPackBtn.onclick = () => {
    buildContextPackFromInputs().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.suggestContextPackFilesBtn) {
  el.suggestContextPackFilesBtn.onclick = () => {
    suggestContextPackFiles().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.contextPackProfileSelect) {
  el.contextPackProfileSelect.onchange = () => {
    appState.activeContextPackProfileId = String(el.contextPackProfileSelect.value || "").trim();
    syncSelectedContextPackProfileStatus();
    renderContextPackSurface({ seedDefaults: true });
    refreshRelevantContextPackProfileStatuses({ workflowId: appState.workflowId }).catch(() => { });
    persistChatState().catch(() => { });
  };
}
if (el.saveContextPackProfileBtn) {
  el.saveContextPackProfileBtn.onclick = () => {
    saveCurrentContextPackProfile().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.loadContextPackProfileBtn) {
  el.loadContextPackProfileBtn.onclick = () => {
    loadContextPackProfile().catch((err) => showBanner(err.message || String(err), "bad"));
  };
};
if (el.loadRecommendedContextPackProfileBtn) {
  el.loadRecommendedContextPackProfileBtn.onclick = () => {
    loadRecommendedContextPackProfile().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.refreshContextPackProfileBtn) {
  el.refreshContextPackProfileBtn.onclick = () => {
    refreshContextPackProfile().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.deleteContextPackProfileBtn) {
  el.deleteContextPackProfileBtn.onclick = () => {
    deleteContextPackProfile().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.clearContextPackBtn) {
  el.clearContextPackBtn.onclick = () => {
    clearContextPack().catch((err) => showBanner(err.message || String(err), "bad"));
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
    clearShippingPacketHistory().catch((err) => showBanner(err.message || String(err), "bad"));
  };
}
if (el.clearArtifactCompareBtn) {
  el.clearArtifactCompareBtn.onclick = () => {
    clearShippingPacketCompareSelection();
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
    setPromptEditorValue("/help", { focus: true });
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
if (el.onboardingNextBtn) el.onboardingNextBtn.onclick = () => {
  onboardingNext().catch((err) => showBanner(err.message || String(err), "bad"));
};
if (el.onboardingBackBtn) el.onboardingBackBtn.onclick = () => {
  onboardingBack();
};
if (el.criticalStopBtn) {
  el.criticalStopBtn.onclick = async () => {
    await abortExecution();
  };
}

async function abortExecution() {
  if (!window.api || !window.api.action || !window.api.action.cancelAction) return;
  const ok = await window.api.action.cancelAction();
  if (ok) {
    showBanner("Execution Force Stopped.", "bad");
    if (el.criticalStopBtn) el.criticalStopBtn.classList.add("hidden");
  } else {
    showBanner("Failed to stop execution.", "bad");
  }
}

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
  setPerformanceTray("outputs");
  setRuntimeOutputView("logs");
};
if (el.runButtonAuditBtn) el.runButtonAuditBtn.onclick = () => {
  const missing = IDS.filter((id) => !el[id]);
  if (el.buttonAuditOutput) el.buttonAuditOutput.textContent = JSON.stringify({ total: IDS.length, missing }, null, 2);
  setPerformanceTray("outputs");
  setRuntimeOutputView("audit");
};

if (el.loadLogsBtn) el.loadLogsBtn.onclick = async () => {
  const rows = await window.api.logger.tail(300);
  if (el.logsOutput) el.logsOutput.textContent = (rows || []).map((r) => `${r.ts} [${r.level}] ${r.message} ${JSON.stringify(r.meta)}`).join("\n");
  setPerformanceTray("outputs");
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
  setPerformanceTray("outputs");
  setRuntimeOutputView("chat");
};
if (el.clearChatLogsBtn) el.clearChatLogsBtn.onclick = async () => {
  await window.api.chatlog.clear();
  if (el.loadChatLogsBtn) el.loadChatLogsBtn.onclick();
};
if (el.exportChatLogsBtn) el.exportChatLogsBtn.onclick = async () => {
  download("neuralshell-chatlogs.txt", await window.api.chatlog.export());
};

// --- Phase 17C: Starter Action Handlers ---
document.querySelectorAll(".starter-action-card").forEach(card => {
  card.addEventListener("click", () => {
    const action = card.dataset.action;
    if (action === "audit") {
      if (el.promptInput) {
        el.promptInput.value = "/autodetect";
        sendPrompt().catch(() => { });
      }
    } else if (action === "scan") {
      showBanner("Opening Workbench for local extraction...", "ok");
      setSystemSurface("workbench", { focus: true });
    } else if (action === "tunnel") {
      showBanner("Initializing secure bridge tunnel...", "ok");
      if (window.api && window.api.invoke) {
        window.api.invoke("bridge:reconnect").catch(() => { });
      }
    }
  });
});

// --- Phase 18: QOL Operator Enhancements ---
if (el.discordSupportBtn) {
  el.discordSupportBtn.onclick = () => {
    showBanner("Opening NeuralShell Operator Discord...", "ok");
    // Fallback if electron openExternal isn't bound globally
    if (window.api && window.api.invoke) {
      window.api.invoke("telemetry:log", "ui_action", "open_discord", {}).catch(() => { });
    }
  };
}

if (el.tierBadge) {
  el.tierBadge.onclick = async () => {
    if (el.tierBadge.textContent === "OPERATOR NODE") {
      showBanner("Operator license already active.", "ok");
      return;
    }
    const key = window.prompt("Enter NeuralShell Operator License (ns_op_...):");
    if (!key) return;
    if (key.trim().startsWith("ns_op_") || key.trim() === "founder" || key.trim() === "test") {
      appState.settings.tier = "OPERATOR";
      await window.api.settings.update({ tier: "OPERATOR" });
      updateTierUI();
      showBanner("License accepted. Welcome, Operator.", "ok");
      if (window.api && window.api.invoke) {
        window.api.invoke("telemetry:log", "ui_action", "license_unlock", { tier: "operator" }).catch(() => { });
      }
    } else {
      showBanner("Invalid license format.", "bad");
    }
  };
}

function updateTierUI() {
  if (!el.tierBadge) return;
  const isOperator = (appState.settings && appState.settings.tier === "OPERATOR");
  el.tierBadge.textContent = isOperator ? "OPERATOR NODE" : "PREVIEW NODE";
  if (isOperator) {
    el.tierBadge.style.color = "var(--ns-amber)";
    el.tierBadge.style.borderColor = "var(--ns-amber)";
    el.tierBadge.style.cursor = "default";
  } else {
    el.tierBadge.style.color = "";
    el.tierBadge.style.borderColor = "";
    el.tierBadge.style.cursor = "pointer";
  }
}

window.appState = appState;

async function bootstrap() {
  initializePromptSnippets();
  await loadInitialState();
  updateTierUI();
  restoreOperatorExperience();
  syncSettingsInputsFromState();
  applyLlmStatus(appState.settings.connectOnStartup !== false ? "booting" : "bridge_offline");
  await Promise.all([refreshModels(), refreshSessions(), refreshCommands()]);
  renderWorkflowSummary();
  renderWorkspaceAttachment();
  renderPatchPlanPanel();
  renderArtifactPanel();
  renderWorkspaceActionDeck();
  renderWorkbenchNavigation();
  renderChatOpsTrays();
  renderSessionsTrays();
  renderCommandsTray();
  renderPerformanceTrays();
  renderIntelSurface();
  renderOperatorMemorySurface();
  populateOnboardingModelSelect();

  if (!appState.settings.onboardingCompleted) {
    setOnboardingOpen(true);
  } else {
    // Phase 20: Governed Runtime Entry
    const intent = await window.runtimeResumeGovernance(appState, window.api.state);
    if (intent.setupState) {
      setOnboardingOpen(true, intent.setupState);
    }
    if (intent.profileToRender) {
      renderActiveProfileBar(intent.profileToRender, intent.trustState);
    }
    if (intent.banner) {
      showBanner(intent.banner.msg, intent.banner.type);
    }
    if (intent.runAutoDetect) {
      runBridgeAutoDetect().catch(() => { });
    }
  }

  // Periodic refreshes
  setInterval(() => {
    refreshSessions().catch(() => { });
  }, 5000);
  if (appState.clockTimer) clearInterval(appState.clockTimer);
  appState.clockTimer = setInterval(() => {
    if (el.clockTime) {
      const now = new Date();
      if (appState.settings && typeof appState.settings.clockUtcOffset === "number") {
        now.setMinutes(now.getMinutes() + (appState.settings.clockUtcOffset * 60));
      }
      el.clockTime.textContent = now.toISOString().replace("T", " ").slice(0, 19);
    }
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
  buildContextPackFromInputs,
  buildWorkspaceActionRequest,
  clearContextPack,
  deleteContextPackProfile,
  clearShippingPacketCompareSelection,
  clearShippingPacketHistory,
  clearVerificationRunHistory,
  clearVerificationRunPlan,
  clearWorkspaceActionPreview,
  exportEvidenceBundle,
  exportPatchPlanJson,
  exportPatchPlanMarkdown,
  getEvidenceBundleFilename,
  loadPatchPlanFromArtifact,
  loadShippingPacketHistoryEntry,
  loadVerificationRunHistoryEntry,
  previewPatchPlanFiles,
  previewWorkspaceActionProposal,
  previewWorkspaceEditDraft,
  promotePatchPlanGroupToPalette,
  buildShippingPacketArtifact,
  removePromotedPaletteAction,
  runVerificationRunPlanSelectedChecks,
  renderArtifactPanel,
  renderIntelSurface,
  renderPatchPlanPanel,
  renderShippingCockpit,
  renderWorkspaceActionDeck,
  renderChat,
  refreshCommands,
  refreshModels,
  refreshSessions,
  refreshContextPackProfileStatus,
  runBridgeAutoDetect,
  runMultiAgentStep,
  saveCurrentContextPackProfile,
  refreshContextPackProfile,
  movePromotedPaletteAction,
  selectContextPackProfile,
  setVerificationRunPlan,
  setCommandPaletteShortcutScope,
  setContextPackProfiles,
  setIntelTray,
  setOutputMode,
  setPatchPlan,
  setPromotedPaletteActions,
  setVerificationRunHistory,
  setSystemSurface,
  setWorkbenchSurface,
  setWorkspaceEditDraft,
  setWorkspaceAttachment,
  loadContextPackProfile,
  loadRecommendedContextPackProfile,
  relinkContextPackProfileToWorkflow,
  stageShippingCockpit,
  stageVerificationRunPlanForGroup,
  suggestContextPackFiles,
  sendPrompt,
  showBanner,
  runShippingCockpitChecks,
  setShippingPacketCompareSlot,
  setContextPack,
  updateAutonomousCheckpoint,
  reserveWorkbenchSurfaceRefreshToken: (surface) => reserveSurfaceRefreshToken(surface),
  isWorkbenchSurfaceRefreshTokenCurrent: (surface, token) => isSurfaceRefreshTokenCurrent(surface, token),
  getWorkbenchSurfaceRefreshToken: (surface) => currentSurfaceRefreshToken(surface)
};

window.NeuralShellRenderer.getWorkbenchSurfaceEpoch = (surface) => {
  const normalized = normalizeWorkbenchSurfaceId(surface);
  return normalized ? (appState.surfaceEpochs[normalized] || 0) : 0;
};
window.NeuralShellRenderer.reserveWorkbenchSurfaceEpoch = (surface) => ensureSurfaceEpoch(surface);
window.NeuralShellRenderer.getSurfaceDiagnostics = () => {
  return Array.isArray(appState.surfaceDiagnostics) ? appState.surfaceDiagnostics.slice() : [];
};









/**
 * UI Component to manage and switch between active workspaces (Phase 11D).
 */
class WorkspaceSwitcher {
  constructor(container) {
    this.container = container;
    this.workspaces = [];
    this.activeWorkspace = null;
    this.attentionNeeded = new Set(); // Set of paths
  }

  async init() {
    if (this._initialized) return;
    this._initialized = true;
    this.workspaces = await window.api.workspace.getAll();
    this.activeWorkspace = await window.api.workspace.getActive();

    // Sync with terminal overlay
    if (window.terminalOverlay) {
      window.terminalOverlay.activeWorkspace = this.activeWorkspace;
    }

    window.api.workspace.onChanged((ws) => {
      this.activeWorkspace = ws;
      this.attentionNeeded.delete(ws.path);
      if (window.terminalOverlay) {
        window.terminalOverlay.activeWorkspace = ws;
        window.terminalOverlay.wsContext.textContent = `| ${ws.label}`;
      }
      this.render();

      // Trigger full re-analysis
      if (typeof renderIntelSurface === "function") {
        renderIntelSurface();
      }
    });

    window.api.workspace.onListUpdated((list) => {
      this.workspaces = list;
      this.render();
    });

    this.render();
  }

  async handleSwitch(id) {
    await window.api.workspace.setActive(id);
  }

  notifyAttention(pathStr, _isHighPriority = false) {
    this.attentionNeeded.add(pathStr);
    this.render();
  }

  getUrgency(ws) {
    if (!ws) return 0;
    // Phase 12B: Use server-side urgency score if available
    if (ws.urgency !== undefined) return ws.urgency;

    const actionStatus = appState.actionStatus || {};
    // Fallback logic
    const isAwaiting = Object.keys(actionStatus).some(id => id.startsWith(ws.path) && actionStatus[id].status === "awaiting_input");
    if (isAwaiting) return 100;

    const isFailed = Object.keys(actionStatus).some(id => id.startsWith(ws.path) && actionStatus[id].status === "failed");
    if (isFailed) return 50;

    if (ws.status === "running") return 20;
    return 0;
  }

  render() {
    this.container.innerHTML = "";
    const nav = document.createElement("div");
    nav.className = "workspace-switcher";

    // Sort by urgency then label
    const sorted = [...this.workspaces].sort((a, b) => {
      const urgencyA = this.getUrgency(a);
      const urgencyB = this.getUrgency(b);
      if (urgencyA !== urgencyB) return urgencyB - urgencyA;
      return a.label.localeCompare(b.label);
    });

    sorted.forEach(ws => {
      const chip = document.createElement("div");
      const isActive = this.activeWorkspace && ws.id === this.activeWorkspace.id;
      const urgency = this.getUrgency(ws);
      const hasAttention = this.attentionNeeded.has(ws.path);

      let state = "idle";
      if (hasAttention) state = "attention";
      else if (ws.status === "running") state = "running";
      else if (urgency >= 50) state = "blocked";

      chip.className = `workspace-chip ${isActive ? "active" : ""}`;
      chip.dataset.state = state;

      let statusText = ws.status || "Idle";

      // Determine signals
      let signals = [];
      if (ws.path && ws.path.includes("node_modules")) signals.push("Node");
      if (ws.isGit) signals.push("Git");
      if (urgency > 20) signals.push("Risk");

      chip.innerHTML = `
        <div class="ws-label">${ws.label}</div>
        <div class="ws-meta">
          <div class="ws-status">${hasAttention ? "⚠️ ATTENTION" : statusText}</div>
          ${signals.map(s => `<span class="ws-signal-badge">${s}</span>`).join('')}
        </div>
      `;

      if (urgency >= 80) {
        const badge = document.createElement("div");
        badge.className = "attention-priority-badge";
        badge.textContent = "PRIORITY";
        chip.appendChild(badge);
      }

      if (hasAttention) {
        const badge = document.createElement("div");
        badge.className = "workspace-attention-badge";
        badge.textContent = "!";
        chip.appendChild(badge);
      }

      chip.onclick = () => this.handleSwitch(ws.id);
      nav.appendChild(chip);
    });

    this.container.appendChild(nav);
  }
}





































/**
 * Renders proposed autonomous action chains (Phase 12A).
 */
async function renderChainProposals(container, workspacePath) {
  if (!window.api || !window.api.workspace || !window.api.workspace.getChainProposals) return;

  const proposals = await window.api.workspace.getChainProposals(workspacePath);
  if (!proposals || !proposals.length) return;

  const sectionHeader = document.createElement("div");
  sectionHeader.className = "section-header chain";
  sectionHeader.style.marginBottom = "10px";
  sectionHeader.textContent = "Proposed Autonomous Chains";
  container.appendChild(sectionHeader);

  proposals.forEach(chain => {
    const card = document.createElement("div");
    card.className = "chain-proposal";

    card.innerHTML = `
      <div class="title">🔗 ${esc(chain.title)}</div>
      <div class="rationale">${esc(chain.rationale || "Strategically assembled sequence for this workspace.")}</div>
      <div class="steps-list">
        ${chain.steps.map((s, i) => `
          <div class="step-item ${!s.autoRun ? 'gated' : ''}">
            <span class="dot"></span>
            <span>Step ${i + 1}: ${esc(s.label)} ${!s.autoRun ? '(Approval Required)' : ''}</span>

          </div>
        `).join('')}
      </div>
      <button class="btn-primary" style="width:100%; margin-top:8px;">Start Chain</button>
    `;

    card.querySelector("button").onclick = (e) => {
      e.stopPropagation();
      startChain(chain, workspacePath);
    };

    container.appendChild(card);
  });
}

/**
 * Initiates an autonomous action chain (Phase 12A).
 */
async function startChain(chain, workspacePath) {
  if (typeof terminalOverlay !== "undefined") {
    terminalOverlay.show(chain.title);
  }

  if (window.api && window.api.action && window.api.action.runChain) {
    const result = await window.api.action.runChain(chain.templateId, workspacePath);
    if (!result.ok) {
      showBanner(`Chain Failed: ${result.reason}`, "error");
    }
  }
}
