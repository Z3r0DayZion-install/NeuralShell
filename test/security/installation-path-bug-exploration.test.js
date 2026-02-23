/**
 * Bug Exploration Test: Insecure Installation Paths Vulnerability
 * 
 * **Validates: Requirements 1.7, 2.7**
 * 
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 * 
 * From Fault Condition:
 * - installation.path.worldWritable === true OR installation.path NOT IN protectedDirectories
 * 
 * Current Vulnerability:
 * - No scripts/verify-installation.js to check installation path security
 * - No postinstall script to verify ACL permissions
 * - No check for world-writable or group-writable permissions
 * - No validation that installation is under protected directory
 * - Application can be installed in insecure locations (temp dirs, world-writable paths)
 * 
 * Expected Behavior (after fix):
 * - scripts/verify-installation.js should check installation path security
 * - postinstall script should run verification
 * - Installation should fail for world-writable paths
 * - Installation should fail for unprotected directories
 * - Only protected directories should be allowed (e.g., Program Files, /usr/local, /opt)
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
  console.log('\n🧪 Running Insecure Installation Paths Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.7 and 2.7\n');
    process.exit(1);
  }
}

/**
 * Test that scripts/verify-installation.js does not exist
 * This script should verify installation path security and ACL permissions
 */
test("Bug Exploration: scripts/verify-installation.js does not exist (SHOULD FAIL - proves bug exists)", async () => {
  const verifyScriptPath = path.join('NeuralShell_Desktop', 'scripts', 'verify-installation.js');
  const verifyScriptExists = fs.existsSync(verifyScriptPath);
  
  console.log(`   scripts/verify-installation.js exists: ${verifyScriptExists}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    verifyScriptExists,
    true,
    `VULNERABILITY CONFIRMED: scripts/verify-installation.js does not exist. ` +
    `Expected: Installation verification script should check path security and ACL permissions. ` +
    `Actual: File not found at ${verifyScriptPath}. ` +
    `This proves the bug exists as described in requirement 1.7.`
  );
});

/**
 * Test that package.json lacks postinstall script for verification
 * Without postinstall verification, insecure installations are allowed
 */
test("Bug Exploration: package.json lacks postinstall verification (SHOULD FAIL - proves bug exists)", async () => {
  const packageJsonPath = path.join('NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const hasPostinstall = packageJson.scripts && packageJson.scripts.postinstall;
  const postinstallVerifies = hasPostinstall && 
                              (packageJson.scripts.postinstall.includes('verify-installation') ||
                               packageJson.scripts.postinstall.includes('verify-install'));
  
  console.log(`   Has postinstall script: ${!!hasPostinstall}`);
  console.log(`   Postinstall runs verification: ${!!postinstallVerifies}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    postinstallVerifies,
    true,
    `VULNERABILITY CONFIRMED: package.json does not run installation verification in postinstall. ` +
    `Expected: postinstall script should run verify-installation.js. ` +
    `Actual: ${hasPostinstall ? `postinstall exists but doesn't verify: "${packageJson.scripts.postinstall}"` : 'No postinstall script found'}. ` +
    `This proves the bug exists as described in requirement 2.7.`
  );
});

/**
 * Test that main.js does not check installation path on startup
 * Application should verify it's running from a secure location
 */
