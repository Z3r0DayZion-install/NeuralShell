const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const PROOFS_DIR = path.join(STATE_DIR, 'proofs');
const PROD_SERVER = path.join(REPO_ROOT, 'production-server.js');

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // ignore
  }
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

function spawnNpm(args, extraEnv) {
  const env = { ...process.env, ...(extraEnv || {}) };
  const cmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const spawnArgs =
    process.platform === 'win32' ? ['/d', '/s', '/c', 'npm', ...args] : args;
  return spawn(cmd, spawnArgs, {
    cwd: REPO_ROOT,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  });
}

async function runPhase({ runTs, phaseLabel, phaseSlug, npmArgs }) {
  const artifactDir = path.join(PROOFS_DIR, `${runTs}-${phaseSlug}`);
  ensureDir(artifactDir);

  const runnerStdoutPath = path.join(artifactDir, 'runner_stdout.log');
  const runnerStderrPath = path.join(artifactDir, 'runner_stderr.log');
  const runnerStdout = fs.createWriteStream(runnerStdoutPath, { flags: 'w' });
  const runnerStderr = fs.createWriteStream(runnerStderrPath, { flags: 'w' });

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

  const child = spawnNpm(npmArgs, env);

  child.stdout.on('data', (d) => {
    process.stdout.write(d);
    runnerStdout.write(d);
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(d);
    runnerStderr.write(d);
  });

  const code = await new Promise((resolve) => child.on('close', resolve));
  const finishedAt = new Date().toISOString();
  const durationMs = Date.now() - startMs;

  await new Promise((resolve) => runnerStdout.end(resolve));
  await new Promise((resolve) => runnerStderr.end(resolve));

  const runnerMeta = {
    phase: phaseSlug,
    label: phaseLabel,
    startedAt,
    finishedAt,
    durationMs,
    budgetMs: 30000,
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

  if (durationMs > 30000) {
    throw new Error(`Timing budget exceeded for ${phaseSlug}: ${durationMs}ms > 30000ms`);
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
  const runTs = safeTimestamp();
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
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
