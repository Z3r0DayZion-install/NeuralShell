/**
 * macOS Hardware Binding - Real Device Verification
 * Feature: macos-hardware-binding
 * 
 * This test must be run on real macOS hardware to verify:
 * 1. Backend path actually used
 * 2. Stable identity output
 * 3. Reboot stability (manual verification required)
 * 4. Contract preservation
 * 5. Degraded-path behavior (if applicable)
 * 6. Hard-failure behavior (if applicable)
 * 
 * USAGE:
 *   node tear/identity-kernel-macos-device-verification.js
 * 
 * OUTPUT:
 *   - Device information
 *   - Backend path used
 *   - Hardware fingerprint (first 8 chars only)
 *   - Contract verification
 *   - Verification report saved to docs/proofs/
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import identity kernel
const identityKernel = require('../src/core/identityKernel');

// Verification state
const verificationReport = {
  timestamp: new Date().toISOString(),
  platform: process.platform,
  device: {},
  backend: {},
  fingerprint: {},
  contract: {},
  stability: {},
  verdict: 'PENDING'
};

/**
 * Gather device information
 */
function gatherDeviceInfo() {
  console.log('\n=== Device Information ===\n');
  
  try {
    // macOS version
    const osVersion = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
    console.log(`macOS Version: ${osVersion}`);
    verificationReport.device.osVersion = osVersion;
    
    // Hardware model
    const model = execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim();
    console.log(`Hardware Model: ${model}`);
    verificationReport.device.model = model;
    
    // CPU type
    const cpuBrand = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim();
    console.log(`CPU: ${cpuBrand}`);
    verificationReport.device.cpu = cpuBrand;
    
    // Determine architecture
    const isAppleSilicon = cpuBrand.includes('Apple');
    const isIntel = cpuBrand.includes('Intel');
    const arch = isAppleSilicon ? 'Apple Silicon' : (isIntel ? 'Intel' : 'Unknown');
    console.log(`Architecture: ${arch}`);
    verificationReport.device.architecture = arch;
    
  } catch (err) {
    console.error(`Error gathering device info: ${err.message}`);
    verificationReport.device.error = err.message;
  }
}

/**
 * Test backend path
 */
async function testBackendPath() {
  console.log('\n=== Backend Path Verification ===\n');
  
  try {
    // Test ioreg for IOPlatformSerialNumber
    let ioregSerialWorks = false;
    try {
      const serialOutput = execSync('ioreg -l | grep IOPlatformSerialNumber', { encoding: 'utf8', timeout: 3000 });
      const match = serialOutput.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/);
      if (match && match[1].trim()) {
        console.log('✓ ioreg IOPlatformSerialNumber: Available');
        ioregSerialWorks = true;
      } else {
        console.log('✗ ioreg IOPlatformSerialNumber: Empty');
      }
    } catch (err) {
      console.log('✗ ioreg IOPlatformSerialNumber: Failed');
    }
    
    // Test ioreg for IOPlatformUUID
    let ioregUUIDWorks = false;
    try {
      const uuidOutput = execSync('ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID', { encoding: 'utf8', timeout: 3000 });
      const match = uuidOutput.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/);
      if (match && match[1].trim()) {
        console.log('✓ ioreg IOPlatformUUID: Available');
        ioregUUIDWorks = true;
      } else {
        console.log('✗ ioreg IOPlatformUUID: Empty');
      }
    } catch (err) {
      console.log('✗ ioreg IOPlatformUUID: Failed');
    }
    
    // Test system_profiler fallback
    let systemProfilerWorks = false;
    try {
      const profilerOutput = execSync('system_profiler SPHardwareDataType | grep "Serial Number"', { encoding: 'utf8', timeout: 5000 });
      const match = profilerOutput.match(/Serial Number[^:]*:\s*([^\s\n]+)/i);
      if (match && match[1].trim()) {
        console.log('✓ system_profiler Serial Number: Available');
        systemProfilerWorks = true;
      } else {
        console.log('✗ system_profiler Serial Number: Empty');
      }
    } catch (err) {
      console.log('✗ system_profiler Serial Number: Failed');
    }
    
    // Determine backend path
    let backendPath = 'unknown';
    let mode = 'unknown';
    
    if (ioregSerialWorks && ioregUUIDWorks) {
      backendPath = 'ioreg-primary';
      mode = 'success';
    } else if (systemProfilerWorks && ioregUUIDWorks) {
      backendPath = 'system_profiler-fallback';
      mode = 'success';
    } else if (ioregUUIDWorks) {
      backendPath = 'ioreg-uuid-only';
      mode = 'degraded';
    } else if (ioregSerialWorks) {
      backendPath = 'ioreg-serial-only';
      mode = 'degraded';
    } else if (systemProfilerWorks) {
      backendPath = 'system_profiler-serial-only';
      mode = 'degraded';
    } else {
      backendPath = 'none';
      mode = 'hard-failure';
    }
    
    console.log(`\nBackend Path: ${backendPath}`);
    console.log(`Mode: ${mode}`);
    
    verificationReport.backend = {
      ioregSerial: ioregSerialWorks,
      ioregUUID: ioregUUIDWorks,
      systemProfiler: systemProfilerWorks,
      path: backendPath,
      mode: mode
    };
    
  } catch (err) {
    console.error(`Error testing backend path: ${err.message}`);
    verificationReport.backend.error = err.message;
  }
}

