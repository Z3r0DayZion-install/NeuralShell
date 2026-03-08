const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

/**
 * NeuralShell Source Integrity Verifier
 * Verifies the current worktree against the trusted source manifest.
 */

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "governance/source_manifest.json");

function sha256File(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

function run() {
  console.log("[VERIFIER] Initiating Source Integrity Audit...");
  
  if (!fs.existsSync(manifestPath)) {
    console.error(`[VERIFIER] Error: Manifest not found at ${manifestPath}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  let violations = 0;
  let totalChecked = 0;

  for (const [file, expectedHash] of Object.entries(manifest.files)) {
    const fullPath = path.join(root, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`[VERIFIER] MISSING: ${file}`);
      violations++;
      continue;
    }

    const actualHash = sha256File(fullPath);
    if (actualHash !== expectedHash) {
      console.error(`[VERIFIER] TAMPERED: ${file}`);
      console.error(`  Expected: ${expectedHash}`);
      console.error(`  Actual:   ${actualHash}`);
      violations++;
    }
    totalChecked++;
  }

  if (violations > 0) {
    console.error(`\n[VERIFIER] CRITICAL: ${violations} integrity violations found!`);
    process.exit(1);
  } else {
    console.log(`\n[VERIFIER] SUCCESS: All ${totalChecked} source files verified against manifest.`);
    console.log(`[VERIFIER] Manifest Commit: ${manifest.commit}`);
  }
}

run();
