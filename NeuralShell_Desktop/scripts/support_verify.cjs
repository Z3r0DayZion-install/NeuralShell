"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function fail(msg) {
  process.stderr.write(`[support-verify] FAIL ${msg}\n`);
  process.exit(1);
}

function wrapCmdForWindows(cmd, args) {
  if (process.platform !== "win32") return { cmd, args };
  const comspec = process.env.ComSpec || "cmd.exe";
  return { cmd: comspec, args: ["/d", "/s", "/c", cmd, ...args] };
}

function runCapture(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
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
    child.stdout.on("data", (d) => (stdout += d.toString("utf8")));
    child.stderr.on("data", (d) => (stderr += d.toString("utf8")));
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) return resolve({ stdout, stderr });
      reject(new Error(`cmd failed cmd=${cmd} code=${code} signal=${signal || "none"}\n${stderr}`));
    });
  });
}

function ensureEmptyDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function readU16LE(buf, off) {
  return buf.readUInt16LE(off);
}

function readU32LE(buf, off) {
  return buf.readUInt32LE(off);
}

function findEocd(buf) {
  const sig = 0x06054b50;
  const min = Math.max(0, buf.length - 0x10000 - 22);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === sig) return i;
  }
  return -1;
}

function safeDestPath(rootDir, zipName) {
  const norm = String(zipName || "").replace(/\\/g, "/");
  if (!norm || norm.includes("\0")) throw new Error("invalid zip entry name");
  if (norm.startsWith("/") || /^[A-Za-z]:/.test(norm)) throw new Error(`zip slip rejected name=${norm}`);
  const parts = norm.split("/").filter((p) => p.length > 0);
  for (const p of parts) {
    if (p === "." || p === "..") throw new Error(`zip slip rejected name=${norm}`);
  }
  const out = path.resolve(rootDir, parts.join(path.sep));
  const root = path.resolve(rootDir) + path.sep;
  if (!out.startsWith(root)) throw new Error(`zip slip rejected name=${norm}`);
  return out;
}

