const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const command = process.argv.slice(2).join(" ").trim();

function runOnce(label) {
  console.log(`\n[flaky-gate] ${label}: ${command}`);
  try {
    execSync(command, { cwd: root, stdio: "inherit" });
    return 0;
  } catch (err) {
    if (Number.isInteger(err.status)) return err.status;
    return 1;
  }
}

function main() {
  if (!command) {
    console.error("[flaky-gate] Usage: node scripts/flaky-test-gate.js <command...>");
    process.exit(2);
  }

  const firstStatus = runOnce("attempt #1");
  if (firstStatus === 0) {
    console.log("[flaky-gate] PASS: first attempt succeeded.");
    return;
  }

  console.warn(`[flaky-gate] attempt #1 failed with exit code ${firstStatus}; retrying once...`);
  const secondStatus = runOnce("attempt #2");

  if (secondStatus === 0) {
    console.error(
      `[flaky-gate] FAIL: inconsistent result detected (first=${firstStatus}, second=${secondStatus}).`
    );
    process.exit(1);
  }

  console.error(
    `[flaky-gate] FAIL: deterministic failure across retries (first=${firstStatus}, second=${secondStatus}).`
  );
  process.exit(secondStatus || 1);
}

main();
