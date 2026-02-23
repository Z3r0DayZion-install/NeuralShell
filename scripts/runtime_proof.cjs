const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const { createArtifactDir, ensureDir, writeFileUtf8, writeSha256Txt } = require('./_proof_lib.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const SERVER_ENTRY = path.join(REPO_ROOT, 'production-server.js');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const MIN_UPTIME_DELTA = process.env.CI === 'true' ? 0.05 : 0.1;
const PROOF_DIR = path.join(REPO_ROOT, 'proof');
const PROOF_LATEST_DIR = path.join(PROOF_DIR, 'latest');
const PROOF_LATEST_RUNTIME_DIR = path.join(PROOF_LATEST_DIR, 'runtime');
const PROOF_LATEST_SPAWN_DIR = path.join(PROOF_LATEST_DIR, 'spawn');
const PROOF_MANIFEST_PATH = path.join(PROOF_LATEST_DIR, 'proof-manifest.json');
const FORCE_METRICS_FAIL = process.env.PROOF_FORCE_METRICS_FAIL === '1';
const ORCHESTRATED = process.env.PROOF_ORCHESTRATED === '1';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function readJsonIfExists(filePath) {
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
  if (ORCHESTRATED) return;
  const prev = readJsonIfExists(PROOF_MANIFEST_PATH);
  if (!prev) return;
  const entries = Array.isArray(prev.entries) ? prev.entries : [];
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    if (e.exists !== true) continue;
    if (!e.path || typeof e.path !== 'string') continue;
    if (!e.sha256 || typeof e.sha256 !== 'string') continue;
    if (!fs.existsSync(e.path)) {
      throw new Error(`[runtime-proof] proof-manifest hash mismatch (missing): ${e.name || e.path}`);
    }
    const now = sha256File(e.path);
    if (now !== e.sha256) {
      throw new Error(`[runtime-proof] proof-manifest hash mismatch: ${e.name || e.path}`);
    }
  }
}

function teeStdIO({ latestPath, stampedPath }) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(latestPath, '', 'utf8');
  fs.writeFileSync(stampedPath, '', 'utf8');

  const latestStream = fs.createWriteStream(latestPath, { flags: 'a' });
  const stampedStream = fs.createWriteStream(stampedPath, { flags: 'a' });

  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  const origStderrWrite = process.stderr.write.bind(process.stderr);

  function writeBoth(chunk) {
    try {
      latestStream.write(chunk);
    } catch {
      // ignore
    }
    try {
      stampedStream.write(chunk);
    } catch {
      // ignore
    }
  }

  process.stdout.write = (chunk, encoding, cb) => {
    writeBoth(chunk);
    return origStdoutWrite(chunk, encoding, cb);
  };
  process.stderr.write = (chunk, encoding, cb) => {
    writeBoth(chunk);
    return origStderrWrite(chunk, encoding, cb);
  };

  return {
    close() {
      process.stdout.write = origStdoutWrite;
      process.stderr.write = origStderrWrite;
      try {
        latestStream.end();
      } catch {
        // ignore
      }
      try {
        stampedStream.end();
      } catch {
        // ignore
      }
    }
  };
}

function createForensics({ artifactDir }) {
  ensureDir(artifactDir);
  const configPath = path.join(artifactDir, 'config.json');
  const configs = { normal: null, dry: null };

  return {
    configPath,
    setConfig(mode, configObj) {
      configs[mode] = configObj;
    },
    writeServerLine() {
      // no-op (capture writes logs directly)
    },
    flushConfigs() {
      const payload = {
        ts: new Date().toISOString(),
        minUptimeDelta: MIN_UPTIME_DELTA,
        configs
      };
      writeFileUtf8(configPath, JSON.stringify(payload, null, 2));
    },
    close() {
      // no-op
    }
  };
}

function parseMetricValue(text, metricName) {
  if (typeof text !== 'string' || !text) return null;
  if (typeof metricName !== 'string' || !metricName) return null;

  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (!line.startsWith(metricName)) continue;

    const afterName = line.slice(metricName.length);
    if (!afterName || (!afterName.startsWith(' ') && !afterName.startsWith('\t') && !afterName.startsWith('{'))) {
      continue;
    }

    let rest = afterName.trimStart();
    if (rest.startsWith('{')) {
      const endIdx = rest.indexOf('}');
      if (endIdx === -1) return null;
      rest = rest.slice(endIdx + 1).trimStart();
    }

    const m = rest.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)/);
    if (!m) return null;
    const num = Number(m[1]);
    return Number.isFinite(num) ? num : null;
  }

  return null;
}

