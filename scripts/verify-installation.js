/**
 * Installation Path Security Verification
 *
 * Goals:
 * - Prevent installs into broadly writable locations (supply-chain / local privilege attacks).
 * - Allow normal developer workflows (git checkouts in user profiles) as long as ACLs are safe.
 * - Work in ESM mode (repo uses "type": "module").
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import childProcess from 'node:child_process';
import { pathToFileURL } from 'node:url';

const PROTECTED_DIRECTORIES = {
  win32: ['C:\\Program Files', 'C:\\Program Files (x86)', 'C:\\ProgramData'],
  linux: ['/usr/local', '/opt', '/usr'],
  darwin: ['/Applications', '/usr/local']
};

function isDevelopmentMode() {
  if (process.env.NODE_ENV === 'development') return true;

  const installPath = process.cwd();
  if (installPath.includes('node_modules')) return true;

  // Git checkouts are treated as dev, but we still enforce ACL safety.
  try {
    if (fs.existsSync(path.join(installPath, '.git'))) return true;
  } catch {
    // ignore
  }

  return false;
}

function isContainerEnvironment() {
  if (process.env.NEURALSHELL_CONTAINER === '1') return true;

  if (os.platform() !== 'linux') return false;

  try {
    if (fs.existsSync('/.dockerenv')) return true;
  } catch {
    // ignore
  }

  try {
    const cg = fs.readFileSync('/proc/1/cgroup', 'utf8');
    if (/docker|kubepods|containerd|podman/i.test(cg)) return true;
  } catch {
    // ignore
  }

  return false;
}

function isProtectedDirectory(installPath) {
  const platform = os.platform();
  const protectedDirs = PROTECTED_DIRECTORIES[platform] || [];

  const normalizedPath = path.normalize(installPath);
  for (const protectedDir of protectedDirs) {
    const normalizedProtected = path.normalize(protectedDir);
    if (normalizedPath.startsWith(normalizedProtected)) return true;
  }
  return false;
}

function checkAclPermissions(installPath) {
  try {
    if (os.platform() === 'win32') {
      const systemRoot = process.env.SystemRoot || process.env.WINDIR || 'C:\\Windows';
      const icaclsExe = path.join(systemRoot, 'System32', 'icacls.exe');

      const out = childProcess.execFileSync(icaclsExe, [installPath], {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true
      });

      const writeTokens = new Set([
        'F', // Full
        'M', // Modify
        'W', // Write
        // granular write-ish rights
        'WD',
        'AD',
        'WEA',
        'WA',
        // delete / ownership changes are also unsafe for broad principals
        'D',
        'DC',
        'DE',
        'WO'
      ]);

      function extractAceTokens(rights) {
        const tokens = [];
        const re = /\(([^)]*)\)/g;
        let m;
        while ((m = re.exec(rights)) !== null) {
          for (const raw of m[1].split(',')) {
            const t = raw.trim();
            if (t) tokens.push(t);
          }
        }
        return tokens;
      }

      function hasWrite(rights) {
        const tokens = extractAceTokens(rights);
        return tokens.some((t) => writeTokens.has(t));
      }

      const groupPrincipals = new Set(['builtin\\users', 'users']);
      const worldPrincipals = new Set([
        'everyone',
        'nt authority\\authenticated users',
        'authenticated users'
      ]);

      let groupWritable = false;
      let worldWritable = false;

      for (const line of String(out || '').split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const idx = trimmed.indexOf(':');
        if (idx <= 0) continue;

        const principal = trimmed.slice(0, idx).trim().toLowerCase();
        const rights = trimmed.slice(idx + 1);
        if (!hasWrite(rights)) continue;

        if (groupPrincipals.has(principal)) groupWritable = true;
        if (worldPrincipals.has(principal)) worldWritable = true;
      }

      return {
        worldWritable,
        groupWritable,
        mode: 'windows-acl',
        isSecure: !worldWritable && !groupWritable
      };
    }

    const stats = fs.statSync(installPath);
    const mode = stats.mode;

    const worldWritable = (mode & 0o002) !== 0;
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

function verifyInstallation() {
  const installPath = process.cwd();
  const platform = os.platform();
  const inContainer = isContainerEnvironment();
  const protectedPath = isProtectedDirectory(installPath);

  console.log('\n🔒 NeuralShell Installation Security Verification');
  console.log(`   Platform: ${platform}`);
  console.log(`   Installation path: ${installPath}`);
  if (platform === 'linux') {
    console.log(`   Container environment: ${inContainer ? '✅' : '❌'}`);
  }
  console.log(`   Protected directory: ${protectedPath ? '✅' : '❌'}`);

  const devMode = isDevelopmentMode();
  if (devMode) {
    console.log('   ⚠️  Development mode detected (NODE_ENV=development, node_modules, or .git)');
  }

  const aclCheck = checkAclPermissions(installPath);
  console.log(`   World-writable: ${aclCheck.worldWritable ? '❌' : '✅'}`);
  console.log(`   Group-writable: ${aclCheck.groupWritable ? '❌' : '✅'}`);
  console.log(`   File mode: ${aclCheck.mode}`);

  if (!aclCheck.isSecure) {
    console.error('\n❌ INSECURE INSTALLATION');
    console.error('   Installation path is writable by broad principals (world/group).');
    console.error(`   Path: ${installPath}`);
    console.error(`   Mode: ${aclCheck.mode}`);
    console.error('\n   Installation aborted for security reasons.\n');
    return false;
  }

  if (!protectedPath && !inContainer) {
    console.warn('\n⚠️  Non-protected install path.');
    console.warn('   This is allowed because ACLs are not broadly writable, but for distribution installs');
    console.warn('   consider using Program Files / ProgramData (Windows) or /opt (Linux).');
  }

  if (devMode) {
    console.log('   ✅ ACL security verified (development)\n');
    return true;
  }

  console.log('   ✅ Installation path security verified\n');
  return true;
}

function isMainModule() {
  try {
    if (!process.argv[1]) return false;
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  process.exit(verifyInstallation() ? 0 : 1);
}

export {
  verifyInstallation,
  isProtectedDirectory,
  checkAclPermissions,
  isDevelopmentMode,
  isContainerEnvironment,
  PROTECTED_DIRECTORIES
};
