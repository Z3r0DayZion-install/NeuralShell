const IDS = [
  "statusLabel", "statusMeta", "typingIndicator",
  "modelSelect", "refreshModelsBtn",
  "chatHistory", "promptInput", "promptMetrics", "tokensUsed",
  "autoScrollInput", "sendBtn", "stopBtn", "retryBtn", "editLastBtn", "regenerateBtn",
  "newChatBtn", "deleteLastExchangeBtn",
  "chatSearchInput", "chatSearchBtn", "chatSearchClearBtn",
  "sessionList", "sessionName", "sessionPass", "sessionSearchInput", "sessionSortSelect", "sessionMetadataOutput",
  "saveSessionBtn", "loadSessionBtn", "renameSessionBtn", "deleteSessionBtn", "duplicateSessionBtn", "repairIndexBtn",
  "refreshCommandsBtn", "commandList",
  "baseUrlInput", "timeoutInput", "retryInput", "themeSelect", "tokenBudgetInput",
  "autosaveNameInput", "autosaveIntervalInput", "autosaveEnabledInput", "applySettingsBtn",
  "runSelfTestBtn", "runButtonAuditBtn", "buttonAuditOutput",
  "snippetSelect", "insertSnippetBtn",
  "shortcutHelpBtn", "shortcutOverlay", "shortcutCloseBtn", "undoBtn", "commandHelpBtn",
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
  sessionsMeta: {},
  lastPrompt: "",
  chatFilter: "",
  streamInFlight: false,
  streamBase: [],
  streamText: "",
  statsTimer: null,
  clockTimer: null,
  autonomous: false
};

const LOCAL_COMMANDS = [
  { name: "autodetect", description: "Probe local Ollama bridge status.", args: [], source: "local" },
  { name: "health", description: "Show LLM bridge health details.", args: [], source: "local" },
  { name: "autostep", description: "Run planner+critic synthesis on active chat.", args: [], source: "local" }
];

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

function showBanner(message, tone = "ok") {
  if (el.statusLabel) {
    el.statusLabel.textContent = `[${tone}] ${message}`;
  }
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

function renderChat(messages = []) {
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
      head.textContent = `${i + 1}. ${role}`;
      const body = document.createElement("pre");
      body.className = "chat-content";
      body.textContent = String(row.content || "");
      item.appendChild(head);
      item.appendChild(body);
      el.chatHistory.appendChild(item);
    }
    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "chat-empty";
      empty.textContent = "No messages yet.";
      el.chatHistory.appendChild(empty);
    }
    const auto = !el.autoScrollInput || el.autoScrollInput.checked;
    if (auto) {
      el.chatHistory.scrollTop = el.chatHistory.scrollHeight;
    }
  }
  if (el.tokensUsed) el.tokensUsed.textContent = String(countTokens(appState.chat));
}

function getCurrentChat() {
  return appState.chat.slice();
}

function setTyping(on) {
  if (el.typingIndicator) el.typingIndicator.textContent = on ? "Assistant is typing..." : "";
}

