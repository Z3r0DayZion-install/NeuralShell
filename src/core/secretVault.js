const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const SERVICE_NAME = "NeuralShell.KeyVaultPlus";
const FALLBACK_FILE_NAME = "vault-plus.json";
const VAULT_AAD = Buffer.from("NeuralShell.VaultPlus.v1", "utf8");
const EXPORT_AAD = Buffer.from("NeuralShell.VaultExport.v1", "utf8");

let locked = true;
let unlockSecret = "";
let keytarClient = null;
let keytarResolved = false;

function resolveUserDataPath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return app.getPath("userData");
    }
  } catch {
    // Fallback for test/runtime contexts without Electron.
  }
  return path.join(process.cwd(), "state");
}

function getVaultDir() {
  return path.join(resolveUserDataPath(), "vault");
}

function getFallbackFilePath() {
  return path.join(getVaultDir(), FALLBACK_FILE_NAME);
}

function ensureDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function sanitizeId(value, fallback = "default") {
  const safe = String(value == null ? "" : value).trim();
  if (!safe) return fallback;
  return safe.replace(/[^a-zA-Z0-9._:-]/g, "_");
}

function accountKey(profileId, key) {
  return `${sanitizeId(profileId, "profile")}:${sanitizeId(key, "apiKey")}`;
}

function getKeytar() {
  if (keytarResolved) return keytarClient;
  keytarResolved = true;
  try {
    // Preferred binding.
    keytarClient = require("keytar");
    return keytarClient;
  } catch {
    try {
      // Linux-compatible fallback when system keyring bindings differ.
      keytarClient = require("@arcanis/keytar");
      return keytarClient;
    } catch {
      keytarClient = null;
      return null;
    }
  }
}

function deriveFallbackKey() {
  let fingerprint = "";
  try {
    const identityKernel = require("./identityKernel");
    if (identityKernel && typeof identityKernel.getHardwareFingerprint === "function") {
      fingerprint = String(identityKernel.getHardwareFingerprint() || "");
    } else if (identityKernel && typeof identityKernel.getFingerprint === "function") {
      fingerprint = String(identityKernel.getFingerprint() || "");
    }
  } catch {
    // ignore
  }
  if (!fingerprint) {
    fingerprint = require("os").hostname();
  }
  return crypto
    .createHash("sha256")
    .update(`NeuralShell.vault.fallback:${fingerprint}`)
    .digest();
}

function getSafeStorage() {
  try {
    const { safeStorage } = require("electron");
    if (
      safeStorage &&
      typeof safeStorage.isEncryptionAvailable === "function" &&
      safeStorage.isEncryptionAvailable()
    ) {
      return safeStorage;
    }
  } catch {
    // ignore
  }
  return null;
}

