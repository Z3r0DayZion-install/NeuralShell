const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(cmd) {
  console.log(`\n[pre-push] ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function main() {
  if (process.env.NEURAL_SKIP_PREPUSH === "1") {
    console.log("[pre-push] Skipped because NEURAL_SKIP_PREPUSH=1.");
    return;
  }

  run("npm run release:worktree");
  run("npm run lint");

  if (process.env.NEURAL_PREPUSH_FAST === "1") {
    console.log("[pre-push] Fast mode enabled (NEURAL_PREPUSH_FAST=1). Skipping npm test.");
    return;
  }

  run("npm test");
  console.log("\n[pre-push] Gate passed.");
}

main();
