#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PACKAGE_JSON = path.join(ROOT, "package.json");
const PROOF_SUMMARY = path.join(ROOT, "release", "proof-bundle-summary.json");
const PACKAGED_PROOF = path.join(ROOT, "release", "ui-self-sell-proof-report-packaged.json");
const TEMPLATES_DIR = path.join(ROOT, "docs", "marketing", "templates");
const OUTPUT_DIR = path.join(ROOT, "release", "launch-pack");

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function readTemplate(name, fallback) {
  const filePath = path.join(TEMPLATES_DIR, name);
  if (!fs.existsSync(filePath)) return fallback;
  return fs.readFileSync(filePath, "utf8");
}

function applyTemplate(template, vars) {
  return Object.entries(vars).reduce((text, [key, value]) => (
    text.replace(new RegExp(`{{\\s*${key}\\s*}}`, "g"), String(value))
  ), template);
}

function summarizeProof(proof, packaged) {
  const summary = proof && proof.summary ? proof.summary : {};
  const screens = packaged && Array.isArray(packaged.screenshots) ? packaged.screenshots : [];
  const passCount = Number(summary.passCount || 0);
  const failCount = Number(summary.failCount || 0);
  return {
    proofStatus: failCount === 0 ? "PASS" : "WARN",
    passCount,
    failCount,
    screenshotCount: screens.length,
  };
}

function buildVars() {
  const pkg = readJson(PACKAGE_JSON, { version: "0.0.0" });
  const proof = readJson(PROOF_SUMMARY, {});
  const packaged = readJson(PACKAGED_PROOF, {});
  const proofSummary = summarizeProof(proof, packaged);
  const version = String(pkg.version || "0.0.0");
  return {
    version,
    releaseTag: `growth-delta9-v${version}`,
    proofStatus: proofSummary.proofStatus,
    passCount: proofSummary.passCount,
    failCount: proofSummary.failCount,
    screenshotCount: proofSummary.screenshotCount,
    badgeUrl: "https://raw.githubusercontent.com/Z3r0DayZion-install/NeuralShell/badges/proof_badge.svg",
    docsUrl: "https://github.com/Z3r0DayZion-install/NeuralShell/tree/master/docs",
    pricingUrl: "landing/pricing.html",
    partnersUrl: "landing/partners.html",
  };
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${content.trim()}\n`, "utf8");
}

function main() {
  const vars = buildVars();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.join(OUTPUT_DIR, stamp);

  const templates = {
    x: readTemplate("x_post.md", "NeuralShell {{version}} is live. Proof {{proofStatus}} ({{passCount}} checks). Pricing: {{pricingUrl}}"),
    discord: readTemplate("discord_announcement.md", "NeuralShell {{version}} release\nProof: {{proofStatus}}\nBadge: {{badgeUrl}}"),
    reddit: readTemplate("reddit_post.md", "NeuralShell {{version}} launched. Offline-first AI shell with proof-first workflow."),
    email: readTemplate("email_launch.md", "Subject: NeuralShell {{version}} launch\nProof status: {{proofStatus}}\nDocs: {{docsUrl}}"),
    changelog: readTemplate("changelog_snippet.md", "## Growth Wave Δ9\n- Plans + offline licensing\n- Marketplace monetization\n- Referral + launch pack generator"),
  };

  for (const [name, template] of Object.entries(templates)) {
    const rendered = applyTemplate(template, vars);
    writeFile(path.join(outDir, `${name}.md`), rendered);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    outputDir: outDir,
    vars,
    files: Object.keys(templates).map((name) => `${name}.md`),
  };
  writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  process.stdout.write(`${outDir}\n`);
}

if (require.main === module) {
  main();
}
