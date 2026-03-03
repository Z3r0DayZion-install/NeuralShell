const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exportProof } = require('./export_var_proof');

/**
 * OMEGA Determinism Validator
 * 
 * Verifies that two consecutive builds produce identical results.
 */

const ROOT = path.join(__dirname, '../');
const ARTIFACTS = path.join(ROOT, 'artifacts/var_proof/DETERMINISTIC_TEST');

function hashDir(dir) {
  const hash = crypto.createHash('sha256');
  const files = fs.readdirSync(dir);
  files.sort().forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      hash.update(hashDir(p));
    } else {
      hash.update(f);
      hash.update(fs.readFileSync(p));
    }
  });
  return hash.digest('hex');
}

async function runTest() {
  console.log('--- STARTING OMEGA DETERMINISM TEST ---');

  // Build 1
  console.log('[TEST] Build 1 starting...');
  if (fs.existsSync(ARTIFACTS)) fs.rmSync(ARTIFACTS, { recursive: true, force: true });
  await exportProof({ isDeterministicTest: true });
  const hash1 = hashDir(ARTIFACTS);
  console.log(`[TEST] Build 1 HASH: ${hash1}`);

  // Build 2
  console.log('[TEST] Build 2 starting...');
  if (fs.existsSync(ARTIFACTS)) fs.rmSync(ARTIFACTS, { recursive: true, force: true });
  await exportProof({ isDeterministicTest: true });
  const hash2 = hashDir(ARTIFACTS);
  console.log(`[TEST] Build 2 HASH: ${hash2}`);

  if (hash1 === hash2) {
    console.log('\n========================================');
    console.log('RESULT: PASS (BIT-FOR-BIT DETERMINISM)');
    console.log('========================================');
    process.exit(0);
  } else {
    console.error('\n========================================');
    console.error('RESULT: FAIL (ENVIRONMENT DRIFT DETECTED)');
    console.error('========================================');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Test Failed:', err.message);
  process.exit(1);
});
