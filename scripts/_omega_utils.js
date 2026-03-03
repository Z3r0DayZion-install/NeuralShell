const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * OMEGA Core Shared Utilities (Internal)
 * Single Source of Truth for Determinism and Cryptography.
 */

const EXPECTED_ROOT_FP = '75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9';
const EXPECTED_GOV_FP = '76bb525ffe1cd289ee2d078f96a01c2e1251543187fc9c0a7b84e7865f07e545';

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
