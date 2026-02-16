"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const cwd = process.cwd();
const distDir = path.join(cwd, "dist");
const files = [
  "NeuralShell-TEAR-Setup-0.2.0.exe",
  "NeuralShell-TEAR-Portable-0.2.0.exe"
];

if (!fs.existsSync(distDir)) {
  throw new Error("dist directory not found");
}

const rows = [];
for (const name of files) {
  const full = path.join(distDir, name);
  if (!fs.existsSync(full)) continue;
  const data = fs.readFileSync(full);
  const hash = crypto.createHash("sha256").update(data).digest("hex");
  const size = fs.statSync(full).size;
  rows.push({ name, hash, size });
}

if (!rows.length) {
  throw new Error("no release artifacts found in dist");
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

