(function initAirgapPolicy(root, factory) {
  const policy = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = policy;
  }
  root.NeuralShellAirgapPolicy = policy;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildAirgapPolicy() {
  const LOOPBACK_HOSTS = ["127.0.0.1", "localhost", "::1"];
  const OFFLINE_MODE_BLOCKED_MESSAGE = "Offline Mode is on. Hosted bridges are blocked.";

  function normalizeHostname(hostname) {
    return String(hostname || "").trim().toLowerCase();
  }

  function isLoopbackHost(hostname) {
    return LOOPBACK_HOSTS.includes(normalizeHostname(hostname));
  }

  function hostnameFromBaseUrl(baseUrl) {
    const raw = String(baseUrl || "").trim();
    if (!raw) return "";
    try {
      return normalizeHostname(new URL(raw).hostname);
    } catch {
      return "";
    }
  }

  function profileNeedsRemoteAccess(profile, options = {}) {
    if (!profile || typeof profile !== "object") return false;
    const providerId = String(profile.provider || "").trim();
    const providerRemote = typeof options.isRemoteProvider === "function"
      ? Boolean(options.isRemoteProvider(providerId))
      : Boolean(profile.remote);
    const hostname = hostnameFromBaseUrl(profile.baseUrl);
    if (!hostname) {
      return providerRemote;
    }
    return !isLoopbackHost(hostname);
  }

  function resolveBridgeSelection(options = {}) {
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
      && profileNeedsRemoteAccess(selectedProfile, { isRemoteProvider: options.isRemoteProvider })
    ) {
      liveProfile = profiles.find((profile) => !profileNeedsRemoteAccess(profile, { isRemoteProvider: options.isRemoteProvider })) || null;
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
  }

  function offlineModeEnabled(settings) {
    return !(settings && settings.allowRemoteBridge);
  }

  function settingsConnectionModeText(options = {}) {
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
  }

  function offlineModeSummaryText(allowRemoteBridge) {
    return allowRemoteBridge
      ? "Offline Mode is off. Hosted profiles are available whenever you intentionally select them."
      : "Offline Mode is on. Hosted providers stay blocked and NeuralShell stays local-only.";
  }

  return {
    LOOPBACK_HOSTS,
    OFFLINE_MODE_BLOCKED_MESSAGE,
    hostnameFromBaseUrl,
    isLoopbackHost,
    offlineModeEnabled,
    offlineModeSummaryText,
    profileNeedsRemoteAccess,
    resolveBridgeSelection,
    settingsConnectionModeText
  };
});
