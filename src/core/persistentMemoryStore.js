"use strict";

const fs = require("fs");
const path = require("path");

function tokenize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

class PersistentMemoryStore {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.filePath = path.join(baseDir, "memory_store.json");
    this.state = { records: [], compacted: [] };
  }

  async init() {
    await fs.promises.mkdir(this.baseDir, { recursive: true });
    await this.load();
  }

  async load() {
    try {
      const raw = await fs.promises.readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw);
      this.state.records = Array.isArray(parsed.records) ? parsed.records : [];
      this.state.compacted = Array.isArray(parsed.compacted) ? parsed.compacted : [];
    } catch {
      this.state = { records: [], compacted: [] };
      await this.save();
    }
  }

  async save() {
    const text = JSON.stringify(this.state, null, 2);
    await fs.promises.writeFile(this.filePath, text, "utf8");
  }

  async add(record) {
    const item = {
      id: `m_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      role: record.role === "assistant" ? "assistant" : "user",
      content: String(record.content || "").slice(0, 24000),
      sessionId: typeof record.sessionId === "string" ? record.sessionId : "unknown",
      at: typeof record.at === "string" ? record.at : new Date().toISOString(),
      tags: Array.isArray(record.tags) ? record.tags.slice(0, 8) : []
    };
    this.state.records.push(item);
    if (this.state.records.length > 5000) {
      this.state.records = this.state.records.slice(-5000);
    }
    await this.save();
    return item;
  }

  list(limit = 50) {
    const n = Math.max(1, Math.min(500, Number(limit) || 50));
    return this.state.records.slice(-n).reverse();
  }

  search(query, limit = 20) {
    const terms = tokenize(query);
    if (!terms.length) return [];
    const scored = this.state.records.map((r) => {
      const tokens = tokenize(r.content);
      const tokenSet = new Set(tokens);
      let score = 0;
      for (const t of terms) {
        if (tokenSet.has(t)) score += 1;
      }
      if (r.role === "assistant") score += 0.2;
      return { r, score };
    });
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.max(1, Math.min(100, Number(limit) || 20)))
      .map((s) => ({ ...s.r, score: Number(s.score.toFixed(3)) }));
  }

  async compact(sessionId = "") {
    const source = sessionId
      ? this.state.records.filter((r) => r.sessionId === sessionId)
      : this.state.records.slice(-200);
    if (!source.length) return null;
    const last = source.slice(-20);
    const summary = {
      id: `c_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
      at: new Date().toISOString(),
      sessionId: sessionId || "mixed",
      sampleCount: source.length,
      summaryText: last.map((m) => `${m.role}: ${m.content.slice(0, 140)}`).join("\n")
    };
    this.state.compacted.push(summary);
    if (this.state.compacted.length > 500) {
      this.state.compacted = this.state.compacted.slice(-500);
    }
    await this.save();
    return summary;
  }
}

module.exports = { PersistentMemoryStore };
