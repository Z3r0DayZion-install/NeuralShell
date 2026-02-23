/**
 * Signed Release Builder
 * Generates RSA-4096 PSS signed manifest for boot integrity.
 */
"use strict";

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Target files for integrity verification
const TARGETS = [
  'main.js',
  'preload.js',
  'src/kernel/index.js',
  'src/kernel/execution.js',
  'src/kernel/filesystem.js',
  'src/kernel/network.js',
  'src/kernel/crypto.js'
];

function generateReleaseSeal(privateKeyPath) {
  const manifest = {
    version: '2.1.0',
    ts: Date.now(),
    hashes: {}
  };

  const privateKey = fs.readFileSync(privateKeyPath);

  for (const relPath of TARGETS) {
    if (!fs.existsSync(relPath)) {
      console.warn(`[Signer] Warning: Target not found: ${relPath}`);
      continue;
    }
    const content = fs.readFileSync(relPath);
    manifest.hashes[relPath] = crypto.createHash('sha256').update(content).digest('hex');
  }

  const data = JSON.stringify(manifest);
  
  // Sign using RSA-4096 PSS
  const signature = crypto.sign("sha256", Buffer.from(data), {
    key: privateKey,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  });

  fs.writeFileSync('seal.manifest.json', data);
  fs.writeFileSync('seal.manifest.sig', signature);
  
  console.log("[Signer] Generated seal.manifest.json and seal.manifest.sig");
}

module.exports = { generateReleaseSeal };
