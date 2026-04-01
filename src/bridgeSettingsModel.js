(function initBridgeSettingsModel(root, factory) {
  const model = factory(
    typeof module === "object" && module.exports
      ? require("./bridgeProfileModel")
      : root.NeuralShellBridgeProfileModel || {}
  );
  if (typeof module === "object" && module.exports) {
    module.exports = model;
  }
  root.NeuralShellBridgeSettingsModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildBridgeSettingsModel(bridgeProfileModel) {
  function fallbackNormalizeProviderId(id) {
    return String(id || "ollama").trim().toLowerCase() || "ollama";
  }

  function fallbackGetProvider(id, defaultLocalBaseUrl) {
    return {
      id: fallbackNormalizeProviderId(id),
      defaultBaseUrl: defaultLocalBaseUrl,
      suggestedModels: []
    };
  }

  function normalizeBridgeSettings(settings = {}, options = {}) {
    const current = settings && typeof settings === "object" ? settings : {};
    const fallbackModel = String(options.fallbackModel || current.model || "llama3").trim() || "llama3";
    const defaultLocalBaseUrl = String(current.ollamaBaseUrl || options.defaultLocalBaseUrl || "http://127.0.0.1:11434").trim() || "http://127.0.0.1:11434";
    const defaultTimeoutMs = Number.isFinite(Number(options.defaultTimeoutMs)) ? Number(options.defaultTimeoutMs) : 15000;
    const defaultRetryCount = Number.isFinite(Number(options.defaultRetryCount)) ? Number(options.defaultRetryCount) : 2;
    const normalizeProviderId = typeof options.normalizeProviderId === "function"
      ? options.normalizeProviderId
      : fallbackNormalizeProviderId;
    const getProvider = typeof options.getProvider === "function"
      ? options.getProvider
      : (providerId) => fallbackGetProvider(providerId, defaultLocalBaseUrl);
    const profiles = bridgeProfileModel && typeof bridgeProfileModel.normalizeBridgeProfiles === "function"
      ? bridgeProfileModel.normalizeBridgeProfiles(current, {
        ...options,
        fallbackModel,
        normalizeProviderId,
        getProvider,
        defaultLocalBaseUrl,
        defaultTimeoutMs,
        defaultRetryCount
      })
      : [{
        id: "local-default",
        name: "Local Ollama",
        provider: "ollama",
        baseUrl: defaultLocalBaseUrl,
        timeoutMs: defaultTimeoutMs,
        retryCount: defaultRetryCount,
        defaultModel: fallbackModel,
        apiKey: ""
      }];
    const activeProfileId = bridgeProfileModel && typeof bridgeProfileModel.resolveActiveProfileId === "function"
      ? bridgeProfileModel.resolveActiveProfileId(current, profiles)
      : String(current.activeProfileId || (profiles[0] && profiles[0].id) || "local-default");
    const activeProfile = bridgeProfileModel && typeof bridgeProfileModel.findBridgeProfileById === "function"
      ? bridgeProfileModel.findBridgeProfileById(profiles, activeProfileId)
      : profiles.find((profile) => String(profile && profile.id || "") === String(activeProfileId)) || null;

    return {
      ...current,
      connectionProfiles: profiles,
      activeProfileId,
      allowRemoteBridge: current.allowRemoteBridge == null ? Boolean(options.defaultAllowRemoteBridge) : Boolean(current.allowRemoteBridge),
      connectOnStartup: current.connectOnStartup == null ? options.defaultConnectOnStartup !== false : Boolean(current.connectOnStartup),
      autoLoadRecommendedContextProfile: current.autoLoadRecommendedContextProfile == null
        ? Boolean(options.defaultAutoLoadRecommendedContextProfile)
        : Boolean(current.autoLoadRecommendedContextProfile),
      ollamaBaseUrl: activeProfile
        ? String(activeProfile.baseUrl || defaultLocalBaseUrl).trim() || defaultLocalBaseUrl
        : defaultLocalBaseUrl,
      timeoutMs: activeProfile ? Number(activeProfile.timeoutMs || defaultTimeoutMs) : defaultTimeoutMs,
      retryCount: activeProfile ? Number(activeProfile.retryCount || defaultRetryCount) : defaultRetryCount
    };
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function mergeBridgeSettings(current, patch, options = {}) {
    const baseCurrent = current && typeof current === "object" ? current : {};
    const delta = patch && typeof patch === "object" ? patch : {};
    const merged = {
      ...baseCurrent,
      ...delta
    };
    const shouldProjectLegacyBridgeFields = !Array.isArray(delta.connectionProfiles) && (
      hasOwn(delta, "ollamaBaseUrl")
      || hasOwn(delta, "timeoutMs")
      || hasOwn(delta, "retryCount")
      || hasOwn(delta, "provider")
      || hasOwn(delta, "apiKey")
    );

    if (shouldProjectLegacyBridgeFields) {
      const seededProfiles = normalizeBridgeSettings(merged, options).connectionProfiles.map((profile) => ({ ...profile }));
      const requestedId = String(merged.activeProfileId || (seededProfiles[0] && seededProfiles[0].id) || "local-default");
      const activeIndex = seededProfiles.findIndex((profile) => String(profile && profile.id || "") === requestedId);
      const targetIndex = activeIndex >= 0 ? activeIndex : 0;
      if (targetIndex >= 0 && seededProfiles[targetIndex]) {
        const targetProfile = seededProfiles[targetIndex];
        const normalizeProviderId = typeof options.normalizeProviderId === "function"
          ? options.normalizeProviderId
          : fallbackNormalizeProviderId;

        if (hasOwn(delta, "ollamaBaseUrl")) {
          targetProfile.baseUrl = String(delta.ollamaBaseUrl || targetProfile.baseUrl).trim() || targetProfile.baseUrl;
        }
        if (hasOwn(delta, "timeoutMs")) {
          targetProfile.timeoutMs = delta.timeoutMs;
        }
        if (hasOwn(delta, "retryCount")) {
          targetProfile.retryCount = delta.retryCount;
        }
        if (hasOwn(delta, "provider")) {
          targetProfile.provider = normalizeProviderId(delta.provider);
        }
        if (hasOwn(delta, "apiKey")) {
          targetProfile.apiKey = String(delta.apiKey == null ? "" : delta.apiKey).trim();
        }
        merged.connectionProfiles = seededProfiles;
        merged.activeProfileId = targetProfile.id;
      }
    }

    return normalizeBridgeSettings(merged, options);
  }

  return {
    mergeBridgeSettings,
    normalizeBridgeSettings
  };
});

