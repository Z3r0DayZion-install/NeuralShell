/**
 * Bug Exploration Test: Missing SPKI Certificate Pinning Vulnerability
 *
 * **Validates: Requirements 1.2, 2.2**
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 *
 * From Fault Condition:
 * - request.protocol === "https" AND certificatePinning.enforced === false
 *
 * Current Vulnerability in main.js:
 * - No app.on('certificate-error') handler to validate SPKI pins
 * - No certificate-pins.json configuration file
 * - HTTPS requests (fetch calls) proceed without certificate validation
 * - Unpinned hosts are allowed, exposing system to MITM attacks
 *
 * Expected Behavior (after fix):
 * - app.on('certificate-error') handler should validate SPKI pins
 * - certificate-pins.json should define hostname -> SPKI pin mappings
 * - Unpinned hosts should be rejected
 * - SHA256 hash of SubjectPublicKeyInfo should be verified
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running SPKI Certificate Pinning Bug Exploration Tests\n');
  console.log('⚠️  CRITICAL: These tests SHOULD FAIL on unfixed code to prove the bug exists\n');

  for (const { name, fn } of tests) {
    results.total++;
    try {
      await fn();
      results.passed++;
      console.log(`✅ ${name}`);
    } catch (error) {
      results.failed++;
      console.log(`❌ ${name}`);
      console.log(`   Error: ${error.message}`);
      if (error.stack) {
        console.log(`   ${error.stack.split('\n').slice(1, 3).join('\n   ')}`);
      }
    }
  }

  console.log(`\n📊 Results: ${results.passed}/${results.total} passed, ${results.failed} failed\n`);

  if (results.failed > 0) {
    console.log('⚠️  EXPECTED BEHAVIOR: Tests should fail on unfixed code');
    console.log('   This confirms the vulnerability exists as described in requirements 1.2 and 2.2\n');
    process.exit(1);
  }
}

/**
 * Test that main.js lacks certificate-error event handler
 * This is the primary mechanism for SPKI certificate pinning in Electron
 */
test('Bug Exploration: main.js lacks certificate-error handler (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check if certificate-error handler is present
  const hasCertificateErrorHandler = mainJsContent.includes("app.on('certificate-error'") ||
                                      mainJsContent.includes('app.on("certificate-error"');

  console.log(`   Has app.on('certificate-error') handler: ${hasCertificateErrorHandler}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasCertificateErrorHandler,
    true,
    'VULNERABILITY CONFIRMED: main.js does not implement app.on(\'certificate-error\') handler. ' +
    'Expected: main.js should validate SPKI pins via certificate-error event. ' +
    'Actual: No certificate-error handler found in main.js. ' +
    'This proves the bug exists as described in requirement 1.2.'
  );
});

/**
 * Test that certificate-pins.json configuration file does not exist
 * This file should contain hostname -> SPKI pin mappings
 */
test('Bug Exploration: certificate-pins.json does not exist (SHOULD FAIL - proves bug exists)', async () => {
  const certPinsPath = path.join('NeuralShell_Desktop', 'certificate-pins.json');
  const certPinsExists = fs.existsSync(certPinsPath);

  console.log(`   certificate-pins.json exists: ${certPinsExists}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    certPinsExists,
    true,
    'VULNERABILITY CONFIRMED: certificate-pins.json configuration file does not exist. ' +
    'Expected: certificate-pins.json should define hostname -> SPKI pin mappings. ' +
    `Actual: File not found at ${certPinsPath}. ` +
    'This proves the bug exists as described in requirement 2.2.'
  );
});

/**
 * Test that HTTPS fetch calls in main.js do not validate certificates
 * The current code makes fetch() calls without any certificate validation
 */
