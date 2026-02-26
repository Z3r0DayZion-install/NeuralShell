'use strict';
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzGWj7kh/QLSH9w7JdCrH
HQ5gbPXviSEwjfB/HwOMscNf8FB9SSqcVS5yLTaokB9/pcHGTh7bG7hagYwz1i9Z
qbZlXhACq7EDQf0oqVLbLM3yKoaFrDiwB6EuS3G2ZzJ9DNuZOVDNIJ1iOfdAHjpq
LjfLCRgKE/GjVUPI4O4hc7F6HGBSv6e2pAooAuq48h7BhV1kZLWwUubFDtU6rXwv
Pi2zl3yuotE4iFC0CxjZFAwPbCvdWPxFArdJJ7doqItsDgBV0vcykALX0s1AJuK9
Px1fba/C5LVAKh/41MQUUsx99tiLb6+ORz/DvyIrnkNyd4QJeXVwPvbQtO6oN70y
rOjA5OZBGVaygFfRSh6RlxsExQAk8l3iwHpRWj+TUpajrKEMFtjyRdEQ++aCsKRp
REs30pPCCU082TVhc++ZVaQHQK/j95rjX2B24mRqlBhwDtYBAgaQQKpy3ijp00IU
xLWvNWJrtPBtmgzO1x/9y5lV2dJ9bNbQtdx0wIKmvBYoi24zwbmg6OrQIUaMCFIM
VtSkZRO8rNoXGlj6H8BgR+DyuKa6j79ZLqMdDVn9JVgQruqbOB9rICtgXfqJ8otQ
P0rd1PQwGLMao76A94Fg2Qne2IdqNMsZeMIHybcLRZdu13Tl6ZHf4+u70xVHrniG
2fz27uo/IhgZd4wyrhfrXxkCAwEAAQ==
-----END PUBLIC KEY-----
`;

async function verifyBootIntegrity() {
  const root = process.resourcesPath || process.cwd();
  const manifestPath = path.join(root, 'seal.manifest.json');
  const sigPath = path.join(root, 'seal.manifest.sig');

  if (!fs.existsSync(manifestPath) || !fs.existsSync(sigPath)) {
    return { ok: false, reason: 'MISSING_RELEASE_SEAL' };
  }

  const data = fs.readFileSync(manifestPath);
  const sig = fs.readFileSync(sigPath);

  const valid = crypto.verify('sha256', data, {
    key: PUB_KEY,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  }, sig);

  if (!valid) {
    return { ok: false, reason: 'INVALID_SIGNATURE' };
  }

  const manifest = JSON.parse(data);
  for (const [relPath, expectedHash] of Object.entries(manifest.hashes)) {
    const fullPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) {
      return { ok: false, reason: `FILE_MISSING:${relPath}` };
    }
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
    if (actualHash !== expectedHash) {
      return { ok: false, reason: `HASH_MISMATCH:${relPath}` };
    }
  }

  return { ok: true };
}

/**
 * 5. DIRECTORY ACL VERIFICATION
 */
function verifyDirectoryACL() {
  // If not packaged, we are in a dev environment; trust is assumed for the developer.
  const { app } = require('electron');
  if (!app.isPackaged) {
    return true;
  }

  const root = path.dirname(process.execPath);

  if (process.platform === 'win32') {
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    // Check if running from a protected system-wide directory
    const normalizedRoot = root.toLowerCase();
    return normalizedRoot.startsWith(programFiles.toLowerCase()) ||
           normalizedRoot.startsWith(programFilesX86.toLowerCase());
  } else {
    // POSIX: Root must not be world-writable
    try {
      const stats = fs.statSync(root);
      const isWorldWritable = (stats.mode & 0o002) !== 0;
      return !isWorldWritable;
    } catch {
      return false;
    }
  }
}

module.exports = {
  verifyBootIntegrity,
  verifyDirectoryACL
};
