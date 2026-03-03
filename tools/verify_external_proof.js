const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * INDEPENDENT OMEGA PROOF VERIFIER
 * 
 * Validates a VAR_PROOF bundle without relying on @neural/omega-core.
 */

const EXPECTED_PUBKEY_HASH = '75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9';

function computeBuildHash(targetDir) {
  const TARGETS = [
    'src/main.js',
    'src/preload.js',
    'src/kernel/',
    'src/security/',
    'src/core/empireValidator.js',
    'package.json',
    'package-lock.json',
    'dist/seal.manifest.json'
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
          if (fs.statSync(fp).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'artifacts') {
                getFiles(fp);
            }
          } else if (file.match(/\.(js|html|css|json)$/)) {
            allFiles.push(fp);
          }
        });
      };
      getFiles(p);
    } else {
      allFiles.push(p);
    }
  });

  const hash = crypto.createHash('sha256');
  
  const sortedFiles = allFiles.map(f => ({
    full: f,
    rel: path.relative(targetDir, f).replace(/\\/g, '/')
  })).sort((a, b) => a.rel.localeCompare(b.rel));

  sortedFiles.forEach(f => {
    const content = fs.readFileSync(f.full, 'utf8');
    const normalizedContent = content.replace(/\r\n/g, '\n');
    console.log(`[DEBUG] Hashing: ${f.rel} (${normalizedContent.length} bytes)`);
    hash.update(f.rel);
    hash.update(normalizedContent);
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

  const pubKeyContent = fs.readFileSync(pubKeyPath);
  const actualHash = crypto.createHash('sha256').update(pubKeyContent).digest('hex');
  
  if (actualHash !== EXPECTED_PUBKEY_HASH) {
    console.error(`FAIL: Root fingerprint mismatch!\nExpected: ${EXPECTED_PUBKEY_HASH}\nGot:      ${actualHash}`);
    process.exit(1);
  }
  console.log('PASS: Root Trust Anchor verified.');

  const manifestContent = fs.readFileSync(manifestPath);
  const signature = fs.readFileSync(sigPath, 'utf8');
  const publicKey = crypto.createPublicKey(pubKeyContent);
  const isValid = crypto.verify(null, manifestContent, publicKey, Buffer.from(signature, 'base64'));

  if (!isValid) {
    console.error('FAIL: Ed25519 cryptographic signature is invalid.');
    process.exit(1);
  }
  console.log('PASS: Ed25519 Signature verified.');

  const manifest = JSON.parse(manifestContent.toString('utf8'));

  if (!manifest.build || !manifest.build.buildHash) {
    console.error('FAIL: Manifest is missing BUILD_HASH.');
    process.exit(1);
  }

  if (sourceDir) {
    const actualBuildHash = computeBuildHash(sourceDir);
    if (actualBuildHash !== manifest.build.buildHash) {
      console.error(`FAIL: Source BUILD_HASH mismatch!\nExpected: ${manifest.build.buildHash}\nGot:      ${actualBuildHash}`);
      process.exit(1);
    }
    console.log('PASS: Source directory perfectly matches cryptographically signed BUILD_HASH.');
  }

  console.log('\n======================================');
  console.log('RESULT: PASS (SOVEREIGNTY VERIFIED)');
  console.log('======================================');
}

const bundleDir = process.argv[2];
const sourceDir = process.argv[3];

if (!bundleDir) process.exit(1);
verifyProof(path.resolve(bundleDir), sourceDir ? path.resolve(sourceDir) : null);
