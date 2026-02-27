/**
 * Bug Exploration Test: Missing Boot Chain Verification Vulnerability
 *
 * **Validates: Requirements 1.4, 2.4**
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 *
 * From Fault Condition:
 * - boot.stage === "app.whenReady" AND boot.manifestVerified === false
 *
 * Current Vulnerability in main.js:
 * - main.js does not import verifyBootIntegrity from src/boot/verify.js
 * - app.whenReady() creates BrowserWindow without manifest verification
 * - No signature check for seal.manifest.json before boot
 * - Boot chain verification code exists but is never called
 * - Application boots successfully even without valid manifest
 *
 * Expected Behavior (after fix):
 * - main.js should import verifyBootIntegrity from src/boot/verify.js
 * - app.whenReady() should call verifyBootIntegrity() before creating BrowserWindow
 * - Boot should fail (process.exit(1)) if manifest signature is invalid
 * - seal.manifest.json signature must be verified using RSA-PSS
 * - All file hashes in manifest must be verified before boot
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
  console.log('\n🧪 Running Missing Boot Chain Verification Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.4 and 2.4\n');
    process.exit(1);
  }
}

/**
 * Test that main.js does NOT import verifyBootIntegrity
 * This is the primary vulnerability - boot verification exists but is never called
 */
test('Bug Exploration: main.js does not import verifyBootIntegrity (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check if verifyBootIntegrity is imported
  const importsVerifyBoot = mainJsContent.includes('verifyBootIntegrity');

  // Check if boot/verify or boot/integrity is required
  const importsBootVerify = mainJsContent.includes('boot/verify') ||
                            mainJsContent.includes('boot/integrity');

  console.log(`   main.js imports verifyBootIntegrity: ${importsVerifyBoot}`);
  console.log(`   main.js requires boot/verify or boot/integrity: ${importsBootVerify}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    importsVerifyBoot || importsBootVerify,
    true,
    'VULNERABILITY CONFIRMED: main.js does not import verifyBootIntegrity. ' +
    'Expected: main.js should require(\'src/boot/verify\') or require(\'src/boot/integrity\'). ' +
    'Actual: No import of boot verification found in main.js. ' +
    'This proves the bug exists as described in requirement 1.4.'
  );
});

/**
 * Test that app.whenReady() does NOT call verifyBootIntegrity before creating BrowserWindow
 * The boot process should verify manifest signature before any window creation
 */
test('Bug Exploration: app.whenReady() creates BrowserWindow without verification (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Find app.whenReady() block
  const whenReadyMatch = mainJsContent.match(/app\.whenReady\(\)\.then\(async\s*\(\)\s*=>\s*{([^}]+(?:{[^}]*}[^}]*)*)/s);

  if (!whenReadyMatch) {
    console.log('   Could not find app.whenReady() block - test not applicable');
    return;
  }

  const whenReadyBlock = whenReadyMatch[0];

  // Check if verifyBootIntegrity is called in whenReady block
  const callsVerifyBoot = whenReadyBlock.includes('verifyBootIntegrity');

  // Check if createWindow is called
  const callsCreateWindow = whenReadyBlock.includes('createWindow');

  console.log(`   app.whenReady() calls verifyBootIntegrity: ${callsVerifyBoot}`);
  console.log(`   app.whenReady() calls createWindow: ${callsCreateWindow}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    callsVerifyBoot,
    true,
    'VULNERABILITY CONFIRMED: app.whenReady() does not call verifyBootIntegrity before createWindow. ' +
    'Expected: verifyBootIntegrity() should be called and verified before BrowserWindow creation. ' +
    'Actual: No verifyBootIntegrity call found in app.whenReady() block. ' +
    'This proves the bug exists as described in requirement 1.4.'
  );
});

/**
 * Test that BrowserWindow is created without any signature check
 * The createWindow function should only be called after successful verification
 */
