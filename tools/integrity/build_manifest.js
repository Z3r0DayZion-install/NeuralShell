const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * NeuralShell Integrity Build Tool
 * 
 * Generates a signed manifest of all critical application files.
 */

const ROOT = path.join(__dirname, '../../');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const KEY_DIR = path.join(__dirname, 'keys');

// Critical files/directories to hash
const TARGETS = [
  'src/main.js',
  'src/preload.js',
  'src/renderer.html',
  'src/renderer.js',
  'src/style.css',
  'src/kernel/index.js',
  'src/kernel/filesystem.js',
  'src/kernel/network.js',
  'src/kernel/execution.js',
  'src/kernel/crypto.js',
  'src/security/intentFirewall.js'
];

function ensureDirs() {
  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  if (!fs.existsSync(KEY_DIR)) fs.mkdirSync(KEY_DIR, { recursive: true });
}

function getKeys() {
  const pubPath = path.join(KEY_DIR, 'integrity.pub.pem');
  const privPath = path.join(KEY_DIR, 'integrity.key.pem');

  if (!fs.existsSync(pubPath) || !fs.existsSync(privPath)) {
    console.log('[BUILD] Generating new RSA-4096 key pair...');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    fs.writeFileSync(pubPath, publicKey);
    fs.writeFileSync(privPath, privateKey);
    return { publicKey, privateKey };
  }

  return {
    publicKey: fs.readFileSync(pubPath, 'utf8'),
    privateKey: fs.readFileSync(privPath, 'utf8')
  };
}

function hashFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Target file missing: ${relPath}`);
  }
  const content = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function run() {
  ensureDirs();
  const { privateKey } = getKeys();

  console.log('[BUILD] Hashing targets...');
  const manifest = {
    version: '5.2.0',
    timestamp: new Date().toISOString(),
    hashes: {}
  };

  for (const target of TARGETS) {
    manifest.hashes[target] = hashFile(target);
  }

  const manifestContent = JSON.stringify(manifest, null, 2);
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
  console.log(`[BUILD] Signature: ${sigPath}`);
}

try {
  run();
} catch (err) {
  console.error(`[BUILD ERROR] ${err.message}`);
  process.exit(1);
}
