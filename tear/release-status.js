const fs = require("fs");
const path = require("path");

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

function main() {
  const manifest = readJson("release/manifest.json");
  const benchmark = readJson("release/autonomy-benchmark.json");
  const diagnose = readJson("release/packaged-launch-diagnostic.json");
  const installerPath = findInstallerExe();

  const artifacts = {
    installerExe: installerPath ? existsNonEmpty(installerPath) : false,
    unpackedExe: existsNonEmpty("dist/win-unpacked/NeuralShell.exe"),
    appAsar: existsNonEmpty("dist/win-unpacked/resources/app.asar"),
    updateYml: existsNonEmpty("dist/win-unpacked/resources/app-update.yml")
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
    packagedDiagnostics: diagnose
      ? {
        strictPass: diagnose.strictPass,
        uptimeMs: diagnose.uptimeMs,
        exitCode: diagnose.exitCode,
        generatedAt: diagnose.generatedAt
      }
      : null
  };

  const statusFile = path.join(root, "release", "status.json");
  fs.mkdirSync(path.dirname(statusFile), { recursive: true });
  fs.writeFileSync(statusFile, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

  console.log(`Release status written: ${statusFile}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
