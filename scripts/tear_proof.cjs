const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
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
  sha256File,
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
const TEAR_ENTRY = path.join(DESKTOP_ROOT, 'tear-runtime.js');
const TEAR_SERVER = path.join(DESKTOP_ROOT, 'src', 'runtime', 'createTearServer.js');
const TEAR_RUNTIME_DIR = path.join(DESKTOP_ROOT, '.tear_runtime');
const PROD_SERVER = path.join(REPO_ROOT, 'production-server.js');
const MIN_UPTIME_DELTA = process.env.CI === 'true' ? 0.05 : 0.1;
const FORCE_FAIL = process.env.PROOF_FORCE_FAIL === '1';
const FORCE_TEAR_FAIL = process.env.PROOF_FORCE_TEAR_FAIL === '1';
const PROOF_MAX_MEM_MB = Number.isFinite(Number(process.env.PROOF_MAX_MEM_MB))
  ? Number(process.env.PROOF_MAX_MEM_MB)
  : 80;

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

async function reserveCollisionPort() {
  const srv = http.createServer((_req, res) => {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/plain');
    res.end('ok');
  });
  await new Promise((resolve, reject) => {
    srv.once('error', reject);
    srv.listen(0, '127.0.0.1', resolve);
  });
  const addr = srv.address();
  const port = addr && typeof addr === 'object' ? addr.port : null;
  if (!Number.isFinite(port) || port <= 0) {
    try {
      srv.close();
    } catch {
      // ignore
    }
    throw new Error('[proof-port] failed to reserve collision port');
  }
  return {
    port,
    async close() {
      await new Promise((resolve) => {
        try {
          srv.close(resolve);
        } catch {
          resolve();
        }
      });
    }
  };
}

function lockPathFor(runtimeDir) {
  return path.join(runtimeDir, '.neuralshell.lock');
}

async function spawnLockedAttempt({ transcript, env, timeoutMs }) {
  const cmd = process.platform === 'win32' ? 'node.exe' : 'node';
  const args = [TEAR_ENTRY];
  const runtimeDir = env?.NS_RUNTIME_DIR || TEAR_RUNTIME_DIR;
  ensureDir(runtimeDir);
  const outPath = path.join(runtimeDir, '__proof_locked_attempt_stdout.log');
  const errPath = path.join(runtimeDir, '__proof_locked_attempt_stderr.log');
  writeFileUtf8(outPath, '');
  writeFileUtf8(errPath, '');
  const child = spawnChild({ cmd, args, cwd: DESKTOP_ROOT, env, stdoutPath: outPath, stderrPath: errPath });
  const exit = await new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), timeoutMs);
    t.unref?.();
    child.once('exit', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal });
    });
  });
  const out = `${readIfExists(outPath) || ''}\n${readIfExists(errPath) || ''}`;
  if (exit.code === null) {
    await stopChild({ child, timeoutMs: 1500 });
    throw new Error('[proof-lock] hang starting locked attempt');
  }
  transcript.writeLine(`[tear-proof] lockedAttempt.exit=${exit.code} signal=${exit.signal || 'none'}`);
  transcript.writeLine(`[tear-proof] lockedAttempt.output=${out.trim().slice(0, 4000)}`);
  return { code: exit.code, out };
}

