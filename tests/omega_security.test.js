const assert = require('assert');

// OMEGA Mock: Neutralize Electron for Headless Verification
// Ensures security logic is verifiable even when GUI is unreachable.
const mockElectron = {
  app: {
    isPackaged: false,
    getAppPath: () => process.cwd(),
    getPath: (name) => require('path').join(process.cwd(), 'temp', name)
  },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (s) => Buffer.from(s),
    decryptString: (b) => b.toString()
  }
};
require.cache[require.resolve('electron')] = { exports: mockElectron };

const { kernel, CAP_NET, CAP_PROC } = require('../src/kernel');

async function runOmegaTests() {
  console.log('--- NEURALSHELL OMEGA SECURITY TEST SUITE ---');

  // 1. Broker Enforcement
  console.log('[TEST 1] Verifying Broker HTTPS Enforcement...');
  try {
    await kernel.request(CAP_NET, 'safeFetch', { url: 'http://insecure.com' });
    assert.fail('Should have blocked HTTP');
  } catch (err) {
    assert.ok(err.message.includes('Only HTTPS') || err.message.includes('OMEGA_BLOCK'));
  }
  console.log('PASS: HTTP Blocked');

  // 2. Execution Hash Check
  console.log('[TEST 2] Verifying Task Integrity Enforcement...');
  try {
    // This will fail because the placeholder hash in the registry won't match the file
    await kernel.request(CAP_PROC, 'executeTask', { taskId: 'neural-link:devices' });
    assert.fail('Should have blocked due to hash mismatch');
  } catch (err) {
    assert.ok(err.message.includes('OMEGA_BLOCK') || err.message.includes('Binary hash mismatch'));
  }
  console.log('PASS: Task integrity checked');

  console.log('--- ALL OMEGA SECURITY TESTS PASSED ---');
}

runOmegaTests().catch(err => {
  console.error(err);
  process.exit(1);
});
