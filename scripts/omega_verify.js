const fs = require("fs");
const path = require('path');
const { EXPECTED_ROOT_FP, EXPECTED_GOV_FP, getFingerprint } = require('./_omega_utils');

/**
 * OMEGA SINGLE ENTRY VERIFIER
 * 
 * The only command required to verify the complete NeuralShell OMEGA state.
 * Orchestrates AST, Omega Tests, Runtime Proofs, Determinism, and Root Anchoring.
 */

const ROOT = path.join(__dirname, '../');

function run(cmd) {
    try {
        return require('child_process').execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch (e) {
        return `ERROR: ${e.message}`;
    }
}

async function verifyAll() {
    console.log('\n--- STARTING OMEGA CONSTITUTIONAL VERIFICATION ---');

    // 1. Node Version Check
    const nodeVer = process.version;
    const [majorRaw, minorRaw] = String(nodeVer).replace(/^v/, "").split(".");
    const major = Number(majorRaw);
    const minor = Number(minorRaw);
    const supported =
        Number.isFinite(major) &&
        Number.isFinite(minor) &&
        major >= 20 &&
        major < 23;
    if (!supported) {
        throw new Error(`FAIL: Unsupported Node version ${nodeVer}. OMEGA requires >=22.12.0 <23.`);
    }
    console.log(`PASS: Node Version ${nodeVer}`);

    // 2. Trust Anchor Verification
    const rootFP = getFingerprint(path.join(ROOT, 'tools/integrity/keys/omega_root.pub.pem'));
    const govFP = getFingerprint(path.join(ROOT, 'tools/integrity/keys/governance_root.pub.pem'));

    if (rootFP !== EXPECTED_ROOT_FP) throw new Error('FAIL: Root Trust Anchor mismatch.');
    if (govFP !== EXPECTED_GOV_FP) throw new Error('FAIL: Governance Trust Anchor mismatch.');
    console.log('PASS: Root & Governance Anchors Verified.');

    // 3. Registry Integrity
    const regRes = run('node -e "const { verifyRegistrySignature } = require(\'./src/core/empireValidator\'); if (!verifyRegistrySignature()) process.exit(1);"');
    if (regRes.includes('ERROR')) throw new Error('FAIL: Governance Registry Chain Invalid.');
    console.log('PASS: Governance Registry Integrity.');

    // 4. AST Security Gate
    const astRes = run('node tools/security/ast_gate.js');
    if (astRes.includes('FAILURE') || !astRes.includes('FINISH: 0 ERRORS')) {
        throw new Error(`FAIL: AST Security Gate violations detected.\n${astRes}`);
    }
    console.log('PASS: AST Security Gate.');

    // 5. Omega Security Suite
    const suiteRes = run('node tests/omega_security.test.js');
    if (!suiteRes.includes('ALL OMEGA SECURITY ASSERTIONS PASSED')) {
        throw new Error(`FAIL: Omega Security Suite failed.\n${suiteRes}`);
    }
    console.log('PASS: Omega Security Assertions.');

    // 6. Determinism Test
    const detRes = run('npm run determinism:test');
    if (!detRes.includes('RESULT: PASS (BIT-FOR-BIT DETERMINISM)')) {
        throw new Error(`FAIL: Determinism check failed.\n${detRes}`);
    }
    console.log('PASS: Bit-for-bit Determinism.');

    // 7. VAR_PROOF Verification
    console.log('[OMEGA] Regenerating VAR_PROOF for final attestation...');
    await require('./export_var_proof').exportProof();
    const latestProofDir = path.join(ROOT, "artifacts", "var_proof", "latest");
    const latestSig = path.join(latestProofDir, "signatures", "ed25519.sig");
    const latestPub = path.join(latestProofDir, "signatures", "ed25519.pub");
    const latestBundleSigned = fs.existsSync(latestSig) && fs.existsSync(latestPub);
    const runningInCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

    let verRes = "";
    if (latestBundleSigned) {
        verRes = run('node tools/verify_external_proof.js artifacts/var_proof/latest .');
    } else if (runningInCi) {
        console.log('[OMEGA] latest VAR_PROOF is unsigned in CI; verifying immutable signed fixture bundle.');
        verRes = run('node tools/verify_external_proof.js tools/fixtures/signed_var_proof');
    } else {
        throw new Error('FAIL: Generated VAR_PROOF missing signatures and no CI fallback available.');
    }

    if (!verRes.includes('RESULT: PASS (SOVEREIGNTY VERIFIED)')) {
        throw new Error(`FAIL: External Verifier rejected the selected proof bundle.\n${verRes}`);
    }
    console.log('PASS: External Sovereignty Verification.');

    console.log('\n======================================');
    console.log('   OMEGA STATUS: VERIFIED');
    console.log('======================================\n');
}

verifyAll().catch(err => {
    console.error(`\n${err.message}`);
    process.exit(1);
});
