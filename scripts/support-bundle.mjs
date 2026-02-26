import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', cwd, windowsHide: true });
  if ((r.status ?? 1) !== 0) return { ok: false, stdout: r.stdout || '', stderr: r.stderr || '' };
  return { ok: true, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function redactText(s) {
  let out = String(s ?? '');
  // key/value style
  out = out.replace(/(api[_-]?key|token|secret|password|authorization)\s*[:=]\s*([^\s#\r\n]+)/gi, '$1=REDACTED');
  // JSON-ish
  out = out.replace(/("(api[_-]?key|token|secret|password|authorization)"\s*:\s*")([^"]+)(")/gi, '$1REDACTED$4');
  // Bearer tokens
  out = out.replace(/Bearer\s+[A-Za-z0-9._\-~+/]+=*/g, 'Bearer REDACTED');
  // long base64 blobs
  out = out.replace(/[A-Za-z0-9+/]{200,}={0,2}/g, 'REDACTED_BLOB');
  return out;
}

function tailFile(filePath, maxLines) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    const tail = lines.slice(Math.max(0, lines.length - maxLines)).join(os.EOL);
    return tail;
  } catch {
    return null;
  }
}

function copyRedacted(src, dst) {
  if (!fs.existsSync(src)) return false;
  const raw = fs.readFileSync(src, 'utf8');
  ensureDir(path.dirname(dst));
  fs.writeFileSync(dst, redactText(raw), 'utf8');
  return true;
}

function writeText(dst, text) {
  ensureDir(path.dirname(dst));
  fs.writeFileSync(dst, text, 'utf8');
}

const root = process.cwd();
const outRoot = path.join(root, 'out', 'support', ts());
ensureDir(outRoot);

const manifest = { createdAt: new Date().toISOString(), files: [] };

function record(relPath) {
  manifest.files.push(relPath.replace(/\\/g, '/'));
}

// System info
writeText(
  path.join(outRoot, 'system.json'),
  JSON.stringify(
    {
      platform: process.platform,
      arch: process.arch,
      node: process.version,
      cwd: root,
      env: {
        NODE_ENV: process.env.NODE_ENV || null,
        CI: process.env.CI || null
      }
    },
    null,
    2
  )
);
record('system.json');

// Git info
const gitHead = run('git', ['rev-parse', 'HEAD'], root);
if (gitHead.ok) {
  writeText(path.join(outRoot, 'git', 'HEAD.txt'), gitHead.stdout.trim() + os.EOL);
  record('git/HEAD.txt');

  const gitStatus = run('git', ['status', '--porcelain=v1'], root);
  writeText(path.join(outRoot, 'git', 'status_porcelain.txt'), gitStatus.stdout);
  record('git/status_porcelain.txt');

  const gitDiffStat = run('git', ['diff', '--stat'], root);
  writeText(path.join(outRoot, 'git', 'diff_stat.txt'), gitDiffStat.stdout);
  record('git/diff_stat.txt');
}

// Core project files (redacted where needed)
const redactedFiles = [
  'config.yaml',
  'config.yaml.example',
  '.env.example'
];
for (const rel of redactedFiles) {
  const src = path.join(root, rel);
  const dst = path.join(outRoot, 'project', rel);
  if (copyRedacted(src, dst)) record(`project/${rel}`);
}

const plainFiles = ['package.json', 'Dockerfile', 'README.md', 'RUST.md'];
for (const rel of plainFiles) {
  const src = path.join(root, rel);
  const dst = path.join(outRoot, 'project', rel);
  if (fs.existsSync(src)) {
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
    record(`project/${rel}`);
  }
}

// Docker compose files
for (const name of ['docker-compose.yml', 'docker-compose.prod.yml', 'docker-compose.intelligence.yml']) {
  const src = path.join(root, name);
  if (fs.existsSync(src)) {
    const dst = path.join(outRoot, 'project', name);
    ensureDir(path.dirname(dst));
    fs.copyFileSync(src, dst);
    record(`project/${name}`);
  }
}

// Tail logs/state
const logCandidates = [
  path.join(root, 'state', 'router_admin_audit.log'),
  path.join(root, 'state', 'router_runtime_state.json')
];
for (const p of logCandidates) {
  if (!fs.existsSync(p)) continue;
  const relName = path.basename(p);
  const content = relName.endsWith('.log') ? tailFile(p, 500) : fs.readFileSync(p, 'utf8');
  if (content == null) continue;
  writeText(path.join(outRoot, 'state', relName), redactText(content));
  record(`state/${relName}`);
}

// Tool versions
const versions = {
  npm: run('npm', ['-v'], root).stdout.trim() || null,
  docker: run('docker', ['--version'], root).stdout.trim() || null
};
writeText(path.join(outRoot, 'versions.json'), JSON.stringify(versions, null, 2));
record('versions.json');

// Write manifest
writeText(path.join(outRoot, 'MANIFEST.json'), JSON.stringify(manifest, null, 2));
record('MANIFEST.json');

console.log(`SUPPORT_BUNDLE_DIR=${outRoot}`);
