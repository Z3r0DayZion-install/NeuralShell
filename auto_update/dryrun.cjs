const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createAutoUpdateLane } = require('./lane');

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

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function ensureFixture(root) {
  const fixtureDir = path.join(root, 'tmp', 'auto-update-dryrun');
  fs.mkdirSync(fixtureDir, { recursive: true });

  const packagePath = path.join(fixtureDir, 'update-package.bin');
  const targetPath = path.join(fixtureDir, 'target-runtime.bin');
  const latestYmlPath = path.join(fixtureDir, 'latest.yml');
  const signaturePath = path.join(fixtureDir, 'update-package.sig');
  const publicKeyPath = path.join(fixtureDir, 'update-public.pem');

  fs.writeFileSync(packagePath, `update:${Date.now()}:${Math.random()}\n`, 'utf8');
  fs.writeFileSync(targetPath, 'runtime-current\n', 'utf8');

  const expectedSha256 = sha256File(packagePath);

  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const signature = crypto.sign(null, Buffer.from(expectedSha256, 'utf8'), privateKey).toString('base64');

  fs.writeFileSync(signaturePath, `${signature}\n`, 'utf8');
  fs.writeFileSync(publicKeyPath, publicKey.export({ type: 'spki', format: 'pem' }), 'utf8');

  const latestYml = [
    `path: ${path.basename(packagePath)}`,
    `sha256: ${expectedSha256}`,
    `signatureFile: ${path.basename(signaturePath)}`,
    `publicKeyFile: ${path.basename(publicKeyPath)}`,
    'signatureAlgorithm: ed25519'
  ].join('\n');
  fs.writeFileSync(latestYmlPath, `${latestYml}\n`, 'utf8');

  return {
    packagePath,
    targetPath,
    latestYmlPath,
    signaturePath,
    publicKeyPath,
    expectedSha256
  };
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(__dirname, '..');
  const userDataPath = path.join(root, 'release', 'auto-update-dryrun-state');
  const lane = createAutoUpdateLane({ userDataPath });

  const fixture = ensureFixture(root);
  const packagePath = args.package ? path.resolve(root, args.package) : fixture.packagePath;
  const targetPath = args.target ? path.resolve(root, args.target) : fixture.targetPath;
  const latestYmlPath = args.latest ? path.resolve(root, args.latest) : fixture.latestYmlPath;
  const signaturePath = args.signature ? path.resolve(root, args.signature) : fixture.signaturePath;
  const publicKeyPath = args.pubkey ? path.resolve(root, args.pubkey) : fixture.publicKeyPath;
  const expectedSha256 = String(args.sha256 || fixture.expectedSha256).trim().toLowerCase();

  const verify = lane.verifyLatestYmlAndPackage(latestYmlPath, packagePath, {
    expectedSha256,
    signaturePath,
    publicKeyPath,
    algorithm: 'ed25519'
  });

  const scheduled = lane.scheduleSwapOnRestart({
    packagePath,
    expectedSha256,
    targetPath,
    signaturePath,
    publicKeyPath,
    algorithm: 'ed25519'
  });

  let applied = {
    ok: true,
    applied: false,
    reason: 'apply_skipped'
  };
  if (args.apply === 'true') {
    applied = lane.applyPendingSwap();
  }

  const report = {
    ok: true,
    generatedAt: new Date().toISOString(),
    laneRoot: lane.laneRoot,
    verify,
    scheduled,
    pending: lane.pendingSwapStatus(),
    applied
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

run();