require('./auth-manager.test.js');
require('./auto-engine.test.js');
require('./checkpoint-manager.test.js');
if (process.env.NS_ENABLE_E2E === '1') {
  require('./e2e-recovery.test.js');
  require('./e2e-smoke.test.js');
}
require('./ipc-authz.test.js');
require('./path-guard.test.js');
require('./permission-manager.test.js');
require('./state-schema.test.js');
require('./tear-codec.test.js');
require('./tear-runtime.test.js');
require('./telemetry.test.js');
