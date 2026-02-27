/**
 * Preservation Test: Permission Checks for Sensitive Operations
 *
 * **Validates: Requirements 3.6**
 *
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 *
 * From Preservation Requirements 3.6:
 * - Permission checks for sensitive operations should continue to work
 *
 * This test verifies that:
 * 1. Permission checks are enforced for sensitive operations
 * 2. Operations succeed when permissions are granted
 * 3. Operations fail when permissions are denied
 * 4. Permission state is correctly managed
 * 5. Permission audit trail is maintained
 *
 * Expected Behavior (on unfixed code):
 * - All sensitive operations should check permissions before executing
 * - Permission denials should throw appropriate errors
 * - This behavior must be preserved after security fixes
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Permission Checks Preservation Tests\n');
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
    console.log('✅ PRESERVATION CONFIRMED: Baseline permission check behavior is working correctly\n');
  }
}

// Import PermissionManager dynamically
let PermissionManager;
try {
  const permissionModule = await import('../../NeuralShell_Desktop/src/core/permissionManager.js');
  PermissionManager = permissionModule.PermissionManager;
} catch (error) {
  console.error('Failed to import PermissionManager:', error.message);
  process.exit(1);
}

/**
 * Property: For all permission keys, allowed() returns correct boolean state
 *
 * This property verifies that permission state is correctly managed:
 * - Default permissions are set correctly
 * - allowed() returns true for granted permissions
 * - allowed() returns false for denied permissions
 * - Permission state persists across operations
 */
