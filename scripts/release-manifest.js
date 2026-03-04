const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const defaultRoot = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeRelPath(baseDir, filePath) {
  return path.relative(baseDir, filePath).split(path.sep).join("/");
}

function compareStrings(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function walkFiles(dirPath) {
  const out = [];
  if (!fs.existsSync(dirPath)) {
    return out;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  entries.sort((a, b) => compareStrings(a.name, b.name));

  for (const entry of entries) {
    const absPath = path.join(dirPath, entry.name);
    if (entry.isSymbolicLink()) {
      continue;
    }
    if (entry.isDirectory()) {
      out.push(...walkFiles(absPath));
      continue;
    }
    if (entry.isFile()) {
      out.push(absPath);
    }
  }

  return out;
}

function includeFile(relPath) {
  return !relPath.endsWith(".log");
}

async function sha256File(filePath) {
  const hash = crypto.createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", resolve);
    stream.on("error", reject);
  });
  return hash.digest("hex");
}

function parseArg(name) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((arg) => String(arg || "").startsWith(prefix));
  if (!raw) {
    return null;
  }
  return String(raw).slice(prefix.length).trim();
}

function resolveInputPath(candidate, fallback) {
  if (!candidate) return fallback;
  if (path.isAbsolute(candidate)) return candidate;
  return path.join(defaultRoot, candidate);
}

function inferVersion(manifestEntries, packageVersion) {
  const installerVersions = [];
  for (const entry of manifestEntries) {
    const match = /^dist\/NeuralShell Setup (.+)\.exe$/i.exec(entry.path);
    if (match && match[1]) {
      installerVersions.push(String(match[1]));
    }
  }
  if (installerVersions.length > 0) {
    installerVersions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
    return installerVersions[installerVersions.length - 1];
  }
  return packageVersion;
}

async function generateManifest(options = {}) {
  const rootDir = options.rootDir || defaultRoot;
  const distDir = options.distDir || path.join(rootDir, "dist");
  const outFile = options.outFile || path.join(rootDir, "release", "manifest.json");
  const now = typeof options.now === "function" ? options.now : () => new Date().toISOString();

  assert(fs.existsSync(distDir), `Missing dist directory: ${distDir}`);
  assert(fs.statSync(distDir).isDirectory(), `Dist path is not a directory: ${distDir}`);

  const files = walkFiles(distDir);
  const relFiles = files
    .map((absPath) => normalizeRelPath(rootDir, absPath))
    .filter((relPath) => includeFile(relPath))
    .sort(compareStrings);

  const entries = [];
  for (const relPath of relFiles) {
    const absPath = path.join(rootDir, relPath);
    const stat = fs.statSync(absPath);
    const sha256 = await sha256File(absPath);
    entries.push({
      path: relPath,
      bytes: stat.size,
      sha256
    });
  }

  const pkgPath = path.join(rootDir, "package.json");
  const pkgVersion = fs.existsSync(pkgPath)
    ? String(JSON.parse(fs.readFileSync(pkgPath, "utf8")).version || "unknown")
    : "unknown";

  const manifest = {
    generatedAt: now(),
    version: inferVersion(entries, pkgVersion),
    fileCount: entries.length,
    files: entries
  };

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return { manifest, outFile };
}

async function main() {
  const distArg = parseArg("dist-dir");
  const outArg = parseArg("out-file");
  const distDir = resolveInputPath(distArg, path.join(defaultRoot, "dist"));
  const outFile = resolveInputPath(outArg, path.join(defaultRoot, "release", "manifest.json"));

  const { manifest } = await generateManifest({ distDir, outFile });
  console.log(`Release manifest written: ${outFile}`);
  console.log(`Entries: ${manifest.fileCount}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
}

module.exports = {
  generateManifest,
  walkFiles,
  inferVersion
};
