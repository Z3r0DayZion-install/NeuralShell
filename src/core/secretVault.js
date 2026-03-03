const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app } = require("electron");

class SecretVault {
  constructor() {
    this.filePath = path.join(app.getPath("userData"), "secrets.vault.json");
    this.isLocked = false;
    this.sessionKey = null;
  }

  lock() {
    this.isLocked = true;
    this.sessionKey = null;
    return true;
  }

  unlock(password) {
    // In a real app, verify password against a hash
    // For this prototype, we'll just set the session key
    this.sessionKey = crypto.createHash("sha256").update(password).digest();
    this.isLocked = false;
    return true;
  }

  compact(data, format = 'neurovault') {
    const content = JSON.stringify(data);
    const fileName = `vault_${Date.now()}.${format}`;
    const filePath = path.join(app.getPath("userData"), fileName);
    
    // For .tear format, we could add extra encryption layer
    if (format === 'tear') {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", this.key(), iv);
      const enc = Buffer.concat([cipher.update(content, "utf8"), cipher.final()]);
      const tag = cipher.getAuthTag();
      const output = JSON.stringify({ iv: iv.toString('hex'), tag: tag.toString('hex'), data: enc.toString('hex') });
      fs.writeFileSync(filePath, output, "utf8");
    } else {
      fs.writeFileSync(filePath, content, "utf8");
    }
    
    return filePath;
  }

  key() {
    // If we have a session key, use it to further secure the base key
    const baseKey = crypto.createHash("sha256").update(String(app.getPath("userData"))).digest();
    if (this.sessionKey) {
      return crypto.createHash("sha256").update(Buffer.concat([baseKey, this.sessionKey])).digest();
    }
    return baseKey;
  }

  encrypt(value) {
    if (this.isLocked) throw new Error("Vault is locked.");
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", this.key(), iv);
    const enc = Buffer.concat([cipher.update(String(value || ""), "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
      iv: iv.toString("hex"),
      tag: tag.toString("hex"),
      value: enc.toString("hex")
    };
  }

  decrypt(entry) {
    if (this.isLocked) throw new Error("Vault is locked.");
    const iv = Buffer.from(String(entry.iv || ""), "hex");
    const tag = Buffer.from(String(entry.tag || ""), "hex");
    const data = Buffer.from(String(entry.value || ""), "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", this.key(), iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(data), decipher.final()]);
    return out.toString("utf8");
  }

  load() {
    if (!fs.existsSync(this.filePath)) return {};
    try {
      return JSON.parse(fs.readFileSync(this.filePath, "utf8"));
    } catch {
      return {};
    }
  }

  save(obj) {
    fs.writeFileSync(this.filePath, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
  }

  set(name, value) {
    const key = String(name || "").trim();
    if (!key) throw new Error("Secret name required.");
    const db = this.load();
    db[key] = this.encrypt(value);
    this.save(db);
    return true;
  }

  get(name) {
    const key = String(name || "").trim();
    if (!key) return "";
    const db = this.load();
    if (!db[key]) return "";
    try {
      return this.decrypt(db[key]);
    } catch {
      return "";
    }
  }
}

module.exports = new SecretVault();
