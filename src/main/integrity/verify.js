const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function sha256File(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(fileBuffer).digest("hex");
  } catch (err) {
    return null;
  }
}

async function verifyIntegrity() {
  const root = path.resolve(__dirname, "../../..");
  const manifestPath = path.join(root, "governance/source_manifest.json");

  if (!fs.existsSync(manifestPath)) {
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      error: "Manifest missing"
    };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const failedFiles = [];

    for (const [file, expectedHash] of Object.entries(manifest.files || {})) {
      const fullPath = path.join(root, file);
      const actualHash = sha256File(fullPath);

      if (actualHash !== expectedHash) {
        failedFiles.push({
          file,
          expected: expectedHash,
          actual: actualHash
        });
      }
    }

    return {
      ok: failedFiles.length === 0,
      checkedAt: new Date().toISOString(),
      failedFiles
    };
  } catch (err) {
    return {
      ok: false,
      checkedAt: new Date().toISOString(),
      error: `Verification failed: ${err.message}`
    };
  }
}

module.exports = {
  verifyIntegrity
};
