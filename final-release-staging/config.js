(function initConfig(root, factory) {
    const config = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = config;
    }
    root.NeuralShellConfig = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildConfig() {
    const LLM_STATUS = {
        BOOTING: "booting",
        ONLINE: "bridge_online",
        BUSY: "busy",
        CANCELLED: "cancelled",
        RECONNECTING: "bridge_reconnecting",
        OFFLINE: "bridge_offline",
        ERROR: "error"
    };

    const LLM_STATUS_MESSAGES = {
        [LLM_STATUS.ONLINE]: {
            short: "Local bridge online.",
            detail: "NeuralShell can reach the active model bridge.",
            tone: "ok"
        },
        [LLM_STATUS.BUSY]: {
            short: "Bridge busy.",
            detail: "A request is in flight.",
            tone: "ok"
        },
        [LLM_STATUS.CANCELLED]: {
            short: "Request cancelled.",
            detail: "Generation was cancelled cleanly.",
            tone: "bad"
        },
        [LLM_STATUS.RECONNECTING]: {
            short: "Reconnecting to bridge...",
            detail: "The bridge connection was lost or is initializing. Retrying in the background based on your connection rules.",
            tone: "warn"
        },
        [LLM_STATUS.OFFLINE]: {
            short: "Bridge offline.",
            detail: "The configured bridge is offline. Check the base URL or switch profiles in LLM Setup.",
            tone: "bad"
        },
        [LLM_STATUS.ERROR]: {
            short: "Bridge error detected.",
            detail: "A critical error occurred while communicating with the bridge. Check your logs and local LLM service status.",
            tone: "bad"
        },
        [LLM_STATUS.BOOTING]: {
            short: "Checking local bridge...",
            detail: "NeuralShell is probing the configured model bridge.",
            tone: "ok"
        },
        UNKNOWN: {
            short: "LLM status unknown.",
            detail: "Open LLM Setup in the settings drawer to inspect the active bridge, model, and connection rules.",
            tone: "ok"
        }
    };

    const CONNECTION_DEFAULTS = {
        BRIDGE_HEALTH_INTERVAL_MS: 12000,
        REQUEST_TIMEOUT_MS: 15000,
        RETRY_COUNT: 2,
        RETRY_BASE_DELAY_MS: 250
    };

    return {
        LLM_STATUS,
        LLM_STATUS_MESSAGES,
        CONNECTION_DEFAULTS
    };
});
