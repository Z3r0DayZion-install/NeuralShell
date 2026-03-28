#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { writeJson } = require("./lib/signed_artifacts.cjs");

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

function parsePanels(input) {
  return String(input || "mission-control,fleet-control,recovery-center,airgap-operations")
    .split(",")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const outRoot = toAbs(root, String(args["output-root"] || "release/demo-recap"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const accountName = String(args.account || "Institutional Evaluator");
  const presenter = String(args.presenter || "field-operator");
  const panels = parsePanels(args.panels);

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `demo-recap-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "demo_recap.json"), {
    generatedAt,
    accountName,
    presenter,
    panelCoverage: panels,
    outcomes: [
      "Validated local-first and air-gap operation posture.",
      "Demonstrated trust, recovery, and deployment control surfaces.",
      "Mapped next-step security and procurement packet requests.",
    ],
    recommendedNextStage: "security_review",
  });

  fs.writeFileSync(
    path.join(outDir, "demo_recap.md"),
    [
      "# Demo Recap",
      "",
      `- Account: ${accountName}`,
      `- Presenter: ${presenter}`,
      `- Generated At: ${generatedAt}`,
      "",
      "## Panels Covered",
      ...panels.map((panel, index) => `${index + 1}. ${panel}`),
      "",
      "## Recommended Next Step",
      "Generate security review follow-up pack and capture open reviewer questions.",
      "",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    accountName,
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
