const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function tailLines(lines, n) {
  if (lines.length <= n) return lines;
  return lines.slice(lines.length - n);
}

function createArtifactDir({ repoRoot, tag, runTagBase }) {
  const forced = process.env.PROOF_ARTIFACT_DIR;
  if (forced && typeof forced === 'string') {
    ensureDir(forced);
    return forced;
  }
  const ts = process.env.PROOF_RUN_TS || runTagBase;
  const phase = process.env.PROOF_PHASE || tag;
  const base = path.join(repoRoot, 'state', 'proofs', `${ts}-${phase}`);
  ensureDir(base);
  return base;
}

function writeFileUtf8(filePath, text) {
  fs.writeFileSync(filePath, String(text), 'utf8');
}

function readFileUtf8(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function writeSha256Txt({ artifactDir, entries }) {
  const lines = [];
  for (const e of entries || []) {
    try {
      const hash = sha256File(e.path);
      lines.push(`${hash}  ${e.label || path.basename(e.path)}  ${e.path}`);
    } catch {
      // ignore
    }
  }
  writeFileUtf8(path.join(artifactDir, 'sha256.txt'), lines.join('\n') + (lines.length ? '\n' : ''));
}

function createTeeFile({ filePath }) {
  ensureDir(path.dirname(filePath));
  writeFileUtf8(filePath, '');
  const stream = fs.createWriteStream(filePath, { flags: 'a' });
  const ring = [];

  function write(chunk) {
    const s = typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    ring.push(s);
    if (ring.length > 5000) ring.splice(0, ring.length - 5000);
    try {
      stream.write(s);
    } catch {
      // ignore
    }
  }

  return {
    filePath,
    write,
    lastLines(n) {
      return tailLines(ring, n).join('');
    },
    close() {
      try {
        stream.end();
      } catch {
        // ignore
      }
    }
  };
}

function createTranscript({ latestPath, stampedPath }) {
  const latest = latestPath ? createTeeFile({ filePath: latestPath }) : null;
  const stamped = createTeeFile({ filePath: stampedPath });

  function write(chunk) {
    process.stdout.write(chunk);
    if (latest) latest.write(chunk);
    stamped.write(chunk);
  }

  function writeLine(line) {
    write(`${line}\n`);
  }

  return {
    latestPath,
    stampedPath,
    write,
    writeLine,
    close() {
      if (latest) latest.close();
      stamped.close();
    }
  };
}

function spawnChild({ cmd, args, cwd, env, windowsHide = true }) {
  const child = spawn(cmd, args, {
    cwd,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide
  });
  return child;
}

function attachChildLogs({ child, tee, stdoutTee, stderrTee }) {
  const lines = [];
  function pushLine(line) {
    lines.push(line);
    if (lines.length > 8000) lines.splice(0, lines.length - 8000);
  }

  function onStdout(d) {
    const s = d.toString('utf8');
    if (tee) tee.write(s);
    if (stdoutTee) stdoutTee.write(s);
    const parts = s.split(/\r?\n/);
    for (const p of parts) {
      if (p.trim()) pushLine(p);
    }
  }

  function onStderr(d) {
    const s = d.toString('utf8');
    if (tee) tee.write(s);
    if (stderrTee) stderrTee.write(s);
    const parts = s.split(/\r?\n/);
    for (const p of parts) {
      if (p.trim()) pushLine(p);
    }
  }

  child.stdout.on('data', onStdout);
  child.stderr.on('data', onStderr);

  return {
    getLines() {
      return lines.slice();
    }
  };
}

function parseListeningFromLine(line) {
  const s = String(line || '');
  const m = s.match(/listening (?:on|at) http:\/\/(127\.0\.0\.1|localhost):(\d+)/i);
  if (!m) return null;
  return { host: m[1], port: Number(m[2]) };
}

async function waitForListening({ getLines, timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const lines = getLines();
    for (const line of lines) {
      const hit = parseListeningFromLine(line);
      if (hit && hit.port > 0) return hit;
    }
    await sleep(50);
  }
  throw new Error(`listen line not detected within ${timeoutMs}ms`);
}

function httpRequest({ url, method = 'GET', headers = {}, body = null, timeoutMs = 2000 }) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: u.pathname + u.search,
        method,
        headers
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({
            status: res.statusCode || 0,
            headers: res.headers || {},
            body: buf.toString('utf8')
          });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`timeout after ${timeoutMs}ms`));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function fetchMetrics({ baseUrl, timeoutMs = 1500 }) {
  return httpRequest({ url: `${baseUrl}/metrics`, timeoutMs });
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

function assertMetricsContract(metricsRes) {
  assert.equal(metricsRes.status, 200, `GET /metrics expected 200, got ${metricsRes.status}`);
  const ct = String(metricsRes.headers['content-type'] || '');
  assert.ok(ct.includes('text/plain'), `GET /metrics expected text/plain, got ${ct}`);

  const keys = ['neuralshell_uptime_seconds', 'neuralshell_requests_total', 'neuralshell_failures_total'];
  for (const k of keys) {
    const v = parseMetricValue(metricsRes.body, k);
    assert.ok(v !== null, `metrics missing ${k}`);
  }
}

async function assertUptimeMonotonic({ baseUrl, minDeltaSeconds }) {
  const m1 = await fetchMetrics({ baseUrl });
  assertMetricsContract(m1);
  const u1 = parseMetricValue(m1.body, 'neuralshell_uptime_seconds');
  assert.ok(u1 !== null, 'metrics missing neuralshell_uptime_seconds');
  await sleep(150);
  const m2 = await fetchMetrics({ baseUrl });
  assertMetricsContract(m2);
  const u2 = parseMetricValue(m2.body, 'neuralshell_uptime_seconds');
  assert.ok(u2 !== null, 'metrics missing neuralshell_uptime_seconds (second read)');
  const delta = u2 - u1;
  assert.ok(delta >= minDeltaSeconds, `uptimeΔ too small: u1=${u1} u2=${u2} Δ=${delta} min=${minDeltaSeconds}`);
  return { u1, u2, delta };
}

function assertExactDelta({ name, before, after, expectedDelta }) {
  const actualDelta = after - before;
  assert.equal(actualDelta, expectedDelta, `${name}Δ mismatch: expected ${expectedDelta}, got ${actualDelta} (from ${before} -> ${after})`);
  return actualDelta;
}

async function waitForMetricsReady({ baseUrl, deadlineMs }) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < deadlineMs) {
    try {
      const res = await fetchMetrics({ baseUrl, timeoutMs: 1000 });
      if (res.status === 200 && String(res.headers['content-type'] || '').includes('text/plain')) return res;
      lastErr = new Error(`metrics not ready: status=${res.status} content-type=${res.headers['content-type']}`);
    } catch (err) {
      lastErr = err;
    }
    await sleep(100);
  }
  const e = new Error(`waitForMetricsReady timeout after ${deadlineMs}ms`);
  e.cause = lastErr;
  throw e;
}