function purgeRuntimeDirs({ meta }) {
  const deleted = [];
  const errors = [];

  try {
    if (fs.existsSync(STATE_DIR)) {
      const entries = fs.readdirSync(STATE_DIR, { withFileTypes: true });
      for (const e of entries) {
        if (e && (e.name === 'proofs' || e.name === 'proof_bundles')) continue;
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
      const entries = fs.readdirSync(TEAR_RUNTIME_DIR, { withFileTypes: true });
      for (const e of entries) {
        if (!e || !e.name) continue;
        if (e.name === '.neuralshell.lock') {
          // Fail-closed: only remove the lock if it is provably stale (PID is not running).
          const lockPath = path.join(TEAR_RUNTIME_DIR, e.name);
          try {
            const raw = fs.readFileSync(lockPath, 'utf8');
            const parsed = JSON.parse(String(raw || ''));
            const pid = parsed && Number(parsed.pid);
            if (Number.isFinite(pid) && pid > 0) {
              try {
                process.kill(pid, 0);
              } catch (err) {
                const code = err && typeof err === 'object' ? err.code : null;
                if (code === 'ESRCH') {
                  try {
                    fs.unlinkSync(lockPath);
                    deleted.push(lockPath);
                  } catch (unlinkErr) {
                    errors.push({ path: lockPath, error: String(unlinkErr && unlinkErr.message ? unlinkErr.message : unlinkErr) });
                  }
                }
              }
            }
          } catch {
            // ignore
          }
          continue;
        }
        const p = path.join(TEAR_RUNTIME_DIR, e.name);
        try {
          fs.rmSync(p, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
          deleted.push(p);
        } catch (err) {
          errors.push({ path: p, error: String(err && err.message ? err.message : err) });
        }
      }
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
      '[tear-proof] cold start purge failed',
      ...errors.map((e) => `- ${e.path}: ${e.error}`)
    ].join('\n');
    throw new Error(msg);
  }
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

async function runMode({ modeName, dryRun, transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta }) {
  const runTag = `${runTagBase}-${modeName}`;
  const runtimeDir = path.join(artifactDir, `runtime-${modeName}-${dryRun ? 'dry' : 'normal'}`);
  ensureDir(runtimeDir);
  const runtimeConfigPath = path.join(runtimeDir, 'proof-config.json');

  const collision = modeName === 'normal' ? await reserveCollisionPort() : null;
  const desiredPort = collision ? collision.port : 0;

  const env = {
    ...process.env,
    PROOF_MODE: '1',
    NS_DRY_RUN: dryRun ? '1' : '0',
    NS_TEAR_HOST: '127.0.0.1',
    NS_TEAR_PORT: String(desiredPort),
    NS_RUNTIME_DIR: TEAR_RUNTIME_DIR,
    NS_LLM_HOST: process.env.NS_LLM_HOST || 'http://127.0.0.1:11434'
  };
  writeFileUtf8(runtimeConfigPath, JSON.stringify({ env, modeName, dryRun, minUptimeDelta: MIN_UPTIME_DELTA }, null, 2));
  if (artifactDir) {
    copyFileIfExists(runtimeConfigPath, path.join(artifactDir, `config-${modeName}.json`));
    if (modeName === 'normal') copyFileIfExists(runtimeConfigPath, path.join(artifactDir, 'config.json'));
  }

  const cmd = process.platform === 'win32' ? 'node.exe' : 'node';
  const args = [TEAR_ENTRY];
  transcript.writeLine(`[tear-proof] spawn: ${cmd} ${args.join(' ')}`);
  transcript.writeLine(`[tear-proof] config: ${runtimeConfigPath}`);
  transcript.writeLine(
    `[tear-proof] env: PROOF_MODE=1 NS_DRY_RUN=${env.NS_DRY_RUN} NS_TEAR_PORT=${env.NS_TEAR_PORT} NS_RUNTIME_DIR=${TEAR_RUNTIME_DIR}`
  );

  const child = spawnChild({ cmd, args, cwd: DESKTOP_ROOT, env, stdoutPath: stdoutLog.filePath, stderrPath: stderrLog.filePath });
  const attached = attachChildLogs({ child, tee: serverLog, stdoutTee: stdoutLog, stderrTee: stderrLog });

  let baseUrl = null;
  try {
    const listening = await waitForListening({ getLines: attached.getLines, timeoutMs: 10000 });
    if (collision) {
      transcript.writeLine(
        `[tear-proof] portCollision: reservedPort=${collision.port} desiredPort=${desiredPort} actualPort=${listening.port}`
      );
      try {
        await collision.close();
      } catch {
        // ignore
      }
      if (listening.port === collision.port) {
        throw new Error(`[proof-port] collision fallback failed (still bound to reserved port ${collision.port})`);
      }
    }
    baseUrl = `http://127.0.0.1:${listening.port}`;
    if (meta) {
      meta.baseUrlByMode = meta.baseUrlByMode || {};
      meta.baseUrlByMode[modeName] = baseUrl;
      meta.portByMode = meta.portByMode || {};
      meta.portByMode[modeName] = listening.port;
      writeMeta({ artifactDir, meta });
    }

    transcript.writeLine(`[tear-proof] baseUrl: ${baseUrl}`);
    await waitForMetricsReady({ baseUrl, deadlineMs: 6000 });

  // Dual-instance lock: while first instance is up, second must fail with INSTANCE_LOCKED.
  if (modeName === 'normal' && !dryRun) {
    const env2 = { ...env, NS_TEAR_PORT: '0' };
    const second = await spawnLockedAttempt({ transcript, env: env2, timeoutMs: 5000 });
    assert.ok((second.code ?? 1) !== 0, 'second instance must exit non-zero');
    assert.ok(second.out.includes('INSTANCE_LOCKED'), 'second instance must print INSTANCE_LOCKED');
  }

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
  const rssBefore = process.memoryUsage().rss;
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
  const rssAfter = process.memoryUsage().rss;
  const memDeltaMb = (rssAfter - rssBefore) / (1024 * 1024);
  if (memDeltaMb > PROOF_MAX_MEM_MB) {
    throw new Error(`[proof-memory] exceeded delta tear:${modeName} deltaMb=${memDeltaMb.toFixed(2)} maxMb=${PROOF_MAX_MEM_MB}`);
  }

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
    const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), 5000);
    t.unref?.();
    child.once('exit', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal });
    });
  });
  if (exit.code === null) {
    await stopChild({ child, timeoutMs: 1500 });
    throw new Error(`${modeName}: shutdown timed out (no exit within 5000ms)`);
  }
  assert.equal(exit.code, 0, `${modeName}: exit code must be 0 on shutdown (signal=${exit.signal || 'none'})`);
  await stopChild({ child, timeoutMs: 1000 });
  const down = await assertUnreachable({ url: `${baseUrl}/metrics`, deadlineMs: 3000 });
  try {
    fs.rmSync(runtimeDir, { recursive: true, force: true });
  } catch {
    // ignore
  }

  return {
    modeName,
    dryRun,
    port: listening.port,
    portCollision: collision ? { reservedPort: collision.port, desiredPort, actualPort: listening.port } : null,
    uptime,
    counters0: c0,
    counters1: c1,
    expectedRequestsDelta,
    expectedFailuresDelta,
    requestsDelta,
    failuresDelta,
    memory: { rssBefore, rssAfter, deltaMb: Number(memDeltaMb.toFixed(3)), maxMb: PROOF_MAX_MEM_MB },
    shutdownCheck: down.ok
  };
  } finally {
    if (baseUrl) {
      try {
        await shutdown({ baseUrl });
      } catch {
        // ignore
      }
    }
    try {
      await stopChild({ child, timeoutMs: 1500 });
    } catch {
      // ignore
    }
  }
}

