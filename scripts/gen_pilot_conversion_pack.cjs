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
  const templatePath = toAbs(root, String(args.templates || "pilot/conversion/pilotConversionTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/pilot-conversion-pack"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing pilot template catalog: ${templatePath}`);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const kickoffChecklist = Array.isArray(template && template.kickoffChecklist) ? template.kickoffChecklist : [];
  const reviewCadence = Array.isArray(template && template.reviewCadence) ? template.reviewCadence : [];
  const expansionMilestones = Array.isArray(template && template.expansionMilestones) ? template.expansionMilestones : [];

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `pilot-conversion-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "pilot_kickoff_pack.json"), {
    generatedAt,
    checklist: kickoffChecklist,
    reviewCadence,
  });

  writeJson(path.join(outDir, "proof_of_value_worksheet.json"), {
    generatedAt,
    metrics: [
      "time_to_triage_minutes",
      "recovery_success_rate",
      "policy_rollout_integrity_rate",
      "operator_training_completion_rate",
    ],
    guidance: "Populate from actual runtime evidence bundles and screenshots.",
  });

  writeJson(path.join(outDir, "expansion_map.json"), {
    generatedAt,
    milestones: expansionMilestones,
    notes: "Use deployment model and trust requirements to scope each expansion step.",
  });

  fs.writeFileSync(
    path.join(outDir, "stakeholder_summary_template.md"),
    [
      "# Pilot Stakeholder Summary",
      "",
      "- Pilot scope:",
      "- Evidence highlights:",
      "- Risks and blockers:",
      "- Recommendation:",
      "- Expansion decision:",
    ].join("\n"),
    "utf8"
  );

  fs.writeFileSync(
    path.join(outDir, "renewal_expansion_recommendation.md"),
    [
      "# Renewal / Expansion Recommendation",
      "",
      "- Current pilot posture:",
      "- Value delivered:",
      "- Deployment readiness:",
      "- Recommended next SKU/profile:",
      "- Commercial and support implications:",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "risk_blocker_register.json"), {
    generatedAt,
    fields: ["riskId", "summary", "owner", "severity", "targetDate", "status"],
    rows: [],
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
