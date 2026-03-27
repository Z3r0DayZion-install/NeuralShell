const { spawnSync } = require("child_process");
const path = require("path");

function main() {
  const benchPath = path.resolve(__dirname, "..", "bench", "bench_gpu.ts");
  const run = spawnSync(process.execPath, [benchPath], {
    stdio: "inherit",
    encoding: "utf8"
  });
  if (typeof run.status === "number") {
    process.exitCode = run.status;
    return;
  }
  process.exitCode = 1;
}

if (require.main === module) {
  main();
}
