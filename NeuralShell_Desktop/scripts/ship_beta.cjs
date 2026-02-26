"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

function fail(msg) {
  process.stderr.write(`[ship-beta] FAIL ${msg}\n`);
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

function runCapture(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    let out = "";
    let err = "";
    let child = null;
    try {
      child = spawn(cmd, args, {
        shell: false,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        cwd: opts?.cwd || process.cwd(),
        env: { ...process.env, ...(opts?.env || {}) }
      });
    } catch (e) {
      return reject(new Error(`spawn failed cmd=${cmd} code=${e && e.code ? e.code : "unknown"}`));
    }
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) return resolve({ stdout: out, stderr: err });
      reject(new Error(`cmd failed cmd=${cmd} code=${code} signal=${signal || "none"}\n${err}`));
    });
  });
}

async function assertGitClean(repoRoot, tag) {
  const wrapped = wrapCmdForWindows("git", ["-C", repoRoot, "status", "--porcelain"]);
  const res = await runCapture(wrapped.cmd, wrapped.args);
  const txt = String(res.stdout || "").trim();
  if (txt) {
    process.stderr.write(`[ship-beta] FAIL git not clean (${tag}): ${repoRoot}\n`);
    process.stderr.write(txt + "\n");
    process.exit(1);
  }
}

async function runNpm(repoRoot, npmArgs, env) {
  const wrapped = wrapCmdForWindows("npm", npmArgs);
  await runInherit(wrapped.cmd, wrapped.args, { cwd: repoRoot, env });
}

async function runNpmCapture(repoRoot, npmArgs, env) {
  const wrapped = wrapCmdForWindows("npm", npmArgs);
  return await runCapture(wrapped.cmd, wrapped.args, { cwd: repoRoot, env });
}

function mustExist(p, label) {
  if (!fs.existsSync(p)) fail(`missing ${label} path=${p}`);
}

async function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const parentRoot = path.resolve(desktopRoot, "..");

  await assertGitClean(desktopRoot, "desktop-start");

  await runNpm(parentRoot, ["test"]);
  await runNpm(parentRoot, ["run", "proof:all"]);

  await runNpm(desktopRoot, ["run", "release:rc"]);
  await runNpm(desktopRoot, ["run", "verify:release"]);

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) fail("missing env LICENSE_HMAC_SECRET");

  const envWithSecret = { LICENSE_HMAC_SECRET: secret };
  await runNpm(desktopRoot, ["run", "license:smoke:full"], envWithSecret);
  await runNpm(desktopRoot, ["run", "license:smoke:missing"], envWithSecret);
  await runNpm(desktopRoot, ["run", "license:smoke:expired"], envWithSecret);
  await runNpm(desktopRoot, ["run", "license:smoke:tampered"], envWithSecret);

  await runNpm(desktopRoot, ["run", "support:bundle"]);
  await runNpm(desktopRoot, ["run", "support:verify"]);

  const betaOut = await runNpmCapture(desktopRoot, ["run", "beta:pack"], envWithSecret);
  if (betaOut.stdout) process.stdout.write(betaOut.stdout);
  if (betaOut.stderr) process.stderr.write(betaOut.stderr);

  const combined = `${betaOut.stdout || ""}\n${betaOut.stderr || ""}`;
  const outMatch = combined.match(/^\[beta-pack\]\s+PASS\s+out=(.+)\s*$/m);
  if (!outMatch) fail("could not parse beta:pack output folder");
  const packRoot = path.resolve(String(outMatch[1]).trim());

  const zipMatch = combined.match(/^\[beta-pack\]\s+zip=(.+?\.zip)\s*$/m);
  const zipPath = zipMatch ? path.resolve(String(zipMatch[1]).trim()) : null;

  if (!fs.existsSync(packRoot) || !fs.statSync(packRoot).isDirectory()) fail(`beta pack folder missing path=${packRoot}`);
  if (zipPath) mustExist(zipPath, "beta pack zip");

  mustExist(path.join(packRoot, "RELEASE_MANIFEST.json"), "RELEASE_MANIFEST.json");
  mustExist(path.join(packRoot, "SHA256SUMS.txt"), "SHA256SUMS.txt");
  mustExist(path.join(packRoot, "PROOF_REPORT.json"), "PROOF_REPORT.json");
  mustExist(path.join(packRoot, "license.json"), "license.json");
  mustExist(path.join(packRoot, "BETA_README.txt"), "BETA_README.txt");
  mustExist(path.join(packRoot, "KNOWN_ISSUES.txt"), "KNOWN_ISSUES.txt");
  mustExist(path.join(packRoot, "SUPPORT_FLOW.txt"), "SUPPORT_FLOW.txt");
  mustExist(path.join(packRoot, "PRIVACY_NOTE.txt"), "PRIVACY_NOTE.txt");
  mustExist(path.join(packRoot, "UNINSTALL.txt"), "UNINSTALL.txt");
  mustExist(path.join(packRoot, "SUPPORT_INSTRUCTIONS.txt"), "SUPPORT_INSTRUCTIONS.txt");
  mustExist(path.join(packRoot, "latest"), "latest folder");

  await assertGitClean(desktopRoot, "desktop-end");
  await assertGitClean(parentRoot, "parent-end");

  process.stdout.write(`[ship-beta] PASS out=${packRoot}\n`);
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));
