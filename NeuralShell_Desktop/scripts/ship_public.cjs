"use strict";

const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

function fail(msg) {
  process.stderr.write(`[ship-public] FAIL ${msg}\n`);
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
    process.stderr.write(`[ship-public] FAIL git not clean (${tag}): ${repoRoot}\n`);
    process.stderr.write(txt + "\n");
    process.exit(1);
  }
}

async function runNpm(repoRoot, npmArgs, env) {
  const wrapped = wrapCmdForWindows("npm", npmArgs);
  await runInherit(wrapped.cmd, wrapped.args, { cwd: repoRoot, env });
}

function requireSigningEnvOrAbort() {
  const certPath = process.env.SIGN_CERT_PATH;
  const certPass = process.env.SIGN_CERT_PASSWORD;
  if (!certPath || !certPass) {
    process.stderr.write("[PUBLIC-ABORT] Missing code signing certificate\n");
    process.exit(1);
  }
  if (!fs.existsSync(certPath)) {
    process.stderr.write("[PUBLIC-ABORT] Missing code signing certificate\n");
    process.stderr.write(`[ship-public] FAIL SIGN_CERT_PATH not found path=${certPath}\n`);
    process.exit(1);
  }
  return { certPath, certPass };
}

async function extractPublicPackOrThrow(publicZipPath) {
  const sevenZip = path.join(process.env["ProgramFiles"] || "C:\\Program Files", "7-Zip", "7z.exe");
  if (!fs.existsSync(sevenZip)) {
    throw new Error(`missing extractor (7z) at ${sevenZip}`);
  }
  const tmpDir = path.join(os.tmpdir(), `neuralshell-public-pack-${process.pid}`);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const child = spawn(sevenZip, ["x", "-y", `-o${tmpDir}`, publicZipPath], {
    shell: false,
    windowsHide: true,
    stdio: "inherit"
  });
  await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`7z extract failed code=${code}`));
    });
  });
  return tmpDir;
}

async function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const parentRoot = path.resolve(desktopRoot, "..");

  await assertGitClean(desktopRoot, "desktop-start");

  requireSigningEnvOrAbort();

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) fail("missing env LICENSE_HMAC_SECRET");
  const envWithSecret = { LICENSE_HMAC_SECRET: secret };

  await runNpm(parentRoot, ["test"]);
  await runNpm(parentRoot, ["run", "proof:all"]);

  await runNpm(desktopRoot, ["run", "release:rc"]);
  await runNpm(desktopRoot, ["run", "verify:release"]);

  await runNpm(desktopRoot, ["run", "release:sign"]);
  await runNpm(desktopRoot, ["run", "release:verify-signature"]);

  await runNpm(desktopRoot, ["run", "license:smoke:full"], envWithSecret);
  await runNpm(desktopRoot, ["run", "license:smoke:missing"], envWithSecret);
  await runNpm(desktopRoot, ["run", "license:smoke:expired"], envWithSecret);
  await runNpm(desktopRoot, ["run", "license:smoke:tampered"], envWithSecret);

  await runNpm(desktopRoot, ["run", "support:bundle"]);
  await runNpm(desktopRoot, ["run", "support:verify"]);
  await runNpm(desktopRoot, ["run", "beta:pack"], envWithSecret);

  await runNpm(desktopRoot, ["run", "release:public-pack"]);

  const publicZip = path.join(desktopRoot, "release", "public", "latest.zip");
  if (!fs.existsSync(publicZip)) {
    fail(`missing public pack zip path=${publicZip}`);
  }
  const extracted = await extractPublicPackOrThrow(publicZip);
  await runNpm(desktopRoot, ["run", "verify:release", "--", "--rc", extracted]);

  await assertGitClean(desktopRoot, "desktop-end");
  await assertGitClean(parentRoot, "parent-end");

  process.stdout.write("[ship-public] PASS\n");
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));