function writeRuntimeProofConfig({ outDir, dryRun, upstreamPort, runTag, mode }) {
  ensureDir(outDir);
  const configPath = path.join(outDir, `config-${mode}-${dryRun ? 'dry' : 'normal'}.json`);

  const config = {
    version: '1.0.0',
    server: { port: 0, host: '127.0.0.1', requestTimeoutMs: 1000 },
    endpoints: [
      {
        name: 'ollama-proof',
        url: `http://127.0.0.1:${upstreamPort}/__proof/ollama`,
        model: 'dummy',
        weight: 1,
        priority: 1,
        enabled: true
      }
    ],
    routing: { strategy: 'failover' },
    rateLimit: { enabled: false },
    features: {
      dryRun: Boolean(dryRun),
      replay: false,
      plugins: false,
      streaming: false,
      idempotency: false
    }
  };

  writeFileUtf8(configPath, JSON.stringify(config, null, 2));

  if (!fs.existsSync(configPath)) {
    throw new Error(`writeRuntimeProofConfig: failed to create config file at ${configPath}`);
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.version !== 'string' || !parsed.version) {
      throw new Error('missing required field "version"');
    }
  } catch (err) {
    throw new Error(`writeRuntimeProofConfig: invalid JSON proof config at ${configPath}`, { cause: err });
  }

  return { configPath, config: { ...config, __proof: { mode, upstreamPort } } };
}

async function startUpstreamStub() {
  let requestCount = 0;
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/__proof/ollama') {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: 'NOT_FOUND' }));
      return;
    }
    requestCount += 1;
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ response: 'ok' }));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const addr = server.address();
  const port = addr && typeof addr === 'object' ? addr.port : null;
  if (!Number.isFinite(port) || port <= 0) {
    server.close();
    throw new Error('upstream stub: failed to bind port');
  }

  return {
    port,
    get requestCount() {
      return requestCount;
    },
    resetCount() {
      requestCount = 0;
    },
    async close() {
      await new Promise((resolve) => server.close(resolve));
    }
  };
}

function spawnProductionServer({ configPath }) {
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
      stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
      shell: false,
      windowsHide: true,
      detached: process.platform === 'win32'
    };
    if (spawnOpts.shell) throw new Error('shell spawn not allowed in production proof');
    child = spawn(process.execPath, [SERVER_ENTRY], spawnOpts);
  } catch (err) {
    if (err && typeof err === 'object' && err.code === 'EPERM') {
      throw new Error('spawnProductionServer: EPERM while spawning production-server.js', { cause: err });
    }
    throw err;
  }

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child.__spawnTarget = SERVER_ENTRY;

  return child;
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

function createLogCapture({ tag, runTag, artifactDir }) {
  ensureDir(artifactDir);
  const logPath = path.join(artifactDir, 'server.log');
  const stdoutPath = path.join(artifactDir, 'stdout.log');
  const stderrPath = path.join(artifactDir, 'stderr.log');
  const stream = fs.createWriteStream(logPath, { flags: 'a' });
  const stdoutStream = fs.createWriteStream(stdoutPath, { flags: 'a' });
  const stderrStream = fs.createWriteStream(stderrPath, { flags: 'a' });

  try {
    stream.write(`\n=== ${tag} (${runTag}) ===\n`);
    stdoutStream.write(`\n=== ${tag} (${runTag}) ===\n`);
    stderrStream.write(`\n=== ${tag} (${runTag}) ===\n`);
  } catch {
    // ignore
  }

  const maxLines = 2000;
  const ring = [];
  const pushLine = (line) => {
    ring.push(line);
    if (ring.length > maxLines) ring.splice(0, ring.length - maxLines);
  };

  const state = { stdoutBuf: '', stderrBuf: '' };

  let resolvePort;
  let rejectPort;
  const portPromise = new Promise((resolve, reject) => {
    resolvePort = resolve;
    rejectPort = reject;
  });

  function feed(kind, chunk) {
    const text = String(chunk);
    if (kind === 'stdout') state.stdoutBuf += text;
    else state.stderrBuf += text;

    let buf = kind === 'stdout' ? state.stdoutBuf : state.stderrBuf;
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).replace(/\r$/, '');
      const prefixed = `${kind}: ${line}`;
      try {
        stream.write(`${prefixed}\n`);
      } catch {
        // ignore
      }
      try {
        if (kind === 'stdout') stdoutStream.write(`${line}\n`);
        else stderrStream.write(`${line}\n`);
      } catch {
        // ignore
      }
      pushLine(prefixed);
      if (kind === 'stdout') {
        const m = line.match(/Server listening at http:\/\/127\.0\.0\.1:(\d+)/);
        if (m) resolvePort(Number(m[1]));
      }
      buf = buf.slice(idx + 1);
    }
    if (kind === 'stdout') state.stdoutBuf = buf;
    else state.stderrBuf = buf;
  }

  function tail(count = 120) {
    return ring.slice(Math.max(0, ring.length - count)).join('\n');
  }

  function close() {
    try {
      if (state.stdoutBuf) stream.write(`stdout: ${state.stdoutBuf.replace(/\r/g, '')}\n`);
      if (state.stderrBuf) stream.write(`stderr: ${state.stderrBuf.replace(/\r/g, '')}\n`);
      stream.end();
    } catch {
      // ignore
    }
    try {
      stdoutStream.end();
    } catch {
      // ignore
    }
    try {
      stderrStream.end();
    } catch {
      // ignore
    }
  }

  return { logPath, stdoutPath, stderrPath, feed, tail, close, portPromise, rejectPort };
}

