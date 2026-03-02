const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const exePath = path.join(root, "dist", "win-unpacked", "NeuralShell.exe");
const releaseDir = path.join(root, "release");
const outFile = path.join(releaseDir, "packaged-launch-diagnostic.json");

function parseIntArg(name, fallback) {
  const arg = process.argv.find((x) => String(x || "").startsWith(`${name}=`));
  if (!arg) return fallback;
  const n = Number(String(arg).split("=")[1]);
  return Number.isFinite(n) ? n : fallback;
}

function safeRead(filePath, maxBytes = 32768) {
  try {
    if (!fs.existsSync(filePath)) return "";
    const stat = fs.statSync(filePath);
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(filePath, "r");
    const size = stat.size - start;
    const buf = Buffer.alloc(size);
    fs.readSync(fd, buf, 0, size, start);
    fs.closeSync(fd);
    return buf.toString("utf8");
  } catch {
    return "";
  }
}

function fileMeta(filePath) {
  try {
    if (!fs.existsSync(filePath)) return { exists: false };
    const stat = fs.statSync(filePath);
    return {
      exists: true,
      bytes: stat.size,
      mtime: stat.mtime.toISOString()
    };
  } catch {
    return { exists: false };
  }
}

function candidateUserDataDirs() {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), "AppData", "Local");
  return [
    path.join(appData, "NeuralShell"),
    path.join(appData, "neuralshell-v5"),
    path.join(localAppData, "NeuralShell"),
    path.join(localAppData, "neuralshell-v5")
  ];
}

function collectLogDiagnostics(baseDir) {
  const appLog = path.join(baseDir, "logs", "app.log.jsonl");
  const chatLog = path.join(baseDir, "chat-logs", "chat-history.jsonl");
  const auditLog = path.join(baseDir, "audit-chain.jsonl");
  return {
    baseDir,
    appLog: {
      ...fileMeta(appLog),
      tail: safeRead(appLog)
    },
    chatLog: {
      ...fileMeta(chatLog),
      tail: safeRead(chatLog)
    },
    auditLog: {
      ...fileMeta(auditLog),
      tail: safeRead(auditLog)
    }
  };
}

async function run() {
  const requireUptimeMs = parseIntArg("--require-uptime-ms", 4500);
  const timeoutMs = parseIntArg("--timeout-ms", Math.max(6000, requireUptimeMs + 1500));

  if (!fs.existsSync(exePath)) {
    throw new Error(`Missing packaged executable: ${exePath}`);
  }

  const startedAt = Date.now();
  let stdout = "";
  let stderr = "";
  let exitCode = null;
  let signal = null;
  let timedOut = false;

  await new Promise((resolve, reject) => {
    const child = spawn(exePath, [], {
      cwd: path.dirname(exePath),
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        ELECTRON_ENABLE_LOGGING: "1",
        ELECTRON_ENABLE_STACK_DUMPING: "1"
      }
    });

    child.stdout.on("data", (chunk) => {
      stdout += String(chunk || "");
      if (stdout.length > 64000) stdout = stdout.slice(-64000);
    });
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk || "");
      if (stderr.length > 64000) stderr = stderr.slice(-64000);
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill();
      } catch {
        // ignore
      }
      resolve();
    }, timeoutMs);

    child.on("exit", (code, sig) => {
      clearTimeout(timer);
      exitCode = code;
      signal = sig || null;
      resolve();
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });

  const uptimeMs = Date.now() - startedAt;
  const strictPass = timedOut || uptimeMs >= requireUptimeMs;
  const knownEarlyExit = Number(exitCode) === 2147483651;

  const logs = candidateUserDataDirs().map(collectLogDiagnostics).filter((entry) => {
    return entry.appLog.exists || entry.chatLog.exists || entry.auditLog.exists;
  });

  const report = {
    generatedAt: new Date().toISOString(),
    exePath,
    requireUptimeMs,
    timeoutMs,
    strictPass,
    uptimeMs,
    timedOut,
    exitCode,
    exitCodeHex: exitCode == null ? null : `0x${(exitCode >>> 0).toString(16)}`,
    signal,
    knownEarlyExit2147483651: knownEarlyExit,
    hints: knownEarlyExit
      ? [
        "Run inside an interactive desktop session.",
        "Inspect app.log.jsonl under %APPDATA%\\NeuralShell\\logs.",
        "Verify graphics/runtime prerequisites for Electron on this machine."
      ]
      : [],
    stdoutTail: stdout.slice(-12000),
    stderrTail: stderr.slice(-12000),
    logDiagnostics: logs
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Wrote packaged diagnostics: ${outFile}`);
  console.log(`strictPass=${strictPass} uptimeMs=${uptimeMs} exitCode=${exitCode}`);
  if (!strictPass) {
    process.exitCode = 2;
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
