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
  autonomous: false
};

function showBanner(message, tone = "ok") {
  if (elements.statusLabel) {
    elements.statusLabel.textContent = `[${tone}] ${message}`;
  }
}

function renderChat(messages = []) {
  if (!elements.chatHistory) return;
  elements.chatHistory.textContent = JSON.stringify(messages, null, 2);
}

async function sendPrompt() {
  const prompt = elements.promptInput ? String(elements.promptInput.value || "") : "";
  if (!prompt.trim()) return;
  if (!window.api || !window.api.llm) {
    showBanner("LLM API not available.", "bad");
    return;
  }
  showBanner("Sending...", "ok");
  try {
    const messages = [{ role: "user", content: prompt.trim() }];
    const response = await window.api.llm.chat(messages);
    const content = response && response.message ? response.message.content || "" : JSON.stringify(response);
    renderChat([...getCurrentChat(), { role: "user", content: prompt.trim() }, { role: "assistant", content }]);
    if (elements.promptInput) elements.promptInput.value = "";
    showBanner("Response received.", "ok");
  } catch (err) {
    showBanner(`Send failed: ${err.message || String(err)}`, "bad");
  }
}

function getCurrentChat() {
  // Retrieve current chat state from the API if available
  return [];
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
  await api.llm.setModel(state.selectedModel);
  await api.state.set("model", state.selectedModel);
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
      await api.state.import(payload);
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
