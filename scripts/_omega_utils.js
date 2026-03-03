const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * OMEGA Core Shared Utilities (Internal)
 * Single Source of Truth for Determinism and Cryptography.
 */

const EXPECTED_ROOT_FP = '75cb2558e5aca6e8e763f4af871d88fb5fc2b5f87f6f612353f0d520b37f7cd9';
const EXPECTED_GOV_FP = '76bb525ffe1cd289ee2d078f96a01c2e1251543187fc9c0a7b84e7865f07e545';

function hashContent(content) {
    // Force LF normalization for bit-for-bit parity
    const normalized = content.toString('utf8').replace(/\r\n/g, '\n');
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function deterministicStringify(obj) {
    // Canonical JSON: Sorted keys, 2-space indent
    return JSON.stringify(obj, Object.keys(obj).sort(), 2);
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

module.exports = {
    EXPECTED_ROOT_FP,
    EXPECTED_GOV_FP,
    hashContent,
    deterministicStringify,
    fileWalker,
    getFingerprint
};
