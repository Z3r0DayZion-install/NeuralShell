const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { app } = require("electron");

class SecretVault {
  constructor() {
    this.filePath = path.join(app.getPath("userData"), "secrets.vault.json");
  }

  key() {
    return crypto.createHash("sha256").update(String(app.getPath("userData"))).digest();
  }

  encrypt(value) {
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
