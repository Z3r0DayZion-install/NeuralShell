'use strict';
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');

const TASK_REGISTRY = Object.freeze({
  'GIT_STATUS': {
    bin: process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\git.exe' : '/usr/bin/git',
    args: Object.freeze(['status']),
    expectedHash: 'dc720760df560ae9...'
  }
});

const IMMUTABLE_ENV = Object.freeze({
  SYSTEMROOT: process.env.SYSTEMROOT,
  USERPROFILE: process.env.USERPROFILE,
  PATH: process.platform === 'win32' ? 'C:\\Windows\\system32;C:\\Windows' : '/usr/bin:/bin'
});

async function verifyBinaryHash(binPath, expected) {
  if (!expected) {
    throw new Error('ERR_HASH_ANCHOR_MISSING');
  }
  return new Promise((resolve) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(binPath);
    stream.on('data', d => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex') === expected));
    stream.on('error', () => resolve(false));
  });
}

async function executeTask(taskId) {
  const config = TASK_REGISTRY[taskId];
  if (!config) {
    throw new Error('ERR_TASK_DENIED');
  }

  const isOk = await verifyBinaryHash(config.bin, config.expectedHash);
  if (!isOk) {
    throw new Error('ERR_BINARY_INTEGRITY_FAILURE');
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(config.bin, config.args, {
      shell: false,
      env: IMMUTABLE_ENV,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let out = '';
    proc.stdout.on('data', d => out += d);
    proc.on('close', code => resolve({ code, out: out.trim() }));
    proc.on('error', reject);
  });
}
module.exports = { executeTask };
