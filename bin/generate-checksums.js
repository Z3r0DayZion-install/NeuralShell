"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const cwd = process.cwd();
const distDir = path.join(cwd, "dist");

if (!fs.existsSync(distDir)) {
  throw new Error("dist directory not found");
}

function newestMatch(regex) {
  const candidates = fs.readdirSync(distDir)
    .filter((name) => regex.test(name))
    .map((name) => {
      const full = path.join(distDir, name);
      const st = fs.statSync(full);
      return { name, full, mtimeMs: st.mtimeMs };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0] || null;
}

const selected = [
  newestMatch(/^NeuralShell-TEAR-Setup-.*\.exe$/i),
  newestMatch(/^NeuralShell-TEAR-Portable-.*\.exe$/i)
].filter(Boolean);

if (!selected.length) {
  throw new Error("no release artifacts found in dist");
}

const rows = [];
for (const item of selected) {
  const data = fs.readFileSync(item.full);
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  const size = fs.statSync(item.full).size;
  rows.push({ name: item.name, hash, size });
}

const out = ["# Release Checksums", ""];
for (const row of rows) {
  out.push(`${row.name}  sha256=${row.hash}  size=${row.size}`);
}
const outPath = path.join(distDir, "RELEASE_CHECKSUMS.txt");
fs.writeFileSync(outPath, `${out.join("\n")}\n`, "utf8");

for (const row of rows) {
  console.log(`${row.name} ${row.hash}`);
}
console.log(`Wrote ${path.relative(cwd, outPath)}`);
