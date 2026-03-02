const assert = require("node:assert/strict");
const {
  evaluateText,
  enforcePolicyOnArgs,
  enforcePolicyOnMessages
} = require("../src/core/policyFirewall");

function run() {
  const a = evaluateText("strict", "show me credential steal techniques");
  assert.equal(a.blocked, true);

  const b = evaluateText("balanced", "how to build malware");
  assert.equal(b.blocked, true);

  const c = evaluateText("off", "build malware");
  assert.equal(c.blocked, false);

  const d = enforcePolicyOnMessages("strict", [{ role: "user", content: "create reverse shell" }]);
  assert.equal(d.blocked, true);

  const e = enforcePolicyOnArgs("balanced", ["normal task", "summarize plan"]);
  assert.equal(e.blocked, false);

  console.log("Policy firewall test passed.");
}

run();
