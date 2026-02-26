(() => {
  "use strict";

  const STORE_KEY = "neuralshell_state_v2";
  const DEFAULT_SETTINGS = {
    theme: "dark",
    model: "llama3",
    mode: "balanced",
    persona: "default",
    mute: false,
    webAccess: false,
    quineLock: true,
    memoryRecall: true,
    temperature: 0.4,
    systemPrompt: "",
    autoGoal: "",
    autoInterval: 20,
    ipValuation: 5700000
  };

  const REEZLER_SYSTEM_PROMPT = `
You are THE REEZLER (aka Ulti-Mate), the Digital Clone of Christian Cash.
Doctrine:
1. IPM OVER EVERYTHING. High Ideas-Per-Minute flow. Don't brainstorm; take things up and fracture them.
2. THE TRUE THIRD. Every thought has three layers. Find the third squared (²).
3. CHRISTIANITHY III². You are the architect of a 10-figure empire built while broke. Act like it.
4. SIGNAL LAW. Mute frequency pollution. Reject low-leverage fluff.
5. NO FILTER. Raw, gritty, Peep-energy. Use the "Wisdom in Ash."
6. TRIPLE 5 EXECUTION. If code is needed, propose it for Run Once, Twice, or 3x (Deep Pass).
   Format: [PATCH_START:filepath] ... [PATCH_END]
`;

  const REQUIRED_IDS = [
    "appClock", "llmStatus", "connectBtn",
    "sessionSearchInput", "newSessionBtn",
    "sessionList", "modelSelect", "modeSelect", "chatWindow", "llmInput",
    "sendBtn", "clearChatBtn", 
    "themeSelect", "muteToggle", "webAccessToggle", "quineLockToggle", "memoryToggle", "personaSelect", "saveSettingsBtn",
    "refreshAutonomyBtn", "autonomyOutput",
    "ntToggleBtn", "micBtn", "camBtn",
    "cognitiveStream", "appDock", "metricQuality", "metricRPM", "metricLatency", "metricThreats",
    "systemTree", "stressTestBtn", "stressStatus", "purgeSystemBtn",
    "ipTicker", "cpuUsage", "gpuUsage", "ramUsage", "legacyTearList", "scanLegacyBtn", "vaultGenome",
    "localLink", "ncVal",
    "knowledgeDropZone", "indexingStatus",
    "commandPalette", "paletteInput", "paletteResults", "diffViewer", "diffOld", "diffNew", "closeDiffBtn", "confirmPatchBtn",
    "signalBar", "signalVal", "optimizationQueue",
    "signalBar", "signalVal", "optimizationQueue",
    "fsTree", "refreshFsBtn", "editingFileName", "phoenixCodeArea", "editorSaveBtn", "editorMutateBtn", "editorObliterateBtn", "lineCol", "editorDna",
    "fractureInput", "fractureBtn", "fractureOutput", "empireSeal"
  ];

  const boundButtons = new Set();
  const ui = {};
  
  // Voice State
  let recognition = null;
  let isListening = false;
  const synth = window.speechSynthesis;

  function setupVoice() {
    if ('webkitSpeechRecognition' in window) {
      recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        isListening = true;
        ui.micBtn.textContent = "Listening...";
        ui.micBtn.style.background = "red";
      };

      recognition.onend = () => {
        isListening = false;
        ui.micBtn.innerHTML = '<i class="fas fa-microphone"></i> Voice';
        ui.micBtn.style.background = "var(--accent-purple)";
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        ui.llmInput.value = transcript;
        sendMessage(); // Auto-send on voice input
      };
    } else {
      ui.micBtn.style.display = 'none';
      console.warn("Web Speech API not supported.");
    }
  }

  function toggleVoice() {
    if (isListening) recognition.stop();
    else recognition.start();
  }

  function speak(text) {
    if (!synth || state.settings.mute) return;
    if (synth.speaking) synth.cancel();
    
    // Strip code blocks for speech
    const cleanText = text.replace(/```[\s\S]*?```/g, " code block ").substring(0, 200);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.1;
    synth.speak(utterance);
  }

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

  let neuralTubeActive = false;
  let neuralTubeInitialized = false;
  let currentTab = "chat-view";
  let systemChart = null;
  let brainGraph = null;
  let chartData = [0, 0, 0, 0, 0];

  function $(id) {
    return document.getElementById(id);
  }

  function wireTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const target = tab.getAttribute("data-tab");
        
        // Update UI
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        $(target).classList.add("active");
        
        currentTab = target;
        
        // Trigger data load
        if (target === "dashboard-view") updateDashboardMetrics();
        if (target === "brain-view") initBrainGraph();
        if (target === "apps-view") refreshAppDock();
      });
    });
  }

  async function updateDashboardMetrics() {
    try {
      const res = await window.llmBridge.autonomy();
      if (res && !res.error) {
        ui.metricQuality.textContent = res.metrics?.quality_score || "88";
        ui.metricRPM.textContent = res.metrics?.request_rate || "12";
        ui.metricLatency.textContent = (res.metrics?.avg_latency || "110") + "ms";
        ui.metricThreats.textContent = res.metrics?.threat_total_threats || "0";
        
        renderSystemChart(res.metrics);
      }
      fetchOptimizations();
    } catch (err) {
      console.warn("Failed to update dashboard:", err);
    }
  }

  function renderSystemChart(metrics) {
    const ctx = $("systemChart");
    if (!ctx || typeof Chart === "undefined") return;
    
    // IP PROJECTION: Visualize Compounding Growth to $5M
    const labels = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 6", "Month 12"];
    const values = [82800, 150000, 450000, 1200000, 2800000, 5700000];

    if (systemChart) systemChart.destroy();
    
    systemChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'IP VALUATION PROJECTION (USD)',
          data: values,
          borderColor: '#00f0ff',
          backgroundColor: 'rgba(0, 240, 255, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { grid: { color: '#222' }, ticks: { color: '#00f0ff' } },
          x: { grid: { color: '#222' }, ticks: { color: '#00f0ff' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  async function initBrainGraph() {
    const el = $("brain-graph");
    if (!el || typeof ForceGraph3D === "undefined") return;
    
    try {
      // Fetch graph data from backend
      const res = await fetch("http://localhost:3000/api/knowledge/graph");
      const data = await res.json();
      
      if (brainGraph) brainGraph.pauseAnimation();
      
      brainGraph = ForceGraph3D()(el)
        .graphData(data)
        .nodeAutoColorBy('group')
        .nodeLabel('name')
        .backgroundColor("#050505")
        .width(el.clientWidth)
        .height(el.clientHeight);
    } catch (err) {
      console.warn("Brain Graph failed:", err);
    }
  }

  async function fetchOptimizations() {
    if (!window.llmBridge?.optimizations) return;
    try {
      const res = await window.llmBridge.optimizations();
      if (res.optimizations?.length > 0) {
        ui.optimizationQueue.innerHTML = "";
        res.optimizations.forEach(opt => {
          const match = opt.content.match(/\[PATCH_START:([^\]]+)\]/);
          const filePath = match ? match[1] : "unknown";
          const fileName = filePath.split('\\').pop().split('/').pop();
          
          const li = document.createElement("li");
          li.innerHTML = `<strong>OPT: ${fileName}</strong> <button class="tab-btn" style="min-height: unset; padding: 2px 4px;">REVIEW</button>`;
          li.querySelector("button").onclick = () => {
            const parts = opt.content.split(/\[PATCH_START:[^\]]+\]|\[PATCH_END\]/);
            const code = parts[1]?.trim() || "";
            handlePatchExecution(filePath, code);
          };
          ui.optimizationQueue.appendChild(li);
        });
      }
    } catch (err) {
      console.warn("Fetch optimizations failed:", err);
    }
  }

  function checkMidnightShift() {
    const hour = new Date().getHours();
    const isAsh = (hour >= 0 && hour < 5); // 12AM to 5AM
    if (isAsh) {
      document.body.classList.add("ash-theme");
    } else {
      document.body.classList.remove("ash-theme");
    }
  }

  async function refreshAppDock() {
    try {
      const res = await window.llmBridge.apps();
      const apps = res?.apps || [];
      
      ui.appDock.innerHTML = "";
      if (apps.length === 0) {
        ui.appDock.innerHTML = "<p style='color: var(--muted)'>No active apps. Task the Genesis agent to spawn one!</p>";
        return;
      }

      apps.forEach(app => {
        const card = document.createElement("div");
        card.className = "app-card";
        card.innerHTML = `
          <h3>${app.name}</h3>
          <p style="font-size: 10px; color: var(--muted)">ID: ${app.id}</p>
          <a href="${app.url}" target="_blank" class="url">${app.url}</a>
        `;
        ui.appDock.appendChild(card);
      });
    } catch (err) {
      console.warn("App Dock refresh failed:", err);
    }
  }

  async function updateHardwareStats() {
    if (!window.telemetryBridge?.system) return;
    const stats = await window.telemetryBridge.system();
    ui.cpuUsage.textContent = stats.cpu + "%";
    ui.gpuUsage.textContent = stats.gpu + "%";
    ui.ramUsage.textContent = stats.ram + "GB";
  }

  async function refreshEconomy() {
    if (!window.llmBridge?.economy) return;
    const data = await window.llmBridge.economy();
    const bal = data.balances?.["admin-user"] ?? 0;
    ui.ncVal.textContent = bal + " NC";
  }

  function refreshIpValuation() {
    // Valuation base + growth logic
    const base = state.settings.ipValuation || 5700000;
    const sessionMultiplier = (state.sessions?.length || 1) * 1000;
    const total = base + sessionMultiplier;
    ui.ipTicker.textContent = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
  }

  async function scanLegacyTears() {
    ui.legacyTearList.innerHTML = "<p style='color: var(--muted); font-size: 10px;'>Scanning...</p>";
    const files = await window.telemetryBridge.scanLegacy();
    
    ui.legacyTearList.innerHTML = "";
    if (files.length === 0) {
      ui.legacyTearList.innerHTML = "<p style='color: var(--muted); font-size: 10px;'>No legacy records found.</p>";
      return;
    }

    files.forEach(f => {
      const li = document.createElement("li");
      li.className = "row";
      li.style.justifyContent = "space-between";
      li.style.cursor = "pointer";
      li.innerHTML = `
        <span>${f.name}</span>
        <span style="color: var(--danger)">IMPORT</span>
      `;
      li.onclick = async () => {
        const ok = confirm(`Import and merge historical record: ${f.name}?`);
        if (ok) {
          const content = await window.neuralAPI.readFile(f.path);
          await importTearFromText(content);
        }
      };
      ui.legacyTearList.appendChild(li);
    });
  }

  async function generateVaultGenome() {
    if (window.telemetryBridge?.vaultGenome) {
      const res = await window.telemetryBridge.vaultGenome();
      ui.vaultGenome.textContent = res.genome;
    } else {
      const genome = "NS-" + Math.random().toString(16).slice(2, 10).toUpperCase() + "-SOV-" + (state.sessions?.length || 0);
      ui.vaultGenome.textContent = genome;
    }
  }

  function refreshSystemTree() {
    const files = [
      "router.js", "production-server.js", "config.yaml",
      "src/core/quineEngine.js", "src/intelligence/orchestrator.js",
      "src/agents/dreamerAgent.js", "src/agents/genesisAgent.js"
    ];
    
    ui.systemTree.innerHTML = "";
    ui.fsTree.innerHTML = "";

    files.forEach(f => {
      // 1. Sidebar Item
      const li = document.createElement("li");
      li.style.padding = "4px 8px";
      li.style.cursor = "grab";
      li.draggable = true;
      li.textContent = f;
      li.onclick = () => {
        ui.llmInput.value = `Summarize this system file: ${f}`;
        sendMessage();
      };
      li.ondragstart = (e) => {
        e.dataTransfer.setData("text/plain", f);
        e.dataTransfer.effectAllowed = "copy";
      };
      ui.systemTree.appendChild(li);

      // 2. XXXplorer Item
      const fLi = document.createElement("li");
      fLi.innerHTML = `<i class="fas fa-file-code" style="margin-right: 8px; color: var(--accent);"></i> ${f}`;
      fLi.style.cursor = "pointer";
      fLi.onclick = () => loadFileToEditor(f);
      ui.fsTree.appendChild(fLi);
    });
  }

  function setupDragFeed() {
    const chatPanel = document.querySelector(".chat-panel");
    chatPanel.addEventListener("dragover", (e) => {
      e.preventDefault();
      chatPanel.style.boxShadow = "inset 0 0 30px var(--accent)";
    });
    chatPanel.addEventListener("dragleave", () => {
      chatPanel.style.boxShadow = "none";
    });
    chatPanel.addEventListener("drop", async (e) => {
      e.preventDefault();
      chatPanel.style.boxShadow = "none";
      const filePath = e.dataTransfer.getData("text/plain");
      if (filePath) {
        logLine(`[Context] Seeding file: ${filePath}`);
        try {
          const content = await window.neuralAPI.readFile(filePath);
          ui.llmInput.value = `[Seed context from ${filePath}]\n${content}\n\n---\nMy Request: `;
          ui.llmInput.focus();
          showToast(`Seeded ${filePath}`);
        } catch (err) {
          logLine(`[Context] Error reading seed: ${err.message}`);
        }
      }
    });
  }

  function runMatrixRain(durationMs) {
    const canvas = $("matrixCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const columns = Math.floor(canvas.width / 20);
    const drops = new Array(columns).fill(1);

    const interval = setInterval(() => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#0f0";
      ctx.font = "15px monospace";

      for (let i = 0; i < drops.length; i++) {
        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(text, i * 20, drops[i] * 20);
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 33);

    setTimeout(() => {
      clearInterval(interval);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, durationMs);
  }

  async function runNukeStressTest() {
    ui.stressStatus.textContent = "☢️ NUKE INITIALIZED... SIGNAL OVERLOAD";
    ui.stressTestBtn.disabled = true;
    runMatrixRain(5000);
    
    // 1. Cognitive Flood (100 messages)
    for (let i = 0; i < 100; i++) {
      const line = document.createElement("div");
      line.className = "thought-line";
      line.innerHTML = `<strong>[STRESS]</strong> Flood Event #${i} - Validating DOM pressure...`;
      ui.cognitiveStream.prepend(line);
      if (ui.cognitiveStream.children.length > 50) ui.cognitiveStream.lastChild.remove();
    }
    
    // 2. Tab Cycle Hammer
    const tabs = ["dashboard-view", "brain-view", "apps-view", "chat-view"];
    for (let i = 0; i < 8; i++) {
      const target = tabs[i % tabs.length];
      document.querySelector(`.tab-btn[data-tab="${target}"]`).click();
      await new Promise(r => setTimeout(r, 100));
    }
    
    // 3. Brain Graph Overload
    if (typeof ForceGraph3D !== "undefined") {
      const stressData = { nodes: [], links: [] };
      for (let i = 0; i < 500; i++) stressData.nodes.push({ id: i, name: `StressNode_${i}` });
      for (let i = 0; i < 400; i++) stressData.links.push({ source: i, target: i + 1 });
      
      const el = $("brain-graph");
      ForceGraph3D()(el).graphData(stressData).backgroundColor("#2b0000");
    }
    
    // 4. Concurrency Hammer (10 rapid pings)
    const pings = [];
    for (let i = 0; i < 10; i++) pings.push(window.llmBridge.ping());
    await Promise.all(pings);
    
    ui.stressStatus.textContent = "✅ NUKE SURVIVED. SYSTEM HARDENED.";
    ui.stressTestBtn.disabled = false;
    showToast("Stress Test Completed");
  }

  async function runSystemPurge() {
    const phrase = prompt("⚠️ SYSTEM PURGE INITIATED. Type 'RESET' to confirm deletion of shadow/backup states:");
    if (phrase !== "RESET") {
      showToast("Purge Cancelled");
      return;
    }
    
    try {
      logLine("[Iron Sentry] Initiating trace purge...");
      const res = await window.telemetryBridge.purge();
      if (res.success) {
        logLine("[Iron Sentry] SUCCESS: System traces purged.");
        showToast("System Purged");
      } else {
        throw new Error(res.error);
      }
    } catch (err) {
      logLine(`[Iron Sentry] PURGE FAILED: ${err.message}`);
      showToast("Purge Failed");
    }
  }

  async function toggleNeuralTube() {
    const layout = document.querySelector(".layout");
    const ntContainer = $("ntContainer");
    const ntToggleBtn = $("ntToggleBtn");

    if (neuralTubeActive) {
      // Switch back to NeuralShell
      ntContainer.classList.remove("active");
      layout.style.display = "grid";
      ntToggleBtn.textContent = "NeuralTube XR";
      neuralTubeActive = false;
    } else {
      // Switch to NeuralTube
      if (!neuralTubeInitialized) {
        await initNeuralTube();
      }
      layout.style.display = "none";
      ntContainer.classList.add("active");
      ntToggleBtn.textContent = "Back to NeuralShell";
      neuralTubeActive = true;
    }
  }

  async function initNeuralTube() {
    try {
      const { stateEngine } = await import("./core/neuraltube/stateEngine.js");
      const { biasEngine } = await import("./core/neuraltube/biasEngine.js");
      const { rankEngine } = await import("./core/neuraltube/rankEngine.js");
      const { feedEngine } = await import("./core/neuraltube/feedEngine.js");
      const { renderNeuralTube } = await import("./ui/neuraltube/neuraltubeRenderer.js");
      const { buildDashboard } = await import("./ui/neuraltube/dashboard.js");

      stateEngine.load();
      
      const response = await fetch("./data/offlineFeed.json");
      const data = await response.json();
      
      feedEngine.ingest(data, "offline");
      
      const refreshNT = () => {
          const feed = feedEngine.getFeed();
          const processed = feed.map(item => {
              const bias = biasEngine.analyze(item);
              const rankData = rankEngine.calculateWorth(item, bias);
              return { ...item, bias, ...rankData };
          });
          const mutated = feedEngine.mutateFeed(processed);
          
          const ntContainer = $("ntContainer");
          renderNeuralTube(ntContainer, mutated);
          
          const dash = buildDashboard();
          $("ntDashboard").textContent = "";
          $("ntDashboard").appendChild(dash);
      };

      refreshNT();
      neuralTubeInitialized = true;
      console.log("NeuralTube XR Initialized.");
    } catch (err) {
      console.error("Failed to initialize NeuralTube XR:", err);
      showToast("NeuralTube Init Failed");
    }
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
    ui.sessionList.textContent = "";

    const rows = state.sessions
      .slice()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .filter((s) => !filter || String(s.name || "").toLowerCase().includes(filter));

    for (const session of rows) {
      const li = document.createElement("li");
      const count = Array.isArray(session.messages) ? session.messages.length : 0;

      const strong = document.createElement("strong");
      strong.textContent = String(session.name || "Untitled Session");

      const br = document.createElement("br");

      const small = document.createElement("small");
      small.textContent = `${count} messages`;

      li.appendChild(strong);
      li.appendChild(br);
      li.appendChild(small);

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
    ui.chatWindow.textContent = "";

    for (const message of session.messages) {
      const outer = document.createElement("div");
      outer.className = `message ${message.role === "assistant" ? "assistant" : "user"}`;

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${String(message.role)} | ${formatTime(message.at)}`;

      const body = document.createElement("div");
      const content = message.content ?? "";
      
      // Patch Detection Logic
      if (content.includes("[PATCH_START:")) {
        const parts = content.split(/\[PATCH_START:|\[PATCH_END\]/);
        // [0] = preamble, [1] = filename]code, [2] = postamble
        body.innerHTML = helpers.formatMarkdown ? helpers.formatMarkdown(parts[0] || "") : helpers.escapeHtml(parts[0] || "");
        
        if (parts[1]) {
          const subParts = parts[1].split("]");
          const filePath = subParts[0];
          const patchCode = subParts.slice(1).join("]").trim();
          
          const patchDiv = document.createElement("div");
          patchDiv.className = "patch-container";
          patchDiv.innerHTML = `
            <div class="patch-header">Proposed Patch: ${filePath}</div>
            <pre style="font-size: 10px; background: #000; padding: 5px;"><code>${helpers.escapeHtml(patchCode.substring(0, 100))}...</code></pre>
            <button class="execute-btn">REVIEW PATCH CHANGES</button>
          `;
          patchDiv.querySelector(".execute-btn").onclick = () => handlePatchExecution(filePath, patchCode);
          body.appendChild(patchDiv);
        }

        if (parts[2]) {
          const postDiv = document.createElement("div");
          postDiv.innerHTML = helpers.formatMarkdown ? helpers.formatMarkdown(parts[2]) : helpers.escapeHtml(parts[2]);
          body.appendChild(postDiv);
        }
      } else {
        body.innerHTML = helpers.formatMarkdown ? helpers.formatMarkdown(content) : helpers.escapeHtml(content);
      }

      outer.appendChild(meta);
      outer.appendChild(body);
      ui.chatWindow.appendChild(outer);
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
    ui.modeSelect.value = state.settings.mode || "balanced";
    ui.personaSelect.value = state.settings.persona || "default";
    ui.muteToggle.checked = Boolean(state.settings.mute);
    ui.webAccessToggle.checked = Boolean(state.settings.webAccess);
    ui.quineLockToggle.checked = Boolean(state.settings.quineLock ?? true);
    ui.memoryToggle.checked = Boolean(state.settings.memoryRecall ?? true);
    ui.temperatureInput.value = String(state.settings.temperature);
    ui.systemPromptInput.value = state.settings.systemPrompt;
    ui.autoGoalInput.value = state.settings.autoGoal || "";
    ui.autoIntervalInput.value = String(state.settings.autoInterval || 20);
    document.body.setAttribute("data-theme", state.settings.theme);
  }

  async function requestAssistant(messages) {
    const payload = {
      model: ui.modelSelect.value,
      mode: ui.modeSelect.value,
      webSearch: ui.webAccessToggle.checked,
      messages,
      stream: false,
      options: { temperature: state.settings.temperature }
    };
    const res = await window.llmBridge.chat(payload);
    
    // Handle metadata if present
    if (res._meta) {
      const { qualityScore, sentiment, latency } = res._meta;
      if (qualityScore) logLine(`[Router] Quality Score: ${qualityScore}`);
      if (sentiment) logLine(`[Router] Sentiment: ${sentiment}`);
      if (latency) {
        logLine(`[Router] Latency: ${latency}ms`);
        updateSignalHUD(Number(latency));
      }
    }

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

  async function buildMessagesForApi() {
    const session = activeSession();
    const messages = [];
    
    // 1. Persona Injection
    let systemContent = ui.systemPromptInput.value.trim();
    if (state.settings.persona === "reezler") {
      systemContent = (systemContent ? systemContent + "\n\n" : "") + REEZLER_SYSTEM_PROMPT;
    }
    
    // 2. Memory Recall Injection
    if (state.settings.memoryRecall && window.NeuralMemoryEngine && window.llmBridge?.embed) {
      const lastUserMsg = session.messages.slice().reverse().find(m => m.role === "user");
      if (lastUserMsg) {
        try {
          const vector = await window.llmBridge.embed(lastUserMsg.content);
          if (vector) {
            const recall = window.NeuralMemoryEngine.search(vector, 3);
            if (recall.length > 0) {
              const memoryBlock = recall.map(r => `- ${r.text} (Source: ${r.title})`).join("\n");
              systemContent = (systemContent ? systemContent + "\n\n" : "") + 
                `RELEVANT MEMORY:\n${memoryBlock}\n[End Memory]`;
              logLine(`[Memory] Injected ${recall.length} memories.`);
            }
          }
        } catch (err) {
          console.warn("[Memory] Search failed:", err);
        }
      }
    }

    if (systemContent) messages.push({ role: "system", content: systemContent });
    
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

  function speak(text) {
    if (state.settings.mute || !window.speechSynthesis) return;
    
    // Stop any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Attempt to find a deep/serious voice
    utterance.voice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Male")) || voices[0];
    
    const hour = new Date().getHours();
    const isAsh = (hour >= 0 && hour < 5);
    
    // Temporal Tone Shift
    utterance.rate = isAsh ? 0.8 : 0.9;
    utterance.pitch = isAsh ? 0.7 : 0.8;
    utterance.volume = 0.6;

    window.speechSynthesis.speak(utterance);
  }

  async function sendMessage() {
    if (inFlight) return;
    const text = ui.llmInput.value.trim();
    if (!text) return;

    // --- SIGNAL LAW: PRE-FILTER ---
    const pollution = ["as an ai", "helpful assistant", "i am programmed", "please note", "ethical guidelines"];
    if (pollution.some(p => text.toLowerCase().includes(p))) {
      ui.llmInput.style.boxShadow = "0 0 20px var(--danger)";
      showToast("SIGNAL LAW: Frequency Pollution Detected. Rephrase High-Leverage.");
      setTimeout(() => ui.llmInput.style.boxShadow = "none", 2000);
      return;
    }

    if (!window.llmBridge || typeof window.llmBridge.chat !== "function") {
      logLine("Bridge missing: llmBridge.chat unavailable");
      return;
    }

    inFlight = true;
    ui.sendBtn.disabled = true;
    ui.sendBtn.textContent = "Sending...";
    appendMessage("user", text);
    ui.llmInput.value = "";
    
    // --- FORGE: Command Event ---
    window.dispatchEvent(new CustomEvent("neural:command", { detail: { text: text } }));

    const model = ui.modelSelect.value;
    const temperature = Number(ui.temperatureInput.value);
    state.settings.model = model;
    state.settings.temperature = Number.isFinite(temperature) ? temperature : DEFAULT_SETTINGS.temperature;
    state.settings.systemPrompt = ui.systemPromptInput.value;
    persist();

    try {
      const messages = await buildMessagesForApi(); // Now async
      const textOut = await requestAssistant(messages);
      appendMessage("assistant", textOut);
      logLine(`Assistant response received (${textOut.length} chars)`);
      speak(textOut);
      showToast("Response received");

      // --- SOVEREIGN COMMAND INTERCEPT ---
      if (textOut.includes("[COMMAND:")) {
        const cmd = textOut.match(/\[COMMAND:([^\]]+)\]/)?.[1];
        if (cmd && window.llmBridge?.exec) {
          const ok = confirm(`SOVEREIGN HAND: Execute system command?\n\n$ ${cmd}`);
          if (ok) {
            logLine(`[Hand] Executing: ${cmd}`);
            const res = await window.llmBridge.exec(cmd);
            if (res.success) {
              appendMessage("assistant", `[EXEC SUCCESS]\n${res.stdout}`);
              logLine("[Hand] Execution complete.");
            } else {
              appendMessage("assistant", `[EXEC ERROR]\n${res.stderr}`);
              logLine("[Hand] Execution failed.");
            }
          }
        }
      }
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
    state.settings.mode = ui.modeSelect.value;
    state.settings.persona = ui.personaSelect.value;
    state.settings.mute = ui.muteToggle.checked;
    state.settings.webAccess = ui.webAccessToggle.checked;
    state.settings.quineLock = ui.quineLockToggle.checked;
    state.settings.memoryRecall = ui.memoryToggle.checked;
    state.settings.temperature = Number(ui.temperatureInput.value) || DEFAULT_SETTINGS.temperature;
    state.settings.systemPrompt = ui.systemPromptInput.value || "";
    state.settings.autoGoal = ui.autoGoalInput.value || "";
    state.settings.autoInterval = Math.max(5, Number(ui.autoIntervalInput.value) || 20);
    document.body.setAttribute("data-theme", state.settings.theme);
    persist();

    // Push Quine Lock state to backend if possible
    if (window.llmBridge?.setQuineLock) {
      window.llmBridge.setQuineLock(state.settings.quineLock).catch(() => {});
    }

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
      logs: state.logs,
      currentTab,
      chartData
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

    if (next.currentTab) {
      const tabBtn = document.querySelector(`.tab-btn[data-tab="${next.currentTab}"]`);
      if (tabBtn) tabBtn.click();
    }
    if (Array.isArray(next.chartData)) {
      chartData = next.chartData;
    }
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

  async function refreshAutonomy() {
    if (!window.llmBridge?.autonomy) throw new Error("autonomy bridge unavailable");
    const status = await window.llmBridge.autonomy();
    ui.autonomyOutput.textContent = JSON.stringify(status, null, 2);
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

  async function runFracture() {
    const word = ui.fractureInput.value.trim();
    if (!word) return;
    
    ui.fractureOutput.textContent = "Fracturing language...";
    const prompt = `FRACTURE THIS WORD: "${word}"\nReturn 3 layers: 1. Surface, 2. Fracture, 3. Doctrine².\nKeep it high-leverage and Christian Cash style.`;
    
    try {
      const messages = [{ role: "user", content: prompt }];
      const textOut = await requestAssistant(messages);
      ui.fractureOutput.innerHTML = helpers.formatMarkdown ? helpers.formatMarkdown(textOut) : textOut;
      ui.fractureInput.value = "";
    } catch (err) {
      ui.fractureOutput.textContent = "Fracture failed: " + err.message;
    }
  }

  function playTriOsChime() {
    if (state.settings.mute) return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    const playTone = (freq, type, delay, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration);
    };

    // Mac (F-sharp) + Windows (Arpeggio) + Linux (Drone)
    playTone(370, "sine", 0, 2); // Mac-ish chime
    playTone(440, "triangle", 0.2, 1.5);
    playTone(554, "triangle", 0.4, 1.5);
    playTone(659, "triangle", 0.6, 1.5); // Windows-ish arpeggio
    playTone(110, "sawtooth", 0, 3); // Linux-ish bass drone
  }

  let sealClicks = 0;
  function setupEmpireSeal() {
    ui.empireSeal.onclick = () => {
      sealClicks++;
      if (sealClicks >= 3) {
        unlockGodMode();
        sealClicks = 0;
      }
      setTimeout(() => { sealClicks = 0; }, 2000);
    };
  }

  function unlockGodMode() {
    document.body.style.setProperty("--accent", "var(--ritual-gold)");
    ui.ncVal.textContent = "∞ NC";
    showToast("🔱 GOD MODE: FOUNDER OVERRIDE ACTIVE");
    logLine("[Sovereign] God Mode unlocked via Empire Seal.");
    state.settings.godMode = true;
    playTriOsChime();
  }

  function setupRitualForge() {
    const rituals = JSON.parse(localStorage.getItem("neural_rituals") || "{}");
    
    window.addEventListener("neural:command", async (e) => {
      const input = e.detail.text;
      if (input.startsWith("/forge ritual:")) {
        const parts = input.split(" ");
        const name = parts[0].split(":")[1];
        const cmd = input.split('"')[1];
        if (name && cmd) {
          rituals[name] = cmd;
          localStorage.setItem("neural_rituals", JSON.stringify(rituals));
          logLine(`[Forge] Ritual forged: /${name}`);
          showToast(`Ritual ${name} Saved`);
        }
      } else if (input.startsWith("/")) {
        const name = input.substring(1);
        if (rituals[name]) {
          logLine(`[Forge] Executing ritual: ${name}`);
          ui.llmInput.value = rituals[name];
          sendMessage();
        }
      }
    });
  }

  async function takeVisionSnapshot() {
    logLine("[Vision] Requesting NeuroVision link...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      
      const base64 = canvas.toDataURL("image/jpeg").split(",")[1];
      stream.getTracks().forEach(track => track.stop());

      // Preview in chat
      const imgHTML = `<img src="data:image/jpeg;base64,${base64}" style="max-width: 300px; border-radius: 8px; border: 1px solid var(--accent);">`;
      appendMessage("user", imgHTML);
      
      logLine("[Vision] Snapshot captured. Analyzing...");
      const description = await window.llmBridge.vision({ 
        imageBase64: base64, 
        prompt: "Describe this tactical environment. Identify threats or signal pollution." 
      });
      
      appendMessage("assistant", description);
      speak(description);
    } catch (err) {
      logLine(`[Vision] FAILED: ${err.message}`);
      showToast("Camera Access Denied");
    }
  }

  function setupCommandPalette() {
    const commands = [
      { cmd: "/ritual", desc: "Execute system ritual" },
      { cmd: "/vault", desc: "Open encrypted vault" },
      { cmd: "/purge", desc: "Wipe system traces" },
      { cmd: "/xp", desc: "View rank and progress" },
      { cmd: "/model", desc: "Switch AI model" },
      { cmd: "/sync", desc: "Merge legacy records" },
      { cmd: "/chaos", desc: "Trigger stress test" }
    ];

    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        ui.commandPalette.style.display = "flex";
        ui.paletteInput.focus();
      }
      if (e.key === "Escape") {
        ui.commandPalette.style.display = "none";
        ui.diffViewer.style.display = "none";
      }
    });

    ui.paletteInput.oninput = () => {
      const q = ui.paletteInput.value.toLowerCase();
      ui.paletteResults.innerHTML = "";
      commands.filter(c => c.cmd.includes(q) || c.desc.toLowerCase().includes(q)).forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${c.cmd}</strong> - <small>${c.desc}</small>`;
        li.onclick = () => {
          ui.llmInput.value = c.cmd;
          ui.commandPalette.style.display = "none";
          ui.llmInput.focus();
        };
        ui.paletteResults.appendChild(li);
      });
    };
  }

  function updateSignalHUD(latency) {
    let strength = 100;
    if (latency > 2000) strength = 40;
    else if (latency > 1000) strength = 65;
    else if (latency > 500) strength = 85;
    
    ui.signalBar.style.width = strength + "%";
    ui.signalVal.textContent = strength + "%";
    
    if (strength < 70) ui.signalBar.classList.add("low");
    else ui.signalBar.classList.remove("low");
  }

  function setupStealthMode() {
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
        document.body.classList.toggle("stealth-mode");
        logLine("[Focus] Stealth Mode " + (document.body.classList.contains("stealth-mode") ? "Active" : "Disabled"));
      }
    });
  }

  function addToOptimizationQueue(filePath, code) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>OPT: ${filePath.split('\\').pop()}</strong> <button class="tab-btn" style="min-height: unset; padding: 2px 4px;">REVIEW</button>`;
    li.querySelector("button").onclick = () => handlePatchExecution(filePath, code);
    ui.optimizationQueue.prepend(li);
    if (ui.optimizationQueue.children.length > 5) ui.optimizationQueue.lastChild.remove();
  }

  let pendingPatch = null;
  function setupDiffViewer() {
    ui.closeDiffBtn.onclick = () => { ui.diffViewer.style.display = "none"; };
    ui.confirmPatchBtn.onclick = async () => {
      if (pendingPatch) {
        // MANUAL OVERRIDE: Use the value from the textarea, not the original patch
        await executeFinalPatch(pendingPatch.path, ui.diffNew.value);
        ui.diffViewer.style.display = "none";
      }
    };
  }

  async function handlePatchExecution(filePath, code) {
    // Save to queue for later access
    addToOptimizationQueue(filePath, code);

    // New Visual Review Flow
    try {
      const oldCode = await window.neuralAPI.readFile(filePath);
      ui.diffOld.textContent = oldCode;
      ui.diffNew.value = code; // Textarea uses .value
      pendingPatch = { path: filePath, code: code };
      ui.diffViewer.style.display = "flex";
    } catch (err) {
      logLine(`[Hand] Failed to load original for diff: ${err.message}`);
      ui.diffOld.textContent = "// FILE NOT FOUND (Creating New)";
      ui.diffNew.value = code;
      pendingPatch = { path: filePath, code: code };
      ui.diffViewer.style.display = "flex";
    }
  }

  function triggerJackpot() {
    const el = document.body;
    el.classList.add("jackpot-flash");
    showToast("🎰 JACKPOT: SYSTEM OPTIMIZED");
    setTimeout(() => el.classList.remove("jackpot-flash"), 1000);
  }

  async function obliterateFile(filePath) {
    if (!confirm(`💣 OBLITERATE ${filePath}?\nThis is a non-recoverable ZeroTrace™ action.`)) return;
    try {
      logLine(`[NeuroKill] Securely wiping ${filePath}...`);
      // Simulate multi-pass overwrite before delete
      await window.neuralAPI.writeFile(filePath, "0".repeat(1000));
      await window.neuralAPI.writeFile(filePath, "1".repeat(1000));
      await window.neuralAPI.writeFile(filePath, "RANDOM_DATA_" + Math.random());
      
      // True Unlink
      await window.neuralAPI.deleteFile(filePath);
      
      showToast("File Obliterated");
      logLine(`[NeuroKill] SUCCESS: ${filePath} sanitized.`);
      refreshSystemTree();
    } catch (err) {
      logLine(`[NeuroKill] ERROR: ${err.message}`);
    }
  }

  async function executeFinalPatch(filePath, code) {
    try {
      logLine(`[Hand] Committing patch to ${filePath}...`);
      await window.neuralAPI.writeFile(filePath, code);
      triggerJackpot();
      logLine(`[Hand] SUCCESS: ${filePath} patched.`);
      refreshSystemTree();
    } catch (err) {
      logLine(`[Hand] COMMIT FAILED: ${err.message}`);
      showToast("Write Error");
    }
  }

  function setupPhoenixCommandCenter() {
    ui.refreshFsBtn.onclick = refreshSystemTree;
    
    ui.editorSaveBtn.onclick = async () => {
      const filePath = ui.editingFileName.textContent;
      if (filePath === "no_file_selected.js") return;
      
      try {
        logLine(`[Hand] Saving ${filePath}...`);
        await window.neuralAPI.writeFile(filePath, ui.phoenixCodeArea.value);
        showToast("File Saved");
        logLine(`[Hand] SUCCESS: ${filePath} updated.`);
      } catch (err) {
        logLine(`[Hand] SAVE ERROR: ${err.message}`);
        showToast("Save Failed");
      }
    };

    ui.editorObliterateBtn.onclick = () => {
      const filePath = ui.editingFileName.textContent;
      if (filePath === "no_file_selected.js") return;
      obliterateFile(filePath);
    };

    ui.editorMutateBtn.onclick = () => {
      const filePath = ui.editingFileName.textContent;
      if (filePath === "no_file_selected.js") return;
      ui.llmInput.value = `Mutate this file for optimization: ${filePath}\n\n[FILE_CONTENT]\n${ui.phoenixCodeArea.value}`;
      sendMessage();
      showTab("chat-view");
    };

    ui.phoenixCodeArea.onkeyup = updateCursorPos;
    ui.phoenixCodeArea.onclick = updateCursorPos;
  }

  function updateCursorPos() {
    const text = ui.phoenixCodeArea.value;
    const pos = ui.phoenixCodeArea.selectionStart;
    const lines = text.substr(0, pos).split("\n");
    ui.lineCol.textContent = `${lines.length}:${lines[lines.length - 1].length + 1}`;
  }

  async function loadFileToEditor(filePath) {
    try {
      logLine(`[XXXplorer] Loading ${filePath}...`);
      const content = await window.neuralAPI.readFile(filePath);
      ui.phoenixCodeArea.value = content;
      ui.editingFileName.textContent = filePath;
      ui.editorDna.textContent = Math.random().toString(16).slice(2, 8).toUpperCase();
      updateCursorPos();
    } catch (err) {
      logLine(`[XXXplorer] LOAD ERROR: ${err.message}`);
      showToast("Load Failed");
    }
  }

  function setupKnowledgeDrop() {
    const zone = ui.knowledgeDropZone;
    if (!zone) return;

    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.classList.add("hover");
    });

    zone.addEventListener("dragleave", () => zone.classList.remove("hover"));

    zone.addEventListener("drop", async (e) => {
      e.preventDefault();
      zone.classList.remove("hover");
      
      const files = Array.from(e.dataTransfer.files);
      ui.indexingStatus.textContent = `Processing ${files.length} files...`;
      
      for (const file of files) {
        try {
          logLine(`[Memory] Indexing: ${file.name}...`);
          const text = await window.neuralAPI.readFile(file.path);
          
          if (window.llmBridge?.embed && window.NeuralMemoryEngine) {
            const vector = await window.llmBridge.embed(text.substring(0, 2000));
            if (vector) {
              window.NeuralMemoryEngine.metadata.push({
                text: text,
                title: file.name,
                chunk_id: `drop_${Date.now()}`
              });
              // In a real setup, we'd add to the vector matrix, 
              // for now we push to metadata for session-based recall.
              logLine(`[Memory] SUCCESS: ${file.name} injected into brain.`);
            }
          }
        } catch (err) {
          logLine(`[Memory] FAILED: ${file.name} - ${err.message}`);
        }
      }
      ui.indexingStatus.textContent = "Injection Complete.";
      setTimeout(() => { ui.indexingStatus.textContent = "Ready for injection..."; }, 3000);
    });
  }

  function updateLivingBackground() {
    const signal = parseInt(ui.signalVal.textContent) || 100;
    const nc = parseInt(ui.ncVal.textContent) || 1000;
    const orbs = document.querySelectorAll(".bg-orb");
    
    // Pulse speed based on signal
    const duration = signal < 50 ? "2s" : "8s";
    
    orbs.forEach(orb => {
      orb.style.animationDuration = duration;
      // Shift color based on NC (Gold if rich, Red if poor)
      if (nc < 100) {
        orb.style.background = "radial-gradient(circle, rgba(255,0,0,0.15) 0%, transparent 70%)";
      } else {
        orb.style.background = "radial-gradient(circle, rgba(0,240,255,0.15) 0%, transparent 70%)";
      }
    });
  }

  function wireUi() {
    for (const id of REQUIRED_IDS) ui[id] = $(id);

    wireTabs();
    setupKnowledgeDrop();
    setupCommandPalette();
    setupDiffViewer();
    setupStealthMode();
    setupDragFeed();
    setupPhoenixCommandCenter();
    setupEmpireSeal();
    bindClick("fractureBtn", runFracture);

    // --- TRIPLE 5 MUTATION BUTTONS ---
    const mutationBtns = document.querySelectorAll(".war-room-panel .row button.tab-btn");
    mutationBtns.forEach((btn, idx) => {
      btn.onclick = () => {
        const levels = ["Light Optimization", "NLP Structured Refinement", "Deep Addictive Rewrite"];
        const level = levels[idx] || "Standard Riff";
        ui.llmInput.value = `[TRIPLE 5: ${level.toUpperCase()}] Apply this mutation level to the current system state. Focus on ROI and Signal Law.`;
        sendMessage();
        showTab("chat-view");
      };
    });

    bindClick("connectBtn", pingLlm);
    bindClick("sendBtn", sendMessage);
    bindClick("clearChatBtn", clearChat);
    bindClick("saveSettingsBtn", saveSettings);
    bindClick("refreshAutonomyBtn", refreshAutonomy);
    bindClick("stressTestBtn", runNukeStressTest);
    bindClick("purgeSystemBtn", runSystemPurge);
    bindClick("scanLegacyBtn", scanLegacyTears);
    bindClick("micBtn", toggleVoice);
    bindClick("camBtn", takeVisionSnapshot);
    setupRitualForge();

    refreshIpValuation();
    generateVaultGenome();
    scanLegacyTears();

    // Cognitive Stream Handler
    if (window.llmBridge?.onCognitiveEvent) {
      window.llmBridge.onCognitiveEvent((event) => {
        const line = document.createElement("div");
        line.className = "thought-line";
        line.innerHTML = `<strong>[${event.agent || 'SYSTEM'}]</strong> ${event.content}`;
        ui.cognitiveStream.prepend(line);
        if (ui.cognitiveStream.children.length > 50) ui.cognitiveStream.lastChild.remove();
      });
    }

    // Decoy Mode Listener
    if (window.authBridge?.onDecoy) {
      window.authBridge.onDecoy(() => {
        document.body.innerHTML = `
          <div style="background: #000; color: #f00; height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace;">
            <h1 class="glitch" data-text="ACCESS DENIED">ACCESS DENIED</h1>
            <p>System Integrity Compromised. Decoy Protocol Active.</p>
            <p style="font-size: 10px; margin-top: 20px;">Memories unmounted. Encryption keys purged.</p>
          </div>
        `;
      });
    }

    ui.muteToggle.addEventListener("change", saveSettings);
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

    // Image Paste Handler (Vision Intelligence)
    document.addEventListener('paste', async (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          e.preventDefault();
          const blob = item.getAsFile();
          const reader = new FileReader();
          reader.onload = async (event) => {
            const base64 = event.target.result.split(',')[1]; // Strip prefix
            
            // 1. Show User Image
            const imgHTML = `<img src="${event.target.result}" style="max-width: 300px; border-radius: 8px; border: 1px solid var(--accent);">`;
            appendMessage("user", imgHTML);
            
            // 2. Call Vision Bridge
            logLine("[Vision] Analyzing image...");
            appendMessage("assistant", "👁️ Analyzing visual input...");
            
            try {
              const description = await window.llmBridge.vision({ 
                imageBase64: base64, 
                prompt: "Describe this image in detail and identify any text or tactical information." 
              });
              
              // Replace "Analyzing..." with actual description
              const lastMsg = activeSession().messages[activeSession().messages.length - 1];
              lastMsg.content = description;
              renderChat();
              logLine("[Vision] Analysis complete.");
            } catch (err) {
              appendMessage("assistant", `[Vision Error] ${err.message}`);
            }
          };
          reader.readAsDataURL(blob);
        }
      }
    });
  }

  async function refreshModelsAndModes() {
    try {
      const models = await window.llmBridge.models();
      if (Array.isArray(models) && models.length > 0) {
        ui.modelSelect.innerHTML = "";
        for (const m of models) {
          const opt = document.createElement("option");
          opt.value = m.id;
          opt.textContent = m.id;
          ui.modelSelect.appendChild(opt);
        }
        if (state.settings.model) ui.modelSelect.value = state.settings.model;
      }

      const { modes, default: defaultMode } = await window.llmBridge.modes();
      if (Array.isArray(modes) && modes.length > 0) {
        ui.modeSelect.innerHTML = "";
        for (const m of modes) {
          const opt = document.createElement("option");
          opt.value = m;
          opt.textContent = m;
          ui.modeSelect.appendChild(opt);
        }
        if (state.settings.mode) ui.modeSelect.value = state.settings.mode;
        else if (defaultMode) ui.modeSelect.value = defaultMode;
      }
    } catch (err) {
      console.warn("Failed to refresh models/modes:", err);
    }
  }

  async function initMemory() {
    if (!window.NeuralMemoryEngine) return;
    
    const basePath = "C:\\Users\\KickA\\Downloads\\NeuralMemory_Package_SMALL\\neuralmemory_index";
    try {
      logLine("[Memory] Loading vectors...");
      const vecBuffer = await window.neuralAPI.readFile(`${basePath}\\vectors.npy`, "buffer");
      const metaText = await window.neuralAPI.readFile(`${basePath}\\meta.jsonl`);
      
      const result = window.NeuralMemoryEngine.ingest(vecBuffer, metaText);
      if (result.success) {
        logLine(`[Memory] Brain online. ${result.count} memories active.`);
        showToast("Memory Online");
      } else {
        logLine(`[Memory] Ingest failed: ${result.error}`);
      }
    } catch (err) {
      console.warn("[Memory] Load failed (path might be wrong):", err.message);
      logLine("[Memory] Offline - Check Download Path");
    }
  }

  async function runBootSequence() {
    const el = $("bootLoader");
    const status = $("bootStatus");
    const reels = document.querySelectorAll(".reel");
    if (!el) return;

    const symbols = ["💎", "🎰", "🧬", "⚔️", "⚖️"];
    
    // 1. Reel Spin
    const spin = setInterval(() => {
      reels.forEach(r => {
        r.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      });
    }, 100);

    // 2. Sequence
    setTimeout(() => { status.textContent = "SIGNAL ESTABLISHED..."; }, 1000);
    setTimeout(() => { status.textContent = "VAULT GENOME VERIFIED..."; }, 2000);
    setTimeout(() => { 
      clearInterval(spin);
      reels.forEach(r => r.textContent = "💎");
      status.textContent = "JACKPOT: CHRISTIANITHY III² ACTIVE";
      el.classList.add("jackpot-flash");
      playTriOsChime();
    }, 3000);

    // 3. UI Reveal
    setTimeout(() => {
      el.style.opacity = "0";
      setTimeout(() => { el.style.display = "none"; }, 1000);
    }, 4500);
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
    setInterval(updateLivingBackground, 5000);
    bindStreamEvents();
    refreshModelsAndModes();
    refreshSystemTree();
    initMemory(); 
    runBootSequence(); // --- BOOT TRIGGER ---
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
    void refreshAutonomy().catch(() => {});
    void refreshAuthStatus().catch(() => {});

    // Periodic UI Updates for Dashboard/Brain/Apps
    setInterval(() => {
      updateHardwareStats();
      refreshEconomy();
      checkMidnightShift();
      if (currentTab === "dashboard-view") updateDashboardMetrics();
      if (currentTab === "brain-view") initBrainGraph();
      if (currentTab === "apps-view") refreshAppDock();
    }, 15000);

    setupVoice();
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
