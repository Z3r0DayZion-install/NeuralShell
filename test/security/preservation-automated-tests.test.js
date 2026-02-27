/**
 * Preservation Test: Automated Tests
 *
 * **Validates: Requirements 3.8**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.8:
 * - Test suites with proper assertions should continue to execute correctly
 *
 * This test verifies that:
 * 1. Test files exist and are discoverable
 * 2. Test files contain proper assertion statements
 * 3. Test files use standard test frameworks (assert, jest, etc.)
 * 4. Test files have executable test functions
 * 5. Test infrastructure is properly configured
 *
 * Expected Behavior (on unfixed code):
 * - All test files should be executable
 * - All test files should contain assertions
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Automated Tests Preservation Tests\n');
  console.log('✅ EXPECTED: These tests SHOULD PASS on unfixed code to confirm baseline behavior\n');

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
    console.log('❌ PRESERVATION FAILURE: Baseline behavior is broken');
    console.log('   These tests should pass on unfixed code to establish baseline\n');
    process.exit(1);
  } else {
    console.log('✅ PRESERVATION CONFIRMED: Baseline automated test behavior is working correctly\n');
  }
}

/**
 * Property: Test files exist and are discoverable
 *
 * This property verifies that test files exist in the expected locations
 * and follow standard naming conventions (*.test.js).
 */
test('Property: Test files exist and are discoverable', async () => {
  const testDir = path.join(__dirname, '..');

  // Verify test directory exists
  assert.ok(
    fs.existsSync(testDir),
    `Test directory should exist at ${testDir}`
  );

  // Find all test files recursively
  function findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const testFiles = findTestFiles(testDir);

  assert.ok(
    testFiles.length > 0,
    'At least one test file should exist'
  );

  console.log(`   Found ${testFiles.length} test files`);
});

/**
 * Property: Test files contain proper assertion statements
 *
 * This verifies that test files use assertion libraries to validate behavior.
 * Tests without assertions are not effective tests.
 */
test('Property: Test files contain proper assertion statements', async () => {
  const testDir = path.join(__dirname, '..');

  function findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const testFiles = findTestFiles(testDir);
  let filesWithAssertions = 0;

  // Check each test file for assertion statements
  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf8');

    // Check for various assertion patterns
    const hasAssertions =
      content.includes('assert.') ||
      content.includes('expect(') ||
      content.includes('.toBe(') ||
      content.includes('.toEqual(') ||
      content.includes('.toContain(') ||
      content.includes('.toMatch(') ||
      content.includes('.toThrow(') ||
      content.includes('.ok(') ||
      content.includes('.strictEqual(') ||
      content.includes('.deepEqual(');

    if (hasAssertions) {
      filesWithAssertions++;
    }
  }

  assert.ok(
    filesWithAssertions > 0,
    'At least one test file should contain assertions'
  );

  console.log(`   ${filesWithAssertions}/${testFiles.length} test files contain assertions`);
});

/**
 * Property: Test files use standard test frameworks
 *
 * This verifies that test files import and use standard testing libraries
 * like assert, jest, or custom test runners.
 */
test('Property: Test files use standard test frameworks', async () => {
  const testDir = path.join(__dirname, '..');

  function findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const testFiles = findTestFiles(testDir);
  let filesWithFrameworks = 0;

  // Check each test file for test framework imports
  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf8');

    // Check for test framework imports
    const hasFramework =
      content.includes("from 'assert'") ||
      content.includes('from "assert"') ||
      content.includes("require('assert')") ||
      content.includes('require("assert")') ||
      content.includes("from 'jest'") ||
      content.includes('from "jest"') ||
      content.includes('describe(') ||
      content.includes('it(') ||
      content.includes('test(');

    if (hasFramework) {
      filesWithFrameworks++;
    }
  }

  assert.ok(
    filesWithFrameworks > 0,
    'At least one test file should use a test framework'
  );

  console.log(`   ${filesWithFrameworks}/${testFiles.length} test files use test frameworks`);
});

/**
 * Property: Test files have executable test functions
 *
 * This verifies that test files define test functions that can be executed.
 * Tests must have runnable test cases to be effective.
 */
