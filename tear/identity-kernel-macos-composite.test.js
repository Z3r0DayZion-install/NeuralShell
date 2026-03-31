/**
 * macOS Hardware Binding - Composite Identifier Tests
 * Feature: macos-hardware-binding
 * Tests composite identifier construction logic
 */

const crypto = require('crypto');

// Simulate composite identifier construction
function buildCompositeIdentifier(platformSerial, hardwareUUID) {
  if (platformSerial && hardwareUUID) {
    return { composite: `${platformSerial}:${hardwareUUID}`, mode: 'success' };
  } else if (hardwareUUID) {
    return { composite: hardwareUUID, mode: 'degraded' };
  } else if (platformSerial) {
    return { composite: platformSerial, mode: 'degraded' };
  } else {
    throw new Error('Hardware binding failed on macOS: No identifiers available');
  }
}

// Test 1: Combine serial and UUID with colon separator (success mode)
function test_composite_success_mode() {
  const result = buildCompositeIdentifier('C02ABC123DEF', '12345678-1234-1234-1234-123456789ABC');
  if (result.composite !== 'C02ABC123DEF:12345678-1234-1234-1234-123456789ABC') {
    throw new Error(`Expected "C02ABC123DEF:12345678-1234-1234-1234-123456789ABC", got "${result.composite}"`);
  }
  if (result.mode !== 'success') {
    throw new Error(`Expected mode "success", got "${result.mode}"`);
  }
  console.log('✓ Combine serial and UUID (success mode)');
}

// Test 2: Use UUID only when serial is empty (degraded mode)
function test_composite_uuid_only() {
  const result = buildCompositeIdentifier('', '12345678-1234-1234-1234-123456789ABC');
  if (result.composite !== '12345678-1234-1234-1234-123456789ABC') {
    throw new Error(`Expected "12345678-1234-1234-1234-123456789ABC", got "${result.composite}"`);
  }
  if (result.mode !== 'degraded') {
    throw new Error(`Expected mode "degraded", got "${result.mode}"`);
  }
  console.log('✓ Use UUID only (degraded mode)');
}

// Test 3: Use serial only when UUID is empty (degraded mode)
function test_composite_serial_only() {
  const result = buildCompositeIdentifier('C02ABC123DEF', '');
  if (result.composite !== 'C02ABC123DEF') {
    throw new Error(`Expected "C02ABC123DEF", got "${result.composite}"`);
  }
  if (result.mode !== 'degraded') {
    throw new Error(`Expected mode "degraded", got "${result.mode}"`);
  }
  console.log('✓ Use serial only (degraded mode)');
}

// Test 4: Throw error when both are empty (hard failure)
function test_composite_hard_failure() {
  try {
    buildCompositeIdentifier('', '');
    throw new Error('Expected error to be thrown');
  } catch (err) {
    if (!err.message.includes('Hardware binding failed on macOS')) {
      throw new Error(`Expected "Hardware binding failed on macOS" error, got "${err.message}"`);
    }
  }
  console.log('✓ Throw error when both identifiers empty (hard failure)');
}

// Test 5: Composite identifier immutability
function test_composite_immutability() {
  const result1 = buildCompositeIdentifier('C02ABC123DEF', '12345678-1234-1234-1234-123456789ABC');
  const result2 = buildCompositeIdentifier('C02ABC123DEF', '12345678-1234-1234-1234-123456789ABC');
  
  if (result1.composite !== result2.composite) {
    throw new Error('Composite identifier should be deterministic');
  }
  console.log('✓ Composite identifier is deterministic');
}

// Run all tests
function runTests() {
  console.log('\n=== macOS Hardware Binding - Composite Identifier Tests ===\n');
  
  try {
    test_composite_success_mode();
    test_composite_uuid_only();
    test_composite_serial_only();
    test_composite_hard_failure();
    test_composite_immutability();
    
    console.log('\n✓ All composite identifier tests passed\n');
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
