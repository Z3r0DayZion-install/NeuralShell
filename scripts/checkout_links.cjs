#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const PLANS_PATH = path.resolve(process.cwd(), "config", "plans.json");
const OUTPUT_JSON = path.resolve(process.cwd(), "docs", "billing", "checkout_links.json");
const OUTPUT_MD = path.resolve(process.cwd(), "docs", "billing", "CHECKOUT_LINKS.md");

function readPlans() {
  const parsed = JSON.parse(fs.readFileSync(PLANS_PATH, "utf8"));
  const plans = Array.isArray(parsed && parsed.plans) ? parsed.plans : [];
  return plans.map((plan) => {
    const checkout = plan && plan.checkout ? plan.checkout : {};
    return {
      id: String(plan.id || ""),
      label: String(plan.label || plan.id || ""),
      priceUsd: Number(plan.priceUsd || 0),
      billingPeriod: String(plan.billingPeriod || "once"),
      gumroad: String(checkout.gumroad || ""),
      stripe: String(checkout.stripe || ""),
      manualInvoice: Boolean(checkout.manualInvoice),
      invoiceUrl: String(checkout.invoiceUrl || ""),
    };
  });
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function buildMarkdown(plans) {
  const lines = [
    "# Checkout Links",
    "",
    "Generated from `config/plans.json`.",
    "",
    "| Plan | Price | Gumroad | Stripe | Invoice |",
    "| --- | --- | --- | --- | --- |",
  ];
  for (const plan of plans) {
    lines.push(
      `| ${plan.label} | $${plan.priceUsd} / ${plan.billingPeriod} | ${
        plan.gumroad ? `[Open](${plan.gumroad})` : "-"
      } | ${
        plan.stripe ? `[Open](${plan.stripe})` : "-"
      } | ${
        plan.manualInvoice ? (plan.invoiceUrl ? `[Request](${plan.invoiceUrl})` : "Manual") : "-"
      } |`
    );
  }
  lines.push("");
  lines.push("> Enterprise buyers can request invoice/demo from the invoice link.");
  lines.push("");
  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(PLANS_PATH)) {
    throw new Error(`Missing plans manifest: ${PLANS_PATH}`);
  }
  const plans = readPlans();
  const payload = {
    generatedAt: new Date().toISOString(),
    plans,
  };
  ensureDir(OUTPUT_JSON);
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUTPUT_MD, `${buildMarkdown(plans)}\n`, "utf8");
  process.stdout.write(`${OUTPUT_JSON}\n${OUTPUT_MD}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  readPlans,
  buildMarkdown,
};
