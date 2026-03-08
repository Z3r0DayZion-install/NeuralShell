const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const statusPath = path.join(releaseDir, "status.json");
const checksumsPath = path.join(releaseDir, "checksums.json");
const manifestPath = path.join(releaseDir, "manifest.json");
const outputPath = path.join(releaseDir, "slo-gate.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ageMinutes(filePath) {
  const stat = fs.statSync(filePath);
  return Math.round((Date.now() - stat.mtimeMs) / 60000 * 10) / 10;
}

function main() {
  assert(fs.existsSync(statusPath), `Missing release status: ${statusPath}`);
  assert(fs.existsSync(checksumsPath), `Missing release checksums: ${checksumsPath}`);
  assert(fs.existsSync(manifestPath), `Missing release manifest: ${manifestPath}`);

  const status = readJson(statusPath);
  const checksums = readJson(checksumsPath);
  const manifest = readJson(manifestPath);

  const thresholds = {
    maxAgeMinutes: Number(process.env.NEURAL_SLO_MAX_AGE_MIN || 120)
  };

  const ages = {
    status: ageMinutes(statusPath),
    checksums: ageMinutes(checksumsPath),
    manifest: ageMinutes(manifestPath)
  };

  const freshnessPass = Object.values(ages).every((minutes) => minutes <= thresholds.maxAgeMinutes);
  const checksumsCount = Array.isArray(checksums.entries)
    ? checksums.entries.length
    : Number(checksums.entries || 0);
  const checksumsPass = checksumsCount > 0;
  const manifestPass = Number(manifest.fileCount || 0) > 0;
  const artifactPass =
    status.artifacts &&
    status.artifacts.installerExe &&
    status.artifacts.unpackedExe &&
    status.artifacts.appAsar &&
    status.artifacts.updateYml;

  const passed = freshnessPass && checksumsPass && manifestPass && artifactPass;

  const report = {
    generatedAt: new Date().toISOString(),
    passed,
    checks: {
      freshnessPass,
      checksumsPass,
      manifestPass,
      artifactPass
    },
    metrics: {
      checksumsCount
    },
    ages,
    thresholds
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  if (!passed) {
    throw new Error(`SLO gate failed. See ${outputPath}.`);
  }

  console.log(`SLO gate passed. report=${outputPath}`);
}

main();
