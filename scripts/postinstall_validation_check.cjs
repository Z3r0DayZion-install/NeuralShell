#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = String(argv[index] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      index += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function toAbs(root, inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath);
}

function check(label, condition, detail) {
  return {
    label,
    passed: Boolean(condition),
    detail: String(detail || ""),
  };
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const outRoot = toAbs(root, String(args["output-root"] || "release/deployment-checks"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  const checks = [
    check(
      "Packaged runtime executable",
      fs.existsSync(path.resolve(root, "dist/win-unpacked/NeuralShell.exe")),
      "dist/win-unpacked/NeuralShell.exe"
    ),
    check(
      "Packaged app archive",
      fs.existsSync(path.resolve(root, "dist/win-unpacked/resources/app.asar")),
      "dist/win-unpacked/resources/app.asar"
    ),
    check(
      "Release gate report",
      fs.existsSync(path.resolve(root, "release/release-gate.json")),
      "release/release-gate.json"
    ),
    check(
      "Installer smoke report",
      fs.existsSync(path.resolve(root, "release/installer-smoke-report.json")),
      "release/installer-smoke-report.json"
    ),
    check(
      "Field launch health script",
      fs.existsSync(path.resolve(root, "scripts/field_launch_health_check.cjs")),
      "scripts/field_launch_health_check.cjs"
    ),
  ];

  const passed = checks.every((entry) => entry.passed);
  const report = {
    schema: "neuralshell_postinstall_validation_v1",
    generatedAt,
    passed,
    checks,
  };

  fs.mkdirSync(outRoot, { recursive: true });
  const outPath = path.join(outRoot, "postinstall-report.json");
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  checks.forEach((entry) => {
    process.stdout.write(`[${entry.passed ? "PASS" : "FAIL"}] ${entry.label} :: ${entry.detail}\n`);
  });
  process.stdout.write(`report=${outPath}\n`);

  if (!passed) {
    process.exit(1);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
