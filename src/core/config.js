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
            short: "System Online",
            detail: "Local model bridge is connected and responsive.",
            tone: "good"
        },
        [LLM_STATUS.BUSY]: {
            short: "Bridge Busy",
            detail: "A model request is currently in flight.",
            tone: "ok"
        },
        [LLM_STATUS.CANCELLED]: {
            short: "Request Cancelled",
            detail: "Generation was interrupted by the operator.",
            tone: "warn"
        },
        [LLM_STATUS.RECONNECTING]: {
            short: "Reconnecting...",
            detail: "Connection lost. NeuralShell is automatically re-establishing the local model bridge.",
            tone: "warn"
        },
        [LLM_STATUS.OFFLINE]: {
            short: "Bridge Offline",
            detail: "The configured bridge is offline. Check the base URL or switch profiles in LLM Setup.",
            tone: "bad"
        },
        [LLM_STATUS.ERROR]: {
            short: "Bridge Error",
            detail: "A critical error occurred while communicating with the bridge. Check local LLM service status.",
            tone: "bad"
        },
        [LLM_STATUS.BOOTING]: {
            short: "Initializing...",
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
        BRIDGE_HEALTH_INTERVAL_MS: 5000,
        REQUEST_TIMEOUT_MS: 45000,
        RETRY_COUNT: 3,
        RETRY_BASE_DELAY_MS: 1000
    };

    return {
        LLM_STATUS,
        LLM_STATUS_MESSAGES,
        CONNECTION_DEFAULTS
    };
});
