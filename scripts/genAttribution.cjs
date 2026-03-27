const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const LOCK_PATH = path.join(ROOT, "package-lock.json");
const OUT_PATH = path.join(ROOT, "public", "about.html");

function hashText(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function collectDependencies() {
  const lock = readJson(LOCK_PATH, {});
  const packages = lock && typeof lock === "object" && lock.packages && typeof lock.packages === "object"
    ? lock.packages
    : {};
  const out = [];

  for (const [pkgPath, meta] of Object.entries(packages)) {
    if (!String(pkgPath || "").startsWith("node_modules/")) continue;
    const packageName = String(meta && meta.name ? meta.name : "").trim()
      || String(pkgPath).replace(/^node_modules\//, "");
    const packageVersion = String(meta && meta.version ? meta.version : "").trim();
    const integrity = String(meta && meta.integrity ? meta.integrity : "").trim();
    const packageJsonPath = path.join(ROOT, pkgPath, "package.json");
    const packageJson = readJson(packageJsonPath, {});
    const license = String(packageJson && packageJson.license ? packageJson.license : "UNKNOWN");
    const hashSource = integrity || JSON.stringify(packageJson);
    out.push({
      name: packageName,
      version: packageVersion,
      license,
      hash: hashText(hashSource),
    });
  }

  out.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  return out;
}

function renderHtml(rows) {
  const bodyRows = rows.map((row) => (
    `<tr><td>${row.name}</td><td>${row.version}</td><td>${row.license}</td><td><code>${row.hash.slice(0, 16)}...</code></td></tr>`
  )).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>NeuralShell Attribution</title>
  <style>
    body { font-family: ui-sans-serif, system-ui; background:#020617; color:#e2e8f0; margin:0; padding:24px; }
    h1 { margin:0 0 8px; font-size:24px; }
    p { margin:0 0 18px; color:#94a3b8; }
    table { width:100%; border-collapse:collapse; background:#0f172a; border:1px solid #1e293b; border-radius:12px; overflow:hidden; }
    th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #1e293b; font-size:13px; }
    th { background:#111827; color:#67e8f9; text-transform:uppercase; letter-spacing:.08em; font-size:11px; }
    tr:last-child td { border-bottom:none; }
    code { color:#67e8f9; }
  </style>
</head>
<body>
  <h1>Third-Party Attribution</h1>
  <p>Generated ${new Date().toISOString()} from package lock metadata.</p>
  <table>
    <thead>
      <tr><th>Library</th><th>Version</th><th>License</th><th>Hash</th></tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>
</body>
</html>
`;
}

function main() {
  const rows = collectDependencies();
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, renderHtml(rows), "utf8");
  const result = {
    ok: true,
    output: path.relative(ROOT, OUT_PATH).replace(/\\/g, "/"),
    count: rows.length
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};