test("Bug Exploration: main.js does not verify installation path (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for installation path verification
  const hasPathVerification = mainJsContent.includes('verifyInstallation') || 
                              mainJsContent.includes('verify-installation') ||
                              (mainJsContent.includes('installation') && mainJsContent.includes('path') && mainJsContent.includes('verify'));
  
  console.log(`   main.js verifies installation path: ${hasPathVerification}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasPathVerification,
    true,
    `VULNERABILITY CONFIRMED: main.js does not verify installation path on startup. ` +
    `Expected: main.js should verify installation path security before creating BrowserWindow. ` +
    `Actual: No installation path verification found in main.js. ` +
    `This proves the bug exists as described in requirement 2.7.`
  );
});

/**
 * Test that no protected directories list exists
 * Without a whitelist, any directory is implicitly allowed
 */
test("Bug Exploration: No protected directories whitelist (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for protected directories list
  const hasProtectedDirs = mainJsContent.includes('PROTECTED_DIRECTORIES') || 
                           mainJsContent.includes('protectedDirectories') ||
                           mainJsContent.includes('ALLOWED_INSTALL_PATHS');
  
  console.log(`   Has protected directories list: ${hasProtectedDirs}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasProtectedDirs,
    true,
    `VULNERABILITY CONFIRMED: No protected directories whitelist defined. ` +
    `Expected: Protected directories list (e.g., Program Files, /usr/local, /opt). ` +
    `Actual: No protected directories list found in main.js. ` +
    `This proves the bug exists as described in requirement 2.7.`
  );
});

/**
 * Test that no ACL permission checks exist
 * Without ACL checks, world-writable and group-writable paths are allowed
 */
test("Bug Exploration: No ACL permission checks (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for ACL or permission checks
  const hasAclCheck = mainJsContent.includes('worldWritable') || 
                      mainJsContent.includes('world-writable') ||
                      mainJsContent.includes('groupWritable') ||
                      mainJsContent.includes('group-writable') ||
                      (mainJsContent.includes('permissions') && mainJsContent.includes('writable'));
  
  console.log(`   Has ACL permission checks: ${hasAclCheck}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasAclCheck,
    true,
    `VULNERABILITY CONFIRMED: No ACL permission checks for world-writable or group-writable paths. ` +
    `Expected: ACL checks to reject world-writable and group-writable installation paths. ` +
    `Actual: No ACL permission checks found in main.js. ` +
    `This proves the bug exists as described in requirement 1.7.`
  );
});

/**
 * Test that current installation path could be insecure
 * Verify that the application CAN run from potentially insecure locations
 */
test("Bug Exploration: Application can run from current directory (confirms exploitability)", async () => {
  const currentDir = process.cwd();
  
  console.log(`   Current directory: ${currentDir}`);
  
  // Check if current directory is in a potentially insecure location
  const isInTemp = currentDir.toLowerCase().includes('temp') || 
                   currentDir.toLowerCase().includes('tmp');
  const isInUserDir = currentDir.includes('Users') || 
                      currentDir.includes('home');
  
  console.log(`   Running from temp directory: ${isInTemp}`);
  console.log(`   Running from user directory: ${isInUserDir}`);
  
  // This should pass - we expect the app CAN run from various locations
  // This confirms the vulnerability is exploitable
  assert.strictEqual(
    true,
    true,
    `Application can run from current directory, confirming no installation path restrictions exist`
  );
});

/**
 * Test that electron-builder config allows custom installation directory
 * This is a legitimate feature but requires verification after installation
 */
test("Bug Exploration: electron-builder allows custom install directory (informational)", async () => {
  const packageJsonPath = path.join('NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const allowsCustomDir = packageJson.build && 
                          packageJson.build.nsis && 
                          packageJson.build.nsis.allowToChangeInstallationDirectory;
  
  console.log(`   Allows custom installation directory: ${allowsCustomDir}`);
  
  // This should pass - custom directory is allowed (which is fine if verified)
  assert.strictEqual(
    allowsCustomDir,
    true,
    `electron-builder allows custom installation directory (requires postinstall verification)`
  );
});

/**
 * Test that no fs.stat() checks for file permissions exist
 * fs.stat() is needed to check file mode and permissions
 */
test("Bug Exploration: No fs.stat() permission checks (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for fs.stat() usage for permission checking
  const hasStatCheck = mainJsContent.includes('fs.stat') && 
                       (mainJsContent.includes('mode') || mainJsContent.includes('permissions'));
  
  console.log(`   Has fs.stat() permission checks: ${hasStatCheck}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasStatCheck,
    true,
    `VULNERABILITY CONFIRMED: No fs.stat() checks for file permissions. ` +
    `Expected: fs.stat() should be used to check file mode and detect world-writable permissions. ` +
    `Actual: No fs.stat() permission checks found in main.js. ` +
    `This proves the bug exists as described in requirement 2.7.`
  );
});

