const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  assertExactDelta,
  assertUnreachable,
  assertUptimeMonotonic,
  attachChildLogs,
  createArtifactDir,
  createTeeFile,
  createTranscript,
  ensureDir,
  fetchMetrics,
  httpRequest,
  parseMetricValue,
  safeTimestamp,
  sleep,
  spawnChild,
  stopChild,
  waitForListening,
  waitForMetricsReady,
  writeFileUtf8,
  writeSha256Txt
} = require('./_proof_lib.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const DESKTOP_ROOT = path.join(REPO_ROOT, 'NeuralShell_Desktop');
const EXE_PATH = path.join(DESKTOP_ROOT, 'dist', 'NeuralShell-TEAR-Runtime.exe');
const PROD_SERVER = path.join(REPO_ROOT, 'production-server.js');
const TEAR_ENTRY = path.join(DESKTOP_ROOT, 'tear-runtime.js');
const TEAR_RUNTIME_DIR = path.join(DESKTOP_ROOT, '.tear_runtime');
const MIN_UPTIME_DELTA = process.env.CI === 'true' ? 0.05 : 0.1;
const FORCE_FAIL = process.env.PROOF_FORCE_FAIL === '1';
const FORCE_EXE_FAIL = process.env.PROOF_FORCE_EXE_FAIL === '1';

const NUM_SUCCESS = 5;
const NUM_SUCCESS_DRY = 5;
const FAIL_COUNTS_AS_REQUEST = true;

function copyFileIfExists(srcPath, dstPath) {
  try {
    if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, dstPath);
  } catch {
    // ignore
  }
}

function readIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function writeMeta({ artifactDir, meta }) {
  if (!artifactDir) return;
  try {
    writeFileUtf8(path.join(artifactDir, 'meta.json'), JSON.stringify(meta, null, 2));
  } catch {
    // ignore
  }
}

