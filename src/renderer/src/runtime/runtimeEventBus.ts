const EVENT_FEED_KEY = "neuralshell_runtime_event_feed_v1";
const EVENT_CHANNEL = "neuralshell:runtime-event";
const MAX_EVENTS = 400;

export type RuntimeSeverity = "info" | "warning" | "degraded" | "critical";

export type RuntimeEventRecord = {
  id: string;
  at: string;
  type: string;
  source: string;
  severity: RuntimeSeverity;
  payload: Record<string, any>;
};

function sanitizePayload(payload: Record<string, any>) {
  const source = payload && typeof payload === "object" ? payload : {};
  const out: Record<string, any> = {};
  Object.entries(source).forEach(([key, value]) => {
    const safeKey = String(key || "");
    const lower = safeKey.toLowerCase();
    if (
      lower.includes("token")
      || lower.includes("secret")
      || lower.includes("apikey")
      || lower.includes("password")
      || lower.includes("passphrase")
    ) {
      out[safeKey] = "[redacted]";
      return;
    }
    out[safeKey] = value;
  });
  return out;
}

export function readRuntimeEvents(): RuntimeEventRecord[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENT_FEED_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeRuntimeEvents(events: RuntimeEventRecord[]) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(EVENT_FEED_KEY, JSON.stringify((Array.isArray(events) ? events : []).slice(-MAX_EVENTS)));
}

export function appendRuntimeEvent(
  type: string,
  payload: Record<string, any> = {},
  options: { severity?: RuntimeSeverity; source?: string } = {},
) {
  if (typeof window === "undefined") return null;
  const entry: RuntimeEventRecord = {
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    type: String(type || "runtime.event"),
    source: String(options.source || "runtime"),
    severity: (options.severity || "info") as RuntimeSeverity,
    payload: sanitizePayload(payload),
  };
  const next = [...readRuntimeEvents(), entry].slice(-MAX_EVENTS);
  writeRuntimeEvents(next);
  window.dispatchEvent(new window.CustomEvent(EVENT_CHANNEL, { detail: entry }));
  return entry;
}

export function onRuntimeEvent(fn: (evt: RuntimeEventRecord) => void) {
  if (typeof window === "undefined" || typeof fn !== "function") {
    return () => {};
  }
  const handler = (event: Event) => {
    const custom = event as CustomEvent<RuntimeEventRecord>;
    const detail = custom && custom.detail ? custom.detail : null;
    if (!detail) return;
    fn(detail);
  };
  window.addEventListener(EVENT_CHANNEL, handler);
  return () => window.removeEventListener(EVENT_CHANNEL, handler);
}

export function clearRuntimeEvents() {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(EVENT_FEED_KEY);
}

