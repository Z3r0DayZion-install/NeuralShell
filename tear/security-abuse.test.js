const assert = require("node:assert/strict");
const {
  validateCommandArgs,
  validateCommandName,
  validateMessages,
  validateSettings,
  validateStateKey,
  validateStateUpdates
} = require("../src/core/ipcValidators");
const intentFirewall = require("../src/security/intentFirewall");

async function run() {
  // IPC validator abuse cases
  assert.throws(() => validateMessages("not-an-array"), /array/i);
  assert.throws(() => validateMessages([{ role: "user", content: "   " }]), /content/i);
  assert.throws(() => validateStateUpdates(null), /object/i);
  assert.throws(() => validateStateKey("prototype"), /blocked/i);
  assert.throws(() => validateCommandName("drop table;"), /invalid/i);
  assert.deepEqual(validateCommandArgs([null, 5, "x"]), ["", "5", "x"]);

  // Settings hard limits
  assert.throws(() => validateSettings({ timeoutMs: 1 }), /out of range/i);
  assert.throws(() => validateSettings({ retryCount: 99 }), /out of range/i);
  assert.throws(() => validateSettings({ tokenBudget: 0 }), /out of range/i);
  assert.throws(() => validateSettings({ autosaveIntervalMin: 2000 }), /out of range/i);

  // Intent firewall abuse cases
  await assert.rejects(
    () => intentFirewall.validate("kernel:unknown", {}),
    /Intent not allowed/i
  );
  await assert.rejects(
    () => intentFirewall.validate("kernel:net:fetch", { url: "https://ok", bad: true }),
    /unexpected field/i
  );
  await assert.rejects(
    () => intentFirewall.validate("llm:chat", null),
    /must be an object/i
  );

  const approved = await intentFirewall.validate("kernel:net:fetch", { url: "https://updates.neuralshell.app" });
  assert.equal(approved.intent, "kernel:net:fetch");
  assert.equal(approved.requiresApproval, true);

  console.log("Security abuse test passed.");
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
