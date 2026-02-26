import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function which(cmd) {
  if (process.platform === 'win32') {
    const r = spawnSync('where.exe', [cmd], { encoding: 'utf8', windowsHide: true, shell: true });
    if ((r.status ?? 1) === 0) {
      const first = String(r.stdout || '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)[0];
      return first || null;
    }
    return null;
  }

  const r = spawnSync('sh', ['-lc', `command -v ${cmd}`], { encoding: 'utf8' });
  if ((r.status ?? 1) === 0) return String(r.stdout || '').trim() || null;
  return null;
}

function printHelpAndExit() {
  console.error('\nRust build toolchain missing.');
  console.error('On Windows you need ONE of:');
  console.error('- MSVC Build Tools (Visual Studio Build Tools)');
  console.error('- MinGW-w64 (gcc + dlltool)');
  console.error('\nIf you installed VS Build Tools, this script can auto-load it via VsDevCmd.bat.');
  console.error('Try: `winget install --id Microsoft.VisualStudio.2022.BuildTools`');
  process.exit(1);
}

function fileExists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function findVsWhere() {
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\Installer\\vswhere.exe',
    'C:\\Program Files\\Microsoft Visual Studio\\Installer\\vswhere.exe'
  ];
  for (const c of candidates) {
    if (fileExists(c)) return c;
  }
  return null;
}

function findVsDevCmd() {
  if (process.env.VSDEVCMD_PATH && fileExists(process.env.VSDEVCMD_PATH)) {
    return process.env.VSDEVCMD_PATH;
  }

  const common =
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\Common7\\Tools\\VsDevCmd.bat';
  if (fileExists(common)) return common;

  const vswhere = findVsWhere();
  if (!vswhere) return null;

  try {
    const r = spawnSync(
      vswhere,
      [
        '-latest',
        '-products',
        '*',
        '-requires',
        'Microsoft.VisualStudio.Component.VC.Tools.x86.x64',
        '-property',
        'installationPath'
      ],
      { encoding: 'utf8', windowsHide: true }
    );
    if ((r.status ?? 1) !== 0) return null;
    const installPath = String(r.stdout || '').trim();
    if (!installPath) return null;
    const candidate = path.join(installPath, 'Common7', 'Tools', 'VsDevCmd.bat');
    if (fileExists(candidate)) return candidate;
  } catch {
    // ignore
  }

  return null;
}

function quoteCmd(arg) {
  const s = String(arg);
  if (!/[\s"&()^<>|]/.test(s)) return s;
  return `"${s.replace(/"/g, '""')}"`;
}

function runCargoDirect(toolchainPrefix, cargoArgs) {
  const res = spawnSync('cargo', [...toolchainPrefix, ...cargoArgs], {
    stdio: 'inherit',
    windowsHide: true,
    shell: process.platform === 'win32'
  });
  process.exit(res.status ?? 1);
}

function runCargoViaVsDevCmd(vsDevCmdPath, toolchainPrefix, cargoArgs) {
  const helper = path.join(process.cwd(), "scripts", "_vsdevcmd_cargo.cmd");
  const env = { ...process.env, VSDEVCMD_PATH: String(vsDevCmdPath) };
  const res = spawnSync("cmd.exe", ["/d", "/s", "/c", helper, ...toolchainPrefix, ...cargoArgs], {
    stdio: "inherit",
    windowsHide: true,
    env
  });
  process.exit(res.status ?? 1);
}

const cargoArgs = process.argv.slice(2);
if (cargoArgs.length === 0) {
  console.error('Usage: node scripts/run-cargo.mjs <cargo args...>');
  process.exit(2);
}

const override = process.env.NEURALSHELL_CARGO_TOOLCHAIN;
let toolchainPrefix = [];

if (override && override.trim()) {
  toolchainPrefix = [`+${override.trim()}`];
}

if (process.platform !== 'win32') {
  runCargoDirect(toolchainPrefix, cargoArgs);
}

const hasCl = !!which('cl.exe');
const hasGcc = !!which('gcc.exe');

if (!override || !override.trim()) {
  if (hasCl) toolchainPrefix = ['+stable-x86_64-pc-windows-msvc'];
  else if (hasGcc) toolchainPrefix = ['+stable-x86_64-pc-windows-gnu'];
}

const wantsMsvc = toolchainPrefix.some((t) => /msvc/i.test(t));
const wantsGnu = toolchainPrefix.some((t) => /windows-gnu/i.test(t));

if (wantsGnu && !hasGcc) {
  printHelpAndExit();
}

if (hasCl) {
  runCargoDirect(toolchainPrefix, cargoArgs);
}

if (wantsMsvc || (!wantsGnu && !hasGcc)) {
  const vsDevCmd = findVsDevCmd();
  if (!vsDevCmd) {
    printHelpAndExit();
  }
  runCargoViaVsDevCmd(vsDevCmd, ['+stable-x86_64-pc-windows-msvc'], cargoArgs);
}

if (hasGcc) {
  runCargoDirect(toolchainPrefix, cargoArgs);
}

printHelpAndExit();
