/**
 * Bug Exploration Test: Network Broker Insecure Patterns Vulnerability
 *
 * **Validates: Requirements 1.6, 2.6**
 *
 * CRITICAL: These tests are EXPECTED TO FAIL on unfixed code.
 * Failure confirms the vulnerability exists.
 *
 * From Fault Condition:
 * - request.followRedirects === true OR request.maxResponseSize === Infinity
 *
 * Current Vulnerability in src/kernel/network.js:
 * - The safeFetch function has some security measures but may have gaps
 * - Need to verify redirect handling, response size limits, header restrictions, and HTTP method restrictions
 * - Current implementation should be tested against the expected secure behavior
 *
 * Expected Behavior (after fix):
 * - Redirects should be rejected (followRedirects: false)
 * - Response size should be capped at MAX_RESPONSE_BYTES (10MB)
 * - Only Accept, Content-Type, User-Agent headers should be allowed
 * - Only GET and POST methods should be permitted
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
  console.log('\n🧪 Running Network Broker Insecure Patterns Bug Exploration Tests\n');
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
    console.log('   This confirms the vulnerability exists as described in requirements 1.6 and 2.6\n');
    process.exit(1);
  }
}

/**
 * Test that redirects are followed (should fail - proves bug exists)
 * The network broker should explicitly reject redirects
 */
test('Bug Exploration: Redirects are followed (SHOULD FAIL - proves bug exists)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if the code explicitly handles redirects
  // The implementation should check statusCode >= 300 and reject with ERR_REDIRECT_DENIED
  const hasRedirectRejection = networkJsContent.includes('statusCode >= 300') &&
                                networkJsContent.includes('ERR_REDIRECT_DENIED');

  console.log(`   Has redirect rejection logic: ${hasRedirectRejection}`);

  // Check if using native https module (which doesn't follow redirects by default)
  const usesNativeHttps = networkJsContent.includes("require('node:https')") ||
                          networkJsContent.includes('require("node:https")') ||
                          networkJsContent.includes("import https from 'node:https'") ||
                          networkJsContent.includes('import https from "node:https"');

  console.log(`   Uses native https module (no auto-redirect): ${usesNativeHttps}`);

  // Check if using axios or other libraries that might follow redirects
  // Be specific to avoid false positives from https.request or function names
  const usesAxios = networkJsContent.includes("require('axios')") ||
                    networkJsContent.includes('require("axios")') ||
                    networkJsContent.includes("require('node-fetch')") ||
                    networkJsContent.includes('require("node-fetch")') ||
                    networkJsContent.includes("require('got')") ||
                    networkJsContent.includes('require("got")') ||
                    networkJsContent.includes("require('request')") ||
                    networkJsContent.includes('require("request")');

  console.log(`   Uses library that might follow redirects: ${usesAxios}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // The code should either:
  // 1. Use native https (which doesn't follow redirects) AND explicitly reject 3xx status codes
  // 2. OR explicitly set followRedirects: false if using a library
  const isSecure = hasRedirectRejection && usesNativeHttps && !usesAxios;

  assert.strictEqual(
    isSecure,
    true,
    'VULNERABILITY CONFIRMED: Network broker does not properly handle redirects. ' +
    'Expected: Network broker should use native https module and explicitly reject 3xx status codes. ' +
    `Actual: ${hasRedirectRejection ? 'Has rejection logic' : 'Missing rejection logic'}, ` +
    `${usesNativeHttps ? 'uses native https' : 'not using native https'}, ` +
    `${usesAxios ? 'uses library that might follow redirects' : 'no redirect-following library detected'}. ` +
    'This proves the bug exists as described in requirement 1.6.'
  );
});

/**
 * Test that unlimited response sizes are allowed (should fail - proves bug exists)
 * The network broker should enforce MAX_RESPONSE_BYTES cap
 */
test('Bug Exploration: Unlimited response sizes are allowed (SHOULD FAIL - proves bug exists)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if MAX_BYTES is defined and enforced
  const hasMaxBytesDefinition = networkJsContent.includes('MAX_BYTES');
  const hasMaxBytesEnforcement = networkJsContent.includes('MAX_BYTES') &&
                                  networkJsContent.includes('ERR_SIZE_EXCEEDED');

  console.log(`   Has MAX_BYTES definition: ${hasMaxBytesDefinition}`);
  console.log(`   Has MAX_BYTES enforcement: ${hasMaxBytesEnforcement}`);

  // Check if the limit is set to a reasonable value (10MB)
  const maxBytesMatch = networkJsContent.match(/MAX_BYTES:\s*(\d+)\s*\*\s*(\d+)\s*\*\s*(\d+)/);
  const maxBytesValue = maxBytesMatch ? parseInt(maxBytesMatch[1]) * parseInt(maxBytesMatch[2]) * parseInt(maxBytesMatch[3]) : null;

  console.log(`   MAX_BYTES value: ${maxBytesValue ? `${maxBytesValue / (1024 * 1024)}MB` : 'not found'}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // We need to verify that the limit is properly enforced and not set to Infinity
  const hasProperLimit = hasMaxBytesEnforcement && maxBytesValue !== null && maxBytesValue !== Infinity;

  assert.strictEqual(
    hasProperLimit,
    true,
    'VULNERABILITY CONFIRMED: Network broker does not enforce proper response size limit. ' +
    'Expected: Network broker should enforce MAX_RESPONSE_BYTES = 10MB limit. ' +
    `Actual: ${hasMaxBytesEnforcement ? 'Limit found but may be Infinity' : 'No size limit enforcement found'}. ` +
    'This proves the bug exists as described in requirement 1.6.'
  );
});

