const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

/**
 * NeuralShell Source Manifest Generator
 * Generates a SHA256 manifest of the current worktree source code.
 */

const root = path.resolve(__dirname, "..");
const manifestRelPath = "governance/source_manifest.json";

function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

function run() {
  console.log("[MANIFEST] Generating Source Manifest...");
  
  // Get tracked files from git to avoid node_modules, etc.
  const files = execSync("git ls-files", { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter(
      (f) =>
        f &&
        f !== manifestRelPath &&
        !f.startsWith("release/") &&
        !f.startsWith("dist/") &&
        !f.endsWith(".zip")
    )
    .sort();

  const manifest = {
    generatedAt: new Date().toISOString(),
    commit: execSync("git rev-parse HEAD", { cwd: root, encoding: "utf8" }).trim(),
    files: {}
  };

  for (const file of files) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      manifest.files[file] = sha256File(fullPath);
    }
  }

  const outPath = path.join(root, "governance/source_manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), "utf8");
  
  console.log(`[MANIFEST] Source manifest written to: ${outPath}`);
  console.log(`[MANIFEST] Total files indexed: ${Object.keys(manifest.files).length}`);
}

run();