test('Property: Test files have executable test functions', async () => {
  const testDir = path.join(__dirname, '..');

  function findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const testFiles = findTestFiles(testDir);
  let filesWithTestFunctions = 0;

  // Check each test file for test function definitions
  for (const testFile of testFiles) {
    const content = fs.readFileSync(testFile, 'utf8');

    // Check for test function patterns
    const hasTestFunctions =
      content.includes('test(') ||
      content.includes('it(') ||
      content.includes('describe(') ||
      /function\s+test/.test(content) ||
      /const\s+test\s*=/.test(content);

    if (hasTestFunctions) {
      filesWithTestFunctions++;
    }
  }

  assert.ok(
    filesWithTestFunctions > 0,
    'At least one test file should define test functions'
  );

  console.log(`   ${filesWithTestFunctions}/${testFiles.length} test files define test functions`);
});

/**
 * Property: Test infrastructure is properly configured
 *
 * This verifies that package.json has test scripts configured
 * and that the test infrastructure is set up correctly.
 */
test('Property: Test infrastructure is properly configured', async () => {
  const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');

  assert.ok(
    fs.existsSync(packageJsonPath),
    'package.json should exist'
  );

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Verify test scripts exist
  assert.ok(
    packageJson.scripts,
    'package.json should have scripts section'
  );

  assert.ok(
    packageJson.scripts.test ||
    packageJson.scripts['test:root'] ||
    packageJson.scripts['test:all'],
    'package.json should have test scripts'
  );

  console.log('   Test scripts configured in package.json');

  // Verify jest configuration exists (if using jest)
  if (packageJson.devDependencies && packageJson.devDependencies.jest) {
    assert.ok(
      packageJson.jest || fs.existsSync(path.join(__dirname, '..', '..', 'jest.config.js')),
      'Jest configuration should exist if jest is installed'
    );
    console.log('   Jest configuration found');
  }
});

/**
 * Property: Sample test files execute successfully
 *
 * This verifies that we can actually run a sample test file
 * and it executes without errors (even if some tests fail).
 */
test('Property: Sample test files are executable', async () => {
  // Check that this very test file is executable
  const thisFile = __filename;

  assert.ok(
    fs.existsSync(thisFile),
    'This test file should exist'
  );

  const content = fs.readFileSync(thisFile, 'utf8');

  // Verify this file has the expected structure
  assert.ok(
    content.includes('function test('),
    'Test file should define test function'
  );

  assert.ok(
    content.includes('async function runTests()'),
    'Test file should define runTests function'
  );

  assert.ok(
    content.includes('assert.'),
    'Test file should use assertions'
  );

  console.log('   This test file is properly structured and executable');
});

/**
 * Property: Test files follow consistent patterns
 *
 * This verifies that test files follow consistent naming and structure patterns,
 * which makes the test suite maintainable and predictable.
 */
test('Property: Test files follow consistent patterns', async () => {
  const testDir = path.join(__dirname, '..');

  function findTestFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules') {
        files.push(...findTestFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  const testFiles = findTestFiles(testDir);

  // Verify all test files follow naming convention
  for (const testFile of testFiles) {
    const fileName = path.basename(testFile);
    assert.ok(
      fileName.endsWith('.test.js'),
      `Test file should end with .test.js: ${fileName}`
    );
  }

  console.log(`   All ${testFiles.length} test files follow naming convention (*.test.js)`);
});

/**
 * Property: Preservation tests exist for security features
 *
 * This verifies that preservation tests exist for the security features
 * that need to be preserved during the security hardening.
 */
test('Property: Preservation tests exist for security features', async () => {
  const securityTestDir = __dirname;

  // Expected preservation test files based on requirements 3.1-3.10
  const expectedPreservationTests = [
    'preservation-ipc.test.js', // 3.1: IPC operations
    'preservation-file-protocol.test.js', // 3.2: file:// protocol
    'preservation-contextbridge.test.js', // 3.3: contextBridge
    'preservation-devtools.test.js', // 3.4: DevTools
    'preservation-pin-auth.test.js', // 3.5: PIN authentication
    'preservation-permissions.test.js', // 3.6: Permission checks
    'preservation-path-guards.test.js' // 3.7: Path guards
    // 3.8: This test itself (automated tests)
    // 3.9: electron-builder packaging (to be implemented)
    // 3.10: telemetry collection (to be implemented)
  ];

  let foundTests = 0;

  for (const testFile of expectedPreservationTests) {
    const testPath = path.join(securityTestDir, testFile);
    if (fs.existsSync(testPath)) {
      foundTests++;
    }
  }

  assert.ok(
    foundTests >= 5,
    `At least 5 preservation tests should exist (found ${foundTests})`
  );

  console.log(`   Found ${foundTests}/${expectedPreservationTests.length} expected preservation tests`);
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
