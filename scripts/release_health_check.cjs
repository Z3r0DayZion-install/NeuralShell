#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function exists(relativePath) {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  return {
    path: relativePath,
    absolutePath,
    exists: fs.existsSync(absolutePath)
  };
}

function evaluateReleaseHealth() {
  const checks = [
    { id: "proof_badge", required: true, file: "badges/proof_badge.svg" },
    { id: "soc2_badge", required: true, file: "badges/soc2_prep.svg" },
    { id: "soc2_report", required: true, file: "SOC2_PREP_REPORT.md" },
    { id: "packaged_proof_report", required: true, file: "release/ui-self-sell-proof-report-packaged.json" },
    { id: "packaged_parity_report", required: true, file: "release/ui-self-sell-proof-parity.json" },
    { id: "notarized_dmg", required: false, file: "dist" },
    { id: "signed_vsix", required: false, file: "release/neuralshell-vscode.vsix" },
    { id: "signed_jetbrains_zip", required: false, file: "release/neuralshell-jetbrains.zip" }
  ];

  const rows = checks.map((check) => {
    const fileInfo = exists(check.file);
    return {
      id: check.id,
      required: Boolean(check.required),
      path: check.file,
      ok: fileInfo.exists,
      severity: check.required ? "critical" : "optional"
    };
  });

  const criticalMissing = rows.filter((row) => row.required && !row.ok);
  const optionalMissing = rows.filter((row) => !row.required && !row.ok);

  const status = criticalMissing.length === 0
    ? optionalMissing.length === 0 ? "green" : "yellow"
    : "red";

  return {
    generatedAt: new Date().toISOString(),
    status,
    summary: {
      total: rows.length,
      passing: rows.filter((row) => row.ok).length,
      criticalMissing: criticalMissing.length,
      optionalMissing: optionalMissing.length
    },
    rows
  };
}

function main() {
  const report = evaluateReleaseHealth();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status === "red") {
    process.exitCode = 1;
  }
}

module.exports = {
  evaluateReleaseHealth
};

if (require.main === module) {
  main();
}
