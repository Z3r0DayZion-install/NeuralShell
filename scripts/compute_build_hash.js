const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * NeuralShell Build Hash Generator
 * 
 * Computes a deterministic hash of all build inputs to ensure reproducibility.
 */

const ROOT = path.join(__dirname, '../');
const TARGETS = [
  'src/main.js',
  'src/preload.js',
  'src/renderer.html',
  'src/renderer.js',
  'src/style.css',
  'src/kernel/',
  'src/core/',
  'src/security/',
  'package.json',
  'package-lock.json',
  'dist/seal.manifest.json'
];

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.sort().forEach(file => { // Sort for determinism
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      getFiles(p, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.json')) {
      fileList.push(p);
    }
  });
  return fileList;
}

function computeBuildHash() {
  const allFiles = [];
  TARGETS.forEach(t => {
    const p = path.join(ROOT, t);
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) {
      getFiles(p, allFiles);
    } else {
      allFiles.push(p);
    }
  });

  const hash = crypto.createHash('sha256');
  
  // Sort all gathered files to ensure deterministic hashing order
  allFiles.sort().forEach(f => {
    const relativePath = path.relative(ROOT, f).replace(/\\/g, '/');
    const content = fs.readFileSync(f);
    hash.update(relativePath);
    hash.update(content);
  });

  const finalHash = hash.digest('hex');
  console.log(`[BUILD] BUILD_HASH: ${finalHash}`);
  return finalHash;
}

if (require.main === module) {
  computeBuildHash();
}

module.exports = { computeBuildHash };
