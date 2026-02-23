import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const ARTIFACTS = [
  'server.pid',
  'demo-output.txt',
  'full-test-output.txt',
  'metrics-test-output.txt',
  'test-output.txt',
  'RUNTIME-PROOF-FAILED.txt'
];

function main() {
  console.log('Cleaning up project artifacts...');
  let count = 0;
  for (const file of ARTIFACTS) {
    const fullPath = path.join(ROOT, file);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
        console.log(`  - Deleted: ${file}`);
        count++;
      } catch (err) {
        console.error(`  - Failed to delete ${file}: ${err.message}`);
      }
    }
  }
  console.log(`Cleanup complete. ${count} files removed.`);
}

main();
