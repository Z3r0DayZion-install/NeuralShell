"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function safeIso(iso) {
  if (typeof iso !== "string") return null;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return d.toISOString();
}

function canonicalPayload({ tier, expiresAt, subject }) {
  const t = typeof tier === "string" ? tier.trim() : "";
  const e = safeIso(expiresAt) || "";
  const s = typeof subject === "string" ? subject : "";
  return `tier=${t}\nexpiresAt=${e}\nsubject=${s}\n`;
}

function hmacSha256Hex(secret, payload) {
  return crypto.createHmac("sha256", String(secret)).update(String(payload), "utf8").digest("hex");
}

function resolveDefaultAppRoot() {
  // pkg / TEAR runtime EXE: license.json should sit next to the .exe
  if (process.pkg) return path.dirname(process.execPath);
  // Node runtime: default to current working directory
  return process.cwd();
}

function validateLicenseObject({ licenseObj, secret, nowMs }) {
  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const tier = typeof licenseObj?.tier === "string" ? licenseObj.tier : "";
  const expiresAt = typeof licenseObj?.expiresAt === "string" ? licenseObj.expiresAt : "";
  const subject = typeof licenseObj?.subject === "string" ? licenseObj.subject : "";
  const sig = typeof licenseObj?.sig === "string" ? licenseObj.sig : "";

  const iso = safeIso(expiresAt);
  if (!iso) {
    return { ok: false, mode: "restricted", status: "invalid", tier: tier || null, expiresAt: null, reason: "invalid-expiresAt" };
  }

  const expMs = Date.parse(iso);
  if (Number.isFinite(expMs) && expMs < now) {
    return { ok: false, mode: "restricted", status: "expired", tier: tier || null, expiresAt: iso, reason: "expired" };
  }

  const payload = canonicalPayload({ tier, expiresAt: iso, subject });
  const expected = hmacSha256Hex(secret, payload);
  if (!sig || sig !== expected) {
    return { ok: false, mode: "restricted", status: "invalid_signature", tier: tier || null, expiresAt: iso, reason: "bad-signature" };
  }

  return { ok: true, mode: "full", status: "valid", tier: tier || null, expiresAt: iso, reason: "ok" };
}

function validateLicenseFromDisk({ appRoot, secret, nowMs }) {
  const root = appRoot || resolveDefaultAppRoot();
  const filePath = path.join(root, "license.json");
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const obj = JSON.parse(raw);
    const res = validateLicenseObject({ licenseObj: obj, secret, nowMs });
    return { ...res, filePath };
  } catch (err) {
    if (err && (err.code === "ENOENT" || err.code === "ENOTDIR")) {
      return { ok: false, mode: "restricted", status: "missing", tier: null, expiresAt: null, reason: "missing", filePath };
    }
    return { ok: false, mode: "restricted", status: "invalid", tier: null, expiresAt: null, reason: "parse-failed", filePath };
  }
}

module.exports = {
  canonicalPayload,
  hmacSha256Hex,
  resolveDefaultAppRoot,
  validateLicenseObject,
  validateLicenseFromDisk
};