async function waitForListening({ child, capture, timeoutMs = 15000 }) {
  const timeout = setTimeout(() => {
    capture.rejectPort(new Error('Timed out waiting for listen line'));
  }, timeoutMs);
  timeout.unref?.();

  const onExit = (code, signal) => {
    capture.rejectPort(
      new Error(`Server exited before listening (code=${code}, signal=${signal}).`)
    );
  };
  const onError = (err) => {
    if (err && typeof err === 'object' && err.code === 'EPERM') {
      capture.rejectPort(
        new Error(`spawnProductionServer: EPERM while spawning ${child.__spawnTarget || 'process'}`, { cause: err })
      );
      return;
    }
    capture.rejectPort(err);
  };

  child.once('exit', onExit);
  child.once('error', onError);
  child.stdout.on('data', (d) => capture.feed('stdout', d));
  child.stderr.on('data', (d) => capture.feed('stderr', d));

  try {
    const port = await capture.portPromise;
    return { port };
  } finally {
    clearTimeout(timeout);
    child.removeListener('exit', onExit);
    child.removeListener('error', onError);
  }
}

async function fetchText(url, options = {}) {
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : 2000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  timeout.unref?.();
  const { timeoutMs: _ignored, ...rest } = options;
  try {
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal, ...rest });
    const text = await res.text();
    return { res, text };
  } finally {
    clearTimeout(timeout);
  }
}

async function stopChild(child) {
  if (child.exitCode !== null) return child.exitCode;
  const waitForExitCode = (ms) =>
    new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for server to exit')), ms);
      timeout.unref?.();
      child.once('exit', (code) => {
        clearTimeout(timeout);
        resolve(code);
      });
    });

  // Kill switch verification:
  // - Non-Windows: SIGTERM must result in clean exit code 0.
  // - Windows: IPC shutdown is the deterministic equivalent; fallback to SIGTERM only if needed.
  if (process.platform !== 'win32') {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
    try {
      const code = await waitForExitCode(15000);
      if (code !== 0) throw new Error(`[runtime-proof] kill switch failure (exit ${code})`);
      return code;
    } catch (err) {
      throw new Error('[runtime-proof] kill switch failure', { cause: err });
    }
  }

  if (typeof child.send === 'function') {
    try {
      child.send({ type: 'shutdown' });
      const code = await waitForExitCode(15000);
      if (code !== 0) throw new Error(`[runtime-proof] kill switch failure (exit ${code})`);
      return code;
    } catch {
      // fall through to SIGTERM
    }
  }

  if (process.platform === 'win32') {
    try {
      child.kill('SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        child.kill();
      }
    }
  } else {
    try {
      child.kill('SIGTERM');
    } catch {
      child.kill();
    }
  }

  const code = await waitForExitCode(15000);
  if (code !== 0) throw new Error(`[runtime-proof] kill switch failure (exit ${code})`);
  return code;
}

function isRetryableConnectError(err) {
  const code = err?.cause?.code || err?.code;
  const msg = String(err && err.message ? err.message : '');
  if (err?.name === 'AbortError') return true;
  if (code === 'ECONNREFUSED') return true;
  if (code === 'ECONNRESET') return true;
  if (code === 'UND_ERR_CONNECT_TIMEOUT') return true;
  if (msg.includes('ECONNREFUSED')) return true;
  if (msg.includes('ECONNRESET')) return true;
  if (msg.toLowerCase().includes('fetch failed')) return true;
  return false;
}

async function getAndParseMetricsOnce({ baseUrl, tag }) {
  const out = await fetchText(`${baseUrl}/metrics`, { timeoutMs: 2500 });
  assert.equal(out.res.status, 200, `${tag}: GET /metrics should return 200`);
  assert.match(out.res.headers.get('content-type') || '', /text\/plain/i, `${tag}: /metrics content-type`);
  for (const key of ['neuralshell_uptime_seconds', 'neuralshell_requests_total', 'neuralshell_failures_total']) {
    assert.ok(out.text.includes(key), `${tag}: /metrics should include ${key}`);
  }

  const uptime = parseMetricValue(out.text, 'neuralshell_uptime_seconds');
  const requests = parseMetricValue(out.text, 'neuralshell_requests_total');
  const failures = parseMetricValue(out.text, 'neuralshell_failures_total');
  assert.ok(uptime !== null, `${tag}: parse neuralshell_uptime_seconds`);
  assert.ok(requests !== null, `${tag}: parse neuralshell_requests_total`);
  assert.ok(failures !== null, `${tag}: parse neuralshell_failures_total`);

  return { uptime, requests, failures, text: out.text };
}

