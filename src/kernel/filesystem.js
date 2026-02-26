/**
 * Filesystem Broker (Refactored: Descriptor-Based & Atomic)
 * Enforces canonical boundaries and TOCTOU-safe I/O.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CANONICAL_ROOTS = Object.freeze([
  fs.realpathSync.native(path.join(process.cwd())),
  process.env.USERPROFILE ? fs.realpathSync.native(path.join(process.env.USERPROFILE, 'NeuralMemory_Package_SMALL')) : null
].filter(Boolean).map(root => {
  // 6.1 Enforce trailing separator to prevent prefix collisions (e.g. /root matching /root_evil)
  return root.endsWith(path.sep) ? root : root + path.sep;
}));

function atomicRead(targetPath) {
  // Resolve absolute path to prevent CWD manipulation
  const absolutePath = path.resolve(targetPath);

  // Resolve physical path on disk
  let realTarget;
  try {
    realTarget = fs.realpathSync.native(absolutePath);
  } catch (e) {
    throw new Error('CAPABILITY_DENIED: FILE_NOT_FOUND');
  }

  // Check boundaries against frozen canonical roots
  const isAllowed = CANONICAL_ROOTS.some(root => {
    return realTarget === root.slice(0, -1) || realTarget.startsWith(root);
  });

  if (!isAllowed) {
    throw new Error('CAPABILITY_DENIED: FS_OUT_OF_BOUNDS');
  }

  // 6.2 & 6.3 Descriptor-based Read with Link Protection
  // POSIX: Use O_NOFOLLOW to block following symbolic links at the OS level.
  const O_NOFOLLOW = fs.constants.O_NOFOLLOW || 0;
  const flags = process.platform === 'win32' ? fs.constants.O_RDONLY : fs.constants.O_RDONLY | O_NOFOLLOW;

  let fd;
  try {
    fd = fs.openSync(realTarget, flags);
  } catch (e) {
    if (e.code === 'ELOOP') {
      throw new Error('FS_BOUNDARY_VIOLATION: SYMLINK_REJECTED');
    }
    throw e;
  }

  try {
    const stats = fs.fstatSync(fd);

    // Verify file type before reading
    if (!stats.isFile()) {
      throw new Error('CAPABILITY_DENIED: NOT_A_FILE');
    }

    // Ensure file hasn't been swapped for a link (Double verification for non-O_NOFOLLOW platforms)
    if (stats.isSymbolicLink()) {
      throw new Error('FS_BOUNDARY_VIOLATION: SYMLINK_DETECTED');
    }

    const buffer = Buffer.alloc(stats.size);
    const bytesRead = fs.readSync(fd, buffer, 0, stats.size, 0);

    if (bytesRead !== stats.size) {
      throw new Error('CAPABILITY_DENIED: PARTIAL_READ');
    }

    return buffer;
  } finally {
    if (fd !== undefined) {
      fs.closeSync(fd);
    }
  }
}

module.exports = Object.freeze({ atomicRead });
