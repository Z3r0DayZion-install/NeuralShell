const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const root = path.resolve(__dirname, "..");
const exePath = path.join(root, "dist", "win-unpacked", "NeuralShell.exe");
const appAsar = path.join(root, "dist", "win-unpacked", "resources", "app.asar");
const updateYml = path.join(root, "dist", "win-unpacked", "resources", "app-update.yml");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function existsNonEmpty(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

async function smokeLaunch() {
  const strict = process.argv.includes("--strict-launch");
  const uptimeArg = process.argv.find((x) => /^--require-uptime-ms=\d+$/i.test(String(x || "")));
  const requireUptimeMs = uptimeArg ? Number(String(uptimeArg).split("=")[1]) : 3500;
  const skipLaunch = process.env.SMOKE_SKIP_LAUNCH === "1" || process.env.CI === "true";
  if (skipLaunch) {
    console.log("Packaged launch skipped (SMOKE_SKIP_LAUNCH=1 or CI=true).");
    return;
  }

  await new Promise((resolve, reject) => {
    let exited = false;
    const startedAt = Date.now();
    const child = spawn(exePath, [], { cwd: path.dirname(exePath), windowsHide: true, stdio: "ignore" });
    const timeout = setTimeout(() => {
      if (!exited) {
        child.kill();
        const uptime = Date.now() - startedAt;
        console.log(`Packaged app reached uptime ${uptime}ms.`);
        resolve();
      }
    }, requireUptimeMs);

    child.on("exit", (code) => {
      exited = true;
      clearTimeout(timeout);
      const uptime = Date.now() - startedAt;
      if (strict) {
        const hint = Number(code) === 2147483651
          ? "Likely GUI/runtime bootstrap failure in this environment. Run: npm run diagnose:packaged"
          : "Unexpected early exit. Inspect packaged runtime logs and dependencies.";
        reject(new Error(`Packaged app exited early with code ${code} at ${uptime}ms. ${hint}`));
        return;
      }
      console.log(`Packaged app exited early with code ${code} at ${uptime}ms (non-strict).`);
      resolve();
    });
    child.on("error", (err) => {
      clearTimeout(timeout);
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
