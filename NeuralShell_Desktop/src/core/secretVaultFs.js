"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function normalizeKey(keyText) {
  const text = String(keyText || "").trim();
  if (!text) return null;
  return crypto.createHash("sha256").update(text).digest();
}

function encrypt(text, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: encrypted.toString("base64")
  });
}

function decrypt(payloadText, key) {
  const payload = JSON.parse(payloadText);
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

class SecretVaultFs {
  constructor(baseDir, keyText = "") {
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, "secret.vault.json");
    this.key = normalizeKey(keyText);
  }

  async init() {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
  }

  async set(secret) {
    const text = String(secret || "");
    if (this.key) {
      await fs.promises.writeFile(this.filePath, encrypt(text, this.key), "utf8");
      return true;
    }
    await fs.promises.writeFile(this.filePath, JSON.stringify({ v: 1, plain: text }), "utf8");
    return true;
  }

  async get() {
    try {
      const raw = await fs.promises.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (Object.prototype.hasOwnProperty.call(parsed, "plain")) return String(parsed.plain || "");
      return this.key ? decrypt(raw, this.key) : "";
    } catch {
      return "";
    }
  }

  async clear() {
    await fs.promises.unlink(this.filePath).catch(() => {});
    return true;
  }
}

module.exports = { SecretVaultFs };

