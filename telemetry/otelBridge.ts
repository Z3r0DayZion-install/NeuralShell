// TypeScript entrypoint for OpenTelemetry local exporter bridge.
// Runtime implementation uses CommonJS for Electron compatibility.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bridge = require("./otelBridge.js");

export const OTelBridge = bridge.OTelBridge;
export default bridge;