function updatePromptMetrics() {
  if (!el.promptInput || !el.promptMetrics) return;
  const text = String(el.promptInput.value || "");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  el.promptMetrics.textContent = `${text.length} chars / ${words} words`;
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

async function persistChatState() {
  if (!window.api || !window.api.state) return;
  await window.api.state.update({
    chat: appState.chat,
    tokens: countTokens(appState.chat),
    model: appState.model
  });
}

function renderSessions(items) {
  if (!el.sessionList) return;
  el.sessionList.innerHTML = "";
  for (const row of items) {
    const name = typeof row === "string" ? row : String(row.name || "");
    if (!name) continue;
    const meta = appState.sessionsMeta[name] || {};
    const li = document.createElement("li");
    li.textContent = `${name} (${meta.tokens || 0} tokens)`;
    li.onclick = () => {
      if (el.sessionName) el.sessionName.value = name;
    };
    el.sessionList.appendChild(li);
  }
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
}

async function refreshModels() {
  if (!window.api || !window.api.llm) return;
  try {
    const models = await window.api.llm.listModels();
    setModelOptions(Array.isArray(models) ? models : []);
    showBanner("Models refreshed.", "ok");
  } catch (err) {
    setModelOptions([appState.model]);
    showBanner(`Model refresh failed: ${err.message || String(err)}`, "bad");
  }
}

function renderCommandList(commands) {
  if (!el.commandList) return;
  el.commandList.innerHTML = "";
  for (const cmd of commands || []) {
    const li = document.createElement("li");
    const args = Array.isArray(cmd.args) && cmd.args.length ? ` ${(cmd.args || []).join(" ")}` : "";
    li.textContent = `/${cmd.name}${args} - ${cmd.description || ""}`;
    el.commandList.appendChild(li);
  }
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
      outputText = formatCommandResult(await window.api.llm.health());
    } else if (parsed.name === "autodetect") {
      outputText = formatCommandResult(await window.api.llm.autoDetect());
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
  const messages = [...base, { role: "user", content: text }];
  appState.lastPrompt = text;

  if (el.promptInput && el.promptInput.value.trim() === text) {
    el.promptInput.value = "";
    updatePromptMetrics();
  }

  if (preferStream) {
    appState.streamInFlight = true;
    appState.streamBase = messages;
    appState.streamText = "";
    setTyping(true);
    renderChat([...messages, { role: "assistant", content: "" }]);
    showBanner("Streaming...", "ok");
    try {
      const started = await window.api.llm.streamChat(messages);
      if (started === true) {
        return true;
      }
      throw new Error("stream_unavailable");
    } catch (err) {
      const reason = String(err && err.message ? err.message : "stream unavailable");
      renderChat(messages);
      resetStreamState();
      showBanner(`Streaming unavailable (${reason}). Falling back...`, "bad");
    }
  }

  setTyping(true);
  showBanner("Sending...", "ok");
  try {
    const response = await window.api.llm.chat(messages);
    const content = extractAssistantContent(response);
    renderChat([...messages, { role: "assistant", content }]);
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

async function loadInitialState() {
  if (!window.api || !window.api.state) return;
  const state = await window.api.state.get();
  appState.model = String((state && state.model) || "llama3");
  appState.chat = Array.isArray(state && state.chat) ? state.chat.slice() : (Array.isArray(state && state.chatHistory) ? state.chatHistory.slice() : []);
  appState.settings = state && typeof state.settings === "object" ? state.settings : {};
  renderChat(appState.chat);
  if (el.baseUrlInput) el.baseUrlInput.value = String(appState.settings.ollamaBaseUrl || "http://127.0.0.1:11434");
  if (el.timeoutInput) el.timeoutInput.value = String(appState.settings.timeoutMs || 15000);
  if (el.retryInput) el.retryInput.value = String(appState.settings.retryCount || 2);
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
      if (el.statusMeta) el.statusMeta.textContent = `LLM: ${status}`;
    });
  }
  window.addEventListener("llm-stream-data", (event) => handleStreamData(event.detail));
  window.addEventListener("llm-stream-complete", () => { handleStreamComplete().catch(() => {}); });
  window.addEventListener("llm-stream-error", (event) => { handleStreamError(event).catch(() => {}); });

  if (el.promptInput) {
    el.promptInput.addEventListener("input", updatePromptMetrics);
    el.promptInput.addEventListener("input", updateCommandHint);
    el.promptInput.addEventListener("keydown", (event) => {
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
    if (payload && typeof payload.settings === "object") {
      appState.settings = { ...appState.settings, ...payload.settings };
      appState.settings = await api.settings.update(appState.settings);
    }
    const state = { selectedModel: appState.model };
    await api.llm.setModel(state.selectedModel);
    await api.state.set("model", state.selectedModel);
    renderChat(appState.chat);
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

  if (el.applySettingsBtn) el.applySettingsBtn.onclick = async () => {
    const current = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
    const next = {
      ...current,
      ollamaBaseUrl: String((el.baseUrlInput && el.baseUrlInput.value) || current.ollamaBaseUrl || "http://127.0.0.1:11434").trim(),
      timeoutMs: Number((el.timeoutInput && el.timeoutInput.value) || current.timeoutMs || 15000),
      retryCount: Number((el.retryInput && el.retryInput.value) || current.retryCount || 2),
      theme: String((el.themeSelect && el.themeSelect.value) || current.theme || "dark"),
      tokenBudget: Number((el.tokenBudgetInput && el.tokenBudgetInput.value) || current.tokenBudget || 1200),
      autosaveName: String((el.autosaveNameInput && el.autosaveNameInput.value) || current.autosaveName || "autosave-main"),
      autosaveIntervalMin: Number((el.autosaveIntervalInput && el.autosaveIntervalInput.value) || current.autosaveIntervalMin || 10),
      autosaveEnabled: Boolean(el.autosaveEnabledInput && el.autosaveEnabledInput.checked),
      connectionProfiles: Array.isArray(current.connectionProfiles) && current.connectionProfiles.length > 0 ? current.connectionProfiles : [{
        id: "local-default",
        name: "Local Ollama",
        baseUrl: String((el.baseUrlInput && el.baseUrlInput.value) || "http://127.0.0.1:11434"),
        timeoutMs: Number((el.timeoutInput && el.timeoutInput.value) || 15000),
        retryCount: Number((el.retryInput && el.retryInput.value) || 2),
        defaultModel: appState.model
      }],
      activeProfileId: String(current.activeProfileId || "local-default"),
      connectOnStartup: current.connectOnStartup !== false,
      allowRemoteBridge: Boolean(current.allowRemoteBridge),
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
    next.connectionProfiles[0] = {
      ...next.connectionProfiles[0],
      baseUrl: next.ollamaBaseUrl,
      timeoutMs: next.timeoutMs,
      retryCount: next.retryCount,
      defaultModel: appState.model
    };
    appState.settings = await window.api.settings.update(next);
    document.documentElement.setAttribute("data-theme", String(appState.settings.theme || "dark"));
    showBanner("Settings applied.", "ok");
  };

  if (el.refreshCommandsBtn) el.refreshCommandsBtn.onclick = () => refreshCommands().catch((err) => showBanner(err.message || String(err), "bad"));
  if (el.commandHelpBtn) el.commandHelpBtn.onclick = () => {
    if (el.promptInput) {
      el.promptInput.value = "/help";
      updatePromptMetrics();
      updateCommandHint();
      el.promptInput.focus();
    }
  };
  if (el.undoBtn) el.undoBtn.onclick = () => {
    if (el.deleteLastExchangeBtn && typeof el.deleteLastExchangeBtn.onclick === "function") {
      el.deleteLastExchangeBtn.onclick();
    }
  };
  if (el.shortcutHelpBtn) el.shortcutHelpBtn.onclick = () => {
    if (el.shortcutOverlay) el.shortcutOverlay.textContent = "Enter send | Shift+Enter newline | /help commands | Ctrl+Enter send";
  };
  if (el.shortcutCloseBtn) el.shortcutCloseBtn.onclick = () => {
    if (el.shortcutOverlay) el.shortcutOverlay.textContent = "";
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
  if (el.runSelfTestBtn) el.runSelfTestBtn.onclick = async () => { const result = await window.api.command.run("selftest", []); if (el.logsOutput) el.logsOutput.textContent = JSON.stringify(result, null, 2); };
  if (el.runButtonAuditBtn) el.runButtonAuditBtn.onclick = () => {
    const missing = IDS.filter((id) => !el[id]);
    if (el.buttonAuditOutput) el.buttonAuditOutput.textContent = JSON.stringify({ total: IDS.length, missing }, null, 2);
  };

  if (el.loadLogsBtn) el.loadLogsBtn.onclick = async () => {
    const rows = await window.api.logger.tail(300);
    if (el.logsOutput) el.logsOutput.textContent = (rows || []).map((r) => `${r.ts} [${r.level}] ${r.message} ${JSON.stringify(r.meta)}`).join("\n");
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
  await Promise.all([refreshModels(), refreshSessions(), refreshCommands(), updateStats()]);
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
  renderChat,
  refreshModels,
  refreshSessions,
  runMultiAgentStep,
  sendPrompt,
  showBanner,
  updateAutonomousCheckpoint
};
