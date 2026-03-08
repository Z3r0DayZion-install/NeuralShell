const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");

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

function verifyBenchmarkReport() {
  const reportPath = path.join(root, "release", "autonomy-benchmark.json");
  assert(existsNonEmpty(reportPath), `Missing autonomy benchmark report: ${reportPath}`);
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  assert(Number.isFinite(Number(report.percent)), "Autonomy benchmark report is missing a numeric percent.");
}

function verifyArtifacts() {
  const exePath = path.join(root, "dist", "win-unpacked", "NeuralShell.exe");
  const appAsar = path.join(root, "dist", "win-unpacked", "resources", "app.asar");
  const updateYml = path.join(root, "dist", "win-unpacked", "resources", "app-update.yml");
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

function main() {
  const strictPackaged = process.argv.includes("--strict-packaged");
  fs.mkdirSync(path.join(root, "release"), { recursive: true });
  run("npm test");
  run("npm run benchmark:autonomy");
  verifyBenchmarkReport();
  if (strictPackaged) {
    try {
      run("node tear/smoke-packaged.js --strict-launch --isolated-user-data --timeout-ms=25000");
    } catch (err) {
      console.warn("\nStrict packaged smoke failed; running diagnostics...");
      try {
        run("npm run diagnose:packaged");
      } catch (diagErr) {
        console.warn("Diagnostics failed to run:", diagErr.message || diagErr);
      }
      throw err;
    }
  } else {
    run("node tear/smoke-packaged.js");
  }
  verifyArtifacts();
  verifyOfflineFirstGuardrails();
  console.log("\nRelease gate passed.");
}

main();
