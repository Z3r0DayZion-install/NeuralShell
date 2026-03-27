const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PLANS_PATH = path.resolve(process.cwd(), "config", "plans.json");
const SIGNING_KEY = String(process.env.NS_LICENSE_SIGNING_KEY || "neuralshell-license-dev-signing-key-v1");

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function loadPlansConfig() {
  return readJson(PLANS_PATH, {
    version: 1,
    defaultPlan: "free",
    plans: []
  });
}

function listPlans() {
  const config = loadPlansConfig();
  return Array.isArray(config.plans) ? config.plans : [];
}

function getPlan(planId) {
  const plans = listPlans();
  const safeId = String(planId || "").trim().toLowerCase();
  const fallbackId = String(loadPlansConfig().defaultPlan || "free");
  return plans.find((plan) => String(plan.id || "").toLowerCase() === safeId)
    || plans.find((plan) => String(plan.id || "").toLowerCase() === fallbackId.toLowerCase())
    || {
      id: "free",
      label: "Free",
      seats: 1,
      graceDays: 0,
      capabilities: []
    };
}

function stableStringify(payload) {
  return JSON.stringify(payload, Object.keys(payload).sort());
}

function signPayload(payload) {
  const canonical = stableStringify(payload);
  return crypto.createHmac("sha256", SIGNING_KEY).update(canonical).digest("hex");
}

function parseIsoDate(value) {
  const safe = String(value || "").trim();
  if (!safe) return null;
  const date = new Date(safe);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function getPlanCapabilities(plan, payload) {
  const payloadCaps = Array.isArray(payload && payload.capabilities)
    ? payload.capabilities.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  if (payloadCaps.length) return Array.from(new Set(payloadCaps));
  return Array.from(new Set(
    (Array.isArray(plan && plan.capabilities) ? plan.capabilities : [])
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
  ));
}

function evaluateDates(payload, plan, nowDate = new Date()) {
  const now = nowDate instanceof Date ? nowDate : new Date(nowDate);
  const expiresAt = parseIsoDate(payload && payload.expiresAt);
  const graceDays = Number.isFinite(Number(payload && payload.graceDays))
    ? Number(payload.graceDays)
    : Number(plan && plan.graceDays ? plan.graceDays : 0);
  if (!expiresAt) {
    return {
      status: "active",
      expiresAt: "",
      graceEndsAt: "",
      graceRemainingDays: 0
    };
  }

  if (now.getTime() <= expiresAt.getTime()) {
    return {
      status: "active",
      expiresAt: expiresAt.toISOString(),
      graceEndsAt: "",
      graceRemainingDays: 0
    };
  }

  const graceMs = Math.max(0, graceDays) * 24 * 60 * 60 * 1000;
  const graceEndsAt = new Date(expiresAt.getTime() + graceMs);
  if (graceMs > 0 && now.getTime() <= graceEndsAt.getTime()) {
    const remainingMs = Math.max(0, graceEndsAt.getTime() - now.getTime());
    const graceRemainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return {
      status: "grace",
      expiresAt: expiresAt.toISOString(),
      graceEndsAt: graceEndsAt.toISOString(),
      graceRemainingDays
    };
  }

  return {
    status: "expired",
    expiresAt: expiresAt.toISOString(),
    graceEndsAt: graceMs > 0 ? graceEndsAt.toISOString() : "",
    graceRemainingDays: 0
  };
}

function verifyLicenseBlob(rawBlob, options = {}) {
  const blob = rawBlob && typeof rawBlob === "object" ? rawBlob : {};
  const payload = blob.payload && typeof blob.payload === "object" ? blob.payload : null;
  const signature = String(blob.signature || "").trim();
  if (!payload || !signature) {
    return {
      ok: false,
      status: "invalid",
      reason: "license_payload_or_signature_missing"
    };
  }

  const expected = signPayload(payload);
  if (expected !== signature) {
    return {
      ok: false,
      status: "invalid",
      reason: "license_signature_mismatch"
    };
  }

  const plan = getPlan(payload.planId);
  const dateStatus = evaluateDates(payload, plan, options.now || new Date());
  const seats = Number.isFinite(Number(payload.seats))
    ? Number(payload.seats)
    : Number(plan.seats || 1);

  return {
    ok: dateStatus.status === "active" || dateStatus.status === "grace",
    status: dateStatus.status,
    reason: "",
    licenseId: String(payload.licenseId || "").trim() || "unknown",
    customer: String(payload.customer || "").trim(),
    planId: String(plan.id || "free"),
    planLabel: String(plan.label || "Free"),
    seats: Math.max(1, seats),
    capabilities: getPlanCapabilities(plan, payload),
    issuedAt: parseIsoDate(payload.issuedAt) ? new Date(payload.issuedAt).toISOString() : "",
    expiresAt: dateStatus.expiresAt,
    graceEndsAt: dateStatus.graceEndsAt,
    graceRemainingDays: dateStatus.graceRemainingDays,
    signature
  };
}

function createSignedLicense(payload = {}) {
  const plan = getPlan(payload.planId || "free");
  const nowIso = new Date().toISOString();
  const safePayload = {
    licenseId: String(payload.licenseId || `lic_${Date.now()}`),
    customer: String(payload.customer || "unknown"),
    planId: String(plan.id || "free"),
    seats: Number.isFinite(Number(payload.seats)) ? Number(payload.seats) : Number(plan.seats || 1),
    issuedAt: String(payload.issuedAt || nowIso),
    expiresAt: String(payload.expiresAt || ""),
    graceDays: Number.isFinite(Number(payload.graceDays)) ? Number(payload.graceDays) : Number(plan.graceDays || 0),
    capabilities: Array.isArray(payload.capabilities) ? payload.capabilities : undefined
  };
  if (!safePayload.expiresAt) {
    delete safePayload.expiresAt;
  }
  if (!safePayload.capabilities) {
    delete safePayload.capabilities;
  }
  return {
    version: 1,
    payload: safePayload,
    signature: signPayload(safePayload)
  };
}

function planIdToLicenseMode(planId) {
  const safe = String(planId || "").trim().toLowerCase();
  if (safe === "enterprise") return "enterprise";
  if (safe === "pro") return "operator";
  return "preview";
}

module.exports = {
  listPlans,
  getPlan,
  loadPlansConfig,
  signPayload,
  verifyLicenseBlob,
  createSignedLicense,
  planIdToLicenseMode
};
