const entries = [];
const MAX_ENTRIES = 5000;

function trim() {
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

function log(level, message, meta = {}) {
  entries.push({
    ts: new Date().toISOString(),
    level: String(level || "info"),
    message: String(message || ""),
    meta: meta && typeof meta === "object" ? meta : {}
  });
  trim();
  return true;
}

function tail(lines = 200) {
  const count = Math.max(1, Number(lines) || 200);
  return entries.slice(-count);
}

function clear() {
  entries.length = 0;
  return true;
}

function exportText() {
  return entries
    .map((row) => `${row.ts} [${row.level}] ${row.message} ${JSON.stringify(row.meta)}`)
    .join("\n");
}

module.exports = {
  log,
  tail,
  clear,
  exportText
};
