export type RuntimeSnapshot = {
  id: string;
  name: string;
  createdAt: string;
  payload: {
    provider: string;
    model: string;
    vaultLocked: boolean;
    policyProfile: string;
    proofStatus: string;
    activePanels: string[];
    collabRoom: string;
    collabPeers: number;
    selectedCards: string[];
  };
};

function sanitizeValue(value: any) {
  if (value == null) return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower.includes("token") || lower.includes("secret") || lower.includes("passphrase")) {
      return "[redacted]";
    }
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => sanitizeValue(entry));
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    Object.entries(value).forEach(([key, entry]) => {
      const lower = String(key || "").toLowerCase();
      if (
        lower.includes("token")
        || lower.includes("secret")
        || lower.includes("password")
        || lower.includes("passphrase")
      ) {
        out[key] = "[redacted]";
      } else {
        out[key] = sanitizeValue(entry);
      }
    });
    return out;
  }
  return value;
}

export function captureRuntimeSnapshot(name: string, payload: RuntimeSnapshot["payload"]): RuntimeSnapshot {
  return {
    id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(name || `Snapshot ${new Date().toLocaleTimeString()}`),
    createdAt: new Date().toISOString(),
    payload: sanitizeValue(payload),
  };
}

export function compareRuntimeSnapshots(a: RuntimeSnapshot | null, b: RuntimeSnapshot | null) {
  if (!a || !b) return [];
  const left = a && a.payload && typeof a.payload === "object" ? a.payload : {};
  const right = b && b.payload && typeof b.payload === "object" ? b.payload : {};
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
  return keys
    .map((key) => ({
      key,
      before: left[key],
      after: right[key],
      changed: JSON.stringify(left[key]) !== JSON.stringify(right[key]),
    }))
    .filter((row) => row.changed);
}

export function restoreRuntimeSnapshot(snapshot: RuntimeSnapshot | null) {
  if (!snapshot) return null;
  return snapshot.payload;
}

