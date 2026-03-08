const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const { deterministicStringify } = require('./_omega_utils');

/**
 * OMEGA Compliance Registry Manager
 * 
 * Enforces mechanical verification of ecosystem modules before 
 * signing the registry update with the Governance Root Key.
 * Implements a chained integrity model to prevent replay and rollback attacks.
 */

const ROOT = path.join(__dirname, '../');
const REGISTRY_PATH = path.join(ROOT, 'governance/OMEGA_COMPLIANCE_REGISTRY.json');
const GOV_KEY_DIR = path.join(ROOT, 'tools/integrity/keys');
const EXPECTED_GOV_FINGERPRINT = '76bb525ffe1cd289ee2d078f96a01c2e1251543187fc9c0a7b84e7865f07e545';

function run(cmd) {
    try { return require('child_process').execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim(); }
    catch (e) { return `ERROR: ${e.message}`; }
}

function getDeterministicHash(obj) {
    const payload = deterministicStringify(obj);
    return crypto.createHash('sha256').update(payload).digest('hex');
}

async function updateRegistry(modulePath, status = 'ACTIVE') {
    console.log(`[GOVERNANCE] Admission request for: ${modulePath}`);

    if (!fs.existsSync(REGISTRY_PATH)) {
        throw new Error('Registry file not found. Initialize registry first.');
    }

    const currentRegistry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    
    // 1. MECHANICAL VERIFICATION
    const verifierPath = path.join(ROOT, 'tools/verify_external_proof.js');
    const proofDir = path.join(modulePath, 'artifacts/var_proof/latest');
    
    console.log('[GOVERNANCE] Executing independent attestation...');
    try {
        const verifyRes = run(`node "${verifierPath}" "${proofDir}" "${modulePath}"`);
        if (!verifyRes.includes('RESULT: PASS (SOVEREIGNTY VERIFIED)')) {
            throw new Error(`Independent verification failed:\n${verifyRes}`);
        }
    } catch (err) {
        throw new Error(`Verification block: ${err.message}`);
    }

    // 2. EXTRACT METADATA
    const manifest = JSON.parse(fs.readFileSync(path.join(proofDir, 'manifest.json'), 'utf8'));
    const pkg = JSON.parse(fs.readFileSync(path.join(modulePath, 'package.json'), 'utf8'));

    const entry = {
        module_name: pkg.name || path.basename(modulePath),
        repository_url: run('git remote get-url origin') || 'local',
        omega_version: manifest.inputs.nodeVersion,
        build_hash: manifest.build.buildHash,
        sbom_hash: manifest.build.sbomHash,
        var_proof_signature: fs.readFileSync(path.join(proofDir, 'signatures/ed25519.sig'), 'utf8'),
        root_fingerprint: crypto.createHash('sha256').update(fs.readFileSync(path.join(proofDir, 'signatures/ed25519.pub'))).digest('hex'),
        compliance_version: "OMEGA_v1",
        verified_at_commit: manifest.repo.commit,
        verified_at: new Date().toISOString(),
        status: status
    };

    // 3. CONSTRUCT NEW REGISTRY STATE (CHAINED)
    const prevRegistryData = { ...currentRegistry, signature: "" };
    const prevHash = getDeterministicHash(prevRegistryData);

    const nextRegistry = {
        schema_version: "omega_registry.v2",
        registry_version: currentRegistry.registry_version + 1,
        updated_at: new Date().toISOString(),
        previous_hash: currentRegistry.registry_hash || prevHash, // Link to previous state
        governance_fingerprint: EXPECTED_GOV_FINGERPRINT,
        entries: currentRegistry.entries.filter(e => e.module_name !== entry.module_name),
        registry_hash: "", // Placeholder
        signature: ""
    };

    nextRegistry.entries.push(entry);
    nextRegistry.entries.sort((a, b) => a.module_name.localeCompare(b.module_name));

    // Calculate current state hash
    nextRegistry.registry_hash = getDeterministicHash({ ...nextRegistry, signature: "" });

    // 4. SIGN NEW STATE
    console.log('[GOVERNANCE] Signing registry with Governance Root Key...');
    const privKeyPath = path.join(GOV_KEY_DIR, 'governance_root.key.pem');
    const pubKeyPath = path.join(GOV_KEY_DIR, 'governance_root.pub.pem');

    if (!fs.existsSync(privKeyPath) || !fs.existsSync(pubKeyPath)) {
        throw new Error('GOV_BLOCK: Governance keys missing.');
    }

    const pubKeyContent = fs.readFileSync(pubKeyPath);
    const actualFingerprint = crypto.createHash('sha256').update(pubKeyContent).digest('hex');

    if (actualFingerprint !== EXPECTED_GOV_FINGERPRINT) {
        throw new Error('GOV_BLOCK: Governance fingerprint mismatch.');
    }

    // SIGN THE DETERMINISTIC STRING (Must clear both signature and registry_hash for payload parity)
    const finalPayload = deterministicStringify({ ...nextRegistry, signature: "", registry_hash: "" });
    const privateKey = crypto.createPrivateKey(fs.readFileSync(privKeyPath));
    const signature = crypto.sign(null, Buffer.from(finalPayload), privateKey);

    nextRegistry.signature = signature.toString('base64');

    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(nextRegistry, null, 2));
    console.log(`[GOVERNANCE] Chained registry updated and signed: ${REGISTRY_PATH}`);
}

const target = process.argv[2];
if (!target) {
    console.error('Usage: node update_compliance_registry.js <path_to_module>');
    process.exit(1);
}

updateRegistry(path.resolve(target)).catch(err => {
    console.error(`[GOVERNANCE FAILURE] ${err.message}`);
    process.exit(1);
});
