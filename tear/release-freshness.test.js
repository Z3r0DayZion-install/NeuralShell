const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const target = path.join(root, "tear", "verify-release-freshness.js");

function run() {
  if (!fs.existsSync(target)) {
    throw new Error("Missing verify-release-freshness.js");
  }
  const src = fs.readFileSync(target, "utf8");
  if (
    !src.includes("status.json") ||
    !src.includes("manifest.json") ||
    !src.includes("provenance.json") ||
    !src.includes("autonomy-benchmark.json") ||
    !src.includes("checksums.txt") ||
    !src.includes("checksums.json")
  ) {
    throw new Error("Release freshness verifier missing required checks.");
  }
  if (!src.includes("--strict-installer")) {
    throw new Error("Release freshness verifier missing strict installer mode.");
  }
  if (!src.includes("status.profile")) {
    throw new Error("Release freshness verifier missing status profile validation.");
  }
  if (!src.includes("provenance")) {
    throw new Error("Release freshness verifier missing provenance validation hooks.");
  }
  console.log("Release freshness test passed.");
}

run();
