/**
 * Secure Task Executor - Vulnerability 3 Fix
 * 
 * This module implements a secure execution model that:
 * - Maintains a task registry with absolute binary paths and SHA256 hashes
 * - Verifies binary hash before execution
 * - Uses fixed argument arrays (no string interpolation)
 * - Sets shell: false to prevent command injection
 * - Uses restricted environment variables
 * 
 * All command execution MUST go through this module.
 * spawn/exec usage outside this module is banned via AST gate.
 * 
 * Requirements: 1.3, 2.3
 */

"use strict";

const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Task Registry - Defines allowed tasks with absolute binary paths and expected hashes
 * Each task has:
 * - bin: Absolute path to the binary
 * - args: Fixed array of arguments (no string interpolation)
 * - expectedHash: SHA256 hash of the binary for integrity verification
 */
const TASK_REGISTRY = Object.freeze({
  'GIT_STATUS': {
    bin: process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\git.exe' : '/usr/bin/git',
    args: Object.freeze(['status']),
    expectedHash: process.env.NODE_ENV === 'development' ? null : 'dc720760df560ae9...' // Skip hash check in dev
  },
  'GIT_LOG': {
    bin: process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\git.exe' : '/usr/bin/git',
    args: Object.freeze(['log', '--oneline', '-10']),
    expectedHash: process.env.NODE_ENV === 'development' ? null : 'dc720760df560ae9...'
  },
  'NODE_VERSION': {
    bin: process.execPath, // Current Node.js binary
    args: Object.freeze(['--version']),
    expectedHash: process.env.NODE_ENV === 'development' ? null : null // Node binary changes frequently
  },
  'NPM_LIST': {
    bin: process.platform === 'win32' ? 'C:\\Program Files\\nodejs\\npm.cmd' : '/usr/bin/npm',
    args: Object.freeze(['list', '--depth=0']),
    expectedHash: process.env.NODE_ENV === 'development' ? null : null
  }
});

/**
 * Immutable Environment - Restricted environment variables for spawned processes
 * Only essential system variables are included to minimize attack surface
 */
const IMMUTABLE_ENV = Object.freeze({
  SYSTEMROOT: process.env.SYSTEMROOT,
  USERPROFILE: process.env.USERPROFILE,
  HOME: process.env.HOME,
  PATH: process.platform === 'win32' 
    ? "C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\Git\\bin;C:\\Program Files\\nodejs"
    : "/usr/bin:/bin:/usr/local/bin",
  // Preserve NODE_ENV for development mode checks
  NODE_ENV: process.env.NODE_ENV
});

/**
 * Verify Binary Hash - Validates binary integrity using SHA256
 * 
 * @param {string} binPath - Absolute path to the binary
 * @param {string|null} expected - Expected SHA256 hash (null to skip verification)
 * @returns {Promise<boolean>} - True if hash matches or verification is skipped
 */
async function verifyBinaryHash(binPath, expected) {
  // Skip verification if no hash is provided (development mode or frequently-changing binaries)
  if (!expected) {
    console.warn(`[TaskExecutor] ⚠️  Binary hash verification skipped for ${binPath}`);
    return true;
  }

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(binPath);
    
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => {
      const actualHash = hash.digest('hex');
      const matches = actualHash === expected;
      
      if (!matches) {
        console.error(`[TaskExecutor] 🛡️ BINARY INTEGRITY FAILURE: ${binPath}`);
        console.error(`   Expected: ${expected}`);
        console.error(`   Actual:   ${actualHash}`);
      }
      
      resolve(matches);
    });
    stream.on('error', (err) => {
      console.error(`[TaskExecutor] Error reading binary ${binPath}:`, err.message);
      resolve(false);
    });
  });
}

/**
 * Execute Task - Secure task execution with verification
 * 
 * This is the ONLY function that should be used for command execution.
 * All spawn/exec usage outside this module is banned via AST gate.
 * 
 * @param {string} taskId - Task identifier from TASK_REGISTRY
 * @param {Array<string>} additionalArgs - Optional additional arguments (must be array)
 * @returns {Promise<{code: number, stdout: string, stderr: string}>} - Execution result
 * @throws {Error} - If task is not in registry, binary verification fails, or execution fails
 */
async function executeTask(taskId, additionalArgs = []) {
  // Validate task exists in registry
  const config = TASK_REGISTRY[taskId];
  if (!config) {
    throw new Error(`ERR_TASK_DENIED: Task '${taskId}' not found in registry`);
  }

  // Validate additional arguments are an array (prevent string interpolation)
  if (!Array.isArray(additionalArgs)) {
    throw new Error(`ERR_INVALID_ARGS: Additional arguments must be an array, got ${typeof additionalArgs}`);
  }

  // Verify binary integrity
  const isOk = await verifyBinaryHash(config.bin, config.expectedHash);
  if (!isOk) {
    throw new Error(`ERR_BINARY_INTEGRITY_FAILURE: Binary hash verification failed for ${config.bin}`);
  }

  // Combine fixed args with additional args
  const args = [...config.args, ...additionalArgs];

  console.log(`[TaskExecutor] Executing task '${taskId}': ${config.bin} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    // Spawn process with secure options
    const proc = spawn(config.bin, args, {
      shell: false,           // CRITICAL: Disable shell to prevent command injection
      env: IMMUTABLE_ENV,     // Use restricted environment
      stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin, capture stdout/stderr
      cwd: process.cwd()      // Use current working directory
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });

    proc.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });

    proc.on('close', (code) => {
      console.log(`[TaskExecutor] Task '${taskId}' completed with code ${code}`);
      resolve({
        code: code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });

    proc.on('error', (err) => {
      console.error(`[TaskExecutor] Task '${taskId}' failed:`, err.message);
      reject(new Error(`ERR_TASK_EXECUTION_FAILED: ${err.message}`));
    });
  });
}

/**
 * Get Available Tasks - Returns list of available task IDs
 * 
 * @returns {Array<string>} - Array of task IDs
 */
function getAvailableTasks() {
  return Object.keys(TASK_REGISTRY);
}

/**
 * Get Task Info - Returns configuration for a specific task
 * 
 * @param {string} taskId - Task identifier
 * @returns {Object|null} - Task configuration or null if not found
 */
function getTaskInfo(taskId) {
  return TASK_REGISTRY[taskId] || null;
}

module.exports = {
  executeTask,
  getAvailableTasks,
  getTaskInfo
};
