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

    const RECOVERY_COPY = {
        FALLBACK_STATUS_DETAIL: "Open LLM Setup in the settings drawer to inspect the active bridge, model, and connection rules.",
        STARTER_PROMPT_FALLBACK: "Diagnose the local bridge, recommend the smallest safe fix, and keep the workflow offline-first.",
        BANNERS: {
            OFFLINE_MODE_REVERTED: "Offline Mode turned on. Live bridge reverted to {profileName}.",
            OFFLINE_MODE_BLOCKED: "Offline Mode turned on. Hosted profiles are blocked.",
            OFFLINE_MODE_HOSTED_AVAILABLE: "Offline Mode turned off. Hosted profiles are available again.",
            BRIDGE_CONNECTED: "Bridge connection established.",
            BRIDGE_DISCONNECTED: "Bridge connection lost.",
            STARTER_PROMPT_LOADED: "Starter prompt loaded.",
            DETECTING_LOCAL_BRIDGE: "Detecting local bridge...",
            LOCAL_BRIDGE_DETECTED: "Local bridge detected at {baseUrl}.",
            LOCAL_BRIDGE_NOT_DETECTED: "Local bridge not detected: {reason}",
            BRIDGE_DETECT_FAILED: "Bridge detect failed: {reason}",
            CHECKING_BRIDGE_HEALTH: "Checking bridge health...",
            BRIDGE_HEALTHY: "Bridge healthy at {baseUrl}.",
            BRIDGE_HEALTH_FAILED: "Bridge health failed: {reason}"
        },
        EMPTY_STATE: {
            TITLE: "No active conversation yet.",
            HINTS: [
                "1. Detect the bridge and confirm the base URL.",
                "2. Pick a model in Chat Ops or LLM Setup.",
                "3. Load a workflow prompt when you want a guided next step."
            ],
            ACTIONS: {
                DETECT_LOCAL_BRIDGE: "Detect Local Bridge",
                OPEN_SETTINGS_MENU: "Open Settings Menu",
                LOAD_STARTER_PROMPT: "Load Starter Prompt"
            }
        }
    };

    return {
        LLM_STATUS,
        LLM_STATUS_MESSAGES,
        CONNECTION_DEFAULTS,
        RECOVERY_COPY
    };
});
