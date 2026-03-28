export type FleetHealth = "healthy" | "degraded" | "critical" | "offline";

export type FleetNodeEvent = {
  id: string;
  at: string;
  type: string;
  severity: "info" | "warning" | "degraded" | "critical";
  source: string;
  detail?: Record<string, any>;
};

export type FleetNodeBundle = {
  nodeId: string;
  displayName: string;
  runtimeHealth: FleetHealth;
  providerHealth: string;
  proofStatus: string;
  policyProfile: string;
  updateVersion: string;
  relayStatus: string;
  collabState: string;
  lastSeenAt: string;
  alerts: string[];
  importedFrom: string;
  events: FleetNodeEvent[];
};

function toFleetHealth(value: any): FleetHealth {
  const safe = String(value || "").trim().toLowerCase();
  if (safe === "healthy") return "healthy";
  if (safe === "critical") return "critical";
  if (safe === "offline") return "offline";
  return "degraded";
}

function asString(value: any, fallback = "") {
  return String(value == null ? fallback : value).trim() || fallback;
}

function asArray(value: any) {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry)).filter(Boolean);
  }
  if (value == null) return [];
  return asString(value)
    .split(/[|,]/)
    .map((entry) => asString(entry))
    .filter(Boolean);
}

function parseLastSeen(raw: any) {
  const safe = asString(raw);
  if (!safe) return new Date().toISOString();
  const parsed = new Date(safe);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function normalizeEvent(entry: any, index = 0): FleetNodeEvent {
  const baseAt = parseLastSeen(entry && entry.at);
  const severitySafe = String(entry && entry.severity ? entry.severity : "info").toLowerCase();
  const severity = (severitySafe === "critical"
    ? "critical"
    : severitySafe === "degraded"
      ? "degraded"
      : severitySafe === "warning"
        ? "warning"
        : "info") as FleetNodeEvent["severity"];
  return {
    id: asString(entry && entry.id, `fleet-evt-${Date.now()}-${index}`),
    at: baseAt,
    type: asString(entry && entry.type, "fleet.event"),
    severity,
    source: asString(entry && entry.source, "fleet-import"),
    detail: entry && entry.detail && typeof entry.detail === "object" ? entry.detail : {},
  };
}

export function normalizeNodeBundle(input: any, importedFrom = "local-import"): FleetNodeBundle {
  const payload = input && typeof input === "object" ? input : {};
  const nodeId = asString(payload.nodeId || payload.id || payload.node || payload.machineId);
  return {
    nodeId: nodeId || `node-${Math.random().toString(36).slice(2, 8)}`,
    displayName: asString(payload.displayName || payload.name || nodeId || "Imported Node"),
    runtimeHealth: toFleetHealth(payload.runtimeHealth || payload.health || payload.status),
    providerHealth: asString(payload.providerHealth || payload.provider || "unknown"),
    proofStatus: asString(payload.proofStatus || payload.proof || "unknown"),
    policyProfile: asString(payload.policyProfile || payload.policy || "none"),
    updateVersion: asString(payload.updateVersion || payload.version || "unknown"),
    relayStatus: asString(payload.relayStatus || payload.relay || "unknown"),
    collabState: asString(payload.collabState || payload.collab || "unknown"),
    lastSeenAt: parseLastSeen(payload.lastSeenAt || payload.lastSeen || payload.updatedAt),
    alerts: asArray(payload.alerts),
    importedFrom: asString(payload.importedFrom || importedFrom, importedFrom),
    events: Array.isArray(payload.events)
      ? payload.events.map((entry: any, index: number) => normalizeEvent(entry, index)).slice(-120)
      : [],
  };
}

export function compareNodeBundles(left: FleetNodeBundle | null, right: FleetNodeBundle | null) {
  if (!left || !right) return [];
  const rows = [
    { key: "runtimeHealth", label: "Runtime Health", left: left.runtimeHealth, right: right.runtimeHealth },
    { key: "providerHealth", label: "Provider Health", left: left.providerHealth, right: right.providerHealth },
    { key: "proofStatus", label: "Proof Status", left: left.proofStatus, right: right.proofStatus },
    { key: "policyProfile", label: "Policy Profile", left: left.policyProfile, right: right.policyProfile },
    { key: "updateVersion", label: "Update Version", left: left.updateVersion, right: right.updateVersion },
    { key: "relayStatus", label: "Relay Status", left: left.relayStatus, right: right.relayStatus },
    { key: "collabState", label: "Collab State", left: left.collabState, right: right.collabState },
    { key: "alertCount", label: "Alert Count", left: left.alerts.length, right: right.alerts.length },
  ];
  return rows
    .map((row) => ({ ...row, changed: String(row.left) !== String(row.right) }))
    .filter((row) => row.changed);
}

export function summarizeFleetHealth(nodes: FleetNodeBundle[]) {
  const safe = Array.isArray(nodes) ? nodes : [];
  return safe.reduce(
    (acc, node) => {
      const key = toFleetHealth(node && node.runtimeHealth);
      acc.total += 1;
      acc[key] += 1;
      return acc;
    },
    {
      total: 0,
      healthy: 0,
      degraded: 0,
      critical: 0,
      offline: 0,
    },
  );
}