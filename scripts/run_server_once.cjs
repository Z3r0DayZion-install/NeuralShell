const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const {
  assertMetricsContract,
  assertUnreachable,
  createArtifactDir,
  createTranscript,
  ensureDir,
  fetchMetrics,
  parseMetricValue,
  safeTimestamp,
  sleep,
  waitForListening,
  writeFileUtf8,
  writeSha256Txt
} = require('./_proof_lib.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_ENTRY = path.join(REPO_ROOT, 'production-server.js');
const FORCE_FAIL = process.env.PROOF_FORCE_FAIL === '1';

function readTailLinesFromFile(filePath, maxLines) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split(/\r?\n/);
    return lines.slice(Math.max(0, lines.length - maxLines)).join('\n');
  } catch {
    return '';
  }
}

function getLinesFromFiles(paths) {
  const out = [];
  for (const p of paths) {
    try {
      const text = fs.readFileSync(p, 'utf8');
      if (!text) continue;
      for (const line of text.split(/\r?\n/)) out.push(line);
    } catch {
      // ignore
    }
  }
  return out;
}

function printSpawnBlocked(tag, err) {
  console.error(`[${tag}] SPAWN_BLOCKED`);
  console.error(`platform: ${process.platform}`);
  console.error(`node: ${process.version}`);
  console.error(`execPath: ${process.execPath}`);
  console.error(`cwd: ${process.cwd()}`);
  console.error(`error.code: ${err?.code || err?.cause?.code || 'UNKNOWN'}`);
}

function dumpConfig(tag, configPath) {
  console.error(`[${tag}] CONFIG_PATH: ${configPath}`);
  try {
    const text = fs.readFileSync(configPath, 'utf8');
    const lines = text.split(/\r?\n/).slice(0, 120);
    console.error(`[${tag}] CONFIG_DUMP (first 120 lines)`);
    console.error(lines.join('\n'));
  } catch (err) {
    console.error(`[${tag}] CONFIG_DUMP failed: ${err && err.message ? err.message : String(err)}`);
  }
}

function writeSpawnProofConfig({ configPath }) {
  const config = {
    version: '1.0.0',
    server: { port: 0, host: '127.0.0.1', requestTimeoutMs: 1000 },
    endpoints: [
      {
        name: 'dummy-local',
        url: 'http://127.0.0.1:9/api/chat',
        model: 'dummy',
        weight: 1,
        priority: 1,
        enabled: true
      }
    ],
    routing: { strategy: 'failover' },
    rateLimit: { enabled: false },
    features: { dryRun: false, replay: false, plugins: false, streaming: false, idempotency: false }
  };

  writeFileUtf8(configPath, JSON.stringify(config, null, 2));

  if (!fs.existsSync(configPath)) {
    throw new Error(`spawn-proof: config file missing after write: ${configPath}`);
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.version !== 'string' || !parsed.version) {
      throw new Error('missing required field "version"');
    }
  } catch (err) {
    throw new Error(`spawn-proof: config preflight failed for ${configPath}`, { cause: err });
  }

  return config;
}

function spawnProductionServer({ configPath, stdoutPath, stderrPath }) {
  assert.ok(path.isAbsolute(SERVER_ENTRY), 'spawnProductionServer: SERVER_ENTRY must be absolute');
  let child;
  try {
    const spawnOpts = {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PROOF_MODE: '1',
        CONFIG_PATH: configPath,
        SWARM_ENABLED: '0',
        HIVE_ENABLED: '0',
        FEDERATION_ENABLED: '0',
        EVOLUTION_ENABLED: '0',
        RAG_ENABLED: '0',
        PLUGINS_ENABLED: '0'
      },
      shell: false,
      windowsHide: true,
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    };
    if (spawnOpts.shell) throw new Error('shell spawn not allowed in production proof');

    if (process.platform === 'win32') {
      const outFd = fs.openSync(stdoutPath, 'a');
      const errFd = fs.openSync(stderrPath, 'a');
      spawnOpts.stdio = ['ignore', outFd, errFd];
      child = spawn(process.execPath, [SERVER_ENTRY], spawnOpts);
      child.__spawnTarget = SERVER_ENTRY;
      try {
        fs.closeSync(outFd);
      } catch {
        // ignore
      }
      try {
        fs.closeSync(errFd);
      } catch {
        // ignore
      }
      return child;
    }

    child = spawn(process.execPath, [SERVER_ENTRY], spawnOpts);
  } catch (err) {
    if (err && typeof err === 'object' && err.code === 'EPERM') {
      throw new Error('spawnProductionServer: EPERM while spawning production-server.js', { cause: err });
    }
    throw err;
  }
  child.__spawnTarget = SERVER_ENTRY;
  if (child.stdout) child.stdout.setEncoding('utf8');
  if (child.stderr) child.stderr.setEncoding('utf8');
  return child;
}

async function stopChildDeterministic(child) {
  if (!child) return { code: null, signal: null };
  if (child.exitCode !== null) return { code: child.exitCode, signal: child.signalCode };

  const waitForExit = (ms) =>
    new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timed out waiting for server to exit')), ms);
      t.unref?.();
      child.once('exit', (code, signal) => {
        clearTimeout(t);
        resolve({ code, signal });
      });
    });

  if (process.platform === 'win32' && typeof child.send === 'function') {
    try {
      child.send({ type: 'shutdown' });
      return await waitForExit(6000);
    } catch {
      // fall through to signals
    }
  }

  try {
    child.kill(process.platform === 'win32' ? 'SIGINT' : 'SIGTERM');
  } catch {
    try {
      child.kill();
    } catch {
      // ignore
    }
  }

  return await waitForExit(15000);
}

