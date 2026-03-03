const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * INDEPENDENT OMEGA PROOF VERIFIER
 * 
 * Validates a VAR_PROOF bundle without relying on @neural/omega-core.
 * 
 * Usage: node verify_external_proof.js <path_to_proof_bundle> [<path_to_source_dir>]
 */

const EXPECTED_PUBKEY_HASH = '75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9';

function computeBuildHash(targetDir) {
  const TARGETS = [
    'src/main.js', 'src/preload.js', 'src/renderer.html', 'src/renderer.js', 'src/style.css',
    'src/kernel/', 'src/core/', 'src/security/', 'package.json', 'package-lock.json', 'dist/seal.manifest.json'
  ];

  const allFiles = [];
  TARGETS.forEach(t => {
    const p = path.join(targetDir, t);
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) {
      const getFiles = (dir) => {
        const files = fs.readdirSync(dir);
        files.sort().forEach(file => {
          const fp = path.join(dir, file);
          if (fs.statSync(fp).isDirectory()) getFiles(fp);
          else if (file.match(/\.(js|html|css|json)$/)) allFiles.push(fp);
        });
      };
      getFiles(p);
    } else {
      allFiles.push(p);
    }
  });

  const hash = crypto.createHash('sha256');
  allFiles.sort().forEach(f => {
    const relativePath = path.relative(targetDir, f).replace(/\\/g, '/');
    hash.update(relativePath);
    hash.update(fs.readFileSync(f));
  });

  return hash.digest('hex');
}

function verifyProof(bundleDir, sourceDir) {
  console.log(`[VERIFIER] Target Bundle: ${bundleDir}`);
  
  const manifestPath = path.join(bundleDir, 'manifest.json');
  const pubKeyPath = path.join(bundleDir, 'signatures', 'ed25519.pub');
  const sigPath = path.join(bundleDir, 'signatures', 'ed25519.sig');

  if (!fs.existsSync(manifestPath) || !fs.existsSync(pubKeyPath) || !fs.existsSync(sigPath)) {
    console.error('FAIL: Incomplete proof bundle.');
    process.exit(1);
  }

  // 1. Confirm Fingerprint
  const pubKeyContent = fs.readFileSync(pubKeyPath);
  const actualHash = crypto.createHash('sha256').update(pubKeyContent).digest('hex');
  
  if (actualHash !== EXPECTED_PUBKEY_HASH) {
    console.error(`FAIL: Root fingerprint mismatch!
Expected: ${EXPECTED_PUBKEY_HASH}
Got:      ${actualHash}`);
    process.exit(1);
  }
  console.log('PASS: Root Trust Anchor verified.');

  // 2. Validate Ed25519 Signature
  const manifestContent = fs.readFileSync(manifestPath);
  const signature = fs.readFileSync(sigPath, 'utf8');
  
  const publicKey = crypto.createPublicKey(pubKeyContent);
  const isValid = crypto.verify(null, manifestContent, publicKey, Buffer.from(signature, 'base64'));

  if (!isValid) {
    console.error('FAIL: Ed25519 cryptographic signature is invalid. Bundle was tampered with.');
    process.exit(1);
  }
  console.log('PASS: Ed25519 Signature verified.');

  const manifest = JSON.parse(manifestContent.toString('utf8'));

  // 3. Confirm Hashes exist
  if (!manifest.build || !manifest.build.buildHash || !manifest.build.sbomHash) {
    console.error('FAIL: Manifest is missing BUILD_HASH or SBOM_HASH.');
    process.exit(1);
  }
  console.log(`PASS: Manifest contains BUILD_HASH: ${manifest.build.buildHash}`);
  console.log(`PASS: Manifest contains SBOM_HASH:  ${manifest.build.sbomHash}`);

  // 4. (Optional) Source Verification
  if (sourceDir) {
    console.log(`[VERIFIER] Analyzing source directory: ${sourceDir}`);
    const actualBuildHash = computeBuildHash(sourceDir);
    if (actualBuildHash !== manifest.build.buildHash) {
      console.error(`FAIL: Source BUILD_HASH mismatch!
Expected: ${manifest.build.buildHash}
Got:      ${actualBuildHash}`);
      process.exit(1);
    }
    console.log('PASS: Source directory perfectly matches cryptographically signed BUILD_HASH.');
  } else {
    console.log('[VERIFIER] Source directory not provided. Skipping bit-for-bit physical hash validation.');
  }

  console.log('\n======================================');
  console.log('RESULT: PASS (SOVEREIGNTY VERIFIED)');
  console.log('======================================');
}

const bundleDir = process.argv[2];
const sourceDir = process.argv[3];

if (!bundleDir) {
  console.error('Usage: node verify_external_proof.js <path_to_proof_bundle> [<path_to_source_dir>]');
  process.exit(1);
}

try {
  verifyProof(path.resolve(bundleDir), sourceDir ? path.resolve(sourceDir) : null);
} catch (err) {
  console.error(`FAIL: Exception during verification - ${err.message}`);
  process.exit(1);
}
