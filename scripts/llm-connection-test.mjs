import process from 'node:process';
import fs from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';
import { buildRequest, parseResponse, detectProvider } from '../src/router/adapters.js';

const DEFAULT_PROVIDERS = ['mistral', 'anthropic', 'cohere', 'google', 'groq', 'togetherai', 'perplexity'];

const DEFAULT_ENDPOINT_URL = {
  openai: 'https://api.openai.com/v1/chat/completions',
  mistral: 'https://api.mistral.ai/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  cohere: 'https://api.cohere.ai',
  google: 'https://generativelanguage.googleapis.com',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  togetherai: 'https://api.together.ai/v1/chat/completions',
  perplexity: 'https://api.perplexity.ai/chat/completions'
};

const DEFAULT_MODEL = {
  openai: 'o3',
  mistral: 'mistral-small-latest',
  anthropic: 'claude-3-opus-20240229',
  cohere: 'command-r',
  google: 'gemini-pro',
  groq: 'mixtral-8x7b-32768',
  togetherai: 'meta-llama/Llama-3-8b-chat-hf',
  perplexity: 'llama-3-sonar-large-32k-online'
};

function parseArgs(argv) {
  const out = {
    live: false,
    providers: DEFAULT_PROVIDERS,
    endpointsJson: '',
    timeoutMs: 10000,
    message: 'Reply with OK',
    maxTokens: 32,
    help: false
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') out.live = true;
    else if (a === '--dry-run') out.live = false;
    else if (a === '--provider' || a === '--providers') {
      const v = argv[++i] || '';
      out.providers = v.split(',').map(s => s.trim()).filter(Boolean);
    } else if (a === '--endpoints-json') {
      out.endpointsJson = String(argv[++i] || '');
    } else if (a === '--timeout-ms') {
      out.timeoutMs = Number(argv[++i] || out.timeoutMs);
    } else if (a === '--message') {
      out.message = String(argv[++i] || out.message);
    } else if (a === '--max-tokens') {
      out.maxTokens = Number(argv[++i] || out.maxTokens);
    } else if (a === '--help' || a === '-h') {
      out.help = true;
    } else {
      out.unknown = out.unknown || [];
      out.unknown.push(a);
    }
  }

  return out;
}

function usage() {
  return [
    'Usage:',
    '  node scripts/llm-connection-test.mjs [--dry-run] [--live] [--providers mistral,anthropic,...]',
    '  node scripts/llm-connection-test.mjs [--dry-run] [--live] --endpoints-json path\\to\\endpoints.json',
    '',
    'Notes:',
    '  - Default mode is --dry-run (no network).',
    '  - --live performs real HTTPS calls and requires provider credentials in env.',
    '',
    'Endpoint JSON format:',
    '  [',
    '    {"name":"azure","url":"https://<resource>.openai.azure.com","deployment":"<dep>","model":"gpt-4o-mini"},',
    '    {"name":"bedrock","url":"https://bedrock-runtime.us-east-1.amazonaws.com","region":"us-east-1","model":"anthropic.claude-3-sonnet-20240229-v1:0"}',
    '  ]',
    '',
    'Common env vars:',
    '  MISTRAL_API_KEY, ANTHROPIC_API_KEY, COHERE_API_KEY, GOOGLE_API_KEY, GROQ_API_KEY, TOGETHER_API_KEY, PERPLEXITY_API_KEY',
    '  AZURE_OPENAI_API_KEY',
    '  AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN'
  ].join('\n');
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // leave json null
    }
    return { res, text, json };
  } finally {
    clearTimeout(timer);
  }
}

function loadEndpointsFromJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('--endpoints-json must be a JSON array');
  }
  return parsed;
}

function normalizeEndpointForTest(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid endpoint entry');
  }
  const url = String(input.url || '');
  if (!/^https?:\/\//i.test(url)) {
    throw new Error('Endpoint url must be http(s)');
  }
  const provider = String(input.provider || '').trim() || detectProvider({ url });
  const name = String(input.name || '').trim() || provider;
  const model = String(input.model || '').trim() || DEFAULT_MODEL[provider] || '';
  return { ...input, name, provider, url, model };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(usage());
    process.exit(0);
  }
  if (opts.unknown?.length) {
    console.error('Unknown args:', opts.unknown.join(' '));
    console.error(usage());
    process.exit(2);
  }

  let endpoints;
  if (opts.endpointsJson) {
    endpoints = loadEndpointsFromJson(opts.endpointsJson).map(normalizeEndpointForTest);
  } else {
    const providers = opts.providers.length ? opts.providers : DEFAULT_PROVIDERS;
    endpoints = providers.map((provider) => {
      const endpointUrl = DEFAULT_ENDPOINT_URL[provider];
      if (!endpointUrl) {
        return null;
      }
      return normalizeEndpointForTest({ name: provider, provider, url: endpointUrl, model: DEFAULT_MODEL[provider] || '' });
    }).filter(Boolean);
  }

  let failed = 0;
  for (const ep of endpoints) {
    const payload = {
      model: ep.model,
      messages: [{ role: 'user', content: opts.message }],
      temperature: 0,
      max_tokens: opts.maxTokens,
      stream: false
    };

    if (!opts.live) {
      try {
        buildRequest(ep, payload);
        console.log(`[${ep.name}] DRY: ready (provider=${ep.provider})`);
      } catch (err) {
        const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
        console.log(`[${ep.name}] DRY: ${msg}`);
      }
      continue;
    }

    let req;
    try {
      req = buildRequest(ep, payload);
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      console.log(`[${ep.name}] FAIL: ${msg}`);
      failed++;
      continue;
    }

    const { url, headers, body } = req;
    const bodyText = typeof body === 'string' ? body : JSON.stringify(body);

    const started = Date.now();
    try {
      const { res, text, json } = await fetchJsonWithTimeout(
        url,
        { method: 'POST', headers, body: bodyText },
        opts.timeoutMs
      );

      const ms = Date.now() - started;
      if (!res.ok) {
        console.log(`[${ep.name}] FAIL: HTTP ${res.status} (${ms}ms) ${text.slice(0, 240)}`);
        failed++;
        continue;
      }

      if (!json) {
        console.log(`[${ep.name}] FAIL: non-JSON response (${ms}ms) ${text.slice(0, 240)}`);
        failed++;
        continue;
      }

      const parsed = parseResponse(ep.provider, json);
      const content = String(parsed?.content || '').trim();
      if (!content) {
        console.log(`[${ep.name}] FAIL: empty content (${ms}ms)`);
        failed++;
        continue;
      }

      console.log(`[${ep.name}] PASS (${ms}ms) ${content.slice(0, 80)}`);
    } catch (err) {
      const ms = Date.now() - started;
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      console.log(`[${ep.name}] FAIL: ${msg} (${ms}ms)`);
      failed++;
      await delay(50);
    }
  }

  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});