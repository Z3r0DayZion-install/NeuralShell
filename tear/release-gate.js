const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const releaseGateReportPath = path.join(root, "release", "release-gate.json");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function existsNonEmpty(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function findInstallerExePath() {
  const distDir = path.join(root, "dist");
  if (!fs.existsSync(distDir)) return null;
  const installers = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^NeuralShell Setup .+\.exe$/i.test(name))
    .filter((name) => !/__uninstaller/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  if (installers.length === 0) return null;
  return path.join(distDir, installers[installers.length - 1]);
}

function verifyBenchmarkReport() {
  const reportPath = path.join(root, "release", "autonomy-benchmark.json");
  assert(existsNonEmpty(reportPath), `Missing autonomy benchmark report: ${reportPath}`);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert(Number.isFinite(Number(report.percent)), "Autonomy benchmark report is missing a numeric percent.");
}

function verifyArtifacts() {
  const installerExe = findInstallerExePath();
  const exePath = path.join(root, "dist", "win-unpacked", "NeuralShell.exe");
  const appAsar = path.join(root, "dist", "win-unpacked", "resources", "app.asar");
  const updateYml = path.join(root, "dist", "win-unpacked", "resources", "app-update.yml");
  assert(installerExe && existsNonEmpty(installerExe), "Missing installer executable under dist/.");
  assert(existsNonEmpty(exePath), `Missing packaged executable: ${exePath}`);
  assert(existsNonEmpty(appAsar), `Missing packaged app.asar: ${appAsar}`);
  assert(existsNonEmpty(updateYml), `Missing packaged app-update.yml: ${updateYml}`);
}

function verifyOfflineFirstGuardrails() {
  const mainJs = fs.readFileSync(path.join(root, "src", "main.js"), "utf8");
  const rendererJs = fs.readFileSync(path.join(root, "src", "renderer.js"), "utf8");
  const validatorJs = fs.readFileSync(path.join(root, "src", "core", "ipcValidators.js"), "utf8");

  assert(mainJs.includes("allowRemoteBridge"), "Missing allowRemoteBridge handling in main process.");
  assert(rendererJs.includes("autonomous"), "Missing autonomous mode wiring in renderer.");
  assert(validatorJs.includes("allowRemoteBridge"), "Missing allowRemoteBridge validator enforcement.");
}

function writeGateReport(report) {
  fs.mkdirSync(path.dirname(releaseGateReportPath), { recursive: true });
  fs.writeFileSync(releaseGateReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Release gate report written: ${releaseGateReportPath}`);
}

function main() {
  const strictPackaged = process.argv.includes("--strict-packaged");
  fs.mkdirSync(path.join(root, "release"), { recursive: true });
  let strictPackagedPass = null;
  let strictInstallerPass = null;

  run("npm test");
  run("npm run benchmark:autonomy");
  verifyBenchmarkReport();
  if (strictPackaged) {
    try {
      run("node tear/smoke-packaged.js --strict-launch --isolated-user-data --timeout-ms=25000");
      strictPackagedPass = true;
    } catch (err) {
      strictPackagedPass = false;
      writeGateReport({
        generatedAt: new Date().toISOString(),
        strictPackaged,
        strictPackagedPass,
        passed: false,
        failureStage: "smoke-packaged:strict"
      });
      console.warn("\nStrict packaged smoke failed; running diagnostics...");
      try {
        run("npm run diagnose:packaged");
      } catch (diagErr) {
        console.warn("Diagnostics failed to run:", diagErr.message || diagErr);
      }
      throw err;
    }
    try {
      run("node tear/smoke-installer.js --strict-install --timeout-ms=45000 --smoke-timeout-ms=30000");
      strictInstallerPass = true;
    } catch (err) {
      strictInstallerPass = false;
      writeGateReport({
        generatedAt: new Date().toISOString(),
        strictPackaged,
        strictPackagedPass,
        strictInstallerPass,
        passed: false,
        failureStage: "smoke-installer:strict"
      });
      throw err;
    }
  } else {
    run("node tear/smoke-packaged.js");
  }
  verifyArtifacts();
  verifyOfflineFirstGuardrails();
  writeGateReport({
    generatedAt: new Date().toISOString(),
    strictPackaged,
    strictPackagedPass,
    strictInstallerPass,
    passed: true
  });
  console.log("\nRelease gate passed.");
}

main();
