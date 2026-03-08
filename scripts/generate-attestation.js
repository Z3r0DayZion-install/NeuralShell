const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const statusPath = path.join(releaseDir, "status.json");
const checksumsPath = path.join(releaseDir, "checksums.txt");
const manifestPath = path.join(releaseDir, "manifest.json");
const outputPath = path.join(releaseDir, "attestation.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function sha256(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function main() {
  assert(fs.existsSync(statusPath), `Missing release status: ${statusPath}`);
  assert(fs.existsSync(checksumsPath), `Missing checksums file: ${checksumsPath}`);
  assert(fs.existsSync(manifestPath), `Missing manifest file: ${manifestPath}`);

  const status = JSON.parse(fs.readFileSync(statusPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const checksumsRaw = fs.readFileSync(checksumsPath, "utf8");

  const attestation = {
    generatedAt: new Date().toISOString(),
    version: manifest.version || null,
    manifest: {
      fileCount: manifest.fileCount || 0,
      generatedAt: manifest.generatedAt || null
    },
    provenance: status.provenance || null,
    checksums: {
      lineCount: checksumsRaw.split(/\r?\n/).filter(Boolean).length,
      sha256: sha256(checksumsRaw)
    }
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(attestation, null, 2));
  console.log(`Release attestation written: ${outputPath}`);
}

main();
