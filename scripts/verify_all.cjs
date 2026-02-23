const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const STATE_DIR = path.join(REPO_ROOT, 'state');

function ensureDir(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch {
    // ignore
  }
}

function spawnNpm(args) {
  if (process.platform === 'win32') {
    const comspec = process.env.ComSpec || 'cmd.exe';
    return spawn(comspec, ['/d', '/s', '/c', 'npm', ...args], {
      cwd: REPO_ROOT,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true
    });
  }
  return spawn('npm', args, {
    cwd: REPO_ROOT,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
    windowsHide: true
  });
}

function banner(line) {
  process.stdout.write(`${line}\n`);
}

async function runPhase({ index, total, name, npmArgs, transcript }) {
  banner(`\n=== PHASE ${index}/${total}: ${name} ===`);
  transcript.write(`\n=== PHASE ${index}/${total}: ${name} ===\n`);

  const child = spawnNpm(npmArgs);
  child.stdout.on('data', (d) => {
    process.stdout.write(d);
    transcript.write(d);
  });
  child.stderr.on('data', (d) => {
    process.stderr.write(d);
    transcript.write(d);
  });
  const code = await new Promise((resolve) => child.on('close', resolve));
  if (code !== 0) {
    banner(`\nFAILED AT ${name} (exit ${code})`);
    transcript.write(`\nFAILED AT ${name} (exit ${code})\n`);
    const err = new Error(`FAILED AT ${name} (exit ${code})`);
    err.phase = name;
    err.exitCode = code;
    throw err;
  }
  banner(`=== PHASE ${index}/${total}: ${name} PASS ===`);
  transcript.write(`=== PHASE ${index}/${total}: ${name} PASS ===\n`);
}

async function main() {
  ensureDir(STATE_DIR);
  const transcriptPath = path.join(STATE_DIR, 'verify_all_transcript.log');
  const transcript = fs.createWriteStream(transcriptPath, { flags: 'w' });

  const phases = [
    { name: 'test', npmArgs: ['test'] },
    { name: 'proof:spawn', npmArgs: ['run', 'proof:spawn'] },
    { name: 'proof:runtime', npmArgs: ['run', 'proof:runtime'] },
    { name: 'proof:tear', npmArgs: ['run', 'proof:tear'] },
    { name: 'proof:exe', npmArgs: ['run', 'proof:exe'] }
  ];

  try {
    banner('=== VERIFY:ALL START ===');
    transcript.write('=== VERIFY:ALL START ===\n');
    for (let i = 0; i < phases.length; i += 1) {
      await runPhase({
        index: i + 1,
        total: phases.length,
        name: phases[i].name,
        npmArgs: phases[i].npmArgs,
        transcript
      });
    }
    banner('\n=== VERIFY:ALL PASS ===');
    transcript.write('\n=== VERIFY:ALL PASS ===\n');
  } finally {
    await new Promise((resolve) => transcript.end(resolve));
  }
}

main().catch((err) => {
  process.stderr.write(err && err.stack ? err.stack + '\n' : String(err) + '\n');
  process.exit(1);
});
