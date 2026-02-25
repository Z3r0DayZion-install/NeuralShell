const fs = require('fs');
const path = require('path');

const { ensureDir, sha256File, writeFileUtf8 } = require('./_proof_lib.cjs');

function parseArgs(argv) {
  const args = { runTs: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--runTs') {
      args.runTs = String(argv[i + 1] || '');
      i++;
      continue;
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv);
  const runTs = args.runTs || process.env.PROOF_RUN_TS;
  if (!runTs) throw new Error('Missing --runTs (or PROOF_RUN_TS)');

  const repoRoot = path.resolve(__dirname, '..');
  const stateDir = path.join(repoRoot, 'state');
  const releaseDir = path.join(stateDir, 'releases', runTs);
  const proofTar = path.join(stateDir, 'proof_bundles', runTs, `proof-bundle-${runTs}.tar.gz`);
  const proofTarShaPath = `${proofTar}.sha256`;

  ensureDir(releaseDir);

  const receipt = {
    schemaVersion: '1',
    runTs,
    createdAt: new Date().toISOString(),
    proofBundle: {
      tar: proofTar,
      sha256: fs.existsSync(proofTarShaPath) ? fs.readFileSync(proofTarShaPath, 'utf8').trim() : null
    },
    releaseManifest: {
      path: path.join(releaseDir, 'release.manifest.json'),
      sha256: null
    }
  };

  const manifestShaPath = `${receipt.releaseManifest.path}.sha256`;
  if (fs.existsSync(manifestShaPath)) {
    receipt.releaseManifest.sha256 = fs.readFileSync(manifestShaPath, 'utf8').trim();
  }

  const receiptPath = path.join(releaseDir, 'release.receipt.json');
  writeFileUtf8(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  writeFileUtf8(`${receiptPath}.sha256`, `${sha256File(receiptPath)}\n`);

  process.stdout.write(`[release-receipt] ok runTs=${runTs}\n`);
  process.stdout.write(`[release-receipt] out=${receiptPath}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`[release-receipt] FAIL ${String(err && err.message ? err.message : err)}\n`);
    process.exit(1);
  }
}