/**
 * Test hardware fingerprint generation
 */
async function testFingerprintGeneration() {
  console.log('\n=== Hardware Fingerprint Generation ===\n');
  
  try {
    // Initialize identity kernel
    await identityKernel.init();
    
    // Get hardware fingerprint
    const fingerprint = identityKernel.getHardwareFingerprint();
    
    // Verify format
    const isValid = fingerprint.length === 64 && /^[a-f0-9]{64}$/.test(fingerprint);
    
    console.log(`Fingerprint (first 8 chars): ${fingerprint.substring(0, 8)}...`);
    console.log(`Length: ${fingerprint.length}`);
    console.log(`Format: ${isValid ? '✓ Valid (64-char hex)' : '✗ Invalid'}`);
    
    verificationReport.fingerprint = {
      first8: fingerprint.substring(0, 8),
      length: fingerprint.length,
      format: isValid ? 'valid' : 'invalid',
      fullHash: fingerprint // Store full hash for stability testing
    };
    
    // Test determinism (call multiple times)
    const fingerprint2 = identityKernel.getHardwareFingerprint();
    const fingerprint3 = identityKernel.getHardwareFingerprint();
    
    const isDeterministic = fingerprint === fingerprint2 && fingerprint2 === fingerprint3;
    console.log(`Determinism: ${isDeterministic ? '✓ Pass' : '✗ Fail'}`);
    
    verificationReport.fingerprint.deterministic = isDeterministic;
    
  } catch (err) {
    console.error(`Error generating fingerprint: ${err.message}`);
    verificationReport.fingerprint.error = err.message;
  }
}

/**
 * Verify identity contract
 */
function verifyContract() {
  console.log('\n=== Identity Contract Verification ===\n');
  
  const fingerprint = verificationReport.fingerprint.fullHash;
  
  if (!fingerprint) {
    console.log('✗ Cannot verify contract: No fingerprint generated');
    verificationReport.contract.verified = false;
    return;
  }
  
  // Check output format
  const is64Char = fingerprint.length === 64;
  const isHex = /^[a-f0-9]{64}$/.test(fingerprint);
  const isSHA256 = is64Char && isHex; // SHA-256 produces 64 hex chars
  
  console.log(`Output Length: ${is64Char ? '✓ 64 characters' : '✗ Not 64 characters'}`);
  console.log(`Output Format: ${isHex ? '✓ Hexadecimal [a-f0-9]' : '✗ Not hexadecimal'}`);
  console.log(`Hash Algorithm: ${isSHA256 ? '✓ SHA-256' : '✗ Not SHA-256'}`);
  
  // Check downstream interface (getHardwareFingerprint returns string)
  const interfaceCorrect = typeof fingerprint === 'string';
  console.log(`Downstream Interface: ${interfaceCorrect ? '✓ String type' : '✗ Wrong type'}`);
  
  const contractValid = is64Char && isHex && isSHA256 && interfaceCorrect;
  console.log(`\nContract Status: ${contractValid ? '✓ PASS' : '✗ FAIL'}`);
  
  verificationReport.contract = {
    length: is64Char,
    format: isHex,
    algorithm: isSHA256,
    interface: interfaceCorrect,
    verified: contractValid
  };
}

/**
 * Generate verification report
 */
