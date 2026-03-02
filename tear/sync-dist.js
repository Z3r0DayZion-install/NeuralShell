const fs = require("fs");
const path = require("path");

const root = process.cwd();
const fromDir = path.join(root, "dist_fresh", "win-unpacked");
const toDir = path.join(root, "dist", "win-unpacked");

if (!fs.existsSync(fromDir)) {
  console.error("Missing source directory:", fromDir);
  process.exit(2);
}

fs.cpSync(fromDir, toDir, { recursive: true, force: true });
console.log("Synced:", fromDir, "=>", toDir);

const topLevelFiles = [
  "NeuralShell Setup 5.0.0.exe",
  "NeuralShell Setup 5.0.0.exe.blockmap",
  "latest.yml",
  "builder-debug.yml"
];

for (const rel of topLevelFiles) {
  const src = path.join(root, "dist_fresh", rel);
  const dst = path.join(root, "dist", rel);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    console.log("Copied:", src, "=>", dst);
  }
}