test('Bug Exploration: BrowserWindow created without signature check (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Find createWindow function
  const createWindowMatch = mainJsContent.match(/function\s+createWindow\s*\(\)\s*{([^}]+(?:{[^}]*}[^}]*)*)/s);

  if (!createWindowMatch) {
    console.log('   Could not find createWindow function - test not applicable');
    return;
  }

  // Find where createWindow is called
  const createWindowCalls = mainJsContent.match(/createWindow\(\)/g);

  console.log(`   Number of createWindow() calls: ${createWindowCalls ? createWindowCalls.length : 0}`);

  // Check if any createWindow call is preceded by verification check
  const hasVerificationBeforeWindow = mainJsContent.match(/verifyBootIntegrity[\s\S]{0,200}createWindow\(\)/);

  console.log(`   Has verification before createWindow: ${Boolean(hasVerificationBeforeWindow)}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasVerificationBeforeWindow !== null,
    true,
    'VULNERABILITY CONFIRMED: BrowserWindow is created without signature verification. ' +
    'Expected: createWindow() should only be called after successful verifyBootIntegrity(). ' +
    'Actual: No verification check found before createWindow() calls. ' +
    'This proves the bug exists as described in requirement 2.4.'
  );
});

/**
 * Test that there's no process.exit() on verification failure
 * The application should fail closed - exit if manifest is invalid
 */
test('Bug Exploration: No fail-closed behavior on invalid manifest (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check for verification result handling
  const hasVerificationCheck = mainJsContent.match(/verifyBootIntegrity[\s\S]{0,300}process\.exit/);

  // Check for fail-closed pattern (if verification fails, exit)
  const hasFailClosed = mainJsContent.match(/if\s*\([^)]*\.ok\s*===\s*false[^)]*\)[\s\S]{0,100}process\.exit\(1\)/);

  console.log(`   Has verification with process.exit: ${Boolean(hasVerificationCheck)}`);
  console.log(`   Has fail-closed pattern: ${Boolean(hasFailClosed)}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasFailClosed !== null,
    true,
    'VULNERABILITY CONFIRMED: No fail-closed behavior for invalid manifest. ' +
    'Expected: If verifyBootIntegrity() returns { ok: false }, process.exit(1) should be called. ' +
    'Actual: No fail-closed pattern found in main.js. ' +
    'This proves the bug exists as described in requirement 2.4.'
  );
});

/**
 * Test that seal.manifest.json verification is not enforced
 * The manifest file should be checked for existence and signature
 */
test('Bug Exploration: seal.manifest.json not verified before boot (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check for seal.manifest.json references
  const referencesSealManifest = mainJsContent.includes('seal.manifest.json') ||
                                 mainJsContent.includes('seal.manifest');

  // Check for manifest signature verification
  const verifiesManifestSignature = mainJsContent.includes('manifest') &&
                                    (mainJsContent.includes('signature') || mainJsContent.includes('verify'));

  console.log(`   main.js references seal.manifest: ${referencesSealManifest}`);
  console.log(`   main.js verifies manifest signature: ${verifiesManifestSignature && referencesSealManifest}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    referencesSealManifest,
    true,
    'VULNERABILITY CONFIRMED: seal.manifest.json is not verified before boot. ' +
    'Expected: main.js should verify seal.manifest.json signature using RSA-PSS. ' +
    'Actual: No reference to seal.manifest found in main.js. ' +
    'This proves the bug exists as described in requirement 2.4.'
  );
});

/**
 * Test that RSA-PSS signature verification is not used in boot process
 * The boot chain should use RSA-PSS for cryptographic verification
 */
test('Bug Exploration: No RSA-PSS signature verification in boot (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check for RSA-PSS verification
  const hasRsaPss = mainJsContent.includes('RSA_PKCS1_PSS_PADDING') ||
                    mainJsContent.includes('RSA-PSS');

  // Check for crypto.verify usage
  const usesCryptoVerify = mainJsContent.includes('crypto.verify');

  console.log(`   main.js uses RSA-PSS: ${hasRsaPss}`);
  console.log(`   main.js uses crypto.verify: ${usesCryptoVerify}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasRsaPss || usesCryptoVerify,
    true,
    'VULNERABILITY CONFIRMED: No RSA-PSS signature verification in boot process. ' +
    'Expected: main.js should use crypto.verify with RSA_PKCS1_PSS_PADDING for manifest. ' +
    'Actual: No RSA-PSS or crypto.verify found in main.js. ' +
    'This proves the bug exists as described in requirement 2.4.'
  );
});

/**
 * Reference test: Verify that src/boot/verify.js exists and exports verifyBootIntegrity
 * This confirms the verification code is available but not being used
 */
test('Reference: src/boot/verify.js exists and exports verifyBootIntegrity (should pass)', async () => {
  const verifyPath = 'src/boot/verify.js';

  // Check if file exists
  const fileExists = fs.existsSync(verifyPath);

  console.log(`   src/boot/verify.js exists: ${fileExists}`);

  if (!fileExists) {
    console.log(`   ${verifyPath} not found - skipping reference check`);
    return;
  }

  const verifyContent = fs.readFileSync(verifyPath, 'utf8');

  // Check for verifyBootIntegrity function
  const hasVerifyFunction = verifyContent.includes('function verifyBootIntegrity') ||
                            verifyContent.includes('verifyBootIntegrity =');

  // Check for module.exports
  const exportsVerifyFunction = verifyContent.includes('module.exports') &&
                                verifyContent.includes('verifyBootIntegrity');

  // Check for RSA-PSS verification
  const usesRsaPss = verifyContent.includes('RSA_PKCS1_PSS_PADDING');

  // Check for manifest verification
  const verifiesManifest = verifyContent.includes('seal.manifest.json') ||
                           verifyContent.includes('MANIFEST_PATH');

  console.log(`   Has verifyBootIntegrity function: ${hasVerifyFunction}`);
  console.log(`   Exports verifyBootIntegrity: ${exportsVerifyFunction}`);
  console.log(`   Uses RSA-PSS: ${usesRsaPss}`);
  console.log(`   Verifies manifest: ${verifiesManifest}`);

  // This should pass - the verification code exists
  assert.strictEqual(fileExists, true, 'src/boot/verify.js should exist');
  assert.strictEqual(hasVerifyFunction, true, 'Should have verifyBootIntegrity function');
  assert.strictEqual(exportsVerifyFunction, true, 'Should export verifyBootIntegrity');
  assert.strictEqual(usesRsaPss, true, 'Should use RSA-PSS for signature verification');
  assert.strictEqual(verifiesManifest, true, 'Should verify seal.manifest.json');
});

