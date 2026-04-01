// TypeScript bridge entrypoint for IDE/plugin integrations.
// Runtime implementation lives in ws_bridge.js (CommonJS, Electron main process).
// This file exists so plugin/runtime docs can point to a TS path.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bridge = require("./ws_bridge.js");

export const DaemonWsBridge = bridge.DaemonWsBridge;
export const signJwt = bridge.signJwt;
export const verifyJwt = bridge.verifyJwt;

export default bridge;

