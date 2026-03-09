const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");

function readJson(relPath) {
  const filePath = path.join(root, relPath);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function existsNonEmpty(relPath) {
  const filePath = path.join(root, relPath);
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function findInstallerExe() {
  const distDir = path.join(root, "dist");
  if (!fs.existsSync(distDir)) return null;
  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  const installers = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^NeuralShell Setup .+\.exe$/i.test(name))
    .sort();
  if (installers.length === 0) {
    return null;
  }
  return path.posix.join("dist", installers[installers.length - 1]);
}

function safeExec(command) {
  try {
    return execSync(command, { cwd: root, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  } catch {
    return null;
  }
}

function collectProvenance() {
  const gitCommit = process.env.GITHUB_SHA || safeExec("git rev-parse HEAD");
  const gitBranch = process.env.GITHUB_REF_NAME || safeExec("git rev-parse --abbrev-ref HEAD");
  const gitTag = process.env.GITHUB_REF_TYPE === "tag"
    ? process.env.GITHUB_REF_NAME
    : safeExec("git describe --tags --exact-match");

  return {
    git: {
      commit: gitCommit || null,
      branch: gitBranch || null,
      tag: gitTag || null
    },
    github: {
      repository: process.env.GITHUB_REPOSITORY || null,
      workflow: process.env.GITHUB_WORKFLOW || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || null,
      ref: process.env.GITHUB_REF || null,
      sha: process.env.GITHUB_SHA || null
    }
  };
}

function main() {
  const manifest = readJson("release/manifest.json");
  const benchmark = readJson("release/autonomy-benchmark.json");
  const signatureVerification = readJson("release/signature-verification.json");
  const diagnose = readJson("release/packaged-launch-diagnostic.json");
  const installerSmoke = readJson("release/installer-smoke-report.json");
  const upgradeValidation = readJson("release/upgrade-validation.json");
  const installerPath = findInstallerExe();

  const artifacts = {
    installerExe: installerPath ? existsNonEmpty(installerPath) : false,
    unpackedExe: existsNonEmpty("dist/win-unpacked/NeuralShell.exe"),
    appAsar: existsNonEmpty("dist/win-unpacked/resources/app.asar"),
    updateYml: existsNonEmpty("dist/win-unpacked/resources/app-update.yml"),
    manifestSig: existsNonEmpty("release/manifest.sig"),
    manifestPub: existsNonEmpty("release/manifest.pub")
  };

  const profile = artifacts.installerExe ? "installer+unpacked" : "unpacked-only";
  const summary = {
    generatedAt: new Date().toISOString(),
    profile,
    artifacts,
    manifest: manifest
      ? { fileCount: manifest.fileCount, generatedAt: manifest.generatedAt, version: manifest.version }
      : null,
    benchmark: benchmark
      ? { percent: benchmark.percent, verdict: benchmark.verdict, generatedAt: benchmark.generatedAt }
      : null,
    signature: signatureVerification
      ? { verified: Boolean(signatureVerification.verified), generatedAt: signatureVerification.generatedAt || null }
      : null,
    provenance: collectProvenance(),
    packagedDiagnostics: diagnose
      ? {
        strictPass: diagnose.strictPass,
        uptimeMs: diagnose.uptimeMs,
        exitCode: diagnose.exitCode,
        generatedAt: diagnose.generatedAt
      }
      : null,
    installerSmoke: installerSmoke
      ? {
        passed: Boolean(installerSmoke.passed),
        strictInstall: Boolean(installerSmoke.strictInstall),
        generatedAt: installerSmoke.generatedAt || null
      }
      : null,
    upgradeValidation: upgradeValidation
      ? {
        passed: Boolean(upgradeValidation.passed),
        strict: Boolean(upgradeValidation.strict),
        generatedAt: upgradeValidation.generatedAt || null
      }
      : null
  };

  const statusFile = path.join(root, "release", "status.json");
  const provenanceFile = path.join(root, "release", "provenance.json");
  fs.mkdirSync(path.dirname(statusFile), { recursive: true });
  fs.writeFileSync(statusFile, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  fs.writeFileSync(
    provenanceFile,
    `${JSON.stringify(
      {
        generatedAt: summary.generatedAt,
        profile: summary.profile,
        provenance: summary.provenance,
        artifacts: summary.artifacts
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`Release status written: ${statusFile}`);
  console.log(`Release provenance written: ${provenanceFile}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