function sealFallbackValue(value) {
  const safeStorage = getSafeStorage();
  const plain = String(value == null ? "" : value);
  if (safeStorage) {
    return `ss:${safeStorage.encryptString(plain).toString("base64")}`;
  }
  const key = deriveFallbackKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(VAULT_AAD);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `gcm:${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

function unsealFallbackValue(value) {
  const raw = String(value == null ? "" : value);
  if (!raw) return "";
  if (raw.startsWith("ss:")) {
    const safeStorage = getSafeStorage();
    if (!safeStorage) throw new Error("SafeStorage unavailable for fallback decrypt.");
    const encoded = raw.slice(3);
    return safeStorage.decryptString(Buffer.from(encoded, "base64"));
  }
  if (!raw.startsWith("gcm:")) {
    throw new Error("Invalid fallback vault envelope.");
  }
  const parts = raw.split(":");
  if (parts.length !== 4) throw new Error("Malformed fallback vault envelope.");
  const [, ivHex, tagHex, dataHex] = parts;
  const key = deriveFallbackKey();
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAAD(VAULT_AAD);
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final()
  ]);
  return plain.toString("utf8");
}

function readFallbackStore() {
  const filePath = getFallbackFilePath();
  if (!fs.existsSync(filePath)) {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      entries: {}
    };
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const entries = parsed && typeof parsed.entries === "object" && parsed.entries
    ? parsed.entries
    : {};
  return {
    version: 1,
    updatedAt: parsed && parsed.updatedAt ? String(parsed.updatedAt) : new Date().toISOString(),
    entries
  };
}

function writeFallbackStore(store) {
  const filePath = getFallbackFilePath();
  ensureDir(filePath);
  const next = {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: store && typeof store.entries === "object" && store.entries ? store.entries : {}
  };
  fs.writeFileSync(filePath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
}

async function listVaultEntries() {
  const keytar = getKeytar();
  if (keytar && typeof keytar.findCredentials === "function") {
    const credentials = await keytar.findCredentials(SERVICE_NAME);
    return credentials.map((row) => ({
      account: String(row.account || ""),
      value: String(row.password || "")
    }));
  }
  const store = readFallbackStore();
  return Object.keys(store.entries).map((account) => ({
    account,
    value: unsealFallbackValue(store.entries[account])
  }));
}

async function setSecret(profileId, key, value) {
  const account = accountKey(profileId, key);
  const nextValue = String(value == null ? "" : value).trim();
  if (!nextValue) {
    await deleteSecret(profileId, key);
    return {
      ok: true,
      account,
      stored: false
    };
  }

  const keytar = getKeytar();
  if (keytar && typeof keytar.setPassword === "function") {
    await keytar.setPassword(SERVICE_NAME, account, nextValue);
    return {
      ok: true,
      account,
      stored: true,
      backend: "keytar"
    };
  }

  const store = readFallbackStore();
  store.entries[account] = sealFallbackValue(nextValue);
  writeFallbackStore(store);
  return {
    ok: true,
    account,
    stored: true,
    backend: "fallback"
  };
}

async function getSecret(profileId, key) {
  const account = accountKey(profileId, key);
  const keytar = getKeytar();
  if (keytar && typeof keytar.getPassword === "function") {
    const value = await keytar.getPassword(SERVICE_NAME, account);
    return value == null ? "" : String(value);
  }
  const store = readFallbackStore();
  if (!Object.prototype.hasOwnProperty.call(store.entries, account)) {
    return "";
  }
  return unsealFallbackValue(store.entries[account]);
}

async function hasSecret(profileId, key) {
  const value = await getSecret(profileId, key);
  return Boolean(String(value || "").trim());
}

async function deleteSecret(profileId, key) {
  const account = accountKey(profileId, key);
  const keytar = getKeytar();
  if (keytar && typeof keytar.deletePassword === "function") {
    await keytar.deletePassword(SERVICE_NAME, account);
    return {
      ok: true,
      deleted: true,
      account,
      backend: "keytar"
    };
  }
  const store = readFallbackStore();
  const existed = Object.prototype.hasOwnProperty.call(store.entries, account);
  if (existed) {
    delete store.entries[account];
    writeFallbackStore(store);
  }
  return {
    ok: true,
    deleted: existed,
    account,
    backend: "fallback"
  };
}

function lock() {
  locked = true;
  unlockSecret = "";
  return { ok: true, locked };
}

function unlock(password) {
  const pass = String(password || "");
  if (!pass) {
    throw new Error("Vault password is required.");
  }
  locked = false;
  unlockSecret = pass;
  return { ok: true, locked };
}

function compact(data, format) {
  const mode = String(format || "json").toLowerCase();
  if (mode === "json") {
    return {
      ok: true,
      format: mode,
      data: JSON.stringify(data == null ? null : data)
    };
  }
  return {
    ok: true,
    format: mode,
    data: String(data == null ? "" : data)
  };
}

function deriveExportKey(passphrase, salt) {
  return crypto.scryptSync(String(passphrase || ""), salt, 32);
}

function resolveExportPassphrase(passphrase) {
  const raw = String(passphrase == null ? "" : passphrase).trim();
  if (raw) return raw;
  if (unlockSecret) return unlockSecret;
  throw new Error("Vault export passphrase is required.");
}

async function exportVault(rawPassphrase) {
  const passphrase = resolveExportPassphrase(rawPassphrase);
  const entries = await listVaultEntries();
  const payload = {
    v: 1,
    generatedAt: new Date().toISOString(),
    entries
  };
  const plain = Buffer.from(JSON.stringify(payload), "utf8");
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const key = deriveExportKey(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(EXPORT_AAD);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ok: true,
    format: "vault-export+json",
    count: entries.length,
    blob: {
      v: 1,
      kdf: "scrypt",
      salt: salt.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      ciphertext: ciphertext.toString("base64")
    }
  };
}

function parseImportBlob(blobOrJson) {
  if (blobOrJson && typeof blobOrJson === "object") return blobOrJson;
  const text = String(blobOrJson || "").trim();
  if (!text) throw new Error("Vault import payload is empty.");
  return JSON.parse(text);
}

async function importVault(blobOrJson, rawPassphrase, options = {}) {
  const payload = parseImportBlob(blobOrJson);
  const passphrase = resolveExportPassphrase(rawPassphrase);
  if (Number(payload.v) !== 1 || String(payload.kdf || "").toLowerCase() !== "scrypt") {
    throw new Error("Unsupported vault export format.");
  }
  const salt = Buffer.from(String(payload.salt || ""), "base64");
  const iv = Buffer.from(String(payload.iv || ""), "base64");
  const tag = Buffer.from(String(payload.tag || ""), "base64");
  const ciphertext = Buffer.from(String(payload.ciphertext || ""), "base64");
  const key = deriveExportKey(passphrase, salt);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(EXPORT_AAD);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  const decoded = JSON.parse(plain.toString("utf8"));
  const entries = Array.isArray(decoded && decoded.entries) ? decoded.entries : [];
  const mode = String(options.mode || "merge").toLowerCase();

  if (mode === "replace") {
    const existing = await listVaultEntries();
    for (const entry of existing) {
      const [profileId, keyId] = String(entry.account || "").split(":");
      if (profileId && keyId) {
        await deleteSecret(profileId, keyId);
      }
    }
  }

  let imported = 0;
  for (const entry of entries) {
    const account = String(entry && entry.account ? entry.account : "").trim();
    if (!account.includes(":")) continue;
    const [profileId, keyId] = account.split(":");
    const value = String(entry && entry.value ? entry.value : "");
    if (!profileId || !keyId || !value) continue;
    await setSecret(profileId, keyId, value);
    imported += 1;
  }

  return {
    ok: true,
    imported,
    mode
  };
}

module.exports = {
  SERVICE_NAME,
  lock,
  unlock,
  compact,
  setSecret,
  getSecret,
  hasSecret,
  deleteSecret,
  exportVault,
  importVault
};
