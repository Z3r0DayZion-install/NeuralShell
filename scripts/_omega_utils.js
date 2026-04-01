const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * OMEGA Core Shared Utilities (Internal)
 * Single Source of Truth for Determinism and Cryptography.
 */

const EXPECTED_ROOT_FP = 'eaaa7a834c6a416bd9da6c63d6e5ad5fc5e48ce67f92a212d1083c8dd52ce77b';
const EXPECTED_GOV_FP = '715f8055139e9a1b24a5f34b9a48f2827a0edc77a81e9e93341762330d058d5e';

const CONSTITUTIONAL_TARGETS = [
  'src/main.js',
  'src/preload.js',
  'src/kernel/',
  'src/security/',
  'src/core/empireValidator.js',
  'package.json',
  'package-lock.json',
  'dist/seal.manifest.json'
];

function hashContent(content) {
  const normalized = content.toString('utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function deterministicStringify(obj) {
  if (typeof obj !== 'object' || obj === null) return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(deterministicStringify).join(',') + ']';

  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  sortedKeys.forEach(key => {
    result[key] = obj[key];
  });

  // Use standard stringify on the object with sorted keys
  return JSON.stringify(result, null, 2);
}

function fileWalker(dir, filter, fileList = []) {
  const files = fs.readdirSync(dir);
  files.sort().forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'artifacts' && file !== 'archive') {
        fileWalker(p, filter, fileList);
      }
    } else if (filter(file)) {
      fileList.push(p);
    }
  });
  return fileList;
}

function getFingerprint(pubKeyPath) {
  if (!fs.existsSync(pubKeyPath)) return null;
  const content = fs.readFileSync(pubKeyPath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function computeBuildHash(rootDir) {
  const allFiles = [];
  CONSTITUTIONAL_TARGETS.forEach(t => {
    const p = path.join(rootDir, t);
    if (!fs.existsSync(p)) return;
    if (fs.statSync(p).isDirectory()) {
      fileWalker(p, (f) => f.match(/\.(js|html|css|json)$/), allFiles);
    } else {
      allFiles.push(p);
    }
  });

  const sortedFiles = allFiles.map(f => ({
    full: f,
    rel: path.relative(rootDir, f).replace(/\\/g, '/')
  })).sort((a, b) => a.rel.localeCompare(b.rel));

  const hash = crypto.createHash('sha256');
  sortedFiles.forEach(f => {
    const content = fs.readFileSync(f.full, 'utf8');
    const normalizedContent = content.replace(/\r\n/g, '\n');
    console.log(`[DEBUG] Hashing: ${f.rel} (${normalizedContent.length} bytes)`);
    hash.update(f.rel);
    hash.update(normalizedContent);
  });

  return hash.digest('hex');
}

module.exports = {
  EXPECTED_ROOT_FP,
  EXPECTED_GOV_FP,
  CONSTITUTIONAL_TARGETS,
  hashContent,
  deterministicStringify,
  fileWalker,
  getFingerprint,
  computeBuildHash
};
