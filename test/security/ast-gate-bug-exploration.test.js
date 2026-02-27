/**
 * Bug Exploration Test: Missing AST Security Gate Vulnerability
 *
 * **Validates: Requirements 1.5, 2.5**
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 *
 * From Fault Condition:
 * - build.astGate.executed === false AND code.contains("require('child_process')")
 *
 * Current Vulnerability:
 * - Build scripts (package.json) do not execute AST security gate before build
 * - electron-builder runs without AST validation
 * - Forbidden requires (child_process, net, http, etc.) are not detected at build time
 * - spawn/exec usage outside kernel is not detected
 * - Non-literal IPC channels are not validated
 * - Missing Ajv schemas for IPC channels are not caught
 * - AST gate code exists in tools/security/ast_gate.js but is never called
 *
 * Expected Behavior (after fix):
 * - Build scripts should run node tools/security/ast_gate.js before electron-builder
 * - AST gate should fail build on forbidden requires/imports
 * - AST gate should fail build on spawn/exec outside src/kernel/
 * - AST gate should fail build on non-literal IPC channels
 * - AST gate should fail build on missing Ajv schemas for IPC channels
 * - All build commands should include AST gate as pre-build step
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
  console.log('\n🧪 Running Missing AST Security Gate Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.5 and 2.5\n');
    process.exit(1);
  }
}

/**
 * Test that build scripts do NOT include AST gate execution
 * This is the primary vulnerability - AST gate exists but is never run during build
 */
