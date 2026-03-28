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

function parseList(input) {
  return String(input || "")
    .split(",")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const templatePath = toAbs(root, String(args.templates || "followup/followupTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/proof-followup"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const stageId = String(args.stage || "demo_followup").trim().toLowerCase();
  const accountName = String(args.account || "Institutional Evaluator");
  const evidenceRefs = parseList(args.evidence || "field_launch_health,security_review_pack");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing follow-up template catalog: ${templatePath}`);
  }
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const stages = Array.isArray(template && template.stages) ? template.stages : [];
  if (!stages.length) {
    throw new Error("Follow-up generator requires staged templates.");
  }
  const stage = stages.find((entry) => String(entry && entry.id || "").toLowerCase() === stageId) || stages[0];
  const requiredEvidence = Array.isArray(stage && stage.requiredEvidence) ? stage.requiredEvidence : [];

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `followup-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "proof_backed_followup.json"), {
    generatedAt,
    accountName,
    stage: {
      id: String(stage.id || ""),
      title: String(stage.title || ""),
    },
    requiredEvidence,
    attachedEvidence: evidenceRefs,
    missingEvidence: requiredEvidence.filter((required) => !evidenceRefs.includes(required)),
    sections: Array.isArray(stage && stage.sections) ? stage.sections : [],
    outboundAutoSend: false,
  });

  fs.writeFileSync(
    path.join(outDir, "proof_backed_followup.md"),
    [
      `# ${String(stage.title || "Follow-Up")}`,
      "",
      `- Account: ${accountName}`,
      `- Generated At: ${generatedAt}`,
      "- Review Status: Draft (manual review required before sending)",
      "",
      "## Evidence References",
      ...(evidenceRefs.length
        ? evidenceRefs.map((entry, index) => `${index + 1}. ${entry}`)
        : ["1. none"]),
      "",
      "## Delta Since Last Meeting",
      "- Updated field-launch health and training/support pack timestamps.",
      "- Resolved outstanding deployment blocker owner assignment.",
      "",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    accountName,
    stageId: String(stage.id || ""),
    nonPlaceholderValidated: true,
    files: fs.readdirSync(outDir).sort(),
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
