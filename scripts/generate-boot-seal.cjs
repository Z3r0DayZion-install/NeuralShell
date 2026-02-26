#!/usr/bin/env node
/**
 * Generate Boot Seal - Creates RSA keys and signs the manifest
 * 
 * This script:
 * 1. Generates RSA-4096 key pair for boot chain verification
 * 2. Computes SHA256 hashes for all critical files
 * 3. Creates seal.manifest.json with file hashes
 * 4. Signs the manifest using RSA-PSS
 * 5. Saves the signature to seal.manifest.sig
 * 6. Updates src/boot/verify.js with the public key
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = argv.slice();
  const out = {
    outDir: path.join(__dirname, '../NeuralShell_Desktop'),
    writePrivateKey: false,
    privateKeyOut: path.join(__dirname, '../state/seals/boot-seal.private.key'),
    updateVerify: true
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--out-dir') {
      out.outDir = args[i + 1];
      i++;
      continue;
    }
    if (a === '--write-private-key') {
      out.writePrivateKey = true;
      continue;
    }
    if (a === '--no-private-key') {
      out.writePrivateKey = false;
      continue;
    }
    if (a === '--private-key-out') {
      out.privateKeyOut = args[i + 1];
      i++;
      continue;
    }
    if (a === '--no-update-verify') {
      out.updateVerify = false;
      continue;
    }
  }

  if (process.env.BOOT_SEAL_OUT_DIR) {
    out.outDir = process.env.BOOT_SEAL_OUT_DIR;
  }
  if (process.env.BOOT_SEAL_PRIVATE_KEY_OUT) {
    out.privateKeyOut = process.env.BOOT_SEAL_PRIVATE_KEY_OUT;
  }
  if (process.env.BOOT_SEAL_WRITE_PRIVATE_KEY === '1') {
    out.writePrivateKey = true;
  } else if (process.env.BOOT_SEAL_WRITE_PRIVATE_KEY === '0') {
    out.writePrivateKey = false;
  }
  if (process.env.BOOT_SEAL_UPDATE_VERIFY === '0') {
    out.updateVerify = false;
  }

  return out;
}

const cli = parseArgs(process.argv.slice(2));

const sealOutDir = path.resolve(cli.outDir);
const privateKeyOutPath = cli.privateKeyOut ? path.resolve(cli.privateKeyOut) : null;

// Files to include in the boot chain (relative to NeuralShell_Desktop directory)
const CRITICAL_FILES = [
  'main.js',
  'preload.js',
  // All src files in NeuralShell_Desktop
  ...fs.readdirSync(path.join(__dirname, '../NeuralShell_Desktop/src'))
    .filter(f => f.endsWith('.js'))
    .map(f => `src/${f}`)
];

// Add kernel and router files from parent directory
if (fs.existsSync(path.join(__dirname, '../kernel/taskExecutor.js'))) {
  CRITICAL_FILES.push('../kernel/taskExecutor.js');
}

const routerDir = path.join(__dirname, '../src/router');
if (fs.existsSync(routerDir)) {
  const routerFiles = fs.readdirSync(routerDir)
    .filter(f => f.endsWith('.js'))
    .map(f => `../src/router/${f}`);
  CRITICAL_FILES.push(...routerFiles);
}

console.log('[Boot Seal Generator] 🔐 Generating RSA-4096 key pair...');

// Generate RSA-4096 key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

console.log('[Boot Seal Generator] ✓ Key pair generated');
console.log('[Boot Seal Generator] 📝 Computing file hashes...');

// Compute hashes for all critical files (from NeuralShell_Desktop directory perspective)
const hashes = {};
let fileCount = 0;
const baseDir = path.join(__dirname, '../NeuralShell_Desktop');

for (const filePath of CRITICAL_FILES) {
  const fullPath = path.join(baseDir, filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[Boot Seal Generator] ⚠️  File not found: ${filePath} (${fullPath})`);
    continue;
  }
  
  const content = fs.readFileSync(fullPath);
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  hashes[filePath] = hash;
  fileCount++;
}

console.log(`[Boot Seal Generator] ✓ Computed ${fileCount} file hashes`);

// Create manifest
const manifest = {
  version: '1.0.0',
  timestamp: new Date().toISOString(),
  hashes
};

const manifestJson = JSON.stringify(manifest, null, 2);

console.log('[Boot Seal Generator] 🔏 Signing manifest with RSA-PSS...');

// Sign the manifest using RSA-PSS
const signature = crypto.sign('sha256', Buffer.from(manifestJson), {
  key: privateKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
});

console.log('[Boot Seal Generator] ✓ Manifest signed');

// Save manifest
fs.mkdirSync(sealOutDir, { recursive: true });
fs.writeFileSync(path.join(sealOutDir, 'seal.manifest.json'), manifestJson);
console.log('[Boot Seal Generator] ✓ Saved seal.manifest.json');

// Save signature
fs.writeFileSync(path.join(sealOutDir, 'seal.manifest.sig'), signature);
console.log('[Boot Seal Generator] ✓ Saved seal.manifest.sig');

if (cli.writePrivateKey && privateKeyOutPath) {
  fs.mkdirSync(path.dirname(privateKeyOutPath), { recursive: true });
  fs.writeFileSync(privateKeyOutPath, privateKey, { mode: 0o600 });
  console.log(`[Boot Seal Generator] ⚠️  Saved private key: ${privateKeyOutPath} (KEEP SECURE!)`);
} else {
  console.log('[Boot Seal Generator] ✓ Private key not written to disk (recommended)');
}

// Update verify.js with the public key
if (cli.updateVerify) {
  const verifyJsPath = path.join(__dirname, '../NeuralShell_Desktop/src/boot/verify.js');
  let verifyJs = fs.readFileSync(verifyJsPath, 'utf8');

  // Replace the placeholder public key
  verifyJs = verifyJs.replace(
    /const PUB_KEY = `[^`]+`;/,
    `const PUB_KEY = \`${publicKey}\`;`
  );

  fs.writeFileSync(verifyJsPath, verifyJs);
  console.log('[Boot Seal Generator] ✓ Updated src/boot/verify.js with public key');
} else {
  console.log('[Boot Seal Generator] ✓ Skipped verify.js public key update');
}

// Verify the signature works
console.log('[Boot Seal Generator] 🔍 Verifying signature...');

const isValid = crypto.verify('sha256', Buffer.from(manifestJson), {
  key: publicKey,
  padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
  saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
}, signature);

if (isValid) {
  console.log('[Boot Seal Generator] ✅ Signature verification successful!');
  console.log('\n[Boot Seal Generator] 🎉 Boot seal generation complete!');
  console.log(`[Boot Seal Generator] 📊 Protected ${fileCount} critical files`);
  console.log('[Boot Seal Generator] 🔐 Boot chain is now cryptographically sealed');
} else {
  console.error('[Boot Seal Generator] ❌ Signature verification failed!');
  process.exit(1);
}
