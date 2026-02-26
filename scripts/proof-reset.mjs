import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const TARGETS = [
  path.join(ROOT, 'proof', 'latest', 'proof-manifest.json'),
  path.join(ROOT, 'proof', 'latest', 'runtime'),
  path.join(ROOT, 'proof', 'latest', 'spawn')
];

function rmForce(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
    return true;
  } catch {
    return false;
  }
}

let removed = 0;
for (const t of TARGETS) {
  if (fs.existsSync(t)) {
    if (rmForce(t)) {
      console.log(`[proof:reset] removed ${path.relative(ROOT, t)}`);
      removed += 1;
    } else {
      console.log(`[proof:reset] failed ${path.relative(ROOT, t)}`);
      process.exitCode = 1;
    }
  } else {
    console.log(`[proof:reset] missing ${path.relative(ROOT, t)}`);
  }
}

if (removed === 0) {
  console.log('[proof:reset] nothing to do');
} else {
  console.log('[proof:reset] done');
}
