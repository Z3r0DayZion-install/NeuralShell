const fs = require("fs");
const path = require("path");

const TIERS_PATH = path.resolve(process.cwd(), "config", "tiers.json");

function loadTiersConfig() {
  if (!fs.existsSync(TIERS_PATH)) {
    return { version: 1, defaultTier: "free", tiers: [] };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(TIERS_PATH, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : { version: 1, defaultTier: "free", tiers: [] };
  } catch {
    return { version: 1, defaultTier: "free", tiers: [] };
  }
}

function tierFromLicenseMode(licenseMode) {
  const mode = String(licenseMode || "").trim().toLowerCase();
  if (mode === "operator" || mode === "pro") return "pro";
  if (mode === "enterprise") return "enterprise";
  return "free";
}

function resolveTierDefinition(config, tierId) {
  const tiers = Array.isArray(config && config.tiers) ? config.tiers : [];
  return tiers.find((tier) => String(tier && tier.id ? tier.id : "") === String(tierId || ""))
    || tiers.find((tier) => String(tier && tier.id ? tier.id : "") === String(config.defaultTier || "free"))
    || { id: "free", label: "Audit-Only", capabilities: [] };
}

function resolveCapabilities(licenseMode) {
  const config = loadTiersConfig();
  const tierId = tierFromLicenseMode(licenseMode);
  const tier = resolveTierDefinition(config, tierId);
  const capabilities = Array.from(new Set(
    (Array.isArray(tier.capabilities) ? tier.capabilities : [])
      .map((entry) => String(entry || "").trim())
      .filter(Boolean)
  ));
  return {
    tierId: String(tier.id || tierId || "free"),
    tierLabel: String(tier.label || "Audit-Only"),
    capabilities
  };
}

function hasCapability(capabilitiesPayload, capabilityId) {
  const list = Array.isArray(capabilitiesPayload && capabilitiesPayload.capabilities)
    ? capabilitiesPayload.capabilities
    : [];
  return list.includes(String(capabilityId || ""));
}

module.exports = {
  loadTiersConfig,
  resolveCapabilities,
  hasCapability,
  tierFromLicenseMode
};
