import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = __dirname;
const STATE_DIR = path.join(REPO_ROOT, 'state');
const VERIFY_SCRIPT = path.join(REPO_ROOT, 'scripts', 'verify_all.cjs');

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // ignore
  }
}

function safeTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function extractProofSummary(text) {
  const lines = String(text || '').split(/\r?\n/);
  const start = lines.findIndex((l) => l.includes('--- PROOF SUMMARY ---'));
  if (start === -1) return null;
  const end = lines.findIndex((l, i) => i > start && l.includes('---------------------'));
  if (end === -1) return null;
  return lines.slice(start, end + 1).join('\n');
}

function readIfExists(p) {
  try {
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

async function runVerifyAll({ transcriptPath }) {
  const out = fs.createWriteStream(transcriptPath, { flags: 'w' });
  const child = spawn(process.execPath, [VERIFY_SCRIPT], {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  });
  child.stdout.on('data', (d) => {
    process.stdout.write(d);
    out.write(d);
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(d);
    out.write(d);
  });
  const code = await new Promise((resolve) => child.on('close', resolve));
  await new Promise((resolve) => out.end(resolve));
  return code ?? 1;
}

async function main() {
  ensureDir(STATE_DIR);

  const runTag = safeTimestamp();
  const transcriptPath = path.join(STATE_DIR, `proof_js_transcript-${runTag}.log`);
  const latestTranscriptPath = path.join(STATE_DIR, 'latest-proof-js-transcript.log');

  const exitCode = await runVerifyAll({ transcriptPath });
  try {
    fs.copyFileSync(transcriptPath, latestTranscriptPath);
  } catch {
    // ignore
  }

  const targets = [
    path.join(STATE_DIR, 'latest-proof-runtime-transcript.log'),
    path.join(STATE_DIR, 'latest-proof-tear-transcript.log'),
    path.join(STATE_DIR, 'latest-proof-exe-transcript.log')
  ];

  let printedAny = false;
  for (const p of targets) {
    const text = readIfExists(p);
    const block = text ? extractProofSummary(text) : null;
    if (!block) continue;
    printedAny = true;
    process.stdout.write(`\n=== ${p} ===\n`);
    process.stdout.write(block + '\n');
  }

  if (!printedAny) {
    process.stderr.write('\n(no PROOF SUMMARY blocks found; check state/*.log)\n');
  }

  process.stdout.write(`\nproof.js transcript: ${transcriptPath}\n`);
  process.stdout.write(`proof.js latest: ${latestTranscriptPath}\n`);

  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});

