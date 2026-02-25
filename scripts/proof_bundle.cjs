const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { once } = require('node:events');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');
const PROOFS_DIR = path.join(STATE_DIR, 'proofs');
const BUNDLES_DIR = path.join(STATE_DIR, 'proof_bundles');

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // ignore
  }
}

function sha256File(filePath) {
  const h = crypto.createHash('sha256');
  const fd = fs.openSync(filePath, 'r');
  try {
    const buf = Buffer.allocUnsafe(64 * 1024);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const n = fs.readSync(fd, buf, 0, buf.length, null);
      if (!n) break;
      h.update(buf.subarray(0, n));
    }
  } finally {
    try {
      fs.closeSync(fd);
    } catch {
      // ignore
    }
  }
  return h.digest('hex');
}

function readLatestRunTs() {
  const p = path.join(PROOFS_DIR, 'LATEST_RUN.txt');
  const raw = fs.readFileSync(p, 'utf8');
  const ts = String(raw || '').trim();
  if (!ts) throw new Error('[proof-bundle] missing LATEST_RUN.txt');
  return ts;
}

function parseArgs(argv) {
  const out = { runTs: null };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--runTs' || a === '--run-ts') {
      out.runTs = argv[i + 1] || null;
      i += 1;
      continue;
    }
  }
  return out;
}

function runGit({ cwd, args }) {
  try {
    if (process.platform === 'win32') {
      try {
        const root = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
        const whereExe = path.join(root, 'System32', 'where.exe');
        if (fs.existsSync(whereExe)) {
          const w = spawnSync(whereExe, ['git'], { cwd, windowsHide: true, shell: false, encoding: 'utf8' });
          if ((w.status ?? 1) === 0) {
            const first = String(w.stdout || '')
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean)[0];
            if (first && fs.existsSync(first)) {
              const r = spawnSync(first, args || [], { cwd, windowsHide: true, shell: false, encoding: 'utf8' });
              if ((r.status ?? 1) === 0) return String(r.stdout || '').trim();
            }
          }
        }
      } catch {
        // ignore
      }

      const pf = process.env.ProgramFiles || 'C:\\Program Files';
      const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
      const candidates = [
        path.join(pf, 'Git', 'cmd', 'git.exe'),
        path.join(pf, 'Git', 'bin', 'git.exe'),
        path.join(pf86, 'Git', 'cmd', 'git.exe'),
        path.join(pf86, 'Git', 'bin', 'git.exe')
      ];
      for (const exe of candidates) {
        try {
          if (!fs.existsSync(exe)) continue;
          const r = spawnSync(exe, args || [], { cwd, windowsHide: true, shell: false, encoding: 'utf8' });
          if ((r.status ?? 1) !== 0) continue;
          return String(r.stdout || '').trim();
        } catch {
          // ignore
        }
      }

      const cmd = process.env.ComSpec || 'cmd.exe';
      const spawnArgs = ['/d', '/s', '/c', 'git', ...(args || [])];
      const res = spawnSync(cmd, spawnArgs, { cwd, windowsHide: true, shell: false, encoding: 'utf8' });
      if ((res.status ?? 1) !== 0) return null;
      return String(res.stdout || '').trim();
    }

    const res = spawnSync('git', args || [], { cwd, windowsHide: true, shell: false, encoding: 'utf8' });
    if ((res.status ?? 1) !== 0) return null;
    return String(res.stdout || '').trim();
  } catch {
    return null;
  }
}

function resolveGitDirOrNull(repoRoot) {
  const dotGit = path.join(repoRoot, '.git');
  let st = null;
  try {
    st = fs.statSync(dotGit);
  } catch {
    return null;
  }
  if (st.isDirectory()) return dotGit;

  // Worktrees/submodules often have .git as a text file: "gitdir: <path>"
  try {
    const raw = fs.readFileSync(dotGit, 'utf8');
    const m = String(raw || '')
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0]
      ?.match(/^gitdir:\s*(.+)$/i);
    if (!m) return null;
    return path.resolve(repoRoot, m[1].trim());
  } catch {
    return null;
  }
}

function readPackedRefHashOrNull(gitDir, refPath) {
  const packed = path.join(gitDir, 'packed-refs');
  let raw = '';
  try {
    raw = fs.readFileSync(packed, 'utf8');
  } catch {
    return null;
  }
  const ref = String(refPath || '').trim();
  if (!ref) return null;
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#') || s.startsWith('^')) continue;
    const parts = s.split(' ');
    if (parts.length < 2) continue;
    const hash = parts[0];
    const name = parts[1];
    if (name === ref) return hash;
  }
  return null;
}

