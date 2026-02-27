/**
 * Bug Exploration Test: Insecure Memory Handling Vulnerability
 *
 * **Validates: Requirements 1.8, 2.8**
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 *
 * From Fault Condition:
 * - secret.type === "string" AND secret.category IN ["password", "token", "key"]
 *
 * Current Vulnerability:
 * - AuthManager stores PIN codes as strings (clean variable in login/setPinInternal)
 * - APIKeyManager stores API keys/secrets as strings (keySecret, fullKey)
 * - No secureClear() function exists to wipe secrets from memory
 * - Secrets remain in memory after use (no explicit clearing)
 * - String secrets can be extracted from memory dumps or heap snapshots
 *
 * Expected Behavior (after fix):
 * - Secrets should be stored as Buffers instead of strings
 * - secureClear() utility should overwrite Buffer contents with zeros
 * - Secrets should be cleared immediately after use
 * - References should be set to null after clearing
 * - Applies to: PIN codes, auth tokens, encryption keys, API keys
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
  console.log('\n🧪 Running Insecure Memory Handling Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.8 and 2.8\n');
    process.exit(1);
  }
}

/**
 * Test that AuthManager stores PIN codes as strings
 * The 'clean' variable in login() and setPinInternal() is a string
 */
test('Bug Exploration: AuthManager stores PIN as string (SHOULD FAIL - proves bug exists)', async () => {
  const authManagerPath = 'NeuralShell_Desktop/src/core/authManager.js';
  const authContent = fs.readFileSync(authManagerPath, 'utf8');

  // Check if PIN is processed as a string
  const hasStringPin = authContent.includes('String(pin');
  const hasCleanVariable = authContent.includes('const clean = String(pin');

  console.log(`   AuthManager uses String(pin): ${hasStringPin}`);
  console.log(`   AuthManager has 'clean' string variable: ${hasCleanVariable}`);

  // Check if Buffer is used for PIN storage
  const usesBuffer = authContent.includes('Buffer.from(pin') ||
                     authContent.includes('Buffer.alloc') && authContent.includes('pin');

  console.log(`   AuthManager uses Buffer for PIN: ${usesBuffer}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    usesBuffer,
    true,
    'VULNERABILITY CONFIRMED: AuthManager stores PIN codes as strings. ' +
    'Expected: PIN should be stored as Buffer for secure memory handling. ' +
    'Actual: Found String(pin) conversion, no Buffer usage for PIN storage. ' +
    'This proves the bug exists as described in requirement 1.8.'
  );
});

/**
 * Test that AuthManager does not clear PIN from memory after use
 * No secureClear() or explicit memory wiping after login/hash operations
 */
test('Bug Exploration: AuthManager does not clear PIN after use (SHOULD FAIL - proves bug exists)', async () => {
  const authManagerPath = 'NeuralShell_Desktop/src/core/authManager.js';
  const authContent = fs.readFileSync(authManagerPath, 'utf8');

  // Check for secureClear function
  const hasSecureClear = authContent.includes('secureClear(') ||
                         authContent.includes('.fill(0)') ||
                         authContent.includes('.fill(0x00)');

  console.log(`   AuthManager has secureClear or fill(0): ${hasSecureClear}`);

  // Check if PIN variable is explicitly nulled after use
  const nullsPin = authContent.includes('clean = null') ||
                   authContent.includes('pin = null');

  console.log(`   AuthManager nulls PIN after use: ${nullsPin}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasSecureClear && nullsPin,
    true,
    'VULNERABILITY CONFIRMED: AuthManager does not clear PIN from memory after use. ' +
    'Expected: PIN should be cleared with secureClear() and nulled after use. ' +
    'Actual: No secureClear() calls or explicit memory clearing found. ' +
    'This proves the bug exists as described in requirement 2.8.'
  );
});

/**
 * Test that APIKeyManager stores secrets as strings
 * The keySecret and fullKey variables are strings
 */
