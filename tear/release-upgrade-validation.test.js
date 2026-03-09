const fs = require("fs");
const os = require("os");
const path = require("path");
const { generateUpgradeValidationReport } = require("../scripts/release-upgrade-validation");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function writeFile(baseDir, relPath, contents) {
  const filePath = path.join(baseDir, relPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

function runStrictPassCase() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-upgrade-validate-pass-"));
  try {
    writeFile(fixtureRoot, "dist/NeuralShell Setup 1.2.3-OMEGA.exe", "installer");
    writeFile(fixtureRoot, "dist/NeuralShell Setup 1.2.3-OMEGA.exe.blockmap", "blockmap");
    writeFile(fixtureRoot, "dist/OMEGA.yml", "version: 1.2.3-OMEGA\npath: NeuralShell Setup 1.2.3-OMEGA.exe\n");
    writeFile(
      fixtureRoot,
      "release/installer-smoke-report.json",
      JSON.stringify(
        {
          generatedAt: "2026-03-08T01:00:00.000Z",
          strictInstall: true,
          passed: true,
          install: { code: 0 },
          smoke: { code: 0 }
        },
        null,
        2
      )
    );

    const fixedNow = "2026-03-08T02:00:00.000Z";
    const { report, outFile } = generateUpgradeValidationReport({
      rootDir: fixtureRoot,
      strict: true,
      now: () => fixedNow
    });

    assert(fs.existsSync(outFile), "upgrade-validation.json not created.");
    assert(report.passed === true, "Expected strict upgrade validation to pass.");
    assert(report.generatedAt === fixedNow, "upgrade-validation generatedAt mismatch.");
    assert(report.release.updateMetadata.version === "1.2.3-OMEGA", "upgrade metadata version mismatch.");
    assert(report.installerSmoke && report.installerSmoke.passed, "installer smoke summary missing.");
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function runStrictFailCase() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-upgrade-validate-fail-"));
  try {
    writeFile(fixtureRoot, "dist/NeuralShell Setup 1.2.4-OMEGA.exe", "installer");
    writeFile(fixtureRoot, "dist/NeuralShell Setup 1.2.4-OMEGA.exe.blockmap", "blockmap");
    writeFile(fixtureRoot, "dist/OMEGA.yml", "version: 1.2.4-OMEGA\npath: NeuralShell Setup 1.2.4-OMEGA.exe\n");

    let failed = false;
    try {
      generateUpgradeValidationReport({ rootDir: fixtureRoot, strict: true });
    } catch (err) {
      failed = /strict mode/i.test(String(err.message || err));
    }

    assert(failed, "Expected strict upgrade validation to fail without installer smoke report.");
    const outFile = path.join(fixtureRoot, "release", "upgrade-validation.json");
    assert(fs.existsSync(outFile), "upgrade-validation.json should still be written on strict failure.");
    const parsed = JSON.parse(fs.readFileSync(outFile, "utf8"));
    assert(parsed.passed === false, "Expected failed upgrade-validation report.");
    assert(parsed.checks && parsed.checks.installerSmokeReportPresent === false, "Expected missing smoke report flag.");
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

function run() {
  runStrictPassCase();
  runStrictFailCase();
  console.log("Release upgrade validation test passed.");
}

run();