/**
 * Reference test: Verify that src/boot/integrity.js also exists (alternative implementation)
 * This confirms multiple verification implementations exist but none are used
 */
test('Reference: src/boot/integrity.js exists with verification code (should pass)', async () => {
  const integrityPath = 'src/boot/integrity.js';

  // Check if file exists
  const fileExists = fs.existsSync(integrityPath);

  console.log(`   src/boot/integrity.js exists: ${fileExists}`);

  if (!fileExists) {
    console.log(`   ${integrityPath} not found - skipping reference check`);
    return;
  }

  const integrityContent = fs.readFileSync(integrityPath, 'utf8');

  // Check for verifyBootIntegrity function
  const hasVerifyFunction = integrityContent.includes('function verifyBootIntegrity') ||
                            integrityContent.includes('verifyBootIntegrity =');

  // Check for RSA-PSS verification
  const usesRsaPss = integrityContent.includes('RSA_PKCS1_PSS_PADDING');

  console.log(`   Has verifyBootIntegrity function: ${hasVerifyFunction}`);
  console.log(`   Uses RSA-PSS: ${usesRsaPss}`);

  // This should pass
  assert.strictEqual(fileExists, true, 'src/boot/integrity.js should exist');
  assert.strictEqual(hasVerifyFunction, true, 'Should have verifyBootIntegrity function');
  assert.strictEqual(usesRsaPss, true, 'Should use RSA-PSS for signature verification');
});

/**
 * Test that the application boots successfully even without manifest verification
 * This demonstrates the security vulnerability - the app should fail closed
 */
test('Bug Exploration: Application boots without manifest verification (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check if app.whenReady() has any conditional logic for verification
  const whenReadyMatch = mainJsContent.match(/app\.whenReady\(\)\.then\(async\s*\(\)\s*=>\s*{([^}]+(?:{[^}]*}[^}]*)*)/s);

  if (!whenReadyMatch) {
    console.log('   Could not find app.whenReady() block - test not applicable');
    return;
  }

  const whenReadyBlock = whenReadyMatch[0];

  // Check if there's any early return or exit based on verification
  const hasEarlyExit = whenReadyBlock.includes('return') && whenReadyBlock.includes('verify');
  const hasConditionalBoot = whenReadyBlock.match(/if\s*\([^)]*verify[^)]*\)/);

  console.log(`   app.whenReady() has early exit on verification failure: ${hasEarlyExit}`);
  console.log(`   app.whenReady() has conditional boot logic: ${Boolean(hasConditionalBoot)}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasEarlyExit || hasConditionalBoot !== null,
    true,
    'VULNERABILITY CONFIRMED: Application boots unconditionally without manifest verification. ' +
    'Expected: Boot should be conditional on successful verifyBootIntegrity() result. ' +
    'Actual: No conditional boot logic found in app.whenReady(). ' +
    'This proves the bug exists as described in requirement 1.4.'
  );
});

/**
 * Test that file hash verification is not performed before boot
 * The manifest should contain file hashes that are verified before boot
 */
test('Bug Exploration: No file hash verification before boot (SHOULD FAIL - proves bug exists)', async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check for hash verification
  const hasHashVerification = mainJsContent.includes('hash') &&
                              (mainJsContent.includes('verify') || mainJsContent.includes('SHA256'));

  // Check for file integrity checks
  const hasFileIntegrityCheck = mainJsContent.includes('createHash') ||
                                mainJsContent.includes('digest');

  console.log(`   main.js has hash verification: ${hasHashVerification}`);
  console.log(`   main.js has file integrity check: ${hasFileIntegrityCheck}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasHashVerification && hasFileIntegrityCheck,
    true,
    'VULNERABILITY CONFIRMED: No file hash verification before boot. ' +
    'Expected: All files in seal.manifest.json should have their SHA256 hashes verified. ' +
    'Actual: No hash verification found in main.js boot process. ' +
    'This proves the bug exists as described in requirement 2.4.'
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
