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

function tailText(input, maxChars = 4000) {
  const safe = String(input || "");
  if (safe.length <= maxChars) return safe;
  return safe.slice(safe.length - maxChars);
}

function formatArgs(args = []) {
  return Array.isArray(args)
    ? args.map((arg) => String(arg || "")).join(" ")
    : "";
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
    const captureOutput = Boolean(options && options.captureOutput);

    const stdoutChunks = [];
    const stderrChunks = [];

    const child = spawn(executable, args, {
      cwd: path.dirname(executable),
      windowsHide: true,
      stdio: captureOutput ? ["ignore", "pipe", "pipe"] : "ignore",
      env
    });

    const collectOutput = (chunks) => tailText(chunks.join(""));

    if (captureOutput && child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdoutChunks.push(String(chunk || ""));
        if (stdoutChunks.length > 200) stdoutChunks.shift();
      });
    }

    if (captureOutput && child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderrChunks.push(String(chunk || ""));
        if (stderrChunks.length > 200) stderrChunks.shift();
      });
    }

    const buildResult = (code, signal, overrides = {}) => ({
      code: Number.isFinite(Number(code)) ? Number(code) : null,
      signal: signal || null,
      durationMs: Date.now() - startedAt,
      resolvedByReport: Boolean(overrides.resolvedByReport),
      executable,
      args: Array.isArray(args) ? args : [],
      command: `${executable} ${formatArgs(args)}`.trim(),
      pid: Number.isFinite(Number(child.pid)) ? Number(child.pid) : null,
      reportPath: reportPath || null,
      reportExists: reportPath ? fs.existsSync(reportPath) : false,
      stdoutTail: captureOutput ? collectOutput(stdoutChunks) : "",
      stderrTail: captureOutput ? collectOutput(stderrChunks) : "",
      ...overrides
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
        const timeoutError = new Error(`Process timed out after ${timeoutMs}ms: ${executable}`);
        timeoutError.details = buildResult(null, "timeout", { timedOut: true });
        reject(timeoutError);
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
            resolve(buildResult(0, "report", { resolvedByReport: true }));
          });
        }, reportPollMs)
      : null;

    child.on("exit", (code, signal) => {
      finish(() => {
        resolve(buildResult(code, signal));
      });
    });

    child.on("error", (err) => {
      finish(() => {
        if (err && typeof err === "object") {
          err.details = buildResult(null, "spawn-error");
        }
        reject(err);
      });
    });
  });
}

async function runInstallerSmoke() {
  const strictInstall = hasFlag("--strict-install");
  const installTimeoutMs = parseIntArg("timeout-ms", 45000);
  const smokeTimeoutMs = parseIntArg("smoke-timeout-ms", 30000);
  const keepInstall = process.env.NEURAL_SMOKE_KEEP_INSTALL === "1";
  const keepUserData = process.env.NEURAL_SMOKE_KEEP_USER_DATA === "1";
  const keepReportOnSuccess = process.env.NEURAL_SMOKE_KEEP_REPORT === "1";
  const ignoreIntegrity = process.env.NEURAL_SMOKE_IGNORE_INTEGRITY !== "0";
  const installerPath = findInstallerPath();
  const installDir = makeTempDir("install");
  const userDataDir = makeTempDir("userdata");
  const smokeReportPath = path.join(os.tmpdir(), `neuralshell-installer-smoke-${Date.now()}.json`);

  const timeline = [];
  const pushStep = (stage, details = {}) => {
    const event = {
      at: new Date().toISOString(),
      stage,
      ...details
    };
    timeline.push(event);
    const safeDetails = Object.keys(details).length ? ` ${JSON.stringify(details)}` : "";
    console.log(`[installer-smoke] ${stage}${safeDetails}`);
  };

  const report = {
    generatedAt: new Date().toISOString(),
    strictInstall,
    installerPath,
    installDir,
    userDataDir,
    smokeReportPath,
    options: {
      installTimeoutMs,
      smokeTimeoutMs,
      keepInstall,
      keepUserData,
      ignoreIntegrity
    },
    install: null,
    artifacts: null,
    smoke: null,
    error: null,
    timeline,
    passed: false
  };

  try {
    if (!existsNonEmpty(installerPath)) {
      throw new Error(`Installer not found or empty: ${installerPath}`);
    }

    pushStep("installer.launch.start", { installerPath, installTimeoutMs, installDir });
    report.install = await runWithTimeout(installerPath, ["/S", `/D=${installDir}`], installTimeoutMs, process.env, {
      captureOutput: true
    });
    pushStep("installer.launch.done", {
      code: report.install.code,
      signal: report.install.signal,
      durationMs: report.install.durationMs
    });

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

    pushStep("installer.payload.checked", {
      exePath,
      exeExists: report.artifacts.exeExists,
      appAsarExists: report.artifacts.appAsarExists,
      updateYmlExists: report.artifacts.updateYmlExists
    });

    if (!report.artifacts.exeExists || !report.artifacts.appAsarExists) {
      throw new Error(
        `Installer payload missing: exe=${report.artifacts.exeExists} appAsar=${report.artifacts.appAsarExists}`
      );
    }

    const smokeEnv = {
      ...process.env,
      CI: process.env.CI || "1",
      NEURAL_SMOKE_MODE: "1",
      NEURAL_SMOKE_REPORT: smokeReportPath,
      NEURAL_USER_DATA_DIR: userDataDir,
      NEURAL_IGNORE_INTEGRITY: process.env.NEURAL_IGNORE_INTEGRITY || (ignoreIntegrity ? "1" : "0")
    };

    pushStep("smoke.ready.wait.start", {
      exePath,
      smokeReportPath,
      smokeTimeoutMs,
      ignoreIntegrity: smokeEnv.NEURAL_IGNORE_INTEGRITY
    });

    const smokeExec = await runWithTimeout(
      exePath,
      ["--smoke-mode"],
      smokeTimeoutMs,
      smokeEnv,
      {
        resolveOnReportPath: smokeReportPath,
        reportPollMs: 200,
        captureOutput: true
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

    pushStep("smoke.ready.wait.done", {
      code: smokeExec.code,
      signal: smokeExec.signal,
      resolvedByReport: smokeExec.resolvedByReport,
      durationMs: smokeExec.durationMs,
      smokePassed,
      checks: {
        rendererLoad: Boolean(checks.rendererLoad),
        rendererDom: Boolean(checks.rendererDom),
        ipcHandshake: Boolean(checks.ipcHandshake)
      }
    });

    if (strictInstall && !smokePassed) {
      throw new Error(
        `Installed app smoke failed: exit=${smokeExec.code} passed=${Boolean(smokeReport && smokeReport.passed)}`
      );
    }

    report.passed = smokePassed;
  } catch (err) {
    report.error = {
      message: err && err.message ? err.message : String(err),
      details: err && err.details ? err.details : null
    };
    pushStep("smoke.failed", {
      reason: report.error.message,
      hasErrorDetails: Boolean(report.error.details)
    });
    throw err;
  } finally {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    if (!keepInstall) cleanupDir(installDir);
    if (!keepUserData) cleanupDir(userDataDir);

    const keepSmokeReport = keepReportOnSuccess || !report.passed;
    if (!keepSmokeReport) {
      try {
        fs.rmSync(smokeReportPath, { force: true });
      } catch {
        // ignore
      }
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
