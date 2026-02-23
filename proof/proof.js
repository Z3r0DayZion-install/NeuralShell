import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, '..');
const PROOF_DIR = path.join(REPO_ROOT, 'proof');
const RUNS_DIR = path.join(PROOF_DIR, 'runs');
const LATEST_DIR = path.join(PROOF_DIR, 'latest');
const LEDGER_PATH = path.join(PROOF_DIR, 'ledger.jsonl');

const STATE_DIR = path.join(REPO_ROOT, 'state');
const VERIFY_SCRIPT = path.join(REPO_ROOT, 'scripts', 'verify_runner.cjs');
const CLEANUP_SCRIPT = path.join(REPO_ROOT, 'scripts', 'cleanup_project.cjs');
const EMPTY_STATE_SCRIPT = path.join(REPO_ROOT, 'scripts', 'empty_state.cjs');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function rmForce(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
  } catch {
    // ignore
  }
}

function copyFileIfExists(src, dst) {
  try {
    if (!exists(src)) return false;
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
    return true;
  } catch {
    return false;
  }
}

function copyDirIfExists(srcDir, dstDir) {
  if (!exists(srcDir)) return false;
  ensureDir(dstDir);
  try {
    fs.cpSync(srcDir, dstDir, { recursive: true, force: true, errorOnExist: false });
    return true;
  } catch {
    return false;
  }
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function listFilesRecursive(dirPath) {
  const out = [];
  const stack = [dirPath];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) out.push(full);
    }
  }
  return out;
}

function sha256RunBundle({ runDir, excludeBasenames }) {
  const files = listFilesRecursive(runDir)
    .filter((p) => !(excludeBasenames || []).includes(path.basename(p)))
    .map((p) => path.relative(runDir, p).replace(/\\/g, '/'))
    .sort();

  const h = crypto.createHash('sha256');
  for (const rel of files) {
    const full = path.join(runDir, rel);
    const fh = sha256File(full);
    h.update(rel, 'utf8');
    h.update('\n', 'utf8');
    h.update(fh, 'utf8');
    h.update('\n', 'utf8');
  }
  return h.digest('hex');
}

async function runNodeScript(scriptPath, args, outPath) {
  ensureDir(path.dirname(outPath));
  const out = fs.createWriteStream(outPath, { flags: 'w' });
  const child = spawn(process.execPath, [scriptPath, ...(args || [])], {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  });
  child.stdout.on('data', (d) => {
    process.stdout.write(d);
    out.write(d);
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(d);
    out.write(d);
  });
  const code = await new Promise((resolve) => child.on('close', resolve));
  await new Promise((resolve) => out.end(resolve));
  return code ?? 1;
}

function writeLatestPointer(latestRunDir) {
  ensureDir(LATEST_DIR);
  fs.writeFileSync(path.join(LATEST_DIR, 'LATEST_RUN.txt'), latestRunDir + '\n', 'utf8');
}

function appendLedger(entry) {
  ensureDir(PROOF_DIR);
  fs.appendFileSync(LEDGER_PATH, JSON.stringify(entry) + '\n', 'utf8');
}

async function main() {
  ensureDir(RUNS_DIR);
  ensureDir(LATEST_DIR);

  const ts = safeTimestamp();
  const runDir = path.join(RUNS_DIR, ts);
  ensureDir(runDir);

  const cleanupLog = path.join(runDir, 'cleanup.log');
  const verifyLog = path.join(runDir, 'verify_all.log');

  const startedAt = new Date().toISOString();

  // 1) Clean obvious garbage from repo root (archive only; never deletes without archiving).
  if (exists(CLEANUP_SCRIPT)) {
    await runNodeScript(CLEANUP_SCRIPT, [], cleanupLog);
  } else {
    fs.writeFileSync(cleanupLog, '(cleanup_project.cjs missing)\n', 'utf8');
  }

  // 2) Run the real verify spine (tests + proof:spawn/runtime/tear/exe).
  const exitCode = await runNodeScript(VERIFY_SCRIPT, [], verifyLog);

  // 3) Copy proof artifacts out of state/ into this run bundle.
  const copied = {
    stateProofs: copyDirIfExists(path.join(STATE_DIR, 'proofs'), path.join(runDir, 'state_proofs'))
  };

  // 4) Update proof/latest/ to point at/copy the newest run.
  writeLatestPointer(runDir);
  rmForce(path.join(LATEST_DIR, 'run'));
  try {
    fs.cpSync(runDir, path.join(LATEST_DIR, 'run'), { recursive: true, force: true, errorOnExist: false });
  } catch {
    // ignore
  }

  const finishedAt = new Date().toISOString();
  const summary = {
    ts,
    startedAt,
    finishedAt,
    exitCode,
    ok: exitCode === 0,
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    runDir,
    copied
  };

  fs.writeFileSync(path.join(runDir, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8');
  fs.copyFileSync(path.join(runDir, 'summary.json'), path.join(LATEST_DIR, 'summary.json'));

  const summarySha256 = sha256File(path.join(runDir, 'summary.json'));
  const bundleSha256 = sha256RunBundle({
    runDir,
    excludeBasenames: ['bundle_sha256.txt', 'summary_sha256.txt']
  });
  fs.writeFileSync(path.join(runDir, 'summary_sha256.txt'), summarySha256 + '\n', 'utf8');
  fs.writeFileSync(path.join(runDir, 'bundle_sha256.txt'), bundleSha256 + '\n', 'utf8');

  appendLedger({ ...summary, summarySha256, bundleSha256 });

  // 5) Keep state/ empty by default (artifacts are preserved under proof/).
  // Set PROOF_KEEP_STATE=1 to keep state/ intact.
  if (process.env.PROOF_KEEP_STATE !== '1' && exists(EMPTY_STATE_SCRIPT)) {
    await runNodeScript(EMPTY_STATE_SCRIPT, [], path.join(runDir, 'empty_state.log'));
  }

  process.stdout.write(`\n[proof] runDir: ${runDir}\n`);
  process.stdout.write(`[proof] latest: ${path.join(LATEST_DIR, 'run')}\n`);
  process.stdout.write(`[proof] ok=${summary.ok} exitCode=${exitCode}\n`);
  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
