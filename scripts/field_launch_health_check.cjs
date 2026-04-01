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

function daysSince(filePath) {
  if (!fs.existsSync(filePath)) return 999;
  const mtime = fs.statSync(filePath).mtimeMs;
  return Math.floor((Date.now() - mtime) / (24 * 60 * 60 * 1000));
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const outRoot = toAbs(root, String(args["output-root"] || "release/field-launch"));
  const freshnessDays = Math.max(1, Number(args["freshness-days"] || 14));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());

  const checks = [
    {
      label: "Demo system docs",
      path: path.resolve(root, "docs/demo/INSTITUTIONAL_DEMO_SYSTEM.md"),
    },
    {
      label: "Deployment program docs",
      path: path.resolve(root, "docs/deployment/DEPLOYMENT_PROGRAM_PACK.md"),
    },
    {
      label: "Training delivery docs",
      path: path.resolve(root, "docs/training/TRAINING_DELIVERY_PACK.md"),
    },
    {
      label: "Support ops docs",
      path: path.resolve(root, "docs/support/SUPPORT_OPERATIONS_PACK.md"),
    },
    {
      label: "Buyer journey docs",
      path: path.resolve(root, "docs/buyer/EVALUATION_JOURNEY.md"),
    },
    {
      label: "Pilot conversion docs",
      path: path.resolve(root, "docs/pilot/PILOT_CONVERSION_KIT.md"),
    },
    {
      label: "Commercial matrix docs",
      path: path.resolve(root, "docs/commercial/SKU_MATRIX.md"),
    },
    {
      label: "Field launch docs",
      path: path.resolve(root, "docs/launch/FIELD_LAUNCH_COMMAND_CENTER.md"),
    },
  ].map((entry) => {
    const exists = fs.existsSync(entry.path);
    const ageDays = exists ? daysSince(entry.path) : 999;
    return {
      label: entry.label,
      path: path.relative(root, entry.path).replace(/\\/g, "/"),
      exists,
      ageDays,
      fresh: exists && ageDays <= freshnessDays,
    };
  });

  const passed = checks.every((entry) => entry.exists && entry.fresh);
  const report = {
    schema: "neuralshell_field_launch_health_v1",
    generatedAt,
    freshnessDays,
    passed,
    checks,
    blockers: checks
      .filter((entry) => !entry.exists || !entry.fresh)
      .map((entry) => ({ label: entry.label, reason: entry.exists ? `stale:${entry.ageDays}d` : "missing" })),
  };

  fs.mkdirSync(outRoot, { recursive: true });
  const outPath = path.join(outRoot, "field-launch-health.json");
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  checks.forEach((entry) => {
    process.stdout.write(`[${entry.exists ? (entry.fresh ? "PASS" : "STALE") : "MISS"}] ${entry.label} :: ${entry.path} (${entry.ageDays}d)\n`);
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
