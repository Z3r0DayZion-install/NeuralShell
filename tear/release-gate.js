const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const releaseGateReportPath = path.join(root, "release", "release-gate.json");
const packagedSmokeTimeoutMs = Number(process.env.NEURAL_RELEASE_SMOKE_TIMEOUT_MS || 45000);
const installerSmokeTimeoutMs = Number(
  process.env.NEURAL_RELEASE_INSTALLER_SMOKE_TIMEOUT_MS
    || process.env.NEURAL_RELEASE_SMOKE_TIMEOUT_MS
    || 30000
);
const allowInstallerSoftFail =
  process.env.NEURAL_RELEASE_ALLOW_INSTALLER_SOFTFAIL === "1"
  || process.env.CI === "true";

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
  const validatorJs = fs.readFileSync(path.join(root, "src", "core", "ipcValidators.js"), "utf8");
  const rendererMain = fs.readFileSync(path.join(root, "src", "renderer", "src", "main.jsx"), "utf8");
  const appJsx = fs.readFileSync(path.join(root, "src", "renderer", "src", "App.jsx"), "utf8");
  const shellContext = fs.readFileSync(path.join(root, "src", "renderer", "src", "state", "ShellContext.jsx"), "utf8");

  assert(mainJs.includes("allowRemoteBridge"), "Missing allowRemoteBridge handling in main process.");
  assert(mainJs.includes("dist-renderer") && mainJs.includes("index.html"), "Main process is not loading the React renderer bundle.");
  assert(!mainJs.includes("renderer.html"), "Main process still references legacy renderer.html loading.");
  assert(validatorJs.includes("allowRemoteBridge"), "Missing allowRemoteBridge validator enforcement.");
  assert(
    rendererMain.includes("createRoot(document.getElementById('root'))")
      || rendererMain.includes('createRoot(document.getElementById("root"))'),
    "React renderer entrypoint is not mounting on #root."
  );
  assert(
    rendererMain.includes("<ShellProvider>") && rendererMain.includes("<App />"),
    "React renderer entrypoint must compose ShellProvider and App."
  );
  assert(
    appJsx.includes('data-testid="session-modal"')
      && appJsx.includes('data-testid="session-lock-banner"'),
    "React session interaction surfaces are missing modal/lock UI contracts."
  );
  assert(
    shellContext.includes("AUTOSAVE_DEBOUNCE_MS")
      && shellContext.includes("saveActiveSession")
      && shellContext.includes("beforeunload")
      && shellContext.includes("visibilitychange"),
    "Session autosave guardrails are missing debounce/flush coverage."
  );
}

function readInstallerSmokeReport() {
  const filePath = path.join(root, "release", "installer-smoke-report.json");
  if (!existsNonEmpty(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (err) {
    return {
      parseError: err && err.message ? err.message : String(err)
    };
  }
}

function summarizeInstallerSmoke(installerSmoke) {
  if (!installerSmoke || typeof installerSmoke !== "object") return null;
  const smokeChecks = installerSmoke.smoke && installerSmoke.smoke.report && installerSmoke.smoke.report.checks
    ? installerSmoke.smoke.report.checks
    : {};
  return {
    generatedAt: installerSmoke.generatedAt || null,
    passed: Boolean(installerSmoke.passed),
    strictInstall: Boolean(installerSmoke.strictInstall),
    installerPath: installerSmoke.installerPath || null,
    installDir: installerSmoke.installDir || null,
    userDataDir: installerSmoke.userDataDir || null,
    smokeReportPath: installerSmoke.smokeReportPath || null,
    error: installerSmoke.error || null,
    install: installerSmoke.install || null,
    smoke: installerSmoke.smoke
      ? {
        code: installerSmoke.smoke.code,
        signal: installerSmoke.smoke.signal,
        durationMs: installerSmoke.smoke.durationMs,
        resolvedByReport: Boolean(installerSmoke.smoke.resolvedByReport),
        reportPath: installerSmoke.smoke.reportPath || null,
        checks: {
          rendererLoad: Boolean(smokeChecks.rendererLoad),
          rendererDom: Boolean(smokeChecks.rendererDom),
          ipcHandshake: Boolean(smokeChecks.ipcHandshake)
        }
      }
      : null
  };
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
  let strictInstallerSoftFailed = false;
  let strictInstallerSoftFailReason = "";
  let installerSmokeSummary = null;

  run("npm test");
  run("npm run benchmark:autonomy");
  verifyBenchmarkReport();
  if (strictPackaged) {
    try {
      run(`node tear/smoke-packaged.js --strict-launch --isolated-user-data --timeout-ms=${packagedSmokeTimeoutMs}`);
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
      run(`node tear/smoke-installer.js --strict-install --timeout-ms=45000 --smoke-timeout-ms=${installerSmokeTimeoutMs}`);
      installerSmokeSummary = summarizeInstallerSmoke(readInstallerSmokeReport());
      strictInstallerPass = true;
    } catch (err) {
      strictInstallerPass = false;
      installerSmokeSummary = summarizeInstallerSmoke(readInstallerSmokeReport());
      const smokeError = installerSmokeSummary && installerSmokeSummary.error
        ? JSON.stringify(installerSmokeSummary.error)
        : "";
      strictInstallerSoftFailReason = [
        err && err.message ? err.message : String(err),
        smokeError ? `installerSmoke=${smokeError}` : ""
      ].filter(Boolean).join(" | ");
      if (allowInstallerSoftFail) {
        strictInstallerSoftFailed = true;
        console.warn(
          `\n[release-gate] Installer smoke soft-failed (${strictInstallerSoftFailReason}). Continuing due NEURAL_RELEASE_ALLOW_INSTALLER_SOFTFAIL/CI.`
        );
      } else {
        writeGateReport({
          generatedAt: new Date().toISOString(),
          strictPackaged,
          strictPackagedPass,
          strictInstallerPass,
          strictInstallerSoftFailed: false,
          strictInstallerSoftFailReason,
          installerSmoke: installerSmokeSummary,
          passed: false,
          failureStage: "smoke-installer:strict"
        });
        throw err;
      }
    }
  } else {
    run(`node tear/smoke-packaged.js --timeout-ms=${packagedSmokeTimeoutMs}`);
  }
  run("node tear/smoke-native-trust.js");
  verifyArtifacts();
  verifyOfflineFirstGuardrails();
  writeGateReport({
    generatedAt: new Date().toISOString(),
    strictPackaged,
    strictPackagedPass,
    strictInstallerPass,
    strictInstallerSoftFailed,
    strictInstallerSoftFailReason,
    installerSmoke: installerSmokeSummary,
    passed: true
  });
  console.log("\nRelease gate passed.");
}

main();
