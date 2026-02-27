/**
 * Bug Exploration Test: Renderer Network Access Vulnerability
 *
 * **Validates: Requirements 1.1, 2.1**
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 *
 * From Fault Condition:
 * - request.source === "renderer" AND request.protocol IN ["http", "https", "ws", "wss", "ftp"]
 *
 * Current Vulnerability in main.js:
 * - CSP allows connect-src to localhost:3000 and 127.0.0.1:11434
 * - No webRequest.onBeforeRequest handler to block network protocols
 * - Renderer can make fetch() and WebSocket connections to allowed origins
 *
 * Expected Behavior (after fix):
 * - All non-file/data protocols should be blocked via webRequest handler
 * - CSP should only allow file:// and data: (images only)
 * - No external network access from renderer process
 */

import { strict as assert } from 'assert';

const tests = [];
const results = { passed: 0, failed: 0, total: 0 };

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('\n🧪 Running Renderer Network Access Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.1 and 2.1\n');
    process.exit(1);
  }
}

/**
 * Test the actual CSP configuration from main.js
 * The current CSP allows network connections to localhost
 */
test('Bug Exploration: CSP allows localhost HTTP connections (SHOULD FAIL - proves bug exists)', async () => {
  // Read the actual CSP from main.js
  const fs = await import('fs');
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Extract CSP from the code
  const cspMatch = mainJsContent.match(/Content-Security-Policy['"]:\s*\["([^"]+)"\]/);
  assert.ok(cspMatch, 'Could not find CSP in main.js');

  const csp = cspMatch[1];
  console.log(`   Current CSP: ${csp}`);

  // Check if CSP allows network connections
  const allowsHttp = csp.includes('http://localhost') || csp.includes('http://127.0.0.1');
  const allowsWs = csp.includes('ws://localhost') || csp.includes('ws://127.0.0.1');

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    allowsHttp,
    false,
    'VULNERABILITY CONFIRMED: CSP allows HTTP connections to localhost. ' +
    'Expected: CSP should block all HTTP/HTTPS connections. ' +
    'Actual: CSP contains \'connect-src\' with localhost HTTP URLs. ' +
    'This proves the bug exists as described in requirement 1.1.'
  );

  assert.strictEqual(
    allowsWs,
    false,
    'VULNERABILITY CONFIRMED: CSP allows WebSocket connections to localhost. ' +
    'Expected: CSP should block all WebSocket connections. ' +
    'Actual: CSP contains \'connect-src\' with localhost WS URLs. ' +
    'This proves the bug exists as described in requirement 1.1.'
  );
});

/**
 * Test that main.js lacks webRequest.onBeforeRequest handler
 */
test('Bug Exploration: main.js lacks webRequest blocking (SHOULD FAIL - proves bug exists)', async () => {
  const fs = await import('fs');
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  // Check if webRequest.onBeforeRequest is present
  const hasWebRequestHandler = mainJsContent.includes('webRequest.onBeforeRequest');

  console.log(`   Has webRequest.onBeforeRequest: ${hasWebRequestHandler}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasWebRequestHandler,
    true,
    'VULNERABILITY CONFIRMED: main.js does not implement webRequest.onBeforeRequest handler. ' +
    'Expected: main.js should block network requests via webRequest.onBeforeRequest. ' +
    'Actual: No webRequest blocking found in main.js. ' +
    'This proves the bug exists as described in requirement 2.1.'
  );
});

/**
 * Test that main_kernel.js has the correct implementation (for comparison)
 */
test('Reference: main_kernel.js has webRequest blocking (should pass)', async () => {
  const fs = await import('fs');
  const kernelContent = fs.readFileSync('NeuralShell_Desktop/main_kernel.js', 'utf8');

  // Check if webRequest.onBeforeRequest is present
  const hasWebRequestHandler = kernelContent.includes('webRequest.onBeforeRequest');

  console.log(`   main_kernel.js has webRequest.onBeforeRequest: ${hasWebRequestHandler}`);

  // This should pass - main_kernel.js has the correct implementation
  assert.strictEqual(
    hasWebRequestHandler,
    true,
    'main_kernel.js should have webRequest blocking as a reference implementation'
  );
});

/**
 * Test CSP allows unsafe-inline (additional security issue)
 */
test('Bug Exploration: CSP allows unsafe-inline scripts (SHOULD FAIL - security issue)', async () => {
  const fs = await import('fs');
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  const cspMatch = mainJsContent.match(/Content-Security-Policy['"]:\s*\["([^"]+)"\]/);
  const csp = cspMatch[1];

  const allowsUnsafeInline = csp.includes("'unsafe-inline'");

  console.log(`   CSP allows 'unsafe-inline': ${allowsUnsafeInline}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    allowsUnsafeInline,
    false,
    'SECURITY ISSUE: CSP allows \'unsafe-inline\' which weakens XSS protection. ' +
    'Expected: CSP should not allow \'unsafe-inline\'. ' +
    'Actual: CSP contains \'unsafe-inline\' in script-src or style-src. ' +
    'This is a security weakness that should be addressed.'
  );
});

/**
 * Test that file:// protocol would be allowed (regression check)
 */
test('Bug Exploration: CSP should allow file:// protocol (regression check)', async () => {
  const fs = await import('fs');
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  const cspMatch = mainJsContent.match(/Content-Security-Policy['"]:\s*\["([^"]+)"\]/);
  const csp = cspMatch[1];

  // CSP default-src 'self' should allow file:// when loaded from file://
  // This is a regression check to ensure we don't break local file access
  const hasDefaultSelf = csp.includes("default-src 'self'");

  console.log(`   CSP has default-src 'self': ${hasDefaultSelf}`);

  assert.strictEqual(
    hasDefaultSelf,
    true,
    'CSP should have default-src \'self\' to allow local file access'
  );
});

/**
 * Test that data: protocol for images would be allowed (regression check)
 */
test('Bug Exploration: CSP should allow data: for images (regression check)', async () => {
  const fs = await import('fs');
  const mainJsContent = fs.readFileSync('NeuralShell_Desktop/main.js', 'utf8');

  const cspMatch = mainJsContent.match(/Content-Security-Policy['"]:\s*\["([^"]+)"\]/);
  const csp = cspMatch[1];

  const allowsDataImages = csp.includes('img-src') && csp.includes('data:');

  console.log(`   CSP allows data: for images: ${allowsDataImages}`);

  assert.strictEqual(
    allowsDataImages,
    true,
    'CSP should allow data: protocol for images (img-src ... data:)'
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
