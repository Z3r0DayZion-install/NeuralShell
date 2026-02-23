/**
 * Installation Path Security Verification
 * 
 * **Validates: Requirements 1.7, 2.7**
 * 
 * This script verifies that NeuralShell is installed in a secure location
 * with proper ACL permissions. It prevents installation in world-writable
 * directories that could be exploited.
 * 
 * Security Checks:
 * - Installation path must be under a protected directory
 * - No world-writable permissions (mode & 0o002 === 0)
 * - No group-writable permissions (mode & 0o020 === 0)
 * 
 * Protected Directories:
 * - Windows: C:\Program Files, C:\Program Files (x86)
 * - Linux: /usr/local, /opt, /usr
 * - macOS: /Applications, /usr/local
 * 
 * Development Mode:
 * - Skips verification if NODE_ENV === 'development'
 * - Skips verification if installed in node_modules
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Protected installation directories by platform
const PROTECTED_DIRECTORIES = {
  win32: [
    'C:\\Program Files',
    'C:\\Program Files (x86)',
    'C:\\ProgramData'
  ],
  linux: [
    '/usr/local',
    '/opt',
    '/usr'
  ],
  darwin: [
    '/Applications',
    '/usr/local'
  ]
};

/**
 * Check if running in development mode
 */
function isDevelopmentMode() {
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // Check if installed in node_modules (dev dependency)
  const installPath = process.cwd();
  if (installPath.includes('node_modules')) {
    return true;
  }
  
  return false;
}

/**
 * Check if installation path is under a protected directory
 */
function isProtectedDirectory(installPath) {
  const platform = os.platform();
  const protectedDirs = PROTECTED_DIRECTORIES[platform] || [];
  
  // Normalize path for comparison
  const normalizedPath = path.normalize(installPath);
  
  for (const protectedDir of protectedDirs) {
    const normalizedProtected = path.normalize(protectedDir);
    
    // Check if install path starts with protected directory
    if (normalizedPath.startsWith(normalizedProtected)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check ACL permissions for world-writable or group-writable
 */
function checkAclPermissions(installPath) {
  try {
    const stats = fs.statSync(installPath);
    const mode = stats.mode;
    
    // Check for world-writable (mode & 0o002)
    const worldWritable = (mode & 0o002) !== 0;
    
    // Check for group-writable (mode & 0o020)
    const groupWritable = (mode & 0o020) !== 0;
    
    return {
      worldWritable,
      groupWritable,
      mode: mode.toString(8),
      isSecure: !worldWritable && !groupWritable
    };
  } catch (error) {
    console.error(`Failed to check ACL permissions: ${error.message}`);
    return {
      worldWritable: false,
      groupWritable: false,
      mode: 'unknown',
      isSecure: false,
      error: error.message
    };
  }
}

/**
 * Verify installation path security
 */
function verifyInstallation() {
  const installPath = process.cwd();
  const platform = os.platform();
  
  console.log('\n🔒 NeuralShell Installation Security Verification');
  console.log(`   Platform: ${platform}`);
  console.log(`   Installation path: ${installPath}`);
  
  // Skip verification in development mode
  if (isDevelopmentMode()) {
    console.log('   ⚠️  Development mode detected - skipping verification');
    console.log('   ✅ Verification skipped (development)\n');
    return true;
  }
  
  // Check if installation is under protected directory
  const isProtected = isProtectedDirectory(installPath);
  console.log(`   Protected directory: ${isProtected ? '✅' : '❌'}`);
  
  if (!isProtected) {
    console.error('\n❌ INSECURE INSTALLATION PATH');
    console.error(`   Installation path is not under a protected directory.`);
    console.error(`   Current path: ${installPath}`);
    console.error(`   Protected directories for ${platform}:`);
    const protectedDirs = PROTECTED_DIRECTORIES[platform] || [];
    protectedDirs.forEach(dir => console.error(`     - ${dir}`));
    console.error('\n   Installation aborted for security reasons.\n');
    return false;
  }
  
  // Check ACL permissions
  const aclCheck = checkAclPermissions(installPath);
  console.log(`   World-writable: ${aclCheck.worldWritable ? '❌' : '✅'}`);
  console.log(`   Group-writable: ${aclCheck.groupWritable ? '❌' : '✅'}`);
  console.log(`   File mode: ${aclCheck.mode}`);
  
  if (aclCheck.worldWritable) {
    console.error('\n❌ INSECURE ACL PERMISSIONS');
    console.error(`   Installation path is world-writable.`);
    console.error(`   Path: ${installPath}`);
    console.error(`   Mode: ${aclCheck.mode}`);
    console.error('\n   Installation aborted for security reasons.\n');
    return false;
  }
  
  if (aclCheck.groupWritable) {
    console.error('\n❌ INSECURE ACL PERMISSIONS');
    console.error(`   Installation path is group-writable.`);
    console.error(`   Path: ${installPath}`);
    console.error(`   Mode: ${aclCheck.mode}`);
    console.error('\n   Installation aborted for security reasons.\n');
    return false;
  }
  
  console.log('   ✅ Installation path security verified\n');
  return true;
}

// Run verification
if (require.main === module) {
  const isSecure = verifyInstallation();
  
  if (!isSecure) {
    process.exit(1);
  }
  
  process.exit(0);
}

module.exports = {
  verifyInstallation,
  isProtectedDirectory,
  checkAclPermissions,
  isDevelopmentMode,
  PROTECTED_DIRECTORIES
};
