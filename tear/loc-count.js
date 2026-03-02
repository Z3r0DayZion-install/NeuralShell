const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const includeRoots = ["src", "tear"];
const exts = new Set([".js", ".html", ".css", ".md", ".json"]);

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
      continue;
    }
    const ext = path.extname(entry.name).toLowerCase();
    if (exts.has(ext)) {
      out.push(full);
    }
  }
}

function countLines(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  if (text.length === 0) return 0;
  return text.split(/\r?\n/).length;
}

function main() {
  const files = [];
  for (const rel of includeRoots) {
    const abs = path.join(root, rel);
    if (fs.existsSync(abs)) {
      walk(abs, files);
    }
  }

  const totalsByExt = {};
  let totalLines = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    const lines = countLines(filePath);
    totalsByExt[ext] = (totalsByExt[ext] || 0) + lines;
    totalLines += lines;
  }

  const sortedExts = Object.keys(totalsByExt).sort();
  console.log(`FILES=${files.length}`);
  console.log(`LINES_TOTAL=${totalLines}`);
  for (const ext of sortedExts) {
    console.log(`LINES_${ext.slice(1).toUpperCase()}=${totalsByExt[ext]}`);
  }
}

main();
