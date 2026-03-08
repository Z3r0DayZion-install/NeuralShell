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
  run("npm run test:flaky");
  run("npm run coverage:check");
  run("npm run security:pass:local");
  console.log("\n[pre-push] Gate passed.");
}

main();
