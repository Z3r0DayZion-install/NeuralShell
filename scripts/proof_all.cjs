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
const DESKTOP_ROOT = path.join(REPO_ROOT, 'NeuralShell_Desktop');
const TEAR_ENTRY = path.join(DESKTOP_ROOT, 'tear-runtime.js');
const EXE_PATH = path.join(DESKTOP_ROOT, 'dist', 'NeuralShell-TEAR-Runtime.exe');
const PROD_SERVER = path.join(REPO_ROOT, 'production-server.js');
const PROOF_MAX_MS = Number.isFinite(Number(process.env.PROOF_MAX_MS))
  ? Number(process.env.PROOF_MAX_MS)
  : 8000;
const PROOF_SOAK_SECONDS = Number.isFinite(Number(process.env.PROOF_SOAK_SECONDS))
  ? Number(process.env.PROOF_SOAK_SECONDS)
  : 60;

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
  const startMs = Date.now();
  const child = spawnNpm(npmArgs, env);
  const code = await new Promise((resolve) => child.on('close', resolve));
  const durationMs = Date.now() - startMs;
  if ((code ?? 1) !== 0) {
    throw new Error(`FAILED AT: ${label} (exit ${code ?? 1})`);
  }
  const maxMs = getPhaseBudgetMs(label);
  if (durationMs > maxMs) {
    throw new Error(`[proof-performance] exceeded budget ${label} durationMs=${durationMs} maxMs=${maxMs}`);
  }
  return { durationMs };
}

