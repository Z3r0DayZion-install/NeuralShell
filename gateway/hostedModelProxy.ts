// TypeScript entrypoint for docs and editor tooling.
// Runtime implementation is CommonJS for Electron main process loading.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const proxy = require("./hostedModelProxy.js");

export const HostedModelProxy = proxy.HostedModelProxy;
export default proxy;

