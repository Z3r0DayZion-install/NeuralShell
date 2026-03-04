const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "tear", "release-status.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function run() {
  assert(fs.existsSync(target), "Missing release-status.js");
  const src = fs.readFileSync(target, "utf8");
  assert(src.includes("provenance.json"), "release-status.js missing provenance output.");
  assert(src.includes("Release provenance written"), "release-status.js missing provenance log output.");
  console.log("Release status contract test passed.");
}

run();