async function getAndParseMetrics({ baseUrl, tag, deadlineMs = 3000 }) {
  const deadlineAt = Date.now() + deadlineMs;
  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await getAndParseMetricsOnce({ baseUrl, tag });
    } catch (err) {
      const now = Date.now();
      if (now >= deadlineAt || !isRetryableConnectError(err)) {
        throw err;
      }
      await sleep(Math.min(150, 40 + attempt * 10));
    }
  }
}

function appendMetricsSnapshot({ artifactDir, label, text }) {
  try {
    fs.appendFileSync(
      path.join(artifactDir, 'metrics.txt'),
      `\n=== ${label} ===\n${String(text || '').trimEnd()}\n`,
      'utf8'
    );
  } catch {
    // ignore
  }
}

async function hitHealth({ baseUrl, count, tag }) {
  for (let i = 0; i < count; i += 1) {
    const out = await fetchText(`${baseUrl}/health`, { timeoutMs: 1500 });
    assert.equal(out.res.status, 200, `${tag}: GET /health should return 200`);
  }
}

function purgeStateDirIfStandalone({ runTagBase }) {
  const deletedPaths = [];
  const targets = [];
  const errors = [];

  const tearRuntimeDir = path.join(REPO_ROOT, 'NeuralShell_Desktop', '.tear_runtime');
  targets.push(STATE_DIR);
  targets.push(tearRuntimeDir);

  const rmTree = (p) => {
    try {
      if (!fs.existsSync(p)) return;
      fs.rmSync(p, { recursive: true, force: true, maxRetries: 6, retryDelay: 50 });
      deletedPaths.push(p);
    } catch (err) {
      errors.push({ path: p, error: String(err && err.message ? err.message : err) });
    }
  };

  // Cold-start must be mandatory even under the verify spine. Purge runtime state
  // without deleting proof artifacts under state/proofs/**.
  try {
    if (fs.existsSync(STATE_DIR)) {
      const entries = fs.readdirSync(STATE_DIR, { withFileTypes: true });
      for (const e of entries) {
        if (e && e.name === 'proofs') continue;
        rmTree(path.join(STATE_DIR, e.name));
      }
    }
  } catch (err) {
    errors.push({ path: STATE_DIR, error: String(err && err.message ? err.message : err) });
  }

  // Purge any TEAR runtime dir used by shipped TEAR/EXE.
  rmTree(tearRuntimeDir);

  // Validate purge outcome deterministically.
  try {
    if (fs.existsSync(STATE_DIR)) {
      const remaining = fs
        .readdirSync(STATE_DIR, { withFileTypes: true })
        .map((e) => e.name)
        .filter((n) => n !== 'proofs');
      if (remaining.length) {
        errors.push({ path: STATE_DIR, error: `remaining entries after purge: ${remaining.join(', ')}` });
      }
    }
  } catch (err) {
    errors.push({ path: STATE_DIR, error: String(err && err.message ? err.message : err) });
  }
  if (fs.existsSync(tearRuntimeDir)) {
    errors.push({ path: tearRuntimeDir, error: 'TEAR runtime dir still exists after purge' });
  }

  if (errors.length) {
    const msg = [
      '[runtime-proof] cold start purge failed',
      ...errors.map((e) => `- ${e.path}: ${e.error}`)
    ].join('\n');
    throw new Error(msg);
  }

  try {
    // Keep state dir present for downstream proofs; never delete state/proofs.
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
  } catch {
    // ignore
  }
  return { purged: true, deletedPaths, targets };
}

function copyFileIfExists(src, dst) {
  try {
    if (!fs.existsSync(src)) return false;
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
    return true;
  } catch {
    return false;
  }
}

