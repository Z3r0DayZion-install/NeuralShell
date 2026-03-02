const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const lockFile = path.join(root, "package-lock.json");
const outDir = path.join(root, "release");
const outFile = path.join(outDir, "sbom.json");

function hash(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function walkPackages(node, acc, prefix = "") {
  if (!node || typeof node !== "object") return;
  const deps = node.packages || {};
  Object.entries(deps).forEach(([pkgPath, meta]) => {
    if (!meta || !meta.name || !meta.version) return;
    const purl = `pkg:npm/${encodeURIComponent(meta.name)}@${encodeURIComponent(meta.version)}`;
    acc.push({
      name: meta.name,
      version: meta.version,
      path: pkgPath || "",
      license: meta.license || "",
      integrity: meta.integrity || "",
      purl
    });
  });
}

function main() {
  if (!fs.existsSync(lockFile)) {
    throw new Error(`Missing lock file: ${lockFile}`);
  }
  const raw = fs.readFileSync(lockFile, "utf8");
  const parsed = JSON.parse(raw);
  const components = [];
  walkPackages(parsed, components);
  components.sort((a, b) => `${a.name}@${a.version}`.localeCompare(`${b.name}@${b.version}`));

  const sbom = {
    generatedAt: new Date().toISOString(),
    format: "CycloneDX-like-minimal",
    metadata: {
      app: require(path.join(root, "package.json")).name,
      version: require(path.join(root, "package.json")).version
    },
    componentCount: components.length,
    hash: hash(raw),
    components
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(sbom, null, 2)}\n`, "utf8");
  console.log(`SBOM generated: ${outFile} (${components.length} components)`);
}

main();
