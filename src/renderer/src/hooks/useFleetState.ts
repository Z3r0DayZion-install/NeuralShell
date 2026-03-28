import React from "react";
import { parseStructuredRecords, readTextFile } from "../utils/recordIO.js";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

export type FleetHealth = "healthy" | "degraded" | "critical" | "offline";

export type FleetNodeEvent = {
  id: string;
  at: string;
  type: string;
  severity: "info" | "warning" | "degraded" | "critical";
  source: string;
  detail: Record<string, any>;
};

export type FleetNodeRecord = {
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
  updateRing: string;
  activePackId: string;
  applianceMode: boolean;
  events: FleetNodeEvent[];
};

export type FleetStatusFilter = "all" | FleetHealth;

const STORAGE_KEY = "neuralshell_fleet_nodes_v1";
const FILTER_KEY = "neuralshell_fleet_filter_v1";
const SELECT_KEY = "neuralshell_fleet_selected_v1";

function asString(value: any, fallback = "") {
  return String(value == null ? fallback : value).trim() || fallback;
}

function parseAt(value: any) {
  const safe = asString(value);
  if (!safe) return new Date().toISOString();
  const parsed = new Date(safe);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function asHealth(value: any): FleetHealth {
  const safe = asString(value).toLowerCase();
  if (safe === "healthy") return "healthy";
  if (safe === "critical") return "critical";
  if (safe === "offline") return "offline";
  return "degraded";
}

function asArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((entry) => asString(entry)).filter(Boolean);
  }
  if (value == null) return [];
  return asString(value)
    .split(/[|,]/)
    .map((entry) => asString(entry))
    .filter(Boolean);
}

function asEvent(event: any, index = 0): FleetNodeEvent {
  const safeSeverity = asString(event && event.severity, "info").toLowerCase();
  const severity = (safeSeverity === "critical"
    ? "critical"
    : safeSeverity === "degraded"
      ? "degraded"
      : safeSeverity === "warning"
        ? "warning"
        : "info") as FleetNodeEvent["severity"];
  return {
    id: asString(event && event.id, `fleet-event-${Date.now()}-${index}`),
    at: parseAt(event && event.at),
    type: asString(event && event.type, "fleet.event"),
    severity,
    source: asString(event && event.source, "fleet"),
    detail: event && event.detail && typeof event.detail === "object" ? event.detail : {},
  };
}

function normalizeNode(input: any, sourceName = "local-import"): FleetNodeRecord {
  const payload = input && typeof input === "object" ? input : {};
  const nodeId = asString(payload.nodeId || payload.id || payload.node || payload.machineId);
  return {
    nodeId: nodeId || `node-${Math.random().toString(36).slice(2, 8)}`,
    displayName: asString(payload.displayName || payload.name || nodeId || "Imported Node"),
    runtimeHealth: asHealth(payload.runtimeHealth || payload.health || payload.status),
    providerHealth: asString(payload.providerHealth || payload.provider || "unknown"),
    proofStatus: asString(payload.proofStatus || payload.proof || "unknown"),
    policyProfile: asString(payload.policyProfile || payload.policy || "none"),
    updateVersion: asString(payload.updateVersion || payload.version || "unknown"),
    relayStatus: asString(payload.relayStatus || payload.relay || "unknown"),
    collabState: asString(payload.collabState || payload.collab || "unknown"),
    lastSeenAt: parseAt(payload.lastSeenAt || payload.lastSeen || payload.updatedAt),
    alerts: asArray(payload.alerts),
    importedFrom: asString(payload.importedFrom || sourceName, sourceName),
    updateRing: asString(payload.updateRing, "standard"),
    activePackId: asString(payload.activePackId, ""),
    applianceMode: Boolean(payload.applianceMode),
    events: Array.isArray(payload.events)
      ? payload.events.map((entry: any, index: number) => asEvent(entry, index)).slice(-160)
      : [],
  };
}

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || !window.localStorage) return fallback;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    if (parsed == null) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: any) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeNodes(prev: FleetNodeRecord[], next: FleetNodeRecord[]) {
  const map = new Map<string, FleetNodeRecord>();
  (Array.isArray(prev) ? prev : []).forEach((node) => {
    const normalized = normalizeNode(node, node && node.importedFrom ? node.importedFrom : "local-import");
    map.set(normalized.nodeId, normalized);
  });
  (Array.isArray(next) ? next : []).forEach((node) => {
    const normalized = normalizeNode(node, node && node.importedFrom ? node.importedFrom : "local-import");
    const existing = map.get(normalized.nodeId);
    if (!existing) {
      map.set(normalized.nodeId, normalized);
      return;
    }
    map.set(normalized.nodeId, {
      ...existing,
      ...normalized,
      events: [...(existing.events || []), ...(normalized.events || [])].slice(-160),
      alerts: Array.from(new Set([...(existing.alerts || []), ...(normalized.alerts || [])])),
    });
  });
  return Array.from(map.values()).sort((a, b) => String(a.displayName || "").localeCompare(String(b.displayName || "")));
}