async function stopChild({ child, timeoutMs }) {
  if (!child || child.killed) return;
  try {
    child.kill('SIGTERM');
  } catch {
    // ignore
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) return;
    await sleep(50);
  }

  try {
    child.kill('SIGKILL');
  } catch {
    // ignore
  }
}

async function assertUnreachable({ url, deadlineMs }) {
  const start = Date.now();
  let last = null;
  while (Date.now() - start < deadlineMs) {
    try {
      await httpRequest({ url, timeoutMs: 800 });
      last = new Error('still reachable');
    } catch (err) {
      return { ok: true, err: String(err && err.message ? err.message : err) };
    }
    await sleep(100);
  }
  const e = new Error(`expected unreachable: ${url}`);
  e.cause = last;
  throw e;
}

function createLatestPointers({ repoRoot, tag, artifactDir }) {
  const stateDir = path.join(repoRoot, 'state');
  ensureDir(stateDir);
  const latestDir = path.join(stateDir, 'latest');
  ensureDir(latestDir);

  function linkCopy(srcName, latestName) {
    const src = path.join(artifactDir, srcName);
    const dst = path.join(stateDir, latestName);
    try {
      fs.copyFileSync(src, dst);
    } catch {
      // ignore
    }
    try {
      fs.copyFileSync(src, path.join(latestDir, `${tag}-${srcName}`));
    } catch {
      // ignore
    }
  }

  return { linkCopy };
}

module.exports = {
  assertExactDelta,
  assertMetricsContract,
  assertUnreachable,
  assertUptimeMonotonic,
  attachChildLogs,
  createArtifactDir,
  createLatestPointers,
  createTeeFile,
  createTranscript,
  ensureDir,
  fetchMetrics,
  httpRequest,
  parseMetricValue,
  readFileUtf8,
  safeTimestamp,
  sha256File,
  sleep,
  spawnChild,
  stopChild,
  waitForListening,
  waitForMetricsReady,
  writeFileUtf8,
  writeSha256Txt
};
