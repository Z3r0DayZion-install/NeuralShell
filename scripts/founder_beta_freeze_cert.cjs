const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version = String(pkg.version || "0.0.0");

const betaRoot = path.join(ROOT, "beta", `founder-beta-v${version}`);
const manifestPath = path.join(betaRoot, "BETA_PACKAGE_MANIFEST.json");
const dryRunReportPath = path.join(ROOT, "release", "founder-beta-dry-run-report.json");
const outboundZipPath = path.join(ROOT, "release", "outbound-founder-beta", `NeuralShell-founder-beta-v${version}.zip`);
const certPath = path.join(ROOT, "release", "outbound-founder-beta", `NeuralShell-founder-beta-v${version}-freeze-cert.json`);

function sha256(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
}

function run() {
  ensureFile(manifestPath);
  ensureFile(dryRunReportPath);
  ensureFile(outboundZipPath);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const dryRun = JSON.parse(fs.readFileSync(dryRunReportPath, "utf8"));
  const dryRunPassed = dryRun && dryRun.passed === true;

  const cert = {
    generatedAt: new Date().toISOString(),
    version,
    frozenPackage: {
      betaRoot: rel(betaRoot),
      outboundZip: rel(outboundZipPath),
      outboundZipSha256: sha256(outboundZipPath),
      manifestPath: rel(manifestPath),
      manifestSha256: sha256(manifestPath),
      manifestFileCount: Array.isArray(manifest.files) ? manifest.files.length : 0,
    },
    validation: {
      cleanMachineDryRunPath: rel(dryRunReportPath),
      cleanMachineDryRunPassed: dryRunPassed,
      blockerCategories: [
        "install",
        "first-run clarity",
        "proof flow",
        "packaging trust",
        "session continuity",
      ],
    },
    status: dryRunPassed ? "frozen-and-validated" : "frozen-with-dryrun-failures",
  };

  fs.mkdirSync(path.dirname(certPath), { recursive: true });
  fs.writeFileSync(certPath, `${JSON.stringify(cert, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(cert, null, 2));

  if (!cert.validation.cleanMachineDryRunPassed) {
    process.exitCode = 1;
  }
}

run();
