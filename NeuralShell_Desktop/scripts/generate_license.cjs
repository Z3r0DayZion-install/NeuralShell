"use strict";

const fs = require("fs");
const path = require("path");
const { canonicalPayload, hmacSha256Hex } = require("../src/license/validator.cjs");

function argValue(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return def;
  const v = process.argv[idx + 1];
  return typeof v === "string" ? v : def;
}

function fail(msg) {
  process.stderr.write(`[license-gen] FAIL ${msg}\n`);
  process.exit(1);
}

function main() {
  const tier = argValue("--tier", "beta");
  const expiresAt = argValue("--expiresAt", new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString());
  const subject = argValue("--subject", "local");
  const outPath = path.resolve(argValue("--out", "license.json"));

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) fail("missing env LICENSE_HMAC_SECRET");

  const payload = canonicalPayload({ tier, expiresAt, subject });
  const sig = hmacSha256Hex(secret, payload);

  const license = { tier, expiresAt: new Date(Date.parse(expiresAt)).toISOString(), subject, sig };
  fs.writeFileSync(outPath, JSON.stringify(license, null, 2) + "\n", "utf8");
  process.stdout.write(`[license-gen] PASS out=${outPath}\n`);
}

main();

