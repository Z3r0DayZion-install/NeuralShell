const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class ChatLogStore {
  constructor() {
    this.logDir = path.join(app.getPath("userData"), "chat-logs");
    this.logFile = path.join(this.logDir, "chat-history.jsonl");
    this.maxBytes = 1024 * 1024 * 2;
    this.maxBackups = 2;
  }

  ensureDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  append(eventType, payload = {}) {
    try {
      this.ensureDir();
      this.rotateIfNeeded();
      const entry = {
        ts: new Date().toISOString(),
        eventType: String(eventType || "event"),
        ...payload
      };
      fs.appendFileSync(this.logFile, `${JSON.stringify(entry)}\n`, "utf8");
      return true;
    } catch {
      return false;
    }
  }

  rotateIfNeeded() {
    try {
      if (!fs.existsSync(this.logFile)) return;
      const { size } = fs.statSync(this.logFile);
      if (size < this.maxBytes) return;

      for (let i = this.maxBackups - 1; i >= 1; i -= 1) {
        const src = `${this.logFile}.${i}`;
        const dst = `${this.logFile}.${i + 1}`;
        if (fs.existsSync(src)) {
          fs.renameSync(src, dst);
        }
      }
      fs.renameSync(this.logFile, `${this.logFile}.1`);
    } catch {
      // Ignore rotation failures.
    }
  }

  tail(limit = 100) {
    try {
      if (!fs.existsSync(this.logFile)) return [];
      const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
      const rows = fs.readFileSync(this.logFile, "utf8").split(/\r?\n/).filter(Boolean).slice(-safeLimit);
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

  exportText() {
    try {
      if (!fs.existsSync(this.logFile)) return "";
      return fs.readFileSync(this.logFile, "utf8");
    } catch {
      return "";
    }
  }

  clear() {
    try {
      this.ensureDir();
      fs.writeFileSync(this.logFile, "", "utf8");
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new ChatLogStore();
