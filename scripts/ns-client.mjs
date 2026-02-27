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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readFile(filePath) {
  return fs.readFileSync(filePath);
}

function httpJson(method, urlStr, tlsOpts, headers, bodyObj) {
  const url = new URL(urlStr);
  const body = bodyObj ? JSON.stringify(bodyObj) : '';
  const reqHeaders = {
    accept: 'application/json',
    ...(bodyObj ? { 'content-type': 'application/json' } : {}),
    ...(bodyObj ? { 'content-length': Buffer.byteLength(body) } : {}),
    ...headers
  };

  const options = {
    method,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || 443,
    path: `${url.pathname}${url.search}`,
    headers: reqHeaders,
    rejectUnauthorized: true,
    ...tlsOpts
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          // ignore
        }
        resolve({ statusCode: res.statusCode, text, json });
      });
    });
    req.on('error', reject);
    if (bodyObj) {
      req.write(body);
    }
    req.end();
  });
}

async function main() {
  const args = parseArgs(process.argv);

  const baseUrl = args['base-url'] || 'https://localhost:4443';
  const secretsPath = args['secrets'] || './local/lan-secrets.json';
  const caPemPath = args['ca-pem'] || './certs/ca/ca.crt';
  const clientPfxPath = args['client-pfx'] || './certs/clients/client-desktop.pfx';

  const mode = args['mode'] || 'prompt'; // health | prompt | tenants
  const message = args['message'] || 'ping';
  const model = args['model'] || 'dummy';

  if (!fs.existsSync(secretsPath)) {
    throw new Error(`Missing secrets file: ${secretsPath}`);
  }
  const secrets = readJson(secretsPath);

  const ca = readFile(caPemPath);
  const pfx = readFile(clientPfxPath);
  const passphrase = secrets.NS_TLS_PFX_PASSPHRASE;
  if (!passphrase) {
    throw new Error(`Missing NS_TLS_PFX_PASSPHRASE in ${secretsPath}`);
  }

  const tls = { ca, pfx, passphrase };

  if (mode === 'health') {
    const res = await httpJson('GET', new URL('/health', baseUrl).toString(), tls, {}, null);
    console.log(JSON.stringify(res.json ?? { statusCode: res.statusCode, text: res.text }, null, 2));
    return;
  }

  if (mode === 'tenants') {
    const adminToken = secrets.ADMIN_TOKEN;
    if (!adminToken) {
      throw new Error(`Missing ADMIN_TOKEN in ${secretsPath}`);
    }
    const res = await httpJson(
      'GET',
      new URL('/admin/tenants', baseUrl).toString(),
      tls,
      { 'x-admin-token': adminToken },
      null
    );
    if (res.statusCode !== 200) {
      throw new Error(`admin tenants failed: ${res.statusCode}: ${res.text}`);
    }
    console.log(JSON.stringify(res.json, null, 2));
    return;
  }

  if (mode === 'prompt') {
    const promptToken = secrets.PROMPT_TOKEN;
    if (!promptToken) {
      throw new Error(`Missing PROMPT_TOKEN in ${secretsPath}`);
    }

    const payload = {
      messages: [{ role: 'user', content: message }],
      model
    };
    const res = await httpJson(
      'POST',
      new URL('/prompt', baseUrl).toString(),
      tls,
      { 'x-prompt-token': promptToken },
      payload
    );
    if (res.statusCode !== 200) {
      throw new Error(`prompt failed: ${res.statusCode}: ${res.text}`);
    }
    console.log(JSON.stringify(res.json, null, 2));
    return;
  }

  throw new Error(`Unknown --mode: ${mode}`);
}

main().catch((err) => {
  console.error(`[ns-client] FAIL: ${err && err.message ? err.message : String(err)}`);
  process.exitCode = 1;
});

