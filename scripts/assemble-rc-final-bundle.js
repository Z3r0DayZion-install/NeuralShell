/**
 * Phase 16: Archival Freeze Helper
 * Assembles the normative release bundle for external verification.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUNDLE_DIR = path.join(REPO_ROOT, "release", "final");

const REQUIRED_ARTIFACTS = [
    // Normative Manifests & Ledgers
    { src: "V2.0_RC_FINAL_MANIFEST.md", dest: "V2.0_RC_FINAL_MANIFEST.md" },
    { src: "SOVEREIGN_AUDIT_LOG.txt", dest: "SOVEREIGN_AUDIT_LOG.txt" },
    { src: "docs/OMEGA_RELEASE_LEDGER.md", dest: "OMEGA_RELEASE_LEDGER.md" },
    { src: "docs/rc/GA_PROMOTION_GATES.md", dest: "GA_PROMOTION_GATES.md" },

    // Build Artifacts (from latest pipeline)
    { src: "dist/NeuralShell Setup 2.1.29.exe", dest: "bin/NeuralShell Setup 2.1.29.exe", optional: true },
    { src: "release/manifest.json", dest: "provenance/sbom.json", optional: true },
    { src: "release/manifest.sig", dest: "provenance/sbom.json.sig", optional: true },
    { src: "release/manifest.pub", dest: "provenance/public_key.pem", optional: true },
    { src: "release/provenance.json", dest: "provenance/slsa_provenance.json", optional: true },

    // Verification Tooling
    { src: "scripts/release-verify.js", dest: "bin/release-verify.js", optional: false }
];

function log(msg) {
    console.log(`[ARCHIVE] ${msg}`);
}

function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

function assembleBundle() {
    log("Starting V2.0 RC Final Bundle Assembly...");

    if (fs.existsSync(BUNDLE_DIR)) {
        log(`Cleaning existing bundle directory at ${BUNDLE_DIR}`);
        fs.rmSync(BUNDLE_DIR, { recursive: true, force: true });
    }

    ensureDir(BUNDLE_DIR);
    ensureDir(path.join(BUNDLE_DIR, "bin"));
    ensureDir(path.join(BUNDLE_DIR, "provenance"));

    let missingCritical = false;

    for (const item of REQUIRED_ARTIFACTS) {
        const srcPath = path.join(REPO_ROOT, item.src);
        const destPath = path.join(BUNDLE_DIR, item.dest);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            log(`Copied: ${item.src} -> ${item.dest}`);
        } else {
            if (item.optional) {
                log(`Skipped (Optional missing): ${item.src}`);
            } else {
                log(`ERROR: Missing critical artifact: ${item.src}`);
                missingCritical = true;
            }
        }
    }

    if (missingCritical) {
        log("Assembly failed due to missing critical artifacts.");
        process.exit(1);
    }

    // Generate RELEASE_VERIFICATION.md inside the bundle
    const verifyDocPath = path.join(BUNDLE_DIR, "RELEASE_VERIFICATION.md");
    const verifyContent = `# NeuralShell V2.0 RC Final: Downstream Verification Guide

This bundle contains the normative release artifacts for the NeuralShell V2.0 RC Final baseline.

## Verification Steps

**1. Architectural Audit Verification**
The \`SOVEREIGN_AUDIT_LOG.txt\` provides the exact, timestamped verification trace of the 15-phase source code audit. 
To independently verify the source integrity (requires full source tree):
\`\`\`bash
node scripts/sovereign-audit.js
\`\`\`

**2. Artifact & Provenance Verification**
If the compiled binaries are present in \`bin/\`, they are linked to the Software Bill of Materials (\`provenance/sbom.json\`).
To verify the SLSA provenance and artifact hashes matching the ledger:
\`\`\`bash
node bin/release-verify.js "v2.1-gold-master"
\`\`\`
*(Note: requires adjustment based on the target release profile parameter).*

## Status
- **Current Classification**: RC_FINAL_ARCHIVED_READY
- **Next Promotion Gate**: GA_PROMOTION_READY
- **Blockers**: See \`GA_PROMOTION_GATES.md\`
`;

    fs.writeFileSync(verifyDocPath, verifyContent.trim() + "\n");
    log("Generated RELEASE_VERIFICATION.md");

    log("==========================================================");
    log(`Bundle assembled successfully at: release/final/`);
    log("Classification: RC_FINAL_ARCHIVED_READY");
    log("==========================================================");
}

assembleBundle();
