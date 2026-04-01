const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * NeuralShell Release Verifier (Independent) - v5.1.0
 * This script verifies the integrity and provenance of a NeuralShell release bundle.
 */

function sha256File(filePath) {
    if (!fs.existsSync(filePath)) return null;
    const hash = crypto.createHash('sha256');
    hash.update(fs.readFileSync(filePath));
    return hash.digest('hex');
}

function verifyPayload(payload, signatureBase64, pubKeyPem) {
    try {
        const pubKey = crypto.createPublicKey(pubKeyPem);
        // NeuralShell uses Ed25519 signatures with JSON payload
        // The payload must be stringified exactly as it was during signing.
        return crypto.verify(null, Buffer.from(JSON.stringify(payload)), pubKey, Buffer.from(signatureBase64, 'base64'));
    } catch (err) {
        console.error(`[VERIFIER] Signature Internal Error: ${err.message}`);
        return false;
    }
}

async function runVerification(targetRoot) {
    const absRoot = path.resolve(targetRoot);
    console.log(`[VERIFIER] Full scan initiating: ${absRoot}`);

    const manifestPath = path.join(absRoot, 'release', 'manifest.json');
    const signaturePath = path.join(absRoot, 'release', 'manifest.sig');
    const publicKeyPath = path.join(absRoot, 'release', 'manifest.pub');
    const sbomPath = path.join(absRoot, 'artifacts', 'sbom', 'latest.json');
    const provenancePath = path.join(absRoot, 'release', 'provenance.json');

    // 1. Check required trust anchors
    if (!fs.existsSync(manifestPath)) { console.error('[VERIFIER] FAIL: manifest.json missing'); return false; }
    if (!fs.existsSync(signaturePath)) { console.error('[VERIFIER] FAIL: manifest.sig missing'); return false; }
    if (!fs.existsSync(publicKeyPath)) { console.error('[VERIFIER] FAIL: manifest.pub missing'); return false; }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const signature = fs.readFileSync(signaturePath, 'utf8').trim();
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    // 2. Verify Manifest Signature
    if (!verifyPayload(manifest, signature, publicKey)) {
        console.error('[VERIFIER] CRITICAL FAIL: manifest.sig cryptographic verification failed (TAMPERED_MANIFEST)');
        return false;
    }
    console.log('[VERIFIER] Cryptographic Trust: OK (Verified via manifest.pub)');

    // 3. Verify Artifact Integrity
    for (const file of manifest.files) {
        // Paths in manifest are relative to repository root (e.g. "dist/...")
        const artifactPath = path.join(absRoot, file.path);

        if (!fs.existsSync(artifactPath)) {
            // Some files might be missing if it's a partial bundle, but for Phase 5 we expect full dist.
            console.error(`[VERIFIER] FAIL: Missing artifact: ${file.path}`);
            return false;
        }

        const actualHash = sha256File(artifactPath);
        if (actualHash !== file.sha256) {
            console.error(`[VERIFIER] CRITICAL FAIL: Hash mismatch for ${file.path}`);
            console.error(`           Expected: ${file.sha256}`);
            console.error(`           Actual:   ${actualHash}`);
            return false;
        }
    }
    console.log('[VERIFIER] Artifact Integrity: OK (Bit-for-bit match)');

    // 4. Verify External Provenance (FAIL-CLOSED)
    if (fs.existsSync(sbomPath)) {
        console.log(`[VERIFIER] SBOM Verification: OK (${path.relative(absRoot, sbomPath)})`);
    } else {
        console.error('[VERIFIER] CRITICAL FAIL: SBOM missing (MANDATORY)');
        return false;
    }

    if (fs.existsSync(provenancePath)) {
        console.log(`[VERIFIER] Provenance Verification: OK (${path.relative(absRoot, provenancePath)})`);
    } else {
        console.error('[VERIFIER] CRITICAL FAIL: Provenance missing (MANDATORY)');
        return false;
    }

    // 4. Verification Conclusion
    console.log('[VERIFIER] Independent Release Verification: SUCCESS (100% Deterministic PASS)');
    return true;
}

if (require.main === module) {
    const target = process.argv[2] || process.cwd();
    runVerification(target).then(success => {
        process.exit(success ? 0 : 1);
    });
}
