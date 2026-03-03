const LLM_ADAPTERS = {
  openai: {
    name: 'OpenAI',
    chatEndpoint: '/v1/chat/completions',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      model: payload.model,
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      stream: payload.stream
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      const content = data.choices?.[0]?.delta?.content;
      return content || '';
    }
  },

  anthropic: {
    name: 'Anthropic',
    chatEndpoint: 'https://api.anthropic.com/v1/messages',
    auth: 'Bearer',
    authHeader: 'x-api-key',
    transformRequest: (payload) => ({
      model: payload.model || 'claude-3-opus-20240229',
      messages: payload.messages,
      max_tokens: payload.max_tokens || 1024,
      temperature: payload.temperature
    }),
    transformResponse: (data) => ({
      content: data.content?.[0]?.text || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      const content = data.delta?.text;
      return content || '';
    }
  },

  google: {
    name: 'Google AI (Gemini)',
    chatEndpoint: 'https://generativelanguage.googleapis.com/v1/models/{model}:generateContent',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      contents: payload.messages.map(m => ({ role: m.role, parts: [{ text: m.content }] })),
      generationConfig: {
        temperature: payload.temperature,
        maxOutputTokens: payload.max_tokens
      }
    }),
    transformResponse: (data) => ({
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: data.modelVersion,
      usage: data.usageMetadata
    }),
    transformStreamChunk: (data) => {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
  },

  cohere: {
    name: 'Cohere',
    chatEndpoint: 'https://api.cohere.ai/v1/chat',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      model: payload.model || 'command-r',
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens
    }),
    transformResponse: (data) => ({
      content: data.text || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.text || '';
    }
  },

  mistral: {
    name: 'Mistral AI',
    chatEndpoint: 'https://api.mistral.ai/v1/chat/completions',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      model: payload.model || 'mistral-small-latest',
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.choices?.[0]?.delta?.content || '';
    }
  },

  azure: {
    name: 'Azure OpenAI',
    chatEndpoint: '/openai/deployments/{deployment}/chat/completions?api-version=2024-02-01',
    auth: 'Bearer',
    extraHeaders: (config) => ({ 'api-key': config.apiKey }),
    transformRequest: (payload) => ({
      model: payload.model,
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      stream: payload.stream
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.choices?.[0]?.delta?.content || '';
    }
  },

  bedrock: {
    name: 'AWS Bedrock',
    chatEndpoint: 'https://bedrock-runtime.{region}.amazonaws.com/model/{model}/converse',
    auth: 'AWS4',
    transformRequest: (payload) => ({
      messages: payload.messages.map(m => ({ role: m.role, content: [{ text: m.content }] })),
      inferenceConfig: {
        temperature: payload.temperature,
        maxTokens: payload.max_tokens
      }
    }),
    transformResponse: (data) => ({
      content: data.output.message.content[0]?.text || '',
      model: data.metrics?.latencyMs,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.output.message?.content?.[0]?.text || '';
    }
  },

  ollama: {
    name: 'Ollama',
    chatEndpoint: '/api/chat',
    auth: 'None',
    transformRequest: (payload) => ({
      model: payload.model || 'llama3',
      messages: payload.messages,
      stream: payload.stream
    }),
    transformResponse: (data) => ({
      content: data.message?.content || data.response || '',
      model: data.model,
      usage: { prompt_tokens: data.prompt_eval_count, completion_tokens: data.eval_count }
    }),
    transformStreamChunk: (data) => {
      return data.message?.content || data.delta?.content || '';
    }
  },

  localai: {
    name: 'LocalAI',
    chatEndpoint: '/v1/chat/completions',
    auth: 'None',
    transformRequest: (payload) => ({
      model: payload.model || 'llama2',
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      stream: payload.stream
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.choices?.[0]?.delta?.content || '';
    }
  },

  togetherai: {
    name: 'Together AI',
    chatEndpoint: 'https://api.together.ai/v1/chat/completions',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      model: payload.model || 'meta-llama/Llama-3-8b-chat-hf',
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      stream: payload.stream
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.choices?.[0]?.delta?.content || '';
    }
  },

  groq: {
    name: 'Groq',
    chatEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      model: payload.model || 'mixtral-8x7b-32768',
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens,
      stream: payload.stream
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.choices?.[0]?.delta?.content || '';
    }
  },

  perplexity: {
    name: 'Perplexity',
    chatEndpoint: 'https://api.perplexity.ai/chat/completions',
    auth: 'Bearer',
    transformRequest: (payload) => ({
      model: payload.model || 'llama-3-sonar-large-32k-online',
      messages: payload.messages,
      temperature: payload.temperature,
      max_tokens: payload.max_tokens
    }),
    transformResponse: (data) => ({
      content: data.choices?.[0]?.message?.content || '',
      model: data.model,
      usage: data.usage
    }),
    transformStreamChunk: (data) => {
      return data.choices?.[0]?.delta?.content || '';
    }
  }
};

function detectProvider(endpoint) {
  const url = endpoint.url || '';

  if (url.includes('openai.com')) {
    return 'openai';
  }
  if (url.includes('anthropic.com')) {
    return 'anthropic';
  }
  if (url.includes('googleapis.com')) {
    return 'google';
  }
  if (url.includes('cohere.ai')) {
    return 'cohere';
  }
  if (url.includes('mistral.ai')) {
    return 'mistral';
  }
  if (url.includes('azure.com')) {
    return 'azure';
  }
  if (url.includes('bedrock')) {
    return 'bedrock';
  }
  if (url.includes('ollama')) {
    return 'ollama';
  }
  if (url.includes('localai')) {
    return 'localai';
  }
  if (url.includes('together.ai')) {
    return 'togetherai';
  }
  if (url.includes('groq.com')) {
    return 'groq';
  }
  if (url.includes('perplexity.ai')) {
    return 'perplexity';
  }

  return 'openai';
}

function getAdapter(endpoint) {
  const provider = endpoint.provider || detectProvider(endpoint);
  return LLM_ADAPTERS[provider] || LLM_ADAPTERS.openai;
}

function buildRequest(endpoint, payload, adapter = null) {
  const a = adapter || getAdapter(endpoint);

  const url = endpoint.url.includes(a.chatEndpoint)
    ? endpoint.url
    : endpoint.url.replace(/\/$/, '') + a.chatEndpoint;

  const headers = {
    'Content-Type': 'application/json'
  };

  if (a.auth === 'Bearer') {
    headers['Authorization'] = `Bearer ${endpoint.apiKey || process.env.OPENAI_API_KEY}`;
  }

  if (a.authHeader && endpoint.apiKey) {
    headers[a.authHeader] = endpoint.apiKey;
  }

  if (a.extraHeaders) {
    Object.assign(headers, a.extraHeaders(endpoint));
  }

  const body = a.transformRequest(payload);

  return { url, headers, body };
}

function parseResponse(adapterName, data) {
  const adapter = LLM_ADAPTERS[adapterName] || LLM_ADAPTERS.openai;
  return adapter.transformResponse(data);
}

function parseStreamChunk(adapterName, data) {
  const adapter = LLM_ADAPTERS[adapterName] || LLM_ADAPTERS.openai;
  return adapter.transformStreamChunk(data);
}

function getSupportedProviders() {
  return Object.entries(LLM_ADAPTERS).map(([key, adapter]) => ({
    id: key,
    name: adapter.name
  }));
}

export {
  LLM_ADAPTERS,
  detectProvider,
  getAdapter,
  buildRequest,
  parseResponse,
  parseStreamChunk,
  getSupportedProviders
};