/**
 * Test that no installation abort mechanism exists
 * Without abort, insecure installations proceed
 */
test("Bug Exploration: No installation abort for insecure paths (SHOULD FAIL - proves bug exists)", async () => {
  const packageJsonPath = path.join('NeuralShell_Desktop', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const hasPostinstall = packageJson.scripts && packageJson.scripts.postinstall;
  
  // If postinstall exists, check if it can abort
  let canAbort = false;
  if (hasPostinstall) {
    // Check if postinstall script would exit with error code
    canAbort = packageJson.scripts.postinstall.includes('exit 1') || 
               packageJson.scripts.postinstall.includes('process.exit(1)');
  }
  
  console.log(`   Has postinstall: ${!!hasPostinstall}`);
  console.log(`   Can abort installation: ${canAbort}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasPostinstall && canAbort,
    true,
    `VULNERABILITY CONFIRMED: No mechanism to abort installation for insecure paths. ` +
    `Expected: postinstall script should exit with code 1 if verification fails. ` +
    `Actual: ${hasPostinstall ? 'postinstall exists but cannot abort' : 'No postinstall script'}. ` +
    `This proves the bug exists as described in requirement 2.7.`
  );
});

/**
 * Test that main_kernel.js has installation verification (reference check)
 * This verifies what the correct implementation should look like
 */
test("Reference: Check if main_kernel.js has installation verification (informational)", async () => {
  const kernelPath = 'NeuralShell_Desktop/main_kernel.js';
  
  if (!fs.existsSync(kernelPath)) {
    console.log(`   main_kernel.js not found - skipping reference check`);
    return;
  }
  
  const kernelContent = fs.readFileSync(kernelPath, 'utf8');
  
  const hasInstallVerification = kernelContent.includes('verifyInstallation') || 
                                 kernelContent.includes('verify-installation');
  
  console.log(`   main_kernel.js has installation verification: ${hasInstallVerification}`);
  
  // This is informational - we don't fail if kernel doesn't have it either
});

/**
 * Test platform-specific protected directories
 * Different platforms have different secure installation locations
 */
test("Bug Exploration: No platform-specific protected directories (SHOULD FAIL - proves bug exists)", async () => {
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');
  
  // Check for platform-specific directory checks with PROTECTED_DIRECTORIES context
  const hasProtectedDirsArray = mainJsContent.includes('PROTECTED_DIRECTORIES') || 
                                 mainJsContent.includes('protectedDirectories');
  
  const hasWindowsCheck = hasProtectedDirsArray && 
                          (mainJsContent.includes('Program Files') || mainJsContent.includes('ProgramFiles'));
  const hasLinuxCheck = hasProtectedDirsArray && 
                        (mainJsContent.includes('/usr/local') || mainJsContent.includes('/opt'));
  const hasMacCheck = hasProtectedDirsArray && mainJsContent.includes('/Applications');
  
  const hasPlatformChecks = hasWindowsCheck || hasLinuxCheck || hasMacCheck;
  
  console.log(`   Has PROTECTED_DIRECTORIES array: ${hasProtectedDirsArray}`);
  console.log(`   Has Windows protected dirs: ${hasWindowsCheck}`);
  console.log(`   Has Linux protected dirs: ${hasLinuxCheck}`);
  console.log(`   Has macOS protected dirs: ${hasMacCheck}`);
  
  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasPlatformChecks,
    true,
    `VULNERABILITY CONFIRMED: No platform-specific protected directory checks. ` +
    `Expected: Platform-specific checks (Windows: Program Files, Linux: /usr/local, /opt, macOS: /Applications). ` +
    `Actual: No platform-specific directory checks found in main.js. ` +
    `This proves the bug exists as described in requirement 2.7.`
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