async function runRestartReset({ transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta }) {
  const runTag = `${runTagBase}-restart`;
  const runtimeDir = path.join(artifactDir, `runtime-restart-normal`);
  ensureDir(runtimeDir);
  const runtimeConfigPath = path.join(runtimeDir, 'proof-config.json');
  const env = {
    ...process.env,
    PROOF_MODE: '1',
    NS_DRY_RUN: '0',
    NS_TEAR_HOST: '127.0.0.1',
    NS_TEAR_PORT: '0',
    NS_RUNTIME_DIR: TEAR_RUNTIME_DIR,
    NS_LLM_HOST: process.env.NS_LLM_HOST || 'http://127.0.0.1:11434'
  };
  writeFileUtf8(runtimeConfigPath, JSON.stringify({ env, modeName: 'restart', dryRun: false }, null, 2));
  if (artifactDir) copyFileIfExists(runtimeConfigPath, path.join(artifactDir, 'config-restart.json'));
  const cmd = process.platform === 'win32' ? 'node.exe' : 'node';
  const args = [TEAR_ENTRY];
  transcript.writeLine(`[tear-proof] spawn: ${cmd} ${args.join(' ')}`);
  transcript.writeLine(`[tear-proof] config: ${runtimeConfigPath}`);
  transcript.writeLine(`[tear-proof] env: PROOF_MODE=1 NS_DRY_RUN=0 NS_TEAR_PORT=0 NS_RUNTIME_DIR=${TEAR_RUNTIME_DIR}`);

  const child = spawnChild({ cmd, args, cwd: DESKTOP_ROOT, env, stdoutPath: stdoutLog.filePath, stderrPath: stderrLog.filePath });
  const attached = attachChildLogs({ child, tee: serverLog, stdoutTee: stdoutLog, stderrTee: stderrLog });

  let baseUrl = null;
  try {
    const listening = await waitForListening({ getLines: attached.getLines, timeoutMs: 10000 });
    baseUrl = `http://127.0.0.1:${listening.port}`;
    if (meta) {
      meta.baseUrlByMode = meta.baseUrlByMode || {};
      meta.baseUrlByMode.restart = baseUrl;
      meta.portByMode = meta.portByMode || {};
      meta.portByMode.restart = listening.port;
      writeMeta({ artifactDir, meta });
    }

    transcript.writeLine(`[tear-proof] baseUrl: ${baseUrl}`);
    await waitForMetricsReady({ baseUrl, deadlineMs: 6000 });
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
      const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), 5000);
      t.unref?.();
      child.once('exit', (code, signal) => {
        clearTimeout(t);
        resolve({ code, signal });
      });
    });
    if (exit.code === null) {
      await stopChild({ child, timeoutMs: 1500 });
      throw new Error(`restartReset: shutdown timed out (no exit within 5000ms)`);
    }
    assert.equal(exit.code, 0, `restartReset: exit code must be 0 on shutdown (signal=${exit.signal || 'none'})`);
    await stopChild({ child, timeoutMs: 1000 });
    await assertUnreachable({ url: `${baseUrl}/metrics`, deadlineMs: 3000 });
    try {
      fs.rmSync(runtimeDir, { recursive: true, force: true });
    } catch {
      // ignore
    }

    return { restartReset: true, port: listening.port, baseline: c0 };
  } finally {
    if (baseUrl) {
      try {
        await shutdown({ baseUrl });
      } catch {
        // ignore
      }
    }
    try {
      await stopChild({ child, timeoutMs: 1500 });
    } catch {
      // ignore
    }
  }
}

