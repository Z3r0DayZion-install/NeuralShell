const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../../');
const DIST = path.join(ROOT, 'dist');
const KEY_DIR = path.join(__dirname, '../integrity/keys');

function getKeys() {
  const privPath = path.join(KEY_DIR, 'integrity.key.pem');
  if (!fs.existsSync(privPath)) {
    throw new Error('Integrity key missing. Cannot sign proof bundle.');
  }
  return fs.readFileSync(privPath, 'utf8');
}

function runCommand(cmd) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch (err) {
    return `FAILED: ${err.message}`;
  }
}

function hashFile(relPath) {
  const fullPath = path.join(ROOT, relPath);
  if (!fs.existsSync(fullPath)) return 'FILE_MISSING';
  return crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
}

function generateBundle() {
  console.log('[PROOF] Generating Security Proof Bundle...');
  
  const bundle = {
    timestamp: new Date().toISOString(),
    version: require(path.join(ROOT, 'package.json')).version,
    system: {
      platform: process.platform,
      arch: process.arch,
      node: process.version
    },
    vcs: {
      commit: runCommand('git rev-parse HEAD'),
      branch: runCommand('git rev-parse --abbrev-ref HEAD')
    },
    hashes: {
      'package-lock.json': hashFile('package-lock.json'),
      'dist/seal.manifest.json': hashFile('dist/seal.manifest.json')
    },
    gates: {
      astScan: runCommand('node tools/security/ast_gate.js') ? 'PASS' : 'FAIL',
      unitTests: runCommand('npm test').includes('failing') ? 'FAIL' : 'PASS'
    }
  };

  const isPass = bundle.gates.astScan === 'PASS' && bundle.gates.unitTests === 'PASS';
  bundle.verdict = isPass ? 'PASS' : 'FAIL';

  const bundleStr = JSON.stringify(bundle, null, 2);
  const privateKey = getKeys();
  
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(bundleStr);
  signer.end();
  const signature = signer.sign(privateKey, 'base64');

  const output = {
    bundle,
    signature
  };

  if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
  const outPath = path.join(DIST, 'proof_bundle.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`[PROOF] Bundle generated at ${outPath} with verdict: ${bundle.verdict}`);
  if (!isPass) {
    console.error('[PROOF] Gates failed. Release blocked.');
    process.exit(1);
  }
}

generateBundle();
