"use strict";

/**
 * ChatLogStore — Capability-Based Chat Logger
 * 
 * REFACTORED: Uses KernelBroker for all file operations.
 */

const { kernel, CAP_FS } = require("../kernel");
const path = require("path");

class ChatLogStore {
  constructor() {
    this.logDir = null;
    this.logFile = null;
    this.maxBytes = 1024 * 1024 * 2;
  }

  async _init() {
    if (this.logFile) return;
    const userData = await kernel.request(CAP_FS, 'getPath', { name: 'userData' });
    this.logDir = path.join(userData, "chat-logs");
    this.logFile = path.join(this.logDir, "chat-history.jsonl");
  }

  async append(eventType, payload = {}) {
    try {
      await this._init();
      const entry = {
        ts: new Date().toISOString(),
        eventType: String(eventType || "event"),
        ...payload
      };
      const current = await kernel.request(CAP_FS, 'exists', { filePath: this.logFile }) 
        ? await kernel.request(CAP_FS, 'readFile', { filePath: this.logFile }) 
        : "";
      await kernel.request(CAP_FS, 'writeFile', { 
        filePath: this.logFile, 
        data: current + JSON.stringify(entry) + "\n" 
      });
      return true;
    } catch {
      return false;
    }
  }

  async tail(limit = 100) {
    try {
      await this._init();
      const exists = await kernel.request(CAP_FS, 'exists', { filePath: this.logFile });
      if (!exists) return [];
      const text = await kernel.request(CAP_FS, 'readFile', { filePath: this.logFile });
      const rows = text.split(/\r?\n/).filter(Boolean).slice(-limit);
      return rows.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return { ts: new Date().toISOString(), eventType: "parse_error", raw: line };
        }
      });
    } catch {
      return [];
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

  async clear() {
    try {
      await this._init();
      await kernel.request(CAP_FS, 'writeFile', { filePath: this.logFile, data: "" });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new ChatLogStore();
