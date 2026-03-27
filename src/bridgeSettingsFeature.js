(function initBridgeSettingsFeature(root, factory) {
  const feature = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = feature;
  }
  root.NeuralShellBridgeSettingsFeature = feature;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildBridgeSettingsFeature() {
  function fallbackClampNumber(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function createBridgeSettingsFeature(deps = {}) {
    const windowObject = deps.window || {};
    const documentObject = deps.document || null;
    const appState = deps.appState || {};
    const el = deps.el || {};
    const fillModelSelect = typeof deps.fillModelSelect === "function" ? deps.fillModelSelect : () => {};
    const renderConnectionModeControls = typeof deps.renderConnectionModeControls === "function" ? deps.renderConnectionModeControls : () => {};
    const currentBridgeProfile = typeof deps.currentBridgeProfile === "function" ? deps.currentBridgeProfile : () => null;
    const liveBridgeProfile = typeof deps.liveBridgeProfile === "function" ? deps.liveBridgeProfile : () => null;
    const populateProfileEditor = typeof deps.populateProfileEditor === "function" ? deps.populateProfileEditor : () => {};
    const renderProviderProfileHelp = typeof deps.renderProviderProfileHelp === "function" ? deps.renderProviderProfileHelp : () => {};
    const renderProviderPresetList = typeof deps.renderProviderPresetList === "function" ? deps.renderProviderPresetList : () => {};
    const renderEnvProfileSummary = typeof deps.renderEnvProfileSummary === "function" ? deps.renderEnvProfileSummary : () => {};
    const refreshBridgeEnvStatus = typeof deps.refreshBridgeEnvStatus === "function" ? deps.refreshBridgeEnvStatus : async () => [];
    const renderSettingsQuickstartHints = typeof deps.renderSettingsQuickstartHints === "function" ? deps.renderSettingsQuickstartHints : () => {};
    const updateWorkspaceModeText = typeof deps.updateWorkspaceModeText === "function" ? deps.updateWorkspaceModeText : () => {};
    const renderMissionControl = typeof deps.renderMissionControl === "function" ? deps.renderMissionControl : () => {};
    const updateDynamicChrome = typeof deps.updateDynamicChrome === "function" ? deps.updateDynamicChrome : () => {};
    const applySettingsPatch = typeof deps.applySettingsPatch === "function" ? deps.applySettingsPatch : async () => appState.settings;
    const setActiveModel = typeof deps.setActiveModel === "function" ? deps.setActiveModel : async () => appState.model;
    const setModelOptions = typeof deps.setModelOptions === "function" ? deps.setModelOptions : () => {};
    const syncModelToLiveBridgeFallback = typeof deps.syncModelToLiveBridgeFallback === "function"
      ? deps.syncModelToLiveBridgeFallback
      : async () => ({ bridgeSelection: { blockedByRemoteToggle: false, liveProfile: null } });
    const applyLlmStatus = typeof deps.applyLlmStatus === "function" ? deps.applyLlmStatus : () => {};
    const showBanner = typeof deps.showBanner === "function" ? deps.showBanner : () => {};
    const getNormalizedProfiles = typeof deps.getNormalizedProfiles === "function"
      ? deps.getNormalizedProfiles
      : (settings) => Array.isArray(settings && settings.connectionProfiles) ? settings.connectionProfiles.slice() : [];
    const resolveActiveProfileId = typeof deps.resolveActiveProfileId === "function"
      ? deps.resolveActiveProfileId
      : (settings, profiles) => String((settings && settings.activeProfileId) || (profiles && profiles[0] && profiles[0].id) || "local-default");
    const findProfileById = typeof deps.findProfileById === "function"
      ? deps.findProfileById
      : (profiles, id) => (Array.isArray(profiles) ? profiles : []).find((profile) => String(profile && profile.id || "") === String(id)) || null;
    const normalizeProfile = typeof deps.normalizeProfile === "function" ? deps.normalizeProfile : (profile) => ({ ...(profile || {}) });
    const profileIdFromName = typeof deps.profileIdFromName === "function" ? deps.profileIdFromName : (name) => String(name || "profile").trim() || "profile";
    const activateBridgeProfile = typeof deps.activateBridgeProfile === "function" ? deps.activateBridgeProfile : async () => ({ ok: false });
    const testDraftBridgeProfile = typeof deps.testDraftBridgeProfile === "function" ? deps.testDraftBridgeProfile : async () => ({ ok: false });
    const readProfileDraftFromForm = typeof deps.readProfileDraftFromForm === "function" ? deps.readProfileDraftFromForm : () => ({ id: "profile", name: "Profile" });
    const clampNumber = typeof deps.clampNumber === "function" ? deps.clampNumber : fallbackClampNumber;
    const refreshModels = typeof deps.refreshModels === "function" ? deps.refreshModels : async () => [];
    const runBridgeAutoDetect = typeof deps.runBridgeAutoDetect === "function" ? deps.runBridgeAutoDetect : async () => ({ ok: false });
    const updateSettingsConnectionModeText = typeof deps.updateSettingsConnectionModeText === "function" ? deps.updateSettingsConnectionModeText : () => {};
    const persistOfflineModePreference = typeof deps.persistOfflineModePreference === "function"
      ? deps.persistOfflineModePreference
      : async () => ({ ok: false, reason: "unavailable" });
    const bridgeProviders = Array.isArray(deps.bridgeProviders) ? deps.bridgeProviders.slice() : [];
    const getBridgeProvider = typeof deps.getBridgeProvider === "function"
      ? deps.getBridgeProvider
      : (providerId) => bridgeProviders.find((provider) => String(provider && provider.id || "") === String(providerId || "")) || {
        id: String(providerId || "ollama"),
        label: String(providerId || "ollama"),
        defaultBaseUrl: "http://127.0.0.1:11434",
        remote: false,
        requiresApiKey: false,
        suggestedModels: []
      };

    function syncSettingsInputsFromState() {
      updateDynamicChrome();
      if (el.baseUrlInput) el.baseUrlInput.value = String(appState.settings.ollamaBaseUrl || "http://127.0.0.1:11434");
      if (el.timeoutInput) el.timeoutInput.value = String(appState.settings.timeoutMs || 15000);
      if (el.retryInput) el.retryInput.value = String(appState.settings.retryCount || 2);
      const activeProfile = currentBridgeProfile();
      const liveProfile = liveBridgeProfile() || activeProfile;
      fillModelSelect(el.settingsModelSelect, [], appState.model, liveProfile ? liveProfile.provider : "ollama");
      if (el.tokenBudgetInput) el.tokenBudgetInput.value = String(appState.settings.tokenBudget || 1200);
      if (el.autosaveNameInput) el.autosaveNameInput.value = String(appState.settings.autosaveName || "autosave-main");
      if (el.autosaveIntervalInput) el.autosaveIntervalInput.value = String(appState.settings.autosaveIntervalMin || 10);
      if (el.autosaveEnabledInput) el.autosaveEnabledInput.checked = Boolean(appState.settings.autosaveEnabled);
      if (el.connectOnStartupInput) el.connectOnStartupInput.checked = appState.settings.connectOnStartup !== false;
      if (el.autoLoadRecommendedContextProfileInput) {
        el.autoLoadRecommendedContextProfileInput.checked = Boolean(appState.settings.autoLoadRecommendedContextProfile);
      }
      renderConnectionModeControls();
      if (el.themeSelect && el.themeSelect.options.length === 0 && documentObject) {
        for (const theme of ["dark", "light"]) {
          const option = documentObject.createElement("option");
          option.value = theme;
          option.textContent = theme;
          el.themeSelect.appendChild(option);
        }
      }
      if (el.themeSelect) el.themeSelect.value = String(appState.settings.theme || "dark");
      if (documentObject && documentObject.documentElement) {
        documentObject.documentElement.setAttribute("data-theme", String(appState.settings.theme || "dark"));
      }
      populateProfileEditor();
      renderProviderProfileHelp(activeProfile ? activeProfile.provider : "ollama");
      renderProviderPresetList();
      renderEnvProfileSummary();
      renderProviderSweepResults();
      refreshBridgeEnvStatus().catch(() => {});
      renderSettingsQuickstartHints();
      updateWorkspaceModeText();
      renderMissionControl();
    }

    async function applySettingsFromInputs() {
      const current = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
      const selectedModel = String((el.settingsModelSelect && el.settingsModelSelect.value) || appState.model || "llama3").trim() || "llama3";
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
        provider: (el.profileProviderSelect && el.profileProviderSelect.value) || (fallbackProfile && fallbackProfile.provider) || "ollama",
        timeoutMs: (el.profileTimeoutInput && el.profileTimeoutInput.value) || timeoutMs,
        retryCount: (el.profileRetryInput && el.profileRetryInput.value) || retryCount,
        defaultModel: (el.profileDefaultModelSelect && el.profileDefaultModelSelect.value) || selectedModel,
        apiKey: (el.profileApiKeyInput && el.profileApiKeyInput.value) || (fallbackProfile && fallbackProfile.apiKey) || ""
      }, selectedModel, selectedProfileId || "local-default");
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
        autoLoadRecommendedContextProfile: Boolean(
          el.autoLoadRecommendedContextProfileInput
            ? el.autoLoadRecommendedContextProfileInput.checked
            : current.autoLoadRecommendedContextProfile
        ),
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
      const fallbackSync = await syncModelToLiveBridgeFallback({ announce: false });
      if (!fallbackSync.bridgeSelection.blockedByRemoteToggle) {
        if (selectedModel !== appState.model) {
          await setActiveModel(selectedModel, { announce: false });
        } else {
          setModelOptions([]);
        }
      }
      if (el.timeoutInput) el.timeoutInput.value = String(editedProfile.timeoutMs);
      if (el.retryInput) el.retryInput.value = String(editedProfile.retryCount);
      if (el.tokenBudgetInput) el.tokenBudgetInput.value = String(tokenBudget);
      if (el.autosaveIntervalInput) el.autosaveIntervalInput.value = String(autosaveIntervalMin);
      applyLlmStatus(appState.llmStatus);
      if (fallbackSync.bridgeSelection.blockedByRemoteToggle && fallbackSync.bridgeSelection.liveProfile) {
        showBanner(
          `Settings applied. Live bridge reverted to ${fallbackSync.bridgeSelection.liveProfile.name} while Offline Mode is on.`,
          "ok"
        );
      } else {
        showBanner("Settings applied.", "ok");
      }
      return appState.settings;
    }

    async function createNewBridgeProfile() {
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
        provider: (el.profileProviderSelect && el.profileProviderSelect.value) || (currentBridgeProfile() && currentBridgeProfile().provider) || "ollama",
        timeoutMs: (el.timeoutInput && el.timeoutInput.value) || appState.settings.timeoutMs || 15000,
        retryCount: (el.retryInput && el.retryInput.value) || appState.settings.retryCount || 2,
        defaultModel: appState.model,
        apiKey: (el.profileApiKeyInput && el.profileApiKeyInput.value) || ""
      }, appState.model, seedId);
      await applySettingsPatch({
        connectionProfiles: [...currentProfiles, nextProfile],
        activeProfileId: nextProfile.id
      });
      showBanner(`Profile created: ${nextProfile.name}`, "ok");
      return nextProfile;
    }

    async function importEnvProfiles() {
      if (!windowObject.api || !windowObject.api.bridge || typeof windowObject.api.bridge.importEnvProfiles !== "function") {
        showBanner("Env profile import is unavailable.", "bad");
        return { ok: false, reason: "unavailable" };
      }
      const result = await windowObject.api.bridge.importEnvProfiles();
      const importedProfiles = result && Array.isArray(result.importedProfiles) ? result.importedProfiles : [];
      if (!importedProfiles.length) {
        await refreshBridgeEnvStatus().catch(() => {});
        showBanner("No ready env-backed provider profiles were found.", "bad");
        return { ok: false, reason: "no_profiles" };
      }
      if (windowObject.api && windowObject.api.settings && typeof windowObject.api.settings.get === "function") {
        appState.settings = await windowObject.api.settings.get();
      }
      if (result && Array.isArray(result.providers)) {
        appState.bridgeEnvStatus = result.providers;
      }
      syncSettingsInputsFromState();
      showBanner(`Imported ${importedProfiles.length} env-backed provider ${importedProfiles.length === 1 ? "profile" : "profiles"}.`, "ok");
      return {
        ok: true,
        importedProfiles,
        providers: appState.bridgeEnvStatus
      };
    }

    function providerProfileForSweep(provider, profiles, timeoutMs, retryCount) {
      const providerId = String(provider && provider.id || "ollama");
      const matchingProfiles = (Array.isArray(profiles) ? profiles : [])
        .filter((profile) => String(profile && profile.provider || "") === providerId);
      const activeId = resolveActiveProfileId(appState.settings, profiles);
      const preferred = matchingProfiles.find((profile) => String(profile && profile.id || "") === String(activeId || ""))
        || matchingProfiles[0];
      if (preferred) {
        return {
          ...preferred,
          provider: providerId
        };
      }
      const suggestedModel = Array.isArray(provider && provider.suggestedModels) && provider.suggestedModels.length
        ? String(provider.suggestedModels[0])
        : String(appState.model || "llama3");
      const fallbackId = `sweep-${providerId}`;
      return normalizeProfile({
        id: fallbackId,
        name: `${String(provider && provider.label || providerId)} Sweep`,
        provider: providerId,
        baseUrl: String(provider && provider.defaultBaseUrl || "http://127.0.0.1:11434"),
        timeoutMs,
        retryCount,
        defaultModel: suggestedModel,
        apiKey: ""
      }, suggestedModel, fallbackId);
    }

    function providerSweepStatusTone(status) {
      const normalized = String(status || "").trim().toLowerCase();
      if (normalized === "connected") return "good";
      if (normalized === "failed") return "bad";
      if (normalized === "blocked") return "warn";
      if (normalized === "running") return "ok";
      return "guard";
    }

    function renderProviderSweepResults(summary = null) {
      if (!el.providerSweepSummaryText && !el.providerSweepList) {
        return;
      }

      const fallbackProviders = [];
      for (const profile of getNormalizedProfiles(appState.settings)) {
        const provider = getBridgeProvider(profile && profile.provider);
        if (!provider || fallbackProviders.some((entry) => String(entry.id || "") === String(provider.id || ""))) {
          continue;
        }
        fallbackProviders.push(provider);
      }
      const providers = bridgeProviders.length ? bridgeProviders : (fallbackProviders.length ? fallbackProviders : [getBridgeProvider("ollama")]);
      const resultMap = new Map();
      if (summary && Array.isArray(summary.results)) {
        for (const item of summary.results) {
          const providerId = String(item && item.provider || "").trim();
          if (!providerId) continue;
          resultMap.set(providerId, item);
        }
      }

      if (el.providerSweepSummaryText) {
        if (!summary) {
          el.providerSweepSummaryText.textContent = "Run Provider Sweep to validate saved profiles from this UI. Suggested starter models are listed below.";
        } else if (summary.running) {
          el.providerSweepSummaryText.textContent = `Running provider sweep across ${summary.total || providers.length} provider ${((summary.total || providers.length) === 1) ? "lane" : "lanes"}...`;
        } else {
          el.providerSweepSummaryText.textContent =
            `Provider sweep: ${summary.connected || 0}/${summary.total || providers.length} connected | ${summary.failed || 0} failed | ${summary.skipped || 0} pending setup.`;
        }
      }

      if (!el.providerSweepList || !documentObject) {
        return;
      }

      el.providerSweepList.innerHTML = "";
      for (const provider of providers) {
        const providerId = String(provider && provider.id || "ollama");
        const result = resultMap.get(providerId) || null;
        const status = String(result && result.status || "ready").trim().toLowerCase();
        const statusLabel = status === "connected"
          ? "Connected"
          : status === "failed"
            ? "Failed"
            : status === "blocked"
              ? "Blocked"
              : status === "running"
                ? "Running"
                : status === "skipped"
                  ? "Setup Needed"
                  : "Ready";

        const item = documentObject.createElement("div");
        item.className = "provider-sweep-item";

        const head = documentObject.createElement("div");
        head.className = "provider-sweep-item-head";

        const title = documentObject.createElement("div");
        title.className = "provider-sweep-item-title";
        title.textContent = String(provider && provider.label || providerId);

        const statusNode = documentObject.createElement("span");
        statusNode.className = "provider-sweep-status";
        statusNode.dataset.tone = providerSweepStatusTone(status);
        statusNode.textContent = statusLabel;

        head.appendChild(title);
        head.appendChild(statusNode);

        const meta = documentObject.createElement("div");
        meta.className = "provider-sweep-meta";
        const suggested = Array.isArray(provider && provider.suggestedModels) && provider.suggestedModels.length
          ? provider.suggestedModels.slice(0, 3).join(", ")
          : "Bring your own model id";
        const profileName = String(result && result.profileName || "No saved profile selected");
        const model = String(result && result.model || (Array.isArray(provider && provider.suggestedModels) && provider.suggestedModels[0]) || appState.model || "llama3");
        const reason = String(result && result.reason || "").trim();
        const modelCount = Number(result && result.modelCount || 0);
        const parts = [
          `Profile: ${profileName}`,
          `Model: ${model}`,
          `Suggested: ${suggested}`
        ];
        if (status === "connected" && modelCount > 0) {
          parts.push(`${modelCount} models listed`);
        }
        if (reason) {
          parts.push(reason);
        }
        meta.textContent = parts.join(" | ");

        item.appendChild(head);
        item.appendChild(meta);
        el.providerSweepList.appendChild(item);
      }
    }

    async function runProviderSweep() {
      if (!windowObject.api || !windowObject.api.bridge || typeof windowObject.api.bridge.test !== "function") {
        showBanner("Provider sweep is unavailable.", "bad");
        return { ok: false, reason: "unavailable" };
      }

      const settings = appState.settings && typeof appState.settings === "object" ? appState.settings : {};
      const timeoutMs = clampNumber(settings.timeoutMs || 15000, 1000, 120000, 15000);
      const retryCount = clampNumber(settings.retryCount || 2, 0, 10, 2);
      const allowRemoteBridge = Boolean(settings.allowRemoteBridge);
      const profiles = getNormalizedProfiles(settings);

      const fallbackProviders = [];
      for (const profile of profiles) {
        const provider = getBridgeProvider(profile && profile.provider);
        if (!provider || fallbackProviders.some((entry) => String(entry.id || "") === String(provider.id || ""))) {
          continue;
        }
        fallbackProviders.push(provider);
      }
      const providers = bridgeProviders.length ? bridgeProviders : (fallbackProviders.length ? fallbackProviders : [getBridgeProvider("ollama")]);
      const summarySeed = {
        running: true,
        total: providers.length,
        connected: 0,
        failed: 0,
        skipped: providers.length,
        results: []
      };
      renderProviderSweepResults(summarySeed);

      const results = [];
      for (const provider of providers) {
        const draft = providerProfileForSweep(provider, profiles, timeoutMs, retryCount);
        const row = {
          provider: String(provider && provider.id || "ollama"),
          label: String(provider && provider.label || provider && provider.id || "Provider"),
          profileName: String(draft && draft.name || "Draft"),
          model: String(draft && draft.defaultModel || appState.model || "llama3"),
          status: "skipped",
          ok: false,
          reason: ""
        };

        if (row.provider === "custom_openai" && /api\.example\.com/i.test(String(draft && draft.baseUrl || ""))) {
          row.reason = "Set a real custom base URL before running the sweep.";
          results.push(row);
          continue;
        }

        if (provider && provider.remote && !allowRemoteBridge) {
          row.status = "blocked";
          row.reason = "Offline Mode is on. Turn it off to test hosted providers.";
          results.push(row);
          continue;
        }

        if (provider && provider.requiresApiKey && !String(draft && draft.apiKey || "").trim()) {
          row.reason = `${String(provider.label || provider.id || "Provider")} API key is missing in the saved profile.`;
          results.push(row);
          continue;
        }

        try {
          const result = await windowObject.api.bridge.test(draft);
          if (result && result.ok) {
            row.status = "connected";
            row.ok = true;
            row.modelCount = Number(result.modelCount || 0);
            row.sampleModels = Array.isArray(result.models) ? result.models.slice(0, 3) : [];
            row.reason = "";
          } else {
            row.status = "failed";
            row.reason = String(
              result && result.health && result.health.reason
                ? result.health.reason
                : result && result.reason
                  ? result.reason
                  : "Bridge test failed."
            );
          }
        } catch (err) {
          row.status = "failed";
          row.reason = String(err && err.message ? err.message : err || "Bridge test failed.");
        }

        results.push(row);
      }

      const summary = {
        running: false,
        total: providers.length,
        connected: results.filter((item) => item.status === "connected").length,
        failed: results.filter((item) => item.status === "failed").length,
        skipped: results.filter((item) => item.status === "skipped" || item.status === "blocked").length,
        results
      };
      renderProviderSweepResults(summary);

      if (summary.connected === summary.total && summary.total > 0) {
        showBanner("Provider sweep passed. All provider lanes are connected.", "ok");
      } else if (summary.failed === 0) {
        showBanner(`Provider sweep partial: ${summary.connected}/${summary.total} connected.`, "ok");
      } else {
        showBanner(`Provider sweep found issues: ${summary.failed} failed, ${summary.skipped} pending setup.`, "bad");
      }
      return summary;
    }

    async function saveDraftBridgeProfile() {
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
      return draft;
    }

    async function deleteSelectedBridgeProfile() {
      const profiles = getNormalizedProfiles(appState.settings);
      if (profiles.length <= 1) {
        showBanner("At least one profile must remain.", "bad");
        return { ok: false, reason: "single_profile" };
      }
      const activeId = String((el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(appState.settings, profiles));
      const nextProfiles = profiles.filter((row) => row.id !== activeId);
      const fallback = nextProfiles[0];
      await applySettingsPatch({
        connectionProfiles: nextProfiles,
        activeProfileId: fallback ? fallback.id : "local-default"
      });
      showBanner("Profile deleted.", "ok");
      return {
        ok: true,
        activeProfileId: fallback ? fallback.id : "local-default"
      };
    }

    async function useSelectedBridgeProfile() {
      const profiles = getNormalizedProfiles(appState.settings);
      const activeId = String((el.profileSelect && el.profileSelect.value) || resolveActiveProfileId(appState.settings, profiles));
      return activateBridgeProfile(activeId);
    }

    function bindBridgeSettingsEvents() {
      if (el.refreshSettingsModelsBtn) {
        el.refreshSettingsModelsBtn.onclick = () => refreshModels().catch((err) => showBanner(err.message || String(err), "bad"));
      }
      if (el.settingsDetectBridgeBtn) {
        el.settingsDetectBridgeBtn.onclick = () => {
          runBridgeAutoDetect().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.offlineModeInput) {
        el.offlineModeInput.onchange = () => {
          persistOfflineModePreference(Boolean(el.offlineModeInput.checked)).catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.allowRemoteBridgeInput) {
        el.allowRemoteBridgeInput.onchange = () => {
          updateSettingsConnectionModeText();
        };
      }
      if (el.settingsModelSelect) {
        el.settingsModelSelect.onchange = async () => {
          await setActiveModel(el.settingsModelSelect.value);
        };
      }
      if (el.applySettingsBtn) {
        el.applySettingsBtn.onclick = () => {
          applySettingsFromInputs().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.profileSelect) {
        el.profileSelect.onchange = () => {
          if (typeof deps.updateProfileFormFromSelected === "function") {
            deps.updateProfileFormFromSelected();
          }
        };
      }
      if (el.profileProviderSelect) {
        el.profileProviderSelect.onchange = () => {
          if (typeof deps.syncProfileProviderPreset === "function") {
            deps.syncProfileProviderPreset(el.profileProviderSelect.value);
          }
        };
      }
      if (el.profileNewBtn) {
        el.profileNewBtn.onclick = () => {
          createNewBridgeProfile().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.importEnvProfilesBtn) {
        el.importEnvProfilesBtn.onclick = () => {
          importEnvProfiles().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.runProviderSweepBtn) {
        el.runProviderSweepBtn.onclick = () => {
          runProviderSweep().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.profileTestBtn) {
        el.profileTestBtn.onclick = async () => {
          const result = await testDraftBridgeProfile();
          if (result && result.ok) {
            showBanner("Profile test passed.", "ok");
            return;
          }
          const reason = result && result.health && result.health.reason
            ? result.health.reason
            : result && result.reason
              ? result.reason
              : "Bridge test failed.";
          showBanner(`Profile test failed: ${reason}`, "bad");
        };
      }
      if (el.profileSaveBtn) {
        el.profileSaveBtn.onclick = () => {
          saveDraftBridgeProfile().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.profileDeleteBtn) {
        el.profileDeleteBtn.onclick = () => {
          deleteSelectedBridgeProfile().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
      if (el.profileUseBtn) {
        el.profileUseBtn.onclick = () => {
          useSelectedBridgeProfile().catch((err) => showBanner(err.message || String(err), "bad"));
        };
      }
    }

    return {
      bindBridgeSettingsEvents,
      syncSettingsInputsFromState
    };
  }

  return {
    createBridgeSettingsFeature
  };
});

