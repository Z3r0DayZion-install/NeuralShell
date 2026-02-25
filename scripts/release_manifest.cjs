const fs = require('fs');
const path = require('path');

const { ensureDir, safeTimestamp, sha256File, writeFileUtf8 } = require('./_proof_lib.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const DESKTOP_ROOT = path.join(REPO_ROOT, 'NeuralShell_Desktop');

function parseArgs(argv) {
  const args = { runTs: null, out: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--runTs') {
      args.runTs = String(argv[i + 1] || '');
      i++;
      continue;
    }
    if (a === '--out') {
      args.out = String(argv[i + 1] || '');
      i++;
      continue;
    }
  }
  return args;
}

function listFilesRecursive(dirPath) {
  const out = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dirPath, e.name);
    if (e.isDirectory()) out.push(...listFilesRecursive(p));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fileStat(filePath) {
  const st = fs.statSync(filePath);
  return { size: st.size };
}

function asRel(p) {
  const rel = path.relative(REPO_ROOT, p);
  return rel.split(path.sep).join('/');
}

function pickDesktopArtifacts(distDir) {
  if (!fs.existsSync(distDir)) return [];
  const all = listFilesRecursive(distDir);
  const keep = all.filter((p) => {
    const base = path.basename(p).toLowerCase();
    if (base.endsWith('.exe')) return true;
    if (base.endsWith('.exe.blockmap')) return true;
    if (base.endsWith('.yml')) return true;
    if (base.endsWith('.zip')) return true;
    if (base.endsWith('.sha256')) return true;
    if (base.includes('checksum')) return true;
    return false;
  });
  keep.sort((a, b) => asRel(a).localeCompare(asRel(b)));
  return keep;
}

function writeManifestOutputs({ releaseDir, manifestPath, manifest }) {
  ensureDir(path.dirname(manifestPath));
  writeFileUtf8(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  const manifestSha = sha256File(manifestPath);
  writeFileUtf8(`${manifestPath}.sha256`, `${manifestSha}\n`);

  const shaLines = [];
  const shaTxtPath = path.join(releaseDir, 'release.sha256.txt');

  shaLines.push(`${manifestSha}  release.manifest.json  ${manifestPath}`);

  function toAbs(rel) {
    const parts = String(rel || '').split('/').filter(Boolean);
    return path.join(REPO_ROOT, ...parts);
  }

  try {
    const proofTarAbs = toAbs(manifest.proofBundle && manifest.proofBundle.tar ? manifest.proofBundle.tar : '');
    if (proofTarAbs && fs.existsSync(proofTarAbs)) {
      shaLines.push(`${sha256File(proofTarAbs)}  proof-bundle.tar.gz  ${proofTarAbs}`);
    }
  } catch {
    // ignore
  }

  try {
    const proofManifestAbs = toAbs(manifest.proofBundle && manifest.proofBundle.manifest ? manifest.proofBundle.manifest : '');
    if (proofManifestAbs && fs.existsSync(proofManifestAbs)) {
      shaLines.push(`${sha256File(proofManifestAbs)}  proof-bundle.manifest.json  ${proofManifestAbs}`);
    }
  } catch {
    // ignore
  }

  for (const a of manifest.artifacts || []) {
    try {
      const abs = toAbs(a.path);
      if (abs && fs.existsSync(abs)) {
        shaLines.push(`${sha256File(abs)}  ${path.basename(abs)}  ${abs}`);
      }
    } catch {
      // ignore
    }
  }

  writeFileUtf8(shaTxtPath, shaLines.join('\n') + '\n');

  return { manifestSha, shaTxtPath };
}

function buildReleaseManifest({ runTs }) {
  if (!runTs) throw new Error('Missing --runTs');

  const proofBundleDir = path.join(STATE_DIR, 'proof_bundles', runTs);
  const proofTar = path.join(proofBundleDir, `proof-bundle-${runTs}.tar.gz`);
  const proofTarSha = `${proofTar}.sha256`;
  const proofBundleManifest = path.join(proofBundleDir, 'bundle.manifest.json');

  if (!fs.existsSync(proofBundleDir)) throw new Error(`Missing proof bundle dir: ${proofBundleDir}`);
  if (!fs.existsSync(proofTar)) throw new Error(`Missing proof bundle tar: ${proofTar}`);
  if (!fs.existsSync(proofTarSha)) throw new Error(`Missing proof bundle tar sha256: ${proofTarSha}`);
  if (!fs.existsSync(proofBundleManifest)) throw new Error(`Missing proof bundle manifest: ${proofBundleManifest}`);

  const bundleManifest = readJson(proofBundleManifest);
  const distDir = path.join(DESKTOP_ROOT, 'dist');
  const desktopArtifacts = pickDesktopArtifacts(distDir);

  const artifacts = [];
  for (const p of desktopArtifacts) {
    const st = fileStat(p);
    artifacts.push({
      path: asRel(p),
      size: st.size,
      sha256: sha256File(p)
    });
  }

  const proofTarShaValue = fs.readFileSync(proofTarSha, 'utf8').trim();
  const proofTarShaComputed = sha256File(proofTar);
  if (proofTarShaValue !== proofTarShaComputed) {
    throw new Error(`Proof bundle sha256 mismatch: file=${proofTarShaValue} computed=${proofTarShaComputed}`);
  }

  return {
    schemaVersion: '1',
    runTs,
    createdAt: new Date().toISOString(),
    platform: {
      node: process.version,
      arch: process.arch,
      platform: process.platform
    },
    git: {
      root: { head: bundleManifest && bundleManifest.git && bundleManifest.git.root ? bundleManifest.git.root.head : null },
      desktop: { head: bundleManifest && bundleManifest.git && bundleManifest.git.desktop ? bundleManifest.git.desktop.head : null }
    },
    proofBundle: {
      dir: asRel(proofBundleDir),
      tar: asRel(proofTar),
      tarSha256: proofTarShaValue,
      manifest: asRel(proofBundleManifest),
      manifestSha256: sha256File(proofBundleManifest)
    },
    desktopDist: {
      dir: asRel(distDir),
      artifactCount: artifacts.length
    },
    artifacts
  };
}

function main() {
  const args = parseArgs(process.argv);
  const runTs = args.runTs || process.env.PROOF_RUN_TS || safeTimestamp();
  const releaseDir = path.join(STATE_DIR, 'releases', runTs);
  ensureDir(releaseDir);

  const manifest = buildReleaseManifest({ runTs });
  const outPath = args.out ? path.resolve(args.out) : path.join(releaseDir, 'release.manifest.json');
  const { manifestSha, shaTxtPath } = writeManifestOutputs({ releaseDir, manifestPath: outPath, manifest });

  process.stdout.write(`[release-manifest] ok runTs=${runTs}\n`);
  process.stdout.write(`[release-manifest] out=${outPath}\n`);
  process.stdout.write(`[release-manifest] sha256=${manifestSha}\n`);
  process.stdout.write(`[release-manifest] sha256.txt=${shaTxtPath}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`[release-manifest] FAIL ${String(err && err.message ? err.message : err)}\n`);
    process.exit(1);
  }
}
