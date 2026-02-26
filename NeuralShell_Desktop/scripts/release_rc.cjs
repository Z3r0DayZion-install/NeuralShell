"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const desktopRoot = path.resolve(__dirname, "..");
const parentRoot = path.resolve(desktopRoot, "..");

function nowIso() {
  return new Date().toISOString();
}

function sha256HexString(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function setTreeTimes(rootDir, epochMs) {
  const t = new Date(epochMs);
  const stack = [rootDir];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      entries = [];
    }
    for (const ent of entries) {
      const full = path.join(cur, ent.name);
      if (ent.isDirectory()) stack.push(full);
      try {
        fs.utimesSync(full, t, t);
      } catch {
        // ignore (best effort; verified by downstream hashes)
      }
    }
    try {
      fs.utimesSync(cur, t, t);
    } catch {
      // ignore
    }
  }
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p, s) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function sha256FileHex(p) {
  const h = crypto.createHash("sha256");
  const buf = fs.readFileSync(p);
  h.update(buf);
  return { sha256: h.digest("hex"), bytes: buf.length };
}

function listFilesRecursive(rootDir) {
  const out = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.isFile()) out.push(abs);
    }
  }
  walk(rootDir);
  return out;
}

function sha256TreeHex(rootDir) {
  const files = listFilesRecursive(rootDir);
  const h = crypto.createHash("sha256");
  for (const abs of files) {
    const rel = path.relative(rootDir, abs).split(path.sep).join("/");
    const buf = fs.readFileSync(abs);
    h.update(rel, "utf8");
    h.update("\0", "utf8");
    h.update(buf);
    h.update("\0", "utf8");
  }
  return { sha256: h.digest("hex"), files: files.length };
}

function copyFile(src, dst) {
  mkdirp(path.dirname(dst));
  const ext = path.extname(src).toLowerCase();
  const isText =
    ext === ".js" ||
    ext === ".cjs" ||
    ext === ".mjs" ||
    ext === ".json" ||
    ext === ".md" ||
    ext === ".txt" ||
    ext === ".yaml" ||
    ext === ".yml";
  if (!isText) {
    fs.copyFileSync(src, dst);
    return;
  }
  const txt = fs.readFileSync(src, "utf8");
  const normalized = txt.replace(/\r\n/g, "\n");
  fs.writeFileSync(dst, normalized, "utf8");
}

function copyDirSelected(srcRoot, dstRoot, allowPrefixRelPaths) {
  for (const rel of allowPrefixRelPaths) {
    const src = path.join(srcRoot, rel);
    const dst = path.join(dstRoot, rel);
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      mkdirp(dst);
      const files = listFilesRecursive(src);
      for (const abs of files) {
        const r = path.relative(src, abs);
        copyFile(abs, path.join(dst, r));
      }
    } else if (st.isFile()) {
      copyFile(src, dst);
    }
  }
}

function run(cmd, args, opts) {
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
    } catch (err) {
      return reject(
        new Error(
          `[release:rc] FAIL spawn cmd=${cmd} args=${JSON.stringify(args)} cwd=${opts?.cwd || process.cwd()} code=${
            err && err.code ? err.code : "unknown"
          }`
        )
      );
    }
    child.on("error", (err) => {
      reject(
        new Error(
          `[release:rc] FAIL spawn cmd=${cmd} args=${JSON.stringify(args)} cwd=${opts?.cwd || process.cwd()} code=${
            err && err.code ? err.code : "unknown"
          }`
        )
      );
    });
    child.on("exit", (code, signal) => {
      if (code === 0) return resolve({ code: 0 });
      reject(new Error(`[release:rc] FAIL cmd=${cmd} code=${code} signal=${signal || "none"}`));
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
      return reject(
        new Error(
          `[release:rc] FAIL spawn cmd=${cmd} args=${JSON.stringify(args)} cwd=${opts?.cwd || process.cwd()} code=${
            e && e.code ? e.code : "unknown"
          }`
        )
      );
    }
    child.stdout.on("data", (d) => (out += d.toString("utf8")));
    child.stderr.on("data", (d) => (err += d.toString("utf8")));
    child.on("error", (e) => {
      reject(
        new Error(
          `[release:rc] FAIL spawn cmd=${cmd} args=${JSON.stringify(args)} cwd=${opts?.cwd || process.cwd()} code=${
            e && e.code ? e.code : "unknown"
          }`
        )
      );
    });
    child.on("exit", (code) => {
      if (code === 0) return resolve({ stdout: out, stderr: err });
      reject(new Error(`[release:rc] FAIL cmd=${cmd} code=${code}\n${err}`));
    });
  });
}

