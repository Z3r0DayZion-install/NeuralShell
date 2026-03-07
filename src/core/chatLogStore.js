const entries = [];
const MAX_ENTRIES = 8000;

function trim() {
  while (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

function append(type, payload = {}) {
  entries.push({
    ts: new Date().toISOString(),
    type: String(type || "event"),
    payload:
      payload && typeof payload === "object" ? payload : { value: payload }
  });
  trim();
  return true;
}

function tail(limit = 200) {
  const count = Math.max(1, Number(limit) || 200);
  return entries.slice(-count);
}

function clear() {
  entries.length = 0;
  return true;
}

function exportText() {
  return entries
    .map((row) => `${row.ts} [${row.type}] ${JSON.stringify(row.payload)}`)
    .join("\n");
}

module.exports = {
  append,
  tail,
  clear,
  exportText
};
