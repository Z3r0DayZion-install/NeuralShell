const bridgeProviderCatalog = require("../bridgeProviderCatalog");
const { LLMService } = require("./llmService");

const ENV_BINDINGS = {
  ollama: {
    keyEnv: "",
    baseEnv: "OLLAMA_BASE_URL",
    modelEnv: "OLLAMA_MODEL"
  },
  openai: {
    keyEnv: "OPENAI_API_KEY",
    baseEnv: "OPENAI_BASE_URL",
    modelEnv: "OPENAI_MODEL"
  },
  openrouter: {
    keyEnv: "OPENROUTER_API_KEY",
    baseEnv: "OPENROUTER_BASE_URL",
    modelEnv: "OPENROUTER_MODEL"
  },
  groq: {
    keyEnv: "GROQ_API_KEY",
    baseEnv: "GROQ_BASE_URL",
    modelEnv: "GROQ_MODEL"
  },
  together: {
    keyEnv: "TOGETHER_API_KEY",
    baseEnv: "TOGETHER_BASE_URL",
    modelEnv: "TOGETHER_MODEL"
  },
  custom_openai: {
    keyEnv: "CUSTOM_OPENAI_API_KEY",
    baseEnv: "CUSTOM_OPENAI_BASE_URL",
    modelEnv: "CUSTOM_OPENAI_MODEL",
    requireBase: true
  }
};

function nowIso() {
  return new Date().toISOString();
}

function readEnv(env, name) {
  if (!name) return "";
  return String((env && env[name]) || "").trim();
}

function pickDefaultModel(provider, override) {
  if (override) return String(override).trim();
  const suggested = Array.isArray(provider && provider.suggestedModels)
    ? provider.suggestedModels
    : [];
  return String(suggested[0] || "llama3");
}

async function testProvider(provider, options = {}) {
  const env = options.env || process.env;
  const binding = ENV_BINDINGS[provider.id] || {
    keyEnv: "",
    baseEnv: "",
    modelEnv: ""
  };
  const overrides = options.providerOverrides
    && typeof options.providerOverrides === "object"
    ? options.providerOverrides
    : {};
  const providerOverride = overrides[provider.id] && typeof overrides[provider.id] === "object"
    ? overrides[provider.id]
    : {};
  const allowRemote = options.allowRemote !== false;

  const envApiKey = readEnv(env, binding.keyEnv);
  const envBase = readEnv(env, binding.baseEnv);
  const envModel = readEnv(env, binding.modelEnv);

  const apiKey = String(providerOverride.apiKey || envApiKey).trim();
  const baseUrl = String(
    providerOverride.baseUrl
    || envBase
    || String(provider.defaultBaseUrl || "").trim()
  ).trim();
  const model = pickDefaultModel(provider, providerOverride.model || envModel);

  const meta = {
    provider: provider.id,
    label: provider.label,
    protocol: provider.protocol,
    remote: Boolean(provider.remote),
    requiresApiKey: Boolean(provider.requiresApiKey),
    apiKeyPresent: Boolean(apiKey),
    baseUrl,
    model,
    checkedAt: nowIso()
  };

  if (provider.remote && !allowRemote) {
    return {
      ...meta,
      ok: false,
      status: "skipped",
      reason: "remote_disabled_by_policy"
    };
  }

  if (!/^https?:\/\//i.test(baseUrl)) {
    return {
      ...meta,
      ok: false,
      status: "skipped",
      reason: "invalid_or_missing_base_url"
    };
  }

  if (provider.requiresApiKey && !apiKey) {
    return {
      ...meta,
      ok: false,
      status: "skipped",
      reason: `missing_${binding.keyEnv || "API_KEY"}`
    };
  }

  if (binding.requireBase && !String(providerOverride.baseUrl || envBase).trim()) {
    return {
      ...meta,
      ok: false,
      status: "skipped",
      reason: `missing_${binding.baseEnv}`
    };
  }

  const service = new LLMService({
    provider: provider.id,
    baseUrl,
    apiKey,
    requestTimeoutMs: Number(options.requestTimeoutMs) || 12000,
    maxRetries: Number(options.maxRetries) || 0
  });

  service.configure({
    provider: provider.id,
    baseUrl,
    apiKey,
    requestTimeoutMs: Number(options.requestTimeoutMs) || 12000,
    maxRetries: Number(options.maxRetries) || 0
  });
  service.setModel(model);

  const started = Date.now();
  try {
    const models = await service.getModelList();
    const health = await service.getHealth();
    return {
      ...meta,
      ok: Boolean(health && health.ok),
      status: health && health.ok ? "connected" : "failed",
      latencyMs: Date.now() - started,
      modelCount: Array.isArray(models) ? models.length : 0,
      sampleModels: Array.isArray(models) ? models.slice(0, 5) : [],
      healthReason: health && health.reason ? String(health.reason) : ""
    };
  } catch (err) {
    return {
      ...meta,
      ok: false,
      status: "failed",
      latencyMs: Date.now() - started,
      reason: err && err.message ? String(err.message) : "unknown_error"
    };
  }
}

async function runLlmSweep(options = {}) {
  const providers = Array.isArray(bridgeProviderCatalog.PROVIDERS)
    ? bridgeProviderCatalog.PROVIDERS
    : [];
  const results = [];

  for (const provider of providers) {
    results.push(await testProvider(provider, options));
  }

  const strict = Boolean(options.strict);
  const summary = {
    generatedAt: nowIso(),
    strict,
    total: results.length,
    connected: results.filter((item) => item.status === "connected").length,
    failed: results.filter((item) => item.status === "failed").length,
    skipped: results.filter((item) => item.status === "skipped").length,
    results
  };

  if (strict) {
    summary.pass = summary.connected === summary.total;
  }

  return summary;
}

module.exports = {
  ENV_BINDINGS,
  runLlmSweep
};

