const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const bannedRootFiles = [
  "confirm.json",
  "local_dry_run.sh",
  "local_dry_run_node.sh",
  "test_sign_confirm.py"
];

function run() {
  const found = bannedRootFiles.filter((name) => fs.existsSync(path.join(root, name)));
  if (found.length) {
    throw new Error(`Deprecated root files must stay removed: ${found.join(", ")}`);
  }
  console.log("Cleanup guard test passed.");
}

run();
