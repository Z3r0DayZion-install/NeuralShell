const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const benchmarkPath = path.join(releaseDir, "autonomy-benchmark.json");
const outputPath = path.join(releaseDir, "autonomy-replay.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(fs.existsSync(benchmarkPath), `Missing benchmark report: ${benchmarkPath}`);

  const benchmark = JSON.parse(fs.readFileSync(benchmarkPath, "utf8"));
  const percent = Number(benchmark.percent);
  assert(Number.isFinite(percent), "Benchmark percent must be numeric.");

  const report = {
    generatedAt: new Date().toISOString(),
    source: path.relative(root, benchmarkPath).replace(/\\/g, "/"),
    percent,
    recommendedReplay: "npm run benchmark:autonomy"
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`Autonomy replay metadata written: ${outputPath}`);
}

main();
