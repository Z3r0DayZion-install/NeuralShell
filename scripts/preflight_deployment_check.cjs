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
  const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

  const checks = [
    check(
      "Node runtime policy",
      isCI ? /^v22\./.test(String(process.version || "")) : true,
      isCI ? `Detected ${String(process.version || "unknown")}` : `Detected ${String(process.version || "unknown")} (CI=${isCI}, skipped outside CI)`
    ),
    check(
      "Deployment runbooks present",
      fs.existsSync(path.resolve(root, "docs/deployment/RUNBOOK_STANDARD.md"))
        && fs.existsSync(path.resolve(root, "docs/deployment/RUNBOOK_AIRGAP.md"))
        && fs.existsSync(path.resolve(root, "docs/deployment/RUNBOOK_APPLIANCE.md")),
      "Required runbook set: standard, airgap, appliance"
    ),
    check(
      "PKI trust docs present",
      fs.existsSync(path.resolve(root, "docs/security/PKI_TRUST_FABRIC.md")),
      "PKI trust fabric documentation"
    ),
    check(
      "Air-gap bundle tooling present",
      fs.existsSync(path.resolve(root, "scripts/gen_airgap_bundle.cjs"))
        && fs.existsSync(path.resolve(root, "scripts/verify_airgap_bundle.cjs")),
      "Air-gap generation and verification scripts"
    ),
    check(
      "Hardware appliance tooling present",
      fs.existsSync(path.resolve(root, "scripts/gen_hardware_appliance_build.cjs")),
      "Hardware appliance build script"
    ),
  ];

  const passed = checks.every((entry) => entry.passed);
  const report = {
    schema: "neuralshell_deployment_preflight_v1",
    generatedAt,
    passed,
    checks,
  };

  fs.mkdirSync(outRoot, { recursive: true });
  const outPath = path.join(outRoot, "preflight-report.json");
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