async function assertGitClean(repoRoot) {
  const wrapped = wrapCmdForWindows("git", ["-C", repoRoot, "status", "--porcelain"]);
  const res = await runCapture(wrapped.cmd, wrapped.args);
  const txt = String(res.stdout || "").trim();
  if (txt) {
    process.stderr.write(`[release:rc] FAIL git not clean: ${repoRoot}\n`);
    process.stderr.write(txt + "\n");
    process.exit(1);
  }
}

async function gitHead(repoRoot) {
  const wrapped = wrapCmdForWindows("git", ["-C", repoRoot, "rev-parse", "HEAD"]);
  const res = await runCapture(wrapped.cmd, wrapped.args);
  return String(res.stdout || "").trim();
}

async function gitCommitTimeIso(repoRoot) {
  const wrapped = wrapCmdForWindows("git", ["-C", repoRoot, "show", "-s", "--format=%cI", "HEAD"]);
  const res = await runCapture(wrapped.cmd, wrapped.args);
  const s = String(res.stdout || "").trim();
  const ms = Date.parse(s);
  if (!s || !Number.isFinite(ms)) throw new Error(`[release:rc] FAIL invalid git commit time repo=${repoRoot} value=${s}`);
  return new Date(ms).toISOString();
}

async function buildTimestampIso() {
  const sde = process.env.SOURCE_DATE_EPOCH;
  if (sde && /^\d+$/.test(sde)) {
    const ms = Number(sde) * 1000;
    if (!Number.isFinite(ms)) throw new Error(`[release:rc] FAIL invalid SOURCE_DATE_EPOCH value=${sde}`);
    return new Date(ms).toISOString();
  }
  return await gitCommitTimeIso(desktopRoot);
}

function wrapCmdForWindows(cmd, args) {
  if (process.platform !== "win32") return { cmd, args };
  const comspec = process.env.ComSpec || "cmd.exe";
  // Run via cmd.exe so .cmd shims work under spawn(shell:false).
  return { cmd: comspec, args: ["/d", "/s", "/c", cmd, ...args] };
}

function runNpm(args, opts) {
  const wrapped = wrapCmdForWindows("npm", args);
  return run(wrapped.cmd, wrapped.args, opts);
}

function runNpmCapture(args, opts) {
  const wrapped = wrapCmdForWindows("npm", args);
  return runCapture(wrapped.cmd, wrapped.args, opts);
}

async function npmVersion() {
  const res = await runNpmCapture(["-v"]);
  return String(res.stdout || "").trim();
}

function requireEnvSecret() {
  const s = process.env.LICENSE_HMAC_SECRET;
  if (!s) {
    process.stderr.write("[release:rc] FAIL missing env LICENSE_HMAC_SECRET\n");
    process.exit(1);
  }
  if (String(s).length < 16) {
    process.stderr.write("[release:rc] FAIL LICENSE_HMAC_SECRET too short\n");
    process.exit(1);
  }
  return String(s);
}

function patchEmbeddedSecret({ secret, secretFilePath }) {
  const original = readUtf8(secretFilePath);
  const patched = original.replace("__NEURALSHELL_LICENSE_SECRET__", secret);
  if (patched === original) {
    process.stderr.write("[release:rc] FAIL secret placeholder not found in secret.cjs\n");
    process.exit(1);
  }
  fs.writeFileSync(secretFilePath, patched, "utf8");
  return original;
}

