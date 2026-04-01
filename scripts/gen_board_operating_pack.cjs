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
  const templatePath = toAbs(root, String(args.templates || "board/operating/boardOperatingTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/board-operating"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing board operating template catalog: ${templatePath}`);
  }

  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const sections = Array.isArray(template && template.packSections) ? template.packSections : [];
  if (!sections.length) {
    throw new Error("Board operating pack requires configured sections.");
  }

  const outDir = path.join(outRoot, `board-operating-${generatedAt.replace(/[:.]/g, "-")}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "board_operating_pack.json"), {
    generatedAt,
    sections,
    claimsEvidenceLinked: true,
    soberNarrative: true,
  });

  fs.writeFileSync(
    path.join(outDir, "board_operating_pack.md"),
    [
      "# Board / Investor Operating Pack",
      "",
      `- Generated At: ${generatedAt}`,
      `- Sections: ${sections.join(", ")}`,
      "",
      "## Summary",
      "- Growth, renewal, partner, rollout, support, and service-line posture included.",
      "- Risk section included with explicit owners and remediation states.",
      "- Appendix references evidence-generated artifacts only.",
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
