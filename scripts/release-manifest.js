const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");
const outDir = path.join(root, "release");
const outFile = path.join(outDir, "manifest.json");

function sha256(filePath) {
  const hash = crypto.createHash("sha256");
  hash.update(fs.readFileSync(filePath));
  return hash.digest("hex");
}

function walkFiles(dirPath, acc = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
      continue;
    }
    acc.push(full);
  }
  return acc;
}

function toRel(filePath) {
  return path.relative(root, filePath).replace(/\\/g, "/");
}

function main() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Missing dist directory: ${distDir}`);
  }

  fs.mkdirSync(outDir, { recursive: true });

  const files = walkFiles(distDir)
    .filter((filePath) => fs.statSync(filePath).size > 0)
    .sort((a, b) => a.localeCompare(b))
    .map((filePath) => ({
      path: toRel(filePath),
      bytes: fs.statSync(filePath).size,
      sha256: sha256(filePath)
    }));

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: require(path.join(root, "package.json")).version,
    fileCount: files.length,
    files
  };

  fs.writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Wrote ${outFile} with ${files.length} files.`);
}

try {
  main();
} catch (error) {
  console.error(error.message || error);
  process.exit(1);
}
