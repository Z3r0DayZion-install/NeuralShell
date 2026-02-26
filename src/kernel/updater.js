/**
 * Secure Update Service
 * Handles signed update verification and atomic filesystem swaps.
 */
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { app } = require('electron');

const UPDATE_PUB_KEY = `-----BEGIN PUBLIC KEY-----
...[EMBEDDED_UPDATE_SIGNING_KEY]...
-----END PUBLIC KEY-----`;

const UPDATE_STAGING_DIR = path.join(app.getPath('userData'), 'update_stage');
const ROLLBACK_DIR = path.join(app.getPath('userData'), 'rollback_vnext');

async function verifyAndPrepareUpdate(updateDir, metadata) {
  // 12.1 Signature Verification
  const data = JSON.stringify(metadata.payload);
  const sig = Buffer.from(metadata.signature, 'hex');

  const isValid = crypto.verify(
    'sha256',
    Buffer.from(data),
    { key: UPDATE_PUB_KEY, padding: crypto.constants.RSA_PKCS1_PSS_PADDING },
    sig
  );

  if (!isValid) {
    throw new Error('ERR_UPDATE_SIGNATURE_INVALID');
  }

  // Verify file hashes
  for (const file of metadata.payload.files) {
    const filePath = path.join(updateDir, file.path);
    const content = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    if (hash !== file.hash) {
      throw new Error(`ERR_UPDATE_HASH_MISMATCH: ${file.path}`);
    }
  }

  return true;
}

function applyUpdateAtomic() {
  const currentAsar = path.join(process.resourcesPath, 'app.asar');
  const stagedAsar = path.join(UPDATE_STAGING_DIR, 'app.asar');

  try {
    // 12.2 Staged Apply + Atomic Swap
    if (fs.existsSync(ROLLBACK_DIR)) {
      fs.rmSync(ROLLBACK_DIR, { recursive: true });
    }
    fs.mkdirSync(ROLLBACK_DIR);

    // Move current to rollback
    fs.renameSync(currentAsar, path.join(ROLLBACK_DIR, 'app.asar'));

    // Move staged to active
    fs.renameSync(stagedAsar, currentAsar);

    console.log('[Updater] Update applied successfully. Restart required.');
    return true;
  } catch (e) {
    // Attempt rollback
    if (fs.existsSync(path.join(ROLLBACK_DIR, 'app.asar'))) {
      fs.renameSync(path.join(ROLLBACK_DIR, 'app.asar'), currentAsar);
    }
    throw new Error(`ERR_UPDATE_APPLY_FAILED: ${e.message}`);
  }
}

module.exports = { verifyAndPrepareUpdate, applyUpdateAtomic };
