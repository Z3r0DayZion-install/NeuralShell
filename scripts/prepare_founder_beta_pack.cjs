const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version = String(pkg.version || "0.0.0");
const betaRoot = path.join(ROOT, "beta", `founder-beta-v${version}`);

const installerSource = path.join(ROOT, "dist", `NeuralShell Setup ${version}.exe`);
const screenshotSources = [
  path.join(ROOT, "screenshots", "ui_sales_quickstart_packaged.png"),
  path.join(ROOT, "screenshots", "ui_sales_proof_output_packaged.png"),
  path.join(ROOT, "screenshots", "ui_sales_roi_output_packaged.png"),
  path.join(ROOT, "screenshots", "ui_sales_lock_flow_packaged.png"),
  path.join(ROOT, "screenshots", "ui_sales_unlock_restored_packaged.png"),
];
const proofSources = [
  path.join(ROOT, "release", "ui-self-sell-proof-report-packaged.json"),
  path.join(ROOT, "release", "ui-self-sell-proof-parity.json"),
];
const requiredDocNames = [
  "FOUNDER_BETA_QUICKSTART.md",
  "FOUNDER_BETA_KNOWN_LIMITATIONS.md",
  "FOUNDER_BETA_FEEDBACK.md",
  "FOUNDER_BETA_PROOF_SUMMARY.md",
];

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(data).digest("hex");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyInto(sourcePath, targetDir) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Missing required source artifact: ${sourcePath}`);
  }
  ensureDir(targetDir);
  const targetPath = path.join(targetDir, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, targetPath);
  return targetPath;
}

function rel(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, "/");
}

function run() {
  const installerDir = path.join(betaRoot, "installer");
  const screenshotsDir = path.join(betaRoot, "screenshots");
  const proofDir = path.join(betaRoot, "proof");
  const docsDir = path.join(betaRoot, "docs");
  const packageReadme = path.join(betaRoot, "README.md");

  const copied = [];
  copied.push(copyInto(installerSource, installerDir));
  for (const source of screenshotSources) {
    copied.push(copyInto(source, screenshotsDir));
  }
  for (const source of proofSources) {
    copied.push(copyInto(source, proofDir));
  }

  if (!fs.existsSync(packageReadme)) {
    throw new Error(`Missing beta package README: ${packageReadme}`);
  }

  const docEntries = fs.existsSync(docsDir)
    ? fs.readdirSync(docsDir, { withFileTypes: true })
    : [];
  const extraDocs = docEntries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .filter((name) => !requiredDocNames.includes(name));
  if (extraDocs.length) {
    throw new Error(
      `Beta docs contain non-essential files: ${extraDocs.join(", ")}. Keep founder beta docs lean.`
    );
  }

  const requiredDocs = requiredDocNames.map((name) => path.join(docsDir, name));
  for (const docPath of requiredDocs) {
    if (!fs.existsSync(docPath)) {
      throw new Error(`Missing required beta doc: ${docPath}`);
    }
  }

  const manifestFiles = [...copied, packageReadme, ...requiredDocs];

  const manifest = {
    generatedAt: new Date().toISOString(),
    version,
    betaRoot: rel(betaRoot),
    files: manifestFiles.map((filePath) => {
      const stat = fs.statSync(filePath);
      return {
        path: rel(filePath),
        sizeBytes: stat.size,
        sha256: sha256File(filePath),
      };
    }),
  };

  const manifestPath = path.join(betaRoot, "BETA_PACKAGE_MANIFEST.json");
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        ok: true,
        betaRoot,
        manifestPath,
        fileCount: manifest.files.length,
      },
      null,
      2
    )
  );
}

run();
