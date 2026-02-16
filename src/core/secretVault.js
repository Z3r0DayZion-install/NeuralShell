"use strict";

const fs = require("fs");
const path = require("path");
const { safeStorage } = require("electron");

class SecretVault {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, "secret.vault");
  }

  async init() {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
  }

  async set(secret) {
    const text = String(secret || "");
    const data = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(text)
      : Buffer.from(text, "utf8");
    await fs.promises.writeFile(this.filePath, data);
    return true;
  }

  async get() {
    try {
      const raw = await fs.promises.readFile(this.filePath);
      return safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString("utf8");
    } catch {
      return "";
    }
  }

  async clear() {
    await fs.promises.unlink(this.filePath).catch(() => {});
    return true;
  }
}

module.exports = { SecretVault };
