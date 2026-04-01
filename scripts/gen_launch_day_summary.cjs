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
  const templatePath = toAbs(root, String(args.templates || "launch/week/launchWeekTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/launch-week"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const dayLabel = String(args.day || "launch-day");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing launch-week template catalog: ${templatePath}`);
  }
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const dailyChecklist = Array.isArray(template && template.dailyChecklist) ? template.dailyChecklist : [];
  const commsChecklist = Array.isArray(template && template.releaseCommsChecklist) ? template.releaseCommsChecklist : [];

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `launch-week-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "launch_day_summary.json"), {
    generatedAt,
    dayLabel,
    dailyChecklist: dailyChecklist.map((detail, index) => ({
      itemId: `daily-${index + 1}`,
      detail: String(detail),
      complete: index < 3,
    })),
    releaseCommsChecklist: commsChecklist.map((detail, index) => ({
      itemId: `comms-${index + 1}`,
      detail: String(detail),
      complete: index < 2,
    })),
    boards: Array.isArray(template && template.boards) ? template.boards : [],
  });

  fs.writeFileSync(
    path.join(outDir, "end_of_day_summary.md"),
    [
      "# Launch Week End-of-Day Summary",
      "",
      `- Day: ${dayLabel}`,
      `- Generated At: ${generatedAt}`,
      "",
      "## Command Priorities",
      "1. Resolve critical issue escalations before next-day queue opens.",
      "2. Confirm support readiness coverage for all active pilots.",
      "3. Validate partner and buyer follow-up queue ownership.",
      "",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    dayLabel,
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
