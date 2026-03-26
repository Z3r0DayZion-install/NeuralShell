const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || '');
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith('--')) {
      out[key] = String(next);
      i += 1;
      continue;
    }
    out[key] = 'true';
  }
  return out;
}

function toBase64Url(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function readPayload(inputPath) {
  if (!inputPath) {
    return {
      generatedAt: new Date().toISOString(),
      messages: [],
      note: 'No input provided; generated empty share payload.',
    };
  }
  const text = fs.readFileSync(inputPath, 'utf8');
  return JSON.parse(text);
}

function encryptPayload(payload) {
  const plain = Buffer.from(JSON.stringify(payload || {}), 'utf8');
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const packedCipher = Buffer.concat([encrypted, authTag]);
  const digest = crypto.createHash('sha256').update(packedCipher).digest('hex');
  const hash = digest.slice(0, 20);
  return {
    hash,
    envelope: {
      v: 1,
      iv: toBase64Url(iv),
      c: toBase64Url(packedCipher),
      k: toBase64Url(key),
    },
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(__dirname, '..');
  const inputPath = args.input ? path.resolve(root, args.input) : '';
  const outDir = path.resolve(root, args['out-dir'] || 'static/share_blobs');
  const payload = readPayload(inputPath);
  const { hash, envelope } = encryptPayload(payload);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${hash}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(envelope, null, 2)}\n`, 'utf8');

  const summary = {
    ok: true,
    inputPath: inputPath || null,
    outputPath: path.relative(root, outPath).replace(/\\/g, '/'),
    hash,
    route: `/share/${hash}`,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();