function getPhaseBudgetMs(label) {
  if (label === 'proof:exe') {
    if (PROOF_SOAK_SECONDS > 0) {
      // Soak is embedded in proof:exe; budget must accommodate.
      return Math.max(PROOF_MAX_MS, PROOF_SOAK_SECONDS * 1000 + 25000);
    }
    return PROOF_MAX_MS;
  }
  if (label === 'proof:crash') {
    return Math.max(PROOF_MAX_MS, 20000);
  }
  return PROOF_MAX_MS;
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
    process.stdout.write('[proof-integrity] BASELINE no previous manifest (executed target checks start next run)\n');
    return null;
  }

  // v1 manifest (runDir + relpath map)
  if (manifest.schemaVersion === 'proof_manifest.v1' || manifest.schemaVersion === 'proof_manifest.v2') {
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

    const executedTargets =
      manifest.executedTargets && typeof manifest.executedTargets === 'object' ? manifest.executedTargets : null;
    if (manifest.schemaVersion === 'proof_manifest.v2') {
      if (!executedTargets) {
        process.stderr.write('[proof-integrity] FAIL missing executedTargets in manifest\n');
        process.exit(1);
      }
      for (const [rel, meta] of Object.entries(executedTargets)) {
        if (!meta || typeof meta !== 'object') continue;
        const expected = meta.sha256;
        const abs = meta.absPath || path.join(REPO_ROOT, String(rel).replace(/\//g, path.sep));
        if (!expected || typeof expected !== 'string') continue;
        if (!abs || typeof abs !== 'string' || !fs.existsSync(abs)) {
          if (process.env.PROOF_ACCEPT_EXECUTED_TARGET_CHANGES === '1') {
            process.stdout.write('[proof-integrity] ACCEPT executed-target-missing\n');
            process.stdout.write(`[proof-integrity] target=${rel}\n`);
            continue;
          } else {
            process.stderr.write('[proof-integrity] FAIL executed-target-missing\n');
            process.stderr.write(`[proof-integrity] target=${rel}\n`);
            process.exit(1);
          }
        }
        const actual = sha256File(abs);
        if (actual !== expected) {
          if (process.env.PROOF_ACCEPT_EXECUTED_TARGET_CHANGES === '1') {
            process.stdout.write('[proof-integrity] ACCEPT executed-hash-mismatch\n');
            process.stdout.write(`[proof-integrity] target=${rel}\n`);
            process.stdout.write(`[proof-integrity] expected=${expected}\n`);
            process.stdout.write(`[proof-integrity] actual=${actual}\n`);
            continue;
          } else {
            process.stderr.write('[proof-integrity] FAIL executed-hash-mismatch\n');
            process.stderr.write(`[proof-integrity] target=${rel}\n`);
            process.stderr.write(`[proof-integrity] expected=${expected}\n`);
            process.stderr.write(`[proof-integrity] actual=${actual}\n`);
            process.exit(1);
          }
        }
      }
      process.stdout.write('[proof-integrity] PASS previous-executed-targets\n');
    } else {
      process.stdout.write('[proof-integrity] BASELINE previous manifest has no executedTargets\n');
    }

    process.stdout.write('[proof] manifest verification: PASS\n');
    return manifest;
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
    return manifest;
  }

  throw new Error('[proof] artifact hash mismatch detected');
}

function mustExist(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[proof] missing required artifact: ${label || filePath}`);
  }
}

function computeExecutedTargets() {
  const entries = [
    { rel: 'production-server.js', abs: PROD_SERVER, label: 'production-server.js' },
    { rel: 'NeuralShell_Desktop/tear-runtime.js', abs: TEAR_ENTRY, label: 'tear-runtime.js' },
    { rel: 'NeuralShell_Desktop/dist/NeuralShell-TEAR-Runtime.exe', abs: EXE_PATH, label: 'NeuralShell-TEAR-Runtime.exe' }
  ];
  const out = {};
  for (const e of entries) {
    if (!fs.existsSync(e.abs)) {
      throw new Error(`[proof-integrity] FAIL executed-target-missing target=${e.rel}`);
    }
    const st = fs.statSync(e.abs);
    out[e.rel] = { sha256: sha256File(e.abs), bytes: st.size, absPath: e.abs, label: e.label };
  }
  return out;
}

function verifyExecutedTargetOrThrow({ prevManifest, rel, abs, label }) {
  if (!prevManifest || prevManifest.schemaVersion !== 'proof_manifest.v2') {
    process.stdout.write(`[proof-integrity] BASELINE target=${label || rel} (no v2 manifest to compare)\n`);
    return;
  }
  const executedTargets =
    prevManifest.executedTargets && typeof prevManifest.executedTargets === 'object' ? prevManifest.executedTargets : null;
  if (!executedTargets) {
    process.stderr.write('[proof-integrity] FAIL missing executedTargets in manifest\n');
    process.exit(1);
  }
  const meta = executedTargets[rel];
  if (!meta || typeof meta !== 'object' || !meta.sha256) {
    process.stderr.write('[proof-integrity] FAIL executed-target-not-in-manifest\n');
    process.stderr.write(`[proof-integrity] target=${rel}\n`);
    process.exit(1);
  }
  const expected = meta.sha256;
  const actual = sha256File(abs);
  if (actual !== expected) {
    if (process.env.PROOF_ACCEPT_EXECUTED_TARGET_CHANGES === '1') {
      process.stdout.write('[proof-integrity] ACCEPT executed-hash-mismatch\n');
      process.stdout.write(`[proof-integrity] target=${rel}\n`);
      process.stdout.write(`[proof-integrity] expected=${expected}\n`);
      process.stdout.write(`[proof-integrity] actual=${actual}\n`);
      return;
    }
    process.stderr.write('[proof-integrity] FAIL executed-hash-mismatch\n');
    process.stderr.write(`[proof-integrity] target=${rel}\n`);
    process.stderr.write(`[proof-integrity] expected=${expected}\n`);
    process.stderr.write(`[proof-integrity] actual=${actual}\n`);
    process.exit(1);
  }
  process.stdout.write(`[proof-integrity] PASS target=${label || rel}\n`);
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
    schemaVersion: 'proof_manifest.v2',
    generatedAt: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    runDir,
    runTs,
    startedAt,
    finishedAt,
    executedTargets: computeExecutedTargets(),
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

  const prevManifest = verifyPreviousManifestOrThrow();

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
  const phaseDurationsMs = {};

  phaseDurationsMs['proof:spawn'] = (await runNpm('proof:spawn', ['run', 'proof:spawn'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'spawn',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-spawn`),
    PROOF_ORCHESTRATED: '1'
  })).durationMs;

  phaseDurationsMs['proof:runtime'] = (await runNpm('proof:runtime', ['run', 'proof:runtime'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'runtime',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-runtime`),
    PROOF_ORCHESTRATED: '1'
  })).durationMs;

  // Executed artifact integrity (pre-spawn)
  verifyExecutedTargetOrThrow({
    prevManifest,
    rel: 'NeuralShell_Desktop/tear-runtime.js',
    abs: TEAR_ENTRY,
    label: 'TEAR'
  });

  phaseDurationsMs['proof:tear'] = (await runNpm('proof:tear', ['run', 'proof:tear'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'tear',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-tear`),
    PROOF_ORCHESTRATED: '1'
  })).durationMs;

  verifyExecutedTargetOrThrow({
    prevManifest,
    rel: 'NeuralShell_Desktop/dist/NeuralShell-TEAR-Runtime.exe',
    abs: EXE_PATH,
    label: 'EXE'
  });

  phaseDurationsMs['proof:exe'] = (await runNpm('proof:exe', ['run', 'proof:exe'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'exe',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-exe`),
    PROOF_ORCHESTRATED: '1'
  })).durationMs;

  phaseDurationsMs['proof:crash'] = (await runNpm('proof:crash', ['run', 'proof:crash'], {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: 'crash',
    PROOF_ARTIFACT_DIR: path.join(PROOFS_DIR, `${runTs}-crash`),
    PROOF_ORCHESTRATED: '1'
  })).durationMs;

  const finishedAt = new Date().toISOString();

  // Proof output directories
  const spawnDir = path.join(PROOFS_DIR, `${runTs}-spawn`);
  const runtimeDir = path.join(PROOFS_DIR, `${runTs}-runtime`);
  const tearDir = path.join(PROOFS_DIR, `${runTs}-tear`);
  const exeDir = path.join(PROOFS_DIR, `${runTs}-exe`);
  const crashDir = path.join(PROOFS_DIR, `${runTs}-crash`);

  // Required core artifacts must exist.
  mustExist(path.join(spawnDir, 'server.log'), 'spawn/server.log');
  mustExist(path.join(runtimeDir, 'server.log'), 'runtime/server.log');
  mustExist(path.join(tearDir, 'server.log'), 'tear/server.log');
  mustExist(path.join(exeDir, 'server.log'), 'exe/server.log');
  mustExist(path.join(spawnDir, 'metadata.json'), 'spawn/metadata.json');
  mustExist(path.join(runtimeDir, 'metadata.json'), 'runtime/metadata.json');
  mustExist(path.join(tearDir, 'metadata.json'), 'tear/metadata.json');
  mustExist(path.join(exeDir, 'metadata.json'), 'exe/metadata.json');
  mustExist(path.join(crashDir, 'server.log'), 'crash/server.log');
  mustExist(path.join(crashDir, 'metadata.json'), 'crash/metadata.json');

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
  fs.cpSync(crashDir, path.join(runDir, 'crash'), { recursive: true, force: true });
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
        proofMaxMs: PROOF_MAX_MS,
        proofSoakSeconds: PROOF_SOAK_SECONDS,
        phaseDurationsMs,
        stateDirs: { spawnDir, runtimeDir, tearDir, exeDir, crashDir }
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