test('Bug Exploration: HTTPS fetch calls lack certificate validation (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Find all fetch calls
  const fetchCallsMatch = mainJsContent.match(/fetch\s*\([^)]+\)/g);
  const hasFetchCalls = fetchCallsMatch && fetchCallsMatch.length > 0;

  console.log(`   Number of fetch() calls found: ${fetchCallsMatch ? fetchCallsMatch.length : 0}`);

  // Check if any fetch call includes certificate validation logic
  const hasCertValidation = mainJsContent.includes('certificate') &&
                            mainJsContent.includes('pin') &&
                            mainJsContent.includes('SPKI');

  console.log(`   Has certificate pinning validation in fetch calls: ${hasCertValidation}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasFetchCalls && hasCertValidation,
    true,
    'VULNERABILITY CONFIRMED: HTTPS fetch() calls do not validate SPKI certificate pins. ' +
    'Expected: fetch() calls should be protected by certificate-error handler with SPKI validation. ' +
    `Actual: Found ${fetchCallsMatch ? fetchCallsMatch.length : 0} fetch() calls with no certificate pinning. ` +
    'This proves the bug exists as described in requirement 1.2.'
  );
});

/**
 * Test that main.js allows unpinned hosts
 * Without certificate pinning, all HTTPS hosts are implicitly allowed
 */
test('Bug Exploration: Unpinned HTTPS hosts are allowed (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check for any logic that rejects unpinned hosts
  const hasUnpinnedHostRejection = mainJsContent.includes('unpinned') ||
                                    (mainJsContent.includes('certificate') && mainJsContent.includes('reject'));

  console.log(`   Has unpinned host rejection logic: ${hasUnpinnedHostRejection}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasUnpinnedHostRejection,
    true,
    'VULNERABILITY CONFIRMED: main.js allows unpinned HTTPS hosts without rejection. ' +
    'Expected: Unpinned hosts should be rejected via certificate-error handler. ' +
    'Actual: No unpinned host rejection logic found in main.js. ' +
    'This proves the bug exists as described in requirement 2.2.'
  );
});

/**
 * Test that main.js does not implement SHA256 SPKI hash verification
 * SPKI pinning requires computing SHA256 hash of SubjectPublicKeyInfo
 */
test('Bug Exploration: No SHA256 SPKI hash verification (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check for SHA256 hash computation for certificates
  const hasSHA256CertHash = (mainJsContent.includes('sha256') || mainJsContent.includes('SHA256')) &&
                            (mainJsContent.includes('certificate') || mainJsContent.includes('publicKey'));

  console.log(`   Has SHA256 certificate hash verification: ${hasSHA256CertHash}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasSHA256CertHash,
    true,
    'VULNERABILITY CONFIRMED: main.js does not implement SHA256 SPKI hash verification. ' +
    'Expected: Certificate pinning should use SHA256 hash of SubjectPublicKeyInfo. ' +
    'Actual: No SHA256 certificate hash verification found in main.js. ' +
    'This proves the bug exists as described in requirement 2.2.'
  );
});

/**
 * Test that main_kernel.js has certificate pinning (reference check)
 * This verifies that we know what the correct implementation should look like
 */
test('Reference: Check if main_kernel.js has certificate pinning (informational)', async () => {
  const kernelPath = 'NeuralShell_Desktop/main_kernel.js';

  if (!fs.existsSync(kernelPath)) {
    console.log('   main_kernel.js not found - skipping reference check');
    return; // Skip this test if kernel file doesn't exist
  }

  const kernelContent = fs.readFileSync(kernelPath, 'utf8');

  const hasCertificateErrorHandler = kernelContent.includes("app.on('certificate-error'") ||
                                      kernelContent.includes('app.on("certificate-error"');

  console.log(`   main_kernel.js has certificate-error handler: ${hasCertificateErrorHandler}`);

  // This is informational - we don't fail if kernel doesn't have it either
  // The kernel file might not have certificate pinning implemented yet
});

/**
 * Test that fetch calls to external HTTPS endpoints exist
 * This confirms that the vulnerability is exploitable (HTTPS requests are made)
 */
test('Bug Exploration: HTTPS fetch calls to external endpoints exist (confirms exploitability)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Look for fetch calls to external HTTPS endpoints
  const hasExternalHttpsFetch = mainJsContent.includes('https://') ||
                                 mainJsContent.includes('http://');

  console.log(`   Has external HTTP/HTTPS fetch calls: ${hasExternalHttpsFetch}`);

  // This should pass - we expect to find external fetch calls
  assert.strictEqual(
    hasExternalHttpsFetch,
    true,
    'Expected to find external HTTP/HTTPS fetch calls in main.js to confirm exploitability'
  );
});

/**
 * Test that localhost fetch calls exist (regression check)
 * After fix, localhost should still be allowed (development mode)
 */
test('Bug Exploration: Localhost fetch calls exist (regression check)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Look for localhost fetch calls
  const hasLocalhostFetch = mainJsContent.includes('localhost') ||
                            mainJsContent.includes('127.0.0.1');

  console.log(`   Has localhost fetch calls: ${hasLocalhostFetch}`);

  // This should pass - we expect localhost calls for development
  assert.strictEqual(
    hasLocalhostFetch,
    true,
    'Expected to find localhost fetch calls for development mode'
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
