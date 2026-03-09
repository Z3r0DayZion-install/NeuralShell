const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const defaultRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseArg(name) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) return null;
  return String(raw).slice(prefix.length).trim();
}

function resolveInputPath(candidate, fallback) {
  if (!candidate) return fallback;
  if (path.isAbsolute(candidate)) return candidate;
  return path.join(defaultRoot, candidate);
}

function toPosix(relPath) {
  return relPath.split(path.sep).join("/");
}

function readInstallerPath(rootDir) {
  const distDir = path.join(rootDir, "dist");
  assert(fs.existsSync(distDir), `Missing dist directory: ${distDir}`);
  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  const installers = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => /^NeuralShell Setup .+\.exe$/i.test(name))
    .sort();
  assert(installers.length > 0, "Missing installer executable under dist/.");
  return path.posix.join("dist", installers[installers.length - 1]);
}

function readUpdateMetadataPath(rootDir) {
  const omega = path.join(rootDir, "dist", "OMEGA.yml");
  if (fs.existsSync(omega)) return "dist/OMEGA.yml";
  const latest = path.join(rootDir, "dist", "latest.yml");
  if (fs.existsSync(latest)) return "dist/latest.yml";
  throw new Error("Missing update metadata file (dist/OMEGA.yml or dist/latest.yml).");
}

function resolveTargets(rootDir) {
  const installer = readInstallerPath(rootDir);
  const targets = [
    installer,
    `${installer}.blockmap`,
    readUpdateMetadataPath(rootDir),
    "release/manifest.json",
    "release/manifest.sig",
    "release/manifest.pub",
    "release/signature-verification.json",
    "release/status.json",
    "release/provenance.json",
    "release/autonomy-benchmark.json"
  ];

  const optionalTargets = [
    "release/installer-smoke-report.json",
    "release/upgrade-validation.json",
    "release/security-pass.json",
    "release/canary-gate.json",
    "release/performance-gate.json",
    "release/operator-kpi.json",
    "release/slo-gate.json"
  ];
  for (const relPath of optionalTargets) {
    const absPath = path.join(rootDir, relPath);
    if (fs.existsSync(absPath) && fs.statSync(absPath).size > 0) {
      targets.push(relPath);
    }
  }

  for (const relPath of targets) {
    const absPath = path.join(rootDir, relPath);
    assert(fs.existsSync(absPath), `Missing release artifact for checksums: ${absPath}`);
    assert(fs.statSync(absPath).size > 0, `Empty release artifact for checksums: ${absPath}`);
  }

  return targets.sort((a, b) => a.localeCompare(b));
}

async function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return hash.digest("hex");
}

async function generateReleaseChecksums(options = {}) {
  const rootDir = options.rootDir || defaultRoot;
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();
  const targets = resolveTargets(rootDir);
  const entries = [];

  for (const relPath of targets) {
    const absPath = path.join(rootDir, relPath);
    const sha256 = await sha256File(absPath);
    entries.push({
      path: toPosix(relPath),
      sha256
    });
  }

  const outTxt = options.outTxt || path.join(rootDir, "release", "checksums.txt");
  const outJson = options.outJson || path.join(rootDir, "release", "checksums.json");
  fs.mkdirSync(path.dirname(outTxt), { recursive: true });
  fs.mkdirSync(path.dirname(outJson), { recursive: true });

  const lines = entries.map((entry) => `${entry.sha256}  ${entry.path}`);
  fs.writeFileSync(outTxt, `${lines.join("\n")}\n`, "utf8");
  fs.writeFileSync(
    outJson,
    `${JSON.stringify({ generatedAt: now(), entries }, null, 2)}\n`,
    "utf8"
  );

  return { entries, outTxt, outJson };
}

async function main() {
  const outTxtArg = parseArg("out-txt");
  const outJsonArg = parseArg("out-json");
  const outTxt = resolveInputPath(outTxtArg, path.join(defaultRoot, "release", "checksums.txt"));
  const outJson = resolveInputPath(outJsonArg, path.join(defaultRoot, "release", "checksums.json"));

  const { entries } = await generateReleaseChecksums({ outTxt, outJson });
  console.log(`Release checksums written: ${outTxt}`);
  console.log(`Release checksums metadata written: ${outJson}`);
  console.log(`Entries: ${entries.length}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = {
  generateReleaseChecksums,
  resolveTargets
};
