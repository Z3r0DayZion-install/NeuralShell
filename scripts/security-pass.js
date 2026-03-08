const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "release", "security-pass.json");
const skipAudit = process.argv.includes("--skip-audit");

function run(cmd) {
  const started = Date.now();
  try {
    console.log(`\n[security-pass] ${cmd}`);
    execSync(cmd, { cwd: root, stdio: "inherit" });
    return {
      cmd,
      ok: true,
      durationMs: Date.now() - started
    };
  } catch (err) {
    return {
      cmd,
      ok: false,
      durationMs: Date.now() - started,
      code: Number.isInteger(err.status) ? err.status : 1,
      error: err.message || String(err)
    };
  }
}

function main() {
  const stages = [
    "node tests/omega_security.test.js",
    "node tear/security-guards.test.js",
    "node tear/security-abuse.test.js",
    "node scripts/verify-source-integrity.js"
  ];

  if (!skipAudit) {
    stages.unshift("npm audit --omit=dev --audit-level=high");
  }

  const results = [];
  for (const stage of stages) {
    const result = run(stage);
    results.push(result);
    if (!result.ok) {
      break;
    }
  }

  const passed = results.length === stages.length && results.every((r) => r.ok);
  const report = {
    generatedAt: new Date().toISOString(),
    passed,
    skipAudit,
    stages: results
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[security-pass] Report written: ${outPath}`);

  if (!passed) {
    const failed = results.find((r) => !r.ok);
    throw new Error(`Security pass failed at stage: ${failed ? failed.cmd : "unknown"}`);
  }

  console.log("[security-pass] PASS");
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
