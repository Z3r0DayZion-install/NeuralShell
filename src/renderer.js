(() => {
  "use strict";

  const STORE_KEY = "neuralshell_state_v2";
  const DEFAULT_SETTINGS = {
    theme: "dark",
    model: "llama3",
    temperature: 0.4,
    systemPrompt: "",
    autoGoal: "",
    autoInterval: 20
  };
  const REQUIRED_IDS = [
    "appClock", "llmStatus", "connectBtn", "runSelfTestBtn", "runButtonAuditBtn",
    "sessionSearchInput", "newSessionBtn", "renameSessionBtn", "duplicateSessionBtn", "deleteSessionBtn",
    "sessionList", "modelSelect", "temperatureInput", "systemPromptInput", "chatWindow", "llmInput",
    "sendBtn", "retryBtn", "clearChatBtn", "exportChatBtn", "importChatBtn", "importChatFile",
    "clearLogsBtn", "exportLogsBtn", "clearHistoryBtn", "logOutput", "diagnosticOutput",
    "themeSelect", "saveSettingsBtn",
    "autoGoalInput", "autoIntervalInput", "toggleAutoBtn",
    "codeTaskInput", "generateCodeBtn", "copyCodeBtn", "exportCodeBtn", "codeOutput",
    "exportTearBtn", "importTearBtn", "previewTearBtn", "tearMergeMode", "importTearFile",
    "tearSecretInput", "tearHintInput", "tearRevealToggle", "clearTearSecretBtn", "tearPreviewOutput",
    "memoryQueryInput", "memorySearchBtn", "memoryCompactBtn", "memoryOutput",
    "profileNameInput", "saveProfileBtn", "profileSelect", "loadProfileBtn", "deleteProfileBtn",
    "saveCheckpointBtn", "listCheckpointsBtn", "recoverCheckpointBtn", "checkpointOutput",
    "startStreamBtn", "cancelStreamBtn", "resumeStreamBtn",
    "refreshPermissionsBtn", "toggleAutoPermBtn", "toggleStreamPermBtn", "permissionsOutput",
    "refreshTelemetryBtn", "telemetryOutput",
    "authPinInput", "authLoginBtn", "authLogoutBtn", "authRecoverConfirmInput", "authRecoverBtn", "authOutput",
    "vaultLoadSecretBtn", "vaultSaveSecretBtn", "vaultClearSecretBtn",
    "syncEndpointInput", "syncTokenInput", "syncPushBtn", "syncPullBtn", "syncOutput",
    "updateFeedInput", "checkUpdateBtn", "updateOutput"
  ];

  const boundButtons = new Set();
  const ui = {};
  const stateSchema = window.NeuralStateSchema;
  const helpers = window.NeuralHelpers || {};
  const tearApi = window.NeuralTear || {};
  const panelApi = window.NeuralPanels || {};
  let toastTimer = null;
  let autonomousRunning = false;
  let detachAutoListener = null;
  let detachStreamListener = null;
  let autonomousStep = 0;
  let currentStreamId = null;
  let currentStreamSessionId = null;
  let currentStreamMessageIndex = -1;
  let permissionCache = null;
  let authLockInterval = null;
  let profiles = loadProfiles();
  let lastGeneratedCode = "";
  let state = loadState();
  let activeSessionId = state.activeSessionId || ensureSession().id;
  let inFlight = false;

  function $(id) {
    return document.getElementById(id);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function formatTime(value) {
    return new Date(value).toLocaleString();
  }

  function logLine(message) {
    const line = `[${formatTime(nowIso())}] ${message}`;
    state.logs.push(line);
    if (state.logs.length > 250) state.logs = state.logs.slice(-250);
    renderLogs();
    persist();
  }

  function showToast(message) {
    const node = $("toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("show"), 1400);
  }

  function clearAuthLockInterval() {
    if (authLockInterval) {
      clearInterval(authLockInterval);
      authLockInterval = null;
    }
  }

  function lockSecondsRemaining(lockedUntil) {
    if (!lockedUntil) return 0;
    const untilMs = Date.parse(lockedUntil);
    if (!Number.isFinite(untilMs)) return 0;
    return Math.max(0, Math.ceil((untilMs - Date.now()) / 1000));
  }

  function setAuthLockedUi(seconds) {
    const locked = Number(seconds) > 0;
    ui.authLoginBtn.disabled = locked;
    ui.authPinInput.disabled = locked;
    ui.authLoginBtn.textContent = locked ? `Locked (${seconds}s)` : "Login";
  }

  function startAuthLockCountdown(lockedUntil) {
    clearAuthLockInterval();
    const tick = () => {
      const remaining = lockSecondsRemaining(lockedUntil);
      setAuthLockedUi(remaining);
      if (remaining <= 0) {
        clearAuthLockInterval();
        void refreshAuthStatus().catch(() => {});
      }
    };
    tick();
    if (lockSecondsRemaining(lockedUntil) > 0) {
      authLockInterval = setInterval(tick, 1000);
    }
  }

  function createSession(name) {
    return {
      id: `s_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      name: name || `Session ${new Date().toLocaleTimeString()}`,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      messages: []
    };
  }

  function ensureSession() {
    if (!Array.isArray(state.sessions)) state.sessions = [];
    if (!state.sessions.length) {
      const session = createSession("New Session");
      state.sessions.push(session);
      state.activeSessionId = session.id;
    }
    const found = state.sessions.find((s) => s.id === state.activeSessionId) || state.sessions[0];
    state.activeSessionId = found.id;
    return found;
  }

  function activeSession() {
    return state.sessions.find((s) => s.id === activeSessionId) || ensureSession();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) {
        const base = { schemaVersion: 2, sessions: [], activeSessionId: null, settings: { ...DEFAULT_SETTINGS }, logs: [] };
        return stateSchema?.migrateState ? stateSchema.migrateState(base) : base;
      }
      const parsed = JSON.parse(raw);
      const base = {
        schemaVersion: Number.isFinite(parsed.schemaVersion) ? parsed.schemaVersion : 1,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        activeSessionId: parsed.activeSessionId || null,
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        logs: Array.isArray(parsed.logs) ? parsed.logs : []
      };
      return stateSchema?.migrateState ? stateSchema.migrateState(base) : base;
    } catch (_err) {
      const base = { schemaVersion: 2, sessions: [], activeSessionId: null, settings: { ...DEFAULT_SETTINGS }, logs: [] };
      return stateSchema?.migrateState ? stateSchema.migrateState(base) : base;
    }
  }

  function persist() {
    state.schemaVersion = stateSchema?.CURRENT_SCHEMA_VERSION || 2;
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function loadProfiles() {
    try {
      const raw = localStorage.getItem("neuralshell_profiles_v1");
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_err) {
      return {};
    }
  }

  function persistProfiles() {
    localStorage.setItem("neuralshell_profiles_v1", JSON.stringify(profiles));
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderClock() {
    ui.appClock.textContent = new Date().toLocaleString();
  }

  function renderStatus(online, text) {
    ui.llmStatus.textContent = text;
    ui.llmStatus.classList.toggle("status-online", online);
    ui.llmStatus.classList.toggle("status-offline", !online);
  }

  function renderSessions() {
    const filter = ui.sessionSearchInput.value.trim().toLowerCase();
    ui.sessionList.innerHTML = "";
    const rows = state.sessions
      .slice()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .filter((s) => !filter || s.name.toLowerCase().includes(filter));

    for (const session of rows) {
      const li = document.createElement("li");
      const count = Array.isArray(session.messages) ? session.messages.length : 0;
      li.innerHTML = `<strong>${escapeHtml(session.name)}</strong><br><small>${count} messages</small>`;
      li.classList.toggle("active", session.id === activeSessionId);
      li.addEventListener("click", () => {
        activeSessionId = session.id;
        state.activeSessionId = session.id;
        persist();
        renderSessions();
        renderChat();
      });
      ui.sessionList.appendChild(li);
    }
  }

  function renderChat() {
    const session = activeSession();
    ui.chatWindow.innerHTML = "";
    for (const message of session.messages) {
      const div = document.createElement("div");
      div.className = `message ${message.role === "assistant" ? "assistant" : "user"}`;
      div.innerHTML = `<div class="meta">${escapeHtml(message.role)} | ${formatTime(message.at)}</div><div>${escapeHtml(message.content)}</div>`;
      ui.chatWindow.appendChild(div);
    }
    ui.chatWindow.scrollTop = ui.chatWindow.scrollHeight;
  }

  function renderLogs() {
    ui.logOutput.textContent = state.logs.join("\n");
    ui.logOutput.scrollTop = ui.logOutput.scrollHeight;
  }

  function renderSettings() {
    ui.themeSelect.value = state.settings.theme;
    ui.modelSelect.value = state.settings.model;
    ui.temperatureInput.value = String(state.settings.temperature);
    ui.systemPromptInput.value = state.settings.systemPrompt;
    ui.autoGoalInput.value = state.settings.autoGoal || "";
    ui.autoIntervalInput.value = String(state.settings.autoInterval || 20);
    document.body.setAttribute("data-theme", state.settings.theme);
  }

  async function requestAssistant(messages) {
    const payload = {
      model: ui.modelSelect.value,
      messages,
      stream: false,
      options: { temperature: state.settings.temperature }
    };
    const res = await window.llmBridge.chat(payload);
    return parseAssistantText(res);
  }

  function appendMessage(role, content) {
    const session = activeSession();
    const message = { role, content, at: nowIso() };
    session.messages.push(message);
    session.updatedAt = nowIso();
    persist();
    renderSessions();
    renderChat();
    if (window.memoryBridge?.add) {
      window.memoryBridge.add({
        role: message.role,
        content: message.content,
        at: message.at,
        sessionId: session.id
      }).catch(() => {});
    }
  }

  async function pingLlm() {
    if (!window.llmBridge || typeof window.llmBridge.ping !== "function") {
      renderStatus(false, "Bridge Missing");
      logLine("Bridge missing: llmBridge.ping unavailable");
      return;
    }
    renderStatus(false, "Connecting...");
    try {
      const ok = await window.llmBridge.ping();
      renderStatus(Boolean(ok), ok ? "Connected" : "Offline");
      logLine(ok ? "LLM connection OK" : "LLM connection failed");
      showToast(ok ? "LLM connected" : "LLM offline");
    } catch (err) {
      renderStatus(false, "Error");
      logLine(`LLM ping error: ${err.message}`);
      showToast("Connection check failed");
    }
  }

  function buildMessagesForApi() {
    const session = activeSession();
    const messages = [];
    const systemPrompt = ui.systemPromptInput.value.trim();
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    for (const message of session.messages) {
      messages.push({ role: message.role, content: message.content });
    }
    return messages;
  }

  function parseAssistantText(response) {
    if (typeof helpers.parseAssistantResponse === "function") {
      return helpers.parseAssistantResponse(response);
    }
    if (!response || typeof response !== "object") return "No response";
    if (response.message && typeof response.message.content === "string") return response.message.content;
    if (Array.isArray(response.choices) && response.choices[0]?.message?.content) return response.choices[0].message.content;
    if (typeof response.response === "string") return response.response;
    return JSON.stringify(response, null, 2);
  }

  async function sendMessage() {
    if (inFlight) return;
    const text = ui.llmInput.value.trim();
    if (!text) return;
    if (!window.llmBridge || typeof window.llmBridge.chat !== "function") {
      logLine("Bridge missing: llmBridge.chat unavailable");
      return;
    }

    inFlight = true;
    ui.sendBtn.disabled = true;
    ui.sendBtn.textContent = "Sending...";
    appendMessage("user", text);
    ui.llmInput.value = "";

    const model = ui.modelSelect.value;
    const temperature = Number(ui.temperatureInput.value);
    state.settings.model = model;
    state.settings.temperature = Number.isFinite(temperature) ? temperature : DEFAULT_SETTINGS.temperature;
    state.settings.systemPrompt = ui.systemPromptInput.value;
    persist();

    try {
      const textOut = await requestAssistant(buildMessagesForApi());
      appendMessage("assistant", textOut);
      logLine(`Assistant response received (${textOut.length} chars)`);
      showToast("Response received");
    } catch (err) {
      appendMessage("assistant", `Request failed: ${err.message}`);
      logLine(`Chat request failed: ${err.message}`);
      showToast("Request failed");
    } finally {
      inFlight = false;
      ui.sendBtn.disabled = false;
      ui.sendBtn.textContent = "Send";
    }
  }

  async function retryLast() {
    const session = activeSession();
    const lastUser = [...session.messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      logLine("Retry skipped: no user message in active session");
      return;
    }
    ui.llmInput.value = lastUser.content;
    await sendMessage();
  }

  function clearChat() {
    const session = activeSession();
    session.messages = [];
    session.updatedAt = nowIso();
    persist();
    renderSessions();
    renderChat();
    logLine(`Cleared chat: ${session.name}`);
    showToast("Chat cleared");
  }

  function exportActiveChat() {
    const session = activeSession();
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name.replace(/[^a-z0-9_-]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logLine(`Exported chat: ${session.name}`);
    showToast("Chat exported");
  }

  function importChatFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        if (!Array.isArray(parsed.messages)) throw new Error("Invalid chat JSON");
        const session = createSession(parsed.name || file.name.replace(/\.json$/i, ""));
        session.messages = parsed.messages
          .filter((m) => m && typeof m.role === "string" && typeof m.content === "string")
          .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content, at: m.at || nowIso() }));
        state.sessions.push(session);
        activeSessionId = session.id;
        state.activeSessionId = session.id;
        persist();
        renderSessions();
        renderChat();
        logLine(`Imported chat file: ${file.name}`);
        showToast("Chat imported");
      } catch (err) {
        logLine(`Import failed: ${err.message}`);
        showToast("Import failed");
      }
    };
    reader.readAsText(file);
  }

  function createNewSession() {
    const name = prompt("Session name:", "New Session");
    if (name === null) return;
    const session = createSession(name.trim() || "New Session");
    state.sessions.push(session);
    activeSessionId = session.id;
    state.activeSessionId = session.id;
    persist();
    renderSessions();
    renderChat();
    logLine(`Created session: ${session.name}`);
    showToast("Session created");
  }

  function renameSession() {
    const session = activeSession();
    const next = prompt("Rename session:", session.name);
    if (next === null) return;
    session.name = next.trim() || session.name;
    session.updatedAt = nowIso();
    persist();
    renderSessions();
    logLine(`Renamed session to: ${session.name}`);
    showToast("Session renamed");
  }

  function duplicateSession() {
    const session = activeSession();
    const copy = createSession(`${session.name} Copy`);
    copy.messages = session.messages.map((m) => ({ ...m }));
    state.sessions.push(copy);
    activeSessionId = copy.id;
    state.activeSessionId = copy.id;
    persist();
    renderSessions();
    renderChat();
    logLine(`Duplicated session: ${session.name}`);
    showToast("Session duplicated");
  }

  function deleteSession() {
    if (state.sessions.length <= 1) {
      logLine("Delete skipped: at least one session is required");
      return;
    }
    const session = activeSession();
    const ok = confirm(`Delete session "${session.name}"?`);
    if (!ok) return;
    state.sessions = state.sessions.filter((s) => s.id !== session.id);
    activeSessionId = state.sessions[0].id;
    state.activeSessionId = activeSessionId;
    persist();
    renderSessions();
    renderChat();
    logLine(`Deleted session: ${session.name}`);
    showToast("Session deleted");
  }

  function clearLogs() {
    state.logs = [];
    renderLogs();
    persist();
    showToast("Logs cleared");
  }

  function exportLogs() {
    const blob = new Blob([state.logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neuralshell_logs_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    logLine("Exported logs");
    showToast("Logs exported");
  }

  function clearAllHistory() {
    const ok = confirm("Clear all sessions and logs?");
    if (!ok) return;
    state = { sessions: [], activeSessionId: null, settings: { ...state.settings }, logs: [] };
    const session = ensureSession();
    activeSessionId = session.id;
    renderSessions();
    renderChat();
    renderLogs();
    persist();
    logLine("Cleared full history");
    showToast("All history cleared");
  }

  function saveSettings() {
    state.settings.theme = ui.themeSelect.value;
    state.settings.model = ui.modelSelect.value;
    state.settings.temperature = Number(ui.temperatureInput.value) || DEFAULT_SETTINGS.temperature;
    state.settings.systemPrompt = ui.systemPromptInput.value || "";
    state.settings.autoGoal = ui.autoGoalInput.value || "";
    state.settings.autoInterval = Math.max(5, Number(ui.autoIntervalInput.value) || 20);
    document.body.setAttribute("data-theme", state.settings.theme);
    persist();
    logLine("Saved settings");
    showToast("Settings saved");
  }

  function runSelfTest() {
    const checks = [];
    for (const id of REQUIRED_IDS) {
      checks.push({ id, ok: Boolean($(id)) });
    }
    checks.push({ id: "llmBridge.ping", ok: Boolean(window.llmBridge?.ping) });
    checks.push({ id: "llmBridge.chat", ok: Boolean(window.llmBridge?.chat) });
    checks.push({ id: "llmBridge.streamStart", ok: Boolean(window.llmBridge?.streamStart) });
    checks.push({ id: "memoryBridge.search", ok: Boolean(window.memoryBridge?.search) });
    checks.push({ id: "checkpointBridge.save", ok: Boolean(window.checkpointBridge?.save) });
    checks.push({ id: "permissionBridge.list", ok: Boolean(window.permissionBridge?.list) });
    checks.push({ id: "telemetryBridge.get", ok: Boolean(window.telemetryBridge?.get) });
    checks.push({ id: "authBridge.login", ok: Boolean(window.authBridge?.login) });
    checks.push({ id: "syncBridge.push", ok: Boolean(window.syncBridge?.push) });
    checks.push({ id: "updateBridge.check", ok: Boolean(window.updateBridge?.check) });
    const pass = checks.every((c) => c.ok);
    ui.diagnosticOutput.textContent = [
      `Self Test: ${pass ? "PASS" : "FAIL"}`,
      ...checks.map((c) => `${c.ok ? "OK" : "MISS"}  ${c.id}`)
    ].join("\n");
    logLine(`Self test ${pass ? "passed" : "failed"}`);
    showToast(pass ? "Self test passed" : "Self test failed");
  }

  function runButtonAudit() {
    const buttons = [...document.querySelectorAll("button")];
    const report = [];
    let missing = 0;
    for (const btn of buttons) {
      const id = btn.id || "(no-id)";
      const ok = boundButtons.has(id);
      if (!ok) missing += 1;
      report.push(`${ok ? "OK" : "MISS"}  ${id}`);
    }
    ui.diagnosticOutput.textContent = [
      `Button Audit: ${missing === 0 ? "PASS" : "FAIL"} (${buttons.length - missing}/${buttons.length})`,
      ...report
    ].join("\n");
    logLine(`Button audit finished: ${buttons.length - missing}/${buttons.length} wired`);
    showToast(missing === 0 ? "Buttons all wired" : "Some buttons missing");
  }

  function bindClick(id, handler) {
    const node = $(id);
    if (!node) return;
    node.addEventListener("click", () => {
      Promise.resolve(handler()).catch((err) => {
        logLine(`${id} failed: ${err.message}`);
        showToast(`${id} failed`);
      });
    });
    boundButtons.add(id);
  }

  async function runAutonomousStep(tick) {
    if (inFlight) return;
    const goal = typeof tick?.goal === "string" && tick.goal ? tick.goal : ui.autoGoalInput.value.trim();
    if (!goal) {
      stopAutonomous();
      showToast("Set an autonomous goal first");
      return;
    }
    autonomousStep = Number.isFinite(tick?.sequence) ? tick.sequence : autonomousStep + 1;
    const prompt = [
      `[AUTO STEP ${autonomousStep}]`,
      `Goal: ${goal}`,
      "Respond with the single best next action and include code when useful.",
      "Keep it practical and execution-oriented.",
      "End with NEXT_STEP: <one-line next move>."
    ].join("\n");

    inFlight = true;
    ui.sendBtn.disabled = true;
    ui.sendBtn.textContent = "Sending...";
    appendMessage("user", prompt);
    try {
      const messages = buildMessagesForApi();
      const textOut = await requestAssistant(messages);
      appendMessage("assistant", `[AUTO]\n${textOut}`);
      logLine(`Autonomous step ${autonomousStep} completed`);
      showToast(`Auto step ${autonomousStep} done`);
    } catch (err) {
      appendMessage("assistant", `[AUTO ERROR] ${err.message}`);
      logLine(`Autonomous step failed: ${err.message}`);
      showToast("Auto step failed");
    } finally {
      inFlight = false;
      ui.sendBtn.disabled = false;
      ui.sendBtn.textContent = "Send";
    }
  }

  function startAutonomous() {
    if (autonomousRunning) return;
    const goal = ui.autoGoalInput.value.trim();
    if (!goal) {
      showToast("Enter a goal first");
      return;
    }
    const intervalSec = Math.max(5, Number(ui.autoIntervalInput.value) || 20);
    state.settings.autoGoal = goal;
    state.settings.autoInterval = intervalSec;
    persist();
    if (!window.autonomousBridge?.start) {
      showToast("Autonomous bridge unavailable");
      logLine("Autonomous start failed: bridge unavailable");
      return;
    }
    window.autonomousBridge.start({ goal, intervalSec })
      .then(() => {
        autonomousRunning = true;
        autonomousStep = 0;
        ui.toggleAutoBtn.textContent = "Stop Auto";
        logLine(`Autonomous mode started (${intervalSec}s)`);
        showToast("Autonomous mode started");
      })
      .catch((err) => {
        logLine(`Autonomous start failed: ${err.message}`);
        showToast("Autonomous start failed");
      });
  }

  function stopAutonomous() {
    if (!autonomousRunning) return;
    if (!window.autonomousBridge?.stop) {
      autonomousRunning = false;
      ui.toggleAutoBtn.textContent = "Start Auto";
      showToast("Autonomous stopped locally");
      return;
    }
    window.autonomousBridge.stop()
      .then(() => {
        autonomousRunning = false;
        ui.toggleAutoBtn.textContent = "Start Auto";
        logLine("Autonomous mode stopped");
        showToast("Autonomous mode stopped");
      })
      .catch((err) => {
        logLine(`Autonomous stop failed: ${err.message}`);
        showToast("Autonomous stop failed");
      });
  }

  function toggleAutonomous() {
    if (autonomousRunning) stopAutonomous();
    else startAutonomous();
  }

  function extractCodeBlock(text) {
    const match = text.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }

  async function generateCode() {
    if (inFlight) return;
    const task = ui.codeTaskInput.value.trim();
    if (!task) {
      showToast("Enter a coding task");
      return;
    }
    if (!window.llmBridge || typeof window.llmBridge.chat !== "function") {
      logLine("Bridge missing: llmBridge.chat unavailable");
      showToast("LLM bridge unavailable");
      return;
    }
    inFlight = true;
    ui.generateCodeBtn.disabled = true;
    ui.generateCodeBtn.textContent = "Generating...";
    try {
      const base = buildMessagesForApi();
      const prompt = [
        "You are a senior software engineer.",
        `Task: ${task}`,
        "Return practical code first, then brief notes.",
        "Use fenced code block."
      ].join("\n");
      const messages = [...base, { role: "user", content: prompt }];
      const textOut = await requestAssistant(messages);
      lastGeneratedCode = extractCodeBlock(textOut);
      ui.codeOutput.textContent = lastGeneratedCode || textOut;
      appendMessage("assistant", `Code draft generated for task: ${task}`);
      logLine(`Code draft generated (${(lastGeneratedCode || "").length} chars)`);
      showToast("Code generated");
    } catch (err) {
      ui.codeOutput.textContent = `Generation failed: ${err.message}`;
      logLine(`Code generation failed: ${err.message}`);
      showToast("Code generation failed");
    } finally {
      inFlight = false;
      ui.generateCodeBtn.disabled = false;
      ui.generateCodeBtn.textContent = "Generate Code";
    }
  }

  async function copyCode() {
    const code = ui.codeOutput.textContent.trim();
    if (!code) {
      showToast("No code to copy");
      return;
    }
    try {
      await navigator.clipboard.writeText(code);
      showToast("Code copied");
      logLine("Code copied to clipboard");
    } catch (_err) {
      showToast("Clipboard blocked");
      logLine("Clipboard write failed");
    }
  }

  function exportCode() {
    const code = ui.codeOutput.textContent.trim();
    if (!code) {
      showToast("No code to export");
      return;
    }
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code_draft_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    logLine("Code draft exported");
    showToast("Code exported");
  }

  function bytesToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function sha256Hex(text) {
    const encoded = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", encoded);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async function deriveTearKeys(password, saltBytes) {
    const baseKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const keyBytes = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: saltBytes, iterations: 210000, hash: "SHA-256" },
      baseKey,
      512
    );
    const keyMaterial = new Uint8Array(keyBytes);
    const aesRaw = keyMaterial.slice(0, 32);
    const hmacRaw = keyMaterial.slice(32, 64);
    const aesKey = await crypto.subtle.importKey("raw", aesRaw, "AES-GCM", false, ["encrypt", "decrypt"]);
    const hmacKey = await crypto.subtle.importKey(
      "raw",
      hmacRaw,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
    return { aesKey, hmacKey };
  }

  async function encryptTearPayload(payloadText, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const { aesKey, hmacKey } = await deriveTearKeys(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      aesKey,
      new TextEncoder().encode(payloadText)
    );
    const cipherB64 = bytesToBase64(encrypted);
    const saltB64 = bytesToBase64(salt);
    const ivB64 = bytesToBase64(iv);
    const signedData = `${saltB64}.${ivB64}.${cipherB64}`;
    const signatureRaw = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(signedData));
    const signatureB64 = bytesToBase64(signatureRaw);
    return {
      cipherB64,
      saltB64,
      ivB64,
      signatureB64,
      payloadHash: await sha256Hex(payloadText)
    };
  }

  async function decryptTearPayload(record, password) {
    if (!record?.crypto || !record?.payloadEnc) throw new Error("Encrypted TEAR metadata missing");
    const salt = base64ToBytes(record.crypto.salt);
    const iv = base64ToBytes(record.crypto.iv);
    const cipher = base64ToBytes(record.payloadEnc);
    const signature = base64ToBytes(record.crypto.signature);
    const { aesKey, hmacKey } = await deriveTearKeys(password, salt);
    const signedData = `${record.crypto.salt}.${record.crypto.iv}.${record.payloadEnc}`;
    const valid = await crypto.subtle.verify("HMAC", hmacKey, signature, new TextEncoder().encode(signedData));
    if (!valid) throw new Error("TEAR signature check failed");
    const plainRaw = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, cipher);
    const payloadText = new TextDecoder().decode(plainRaw);
    if (record.integrity?.payloadHash) {
      const digest = await sha256Hex(payloadText);
      if (digest !== record.integrity.payloadHash) throw new Error("TEAR payload hash mismatch");
    }
    return payloadText;
  }

  function buildPlainTearEnvelope(payloadText, payloadObj) {
    return {
      format: "TEAR",
      version: "2.0.0",
      exportedAt: nowIso(),
      app: "NeuralShell Desktop",
      encrypted: false,
      payload: payloadObj,
      integrity: { alg: "SHA-256", payloadHash: null, payloadLength: payloadText.length }
    };
  }

  function buildStatePayload() {
    return {
      schemaVersion: stateSchema?.CURRENT_SCHEMA_VERSION || 2,
      sessions: state.sessions,
      activeSessionId: state.activeSessionId,
      settings: state.settings,
      logs: state.logs
    };
  }

  async function saveTextFile(defaultName, text) {
    if (window.neuralAPI?.selectSavePath && window.neuralAPI?.writeFile) {
      const filePath = await window.neuralAPI.selectSavePath({
        title: "Export TEAR",
        defaultPath: defaultName,
        filters: [{ name: "TEAR Files", extensions: ["tear"] }]
      });
      if (filePath) {
        await window.neuralAPI.writeFile(filePath, text);
        return filePath;
      }
      return null;
    }
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    return "(browser download)";
  }

  async function exportTear() {
    try {
      const payloadObj = buildStatePayload();
      const payloadText = JSON.stringify(payloadObj);
      const secret = String(ui.tearSecretInput?.value || "").trim();
      const hint = String(ui.tearHintInput?.value || "").trim();

      let envelope;
      if (typeof tearApi.createEnvelope === "function") {
        envelope = await tearApi.createEnvelope(payloadObj, secret, hint);
      } else if (secret) {
        if (!crypto?.subtle) throw new Error("WebCrypto unavailable for encryption");
        const encrypted = await encryptTearPayload(payloadText, secret);
        envelope = {
          format: "TEAR",
          version: "2.1.0",
          exportedAt: nowIso(),
          app: "NeuralShell Desktop",
          encrypted: true,
          hint,
          payloadEnc: encrypted.cipherB64,
          crypto: {
            alg: "AES-GCM-256+HMAC-SHA256",
            kdf: "PBKDF2",
            iterations: 210000,
            salt: encrypted.saltB64,
            iv: encrypted.ivB64,
            signature: encrypted.signatureB64
          },
          integrity: { alg: "SHA-256", payloadHash: encrypted.payloadHash, payloadLength: payloadText.length }
        };
      } else {
        envelope = buildPlainTearEnvelope(payloadText, payloadObj);
        envelope.version = "2.1.0";
        envelope.hint = hint;
        envelope.integrity.payloadHash = await sha256Hex(payloadText);
      }

      const text = JSON.stringify(envelope, null, 2);
      const filePath = await saveTextFile(`neuralshell_${Date.now()}.tear`, text);
      if (!filePath) return;
      logLine(`TEAR exported: ${filePath}`);
      showToast(envelope.encrypted ? "Encrypted TEAR exported" : "TEAR exported");
    } catch (err) {
      logLine(`TEAR export failed: ${err.message}`);
      showToast("TEAR export failed");
    }
  }

  function mergeImportedState(next) {
    const existingIds = new Set(state.sessions.map((s) => s.id));
    const mergedSessions = state.sessions.slice();
    for (const session of next.sessions || []) {
      if (!existingIds.has(session.id)) mergedSessions.push(session);
    }
    return {
      schemaVersion: Number.isFinite(next.schemaVersion) ? next.schemaVersion : state.schemaVersion,
      sessions: mergedSessions,
      activeSessionId: state.activeSessionId,
      settings: { ...state.settings, ...(next.settings || {}) },
      logs: [...state.logs, ...(next.logs || [])].slice(-500)
    };
  }

  function applyImportedState(next, mode = "replace") {
    const base = {
      schemaVersion: Number.isFinite(next.schemaVersion) ? next.schemaVersion : 1,
      sessions: Array.isArray(next.sessions) ? next.sessions : [],
      activeSessionId: typeof next.activeSessionId === "string" ? next.activeSessionId : null,
      settings: { ...DEFAULT_SETTINGS, ...(next.settings || {}) },
      logs: Array.isArray(next.logs) ? next.logs : []
    };
    const normalized = stateSchema?.migrateState ? stateSchema.migrateState(base) : base;
    state = mode === "merge" ? mergeImportedState(normalized) : normalized;
    ensureSession();
    activeSessionId = state.activeSessionId;
    persist();
    renderSettings();
    renderSessions();
    renderChat();
    renderLogs();
  }

  async function parseTearText(text, providedSecret = "") {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid TEAR file");
    if (parsed?.format !== "TEAR") {
      if (parsed && typeof parsed === "object") return parsed;
      throw new Error("Unsupported TEAR format");
    }

    if (typeof tearApi.parseEnvelope === "function") {
      const secret = providedSecret || ui.tearSecretInput?.value?.trim() || "";
      if (parsed.encrypted && !secret) throw new Error("TEAR secret required");
      return tearApi.parseEnvelope(parsed, secret);
    }

    if (parsed.encrypted) {
      const password = providedSecret || ui.tearSecretInput?.value?.trim() || prompt("Enter TEAR password:", "");
      if (!password) throw new Error("Import cancelled");
      const payloadText = await decryptTearPayload(parsed, password.trim());
      return JSON.parse(payloadText);
    }

    if (parsed?.payload && typeof parsed.payload === "object") {
      if (parsed.integrity?.payloadHash) {
        const digest = await sha256Hex(JSON.stringify(parsed.payload));
        if (digest !== parsed.integrity.payloadHash) throw new Error("TEAR payload hash mismatch");
      }
      return parsed.payload;
    }
    throw new Error("Invalid TEAR payload");
  }

  async function importTearFromText(text) {
    try {
      const next = await parseTearText(text, ui.tearSecretInput?.value?.trim() || "");
      const mode = ui.tearMergeMode?.value === "merge" ? "merge" : "replace";
      applyImportedState(next, mode);
      logLine(`TEAR imported (${mode})`);
      showToast("TEAR imported");
    } catch (err) {
      logLine(`TEAR import failed: ${err.message}`);
      showToast("TEAR import failed");
    }
  }

  function importTearFromFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      void importTearFromText(String(reader.result || ""));
    };
    reader.readAsText(file);
  }

  function previewTearMerge() {
    const file = ui.importTearFile.files?.[0];
    if (!file) {
      ui.tearPreviewOutput.textContent = "Choose a .tear file first.";
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const incoming = await parseTearText(String(reader.result || ""), ui.tearSecretInput?.value?.trim() || "");
        const preview = typeof panelApi.buildMergePreview === "function"
          ? panelApi.buildMergePreview(buildStatePayload(), incoming)
          : {
            currentSessions: state.sessions.length,
            incomingSessions: Array.isArray(incoming.sessions) ? incoming.sessions.length : 0,
            summary: "Preview ready"
          };
        ui.tearPreviewOutput.textContent = JSON.stringify(preview, null, 2);
      } catch (err) {
        ui.tearPreviewOutput.textContent = `Preview failed: ${err.message}`;
      }
    };
    reader.readAsText(file);
  }

  async function searchMemory() {
    if (!window.memoryBridge?.search) throw new Error("memory bridge unavailable");
    const query = ui.memoryQueryInput.value.trim();
    const rows = await window.memoryBridge.search(query, 50);
    ui.memoryOutput.textContent = JSON.stringify(rows, null, 2);
  }

  async function compactMemory() {
    if (!window.memoryBridge?.compact) throw new Error("memory bridge unavailable");
    const summary = await window.memoryBridge.compact(activeSessionId);
    ui.memoryOutput.textContent = JSON.stringify(summary || { ok: true, note: "Nothing to compact" }, null, 2);
  }

  function saveProfile() {
    const name = ui.profileNameInput.value.trim();
    if (!name) throw new Error("profile name required");
    profiles[name] = {
      createdAt: nowIso(),
      settings: {
        theme: ui.themeSelect.value,
        model: ui.modelSelect.value,
        temperature: Number(ui.temperatureInput.value) || DEFAULT_SETTINGS.temperature,
        systemPrompt: ui.systemPromptInput.value || "",
        autoGoal: ui.autoGoalInput.value || "",
        autoInterval: Math.max(5, Number(ui.autoIntervalInput.value) || 20)
      }
    };
    persistProfiles();
    renderProfiles();
    ui.profileSelect.value = name;
    logLine(`Profile saved: ${name}`);
  }

  function renderProfiles() {
    if (!ui.profileSelect) return;
    ui.profileSelect.innerHTML = "";
    for (const name of Object.keys(profiles).sort()) {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      ui.profileSelect.appendChild(option);
    }
  }

  function loadProfile() {
    const name = ui.profileSelect.value;
    if (!name || !profiles[name]) throw new Error("profile not found");
    state.settings = { ...state.settings, ...(profiles[name].settings || {}) };
    persist();
    renderSettings();
    logLine(`Profile loaded: ${name}`);
  }

  function deleteProfile() {
    const name = ui.profileSelect.value;
    if (!name || !profiles[name]) throw new Error("profile not found");
    delete profiles[name];
    persistProfiles();
    renderProfiles();
    logLine(`Profile deleted: ${name}`);
  }

  async function saveCheckpoint() {
    if (!window.checkpointBridge?.save) throw new Error("checkpoint bridge unavailable");
    const name = await window.checkpointBridge.save(buildStatePayload(), "manual");
    ui.checkpointOutput.textContent = `Saved: ${name}`;
  }

  async function listCheckpoints() {
    if (!window.checkpointBridge?.list) throw new Error("checkpoint bridge unavailable");
    const list = await window.checkpointBridge.list();
    ui.checkpointOutput.textContent = JSON.stringify(list, null, 2);
  }

  async function recoverCheckpoint() {
    if (!window.checkpointBridge?.latest || !window.checkpointBridge?.load) throw new Error("checkpoint bridge unavailable");
    const latest = await window.checkpointBridge.latest();
    if (!latest) {
      ui.checkpointOutput.textContent = "No checkpoints found";
      return;
    }
    const data = await window.checkpointBridge.load(latest);
    const payload = data?.state || data?.payload || data;
    applyImportedState(payload, "replace");
    ui.checkpointOutput.textContent = `Recovered: ${latest}`;
  }

  function bindStreamEvents() {
    if (!window.llmBridge?.onStreamEvent || detachStreamListener) return;
    detachStreamListener = window.llmBridge.onStreamEvent((event) => {
      if (!event || event.streamId !== currentStreamId) return;
      if (event.type === "chunk") {
        const session = state.sessions.find((s) => s.id === currentStreamSessionId);
        if (!session) return;
        const msg = session.messages[currentStreamMessageIndex];
        if (!msg) return;
        msg.content += String(event.chunk || "");
        msg.at = nowIso();
        session.updatedAt = nowIso();
        persist();
        renderChat();
      } else if (event.type === "end") {
        logLine(`Stream ended: ${currentStreamId}`);
        currentStreamId = null;
      } else if (event.type === "cancelled") {
        logLine(`Stream cancelled: ${currentStreamId}`);
        currentStreamId = null;
      } else if (event.type === "error") {
        logLine(`Stream error: ${event.error || "unknown"}`);
      }
    });
  }

  async function startStream() {
    if (!window.llmBridge?.streamStart) throw new Error("stream bridge unavailable");
    if (currentStreamId) throw new Error("stream already running");
    const text = ui.llmInput.value.trim();
    if (!text) throw new Error("message required");
    appendMessage("user", text);
    ui.llmInput.value = "";
    appendMessage("assistant", "");
    currentStreamSessionId = activeSessionId;
    currentStreamMessageIndex = activeSession().messages.length - 1;
    currentStreamId = `stream_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
    await window.llmBridge.streamStart({
      streamId: currentStreamId,
      payload: {
        model: ui.modelSelect.value,
        messages: buildMessagesForApi(),
        options: { temperature: state.settings.temperature }
      }
    });
    logLine(`Stream started: ${currentStreamId}`);
  }

  async function cancelStream() {
    if (!window.llmBridge?.streamCancel || !currentStreamId) return;
    await window.llmBridge.streamCancel(currentStreamId);
  }

  async function resumeStream() {
    if (!window.llmBridge?.streamResume || !currentStreamId) throw new Error("no stream to resume");
    await window.llmBridge.streamResume(currentStreamId);
    logLine(`Stream resumed: ${currentStreamId}`);
  }

  async function refreshPermissions() {
    if (!window.permissionBridge?.list) throw new Error("permission bridge unavailable");
    permissionCache = await window.permissionBridge.list();
    const audit = window.permissionBridge.audit ? await window.permissionBridge.audit(20) : [];
    ui.permissionsOutput.textContent = JSON.stringify({ permissions: permissionCache, audit }, null, 2);
  }

  async function togglePermission(key) {
    if (!window.permissionBridge?.set) throw new Error("permission bridge unavailable");
    if (!permissionCache) await refreshPermissions();
    await window.permissionBridge.set(key, !permissionCache[key]);
    await refreshPermissions();
  }

  async function refreshTelemetry() {
    if (!window.telemetryBridge?.get) throw new Error("telemetry bridge unavailable");
    const snapshot = await window.telemetryBridge.get();
    ui.telemetryOutput.textContent = JSON.stringify(snapshot, null, 2);
  }

  async function refreshAuthStatus() {
    if (!window.authBridge?.status) return;
    const status = await window.authBridge.status();
    if (status.needsSetup) {
      clearAuthLockInterval();
      setAuthLockedUi(0);
      ui.authOutput.textContent = "PIN setup required. Enter a new PIN and press Login.";
      return;
    }
    if (status.lockedUntil) {
      startAuthLockCountdown(status.lockedUntil);
      ui.authOutput.textContent = `Locked until ${formatTime(status.lockedUntil)}`;
      return;
    }
    clearAuthLockInterval();
    setAuthLockedUi(0);
    ui.authOutput.textContent = status.loggedIn ? `Logged in (${status.role})` : "Logged out";
  }

  async function authLogin() {
    if (!window.authBridge?.login) throw new Error("auth bridge unavailable");
    const pin = ui.authPinInput.value.trim();
    if (!pin) {
      ui.authOutput.textContent = "PIN required";
      return;
    }
    let status;
    try {
      status = await window.authBridge.login(pin);
    } catch (err) {
      const message = String(err?.message || "");
      if (/PIN setup required/i.test(message) && window.authBridge?.setupPin) {
        await window.authBridge.setupPin(pin, "admin");
        status = await window.authBridge.login(pin);
      } else if (/Account locked/i.test(message)) {
        ui.authOutput.textContent = message;
        logLine(`Auth lockout active: ${message}`);
        await refreshAuthStatus();
        return;
      } else if (/Invalid PIN/i.test(message)) {
        ui.authOutput.textContent = "Invalid PIN";
        return;
      } else {
        ui.authOutput.textContent = `Login failed: ${message || "Unknown error"}`;
        return;
      }
    }
    ui.authOutput.textContent = `Logged in (${status.role})`;
    clearAuthLockInterval();
    setAuthLockedUi(0);
  }

  async function authLogout() {
    if (!window.authBridge?.logout) throw new Error("auth bridge unavailable");
    await window.authBridge.logout();
    clearAuthLockInterval();
    setAuthLockedUi(0);
    ui.authOutput.textContent = "Logged out";
  }

  async function authRecoverPin() {
    if (!window.authBridge?.recoverPin) throw new Error("auth bridge unavailable");
    const pin = ui.authPinInput.value.trim();
    const confirmation = ui.authRecoverConfirmInput.value.trim();
    if (!pin) {
      ui.authOutput.textContent = "Enter a new PIN before recovery";
      return;
    }
    if (confirmation.toUpperCase() !== "RESET PIN") {
      ui.authOutput.textContent = "Type RESET PIN to confirm recovery";
      return;
    }
    await window.authBridge.recoverPin(pin, confirmation);
    clearAuthLockInterval();
    setAuthLockedUi(0);
    ui.authOutput.textContent = "PIN recovered. Log in with the new PIN.";
    ui.authRecoverConfirmInput.value = "";
  }

  async function vaultLoadSecret() {
    if (!window.vaultBridge?.getSecret) throw new Error("vault bridge unavailable");
    const secret = await window.vaultBridge.getSecret();
    ui.tearSecretInput.value = secret || "";
    ui.authOutput.textContent = secret ? "Vault secret loaded" : "Vault is empty";
  }

  async function vaultSaveSecret() {
    if (!window.vaultBridge?.setSecret) throw new Error("vault bridge unavailable");
    await window.vaultBridge.setSecret(ui.tearSecretInput.value);
    ui.authOutput.textContent = "Vault secret saved";
  }

  async function vaultClearSecret() {
    if (!window.vaultBridge?.clearSecret) throw new Error("vault bridge unavailable");
    await window.vaultBridge.clearSecret();
    ui.tearSecretInput.value = "";
    ui.authOutput.textContent = "Vault secret cleared";
  }

  async function syncPush() {
    if (!window.syncBridge?.push) throw new Error("sync bridge unavailable");
    const endpoint = ui.syncEndpointInput.value.trim();
    const token = ui.syncTokenInput.value.trim();
    const result = await window.syncBridge.push(endpoint, token, buildStatePayload());
    ui.syncOutput.textContent = JSON.stringify(result, null, 2);
  }

  async function syncPull() {
    if (!window.syncBridge?.pull) throw new Error("sync bridge unavailable");
    const endpoint = ui.syncEndpointInput.value.trim();
    const token = ui.syncTokenInput.value.trim();
    const result = await window.syncBridge.pull(endpoint, token);
    ui.syncOutput.textContent = JSON.stringify(result, null, 2);
    const payload = result?.payload || result?.state || result;
    if (payload?.sessions || payload?.settings || payload?.logs) {
      applyImportedState(payload, "merge");
      logLine("Pulled state merged");
    }
  }

  async function checkUpdate() {
    if (!window.updateBridge?.check) throw new Error("update bridge unavailable");
    const feedUrl = ui.updateFeedInput.value.trim();
    const result = await window.updateBridge.check(feedUrl);
    ui.updateOutput.textContent = JSON.stringify(result, null, 2);
  }

  function wireUi() {
    for (const id of REQUIRED_IDS) ui[id] = $(id);

    bindClick("connectBtn", pingLlm);
    bindClick("sendBtn", sendMessage);
    bindClick("retryBtn", retryLast);
    bindClick("clearChatBtn", clearChat);
    bindClick("exportChatBtn", exportActiveChat);
    bindClick("importChatBtn", () => ui.importChatFile.click());
    bindClick("newSessionBtn", createNewSession);
    bindClick("renameSessionBtn", renameSession);
    bindClick("duplicateSessionBtn", duplicateSession);
    bindClick("deleteSessionBtn", deleteSession);
    bindClick("clearLogsBtn", clearLogs);
    bindClick("exportLogsBtn", exportLogs);
    bindClick("clearHistoryBtn", clearAllHistory);
    bindClick("saveSettingsBtn", saveSettings);
    bindClick("runSelfTestBtn", runSelfTest);
    bindClick("runButtonAuditBtn", runButtonAudit);
    bindClick("toggleAutoBtn", toggleAutonomous);
    bindClick("generateCodeBtn", generateCode);
    bindClick("copyCodeBtn", copyCode);
    bindClick("exportCodeBtn", exportCode);
    bindClick("exportTearBtn", exportTear);
    bindClick("importTearBtn", () => ui.importTearFile.click());
    bindClick("previewTearBtn", previewTearMerge);
    bindClick("clearTearSecretBtn", () => {
      ui.tearSecretInput.value = "";
      ui.tearHintInput.value = "";
      ui.tearPreviewOutput.textContent = "";
    });
    bindClick("memorySearchBtn", searchMemory);
    bindClick("memoryCompactBtn", compactMemory);
    bindClick("saveProfileBtn", saveProfile);
    bindClick("loadProfileBtn", loadProfile);
    bindClick("deleteProfileBtn", deleteProfile);
    bindClick("saveCheckpointBtn", saveCheckpoint);
    bindClick("listCheckpointsBtn", listCheckpoints);
    bindClick("recoverCheckpointBtn", recoverCheckpoint);
    bindClick("startStreamBtn", startStream);
    bindClick("cancelStreamBtn", cancelStream);
    bindClick("resumeStreamBtn", resumeStream);
    bindClick("refreshPermissionsBtn", refreshPermissions);
    bindClick("toggleAutoPermBtn", () => togglePermission("autoMode"));
    bindClick("toggleStreamPermBtn", () => togglePermission("llmStream"));
    bindClick("refreshTelemetryBtn", refreshTelemetry);
    bindClick("authLoginBtn", authLogin);
    bindClick("authLogoutBtn", authLogout);
    bindClick("authRecoverBtn", authRecoverPin);
    bindClick("vaultLoadSecretBtn", vaultLoadSecret);
    bindClick("vaultSaveSecretBtn", vaultSaveSecret);
    bindClick("vaultClearSecretBtn", vaultClearSecret);
    bindClick("syncPushBtn", syncPush);
    bindClick("syncPullBtn", syncPull);
    bindClick("checkUpdateBtn", checkUpdate);

    ui.importChatFile.addEventListener("change", () => importChatFromFile(ui.importChatFile.files?.[0]));
    ui.importTearFile.addEventListener("change", () => importTearFromFile(ui.importTearFile.files?.[0]));
    ui.tearRevealToggle.addEventListener("change", () => {
      ui.tearSecretInput.type = ui.tearRevealToggle.checked ? "text" : "password";
    });
    ui.sessionSearchInput.addEventListener("input", renderSessions);
    ui.llmInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void sendMessage();
      }
    });
    ui.themeSelect.addEventListener("change", () => {
      document.body.setAttribute("data-theme", ui.themeSelect.value);
    });
  }

  function bootstrap() {
    ensureSession();
    activeSessionId = state.activeSessionId;
    wireUi();
    renderSettings();
    renderProfiles();
    renderSessions();
    renderChat();
    renderLogs();
    renderClock();
    setInterval(renderClock, 1000);
    bindStreamEvents();
    if (window.autonomousBridge?.onTick) {
      detachAutoListener = window.autonomousBridge.onTick((tick) => {
        void runAutonomousStep(tick);
      });
      window.autonomousBridge.status()
        .then((s) => {
          autonomousRunning = Boolean(s?.running);
          ui.toggleAutoBtn.textContent = autonomousRunning ? "Stop Auto" : "Start Auto";
        })
        .catch(() => {});
    }
    void refreshPermissions().catch(() => {});
    void refreshTelemetry().catch(() => {});
    void refreshAuthStatus().catch(() => {});
    runSelfTest();
    logLine("Renderer initialized");
  }

  window.addEventListener("beforeunload", () => {
    clearAuthLockInterval();
    if (typeof detachAutoListener === "function") detachAutoListener();
    if (typeof detachStreamListener === "function") detachStreamListener();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();
