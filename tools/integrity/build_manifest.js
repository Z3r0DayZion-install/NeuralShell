const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { hashContent, deterministicStringify } = require('../../scripts/_omega_utils');

/**
 * OMEGA Constitutional Integrity Build Tool
 * 
 * Generates a signed manifest of remaining critical enforcement files.
 */

const ROOT = path.join(__dirname, '../../');
const DIST = path.join(ROOT, 'dist');
const KEY_DIR = path.join(__dirname, 'keys');

// Remaining critical files after Surface Reduction
const TARGETS = [
  'src/main.js',
  'src/preload.js',
  'src/kernel/index.js',
  'src/kernel/filesystem.js',
  'src/kernel/network.js',
  'src/kernel/execution.js',
  'src/kernel/crypto.js',
  'src/kernel/os_keychain.js',
  'src/security/intentFirewall.js',
  'src/core/empireValidator.js'
];

function ensureDirs() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
}

function getKeys() {
  const privPath = path.join(KEY_DIR, 'integrity.key.pem');
  if (!fs.existsSync(privPath)) throw new Error('Integrity key missing.');
  return { privateKey: fs.readFileSync(privPath, 'utf8') };
}

function hashFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) throw new Error(`Target file missing: ${relPath}`);
  const content = fs.readFileSync(fullPath);
  return hashContent(content); // Deterministic LF hash
}

function run() {
  ensureDirs();
  const { privateKey } = getKeys();

  console.log('[BUILD] Hashing targets...');
  const manifest = {
    version: '1.0.0-OMEGA',
    hashes: {}
  };

  TARGETS.sort().forEach(target => {
    console.log(`[BUILD] Hashing: ${target}`);
    manifest.hashes[target] = hashFile(target);
  });

  // Deterministic JSON
  const manifestContent = deterministicStringify(manifest);
  const manifestPath = path.join(DIST, 'seal.manifest.json');
  const sigPath = path.join(DIST, 'seal.manifest.sig');

  fs.writeFileSync(manifestPath, manifestContent);

  console.log('[BUILD] Signing manifest...');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(manifestContent);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  fs.writeFileSync(sigPath, signature);

  console.log(`[BUILD] Integrity seal created: ${manifestPath}`);
}

try {
  run();
} catch (err) {
  console.error(`[BUILD ERROR] ${err.message}`);
  process.exit(1);
}
