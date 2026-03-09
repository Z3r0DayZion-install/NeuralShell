const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(root, "package.json"), "utf8")
  );
  const verifyShip = String((packageJson.scripts || {})["verify:ship"] || "");

  assert(verifyShip.includes("npm run diagnose:packaged"), "verify:ship must run diagnose:packaged.");
  assert(verifyShip.includes("npm run perf:gate"), "verify:ship must run perf:gate.");
  assert(
    verifyShip.indexOf("npm run diagnose:packaged") < verifyShip.indexOf("npm run perf:gate"),
    "verify:ship must run diagnose:packaged before perf:gate."
  );

  const perfGatePath = path.join(root, "scripts", "performance-gate.js");
  const source = fs.readFileSync(perfGatePath, "utf8");
  assert(source.includes("NEURAL_PERF_REQUIRE_DIAG"), "performance-gate must support NEURAL_PERF_REQUIRE_DIAG.");
  assert(
    source.includes("Missing packaged diagnostics report"),
    "performance-gate must fail when diagnostics report is required but missing."
  );

  console.log("Performance gate contract test passed.");
}

run();
