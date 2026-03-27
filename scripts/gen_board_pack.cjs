#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { writeJson } = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function toSafeSlug(value, fallback = "snapshot") {
  const safe = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}

function toSafeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseCsvLine(line) {
  const cols = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    const next = line[i + 1];
    if (ch === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }
    if (ch === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === "," && !inQuotes) {
      cols.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cols.push(current);
  return cols.map((entry) => String(entry || "").trim());
}

function parseCsv(text) {
  const lines = String(text || "").split(/\r?\n/).filter((line) => String(line).trim().length > 0);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    return row;
  });
}

function normalizeSnapshot(raw = {}) {
  const payload = raw && typeof raw === "object" ? raw : {};
  return {
    month: String(payload.month || payload.date || "").slice(0, 7) || new Date().toISOString().slice(0, 7),
    installs: toSafeNumber(payload.installs, 0),
    activations: toSafeNumber(payload.activations, 0),
    retained30d: toSafeNumber(payload.retained30d || payload.retention, 0),
    revenueUsd: toSafeNumber(payload.revenueUsd || payload.revenue, 0),
    proofRuns: toSafeNumber(payload.proofRuns, 0),
    partnerGrowth: toSafeNumber(payload.partnerGrowth || payload.partnerAdds, 0),
    compliancePosture: String(payload.compliancePosture || payload.compliance || "stable").trim().toLowerCase()
  };
}

function loadSnapshots(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".csv") {
    return parseCsv(raw).map((entry) => normalizeSnapshot(entry));
  }
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    return parsed.map((entry) => normalizeSnapshot(entry));
  }
  if (parsed && typeof parsed === "object") {
    if (Array.isArray(parsed.snapshots)) {
      return parsed.snapshots.map((entry) => normalizeSnapshot(entry));
    }
    return [normalizeSnapshot(parsed)];
  }
  return [];
}

function computeDelta(current, previous, key) {
  return toSafeNumber(current && current[key], 0) - toSafeNumber(previous && previous[key], 0);
}

function buildMarkdown(current, previous, pkgVersion) {
  const installDelta = computeDelta(current, previous, "installs");
  const activationDelta = computeDelta(current, previous, "activations");
  const revenueDelta = computeDelta(current, previous, "revenueUsd");
  const proofDelta = computeDelta(current, previous, "proofRuns");
  const partnerDelta = computeDelta(current, previous, "partnerGrowth");
  return [
    `# NeuralShell Board Pack - ${current.month}`,
    "",
    `Release: v${pkgVersion}`,
    "",
    "## Operating Report",
    `- Installs: ${current.installs.toLocaleString()} (${installDelta >= 0 ? "+" : ""}${installDelta.toLocaleString()} vs previous)`,
    `- Activations: ${current.activations.toLocaleString()} (${activationDelta >= 0 ? "+" : ""}${activationDelta.toLocaleString()} vs previous)`,
    `- Revenue: $${current.revenueUsd.toLocaleString()} (${revenueDelta >= 0 ? "+" : ""}$${revenueDelta.toLocaleString()} vs previous)`,
    `- Proof Runs: ${current.proofRuns.toLocaleString()} (${proofDelta >= 0 ? "+" : ""}${proofDelta.toLocaleString()} vs previous)`,
    `- Partner Growth: ${current.partnerGrowth.toLocaleString()} (${partnerDelta >= 0 ? "+" : ""}${partnerDelta.toLocaleString()} vs previous)`,
    "",
    "## Retention / Compliance",
    `- 30d Retained Accounts: ${current.retained30d.toLocaleString()}`,
    `- Compliance Posture: ${current.compliancePosture}`,
    "",
    "## Board Actions",
    "- Expand high-converting enterprise pilots by vertical.",
    "- Align reseller incentives to proof-backed expansion paths.",
    "- Keep policy enforcement evidence attached to renewal motions."
  ].join("\n");
}

function buildHtml(markdown) {
  const escaped = String(markdown || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return [
    "<!doctype html>",
    "<html>",
    "<head>",
    "<meta charset=\"utf-8\" />",
    "<title>NeuralShell Board Report</title>",
    "<style>",
    "body { font-family: Arial, sans-serif; margin: 32px; color: #0f172a; }",
    "pre { white-space: pre-wrap; font-family: Consolas, monospace; font-size: 12px; line-height: 1.5; }",
    "h1 { margin-top: 0; }",
    "</style>",
    "</head>",
    "<body>",
    "<pre>",
    escaped,
    "</pre>",
    "</body>",
    "</html>"
  ].join("\n");
}

async function renderPdf(html, outputPath) {
  try {
    const playwright = require("playwright");
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "16mm", right: "14mm", bottom: "16mm", left: "14mm" }
    });
    await browser.close();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err && err.message ? err.message : String(err) };
  }
}