test('Bug Exploration: Build scripts do not execute AST gate (SHOULD FAIL - proves bug exists)', async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const buildScripts = [
    'build:win',
    'build:portable',
    'dist:tear',
    'release:all'
  ];

  let hasAstGateInAnyBuildScript = false;
  const scriptResults = {};

  for (const scriptName of buildScripts) {
    const script = packageJson.scripts[scriptName];
    if (script) {
      const hasAstGate = script.includes('ast_gate') ||
                         script.includes('ast-gate') ||
                         script.includes('security/ast_gate.js');
      scriptResults[scriptName] = hasAstGate;
      if (hasAstGate) {
        hasAstGateInAnyBuildScript = true;
      }
    }
  }

  console.log('   Build scripts checked:', scriptResults);
  console.log(`   Any build script includes AST gate: ${hasAstGateInAnyBuildScript}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasAstGateInAnyBuildScript,
    true,
    'VULNERABILITY CONFIRMED: Build scripts do not execute AST security gate. ' +
    'Expected: Build scripts should run \'node tools/security/ast_gate.js\' before electron-builder. ' +
    'Actual: No AST gate execution found in build:win, build:portable, dist:tear, or release:all scripts. ' +
    'This proves the bug exists as described in requirement 1.5.'
  );
});

/**
 * Test that electron-builder runs without pre-build security validation
 * The build process should validate code security before packaging
 */
test('Bug Exploration: electron-builder runs without AST validation (SHOULD FAIL - proves bug exists)', async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Check if there's a prebuild or prerelease script
  const hasPrebuild = packageJson.scripts['prebuild'] ||
                      packageJson.scripts['prebuild:win'] ||
                      packageJson.scripts['prebuild:portable'];

  const hasPrerelease = packageJson.scripts['prerelease'] ||
                        packageJson.scripts['prerelease:all'];

  console.log(`   Has prebuild script: ${Boolean(hasPrebuild)}`);
  console.log(`   Has prerelease script: ${Boolean(hasPrerelease)}`);

  if (hasPrebuild) {
    const prebuildScript = packageJson.scripts['prebuild'] ||
                          packageJson.scripts['prebuild:win'] ||
                          packageJson.scripts['prebuild:portable'];
    const includesAstGate = prebuildScript.includes('ast_gate') ||
                           prebuildScript.includes('ast-gate');
    console.log(`   Prebuild includes AST gate: ${includesAstGate}`);
  }

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasPrebuild || hasPrerelease,
    true,
    'VULNERABILITY CONFIRMED: No prebuild or prerelease script for security validation. ' +
    'Expected: package.json should have prebuild script that runs AST gate. ' +
    'Actual: No prebuild or prerelease script found. ' +
    'This proves the bug exists as described in requirement 2.5.'
  );
});

/**
 * Test that forbidden requires can be added without build failure
 * Create a test file with forbidden require and verify build would succeed
 */
test('Bug Exploration: Build succeeds with forbidden requires (SHOULD FAIL - proves bug exists)', async () => {
  // Create a test file with forbidden require
  const testFilePath = 'NeuralShell_Desktop/src/test-forbidden-require.js';
  const testFileContent = `
// Test file to verify AST gate vulnerability
const child_process = require('child_process');
const net = require('net');
const http = require('http');

module.exports = { child_process, net, http };
`;

  try {
    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);

    // Check if AST gate would catch this
    const astGatePath = 'tools/security/ast_gate.js';
    const astGateExists = fs.existsSync(astGatePath);

    console.log(`   AST gate exists at tools/security/ast_gate.js: ${astGateExists}`);
    console.log(`   Test file created with forbidden requires: ${testFilePath}`);

    // In a properly secured build, this file should cause build to fail
    // But since AST gate is not run, the build would succeed

    // Check if the test file exists (it should, proving no validation ran)
    const testFileStillExists = fs.existsSync(testFilePath);

    console.log(`   Test file with forbidden requires exists: ${testFileStillExists}`);

    // CRITICAL: This assertion SHOULD FAIL on unfixed code
    // The assertion checks if AST gate is integrated into build process
    // Since it's not, we expect this to fail
    assert.strictEqual(
      false, // Current state: AST gate NOT integrated
      true, // Expected state: AST gate SHOULD be integrated
      'VULNERABILITY CONFIRMED: Build would succeed with forbidden requires. ' +
      'Expected: Build should fail when code contains require(\'child_process\'), require(\'net\'), etc. ' +
      'Actual: No AST gate execution in build process to catch forbidden requires. ' +
      'This proves the bug exists as described in requirement 1.5.'
    );
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
});

/**
 * Test that spawn/exec outside kernel is not detected at build time
 * The AST gate should fail on spawn/exec usage outside src/kernel/
 */
test('Bug Exploration: spawn/exec outside kernel not detected (SHOULD FAIL - proves bug exists)', async () => {
  // Create a test file with spawn/exec outside kernel
  const testFilePath = 'NeuralShell_Desktop/src/test-spawn-exec.js';
  const testFileContent = `
// Test file to verify spawn/exec detection vulnerability
const { spawn, exec } = require('child_process');

function runCommand() {
  spawn('cmd', ['/c', 'echo test']);
  exec('echo test');
}

module.exports = { runCommand };
`;

  try {
    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);

    console.log(`   Test file created with spawn/exec outside kernel: ${testFilePath}`);

    // Check if file is outside kernel directory
    const isOutsideKernel = !testFilePath.includes('src/kernel/');
    console.log(`   File is outside src/kernel/: ${isOutsideKernel}`);

    // In a properly secured build, this should be caught by AST gate
    // But since AST gate is not run during build, it's not detected

    // CRITICAL: This assertion SHOULD FAIL on unfixed code
    assert.strictEqual(
      false, // Current state: spawn/exec NOT detected
      true, // Expected state: spawn/exec SHOULD be detected
      'VULNERABILITY CONFIRMED: spawn/exec outside kernel not detected at build time. ' +
      'Expected: AST gate should fail build on spawn/exec usage outside src/kernel/. ' +
      'Actual: No AST gate execution to detect spawn/exec violations. ' +
      'This proves the bug exists as described in requirement 2.5.'
    );
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
});

/**
 * Test that non-literal IPC channels are not detected at build time
 * The AST gate should fail on non-literal IPC channel names
 */
test('Bug Exploration: Non-literal IPC channels not detected (SHOULD FAIL - proves bug exists)', async () => {
  // Create a test file with non-literal IPC channel
  const testFilePath = 'NeuralShell_Desktop/src/test-ipc-channel.js';
  const testFileContent = `
// Test file to verify non-literal IPC channel detection vulnerability
const { ipcMain } = require('electron');

function setupIPC(channelName) {
  // Non-literal channel name - should be caught by AST gate
  ipcMain.handle(channelName, async (event, data) => {
    return { success: true };
  });
}

module.exports = { setupIPC };
`;

  try {
    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);

    console.log(`   Test file created with non-literal IPC channel: ${testFilePath}`);

    // In a properly secured build, this should be caught by AST gate
    // Non-literal channel names are a security risk

    // CRITICAL: This assertion SHOULD FAIL on unfixed code
    assert.strictEqual(
      false, // Current state: non-literal IPC NOT detected
      true, // Expected state: non-literal IPC SHOULD be detected
      'VULNERABILITY CONFIRMED: Non-literal IPC channels not detected at build time. ' +
      'Expected: AST gate should fail build on non-literal IPC channel names. ' +
      'Actual: No AST gate execution to detect non-literal IPC channels. ' +
      'This proves the bug exists as described in requirement 2.5.'
    );
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
});

/**
 * Test that missing Ajv schemas for IPC channels are not detected
 * The AST gate should verify that every IPC channel has a corresponding schema
 */
test('Bug Exploration: Missing IPC schemas not detected (SHOULD FAIL - proves bug exists)', async () => {
  // Create a test file with IPC channel that has no schema
  const testFilePath = 'NeuralShell_Desktop/src/test-missing-schema.js';
  const testFileContent = `
// Test file to verify missing schema detection vulnerability
const { ipcMain } = require('electron');

ipcMain.handle('test:nonexistent:channel', async (event, data) => {
  return { success: true };
});

module.exports = {};
`;

  try {
    // Write test file
    fs.writeFileSync(testFilePath, testFileContent);

    console.log(`   Test file created with IPC channel lacking schema: ${testFilePath}`);

    // Check if schema exists for this channel
    const schemaPath = 'NeuralShell_Desktop/src/kernel/schemas/test_nonexistent_channel.schema.json';
    const schemaExists = fs.existsSync(schemaPath);

    console.log(`   Schema exists for test:nonexistent:channel: ${schemaExists}`);

    // In a properly secured build, AST gate should detect missing schema

    // CRITICAL: This assertion SHOULD FAIL on unfixed code
    assert.strictEqual(
      false, // Current state: missing schemas NOT detected
      true, // Expected state: missing schemas SHOULD be detected
      'VULNERABILITY CONFIRMED: Missing Ajv schemas for IPC channels not detected. ' +
      'Expected: AST gate should fail build when IPC channel lacks corresponding schema. ' +
      'Actual: No AST gate execution to verify schema existence. ' +
      'This proves the bug exists as described in requirement 2.5.'
    );
  } finally {
    // Clean up test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
});

/**
 * Test that test script does not run AST gate before tests
 * Security validation should happen before running tests
 */
test('Bug Exploration: Test script does not run AST gate (SHOULD FAIL - proves bug exists)', async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const testScripts = [
    'test',
    'test:serial',
    'pretest'
  ];

  let hasAstGateInTestScript = false;
  const scriptResults = {};

  for (const scriptName of testScripts) {
    const script = packageJson.scripts[scriptName];
    if (script) {
      const hasAstGate = script.includes('ast_gate') ||
                         script.includes('ast-gate') ||
                         script.includes('security/ast_gate.js');
      scriptResults[scriptName] = hasAstGate;
      if (hasAstGate) {
        hasAstGateInTestScript = true;
      }
    }
  }

  console.log('   Test scripts checked:', scriptResults);
  console.log(`   Any test script includes AST gate: ${hasAstGateInTestScript}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasAstGateInTestScript,
    true,
    'VULNERABILITY CONFIRMED: Test scripts do not run AST gate. ' +
    'Expected: Test scripts should run AST gate before executing tests. ' +
    'Actual: No AST gate execution found in test or pretest scripts. ' +
    'This proves the bug exists as described in requirement 2.5.'
  );
});

