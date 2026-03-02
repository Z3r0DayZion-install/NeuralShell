const fs = require("fs");
const crypto = require("crypto");

function sha256(value) {
  return crypto.createHash("sha256").update(String(value || ""), "utf8").digest("hex");
}

class AuditChain {
  constructor(filePath) {
    this.filePath = filePath;
    this.lastHash = "GENESIS";
  }

  init() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, "", "utf8");
        this.lastHash = "GENESIS";
        return;
      }
      const lines = fs.readFileSync(this.filePath, "utf8").split(/\r?\n/).filter(Boolean);
      if (!lines.length) {
        this.lastHash = "GENESIS";
        return;
      }
      const last = JSON.parse(lines[lines.length - 1]);
      this.lastHash = String(last.hash || "GENESIS");
    } catch {
      this.lastHash = "GENESIS";
    }
  }

  append(event) {
    const payload = event && typeof event === "object" ? event : { value: String(event || "") };
    const at = new Date().toISOString();
    const prevHash = this.lastHash || "GENESIS";
    const body = JSON.stringify(payload);
    const hash = sha256(`${prevHash}|${at}|${body}`);
    const row = { at, prevHash, hash, payload };
    fs.appendFileSync(this.filePath, `${JSON.stringify(row)}\n`, "utf8");
    this.lastHash = hash;
    return row;
  }

  tail(limit = 50) {
    const max = Math.max(1, Math.min(500, Number(limit) || 50));
    if (!fs.existsSync(this.filePath)) return [];
    const rows = fs.readFileSync(this.filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
    return rows.slice(-max);
  }

  verify() {
    if (!fs.existsSync(this.filePath)) {
      return { ok: true, checked: 0, reason: "missing file treated as empty chain" };
    }
    const rows = fs.readFileSync(this.filePath, "utf8").split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    let prev = "GENESIS";
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const expected = sha256(`${prev}|${row.at}|${JSON.stringify(row.payload || {})}`);
      if (String(row.prevHash) !== String(prev) || String(row.hash) !== String(expected)) {
        return {
          ok: false,
          checked: i + 1,
          reason: "hash chain mismatch",
          index: i
        };
      }
      prev = row.hash;
    }
    return { ok: true, checked: rows.length, head: rows.length ? rows[rows.length - 1].hash : "GENESIS" };
  }
}

module.exports = {
  AuditChain
};
