"use strict";

const fs = require("fs");
const path = require("path");

const DEFAULTS = {
  fileRead: true,
  fileWrite: true,
  autoMode: true,
  llmStream: true,
  checkpointWrite: true,
  tearImport: true
};

class PermissionManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, "permissions.json");
    this.auditPath = path.join(baseDir, "permission_audit.log");
    this.permissions = { ...DEFAULTS };
  }

  async init() {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
    try {
      const raw = await fs.promises.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.permissions = { ...DEFAULTS, ...(parsed || {}) };
    } catch {
      await this.save();
    }
  }

  async save() {
    await fs.promises.writeFile(this.filePath, JSON.stringify(this.permissions, null, 2), "utf8");
  }

  list() {
    return { ...this.permissions };
  }

  allowed(key) {
    return Boolean(this.permissions[key]);
  }

  async set(key, value, actor = "renderer") {
    if (!(key in DEFAULTS)) throw new Error("Unknown permission key");
    this.permissions[key] = Boolean(value);
    await this.save();
    await this.audit("set", key, actor, Boolean(value));
    return this.list();
  }

  async audit(action, key, actor = "renderer", value = null) {
    const line = JSON.stringify({
      at: new Date().toISOString(),
      action,
      key,
      actor,
      value
    }) + "\n";
    await fs.promises.appendFile(this.auditPath, line, "utf8");
  }

  async auditTail(limit = 100) {
    try {
      const raw = await fs.promises.readFile(this.auditPath, "utf8");
      return raw.trim().split(/\r?\n/).filter(Boolean).slice(-Math.max(1, Math.min(500, Number(limit) || 100)));
    } catch {
      return [];
    }
  }
}

module.exports = { PermissionManager, DEFAULT_PERMISSION_FLAGS: DEFAULTS };
