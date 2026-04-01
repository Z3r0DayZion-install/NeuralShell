const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const FRAMEWORK_PATH = path.join(__dirname, "framework.json");
const REPORT_PATH = path.join(ROOT, "SOC2_PREP_REPORT.md");
const BADGE_PATH = path.join(ROOT, "badges", "soc2_prep.svg");

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function loadFramework() {
  const parsed = JSON.parse(fs.readFileSync(FRAMEWORK_PATH, "utf8"));
  const controls = Array.isArray(parsed.controls) ? parsed.controls : [];
  return {
    framework: String(parsed.framework || "SOC2-Prep"),
    controls
  };
}

function evaluateControl(control) {
  const required = Array.isArray(control.requiredFiles) ? control.requiredFiles : [];
  const rows = required.map((entry) => {
    const absolutePath = path.resolve(ROOT, String(entry || ""));
    const exists = fs.existsSync(absolutePath);
    return {
      path: rel(absolutePath),
      exists,
      sha256: exists ? sha256File(absolutePath) : ""
    };
  });
  return {
    id: String(control.id || ""),
    title: String(control.title || ""),
    files: rows,
    pass: rows.length > 0 && rows.every((row) => row.exists)
  };
}

function buildBadgeSvg(label, value, color) {
  const left = 74;
  const right = Math.max(78, value.length * 7 + 18);
  const width = left + right;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="20" role="img" aria-label="${label}: ${value}">`,
    `  <rect rx="3" width="${left}" height="20" fill="#2f2f2f"/>`,
    `  <rect rx="3" x="${left}" width="${right}" height="20" fill="${color}"/>`,
    `  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">`,
    `    <text x="${Math.floor(left / 2)}" y="14">${label}</text>`,
    `    <text x="${left + Math.floor(right / 2)}" y="14">${value}</text>`,
    "  </g>",
    "</svg>"
  ].join("\n");
}

function writeReport(summary) {
  const lines = [];
  lines.push("# SOC2 Prep Report");
  lines.push("");
  lines.push(`- Framework: **${summary.framework}**`);
  lines.push(`- Generated: **${summary.generatedAt}**`);
  lines.push(`- Controls Passing: **${summary.passedControls}/${summary.totalControls}**`);
  lines.push(`- Result: **${summary.ok ? "PASS" : "FAIL"}**`);
  lines.push("");

  for (const control of summary.controls) {
    lines.push(`## ${control.id} - ${control.title}`);
    lines.push(`Status: **${control.pass ? "PASS" : "FAIL"}**`);
    lines.push("");
    lines.push("| File | Exists | SHA-256 |");
    lines.push("|---|---|---|");
    for (const file of control.files) {
      lines.push(`| \`${file.path}\` | ${file.exists ? "yes" : "no"} | ${file.sha256 || "-"} |`);
    }
    lines.push("");
  }

  fs.writeFileSync(REPORT_PATH, `${lines.join("\n")}\n`, "utf8");
}

function writeBadge(summary) {
  const value = summary.ok ? "ready" : "gaps";
  const color = summary.ok ? "#1e9b47" : "#dc2626";
  const svg = buildBadgeSvg("soc2 prep", value, color);
  fs.mkdirSync(path.dirname(BADGE_PATH), { recursive: true });
  fs.writeFileSync(BADGE_PATH, `${svg}\n`, "utf8");
}

function main() {
  const framework = loadFramework();
  const controls = framework.controls.map(evaluateControl);
  const passedControls = controls.filter((item) => item.pass).length;
  const summary = {
    framework: framework.framework,
    generatedAt: new Date().toISOString(),
    totalControls: controls.length,
    passedControls,
    ok: controls.length > 0 && passedControls === controls.length,
    controls
  };

  writeReport(summary);
  writeBadge(summary);
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  if (!summary.ok) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};

