const crypto = require("crypto");

let keyPair = null;
const peers = new Map();

function ensureKeyPair() {
  if (!keyPair) {
    keyPair = crypto.generateKeyPairSync("ed25519");
  }
  return keyPair;
}

function publicKeyPem() {
  return ensureKeyPair().publicKey.export({
    type: "spki",
    format: "pem"
  }).toString("utf8");
}

function fingerprintFromPem(pem) {
  return crypto.createHash("sha256").update(String(pem || "")).digest("hex");
}

async function init() {
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
  return fingerprintFromPem(publicKeyPem());
}

module.exports = {
  init,
  getPublicKeyPem,
  getFingerprint,
  trustPeer,
  revokePeer,
  listPeers,
  rotate
};
