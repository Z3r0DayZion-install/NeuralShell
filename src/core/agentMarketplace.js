const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..", "..");
const CORE_AGENT_DIR = path.join(ROOT, "agents", "core");
const USER_AGENT_DIR = path.join(os.homedir(), ".neuralshell", "agents");
const MARKETPLACE_CATALOG_PATH = path.join(ROOT, "agents", "marketplace", "catalog.json");
const MARKETPLACE_REPUTATION_SEED_PATH = path.join(ROOT, "agents", "reputation", "install_history.json");
const MARKETPLACE_RULES_PATH = path.join(ROOT, "config", "marketplace_rules.json");
const USER_MARKETPLACE_DIR = path.join(os.homedir(), ".neuralshell", "marketplace");
const USER_RECEIPTS_FILE = path.join(USER_MARKETPLACE_DIR, "install_receipts.json");
const USER_REPUTATION_FILE = path.join(USER_MARKETPLACE_DIR, "install_history.json");

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function loadMarketplaceCatalogMap() {
  const catalog = readJson(MARKETPLACE_CATALOG_PATH, { agents: [] });
  const rows = Array.isArray(catalog && catalog.agents) ? catalog.agents : [];
  const map = new Map();
  for (const row of rows) {
    const id = String(row && row.id ? row.id : "").trim();
    if (!id) continue;
    map.set(id, {
      pricingType: String(row.pricingType || "free").trim().toLowerCase() === "paid" ? "paid" : "free",
      priceUsd: Number.isFinite(Number(row.priceUsd)) ? Number(row.priceUsd) : 0,
      trustBadge: String(row.trustBadge || "community"),
      publisher: String(row.publisher || "Community"),
      community: Boolean(row.community),
      compatibility: row.compatibility && typeof row.compatibility === "object"
        ? {
          minVersion: String(row.compatibility.minVersion || ""),
          maxVersion: String(row.compatibility.maxVersion || "")
        }
        : { minVersion: "", maxVersion: "" }
    });
  }
  return map;
}

function loadMarketplaceRules() {
  return readJson(MARKETPLACE_RULES_PATH, {
    paidInstall: {
      requiredReceiptPattern: "^rcpt_[A-Za-z0-9_-]{8,}$"
    }
  });
}

function loadReceiptStore() {
  return readJson(USER_RECEIPTS_FILE, {
    version: 1,
    receipts: {}
  });
}

function saveReceiptStore(payload) {
  const safe = payload && typeof payload === "object" ? payload : { version: 1, receipts: {} };
  writeJson(USER_RECEIPTS_FILE, safe);
}

function loadMarketplaceReputation() {
  const seed = readJson(MARKETPLACE_REPUTATION_SEED_PATH, { agents: {} });
  const user = readJson(USER_REPUTATION_FILE, { agents: {} });
  const out = {};
  const ids = new Set([
    ...Object.keys(seed && seed.agents ? seed.agents : {}),
    ...Object.keys(user && user.agents ? user.agents : {})
  ]);
  for (const id of ids) {
    const base = seed && seed.agents && seed.agents[id] ? seed.agents[id] : {};
    const extra = user && user.agents && user.agents[id] ? user.agents[id] : {};
    out[id] = {
      rating: Number.isFinite(Number(extra.rating)) ? Number(extra.rating) : Number(base.rating || 0),
      ratingsCount: Number.isFinite(Number(extra.ratingsCount)) ? Number(extra.ratingsCount) : Number(base.ratingsCount || 0),
      installAttempts: Number(extra.installAttempts || 0) + Number(base.installAttempts || 0),
      installSuccess: Number(extra.installSuccess || 0) + Number(base.installSuccess || 0)
    };
  }
  return out;
}

