import fs from 'node:fs';
import https from 'node:https';
import { URL } from 'node:url';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) {
      continue;
    }
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

function readFileMaybe(filePath, label) {
  if (!filePath) {
    return null;
  }
  try {
    return fs.readFileSync(filePath);
  } catch (err) {
    throw new Error(`Failed to read ${label} at ${filePath}: ${err.message}`);
  }
}

function getEnvMaybe(name) {
  if (!name) {
    return null;
  }
  return process.env[name] ?? null;
}

function requestJson(urlStr, tlsOpts = {}, headers = {}) {
  const url = new URL(urlStr);
  const opts = {
    method: 'GET',
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || 443,
    path: `${url.pathname}${url.search}`,
    headers,
    rejectUnauthorized: true,
    ...tlsOpts
  };

  return new Promise((resolve, reject) => {
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = body ? JSON.parse(body) : null;
        } catch {
          // ignore
        }
        resolve({ statusCode: res.statusCode, body, json });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);

  const baseUrl = args['base-url'] || 'https://localhost:4443';
  const caPemPath = args['ca-pem'];
  const clientPfxPath = args['client-pfx'];
  const clientPassEnv = args['client-pass-env'];
  const adminTokenEnv = args['admin-token-env'];
  const expectClientCertRequired =
    args['expect-client-cert-required'] === true
    || args['expect-client-cert-required'] === '1'
    || args['expect-client-cert-required'] === 'true';

  if (!caPemPath) {
    throw new Error('Missing required arg: --ca-pem <path-to-ca.crt>');
  }
  if (!clientPfxPath) {
    throw new Error('Missing required arg: --client-pfx <path-to-client.pfx>');
  }
  if (!clientPassEnv) {
    throw new Error('Missing required arg: --client-pass-env <ENV_VAR_NAME>');
  }

  const ca = readFileMaybe(caPemPath, 'CA PEM');
  const pfx = readFileMaybe(clientPfxPath, 'client PFX');
  const passphrase = getEnvMaybe(clientPassEnv);
  if (!passphrase) {
    throw new Error(`Missing env var ${clientPassEnv} (client PFX passphrase)`);
  }

  const tlsNoClient = { ca };
  const tlsWithClient = { ca, pfx, passphrase };

  const healthUrl = new URL('/health', baseUrl).toString();
  const tenantsUrl = new URL('/admin/tenants', baseUrl).toString();

  let noClientOk = false;
  try {
    const res = await requestJson(healthUrl, tlsNoClient);
    noClientOk = res.statusCode === 200;
    console.log(`[mtls] /health without client cert: ${res.statusCode} (unexpected)`);
  } catch (err) {
    console.log(`[mtls] /health without client cert: expected FAIL (${err.code || err.message})`);
  }

  if (expectClientCertRequired && noClientOk) {
    throw new Error('Expected mTLS to require client cert, but /health succeeded without one');
  }

  const healthRes = await requestJson(healthUrl, tlsWithClient);
  if (healthRes.statusCode !== 200) {
    throw new Error(`/health with client cert expected 200, got ${healthRes.statusCode}: ${healthRes.body}`);
  }
  console.log('[mtls] /health with client cert: 200 OK');

  const tenantsNoToken = await requestJson(tenantsUrl, tlsWithClient);
  if (tenantsNoToken.statusCode !== 401) {
    throw new Error(`/admin/tenants without token expected 401, got ${tenantsNoToken.statusCode}: ${tenantsNoToken.body}`);
  }
  console.log('[mtls] /admin/tenants without token: 401 OK');

  const adminToken = getEnvMaybe(adminTokenEnv);
  if (!adminToken) {
    console.log('[mtls] skipping /admin/tenants with token (no admin token env provided)');
    return;
  }

  const tenantsWithToken = await requestJson(
    tenantsUrl,
    tlsWithClient,
    { 'x-admin-token': adminToken }
  );
  if (tenantsWithToken.statusCode !== 200) {
    throw new Error(`/admin/tenants with token expected 200, got ${tenantsWithToken.statusCode}: ${tenantsWithToken.body}`);
  }
  console.log('[mtls] /admin/tenants with token: 200 OK');
}

main().catch((err) => {
  console.error(`[mtls] FAIL: ${err && err.message ? err.message : String(err)}`);
  process.exitCode = 1;
});
