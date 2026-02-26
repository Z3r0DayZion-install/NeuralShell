"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

function fail(msg) {
  process.stderr.write(`[beta-pack] FAIL ${msg}\n`);
  process.exit(1);
}

function nowIsoNoColons() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function addDaysIso(iso, days) {
  const baseMs = Date.parse(String(iso || ""));
  if (!Number.isFinite(baseMs)) return "";
  return new Date(baseMs + Number(days) * 24 * 3600 * 1000).toISOString();
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeUtf8(p, s) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

function writeJson(p, obj) {
  writeUtf8(p, JSON.stringify(obj, null, 2) + "\n");
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function normalizeLf(s) {
  return String(s || "").replace(/\r\n/g, "\n");
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

function copyDir(src, dst) {
  mkdirp(dst);
  const files = listFilesRecursive(src);
  for (const abs of files) {
    const rel = path.relative(src, abs);
    const out = path.join(dst, rel);
    mkdirp(path.dirname(out));
    fs.copyFileSync(abs, out);
  }
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function canonicalPayload({ tier, expiresAt, subject }) {
  const t = String(tier || "");
  const ms = Date.parse(String(expiresAt || ""));
  const e = Number.isFinite(ms) ? new Date(ms).toISOString() : "";
  const s = String(subject || "");
  return `tier=${t}\nexpiresAt=${e}\nsubject=${s}\n`;
}

function hmac(secret, payload) {
  return crypto.createHmac("sha256", String(secret)).update(String(payload), "utf8").digest("hex");
}

function wrapCmdForWindows(cmd, args) {
  if (process.platform !== "win32") return { cmd, args };
  const comspec = process.env.ComSpec || "cmd.exe";
  return { cmd: comspec, args: ["/d", "/s", "/c", cmd, ...args] };
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
    child.on("exit", (code) => {
      if (code === 0) return resolve({ stdout: out, stderr: err });
      reject(new Error(`cmd failed cmd=${cmd} code=${code}\n${err}`));
    });
  });
}

async function assertGitClean(repoRoot) {
  const wrapped = wrapCmdForWindows("git", ["-C", repoRoot, "status", "--porcelain"]);
  const res = await runCapture(wrapped.cmd, wrapped.args);
  const txt = String(res.stdout || "").trim();
  if (txt) {
    process.stderr.write(`[beta-pack] FAIL git not clean: ${repoRoot}\n`);
    process.stderr.write(txt + "\n");
    process.exit(1);
  }
}

async function runNpm(cwd, args, env) {
  const wrapped = wrapCmdForWindows("npm", args);
  await runCapture(wrapped.cmd, wrapped.args, { cwd, env });
}

// Minimal ZIP (store-only) writer (stable ordering, fixed timestamps)
function writeZipStore(zipPath, entries) {
  const out = [];
  const central = [];
  let offset = 0;
  function u16(n) {
    const b = Buffer.alloc(2);
    b.writeUInt16LE(n, 0);
    return b;
  }
  function u32(n) {
    const b = Buffer.alloc(4);
    b.writeUInt32LE(n >>> 0, 0);
    return b;
  }
  const FIXED_DOS_TIME = 0;
  const FIXED_DOS_DATE = 0;
  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const dataBuf = Buffer.isBuffer(e.data) ? e.data : Buffer.from(String(e.data), "utf8");
    const crc = crc32(dataBuf);
    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(FIXED_DOS_TIME),
      u16(FIXED_DOS_DATE),
      u32(crc),
      u32(dataBuf.length),
      u32(dataBuf.length),
      u16(nameBuf.length),
      u16(0),
      nameBuf
    ]);
    out.push(localHeader, dataBuf);
    const centralHeader = Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0),
      u16(0),
      u16(FIXED_DOS_TIME),
      u16(FIXED_DOS_DATE),
      u32(crc),
      u32(dataBuf.length),
      u32(dataBuf.length),
      u16(nameBuf.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      nameBuf
    ]);
    central.push(centralHeader);
    offset += localHeader.length + dataBuf.length;
  }
  const centralStart = offset;
  for (const c of central) {
    out.push(c);
    offset += c.length;
  }
  const centralSize = offset - centralStart;
  const end = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralSize),
    u32(centralStart),
    u16(0)
  ]);
  out.push(end);
  mkdirp(path.dirname(zipPath));
  fs.writeFileSync(zipPath, Buffer.concat(out));
}

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i !== buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const t = new Array(256);
  let n = 0;
  while (n !== 256) {
    let c = n;
    let k = 0;
    while (k !== 8) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      k++;
    }
    t[n] = c >>> 0;
    n++;
  }
  return t;
})();

