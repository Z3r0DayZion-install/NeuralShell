const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const summaryPath = path.join(root, "coverage", "coverage-summary.json");

const GLOBAL_THRESHOLDS = {
  statements: 80,
  branches: 74,
  functions: 84,
  lines: 80
};

const CRITICAL_FILE_THRESHOLDS = [
  {
    fileSuffix: path.join("src", "core", "ipcValidators.js"),
    thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 }
  },
  {
    fileSuffix: path.join("src", "core", "policyFirewall.js"),
    thresholds: { statements: 95, branches: 70, functions: 95, lines: 95 }
  },
  {
    fileSuffix: path.join("src", "core", "llmService.js"),
    thresholds: { statements: 92, branches: 75, functions: 95, lines: 92 }
  },
  {
    fileSuffix: path.join("src", "core", "stateManager.js"),
    thresholds: { statements: 88, branches: 68, functions: 95, lines: 88 }
  },
  {
    fileSuffix: path.join("src", "core", "sessionManager.js"),
    thresholds: { statements: 90, branches: 70, functions: 95, lines: 90 }
  }
];

function normalizePath(p) {
  return String(p || "")
    .replace(/[\\/]+/g, "/")
    .toLowerCase();
}

function findSummaryEntry(summary, fileSuffix) {
  const wanted = normalizePath(fileSuffix);
  const key = Object.keys(summary).find((k) => normalizePath(k).endsWith(wanted));
  return key ? { key, entry: summary[key] } : null;
}

function validateThresholdSet(label, entry, thresholds) {
  const failures = [];
  for (const metric of ["statements", "branches", "functions", "lines"]) {
    const actual = Number(entry?.[metric]?.pct);
    const expected = Number(thresholds[metric]);
    if (!Number.isFinite(actual)) {
      failures.push(`${label}: missing ${metric} coverage metric.`);
      continue;
    }
    if (actual < expected) {
      failures.push(`${label}: ${metric} ${actual.toFixed(2)}% < required ${expected.toFixed(2)}%.`);
    } else {
      console.log(`${label}: ${metric} ${actual.toFixed(2)}% >= ${expected.toFixed(2)}%`);
    }
  }
  return failures;
}

function main() {
  if (!fs.existsSync(summaryPath)) {
    console.error(`[coverage-gate] Missing coverage summary: ${summaryPath}`);
    console.error("[coverage-gate] Run `npm run coverage:test` before validating thresholds.");
    process.exit(1);
  }

  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const failures = [];

  if (!summary.total) {
    failures.push("[global] missing total coverage data.");
  } else {
    failures.push(...validateThresholdSet("[global]", summary.total, GLOBAL_THRESHOLDS));
  }

  for (const item of CRITICAL_FILE_THRESHOLDS) {
    const found = findSummaryEntry(summary, item.fileSuffix);
    if (!found) {
      failures.push(`[critical] Missing coverage entry for ${item.fileSuffix}`);
      continue;
    }
    failures.push(...validateThresholdSet(`[critical] ${found.key}`, found.entry, item.thresholds));
  }

  if (failures.length > 0) {
    console.error("\n[coverage-gate] FAIL:");
    for (const line of failures) {
      console.error(`- ${line}`);
    }
    process.exit(1);
  }

  console.log("\n[coverage-gate] PASS: all coverage thresholds satisfied.");
}

main();
