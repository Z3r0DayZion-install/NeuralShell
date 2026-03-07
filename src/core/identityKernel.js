const crypto = require("crypto");
const { kernel, CAP_PROC } = require("../kernel");

let keyPair = null;
let hardwareFingerprint = null;
const peers = new Map();

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
    return crypto.createHash("sha256").update(require("os").hostname()).digest("hex");
  }
}

function ensureKeyPair() {
  if (!keyPair) {
    keyPair = crypto.generateKeyPairSync("ed25519");
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
  ensureKeyPair();
  await getHardwareId();
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
