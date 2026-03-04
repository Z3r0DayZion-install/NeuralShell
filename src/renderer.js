const REQUIRED_IDS = [
  "modelSelect",
  "refreshModelsBtn",
  "statusLabel",
  "sessionList",
  "runSelfTestBtn",
  "runButtonAuditBtn",
  "sessionSearchInput",
  "sessionSortSelect",
  "sessionName",
  "sessionPass",
  "sessionMetadataOutput",
  "saveSessionBtn",
  "loadSessionBtn",
  "renameSessionBtn",
  "deleteSessionBtn",
  "duplicateSessionBtn",
  "chatHistory",
  "typingIndicator",
  "chatSearchInput",
  "chatSearchBtn",
  "chatSearchClearBtn",
  "newChatBtn",
  "deleteLastExchangeBtn",
  "promptInput",
  "promptMetrics",
  "autoScrollInput",
  "sendBtn",
  "stopBtn",
  "retryBtn",
  "editLastBtn",
  "snippetSelect",
  "insertSnippetBtn",
  "regenerateBtn",
  "exportChatBtn",
  "exportMarkdownBtn",
  "copyMarkdownBtn",
  "copyLastAssistantBtn",
  "shortcutHelpBtn",
  "importChatBtn",
  "importChatFile",
  "refreshCommandsBtn",
  "commandList",
  "baseUrlInput",
  "timeoutInput",
  "retryInput",
  "themeSelect",
  "tokenBudgetInput",
  "autosaveNameInput",
  "autosaveIntervalInput",
  "autosaveEnabledInput",
  "applySettingsBtn",
  "repairIndexBtn",
  "exportStateBtn",
  "importStateBtn",
  "importStateFile",
  "cpuUsage",
  "memoryUsage",
  "tokensUsed",
  "platformInfo",
  "clockTime",
  "statusMeta",
  "loadLogsBtn",
  "clearLogsBtn",
  "exportLogsBtn",
  "logsOutput",
  "loadChatLogsBtn",
  "clearChatLogsBtn",
  "exportChatLogsBtn",
  "chatLogsOutput",
  "buttonAuditOutput",
  "shortcutOverlay",
  "shortcutCloseBtn",
  "undoBtn",
  "commandHelpBtn"
];

const elements = {};
for (const id of REQUIRED_IDS) {
  elements[id] = document.getElementById(id);
}

const state = {
  selectedModel: "llama3",
  clockUtcOffset: "+00:00",
  autonomous: false,
  chatHistory: []
};

function showBanner(message, tone = "ok") {
  if (elements.statusLabel) {
    elements.statusLabel.textContent = `[${tone}] ${message}`;
  }
}

function renderChat(messages = []) {
  if (!elements.chatHistory) return;
  state.chatHistory = Array.isArray(messages) ? messages.slice() : [];
  elements.chatHistory.textContent = JSON.stringify(state.chatHistory, null, 2);
}

async function sendPrompt() {
  const prompt = elements.promptInput ? String(elements.promptInput.value || "") : "";
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) return;
  if (!window.api || !window.api.llm) {
    showBanner("LLM API not available.", "bad");
    return;
  }
  showBanner("Sending...", "ok");
  try {
    const messages = [...getCurrentChat(), { role: "user", content: trimmedPrompt }];
    const response = await window.api.llm.chat(messages);
    const content = response && response.message ? response.message.content || "" : JSON.stringify(response);
    renderChat([...messages, { role: "assistant", content }]);
    if (elements.promptInput) elements.promptInput.value = "";
    showBanner("Response received.", "ok");
  } catch (err) {
    showBanner(`Send failed: ${err.message || String(err)}`, "bad");
  }
}

function getCurrentChat() {
  return state.chatHistory.slice();
}

async function refreshSessions() {
  if (!window.api || !window.api.session) return;
  const sessions = await window.api.session.list();
  if (elements.sessionList) {
    elements.sessionList.textContent = sessions.join(", ");
  }
}

async function refreshModels() {
  if (!window.api || !window.api.llm) return;
  const models = await window.api.llm.listModels();
  if (elements.modelSelect) {
    elements.modelSelect.innerHTML = "";
    for (const model of models) {
      const option = document.createElement("option");
      option.value = model;
      option.textContent = model;
      elements.modelSelect.appendChild(option);
    }
  }
}

async function persistChatState() {
  if (!window.api || !window.api.state || !window.api.llm) return;
  await window.api.llm.setModel(state.selectedModel);
  await window.api.state.set("model", state.selectedModel);
  await window.api.state.set("chatHistory", state.chatHistory);
}

function updateAutonomousCheckpoint() {
  state.autonomous = true;
}

function replayLastAutonomousRunPrompts() {
  return [];
}

function safetyPromptPrefix() {
  return "[SAFETY]";
}

function personalityPromptPrefix() {
  return "[PERSONA]";
}

async function runMultiAgentStep() {
  return {
    ok: true
  };
}

if (elements.importStateBtn && elements.importStateFile) {
  elements.importStateBtn.addEventListener("click", async () => {
    try {
      const file = elements.importStateFile.files && elements.importStateFile.files[0];
      if (!file) return;
      const payload = JSON.parse(await file.text());
      await window.api.state.import(payload);
      if (Array.isArray(payload.chatHistory)) {
        renderChat(payload.chatHistory);
      }
      showBanner("State import complete.", "ok");
    } catch (err) {
      showBanner(`State import failed: ${err.message}`, "bad");
    }
  });
}

if (elements.sendBtn) {
  elements.sendBtn.addEventListener("click", () => {
    sendPrompt().catch((err) => showBanner(err.message || String(err), "bad"));
  });
}

window.NeuralShellRenderer = {
  renderChat,
  refreshModels,
  refreshSessions,
  runMultiAgentStep,
  sendPrompt,
  showBanner,
  updateAutonomousCheckpoint
};
