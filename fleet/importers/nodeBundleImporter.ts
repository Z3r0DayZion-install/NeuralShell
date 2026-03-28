import { normalizeNodeBundle, FleetNodeBundle } from "../models/nodeBundle";

function parseCsvLine(line: string) {
  const cols: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cols.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cols.push(current.trim());
  return cols;
}

function parseCsvRecords(text: string) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];
  const headers = parseCsvLine(lines[0]);
  if (!headers.length) return [];
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

export function importFleetNodeBundlesFromText(text: string, sourceName = "local-import"): FleetNodeBundle[] {
  const safeName = String(sourceName || "").toLowerCase();
  let rows: any[] = [];
  if (safeName.endsWith(".csv")) {
    rows = parseCsvRecords(text);
  } else {
    try {
      const parsed = JSON.parse(String(text || "[]"));
      if (Array.isArray(parsed)) {
        rows = parsed;
      } else if (parsed && typeof parsed === "object") {
        if (Array.isArray((parsed as any).nodes)) rows = (parsed as any).nodes;
        else if (Array.isArray((parsed as any).rows)) rows = (parsed as any).rows;
        else rows = [parsed];
      }
    } catch {
      rows = parseCsvRecords(text);
    }
  }
  return rows.map((entry) => normalizeNodeBundle(entry, sourceName));
}

export default importFleetNodeBundlesFromText;