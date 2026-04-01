const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_MANIFEST = path.join(ROOT, "SHA256SUMS.txt");
const DIST_MANIFEST = path.join(ROOT, "dist", "SHA256SUMS.txt");
const SUMMARY_PATH = path.join(ROOT, "release", "proof-bundle-summary.json");
const PROOF_RELAY_CONFIG_PATH = process.env.NEURAL_PROOF_RELAY_CONFIG
  ? path.resolve(String(process.env.NEURAL_PROOF_RELAY_CONFIG))
  : path.join(ROOT, "release", "proof-relay-settings.json");

function relPath(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parseManifestLine(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const powershellMatch = trimmed.match(/^@\{Hash=([A-Fa-f0-9]{64});\s*Path=(.+)\}$/);
  if (powershellMatch) {
    return {
      sha256: powershellMatch[1].toLowerCase(),
      path: normalizePathField(powershellMatch[2]),
    };
  }

  const shaLineMatch = trimmed.match(/^([A-Fa-f0-9]{64})\s+(.+)$/);
  if (shaLineMatch) {
    return {
      sha256: shaLineMatch[1].toLowerCase(),
      path: normalizePathField(shaLineMatch[2]),
    };
  }

  return null;
}

function normalizePathField(value) {
  const normalized = String(value || "").trim().replace(/\\/g, "/");
  if (!normalized) return "";

  const rootPosix = ROOT.replace(/\\/g, "/");
  if (normalized.toLowerCase().startsWith(`${rootPosix.toLowerCase()}/`)) {
    return normalized.slice(rootPosix.length + 1);
  }
  return normalized;
}

function parseSourceManifest(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const entries = [];
  for (const line of lines) {
    const parsed = parseManifestLine(line);
    if (!parsed) continue;
    if (!parsed.path) continue;
    entries.push(parsed);
  }
  return entries;
}

function walkFiles(dirPath, out) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (path.resolve(fullPath) === path.resolve(DIST_MANIFEST)) continue;
    out.push(fullPath);
  }
}

function fileSha256(filePath) {
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256");
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest("hex");
}

function buildFallbackEntries() {
  const distDir = path.join(ROOT, "dist");
  if (!fs.existsSync(distDir)) return [];
  const files = [];
  walkFiles(distDir, files);
  files.sort((a, b) => a.localeCompare(b));
  return files.map((absPath) => ({
    sha256: fileSha256(absPath),
    path: relPath(absPath),
  }));
}

function writeDistManifest(entries) {
  fs.mkdirSync(path.dirname(DIST_MANIFEST), { recursive: true });
  const lines = entries.map((entry) => `${entry.sha256}  ${entry.path}`);
  fs.writeFileSync(DIST_MANIFEST, `${lines.join("\n")}\n`, "utf8");
}

function writeSummary(entries, sourceLabel) {
  fs.mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    source: sourceLabel,
    manifest: relPath(DIST_MANIFEST),
    entryCount: entries.length,
  };
  fs.writeFileSync(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  return summary;
}

function readProofRelayConfig() {
  if (!fs.existsSync(PROOF_RELAY_CONFIG_PATH)) {
    return {
      enabled: false,
      channel: "auto"
    };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(PROOF_RELAY_CONFIG_PATH, "utf8"));
    return {
      enabled: Boolean(parsed && parsed.enabled),
      channel: String(parsed && parsed.channel ? parsed.channel : "auto")
    };
  } catch {
    return {
      enabled: false,
      channel: "auto"
    };
  }
}

function shouldRunRelay() {
  if (process.env.PROOF_RELAY_ENABLED === "1") return true;
  const config = readProofRelayConfig();
  return Boolean(config.enabled);
}

function runProofRelay() {
  const relayScript = path.join(ROOT, "scripts", "proofRelay.cjs");
  if (!fs.existsSync(relayScript)) {
    return { ok: false, reason: "missing_proofRelay_script" };
  }
  const proc = spawnSync(process.execPath, [relayScript, "--summary", relPath(SUMMARY_PATH)], {
    cwd: ROOT,
    env: process.env,
    encoding: "utf8"
  });

  let parsed = null;
  const outText = String(proc.stdout || "").trim();
  if (outText) {
    try {
      parsed = JSON.parse(outText);
    } catch {
      parsed = null;
    }
  }

  return {
    ok: proc.status === 0,
    status: proc.status,
    stdout: outText,
    stderr: String(proc.stderr || "").trim(),
    payload: parsed
  };
}

function run() {
  let entries = [];
  let sourceLabel = "fallback:dist-scan";

  if (fs.existsSync(SOURCE_MANIFEST)) {
    entries = parseSourceManifest(SOURCE_MANIFEST);
    sourceLabel = relPath(SOURCE_MANIFEST);
  }

  if (!entries.length) {
    entries = buildFallbackEntries();
  }

  assert(entries.length > 0, "No checksum entries available for proof bundle.");

  writeDistManifest(entries);
  const summary = writeSummary(entries, sourceLabel);

  let relay = {
    enabled: false,
    skipped: true,
    reason: "relay_disabled"
  };

  if (shouldRunRelay()) {
    const result = runProofRelay();
    relay = {
      enabled: true,
      skipped: false,
      ...result
    };
    assert(result.ok, `Proof relay failed: ${result.stderr || result.stdout || result.reason || 'unknown_error'}`);
  }

  console.log(JSON.stringify({ ok: true, ...summary, relay }, null, 2));
}

run();
