const { execSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");

function run(stage) {
  console.log(`\n[ship] ${stage}`);
  execSync(stage, { cwd: root, stdio: "inherit" });
}

function main() {
  const stages = [
    "npm run verify:ship"
  ];

  for (const stage of stages) {
    run(stage);
  }

  console.log("\n[ship] Release ship pipeline passed.");
}

main();