function buildAndWriteManifest({ artifactDir, runTagBase }) {
  if (ORCHESTRATED) return;
  ensureDir(PROOF_LATEST_DIR);
  ensureDir(PROOF_LATEST_RUNTIME_DIR);
  ensureDir(PROOF_LATEST_SPAWN_DIR);

  // Copy current runtime artifacts into stable proof/latest locations.
  const runtimeCopies = [
    ['server.log', 'server.log'],
    ['stdout.log', 'stdout.log'],
    ['stderr.log', 'stderr.log'],
    ['metrics.txt', 'metrics.txt'],
    ['config.json', 'config.json'],
    ['metadata.json', 'metadata.json'],
    ['sha256.txt', 'sha256.txt']
  ];
  for (const [srcName, dstName] of runtimeCopies) {
    copyFileIfExists(path.join(artifactDir, srcName), path.join(PROOF_LATEST_RUNTIME_DIR, dstName));
  }

  // If a matching spawn phase exists (verify_runner run), copy spawn artifacts too.
  const spawnDir = path.join(REPO_ROOT, 'state', 'proofs', `${runTagBase}-spawn`);
  if (fs.existsSync(spawnDir)) {
    const spawnCopies = [
      ['server.log', 'server.log'],
      ['stdout.log', 'stdout.log'],
      ['stderr.log', 'stderr.log'],
      ['metrics.txt', 'metrics.txt'],
      ['config.json', 'config.json'],
      ['metadata.json', 'metadata.json'],
      ['sha256.txt', 'sha256.txt']
    ];
    for (const [srcName, dstName] of spawnCopies) {
      copyFileIfExists(path.join(spawnDir, srcName), path.join(PROOF_LATEST_SPAWN_DIR, dstName));
    }
  }

  const exePath = path.join(REPO_ROOT, 'NeuralShell_Desktop', 'dist', 'NeuralShell-TEAR-Runtime.exe');
  const tearPath = path.join(REPO_ROOT, 'NeuralShell_Desktop', 'tear-runtime.js');

  const manifest = {
    ts: new Date().toISOString(),
    node: process.version,
    platform: process.platform,
    runTagBase,
    algo: 'sha256',
    entries: []
  };

  const addEntry = (name, p) => {
    const exists = fs.existsSync(p);
    manifest.entries.push({
      name,
      path: p,
      exists,
      sha256: exists ? sha256File(p) : null
    });
  };

  addEntry('runtime.server.log', path.join(PROOF_LATEST_RUNTIME_DIR, 'server.log'));
  addEntry('runtime.stdout.log', path.join(PROOF_LATEST_RUNTIME_DIR, 'stdout.log'));
  addEntry('runtime.stderr.log', path.join(PROOF_LATEST_RUNTIME_DIR, 'stderr.log'));
  addEntry('runtime.metrics.txt', path.join(PROOF_LATEST_RUNTIME_DIR, 'metrics.txt'));
  addEntry('runtime.config.json', path.join(PROOF_LATEST_RUNTIME_DIR, 'config.json'));
  addEntry('runtime.metadata.json', path.join(PROOF_LATEST_RUNTIME_DIR, 'metadata.json'));
  addEntry('spawn.server.log', path.join(PROOF_LATEST_SPAWN_DIR, 'server.log'));
  addEntry('production-server.js', SERVER_ENTRY);
  addEntry('tear-runtime.js', tearPath);
  addEntry('NeuralShell-TEAR-Runtime.exe', exePath);

  writeFileUtf8(PROOF_MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  try {
    writeFileUtf8(path.join(artifactDir, 'proof-manifest.json'), JSON.stringify(manifest, null, 2));
  } catch {
    // ignore
  }
}

async function postPrompt({ baseUrl, headers = {}, body, tag, expectStatus }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  timeout.unref?.();
  try {
    const out = await fetch(`${baseUrl}/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    assert.equal(out.status, expectStatus, `${tag}: POST /prompt should return ${expectStatus}`);
    let json = null;
    try {
      json = await out.json();
    } catch {
      // leave as null (still a proof failure below if required)
    }
    return { status: out.status, json };
  } finally {
    clearTimeout(timeout);
  }
}

async function run() {
  if (process.env.PROOF_FORCE_FAIL === '1') {
    throw new Error('[proof] forced failure');
  }
  verifyPreviousManifestOrThrow();
  const runTagBase = process.env.PROOF_RUN_TS || safeTimestamp();
  process.env.PROOF_RUN_TS = runTagBase;
  process.env.PROOF_PHASE = process.env.PROOF_PHASE || 'runtime';

  const artifactDir = createArtifactDir({ repoRoot: REPO_ROOT, tag: 'runtime', runTagBase });
  process.env.PROOF_ARTIFACT_DIR = artifactDir;
  ensureDir(artifactDir);
  // Placeholders for required artifact contract.
  writeFileUtf8(path.join(artifactDir, 'stdout.log'), '');
  writeFileUtf8(path.join(artifactDir, 'stderr.log'), '');
  writeFileUtf8(path.join(artifactDir, 'config.json'), '');
  writeFileUtf8(path.join(artifactDir, 'metrics.txt'), '');
  writeFileUtf8(path.join(artifactDir, 'metadata.json'), '');
  writeFileUtf8(path.join(artifactDir, 'sha256.txt'), '');

  // Cold start clean-state validation (mandatory; never skipped).
  let purge = { purged: false, deletedPaths: [], targets: [] };
  fs.mkdirSync(STATE_DIR, { recursive: true });
  try {
    purge = purgeStateDirIfStandalone({ runTagBase });
  } catch (err) {
    const startedAt = new Date().toISOString();
    const failedMeta = {
      phase: 'runtime',
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      budgetMs: 30000,
      ok: false,
      artifactDir,
      coldStart: { purged: false, error: String(err && err.stack ? err.stack : err) }
    };
    try {
      writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(failedMeta, null, 2));
    } catch {
      // ignore
    }
    throw err;
  }

  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const forensics = createForensics({ artifactDir });
  const summary = {
    normal: { ok: false },
    dry: { ok: false }
  };

  const printSummary = () => {
    console.log('--- PROOF SUMMARY ---');
    console.log(
      `coldStart: purged=${purge && purge.purged ? 'true' : 'false'} deleted=${purge && Array.isArray(purge.deletedPaths) ? purge.deletedPaths.length : 0}`
    );
    for (const key of ['normal', 'dry']) {
      const s = summary[key];
      if (!s || !s.baseUrl) {
        console.log(`${key}: FAIL (no data)`);
        continue;
      }
      const parts = [
        `${key}: ${s.ok ? 'PASS' : 'FAIL'}`,
        `port=${s.port}`,
        `minUptimeΔ=${MIN_UPTIME_DELTA}`,
        `uptimeΔ=${s.uptimeDeltaSec?.toFixed?.(2) ?? 'n/a'}`,
        `requestsΔ=${s.requestsDelta ?? 'n/a'}`,
        `failuresΔ=${s.failuresDelta ?? 'n/a'}`
      ];
      if (typeof s.expectedRequestsDelta === 'number') parts.push(`expectedRequestsΔ=${s.expectedRequestsDelta}`);
      if (typeof s.expectedFailuresDelta === 'number') parts.push(`expectedFailuresΔ=${s.expectedFailuresDelta}`);
      if (s.restartResetOk) parts.push(`restartReset=PASS req0=${s.restartRequests0} fail0=${s.restartFailures0}`);
      else parts.push('restartReset=FAIL');
      if (s.shutdownCheckOk) parts.push('shutdownCheck=PASS');
      else parts.push('shutdownCheck=FAIL');
      console.log(parts.join(' | '));
    }
    console.log(`RESULT: ${summary.normal.ok && summary.dry.ok ? 'PASS' : 'FAIL'}`);
    console.log('---------------------');
  };

  const upstream = await startUpstreamStub();
  let upstreamClosed = false;

  const runOne = async ({ mode, dryRun, successPrompts, dryRunPrompts }) => {
    const tag = mode;
    const runTag = `${runTagBase}-${mode}`;
    const { configPath, config } = writeRuntimeProofConfig({
      outDir: artifactDir,
      mode,
      dryRun,
      upstreamPort: upstream.port,
      runTag
    });
    forensics.setConfig(mode, config);
    const capture = createLogCapture({ tag, runTag, artifactDir });

    let child;
    try {
      upstream.resetCount();
      child = spawnProductionServer({ configPath });
      const listen = await waitForListening({ child, capture });
      const baseUrl = `http://127.0.0.1:${listen.port}`;
      summary[mode] = { ok: false, port: listen.port, baseUrl };

      const m1 = await getAndParseMetrics({ baseUrl, tag: `${tag}: metrics#1`, deadlineMs: 3000 });
      appendMetricsSnapshot({ artifactDir, label: `${tag} metrics#1`, text: m1.text });
      assert.equal(m1.requests, 0, `${tag}: restart semantics: requests_total should be 0 at first metrics read`);
      assert.equal(m1.failures, 0, `${tag}: restart semantics: failures_total should be 0 at first metrics read`);
      summary[mode].restartResetOk = true;
      summary[mode].restartRequests0 = m1.requests;
      summary[mode].restartFailures0 = m1.failures;

      // PHASE 1: Behavioral mutation validation (not just existence).
      // Send real traffic, then ensure /metrics counters actually change.
      await hitHealth({ baseUrl, count: 3, tag: `${tag}: mutate` });
      // Uptime is emitted at 2-decimal resolution; ensure enough wall time passes to observe monotonic increase.
      await sleep(120);
      const m1b = await getAndParseMetrics({ baseUrl, tag: `${tag}: metrics#1b`, deadlineMs: 3000 });
      appendMetricsSnapshot({ artifactDir, label: `${tag} metrics#1b`, text: m1b.text });
      if (!(m1b.requests > m1.requests && m1b.uptime > m1.uptime)) {
        throw new Error('[runtime-proof] metrics did not mutate as expected');
      }

      if (mode === 'normal') {
        const p1 = await fetchText(`${baseUrl}/__proof/ollama`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({}),
          timeoutMs: 1500
        });
        assert.equal(p1.res.status, 200, `${tag}: proof endpoint should be reachable from localhost`);
        const j1 = JSON.parse(p1.text);
        assert.equal(j1?.response, 'ok', `${tag}: proof endpoint should return deterministic JSON`);

        const p2 = await fetchText(`${baseUrl}/__proof/ollama`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '8.8.8.8' },
          body: JSON.stringify({}),
          timeoutMs: 1500
        });
        assert.equal(p2.res.status, 200, `${tag}: proof endpoint must ignore x-forwarded-for spoofing`);
        console.log(`[runtime-proof] ${tag} proofEndpointCheck: PASS`);
      }

      await sleep(150);
      const m2 = await getAndParseMetrics({ baseUrl, tag: `${tag}: metrics#2`, deadlineMs: 3000 });
      appendMetricsSnapshot({ artifactDir, label: `${tag} metrics#2`, text: m2.text });
      assert.ok(m2.uptime > m1.uptime, `${tag}: uptime must monotonically increase`);
      const uptimeDeltaSec = Number((m2.uptime - m1.uptime).toFixed(2));
      assert.ok(
        uptimeDeltaSec >= MIN_UPTIME_DELTA,
        `${tag}: uptime delta must be >= ${MIN_UPTIME_DELTA}s (got ${uptimeDeltaSec}s)`
      );

      const baseRequests = m2.requests;
      const baseFailures = m2.failures;

      const promptPayload = { messages: [{ role: 'user', content: 'proof' }] };

      if (!dryRun) {
        for (let i = 0; i < successPrompts; i += 1) {
          const res = await postPrompt({
            baseUrl,
            body: promptPayload,
            tag: `${tag}: success prompt#${i + 1}`,
            expectStatus: 200
          });
          assert.ok(
            typeof res.json?.choices?.[0]?.message?.content === 'string',
            `${tag}: success prompt#${i + 1} should return OpenAI-like JSON`
          );
        }

        const forced = await postPrompt({
          baseUrl,
          headers: { 'x-proof-fail': '1' },
          body: promptPayload,
          tag: `${tag}: forced failure`,
          expectStatus: 500
        });
        assert.equal(forced.json?.error, 'PROOF_FORCED_FAILURE', `${tag}: forced failure error code`);
        assert.equal(
          upstream.requestCount,
          successPrompts,
          `${tag}: upstream stub must be called exactly once per success prompt`
        );
      } else {
        for (let i = 0; i < dryRunPrompts; i += 1) {
          const res = await postPrompt({
            baseUrl,
            body: promptPayload,
            tag: `${tag}: dry-run prompt#${i + 1}`,
            expectStatus: 200
          });
          assert.equal(res.json?._meta?.dryRun, true, `${tag}: dry-run prompt#${i + 1} should be dry-run`);
        }

        const res2 = await postPrompt({
          baseUrl,
          headers: { 'x-proof-fail': '1' },
          body: promptPayload,
          tag: `${tag}: dry-run forced-failure attempt`,
          expectStatus: 200
        });
        assert.equal(res2.json?._meta?.dryRun, true, `${tag}: dry-run forced-failure attempt should still be dry-run`);
        assert.equal(upstream.requestCount, 0, `${tag}: upstream stub must NOT be called in dry-run`);
      }

      const m3 = await getAndParseMetrics({ baseUrl, tag: `${tag}: metrics#3`, deadlineMs: 3000 });
      appendMetricsSnapshot({ artifactDir, label: `${tag} metrics#3`, text: m3.text });

      const requestsDelta = m3.requests - baseRequests;
      const failuresDelta = m3.failures - baseFailures;

      let expectedRequestsDelta = null;
      let expectedFailuresDelta = null;

      if (!dryRun) {
        // Between metrics#2 and metrics#3 response bodies:
        // - +1 for metrics#2 request itself (counted after response; not included in metrics#2 body)
        // - +1 per success prompt (HTTP /prompt)
        // - +1 for forced failure (HTTP /prompt)
        expectedRequestsDelta = 1 + successPrompts + 1;
        expectedFailuresDelta = 1;
        assert.equal(
          requestsDelta,
          expectedRequestsDelta,
          `${tag}: neuralshell_requests_total must increase by EXACT expected delta`
        );
        assert.equal(
          failuresDelta,
          expectedFailuresDelta,
          `${tag}: neuralshell_failures_total must increase by EXACT expected delta`
        );
      } else {
        // Between metrics#2 and metrics#3 response bodies:
        // - +1 for metrics#2 request itself
        // - +1 per dry-run prompt (HTTP /prompt)
        // - +1 for dry-run forced failure attempt (still HTTP /prompt, but must not fail)
        expectedRequestsDelta = 1 + dryRunPrompts + 1;
        expectedFailuresDelta = 0;
        assert.equal(
          requestsDelta,
          expectedRequestsDelta,
          `${tag}: neuralshell_requests_total must increase by EXACT expected delta`
        );
        assert.equal(
          failuresDelta,
          expectedFailuresDelta,
          `${tag}: neuralshell_failures_total MUST NOT increase in dry-run`
        );
      }

      summary[mode] = {
        ...summary[mode],
        ok: true,
        port: listen.port,
        baseUrl,
        uptimeDeltaSec,
        requestsDelta,
        failuresDelta,
        expectedRequestsDelta,
        expectedFailuresDelta
      };

      const exitCode = await stopChild(child);
      assert.equal(exitCode, 0, `${tag}: server should exit 0 on shutdown`);

      // Shutdown down-ness check: /metrics must be unreachable after shutdown.
      let shutdownReachable = false;
      let shutdownEvidence = '';
      try {
        await fetchText(`${baseUrl}/metrics`, { timeoutMs: 800 });
        shutdownReachable = true;
      } catch (err) {
        shutdownEvidence = String(err && err.message ? err.message : err);
      }
      assert.equal(shutdownReachable, false, `${tag}: shutdownCheck: /metrics must be unreachable after shutdown`);
      summary[mode].shutdownCheckOk = true;
      summary[mode].shutdownEvidence = shutdownEvidence;
      console.log(`[runtime-proof] ${tag} shutdownCheck: PASS (metrics unreachable: ${shutdownEvidence})`);
    } catch (err) {
      summary[mode] = { ...(summary[mode] || {}), ok: false };
      dumpConfig('runtime-proof', configPath);
      console.error('[runtime-proof] SERVER_OUTPUT_TAIL (last 120 lines)');
      console.error(capture.tail(120));
      console.error(`[runtime-proof] SERVER_LOG_PATH: ${capture.logPath}`);
      console.error(`[runtime-proof] ARTIFACT_DIR: ${artifactDir}`);
      if (FORCE_METRICS_FAIL) {
        console.error('[runtime-proof] failure injection detected');
      }
      const code = err?.cause?.code || err?.code;
      if (code === 'EPERM') {
        console.error('[runtime-proof] failed at spawnProductionServer: EPERM');
        printSpawnBlocked('runtime-proof', err);
        console.error(err && err.stack ? err.stack : err);
        throw err;
      }
      throw err;
    } finally {
      try {
        if (child) await stopChild(child);
      } catch {
        // ignore
      }
      capture.close();
    }
  };

  try {
    console.log(`[runtime-proof] MIN_UPTIME_DELTA=${MIN_UPTIME_DELTA} (CI=${process.env.CI === 'true' ? 'true' : 'false'})`);
    console.log('[runtime-proof] normal-mode');
    await runOne({ mode: 'normal', dryRun: false, successPrompts: 3, dryRunPrompts: 0 });
    console.log('[runtime-proof] dry-run');
    await runOne({ mode: 'dry', dryRun: true, successPrompts: 0, dryRunPrompts: 1 });
    summary.normal.ok = summary.normal.ok && true;
    summary.dry.ok = summary.dry.ok && true;
  } finally {
    try {
      forensics.flushConfigs();
    } catch {
      // ignore
    }
    forensics.close();
    if (!upstreamClosed) {
      upstreamClosed = true;
      try {
        await upstream.close();
      } catch {
        // ignore
      }
    }
    printSummary();
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startMs;
    const meta = {
      phase: 'runtime',
      startedAt,
      finishedAt,
      durationMs,
      budgetMs: 30000,
      ok: Boolean(summary.normal.ok && summary.dry.ok),
      artifactDir,
      coldStart: purge,
      summary
    };
    writeFileUtf8(path.join(artifactDir, 'metadata.json'), JSON.stringify(meta, null, 2));
    writeSha256Txt({
      artifactDir,
      entries: [{ label: 'production-server.js', path: SERVER_ENTRY }]
    });
    buildAndWriteManifest({ artifactDir, runTagBase });
    if (durationMs > 30000) {
      throw new Error(`Timing budget exceeded: ${durationMs}ms > 30000ms`);
    }
    if (!fs.existsSync(STATE_DIR)) {
      throw new Error('[runtime-proof] cold start validation failed: state dir missing after run');
    }
    if (!fs.existsSync(path.join(STATE_DIR, 'proofs'))) {
      throw new Error('[runtime-proof] cold start validation failed: state/proofs missing after run');
    }
  }

  if (summary.normal.ok && summary.dry.ok) {
    console.log('[runtime-proof] ok');
    process.exit(0);
  }
  process.exit(1);
}

run().catch(async (err) => {
  console.error('[runtime-proof] failed');
  console.error(err && err.stack ? err.stack : err);
  await sleep(50);
  process.exitCode = 1;
});
