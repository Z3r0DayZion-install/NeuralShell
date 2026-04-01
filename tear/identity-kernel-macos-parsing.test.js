/**
 * macOS Hardware Binding - Parsing Tests
 * Feature: macos-hardware-binding
 * Tests parsing functions for IOPlatformSerialNumber, IOPlatformUUID, and system_profiler output
 */

const crypto = require('crypto');

// Import parsing functions (we'll need to expose them for testing)
function parseIOPlatformSerialNumber(output) {
  const match = output.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}

function parseIOPlatformUUID(output) {
  const match = output.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
  return match ? match[1].trim() : '';
}

function parseSystemProfilerSerial(output) {
  const match = output.match(/Serial Number[^:]*:\s*([^\s\n]+)/i);
  return match ? match[1].trim() : '';
}

// Test 1: Parse valid IOPlatformSerialNumber from ioreg output
function test_parseIOPlatformSerialNumber_valid() {
  const output = '    "IOPlatformSerialNumber" = "C02ABC123DEF"';
  const result = parseIOPlatformSerialNumber(output);
  if (result !== 'C02ABC123DEF') {
    throw new Error(`Expected "C02ABC123DEF", got "${result}"`);
  }
  console.log('✓ Parse valid IOPlatformSerialNumber');
}

// Test 2: Parse valid IOPlatformUUID from ioreg output
function test_parseIOPlatformUUID_valid() {
  const output = '    "IOPlatformUUID" = "12345678-1234-1234-1234-123456789ABC"';
  const result = parseIOPlatformUUID(output);
  if (result !== '12345678-1234-1234-1234-123456789ABC') {
    throw new Error(`Expected "12345678-1234-1234-1234-123456789ABC", got "${result}"`);
  }
  console.log('✓ Parse valid IOPlatformUUID');
}

// Test 3: Parse valid Serial Number from system_profiler output
function test_parseSystemProfilerSerial_valid() {
  const output = '      Serial Number (system): C02ABC123DEF';
  const result = parseSystemProfilerSerial(output);
  if (result !== 'C02ABC123DEF') {
    throw new Error(`Expected "C02ABC123DEF", got "${result}"`);
  }
  console.log('✓ Parse valid system_profiler Serial Number');
}

// Test 4: Handle empty string in ioreg output
function test_parseIOPlatformSerialNumber_empty() {
  const output = '    "IOPlatformSerialNumber" = ""';
  const result = parseIOPlatformSerialNumber(output);
  if (result !== '') {
    throw new Error(`Expected empty string, got "${result}"`);
  }
  console.log('✓ Handle empty IOPlatformSerialNumber');
}

// Test 5: Handle missing key in ioreg output
function test_parseIOPlatformSerialNumber_missing() {
  const output = '    "SomeOtherKey" = "value"';
  const result = parseIOPlatformSerialNumber(output);
  if (result !== '') {
    throw new Error(`Expected empty string, got "${result}"`);
  }
  console.log('✓ Handle missing IOPlatformSerialNumber key');
}

// Test 6: Handle malformed output (no quotes)
function test_parseIOPlatformSerialNumber_malformed() {
  const output = 'IOPlatformSerialNumber = C02ABC123DEF';
  const result = parseIOPlatformSerialNumber(output);
  if (result !== '') {
    throw new Error(`Expected empty string for malformed output, got "${result}"`);
  }
  console.log('✓ Handle malformed IOPlatformSerialNumber output');
}

// Test 7: Trim whitespace from extracted values
function test_parseIOPlatformSerialNumber_whitespace() {
  const output = '    "IOPlatformSerialNumber" = "  C02ABC123DEF  "';
  const result = parseIOPlatformSerialNumber(output);
  if (result !== 'C02ABC123DEF') {
    throw new Error(`Expected "C02ABC123DEF" (trimmed), got "${result}"`);
  }
  console.log('✓ Trim whitespace from IOPlatformSerialNumber');
}

// Test 8: Parse system_profiler with different formats
function test_parseSystemProfilerSerial_variants() {
  const variants = [
    '      Serial Number (system): C02ABC123DEF',
    '      Serial Number: C02ABC123DEF',
    '      serial number: C02ABC123DEF'
  ];
  
  for (const output of variants) {
    const result = parseSystemProfilerSerial(output);
    if (result !== 'C02ABC123DEF') {
      throw new Error(`Expected "C02ABC123DEF" for variant "${output}", got "${result}"`);
    }
  }
  console.log('✓ Parse system_profiler Serial Number variants');
}

// Run all tests
function runTests() {
  console.log('\n=== macOS Hardware Binding - Parsing Tests ===\n');
  
  try {
    test_parseIOPlatformSerialNumber_valid();
    test_parseIOPlatformUUID_valid();
    test_parseSystemProfilerSerial_valid();
    test_parseIOPlatformSerialNumber_empty();
    test_parseIOPlatformSerialNumber_missing();
    test_parseIOPlatformSerialNumber_malformed();
    test_parseIOPlatformSerialNumber_whitespace();
    test_parseSystemProfilerSerial_variants();
    
    console.log('\n✓ All parsing tests passed\n');
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
