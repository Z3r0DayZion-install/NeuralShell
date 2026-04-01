#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

function parseArgs(argv) {
  const args = { output: "", includeUserText: false };
  for (const entry of argv.slice(2)) {
    if (entry === "--include-user-text") {
      args.includeUserText = true;
      continue;
    }
    if (entry.startsWith("--output=")) {
      args.output = entry.slice("--output=".length).trim();
    }
  }
  return args;
}

function redactSecrets(input) {
  const source = String(input || "");
  return source
    .replace(/(sk-[a-zA-Z0-9_-]{16,})/g, "[REDACTED_API_KEY]")
    .replace(/(or-[a-zA-Z0-9_-]{16,})/g, "[REDACTED_API_KEY]")
    .replace(/(grq-[a-zA-Z0-9_-]{16,})/g, "[REDACTED_API_KEY]")
    .replace(/(tgt-[a-zA-Z0-9_-]{16,})/g, "[REDACTED_API_KEY]")
    .replace(/https:\/\/hooks\.slack\.com\/services\/[^\s"]+/g, "[REDACTED_WEBHOOK]")
    .replace(/https:\/\/discord\.com\/api\/webhooks\/[^\s"]+/g, "[REDACTED_WEBHOOK]");
}

function sanitizeJson(value, includeUserText) {
  const seen = new WeakSet();
  const walk = (node) => {
    if (node == null) return node;
    if (typeof node === "string") {
      const redacted = redactSecrets(node);
      if (!includeUserText && redacted.length > 600) {
        return `${redacted.slice(0, 600)}...[TRIMMED]`;
      }
      return redacted;
    }
    if (typeof node !== "object") return node;
    if (seen.has(node)) return "[Circular]";
    seen.add(node);
    if (Array.isArray(node)) {
      return node.map((item) => walk(item));
    }
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      const safeKey = String(key || "");
      if (/api[_-]?key|token|secret|webhook|passphrase|password/i.test(safeKey)) {
        out[safeKey] = "[REDACTED]";
      } else {
        out[safeKey] = walk(value);
      }
    }
    return out;
  };
  return walk(value);
}

function readJsonIfExists(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function resolveOutputPath(explicit) {
  if (explicit) return path.resolve(explicit);
  return path.resolve(process.cwd(), "release", `support_bundle_${Date.now()}.zip`);
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeBundleFiles(tempDir, includeUserText) {
  const packageJson = readJsonIfExists(path.resolve(process.cwd(), "package.json"), {});
  const report = readJsonIfExists(path.resolve(process.cwd(), "release", "ui-self-sell-proof-report-packaged.json"), {});
  const parity = readJsonIfExists(path.resolve(process.cwd(), "release", "ui-self-sell-proof-parity.json"), {});
  const llmSweep = readJsonIfExists(path.resolve(process.cwd(), "release", "llm-sweep-report.json"), {});
  const analytics = readJsonIfExists(path.resolve(process.cwd(), "release", "proof-bundle-summary.json"), {});

  const base = {
    generatedAt: new Date().toISOString(),
    appVersion: String(packageJson.version || "unknown"),
    os: `${os.platform()}-${os.release()}`,
    includeUserText: Boolean(includeUserText),
    diagnostics: {
      proofReport: sanitizeJson(report, includeUserText),
      parityReport: sanitizeJson(parity, includeUserText),
      llmSweep: sanitizeJson(llmSweep, includeUserText),
      proofBundleSummary: sanitizeJson(analytics, includeUserText)
    }
  };

  const diagnosticsPath = path.join(tempDir, "support_diagnostics.json");
  fs.writeFileSync(diagnosticsPath, `${JSON.stringify(base, null, 2)}\n`, "utf8");

  const summaryPath = path.join(tempDir, "README.txt");
  const summary = [
    "NeuralShell Support Bundle",
    `Generated: ${base.generatedAt}`,
    `Version: ${base.appVersion}`,
    `OS: ${base.os}`,
    "",
    "Sanitization:",
    "- API keys/webhooks/passphrases are redacted.",
    "- User text is trimmed unless --include-user-text is passed.",
    "",
    "Files:",
    "- support_diagnostics.json"
  ].join("\n");
  fs.writeFileSync(summaryPath, `${summary}\n`, "utf8");
}

function createZip(sourceDir, outputPath) {
  const isWin = process.platform === "win32";
  if (isWin) {
    const safeSource = sourceDir.replace(/'/g, "''");
    const safeOutput = outputPath.replace(/'/g, "''");
    const script = [
      `if (Test-Path -LiteralPath '${safeOutput}') { Remove-Item -LiteralPath '${safeOutput}' -Force }`,
      `Compress-Archive -Path '${safeSource}\\*' -DestinationPath '${safeOutput}' -CompressionLevel Optimal -Force`
    ].join("; ");
    const result = spawnSync("powershell", [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy", "Bypass",
      "-Command", script
    ], { encoding: "utf8" });
    if (result.status === 0 && fs.existsSync(outputPath)) return true;
    return false;
  }

  const result = spawnSync("zip", ["-qr", outputPath, "."], {
    cwd: sourceDir,
    encoding: "utf8"
  });
  return result.status === 0 && fs.existsSync(outputPath);
}

function exportSupportBundle(options = {}) {
  const args = {
    output: options && options.output ? String(options.output) : "",
    includeUserText: Boolean(options && options.includeUserText)
  };
  const outputPath = resolveOutputPath(args.output);
  ensureDir(outputPath);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-support-"));
  try {
    writeBundleFiles(tempDir, args.includeUserText);
    const zipped = createZip(tempDir, outputPath);
    if (!zipped) {
      throw new Error("Unable to create ZIP support bundle.");
    }
    const digest = sha256File(outputPath);
    fs.writeFileSync(`${outputPath}.sha256.txt`, `${digest}  ${path.basename(outputPath)}\n`, "utf8");
    return {
      ok: true,
      outputPath,
      sha256: digest
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function main() {
  const args = parseArgs(process.argv);
  const result = exportSupportBundle(args);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

module.exports = {
  exportSupportBundle
};

if (require.main === module) {
  main();
}
