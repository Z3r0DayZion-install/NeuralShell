/**
 * Preservation Test: PIN Authentication with Role Management
 * 
 * **Validates: Requirements 3.5**
 * 
 * CRITICAL: This test MUST PASS on unfixed code to confirm baseline behavior.
 * 
 * From Preservation Requirements 3.5:
 * - PIN-based authentication with role management should continue to work
 * 
 * This test verifies that:
 * 1. PIN authentication succeeds for valid PINs
 * 2. Role management (admin/viewer) is preserved
 * 3. Authentication returns correct role information
 * 4. PIN validation works across different PIN formats
 * 5. Role-based access control is enforced
 * 
 * Expected Behavior (on unfixed code):
 * - All valid PINs should authenticate successfully
 * - Correct roles should be returned after authentication
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
  console.log('\n🧪 Running PIN Authentication Preservation Tests\n');
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
    console.log('✅ PRESERVATION CONFIRMED: Baseline PIN authentication behavior is working correctly\n');
  }
}

// Import AuthManager dynamically
let AuthManager;
try {
  const authManagerModule = await import('../../NeuralShell_Desktop/src/core/authManager.js');
  AuthManager = authManagerModule.AuthManager;
} catch (error) {
  console.error('Failed to import AuthManager:', error.message);
  process.exit(1);
}

/**
 * Property: For all valid PINs, authentication succeeds with correct role
 * 
 * This property verifies that PIN authentication works correctly:
 * - Valid PINs authenticate successfully
 * - Authentication returns loggedIn: true
 * - Authentication returns the correct role (admin or viewer)
 */
