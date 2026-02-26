"use strict";

const { spawn } = require("child_process");
const path = require("path");

function fail(msg) {
  process.stderr.write(`[ship-checklist] FAIL ${msg}\n`);
  process.exit(1);
}

function wrapCmdForWindows(cmd, args) {
  if (process.platform !== "win32") return { cmd, args };
  const comspec = process.env.ComSpec || "cmd.exe";
  return { cmd: comspec, args: ["/d", "/s", "/c", cmd, ...args] };
}

function runInherit(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    let child = null;
    try {
      child = spawn(cmd, args, {
        shell: false,
        windowsHide: true,
        stdio: "inherit",
        cwd: opts?.cwd || process.cwd(),
        env: { ...process.env, ...(opts?.env || {}) }
      });
    } catch (e) {
      return reject(new Error(`spawn failed cmd=${cmd} code=${e && e.code ? e.code : "unknown"}`));
    }
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) return resolve();
      reject(new Error(`cmd failed cmd=${cmd} code=${code} signal=${signal || "none"}`));
    });
  });
}

async function runGitClean(repoRoot) {
  const wrapped = wrapCmdForWindows("git", ["-C", repoRoot, "status", "--porcelain"]);
  let out = "";
  const child = spawn(wrapped.cmd, wrapped.args, {
    shell: false,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"]
  });
  child.stdout.on("data", (d) => (out += d.toString("utf8")));
  await new Promise((resolve) => child.on("exit", resolve));
  if (String(out || "").trim()) fail(`git not clean: ${repoRoot}`);
}

async function runNpm(repoRoot, npmArgs, env) {
  const wrapped = wrapCmdForWindows("npm", npmArgs);
  await runInherit(wrapped.cmd, wrapped.args, { cwd: repoRoot, env });
}

async function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const parentRoot = path.resolve(desktopRoot, "..");

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) fail("missing env LICENSE_HMAC_SECRET");

  await runGitClean(desktopRoot);

  await runNpm(parentRoot, ["test"]);
  await runNpm(parentRoot, ["run", "proof:all"]);

  await runNpm(desktopRoot, ["run", "release:rc"], { LICENSE_HMAC_SECRET: secret });
  await runNpm(desktopRoot, ["run", "verify:release"]);

  await runNpm(desktopRoot, ["run", "license:smoke:full"], { LICENSE_HMAC_SECRET: secret });
  await runNpm(desktopRoot, ["run", "license:smoke:missing"], { LICENSE_HMAC_SECRET: secret });
  await runNpm(desktopRoot, ["run", "license:smoke:expired"], { LICENSE_HMAC_SECRET: secret });
  await runNpm(desktopRoot, ["run", "license:smoke:tampered"], { LICENSE_HMAC_SECRET: secret });

  await runNpm(desktopRoot, ["run", "support:bundle"]);

  await runGitClean(desktopRoot);

  process.stdout.write("[ship-checklist] PASS\n");
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));