function updateMarketplaceInstallHistory(agentId, success) {
  const safeAgentId = String(agentId || "").trim();
  if (!safeAgentId) return;
  const current = readJson(USER_REPUTATION_FILE, { version: 1, agents: {} });
  const row = current.agents[safeAgentId] || {
    installAttempts: 0,
    installSuccess: 0
  };
  row.installAttempts = Number(row.installAttempts || 0) + 1;
  if (success) {
    row.installSuccess = Number(row.installSuccess || 0) + 1;
  }
  current.agents[safeAgentId] = row;
  writeJson(USER_REPUTATION_FILE, current);
}

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function copyDirRecursive(sourceDir, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function listCoreAgents() {
  if (!fs.existsSync(CORE_AGENT_DIR)) return [];
  const catalog = loadMarketplaceCatalogMap();
  const reputation = loadMarketplaceReputation();
  const entries = fs.readdirSync(CORE_AGENT_DIR, { withFileTypes: true });
  const out = [];
  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;
    const agentRoot = path.join(CORE_AGENT_DIR, dirent.name);
    const manifestPath = path.join(agentRoot, "agent.json");
    const manifest = readJson(manifestPath, null);
    if (!manifest) continue;
    const agentId = String(manifest.id || dirent.name);
    const entryFile = path.join(agentRoot, String(manifest.entry || "index.js"));
    const hash = fs.existsSync(entryFile) ? hashFile(entryFile) : "";
    const listing = catalog.get(agentId) || {
      pricingType: "free",
      priceUsd: 0,
      trustBadge: "community",
      publisher: "Community",
      community: true,
      compatibility: {
        minVersion: "",
        maxVersion: ""
      }
    };
    const history = reputation[agentId] || {
      rating: 0,
      ratingsCount: 0,
      installAttempts: 0,
      installSuccess: 0
    };
    const attempts = Number(history.installAttempts || 0);
    const success = Number(history.installSuccess || 0);
    out.push({
      id: agentId,
      name: String(manifest.name || dirent.name),
      version: String(manifest.version || "0.1.0"),
      description: String(manifest.description || ""),
      entry: String(manifest.entry || "index.js"),
      signature: String(manifest.signature || ""),
      declaredSha256: String(manifest.sha256 || ""),
      computedSha256: hash,
      verified: Boolean(hash && String(manifest.sha256 || "") === hash && String(manifest.signature || "") === `sha256:${hash}`),
      pricingType: listing.pricingType,
      priceUsd: listing.priceUsd,
      paid: listing.pricingType === "paid",
      trustBadge: listing.trustBadge,
      publisher: listing.publisher,
      community: listing.community,
      compatibility: listing.compatibility,
      rating: Number(history.rating || 0),
      ratingsCount: Number(history.ratingsCount || 0),
      installAttempts: attempts,
      installSuccess: success,
      installSuccessRate: attempts > 0 ? Math.round((success / attempts) * 100) : 0,
      sourcePath: agentRoot
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function installAgent(agentId, options = {}) {
  const candidates = listCoreAgents();
  const target = candidates.find((entry) => entry.id === String(agentId || "").trim());
  if (!target) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  if (target.paid) {
    const rules = loadMarketplaceRules();
    const requiredPattern = String(
      rules && rules.paidInstall && rules.paidInstall.requiredReceiptPattern
        ? rules.paidInstall.requiredReceiptPattern
        : "^rcpt_[A-Za-z0-9_-]{8,}$"
    );
    const regex = new RegExp(requiredPattern);
    const receipts = loadReceiptStore();
    const existing = receipts && receipts.receipts ? receipts.receipts[target.id] : null;
    const receiptCode = String(options.receiptCode || "").trim();
    if (!existing && !regex.test(receiptCode)) {
      updateMarketplaceInstallHistory(target.id, false);
      throw new Error(`Paid agent receipt required for ${target.id}.`);
    }
    if (regex.test(receiptCode)) {
      const next = receipts && receipts.receipts ? receipts : { version: 1, receipts: {} };
      next.receipts[target.id] = {
        code: receiptCode,
        activatedAt: new Date().toISOString(),
        source: "local"
      };
      saveReceiptStore(next);
    }
  }
  if (!target.verified) {
    updateMarketplaceInstallHistory(target.id, false);
    throw new Error(`Agent signature/SHA verification failed for ${target.id}`);
  }

  const installPath = path.join(USER_AGENT_DIR, target.id);
  if (fs.existsSync(installPath)) {
    fs.rmSync(installPath, { recursive: true, force: true });
  }
  copyDirRecursive(target.sourcePath, installPath);
  updateMarketplaceInstallHistory(target.id, true);
  const receipts = loadReceiptStore();
  const receipt = receipts && receipts.receipts ? receipts.receipts[target.id] : null;
  return {
    ok: true,
    id: target.id,
    installPath,
    sha256: target.computedSha256,
    pricingType: target.pricingType,
    receipt
  };
}

async function runAgentInSandbox(agentId, context = {}) {
  const target = listCoreAgents().find((entry) => entry.id === String(agentId || "").trim());
  if (!target) throw new Error(`Agent not found: ${agentId}`);
  if (!target.verified) throw new Error(`Agent is not verified: ${target.id}`);

  const entryPath = path.join(target.sourcePath, target.entry);
  const source = fs.readFileSync(entryPath, "utf8");
  const sandbox = {
    module: { exports: {} },
    exports: {},
    require: undefined,
    console: {
      log: () => {}
    }
  };
  vm.createContext(sandbox, {
    name: `agent:${target.id}`
  });
  const script = new vm.Script(source, {
    filename: entryPath
  });
  script.runInContext(sandbox, {
    timeout: 1000
  });
  const exported = sandbox.module.exports || sandbox.exports;
  if (typeof exported !== "function") {
    throw new Error(`Agent entry must export a function: ${target.id}`);
  }
  const output = await Promise.resolve(exported(context));
  return {
    ok: true,
    agentId: target.id,
    output
  };
}

module.exports = {
  listCoreAgents,
  installAgent,
  runAgentInSandbox,
  listInstallReceipts: () => loadReceiptStore()
};
