const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PNG } = require('pngjs');

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

function drawFallbackPng(width, height) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (width * y + x) << 2;
      const ratioX = x / width;
      const ratioY = y / height;
      png.data[idx] = Math.round(2 + ratioX * 20);
      png.data[idx + 1] = Math.round(16 + ratioY * 52);
      png.data[idx + 2] = Math.round(35 + ratioX * 40);
      png.data[idx + 3] = 255;
    }
  }

  const border = 18;
  for (let y = border; y < height - border; y += 1) {
    for (let x = border; x < width - border; x += 1) {
      const isTop = y === border;
      const isBottom = y === height - border - 1;
      const isLeft = x === border;
      const isRight = x === width - border - 1;
      if (!isTop && !isBottom && !isLeft && !isRight) continue;
      const idx = (width * y + x) << 2;
      png.data[idx] = 34;
      png.data[idx + 1] = 211;
      png.data[idx + 2] = 238;
      png.data[idx + 3] = 220;
    }
  }

  return PNG.sync.write(png);
}

async function renderWithSharp(opts) {
  try {
    const sharp = require('sharp');
    const width = 1200;
    const height = 630;
    const title = String(opts.title || 'NeuralShell Proof Badge');
    const subtitle = String(opts.subtitle || 'Bridge sweep success');
    const repo = String(opts.repo || 'local-repo');
    const link = String(opts.link || '/share/local');

    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#bg)" />
  <rect x="34" y="34" width="${width - 68}" height="${height - 68}" rx="14" fill="none" stroke="#22d3ee" stroke-width="3" opacity="0.5" />
  <text x="76" y="120" fill="#22d3ee" font-size="48" font-weight="700" font-family="monospace">${title}</text>
  <text x="76" y="188" fill="#e2e8f0" font-size="30" font-weight="600" font-family="monospace">${subtitle}</text>
  <text x="76" y="252" fill="#94a3b8" font-size="24" font-family="monospace">Repo: ${repo}</text>
  <text x="76" y="316" fill="#67e8f9" font-size="24" font-family="monospace">Link: ${link}</text>
  <rect x="76" y="400" width="${width - 152}" height="160" rx="12" fill="#164e63" opacity="0.35" />
  <text x="106" y="500" fill="#cffafe" font-size="34" font-family="monospace" font-weight="700">Top-Notch Verified</text>
</svg>
`;

    return sharp(Buffer.from(svg)).png().toBuffer();
  } catch {
    return null;
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(__dirname, '..');

  const payload = {
    title: args.title || 'NeuralShell Proof Badge',
    subtitle: args.subtitle || 'Bridge sweep success',
    repo: args.repo || process.env.GITHUB_REPOSITORY || 'local-repo',
    link: args.link || '/share/local'
  };

  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(payload))
    .digest('hex')
    .slice(0, 20);

  const outPath = args.output
    ? path.resolve(root, args.output)
    : path.join(root, 'release', `share-proof-${hash}.png`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const sharpBuffer = await renderWithSharp(payload);
  const buffer = sharpBuffer || drawFallbackPng(1200, 630);
  fs.writeFileSync(outPath, buffer);

  const result = {
    ok: true,
    outputPath: path.relative(root, outPath).replace(/\\/g, '/'),
    hash,
    route: `/share/${hash}`,
    renderer: sharpBuffer ? 'sharp' : 'pngjs-fallback'
  };

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

run().catch((err) => {
  process.stderr.write(`[genShareImage] ${err && err.message ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
