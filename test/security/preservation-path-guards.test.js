/**
 * Preservation Test: Path Guards Validate File System Access
 *
 * **Validates: Requirements 3.7**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.7:
 * - Path guards should validate file system access against allowed roots
 *
 * This test verifies that:
 * 1. Path guards accept paths within allowed roots
 * 2. Path guards reject paths outside allowed roots
 * 3. Path guards normalize paths before validation
 * 4. Path guards handle edge cases (relative paths, traversal attempts)
 * 5. File operations (read, write, delete) use path guard validation
 *
 * Expected Behavior (on unfixed code):
 * - All file operations should validate paths against allowed roots
 * - Paths within allowed roots should be accepted
 * - Paths outside allowed roots should be rejected
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
  console.log('\n🧪 Running Path Guards Preservation Tests\n');
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
    console.log('✅ PRESERVATION CONFIRMED: Baseline path guard behavior is working correctly\n');
  }
}

/**
 * Property: Path guard module exists and exports createPathGuard
 *
 * This verifies that the path guard implementation exists in the codebase.
 */
test('Property: Path guard module exists', async () => {
  const pathGuardPath = 'NeuralShell_Desktop/src/core/pathGuard.js';

  assert.ok(
    fs.existsSync(pathGuardPath),
    `Path guard module should exist at ${pathGuardPath}`
  );

  const content = fs.readFileSync(pathGuardPath, 'utf8');

  // Verify createPathGuard function is exported
  assert.ok(
    content.includes('createPathGuard'),
    'Path guard module should export createPathGuard function'
  );

  // Verify it has isAllowed and assertAllowed methods
  assert.ok(
    content.includes('isAllowed') && content.includes('assertAllowed'),
    'Path guard should have isAllowed and assertAllowed methods'
  );

  console.log('   Confirmed: Path guard module exists with required methods');
});

/**
 * Property: Path guards accept paths within allowed roots
 *
 * For all paths within allowed roots, the path guard should accept them.
 * This uses property-based testing by testing multiple valid paths.
 */
test('Property: Path guards accept paths within allowed roots', async () => {
  // Dynamically import the path guard module
  const pathGuardModule = await import('../../NeuralShell_Desktop/src/core/pathGuard.js');
  const { createPathGuard } = pathGuardModule;

  // Test with multiple allowed roots
  const allowedRoots = [
    path.resolve('C:/tmp/root1'),
    path.resolve('C:/tmp/root2'),
    path.resolve('/usr/local/app')
  ];

  const guard = createPathGuard(allowedRoots);

  // Property: All paths within allowed roots should be accepted
  const validPaths = [
    // Paths in root1
    path.join(allowedRoots[0], 'file.txt'),
    path.join(allowedRoots[0], 'subdir', 'file.txt'),
    path.join(allowedRoots[0], 'deep', 'nested', 'path', 'file.txt'),
    allowedRoots[0], // Root itself

    // Paths in root2
    path.join(allowedRoots[1], 'data.json'),
    path.join(allowedRoots[1], 'config', 'settings.json'),

    // Paths in root3
    path.join(allowedRoots[2], 'bin', 'app'),
    path.join(allowedRoots[2], 'lib', 'module.js')
  ];

  for (const testPath of validPaths) {
    assert.ok(
      guard.isAllowed(testPath),
      `Path within allowed root should be accepted: ${testPath}`
    );

    // assertAllowed should not throw
    const normalized = guard.assertAllowed(testPath);
    assert.ok(
      typeof normalized === 'string',
      `assertAllowed should return normalized path: ${normalized}`
    );
  }

  console.log(`   Validated ${validPaths.length} paths within allowed roots`);
});

/**
 * Property: Path guards reject paths outside allowed roots
 *
 * For all paths outside allowed roots, the path guard should reject them.
 * This ensures the security boundary is enforced.
 */
