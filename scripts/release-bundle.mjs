import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function run(cmd, args, { cwd, env, allowFail = false } = {}) {
  const r = spawnSync(cmd, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32'
  });

  if (r.error) {
    if (!allowFail) {
      throw new Error(`${cmd} ${args.join(' ')} failed to start: ${r.error.message}`);
    }
    return { ok: false, stdout: r.stdout || '', stderr: r.stderr || '' };
  }

  const ok = (r.status ?? 1) === 0;
  if (!ok && !allowFail) {
    throw new Error(
      `${cmd} ${args.join(' ')} failed (exit=${r.status})\nstdout:\n${r.stdout || ''}\nstderr:\n${r.stderr || ''}`
    );
  }

  return { ok, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function writeText(p, s) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, 'utf8');
}

function copyIfExists(src, dst) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  return true;
}

function sha256File(p) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(p));
  return h.digest('hex');
}

async function getFreePort() {
  return await new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const port = addr && typeof addr === 'object' ? addr.port : null;
      srv.close(() => resolve(port));
    });
  });
}

async function waitForHealth({ port, attempts, delayMs }) {
  const url = `http://localhost:${port}/health`;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.status === 200) return await res.text();
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`health check failed: ${url}`);
}

function parseArgs(argv) {
  const out = { requireClean: false, port: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--require-clean') out.requireClean = true;
    if (a === '--port') {
      out.port = Number(argv[i + 1] || 0);
      i += 1;
    }
  }
  return out;
}

async function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv);
  if (!Number.isFinite(args.port) || args.port <= 0) {
    args.port = await getFreePort();
  }

  const sha = run('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim() || 'nogit';
  const status = run('git', ['status', '--porcelain=v1'], { cwd: root, allowFail: true }).stdout;
  const dirty = status.trim().length > 0;
  if (args.requireClean && dirty) {
    throw new Error('git working tree is dirty; rerun without --require-clean or commit/clean first');
  }

  const outRoot = path.join(root, 'out', 'releases', `${ts()}-${sha}`);
  const outDesktop = path.join(outRoot, 'desktop');
  const outDocker = path.join(outRoot, 'docker');
  const outGit = path.join(outRoot, 'git');
  ensureDir(outDesktop);
  ensureDir(outDocker);
  ensureDir(outGit);

  // Desktop verify + checksums
  run('npm', ['--prefix', 'NeuralShell_Desktop', 'run', 'verify:release'], {
    cwd: root,
    env: { NODE_ENV: 'development' }
  });
  run('npm', ['--prefix', 'NeuralShell_Desktop', 'run', 'checksums'], {
    cwd: root,
    env: { NODE_ENV: 'development' }
  });

  const dist = path.join(root, 'NeuralShell_Desktop', 'dist');
  for (const f of fs.readdirSync(dist)) {
    const src = path.join(dist, f);
    if (!fs.statSync(src).isFile()) continue;

    if (
      /^NeuralShell-TEAR-Setup-.*\.exe$/i.test(f) ||
      /^NeuralShell-TEAR-Portable-.*\.exe$/i.test(f) ||
      /^NeuralShell-TEAR-Runtime\.exe$/i.test(f) ||
      /^RELEASE_CHECKSUMS\.txt$/i.test(f) ||
      /^latest\.yml$/i.test(f)
    ) {
      copyIfExists(src, path.join(outDesktop, f));
    }
  }

  // Git metadata
  writeText(
    path.join(outGit, 'HEAD.txt'),
    run('git', ['rev-parse', 'HEAD'], { cwd: root, allowFail: true }).stdout.trim() + '\n'
  );
  writeText(path.join(outGit, 'status_porcelain.txt'), status);
  writeText(path.join(outGit, 'diff.patch'), run('git', ['diff'], { cwd: root, allowFail: true }).stdout);

  // Docker build + smoke
  if (process.platform === 'win32') {
    run('docker', ['desktop', 'start'], { cwd: root, allowFail: true });
  }
  run('docker', ['info'], { cwd: root });

  const tag = `neuralshell:1.0.0-dirty-${sha}`;
  run('docker', ['build', '-t', tag, '-f', 'Dockerfile', '.'], { cwd: root });

  const name = `neuralshell-smoke-${crypto.randomBytes(4).toString('hex')}`;
  run('docker', ['run', '-d', '--rm', '-p', `${args.port}:3000`, '--name', name, tag], { cwd: root });

  let healthBody = null;
  let logs = '';
  try {
    healthBody = await waitForHealth({ port: args.port, attempts: 80, delayMs: 500 });
    logs = run('docker', ['logs', '--tail', '200', name], { cwd: root, allowFail: true }).stdout;
  } finally {
    run('docker', ['stop', name], { cwd: root, allowFail: true });
  }

  writeText(path.join(outDocker, 'health.json'), healthBody || '');
  writeText(path.join(outDocker, 'container_logs.txt'), logs);
  writeText(path.join(outDocker, 'image_inspect.json'), run('docker', ['image', 'inspect', tag], { cwd: root }).stdout);

  // Optional SBOM (if plugin works)
  const sbom = run('docker', ['sbom', tag, '--format', 'spdx-json'], { cwd: root, allowFail: true });
  if (sbom.ok && sbom.stdout.trim()) {
    writeText(path.join(outDocker, 'sbom.spdx.json'), sbom.stdout);
  }

  // Save image
  const tarPath = path.join(outDocker, `neuralshell-1.0.0-dirty-${sha}.tar`);
  run('docker', ['save', '-o', tarPath, tag], { cwd: root });

  // Report + checksums
  const report = [
    'NeuralShell Release Bundle',
    `Git: ${sha} (${dirty ? 'dirty' : 'clean'})`,
    `Docker tag: ${tag}`,
    `Smoke port: ${args.port}`,
    `Desktop dist: ${dist}`,
    '',
    'Notes:',
    '- EXEs are not code-signed.',
    '- Bundle contains docker image tarball and SHA256 sums.'
  ].join('\n');
  writeText(path.join(outRoot, 'REPORT.txt'), report + '\n');

  const sums = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile()) {
        const rel = path.relative(outRoot, p).replace(/\\/g, '/');
        sums.push({ path: rel, sha256: sha256File(p), bytes: fs.statSync(p).size });
      }
    }
  };
  walk(outRoot);
  sums.sort((a, b) => a.path.localeCompare(b.path));
  writeText(path.join(outRoot, 'SHA256SUMS.json'), JSON.stringify(sums, null, 2));

  console.log(`RELEASE_DIR=${outRoot}`);
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