/**
 * Test that arbitrary headers are allowed (should fail - proves bug exists)
 * The network broker should only allow Accept, Content-Type, User-Agent headers
 */
test('Bug Exploration: Arbitrary headers are allowed (SHOULD FAIL - proves bug exists)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if there's a header whitelist
  const hasHeaderWhitelist = networkJsContent.includes('HEADERS') &&
                             (networkJsContent.includes('accept') || networkJsContent.includes('Accept'));

  console.log(`   Has header whitelist: ${hasHeaderWhitelist}`);

  // Check if headers are validated before use
  const hasHeaderValidation = networkJsContent.includes('HEADERS') &&
                               (networkJsContent.includes('includes') || networkJsContent.includes('filter'));

  console.log(`   Has header validation: ${hasHeaderValidation}`);

  // Check if the whitelist includes only the allowed headers
  const headersMatch = networkJsContent.match(/HEADERS:\s*\[([^\]]+)\]/);
  const headersList = headersMatch ? headersMatch[1].toLowerCase() : '';

  console.log(`   Headers whitelist: ${headersList || 'not found'}`);

  // Verify that only accept, content-type, user-agent are allowed
  const hasOnlyAllowedHeaders = headersList.includes('accept') &&
                                 headersList.includes('content-type') &&
                                 headersList.includes('user-agent') &&
                                 !headersList.includes('authorization') &&
                                 !headersList.includes('cookie');

  console.log(`   Has only allowed headers: ${hasOnlyAllowedHeaders}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // We need to verify that arbitrary headers are rejected
  assert.strictEqual(
    hasHeaderWhitelist && hasHeaderValidation && hasOnlyAllowedHeaders,
    true,
    'VULNERABILITY CONFIRMED: Network broker allows arbitrary headers. ' +
    'Expected: Only Accept, Content-Type, User-Agent headers should be allowed. ' +
    `Actual: ${hasHeaderWhitelist ? 'Whitelist found but may not be enforced' : 'No header whitelist found'}. ` +
    'This proves the bug exists as described in requirement 2.6.'
  );
});

/**
 * Test that PUT/DELETE methods are allowed (should fail - proves bug exists)
 * The network broker should only permit GET and POST methods
 */
test('Bug Exploration: PUT/DELETE methods are allowed (SHOULD FAIL - proves bug exists)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if there's a method whitelist
  const hasMethodWhitelist = networkJsContent.includes('METHODS') &&
                             (networkJsContent.includes('GET') || networkJsContent.includes('POST'));

  console.log(`   Has method whitelist: ${hasMethodWhitelist}`);

  // Check if methods are validated before use
  const hasMethodValidation = networkJsContent.includes('METHODS') &&
                               networkJsContent.includes('includes');

  console.log(`   Has method validation: ${hasMethodValidation}`);

  // Check if the whitelist includes only GET and POST
  const methodsMatch = networkJsContent.match(/METHODS:\s*\[([^\]]+)\]/);
  const methodsList = methodsMatch ? methodsMatch[1].toUpperCase() : '';

  console.log(`   Methods whitelist: ${methodsList || 'not found'}`);

  // Verify that only GET and POST are allowed
  const hasOnlyAllowedMethods = methodsList.includes('GET') &&
                                 methodsList.includes('POST') &&
                                 !methodsList.includes('PUT') &&
                                 !methodsList.includes('DELETE') &&
                                 !methodsList.includes('PATCH');

  console.log(`   Has only GET and POST: ${hasOnlyAllowedMethods}`);

  // Check if ERR_METHOD_DENIED is thrown for invalid methods
  const hasMethodDeniedError = networkJsContent.includes('ERR_METHOD_DENIED');

  console.log(`   Has ERR_METHOD_DENIED error: ${hasMethodDeniedError}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  // We need to verify that PUT/DELETE are rejected
  assert.strictEqual(
    hasMethodWhitelist && hasMethodValidation && hasOnlyAllowedMethods && hasMethodDeniedError,
    true,
    'VULNERABILITY CONFIRMED: Network broker allows PUT/DELETE methods. ' +
    'Expected: Only GET and POST methods should be permitted. ' +
    `Actual: ${hasMethodWhitelist ? 'Whitelist found but may include PUT/DELETE' : 'No method whitelist found'}. ` +
    'This proves the bug exists as described in requirement 2.6.'
  );
});