test('Property: Path guards reject paths outside allowed roots', async () => {
  const pathGuardModule = await import('../../NeuralShell_Desktop/src/core/pathGuard.js');
  const { createPathGuard } = pathGuardModule;

  const allowedRoots = [
    path.resolve('C:/tmp/allowed')
  ];

  const guard = createPathGuard(allowedRoots);

  // Property: All paths outside allowed roots should be rejected
  const invalidPaths = [
    'C:/tmp/other/file.txt',
    'C:/Windows/System32/config/SAM',
    '/etc/passwd',
    '/var/log/system.log',
    'C:/Program Files/app/data.txt',
    path.resolve('C:/tmp/allowed-but-not-exact') // Similar but not within root
  ];

  for (const testPath of invalidPaths) {
    assert.strictEqual(
      guard.isAllowed(testPath),
      false,
      `Path outside allowed root should be rejected: ${testPath}`
    );

    // assertAllowed should throw
    assert.throws(
      () => guard.assertAllowed(testPath),
      /Path outside allowlist/,
      `assertAllowed should throw for path outside root: ${testPath}`
    );
  }

  console.log(`   Rejected ${invalidPaths.length} paths outside allowed roots`);
});

/**
 * Property: Path guards normalize paths before validation
 *
 * Path guards should normalize paths (resolve relative paths, handle .., etc.)
 * before validation to prevent traversal attacks.
 */
test('Property: Path guards normalize paths before validation', async () => {
  const pathGuardModule = await import('../../NeuralShell_Desktop/src/core/pathGuard.js');
  const { createPathGuard } = pathGuardModule;

  const allowedRoot = path.resolve('C:/tmp/root');
  const guard = createPathGuard([allowedRoot]);

  // Property: Normalized paths within root should be accepted
  const normalizedValidPaths = [
    path.join(allowedRoot, '.', 'file.txt'), // Current directory
    path.join(allowedRoot, 'subdir', '..', 'file.txt'), // Parent directory (stays within root)
    path.join(allowedRoot, 'a', 'b', '..', '..', 'file.txt') // Multiple parent dirs (stays within root)
  ];

  for (const testPath of normalizedValidPaths) {
    assert.ok(
      guard.isAllowed(testPath),
      `Normalized path within root should be accepted: ${testPath}`
    );
  }

  console.log(`   Validated ${normalizedValidPaths.length} normalized paths within root`);

  // Property: Paths that normalize to outside root should be rejected
  const normalizedInvalidPaths = [
    path.join(allowedRoot, '..', 'other', 'file.txt'), // Escapes root
    path.join(allowedRoot, '..', '..', 'system', 'file.txt') // Escapes multiple levels
  ];

  for (const testPath of normalizedInvalidPaths) {
    assert.strictEqual(
      guard.isAllowed(testPath),
      false,
      `Path that normalizes outside root should be rejected: ${testPath}`
    );
  }

  console.log(`   Rejected ${normalizedInvalidPaths.length} paths that normalize outside root`);
});

/**
 * Property: Path guards handle multiple allowed roots
 *
 * When multiple roots are configured, path guards should accept paths
 * within any of the allowed roots.
 */
test('Property: Path guards handle multiple allowed roots', async () => {
  const pathGuardModule = await import('../../NeuralShell_Desktop/src/core/pathGuard.js');
  const { createPathGuard } = pathGuardModule;

  const allowedRoots = [
    path.resolve('C:/tmp/root1'),
    path.resolve('C:/tmp/root2'),
    path.resolve('C:/tmp/root3')
  ];

  const guard = createPathGuard(allowedRoots);

  // Property: Paths in any allowed root should be accepted
  const pathsInDifferentRoots = [
    path.join(allowedRoots[0], 'file1.txt'),
    path.join(allowedRoots[1], 'file2.txt'),
    path.join(allowedRoots[2], 'file3.txt')
  ];

  for (const testPath of pathsInDifferentRoots) {
    assert.ok(
      guard.isAllowed(testPath),
      `Path in any allowed root should be accepted: ${testPath}`
    );
  }

  console.log(`   Validated paths across ${allowedRoots.length} different allowed roots`);

  // Property: Paths outside all roots should be rejected
  const pathOutsideAllRoots = 'C:/tmp/root4/file.txt';
  assert.strictEqual(
    guard.isAllowed(pathOutsideAllRoots),
    false,
    `Path outside all roots should be rejected: ${pathOutsideAllRoots}`
  );

  console.log('   Confirmed: Paths outside all roots are rejected');
});

/**
 * Property: File operations use path guard validation
 *
 * This verifies that file operations (read, write, delete) in main.js
 * use path guard validation before performing the operation.
 */
