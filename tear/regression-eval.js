const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const releaseDir = path.join(root, "release");
const benchmarkPath = path.join(releaseDir, "autonomy-benchmark.json");
const outputPath = path.join(releaseDir, "regression-eval.json");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(
    fs.existsSync(benchmarkPath),
    `Missing autonomy benchmark report: ${benchmarkPath}. Run 'npm run benchmark:autonomy' first.`
  );

  const report = JSON.parse(fs.readFileSync(benchmarkPath, "utf8"));
  const percent = Number(report.percent);
  const threshold = Number(process.env.NEURAL_REGRESSION_MIN_PERCENT || 75);

  assert(Number.isFinite(percent), "Autonomy benchmark report percent must be numeric.");

  const passed = percent >= threshold;
  const result = {
    generatedAt: new Date().toISOString(),
    source: path.relative(root, benchmarkPath).replace(/\\/g, "/"),
    percent,
    threshold,
    passed
  };

  fs.mkdirSync(releaseDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  if (!passed) {
    throw new Error(
      `Regression evaluation failed: autonomy percent ${percent} is below threshold ${threshold}.`
    );
  }

  console.log(
    `Regression evaluation passed. percent=${percent} threshold=${threshold} report=${outputPath}`
  );
}

main();
