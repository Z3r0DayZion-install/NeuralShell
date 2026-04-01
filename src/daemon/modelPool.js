class ModelPool {
  constructor(options = {}) {
    this.idleMs = Number(options.idleMs || 60 * 60 * 1000);
    this.coldStartTargetMs = Number(options.coldStartTargetMs || 4000);
    this.rows = new Map();
    this.logger = typeof options.logger === "function" ? options.logger : () => {};
  }

  markUsage(modelId) {
    const id = String(modelId || "").trim();
    if (!id) return;
    const existing = this.rows.get(id) || { modelId: id, warm: false, usageCount: 0, lastUsedAt: "" };
    const next = {
      ...existing,
      warm: true,
      usageCount: Number(existing.usageCount || 0) + 1,
      lastUsedAt: new Date().toISOString()
    };
    this.rows.set(id, next);
  }

  tickUnload() {
    const now = Date.now();
    const unloaded = [];
    for (const [modelId, row] of this.rows.entries()) {
      const lastUsedAt = row.lastUsedAt ? new Date(row.lastUsedAt).getTime() : 0;
      if (now - lastUsedAt > this.idleMs) {
        this.rows.set(modelId, {
          ...row,
          warm: false
        });
        unloaded.push(modelId);
      }
    }
    if (unloaded.length > 0) {
      this.logger("model_pool_unload", { unloaded });
    }
    return unloaded;
  }

  snapshot() {
    return {
      idleMs: this.idleMs,
      coldStartTargetMs: this.coldStartTargetMs,
      models: Array.from(this.rows.values())
    };
  }
}

module.exports = {
  ModelPool
};