async function main() {
  if (process.env.PROOF_FORCE_FAIL === '1') {
    throw new Error('[proof] forced failure');
  }
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const runTagBase = process.env.PROOF_RUN_TS || safeTimestamp();
  process.env.PROOF_RUN_TS = runTagBase;
  process.env.PROOF_PHASE = process.env.PROOF_PHASE || 'spawn';

  const artifactDir = createArtifactDir({ repoRoot: REPO_ROOT, tag: 'spawn', runTagBase });
  ensureDir(artifactDir);
  process.env.PROOF_ARTIFACT_DIR = artifactDir;

  // Required artifact contract files (pre-created by verify_runner, but keep standalone-safe).
  const stdoutPath = path.join(artifactDir, 'stdout.log');
  const stderrPath = path.join(artifactDir, 'stderr.log');
  const serverLogPath = path.join(artifactDir, 'server.log');

  writeFileUtf8(stdoutPath, '');
  writeFileUtf8(stderrPath, '');
  writeFileUtf8(path.join(artifactDir, 'config.json'), '');
  writeFileUtf8(path.join(artifactDir, 'metrics.txt'), '');
  writeFileUtf8(path.join(artifactDir, 'metadata.json'), '');
  writeFileUtf8(path.join(artifactDir, 'sha256.txt'), '');
  writeFileUtf8(serverLogPath, '');

  const transcript = createTranscript({ stampedPath: path.join(artifactDir, 'transcript.log') });

  const configPath = path.join(artifactDir, 'config.json');
  const config = writeSpawnProofConfig({ configPath });

  let child = null;
  let baseUrl = null;
  let port = null;
  let shutdownEvidence = '';
  let success = false;

  try {
    child = spawnProductionServer({ configPath, stdoutPath, stderrPath });
    const listening = await waitForListening({
      getLines: () => getLinesFromFiles([stdoutPath, stderrPath]),
      timeoutMs: 20000
    });

    port = listening.port;
    assert.ok(Number.isFinite(port) && port > 0, `invalid listen port: ${port}`);
    baseUrl = `http://127.0.0.1:${port}`;
    transcript.writeLine(`[spawn-proof] listening: ${baseUrl}`);

    const metricsRes = await fetchMetrics({ baseUrl, timeoutMs: 2500 });
    assertMetricsContract(metricsRes);
    writeFileUtf8(path.join(artifactDir, 'metrics.txt'), metricsRes.body);

    assert.ok(parseMetricValue(metricsRes.body, 'neuralshell_uptime_seconds') !== null, 'parse neuralshell_uptime_seconds');
    assert.ok(parseMetricValue(metricsRes.body, 'neuralshell_requests_total') !== null, 'parse neuralshell_requests_total');
    assert.ok(parseMetricValue(metricsRes.body, 'neuralshell_failures_total') !== null, 'parse neuralshell_failures_total');

    if (FORCE_FAIL) {
      throw new Error('PROOF_FORCE_FAIL=1 (intentional failure after real /metrics validation)');
    }

    const exit = await stopChildDeterministic(child);
    assert.equal(exit.code, 0, `server exit code should be 0 (signal=${exit.signal || 'none'})`);

    const down = await assertUnreachable({ url: `${baseUrl}/metrics`, deadlineMs: 4000 });
    shutdownEvidence = down.err || '';
    success = true;
  } catch (err) {
    const code = err?.cause?.code || err?.code;
    if (code === 'EPERM') {
      console.error('[spawn-proof] failed at spawnProductionServer: EPERM');
      printSpawnBlocked('spawn-proof', err);
      dumpConfig('spawn-proof', configPath);
      console.error(err && err.stack ? err.stack : err);
      throw err;
    }

    dumpConfig('spawn-proof', configPath);
    console.error('[spawn-proof] SERVER_OUTPUT_TAIL (last 120 lines)');
    console.error(readTailLinesFromFile(stdoutPath, 120));
    console.error(readTailLinesFromFile(stderrPath, 120));
    console.error(`[spawn-proof] ARTIFACT_DIR: ${artifactDir}`);
    throw err;
  } finally {
    try {
      if (child) await stopChildDeterministic(child);
    } catch {
      // ignore
    }
    try {
      transcript.close();
    } catch {
      // ignore
    }
    try {
      const combined =
        readTailLinesFromFile(stdoutPath, Number.POSITIVE_INFINITY) +
        '\n' +
        readTailLinesFromFile(stderrPath, Number.POSITIVE_INFINITY);
      writeFileUtf8(serverLogPath, combined);
    } catch {
      // ignore
    }

    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    const ok = Boolean(success);

    const meta = {
      phase: 'spawn',
      startedAt,
      finishedAt,
      durationMs,
      budgetMs: 30000,
      ok,
      port,
      baseUrl,
      shutdownEvidence,
      config: { server: config.server }
    };
    writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    writeSha256Txt({ artifactDir, entries: [{ label: 'production-server.js', path: SERVER_ENTRY }] });
  }

  const durationMs = Date.now() - startMs;
  if (durationMs > 30000) {
    throw new Error(`Timing budget exceeded: ${durationMs}ms > 30000ms`);
  }
}

main()
  .then(async () => {
    await sleep(10);
    console.log('[spawn-proof] ok');
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[spawn-proof] failed');
    console.error(err && err.stack ? err.stack : err);
    await sleep(10);
    process.exit(1);
  });
