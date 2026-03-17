const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { kernel, CAP_PROC } = require("../kernel");

const IDENTITY_ENVELOPE_PREFIX = "omega-id-v2";
const IDENTITY_ENVELOPE_AAD = Buffer.from("NeuralShell.identity.v2", "utf8");
const PEER_STORE_PREFIX = "omega-peers-v1";
const PEER_STORE_AAD = Buffer.from("NeuralShell.peers.v1", "utf8");

let keyPair = null;
let hardwareFingerprint = null;
const peers = new Map();

function getIdentityPath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return path.join(app.getPath("userData"), "identity.omega");
    }
  } catch {
    // Electron may be unavailable in tests and CLI scripts.
  }
  return path.join(process.cwd(), "identity.omega");
}

function getPeerStorePath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return path.join(app.getPath("userData"), "trusted-peers.omega");
    }
  } catch {
    // Electron may be unavailable in tests and CLI scripts.
  }
  return path.join(process.cwd(), "trusted-peers.omega");
}

/**
 * Gather immutable hardware IDs via the OMEGA-gated wmic broker.
 */
async function getHardwareId() {
  if (hardwareFingerprint) return hardwareFingerprint;
  try {
    const cpuId = await kernel.request(CAP_PROC, "execute", { command: "wmic", args: ["cpu", "get", "processorid"] });
    const baseboard = await kernel.request(CAP_PROC, "execute", { command: "wmic", args: ["baseboard", "get", "serialnumber"] });
    
    hardwareFingerprint = crypto.createHash("sha256")
      .update(cpuId.trim() + baseboard.trim())
      .digest("hex");
    return hardwareFingerprint;
  } catch {
    // Fallback to hostname if wmic fails
    hardwareFingerprint = crypto.createHash("sha256").update(require("os").hostname()).digest("hex");
    return hardwareFingerprint;
  }
}

function getHardwareEncryptionKey() {
  if (!hardwareFingerprint) {
    hardwareFingerprint = crypto
      .createHash("sha256")
      .update(require("os").hostname())
      .digest("hex");
  }
  return crypto.createHash("sha256").update(hardwareFingerprint).digest();
}

function getHardwareFingerprint() {
  if (!hardwareFingerprint) {
    hardwareFingerprint = crypto
      .createHash("sha256")
      .update(require("os").hostname())
      .digest("hex");
  }
  return hardwareFingerprint;
}

function encryptPrivateKeyPem(pem) {
  return encryptEnvelope(pem, IDENTITY_ENVELOPE_PREFIX, IDENTITY_ENVELOPE_AAD);
}

function encryptEnvelope(value, prefix, aad) {
  const key = getHardwareEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const encrypted = Buffer.concat([
    cipher.update(String(value || ""), "utf8"),
    cipher.final()
  ]);
  return [
    prefix,
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex")
  ].join(":");
}

function decryptAuthenticatedPayload(payload) {
  return decryptEnvelope(payload, IDENTITY_ENVELOPE_PREFIX, IDENTITY_ENVELOPE_AAD);
}

function decryptEnvelope(payload, prefix, aad) {
  const parts = String(payload || "").split(":");
  if (parts.length !== 4 || parts[0] !== prefix) {
    throw new Error("Invalid encrypted envelope.");
  }
  const [, ivHex, tagHex, encryptedHex] = parts;
  const key = getHardwareEncryptionKey();
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivHex, "hex")
  );
  decipher.setAAD(aad);
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