/**
 * Test that SPKI certificate pinning is integrated (should fail - proves bug exists)
 * The network broker should integrate with certificate pinning from vulnerability 2
 */
test('Bug Exploration: SPKI certificate pinning is integrated (SHOULD FAIL - proves bug exists)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if certificate pinning is implemented
  const hasCertificatePinning = networkJsContent.includes('checkServerIdentity') ||
                                 networkJsContent.includes('certificate') ||
                                 networkJsContent.includes('SPKI');

  console.log(`   Has certificate pinning: ${hasCertificatePinning}`);

  // Check if PINS configuration exists
  const hasPinsConfig = networkJsContent.includes('PINS') &&
                        networkJsContent.includes('sha256');

  console.log(`   Has PINS configuration: ${hasPinsConfig}`);

  // Check if ERR_PIN_MISMATCH is thrown
  const hasPinMismatchError = networkJsContent.includes('ERR_PIN_MISMATCH');

  console.log(`   Has ERR_PIN_MISMATCH error: ${hasPinMismatchError}`);

  // CRITICAL: This assertion SHOULD FAIL on unfixed code
  assert.strictEqual(
    hasCertificatePinning && hasPinsConfig && hasPinMismatchError,
    true,
    'VULNERABILITY CONFIRMED: Network broker does not integrate SPKI certificate pinning. ' +
    'Expected: Network broker should enforce SPKI certificate pinning. ' +
    `Actual: ${hasCertificatePinning ? 'Some certificate logic found but may not be complete' : 'No certificate pinning found'}. ` +
    'This proves the bug exists as described in requirement 2.6.'
  );
});

/**
 * Test that proxy environment variables are purged (security check)
 * The network broker should purge proxy environment variables to prevent MITM
 */
test('Bug Exploration: Proxy environment variables are purged (security check)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if proxy variables are purged
  const hasProxyPurge = networkJsContent.includes('HTTP_PROXY') ||
                        networkJsContent.includes('HTTPS_PROXY') ||
                        networkJsContent.includes('proxyVars');

  console.log(`   Has proxy variable purge: ${hasProxyPurge}`);

  // Check if delete process.env is used
  const hasEnvDelete = networkJsContent.includes('delete process.env');

  console.log(`   Has process.env delete: ${hasEnvDelete}`);

  // This should pass - we expect proxy purging to be implemented
  assert.strictEqual(
    hasProxyPurge && hasEnvDelete,
    true,
    'Expected proxy environment variable purging to be implemented'
  );
});

/**
 * Test that HTTPS protocol is enforced (security check)
 * The network broker should only allow HTTPS protocol
 */
test('Bug Exploration: HTTPS protocol is enforced (security check)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if protocol validation exists
  const hasProtocolValidation = networkJsContent.includes('protocol') &&
                                 networkJsContent.includes('https:');

  console.log(`   Has protocol validation: ${hasProtocolValidation}`);

  // Check if ERR_PROTOCOL_DENIED is thrown
  const hasProtocolDeniedError = networkJsContent.includes('ERR_PROTOCOL_DENIED');

  console.log(`   Has ERR_PROTOCOL_DENIED error: ${hasProtocolDeniedError}`);

  // This should pass - we expect HTTPS enforcement
  assert.strictEqual(
    hasProtocolValidation && hasProtocolDeniedError,
    true,
    'Expected HTTPS protocol enforcement to be implemented'
  );
});

/**
 * Test that timeout is configured (security check)
 * The network broker should have a reasonable timeout to prevent hanging requests
 */
test('Bug Exploration: Timeout is configured (security check)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if timeout is configured
  const hasTimeout = networkJsContent.includes('TIMEOUT') ||
                     networkJsContent.includes('timeout');

  console.log(`   Has timeout configuration: ${hasTimeout}`);

  // Check if ERR_TIMEOUT is thrown
  const hasTimeoutError = networkJsContent.includes('ERR_TIMEOUT');

  console.log(`   Has ERR_TIMEOUT error: ${hasTimeoutError}`);

  // This should pass - we expect timeout to be configured
  assert.strictEqual(
    hasTimeout && hasTimeoutError,
    true,
    'Expected timeout configuration to be implemented'
  );
});

/**
 * Test that keepAlive is disabled (security check)
 * The network broker should disable keepAlive to prevent connection reuse
 */
test('Bug Exploration: keepAlive is disabled (security check)', async () => {
  const networkJsContent = fs.readFileSync('src/kernel/network.js', 'utf8');

  // Check if keepAlive is set to false
  const hasKeepAliveFalse = networkJsContent.includes('keepAlive') &&
                            networkJsContent.includes('false');

  console.log(`   Has keepAlive: false: ${hasKeepAliveFalse}`);

  // This should pass - we expect keepAlive to be disabled
  assert.strictEqual(
    hasKeepAliveFalse,
    true,
    'Expected keepAlive: false to be configured'
  );
});

// Run all tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
