const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const skipVerify = process.argv.includes("--skip-verify");
const aggressiveTemp = process.argv.includes("--aggressive-temp");
const tempMaxAgeDaysArg = process.argv.find((arg) => arg.startsWith("--temp-max-age-days="));
const tempMaxAgeDays = tempMaxAgeDaysArg ? Number(tempMaxAgeDaysArg.split("=")[1]) : 2;
const verifyCommand = process.env.NEURALSHELL_MAINTENANCE_VERIFY_COMMAND || "npm run verify:all";

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

function safeLstat(targetPath) {
  try {
    return fs.lstatSync(targetPath);
  } catch {
    return null;
  }
}

function getPathSize(targetPath) {
  const stat = safeLstat(targetPath);
  if (!stat) {
    return 0;
  }
  if (stat.isSymbolicLink() || stat.isFile()) {
    return stat.size;
  }
  if (!stat.isDirectory()) {
    return 0;
  }

  let total = 0;
  let entries = [];
  try {
    entries = fs.readdirSync(targetPath, { withFileTypes: true });
  } catch {
    return 0;
  }

  for (const entry of entries) {
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      total += getPathSize(entryPath);
      continue;
    }
    if (entry.isFile() || entry.isSymbolicLink()) {
      total += getPathSize(entryPath);
    }
  }
  return total;
}

function removePath(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 1 });
    return true;
  } catch {
    return false;
  }
}

function getElectronBuilderCachePaths() {
  const home = os.homedir();
  const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");

  if (process.platform === "win32") {
    return [path.join(localAppData, "electron-builder", "Cache")];
  }
  if (process.platform === "darwin") {
    return [path.join(home, "Library", "Caches", "electron-builder")];
  }
  return [path.join(home, ".cache", "electron-builder")];
}

function cleanTargetedPaths(targets) {
  const results = [];
  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }
    const sizeBefore = getPathSize(target);
    const removed = removePath(target);
    results.push({
      path: target,
      removed,
      bytes: removed ? sizeBefore : 0
    });
  }
  return results;
}

function cleanTempEntries() {
  const tmpDir = os.tmpdir();
  if (!fs.existsSync(tmpDir)) {
    return [];
  }

  const now = Date.now();
  const maxAgeMs = Math.max(0, Number.isFinite(tempMaxAgeDays) ? tempMaxAgeDays : 2) * 24 * 60 * 60 * 1000;
  const patterns = [/^ns[a-z0-9]+\.tmp$/i, /^icon-gen-/i, /^electron-builder-/i, /^neuralshell-smoke-userdata/i];
  const results = [];

  let entries = [];
  try {
    entries = fs.readdirSync(tmpDir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    const name = entry.name;
    const fullPath = path.join(tmpDir, name);
    const stat = safeLstat(fullPath);
    if (!stat) {
      continue;
    }

    const targeted = patterns.some((pattern) => pattern.test(name));
    const oldEnough = now - stat.mtimeMs >= maxAgeMs;
    const shouldRemove = targeted || (aggressiveTemp && oldEnough);
    if (!shouldRemove) {
      continue;
    }

    const sizeBefore = getPathSize(fullPath);
    const removed = removePath(fullPath);
    results.push({
      path: fullPath,
      removed,
      bytes: removed ? sizeBefore : 0
    });
  }

  return results;
}

function runCommand(command, label) {
  console.log(`[maintenance] ${label}: ${command}`);
  const result = spawnSync(command, {
    cwd: root,
    stdio: "inherit",
    shell: true
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}

function summarize(results) {
  const removedItems = results.filter((item) => item.removed);
  const failedItems = results.filter((item) => !item.removed);
  const reclaimed = removedItems.reduce((sum, item) => sum + Number(item.bytes || 0), 0);

  console.log(`[maintenance] removed items: ${removedItems.length}`);
  console.log(`[maintenance] failed removals: ${failedItems.length}`);
  console.log(`[maintenance] reclaimed: ${formatBytes(reclaimed)}`);
}

function main() {
  console.log(`[maintenance] repo: ${root}`);
  console.log(`[maintenance] mode: ${skipVerify ? "clean-only" : "clean+verify"}`);
  if (aggressiveTemp) {
    console.log(`[maintenance] aggressive temp cleanup enabled (max age ${tempMaxAgeDays} days).`);
  }

  const repoTargets = [
    path.join(root, "dist"),
    path.join(root, "dist_fresh"),
    path.join(root, "coverage"),
    path.join(root, ".nyc_output")
  ];

  const cleanupResults = [
    ...cleanTargetedPaths(repoTargets),
    ...cleanTargetedPaths(getElectronBuilderCachePaths()),
    ...cleanTempEntries()
  ];

  summarize(cleanupResults);

  if (skipVerify) {
    console.log("[maintenance] verify step skipped.");
    return;
  }

  runCommand(verifyCommand, "verify");
  console.log("[maintenance] completed.");
}

try {
  main();
} catch (err) {
  console.error(`[maintenance] ${err.message || err}`);
  process.exit(1);
}
