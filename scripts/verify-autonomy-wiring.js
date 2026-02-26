import { spawn } from 'child_process';
import crypto from 'crypto';
import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'production-server.js');

console.log('Starting autonomy wiring verification...');

const proofToken = `proof-${crypto.randomUUID()}`;
const adminToken = `proof-admin-${crypto.randomUUID()}`;
let port = Number.isFinite(Number(process.env.NS_VERIFY_PORT)) ? Number(process.env.NS_VERIFY_PORT) : 0;

function attachLineReader(stream, onLine) {
  let buf = '';
  stream.on('data', (chunk) => {
    const s = chunk.toString('utf8');
    buf += s;
    while (true) {
      const idx = buf.indexOf('\n');
      if (idx === -1) {
        break;
      }
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      try {
        onLine(line);
      } catch {
        // ignore parsing failures
      }
    }
  });
}

const serverProcess = spawn(process.execPath, [serverPath], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PROOF_MODE: '1',
    NS_PROOF_TOKEN: proofToken,
    ADMIN_TOKEN: adminToken,
    PORT: String(port),
    AUTO_HEALING: '1',
    AUTO_SCALING: '1',
    AUTO_ANOMALY_DETECTION: '1',
    AUTO_PROCESS_MANAGEMENT: '1',
    DRY_RUN: '1',
    PLUGINS_ENABLED: '0',
    SWARM_ENABLED: '0',
    HIVE_ENABLED: '0',
    FEDERATION_ENABLED: '0',
    EVOLUTION_ENABLED: '0'
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
  detached: false,
  shell: false
});

attachLineReader(serverProcess.stdout, (line) => {
  process.stdout.write(`${line}\n`);
  const m = /Server listening at http:\/\/(?:127\.0\.0\.1|localhost):(\d+)/.exec(line);
  if (m && m[1]) {
    const parsed = Number(m[1]);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 65535) {
      port = parsed;
    }
  }
});

attachLineReader(serverProcess.stderr, (line) => {
  process.stderr.write(`${line}\n`);
});

serverProcess.on('error', (err) => {
  console.error('Failed to start server process:', err);
  cleanup(1).catch(() => process.exit(1));
});

async function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: responseBody }));
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServerReady({ timeoutMs = 15000 } = {}) {
  const portStart = Date.now();
  while (!Number.isFinite(port) || port <= 0) {
    if (Date.now() - portStart > timeoutMs) {
      throw new Error(`Server did not report listening port within ${timeoutMs}ms`);
    }
    await sleep(50);
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await makeRequest({
        hostname: 'localhost',
        port,
        path: '/health',
        method: 'GET'
      });
      if (res.statusCode === 200) {
        return;
      }
    } catch {
      // ignore until timeout
    }
    await sleep(200);
  }
  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

async function checkAutonomy() {
  console.log('Server started! Verifying Autonomy Controller...');

  // 1) Check /admin/autonomy status
  const statusRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/admin/autonomy',
    method: 'GET',
    headers: { 'x-admin-token': adminToken }
  });

  console.log(`Autonomy Status Code: ${statusRes.statusCode}`);
  if (statusRes.statusCode !== 200) {
    console.error('Autonomy status endpoint failed');
    await cleanup(1);
    return;
  }

  const status = JSON.parse(statusRes.body);
  console.log('Enabled Modules:', status.enabledModules);

  if (status.moduleCount === 0) {
    console.error('FAILURE: No autonomy modules enabled');
    await cleanup(1);
    return;
  }

  // 2) Trigger an event by making a request
  console.log('Triggering request_completed event...');
  await makeRequest({
    hostname: 'localhost',
    port,
    path: '/health',
    method: 'GET'
  });

  // 3) Check metrics
  console.log('Checking if metrics reflect activity...');
  const metricsRes = await makeRequest({
    hostname: 'localhost',
    port,
    path: '/metrics/autonomy',
    method: 'GET'
  });

  console.log('Autonomy Metrics:');
  console.log(metricsRes.body);

  if (metricsRes.body.includes('autonomy_controller_uptime_seconds')) {
    console.log('SUCCESS: Autonomy wiring verified!');
    await cleanup(0);
    return;
  }

  console.error('FAILURE: Autonomy metrics missing expected data');
  await cleanup(1);
}

async function cleanup(code) {
  try {
    await makeRequest({
      hostname: 'localhost',
      port,
      path: '/__proof/shutdown',
      method: 'POST',
      headers: { 'x-neuralshell-proof-token': proofToken }
    }).catch(() => {});
  } finally {
    if (serverProcess) {
      try {
        serverProcess.kill();
      } catch {
        // ignore
      }
    }
    process.exit(code);
  }
}

waitForServerReady()
  .then(() => checkAutonomy())
  .catch((err) => {
    console.error('TIMEOUT:', err && err.message ? err.message : String(err));
    cleanup(1);
  });
