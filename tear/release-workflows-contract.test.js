const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseTagWorkflow = path.join(root, ".github", "workflows", "release-tag.yml");
const releaseContractWorkflow = path.join(root, ".github", "workflows", "release-contract.yml");
const ciWorkflow = path.join(root, ".github", "workflows", "ci.yml");
const securityGateWorkflow = path.join(root, ".github", "workflows", "security-gate.yml");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readFile(filePath) {
  assert(fs.existsSync(filePath), `Missing workflow file: ${filePath}`);
  return fs.readFileSync(filePath, "utf8");
}

function run() {
  const releaseTagSrc = readFile(releaseTagWorkflow);
  const releaseContractSrc = readFile(releaseContractWorkflow);
  const ciSrc = readFile(ciWorkflow);
  const securityGateSrc = readFile(securityGateWorkflow);

  assert(
    releaseTagSrc.includes("RELEASE_NOTES_TAG"),
    "release-tag workflow must pass release tag via RELEASE_NOTES_TAG env."
  );
  assert(
    !releaseTagSrc.includes("npm run release:notes -- --tag="),
    "release-tag workflow should avoid npm passthrough args for release notes."
  );
  assert(
    releaseTagSrc.includes("--wait-minutes=20") && releaseTagSrc.includes("--poll-seconds=20"),
    "release-tag workflow must wait/retry for required checks."
  );
  assert(
    releaseTagSrc.includes("release/installer-smoke-report.json"),
    "release-tag workflow must publish installer smoke report."
  );
  assert(
    releaseTagSrc.includes("release/upgrade-validation.json"),
    "release-tag workflow must publish upgrade validation report."
  );

  assert(
    releaseContractSrc.includes("npm run release:upgrade:validate"),
    "release-contract workflow must generate upgrade validation report."
  );

  assert(
    ciSrc.includes("release/installer-smoke-report.json"),
    "ci workflow must upload installer smoke report artifact."
  );
  assert(
    ciSrc.includes("release/upgrade-validation.json"),
    "ci workflow must upload upgrade validation artifact."
  );

  assert(
    securityGateSrc.includes("github/codeql-action/init@v4") &&
      securityGateSrc.includes("github/codeql-action/autobuild@v4") &&
      securityGateSrc.includes("github/codeql-action/analyze@v4"),
    "security-gate workflow must use CodeQL v4 actions."
  );

  console.log("Release workflow contract test passed.");
}

run();
