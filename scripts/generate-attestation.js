const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "release");
const outFile = path.join(outDir, "attestation.json");
const manifestFile = path.join(outDir, "manifest.json");
const sbomFile = path.join(outDir, "sbom.json");
const statusFile = path.join(outDir, "status.json");

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function digest(filePath) {
  if (!fs.existsSync(filePath)) return "";
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function sign(payload, secret) {
  return crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

function main() {
  const manifest = readJson(manifestFile);
  const sbom = readJson(sbomFile);
  const status = readJson(statusFile);
  const pkg = require(path.join(root, "package.json"));

  const payload = {
    generatedAt: new Date().toISOString(),
    app: pkg.name,
    version: pkg.version,
    artifacts: {
      manifestSha256: digest(manifestFile),
      sbomSha256: digest(sbomFile),
      statusSha256: digest(statusFile)
    },
    gates: {
      manifestPresent: Boolean(manifest),
      sbomPresent: Boolean(sbom),
      statusPresent: Boolean(status),
      benchmarkPercent: status && status.benchmark ? Number(status.benchmark.percent || 0) : 0
    }
  };

  const secret = process.env.NS_ATTEST_SECRET;
  const attestation = {
    ...payload,
    signature: secret ? sign(payload, secret) : "",
    signatureType: secret ? "hmac-sha256" : "unsigned"
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(attestation, null, 2)}\n`, "utf8");
  console.log(`Release attestation generated: ${outFile}`);
}

main();
