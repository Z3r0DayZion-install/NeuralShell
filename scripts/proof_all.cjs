const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const PROOFS_DIR = path.join(STATE_DIR, 'proofs');
const PROOF_DIR = path.join(REPO_ROOT, 'proof');
const RUNS_DIR = path.join(PROOF_DIR, 'runs');
const LATEST_DIR = path.join(PROOF_DIR, 'latest');

function ensureDir(p) {
  try {
    fs.mkdirSync(p, { recursive: true });
  } catch {
    // ignore
  }
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function rmForce(p) {
  try {
    fs.rmSync(p, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
  } catch {
    // ignore
  }
}

function banner(label) {
  const line = '='.repeat(30);
  process.stdout.write(`\n${line}\n[PHASE] ${label}\n${line}\n`);
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function spawnNpm(args, extraEnv) {
  const env = { ...process.env, ...(extraEnv || {}) };
  const cmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const spawnArgs =
    process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args;
  return spawn(cmd, spawnArgs, {
    cwd: REPO_ROOT,
    env,
    stdio: 'inherit',
    shell: false,
    windowsHide: true
  });
}

async function runNpm(label, npmArgs, env) {
  banner(label);
  const child = spawnNpm(npmArgs, env);
  const code = await new Promise((resolve) => child.on('close', resolve));
  if ((code ?? 1) !== 0) {
    throw new Error(`FAILED AT: ${label} (exit ${code ?? 1})`);
  }
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

function readJsonOrNull(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function verifyPreviousManifestOrThrow() {
  const manifestPath = path.join(LATEST_DIR, 'proof-manifest.json');
  const manifest = readJsonOrNull(manifestPath);
  if (!manifest) {
    process.stdout.write('[proof] no previous manifest\n');
    return;
  }

  // v1 manifest (runDir + relpath map)
  if (manifest.schemaVersion === 'proof_manifest.v1') {
    const runDir = manifest.runDir;
    if (!runDir || typeof runDir !== 'string' || !fs.existsSync(runDir)) {
      throw new Error('[proof] artifact hash mismatch detected');
    }
    const artifacts = manifest.artifacts && typeof manifest.artifacts === 'object' ? manifest.artifacts : null;
    if (!artifacts) throw new Error('[proof] artifact hash mismatch detected');

    for (const [rel, meta] of Object.entries(artifacts)) {
      const expected = meta && typeof meta === 'object' ? meta.sha256 : null;
      if (!expected || typeof expected !== 'string') continue;
      const abs = path.join(runDir, rel);
      if (!fs.existsSync(abs)) {
        process.stderr.write('[proof] artifact hash mismatch detected\n');
        process.stderr.write(`[proof] missing: ${rel}\n`);
        process.exit(1);
      }
      const actual = sha256File(abs);
      if (actual !== expected) {
        process.stderr.write('[proof] artifact hash mismatch detected\n');
        process.stderr.write(`[proof] mismatch: ${rel}\n`);
        process.stderr.write(`expected: ${expected}\n`);
        process.stderr.write(`actual:   ${actual}\n`);
        process.exit(1);
      }
    }
    process.stdout.write('[proof] manifest verification: PASS\n');
    return;
  }

  // Legacy manifest (absolute paths)
  if (manifest.algo === 'sha256' && Array.isArray(manifest.entries)) {
    for (const e of manifest.entries) {
      if (!e || typeof e !== 'object') continue;
      if (e.exists !== true) continue;
      if (!e.path || typeof e.path !== 'string') continue;
      if (!e.sha256 || typeof e.sha256 !== 'string') continue;
      if (!fs.existsSync(e.path)) {
        process.stderr.write('[proof] artifact hash mismatch detected\n');
        process.stderr.write(`[proof] missing: ${e.name || e.path}\n`);
        process.exit(1);
      }
      const actual = sha256File(e.path);
      if (actual !== e.sha256) {
        process.stderr.write('[proof] artifact hash mismatch detected\n');
        process.stderr.write(`[proof] mismatch: ${e.name || e.path}\n`);
        process.stderr.write(`expected: ${e.sha256}\n`);
        process.stderr.write(`actual:   ${actual}\n`);
        process.exit(1);
      }
    }
    process.stdout.write('[proof] legacy manifest verification: PASS\n');
    return;
  }

  throw new Error('[proof] artifact hash mismatch detected');
}

function mustExist(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[proof] missing required artifact: ${label || filePath}`);
  }
}

function writeManifest({ runDir, runTs, startedAt, finishedAt }) {
  const files = listFilesRecursive(runDir)
    .map((p) => path.relative(runDir, p).replace(/\\/g, '/'))
    .filter((rel) => rel !== 'proof-manifest.json')
    .sort();

  const artifacts = {};
  for (const rel of files) {
    const abs = path.join(runDir, rel);
    const st = fs.statSync(abs);
    artifacts[rel] = {
      sha256: sha256File(abs),
      bytes: st.size
    };
  }

  const manifest = {
    schemaVersion: 'proof_manifest.v1',
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    runDir,
    runTs,
    startedAt,
    finishedAt,
    artifacts
  };

  fs.writeFileSync(path.join(runDir, 'proof-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  ensureDir(LATEST_DIR);
  fs.writeFileSync(path.join(LATEST_DIR, 'proof-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(
    path.join(LATEST_DIR, 'run-pointer.json'),
    JSON.stringify(
      {
        runDir,
        runTs,
        updatedAt: new Date().toISOString(),
        manifestPath: path.join(runDir, 'proof-manifest.json')
      },
      null,
      2
    ),
    'utf8'
  );
}

async function main() {
  if (process.env.PROOF_FORCE_FAIL === '1') {
    throw new Error('[proof] forced failure');
  }

  verifyPreviousManifestOrThrow();

  const runTs = process.env.PROOF_RUN_TS || safeTimestamp();
  process.env.PROOF_RUN_TS = runTs;
  process.env.PROOF_ORCHESTRATED = '1';

  if (process.platform !== 'win32') {
    throw new Error('[proof] shipped-artifact proof gate requires win32 (TEAR + EXE)');
  }

  // Cold start: wipe runtime state before proofs.
  // If running under the verify spine (e.g. npm test inside scripts/verify_runner.cjs),
  // do NOT delete state/ because it would erase in-progress artifact bundles.
  const underSpine =
    process.env.PROOF_PHASE === 'test' || Boolean(process.env.PROOF_ARTIFACT_DIR);
  if (!underSpine) {
    rmForce(STATE_DIR);
  }
  ensureDir(PROOFS_DIR);

  const startedAt = new Date().toISOString();

  await runNpm('proof:spawn', ['run', 'proof:spawn'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'spawn',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-spawn`),
    PROOF_ORCHESTRATED: '1'
  });

  await runNpm('proof:runtime', ['run', 'proof:runtime'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'runtime',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-runtime`),
    PROOF_ORCHESTRATED: '1'
  });

  await runNpm('proof:tear', ['run', 'proof:tear'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'tear',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-tear`),
    PROOF_ORCHESTRATED: '1'
  });

  await runNpm('proof:exe', ['run', 'proof:exe'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'exe',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-exe`),
    PROOF_ORCHESTRATED: '1'
  });

  const finishedAt = new Date().toISOString();

  // Proof output directories
  const spawnDir = path.join(PROOFS_DIR, `${runTs}-spawn`);
  const runtimeDir = path.join(PROOFS_DIR, `${runTs}-runtime`);
  const tearDir = path.join(PROOFS_DIR, `${runTs}-tear`);
  const exeDir = path.join(PROOFS_DIR, `${runTs}-exe`);

  // Required core artifacts must exist.
  mustExist(path.join(spawnDir, 'server.log'), 'spawn/server.log');
  mustExist(path.join(runtimeDir, 'server.log'), 'runtime/server.log');
  mustExist(path.join(tearDir, 'server.log'), 'tear/server.log');
  mustExist(path.join(exeDir, 'server.log'), 'exe/server.log');
  mustExist(path.join(spawnDir, 'metadata.json'), 'spawn/metadata.json');
  mustExist(path.join(runtimeDir, 'metadata.json'), 'runtime/metadata.json');
  mustExist(path.join(tearDir, 'metadata.json'), 'tear/metadata.json');
  mustExist(path.join(exeDir, 'metadata.json'), 'exe/metadata.json');

  // Gate 1: cold start must be purged (no spine exceptions).
  const runtimeMeta = readJsonOrNull(path.join(runtimeDir, 'metadata.json'));
  const purged = Boolean(runtimeMeta && runtimeMeta.coldStart && runtimeMeta.coldStart.purged === true);
  if (!purged) {
    throw new Error('[proof] cold start purge not executed (runtime metadata coldStart.purged !== true)');
  }

  // Copy into proof/runs/<runTs> bundle
  const runDir = path.join(RUNS_DIR, runTs);
  rmForce(runDir);
  ensureDir(runDir);
  ensureDir(RUNS_DIR);
  fs.cpSync(spawnDir, path.join(runDir, 'spawn'), { recursive: true, force: true });
  fs.cpSync(runtimeDir, path.join(runDir, 'runtime'), { recursive: true, force: true });
  fs.cpSync(tearDir, path.join(runDir, 'tear'), { recursive: true, force: true });
  fs.cpSync(exeDir, path.join(runDir, 'exe'), { recursive: true, force: true });
  fs.writeFileSync(
    path.join(runDir, 'summary.json'),
    JSON.stringify(
      {
        runTs,
        startedAt,
        finishedAt,
        node: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        stateDirs: { spawnDir, runtimeDir, tearDir, exeDir }
      },
      null,
      2
    ),
    'utf8'
  );

  writeManifest({ runDir, runTs, startedAt, finishedAt });
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
