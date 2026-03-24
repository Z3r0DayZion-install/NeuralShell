const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Phase 5 Tamper-Proof Testing Suite - v5.1.0
 * Proves that tampered artifacts fail verification.
 */

const ROOT = path.join(__dirname, '../');
const VERIFY_SCRIPT = path.join(ROOT, 'scripts', 'verify-release-bundle.js');
const TEMP_RELEASE = path.join(ROOT, 'tmp', 'tamper-test-release');

function copyRecursiveSync(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(function (childItemName) {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
}

function setupTestEnv() {
    if (fs.existsSync(TEMP_RELEASE)) fs.rmSync(TEMP_RELEASE, { recursive: true });
    fs.mkdirSync(TEMP_RELEASE, { recursive: true });

    // Copy all relevant directories to simulate a full release bundle
    console.log("[TEST] Seeding mock release environment...");
    copyRecursiveSync(path.join(ROOT, 'dist'), path.join(TEMP_RELEASE, 'dist'));
    copyRecursiveSync(path.join(ROOT, 'release'), path.join(TEMP_RELEASE, 'release'));
    copyRecursiveSync(path.join(ROOT, 'artifacts'), path.join(TEMP_RELEASE, 'artifacts'));
}

function runVerify() {
    try {
        execSync(`node "${VERIFY_SCRIPT}" "${TEMP_RELEASE}"`, { stdio: 'pipe' });
        return true;
    } catch (err) {
        // console.error(err.stdout.toString());
        return false;
    }
}

async function main() {
    console.log("--- PHASE 5 TAMPER-PROOF TEST SUITE ---");

    // 1. Baseline PASS
    setupTestEnv();
    const baseline = runVerify();
    console.log("[TEST] Baseline Verification (Clean): " + (baseline ? "PASS" : "FAIL"));
    if (!baseline) {
        console.error("[TEST] CRITICAL: Baseline failed. Check script paths.");
    }

    // 2. Scenario 1: Tampered Artifact
    setupTestEnv();
    const exe = fs.readdirSync(path.join(TEMP_RELEASE, 'dist')).find(f => f.endsWith('.exe'));
    fs.appendFileSync(path.join(TEMP_RELEASE, 'dist', exe), "TAMPERED");
    console.log("[TEST] Scenario 1 (Tampered Artifact): " + (runVerify() ? "FAILED (Stayed Green)" : "PASS (Caught Tampering)"));

    // 3. Scenario 2: Missing Signature
    setupTestEnv();
    fs.unlinkSync(path.join(TEMP_RELEASE, 'release', 'manifest.sig'));
    console.log("[TEST] Scenario 2 (Missing Signature): " + (runVerify() ? "FAILED (Stayed Green)" : "PASS (Caught Missing Signature)"));

    // 4. Scenario 3: Tampered Manifest
    setupTestEnv();
    let manifest = JSON.parse(fs.readFileSync(path.join(TEMP_RELEASE, 'release', 'manifest.json'), 'utf8'));
    manifest.tampered = true;
    fs.writeFileSync(path.join(TEMP_RELEASE, 'release', 'manifest.json'), JSON.stringify(manifest));
    console.log("[TEST] Scenario 3 (Tampered Manifest): " + (runVerify() ? "FAILED (Stayed Green)" : "PASS (Caught Tampered Manifest)"));

    // 5. Scenario 4: Missing Provenance
    setupTestEnv();
    fs.unlinkSync(path.join(TEMP_RELEASE, 'release', 'provenance.json'));
    console.log("[TEST] Scenario 4 (Missing Provenance): " + (runVerify() ? "FAILED (Stayed Green)" : "PASS (Caught Missing Provenance)"));

    console.log("---------------------------------------");
}

main();