async function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const parentRoot = path.resolve(desktopRoot, "..");

  await assertGitClean(desktopRoot);
  await assertGitClean(parentRoot);

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) fail("missing env LICENSE_HMAC_SECRET");

  // Parent gates (authoritative proof + tests)
  await runNpm(parentRoot, ["test"]);
  await runNpm(parentRoot, ["run", "proof:all"]);

  // RC + verify
  await runNpm(desktopRoot, ["run", "release:rc"], { LICENSE_HMAC_SECRET: secret });
  await runNpm(desktopRoot, ["run", "verify:release"]);

  const rcLatest = path.join(desktopRoot, "release", "rc", "latest");
  const ts = nowIsoNoColons();
  const packRoot = path.join(desktopRoot, "release", "beta", `beta_pack_${ts}`);
  const latestOut = path.join(packRoot, "latest");

  fs.rmSync(packRoot, { recursive: true, force: true });
  mkdirp(latestOut);
  copyDir(rcLatest, latestOut);

  // license.json in pack root
  const rcManifestPath = path.join(rcLatest, "RELEASE_MANIFEST.json");
  if (!fs.existsSync(rcManifestPath)) fail(`missing ${rcManifestPath}`);
  const rcManifest = JSON.parse(readUtf8(rcManifestPath));
  const version = typeof rcManifest?.version === "string" ? rcManifest.version.trim() : "";
  if (!version) fail("missing rc manifest version (expected RELEASE_MANIFEST.json.version)");
  const templateCommitSha = typeof rcManifest?.desktopCommit === "string" ? rcManifest.desktopCommit.trim() : "";
  if (!templateCommitSha) fail("missing rc manifest desktopCommit (for templates)");
  const templateBuildTimestamp = typeof rcManifest?.generatedAt === "string" ? rcManifest.generatedAt.trim() : "";
  if (!templateBuildTimestamp) fail("missing rc manifest generatedAt (for templates)");

  const expiresAt = addDaysIso(rcManifest.generatedAt, 30);
  if (!expiresAt) fail("invalid rc manifest generatedAt for license expiresAt");
  const tier = "beta";
  const parentCommitShort = String(rcManifest.parentCommit || "").slice(0, 12);
  const desktopCommitShort = String(rcManifest.desktopCommit || "").slice(0, 12);
  const subject = `beta_${desktopCommitShort}_${parentCommitShort}`;
  const payload = canonicalPayload({ tier, expiresAt, subject });
  const sig = hmac(secret, payload);
  const license = { tier, expiresAt: new Date(Date.parse(expiresAt)).toISOString(), subject, sig };
  writeJson(path.join(packRoot, "license.json"), license);

  // Templates (deterministic; committed)
  const templatesDir = path.join(desktopRoot, "templates", "beta");
  const requiredTemplates = [
    "BETA_README.txt",
    "KNOWN_ISSUES.txt",
    "SUPPORT_FLOW.txt",
    "PRIVACY_NOTE.txt",
    "UNINSTALL.txt",
    "SUPPORT_INSTRUCTIONS.txt"
  ];
  const placeholders = [
    { key: "{{VERSION}}", value: version },
    { key: "{{COMMIT_SHA}}", value: templateCommitSha },
    { key: "{{BUILD_TIMESTAMP}}", value: templateBuildTimestamp }
  ];
  for (const name of requiredTemplates) {
    const src = path.join(templatesDir, name);
    if (!fs.existsSync(src)) fail(`missing template ${src}`);
    const raw = normalizeLf(readUtf8(src));
    for (const ph of placeholders) {
      if (!raw.includes(ph.key)) fail(`template missing placeholder ${ph.key}: ${src}`);
    }
    let rendered = raw;
    for (const ph of placeholders) rendered = rendered.split(ph.key).join(ph.value);
    for (const ph of placeholders) {
      if (rendered.includes(ph.key)) fail(`placeholder not replaced ${ph.key}: ${src}`);
    }
    writeUtf8(path.join(packRoot, name), rendered.endsWith("\n") ? rendered : rendered + "\n");
  }

  // Copy manifest + sums for convenience
  for (const name of ["RELEASE_MANIFEST.json", "SHA256SUMS.txt", "PROOF_REPORT.json"]) {
    const src = path.join(rcLatest, name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(packRoot, name));
  }

  // Optional deterministic zip
  const zipPath = path.join(desktopRoot, "release", "beta", `beta_pack_${ts}.zip`);
  const files = listFilesRecursive(packRoot)
    .map((abs) => ({
      abs,
      rel: path.relative(packRoot, abs).split(path.sep).join("/")
    }))
    .sort((a, b) => a.rel.localeCompare(b.rel));
  const entries = files.map((f) => ({ name: `beta_pack_${ts}/${f.rel}`, data: fs.readFileSync(f.abs) }));
  writeZipStore(zipPath, entries);

  process.stdout.write(`[beta-pack] PASS out=${packRoot}\n`);
  process.stdout.write(`[beta-pack] zip=${zipPath}\n`);
}

main().catch((e) => fail(String(e && e.message ? e.message : e)));
