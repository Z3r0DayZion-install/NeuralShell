import crypto from 'crypto';
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
    authHeader: 'api-key',
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
  const provider = endpoint.provider || detectProvider(endpoint);
  const a = adapter || getAdapter({ ...endpoint, provider });

  const templateVars = {
    model: payload?.model || endpoint.model || '',
    deployment: payload?.deployment || endpoint.deployment || '',
    region: payload?.region || endpoint.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || ''
  };

  function applyTemplate(input) {
    return String(input).replace(/\{(\w+)\}/g, (_m, key) => {
      const val = templateVars[key];
      return val === null || val === undefined ? '' : String(val);
    });
  }

  const chatEndpoint = a.chatEndpoint || '';
  let url;
  if (/^https?:\/\//i.test(chatEndpoint)) {
    url = chatEndpoint;
  } else if (endpoint.url.includes(chatEndpoint)) {
    url = endpoint.url;
  } else {
    url = endpoint.url.replace(/\/$/, '') + chatEndpoint;
  }
  url = applyTemplate(url);

  // AWS SigV4 (Bedrock)
  if (a.auth === 'AWS4') {
    const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    const awsSessionToken = process.env.AWS_SESSION_TOKEN || '';
    const region = templateVars.region || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || '';
    if (!region) {
      throw new Error('AWS_REGION is not set');
    }
    if (!awsAccessKeyId) {
      throw new Error('AWS_ACCESS_KEY_ID is not set');
    }
    if (!awsSecretAccessKey) {
      throw new Error('AWS_SECRET_ACCESS_KEY is not set');
    }

    const bodyObj = a.transformRequest({
      ...payload,
      model: payload?.model || endpoint.model
    });
    const bodyText = JSON.stringify(bodyObj);

    const urlObj = new URL(url);
    const method = 'POST';
    const service = 'bedrock';
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const sha256Hex = (data) => crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    const hmac = (key, data) => crypto.createHmac('sha256', key).update(data, 'utf8').digest();
    const hmacHex = (key, data) => crypto.createHmac('sha256', key).update(data, 'utf8').digest('hex');
    const encodeRfc3986 = (str) => encodeURIComponent(str).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

    const canonicalQuery = (() => {
      const pairs = [];
      for (const [k, v] of urlObj.searchParams) {
        pairs.push([encodeRfc3986(k), encodeRfc3986(v)]);
      }
      pairs.sort((left, right) => (
        left[0] < right[0]
          ? -1
          : left[0] > right[0]
            ? 1
            : left[1] < right[1]
              ? -1
              : left[1] > right[1]
                ? 1
                : 0
      ));
      return pairs.map(([k, v]) => `${k}=${v}`).join('&');
    })();

    const payloadHash = sha256Hex(bodyText);
    const headersToSign = {
      'content-type': 'application/json',
      host: urlObj.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate
    };
    if (awsSessionToken) {
      headersToSign['x-amz-security-token'] = awsSessionToken;
    }

    const signedHeaderNames = Object.keys(headersToSign).sort();
    const canonicalHeaders = signedHeaderNames.map((k) => `${k}:${String(headersToSign[k]).trim()}\n`).join('');
    const signedHeaders = signedHeaderNames.join(';');

    const canonicalRequest = [
      method,
      urlObj.pathname,
      canonicalQuery,
      canonicalHeaders,
      signedHeaders,
      payloadHash
    ].join('\n');

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256Hex(canonicalRequest)
    ].join('\n');

    const kDate = hmac('AWS4' + awsSecretAccessKey, dateStamp);
    const kRegion = hmac(kDate, region);
    const kService = hmac(kRegion, service);
    const kSigning = hmac(kService, 'aws4_request');
    const signature = hmacHex(kSigning, stringToSign);

    const authorization = `AWS4-HMAC-SHA256 Credential=${awsAccessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const signedHeadersObj = {
      'Content-Type': 'application/json',
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      ...(awsSessionToken ? { 'x-amz-security-token': awsSessionToken } : {}),
      Authorization: authorization
    };

    return { url, headers: signedHeadersObj, body: bodyText };
  }

  url = applyTemplate(url);

  const headers = {
    'Content-Type': 'application/json'
  };

  const envVarForProvider = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_API_KEY',
    cohere: 'COHERE_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    azure: 'AZURE_OPENAI_API_KEY',
    bedrock: 'AWS_ACCESS_KEY_ID',
    togetherai: 'TOGETHER_API_KEY',
    groq: 'GROQ_API_KEY',
    perplexity: 'PERPLEXITY_API_KEY',
    localai: 'LOCALAI_API_KEY',
    ollama: ''
  };

  const envVar = envVarForProvider[provider] || '';
  const resolvedApiKey = endpoint.apiKey || (envVar ? process.env[envVar] : '') || '';

  const requiresKey = provider !== 'ollama' && a.auth !== 'None';
  if (requiresKey && !resolvedApiKey) {
    if (envVar) {
      throw new Error(`${envVar} is not set`);
    }
    throw new Error('API key is not set');
  }

  const endpointWithKey = resolvedApiKey
    ? { ...endpoint, apiKey: resolvedApiKey, provider }
    : { ...endpoint, provider };

  if (a.auth === 'Bearer' && !a.authHeader) {
    headers['Authorization'] = `Bearer ${resolvedApiKey}`;
  }

  if (a.authHeader) {
    headers[a.authHeader] = resolvedApiKey;
  }

  if (a.extraHeaders) {
    Object.assign(headers, a.extraHeaders(endpointWithKey));
  }

  const body = a.transformRequest({
    ...payload,
    model: payload?.model || endpoint.model
  });

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
