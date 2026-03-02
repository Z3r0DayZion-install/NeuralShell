const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function main() {
  run("npm test");
  run("npm run build -- --config.directories.output=dist_fresh");
  run("node tear/sync-dist.js");
  run("npm run smoke:packaged");
  run("npm run release:gate");
  run("node scripts/release-manifest.js");
  run("node tear/release-status.js");
  console.log("\nShip pipeline completed.");
}

main();
