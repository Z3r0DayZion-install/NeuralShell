const { spawn } = require('node:child_process');

function run() {
  let child;
  try {
    child = spawn(process.execPath, ['-v'], { stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[spawn-sanity] spawn failed: ${msg}`);
    process.exit(1);
    return;
  }

  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  let out = '';
  let errOut = '';
  child.stdout.on('data', (d) => (out += d));
  child.stderr.on('data', (d) => (errOut += d));

  child.on('error', (err) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[spawn-sanity] spawn failed: ${msg}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    const v = out.trim();
    if (code === 0) {
      console.log(`[spawn-sanity] node version spawn OK: ${v || process.version}`);
    } else {
      console.error(`[spawn-sanity] node spawn exited non-zero: ${code}`);
      if (errOut.trim()) console.error(errOut.trim());
    }
    process.exit(code ?? 1);
  });
}

run();

