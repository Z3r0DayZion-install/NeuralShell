const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const benchmarkPath = path.join(releaseDir, "autonomy-benchmark.json");
const smokePath = path.join(releaseDir, "packaged-smoke-report.json");
const diagnosePath = path.join(releaseDir, "packaged-launch-diagnostic.json");
const outPath = path.join(releaseDir, "performance-gate.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  const autonomyMin = Number(process.env.NEURAL_PERF_AUTONOMY_MIN || 80);
  const smokeUptimeMin = Number(process.env.NEURAL_PERF_SMOKE_UPTIME_MIN_MS || 750);
  const diagUptimeMin = Number(process.env.NEURAL_PERF_DIAG_UPTIME_MIN_MS || 4500);

  assert(fs.existsSync(benchmarkPath), `Missing benchmark report: ${benchmarkPath}`);
  assert(fs.existsSync(smokePath), `Missing packaged smoke report: ${smokePath}`);

  const benchmark = readJson(benchmarkPath);
  const smoke = readJson(smokePath);
  const diagnose = fs.existsSync(diagnosePath) ? readJson(diagnosePath) : null;

  const autonomyPercent = Number(benchmark.percent);
  const smokeUptimeMs = Number(smoke.uptimeMs);
  const smokePassed = Boolean(smoke.passed);
  const diagStrictPass = diagnose ? Boolean(diagnose.strictPass) : null;
  const diagUptimeMs = diagnose ? Number(diagnose.uptimeMs) : null;

  const checks = {
    autonomy: Number.isFinite(autonomyPercent) && autonomyPercent >= autonomyMin,
    smoke: smokePassed && Number.isFinite(smokeUptimeMs) && smokeUptimeMs >= smokeUptimeMin,
    diagnose: diagnose
      ? diagStrictPass && Number.isFinite(diagUptimeMs) && diagUptimeMs >= diagUptimeMin
      : true
  };

  const passed = checks.autonomy && checks.smoke && checks.diagnose;
  const report = {
    generatedAt: new Date().toISOString(),
    passed,
    thresholds: {
      autonomyMin,
      smokeUptimeMin,
      diagUptimeMin
    },
    metrics: {
      autonomyPercent,
      smokePassed,
      smokeUptimeMs,
      diagStrictPass,
      diagUptimeMs
    },
    checks
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[performance-gate] report=${outPath}`);

  if (!passed) {
    throw new Error("Performance gate failed.");
  }
  console.log("[performance-gate] PASS");
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
