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
    if (!nodeVer.startsWith('v20.')) {
        throw new Error(`FAIL: Unsupported Node version ${nodeVer}. OMEGA requires v20.x.`);
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
    if (!suiteRes.includes('ALL OMEGA SECURITY TESTS PASSED')) {
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
    
    const verRes = run('node tools/verify_external_proof.js artifacts/var_proof/latest .');
    if (!verRes.includes('RESULT: PASS (SOVEREIGNTY VERIFIED)')) {
        throw new Error(`FAIL: External Verifier rejected the generated proof.\n${verRes}`);
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
