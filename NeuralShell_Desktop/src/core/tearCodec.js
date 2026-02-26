"use strict";

const crypto = require("crypto");

function sha256Hex(text) {
  return crypto.createHash("sha256").update(String(text || ""), "utf8").digest("hex");
}

function deriveKey(secret, salt, iterations) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(secret, salt, iterations, 64, "sha256", (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function createHmacSig(key, value) {
  return crypto.createHmac("sha256", key).update(value, "utf8").digest("base64");
}

async function createEnvelope(payloadObj, secret = "", hint = "") {
  const payloadText = JSON.stringify(payloadObj || {});
  if (!secret) {
    return {
      format: "TEAR",
      version: "2.1.0",
      exportedAt: new Date().toISOString(),
      app: "NeuralShell Runtime",
      encrypted: false,
      hint: hint || "",
      payload: payloadObj || {},
      integrity: {
        alg: "SHA-256",
        payloadHash: sha256Hex(payloadText),
        payloadLength: payloadText.length
      }
    };
  }

  const iterations = 210000;
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const material = await deriveKey(secret, salt, iterations);
  const aesKey = material.subarray(0, 32);
  const hmacKey = material.subarray(32, 64);
  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(payloadText, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payloadEnc = Buffer.concat([encrypted, tag]).toString("base64");
  const saltB64 = salt.toString("base64");
  const ivB64 = iv.toString("base64");
  const signature = createHmacSig(hmacKey, `${saltB64}.${ivB64}.${payloadEnc}`);

  return {
    format: "TEAR",
    version: "2.1.0",
    exportedAt: new Date().toISOString(),
    app: "NeuralShell Runtime",
    encrypted: true,
    hint: hint || "",
    payloadEnc,
    crypto: {
      alg: "AES-GCM-256+HMAC-SHA256",
      kdf: "PBKDF2",
      iterations,
      salt: saltB64,
      iv: ivB64,
      signature
    },
    integrity: {
      alg: "SHA-256",
      payloadHash: sha256Hex(payloadText),
      payloadLength: payloadText.length
    }
  };
}

async function parseEnvelope(envelope, secret = "") {
  if (!envelope || envelope.format !== "TEAR") return envelope;
  if (!envelope.encrypted) {
    const payload = envelope.payload || {};
    if (envelope.integrity?.payloadHash) {
      const digest = sha256Hex(JSON.stringify(payload));
      if (digest !== envelope.integrity.payloadHash) throw new Error("TEAR payload hash mismatch");
    }
    return payload;
  }

  if (!secret) throw new Error("TEAR secret required");
  const iterations = Number(envelope?.crypto?.iterations || 210000);
  const salt = Buffer.from(String(envelope?.crypto?.salt || ""), "base64");
  const iv = Buffer.from(String(envelope?.crypto?.iv || ""), "base64");
  const payloadBytes = Buffer.from(String(envelope?.payloadEnc || ""), "base64");
  if (payloadBytes.length < 17) throw new Error("TEAR payload invalid");
  const encrypted = payloadBytes.subarray(0, payloadBytes.length - 16);
  const tag = payloadBytes.subarray(payloadBytes.length - 16);
  const material = await deriveKey(secret, salt, iterations);
  const aesKey = material.subarray(0, 32);
  const hmacKey = material.subarray(32, 64);
  const sig = createHmacSig(hmacKey, `${envelope.crypto.salt}.${envelope.crypto.iv}.${envelope.payloadEnc}`);
  if (sig !== envelope?.crypto?.signature) throw new Error("TEAR signature check failed");
  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  if (envelope.integrity?.payloadHash && sha256Hex(plain) !== envelope.integrity.payloadHash) {
    throw new Error("TEAR payload hash mismatch");
  }
  return JSON.parse(plain);
}

module.exports = { createEnvelope, parseEnvelope };

