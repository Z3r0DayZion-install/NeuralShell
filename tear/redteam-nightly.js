const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const outputPath = path.join(releaseDir, "redteam-nightly.json");

function runCheck(name, command) {
  const startedAt = new Date().toISOString();
  try {
    execSync(command, { cwd: root, stdio: "inherit" });
    return { name, command, startedAt, passed: true };
  } catch (err) {
    return {
      name,
      command,
      startedAt,
      passed: false,
      error: err && err.message ? err.message : String(err)
    };
  }
}

function main() {
  const checks = [
    ["policy-firewall", "node tear/policy-firewall.test.js"],
    ["audit-chain", "node tear/audit-chain.test.js"],
    ["security-guards", "node tear/security-guards.test.js"]
  ];

  const results = checks.map(([name, cmd]) => runCheck(name, cmd));
  const passed = results.every((item) => item.passed);

  const payload = {
    generatedAt: new Date().toISOString(),
    passed,
    checks: results
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));

  if (!passed) {
    throw new Error(`Redteam nightly failed. See ${outputPath} for details.`);
  }

  console.log(`Redteam nightly passed. report=${outputPath}`);
}

main();
