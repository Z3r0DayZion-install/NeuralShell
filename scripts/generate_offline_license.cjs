#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { createSignedLicense } = require("../billing/licenseEngine");

function parseArgs(argv) {
  const out = {
    planId: "pro",
    customer: "founder-beta",
    seats: 1,
    expiresAt: "",
    output: ""
  };
  for (const token of argv.slice(2)) {
    if (token.startsWith("--plan=")) out.planId = token.slice("--plan=".length);
    if (token.startsWith("--customer=")) out.customer = token.slice("--customer=".length);
    if (token.startsWith("--seats=")) out.seats = Number(token.slice("--seats=".length));
    if (token.startsWith("--expiresAt=")) out.expiresAt = token.slice("--expiresAt=".length);
    if (token.startsWith("--output=")) out.output = token.slice("--output=".length);
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const license = createSignedLicense({
    planId: args.planId,
    customer: args.customer,
    seats: args.seats,
    expiresAt: args.expiresAt
  });
  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(license, null, 2)}\n`, "utf8");
    process.stdout.write(`${outputPath}\n`);
    return;
  }
  process.stdout.write(`${JSON.stringify(license, null, 2)}\n`);
}

main();
