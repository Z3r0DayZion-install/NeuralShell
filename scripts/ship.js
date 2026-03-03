const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(stage) {
  console.log(`\n[ship] ${stage}`);
  execSync(stage, { cwd: root, stdio: "inherit" });
}

function main() {
  const stages = [
    "npm run build",
    "npm run release:gate",
    "npm run release:manifest",
    "npm run release:status",
    "npm run release:checksums",
    "npm run release:verify:fresh"
  ];

  for (const stage of stages) {
    run(stage);
  }

  console.log("\n[ship] Release ship pipeline passed.");
}

main();
