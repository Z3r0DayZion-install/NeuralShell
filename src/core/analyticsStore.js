const fs = require('fs');
const os = require('os');
const path = require('path');

const MAX_EVENTS = 5000;

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function toNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function normalizeEvent(event = {}) {
  return {
    ts: String(event.ts || new Date().toISOString()),
    provider: String(event.provider || 'ollama').trim().toLowerCase() || 'ollama',
    model: String(event.model || 'unknown').trim() || 'unknown',
    latencyMs: Math.max(0, Math.round(toNumber(event.latencyMs, 0))),
    promptTokens: Math.max(0, Math.round(toNumber(event.promptTokens, 0))),
    completionTokens: Math.max(0, Math.round(toNumber(event.completionTokens, 0))),
    totalTokens: Math.max(0, Math.round(toNumber(event.totalTokens, toNumber(event.promptTokens, 0) + toNumber(event.completionTokens, 0))))
  };
}

function median(values) {
  if (!values.length) return 0;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }
  return sorted[mid];
}

function estimateUsdPer1k(providerId) {
  const provider = String(providerId || '').trim().toLowerCase();
  if (provider === 'openai') return 0.25;
  if (provider === 'openrouter') return 0.35;
  if (provider === 'groq') return 0.12;
  if (provider === 'together') return 0.2;
  if (provider === 'custom_openai') return 0.3;
  return 0;
}

function defaultStoreState() {
  return {
    version: 1,
    enabled: false,
    updatedAt: new Date().toISOString(),
    events: []
  };
}

function resolveAnalyticsFile(explicitPath = '') {
  const configured = String(explicitPath || '').trim();
  if (configured) return path.resolve(configured);

  try {
    const { app } = require('electron');
    if (app && typeof app.getPath === 'function') {
      return path.join(app.getPath('userData'), 'analytics.json');
    }
  } catch {
    // Electron may be unavailable in tests/CLI contexts.
  }

  const env = (typeof process === 'object' && process)
    ? process['env']
    : null;

  if (process.platform === 'win32') {
    const appData = env && typeof env === 'object'
      ? String(env['APPDATA'] || '').trim()
      : '';
    if (appData) {
      return path.join(appData, 'NeuralShell', 'analytics.json');
    }
    return path.join(os.homedir(), 'AppData', 'Roaming', 'NeuralShell', 'analytics.json');
  }

  const xdgConfigHome = env && typeof env === 'object'
    ? String(env['XDG_CONFIG_HOME'] || '').trim()
    : '';
  const baseConfig = xdgConfigHome || path.join(os.homedir(), '.config');
  return path.join(baseConfig, 'NeuralShell', 'analytics.json');
}

function createAnalyticsStore(options = {}) {
  const filePath = resolveAnalyticsFile(options.filePath || '');
  let state = defaultStoreState();

  function load() {
    if (!fs.existsSync(filePath)) {
      ensureDir(filePath);
      fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
      return state;
    }
    const parsed = safeJsonParse(fs.readFileSync(filePath, 'utf8'), defaultStoreState());
    const events = Array.isArray(parsed && parsed.events) ? parsed.events.map(normalizeEvent).slice(-MAX_EVENTS) : [];
    state = {
      version: 1,
      enabled: Boolean(parsed && parsed.enabled),
      updatedAt: String(parsed && parsed.updatedAt ? parsed.updatedAt : new Date().toISOString()),
      events
    };
    return state;
  }

  function save() {
    state.updatedAt = new Date().toISOString();
    ensureDir(filePath);
    fs.writeFileSync(filePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  }

  function setEnabled(enabled) {
    state.enabled = Boolean(enabled);
    save();
    return state.enabled;
  }

  function recordEvent(entry) {
    if (!state.enabled) {
      return {
        ok: false,
        skipped: true,
        reason: 'analytics_disabled'
      };
    }
    const normalized = normalizeEvent(entry);
    state.events.push(normalized);
    if (state.events.length > MAX_EVENTS) {
      state.events = state.events.slice(-MAX_EVENTS);
    }
    save();
    return {
      ok: true,
      skipped: false,
      entry: normalized
    };
  }

  function getDashboard(days = 7) {
    const durationDays = Math.max(1, Math.min(90, Math.round(toNumber(days, 7))));
    const since = Date.now() - durationDays * 24 * 60 * 60 * 1000;
    const events = state.events.filter((event) => {
      const ts = Date.parse(String(event.ts || ''));
      return Number.isFinite(ts) && ts >= since;
    });

    const latencyValues = events.map((event) => toNumber(event.latencyMs, 0)).filter((value) => value > 0);
    const totalTokens = events.reduce((sum, event) => sum + toNumber(event.totalTokens, 0), 0);

    const modelMixMap = new Map();
    const providerMixMap = new Map();

    let estimatedUsd = 0;
    for (const event of events) {
      const model = String(event.model || 'unknown');
      const provider = String(event.provider || 'unknown');
      modelMixMap.set(model, (modelMixMap.get(model) || 0) + 1);
      providerMixMap.set(provider, (providerMixMap.get(provider) || 0) + 1);
      estimatedUsd += (toNumber(event.totalTokens, 0) / 1000) * estimateUsdPer1k(provider);
    }

    const modelMix = Array.from(modelMixMap.entries())
      .map(([model, count]) => ({ model, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    const providerMix = Array.from(providerMixMap.entries())
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count);

    const latencySeries = events
      .slice(-30)
      .map((event) => ({
        ts: event.ts,
        latencyMs: toNumber(event.latencyMs, 0)
      }));

    return {
      enabled: state.enabled,
      filePath,
      windowDays: durationDays,
      eventCount: events.length,
      totalTokens,
      estimatedUsd: Number(estimatedUsd.toFixed(4)),
      medianLatencyMs: median(latencyValues),
      modelMix,
      providerMix,
      latencySeries
    };
  }

  function clear() {
    state.events = [];
    save();
    return {
      ok: true
    };
  }

  load();

  return {
    filePath,
    load,
    save,
    getState: () => ({ ...state, events: state.events.slice() }),
    setEnabled,
    recordEvent,
    getDashboard,
    clear
  };
}

module.exports = {
  createAnalyticsStore,
  resolveAnalyticsFile,
  estimateUsdPer1k
};
