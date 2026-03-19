/**
 * NeuralShell V2.0 - Telemetry System
 * Structured event logging for UI, Bridge, and Session lifecycles.
 */

const logger = require("./logger");

const EVENT_TYPES = {
    UI_ACTION: "ui_action",
    BRIDGE_STATUS: "bridge_status",
    SESSION_EVENT: "session_event",
    PERFORMANCE: "performance",
    ERROR: "error"
};

/**
 * Log a structured telemetry event.
 * @param {string} type One of EVENT_TYPES
 * @param {string} action The specific action or event name
 * @param {object} metadata Additional context
 */
function track(type, action, metadata = {}) {
    const level = type === EVENT_TYPES.ERROR ? "error" : "info";
    const message = `[TELEMETRY] ${type.toUpperCase()}:${action}`;

    const payload = {
        ...metadata,
        _telemetry: true,
        eventType: type,
        eventAction: action
    };

    logger.log(level, message, payload);
    return true;
}

/**
 * Specialized trackers for common events
 */
const telemetry = {
    EVENT_TYPES,
    track,

    ui: (action, metadata) => track(EVENT_TYPES.UI_ACTION, action, metadata),
    bridge: (status, metadata) => track(EVENT_TYPES.BRIDGE_STATUS, status, metadata),
    session: (event, metadata) => track(EVENT_TYPES.SESSION_EVENT, event, metadata),
    perf: (metric, value, metadata) => track(EVENT_TYPES.PERFORMANCE, metric, { ...metadata, value }),
    error: (source, message, metadata) => track(EVENT_TYPES.ERROR, source, { ...metadata, message })
};

module.exports = telemetry;
