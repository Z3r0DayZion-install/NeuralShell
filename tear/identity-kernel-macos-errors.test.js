const crypto = require('crypto');

async function simulateMacOSHardwareId(mockKernel) {
  let platformSerial = '';
  let hardwareUUID = '';
  try {
    const serialOutput = await mockKernel.request('CAP_PROC', 'execute', { command: 'ioreg', args: ['-l'] });
    const match = serialOutput.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
    platformSerial = match ? match[1].trim() : '';
  } catch (err) {
    // Expected in fallback paths: continue probing other sources.
  }
  try {
    const uuidOutput = await mockKernel.request('CAP_PROC', 'execute', { command: 'ioreg', args: ['-rd1', '-c', 'IOPlatformExpertDevice'] });
    const match = uuidOutput.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
    hardwareUUID = match ? match[1].trim() : '';
  } catch (err) {
    // Expected in fallback paths: continue probing other sources.
  }
  if (!platformSerial) {
    try {
      const profilerOutput = await mockKernel.request('CAP_PROC', 'execute', { command: 'system_profiler', args: ['SPHardwareDataType'] });
      const match = profilerOutput.match(/Serial Number[^:]*:\s*([^\s\n]+)/i);
      platformSerial = match ? match[1].trim() : '';
    } catch (err) {
      // Expected in hard-failure scenarios.
    }
  }
  let compositeIdentifier = '';
  let mode = 'success';
  if (platformSerial && hardwareUUID) {
    compositeIdentifier = `${platformSerial}:${hardwareUUID}`;
    mode = 'success';
  } else if (hardwareUUID) {
    compositeIdentifier = hardwareUUID;
    mode = 'degraded';
  } else if (platformSerial) {
    compositeIdentifier = platformSerial;
    mode = 'degraded';
  } else {
    throw new Error('Hardware binding failed on macOS: No identifiers available');
  }
  const fingerprint = crypto.createHash('sha256').update(compositeIdentifier).digest('hex');
  return { fingerprint, mode };
}

async function test_command_failure_fallback() {
  const mockKernel = { request: async (cap, method, payload) => {
    if (payload.command === 'ioreg' && payload.args[0] === '-l') throw new Error('Command not found');
    if (payload.command === 'ioreg' && payload.args[0] === '-rd1') return '    "IOPlatformUUID" = "12345678-1234-1234-1234-123456789ABC"';
    if (payload.command === 'system_profiler') return '      Serial Number (system): C02ABC123DEF';
    throw new Error('Unexpected command');
  }};
  const result = await simulateMacOSHardwareId(mockKernel);
  if (result.mode !== 'success') throw new Error(`Expected success mode, got "${result.mode}"`);
  if (result.fingerprint.length !== 64) throw new Error('Expected 64-char fingerprint');
  console.log('✓ Command failure triggers fallback chain');
}

async function test_degraded_mode_uuid_only() {
  const mockKernel = { request: async (cap, method, payload) => {
    if (payload.command === 'ioreg' && payload.args[0] === '-l') return '';
    if (payload.command === 'ioreg' && payload.args[0] === '-rd1') return '    "IOPlatformUUID" = "12345678-1234-1234-1234-123456789ABC"';
    if (payload.command === 'system_profiler') return '';
    throw new Error('Unexpected command');
  }};
  const result = await simulateMacOSHardwareId(mockKernel);
  if (result.mode !== 'degraded') throw new Error(`Expected degraded mode, got "${result.mode}"`);
  if (result.fingerprint.length !== 64) throw new Error('Expected 64-char fingerprint');
  console.log('✓ Degraded mode when serial fails but UUID succeeds');
}

async function test_hard_failure_no_identifiers() {
  const mockKernel = { request: async (cap, method, payload) => { return ''; }};
  try {
    await simulateMacOSHardwareId(mockKernel);
    throw new Error('Expected hard failure error');
  } catch (err) {
    if (!err.message.includes('Hardware binding failed on macOS')) throw new Error(`Expected "Hardware binding failed on macOS", got "${err.message}"`);
    if (!err.message.includes('No identifiers available')) throw new Error(`Expected "No identifiers available", got "${err.message}"`);
  }
  console.log('✓ Hard failure when both identifier sources fail');
}

async function test_no_false_success() {
  const mockKernel = { request: async (cap, method, payload) => { return 'GARBAGE OUTPUT'; }};
  try {
    await simulateMacOSHardwareId(mockKernel);
    throw new Error('Expected hard failure');
  } catch (err) {
    if (!err.message.includes('Hardware binding failed on macOS')) throw new Error(`Expected hard failure, got "${err.message}"`);
  }
  console.log('✓ No false success on broken input');
}

async function runTests() {
  console.log('\n=== macOS Hardware Binding - Error Handling Tests ===\n');
  try {
    await test_command_failure_fallback();
    await test_degraded_mode_uuid_only();
    await test_hard_failure_no_identifiers();
    await test_no_false_success();
    console.log('\n✓ All error handling tests passed\n');
    return true;
  } catch (err) {
    console.error(`\n✗ Test failed: ${err.message}\n`);
    return false;
  }
}

if (require.main === module) {
  runTests().then(success => process.exit(success ? 0 : 1));
}

module.exports = { runTests };
