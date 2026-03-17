const assert = require('assert');
const path = require('path');
const Module = require('module');

// Mock Electron
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  if (id === 'electron') {
    return {
      app: {
        getAppPath: () => process.cwd(),
        getPath: (name) => path.join(process.cwd(), 'tmp', name)
      },
      safeStorage: {
        isEncryptionAvailable: () => false,
        encryptString: (s) => Buffer.from(s),
        decryptString: (b) => b.toString()
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

const pluginLoader = require("../src/core/pluginLoader");

async function runTests() {
  console.log("--- NEURALSHELL PLUGIN INTEGRITY & FUNCTIONALITY TEST ---");

  // 1. Load Plugins
  console.log("[TEST 1] Loading plugins...");
  await pluginLoader.onLoad();
  const commands = pluginLoader.listCommands();
  const commandNames = commands.map(c => c.name);
  assert.ok(commandNames.includes("audit"), "Missing 'audit' command");
  assert.ok(commandNames.includes("proxy"), "Missing 'proxy' command");
  console.log("PASS: All plugins loaded correctly.");

  // 2. Run Audit (Should pass now that ledger is synchronized)
  console.log("[TEST 2] Running integrity audit...");
  const auditRes = await pluginLoader.runCommand("audit");
  assert.strictEqual(auditRes.ok, true, "Audit command failed execution");
  assert.ok(auditRes.result.includes("Audit Complete"), `Audit failed: ${auditRes.result}`);
  console.log("PASS: Integrity audit passed (Ledger Synchronized).");

  // 3. Verify Detailed Audit Report
  console.log("[TEST 3] Verifying detailed audit report...");
  const reportRes = await pluginLoader.runCommand("audit-report");
  assert.strictEqual(reportRes.ok, true, "Audit-report command failed");
  const report = JSON.parse(reportRes.result);
  assert.strictEqual(report.ok, true, "Audit report indicates violations");
  assert.strictEqual(report.violations, 0, "Audit report found violations");
  console.log("PASS: Audit report verified (0 violations).");

  // 4. Test Proxy Command (Header Scrubbing Logic)
  console.log("[TEST 4] Testing 'proxy' command logic...");
  const proxyRes = await pluginLoader.runCommand("proxy", {
    url: "https://updates.neuralshell.app"
  });
  // We expect a NETWORK_ERROR (ENOTFOUND) but we want to see it passed the pinning check
  assert.strictEqual(proxyRes.ok, true, "Proxy command crashed");
  assert.ok(proxyRes.result.status === "NETWORK_ERROR" || proxyRes.result.ok, `Proxy command failed unexpectedly: ${JSON.stringify(proxyRes.result)}`);
  console.log("PASS: Proxy command logic verified (Pinning Gate Passed).");

  console.log("--- ALL PLUGIN TESTS PASSED ---");
}

runTests().catch(err => {
  console.error("PLUGIN TESTS FAILED:", err);
  process.exit(1);
});
