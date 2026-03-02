const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "tear", "verify-release-freshness.js");

function run() {
  if (!fs.existsSync(target)) {
    throw new Error("Missing verify-release-freshness.js");
  }
  const src = fs.readFileSync(target, "utf8");
  if (!src.includes("status.json") || !src.includes("manifest.json") || !src.includes("autonomy-benchmark.json")) {
    throw new Error("Release freshness verifier missing required checks.");
  }
  console.log("Release freshness test passed.");
}

run();
