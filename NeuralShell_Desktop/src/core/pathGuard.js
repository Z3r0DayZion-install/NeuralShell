"use strict";

const path = require("path");

function normalize(p) {
  return path.resolve(String(p || ""));
}

function createPathGuard(roots) {
  const allowedRoots = (Array.isArray(roots) ? roots : [])
    .map((r) => normalize(r))
    .filter(Boolean);

  function isAllowed(targetPath) {
    const full = normalize(targetPath);
    return allowedRoots.some((root) => full === root || full.startsWith(`${root}${path.sep}`));
  }

  function assertAllowed(targetPath) {
    if (!isAllowed(targetPath)) {
      throw new Error(`Path outside allowlist: ${targetPath}`);
    }
    return normalize(targetPath);
  }

  return { isAllowed, assertAllowed, roots: allowedRoots.slice() };
}

module.exports = { createPathGuard };
