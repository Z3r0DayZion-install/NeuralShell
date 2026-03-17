(function initBridgeProviderCatalog(root, factory) {
  const catalog = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = catalog;
  }
  root.NeuralShellBridgeProviderCatalog = catalog;
})(typeof globalThis !== "undefined" ? globalThis : this, function buildBridgeProviderCatalog() {
  const PROVIDERS = [
    {
      id: "ollama",
      label: "Ollama (Local)",
      protocol: "ollama",
      defaultBaseUrl: "http://127.0.0.1:11434",
      remote: false,
      requiresApiKey: false,
      suggestedModels: ["llama3", "mistral", "qwen2.5-coder:7b"],
      hint: "Local Ollama bridge on your machine."
    },
    {
      id: "openai",
      label: "OpenAI",
      protocol: "openai",
      defaultBaseUrl: "https://api.openai.com",
      remote: true,
      requiresApiKey: true,
      suggestedModels: ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4.1"],
      hint: "Hosted OpenAI chat completions."
    },
    {
      id: "openrouter",
      label: "OpenRouter",
      protocol: "openai",
      defaultBaseUrl: "https://openrouter.ai/api",
      remote: true,
      requiresApiKey: true,
      suggestedModels: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "meta-llama/llama-3.3-70b-instruct"],
      hint: "OpenAI-compatible routed model gateway."
    },
    {
      id: "groq",
      label: "Groq",
      protocol: "openai",
      defaultBaseUrl: "https://api.groq.com/openai",
      remote: true,
      requiresApiKey: true,
      suggestedModels: ["llama-3.3-70b-versatile", "llama3-8b-8192", "mixtral-8x7b-32768"],
      hint: "Fast hosted OpenAI-compatible inference."
    },
    {
      id: "together",
      label: "Together",
      protocol: "openai",
      defaultBaseUrl: "https://api.together.xyz",
      remote: true,
      requiresApiKey: true,
      suggestedModels: [
        "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo",
        "Qwen/Qwen2.5-Coder-32B-Instruct"
      ],
      hint: "Hosted OpenAI-compatible open-model gateway."
    },
    {
      id: "custom_openai",
      label: "Custom OpenAI-Compatible",
      protocol: "openai",
      defaultBaseUrl: "https://api.example.com",
      remote: true,
      requiresApiKey: true,
      suggestedModels: [],
      hint: "Any hosted or self-hosted OpenAI-compatible endpoint."
    }
  ];

  const providerMap = Object.fromEntries(PROVIDERS.map((provider) => [provider.id, provider]));

  function normalizeBridgeProviderId(id) {
    const normalized = String(id || "").trim().toLowerCase();
    return providerMap[normalized] ? normalized : "ollama";
  }

  function getBridgeProvider(id) {
    return providerMap[normalizeBridgeProviderId(id)] || providerMap.ollama;
  }

  function suggestedModelsForProvider(id) {
    const provider = getBridgeProvider(id);
    return Array.isArray(provider.suggestedModels) ? provider.suggestedModels.slice() : [];
  }

  function isRemoteBridgeProvider(id) {
    return Boolean(getBridgeProvider(id).remote);
  }

  return {
    PROVIDERS,
    getBridgeProvider,
    normalizeBridgeProviderId,
    suggestedModelsForProvider,
    isRemoteBridgeProvider
  };
});
