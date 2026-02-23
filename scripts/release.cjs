#!/usr/bin/env node
const { execSync } = require('node:child_process');

const bump = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(bump)) {
  console.error('Usage: node scripts/release.cjs [patch|minor|major]');
  process.exit(1);
}

execSync(`npm version ${bump}`, { stdio: 'inherit' });
console.log(`Version bumped: ${bump}`);
