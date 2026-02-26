"use strict";

const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function readUtf8(p) {
  return fs.readFileSync(p, "utf8");
}

function writeUtf8(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s, "utf8");
}

function sha256Hex(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function redact(text) {
  let t = String(text || "");
  t = t.replace(/C:\\Users\\[^\\]+\\/gi, "C:\\Users\\<user>\\");
  t = t.replace(/(authorization\\s*:\\s*)(bearer\\s+)[^\\s]+/gi, "$1$2<redacted>");
  t = t.replace(/(NS_VAULT_KEY\\s*=)\\S+/g, "$1<redacted>");
  t = t.replace(/(LICENSE_HMAC_SECRET\\s*=)\\S+/g, "$1<redacted>");
  return t;
}

function listNewestProofLogs(parentRoot) {
  const stateProofs = path.join(parentRoot, "state", "proofs");
  if (!fs.existsSync(stateProofs)) return [];
  const dirs = fs.readdirSync(stateProofs).map((n) => path.join(stateProofs, n));
  const stats = dirs
    .filter((d) => fs.existsSync(d) && fs.statSync(d).isDirectory())
    .map((d) => ({ d, m: fs.statSync(d).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  const top = stats.slice(0, 2).map((x) => x.d);
  const out = [];
  for (const d of top) {
    const files = fs.readdirSync(d).filter((n) => n.endsWith(".log") || n.endsWith(".txt"));
    for (const f of files) out.push(path.join(d, f));
  }
  return out;
}

// Minimal ZIP (store-only) writer (no deps).
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
      u16(0), // store
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

  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  fs.writeFileSync(zipPath, Buffer.concat(out));
}

function crc32(buf) {
  let c = 0 ^ -1;
  for (let i = 0; i !== buf.length; i++) {
    c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const CRC_TABLE = (() => {
  const t = new Array(256);
  for (let n = 0; n !== 256; n++) {
    let c = n;
    for (let k = 0; k !== 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const parentRoot = path.resolve(desktopRoot, "..");
  const rcDir = process.argv.includes("--rc")
    ? path.resolve(process.argv[process.argv.indexOf("--rc") + 1])
    : path.join(desktopRoot, "release", "rc", "latest");

  const manifestPath = path.join(rcDir, "RELEASE_MANIFEST.json");
  const sumsPath = path.join(rcDir, "SHA256SUMS.txt");
  const proofPath = path.join(rcDir, "PROOF_REPORT.json");

  if (!fs.existsSync(manifestPath) || !fs.existsSync(sumsPath) || !fs.existsSync(proofPath)) {
    process.stderr.write("[support-bundle] FAIL missing rc artifacts\n");
    process.exit(1);
  }

  const health = {
    generatedAt: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    release: os.release(),
    cpus: os.cpus().length,
    totalmem: os.totalmem(),
    freemem: os.freemem(),
    node: process.version
  };

  const entries = [];
  entries.push({ name: "RELEASE_MANIFEST.json", data: Buffer.from(readUtf8(manifestPath), "utf8") });
  entries.push({ name: "SHA256SUMS.txt", data: Buffer.from(readUtf8(sumsPath), "utf8") });
  entries.push({ name: "PROOF_REPORT.json", data: Buffer.from(readUtf8(proofPath), "utf8") });
  entries.push({ name: "health_snapshot.json", data: Buffer.from(JSON.stringify(health, null, 2) + "\n", "utf8") });

  const logs = listNewestProofLogs(parentRoot);
  for (const p of logs) {
    const base = path.basename(p);
    const raw = readUtf8(p);
    const tail = raw.split(/\r?\n/).slice(-200).join("\n") + "\n";
    entries.push({ name: `logs/${base}`, data: Buffer.from(redact(tail), "utf8") });
  }

  const meta = {
    schemaVersion: "support_bundle.v1",
    generatedAt: new Date().toISOString(),
    rcDir: path.resolve(rcDir),
    included: entries.map((e) => ({ name: e.name, sha256: sha256Hex(e.data), bytes: e.data.length }))
  };
  entries.push({ name: "support_meta.json", data: Buffer.from(JSON.stringify(meta, null, 2) + "\n", "utf8") });

  const outZip = path.join(desktopRoot, "release", "support", `support_bundle_${nowStamp()}.zip`);
  writeZipStore(outZip, entries.sort((a, b) => a.name.localeCompare(b.name)));
  process.stdout.write(`[support-bundle] PASS out=${outZip}\n`);
}

main();

