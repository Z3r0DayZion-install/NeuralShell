"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { canonicalPayload, hmacSha256Hex } = require("../src/license/validator.cjs");

function fail(msg) {
  process.stderr.write(`[license-batch] FAIL ${msg}\n`);
  process.exit(1);
}

function nowIsoNoColons() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(p, obj) {
  mkdirp(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

function argValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  const v = process.argv[idx + 1];
  return typeof v === "string" ? v : null;
}

function sha256Hex(s) {
  return crypto.createHash("sha256").update(String(s), "utf8").digest("hex");
}

function parseEmailsFromCsv(csvText) {
  const raw = String(csvText || "").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.includes(",") || line.includes("\t") || line.includes(" ")) {
      fail(`invalid CSV at line ${i + 1} (expected one email per line)`);
    }
    if (!line.includes("@")) {
      fail(`invalid email at line ${i + 1}`);
    }
    out.push(line);
  }
  if (!out.length) fail("CSV contained no emails");
  return out;
}

function main() {
  const csvArg = argValue("--csv");
  const tier = argValue("--tier");
  const expiresAtRaw = argValue("--expiresAt");

  if (!csvArg) fail("missing --csv");
  if (!tier) fail("missing --tier");
  if (!expiresAtRaw) fail("missing --expiresAt");

  const secret = process.env.LICENSE_HMAC_SECRET;
  if (!secret) fail("missing env LICENSE_HMAC_SECRET");

  const expiresMs = Date.parse(String(expiresAtRaw));
  if (!Number.isFinite(expiresMs)) fail("invalid --expiresAt (must be ISO-8601)");
  const expiresAt = new Date(expiresMs).toISOString();

  const csvPath = path.resolve(csvArg);
  if (!fs.existsSync(csvPath)) fail(`missing CSV file: ${csvPath}`);
  const csvText = fs.readFileSync(csvPath, "utf8");
  const emails = parseEmailsFromCsv(csvText);

  const seen = new Set();
  const items = [];
  for (const email of emails) {
    const normalized = String(email).trim().toLowerCase();
    if (seen.has(normalized)) fail(`duplicate email: ${email}`);
    seen.add(normalized);
    const emailHash = sha256Hex(normalized);
    const filename = `license_${emailHash}.json`;
    const subject = `email_sha256:${emailHash}`;
    const payload = canonicalPayload({ tier, expiresAt, subject });
    const sig = hmacSha256Hex(secret, payload);
    items.push({ emailHash, filename, license: { tier, expiresAt, subject, sig } });
  }

  items.sort((a, b) => a.emailHash.localeCompare(b.emailHash));

  const issuedAt = new Date().toISOString();
  const outDir = path.join(process.cwd(), "release", "licenses", `issued_${nowIsoNoColons()}`);
  mkdirp(outDir);

  for (const it of items) {
    writeJson(path.join(outDir, it.filename), it.license);
  }

  const index = {
    issuedAt,
    tier,
    expiresAt,
    total: items.length,
    licenses: items.map((it) => ({ email_hash: it.emailHash, license_filename: it.filename }))
  };
  writeJson(path.join(outDir, "ISSUED_INDEX.json"), index);

  process.stdout.write(`[license-batch] PASS count=${items.length} out=${outDir}\n`);
}

main();

