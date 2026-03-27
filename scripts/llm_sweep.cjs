const fs = require("fs");
const path = require("path");
const { runLlmSweep } = require("../src/core/llmSweep");

const ARGS = new Set(process.argv.slice(2));
const strict = ARGS.has("--strict");
const reportPath = path.resolve(process.cwd(), "release", "llm-sweep-report.json");

async function main() {
  const summary = await runLlmSweep({
    strict,
    requestTimeoutMs: 12000,
    maxRetries: 0
  });

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (strict && !summary.pass) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  process.stderr.write(`[llm:sweep] ${err && err.stack ? err.stack : String(err)}\n`);
  process.exitCode = 1;
});

