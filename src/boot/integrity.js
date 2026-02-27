/**
 * Boot Integrity Verifier
 * Validates RSA-4096 PSS signatures and file hashes before app init.
 */
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

// Embedded Public Key (Root of Trust)
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
...[EMBEDDED_RSA_4096_PUBLIC_KEY]...
-----END PUBLIC KEY-----`;

const MANIFEST_PATH = 'seal.manifest.json';
const SIG_PATH = 'seal.manifest.sig';

function verifyBootIntegrity() {
  // Check for existence of seal
  if (!fs.existsSync(MANIFEST_PATH) || !fs.existsSync(SIG_PATH)) {
    return { ok: false, reason: 'MISSING_RELEASE_SEAL' };
  }

  const manifestData = fs.readFileSync(MANIFEST_PATH);
  const signature = fs.readFileSync(SIG_PATH);

  // 7.1 Signature Verification (RSA-4096 PSS)
  const isSignatureValid = crypto.verify(
    'sha256',
    manifestData,
    {
      key: PUBLIC_KEY,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST
    },
    signature
  );

  if (!isSignatureValid) {
    return { ok: false, reason: 'INVALID_RELEASE_SIGNATURE' };
  }

  // 7.2 Hash Verification
  const manifest = JSON.parse(manifestData);
  const violations = [];

  for (const [relPath, expectedHash] of Object.entries(manifest.hashes)) {
    try {
      const content = fs.readFileSync(relPath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');

      if (actualHash !== expectedHash) {
        violations.push(relPath);
      }
    } catch (e) {
      violations.push(relPath);
    }
  }

  return {
    ok: violations.length === 0,
    violations
  };
}

module.exports = { verifyBootIntegrity };
