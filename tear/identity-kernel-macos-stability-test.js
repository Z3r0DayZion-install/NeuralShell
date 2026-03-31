/**
 * macOS Hardware Binding - Reboot Stability Test
 * Feature: macos-hardware-binding
 * 
 * This test tracks fingerprint stability across multiple runs.
 * Run this test multiple times (ideally after reboots) to verify stability.
 * 
 * USAGE:
 *   node tear/identity-kernel-macos-stability-test.js
 * 
 * The test will:
 * 1. Generate current fingerprint
 * 2. Compare with previous runs (if any)
 * 3. Track stability across runs
 * 4. Report stability percentage
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Import identity kernel
const identityKernel = require('../src/core/identityKernel');

const STABILITY_LOG_PATH = path.join(__dirname, '../docs/proofs/batch1-macos-stability-log.json');

/**
 * Load stability log
 */
function loadStabilityLog() {
  if (!fs.existsSync(STABILITY_LOG_PATH)) {
    return {
      device: {},
      runs: [],
      stability: {
        totalRuns: 0,
        stableRuns: 0,
        percentage: 0
      }
    };
  }
  
  try {
    const content = fs.readFileSync(STABILITY_LOG_PATH, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error loading stability log: ${err.message}`);
    return {
      device: {},
      runs: [],
      stability: {
        totalRuns: 0,
        stableRuns: 0,
        percentage: 0
      }
    };
  }
}

/**
 * Save stability log
 */
function saveStabilityLog(log) {
  fs.mkdirSync(path.dirname(STABILITY_LOG_PATH), { recursive: true });
  fs.writeFileSync(STABILITY_LOG_PATH, JSON.stringify(log, null, 2), 'utf8');
}

/**
 * Get device info
 */
function getDeviceInfo() {
  const { execSync } = require('child_process');
  
  try {
    return {
      model: execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim(),
      osVersion: execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim(),
      cpu: execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' }).trim()
    };
  } catch (err) {
    return {
      model: 'Unknown',
      osVersion: 'Unknown',
      cpu: 'Unknown'
    };
  }
}

/**
 * Run stability test
 */
async function runStabilityTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  macOS Hardware Binding - Reboot Stability Test           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  
  // Check platform
  if (process.platform !== 'darwin') {
    console.error('✗ This test must be run on macOS (darwin platform)');
    console.error(`  Current platform: ${process.platform}\n`);
    process.exit(1);
  }
  
  // Load stability log
  const log = loadStabilityLog();
  
  // Get device info
  const deviceInfo = getDeviceInfo();
  
  // Initialize device info if first run
  if (log.runs.length === 0) {
    log.device = deviceInfo;
    console.log('First run detected. Initializing stability log...\n');
  }
  
  // Display device info
  console.log('Device Information:');
  console.log(`  Model: ${deviceInfo.model}`);
  console.log(`  macOS: ${deviceInfo.osVersion}`);
  console.log(`  CPU: ${deviceInfo.cpu}\n`);
  
  // Initialize identity kernel and get fingerprint
  await identityKernel.init();
  const fingerprint = identityKernel.getHardwareFingerprint();
  
  // Record this run
  const run = {
    timestamp: new Date().toISOString(),
    fingerprint: fingerprint,
    first8: fingerprint.substring(0, 8),
    deviceInfo: deviceInfo
  };
  
  // Check stability
  let isStable = true;
  let baselineFingerprint = null;
  
  if (log.runs.length > 0) {
    baselineFingerprint = log.runs[0].fingerprint;
    isStable = fingerprint === baselineFingerprint;
  } else {
    baselineFingerprint = fingerprint;
  }
  
  run.stable = isStable;
  
  // Add run to log
  log.runs.push(run);
  
  // Update stability stats
  log.stability.totalRuns = log.runs.length;
  log.stability.stableRuns = log.runs.filter(r => r.stable).length;
  log.stability.percentage = log.stability.totalRuns > 0 
    ? Math.round((log.stability.stableRuns / log.stability.totalRuns) * 100)
    : 0;
  
  // Save log
  saveStabilityLog(log);
  
  // Display results
  console.log('Current Run:');
  console.log(`  Fingerprint (first 8): ${run.first8}...`);
  console.log(`  Timestamp: ${run.timestamp}`);
  console.log(`  Stable: ${isStable ? '✓ Yes' : '✗ No'}\n`);
  
  if (log.runs.length > 1) {
    console.log('Baseline (Run 1):');
    console.log(`  Fingerprint (first 8): ${log.runs[0].first8}...\n`);
  }
  
  console.log('Stability Summary:');
  console.log(`  Total Runs: ${log.stability.totalRuns}`);
  console.log(`  Stable Runs: ${log.stability.stableRuns}`);
  console.log(`  Stability: ${log.stability.percentage}%\n`);
  
  if (log.stability.percentage === 100) {
    console.log('✓ Perfect stability! Fingerprint is identical across all runs.\n');
  } else if (log.stability.percentage >= 90) {
    console.log('⚠ High stability, but some variation detected.\n');
  } else {
    console.log('✗ Low stability. Fingerprint is changing between runs.\n');
  }
  
  // Recommendations
  if (log.runs.length < 10) {
    console.log('Recommendation:');
    console.log(`  Run this test ${10 - log.runs.length} more times (ideally after reboots)`);
    console.log('  to reach the target of 10 stability checks.\n');
  } else {
    console.log('✓ Target of 10 runs reached.\n');
  }
  
  console.log(`Stability log saved to: ${STABILITY_LOG_PATH}\n`);
  
  // Exit with appropriate code
  process.exit(isStable ? 0 : 1);
}

// Run test if executed directly
if (require.main === module) {
  runStabilityTest().catch(err => {
    console.error(`\n✗ Test failed: ${err.message}\n`);
    console.error(err.stack);
    process.exit(1);
  });
}

module.exports = { runStabilityTest };
