#!/usr/bin/env node
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function randomCode(prefix = "NSREF") {
  return `${prefix}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

function buildReferralLink(baseUrl, code, utm = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set("ref", code);
  url.searchParams.set("utm_source", String(utm.source || "referral"));
  url.searchParams.set("utm_medium", String(utm.medium || "partner"));
  url.searchParams.set("utm_campaign", String(utm.campaign || "growth-delta9"));
  return url.toString();
}

function parseArgs(argv) {
  const out = {
    base: "https://gumroad.com/l/neuralshell-operator",
    code: "",
    output: "",
  };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith("--base=")) out.base = arg.slice("--base=".length);
    if (arg.startsWith("--code=")) out.code = arg.slice("--code=".length);
    if (arg.startsWith("--output=")) out.output = arg.slice("--output=".length);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const code = String(args.code || "").trim() || randomCode();
  const link = buildReferralLink(args.base, code);
  const payload = {
    generatedAt: new Date().toISOString(),
    code,
    base: args.base,
    link,
  };
  if (args.output) {
    const outPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    process.stdout.write(`${outPath}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  randomCode,
  buildReferralLink,
};
