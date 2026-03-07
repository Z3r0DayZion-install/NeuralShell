const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function hashRow(row) {
  return crypto.createHash("sha256").update(JSON.stringify(row)).digest("hex");
}

class AuditChain {
  constructor(filePath) {
    this.filePath = filePath;
    this._lastHash = "GENESIS";
    this._nextIndex = 0;
  }

  init() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "", "utf8");
      this._lastHash = "GENESIS";
      this._nextIndex = 0;
      return;
    }

    const rows = this._readRows();
    if (!rows.length) {
      this._lastHash = "GENESIS";
      this._nextIndex = 0;
      return;
    }

    const last = rows[rows.length - 1];
    this._lastHash = String(last.hash || "GENESIS");
    this._nextIndex = Number(last.index || 0) + 1;
  }

  append(payload) {
    const safePayload =
      payload && typeof payload === "object"
        ? payload
        : { value: String(payload || "") };
    const rowBase = {
      index: this._nextIndex,
      timestamp: new Date().toISOString(),
      prevHash: this._lastHash,
      payload: safePayload
    };
    const hash = hashRow(rowBase);
    const row = { ...rowBase, hash };

    fs.appendFileSync(this.filePath, `${JSON.stringify(row)}\n`, "utf8");
    this._lastHash = hash;
    this._nextIndex += 1;
    return row;
  }

  tail(limit = 50) {
    const max = Number.isFinite(Number(limit))
      ? Math.max(0, Number(limit))
      : 50;
    const rows = this._readRows();
    return rows.slice(-max);
  }

  verify() {
    const rows = this._readRows();
    let expectedPrev = "GENESIS";

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const rowBase = {
        index: row.index,
        timestamp: row.timestamp,
        prevHash: row.prevHash,
        payload: row.payload
      };
      const expectedHash = hashRow(rowBase);
      if (row.prevHash !== expectedPrev) {
        return {
          ok: false,
          index: i,
          reason: "prev-hash mismatch"
        };
      }
      if (row.hash !== expectedHash) {
        return {
          ok: false,
          index: i,
          reason: "hash mismatch"
        };
      }
      expectedPrev = row.hash;
    }

    return {
      ok: true,
      count: rows.length
    };
  }

  _readRows() {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const lines = fs
      .readFileSync(this.filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.map((line) => JSON.parse(line));
  }
}

module.exports = {
  AuditChain
};