function zipDirectoryWindows(folderPath, zipPath) {
  const escapedFolder = String(path.join(folderPath, "*")).replace(/'/g, "''");
  const escapedZip = String(zipPath).replace(/'/g, "''");
  const script = `Compress-Archive -Path '${escapedFolder}' -DestinationPath '${escapedZip}' -Force`;
  const run = spawnSync("powershell.exe", ["-NoProfile", "-Command", script], { encoding: "utf8" });
  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || "Compress-Archive failed.");
  }
}

function zipDirectoryPosix(folderPath, zipPath) {
  const run = spawnSync("zip", ["-r", zipPath, "."], {
    cwd: folderPath,
    encoding: "utf8"
  });
  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || "zip command failed.");
  }
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, String(text || ""), "utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const inputPath = path.resolve(root, String(args.input || "analytics/board/sample_metrics_bundle.json"));
  const previousPath = args.previous ? path.resolve(root, String(args.previous)) : "";
  const outputRoot = path.resolve(root, String(args["output-root"] || "release/board-pack"));
  const packageJsonPath = path.resolve(root, "package.json");

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing metrics input: ${inputPath}`);
  }

  const currentSnapshots = loadSnapshots(inputPath).sort((a, b) => String(a.month).localeCompare(String(b.month)));
  if (!currentSnapshots.length) {
    throw new Error("No snapshots found in input bundle.");
  }
  const current = currentSnapshots[currentSnapshots.length - 1];

  let previous = currentSnapshots.length > 1 ? currentSnapshots[currentSnapshots.length - 2] : null;
  if (previousPath) {
    if (!fs.existsSync(previousPath)) {
      throw new Error(`Missing previous metrics bundle: ${previousPath}`);
    }
    const prevSnapshots = loadSnapshots(previousPath).sort((a, b) => String(a.month).localeCompare(String(b.month)));
    previous = prevSnapshots.length ? prevSnapshots[prevSnapshots.length - 1] : previous;
  }
  if (!previous) {
    previous = {
      month: "baseline",
      installs: 0,
      activations: 0,
      retained30d: 0,
      revenueUsd: 0,
      proofRuns: 0,
      partnerGrowth: 0,
      compliancePosture: "n/a"
    };
  }

  const pkg = fs.existsSync(packageJsonPath)
    ? JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
    : { version: "0.0.0" };
  const version = String(pkg.version || "0.0.0");

  const markdown = buildMarkdown(current, previous, version);
  const html = buildHtml(markdown);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `${toSafeSlug(current.month, "month")}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const markdownPath = path.join(outDir, "board-report.md");
  const htmlPath = path.join(outDir, "board-report.html");
  const pdfPath = path.join(outDir, "board-report.pdf");
  const zipPath = `${outDir}.zip`;

  writeText(markdownPath, `${markdown}\n`);
  writeText(htmlPath, html);
  const pdfResult = await renderPdf(html, pdfPath);
  if (!pdfResult.ok) {
    writeText(path.join(outDir, "board-report.pdf.fallback.txt"), `PDF generation unavailable: ${pdfResult.reason}\n`);
  }

  const delta = {
    installs: computeDelta(current, previous, "installs"),
    activations: computeDelta(current, previous, "activations"),
    retained30d: computeDelta(current, previous, "retained30d"),
    revenueUsd: computeDelta(current, previous, "revenueUsd"),
    proofRuns: computeDelta(current, previous, "proofRuns"),
    partnerGrowth: computeDelta(current, previous, "partnerGrowth")
  };

  writeJson(path.join(outDir, "board-report.json"), {
    generatedAt: new Date().toISOString(),
    version,
    current,
    previous,
    delta,
    markdown
  });
  writeJson(path.join(outDir, "metrics-source.json"), {
    input: path.relative(root, inputPath),
    previous: previousPath ? path.relative(root, previousPath) : ""
  });
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt: new Date().toISOString(),
    outputDir: outDir,
    files: fs.readdirSync(outDir).sort()
  });

  if (process.platform === "win32") {
    zipDirectoryWindows(outDir, zipPath);
  } else {
    zipDirectoryPosix(outDir, zipPath);
  }

  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  });
}