function parseCentralDirectory(buf, eocdOff) {
  const disk = readU16LE(buf, eocdOff + 4);
  const cdDisk = readU16LE(buf, eocdOff + 6);
  const totalEntries = readU16LE(buf, eocdOff + 10);
  const cdSize = readU32LE(buf, eocdOff + 12);
  const cdOffset = readU32LE(buf, eocdOff + 16);
  if (disk !== 0 || cdDisk !== 0) throw new Error("multi-disk zip not supported");
  if (cdOffset + cdSize > buf.length) throw new Error("central directory out of bounds");

  const entries = [];
  let off = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (readU32LE(buf, off) !== 0x02014b50) throw new Error("bad central directory signature");
    const flags = readU16LE(buf, off + 8);
    const method = readU16LE(buf, off + 10);
    const compSize = readU32LE(buf, off + 20);
    const uncompSize = readU32LE(buf, off + 24);
    const nameLen = readU16LE(buf, off + 28);
    const extraLen = readU16LE(buf, off + 30);
    const commentLen = readU16LE(buf, off + 32);
    const localOff = readU32LE(buf, off + 42);
    const name = buf.slice(off + 46, off + 46 + nameLen).toString("utf8");
    entries.push({ name, flags, method, compSize, uncompSize, localOff });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function extractZipStore(zipPath, outDir) {
  const buf = fs.readFileSync(zipPath);
  const eocdOff = findEocd(buf);
  if (eocdOff < 0) throw new Error("eocd not found");
  const entries = parseCentralDirectory(buf, eocdOff);

  const extractedNames = [];
  for (const e of entries) {
    const name = String(e.name || "");
    if (!name) continue;
    if (name.endsWith("/")) {
      const dstDir = safeDestPath(outDir, name);
      fs.mkdirSync(dstDir, { recursive: true });
      continue;
    }

    if (e.flags !== 0) throw new Error(`unsupported zip flags name=${name} flags=${e.flags}`);
    if (e.method !== 0) throw new Error(`unsupported zip method name=${name} method=${e.method}`);
    if (e.compSize !== e.uncompSize) throw new Error(`zip store size mismatch name=${name}`);

    const local = e.localOff;
    if (readU32LE(buf, local) !== 0x04034b50) throw new Error(`bad local header name=${name}`);
    const localFlags = readU16LE(buf, local + 6);
    const localMethod = readU16LE(buf, local + 8);
    const localCompSize = readU32LE(buf, local + 18);
    const localUncompSize = readU32LE(buf, local + 22);
    const nameLen = readU16LE(buf, local + 26);
    const extraLen = readU16LE(buf, local + 28);
    if (localFlags !== 0) throw new Error(`unsupported local zip flags name=${name} flags=${localFlags}`);
    if (localMethod !== 0) throw new Error(`unsupported local zip method name=${name} method=${localMethod}`);
    if (localCompSize !== localUncompSize) throw new Error(`local zip store size mismatch name=${name}`);
    const dataOff = local + 30 + nameLen + extraLen;
    const dataEnd = dataOff + localCompSize;
    if (dataEnd > buf.length) throw new Error(`zip data out of bounds name=${name}`);

    const dstPath = safeDestPath(outDir, name);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.writeFileSync(dstPath, buf.slice(dataOff, dataEnd));
    extractedNames.push(name);
  }
  return extractedNames;
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

function assertExistsFile(p, label) {
  if (!fs.existsSync(p) || !fs.statSync(p).isFile()) fail(`missing required file ${label} path=${p}`);
}

function assertLogsPresent(extractDir) {
  const logsDir = path.join(extractDir, "logs");
  if (!fs.existsSync(logsDir) || !fs.statSync(logsDir).isDirectory()) fail(`missing logs directory path=${logsDir}`);
  const files = fs.readdirSync(logsDir).filter((n) => n && !n.endsWith("/") && fs.statSync(path.join(logsDir, n)).isFile());
  if (files.length === 0) fail("logs directory empty (expected proof log snapshot)");
}

function scanForbidden(extractDir, extractedNames) {
  const lowerNames = new Set(extractedNames.map((n) => String(n).toLowerCase()));
  for (const n of lowerNames) {
    if (n.endsWith("license.json")) fail("forbidden file present: license.json");
  }

  const forbidden = [
    "LICENSE_HMAC_SECRET",
    "NEURALSHELL_RC_SECRET",
    "NEURALSHELL_SHIP_SECRET"
  ];
  if (process.env.SUPPORT_VERIFY_FORBIDDEN) {
    for (const t of String(process.env.SUPPORT_VERIFY_FORBIDDEN).split(";")) {
      const s = String(t || "").trim();
      if (s) forbidden.push(s);
    }
  }

  const files = listFilesRecursive(extractDir);
  for (const filePath of files) {
    const buf = fs.readFileSync(filePath);
    for (const token of forbidden) {
      const needle = Buffer.from(String(token), "utf8");
      if (needle.length === 0) continue;
      if (buf.indexOf(needle) !== -1) {
        fail(`forbidden content detected token=${token} file=${filePath}`);
      }
    }
  }
}

async function main() {
  const desktopRoot = path.resolve(__dirname, "..");

  const wrapped = wrapCmdForWindows("npm", ["run", "support:bundle"]);
  let res;
  try {
    res = await runCapture(wrapped.cmd, wrapped.args, { cwd: desktopRoot });
  } catch (e) {
    fail(String(e && e.message ? e.message : e));
  }

  const combined = `${res.stdout || ""}\n${res.stderr || ""}`;
  const m = combined.match(/\[support-bundle\]\s+PASS\s+out=(.+?\.zip)\s*$/m);
  if (!m) fail("could not parse support bundle output path");
  const zipPath = String(m[1]).trim();
  if (!zipPath.toLowerCase().endsWith(".zip")) fail(`bundle is not a .zip path=${zipPath}`);
  if (!fs.existsSync(zipPath) || !fs.statSync(zipPath).isFile()) fail(`bundle missing path=${zipPath}`);

  const extractDir = path.join(os.tmpdir(), `neuralshell-support-verify-${process.pid}`);
  ensureEmptyDir(extractDir);

  try {
    const extractedNames = extractZipStore(zipPath, extractDir);

    assertExistsFile(path.join(extractDir, "RELEASE_MANIFEST.json"), "RELEASE_MANIFEST.json");
    assertExistsFile(path.join(extractDir, "PROOF_REPORT.json"), "PROOF_REPORT.json");
    assertExistsFile(path.join(extractDir, "SHA256SUMS.txt"), "SHA256SUMS.txt");
    assertExistsFile(path.join(extractDir, "health_snapshot.json"), "health_snapshot.json");
    assertExistsFile(path.join(extractDir, "support_meta.json"), "support_meta.json");
    assertLogsPresent(extractDir);

    try {
      const meta = JSON.parse(fs.readFileSync(path.join(extractDir, "support_meta.json"), "utf8"));
      if (!meta || meta.schemaVersion !== "support_bundle.v1") fail("support_meta.json schemaVersion mismatch");
    } catch (e) {
      fail(`support_meta.json parse failed: ${String(e && e.message ? e.message : e)}`);
    }

    scanForbidden(extractDir, extractedNames);

    process.stdout.write(`[support-verify] PASS out=${zipPath}\n`);
  } finally {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));