test('Bug Exploration: APIKeyManager stores secrets as strings (SHOULD FAIL - proves bug exists)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if secrets are generated as strings
  const hasStringSecret = authContent.includes('randomBytes(32).toString(\'hex\')') ||
                          authContent.includes('randomBytes(32).toString("hex")');

  console.log(`   APIKeyManager generates secrets as hex strings: ${hasStringSecret}`);

  // Check if Buffer is used for secret storage
  const usesBufferForSecret = authContent.includes('Buffer.from(keySecret') ||
                              (authContent.includes('Buffer.alloc') && authContent.includes('secret'));

  console.log(`   APIKeyManager uses Buffer for secrets: ${usesBufferForSecret}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    usesBufferForSecret,
    true,
    'VULNERABILITY CONFIRMED: APIKeyManager stores secrets as strings. ' +
    'Expected: Secrets should be stored as Buffers for secure memory handling. ' +
    'Actual: Found randomBytes().toString(\'hex\'), no Buffer storage for secrets. ' +
    'This proves the bug exists as described in requirement 1.8.'
  );
});

/**
 * Test that APIKeyManager does not clear secrets after use
 * No secureClear() or explicit memory wiping in generateKey or validateKey
 */
test('Bug Exploration: APIKeyManager does not clear secrets after use (SHOULD FAIL - proves bug exists)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check for secureClear function
  const hasSecureClear = authContent.includes('secureClear(') ||
                         authContent.includes('.fill(0)') ||
                         authContent.includes('.fill(0x00)');

  console.log(`   APIKeyManager has secureClear or fill(0): ${hasSecureClear}`);

  // Check if secrets are explicitly nulled after use
  const nullsSecret = authContent.includes('keySecret = null') ||
                      authContent.includes('secret = null') ||
                      authContent.includes('fullKey = null');

  console.log(`   APIKeyManager nulls secrets after use: ${nullsSecret}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasSecureClear && nullsSecret,
    true,
    'VULNERABILITY CONFIRMED: APIKeyManager does not clear secrets from memory after use. ' +
    'Expected: Secrets should be cleared with secureClear() and nulled after use. ' +
    'Actual: No secureClear() calls or explicit memory clearing found. ' +
    'This proves the bug exists as described in requirement 2.8.'
  );
});

/**
 * Test that no secureClear utility function exists in the codebase
 * This utility should exist to properly wipe Buffer contents
 */
test('Bug Exploration: No secureClear utility function exists (SHOULD FAIL - proves bug exists)', async () => {
  // Check for secureClear in common utility locations
  const possiblePaths = [
    'src/router/security-utils.js',
    'NeuralShell_Desktop/src/core/security-utils.js',
    'src/utils/security.js',
    'NeuralShell_Desktop/src/utils/security.js'
  ];

  let foundSecureClear = false;
  const checkedPaths = [];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      checkedPaths.push(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('function secureClear') ||
          content.includes('const secureClear') ||
          content.includes('export function secureClear')) {
        foundSecureClear = true;
        console.log(`   Found secureClear in ${filePath}`);
        break;
      }
    }
  }

  console.log(`   Checked paths: ${checkedPaths.join(', ')}`);
  console.log(`   secureClear utility exists: ${foundSecureClear}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    foundSecureClear,
    true,
    'VULNERABILITY CONFIRMED: No secureClear utility function exists in the codebase. ' +
    'Expected: secureClear(buffer) utility should exist to wipe Buffer contents. ' +
    'Actual: No secureClear function found in security utility files. ' +
    'This proves the bug exists as described in requirement 2.8.'
  );
});

/**
 * Test that OAuth2Provider stores client secrets as strings
 * The clientSecret is stored as a string property
 */
test('Bug Exploration: OAuth2Provider stores clientSecret as string (SHOULD FAIL - proves bug exists)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if clientSecret is stored as a string
  const hasClientSecret = authContent.includes('this.clientSecret = options.clientSecret');

  console.log(`   OAuth2Provider stores clientSecret: ${hasClientSecret}`);

  // Check if Buffer is used for clientSecret
  const usesBufferForClientSecret = authContent.includes('Buffer.from(options.clientSecret') ||
                                    authContent.includes('Buffer.from(this.clientSecret');

  console.log(`   OAuth2Provider uses Buffer for clientSecret: ${usesBufferForClientSecret}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    usesBufferForClientSecret,
    true,
    'VULNERABILITY CONFIRMED: OAuth2Provider stores clientSecret as string. ' +
    'Expected: clientSecret should be stored as Buffer for secure memory handling. ' +
    'Actual: Found this.clientSecret = options.clientSecret (string assignment). ' +
    'This proves the bug exists as described in requirement 1.8.'
  );
});

/**
 * Test that RequestSigner stores secretKey as string
 * The secretKey is used for HMAC signing and should be a Buffer
 */
