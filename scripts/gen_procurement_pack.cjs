#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("node:child_process");
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

function toAbs(root, relPath) {
  return path.isAbsolute(relPath) ? relPath : path.resolve(root, relPath);
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${String(text || "").trim()}\n`, "utf8");
}

function runNode(root, script, args) {
  const run = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    encoding: "utf8",
  });
  if (run.status !== 0) {
    throw new Error(run.stderr || run.stdout || `Failed to run ${script}`);
  }
  const out = String(run.stdout || "").trim().split(/\r?\n/).filter(Boolean);
  return out[out.length - 1] || "";
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const packageJson = JSON.parse(fs.readFileSync(path.resolve(root, "package.json"), "utf8"));
  const version = String(args.version || packageJson.version || "0.0.0");
  const outputRoot = toAbs(root, String(args["output-root"] || "release/procurement-pack"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const previousManifestPath = args.previous ? toAbs(root, String(args.previous)) : "";

  const securityPackDir = runNode(root, "scripts/gen_security_review_pack.cjs", [
    "--version", version,
    "--output-root", toAbs(root, "release/security-review-pack"),
    ...(previousManifestPath ? ["--previous", previousManifestPath] : []),
    "--generated-at", generatedAt,
  ]);

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `procurement-${version}-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  const packSummary = [
    "# Procurement Command Pack",
    "",
    `- Version: ${version}`,
    `- Generated: ${generatedAt}`,
    `- Security review pack: ${path.relative(root, securityPackDir).replace(/\\/g, "/")}`,
    "",
    "## Included Outputs",
    "- Security questionnaire",
    "- Architecture one-pager",
    "- Deployment topology sheet",
    "- Data-flow declaration",
    "- Artifact inventory",
    "- Compliance posture summary",
    "- Procurement FAQ",
    "- Version delta since last review",
  ].join("\n");

  writeText(path.join(outDir, "README.md"), packSummary);
  writeText(path.join(outDir, "PROCUREMENT_CHECKLIST.md"), [
    "# Procurement Review Checklist",
    "",
    "- [ ] Security questionnaire attached",
    "- [ ] Architecture and data-flow docs attached",
    "- [ ] Artifact inventory hashes reviewed",
    "- [ ] Delta from prior review accepted",
    "- [ ] Decision log captured",
  ].join("\n"));
  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    version,
    securityPackDir: path.relative(root, securityPackDir).replace(/\\/g, "/"),
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