function decryptLegacyPayload(payload) {
  const parts = String(payload || "").split(":");
  const iv = Buffer.from(parts.shift(), "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const key = getHardwareEncryptionKey();
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function saveKeyPair() {
  if (!keyPair) return;
  const pem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" });
  const identityPath = getIdentityPath();
  fs.mkdirSync(path.dirname(identityPath), { recursive: true });
  fs.writeFileSync(identityPath, encryptPrivateKeyPem(pem), "utf8");
}

function quarantineIdentityFile(reason = "invalid") {
  const p = getIdentityPath();
  if (!fs.existsSync(p)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${p}.${reason}.${stamp}.bak`;
  try {
    fs.renameSync(p, backup);
    return backup;
  } catch {
    return null;
  }
}

function quarantinePeerStore(reason = "invalid") {
  const p = getPeerStorePath();
  if (!fs.existsSync(p)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = `${p}.${reason}.${stamp}.bak`;
  try {
    fs.renameSync(p, backup);
    return backup;
  } catch {
    return null;
  }
}

function loadKeyPair() {
  const p = getIdentityPath();
  if (!fs.existsSync(p)) return false;
  try {
    const payload = fs.readFileSync(p, "utf8");
    const isAuthenticatedEnvelope = payload.startsWith(`${IDENTITY_ENVELOPE_PREFIX}:`);
    const decrypted = isAuthenticatedEnvelope
      ? decryptAuthenticatedPayload(payload)
      : decryptLegacyPayload(payload);
    const privateKey = crypto.createPrivateKey(decrypted);
    const publicKey = crypto.createPublicKey(privateKey);
    keyPair = { privateKey, publicKey };
    if (!isAuthenticatedEnvelope) {
      saveKeyPair();
    }
    return true;
  } catch {
    quarantineIdentityFile("lock-failure");
    keyPair = null;
    return false;
  }
}

function ensureKeyPair() {
  if (!keyPair) {
    if (!loadKeyPair()) {
      keyPair = crypto.generateKeyPairSync("ed25519");
      saveKeyPair();
    }
  }
  return keyPair;
}

function normalizePeerRecord(record) {
  const raw = record && typeof record === "object" ? record : {};
  const deviceId = String(raw.deviceId || "").trim();
  const pubKeyPem = String(raw.pubKeyPem || "").trim();
  if (!deviceId || !pubKeyPem) {
    throw new Error("Invalid peer record.");
  }
  return {
    deviceId,
    label: String(raw.label || "").trim() || deviceId,
    pubKeyPem,
    fingerprint: fingerprintFromPem(pubKeyPem),
    trustedAt: String(raw.trustedAt || new Date().toISOString())
  };
}

function savePeers() {
  const peerStorePath = getPeerStorePath();
  fs.mkdirSync(path.dirname(peerStorePath), { recursive: true });
  const rows = Array.from(peers.values())
    .sort((a, b) => a.deviceId.localeCompare(b.deviceId))
    .map((record) => normalizePeerRecord(record));
  const payload = JSON.stringify(rows, null, 2);
  fs.writeFileSync(
    peerStorePath,
    encryptEnvelope(payload, PEER_STORE_PREFIX, PEER_STORE_AAD),
    "utf8"
  );
}

function loadPeers() {
  peers.clear();
  const peerStorePath = getPeerStorePath();
  if (!fs.existsSync(peerStorePath)) {
    return false;
  }
  try {
    const payload = fs.readFileSync(peerStorePath, "utf8");
    const decrypted = decryptEnvelope(payload, PEER_STORE_PREFIX, PEER_STORE_AAD);
    const parsed = JSON.parse(decrypted);
    if (!Array.isArray(parsed)) {
      throw new Error("Trusted peer store must be an array.");
    }
    for (const entry of parsed) {
      const record = normalizePeerRecord(entry);
      peers.set(record.deviceId, record);
    }
    return true;
  } catch {
    quarantinePeerStore("lock-failure");
    peers.clear();
    return false;
  }
}

function publicKeyPem() {
  return ensureKeyPair()
    .publicKey.export({
      type: "spki",
      format: "pem"
    })
    .toString("utf8");
}

function fingerprintFromPem(pem) {
  return crypto
    .createHash("sha256")
    .update(String(pem || ""))
    .digest("hex");
}

async function init() {
  await getHardwareId();
  ensureKeyPair();
  loadPeers();
  return true;
}

function trustPeer(deviceId, pubKeyPem, label) {
  const id = String(deviceId || "").trim();
  const pem = String(pubKeyPem || "").trim();
  if (!id || !pem) {
    throw new Error("deviceId and pubKeyPem are required.");
  }

  peers.set(id, {
    deviceId: id,
    label: String(label || "").trim() || id,
    pubKeyPem: pem,
    fingerprint: fingerprintFromPem(pem),
    trustedAt: new Date().toISOString()
  });
  savePeers();

  return {
    ok: true,
    deviceId: id
  };
}

function revokePeer(deviceId) {
  const id = String(deviceId || "").trim();
  peers.delete(id);
  savePeers();
  return { ok: true, deviceId: id };
}

function listPeers() {
  return Array.from(peers.values());
}

function rotate() {
  keyPair = crypto.generateKeyPairSync("ed25519");
  saveKeyPair();
  return {
    ok: true,
    fingerprint: getFingerprint(),
    rotatedAt: new Date().toISOString()
  };
}

function getPublicKeyPem() {
  return publicKeyPem();
}

function getFingerprint() {
  if (!hardwareFingerprint) {
    hardwareFingerprint = crypto
      .createHash("sha256")
      .update(require("os").hostname())
      .digest("hex");
  }
  const keyFingerprint = fingerprintFromPem(publicKeyPem());
  // Hardware Binding: Node ID is a hash of the Cryptographic Key + the Physical Silicon ID
  return crypto.createHash("sha256")
    .update(keyFingerprint + (hardwareFingerprint || ""))
    .digest("hex");
}

/**
 * Sign a payload using the local identity (Silicon-Bound).
 */
function signPayload(payload) {
  const kp = ensureKeyPair();
  const signature = crypto.sign(null, Buffer.from(JSON.stringify(payload)), kp.privateKey);
  return signature.toString('base64');
}

/**
 * Verify a payload's signature against a known public key.
 */
function verifyPayload(payload, signatureBase64, pubKeyPem) {
  try {
    const pubKey = crypto.createPublicKey(pubKeyPem);
    return crypto.verify(null, Buffer.from(JSON.stringify(payload)), pubKey, Buffer.from(signatureBase64, 'base64'));
  } catch {
    return false;
  }
}

module.exports = {
  init,
  getPublicKeyPem,
  getFingerprint,
  getHardwareFingerprint,
  trustPeer,
  revokePeer,
  listPeers,
  rotate,
  signPayload,
  verifyPayload
};
