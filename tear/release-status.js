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

function exists(relPath) {
  const filePath = path.join(root, relPath);
  return fs.existsSync(filePath);
}

function main() {
  const manifest = readJson("release/manifest.json");
  const benchmark = readJson("release/autonomy-benchmark.json");
  const diagnose = readJson("release/packaged-launch-diagnostic.json");

  const summary = {
    generatedAt: new Date().toISOString(),
    artifacts: {
      installerExe: exists("dist/NeuralShell Setup 5.0.0.exe"),
      unpackedExe: exists("dist/win-unpacked/NeuralShell.exe"),
      appAsar: exists("dist/win-unpacked/resources/app.asar"),
      updateYml: exists("dist/win-unpacked/resources/app-update.yml")
    },
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
