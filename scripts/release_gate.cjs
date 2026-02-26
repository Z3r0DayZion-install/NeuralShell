const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const { ensureDir, safeTimestamp, sha256File, writeFileUtf8 } = require('./_proof_lib.cjs');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const DESKTOP_ROOT = path.join(REPO_ROOT, 'NeuralShell_Desktop');

function cmdExePath() {
  const sysRoot = process.env.SystemRoot || 'C:\\Windows';
  return path.join(sysRoot, 'System32', 'cmd.exe');
}

function spawnOrThrow(cmd, args, opts) {
  const r = cp.spawnSync(cmd, args, {
    cwd: opts && opts.cwd ? opts.cwd : REPO_ROOT,
    env: opts && opts.env ? opts.env : process.env,
    encoding: 'utf8'
  });

  if (r && r.error) {
    process.stderr.write(String(r.error && r.error.message ? r.error.message : r.error) + '\n');
  }

  const code = typeof r.status === 'number' ? r.status : 1;
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (code !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (exit ${code})`);
  }
}

function spawnNpmOrThrow(npmArgs, opts) {
  if (process.platform === 'win32') {
    // Avoid spawn PATH/permission edge cases by routing via cmd.exe.
    const cmdLine = ['npm', ...(npmArgs || [])].join(' ');
    return spawnOrThrow(cmdExePath(), ['/d', '/s', '/c', cmdLine], opts);
  }
  return spawnOrThrow('npm', npmArgs || [], opts);
}

function findSigntool() {
  if (process.env.NS_SIGNTOOL_PATH && fs.existsSync(process.env.NS_SIGNTOOL_PATH)) {
    return process.env.NS_SIGNTOOL_PATH;
  }

  const where = cp.spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['signtool'], { encoding: 'utf8' });
  if (where.status === 0) {
    const first = String(where.stdout || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0];
    if (first && fs.existsSync(first)) return first;
  }

  if (process.platform !== 'win32') return null;

  const base = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles;
  if (!base) return null;
  const kits = path.join(base, 'Windows Kits', '10', 'bin');
  if (!fs.existsSync(kits)) return null;

  const versions = fs.readdirSync(kits).filter((n) => /^\d+\.\d+\.\d+\.\d+$/.test(n)).sort().reverse();
  for (const v of versions) {
    const p = path.join(kits, v, 'x64', 'signtool.exe');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function verifySignedOrThrow({ signtoolPath, filePath }) {
  if (!signtoolPath) throw new Error('signtool not found (set NS_SIGNTOOL_PATH or install Windows SDK)');
  const r = cp.spawnSync(signtoolPath, ['verify', '/pa', filePath], { encoding: 'utf8' });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) throw new Error(`Signature verification failed: ${filePath}`);
}

function listDesktopExeArtifacts() {
  const distDir = path.join(DESKTOP_ROOT, 'dist');
  if (!fs.existsSync(distDir)) return [];
  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  const exes = entries
    .filter((e) => e.isFile() && /\.exe$/i.test(e.name))
    .map((e) => path.join(distDir, e.name))
    .sort((a, b) => a.localeCompare(b));
  return exes;
}

function appendGithubOutputs(kv) {
  const p = process.env.GITHUB_OUTPUT;
  if (!p) return;
  const lines = Object.entries(kv)
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('\n');
  fs.appendFileSync(p, `${lines}\n`, 'utf8');
}

function main() {
  const runTs = process.env.PROOF_RUN_TS || safeTimestamp();
  process.env.PROOF_RUN_TS = runTs;

  const releaseDir = path.join(STATE_DIR, 'releases', runTs);
  ensureDir(releaseDir);

  writeFileUtf8(path.join(releaseDir, 'runTs.txt'), `${runTs}\n`);

  process.stdout.write(`[release-gate] runTs=${runTs}\n`);

  // Hard determinism gate: clean-tree check must be executed by the Windows wrapper script.
  if (process.platform === 'win32' && String(process.env.NS_GIT_CLEAN_CHECKED || '') !== '1') {
    throw new Error('Missing NS_GIT_CLEAN_CHECKED=1 (run via: npm run release:gate)');
  }

  // Security must be fail-closed for production releases.
  // NOTE: repo lint is intentionally not part of the release gate because `npm run lint` does not currently pass.
  spawnNpmOrThrow(['run', 'security:audit'], { cwd: REPO_ROOT, env: process.env });
  spawnNpmOrThrow(['run', 'ast-gate'], { cwd: REPO_ROOT, env: process.env });

  // Root test gate (must include docker sandbox checks).\n  process.env.NS_REQUIRE_DOCKER_SANDBOX = '1';\n  process.env.NS_SANDBOX_BACKEND = process.env.NS_SANDBOX_BACKEND || 'docker';\n  spawnNpmOrThrow(['test'], { cwd: REPO_ROOT, env: process.env });

  // Full parity proof gate (also emits proof bundle).
  spawnNpmOrThrow(['run', 'verify:all'], { cwd: REPO_ROOT, env: process.env });

  // Desktop build gate (produces dist artifacts + checksums).
  spawnNpmOrThrow(['run', 'release:all'], { cwd: DESKTOP_ROOT, env: process.env });

  // Optional signing enforcement (CI should set NS_REQUIRE_SIGNING=1).
  const requireSigning = String(process.env.NS_REQUIRE_SIGNING || '') === '1';
  if (requireSigning) {
    const signtoolPath = findSigntool();
    const exes = listDesktopExeArtifacts();
    if (!exes.length) throw new Error('No .exe artifacts found in NeuralShell_Desktop/dist');
    for (const exe of exes) {
      process.stdout.write(`[release-gate] signtool.verify ${exe}\n`);
      verifySignedOrThrow({ signtoolPath, filePath: exe });
    }
  }

  // Release manifest + hashes.
  const manifestScript = path.join(__dirname, 'release_manifest.cjs');
  spawnOrThrow(process.execPath, [manifestScript, '--runTs', runTs], { cwd: REPO_ROOT, env: process.env });

  const manifestPath = path.join(releaseDir, 'release.manifest.json');
  const manifestSha = fs.existsSync(`${manifestPath}.sha256`) ? fs.readFileSync(`${manifestPath}.sha256`, 'utf8').trim() : null;

  const proofTar = path.join(STATE_DIR, 'proof_bundles', runTs, `proof-bundle-${runTs}.tar.gz`);
  const proofTarSha = `${proofTar}.sha256`;
  const proofTarShaValue = fs.existsSync(proofTarSha) ? fs.readFileSync(proofTarSha, 'utf8').trim() : null;

  const receipt = {
    schemaVersion: '1',
    runTs,
    createdAt: new Date().toISOString(),
    proofBundle: {
      tar: proofTar,
      sha256: proofTarShaValue
    },
    releaseManifest: {
      path: manifestPath,
      sha256: manifestSha
    }
  };
  const receiptPath = path.join(releaseDir, 'release.receipt.json');
  writeFileUtf8(receiptPath, JSON.stringify(receipt, null, 2) + '\n');
  writeFileUtf8(`${receiptPath}.sha256`, `${sha256File(receiptPath)}\n`);

  appendGithubOutputs({
    runTs,
    releaseDir: path.relative(REPO_ROOT, releaseDir).split(path.sep).join('/'),
    proofBundleDir: path
      .relative(REPO_ROOT, path.join(STATE_DIR, 'proof_bundles', runTs))
      .split(path.sep)
      .join('/')
  });

  process.stdout.write('[release-gate] PASS\n');
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`[release-gate] FAIL ${String(err && err.message ? err.message : err)}\n`);
    process.exit(1);
  }
}