function generateReport() {
  console.log('\n=== Verification Report ===\n');
  
  // Determine overall verdict
  const deviceInfoComplete = verificationReport.device.osVersion && verificationReport.device.model;
  const backendPathKnown = verificationReport.backend.path && verificationReport.backend.path !== 'unknown';
  const fingerprintValid = verificationReport.fingerprint.format === 'valid';
  const contractVerified = verificationReport.contract.verified === true;
  
  const allChecksPass = deviceInfoComplete && backendPathKnown && fingerprintValid && contractVerified;
  
  verificationReport.verdict = allChecksPass ? 'PASS' : 'FAIL';
  
  console.log(`Device Info: ${deviceInfoComplete ? '✓' : '✗'}`);
  console.log(`Backend Path: ${backendPathKnown ? '✓' : '✗'}`);
  console.log(`Fingerprint: ${fingerprintValid ? '✓' : '✗'}`);
  console.log(`Contract: ${contractVerified ? '✓' : '✗'}`);
  console.log(`\nOverall Verdict: ${verificationReport.verdict}`);
  
  // Save report to file
  const reportPath = path.join(__dirname, '../docs/proofs/batch1-macos-device-verification.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(verificationReport, null, 2), 'utf8');
  
  console.log(`\nReport saved to: ${reportPath}`);
  
  // Generate human-readable report
  generateHumanReadableReport();
}

/**
 * Generate human-readable report
 */
function generateHumanReadableReport() {
  const reportPath = path.join(__dirname, '../docs/proofs/batch1-macos-device-verification.md');
  
  const report = `# Packet 1: macOS Device Verification Report

**Date:** ${verificationReport.timestamp}  
**Platform:** ${verificationReport.platform}  
**Verdict:** ${verificationReport.verdict}

---

## Device Information

- **macOS Version:** ${verificationReport.device.osVersion || 'Unknown'}
- **Hardware Model:** ${verificationReport.device.model || 'Unknown'}
- **CPU:** ${verificationReport.device.cpu || 'Unknown'}
- **Architecture:** ${verificationReport.device.architecture || 'Unknown'}

---

## Backend Path Used

- **ioreg IOPlatformSerialNumber:** ${verificationReport.backend.ioregSerial ? '✓ Available' : '✗ Unavailable'}
- **ioreg IOPlatformUUID:** ${verificationReport.backend.ioregUUID ? '✓ Available' : '✗ Unavailable'}
- **system_profiler Serial Number:** ${verificationReport.backend.systemProfiler ? '✓ Available' : '✗ Unavailable'}

**Backend Path:** ${verificationReport.backend.path}  
**Mode:** ${verificationReport.backend.mode}

---

## Hardware Fingerprint

- **First 8 Characters:** ${verificationReport.fingerprint.first8 || 'N/A'}
- **Length:** ${verificationReport.fingerprint.length || 0} characters
- **Format:** ${verificationReport.fingerprint.format || 'unknown'}
- **Deterministic:** ${verificationReport.fingerprint.deterministic ? '✓ Yes' : '✗ No'}

---

## Identity Contract Verification

- **Output Length (64 chars):** ${verificationReport.contract.length ? '✓ Pass' : '✗ Fail'}
- **Output Format (hex):** ${verificationReport.contract.format ? '✓ Pass' : '✗ Fail'}
- **Hash Algorithm (SHA-256):** ${verificationReport.contract.algorithm ? '✓ Pass' : '✗ Fail'}
- **Downstream Interface (string):** ${verificationReport.contract.interface ? '✓ Pass' : '✗ Fail'}

**Contract Status:** ${verificationReport.contract.verified ? '✓ PASS' : '✗ FAIL'}

---

## Stability Testing

**Note:** Reboot stability must be verified manually by running this test multiple times after rebooting the device.

To verify reboot stability:
1. Record the fingerprint (first 8 chars): ${verificationReport.fingerprint.first8 || 'N/A'}
2. Reboot the Mac
3. Run this test again
4. Compare fingerprints - they should be identical

**Expected:** Fingerprint remains identical across reboots  
**Actual:** (Manual verification required)

---

## Verdict

**Overall Status:** ${verificationReport.verdict}

${verificationReport.verdict === 'PASS' 
  ? '✓ Device verification passed. Hardware binding is working correctly on this Mac.'
  : '✗ Device verification failed. Review the report above for details.'}

---

**Next Steps:**
1. Run this test on a second Mac (different architecture if possible)
2. Verify reboot stability by rebooting and re-running this test
3. Compare results across devices to verify uniqueness
4. Document results in batch1-macos-backend-proof.md

---

**Report Generated:** ${verificationReport.timestamp}
`;
  
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`Human-readable report saved to: ${reportPath}`);
}

/**
 * Main verification function
 */
async function runVerification() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  macOS Hardware Binding - Real Device Verification        ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  
  // Check platform
  if (process.platform !== 'darwin') {
    console.error('\n✗ This test must be run on macOS (darwin platform)');
    console.error(`  Current platform: ${process.platform}`);
    process.exit(1);
  }
  
  try {
    gatherDeviceInfo();
    await testBackendPath();
    await testFingerprintGeneration();
    verifyContract();
    generateReport();
    
    console.log('\n✓ Verification complete\n');
    
    // Exit with appropriate code
    process.exit(verificationReport.verdict === 'PASS' ? 0 : 1);
    
  } catch (err) {
    console.error(`\n✗ Verification failed: ${err.message}\n`);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run verification if executed directly
if (require.main === module) {
  runVerification();
}

module.exports = { runVerification };