test('Bug Exploration: RequestSigner stores secretKey as string (SHOULD FAIL - proves bug exists)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if secretKey is stored as a string
  const hasSecretKey = authContent.includes('this.secretKey = options.secretKey');

  console.log(`   RequestSigner stores secretKey: ${hasSecretKey}`);

  // Check if Buffer is used for secretKey
  const usesBufferForSecretKey = authContent.includes('Buffer.from(options.secretKey') ||
                                 authContent.includes('Buffer.from(this.secretKey');

  console.log(`   RequestSigner uses Buffer for secretKey: ${usesBufferForSecretKey}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    usesBufferForSecretKey,
    true,
    'VULNERABILITY CONFIRMED: RequestSigner stores secretKey as string. ' +
    'Expected: secretKey should be stored as Buffer for secure memory handling. ' +
    'Actual: Found this.secretKey = options.secretKey (string assignment). ' +
    'This proves the bug exists as described in requirement 1.8.'
  );
});

/**
 * Test that crypto.createHmac uses string secrets
 * HMAC operations should use Buffer secrets for better security
 */
test('Bug Exploration: HMAC operations use string secrets (SHOULD FAIL - proves bug exists)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if createHmac is called with this.secretKey (string)
  const hasHmacWithStringKey = authContent.includes('createHmac(') &&
                               authContent.includes('this.secretKey');

  console.log(`   HMAC uses this.secretKey: ${hasHmacWithStringKey}`);

  // Check if HMAC is called with Buffer
  const hasHmacWithBuffer = authContent.includes('createHmac') &&
                           (authContent.includes('Buffer.from(this.secretKey') ||
                            authContent.includes('this.secretKeyBuffer'));

  console.log(`   HMAC uses Buffer for secret: ${hasHmacWithBuffer}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasHmacWithBuffer,
    true,
    'VULNERABILITY CONFIRMED: HMAC operations use string secrets. ' +
    'Expected: HMAC should use Buffer secrets for secure memory handling. ' +
    'Actual: Found createHmac with this.secretKey (string). ' +
    'This proves the bug exists as described in requirement 1.8.'
  );
});

/**
 * Test that JWT signing uses string secrets
 * JWT operations should use Buffer secrets for better security
 */
test('Bug Exploration: JWT operations use string secrets (SHOULD FAIL - proves bug exists)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if jwt.verify is called with string keys
  const hasJwtVerify = authContent.includes('jwt.verify(');

  console.log(`   File uses jwt.verify: ${hasJwtVerify}`);

  if (!hasJwtVerify) {
    console.log('   JWT operations not found - test not applicable');
    return;
  }

  // Check if publicKey is created from Buffer
  const hasPublicKeyFromBuffer = authContent.includes('createPublicKey') &&
                                 authContent.includes('Buffer.from');

  console.log(`   JWT uses Buffer for keys: ${hasPublicKeyFromBuffer}`);

  // Note: This test is informational - JWT library handles key conversion
  // But we should still prefer Buffer inputs for consistency
  console.log('   Note: JWT library may handle key conversion internally');
});

/**
 * Regression check: Verify that constant-time comparison is preserved
 * This should continue to work after Buffer migration
 */
test('Regression check: timingSafeCompare exists (should pass)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if timingSafeCompare is imported and used
  const hasTimingSafeCompare = authContent.includes('timingSafeCompare');

  console.log(`   timingSafeCompare is used: ${hasTimingSafeCompare}`);

  // This should pass - timing-safe comparison is already implemented
  assert.strictEqual(
    hasTimingSafeCompare,
    true,
    'timingSafeCompare should be used for secret comparison (regression check)'
  );
});

/**
 * Regression check: Verify that crypto.randomBytes is used for key generation
 * This should continue to work after Buffer migration
 */
test('Regression check: crypto.randomBytes is used (should pass)', async () => {
  const authPath = 'src/router/auth.js';
  const authContent = fs.readFileSync(authPath, 'utf8');

  // Check if crypto.randomBytes is used
  const hasRandomBytes = authContent.includes('crypto.randomBytes(');

  console.log(`   crypto.randomBytes is used: ${hasRandomBytes}`);

  // This should pass - crypto.randomBytes is already used
  assert.strictEqual(
    hasRandomBytes,
    true,
    'crypto.randomBytes should be used for key generation (regression check)'
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
