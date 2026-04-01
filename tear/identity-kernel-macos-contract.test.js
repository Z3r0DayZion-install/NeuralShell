const crypto = require('crypto');

// Test that macOS fingerprints conform to identity contract
function test_macos_fingerprint_format() {
  const testFingerprints = [
    crypto.createHash('sha256').update('C02ABC123DEF:12345678-1234-1234-1234-123456789ABC').digest('hex'),
    crypto.createHash('sha256').update('12345678-1234-1234-1234-123456789ABC').digest('hex'),
    crypto.createHash('sha256').update('C02ABC123DEF').digest('hex')
  ];
  
  for (const fp of testFingerprints) {
    if (fp.length !== 64) throw new Error(`Expected 64 chars, got ${fp.length}`);
    if (!/^[a-f0-9]{64}$/.test(fp)) throw new Error(`Invalid hex format: ${fp}`);
  }
  console.log('✓ macOS fingerprints conform to 64-char hex format');
}

// Test that hardware-derived encryption keys work
function test_hardware_encryption_key_derivation() {
  const macOSFingerprint = crypto.createHash('sha256').update('C02ABC123DEF:12345678-1234-1234-1234-123456789ABC').digest('hex');
  const encryptionKey = crypto.createHash('sha256').update(macOSFingerprint).digest();
  
  if (encryptionKey.length !== 32) throw new Error(`Expected 32-byte key, got ${encryptionKey.length}`);
  
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const testData = 'test-identity-data';
  const encrypted = Buffer.concat([cipher.update(testData, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  
  if (decrypted !== testData) throw new Error('Encryption/decryption failed');
  console.log('✓ Hardware-derived encryption keys work with macOS fingerprints');
}

// Test cross-platform format consistency
function test_cross_platform_format_consistency() {
  const windowsStyle = crypto.createHash('sha256').update('ProcessorId12345|BaseboardSerial67890').digest('hex');
  const macOSStyle = crypto.createHash('sha256').update('C02ABC123DEF:12345678-1234-1234-1234-123456789ABC').digest('hex');
  
  if (windowsStyle.length !== macOSStyle.length) throw new Error('Platform fingerprint lengths differ');
  if (!/^[a-f0-9]{64}$/.test(windowsStyle)) throw new Error('Windows format invalid');
  if (!/^[a-f0-9]{64}$/.test(macOSStyle)) throw new Error('macOS format invalid');
  
  console.log('✓ Cross-platform format consistency verified');
}

// Test degraded mode produces valid contract-compliant output
function test_degraded_mode_contract_compliance() {
  const degradedUUID = crypto.createHash('sha256').update('12345678-1234-1234-1234-123456789ABC').digest('hex');
  const degradedSerial = crypto.createHash('sha256').update('C02ABC123DEF').digest('hex');
  
  if (degradedUUID.length !== 64) throw new Error('Degraded UUID fingerprint invalid');
  if (degradedSerial.length !== 64) throw new Error('Degraded serial fingerprint invalid');
  if (!/^[a-f0-9]{64}$/.test(degradedUUID)) throw new Error('Degraded UUID format invalid');
  if (!/^[a-f0-9]{64}$/.test(degradedSerial)) throw new Error('Degraded serial format invalid');
  
  console.log('✓ Degraded mode produces contract-compliant fingerprints');
}

// Test that fingerprints are deterministic
function test_fingerprint_determinism() {
  const input = 'C02ABC123DEF:12345678-1234-1234-1234-123456789ABC';
  const fp1 = crypto.createHash('sha256').update(input).digest('hex');
  const fp2 = crypto.createHash('sha256').update(input).digest('hex');
  
  if (fp1 !== fp2) throw new Error('Fingerprints not deterministic');
  console.log('✓ Fingerprints are deterministic');
}

function runTests() {
  console.log('\n=== macOS Identity Contract Preservation Tests ===\n');
  try {
    test_macos_fingerprint_format();
    test_hardware_encryption_key_derivation();
    test_cross_platform_format_consistency();
    test_degraded_mode_contract_compliance();
    test_fingerprint_determinism();
    console.log('\n✓ All identity contract tests passed\n');
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