function summarize(nodes: FleetNodeRecord[]) {
  return (Array.isArray(nodes) ? nodes : []).reduce(
    (acc, node) => {
      const health = asHealth(node && node.runtimeHealth);
      acc.total += 1;
      acc[health] += 1;
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

function compareNodes(left: FleetNodeRecord | null, right: FleetNodeRecord | null) {
  if (!left || !right) return [];
  const rows = [
    { key: "runtimeHealth", label: "Runtime Health", left: left.runtimeHealth, right: right.runtimeHealth },
    { key: "providerHealth", label: "Provider Health", left: left.providerHealth, right: right.providerHealth },
    { key: "proofStatus", label: "Proof Status", left: left.proofStatus, right: right.proofStatus },
    { key: "policyProfile", label: "Policy Profile", left: left.policyProfile, right: right.policyProfile },
    { key: "updateVersion", label: "Update Version", left: left.updateVersion, right: right.updateVersion },
    { key: "updateRing", label: "Update Ring", left: left.updateRing, right: right.updateRing },
    { key: "relayStatus", label: "Relay Status", left: left.relayStatus, right: right.relayStatus },
    { key: "collabState", label: "Collab State", left: left.collabState, right: right.collabState },
    { key: "alertCount", label: "Alert Count", left: left.alerts.length, right: right.alerts.length },
  ];
  return rows.map((row) => ({ ...row, changed: String(row.left) !== String(row.right) })).filter((row) => row.changed);
}

export function useFleetState() {
  const [nodes, setNodes] = React.useState<FleetNodeRecord[]>(() => {
    const saved = readStorage<any[]>(STORAGE_KEY, []);
    return Array.isArray(saved) ? saved.map((entry) => normalizeNode(entry, entry && entry.importedFrom ? entry.importedFrom : "local-import")) : [];
  });
  const [statusFilter, setStatusFilter] = React.useState<FleetStatusFilter>(() => {
    const saved = asString(readStorage<string>(FILTER_KEY, "all"), "all").toLowerCase();
    if (saved === "healthy" || saved === "degraded" || saved === "critical" || saved === "offline") return saved;
    return "all";
  });
  const [selectedNodeIds, setSelectedNodeIds] = React.useState<string[]>(() => {
    const saved = readStorage<any[]>(SELECT_KEY, []);
    return Array.isArray(saved) ? saved.map((entry) => asString(entry)).filter(Boolean).slice(0, 2) : [];
  });

  React.useEffect(() => {
    writeStorage(STORAGE_KEY, nodes);
  }, [nodes]);

  React.useEffect(() => {
    writeStorage(FILTER_KEY, statusFilter);
  }, [statusFilter]);

  React.useEffect(() => {
    writeStorage(SELECT_KEY, selectedNodeIds);
  }, [selectedNodeIds]);

  const filteredNodes = React.useMemo(() => {
    if (statusFilter === "all") return nodes;
    return nodes.filter((node) => asHealth(node.runtimeHealth) === statusFilter);
  }, [nodes, statusFilter]);

  const healthSummary = React.useMemo(() => summarize(nodes), [nodes]);

  const selectedNodes = React.useMemo(() => {
    const map = new Map(nodes.map((node) => [node.nodeId, node]));
    return selectedNodeIds.map((id) => map.get(String(id))).filter(Boolean) as FleetNodeRecord[];
  }, [nodes, selectedNodeIds]);

  const compareRows = React.useMemo(() => {
    return compareNodes(selectedNodes[0] || null, selectedNodes[1] || null);
  }, [selectedNodes]);

  const importFleetRecords = React.useCallback((records: any[], sourceName = "local-import") => {
    const safe = Array.isArray(records) ? records : [];
    const normalized = safe.map((entry) => normalizeNode(entry, sourceName));
    setNodes((prev) => mergeNodes(prev, normalized));
    appendRuntimeEvent("fleet.nodes.imported", {
      imported: normalized.length,
      sourceName,
    }, { source: "fleet", severity: "info" });
    return normalized.length;
  }, []);

  const importFleetFile = React.useCallback(async (file: File) => {
    if (!file) return 0;
    const text = await readTextFile(file);
    const rows = parseStructuredRecords(text, String(file.name || ""));
    return importFleetRecords(rows, String(file.name || "local-file"));
  }, [importFleetRecords]);

  const importRuntimeNode = React.useCallback((runtimeState: any, metadata: Record<string, any> = {}) => {
    const state = runtimeState && typeof runtimeState === "object" ? runtimeState : {};
    const node = normalizeNode({
      nodeId: metadata.nodeId || "local-runtime",
      displayName: metadata.displayName || "Local Runtime",
      runtimeHealth: state.watchdog && state.watchdog.status === "running" ? "healthy" : "degraded",
      providerHealth: state.providerHealth && state.providerHealth.online ? "online" : "offline",
      proofStatus: state.proofEngine && state.proofEngine.lastProofStatus ? state.proofEngine.lastProofStatus : "idle",
      policyProfile: state.policyState && state.policyState.activePolicyProfile ? state.policyState.activePolicyProfile : "none",
      updateVersion: state.updateLane && state.updateLane.currentVersion ? state.updateLane.currentVersion : "unknown",
      relayStatus: state.relayState && state.relayState.enabled ? "enabled" : "disabled",
      collabState: state.collabVoiceState && state.collabVoiceState.sessionHealth ? state.collabVoiceState.sessionHealth : "unknown",
      lastSeenAt: new Date().toISOString(),
      importedFrom: "runtime-local",
      updateRing: state.policyState && state.policyState.updateRing ? state.policyState.updateRing : "standard",
      applianceMode: Boolean(metadata.applianceMode),
    }, "runtime-local");
    setNodes((prev) => mergeNodes(prev, [node]));
    return node;
  }, []);

  const toggleNodeSelected = React.useCallback((nodeId: string) => {
    const safe = asString(nodeId);
    if (!safe) return;
    setSelectedNodeIds((prev) => {
      if (prev.includes(safe)) {
        return prev.filter((entry) => entry !== safe);
      }
      return [...prev, safe].slice(-2);
    });
  }, []);

  const removeNode = React.useCallback((nodeId: string) => {
    const safe = asString(nodeId);
    if (!safe) return;
    setNodes((prev) => prev.filter((entry) => String(entry.nodeId || "") !== safe));
    setSelectedNodeIds((prev) => prev.filter((entry) => entry !== safe));
    appendRuntimeEvent("fleet.node.removed", { nodeId: safe }, { source: "fleet", severity: "warning" });
  }, []);

  const clearFleet = React.useCallback(() => {
    setNodes([]);
    setSelectedNodeIds([]);
    appendRuntimeEvent("fleet.nodes.cleared", {}, { source: "fleet", severity: "warning" });
  }, []);

  const updateNode = React.useCallback((nodeId: string, patch: Record<string, any>) => {
    const safe = asString(nodeId);
    if (!safe) return;
    const safePatch = patch && typeof patch === "object" ? patch : {};
    setNodes((prev) => prev.map((entry) => {
      if (String(entry.nodeId || "") !== safe) return entry;
      return normalizeNode({ ...entry, ...safePatch, nodeId: safe }, entry.importedFrom || "fleet-update");
    }));
  }, []);

  const appendNodeEvent = React.useCallback((nodeId: string, event: Partial<FleetNodeEvent>) => {
    const safe = asString(nodeId);
    if (!safe) return;
    setNodes((prev) => prev.map((entry) => {
      if (String(entry.nodeId || "") !== safe) return entry;
      const nextEvent = asEvent({
        id: event.id || `fleet-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        at: event.at || new Date().toISOString(),
        type: event.type || "fleet.event",
        severity: event.severity || "info",
        source: event.source || "fleet",
        detail: event.detail || {},
      });
      return {
        ...entry,
        events: [...(entry.events || []), nextEvent].slice(-160),
      };
    }));
  }, []);

  const applyPolicyBundle = React.useCallback((bundle: Record<string, any>, nodeIds: string[], options: { mode?: string } = {}) => {
    const safeBundle = bundle && typeof bundle === "object" ? bundle : {};
    const nextIds = Array.isArray(nodeIds) ? nodeIds.map((entry) => asString(entry)).filter(Boolean) : [];
    const policyProfile = asString(safeBundle.policyProfile || safeBundle.label || safeBundle.policyId, "fleet-policy");
    const mode = asString(options.mode, "immediate");
    setNodes((prev) => prev.map((entry) => {
      if (!nextIds.includes(String(entry.nodeId || ""))) return entry;
      return {
        ...entry,
        policyProfile,
        lastSeenAt: new Date().toISOString(),
        events: [...(entry.events || []), asEvent({
          type: "fleet.policy.rollout",
          severity: "info",
          source: "fleet-policy",
          detail: { policyProfile, mode },
        })].slice(-160),
      };
    }));
    appendRuntimeEvent("fleet.policy.rollout", { policyProfile, targets: nextIds.length, mode }, { source: "fleet-policy", severity: "info" });
    return { policyProfile, targets: nextIds.length };
  }, []);

  const rollbackPolicy = React.useCallback((nodeId: string, previousPolicy: string) => {
    const safe = asString(nodeId);
    if (!safe) return;
    updateNode(safe, {
      policyProfile: asString(previousPolicy, "none"),
      lastSeenAt: new Date().toISOString(),
    });
    appendNodeEvent(safe, {
      type: "fleet.policy.rollback",
      severity: "warning",
      source: "fleet-policy",
      detail: { previousPolicy: asString(previousPolicy, "none") },
    });
  }, [appendNodeEvent, updateNode]);

  const assignUpdatePack = React.useCallback((nodeIds: string[], payload: { packId?: string; ring?: string; version?: string }) => {
    const safeIds = Array.isArray(nodeIds) ? nodeIds.map((entry) => asString(entry)).filter(Boolean) : [];
    const packId = asString(payload && payload.packId, "");
    const ring = asString(payload && payload.ring, "standard");
    const version = asString(payload && payload.version, "unknown");
    setNodes((prev) => prev.map((entry) => {
      if (!safeIds.includes(String(entry.nodeId || ""))) return entry;
      return {
        ...entry,
        activePackId: packId,
        updateRing: ring,
        updateVersion: version,
        events: [...(entry.events || []), asEvent({
          type: "fleet.update.pack.assigned",
          severity: "info",
          source: "fleet-updates",
          detail: { packId, ring, version },
        })].slice(-160),
      };
    }));
    appendRuntimeEvent("fleet.update.pack.assigned", {
      targets: safeIds.length,
      packId,
      ring,
      version,
    }, { source: "fleet-updates", severity: "info" });
  }, []);

  return {
    nodes,
    filteredNodes,
    statusFilter,
    setStatusFilter,
    healthSummary,
    selectedNodeIds,
    selectedNodes,
    compareRows,
    importFleetRecords,
    importFleetFile,
    importRuntimeNode,
    toggleNodeSelected,
    removeNode,
    clearFleet,
    updateNode,
    appendNodeEvent,
    applyPolicyBundle,
    rollbackPolicy,
    assignUpdatePack,
  };
}

export default useFleetState;