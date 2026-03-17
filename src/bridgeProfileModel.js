(function initBridgeProfileModel(root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = model;
  }
  root.NeuralShellBridgeProfileModel = model;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildBridgeProfileModel() {
  function clampNumber(value, min, max, fallback) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return fallback;
    return Math.min(max, Math.max(min, numeric));
  }

  function profileIdFromName(name) {
    const base = String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return base || "profile";
  }

  function normalizeBridgeProfile(rawProfile, options = {}) {
    const profile = rawProfile && typeof rawProfile === "object" ? rawProfile : {};
    const normalizeProviderId = typeof options.normalizeProviderId === "function"
      ? options.normalizeProviderId
      : (id) => String(id || "ollama").trim().toLowerCase() || "ollama";
    const fallbackModel = String(options.fallbackModel || "llama3").trim() || "llama3";
    const defaultLocalBaseUrl = String(options.defaultLocalBaseUrl || "http://127.0.0.1:11434").trim() || "http://127.0.0.1:11434";
    const defaultTimeoutMs = Number.isFinite(Number(options.defaultTimeoutMs)) ? Number(options.defaultTimeoutMs) : 15000;
    const defaultRetryCount = Number.isFinite(Number(options.defaultRetryCount)) ? Number(options.defaultRetryCount) : 2;
    const providerId = normalizeProviderId(profile.provider || "ollama");
    const getProvider = typeof options.getProvider === "function" ? options.getProvider : () => null;
    const provider = getProvider(providerId) || {
      id: providerId,
      defaultBaseUrl: defaultLocalBaseUrl,
      suggestedModels: []
    };
    const suggestedModel = Array.isArray(provider.suggestedModels) && provider.suggestedModels[0]
      ? String(provider.suggestedModels[0]).trim()
      : "";
    const profileName = String(profile.name || "Local Ollama").trim() || "Local Ollama";
    return {
      id: String(profile.id || options.fallbackId || profileIdFromName(profileName)).trim() || "profile",
      name: profileName,
      provider: providerId,
      baseUrl: String(profile.baseUrl || provider.defaultBaseUrl || defaultLocalBaseUrl).trim() || String(provider.defaultBaseUrl || defaultLocalBaseUrl),
      timeoutMs: clampNumber(profile.timeoutMs, 1000, 120000, defaultTimeoutMs),
      retryCount: clampNumber(profile.retryCount, 0, 10, defaultRetryCount),
      defaultModel: String(profile.defaultModel || fallbackModel || suggestedModel || "llama3").trim() || fallbackModel || suggestedModel || "llama3",
      apiKey: String(profile.apiKey || "").trim()
    };
  }

  function normalizeBridgeProfiles(settings = {}, options = {}) {
    const current = settings && typeof settings === "object" ? settings : {};
    const fallbackModel = String(options.fallbackModel || current.model || "llama3").trim() || "llama3";
    const defaultLocalBaseUrl = String(current.ollamaBaseUrl || options.defaultLocalBaseUrl || "http://127.0.0.1:11434").trim() || "http://127.0.0.1:11434";
    const defaultTimeoutMs = clampNumber(current.timeoutMs, 1000, 120000, Number.isFinite(Number(options.defaultTimeoutMs)) ? Number(options.defaultTimeoutMs) : 15000);
    const defaultRetryCount = clampNumber(current.retryCount, 0, 10, Number.isFinite(Number(options.defaultRetryCount)) ? Number(options.defaultRetryCount) : 2);
    let profiles = Array.isArray(current.connectionProfiles) ? current.connectionProfiles.slice() : [];
    if (!profiles.length) {
      profiles = [{
        id: "local-default",
        name: "Local Ollama",
        provider: "ollama",
        baseUrl: defaultLocalBaseUrl,
        timeoutMs: defaultTimeoutMs,
        retryCount: defaultRetryCount,
        defaultModel: fallbackModel
      }];
    }
    const seen = new Set();
    const normalized = [];
    profiles.forEach((row, index) => {
      let profile = normalizeBridgeProfile(row, {
        ...options,
        fallbackModel,
        fallbackId: `profile-${index + 1}`,
        defaultLocalBaseUrl,
        defaultTimeoutMs,
        defaultRetryCount
      });
      let id = profile.id;
      let suffix = 1;
      while (seen.has(id)) {
        id = `${profile.id}-${suffix}`;
        suffix += 1;
      }
      seen.add(id);
      normalized.push({
        ...profile,
        id
      });
    });
    return normalized;
  }

  function resolveActiveProfileId(settings, profiles) {
    const requested = String((settings && settings.activeProfileId) || "").trim();
    if (requested && Array.isArray(profiles) && profiles.some((profile) => String(profile && profile.id || "") === requested)) {
      return requested;
    }
    return Array.isArray(profiles) && profiles[0]
      ? String(profiles[0].id || "local-default")
      : "local-default";
  }

  function findBridgeProfileById(profiles, id) {
    return (Array.isArray(profiles) ? profiles : []).find((profile) => String(profile && profile.id || "") === String(id)) || null;
  }

  return {
    findBridgeProfileById,
    normalizeBridgeProfile,
    normalizeBridgeProfiles,
    profileIdFromName,
    resolveActiveProfileId
  };
});
