const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

function collectMatches(source, regex, group = 1) {
  const values = new Set();
  let match;
  while ((match = regex.exec(source)) !== null) {
    values.add(match[group]);
  }
  return values;
}

function toSortedArray(set) {
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function setDiff(a, b) {
  return toSortedArray(new Set([...a].filter((value) => !b.has(value))));
}

function validateInvokeChannels() {
  const mainJs = read("src/main.js");
  const preloadJs = read("src/preload.js");

  const mainHandles = collectMatches(mainJs, /ipcMain\.handle\(\s*"([^"]+)"/g);
  const preloadInvoke = collectMatches(preloadJs, /"([^"]+)"/g);

  // Restrict preload string scan to channels found near ALLOWED_INVOKE_CHANNELS.
  const invokeBlockMatch = preloadJs.match(/const ALLOWED_INVOKE_CHANNELS = new Set\(\[([\s\S]*?)\]\);/);
  assert(invokeBlockMatch, "Could not find ALLOWED_INVOKE_CHANNELS block in preload.js");
  const invokeBlock = invokeBlockMatch[1];
  const invokeChannels = collectMatches(invokeBlock, /"([^"]+)"/g);

  const missingInPreload = setDiff(mainHandles, invokeChannels);
  const extraInPreload = setDiff(invokeChannels, mainHandles);

  assert(
    missingInPreload.length === 0,
    `Channels handled in main.js but missing in preload allowlist: ${missingInPreload.join(", ")}`
  );
  assert(
    extraInPreload.length === 0,
    `Channels in preload allowlist but not handled in main.js: ${extraInPreload.join(", ")}`
  );

  // Keep this read so dead-code checks do not silently remove the broader scan.
  assert(preloadInvoke.size >= invokeChannels.size, "Internal parse error while scanning preload invoke strings.");
}

function validateStreamEventBridge() {
  const mainJs = read("src/main.js");
  const preloadJs = read("src/preload.js");

  const forwardedInPreload = collectMatches(preloadJs, /ipcRenderer\.on\("([^"]+)"\)/g);
  const sentInMain = collectMatches(mainJs, /sendToRenderer\("([^"]+)"/g);

  const missingFromMain = setDiff(forwardedInPreload, sentInMain);
  assert(
    missingFromMain.length === 0,
    `Preload forwards event(s) that main never sends: ${missingFromMain.join(", ")}`
  );
}

function run() {
  validateInvokeChannels();
  validateStreamEventBridge();
  console.log("IPC surface test passed.");
}

run();
