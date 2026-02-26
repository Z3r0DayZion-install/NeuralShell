"use strict";
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAsxq369JNBw7BX1RsX3qb
TrqLuYg8kfP2eEe+2bYBQvl76zafzZcYjhlu8XPUAmB5xKQXy80LhRlfSjA+8m/T
9CEb53hdY/++m7N/qnYz2uAE55bP1IUuWhxnu3JW4kgidTbgqN0IKB53axOVAtpO
9jpmMCzvPEpMMQ75SPi5Yd5664SRfglTNyNI1fT+BygA/JKAJRSb692h339UxAi1
kYE8tDm5wClXzXElRqsV19SkMgKsEKoitekGUoIVp7ypil7IbInZZTjnMcWUlOIF
xD8G1sqQ7VeZKuls3EA9SxIXPZQwfbpCOyF2+egtFdLyvHrewkAz+AdPe/51vYAS
Htzqo7RVVijmxxeU5Ci/z0g40758S5A7yp+SZNmulbYgAcEZlxUsuRXBtjOSZ503
8GWB8JxM8di9Tc5WMMZ7gYoViB3rryL4ompShhHab7usH2b2XtWWSNY+VU8NVJkN
y7886uRBWRh5yGpSVyxH5ApxCErnjsrVZeuY9mHkDasgZXo9mfJOfatYuSznMmgI
W8KV4mYKLpQKgr24cua7qnXY/DxvARbCuCyRpIVQvX1Z0croeQwctXZ/brmWwgaZ
cTV7C4mQ1ZXZGOnI23eoYiOzsXfLgdMQhuCggimI9fqEMsHtgF8jBsVMblizaKCh
CyEmsiX2Bb+7AFESsXChhdkCAwEAAQ==
-----END PUBLIC KEY-----
`;

function verifyBootIntegrity() {
  const root = process.resourcesPath || process.cwd();
  const manifestPath = path.join(root, 'seal.manifest.json');
  const sigPath = path.join(root, 'seal.manifest.sig');

  if (!fs.existsSync(manifestPath) || !fs.existsSync(sigPath)) {
    return { ok: false, reason: 'MISSING_RELEASE_SEAL' };
  }
  
  const data = fs.readFileSync(manifestPath);
  const sig = fs.readFileSync(sigPath);

  const valid = crypto.verify("sha256", data, {
    key: PUB_KEY,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
  }, sig);

  if (!valid) return { ok: false, reason: 'INVALID_SIGNATURE' };

  const manifest = JSON.parse(data);
  for (const [relPath, expectedHash] of Object.entries(manifest.hashes)) {
    const fullPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) return { ok: false, reason: `FILE_MISSING:${relPath}` };
    const actualHash = crypto.createHash('sha256').update(fs.readFileSync(fullPath)).digest('hex');
    if (actualHash !== expectedHash) return { ok: false, reason: `HASH_MISMATCH:${relPath}` };
  }

  return { ok: true };
}

/**
 * 5. DIRECTORY ACL VERIFICATION
 */
function verifyDirectoryACL() {
  // If not packaged, we are in a dev environment; trust is assumed for the developer.
  const { app } = require('electron');
  if (!app.isPackaged) return true;

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
