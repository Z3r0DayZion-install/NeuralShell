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
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("Encryption is not available on this system. Cannot store secret safely.");
    }
    const data = safeStorage.encryptString(text);
    await fs.promises.writeFile(this.filePath, data);
    return true;
  }

  async get() {
    try {
      const raw = await fs.promises.readFile(this.filePath);
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("Encryption is not available. Cannot decrypt secret.");
      }
      return safeStorage.decryptString(raw);
    } catch (err) {
      if (err.code === 'ENOENT') return "";
      throw err;
    }
  }

  async clear() {
    await fs.promises.unlink(this.filePath).catch(() => {});
    return true;
  }
}

module.exports = { SecretVault };
