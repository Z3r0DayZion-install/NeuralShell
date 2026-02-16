"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class AuthManager {
  constructor(baseDir, options = {}) {
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, "auth.json");
    this.auditPath = path.join(baseDir, "auth_audit.log");
    this.session = null;
    this.maxFailedAttempts = Math.max(1, Number(options.maxFailedAttempts) || 5);
    this.lockoutMs = Math.max(1000, Number(options.lockoutMs) || 5 * 60 * 1000);
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
    this.state = { pinHash: "", salt: "", role: "admin", failedAttempts: 0, lockoutUntil: 0 };
  }

  async init() {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
    try {
      const parsed = JSON.parse(await fs.promises.readFile(this.filePath, "utf8"));
      this.state = { ...this.state, ...(parsed || {}) };
    } catch {
      await this.save();
      await this.audit("init", { needsSetup: true });
    }
  }

  hash(pin, salt) {
    return crypto.createHash("sha256").update(`${salt}:${pin}`).digest("hex");
  }

  async save() {
    await fs.promises.writeFile(this.filePath, JSON.stringify(this.state, null, 2), "utf8");
  }

  async audit(action, meta = {}) {
    const line = JSON.stringify({
      at: new Date().toISOString(),
      action,
      ...meta
    }) + "\n";
    await fs.promises.appendFile(this.auditPath, line, "utf8");
  }

  async setPin(pin, role = "admin") {
    if (this.needsSetup()) throw new Error("PIN setup required");
    return this.setPinInternal(pin, role);
  }

  async bootstrapPin(pin, role = "admin") {
    if (!this.needsSetup()) throw new Error("PIN already configured");
    const result = await this.setPinInternal(pin, role);
    await this.audit("bootstrap-pin", { role: this.state.role });
    return result;
  }

  async setPinInternal(pin, role = "admin") {
    const clean = String(pin || "").trim();
    if (clean.length < 4) throw new Error("PIN must be >= 4 chars");
    const salt = crypto.randomBytes(16).toString("hex");
    this.state = {
      ...this.state,
      pinHash: this.hash(clean, salt),
      salt,
      role: role === "viewer" ? "viewer" : "admin",
      failedAttempts: 0,
      lockoutUntil: 0
    };
    await this.save();
    return { ok: true };
  }

  async recoverPin(pin, actor = "local-recovery") {
    const result = await this.setPinInternal(pin, "admin");
    this.session = null;
    await this.audit("recover-pin", { actor });
    return result;
  }

  needsSetup() {
    return !this.state.pinHash || !this.state.salt;
  }

  async login(pin) {
    if (this.needsSetup()) throw new Error("PIN setup required");
    const now = this.now();
    if (this.state.lockoutUntil && now < this.state.lockoutUntil) {
      const retryIn = Math.max(1, Math.ceil((this.state.lockoutUntil - now) / 1000));
      await this.audit("login-blocked", { retryIn });
      throw new Error(`Account locked. Try again in ${retryIn}s`);
    }
    const clean = String(pin || "").trim();
    const ok = this.hash(clean, this.state.salt) === this.state.pinHash;
    if (!ok) {
      this.state.failedAttempts = (Number(this.state.failedAttempts) || 0) + 1;
      if (this.state.failedAttempts >= this.maxFailedAttempts) {
        this.state.failedAttempts = 0;
        this.state.lockoutUntil = now + this.lockoutMs;
        await this.audit("lockout", { until: new Date(this.state.lockoutUntil).toISOString() });
      }
      await this.save();
      await this.audit("login-failed");
      throw new Error("Invalid PIN");
    }
    this.state.failedAttempts = 0;
    this.state.lockoutUntil = 0;
    await this.save();
    await this.audit("login-ok", { role: this.state.role });
    this.session = { role: this.state.role, at: new Date().toISOString() };
    return { loggedIn: true, role: this.session.role };
  }

  logout() {
    this.session = null;
    void this.audit("logout");
    return { loggedIn: false, role: null };
  }

  status() {
    return {
      loggedIn: Boolean(this.session),
      role: this.session?.role || null,
      needsSetup: this.needsSetup(),
      lockedUntil: this.state.lockoutUntil ? new Date(this.state.lockoutUntil).toISOString() : null
    };
  }

  requireAdmin() {
    if (!this.session) throw new Error("Auth required");
    if (this.session.role !== "admin") throw new Error("Admin role required");
  }
}

module.exports = { AuthManager };
