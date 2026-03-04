const fs = require("fs");
const path = require("path");

function parse(filePath) {
  const target = path.resolve(String(filePath || ""));
  if (!target || !fs.existsSync(target)) {
    throw new Error(`History file not found: ${target}`);
  }

  const body = fs.readFileSync(target, "utf8");
  const lines = body.split(/\r?\n/).filter(Boolean);
  return lines.map((line, idx) => ({
    index: idx,
    raw: line
  }));
}

function formatForInjection(logs) {
  const rows = Array.isArray(logs) ? logs : [];
  return rows
    .map((row) => {
      if (row && typeof row === "object") {
        return row.raw != null ? String(row.raw) : JSON.stringify(row);
      }
      return String(row || "");
    })
    .join("\n");
}

module.exports = {
  parse,
  formatForInjection
};