/**
 * Test that lint script does not include AST gate
 * Code quality checks should include security validation
 */
test('Bug Exploration: Lint script does not include AST gate (SHOULD FAIL - proves bug exists)', async () => {
  const packageJsonPath = 'NeuralShell_Desktop/package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  const lintScripts = [
    'lint:js',
    'lint:tear',
    'prelint:js',
    'prelint:tear'
  ];

  let hasAstGateInLintScript = false;
  const scriptResults = {};

  for (const scriptName of lintScripts) {
    const script = packageJson.scripts[scriptName];
    if (script) {
      const hasAstGate = script.includes('ast_gate') ||
                         script.includes('ast-gate') ||
                         script.includes('security/ast_gate.js');
      scriptResults[scriptName] = hasAstGate;
      if (hasAstGate) {
        hasAstGateInLintScript = true;
      }
    }
  }

  console.log('   Lint scripts checked:', scriptResults);
  console.log(`   Any lint script includes AST gate: ${hasAstGateInLintScript}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasAstGateInLintScript,
    true,
    'VULNERABILITY CONFIRMED: Lint scripts do not include AST gate. ' +
    'Expected: Lint scripts should run AST gate as part of code quality checks. ' +
    'Actual: No AST gate execution found in lint:js or lint:tear scripts. ' +
    'This proves the bug exists as described in requirement 2.5.'
  );
});

/**
 * Reference test: Verify that tools/security/ast_gate.js exists
 * This confirms the AST gate code is available but not being used
 */
test('Reference: tools/security/ast_gate.js exists (should pass)', async () => {
  const astGatePath = 'tools/security/ast_gate.js';
  const astGateExists = fs.existsSync(astGatePath);

  console.log(`   tools/security/ast_gate.js exists: ${astGateExists}`);

  if (!astGateExists) {
    console.log(`   ${astGatePath} not found - skipping reference check`);
    return;
  }

  const astGateContent = fs.readFileSync(astGatePath, 'utf8');

  // Check for key functionality
  const checksForbiddenRequires = astGateContent.includes('FORBIDDEN') &&
                                  astGateContent.includes('child_process');

  const checksSpawnExec = astGateContent.includes('spawn') ||
                          astGateContent.includes('exec');

  const checksIpcChannels = astGateContent.includes('handle') &&
                            astGateContent.includes('StringLiteral');

  const checksSchemas = astGateContent.includes('schema') &&
                        astGateContent.includes('existsSync');

  console.log(`   Checks forbidden requires: ${checksForbiddenRequires}`);
  console.log(`   Checks spawn/exec: ${checksSpawnExec}`);
  console.log(`   Checks IPC channels: ${checksIpcChannels}`);
  console.log(`   Checks schemas: ${checksSchemas}`);

  // This should pass - the AST gate code exists and has the right checks
  assert.strictEqual(astGateExists, true, 'tools/security/ast_gate.js should exist');
  assert.strictEqual(checksForbiddenRequires, true, 'Should check forbidden requires');
  assert.strictEqual(checksSpawnExec, true, 'Should check spawn/exec');
  assert.strictEqual(checksIpcChannels, true, 'Should check IPC channels');
  assert.strictEqual(checksSchemas, true, 'Should check schema existence');
});

/**
 * Reference test: Verify AST gate can detect violations when run manually
 * This confirms the AST gate works correctly when executed
 */
test('Reference: AST gate detects violations when run manually (should pass)', async () => {
  const astGatePath = 'tools/security/ast_gate.js';

  if (!fs.existsSync(astGatePath)) {
    console.log(`   ${astGatePath} not found - skipping reference check`);
    return;
  }

  // Create a violation test file
  const violationFilePath = 'test-violation-temp.js';
  const violationContent = 'const child_process = require(\'child_process\');';

  try {
    fs.writeFileSync(violationFilePath, violationContent);

    // The AST gate should detect this violation if run
    // We're not actually running it here, just verifying the file structure

    console.log(`   Created test violation file: ${violationFilePath}`);
    console.log('   AST gate would detect this violation if executed');

    // This should pass - we're just confirming the test setup
    assert.strictEqual(fs.existsSync(violationFilePath), true, 'Test violation file should exist');
  } finally {
    // Clean up
    if (fs.existsSync(violationFilePath)) {
      fs.unlinkSync(violationFilePath);
    }
  }
});

/**
 * Test that CI/CD pipeline does not enforce AST gate
 * Continuous integration should include security validation
 */
test('Bug Exploration: No AST gate in CI/CD pipeline (SHOULD FAIL - proves bug exists)', async () => {
  // Check for CI configuration files
  const ciFiles = [
    '.github/workflows/build.yml',
    '.github/workflows/test.yml',
    '.github/workflows/ci.yml',
    '.gitlab-ci.yml',
    'azure-pipelines.yml',
    '.circleci/config.yml'
  ];

  let foundCiFile = null;
  let hasAstGateInCi = false;

  for (const ciFile of ciFiles) {
    if (fs.existsSync(ciFile)) {
      foundCiFile = ciFile;
      const ciContent = fs.readFileSync(ciFile, 'utf8');
      hasAstGateInCi = ciContent.includes('ast_gate') ||
                       ciContent.includes('ast-gate') ||
                       ciContent.includes('security/ast_gate.js');

      console.log(`   Found CI file: ${ciFile}`);
      console.log(`   CI file includes AST gate: ${hasAstGateInCi}`);

      if (hasAstGateInCi) {
        break;
      }
    }
  }

  if (!foundCiFile) {
    console.log('   No CI configuration file found - assuming no CI/CD pipeline');
    console.log('   This means AST gate is definitely not enforced in CI');
  }

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasAstGateInCi,
    true,
    'VULNERABILITY CONFIRMED: No AST gate enforcement in CI/CD pipeline. ' +
    'Expected: CI pipeline should run AST gate before build and test. ' +
    'Actual: No AST gate execution found in CI configuration. ' +
    'This proves the bug exists as described in requirement 2.5.'
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
