const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function movePath(src, dst) {
  ensureDir(path.dirname(dst));
  try {
    fs.renameSync(src, dst);
    return { ok: true, method: 'rename' };
  } catch (err) {
    // Fallback: copy + delete
    try {
      if (isDir(src)) {
        fs.cpSync(src, dst, { recursive: true, force: true, errorOnExist: false });
        fs.rmSync(src, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
      } else {
        fs.copyFileSync(src, dst);
        fs.rmSync(src, { force: true, maxRetries: 6, retryDelay: 50 });
      }
      return { ok: true, method: 'copy+rm' };
    } catch (err2) {
      return { ok: false, err: err2 || err };
    }
  }
}

function main() {
  const ts = safeTimestamp();
  const archiveRoot = path.join(REPO_ROOT, 'local', 'archive', ts);
  ensureDir(archiveRoot);

  const rootEntries = fs.readdirSync(REPO_ROOT, { withFileTypes: true }).map((e) => e.name);
  const percentGarbage = rootEntries.filter((n) => /^%.*%$/.test(n));

  const targets = [
    ...percentGarbage,
    'empty_state_transcript.log',
    'cleanup_project_run.log',
    'local_diff_unused.patch',
    'local_diff_unused2.patch',
    'server.pid',
    'tsconfig.tsbuildinfo',
    'demo-output.txt',
    'full-test-output.txt',
    'metrics-test-output.txt',
    'test-output.txt',
    'RUNTIME-PROOF-FAILED.txt'
  ];

  const uniqueTargets = Array.from(new Set(targets));

  console.log(`[cleanup] repo: ${REPO_ROOT}`);
  console.log(`[cleanup] archive: ${archiveRoot}`);
  console.log(`[cleanup] candidates: ${uniqueTargets.length}`);

  let moved = 0;
  let failed = 0;

  for (const name of uniqueTargets) {
    const src = path.join(REPO_ROOT, name);
    if (!exists(src)) {
      continue;
    }
    const dst = path.join(archiveRoot, name);
    const r = movePath(src, dst);
    if (r.ok) {
      moved += 1;
      console.log(`[cleanup] MOVED (${r.method}): ${name} -> local/archive/${ts}/${name}`);
    } else {
      failed += 1;
      console.error(`[cleanup] FAILED: ${name}`);
      console.error(r.err && r.err.stack ? r.err.stack : String(r.err));
    }
  }

  console.log(`[cleanup] moved=${moved} failed=${failed}`);
  return failed ? 1 : 0;
}

process.exit(main());
