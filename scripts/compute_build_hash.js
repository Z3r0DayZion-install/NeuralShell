const fs = require('fs');
const path = require('path');
const { hashContent, fileWalker } = require('./_omega_utils');

/**
 * NeuralShell Build Hash Generator (Unified)
 * 
 * Computes a deterministic hash of all build inputs.
 */

const ROOT = path.join(__dirname, '../');
const TARGETS = [
  'src/main.js', 'src/preload.js', 'src/renderer.html', 'src/renderer.js', 'src/style.css',
  'src/kernel/', 'src/core/', 'src/security/', 'package.json', 'package-lock.json', 'dist/seal.manifest.json'
];

function computeBuildHash() {
  const allFiles = [];
  TARGETS.forEach(t => {
    const p = path.join(ROOT, t);
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) {
      fileWalker(p, (f) => f.match(/\.(js|html|css|json)$/), allFiles);
    } else {
      allFiles.push(p);
    }
  });

  const sortedFiles = allFiles.map(f => ({
    full: f,
    rel: path.relative(ROOT, f).replace(/\\/g, '/')
  })).sort((a, b) => a.rel.localeCompare(b.rel));

  const hash = require('crypto').createHash('sha256');
  sortedFiles.forEach(f => {
    hash.update(f.rel);
    hash.update(hashContent(fs.readFileSync(f.full)));
  });

  const finalHash = hash.digest('hex');
  console.log(`[BUILD] DETERMINISTIC_BUILD_HASH: ${finalHash}`);
  return finalHash;
}

if (require.main === module) computeBuildHash();
module.exports = { computeBuildHash };
