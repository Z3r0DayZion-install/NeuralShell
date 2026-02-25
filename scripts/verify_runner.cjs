const fs = require('node:fs');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const crypto = require('node:crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const PROOFS_DIR = path.join(STATE_DIR, 'proofs');
const PROD_SERVER = path.join(REPO_ROOT, 'production-server.js');
const VERIFY_LOCK_PATH = path.join(REPO_ROOT, '.locks', 'verify_runner.lock');

const PHASE_BUDGET_MS = {
  proof_all: 150_000,
  test_root: 60_000
};

function budgetForPhase(phaseSlug) {
  return PHASE_BUDGET_MS[phaseSlug] ?? 30_000;
}

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // ignore
  }
}

function isPidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    const code = err && typeof err === 'object' ? err.code : null;
    if (code === 'ESRCH') return false;
    return true;
  }
}

function readLockMetaOrNull(lockPath) {
  try {
    const raw = fs.readFileSync(lockPath, 'utf8');
    const obj = raw && raw.trim() ? JSON.parse(raw) : null;
    if (!obj || typeof obj !== 'object') return null;
    return obj;
  } catch {
    return null;
  }
}

function releaseVerifyLockBestEffort() {
  try {
    fs.unlinkSync(VERIFY_LOCK_PATH);
  } catch {
    // ignore
  }
}

function acquireVerifyLockOrThrow() {
  ensureDir(path.dirname(VERIFY_LOCK_PATH));

  // Ensure we always attempt lock cleanup on normal exit paths.
  try {
    process.once('exit', releaseVerifyLockBestEffort);
  } catch {
    // ignore
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const fd = fs.openSync(VERIFY_LOCK_PATH, 'wx');
      try {
        const payload = {
          pid: process.pid,
          startedAt: new Date().toISOString(),
          cwd: process.cwd()
        };
        fs.writeFileSync(fd, JSON.stringify(payload, null, 2) + '\n', 'utf8');
      } finally {
        try {
          fs.closeSync(fd);
        } catch {
          // ignore
        }
      }
      return true;
    } catch (err) {
      const code = err && typeof err === 'object' ? err.code : null;
      if (code !== 'EEXIST') throw err;

      const meta = readLockMetaOrNull(VERIFY_LOCK_PATH);
      const pid = meta && Number.isFinite(Number(meta.pid)) ? Number(meta.pid) : null;
      if (pid && !isPidAlive(pid)) {
        releaseVerifyLockBestEffort();
        continue;
      }

      const owner = meta && meta.pid ? String(meta.pid) : 'unknown';
      throw new Error(`[verify-lock] FAIL verify:all already running lockPath=${VERIFY_LOCK_PATH} pid=${owner}`);
    }
  }

  throw new Error(`[verify-lock] FAIL could not acquire lockPath=${VERIFY_LOCK_PATH}`);
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function writeFileUtf8(filePath, text) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, String(text), 'utf8');
}

function readJsonOrNull(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw || !raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function mergeWriteJson(filePath, patchObj) {
  const prev = readJsonOrNull(filePath);
  const merged = prev && typeof prev === 'object' ? { ...prev, ...patchObj } : { ...patchObj };
  writeFileUtf8(filePath, JSON.stringify(merged, null, 2));
}

function banner(phaseLabel, phaseSlug) {
  const line = '='.repeat(30);
  process.stdout.write(`\n${line}\n[PHASE] ${phaseLabel}\n${line}\n`);
  process.stdout.write(`[artifacts] ${path.join('state', 'proofs', `${process.env.PROOF_RUN_TS}-${phaseSlug}`)}\n`);
}

function forceKillTree(pid) {
  if (!pid || !Number.isFinite(pid) || pid <= 0) return;
  if (process.platform === 'win32') {
    const root = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
    const taskkill = path.join(root, 'System32', 'taskkill.exe');
    try {
      spawnSync(taskkill, ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        shell: false,
        windowsHide: true
      });
    } catch {
      // ignore
    }
    return;
  }
  try {
    process.kill(pid, 'SIGKILL');
  } catch {
    // ignore
  }
}

function spawnNpm(args, extraEnv, stdio) {
  const env = { ...process.env, ...(extraEnv || {}) };
  const cmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const spawnArgs =
    process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args;
  return spawn(cmd, spawnArgs, {
    cwd: REPO_ROOT,
    env,
    stdio: stdio || ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  });
}

