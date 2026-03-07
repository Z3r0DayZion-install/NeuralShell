const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function safeUserDataPath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return app.getPath("userData");
    }
  } catch {
    // Fallback for tests/non-electron.
  }
  return path.join(process.cwd(), "state");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateName(name) {
  const normalized = String(name == null ? "" : name).trim();
  assert(normalized.length > 0, "Invalid session name.");
  assert(
    !normalized.includes("/") && !normalized.includes("\\"),
    "Session name contains invalid characters."
  );
  assert(!normalized.includes(".."), "Invalid session name.");
  assert(
    /^[a-zA-Z0-9._-]+$/.test(normalized),
    "Session name contains invalid characters."
  );
  return normalized;
}

function validatePassphrase(passphrase) {
  const normalized = String(passphrase == null ? "" : passphrase).trim();
  assert(normalized.length > 0, "Passphrase is required.");
  return normalized;
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function deriveKey(passphrase, saltHex) {
  return crypto.pbkdf2Sync(
    passphrase,
    Buffer.from(saltHex, "hex"),
    100000,
    32,
    "sha256"
  );
}

function encryptPayload(payload, passphrase) {
  const salt = crypto.randomBytes(16).toString("hex");
  const iv = crypto.randomBytes(12);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    salt,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
    data: encrypted.toString("base64")
  };
}

function decryptPayload(envelope, passphrase) {
  const key = deriveKey(passphrase, envelope.salt);
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, "base64")),
    decipher.final()
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

function envelopeChecksum(envelope) {
  return sha256(
    [
      envelope.version,
      envelope.name,
      envelope.salt,
      envelope.iv,
      envelope.tag,
      envelope.data
    ].join("|")
  );
}

function countTokensFromChat(chat) {
  if (!Array.isArray(chat)) {
    return 0;
  }
  let count = 0;
  for (const message of chat) {
    const content =
      message && typeof message.content === "string" ? message.content : "";
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    count += words;
  }
  return count;
}

const userDataDir = safeUserDataPath();
const sessionsDir = path.join(userDataDir, "sessions");
const indexFile = path.join(sessionsDir, "index.json");

function readIndex() {
  if (!fs.existsSync(indexFile)) {
    return {};
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(indexFile, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeIndex(index) {
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.writeFileSync(indexFile, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

const index = readIndex();

function sessionPath(name) {
  return path.join(sessionsDir, `${name}.ns5.json`);
}

function saveSession(name, payload, passphrase) {
  fs.mkdirSync(sessionsDir, { recursive: true });
  const safeName = validateName(name);
  const safePassphrase = validatePassphrase(passphrase);
  const safePayload =
    payload && typeof payload === "object" ? payload : { chat: [] };

  const encrypted = encryptPayload(safePayload, safePassphrase);
  const envelope = {
    version: 2,
    name: safeName,
    createdAt: new Date().toISOString(),
    ...encrypted
  };
  envelope.checksum = envelopeChecksum(envelope);

  const filePath = sessionPath(safeName);
  fs.writeFileSync(filePath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");

  index[safeName] = {
    updatedAt: new Date().toISOString(),
    model: String(safePayload.model || "unknown"),
    tokens: countTokensFromChat(safePayload.chat),
    version: 2
  };
  writeIndex(index);
  return filePath;
}

function loadSession(name, passphrase) {
  const safeName = validateName(name);
  const safePassphrase = validatePassphrase(passphrase);
  const filePath = sessionPath(safeName);
  assert(fs.existsSync(filePath), `Session not found: ${safeName}`);

  const envelope = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const checksum = envelopeChecksum(envelope);
  assert(checksum === envelope.checksum, "Session checksum mismatch.");
  try {
    return decryptPayload(envelope, safePassphrase);
  } catch {
    throw new Error("Decryption failed.");
  }
}

function listSessions() {
  return Object.keys(index).sort((a, b) => a.localeCompare(b));
}

function deleteSession(name) {
  const safeName = validateName(name);
  const filePath = sessionPath(safeName);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  delete index[safeName];
  writeIndex(index);
  return true;
}

function renameSession(oldName, newName) {
  const from = validateName(oldName);
  const to = validateName(newName);
  const fromPath = sessionPath(from);
  const toPath = sessionPath(to);
  assert(fs.existsSync(fromPath), `Session not found: ${from}`);
  assert(!fs.existsSync(toPath), `Session already exists: ${to}`);
  fs.renameSync(fromPath, toPath);
  index[to] = index[from] || {
    updatedAt: new Date().toISOString(),
    model: "unknown",
    tokens: 0,
    version: 2
  };
  delete index[from];
  writeIndex(index);
  return true;
}

function search(query) {
  const q = String(query || "")
    .trim()
    .toLowerCase();
  const names = listSessions();
  if (!q) return names.map((name) => ({ name, ...(index[name] || {}) }));
  return names
    .filter((name) => name.toLowerCase().includes(q))
    .map((name) => ({ name, ...(index[name] || {}) }));
}

function repairIndex() {
  fs.mkdirSync(sessionsDir, { recursive: true });
  const rebuilt = {};
  const files = fs
    .readdirSync(sessionsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ns5.json"));

  for (const entry of files) {
    const name = entry.name.replace(/\.ns5\.json$/i, "");
    rebuilt[name] = index[name] || {
      updatedAt: new Date().toISOString(),
      model: "unknown",
      tokens: 0,
      version: 2
    };
  }

  for (const key of Object.keys(index)) {
    delete index[key];
  }
  for (const [key, value] of Object.entries(rebuilt)) {
    index[key] = value;
  }
  writeIndex(index);
  return {
    repaired: true,
    count: Object.keys(index).length
  };
}

function exportToPeer() {
  throw new Error("Peer export is not available in local test mode.");
}

module.exports = {
  deleteSession,
  exportToPeer,
  index,
  listSessions,
  loadSession,
  renameSession,
  repairIndex,
  saveSession,
  search
};
