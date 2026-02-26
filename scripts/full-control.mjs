import { spawnSync } from 'node:child_process';

function run(cmd, args, { env } = {}) {
  const r = spawnSync(cmd, args, {
    env: env ? { ...process.env, ...env } : process.env,
    encoding: 'utf8',
    windowsHide: true,
    shell: process.platform === 'win32'
  });

  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);

  if (r.error) throw r.error;
  if ((r.status ?? 1) !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(' ')} (exit ${r.status})`);
  }
}

async function main() {
  const env = {
    NS_SANDBOX_BACKEND: 'docker',
    NS_SANDBOX_ALLOW_VM_FALLBACK: '0',
    NS_REQUIRE_DOCKER_SANDBOX: '1',
    NS_SANDBOX_PREPARE_PULL: process.env.NS_SANDBOX_PREPARE_PULL || '1'
  };

  console.log('[full-control] docker info');
  run('docker', ['info'], { env });

  console.log('[full-control] sandbox prepare');
  run('npm', ['run', 'sandbox:prepare'], { env });

  console.log('[full-control] sandbox tests');
  run('npm', ['run', 'test:sandbox'], { env });

  console.log('[full-control] full verify');
  run('npm', ['run', 'verify'], { env });

  console.log('[full-control] deterministic release gate');
  run('npm', ['run', 'release:gate'], { env });

  console.log('[full-control] ship bundle');
  run('npm', ['run', 'ship:bundle'], { env });

  console.log('[full-control] support bundle');
  run('npm', ['run', 'support:bundle'], { env });

  console.log('[full-control] llm preflight');
  run('npm', ['run', 'llm:preflight'], { env });

  console.log('[full-control] DONE');
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});