test('Property: File operations use path guard validation', async () => {
  const mainPath = 'NeuralShell_Desktop/main.js';

  assert.ok(
    fs.existsSync(mainPath),
    'main.js should exist'
  );

  const content = fs.readFileSync(mainPath, 'utf8');

  // Verify pathGuard is imported
  assert.ok(
    content.includes('createPathGuard') &&
    (content.includes("require('./src/core/pathGuard')") ||
     content.includes('require("./src/core/pathGuard")') ||
     content.includes('from "./src/core/pathGuard"') ||
     content.includes("from './src/core/pathGuard'")),
    'main.js should import pathGuard module'
  );

  // Verify pathGuard is created
  assert.ok(
    content.includes('createPathGuard') || content.includes('createSovereignPathGuard'),
    'main.js should create a path guard instance'
  );

  // Verify read-file handler uses path guard
  const readFileMatch = content.match(/registerHandle\s*\(\s*["']read-file["']\s*,[\s\S]*?\}\s*\)/);
  if (readFileMatch) {
    assert.ok(
      readFileMatch[0].includes('pathGuard.assertAllowed') ||
      readFileMatch[0].includes('pathGuard.isAllowed'),
      'read-file handler should use path guard validation'
    );
  }

  // Verify write-file handler uses path guard
  const writeFileMatch = content.match(/registerHandle\s*\(\s*["']write-file["']\s*,[\s\S]*?\}\s*\)/);
  if (writeFileMatch) {
    assert.ok(
      writeFileMatch[0].includes('pathGuard.assertAllowed') ||
      writeFileMatch[0].includes('pathGuard.isAllowed'),
      'write-file handler should use path guard validation'
    );
  }

  // Verify delete-file handler uses path guard
  const deleteFileMatch = content.match(/registerHandle\s*\(\s*["']delete-file["']\s*,[\s\S]*?\}\s*\)/);
  if (deleteFileMatch) {
    assert.ok(
      deleteFileMatch[0].includes('pathGuard.assertAllowed') ||
      deleteFileMatch[0].includes('pathGuard.isAllowed'),
      'delete-file handler should use path guard validation'
    );
  }

  console.log('   Confirmed: File operations use path guard validation');
});

/**
 * Property: Path guard returns normalized paths
 *
 * The assertAllowed method should return the normalized (absolute) path
 * when validation succeeds, ensuring consistent path handling.
 */
test('Property: Path guard returns normalized paths', async () => {
  const pathGuardModule = await import('../../NeuralShell_Desktop/src/core/pathGuard.js');
  const { createPathGuard } = pathGuardModule;

  const allowedRoot = path.resolve('C:/tmp/root');
  const guard = createPathGuard([allowedRoot]);

  // Property: assertAllowed should return normalized absolute paths
  const testCases = [
    { input: path.join(allowedRoot, 'file.txt'), expected: path.resolve(allowedRoot, 'file.txt') },
    { input: path.join(allowedRoot, 'subdir', 'file.txt'), expected: path.resolve(allowedRoot, 'subdir', 'file.txt') },
    { input: path.join(allowedRoot, '.', 'file.txt'), expected: path.resolve(allowedRoot, 'file.txt') }
  ];

  for (const { input, expected } of testCases) {
    const result = guard.assertAllowed(input);
    assert.strictEqual(
      result,
      expected,
      `assertAllowed should return normalized path: ${result} === ${expected}`
    );
  }

  console.log(`   Validated ${testCases.length} normalized path returns`);
});

/**
 * Property: Path guard exposes allowed roots
 *
 * The path guard should expose the configured allowed roots for inspection,
 * which is useful for debugging and validation.
 */
test('Property: Path guard exposes allowed roots', async () => {
  const pathGuardModule = await import('../../NeuralShell_Desktop/src/core/pathGuard.js');
  const { createPathGuard } = pathGuardModule;

  const allowedRoots = [
    path.resolve('C:/tmp/root1'),
    path.resolve('C:/tmp/root2')
  ];

  const guard = createPathGuard(allowedRoots);

  // Property: Guard should expose roots property
  assert.ok(
    guard.roots,
    'Path guard should expose roots property'
  );

  assert.ok(
    Array.isArray(guard.roots),
    'Roots property should be an array'
  );

  assert.strictEqual(
    guard.roots.length,
    allowedRoots.length,
    `Roots array should contain ${allowedRoots.length} roots`
  );

  // Verify roots are normalized
  for (let i = 0; i < allowedRoots.length; i++) {
    assert.strictEqual(
      guard.roots[i],
      path.resolve(allowedRoots[i]),
      `Root ${i} should be normalized`
    );
  }

  console.log(`   Confirmed: Path guard exposes ${guard.roots.length} allowed roots`);
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