function readHeadHashOrNull(repoRoot) {
  const gitDir = resolveGitDirOrNull(repoRoot);
  if (!gitDir) return null;

  let head = '';
  try {
    head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
  } catch {
    return null;
  }
  if (!head) return null;

  const m = head.match(/^ref:\s*(.+)$/i);
  if (!m) return head;
  const ref = m[1].trim();
  if (!ref) return null;

  const refFile = path.join(gitDir, ref.replace(/\//g, path.sep));
  try {
    const hash = fs.readFileSync(refFile, 'utf8').trim();
    if (hash) return hash;
  } catch {
    // ignore
  }
  return readPackedRefHashOrNull(gitDir, ref);
}

function gitMetaOrNull(repoRoot) {
  const head = readHeadHashOrNull(repoRoot);
  if (!head) return null;

  // Dirty detection is optional; keep null if git is unavailable.
  const status = runGit({ cwd: repoRoot, args: ['--no-pager', 'status', '--porcelain=v1'] });
  const dirty = status !== null ? status.trim().length > 0 : null;
  return { head, dirty };
}

function listProofRunRoots(runTs) {
  const entries = fs.readdirSync(PROOFS_DIR, { withFileTypes: true });
  const roots = [];
  for (const e of entries) {
    if (!e || !e.name) continue;
    if (!e.name.startsWith(`${runTs}-`)) continue;
    roots.push(path.join(PROOFS_DIR, e.name));
  }
  roots.sort((a, b) => a.localeCompare(b));
  return roots;
}

function walkFiles(absRoot, relRoot) {
  const files = [];
  const stack = [{ abs: absRoot, rel: relRoot }];
  while (stack.length) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur.abs, { withFileTypes: true });
    } catch {
      continue;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      if (!e || !e.name) continue;
      const abs = path.join(cur.abs, e.name);
      const rel = `${cur.rel}/${e.name}`.replace(/\\/g, '/');
      if (e.isDirectory()) {
        stack.push({ abs, rel });
      } else if (e.isFile()) {
        files.push({ abs, rel });
      }
    }
  }
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  return files;
}

function toOctal(value, width) {
  const s = Math.max(0, Number(value || 0)).toString(8);
  const padded = s.length >= width - 1 ? s.slice(-width + 1) : s.padStart(width - 1, '0');
  return padded + '\0';
}

function writeString(buf, offset, length, str) {
  const b = Buffer.from(String(str || ''), 'utf8');
  b.copy(buf, offset, 0, Math.min(length, b.length));
}

function splitUstarName(p) {
  const name = String(p || '').replace(/\\/g, '/');
  const b = Buffer.byteLength(name, 'utf8');
  if (b <= 100) return { name, prefix: '' };
  const parts = name.split('/');
  for (let i = parts.length - 1; i > 0; i -= 1) {
    const prefix = parts.slice(0, i).join('/');
    const rest = parts.slice(i).join('/');
    if (Buffer.byteLength(rest, 'utf8') <= 100 && Buffer.byteLength(prefix, 'utf8') <= 155) {
      return { name: rest, prefix };
    }
  }
  throw new Error(`[proof-bundle] tar path too long: ${name}`);
}

function tarHeader({ pathName, size, mode, typeFlag }) {
  const h = Buffer.alloc(512, 0);
  const split = splitUstarName(pathName);
  writeString(h, 0, 100, split.name);
  writeString(h, 100, 8, toOctal(mode, 8));
  writeString(h, 108, 8, toOctal(0, 8)); // uid
  writeString(h, 116, 8, toOctal(0, 8)); // gid
  writeString(h, 124, 12, toOctal(size, 12));
  writeString(h, 136, 12, toOctal(0, 12)); // mtime (fixed for determinism)
  // checksum field initially filled with spaces
  for (let i = 148; i < 156; i += 1) h[i] = 0x20;
  writeString(h, 156, 1, typeFlag || '0');
  writeString(h, 257, 6, 'ustar\0');
  writeString(h, 263, 2, '00');
  writeString(h, 345, 155, split.prefix);

  let sum = 0;
  for (let i = 0; i < 512; i += 1) sum += h[i];
  const chk = sum.toString(8).padStart(6, '0');
  writeString(h, 148, 6, chk);
  h[154] = 0;
  h[155] = 0x20;
  return h;
}

function pad512(n) {
  const r = n % 512;
  return r === 0 ? 0 : 512 - r;
}

