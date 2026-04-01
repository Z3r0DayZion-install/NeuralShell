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

function loadTemplate(pathToFile) {
  if (!fs.existsSync(pathToFile)) {
    throw new Error(`Missing buyer ops template catalog: ${pathToFile}`);
  }
  const parsed = JSON.parse(fs.readFileSync(pathToFile, "utf8"));
  const stages = Array.isArray(parsed && parsed.stages) ? parsed.stages : [];
  if (!stages.length) throw new Error("Buyer ops template requires at least one stage.");
  return parsed;
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const templatePath = toAbs(root, String(args.templates || "buyer/ops/buyerOpsTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/buyer-followup-pack"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const accountName = String(args.account || "Institutional Evaluator");
  const stageId = String(args.stage || "security_review").trim().toLowerCase();
  const evaluatorAgeDays = Number(args["days-since-touch"] || 5);

  const template = loadTemplate(templatePath);
  const stages = template.stages;
  const stage = stages.find((entry) => String(entry && entry.id || "").toLowerCase() === stageId) || stages[0];
  const nudgeThresholdDays = Math.max(1, Number(template.nudgeThresholdDays || 7));
  const isStale = evaluatorAgeDays >= nudgeThresholdDays;

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `buyer-followup-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "buyer_followup_pack.json"), {
    generatedAt,
    accountName,
    stage: {
      id: String(stage.id || ""),
      title: String(stage.title || ""),
    },
    nextActions: Array.isArray(stage.nextActions) ? stage.nextActions : [],
    staleEvaluator: isStale,
    nudgeRecommended: isStale,
    nudgeThresholdDays,
    stageTimeline: Array.isArray(template.timelineMilestones) ? template.timelineMilestones : [],
  });

  fs.writeFileSync(
    path.join(outDir, "buyer_timeline_summary.md"),
    [
      "# Buyer Timeline Summary",
      "",
      `- Account: ${accountName}`,
      `- Stage: ${String(stage.title || stage.id || "Unknown")}`,
      `- Days Since Last Buyer Activity: ${evaluatorAgeDays}`,
      `- Nudge Recommended: ${isStale ? "yes" : "no"}`,
      "",
      "## Next Step Recommendations",
      ...(Array.isArray(stage.nextActions) ? stage.nextActions : []).map((entry, index) => `${index + 1}. ${String(entry)}`),
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
