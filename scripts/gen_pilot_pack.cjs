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

function toSafeSlug(value, fallback = "pilot") {
  const safe = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return safe || fallback;
}

function readMaybe(filePath, fallback = "") {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return fallback;
  }
}

function writeText(filePath, text) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${String(text || "").trim()}\n`, "utf8");
}

function applyTemplate(template, vars) {
  return Object.entries(vars).reduce((acc, [key, value]) => (
    acc.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value))
  ), String(template || ""));
}

function copyIfExists(fromPath, toPath) {
  if (!fs.existsSync(fromPath)) return false;
  fs.mkdirSync(path.dirname(toPath), { recursive: true });
  fs.copyFileSync(fromPath, toPath);
  return true;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = process.cwd();
  const customerName = String(args.customer || "Acme Security Group").trim();
  const industry = String(args.industry || "critical-infrastructure").trim();
  const useCase = String(args["use-case"] || "secure release verification").trim();
  const logoInput = String(args.logo || "assets/pilot_kit/customer_logo.png").trim();
  const outputRoot = path.resolve(root, String(args["output-root"] || "release/pilot-pack"));
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(outputRoot, `${toSafeSlug(customerName, "customer")}-${timestamp}`);
  const logoResolved = path.resolve(root, logoInput);

  const vars = {
    customerName,
    industry,
    useCase,
    generatedAt: new Date().toISOString()
  };

  const templatesDir = path.resolve(root, "assets/pilot_kit");
  const securityOverviewTemplate = readMaybe(
    path.join(templatesDir, "security_overview.md"),
    "# Security Overview\n\nCustomer: {{customerName}}\nIndustry: {{industry}}\nUse Case: {{useCase}}"
  );
  const proofChecklistTemplate = readMaybe(
    path.join(templatesDir, "proof_checklist.md"),
    "# Proof Checklist\n\n- [ ] Collect `/proof` output for {{customerName}}\n- [ ] Export support bundle"
  );
  const roiWorksheetTemplate = readMaybe(
    path.join(templatesDir, "roi_worksheet.csv"),
    "customer,industry,use_case,baseline_hours_saved_per_week,target_team_size,hourly_cost_usd\n{{customerName}},{{industry}},{{useCase}},12,8,125"
  );
  const supportContactsTemplate = readMaybe(
    path.join(templatesDir, "support_contacts.md"),
    "# Support Contacts\n\n- Primary: support@neuralshell.app\n- Escalation: founder@neuralshell.app"
  );

  const deploymentGuide = readMaybe(
    path.resolve(root, "docs/deployment/enterprise.md"),
    "# Deployment Guide\n\nNo deployment guide found."
  );
  const soc2Prep = readMaybe(
    path.resolve(root, "SOC2_PREP_REPORT.md"),
    "# SOC2 Prep Report\n\nNo SOC2 prep report found."
  );
  const pilotChecklist = readMaybe(
    path.resolve(root, "docs/pilots/PILOT_TESTER_CHECKLIST.md"),
    "# Pilot Tester Checklist\n\nNo pilot checklist found."
  );

  writeText(
    path.join(outDir, "README.md"),
    [
      `# NeuralShell Pilot Pack - ${customerName}`,
      "",
      `- Customer: ${customerName}`,
      `- Industry: ${industry}`,
      `- Use Case: ${useCase}`,
      `- Generated: ${vars.generatedAt}`,
      "",
      "## Contents",
      "1. Security overview",
      "2. Deployment guide",
      "3. Proof checklist",
      "4. ROI worksheet",
      "5. Support contacts",
      "6. Source documents"
    ].join("\n")
  );
  writeText(path.join(outDir, "01_security_overview.md"), applyTemplate(securityOverviewTemplate, vars));
  writeText(path.join(outDir, "02_deployment_guide.md"), deploymentGuide);
  writeText(path.join(outDir, "03_proof_checklist.md"), applyTemplate(proofChecklistTemplate, vars));
  writeText(path.join(outDir, "04_roi_worksheet.csv"), applyTemplate(roiWorksheetTemplate, vars));
  writeText(path.join(outDir, "05_support_contacts.md"), applyTemplate(supportContactsTemplate, vars));
  writeText(
    path.join(outDir, "06_use_case_brief.md"),
    [
      `# Use Case Brief: ${customerName}`,
      "",
      `NeuralShell pilot focus for ${industry}:`,
      `- Primary objective: ${useCase}`,
      "- Success metric: Complete proof + deployment review in 14 days.",
      "- Exit criteria: Security review cleared and renewal path defined."
    ].join("\n")
  );

  writeText(path.join(outDir, "source_docs", "SOC2_PREP_REPORT.md"), soc2Prep);
  writeText(path.join(outDir, "source_docs", "enterprise_deployment.md"), deploymentGuide);
  writeText(path.join(outDir, "source_docs", "pilot_tester_checklist.md"), pilotChecklist);

  let copiedLogo = "";
  if (copyIfExists(logoResolved, path.join(outDir, "assets", path.basename(logoResolved)))) {
    copiedLogo = path.join("assets", path.basename(logoResolved));
  } else {
    writeText(
      path.join(outDir, "assets", "logo_placeholder.txt"),
      `Logo not found at ${logoInput}. Provide --logo <path> to include a customer logo.`
    );
    copiedLogo = "assets/logo_placeholder.txt";
  }

  writeJson(path.join(outDir, "manifest.json"), {
    generatedAt: vars.generatedAt,
    customerName,
    industry,
    useCase,
    logoInput,
    includedLogo: copiedLogo,
    files: [
      "README.md",
      "01_security_overview.md",
      "02_deployment_guide.md",
      "03_proof_checklist.md",
      "04_roi_worksheet.csv",
      "05_support_contacts.md",
      "06_use_case_brief.md",
      "source_docs/SOC2_PREP_REPORT.md",
      "source_docs/enterprise_deployment.md",
      "source_docs/pilot_tester_checklist.md",
      copiedLogo
    ]
  });

  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  main();
}
