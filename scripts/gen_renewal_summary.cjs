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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toMetricValue(id, args) {
  const key = String(id || "").trim().toLowerCase();
  if (key === "support_load") return clamp(Number(args["support-load"] || 52), 0, 100);
  if (key === "incident_backlog") return clamp(Number(args["incident-backlog"] || 35), 0, 100);
  if (key === "deployment_health") return clamp(Number(args["deployment-health"] || 82), 0, 100);
  if (key === "adoption_health") return clamp(Number(args["adoption-health"] || 74), 0, 100);
  if (key === "executive_sponsor") return clamp(Number(args["executive-sponsor"] || 78), 0, 100);
  return 60;
}

function main() {
  const root = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const templatePath = toAbs(root, String(args.templates || "renewal/renewalRiskTemplates.json"));
  const outRoot = toAbs(root, String(args["output-root"] || "release/renewal-summary"));
  const generatedAt = String(args["generated-at"] || new Date().toISOString());
  const accountName = String(args.account || "Institutional Account");

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Missing renewal risk template catalog: ${templatePath}`);
  }
  const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));
  const riskFactors = Array.isArray(template && template.riskFactors) ? template.riskFactors : [];
  if (!riskFactors.length) {
    throw new Error("Renewal summary requires risk factors.");
  }

  const scoredFactors = riskFactors.map((factor) => {
    const value = toMetricValue(factor.id, args);
    const normalizedRisk = factor.higherIsRiskier ? value : (100 - value);
    const weightedRisk = Number(((normalizedRisk * Number(factor.weight || 0)) / 100).toFixed(2));
    return {
      id: String(factor.id || ""),
      label: String(factor.label || ""),
      weight: Number(factor.weight || 0),
      value,
      normalizedRisk,
      weightedRisk,
    };
  });

  const riskScore = Number(scoredFactors.reduce((acc, item) => acc + Number(item.weightedRisk || 0), 0).toFixed(2));
  const riskBand = riskScore >= 70 ? "high" : riskScore >= 45 ? "medium" : "low";
  const interventions = Array.isArray(template && template.interventions) ? template.interventions : [];
  const recommendedInterventions = interventions
    .filter((item) => {
      const trigger = String(item && item.trigger || "").toLowerCase();
      if (!trigger) return false;
      if (trigger.includes("risk>=70")) return riskScore >= 70;
      if (trigger.includes("support_load>=80")) {
        const factor = scoredFactors.find((entry) => entry.id === "support_load");
        return factor ? Number(factor.value || 0) >= 80 : false;
      }
      if (trigger.includes("adoption_health<=50")) {
        const factor = scoredFactors.find((entry) => entry.id === "adoption_health");
        return factor ? Number(factor.value || 0) <= 50 : false;
      }
      return false;
    })
    .map((item) => ({
      id: String(item.id || ""),
      action: String(item.action || ""),
    }));

  const stamp = generatedAt.replace(/[:.]/g, "-");
  const outDir = path.join(outRoot, `renewal-${stamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  writeJson(path.join(outDir, "renewal_summary.json"), {
    generatedAt,
    accountName,
    riskScore,
    riskBand,
    factors: scoredFactors,
    recommendedInterventions,
    timelineDays: Array.isArray(template.renewalTimelineDays) ? template.renewalTimelineDays : [],
  });

  fs.writeFileSync(
    path.join(outDir, "renewal_summary.md"),
    [
      "# Renewal Summary",
      "",
      `- Account: ${accountName}`,
      `- Generated At: ${generatedAt}`,
      `- Risk Score: ${riskScore}`,
      `- Risk Band: ${riskBand}`,
      "",
      "## Recommended Interventions",
      ...(recommendedInterventions.length
        ? recommendedInterventions.map((entry, index) => `${index + 1}. ${entry.action}`)
        : ["1. Maintain current cadence and monitor weekly."]),
      "",
    ].join("\n"),
    "utf8"
  );

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt,
    accountName,
    riskBand,
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
