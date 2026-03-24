/**
 * Phase 18: External Auditor Handoff Pack Assembler
 * 
 * Extracts the normative release artifacts, audit definitions, and 
 * verification harnesses into a clean-room directory for third-party review.
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const AUDIT_DIR = path.join(ROOT_DIR, "release", "audit");

const FILES_TO_BUNDLE = [
    { src: "V2.0_RC_FINAL_MANIFEST.md", dest: "V2.0_RC_FINAL_MANIFEST.md" },
    { src: "SOVEREIGN_AUDIT_LOG.txt", dest: "SOVEREIGN_AUDIT_LOG.txt" },
    { src: "docs/OMEGA_RELEASE_LEDGER.md", dest: "OMEGA_RELEASE_LEDGER.md" },
    { src: "docs/rc/GA_PROMOTION_GATES.md", dest: "GA_PROMOTION_GATES.md" },
    { src: "docs/rc/OMEGA_PERSISTENCE_AUDIT_SPEC.md", dest: "OMEGA_PERSISTENCE_AUDIT_SPEC.md" },
    { src: "docs/rc/EXTERNAL_AUDITOR_BRIEF.md", dest: "EXTERNAL_AUDITOR_BRIEF.md" },
    { src: "docs/rc/EXTERNAL_AUDIT_FINDINGS_TEMPLATE.md", dest: "EXTERNAL_AUDIT_FINDINGS_TEMPLATE.md" },
    { src: "scripts/sovereign-audit.js", dest: "bin/sovereign-audit.js" },
    { src: "scripts/run-persistence-audit-pack.js", dest: "bin/run-persistence-audit-pack.js" },
    { src: "scripts/generate-persistence-fixtures.js", dest: "bin/generate-persistence-fixtures.js" },
    { src: "release/final/RELEASE_VERIFICATION.md", dest: "RELEASE_VERIFICATION.md", optional: true },
    { src: "release/final/bin/release-verify.js", dest: "bin/release-verify.js", optional: true }
];

function log(msg) {
    console.log(`[AUDIT-PACK] ${msg}`);
}

function assemble() {
    log("Starting External Auditor Handoff Assembly...");

    if (fs.existsSync(AUDIT_DIR)) {
        log(`Cleaning existing directory at ${AUDIT_DIR}`);
        fs.rmSync(AUDIT_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(AUDIT_DIR, { recursive: true });
    fs.mkdirSync(path.join(AUDIT_DIR, "bin"), { recursive: true });

    let missing = 0;

    FILES_TO_BUNDLE.forEach(file => {
        const srcPath = path.join(ROOT_DIR, file.src);
        const destPath = path.join(AUDIT_DIR, file.dest);

        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            log(`Copied: ${file.src} -> ${file.dest}`);
        } else {
            if (file.optional) {
                log(`Skipped (optional): ${file.src}`);
            } else {
                log(`ERROR: Missing required artifact ${file.src}`);
                missing++;
            }
        }
    });

    if (missing > 0) {
        log(`Failed: ${missing} required files are missing.`);
        process.exit(1);
    }

    generateQuickstart();

    log("============================================================");
    log(`Auditor Handoff Pack assembled successfully at: release/audit/`);
    log(`Classification: EXTERNAL_AUDIT_HANDOFF_READY`);
    log("============================================================");
}

function generateQuickstart() {
    const quickstartContent = `# NeuralShell External Auditor Quickstart Guide

**Target Scope:** NeuralShell V2.0.0-RC-FINAL (Stage 515)
**Classification:** \`EXTERNAL_AUDIT_HANDOFF_READY\`

Welcome to the NeuralShell External Audit sandbox.
This document contains the exact commands and objective parameters necessary to verify the cryptographic trust chain, persistence layer resilience, and exact development history of the NeuralShell system.

## 1. What This Release Is
NeuralShell V2.0.0-RC-FINAL is a fully integrated, sovereign AI operating surface. The \`V2.0_RC_FINAL_MANIFEST.md\` formally declares the structural rules of this release. The \`OMEGA_RELEASE_LEDGER.md\` provides the historical SHA-256 lineage back to the founding repository commit.

## 2. What Is Already Proven
- **Sovereign Execution Flow:** The system passes a mathematically verified 15-phase audit trail establishing correct sandbox behavior, IPC limitations, and security permissions.
- **Fail-Closed Persistence:** The storage layer isolated corrupted/tampered envelopes and successfully recovers without propagating polluted data.

## 3. What Remains Blocked
- **Windows EV Code Signing:** A physical EV Code Signing Token requirement is currently halting final OS-level trust validation. The software installer remains unsigned. This is a known, acknowledged external blocker.

## 4. Auditor Rehearsal Commands (Clean-Room Execution)

To reproduce the verified findings independently, execute the following tools natively inside the repository source tree (or via the \`bin/\` copies provided in this handoff bundle run contextually against the source):

### Trace the Sovereign Matrix (15-Phase Verification)
\`\`\`bash
# Executes the root integrity and behavioral matrix
node scripts/sovereign-audit.js
\`\`\`
*Expected Output:* \`SOVEREIGN AUDIT RESULT: PASSED\`

### Execute the Persistence Forensic Pack
\`\`\`bash
# Generates tampered AES-GCM envelopes and asserts quarantine mechanics
node scripts/run-persistence-audit-pack.js
\`\`\`
*Expected Output:* \`AUDIT RESULT: EXTERNAL_AUDIT_READY (0 failures detected)\`

## 5. Auditor Challenge Pack (Negative Proofs)
To verify that the NeuralShell harness is not fabricating positive outcomes, auditors are encouraged to execute the following negative proofs:

- **Challenge A (Persistence Tampering):** 
  Edit \`tests/fixtures/persistence/corrupted_envelope.omega\` manually to simulate bit-rot or tampering. Then run \`node scripts/run-persistence-audit-pack.js\`. The system will seamlessly quarantine the invalid envelope and emit a \`Quarantine Backup Generation\` pass. (To reset the fixtures later, run with \`FORCE_FIXTURE_GEN=1\`).
  
- **Challenge B (Release Trust Drift):**
  Modify any character inside \`V2.0_RC_FINAL_MANIFEST.md\` or the release installer hash, then run \`node scripts/release-verify.js\`. The verification will fatally abort due to cryptographic drift, proving the release seal is active.

- **Challenge C (Signature Blocking):**
  Attempt to launch the packaged installer (\`dist/NeuralShell Setup 2.1.29.exe\`). Windows SmartScreen will correctly halt execution (Unknown Publisher), proving NeuralShell refuses to spoof "trusted-GA" without the EV certificate.
`;

    fs.writeFileSync(path.join(AUDIT_DIR, "AUDITOR_QUICKSTART.md"), quickstartContent);
    log("Generated AUDITOR_QUICKSTART.md");
}

assemble();
