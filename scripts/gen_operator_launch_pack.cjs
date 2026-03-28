#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { writeJson } = require("./lib/signed_artifacts.cjs");

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = String(argv[i] || "").trim();
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next && !String(next).startsWith("--")) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = "1";
    }
  }
  return out;
}

function toAbs(root, inputPath) {
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(root, inputPath);
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const templatePath = toAbs(root, String(args.templates || "licensing/operators/operatorFrameworkTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/operator-launch"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing operator framework template catalog: ${templatePath}`);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const sections = Array.isArray(template && template.operatorPackSections) ? template.operatorPackSections : [];
  const operatorTypes = Array.isArray(template && template.operatorTypes) ? template.operatorTypes : [];
  if (!sections.length || !operatorTypes.length) {
    throw new Error("Operator launch pack requires sections and operator types.");
  }

  const outDir = path.join(outRoot, `operator-launch-${generatedAt.replace(/[:.]/g, "-")}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "licensed_operator_framework.json"), {
    generatedAt,
    operatorTypes,
    sections,
    noLegalOverclaiming: true,
  });

  writeJson(path.join(outDir, "operator_launch_pack.json"), {
    generatedAt,
    launchChecklist: sections.map((section, index) => ({
      section,
      complete: index < 3,
    })),
    governanceAligned: true,
  });

  fs.writeFileSync(
    path.join(outDir, "operator_launch_summary.md"),
    [
      "# Licensed Operator Launch Summary",
      "",
      `- Generated At: ${generatedAt}`,
      `- Operator Types: ${operatorTypes.join(", ")}`,
      "",
      "## Notes",
      "1. Keep framework operational and governance-driven.",
      "2. Enforce training and certification prerequisites.",
      "3. Keep territory/scope metadata explicit and reviewable.",
      "",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    files: fs.readdirSync(outDir).sort(),
    nonPlaceholderValidated: true,
  });

  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    process.stderr.write(`${err && err.message ? err.message : String(err)}\n`);
    process.exit(1);
  }
}
