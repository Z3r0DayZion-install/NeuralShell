"use strict";
const crypto = require('node:crypto');
const { execSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');

/**
 * 4. MEMORY SCRUBBING UTILITY
 */
function secureClear(buffer) {
  if (Buffer.isBuffer(buffer)) {
    buffer.fill(0);
  }
}

function isElevated() {
  if (process.platform === 'win32') {
    const res = spawnSync('net', ['session'], { stdio: 'ignore' });
    return res.status === 0;
  }
  return process.getuid && process.getuid() === 0;
}

function deriveHardwareRoot() {
  let hwId = "";
  try {
    if (process.platform === 'win32') {
      hwId = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { stdio: 'pipe' })
        .toString().split('REG_SZ')[1].trim();
    } else {
      hwId = fs.readFileSync('/etc/machine-id', 'utf8').trim();
    }
  } catch (e) { hwId = require('node:os').hostname(); }
  return crypto.createHash('sha512').update(hwId).update(process.arch).digest();
}

const DEVICE_ROOT = Object.freeze(deriveHardwareRoot());

function processSecretTransaction(encryptedBlob, pin, workerFn) {
  const key = crypto.pbkdf2Sync(pin, DEVICE_ROOT, 200000, 32, 'sha512');
  const keyBuffer = Buffer.from(key);
  
  try {
    return workerFn(keyBuffer);
  } finally {
    secureClear(keyBuffer);
  }
}

module.exports = Object.freeze({
  DEVICE_ROOT,
  isElevated,
  secureClear,
  processSecretTransaction
});
