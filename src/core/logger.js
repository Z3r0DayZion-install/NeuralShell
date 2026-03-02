const fs = require("fs");
const path = require("path");
const { app } = require("electron");

class Logger {
  constructor() {
    this.logDir = path.join(app.getPath("userData"), "logs");
    this.logFile = path.join(this.logDir, "app.log.jsonl");
    this.maxBytes = 1024 * 1024;
    this.maxBackups = 3;
    this.sessionId = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  ensureDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
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

  log(level, message, meta = {}) {
    try {
      this.ensureDir();
      this.rotateIfNeeded();
      const entry = {
        ts: new Date().toISOString(),
        level: String(level || "info").toLowerCase(),
        message: String(message || ""),
        sessionId: this.sessionId,
        ...meta
      };
      fs.appendFileSync(this.logFile, `${JSON.stringify(entry)}\n`, "utf8");
    } catch {
      // Ignore log failures.
    }
  }

  tail(lines = 30) {
    try {
      if (!fs.existsSync(this.logFile)) return [];
      const safeLines = Math.min(Math.max(Number(lines) || 30, 1), 200);
      const text = fs.readFileSync(this.logFile, "utf8");
      const rows = text.split(/\r?\n/).filter(Boolean).slice(-safeLines);
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

  clear() {
    try {
      if (fs.existsSync(this.logFile)) {
        fs.writeFileSync(this.logFile, "", "utf8");
      }
      return true;
    } catch {
      return false;
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

  info(message, meta) {
    this.log("info", message, meta);
  }

  warn(message, meta) {
    this.log("warn", message, meta);
  }

  error(message, meta) {
    const payload = meta && typeof meta === "object" ? { ...meta } : {};
    if (payload.error instanceof Error) {
      payload.error = {
        name: payload.error.name,
        message: payload.error.message,
        stack: payload.error.stack
      };
    }
    this.log("error", message, payload);
  }
}

module.exports = new Logger();
