const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const statusPath = path.join(releaseDir, "status.json");
const benchmarkPath = path.join(releaseDir, "autonomy-benchmark.json");
const releaseGatePath = path.join(releaseDir, "release-gate.json");
const outputPath = path.join(releaseDir, "operator-kpi.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function main() {
  assert(fs.existsSync(statusPath), `Missing release status: ${statusPath}`);
  assert(fs.existsSync(benchmarkPath), `Missing benchmark report: ${benchmarkPath}`);

  const status = readJson(statusPath);
  const benchmark = readJson(benchmarkPath);
  const releaseGate = fs.existsSync(releaseGatePath) ? readJson(releaseGatePath) : null;

  const autonomyPercent = Number(benchmark.percent);
  const strictPackagedPass = Boolean(
    (status.packagedDiagnostics && status.packagedDiagnostics.strictPass) ||
      (releaseGate && releaseGate.strictPackagedPass)
  );
  const artifactChecks = status.artifacts || {};
  const artifactsHealthy = Object.values(artifactChecks).every(Boolean);

  const thresholds = {
    autonomyPercentMin: Number(process.env.NEURAL_KPI_AUTONOMY_MIN || 75)
  };

  const passed =
    Number.isFinite(autonomyPercent) &&
    autonomyPercent >= thresholds.autonomyPercentMin &&
    strictPackagedPass &&
    artifactsHealthy;

  const report = {
    generatedAt: new Date().toISOString(),
    passed,
    kpis: {
      autonomyPercent,
      strictPackagedPass,
      artifactsHealthy,
      strictPackagedSource: status.packagedDiagnostics ? "packagedDiagnostics" : "releaseGate"
    },
    thresholds
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  if (!passed) {
    throw new Error(`Operator KPI gate failed. See ${outputPath}.`);
  }

  console.log(`Operator KPI gate passed. report=${outputPath}`);
}

main();
