const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const runtimeReportPath = path.join(ROOT, "release", "ui-self-sell-proof-report.json");
const packagedReportPath = path.join(ROOT, "release", "ui-self-sell-proof-report-packaged.json");
const outPath = path.join(ROOT, "release", "ui-self-sell-proof-parity.json");
const REQUIRED_SHOTS = ["quickstart", "proof", "roi", "locked", "unlocked"];

function relPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function absPath(maybePath) {
  if (!maybePath) return null;
  return path.isAbsolute(maybePath) ? maybePath : path.join(ROOT, maybePath);
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing report: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function booleanChecks(report) {
  const checks = report && report.checks ? report.checks : {};
  return {
    proof: Boolean(checks.proof),
    roi: Boolean(checks.roi),
    lockFlow: Boolean(checks.lockFlow),
  };
}

function shotCoverage(report) {
  const shots = report && report.shots && typeof report.shots === "object" ? report.shots : {};
  const coverage = {};
  for (const key of REQUIRED_SHOTS) {
    const shotPath = absPath(shots[key]);
    coverage[key] = Boolean(shotPath && fs.existsSync(shotPath));
  }
  return {
    coverage,
    all: REQUIRED_SHOTS.every((key) => coverage[key]),
  };
}

function run() {
  const runtime = readJson(runtimeReportPath);
  const packaged = readJson(packagedReportPath);

  const runtimeChecks = booleanChecks(runtime);
  const packagedChecks = booleanChecks(packaged);
  const runtimeShotCoverage = shotCoverage(runtime);
  const packagedShotCoverage = shotCoverage(packaged);

  const parity = {
    generatedAt: new Date().toISOString(),
    runtimeReportPath: relPath(runtimeReportPath),
    packagedReportPath: relPath(packagedReportPath),
    runtimeMode: runtime.mode || "runtime",
    packagedMode: packaged.mode || "packaged",
    runtimeChecks,
    packagedChecks,
    runtimeShotCoverage,
    packagedShotCoverage,
    match: {
      proof: runtimeChecks.proof === packagedChecks.proof,
      roi: runtimeChecks.roi === packagedChecks.roi,
      lockFlow: runtimeChecks.lockFlow === packagedChecks.lockFlow,
      requiredShotsPresentInBoth: runtimeShotCoverage.all && packagedShotCoverage.all,
    },
    triggerPath: {
      runtime: runtime.triggerPath || {},
      packaged: packaged.triggerPath || {},
    },
    parityPass: false,
    notes: [],
  };

  parity.parityPass = Boolean(
    parity.match.proof
      && parity.match.roi
      && parity.match.lockFlow
      && parity.match.requiredShotsPresentInBoth
  );
  if (!parity.parityPass) {
    parity.notes.push("Parity failed: check mismatch and/or required screenshots missing.");
  } else {
    parity.notes.push("Runtime and packaged checks are aligned for proof/roi/lockFlow and required screenshots exist in both modes.");
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(parity, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(parity, null, 2));
}

run();
