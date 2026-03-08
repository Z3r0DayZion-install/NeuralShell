const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "release", "manifest.json");
const signaturePath = path.join(root, "release", "manifest.sig");
const publicKeyPath = path.join(root, "release", "manifest.pub");
const outPath = path.join(root, "release", "signature-verification.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function existsNonEmpty(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
}

function main() {
  assert(existsNonEmpty(manifestPath), `Missing manifest: ${manifestPath}`);
  assert(existsNonEmpty(signaturePath), `Missing signature: ${signaturePath}`);
  assert(existsNonEmpty(publicKeyPath), `Missing public key: ${publicKeyPath}`);

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const signature = Buffer.from(fs.readFileSync(signaturePath, "utf8").trim(), "base64");
  const publicKeyPem = fs.readFileSync(publicKeyPath, "utf8");
  const payload = Buffer.from(JSON.stringify(manifest));
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const verified = crypto.verify(null, payload, publicKey, signature);

  const report = {
    generatedAt: new Date().toISOString(),
    manifestPath,
    signaturePath,
    publicKeyPath,
    verified
  };
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (!verified) {
    throw new Error("Release manifest signature verification failed.");
  }

  console.log(`Release signature verification passed. report=${outPath}`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
