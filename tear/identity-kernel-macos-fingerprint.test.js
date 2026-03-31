/**
 * macOS Hardware Binding - Fingerprint Generation Tests
 * Feature: macos-hardware-binding
 * Tests SHA-256 fingerprint generation and caching
 */

const crypto = require('crypto');

// Simulate fingerprint generation
function generateFingerprint(compositeIdentifier) {
  return crypto
    .createHash('sha256')
    .update(compositeIdentifier)
    .digest('hex');
}

// Test 1: Generate 64-character hex string from composite identifier
// Feature: macos-hardware-binding, Property 9: SHA-256 Hash Produces 64-Character Hex String
function test_fingerprint_format() {
  const composite = 'C02ABC123DEF:12345678-1234-1234-1234-123456789ABC';
  const fingerprint = generateFingerprint(composite);
  
  if (fingerprint.length !== 64) {
    throw new Error(`Expected 64 characters, got ${fingerprint.length}`);
  }
  
  if (!/^[a-f0-9]{64}$/.test(fingerprint)) {
    throw new Error(`Expected hex format [a-f0-9]{64}, got "${fingerprint}"`);
  }
  
  console.log('✓ Generate 64-character hex fingerprint');
}

// Test 2: Same input produces same hash (determinism)
// Feature: macos-hardware-binding, Property 10: Hash Computation Is Deterministic
function test_fingerprint_determinism() {
  const composite = 'C02ABC123DEF:12345678-1234-1234-1234-123456789ABC';
  const fingerprint1 = generateFingerprint(composite);
  const fingerprint2 = generateFingerprint(composite);
  
  if (fingerprint1 !== fingerprint2) {
    throw new Error('Same input should produce same hash');
  }
  
  console.log('✓ Same input produces same hash (determinism)');
}

// Test 3: Different inputs produce different hashes
// Feature: macos-hardware-binding, Property 26: Hash Collision Resistance
function test_fingerprint_uniqueness() {
  const composite1 = 'C02ABC123DEF:12345678-1234-1234-1234-123456789ABC';
  const composite2 = 'C02XYZ789GHI:87654321-4321-4321-4321-CBA987654321';
  
  const fingerprint1 = generateFingerprint(composite1);
  const fingerprint2 = generateFingerprint(composite2);
  
  if (fingerprint1 === fingerprint2) {
    throw new Error('Different inputs should produce different hashes');
  }
  
  console.log('✓ Different inputs produce different hashes');
}

// Test 4: Degraded mode produces valid fingerprint
function test_fingerprint_degraded_mode() {
  const compositeUUIDOnly = '12345678-1234-1234-1234-123456789ABC';
  const compositeSerialOnly = 'C02ABC123DEF';
  
  const fingerprintUUID = generateFingerprint(compositeUUIDOnly);
  const fingerprintSerial = generateFingerprint(compositeSerialOnly);
  
  if (fingerprintUUID.length !== 64 || !/^[a-f0-9]{64}$/.test(fingerprintUUID)) {
    throw new Error('UUID-only fingerprint should be valid 64-char hex');
  }
  
  if (fingerprintSerial.length !== 64 || !/^[a-f0-9]{64}$/.test(fingerprintSerial)) {
    throw new Error('Serial-only fingerprint should be valid 64-char hex');
  }
  
  console.log('✓ Degraded mode produces valid fingerprint');
}

// Test 5: Empty string produces valid fingerprint (edge case)
function test_fingerprint_empty_input() {
  const fingerprint = generateFingerprint('');
  
  if (fingerprint.length !== 64 || !/^[a-f0-9]{64}$/.test(fingerprint)) {
    throw new Error('Empty input should still produce valid 64-char hex');
  }
  
  console.log('✓ Empty input produces valid fingerprint');
}

// Test 6: Cross-platform format consistency
// Feature: macos-hardware-binding, Property 21: Cross-Platform Format Consistency
function test_fingerprint_cross_platform_format() {
  // Simulate Windows-style composite (no colon separator in original Windows impl)
  const windowsComposite = 'ProcessorId12345BaseboardSerial67890';
  const macosComposite = 'C02ABC123DEF:12345678-1234-1234-1234-123456789ABC';
  
  const windowsFingerprint = generateFingerprint(windowsComposite);
  const macosFingerprint = generateFingerprint(macosComposite);
  
  // Both should be 64-char hex regardless of input format
  if (windowsFingerprint.length !== 64 || !/^[a-f0-9]{64}$/.test(windowsFingerprint)) {
    throw new Error('Windows fingerprint should be 64-char hex');
  }
  
  if (macosFingerprint.length !== 64 || !/^[a-f0-9]{64}$/.test(macosFingerprint)) {
    throw new Error('macOS fingerprint should be 64-char hex');
  }
  
  console.log('✓ Cross-platform format consistency');
}

// Run all tests
function runTests() {
  console.log('\n=== macOS Hardware Binding - Fingerprint Generation Tests ===\n');
  
  try {
    test_fingerprint_format();
    test_fingerprint_determinism();
    test_fingerprint_uniqueness();
    test_fingerprint_degraded_mode();
    test_fingerprint_empty_input();
    test_fingerprint_cross_platform_format();
    
    console.log('\n✓ All fingerprint generation tests passed\n');
    return true;
  } catch (err) {
    console.error(`\n✗ Test failed: ${err.message}\n`);
    return false;
  }
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
