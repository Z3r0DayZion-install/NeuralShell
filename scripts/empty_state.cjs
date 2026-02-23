const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');

function rmForce(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
    return { ok: true };
  } catch (err) {
    return { ok: false, err };
  }
}

function main() {
  if (!fs.existsSync(STATE_DIR)) {
    console.log(`[empty-state] state dir missing; nothing to do: ${STATE_DIR}`);
    return 0;
  }

  const entries = fs.readdirSync(STATE_DIR, { withFileTypes: true });
  const targets = entries
    .map((e) => e.name)
    .filter((name) => name !== '.gitkeep');

  console.log(`[empty-state] state dir: ${STATE_DIR}`);
  console.log(`[empty-state] deleting ${targets.length} entries`);

  let failed = 0;
  for (const name of targets) {
    const p = path.join(STATE_DIR, name);
    const r = rmForce(p);
    if (!r.ok) {
      failed += 1;
      console.error(`[empty-state] FAILED: ${p}`);
      console.error(r.err && r.err.stack ? r.err.stack : String(r.err));
    }
  }

  const remaining = fs.readdirSync(STATE_DIR, { withFileTypes: true }).map((e) => e.name);
  console.log(`[empty-state] remaining entries: ${remaining.length}`);
  for (const name of remaining) console.log(`- ${name}`);

  if (failed) {
    console.error(`[empty-state] done with failures=${failed}`);
    return 1;
  }
  console.log('[empty-state] done');
  return 0;
}

process.exit(main());

