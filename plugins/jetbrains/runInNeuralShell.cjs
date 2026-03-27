const path = require('path');
const { spawnSync } = require('child_process');

function toText(value) {
  return String(value == null ? '' : value);
}

function run(command, args, cwd) {
  return spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    shell: true
  });
}

function main() {
  const projectPath = path.resolve(process.argv[2] || process.cwd());
  const filePath = process.argv[3] ? path.resolve(process.argv[3]) : '';

  process.stdout.write(`[NeuralShell] Project: ${projectPath}\n`);
  if (filePath) {
    const relative = path.relative(projectPath, filePath).replace(/\\/g, '/');
    process.stdout.write(`[NeuralShell] File: ${relative}\n`);

    const diff = run('git', ['diff', '--', relative], projectPath);
    if (diff.status === 0) {
      process.stdout.write('[NeuralShell] Git diff:\n');
      process.stdout.write(toText(diff.stdout));
      if (!toText(diff.stdout).trim()) {
        process.stdout.write('[NeuralShell] No working-tree diff for selected file.\n');
      }
    } else {
      process.stdout.write(`[NeuralShell] git diff failed: ${toText(diff.stderr)}\n`);
    }
  }

  process.stdout.write('[NeuralShell] Running proof:bundle...\n');
  const proof = run('npm', ['run', 'proof:bundle'], projectPath);
  process.stdout.write(toText(proof.stdout));
  process.stderr.write(toText(proof.stderr));

  if (proof.status === 0) {
    process.stdout.write('[NeuralShell] proof:bundle passed.\n');
    process.exitCode = 0;
    return;
  }

  process.stdout.write(`[NeuralShell] proof:bundle failed (exit ${proof.status}).\n`);
  process.exitCode = proof.status || 1;
}

main();