function purgeRuntimeDirs({ meta }) {
  const deleted = [];
  const errors = [];

  try {
    if (fs.existsSync(STATE_DIR)) {
      const entries = fs.readdirSync(STATE_DIR, { withFileTypes: true });
      for (const e of entries) {
        if (e && e.name === 'proofs') continue;
        const p = path.join(STATE_DIR, e.name);
        try {
          fs.rmSync(p, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
          deleted.push(p);
        } catch (err) {
          errors.push({ path: p, error: String(err && err.message ? err.message : err) });
        }
      }
    }
  } catch (err) {
    errors.push({ path: STATE_DIR, error: String(err && err.message ? err.message : err) });
  }

  try {
    if (fs.existsSync(TEAR_RUNTIME_DIR)) {
      fs.rmSync(TEAR_RUNTIME_DIR, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
      deleted.push(TEAR_RUNTIME_DIR);
    }
  } catch (err) {
    errors.push({ path: TEAR_RUNTIME_DIR, error: String(err && err.message ? err.message : err) });
  }

  if (meta) {
    meta.coldStart = {
      purged: errors.length === 0,
      deletedPaths: deleted,
      targets: [STATE_DIR, TEAR_RUNTIME_DIR],
      errors
    };
  }

  if (errors.length) {
    const msg = [
      '[exe-proof] cold start purge failed',
      ...errors.map((e) => `- ${e.path}: ${e.error}`)
    ].join('\n');
    throw new Error(msg);
  }
}

async function buildExeIfMissing({ transcript }) {
  if (fs.existsSync(EXE_PATH)) return { built: false };
  const cmd = process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npm', '--prefix', DESKTOP_ROOT, 'run', 'build:tear:exe']
      : ['--prefix', DESKTOP_ROOT, 'run', 'build:tear:exe'];
  transcript.writeLine(`[exe-proof] EXE missing; building: ${cmd} ${args.join(' ')}`);
  const child = spawnChild({ cmd, args, cwd: REPO_ROOT, env: process.env });
  let out = '';
  child.stdout.on('data', (d) => {
    out += d.toString('utf8');
  });
  child.stderr.on('data', (d) => {
    out += d.toString('utf8');
  });
  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0) {
    throw new Error(`EXE build failed (exit ${code})\n${out}`);
  }
  if (!fs.existsSync(EXE_PATH)) {
    throw new Error(`EXE build reported success but file not found: ${EXE_PATH}`);
  }
  return { built: true };
}

async function runRequestBatch({ baseUrl, count }) {
  for (let i = 0; i < count; i += 1) {
    const res = await httpRequest({ url: `${baseUrl}/health`, timeoutMs: 1500 });
    assert.equal(res.status, 200, `GET /health expected 200, got ${res.status}`);
  }
}

async function forceFailure({ baseUrl }) {
  const res = await httpRequest({ url: `${baseUrl}/__proof/fail`, timeoutMs: 1500 });
  assert.equal(res.status, 500, `GET /__proof/fail expected 500, got ${res.status}`);
}

async function shutdown({ baseUrl }) {
  const res = await httpRequest({ url: `${baseUrl}/__proof/shutdown`, method: 'POST', timeoutMs: 1500 });
  assert.equal(res.status, 200, `POST /__proof/shutdown expected 200, got ${res.status}`);
}

function spawnExe({ runTag, dryRun, transcript, serverLog, stdoutLog, stderrLog, artifactDir, meta }) {
  if (!fs.existsSync(EXE_PATH)) throw new Error(`EXE not found: ${EXE_PATH}`);
  const runtimeDir = path.join(artifactDir, `runtime-${runTag}-${dryRun ? 'dry' : 'normal'}`);
  ensureDir(runtimeDir);
  const runtimeConfigPath = path.join(runtimeDir, 'proof-config.json');

  const env = {
    ...process.env,
    PROOF_MODE: '1',
    NS_DRY_RUN: dryRun ? '1' : '0',
    NS_TEAR_HOST: '127.0.0.1',
    NS_TEAR_PORT: '0',
    NS_RUNTIME_DIR: TEAR_RUNTIME_DIR,
    NS_LLM_HOST: process.env.NS_LLM_HOST || 'http://127.0.0.1:11434'
  };
  writeFileUtf8(runtimeConfigPath, JSON.stringify({ env, dryRun }, null, 2));
  if (artifactDir) {
    copyFileIfExists(runtimeConfigPath, path.join(artifactDir, `config-${dryRun ? 'dry' : 'normal'}.json`));
    if (!dryRun) copyFileIfExists(runtimeConfigPath, path.join(artifactDir, 'config.json'));
  }

  transcript.writeLine(`[exe-proof] spawn: ${EXE_PATH}`);
  transcript.writeLine(`[exe-proof] config: ${runtimeConfigPath}`);
  transcript.writeLine(`[exe-proof] env: PROOF_MODE=1 NS_DRY_RUN=${env.NS_DRY_RUN} NS_TEAR_PORT=0 NS_RUNTIME_DIR=${TEAR_RUNTIME_DIR}`);

  const child = spawnChild({ cmd: EXE_PATH, args: [], cwd: DESKTOP_ROOT, env });
  const attached = attachChildLogs({ child, tee: serverLog, stdoutTee: stdoutLog, stderrTee: stderrLog });

  if (meta) writeMeta({ artifactDir, meta });
  return { child, runtimeDir, runtimeConfigPath, attached };
}

async function runMode({ modeName, dryRun, transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta }) {
  const runTag = `${runTagBase}-${modeName}`;
  const proc = spawnExe({ runTag, dryRun, transcript, serverLog, stdoutLog, stderrLog, artifactDir, meta });
  const listening = await waitForListening({ getLines: proc.attached.getLines, timeoutMs: 20000 });
  const baseUrl = `http://127.0.0.1:${listening.port}`;
  if (meta) {
    meta.baseUrlByMode = meta.baseUrlByMode || {};
    meta.baseUrlByMode[modeName] = baseUrl;
    meta.portByMode = meta.portByMode || {};
    meta.portByMode[modeName] = listening.port;
    writeMeta({ artifactDir, meta });
  }

  transcript.writeLine(`[exe-proof] baseUrl: ${baseUrl}`);
  await waitForMetricsReady({ baseUrl, deadlineMs: 12000 });

  const uptimeRaw = await assertUptimeMonotonic({ baseUrl, minDeltaSeconds: MIN_UPTIME_DELTA });
  const uptime = { u1: uptimeRaw.u1, u2: uptimeRaw.u2, uptimeDelta: uptimeRaw.delta };

  const m0 = await fetchMetrics({ baseUrl });
  if (artifactDir) {
    try {
      writeFileUtf8(path.join(artifactDir, `metrics-baseline-${modeName}.txt`), m0.body);
      if (modeName === 'normal') writeFileUtf8(path.join(artifactDir, 'metrics_before.txt'), m0.body);
    } catch {
      // ignore
    }
  }
  const req0 = parseMetricValue(m0.body, 'neuralshell_requests_total');
  const fail0 = parseMetricValue(m0.body, 'neuralshell_failures_total');
  assert.ok(req0 !== null && fail0 !== null, 'missing counters in baseline metrics');
  const c0 = { requests: req0, failures: fail0 };
  await runRequestBatch({ baseUrl, count: dryRun ? NUM_SUCCESS_DRY : NUM_SUCCESS });
  await forceFailure({ baseUrl });
  const m1 = await fetchMetrics({ baseUrl });
  if (artifactDir) {
    try {
      writeFileUtf8(path.join(artifactDir, `metrics-after-${modeName}.txt`), m1.body);
      if (modeName === 'normal') writeFileUtf8(path.join(artifactDir, 'metrics_after.txt'), m1.body);
    } catch {
      // ignore
    }
  }
  const req1 = parseMetricValue(m1.body, 'neuralshell_requests_total');
  const fail1 = parseMetricValue(m1.body, 'neuralshell_failures_total');
  assert.ok(req1 !== null && fail1 !== null, 'missing counters in post metrics');
  const c1 = { requests: req1, failures: fail1 };

  const expectedRequestsDelta =
    (dryRun ? NUM_SUCCESS_DRY : NUM_SUCCESS) + (FAIL_COUNTS_AS_REQUEST ? 1 : 0);
  const expectedFailuresDelta = dryRun ? 0 : 1;

  const requestsDelta = assertExactDelta({
    name: `${modeName}: requests_total`,
    before: c0.requests,
    after: c1.requests,
    expectedDelta: expectedRequestsDelta
  });
  const failuresDelta = assertExactDelta({
    name: `${modeName}: failures_total`,
    before: c0.failures,
    after: c1.failures,
    expectedDelta: expectedFailuresDelta
  });

  await shutdown({ baseUrl });

  const exit = await new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), 8000);
    t.unref?.();
    proc.child.once('exit', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal });
    });
  });
  if (exit.code === null) {
    await stopChild({ child: proc.child, timeoutMs: 2500 });
    throw new Error(`${modeName}: shutdown timed out (no exit within 8000ms)`);
  }
  assert.equal(exit.code, 0, `${modeName}: exit code must be 0 on shutdown (signal=${exit.signal || 'none'})`);
  await stopChild({ child: proc.child, timeoutMs: 1500 });
  const down = await assertUnreachable({ url: `${baseUrl}/metrics`, deadlineMs: 4000 });
  try {
    fs.rmSync(proc.runtimeDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return {
    modeName,
    dryRun,
    port: listening.port,
    uptime,
    counters0: c0,
    counters1: c1,
    expectedRequestsDelta,
    expectedFailuresDelta,
    requestsDelta,
    failuresDelta,
    shutdownCheck: down.ok
  };
}

async function runRestartReset({ transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta }) {
  const runTag = `${runTagBase}-restart`;
  const proc = spawnExe({ runTag, dryRun: false, transcript, serverLog, stdoutLog, stderrLog, artifactDir, meta });
  const listening = await waitForListening({ getLines: proc.attached.getLines, timeoutMs: 20000 });
  const baseUrl = `http://127.0.0.1:${listening.port}`;
  if (artifactDir) copyFileIfExists(proc.runtimeConfigPath, path.join(artifactDir, 'config-restart.json'));
  if (meta) {
    meta.baseUrlByMode = meta.baseUrlByMode || {};
    meta.baseUrlByMode.restart = baseUrl;
    meta.portByMode = meta.portByMode || {};
    meta.portByMode.restart = listening.port;
    writeMeta({ artifactDir, meta });
  }

  transcript.writeLine(`[exe-proof] baseUrl: ${baseUrl}`);
  await waitForMetricsReady({ baseUrl, deadlineMs: 12000 });
  const m0 = await fetchMetrics({ baseUrl });
  if (artifactDir) {
    try {
      writeFileUtf8(path.join(artifactDir, `metrics-baseline-restart.txt`), m0.body);
    } catch {
      // ignore
    }
  }
  const req0 = parseMetricValue(m0.body, 'neuralshell_requests_total');
  const fail0 = parseMetricValue(m0.body, 'neuralshell_failures_total');
  assert.equal(req0, 0, `restart baseline requests_total must be 0, got ${req0}`);
  assert.equal(fail0, 0, `restart baseline failures_total must be 0, got ${fail0}`);
  const c0 = { requests: req0, failures: fail0 };

  await shutdown({ baseUrl });
  const exit = await new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), 8000);
    t.unref?.();
    proc.child.once('exit', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal });
    });
  });
  if (exit.code === null) {
    await stopChild({ child: proc.child, timeoutMs: 2500 });
    throw new Error(`restartReset: shutdown timed out (no exit within 8000ms)`);
  }
  assert.equal(exit.code, 0, `restartReset: exit code must be 0 on shutdown (signal=${exit.signal || 'none'})`);
  await stopChild({ child: proc.child, timeoutMs: 1500 });
  await assertUnreachable({ url: `${baseUrl}/metrics`, deadlineMs: 4000 });
  try {
    fs.rmSync(proc.runtimeDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return { restartReset: true, port: listening.port, baseline: c0 };
}

async function main() {
  const runTagBase = safeTimestamp();

  const artifactDir = createArtifactDir({ repoRoot: REPO_ROOT, tag: 'exe', runTagBase });

  const transcript = createTranscript({
    stampedPath: path.join(artifactDir, 'transcript.log')
  });
  const serverLog = createTeeFile({
    filePath: path.join(artifactDir, 'server.log')
  });
  const stdoutLog = createTeeFile({ filePath: path.join(artifactDir, 'stdout.log') });
  const stderrLog = createTeeFile({ filePath: path.join(artifactDir, 'stderr.log') });

  const meta = {
    ts: new Date().toISOString(),
    tag: 'exe',
    artifactDir,
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    exePath: EXE_PATH,
    tearRuntimeDir: TEAR_RUNTIME_DIR,
    minUptimeDelta: MIN_UPTIME_DELTA,
    forceFail: FORCE_FAIL,
    forceExeFail: FORCE_EXE_FAIL,
    baseUrlByMode: {},
    portByMode: {}
  };
  writeMeta({ artifactDir, meta });
  // Ensure artifact contract placeholders exist even if we fail before first metrics read.
  writeFileUtf8(path.join(artifactDir, 'metrics.txt'), '');
  writeFileUtf8(path.join(artifactDir, 'metadata.json'), '');
  writeFileUtf8(path.join(artifactDir, 'sha256.txt'), '');
  writeFileUtf8(path.join(artifactDir, 'config.json'), '');

  let config = {
    ts: new Date().toISOString(),
    minUptimeDelta: MIN_UPTIME_DELTA,
    numSuccess: NUM_SUCCESS,
    numSuccessDry: NUM_SUCCESS_DRY,
    failCountsAsRequest: FAIL_COUNTS_AS_REQUEST,
    env: { CI: process.env.CI || '', platform: process.platform, node: process.version },
    exePath: EXE_PATH,
    results: null
  };
  writeFileUtf8(path.join(artifactDir, 'proof_config.json'), JSON.stringify(config, null, 2));

  try {
    const startMs = Date.now();
    transcript.writeLine(`[exe-proof] MIN_UPTIME_DELTA=${MIN_UPTIME_DELTA}`);
    transcript.writeLine(`[exe-proof] artifacts: ${artifactDir}`);

    if (FORCE_EXE_FAIL) {
      transcript.writeLine('[proof-exe] forced failure');
      throw new Error('[proof-exe] forced failure');
    }

    purgeRuntimeDirs({ meta });
    writeMeta({ artifactDir, meta });

    const built = await buildExeIfMissing({ transcript });
    if (built.built) transcript.writeLine(`[exe-proof] EXE built: ${EXE_PATH}`);

    const normal = await runMode({ modeName: 'normal', dryRun: false, transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta });
    const restart = await runRestartReset({ transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta });
    const dry = await runMode({ modeName: 'dry', dryRun: true, transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta });

    if (FORCE_FAIL) {
      transcript.writeLine('[exe-proof] PROOF_FORCE_FAIL=1 (forcing deterministic failure)');
      assertExactDelta({ name: 'forceFail: failures_total', before: 0, after: 1, expectedDelta: 999 });
    }

    config = { ...config, results: { normal, restart, dry }, ok: true };
    meta.ok = true;
    meta.durationMs = Date.now() - startMs;
    if (meta.durationMs > 30000) throw new Error(`Timing budget exceeded: ${meta.durationMs}ms > 30000ms`);
    writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    writeFileUtf8(path.join(artifactDir, 'proof_config.json'), JSON.stringify(config, null, 2));
    writeFileUtf8(
      path.join(artifactDir, 'metrics.txt'),
      `${readIfExists(path.join(artifactDir, 'metrics_before.txt')) || ''}\n\n# --- AFTER ---\n\n${readIfExists(path.join(artifactDir, 'metrics_after.txt')) || ''}\n`
    );
    writeSha256Txt({
      artifactDir,
      entries: [
        { label: 'production-server.js', path: PROD_SERVER },
        { label: 'tear-runtime.js', path: TEAR_ENTRY },
        { label: 'NeuralShell-TEAR-Runtime.exe', path: EXE_PATH }
      ]
    });
    writeMeta({ artifactDir, meta });

    transcript.writeLine('');
    transcript.writeLine('--- PROOF SUMMARY ---');
    transcript.writeLine(`target=TEAR runtime EXE MIN_UPTIME_DELTA=${MIN_UPTIME_DELTA}`);
    transcript.writeLine(`exe=${EXE_PATH}`);
    transcript.writeLine(`normal.port=${normal.port} uptimeΔ=${normal.uptime.uptimeDelta.toFixed(6)} reqΔ=${normal.requestsDelta}/${normal.expectedRequestsDelta} failΔ=${normal.failuresDelta}/${normal.expectedFailuresDelta}`);
    transcript.writeLine(`dry.port=${dry.port} uptimeΔ=${dry.uptime.uptimeDelta.toFixed(6)} reqΔ=${dry.requestsDelta}/${dry.expectedRequestsDelta} failΔ=${dry.failuresDelta}/${dry.expectedFailuresDelta}`);
    transcript.writeLine(`restartReset=${restart.restartReset} baseline.requests=${restart.baseline.requests} baseline.failures=${restart.baseline.failures}`);
    transcript.writeLine(`shutdownCheck.normal=${normal.shutdownCheck} shutdownCheck.dry=${dry.shutdownCheck}`);
    transcript.writeLine('RESULT: PASS');
    transcript.writeLine('---------------------');
  } catch (err) {
    meta.ok = false;
    meta.error = String(err && err.stack ? err.stack : err);
    writeMeta({ artifactDir, meta });
    config = { ...config, results: config.results, ok: false, error: String(err && err.stack ? err.stack : err) };
    writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    writeFileUtf8(path.join(artifactDir, 'proof_config.json'), JSON.stringify(config, null, 2));
    writeSha256Txt({
      artifactDir,
      entries: [
        { label: 'production-server.js', path: PROD_SERVER },
        { label: 'tear-runtime.js', path: TEAR_ENTRY },
        { label: 'NeuralShell-TEAR-Runtime.exe', path: EXE_PATH }
      ]
    });

    transcript.writeLine('');
    transcript.writeLine('--- PROOF FAILURE ---');
    transcript.writeLine(`config: ${path.join(artifactDir, 'config.json')}`);
    transcript.writeLine(`serverLog: ${path.join(artifactDir, 'server.log')}`);
    transcript.writeLine('--- LAST 120 SERVER LINES ---');
    transcript.write(serverLog.lastLines(120));
    transcript.writeLine('--- ERROR ---');
    transcript.writeLine(err && err.stack ? err.stack : String(err));
    transcript.writeLine('RESULT: FAIL');
    transcript.writeLine('----------------------');
    throw err;
  } finally {
    try {
      writeFileUtf8(
        path.join(artifactDir, 'metrics.txt'),
        `${readIfExists(path.join(artifactDir, 'metrics_before.txt')) || ''}\n\n# --- AFTER ---\n\n${
          readIfExists(path.join(artifactDir, 'metrics_after.txt')) || ''
        }\n`
      );
    } catch {
      // ignore
    }
    try {
      serverLog.close();
    } catch {
      // ignore
    }
    try {
      stdoutLog.close();
    } catch {
      // ignore
    }
    try {
      stderrLog.close();
    } catch {
      // ignore
    }
    try {
      transcript.close();
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
