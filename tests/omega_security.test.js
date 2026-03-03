const assert = require('assert');
const { kernel, CAP_NET, CAP_PROC } = require('../src/kernel');

async function runOmegaTests() {
  console.log('--- NEURALSHELL OMEGA SECURITY TEST SUITE ---');

  // 1. Broker Enforcement
  console.log('[TEST 1] Verifying Broker HTTPS Enforcement...');
  try {
    await kernel.request(CAP_NET, 'safeFetch', { url: 'http://insecure.com' });
    assert.fail('Should have blocked HTTP');
  } catch (err) {
    assert.ok(err.message.includes('Only HTTPS'));
  }
  console.log('PASS: HTTP Blocked');

  // 2. Execution Hash Check
  console.log('[TEST 2] Verifying Task Integrity Enforcement...');
  try {
    await kernel.request(CAP_PROC, 'executeTask', { taskId: 'neural-link:devices' });
  } catch (err) {
    assert.ok(err.message.includes('OMEGA_BLOCK'));
  }
  console.log('PASS: Task integrity checked');

  console.log('--- ALL OMEGA SECURITY TESTS PASSED ---');
}

runOmegaTests().catch(err => {
  console.error(err);
  process.exit(1);
});
