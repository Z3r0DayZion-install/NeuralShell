const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "release", "installer-smoke-report.json");

function parseArg(name, fallback = "") {
  const prefix = `--${name}=`;
  const hit = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!hit) return fallback;
  return String(hit).slice(prefix.length).trim();
}

function parseIntArg(name, fallback) {
  const raw = parseArg(name, "");
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function existsNonEmpty(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function cleanupDir(dirPath) {
  if (!dirPath) return;
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {
    // ignore cleanup failure
  }
}

function makeTempDir(prefix) {
  const token = crypto.randomBytes(6).toString("hex");
  const dirPath = path.join(os.tmpdir(), "neuralshell-installer-smoke", `${prefix}-${Date.now()}-${token}`);
  fs.mkdirSync(dirPath, { recursive: true });
  return dirPath;
}

function findInstallerPath() {
  const explicit = parseArg("installer-path", "");
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.join(root, explicit);
  }

  const distDir = path.join(root, "dist");
  if (!fs.existsSync(distDir)) {
    throw new Error(`Missing dist directory: ${distDir}`);
  }

  const installers = fs
    .readdirSync(distDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^NeuralShell Setup .+\.exe$/i.test(name))
    .filter((name) => !/__uninstaller/i.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  if (installers.length === 0) {
    throw new Error(`No installer found in dist: ${distDir}`);
  }

  return path.join(distDir, installers[installers.length - 1]);
}

function runWithTimeout(executable, args, timeoutMs, env = process.env, options = {}) {
  return new Promise((resolve, reject) => {
    let done = false;
    const startedAt = Date.now();
    const reportPath = String(options && options.resolveOnReportPath ? options.resolveOnReportPath : "").trim();
    const reportPollMs = Number.isFinite(Number(options && options.reportPollMs))
      ? Math.max(100, Number(options.reportPollMs))
      : 200;

    const child = spawn(executable, args, {
      cwd: path.dirname(executable),
      windowsHide: true,
      stdio: "ignore",
      env
    });

    const finish = (handler) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      clearInterval(reportPollTimer);
      handler();
    };

    const timer = setTimeout(() => {
      finish(() => {
        try {
          child.kill();
        } catch {
          // ignore kill errors
        }
        reject(new Error(`Process timed out after ${timeoutMs}ms: ${executable}`));
      });
    }, timeoutMs);

    const reportPollTimer = reportPath
      ? setInterval(() => {
          if (done) return;
          if (!fs.existsSync(reportPath)) return;
          finish(() => {
            try {
              child.kill();
            } catch {
              // ignore kill errors
            }
            resolve({
              code: 0,
              signal: "report",
              durationMs: Date.now() - startedAt,
              resolvedByReport: true
            });
          });
        }, reportPollMs)
      : null;

    child.on("exit", (code, signal) => {
      finish(() => {
        resolve({
          code: Number(code),
          signal: signal || null,
          durationMs: Date.now() - startedAt,
          resolvedByReport: false
        });
      });
    });

    child.on("error", (err) => {
      finish(() => reject(err));
    });
  });
}

async function runInstallerSmoke() {
  const strictInstall = hasFlag("--strict-install");
  const installTimeoutMs = parseIntArg("timeout-ms", 45000);
  const smokeTimeoutMs = parseIntArg("smoke-timeout-ms", 30000);
  const keepInstall = process.env.NEURAL_SMOKE_KEEP_INSTALL === "1";
  const keepUserData = process.env.NEURAL_SMOKE_KEEP_USER_DATA === "1";
  const installerPath = findInstallerPath();
  const installDir = makeTempDir("install");
  const userDataDir = makeTempDir("userdata");
  const smokeReportPath = path.join(os.tmpdir(), `neuralshell-installer-smoke-${Date.now()}.json`);

  const report = {
    generatedAt: new Date().toISOString(),
    strictInstall,
    installerPath,
    installDir,
    userDataDir,
    install: null,
    artifacts: null,
    smoke: null,
    passed: false
  };

  try {
    if (!existsNonEmpty(installerPath)) {
      throw new Error(`Installer not found or empty: ${installerPath}`);
    }

    report.install = await runWithTimeout(installerPath, ["/S", `/D=${installDir}`], installTimeoutMs);
    if (strictInstall && report.install.code !== 0) {
      throw new Error(`Installer exited with non-zero code: ${report.install.code}`);
    }

    const exePath = path.join(installDir, "NeuralShell.exe");
    const appAsar = path.join(installDir, "resources", "app.asar");
    const updateYml = path.join(installDir, "resources", "app-update.yml");
    report.artifacts = {
      exePath,
      appAsar,
      updateYml,
      exeExists: existsNonEmpty(exePath),
      appAsarExists: existsNonEmpty(appAsar),
      updateYmlExists: existsNonEmpty(updateYml)
    };

    if (!report.artifacts.exeExists || !report.artifacts.appAsarExists) {
      throw new Error(
        `Installer payload missing: exe=${report.artifacts.exeExists} appAsar=${report.artifacts.appAsarExists}`
      );
    }

    const smokeExec = await runWithTimeout(
      exePath,
      ["--smoke-mode"],
      smokeTimeoutMs,
      {
        ...process.env,
        NEURAL_SMOKE_MODE: "1",
        NEURAL_SMOKE_REPORT: smokeReportPath,
        NEURAL_USER_DATA_DIR: userDataDir
      },
      {
        resolveOnReportPath: smokeReportPath,
        reportPollMs: 200
      }
    );

    let smokeReport = null;
    if (fs.existsSync(smokeReportPath)) {
      smokeReport = JSON.parse(fs.readFileSync(smokeReportPath, "utf8"));
    }

    report.smoke = {
      ...smokeExec,
      reportPath: smokeReportPath,
      report: smokeReport
    };

    const checks = smokeReport && smokeReport.checks ? smokeReport.checks : {};
    const smokePassed =
      smokeExec.code === 0 &&
      Boolean(smokeReport && smokeReport.passed) &&
      Boolean(checks.rendererLoad) &&
      Boolean(checks.rendererDom) &&
      Boolean(checks.ipcHandshake);

    if (strictInstall && !smokePassed) {
      throw new Error(
        `Installed app smoke failed: exit=${smokeExec.code} passed=${Boolean(smokeReport && smokeReport.passed)}`
      );
    }

    report.passed = smokePassed;
  } finally {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    if (!keepInstall) cleanupDir(installDir);
    if (!keepUserData) cleanupDir(userDataDir);
    try {
      fs.rmSync(smokeReportPath, { force: true });
    } catch {
      // ignore
    }
  }

  console.log(`Installer smoke report written: ${outPath}`);
  if (!report.passed) {
    throw new Error("Installer smoke failed.");
  }
  console.log("Installer smoke passed.");
}

runInstallerSmoke().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
