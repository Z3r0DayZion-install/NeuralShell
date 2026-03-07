const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { kernel, CAP_PROC } = require("../kernel");

let keyPair = null;
let hardwareFingerprint = null;
const peers = new Map();

function getIdentityPath() {
  try {
    const { app } = require("electron");
    if (app && typeof app.getPath === "function") {
      return path.join(app.getPath("userData"), "identity.omega");
    }
  } catch {}
  return path.join(process.cwd(), "identity.omega");
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
  } catch (err) {
    // Fallback to hostname if wmic fails
    hardwareFingerprint = crypto.createHash("sha256").update(require("os").hostname()).digest("hex");
    return hardwareFingerprint;
  }
}

function getHardwareEncryptionKey() {
  return crypto.createHash("sha256").update(hardwareFingerprint).digest();
}

function saveKeyPair() {
  if (!keyPair) return;
  const pem = keyPair.privateKey.export({ type: "pkcs8", format: "pem" });
  const key = getHardwareEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(pem, "utf8", "hex");
  encrypted += cipher.final("hex");
  const payload = iv.toString("hex") + ":" + encrypted;
  fs.writeFileSync(getIdentityPath(), payload, "utf8");
}

function loadKeyPair() {
  const p = getIdentityPath();
  if (!fs.existsSync(p)) return false;
  try {
    const payload = fs.readFileSync(p, "utf8");
    const parts = payload.split(":");
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const key = getHardwareEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    const privateKey = crypto.createPrivateKey(decrypted);
    const publicKey = crypto.createPublicKey(privateKey);
    keyPair = { privateKey, publicKey };
    return true;
  } catch (err) {
    throw new Error("IDENTITY_LOCK_FAILURE: Failed to decrypt node identity. Hardware mismatch detected.");
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

  return {
    ok: true,
    deviceId: id
  };
}

function revokePeer(deviceId) {
  const id = String(deviceId || "").trim();
  peers.delete(id);
  return { ok: true, deviceId: id };
}

function listPeers() {
  return Array.from(peers.values());
}

function rotate() {
  keyPair = crypto.generateKeyPairSync("ed25519");
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
  } catch (err) {
    return false;
  }
}

module.exports = {
  init,
  getPublicKeyPem,
  getFingerprint,
  trustPeer,
  revokePeer,
  listPeers,
  rotate,
  signPayload,
  verifyPayload
};