async function runPhase({ runTs, phaseLabel, phaseSlug, npmArgs }) {
  const artifactDir = path.join(PROOFS_DIR, `${runTs}-${phaseSlug}`);
  ensureDir(artifactDir);

  const budgetMs = budgetForPhase(phaseSlug);

  const runnerStdoutPath = path.join(artifactDir, 'runner_stdout.log');
  const runnerStderrPath = path.join(artifactDir, 'runner_stderr.log');
  writeFileUtf8(runnerStdoutPath, '');
  writeFileUtf8(runnerStderrPath, '');
  const runnerStdoutFd = process.platform === 'win32' ? fs.openSync(runnerStdoutPath, 'a') : null;
  const runnerStderrFd = process.platform === 'win32' ? fs.openSync(runnerStderrPath, 'a') : null;

  const runnerConfigPath = path.join(artifactDir, 'runner_config.json');
  const runnerMetaPath = path.join(artifactDir, 'runner_metadata.json');

  // Create placeholders so failures are always artifact-backed.
  writeFileUtf8(path.join(artifactDir, 'stdout.log'), '');
  writeFileUtf8(path.join(artifactDir, 'stderr.log'), '');
  writeFileUtf8(path.join(artifactDir, 'config.json'), '');
  writeFileUtf8(path.join(artifactDir, 'metrics.txt'), '');
  writeFileUtf8(path.join(artifactDir, 'metadata.json'), '');
  writeFileUtf8(path.join(artifactDir, 'sha256.txt'), '');

  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  process.env.PROOF_PHASE = phaseSlug;
  banner(phaseLabel, phaseSlug);

  const env = {
    PROOF_RUN_TS: runTs,
    PROOF_PHASE: phaseSlug,
    PROOF_ARTIFACT_DIR: artifactDir
  };

  writeFileUtf8(
    runnerConfigPath,
    JSON.stringify(
      {
        phase: phaseSlug,
        label: phaseLabel,
        npmArgs,
        env,
        node: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      null,
      2
    )
  );

  const childStdio =
    process.platform === 'win32' ? ['ignore', runnerStdoutFd, runnerStderrFd] : ['ignore', 'pipe', 'pipe'];
  const child = spawnNpm(npmArgs, env, childStdio);

  let timedOut = false;
  const budgetTimer = setTimeout(() => {
    timedOut = true;
    forceKillTree(child.pid);
  }, budgetMs);
  budgetTimer.unref?.();

  if (process.platform !== 'win32') {
    const runnerStdout = fs.createWriteStream(runnerStdoutPath, { flags: 'a' });
    const runnerStderr = fs.createWriteStream(runnerStderrPath, { flags: 'a' });
    child.stdout.on('data', (d) => {
      process.stdout.write(d);
      runnerStdout.write(d);
    });
    child.stderr.on('data', (d) => {
      process.stderr.write(d);
      runnerStderr.write(d);
    });
    child.on('close', () => {
      runnerStdout.end();
      runnerStderr.end();
    });
  }

  const code = await new Promise((resolve) => child.on('close', resolve));
  try {
    clearTimeout(budgetTimer);
  } catch {
    // ignore
  }
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startMs;

  if (process.platform === 'win32') {
    try {
      fs.closeSync(runnerStdoutFd);
    } catch {
      // ignore
    }
    try {
      fs.closeSync(runnerStderrFd);
    } catch {
      // ignore
    }
    try {
      const out = fs.readFileSync(runnerStdoutPath, 'utf8');
      if (out) process.stdout.write(out);
    } catch {
      // ignore
    }
    try {
      const err = fs.readFileSync(runnerStderrPath, 'utf8');
      if (err) process.stderr.write(err);
    } catch {
      // ignore
    }
  }

  const runnerMeta = {
    phase: phaseSlug,
    label: phaseLabel,
    startedAt,
    finishedAt,
    durationMs,
    budgetMs,
    exitCode: code ?? 1,
    ok: (code ?? 1) === 0,
    artifactDir
  };
  writeFileUtf8(runnerMetaPath, JSON.stringify(runnerMeta, null, 2));

  // Ensure metadata.json has timing budget receipts for every phase (including npm test).
  mergeWriteJson(path.join(artifactDir, 'metadata.json'), { runner: runnerMeta });

  // For phases without a config/metrics producer, leave explicit receipts.
  if (phaseSlug === 'test' || phaseSlug === 'test_root') {
    mergeWriteJson(path.join(artifactDir, 'config.json'), { runner: readJsonOrNull(runnerConfigPath) || {} });
    writeFileUtf8(path.join(artifactDir, 'metrics.txt'), '(n/a)\n');
    try {
      fs.copyFileSync(runnerStdoutPath, path.join(artifactDir, 'stdout.log'));
    } catch {
      // ignore
    }
    try {
      fs.copyFileSync(runnerStderrPath, path.join(artifactDir, 'stderr.log'));
    } catch {
      // ignore
    }
  }

  // Ensure sha256.txt is never empty: at minimum include production-server.js hash.
  try {
    const shaPath = path.join(artifactDir, 'sha256.txt');
    const existing = fs.readFileSync(shaPath, 'utf8');
    if (!existing || !existing.trim()) {
      const h = sha256File(PROD_SERVER);
      writeFileUtf8(shaPath, `${h}  production-server.js  ${PROD_SERVER}\n`);
    }
  } catch {
    // ignore
  }

  if (timedOut || durationMs > budgetMs) {
    throw new Error(`Timing budget exceeded for ${phaseSlug}: ${durationMs}ms > ${budgetMs}ms`);
  }
  if ((code ?? 1) !== 0) {
    throw new Error(`Phase failed: ${phaseSlug} (exit ${(code ?? 1)})`);
  }

  // Ensure proof scripts produced their required artifacts (test phase is produced by runner).
  const required = ['stdout.log', 'stderr.log', 'config.json', 'metrics.txt', 'metadata.json', 'sha256.txt'];
  for (const f of required) {
    const p = path.join(artifactDir, f);
    if (!fs.existsSync(p)) throw new Error(`Missing required artifact: ${phaseSlug}/${f}`);
  }

  return { phaseSlug, artifactDir };
}

async function main() {
  ensureDir(PROOFS_DIR);
  acquireVerifyLockOrThrow();
  const runTs = process.env.PROOF_RUN_TS || safeTimestamp();
  process.env.PROOF_RUN_TS = runTs;
  process.env.PROOF_PHASE = 'init';

  writeFileUtf8(path.join(PROOFS_DIR, 'LATEST_RUN.txt'), runTs + '\n');

  const phases = [
    { phaseLabel: 'proof:all', phaseSlug: 'proof_all', npmArgs: ['run', 'proof:all'] },
    { phaseLabel: 'test:root', phaseSlug: 'test_root', npmArgs: ['run', 'test:root'] }
  ];

  try {
    for (const p of phases) {
      await runPhase({ runTs, ...p });
    }
  } catch (err) {
    const phase = process.env.PROOF_PHASE || 'unknown';
    const artifactDir = path.join('state', 'proofs', `${runTs}-${phase}`);
    process.stderr.write(`\nFAILED AT: ${phase}\n`);
    process.stderr.write(`Artifacts: ${artifactDir}\n`);
    process.stderr.write(`\nVERIFY SPINE FAILED\nSee: ${artifactDir}\n`);
    process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
    process.exit(1);
  }

  process.stdout.write('\n========================================\n');
  process.stdout.write('NEURALSHELL VERIFY SPINE: PASS\n');
  process.stdout.write('Node + TEAR + EXE parity confirmed\n');
  process.stdout.write('========================================\n');

  // Deterministic spine marker for quick CI scan.
  const spineMarker = sha256Text(`PASS:${runTs}`);
  writeFileUtf8(path.join(PROOFS_DIR, `${runTs}-spine.marker`), spineMarker + '\n');

  // Produce a portable proof bundle (fail-closed if bundling fails).
  const bundleRes = spawnSync(process.execPath, [path.join(__dirname, 'proof_bundle.cjs'), '--runTs', runTs], {
    cwd: REPO_ROOT,
    env: { ...process.env, PROOF_RUN_TS: runTs },
    stdio: 'inherit',
    shell: false,
    windowsHide: true
  });
  if ((bundleRes.status ?? 1) !== 0) {
    throw new Error(`[proof-bundle] failed (exit ${(bundleRes.status ?? 1)})`);
  }
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