test('Property: Permission state is correctly managed and queried', async () => {
  const permissionKeys = ['fileRead', 'fileWrite', 'autoMode', 'llmStream', 'checkpointWrite', 'tearImport'];

  for (const key of permissionKeys) {
    const dir = path.join(os.tmpdir(), `neuralshell_perm_state_${Date.now()}_${Math.random()}`);
    await fs.promises.mkdir(dir, { recursive: true });

    try {
      const pm = new PermissionManager(dir);
      await pm.init();

      // Test default state (should be true for all default permissions)
      const defaultState = pm.allowed(key);
      assert.strictEqual(
        typeof defaultState,
        'boolean',
        `allowed() should return boolean for ${key}`
      );

      // Test setting permission to false
      await pm.set(key, false, 'test');
      assert.strictEqual(
        pm.allowed(key),
        false,
        `Permission ${key} should be false after setting to false`
      );

      // Test setting permission to true
      await pm.set(key, true, 'test');
      assert.strictEqual(
        pm.allowed(key),
        true,
        `Permission ${key} should be true after setting to true`
      );

    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }

  console.log(`   Validated permission state management for ${permissionKeys.length} permission keys`);
});

/**
 * Property: For all sensitive operations, permission checks are enforced
 *
 * This verifies that permission checks prevent unauthorized operations:
 * - When permission is denied, operation should fail
 * - When permission is granted, operation should succeed
 * - Error message should indicate permission denial
 */
test('Property: Permission checks enforce access control', async () => {
  const testCases = [
    { key: 'fileRead', description: 'file read operations' },
    { key: 'fileWrite', description: 'file write operations' },
    { key: 'checkpointWrite', description: 'checkpoint save operations' },
    { key: 'autoMode', description: 'autonomous mode operations' }
  ];

  for (const { key, description } of testCases) {
    const dir = path.join(os.tmpdir(), `neuralshell_perm_enforce_${Date.now()}_${Math.random()}`);
    await fs.promises.mkdir(dir, { recursive: true });

    try {
      const pm = new PermissionManager(dir);
      await pm.init();

      // Deny permission
      await pm.set(key, false, 'test');

      // Simulate permission check (as done in createTearServer.js)
      const requirePermission = (permKey) => {
        if (!pm.allowed(permKey)) {
          throw new Error(`Permission denied: ${permKey}`);
        }
      };

      // Verify permission check fails when denied
      let permissionDenied = false;
      try {
        requirePermission(key);
      } catch (error) {
        if (error.message.includes('Permission denied')) {
          permissionDenied = true;
        }
      }

      assert.ok(
        permissionDenied,
        `Permission check should fail for denied ${description}`
      );

      // Grant permission
      await pm.set(key, true, 'test');

      // Verify permission check succeeds when granted
      let permissionGranted = false;
      try {
        requirePermission(key);
        permissionGranted = true;
      } catch (error) {
        throw new Error(`Permission check should succeed for granted ${description}: ${error.message}`);
      }

      assert.ok(
        permissionGranted,
        `Permission check should succeed for granted ${description}`
      );

    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }

  console.log(`   Validated permission enforcement for ${testCases.length} sensitive operations`);
});

/**
 * Property: Permission changes are audited
 *
 * This verifies that permission changes create audit trail:
 * - Setting permissions creates audit entries
 * - Audit entries contain correct information
 * - Audit trail is queryable
 */
test('Property: Permission changes are audited', async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_perm_audit_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    const pm = new PermissionManager(dir);
    await pm.init();

    // Make several permission changes
    await pm.set('fileRead', false, 'test-actor');
    await pm.set('fileWrite', true, 'test-actor');
    await pm.set('autoMode', false, 'test-actor');

    // Retrieve audit trail
    const auditEntries = await pm.auditTail(10);

    assert.ok(
      auditEntries.length >= 3,
      'Audit trail should contain at least 3 entries'
    );

    // Verify audit entries are properly formatted
    for (const entry of auditEntries) {
      const parsed = JSON.parse(entry);

      assert.ok(parsed.at, 'Audit entry should have timestamp');
      assert.ok(parsed.action, 'Audit entry should have action');
      assert.ok(parsed.key, 'Audit entry should have key');
      assert.ok(parsed.actor, 'Audit entry should have actor');
      assert.ok(parsed.value !== undefined, 'Audit entry should have value');
    }

    console.log(`   Confirmed: ${auditEntries.length} audit entries created and properly formatted`);

  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: Permission list returns all permission states
 *
 * This verifies that permission state can be queried:
 * - list() returns all permissions
 * - list() returns current state for each permission
 * - list() includes default permissions
 */
test('Property: Permission list returns complete state', async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_perm_list_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    const pm = new PermissionManager(dir);
    await pm.init();

    // Get initial list
    const initialList = pm.list();

    assert.ok(
      typeof initialList === 'object',
      'list() should return an object'
    );

    // Verify default permissions are present
    const expectedKeys = ['fileRead', 'fileWrite', 'autoMode', 'llmStream', 'checkpointWrite', 'tearImport'];
    for (const key of expectedKeys) {
      assert.ok(
        key in initialList,
        `list() should include ${key}`
      );

      assert.strictEqual(
        typeof initialList[key],
        'boolean',
        `Permission ${key} should be boolean`
      );
    }

    // Change some permissions
    await pm.set('fileRead', false, 'test');
    await pm.set('autoMode', false, 'test');

    // Get updated list
    const updatedList = pm.list();

    assert.strictEqual(
      updatedList.fileRead,
      false,
      'Updated list should reflect fileRead change'
    );

    assert.strictEqual(
      updatedList.autoMode,
      false,
      'Updated list should reflect autoMode change'
    );

    console.log(`   Confirmed: list() returns ${expectedKeys.length} permissions with correct state`);

  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: Permission state persists across initialization
 *
 * This verifies that permission state is persisted:
 * - Permission changes are saved to disk
 * - Reinitialization loads saved state
 * - Persisted state matches set state
 */
test('Property: Permission state persists across initialization', async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_perm_persist_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    // First instance - set permissions
    const pm1 = new PermissionManager(dir);
    await pm1.init();

    await pm1.set('fileRead', false, 'test');
    await pm1.set('fileWrite', false, 'test');
    await pm1.set('autoMode', true, 'test');

    const state1 = pm1.list();

    // Second instance - load persisted state
    const pm2 = new PermissionManager(dir);
    await pm2.init();

    const state2 = pm2.list();

    // Verify state matches
    assert.strictEqual(
      state2.fileRead,
      state1.fileRead,
      'fileRead should persist'
    );

    assert.strictEqual(
      state2.fileWrite,
      state1.fileWrite,
      'fileWrite should persist'
    );

    assert.strictEqual(
      state2.autoMode,
      state1.autoMode,
      'autoMode should persist'
    );

    // Verify specific values
    assert.strictEqual(state2.fileRead, false, 'Persisted fileRead should be false');
    assert.strictEqual(state2.fileWrite, false, 'Persisted fileWrite should be false');
    assert.strictEqual(state2.autoMode, true, 'Persisted autoMode should be true');

    console.log('   Confirmed: Permission state persists across initialization');

  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: Permission checks handle edge cases correctly
 *
 * This verifies that permission system handles edge cases:
 * - Unknown permission keys are rejected
 * - Invalid values are coerced to boolean
 * - Concurrent permission checks work correctly
 */
test('Property: Permission system handles edge cases correctly', async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_perm_edge_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    const pm = new PermissionManager(dir);
    await pm.init();

    // Test unknown permission key
    let unknownKeyRejected = false;
    try {
      await pm.set('unknownPermission', true, 'test');
    } catch (error) {
      if (error.message.includes('Unknown permission key')) {
        unknownKeyRejected = true;
      }
    }

    assert.ok(
      unknownKeyRejected,
      'Setting unknown permission key should be rejected'
    );

    // Test value coercion to boolean
    await pm.set('fileRead', 'true', 'test');
    assert.strictEqual(
      pm.allowed('fileRead'),
      true,
      'String "true" should be coerced to boolean true'
    );

    await pm.set('fileRead', 0, 'test');
    assert.strictEqual(
      pm.allowed('fileRead'),
      false,
      'Number 0 should be coerced to boolean false'
    );

    await pm.set('fileRead', 1, 'test');
    assert.strictEqual(
      pm.allowed('fileRead'),
      true,
      'Number 1 should be coerced to boolean true'
    );

    // Test querying non-existent permission
    const nonExistent = pm.allowed('nonExistentPermission');
    assert.strictEqual(
      nonExistent,
      false,
      'Non-existent permission should return false'
    );

    console.log('   Confirmed: Edge cases handled correctly');

  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: Multiple permission checks can be performed concurrently
 *
 * This verifies that permission system is thread-safe:
 * - Multiple concurrent allowed() calls work correctly
 * - Multiple concurrent set() calls work correctly
 * - No race conditions in permission state
 */
test('Property: Concurrent permission operations work correctly', async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_perm_concurrent_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });

  try {
    const pm = new PermissionManager(dir);
    await pm.init();

    // Perform multiple concurrent reads
    const readPromises = [];
    for (let i = 0; i < 10; i++) {
      readPromises.push(Promise.resolve(pm.allowed('fileRead')));
    }

    const readResults = await Promise.all(readPromises);
    assert.ok(
      readResults.every(r => typeof r === 'boolean'),
      'All concurrent reads should return boolean'
    );

    // Perform multiple concurrent writes
    const writePromises = [];
    const keys = ['fileRead', 'fileWrite', 'autoMode', 'llmStream'];
    for (let i = 0; i < keys.length; i++) {
      writePromises.push(pm.set(keys[i], i % 2 === 0, 'test'));
    }

    await Promise.all(writePromises);

    // Verify final state
    const finalState = pm.list();
    assert.strictEqual(finalState.fileRead, true, 'fileRead should be true (index 0, even)');
    assert.strictEqual(finalState.fileWrite, false, 'fileWrite should be false (index 1, odd)');
    assert.strictEqual(finalState.autoMode, true, 'autoMode should be true (index 2, even)');
    assert.strictEqual(finalState.llmStream, false, 'llmStream should be false (index 3, odd)');

    console.log('   Confirmed: Concurrent operations work correctly');

  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
