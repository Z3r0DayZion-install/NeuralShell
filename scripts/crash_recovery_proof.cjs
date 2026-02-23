const assert = require('node:assert/strict');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');

const {
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
const DESKTOP_ROOT = path.join(REPO_ROOT, 'NeuralShell_Desktop');
const TEAR_ENTRY = path.join(DESKTOP_ROOT, 'tear-runtime.js');
const TEAR_RUNTIME_DIR = path.join(DESKTOP_ROOT, '.tear_runtime');
const LOCK_PATH = path.join(TEAR_RUNTIME_DIR, '.neuralshell.lock');

const PROD_SERVER = path.join(REPO_ROOT, 'production-server.js');

const NUM_REQUESTS = 5;

function isPidAlive(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForPortFree({ port, deadlineMs }) {
  const deadlineAt = Date.now() + deadlineMs;
  let lastErr = null;
  while (Date.now() < deadlineAt) {
    const ok = await new Promise((resolve) => {
      const srv = net.createServer();
      srv.once('error', (err) => {
        lastErr = err;
        try {
          srv.close();
        } catch {
          // ignore
        }
        resolve(false);
      });
      srv.listen(port, '127.0.0.1', () => {
        srv.close(() => resolve(true));
      });
    });
    if (ok) return { ok: true };
    await sleep(120);
  }
  return { ok: false, error: String(lastErr && lastErr.message ? lastErr.message : lastErr) };
}

async function waitForLockGone({ deadlineMs }) {
  const deadlineAt = Date.now() + deadlineMs;
  while (Date.now() < deadlineAt) {
    if (!fs.existsSync(LOCK_PATH)) return { ok: true };
    await sleep(120);
  }
  return { ok: false };
}

async function forceKillChild({ transcript, child }) {
  const pid = child && typeof child.pid === 'number' ? child.pid : null;
  if (!pid) throw new Error('[proof-crash] FAIL missing child pid');

  transcript.writeLine(`[proof-crash] killing pid=${pid}`);
  if (process.platform === 'win32') {
    const taskkill = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
    const killer = spawnChild({
      cmd: taskkill,
      args: ['/PID', String(pid), '/F'],
      cwd: REPO_ROOT,
      env: process.env
    });
    const code = await new Promise((resolve) => killer.on('close', resolve));
    transcript.writeLine(`[proof-crash] taskkill.exit=${code ?? 1}`);
  } else {
    try {
      process.kill(pid, 'SIGKILL');
    } catch (err) {
      transcript.writeLine(`[proof-crash] kill error: ${String(err && err.message ? err.message : err)}`);
    }
  }

  const exit = await new Promise((resolve) => {
    const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), 8000);
    t.unref?.();
    child.once('exit', (code, signal) => {
      clearTimeout(t);
      resolve({ code, signal });
    });
  });
  if (exit.code === null) {
    throw new Error('[proof-crash] FAIL process did not exit after kill');
  }
  transcript.writeLine(`[proof-crash] killed.exit=${exit.code} signal=${exit.signal || 'none'}`);
}

function spawnTear({ transcript, serverLog, stdoutLog, stderrLog, artifactDir, tag }) {
  const cmd = process.platform === 'win32' ? 'node.exe' : 'node';
  const args = [TEAR_ENTRY];
  const env = {
    ...process.env,
    PROOF_MODE: '1',
    NS_DRY_RUN: '0',
    NS_TEAR_HOST: '127.0.0.1',
    NS_TEAR_PORT: '0',
    NS_RUNTIME_DIR: TEAR_RUNTIME_DIR,
    NS_LLM_HOST: process.env.NS_LLM_HOST || 'http://127.0.0.1:11434'
  };
  transcript.writeLine(`[proof-crash] spawn(${tag}): ${cmd} ${args.join(' ')}`);
  transcript.writeLine(`[proof-crash] env(${tag}): PROOF_MODE=1 NS_TEAR_PORT=0 NS_RUNTIME_DIR=${TEAR_RUNTIME_DIR}`);
  const child = spawnChild({ cmd, args, cwd: DESKTOP_ROOT, env });
  const attached = attachChildLogs({ child, tee: serverLog, stdoutTee: stdoutLog, stderrTee: stderrLog });
  if (artifactDir) {
    try {
      writeFileUtf8(path.join(artifactDir, `config-${tag}.json`), JSON.stringify({ env }, null, 2));
    } catch {
      // ignore
    }
  }
  return { child, attached };
}