async function main() {
  const runTagBase = safeTimestamp();
  const artifactDir = createArtifactDir({ repoRoot: REPO_ROOT, tag: 'tear', runTagBase });

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
    tag: 'tear',
    artifactDir,
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    tearEntry: TEAR_ENTRY,
    tearRuntimeDir: TEAR_RUNTIME_DIR,
    minUptimeDelta: MIN_UPTIME_DELTA,
    forceFail: FORCE_FAIL,
    forceTearFail: FORCE_TEAR_FAIL,
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
    results: null
  };
  writeFileUtf8(path.join(artifactDir, 'proof_config.json'), JSON.stringify(config, null, 2));

  try {
    const startMs = Date.now();
    transcript.writeLine(`[tear-proof] MIN_UPTIME_DELTA=${MIN_UPTIME_DELTA}`);
    transcript.writeLine(`[tear-proof] artifacts: ${artifactDir}`);

    if (FORCE_TEAR_FAIL) {
      transcript.writeLine('[proof-tear] forced failure');
      throw new Error('[proof-tear] forced failure');
    }

    purgeRuntimeDirs({ meta });
    writeMeta({ artifactDir, meta });

    const normal = await runMode({ modeName: 'normal', dryRun: false, transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta });
    const restart = await runRestartReset({ transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta });
    const dry = await runMode({ modeName: 'dry', dryRun: true, transcript, serverLog, stdoutLog, stderrLog, runTagBase, artifactDir, meta });

    if (FORCE_FAIL) {
      transcript.writeLine('[tear-proof] PROOF_FORCE_FAIL=1 (forcing deterministic failure)');
      assertExactDelta({ name: 'forceFail: failures_total', before: 0, after: 1, expectedDelta: 999 });
    }

    config = { ...config, results: { normal, restart, dry }, ok: true };
    meta.ok = true;
    meta.durationMs = Date.now() - startMs;
    if (meta.durationMs > 30000) throw new Error(`Timing budget exceeded: ${meta.durationMs}ms > 30000ms`);
    writeMeta({ artifactDir, meta });
    writeFileUtf8(path.join(artifactDir, 'proof_config.json'), JSON.stringify(config, null, 2));
    writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    writeFileUtf8(
      path.join(artifactDir, 'metrics.txt'),
      `${readIfExists(path.join(artifactDir, 'metrics_before.txt')) || ''}\n\n# --- AFTER ---\n\n${readIfExists(path.join(artifactDir, 'metrics_after.txt')) || ''}\n`
    );
    writeSha256Txt({
      artifactDir,
      entries: [
        { label: 'production-server.js', path: PROD_SERVER },
        { label: 'tear-runtime.js', path: TEAR_ENTRY },
        { label: 'createTearServer.js', path: TEAR_SERVER }
      ]
    });

    transcript.writeLine('');
    transcript.writeLine('--- PROOF SUMMARY ---');
    transcript.writeLine(`target=TEAR runtime (node) MIN_UPTIME_DELTA=${MIN_UPTIME_DELTA}`);
    transcript.writeLine(`normal.port=${normal.port} uptimeΔ=${normal.uptime.uptimeDelta.toFixed(6)} reqΔ=${normal.requestsDelta}/${normal.expectedRequestsDelta} failΔ=${normal.failuresDelta}/${normal.expectedFailuresDelta}`);
    transcript.writeLine(`dry.port=${dry.port} uptimeΔ=${dry.uptime.uptimeDelta.toFixed(6)} reqΔ=${dry.requestsDelta}/${dry.expectedRequestsDelta} failΔ=${dry.failuresDelta}/${dry.expectedFailuresDelta}`);
    if (normal.portCollision) {
      transcript.writeLine(
        `portCollision.normal reserved=${normal.portCollision.reservedPort} desired=${normal.portCollision.desiredPort} actual=${normal.portCollision.actualPort}`
      );
    }
    transcript.writeLine(`restartReset=${restart.restartReset} baseline.requests=${restart.baseline.requests} baseline.failures=${restart.baseline.failures}`);
    transcript.writeLine(`shutdownCheck.normal=${normal.shutdownCheck} shutdownCheck.dry=${dry.shutdownCheck}`);
    transcript.writeLine('RESULT: PASS');
    transcript.writeLine('---------------------');
  } catch (err) {
    meta.ok = false;
    meta.error = String(err && err.stack ? err.stack : err);
    writeMeta({ artifactDir, meta });
    config = { ...config, results: config.results, ok: false, error: String(err && err.stack ? err.stack : err) };
    writeFileUtf8(path.join(artifactDir, 'proof_config.json'), JSON.stringify(config, null, 2));
    writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    writeSha256Txt({
      artifactDir,
      entries: [
        { label: 'production-server.js', path: PROD_SERVER },
        { label: 'tear-runtime.js', path: TEAR_ENTRY },
        { label: 'createTearServer.js', path: TEAR_SERVER }
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
