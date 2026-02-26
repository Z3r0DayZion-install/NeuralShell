"use strict";

const fs = require("fs");
const path = require("path");

class CheckpointManager {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  async init() {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
  }

  normalizeName(name) {
    const safe = String(name || "")
      .replace(/\.json$/i, "")
      .replace(/[^a-z0-9_-]/gi, "_");
    if (!safe) throw new Error("Invalid checkpoint name");
    return safe;
  }

  checkpointPath(name) {
    return path.join(this.baseDir, `${this.normalizeName(name)}.json`);
  }

  async save(state, reason = "manual") {
    const name = `cp_${Date.now()}_${reason.replace(/[^a-z0-9_-]/gi, "_")}`;
    const payload = {
      savedAt: new Date().toISOString(),
      reason,
      state
    };
    await fs.promises.writeFile(this.checkpointPath(name), JSON.stringify(payload, null, 2), "utf8");
    await this.rotate(12);
    return name;
  }

  async list() {
    const names = await fs.promises.readdir(this.baseDir);
    return names
      .filter((n) => n.endsWith(".json"))
      .sort()
      .reverse();
  }

  async latest() {
    const list = await this.list();
    return list[0] || null;
  }

  async load(name) {
    const raw = await fs.promises.readFile(this.checkpointPath(name), "utf8");
    return JSON.parse(raw);
  }

  async rotate(max = 12) {
    const list = await this.list();
    const extra = list.slice(max);
    await Promise.all(extra.map((f) => fs.promises.unlink(path.join(this.baseDir, f)).catch(() => {})));
  }
}

module.exports = { CheckpointManager };
