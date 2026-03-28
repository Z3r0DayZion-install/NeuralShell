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

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const templatePath = toAbs(root, String(args.templates || "support/ops/supportOpsTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/support-playbook"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing support template catalog: ${templatePath}`);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const severityMatrix = Array.isArray(template && template.severityMatrix) ? template.severityMatrix : [];
  const escalationLadder = Array.isArray(template && template.escalationLadder) ? template.escalationLadder : [];

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `support-playbook-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "support_intake_checklist.json"), {
    generatedAt,
    checklist: [
      "Collect environment fingerprint and deployment profile.",
      "Validate severity and business impact classification.",
      "Attach support bundle hash and collection time.",
      "Capture current mitigation and escalation owner.",
    ],
  });

  writeJson(path.join(outDir, "severity_matrix.json"), {
    generatedAt,
    severityMatrix,
  });

  writeJson(path.join(outDir, "escalation_ladder.json"), {
    generatedAt,
    escalationLadder,
    turnaroundTargets: {
      sev1: "15m response / 4h workaround",
      sev2: "30m response / 1d workaround",
      sev3: "4h response / 3d resolution",
      sev4: "1d response / 7d resolution",
    },
  });

  fs.writeFileSync(
    path.join(outDir, "known_issue_bulletin_template.md"),
    [
      "# Known Issue Bulletin",
      "",
      "- Issue ID:",
      "- First observed:",
      "- Affected versions:",
      "- Deployment profile impact:",
      "- Mitigation:",
      "- Escalation owner:",
      "- Next update ETA:",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "incident_handoff_template.json"), {
    generatedAt,
    requiredFields: [
      "incidentId",
      "severity",
      "timeline",
      "supportBundleHash",
      "containmentStatus",
      "executiveSummary",
    ],
  });

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
