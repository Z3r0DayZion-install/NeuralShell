const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const smokeReportPath = path.join(root, "release", "packaged-smoke-report.json");
const outPath = path.join(root, "release", "canary-gate.json");

function parseNumberArg(name, fallback) {
  const raw = process.argv.find((arg) => String(arg || "").startsWith(`--${name}=`));
  if (!raw) return fallback;
  const n = Number(String(raw).slice(name.length + 3));
  return Number.isFinite(n) ? n : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runSmoke(timeoutMs) {
  const cmd = `node tear/smoke-packaged.js --strict-launch --isolated-user-data --timeout-ms=${timeoutMs}`;
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

function readSmokeReport() {
  if (!fs.existsSync(smokeReportPath)) {
    throw new Error(`Missing smoke report after canary cycle: ${smokeReportPath}`);
  }
  return JSON.parse(fs.readFileSync(smokeReportPath, "utf8"));
}

async function main() {
  const cyclesArg = parseNumberArg("cycles", 3);
  const minUptimeMs = parseNumberArg("min-uptime-ms", 750);
  const timeoutMs = parseNumberArg("timeout-ms", 25000);
  const delayMs = parseNumberArg("delay-ms", 200);
  const durationHours = parseNumberArg("duration-hours", 0);

  const minCycles = Math.max(1, Math.floor(cyclesArg));
  const deadlineMs = durationHours > 0 ? Date.now() + durationHours * 60 * 60 * 1000 : null;

  const runs = [];
  let cycle = 0;
  while (cycle < minCycles || (deadlineMs != null && Date.now() < deadlineMs)) {
    cycle += 1;
    const started = Date.now();
    let result;
    try {
      runSmoke(timeoutMs);
      const report = readSmokeReport();
      const uptimeMs = Number(report.uptimeMs) || 0;
      const passed = Boolean(report.passed) && uptimeMs >= minUptimeMs;
      result = {
        cycle,
        ok: passed,
        smokePassed: Boolean(report.passed),
        uptimeMs,
        durationMs: Date.now() - started,
        reason: passed ? "" : `uptime ${uptimeMs} < min ${minUptimeMs} or smoke passed=false`
      };
    } catch (err) {
      result = {
        cycle,
        ok: false,
        smokePassed: false,
        uptimeMs: 0,
        durationMs: Date.now() - started,
        reason: err.message || String(err)
      };
    }
    runs.push(result);
    if (!result.ok) {
      break;
    }
    if (delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    passed: runs.length > 0 && runs.every((r) => r.ok),
    thresholds: {
      minUptimeMs,
      timeoutMs,
      minCycles,
      durationHours
    },
    runs
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[canary-gate] report=${outPath}`);

  if (!report.passed) {
    throw new Error("Canary gate failed.");
  }
  console.log("[canary-gate] PASS");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