async function main() {
  const generatedAt = await buildTimestampIso();

  await assertGitClean(parentRoot);
  await assertGitClean(desktopRoot);

  const parentSha = await gitHead(parentRoot);
  const desktopSha = await gitHead(desktopRoot);
  const npmVer = await npmVersion();

  process.stdout.write("[release:rc] running parent proofs\n");
  await runNpm(["run", "proof:all"], { cwd: parentRoot });
  process.stdout.write("[release:rc] running parent tests\n");
  await runNpm(["test"], { cwd: parentRoot });

  const secret = requireEnvSecret();
  const secretFilePath = path.join(desktopRoot, "src", "license", "secret.cjs");
  const exeSrc = path.join(desktopRoot, "dist", "NeuralShell-TEAR-Runtime.exe");
  const buildMetaPath = path.join(desktopRoot, "dist", "NeuralShell-TEAR-Runtime.build.json");
  const secretFingerprint = sha256HexString(secret).slice(0, 12);

  let needBuild = true;
  if (exists(exeSrc) && exists(buildMetaPath)) {
    try {
      const meta = JSON.parse(readUtf8(buildMetaPath));
      if (
        meta &&
        meta.schemaVersion === "tear_exe_build_meta.v2" &&
        meta.buildStrategy === "snapshot_lf_v4_nobytecode" &&
        meta.desktopCommit === desktopSha &&
        meta.secretFingerprint === secretFingerprint
      ) {
        needBuild = false;
      }
    } catch {
      needBuild = true;
    }
  }

  if (needBuild) {
    // Snapshot must live under desktopRoot so Node resolution during pkg build
    // finds desktopRoot/node_modules (not any higher/global node_modules).
    const snapshotDir = path.join(desktopRoot, "dist", `neuralshell-tear-snapshot-${desktopSha.slice(0, 12)}`);
    rmrf(snapshotDir);
    mkdirp(snapshotDir);
    try {
      copyDirSelected(desktopRoot, snapshotDir, ["tear-runtime.js", "src", "package.json"]);
      patchEmbeddedSecret({ secret, secretFilePath: path.join(snapshotDir, "src", "license", "secret.cjs") });

      const pkgCmd = path.join(desktopRoot, "node_modules", ".bin", "pkg.cmd");
      if (!exists(pkgCmd)) {
        process.stderr.write(`[release:rc] FAIL missing pkg binary: ${pkgCmd}\n`);
        process.exit(1);
      }
      const ms = Date.parse(generatedAt);
      const sde = Number.isFinite(ms) ? String(Math.floor(ms / 1000)) : "";
      if (Number.isFinite(ms)) {
        setTreeTimes(snapshotDir, ms);
      }
      process.stdout.write("[release:rc] building TEAR runtime EXE\n");
      const wrappedPkg = wrapCmdForWindows(pkgCmd, [
        "tear-runtime.js",
        "--targets",
        "node18-win-x64",
        "--public",
        "--no-bytecode",
        "--output",
        exeSrc
      ]);
      await run(wrappedPkg.cmd, wrappedPkg.args, {
        cwd: snapshotDir,
        env: { ...(sde ? { SOURCE_DATE_EPOCH: sde } : {}), NODE_PATH: path.join(desktopRoot, "node_modules") }
      });
    } finally {
      rmrf(snapshotDir);
    }
    writeUtf8(
      buildMetaPath,
      JSON.stringify(
        {
          schemaVersion: "tear_exe_build_meta.v2",
          buildStrategy: "snapshot_lf_v4_nobytecode",
          desktopCommit: desktopSha,
          secretFingerprint,
          builtAt: generatedAt
        },
        null,
        2
      ) + "\n"
    );
  } else {
    process.stdout.write("[release:rc] reusing existing TEAR runtime EXE (cache hit)\n");
  }

  // Ensure secret file restore didn't dirty the repo.
  await assertGitClean(desktopRoot);

  // EXE hash changed by build; explicitly accept executed-target changes for this run so the
  // proof manifest is refreshed only after a full proof pass.
  process.stdout.write("[release:rc] re-running parent proofs (post-build manifest refresh)\n");
  await runNpm(["run", "proof:all"], {
    cwd: parentRoot
  });

  if (!exists(exeSrc)) {
    process.stderr.write(`[release:rc] FAIL missing exe: ${exeSrc}\n`);
    process.exit(1);
  }

  const rcRoot = path.join(desktopRoot, "release", "rc");
  const latestDir = path.join(rcRoot, "latest");
  rmrf(latestDir);
  mkdirp(latestDir);

  const exeDstName = "NeuralShell-TEAR-Runtime.exe";
  const exeDst = path.join(latestDir, exeDstName);
  copyFile(exeSrc, exeDst);

  const tearRuntimeDir = path.join(latestDir, "tear_runtime");
  rmrf(tearRuntimeDir);
  mkdirp(tearRuntimeDir);

  const tearSelected = ["tear-runtime.js", "src/core", "src/runtime", "src/license", "package.json"];
  copyDirSelected(desktopRoot, tearRuntimeDir, tearSelected);

  const tearFileList = listFilesRecursive(tearRuntimeDir)
    .map((abs) => path.relative(tearRuntimeDir, abs).split(path.sep).join("/"))
    .sort();
  writeUtf8(path.join(latestDir, "TEAR_RUNTIME_FILELIST.txt"), tearFileList.join("\n") + "\n");

  const exeHash = sha256FileHex(exeDst);
  const tearHash = sha256TreeHex(tearRuntimeDir);

  const proofManifestPath = path.join(parentRoot, "proof", "latest", "proof-manifest.json");
  if (!exists(proofManifestPath)) {
    process.stderr.write(`[release:rc] FAIL missing proof manifest: ${proofManifestPath}\n`);
    process.exit(1);
  }
  const proofManifestText = readUtf8(proofManifestPath);
  const proofManifest = JSON.parse(proofManifestText);
  const executedTargets = {};
  for (const [k, v] of Object.entries(proofManifest.executedTargets || {})) {
    executedTargets[k] = { sha256: v.sha256, bytes: v.bytes, label: v.label };
  }
  const proofReport = {
    schemaVersion: "proof_report.v2",
    generatedAt,
    parentCommit: parentSha,
    desktopCommit: desktopSha,
    proofManifestSchemaVersion: proofManifest.schemaVersion,
    executedTargets,
    gates: { parentProofAll: "PASS", parentTests: "PASS" }
  };
  const proofReportPath = path.join(latestDir, "PROOF_REPORT.json");
  writeUtf8(proofReportPath, JSON.stringify(proofReport, null, 2) + "\n");
  const proofReportHash = sha256FileHex(proofReportPath);

  const pkgPath = path.join(desktopRoot, "package.json");
  if (!exists(pkgPath)) {
    process.stderr.write(`[release:rc] FAIL missing ${pkgPath}\n`);
    process.exit(1);
  }
  let version = "";
  try {
    const pkg = JSON.parse(readUtf8(pkgPath));
    version = typeof pkg?.version === "string" ? pkg.version.trim() : "";
  } catch {
    version = "";
  }
  if (!version) {
    process.stderr.write(`[release:rc] FAIL missing/invalid version in ${pkgPath}\n`);
    process.exit(1);
  }

  const releaseManifest = {
    schemaVersion: "release_manifest.v1",
    version,
    generatedAt,
    proofVersion: "v4",
    platform: process.platform,
    arch: process.arch,
    parentCommit: parentSha,
    desktopCommit: desktopSha,
    nodeVersion: process.version,
    npmVersion: npmVer,
    artifacts: {
      exe: { file: exeDstName, sha256: exeHash.sha256, bytes: exeHash.bytes },
      tearRuntime: { dir: "tear_runtime", sha256: tearHash.sha256, files: tearHash.files }
    },
    proof: { file: "PROOF_REPORT.json", sha256: proofReportHash.sha256, bytes: proofReportHash.bytes }
  };

  const releaseManifestPath = path.join(latestDir, "RELEASE_MANIFEST.json");
  writeUtf8(releaseManifestPath, JSON.stringify(releaseManifest, null, 2) + "\n");

  const manifestHash = sha256FileHex(releaseManifestPath);

  const sumsLines = [];
  sumsLines.push(`${manifestHash.sha256}  RELEASE_MANIFEST.json`);
  sumsLines.push(`${proofReportHash.sha256}  PROOF_REPORT.json`);
  sumsLines.push(`${exeHash.sha256}  ${exeDstName}`);
  sumsLines.push(`${tearHash.sha256}  tear_runtime/`);
  writeUtf8(path.join(latestDir, "SHA256SUMS.txt"), sumsLines.join("\n") + "\n");

  process.stdout.write(`[release:rc] PASS dir=${latestDir}\n`);
}

main().catch((err) => {
  process.stderr.write(`[release:rc] FAIL ${String(err && err.message ? err.message : err)}\n`);
  process.exit(1);
});
