const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(cmd) {
  return execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").trim();
}

function main() {
  run("git config core.hooksPath .githooks");
  const hookPath = run("git config --get core.hooksPath");
  if (hookPath !== ".githooks") {
    throw new Error(`Failed to set hooks path. Current value: ${hookPath}`);
  }
  console.log("Git hooks installed. core.hooksPath=.githooks");
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
}
