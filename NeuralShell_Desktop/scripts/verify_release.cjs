"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
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

function sha256FileHex(p) {
  const h = crypto.createHash("sha256");
  const buf = fs.readFileSync(p);
  h.update(buf);
  return h.digest("hex");
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

function fail(msg) {
  process.stderr.write(`[verify:release] FAIL ${msg}\n`);
  process.exit(1);
}

function main() {
  const desktopRoot = path.resolve(__dirname, "..");
  const rcDir = process.argv.includes("--rc")
    ? path.resolve(process.argv[process.argv.indexOf("--rc") + 1])
    : path.join(desktopRoot, "release", "rc", "latest");

  const manifestPath = path.join(rcDir, "RELEASE_MANIFEST.json");
  if (!fs.existsSync(manifestPath)) fail(`missing ${manifestPath}`);
  const m = readJson(manifestPath);

  const exePath = path.join(rcDir, m.artifacts?.exe?.file || "NeuralShell-TEAR-Runtime.exe");
  if (!fs.existsSync(exePath)) fail(`missing exe ${exePath}`);
  const exeHash = sha256FileHex(exePath);
  if (exeHash !== m.artifacts.exe.sha256) fail(`exe hash mismatch expected=${m.artifacts.exe.sha256} actual=${exeHash}`);

  const tearDir = path.join(rcDir, m.artifacts?.tearRuntime?.dir || "tear_runtime");
  if (!fs.existsSync(tearDir)) fail(`missing tear runtime dir ${tearDir}`);
  const tearHash = sha256TreeHex(tearDir);
  if (tearHash.sha256 !== m.artifacts.tearRuntime.sha256) {
    fail(`tear runtime hash mismatch expected=${m.artifacts.tearRuntime.sha256} actual=${tearHash.sha256}`);
  }

  const proofPath = path.join(rcDir, m.proof?.file || "PROOF_REPORT.json");
  if (!fs.existsSync(proofPath)) fail(`missing proof report ${proofPath}`);
  const proofHash = sha256FileHex(proofPath);
  if (proofHash !== m.proof.sha256) fail(`proof report hash mismatch expected=${m.proof.sha256} actual=${proofHash}`);

  process.stdout.write("[verify:release] PASS\n");
}

main();

