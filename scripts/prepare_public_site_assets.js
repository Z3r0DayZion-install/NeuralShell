const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const docsAssetsDir = path.join(repoRoot, "docs", "site-assets");
const screenshotDir = path.join(docsAssetsDir, "screenshots");
const sourceDir = path.join(
  repoRoot,
  "release",
  "store-assets",
  "microsoft-store",
  "v1.2.1-OMEGA"
);

const assetCopies = [
  {
    source: path.join(repoRoot, "assets", "icon-512.png"),
    target: path.join(docsAssetsDir, "icon-512.png"),
    label: "icon"
  },
  {
    source: path.join(sourceDir, "02-main-workspace.png"),
    target: path.join(screenshotDir, "main-workspace.png"),
    label: "main_workspace"
  },
  {
    source: path.join(sourceDir, "03-session-management.png"),
    target: path.join(screenshotDir, "session-management.png"),
    label: "session_management"
  },
  {
    source: path.join(sourceDir, "04-settings-and-profiles.png"),
    target: path.join(screenshotDir, "settings-and-profiles.png"),
    label: "settings_and_profiles"
  },
  {
    source: path.join(sourceDir, "05-runtime-and-integrity.png"),
    target: path.join(screenshotDir, "runtime-and-integrity.png"),
    label: "runtime_and_integrity"
  },
  {
    source: path.join(sourceDir, "06-command-palette.png"),
    target: path.join(screenshotDir, "command-palette.png"),
    label: "command_palette"
  }
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyAsset(entry) {
  if (!fs.existsSync(entry.source)) {
    throw new Error(`Missing source asset: ${path.relative(repoRoot, entry.source)}`);
  }
  ensureDir(path.dirname(entry.target));
  fs.copyFileSync(entry.source, entry.target);
  const stat = fs.statSync(entry.target);
  return {
    label: entry.label,
    source: path.relative(repoRoot, entry.source).replace(/\\/g, "/"),
    target: path.relative(repoRoot, entry.target).replace(/\\/g, "/"),
    bytes: stat.size
  };
}

function writeManifest(entries) {
  const payload = {
    generatedAt: new Date().toISOString(),
    files: entries
  };
  fs.writeFileSync(
    path.join(docsAssetsDir, "asset-manifest.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8"
  );
  return payload;
}

function main() {
  ensureDir(docsAssetsDir);
  ensureDir(screenshotDir);
  const copied = assetCopies.map(copyAsset);
  const manifest = writeManifest(copied);
  console.log(JSON.stringify({ ok: true, files: manifest.files }, null, 2));
}

main();
