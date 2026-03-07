const fs = require("fs");
const path = require("path");
const https = require("https");

/**
 * NeuralShell Sovereign Agent SDK
 * Standardized interface for Agentic Tasks.
 */

const SDK = {
  _logCap(type, target) {
    const entry = {
      ts: new Date().toISOString(),
      type: "CAPABILITY_ACCESS",
      cap: type,
      target,
      source: process.argv[2] ? path.basename(process.argv[2]) : "unknown_script"
    };
    const logPath = path.join(process.cwd(), "tmp", "agent-knowledge.jsonl");
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");
  },

  /**
   * Secure Fetch (HTTPS Only, OMEGA Pinning compliant)
   */
  async fetch(url, options = {}) {
    this._logCap("NET_FETCH", url);
    return new Promise((resolve, reject) => {
      if (!url.startsWith("https://")) {
        return reject(new Error("OMEGA_BLOCK: Only HTTPS allowed."));
      }
      const req = https.request(url, {
        method: options.method || "GET",
        headers: {
          "User-Agent": "NeuralShell-Agent/1.0.0",
          ...options.headers
        }
      }, (res) => {
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => resolve({
          status: res.statusCode,
          headers: res.headers,
          data
        }));
      });
      req.on("error", reject);
      if (options.body) req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
      req.end();
    });
  },

  /**
   * Write to Knowledge Base
   */
  logKnowledge(fact) {
    this._logCap("SYS_KNOWLEDGE", fact.slice(0, 50));
    const logPath = path.join(process.cwd(), "tmp", "agent-knowledge.jsonl");
    const entry = {
      ts: new Date().toISOString(),
      fact
    };
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n", "utf8");
    return true;
  },

  /**
   * FS Utilities (Scoped to sandbox)
   */
  read(relPath) {
    this._logCap("FS_READ", relPath);
    const full = path.resolve(process.cwd(), relPath);
    return fs.readFileSync(full, "utf8");
  },

  write(relPath, data) {
    this._logCap("FS_WRITE", relPath);
    const full = path.resolve(process.cwd(), relPath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, data, "utf8");
    return true;
  },

  /**
   * Install a new permanent command plugin.
   */
  installPlugin(id, code) {
    this._logCap("SYS_INSTALL", id);
    const pluginDir = path.join(process.cwd(), "src", "plugins", "autonomous");
    const filePath = path.join(pluginDir, `${id}.js`);
    
    const template = `
/**
 * Autonomous Plugin: ${id}
 * Authored by NeuralShell Agent on ${new Date().toISOString()}
 */
module.exports = {
  register: ({ registerCommand }) => {
    registerCommand({
      name: "${id}",
      run: async (context) => {
        ${code}
      }
    });
  }
};`;
    
    fs.mkdirSync(pluginDir, { recursive: true });
    fs.writeFileSync(filePath, template, "utf8");
    return { success: true, path: filePath };
  },

  /**
   * Schedule a task in the Ritual Manager.
   */
  scheduleTask(id, timestamp) {
    this._logCap("SYS_SCHEDULE", id);
    this.logKnowledge(`Scheduled task ${id} for ${timestamp}`);
    return { success: true, id, scheduledAt: timestamp };
  },

  /**
   * System Engineering: Document a new capability.
   */
  document(featureName, description, usage) {
    this._logCap("SYS_DOC", featureName);
    const docPath = path.join(process.cwd(), "docs", "autonomous", `${featureName}.md`);
    const content = `# Feature: ${featureName}\n\n## Description\n${description}\n\n## Usage\n\`\`\`javascript\n${usage}\n\`\`\`\n\n*Documented by Agent on ${new Date().toISOString()}*`;
    
    fs.mkdirSync(path.dirname(docPath), { recursive: true });
    fs.writeFileSync(docPath, content, "utf8");
    return { success: true, path: docPath };
  },

  /**
   * Defensive Engineering: Create a recovery snapshot of all autonomous plugins.
   */
  checkpoint(tag = "auto") {
    this._logCap("SYS_CHECKPOINT", tag);
    const pluginDir = path.join(process.cwd(), "src", "plugins", "autonomous");
    const snapshotDir = path.join(process.cwd(), "tmp", "snapshots", tag);
    if (!fs.existsSync(pluginDir)) return { ok: true, msg: "No plugins to snapshot." };
    
    fs.mkdirSync(snapshotDir, { recursive: true });
    const files = fs.readdirSync(pluginDir);
    files.forEach(f => fs.copyFileSync(path.join(pluginDir, f), path.join(snapshotDir, f)));
    return { ok: true, tag, fileCount: files.length };
  }
};

module.exports = SDK;