test("Property: Valid PINs authenticate successfully with correct role", async () => {
  // Test multiple valid PIN configurations
  const testCases = [
    { pin: '1234', role: 'admin', description: '4-digit admin PIN' },
    { pin: '123456', role: 'admin', description: '6-digit admin PIN' },
    { pin: 'abcd', role: 'admin', description: 'alphabetic admin PIN' },
    { pin: '9999', role: 'viewer', description: '4-digit viewer PIN' },
    { pin: 'test123', role: 'viewer', description: 'alphanumeric viewer PIN' },
    { pin: '0000', role: 'admin', description: 'all-zeros admin PIN' },
  ];
  
  for (const { pin, role, description } of testCases) {
    const dir = path.join(os.tmpdir(), `neuralshell_auth_preserve_${Date.now()}_${Math.random()}`);
    await fs.promises.mkdir(dir, { recursive: true });
    
    try {
      const auth = new AuthManager(dir);
      await auth.init();
      
      // Bootstrap with the test PIN and role
      await auth.bootstrapPin(pin, role);
      
      // Authenticate with the PIN
      const result = await auth.login(pin);
      
      // Verify authentication succeeded
      assert.strictEqual(
        result.loggedIn,
        true,
        `Authentication should succeed for ${description}`
      );
      
      // Verify correct role is returned
      assert.strictEqual(
        result.role,
        role,
        `Authentication should return correct role (${role}) for ${description}`
      );
      
      // Verify status reflects logged-in state
      const status = auth.status();
      assert.strictEqual(
        status.loggedIn,
        true,
        `Status should show logged in for ${description}`
      );
      
      assert.strictEqual(
        status.role,
        role,
        `Status should show correct role (${role}) for ${description}`
      );
      
    } finally {
      // Cleanup
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }
  
  console.log(`   Validated ${testCases.length} PIN authentication scenarios`);
});

/**
 * Property: Admin role is preserved and enforced
 * 
 * This verifies that admin role management works correctly:
 * - Admin PINs authenticate with admin role
 * - requireAdmin() succeeds for admin sessions
 * - Admin role is preserved across operations
 */
test("Property: Admin role is preserved and enforced", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_admin_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  
  try {
    const auth = new AuthManager(dir);
    await auth.init();
    
    // Bootstrap with admin PIN
    await auth.bootstrapPin('admin123', 'admin');
    
    // Login as admin
    const result = await auth.login('admin123');
    
    assert.strictEqual(result.role, 'admin', 'Should authenticate as admin');
    
    // Verify requireAdmin() succeeds
    let adminCheckPassed = false;
    try {
      auth.requireAdmin();
      adminCheckPassed = true;
    } catch (error) {
      throw new Error(`requireAdmin() should succeed for admin session: ${error.message}`);
    }
    
    assert.ok(adminCheckPassed, 'requireAdmin() should not throw for admin session');
    
    console.log('   Confirmed: Admin role is preserved and enforced');
    
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: Viewer role is preserved and enforced
 * 
 * This verifies that viewer role management works correctly:
 * - Viewer PINs authenticate with viewer role
 * - requireAdmin() fails for viewer sessions
 * - Viewer role is preserved across operations
 */
test("Property: Viewer role is preserved and enforced", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_viewer_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  
  try {
    const auth = new AuthManager(dir);
    await auth.init();
    
    // Bootstrap with viewer PIN
    await auth.bootstrapPin('viewer123', 'viewer');
    
    // Login as viewer
    const result = await auth.login('viewer123');
    
    assert.strictEqual(result.role, 'viewer', 'Should authenticate as viewer');
    
    // Verify requireAdmin() fails for viewer
    let adminCheckFailed = false;
    try {
      auth.requireAdmin();
    } catch (error) {
      if (error.message.includes('Admin role required')) {
        adminCheckFailed = true;
      }
    }
    
    assert.ok(adminCheckFailed, 'requireAdmin() should fail for viewer session');
    
    console.log('   Confirmed: Viewer role is preserved and enforced');
    
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: PIN authentication preserves session state
 * 
 * This verifies that authentication session state is maintained:
 * - Login creates a session
 * - Session persists across status checks
 * - Logout clears the session
 * - Status reflects session state correctly
 */
test("Property: PIN authentication preserves session state", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_session_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  
  try {
    const auth = new AuthManager(dir);
    await auth.init();
    
    await auth.bootstrapPin('session123', 'admin');
    
    // Before login - no session
    let status = auth.status();
    assert.strictEqual(status.loggedIn, false, 'Should not be logged in initially');
    assert.strictEqual(status.role, null, 'Role should be null before login');
    
    // After login - session exists
    await auth.login('session123');
    status = auth.status();
    assert.strictEqual(status.loggedIn, true, 'Should be logged in after authentication');
    assert.strictEqual(status.role, 'admin', 'Role should be admin after login');
    
    // After logout - session cleared
    auth.logout();
    status = auth.status();
    assert.strictEqual(status.loggedIn, false, 'Should not be logged in after logout');
    assert.strictEqual(status.role, null, 'Role should be null after logout');
    
    console.log('   Confirmed: Session state is preserved correctly');
    
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: PIN authentication handles edge cases correctly
 * 
 * This verifies that PIN authentication handles various edge cases:
 * - Minimum length PINs (4 characters)
 * - PINs with whitespace (trimmed)
 * - Different character types (numeric, alphabetic, alphanumeric)
 */
test("Property: PIN authentication handles edge cases correctly", async () => {
  const edgeCases = [
    { pin: '1234', description: 'minimum length PIN (4 chars)' },
    { pin: '  1234  ', expectedPin: '1234', description: 'PIN with whitespace (trimmed)' },
    { pin: 'abcd', description: 'alphabetic PIN' },
    { pin: 'a1b2', description: 'alphanumeric PIN' },
    { pin: '12345678901234567890', description: 'long PIN (20 chars)' },
  ];
  
  for (const { pin, expectedPin, description } of edgeCases) {
    const dir = path.join(os.tmpdir(), `neuralshell_auth_edge_${Date.now()}_${Math.random()}`);
    await fs.promises.mkdir(dir, { recursive: true });
    
    try {
      const auth = new AuthManager(dir);
      await auth.init();
      
      // Bootstrap with edge case PIN
      await auth.bootstrapPin(pin, 'admin');
      
      // Authenticate with the same PIN (or trimmed version)
      const loginPin = expectedPin || pin;
      const result = await auth.login(loginPin);
      
      assert.strictEqual(
        result.loggedIn,
        true,
        `Authentication should succeed for ${description}`
      );
      
      assert.strictEqual(
        result.role,
        'admin',
        `Should return admin role for ${description}`
      );
      
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }
  
  console.log(`   Validated ${edgeCases.length} edge case scenarios`);
});

/**
 * Property: PIN authentication rejects invalid PINs
 * 
 * This verifies that authentication correctly rejects invalid PINs:
 * - Wrong PINs are rejected
 * - Error message is appropriate
 * - Session is not created for failed authentication
 */
test("Property: PIN authentication rejects invalid PINs", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_invalid_${Date.now()}_${Math.random()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  
  try {
    const auth = new AuthManager(dir);
    await auth.init();
    
    await auth.bootstrapPin('correct123', 'admin');
    
    // Test invalid PINs
    const invalidPins = ['wrong123', '0000', 'incorrect', ''];
    
    for (const invalidPin of invalidPins) {
      let authFailed = false;
      try {
        await auth.login(invalidPin);
      } catch (error) {
        if (error.message.includes('Invalid PIN') || error.message.includes('Account locked')) {
          authFailed = true;
        }
      }
      
      assert.ok(authFailed, `Invalid PIN should be rejected: ${invalidPin}`);
      
      // Verify no session was created
      const status = auth.status();
      assert.strictEqual(status.loggedIn, false, 'Should not be logged in after failed authentication');
    }
    
    console.log(`   Confirmed: ${invalidPins.length} invalid PINs were correctly rejected`);
    
  } finally {
    await fs.promises.rm(dir, { recursive: true, force: true });
  }
});

/**
 * Property: Role defaults to admin when not specified
 * 
 * This verifies backward compatibility:
 * - When role is not specified, it defaults to admin
 * - Invalid role values default to admin
 */
test("Property: Role defaults to admin when not specified or invalid", async () => {
  const testCases = [
    { role: undefined, expected: 'admin', description: 'undefined role' },
    { role: 'invalid', expected: 'admin', description: 'invalid role string' },
    { role: '', expected: 'admin', description: 'empty role string' },
  ];
  
  for (const { role, expected, description } of testCases) {
    const dir = path.join(os.tmpdir(), `neuralshell_auth_default_${Date.now()}_${Math.random()}`);
    await fs.promises.mkdir(dir, { recursive: true });
    
    try {
      const auth = new AuthManager(dir);
      await auth.init();
      
      // Bootstrap with undefined/invalid role
      await auth.bootstrapPin('test123', role);
      
      // Login and verify role
      const result = await auth.login('test123');
      
      assert.strictEqual(
        result.role,
        expected,
        `Role should default to ${expected} for ${description}`
      );
      
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }
  
  console.log(`   Validated ${testCases.length} role default scenarios`);
});

// Run all tests
runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
