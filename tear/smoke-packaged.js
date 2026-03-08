const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const exePath = path.join(root, "dist", "win-unpacked", "NeuralShell.exe");
const appAsar = path.join(root, "dist", "win-unpacked", "resources", "app.asar");
const updateYml = path.join(root, "dist", "win-unpacked", "resources", "app-update.yml");
const smokeReport = path.join(root, "release", "packaged-smoke-report.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function existsNonEmpty(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function parseIntArg(name, fallback) {
  const arg = process.argv.find((x) => String(x || "").startsWith(`${name}=`));
  if (!arg) return fallback;
  const n = Number(String(arg).split("=")[1]);
  return Number.isFinite(n) ? n : fallback;
}

function shouldIsolateUserData() {
  if (process.argv.includes("--no-isolated-user-data")) {
    return false;
  }
  return process.env.NEURAL_SMOKE_ISOLATE_USER_DATA !== "0";
}

function makeIsolatedUserDataDir() {
  const token = crypto.randomBytes(6).toString("hex");
  const dir = path.join(
    os.tmpdir(),
    "neuralshell-smoke-userdata",
    `${Date.now()}-${process.pid}-${token}`
  );
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanupDir(dirPath) {
  if (!dirPath) return;
  try {
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch {
    // ignore cleanup failures
  }
}

async function smokeLaunch() {
  const strict = process.argv.includes("--strict-launch");
  const timeoutMs = parseIntArg("--timeout-ms", 25000);
  const skipLaunch = process.env.SMOKE_SKIP_LAUNCH === "1";
  const keepUserData = process.env.NEURAL_SMOKE_KEEP_USER_DATA === "1";
  const isolatedUserData = shouldIsolateUserData() ? makeIsolatedUserDataDir() : null;
  if (skipLaunch) {
    console.log("Packaged launch skipped (SMOKE_SKIP_LAUNCH=1).");
    cleanupDir(isolatedUserData);
    return;
  }

  fs.mkdirSync(path.dirname(smokeReport), { recursive: true });
  if (fs.existsSync(smokeReport)) {
    fs.rmSync(smokeReport, { force: true });
  }

  await new Promise((resolve, reject) => {
    let finished = false;

    const child = spawn(exePath, ["--smoke-mode"], {
      cwd: path.dirname(exePath),
      windowsHide: true,
      stdio: "ignore",
      env: {
        ...process.env,
        NEURAL_SMOKE_MODE: "1",
        NEURAL_SMOKE_REPORT: smokeReport,
        ...(isolatedUserData ? { NEURAL_USER_DATA_DIR: isolatedUserData } : {})
      }
    });

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      try {
        child.kill();
      } catch {
        // ignore
      }
      if (!keepUserData) {
        cleanupDir(isolatedUserData);
      }
      reject(
        new Error(
          `Packaged smoke probe timed out after ${timeoutMs}ms (userData=${isolatedUserData || "default"}).`
        )
      );
    }, timeoutMs);

    child.on("exit", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (!fs.existsSync(smokeReport)) {
        if (!keepUserData) {
          cleanupDir(isolatedUserData);
        }
        reject(new Error(`Missing packaged smoke report: ${smokeReport} (exit=${code})`));
        return;
      }

      let report;
      try {
        report = JSON.parse(fs.readFileSync(smokeReport, "utf8"));
      } catch (err) {
        if (!keepUserData) {
          cleanupDir(isolatedUserData);
        }
        reject(new Error(`Unable to parse smoke report JSON: ${err.message || err}`));
        return;
      }

      const checks = report && report.checks ? report.checks : {};
      const rendererLoad = Boolean(checks.rendererLoad);
      const rendererDom = Boolean(checks.rendererDom);
      const ipcHandshake = Boolean(checks.ipcHandshake);
      const passed = Boolean(report && report.passed);

      if (!rendererLoad || !rendererDom || !ipcHandshake) {
        if (!keepUserData) {
          cleanupDir(isolatedUserData);
        }
        reject(
          new Error(
            `Smoke probe failed checks: rendererLoad=${rendererLoad} rendererDom=${rendererDom} ipcHandshake=${ipcHandshake}`
          )
        );
        return;
      }

      if (strict && (!passed || Number(code) !== 0)) {
        if (!keepUserData) {
          cleanupDir(isolatedUserData);
        }
        reject(
          new Error(
            `Strict smoke launch failed. exit=${code} passed=${passed} error=${report.error || "none"}`
          )
        );
        return;
      }

      console.log(
        `Packaged smoke report validated. exit=${code} passed=${passed} uptimeMs=${Number(report.uptimeMs) || 0}`
      );
      if (!keepUserData) {
        cleanupDir(isolatedUserData);
      }
      resolve();
    });

    child.on("error", (err) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      if (!keepUserData) {
        cleanupDir(isolatedUserData);
      }
      reject(err);
    });
  });
}

async function run() {
  assert(existsNonEmpty(exePath), `Missing packaged executable: ${exePath}`);
  assert(existsNonEmpty(appAsar), `Missing packaged app.asar: ${appAsar}`);
  assert(existsNonEmpty(updateYml), `Missing packaged app-update.yml: ${updateYml}`);
  await smokeLaunch();
  console.log("Packaged smoke test passed.");
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
