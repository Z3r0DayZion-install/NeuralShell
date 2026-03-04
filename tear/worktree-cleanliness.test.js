const path = require("path");

const gate = require(path.join(__dirname, "..", "scripts", "verify-clean-worktree.js"));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const parsed = gate.parseStatusLine(" M src/main.js");
  assert(parsed && parsed.code === " M", "Failed to parse modified status code.");
  assert(parsed.path === "src/main.js", "Failed to parse modified file path.");

  const renamed = gate.parseStatusLine("R  src/old.js -> src/new.js");
  assert(renamed && renamed.path === "src/new.js", "Failed to parse rename target path.");

  const patterns = [
    "artifacts/var_proof/**",
    "governance/OMEGA_COMPLIANCE_REGISTRY.json"
  ];

  assert(
    gate.isAllowed("artifacts/var_proof/latest/manifest.json", patterns),
    "Expected var_proof path to match allowlist pattern."
  );
  assert(
    gate.isAllowed("governance/OMEGA_COMPLIANCE_REGISTRY.json", patterns),
    "Expected governance registry path to match allowlist pattern."
  );
  assert(
    !gate.isAllowed("src/main.js", patterns),
    "Unexpected allowlist match for source file."
  );

  console.log("Worktree cleanliness test passed.");
}

run();
