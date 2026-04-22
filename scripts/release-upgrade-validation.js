const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const defaultRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) return fallback;
  return String(raw).slice(prefix.length).trim() || fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function resolveInputPath(candidate, fallback) {
  if (!candidate) return fallback;
  if (path.isAbsolute(candidate)) return candidate;
  return path.join(defaultRoot, candidate);
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function existsNonEmpty(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function readInstallerPath(rootDir) {
  const distDir = path.join(rootDir, "dist");
  assert(fs.existsSync(distDir), `Missing dist directory: ${distDir}`);
  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  const installers = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^NeuralShell Setup .+\.exe$/i.test(name))
    .filter((name) => !/__uninstaller/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  assert(installers.length > 0, "Missing installer executable under dist/.");
  return path.posix.join("dist", installers[installers.length - 1]);
}

function readUpdateMetadataPath(rootDir) {
  const omega = path.join(rootDir, "dist", "OMEGA.yml");
  if (existsNonEmpty(omega)) return "dist/OMEGA.yml";
  const latest = path.join(rootDir, "dist", "latest.yml");
  if (existsNonEmpty(latest)) return "dist/latest.yml";
  throw new Error("Missing update metadata file (dist/OMEGA.yml or dist/latest.yml).");
}

function parseMetadataVersion(rawYml) {
  const hit = String(rawYml || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => /^version\s*:/i.test(line));
  if (!hit) return null;
  const value = hit.split(":").slice(1).join(":").trim();
  return value ? value.replace(/^['"]|['"]$/g, "") : null;
}

function readInstallerSmoke(rootDir) {
  const filePath = path.join(rootDir, "release", "installer-smoke-report.json");
  if (!existsNonEmpty(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Unable to parse installer smoke report: ${err.message || err}`);
  }
}

function readReleaseGate(rootDir) {
  const filePath = path.join(rootDir, "release", "release-gate.json");
  if (!existsNonEmpty(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Unable to parse release gate report: ${err.message || err}`);
  }
}

function pickInstallerSmokeSummary(installerSmoke) {
  if (!installerSmoke || typeof installerSmoke !== "object") return null;
  const installExitCode =
    installerSmoke.install && Number.isFinite(Number(installerSmoke.install.code))
      ? Number(installerSmoke.install.code)
      : null;
  const smokeExitCode =
    installerSmoke.smoke && Number.isFinite(Number(installerSmoke.smoke.code))
      ? Number(installerSmoke.smoke.code)
      : null;
  return {
    generatedAt: installerSmoke.generatedAt || null,
    strictInstall: Boolean(installerSmoke.strictInstall),
    passed: Boolean(installerSmoke.passed),
    installExitCode,
    smokeExitCode
  };
}

function generateUpgradeValidationReport(options = {}) {
  const rootDir = options.rootDir || defaultRoot;
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
  const strict = options.strict === true;
  const outFile = options.outFile || path.join(rootDir, "release", "upgrade-validation.json");
  const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
  const allowInstallerSoftFail = !isCI || process.env.NEURAL_RELEASE_ALLOW_INSTALLER_SOFTFAIL === "1";

  const installerRel = readInstallerPath(rootDir);
  const installerAbs = path.join(rootDir, installerRel);
  const blockmapRel = `${installerRel}.blockmap`;
  const blockmapAbs = path.join(rootDir, blockmapRel);
  const metadataRel = readUpdateMetadataPath(rootDir);
  const metadataAbs = path.join(rootDir, metadataRel);

  assert(existsNonEmpty(installerAbs), `Missing installer executable: ${installerAbs}`);
  assert(existsNonEmpty(blockmapAbs), `Missing installer blockmap: ${blockmapAbs}`);
  assert(existsNonEmpty(metadataAbs), `Missing update metadata: ${metadataAbs}`);

  const metadataRaw = fs.readFileSync(metadataAbs, "utf8");
  const installerSmoke = readInstallerSmoke(rootDir);
  const installerSmokeSummary = pickInstallerSmokeSummary(installerSmoke);
  const releaseGate = readReleaseGate(rootDir);
  const installerSmokeSoftFailed = Boolean(
    releaseGate
    && releaseGate.strictPackaged === true
    && releaseGate.strictInstallerSoftFailed === true
  );
  const installerSmokeAccepted =
    Boolean(installerSmokeSummary && installerSmokeSummary.passed)
    || (allowInstallerSoftFail && installerSmokeSoftFailed);

  const checks = {
    installerPresent: true,
    installerBlockmapPresent: true,
    updateMetadataPresent: true,
    installerSmokeReportPresent: Boolean(installerSmokeSummary),
    installerSmokePassed: Boolean(installerSmokeSummary && installerSmokeSummary.passed),
    installerSmokeSoftFailed,
    installerSmokeAccepted
  };

  const report = {
    generatedAt: now(),
    strict,
    allowInstallerSoftFail,
    release: {
      installer: {
        path: toPosix(installerRel),
        sizeBytes: fs.statSync(installerAbs).size,
        sha256: sha256File(installerAbs)
      },
      installerBlockmap: {
        path: toPosix(blockmapRel),
        sizeBytes: fs.statSync(blockmapAbs).size,
        sha256: sha256File(blockmapAbs)
      },
      updateMetadata: {
        path: toPosix(metadataRel),
        sizeBytes: fs.statSync(metadataAbs).size,
        sha256: sha256File(metadataAbs),
        version: parseMetadataVersion(metadataRaw)
      }
    },
    installerSmoke: installerSmokeSummary,
    releaseGate: releaseGate
      ? {
        generatedAt: releaseGate.generatedAt || null,
        strictPackaged: Boolean(releaseGate.strictPackaged),
        strictInstallerPass: releaseGate.strictInstallerPass === true,
        strictInstallerSoftFailed: Boolean(releaseGate.strictInstallerSoftFailed)
      }
      : null,
    checks,
    passed:
      checks.installerPresent &&
      checks.installerBlockmapPresent &&
      checks.updateMetadataPresent &&
      checks.installerSmokeAccepted
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (strict && !report.passed) {
    throw new Error(
      `Upgrade validation failed in strict mode. installerSmokePresent=${checks.installerSmokeReportPresent} installerSmokePassed=${checks.installerSmokePassed} installerSmokeSoftFailed=${checks.installerSmokeSoftFailed} installerSmokeAccepted=${checks.installerSmokeAccepted}`
    );
  }

  return { report, outFile };
}

function main() {
  const strict = hasFlag("--strict");
  const outArg = parseArg("out", "");
  const outFile = resolveInputPath(outArg, path.join(defaultRoot, "release", "upgrade-validation.json"));
  const { report } = generateUpgradeValidationReport({ strict, outFile });
  console.log(`Upgrade validation written: ${outFile}`);
  console.log(`Upgrade validation passed=${report.passed} strict=${strict}`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}

module.exports = {
  generateUpgradeValidationReport
};
