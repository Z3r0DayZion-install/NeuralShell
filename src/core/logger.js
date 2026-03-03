"use strict";

/**
 * Logger — Capability-Based Logger
 * 
 * REFACTORED: Uses KernelBroker for all file operations.
 */

const { kernel, CAP_FS } = require("../kernel");
const path = require("path");

class Logger {
  constructor() {
    this.logDir = null;
    this.logFile = null;
    this.maxBytes = 1024 * 1024;
    this.maxBackups = 3;
    this.sessionId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  async _init() {
    if (this.logFile) return;
    const userData = await kernel.request(CAP_FS, 'getPath', { name: 'userData' });
    this.logDir = path.join(userData, "logs");
    this.logFile = path.join(this.logDir, "app.log.jsonl");
  }

  async log(level, message, meta = {}) {
    try {
      await this._init();
      const entry = {
        ts: new Date().toISOString(),
        level: String(level || "info").toLowerCase(),
        message: String(message || ""),
        sessionId: this.sessionId,
        ...meta
      };
      // Simple append via kernel
      const current = await kernel.request(CAP_FS, 'exists', { filePath: this.logFile }) 
        ? await kernel.request(CAP_FS, 'readFile', { filePath: this.logFile }) 
        : "";
      await kernel.request(CAP_FS, 'writeFile', { 
        filePath: this.logFile, 
        data: current + JSON.stringify(entry) + "\n" 
      });
    } catch {
      // Ignore log failures.
    }
  }

  async tail(lines = 30) {
    try {
      await this._init();
      const exists = await kernel.request(CAP_FS, 'exists', { filePath: this.logFile });
      if (!exists) return [];
      const text = await kernel.request(CAP_FS, 'readFile', { filePath: this.logFile });
      const rows = text.split(/\r?\n/).filter(Boolean).slice(-lines);
      return rows.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { ts: new Date().toISOString(), level: "info", message: line };
        }
      });
    } catch {
      return [];
    }
  }

  async clear() {
    try {
      await this._init();
      await kernel.request(CAP_FS, 'writeFile', { filePath: this.logFile, data: "" });
      return true;
    } catch {
      return false;
    }
  }

  async exportText() {
    try {
      await this._init();
      return await kernel.request(CAP_FS, 'readFile', { filePath: this.logFile });
    } catch {
      return "";
    }
  }

  info(message, meta) {
    this.log("info", message, meta);
  }

  warn(message, meta) {
    this.log("warn", message, meta);
  }

  error(message, meta) {
    const payload = meta && typeof meta === "object" ? { ...meta } : {};
    this.log("error", message, payload);
  }
}

module.exports = new Logger();