async function writeTarGz({ outPath, entries }) {
  ensureDir(path.dirname(outPath));

  const out = fs.createWriteStream(outPath, { flags: 'w' });
  const gzip = zlib.createGzip({ level: 9, mtime: 0 });
  gzip.pipe(out);

  async function write(buf) {
    if (!gzip.write(buf)) await once(gzip, 'drain');
  }

  for (const e of entries) {
    await write(tarHeader({ pathName: e.tarPath, size: e.size, mode: e.mode, typeFlag: e.typeFlag }));
    if (e.typeFlag === '0') {
      const fd = fs.openSync(e.absPath, 'r');
      try {
        const buf = Buffer.allocUnsafe(64 * 1024);
        let remaining = e.size;
        let pos = 0;
        while (remaining > 0) {
          const want = Math.min(remaining, buf.length);
          const n = fs.readSync(fd, buf, 0, want, pos);
          if (!n) break;
          pos += n;
          remaining -= n;
          await write(buf.subarray(0, n));
        }
      } finally {
        try {
          fs.closeSync(fd);
        } catch {
          // ignore
        }
      }
      const pad = pad512(e.size);
      if (pad) await write(Buffer.alloc(pad, 0));
    }
  }

  await write(Buffer.alloc(1024, 0)); // end-of-archive blocks
  gzip.end();
  await once(out, 'finish');
}

async function main() {
  ensureDir(PROOFS_DIR);
  const args = parseArgs(process.argv);
  const runTs = args.runTs || readLatestRunTs();

  const runRoots = listProofRunRoots(runTs);
  if (!runRoots.length) throw new Error(`[proof-bundle] no proof roots found for runTs=${runTs}`);

  const bundleDir = path.join(BUNDLES_DIR, runTs);
  ensureDir(bundleDir);

  const bundleRoot = `pb/${runTs}`;
  const manifest = {
    schemaVersion: 1,
    runTs,
    git: {
      root: gitMetaOrNull(REPO_ROOT),
      desktop: gitMetaOrNull(path.join(REPO_ROOT, 'NeuralShell_Desktop'))
    },
    proofRoots: runRoots.map((p) => path.relative(REPO_ROOT, p).replace(/\\/g, '/')),
    files: []
  };

  const fileEntries = [];
  // Include proof roots
  for (const absRoot of runRoots) {
    const relRoot = path.relative(REPO_ROOT, absRoot).replace(/\\/g, '/');
    for (const f of walkFiles(absRoot, relRoot)) {
      const st = fs.statSync(f.abs);
      const sha256 = sha256File(f.abs);
      manifest.files.push({ rel: f.rel, bytes: st.size, sha256 });
      fileEntries.push({
        tarPath: `${bundleRoot}/${f.rel}`.replace(/\\/g, '/'),
        absPath: f.abs,
        size: st.size,
        mode: 0o644,
        typeFlag: '0'
      });
    }
  }
  // Include LATEST_RUN.txt for provenance
  const latestPath = path.join(PROOFS_DIR, 'LATEST_RUN.txt');
  if (fs.existsSync(latestPath)) {
    const st = fs.statSync(latestPath);
    const sha256 = sha256File(latestPath);
    manifest.files.push({ rel: 'state/proofs/LATEST_RUN.txt', bytes: st.size, sha256 });
    fileEntries.push({
      tarPath: `${bundleRoot}/state/proofs/LATEST_RUN.txt`,
      absPath: latestPath,
      size: st.size,
      mode: 0o644,
      typeFlag: '0'
    });
  }

  manifest.files.sort((a, b) => a.rel.localeCompare(b.rel));
  const manifestPath = path.join(bundleDir, 'bundle.manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  const shaLines = [];
  shaLines.push(`${sha256File(manifestPath)}  bundle.manifest.json`);
  for (const f of manifest.files) {
    shaLines.push(`${f.sha256}  ${f.rel}`);
  }
  const shaPath = path.join(bundleDir, 'bundle.sha256.txt');
  fs.writeFileSync(shaPath, shaLines.join('\n') + '\n', 'utf8');

  // Add bundle metadata files into the tar (deterministic, fixed mtime).
  const metaEntries = [
    {
      tarPath: `${bundleRoot}/bundle.manifest.json`,
      absPath: manifestPath,
      size: fs.statSync(manifestPath).size,
      mode: 0o644,
      typeFlag: '0'
    },
    {
      tarPath: `${bundleRoot}/bundle.sha256.txt`,
      absPath: shaPath,
      size: fs.statSync(shaPath).size,
      mode: 0o644,
      typeFlag: '0'
    }
  ];

  const tarGzPath = path.join(bundleDir, `proof-bundle-${runTs}.tar.gz`);
  const allEntries = [...fileEntries, ...metaEntries].sort((a, b) => a.tarPath.localeCompare(b.tarPath));
  await writeTarGz({ outPath: tarGzPath, entries: allEntries });

  const tarSha = sha256File(tarGzPath);
  fs.writeFileSync(path.join(bundleDir, `proof-bundle-${runTs}.tar.gz.sha256`), tarSha + '\n', 'utf8');

  process.stdout.write(`[proof-bundle] ok runTs=${runTs}\n`);
  process.stdout.write(`[proof-bundle] dir=${bundleDir}\n`);
  process.stdout.write(`[proof-bundle] tar=${tarGzPath}\n`);
  process.stdout.write(`[proof-bundle] tar.sha256=${tarSha}\n`);
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