async function main() {
  const runTagBase = safeTimestamp();
  const artifactDir = createArtifactDir({ repoRoot: REPO_ROOT, tag: 'crash', runTagBase });
  ensureDir(artifactDir);

  const transcript = createTranscript({ stampedPath: path.join(artifactDir, 'transcript.log') });
  const serverLog = createTeeFile({ filePath: path.join(artifactDir, 'server.log') });
  const stdoutLog = createTeeFile({ filePath: path.join(artifactDir, 'stdout.log') });
  const stderrLog = createTeeFile({ filePath: path.join(artifactDir, 'stderr.log') });

  const meta = {
    ts: new Date().toISOString(),
    phase: 'crash',
    artifactDir,
    node: process.version,
    platform: process.platform,
    cwd: process.cwd(),
    tearEntry: TEAR_ENTRY,
    tearRuntimeDir: TEAR_RUNTIME_DIR,
    numRequests: NUM_REQUESTS
  };
  writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
  writeFileUtf8(path.join(artifactDir, 'metrics.txt'), '');
  writeFileUtf8(path.join(artifactDir, 'config.json'), '');
  writeFileUtf8(path.join(artifactDir, 'sha256.txt'), '');

  let child = null;
  let port = null;
  let baseUrl = null;
  try {
    transcript.writeLine('[proof-crash] starting');

    ensureDir(TEAR_RUNTIME_DIR);
    if (fs.existsSync(LOCK_PATH)) {
      throw new Error('[proof-crash] FAIL lockfile exists before start (unexpected)');
    }

    const proc = spawnTear({ transcript, serverLog, stdoutLog, stderrLog, artifactDir, tag: 'run1' });
    child = proc.child;
    const listening = await waitForListening({ getLines: proc.attached.getLines, timeoutMs: 15000 });
    port = listening.port;
    baseUrl = `http://127.0.0.1:${port}`;
    transcript.writeLine(`[proof-crash] baseUrl=${baseUrl} pid=${child.pid}`);

    await waitForMetricsReady({ baseUrl, deadlineMs: 10000 });
    const m0 = await fetchMetrics({ baseUrl });
    writeFileUtf8(path.join(artifactDir, 'metrics_before.txt'), m0.body);
    const req0 = parseMetricValue(m0.body, 'neuralshell_requests_total');
    const fail0 = parseMetricValue(m0.body, 'neuralshell_failures_total');
    assert.equal(req0, 0, `[proof-crash] FAIL baseline requests_total must be 0, got ${req0}`);
    assert.equal(fail0, 0, `[proof-crash] FAIL baseline failures_total must be 0, got ${fail0}`);

    for (let i = 0; i < NUM_REQUESTS; i += 1) {
      const res = await httpRequest({ url: `${baseUrl}/health`, timeoutMs: 1500 });
      assert.equal(res.status, 200, `[proof-crash] FAIL GET /health expected 200, got ${res.status}`);
    }

    await forceKillChild({ transcript, child });

    // Zombie checks: pid dead, port freed, lock gone.
    if (isPidAlive(child.pid)) {
      process.stderr.write(`[proof-zombie] FAIL pid=${child.pid}\n`);
      process.exit(1);
    }

    const free = await waitForPortFree({ port, deadlineMs: 5000 });
    if (!free.ok) {
      process.stderr.write(`[proof-zombie] FAIL port=${port} reason=${free.error || 'EADDRINUSE'}\n`);
      process.exit(1);
    }

    const lockGone = await waitForLockGone({ deadlineMs: 5000 });
    if (!lockGone.ok) {
      process.stderr.write(`[proof-zombie] FAIL lockfile=${LOCK_PATH}\n`);
      process.exit(1);
    }

    process.stdout.write(`[proof-zombie] PASS port=${port} pid=${child.pid}\n`);

    // Recovery: restart and ensure counters reset.
    const proc2 = spawnTear({ transcript, serverLog, stdoutLog, stderrLog, artifactDir, tag: 'recovery' });
    child = proc2.child;
    const listening2 = await waitForListening({ getLines: proc2.attached.getLines, timeoutMs: 15000 });
    const baseUrl2 = `http://127.0.0.1:${listening2.port}`;
    transcript.writeLine(`[proof-crash] recovery.baseUrl=${baseUrl2} pid=${child.pid}`);
    await waitForMetricsReady({ baseUrl: baseUrl2, deadlineMs: 10000 });
    const mR = await fetchMetrics({ baseUrl: baseUrl2 });
    writeFileUtf8(path.join(artifactDir, 'metrics_after.txt'), mR.body);
    const reqR = parseMetricValue(mR.body, 'neuralshell_requests_total');
    const failR = parseMetricValue(mR.body, 'neuralshell_failures_total');
    assert.equal(reqR, 0, `[proof-crash] FAIL recovery baseline requests_total must be 0, got ${reqR}`);
    assert.equal(failR, 0, `[proof-crash] FAIL recovery baseline failures_total must be 0, got ${failR}`);

    const shut = await httpRequest({ url: `${baseUrl2}/__proof/shutdown`, method: 'POST', timeoutMs: 1500 });
    assert.equal(shut.status, 200, `[proof-crash] FAIL shutdown expected 200, got ${shut.status}`);

    const exit = await new Promise((resolve) => {
      const t = setTimeout(() => resolve({ code: null, signal: 'timeout' }), 10000);
      t.unref?.();
      child.once('exit', (code, signal) => {
        clearTimeout(t);
        resolve({ code, signal });
      });
    });
    if (exit.code === null) {
      await stopChild({ child, timeoutMs: 2500 });
      throw new Error('[proof-crash] FAIL recovery shutdown timed out');
    }
    assert.equal(exit.code, 0, `[proof-crash] FAIL recovery exit must be 0, got ${exit.code}`);
    await stopChild({ child, timeoutMs: 1500 });

    process.stdout.write('[proof-crash] PASS\n');
  } catch (err) {
    process.stderr.write(`[proof-crash] FAIL ${String(err && err.message ? err.message : err)}\n`);
    transcript.writeLine('--- ERROR ---');
    transcript.writeLine(err && err.stack ? err.stack : String(err));
    throw err;
  } finally {
    try {
      writeSha256Txt({
        artifactDir,
        entries: [
          { label: 'production-server.js', path: PROD_SERVER },
          { label: 'tear-runtime.js', path: TEAR_ENTRY }
        ]
      });
    } catch {
      // ignore
    }
    try {
      const before = fs.existsSync(path.join(artifactDir, 'metrics_before.txt'))
        ? fs.readFileSync(path.join(artifactDir, 'metrics_before.txt'), 'utf8')
        : '';
      const after = fs.existsSync(path.join(artifactDir, 'metrics_after.txt'))
        ? fs.readFileSync(path.join(artifactDir, 'metrics_after.txt'), 'utf8')
        : '';
      writeFileUtf8(path.join(artifactDir, 'metrics.txt'), `${before}\n\n# --- AFTER ---\n\n${after}\n`);
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

