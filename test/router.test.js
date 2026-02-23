import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { buildServer } from '../router.js';

function jsonResponse(jsonBody, opts = {}) {
  return {
    ok: opts.ok ?? true,
    status: opts.status ?? 200,
    json: async () => jsonBody,
    text: async () => (typeof opts.text === 'string' ? opts.text : JSON.stringify(jsonBody))
  };
}

test('GET /health returns ok', async () => {
  const app = buildServer({
    endpoints: [],
    fetchImpl: async () => jsonResponse({}),
    timeoutMs: 50
  });
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().ok, true);
  assert.equal(typeof res.json().degraded, 'boolean');
  await app.close();
});

test('POST /prompt rejects invalid payload', async () => {
  const app = buildServer({
    endpoints: [],
    fetchImpl: async () => jsonResponse({}),
    timeoutMs: 50
  });
  const res = await app.inject({ method: 'POST', url: '/prompt', payload: {} });
  assert.equal(res.statusCode, 400);
  assert.match(res.json().error, /messages\[\] is required/i);
  assert.equal(typeof res.json().requestId, 'string');
  assert.equal(typeof res.headers['x-request-id'], 'string');
  await app.close();
});

test('POST /prompt falls back and succeeds on second endpoint', async () => {
  const fakeFetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    if (body.model === 'o3') {
      throw new Error('upstream down');
    }
    return jsonResponse({ choices: [{ message: { role: 'assistant', content: 'ok' } }] });
  };

  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: fakeFetch,
    timeoutMs: 100
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  const data = res.json();
  assert.equal(typeof data.requestId, 'string');
  assert.equal(data.endpoint, 'gpt-5.2-turbo');
  assert.equal(data.message.content, 'ok');
  assert.equal(typeof data.latencyMs, 'number');
  await app.close();
});

test('POST /prompt returns 502 with endpoint failures', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }
    ],
    fetchImpl: async (_url, opts) => {
      const payload = JSON.parse(opts.body);
      if (payload.model === 'o3') {
        return jsonResponse({ error: 'rate limited' }, { ok: false, status: 429, text: 'rate limited' });
      }
      return jsonResponse({ error: 'backend down' }, { ok: false, status: 503, text: 'backend down' });
    },
    timeoutMs: 100
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 502);
  const data = res.json();
  assert.equal(data.error, 'All endpoints failed');
  assert.equal(typeof data.requestId, 'string');
  assert.equal(data.failures.length, 2);
  const failureErrors = data.failures.map((f) => f.error).join('\n');
  assert.match(failureErrors, /OpenAI request failed/i);
  assert.match(failureErrors, /Ollama request failed/i);
  await app.close();
});

test('POST /prompt rejects empty message content', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: '   ' }] }
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.json().error, /non-empty string/i);
  assert.equal(typeof res.json().requestId, 'string');
  await app.close();
});

test('GET /ready exposes runtime config', async () => {
  const app = buildServer({
    endpoints: [{ name: 'primary', url: 'https://example.com', model: 'x' }],
    timeoutMs: 1234,
    bodyLimit: 4321
  });
  const res = await app.inject({ method: 'GET', url: '/ready' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().ok, true);
  assert.equal(res.json().degraded, false);
  assert.equal(res.json().timeoutMs, 1234);
  assert.equal(res.json().bodyLimit, 4321);
  assert.deepEqual(res.json().endpoints, ['primary']);
  await app.close();
});

test('POST /prompt reports timeout when upstream hangs', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    endpoints: [{ name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' }],
    fetchImpl: (_url, options = {}) =>
      new Promise((_, reject) => {
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          }, { once: true });
        }
      }),
    timeoutMs: 25
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 502);
  assert.match(res.json().failures[0].error, /timeout/i);
  await app.close();
});

test('POST /prompt enforces max messages and content length', async () => {
  const app = buildServer({ endpoints: [] });
  const tooManyMessages = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: Array.from({ length: 65 }, () => ({ role: 'user', content: 'x' })) }
  });
  assert.equal(tooManyMessages.statusCode, 400);
  assert.match(tooManyMessages.json().error, /exceeds max length/i);

  const tooLongContent = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'x'.repeat(8001) }] }
  });
  assert.equal(tooLongContent.statusCode, 400);
  assert.match(tooLongContent.json().error, /exceeds max chars/i);
  await app.close();
});

test('GET /metrics/json reports aggregate counters', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });

  const before = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(before.statusCode, 200);
  assert.equal(before.json().totalRequests, 0);

  const prompt = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(prompt.statusCode, 200);

  const after = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(after.statusCode, 200);
  assert.equal(after.json().totalRequests, 1);
  assert.equal(after.json().successRequests, 1);
  assert.equal(after.json().failedRequests, 0);
  assert.equal(after.json().rejectedRequests, 0);
  assert.equal(typeof after.json().latency, 'object');
  await app.close();
});

test('GET /metrics emits Prometheus text payload', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/metrics' });
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['content-type'], /text\/plain/i);
  assert.match(res.body, /neuralshell_uptime_seconds/);
  assert.match(res.body, /neuralshell_requests_total/);
  assert.match(res.body, /neuralshell_failures_total/);
  await app.close();
});

test('POST /prompt enforces max concurrent requests', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    maxConcurrentRequests: 1,
    maxQueueSize: 1,
    requestQueueTimeoutMs: 1,
    timeoutMs: 1000,
    fetchImpl: async () => {
      await new Promise((resolve) => setTimeout(resolve, 120));
      return jsonResponse({ response: 'ok' });
    }
  });

  const firstRequest = app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'first' }] }
  });

  await new Promise((resolve) => setTimeout(resolve, 20));
  const secondRequest = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'second' }] }
  });
  assert.equal(secondRequest.statusCode, 429);
  assert.match(secondRequest.json().error, /too many concurrent requests/i);

  const firstResponse = await firstRequest;
  assert.equal(firstResponse.statusCode, 200);
  await app.close();
});

test('buildServer reads endpoints from ROUTER_ENDPOINTS_JSON', async () => {
  process.env.ROUTER_ENDPOINTS_JSON = JSON.stringify([
    { name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }
  ]);

  const app = buildServer({
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const ready = await app.inject({ method: 'GET', url: '/ready' });
  assert.equal(ready.statusCode, 200);
  assert.deepEqual(ready.json().endpoints, ['ollama-local']);

  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().endpoint, 'ollama-local');
  await app.close();
  delete process.env.ROUTER_ENDPOINTS_JSON;
});

test('POST /prompt accepts x-client-request-id and echoes it', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-client-request-id': 'client.req-123' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().requestId, 'client.req-123');
  assert.equal(res.headers['x-request-id'], 'client.req-123');
  await app.close();
});

test('POST /prompt rejects invalid x-client-request-id', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-client-request-id': 'bad id with spaces' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.json().error, /invalid x-client-request-id/i);
  await app.close();
});

test('GET /endpoints returns per-endpoint runtime state', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({ method: 'GET', url: '/endpoints' });
  assert.equal(res.statusCode, 200);
  const payload = res.json();
  assert.equal(payload.endpoints.length, 1);
  assert.equal(payload.endpoints[0].name, 'ollama-local');
  assert.equal(typeof payload.endpoints[0].totalSuccesses, 'number');
  await app.close();
});

test('endpoint cooldown skips failing endpoint and uses fallback', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  let o3Calls = 0;
  const app = buildServer({
    adaptiveRouting: false,
    endpointCooldownMs: 200,
    maxEndpointFailuresBeforeCooldown: 1,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      if (body.model === 'o3') {
        o3Calls += 1;
        throw new Error('o3 down');
      }
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: 'fallback-ok' } }] });
    }
  });

  const first = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(first.statusCode, 200);
  assert.equal(first.json().endpoint, 'gpt-5.2-turbo');

  const second = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello again' }] }
  });
  assert.equal(second.statusCode, 200);
  assert.equal(second.json().endpoint, 'gpt-5.2-turbo');
  assert.equal(o3Calls, 1);
  await app.close();
});

test('failure details can be masked when exposeUpstreamErrors is false', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    exposeUpstreamErrors: false,
    endpoints: [{ name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' }],
    fetchImpl: async () => {
      throw new Error('very specific secret-ish failure');
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 502);
  assert.equal(
    res.json().failures[0].error === 'Upstream request failed'
      || /cooling down/i.test(res.json().failures[0].error),
    true
  );
  await app.close();
});

test('invalid ROUTER_ENDPOINTS_JSON throws during server creation', async () => {
  process.env.ROUTER_ENDPOINTS_JSON = '{not-json';
  assert.throws(() => buildServer(), /Unexpected token|JSON/i);
  delete process.env.ROUTER_ENDPOINTS_JSON;
});

test('POST /prompt includes structured error code for invalid payload', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'POST', url: '/prompt', payload: {} });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVALID_PAYLOAD');
  await app.close();
});

test('strict role validation rejects unknown role when enabled', async () => {
  const app = buildServer({ endpoints: [], strictRoleValidation: true });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'unknown', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.json().error, /role is not allowed/i);
  await app.close();
});

test('max total message chars limit is enforced', async () => {
  const app = buildServer({ endpoints: [], maxTotalMessageChars: 10 });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: '12345' }, { role: 'user', content: '67890x' }] }
  });
  assert.equal(res.statusCode, 400);
  assert.match(res.json().error, /total chars exceeds max/i);
  await app.close();
});

test('response content is truncated to RESPONSE_MAX_CHARS', async () => {
  const app = buildServer({
    responseMaxChars: 5,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: '123456789' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().message.content, '12345');
  assert.equal(res.json().message.truncated, true);
  await app.close();
});

test('routing selects valid models across sequential requests', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const seenFirstModels = [];
  const app = buildServer({
    adaptiveRouting: false,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      seenFirstModels.push(body.model);
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: body.model } }] });
    }
  });

  await app.inject({ method: 'POST', url: '/prompt', payload: { messages: [{ role: 'user', content: 'a' }] } });
  await app.inject({ method: 'POST', url: '/prompt', payload: { messages: [{ role: 'user', content: 'b' }] } });
  assert.equal(seenFirstModels.length >= 2, true);
  assert.equal(seenFirstModels.every((m) => ['o3', 'gpt-5.2-turbo'].includes(m)), true);
  await app.close();
});

test('timeout retries before failing', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  let calls = 0;
  const app = buildServer({
    retryOnTimeout: 1,
    retryBackoffMs: 1,
    timeoutMs: 20,
    endpoints: [{ name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' }],
    fetchImpl: (_url, options = {}) =>
      new Promise((_, reject) => {
        calls += 1;
        if (options.signal) {
          options.signal.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          }, { once: true });
        }
      })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 502);
  assert.equal(calls, 2);
  await app.close();
});

test('GET /config returns effective runtime policy', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/config' });
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.json().maxConcurrentRequests, 'number');
  assert.equal(typeof res.json().maxTotalMessageChars, 'number');
  await app.close();
});

test('POST /metrics/reset requires token and resets counters', async () => {
  const app = buildServer({
    resetMetricsToken: 'token-123',
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const deny = await app.inject({ method: 'POST', url: '/metrics/reset' });
  assert.equal(deny.statusCode, 403);
  assert.equal(deny.json().code, 'METRICS_RESET_FORBIDDEN');

  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  const before = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(before.json().totalRequests, 1);

  const allow = await app.inject({
    method: 'POST',
    url: '/metrics/reset',
    headers: { 'x-reset-token': 'token-123' }
  });
  assert.equal(allow.statusCode, 200);

  const after = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(after.json().totalRequests, 0);
  await app.close();
});

test('DISABLED_ENDPOINTS removes endpoints from active routing', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  let usedModel = '';
  const app = buildServer({
    disabledEndpoints: ['o3'],
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      usedModel = body.model;
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: 'ok' } }] });
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(usedModel, 'gpt-5.2-turbo');
  await app.close();
});

test('GET /health supports details mode', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/health?details=1' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().ok, true);
  assert.equal(typeof res.json().uptimeSec, 'number');
  await app.close();
});

test('admin token gates /config and /endpoints', async () => {
  const app = buildServer({
    adminToken: 'admin-1',
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
  });
  const denied = await app.inject({ method: 'GET', url: '/config' });
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.json().code, 'ADMIN_FORBIDDEN');

  const allowed = await app.inject({
    method: 'GET',
    url: '/config',
    headers: { 'x-admin-token': 'admin-1' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(typeof allowed.json().appVersion, 'string');
  await app.close();
});

test('GET /version returns app version and start time', async () => {
  const app = buildServer({ endpoints: [], appVersion: '1.2.3-test' });
  const res = await app.inject({ method: 'GET', url: '/version' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().version, '1.2.3-test');
  assert.equal(typeof res.json().startedAt, 'string');
  await app.close();
});

test('POST /endpoints/reset clears cooldown state', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    adminToken: 'a',
    endpointCooldownMs: 5000,
    maxEndpointFailuresBeforeCooldown: 1,
    endpoints: [{ name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' }],
    fetchImpl: async () => {
      throw new Error('fail');
    }
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  const before = await app.inject({
    method: 'GET',
    url: '/endpoints',
    headers: { 'x-admin-token': 'a' }
  });
  assert.equal(before.json().endpoints[0].inCooldown, true);

  const reset = await app.inject({
    method: 'POST',
    url: '/endpoints/reset',
    headers: { 'x-admin-token': 'a' }
  });
  assert.equal(reset.statusCode, 200);
  const after = await app.inject({
    method: 'GET',
    url: '/endpoints',
    headers: { 'x-admin-token': 'a' }
  });
  assert.equal(after.json().endpoints[0].inCooldown, false);
  await app.close();
});

test('rate limit returns 429 after threshold', async () => {
  const app = buildServer({
    requestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const first = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(first.statusCode, 200);
  const second = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello2' }] }
  });
  assert.equal(second.statusCode, 429);
  assert.equal(second.json().code, 'RATE_LIMITED');
  await app.close();
});

test('dry-run skips upstream fetch when enabled', async () => {
  let calls = 0;
  const app = buildServer({
    allowDryRun: true,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ response: 'ok' });
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-dry-run': '1' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().dryRun, true);
  assert.equal(calls, 0);
  await app.close();
});

test('skip openai without key falls back to local endpoint', async () => {
  delete process.env.OPENAI_API_KEY;
  const app = buildServer({
    skipOpenAIWhenNoKey: true,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      if (body.model === 'llama3') {
        return jsonResponse({ response: 'local-ok' });
      }
      throw new Error('should not call openai');
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().endpoint, 'ollama-local');
  await app.close();
});

test('includeFailuresOnSuccess returns prior failures payload', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    adaptiveRouting: false,
    includeFailuresOnSuccess: true,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      if (body.model === 'o3') {
        throw new Error('first failed');
      }
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: 'ok' } }] });
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.json().priorFailures), true);
  assert.equal(res.json().priorFailures.length, 1);
  await app.close();
});

test('metrics include routeCounts and rateLimitedRequests', async () => {
  const app = buildServer({
    requestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'a' }] }
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'b' }] }
  });
  const metrics = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(metrics.statusCode, 200);
  assert.equal(metrics.json().routeCounts['/prompt'] >= 2, true);
  assert.equal(metrics.json().rateLimitedRequests >= 1, true);
  await app.close();
});

test('prompt token auth rejects missing token', async () => {
  const app = buildServer({
    promptApiToken: 'secret-token',
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 401);
  assert.equal(res.json().code, 'PROMPT_AUTH_FAILED');
  await app.close();
});

test('blocked terms moderation rejects payload', async () => {
  const app = buildServer({
    blockedTerms: ['forbidden'],
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'this is forbidden content' }] }
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'BLOCKED_CONTENT');
  await app.close();
});

test('endpoint reload replaces active endpoint set', async () => {
  const app = buildServer({
    adminToken: 'admin',
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/endpoints/reload',
    headers: { 'x-admin-token': 'admin' },
    payload: {
      endpoints: [{ name: 'local2', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
    }
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.json().endpoints, ['local2']);
  await app.close();
});

test('endpoint request budget forces fallback', async () => {
  process.env.OPENAI_API_KEY = 'x';
  const app = buildServer({
    endpointRequestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: body.model } }] });
    }
  });
  const first = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'one' }] }
  });
  const second = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'two' }] }
  });
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.notEqual(first.json().endpoint, second.json().endpoint);
  await app.close();
});

test('security headers are set by default', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['x-frame-options'], 'DENY');
  await app.close();
});

test('OPTIONS /prompt returns 204 for preflight', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'OPTIONS', url: '/prompt' });
  assert.equal(res.statusCode, 204);
  await app.close();
});

test('requireJsonContentType enforces application/json', async () => {
  const app = buildServer({
    requireJsonContentType: true,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'content-type': 'text/plain' },
    payload: 'hello'
  });
  assert.equal(res.statusCode, 415);
  assert.equal(res.json().code, 'UNSUPPORTED_CONTENT_TYPE');
  await app.close();
});

test('reload rejects duplicate endpoint names', async () => {
  const app = buildServer({
    adminToken: 'admin',
    endpoints: [{ name: 'base', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
  });
  const res = await app.inject({
    method: 'POST',
    url: '/endpoints/reload',
    headers: { 'x-admin-token': 'admin' },
    payload: {
      endpoints: [
        { name: 'dup', url: 'http://localhost:11434/api/generate', model: 'llama3' },
        { name: 'dup', url: 'http://localhost:11435/api/generate', model: 'llama3' }
      ]
    }
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVALID_ENDPOINTS');
  await app.close();
});

test('reload rejects endpoint set over maxEndpoints', async () => {
  const app = buildServer({
    adminToken: 'admin',
    maxEndpoints: 1,
    endpoints: [{ name: 'base', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
  });
  const res = await app.inject({
    method: 'POST',
    url: '/endpoints/reload',
    headers: { 'x-admin-token': 'admin' },
    payload: {
      endpoints: [
        { name: 'a', url: 'http://localhost:11434/api/generate', model: 'llama3' },
        { name: 'b', url: 'http://localhost:11435/api/generate', model: 'llama3' }
      ]
    }
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVALID_ENDPOINTS');
  await app.close();
});

test('rate limited response includes retry-after header', async () => {
  const app = buildServer({
    requestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'a' }] }
  });
  const limited = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'b' }] }
  });
  assert.equal(limited.statusCode, 429);
  assert.equal(typeof limited.headers['retry-after'], 'string');
  await app.close();
});

test('metrics include endpointStats and upstream failure counters', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      throw new Error('boom');
    }
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  const metrics = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(metrics.statusCode, 200);
  assert.equal(Array.isArray(metrics.json().endpointStats), true);
  assert.equal(typeof metrics.json().upstreamFailures, 'number');
  assert.equal(typeof metrics.json().timeoutFailures, 'number');
  await app.close();
});

test('admin audit endpoint returns recent entries', async () => {
  const app = buildServer({
    adminToken: 'admin',
    adminAuditLog: 'state/router_admin_audit_test.log',
    endpoints: [{ name: 'base', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
  });
  await app.inject({
    method: 'POST',
    url: '/endpoints/reset',
    headers: { 'x-admin-token': 'admin' }
  });
  const res = await app.inject({
    method: 'GET',
    url: '/admin/audit/recent?limit=5',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().ok, true);
  assert.equal(Array.isArray(res.json().entries), true);
  await app.close();
});

test('prompt rejects array payload with INVALID_PAYLOAD_TYPE', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: []
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVALID_PAYLOAD_TYPE');
  await app.close();
});

test('idempotency key replays cached success and avoids second upstream call', async () => {
  let calls = 0;
  const app = buildServer({
    idempotencyTtlMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ response: 'cached-ok' });
    }
  });
  const first = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-key-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  const second = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-key-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 200);
  assert.equal(first.headers['x-idempotency-hit'], '0');
  assert.equal(second.headers['x-idempotency-hit'], '1');
  assert.equal(calls, 1);
  await app.close();
});

test('idempotency key expires after ttl', async () => {
  let calls = 0;
  const app = buildServer({
    idempotencyTtlMs: 15,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ response: 'ok' });
    }
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-expire-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  const second = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-expire-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(second.statusCode, 200);
  assert.equal(calls, 2);
  await app.close();
});

test('invalid idempotency key is rejected', async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'bad key with spaces' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVALID_IDEMPOTENCY_KEY');
  await app.close();
});

test('admin idempotency reset clears cache', async () => {
  let calls = 0;
  const app = buildServer({
    adminToken: 'admin',
    idempotencyTtlMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ response: 'ok' });
    }
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-reset-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  const reset = await app.inject({
    method: 'POST',
    url: '/admin/idempotency/reset',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(reset.statusCode, 200);
  const after = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-reset-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(after.statusCode, 200);
  assert.equal(calls, 2);
  await app.close();
});

test('prometheus metrics endpoint emits text payload', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/metrics/prometheus' });
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['content-type'], /text\/plain/);
  assert.match(res.body, /neuralshell_requests_total/);
  await app.close();
});

test('metrics expose memory and idempotency counters', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.json().memoryRssBytes, 'number');
  assert.equal(typeof res.json().idempotencyHits, 'number');
  assert.equal(typeof res.json().idempotencyActiveKeys, 'number');
  await app.close();
});

test('idempotency key conflict returns 409 on payload mismatch', async () => {
  const app = buildServer({
    idempotencyTtlMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-conflict-12345' },
    payload: { messages: [{ role: 'user', content: 'first' }] }
  });
  const conflict = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-conflict-12345' },
    payload: { messages: [{ role: 'user', content: 'second' }] }
  });
  assert.equal(conflict.statusCode, 409);
  assert.equal(conflict.json().code, 'IDEMPOTENCY_PAYLOAD_MISMATCH');
  await app.close();
});

test('admin runtime snapshot is token-gated and returns state', async () => {
  const app = buildServer({
    adminToken: 'admin',
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
  });
  const denied = await app.inject({ method: 'GET', url: '/admin/runtime/snapshot' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'GET',
    url: '/admin/runtime/snapshot',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.json().ok, true);
  assert.equal(typeof allowed.json().config.maxConcurrentRequests, 'number');
  await app.close();
});

test('admin runtime persist is token-gated', async () => {
  const app = buildServer({
    adminToken: 'admin',
    endpoints: []
  });
  const denied = await app.inject({ method: 'POST', url: '/admin/runtime/persist' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'POST',
    url: '/admin/runtime/persist',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.json().ok, true);
  await app.close();
});

test('response headers include version and response time', async () => {
  const app = buildServer({ endpoints: [], appVersion: 'test-v' });
  const res = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['x-router-version'], 'test-v');
  assert.equal(typeof res.headers['x-response-time-ms'], 'string');
  await app.close();
});

test('prometheus metrics include idempotency conflict series', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/metrics/prometheus' });
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /neuralshell_idempotency_conflicts_total/);
  await app.close();
});

test('strictPromptFields rejects unknown top-level payload fields', async () => {
  const app = buildServer({
    strictPromptFields: true,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }], extra: true }
  });
  assert.equal(res.statusCode, 400);
  assert.equal(res.json().code, 'INVALID_PAYLOAD_FIELDS');
  await app.close();
});

test('502 failure payload is capped by maxFailuresReported', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    maxFailuresReported: 1,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async () => {
      throw new Error('always-fail');
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 502);
  assert.equal(res.json().failureCount, 2);
  assert.equal(res.json().failures.length, 1);
  assert.equal(res.json().failuresTruncated, true);
  await app.close();
});

test('prior failures payload is capped on success', async () => {
  process.env.OPENAI_API_KEY = 'test-key';
  const app = buildServer({
    includeFailuresOnSuccess: true,
    maxFailuresReported: 1,
    adaptiveRouting: false,
    endpoints: [
      { name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' },
      { name: 'gpt-5.2-turbo', url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-5.2-turbo' }
    ],
    fetchImpl: async (_url, options) => {
      const body = JSON.parse(options.body);
      if (body.model === 'o3') {
        throw new Error('first-fail');
      }
      return jsonResponse({ choices: [{ message: { role: 'assistant', content: 'ok' } }] });
    }
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().priorFailureCount, 1);
  assert.equal(res.json().priorFailures.length, 1);
  await app.close();
});

test('admin audit stats endpoint is token-gated', async () => {
  const app = buildServer({
    adminToken: 'admin',
    adminAuditLog: 'state/router_admin_audit_stats_test.log',
    endpoints: []
  });
  const denied = await app.inject({ method: 'GET', url: '/admin/audit/stats' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'GET',
    url: '/admin/audit/stats',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(typeof allowed.json().bytes, 'number');
  await app.close();
});

test('x-forwarded-for uses first hop for rate-limiting key', async () => {
  const app = buildServer({
    requestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const first = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-forwarded-for': '1.2.3.4, 9.9.9.9' },
    payload: { messages: [{ role: 'user', content: 'one' }] }
  });
  const second = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-forwarded-for': '1.2.3.4, 8.8.8.8' },
    payload: { messages: [{ role: 'user', content: 'two' }] }
  });
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
  await app.close();
});

test('idempotency eviction increments metric when capacity exceeded', async () => {
  const app = buildServer({
    maxIdempotencyKeys: 1,
    idempotencyTtlMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-evict-11111' },
    payload: { messages: [{ role: 'user', content: 'one' }] }
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-evict-22222' },
    payload: { messages: [{ role: 'user', content: 'two' }] }
  });
  const metrics = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(metrics.statusCode, 200);
  assert.equal(metrics.json().idempotencyEvictions >= 1, true);
  await app.close();
});

test('prompt returns 503 when no active endpoints are configured', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 503);
  assert.equal(res.json().code, 'NO_ACTIVE_ENDPOINTS');
  await app.close();
});

test('rate-limit headers include configured limit value', async () => {
  const app = buildServer({
    requestsPerWindow: 7,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['x-rate-limit-limit'], '7');
  await app.close();
});

test('admin idempotency stats endpoint is token-gated', async () => {
  const app = buildServer({
    adminToken: 'admin',
    endpoints: []
  });
  const denied = await app.inject({ method: 'GET', url: '/admin/idempotency/stats' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'GET',
    url: '/admin/idempotency/stats',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(typeof allowed.json().activeKeys, 'number');
  await app.close();
});

test('admin rate-limit reset clears limiter state', async () => {
  const app = buildServer({
    adminToken: 'admin',
    requestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const first = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'one' }] }
  });
  const limited = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'two' }] }
  });
  assert.equal(first.statusCode, 200);
  assert.equal(limited.statusCode, 429);
  const reset = await app.inject({
    method: 'POST',
    url: '/admin/rate-limit/reset',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(reset.statusCode, 200);
  const third = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'three' }] }
  });
  assert.equal(third.statusCode, 200);
  await app.close();
});

test('admin token can be validated via sha256 hash', async () => {
  const adminSecret = 'admin-secret-123';
  const app = buildServer({
    adminTokenSha256: crypto.createHash('sha256').update(adminSecret).digest('hex'),
    endpoints: []
  });
  const denied = await app.inject({ method: 'GET', url: '/config' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'GET',
    url: '/config',
    headers: { 'x-admin-token': adminSecret }
  });
  assert.equal(allowed.statusCode, 200);
  await app.close();
});

test('prompt token can be validated via sha256 hash', async () => {
  const promptSecret = 'prompt-secret-123';
  const app = buildServer({
    promptApiTokenSha256: crypto.createHash('sha256').update(promptSecret).digest('hex'),
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const denied = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(denied.statusCode, 401);
  const allowed = await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-prompt-token': promptSecret },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(allowed.statusCode, 200);
  await app.close();
});

test('rate-limit state can persist across restart when enabled', async () => {
  const rateLimitFile = 'state/router_rate_limits_persist_test.json';
  const idempotencyFile = 'state/router_idempotency_persist_test.json';
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
  const baseOptions = {
    persistVolatileState: true,
    rateLimitStateFile: rateLimitFile,
    idempotencyStateFile: idempotencyFile,
    requestsPerWindow: 1,
    rateLimitWindowMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  };
  const app1 = buildServer(baseOptions);
  const first = await app1.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'one' }] }
  });
  assert.equal(first.statusCode, 200);
  await app1.close();

  const app2 = buildServer(baseOptions);
  const second = await app2.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'two' }] }
  });
  assert.equal(second.statusCode, 429);
  await app2.close();
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
});

test('idempotency state can persist across restart when enabled', async () => {
  const rateLimitFile = 'state/router_rate_limits_idem_persist_test.json';
  const idempotencyFile = 'state/router_idempotency_persist_test.json';
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
  let calls = 0;
  const baseOptions = {
    persistVolatileState: true,
    rateLimitStateFile: rateLimitFile,
    idempotencyStateFile: idempotencyFile,
    idempotencyTtlMs: 60000,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ response: 'persisted-cache' });
    }
  };
  const app1 = buildServer(baseOptions);
  const first = await app1.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-persist-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(first.statusCode, 200);
  await app1.close();

  const app2 = buildServer(baseOptions);
  const second = await app2.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-persist-12345' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(second.statusCode, 200);
  assert.equal(second.headers['x-idempotency-hit'], '1');
  assert.equal(calls, 1);
  await app2.close();
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
});

test('admin audit verify endpoint validates hash chain', async () => {
  const auditFile = 'state/router_admin_audit_verify_test.log';
  fs.rmSync(auditFile, { force: true });
  const app = buildServer({
    adminToken: 'admin',
    adminAuditLog: auditFile,
    endpoints: [{ name: 'base', url: 'http://localhost:11434/api/generate', model: 'llama3' }]
  });
  const reset = await app.inject({
    method: 'POST',
    url: '/endpoints/reset',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(reset.statusCode, 200);
  const verify = await app.inject({
    method: 'GET',
    url: '/admin/audit/verify',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(verify.statusCode, 200);
  assert.equal(verify.json().ok, true);
  assert.equal(verify.json().checked >= 1, true);
  await app.close();
  fs.rmSync(auditFile, { force: true });
});

test('admin rate-limit stats endpoint is token-gated', async () => {
  const app = buildServer({
    adminToken: 'admin',
    endpoints: []
  });
  const denied = await app.inject({ method: 'GET', url: '/admin/rate-limit/stats' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'GET',
    url: '/admin/rate-limit/stats',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(typeof allowed.json().activeKeys, 'number');
  await app.close();
});

test('errors catalog endpoint exposes known error codes', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/errors/catalog' });
  assert.equal(res.statusCode, 200);
  assert.equal(Array.isArray(res.json().codes), true);
  assert.equal(res.json().codes.includes('RATE_LIMITED'), true);
  await app.close();
});

test('openapi endpoint exposes core path map', async () => {
  const app = buildServer({ endpoints: [] });
  const res = await app.inject({ method: 'GET', url: '/openapi.json' });
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.json().paths['/prompt'], 'object');
  assert.equal(typeof res.json().paths['/admin/state/verify'], 'object');
  await app.close();
});

test('rate-limit headers include configured window value', async () => {
  const app = buildServer({
    rateLimitWindowMs: 12345,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['x-rate-limit-window-ms'], '12345');
  await app.close();
});

test('admin state verify endpoint reports persisted state status', async () => {
  const rateLimitFile = 'state/router_rate_limits_verify_test.json';
  const idempotencyFile = 'state/router_idempotency_verify_test.json';
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
  const app = buildServer({
    adminToken: 'admin',
    persistVolatileState: true,
    rateLimitStateFile: rateLimitFile,
    idempotencyStateFile: idempotencyFile,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => jsonResponse({ response: 'ok' })
  });
  await app.inject({
    method: 'POST',
    url: '/prompt',
    headers: { 'x-idempotency-key': 'idem-state-verify-123' },
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  const flush = await app.inject({
    method: 'POST',
    url: '/admin/state/flush',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(flush.statusCode, 200);
  const verify = await app.inject({
    method: 'GET',
    url: '/admin/state/verify',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(verify.statusCode, 200);
  assert.equal(verify.json().rateLimitState.ok, true);
  assert.equal(verify.json().idempotencyState.ok, true);
  await app.close();
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
});

test('corrupt snapshot checksum increments state load failure metric', async () => {
  const rateLimitFile = 'state/router_rate_limits_corrupt_test.json';
  const idempotencyFile = 'state/router_idempotency_corrupt_test.json';
  fs.writeFileSync(rateLimitFile, JSON.stringify({
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    checksum: '0'.repeat(64),
    entries: [{ key: '1.1.1.1', count: 1, windowStart: Date.now() }]
  }), 'utf8');
  fs.writeFileSync(idempotencyFile, JSON.stringify({
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    checksum: crypto.createHash('sha256').update(JSON.stringify([])).digest('hex'),
    entries: []
  }), 'utf8');
  const app = buildServer({
    adminToken: 'admin',
    persistVolatileState: true,
    rateLimitStateFile: rateLimitFile,
    idempotencyStateFile: idempotencyFile,
    endpoints: []
  });
  const metrics = await app.inject({ method: 'GET', url: '/metrics/json' });
  assert.equal(metrics.statusCode, 200);
  assert.equal(metrics.json().stateLoadFailures >= 1, true);
  const verify = await app.inject({
    method: 'GET',
    url: '/admin/state/verify',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(verify.statusCode, 200);
  assert.equal(verify.json().rateLimitState.ok, false);
  await app.close();
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
});

test('admin auth status endpoint is token-gated and returns auth modes', async () => {
  const app = buildServer({
    adminToken: 'admin',
    promptApiTokenSha256: crypto.createHash('sha256').update('promptx').digest('hex'),
    endpoints: []
  });
  const denied = await app.inject({ method: 'GET', url: '/admin/auth/status' });
  assert.equal(denied.statusCode, 403);
  const allowed = await app.inject({
    method: 'GET',
    url: '/admin/auth/status',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(allowed.statusCode, 200);
  assert.equal(allowed.json().admin.required, true);
  assert.equal(typeof allowed.json().prompt.hashEnabled, 'boolean');
  await app.close();
});

test('admin state repair fixes corrupt snapshot files', async () => {
  const rateLimitFile = 'state/router_rate_limits_repair_test.json';
  const idempotencyFile = 'state/router_idempotency_repair_test.json';
  fs.writeFileSync(rateLimitFile, JSON.stringify({
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    checksum: 'f'.repeat(64),
    entries: [{ key: '5.5.5.5', count: 1, windowStart: Date.now() }]
  }), 'utf8');
  fs.writeFileSync(idempotencyFile, JSON.stringify({
    schemaVersion: 1,
    savedAt: new Date().toISOString(),
    checksum: 'f'.repeat(64),
    entries: [{ key: 'k', payload: {}, fingerprint: 'x', expiresAt: Date.now() + 5000 }]
  }), 'utf8');
  const app = buildServer({
    adminToken: 'admin',
    persistVolatileState: true,
    rateLimitStateFile: rateLimitFile,
    idempotencyStateFile: idempotencyFile,
    endpoints: []
  });
  const repair = await app.inject({
    method: 'POST',
    url: '/admin/state/repair',
    headers: { 'x-admin-token': 'admin' }
  });
  assert.equal(repair.statusCode, 200);
  assert.equal(repair.json().verify.rateLimitState, true);
  assert.equal(repair.json().verify.idempotencyState, true);
  await app.close();
  fs.rmSync(rateLimitFile, { force: true });
  fs.rmSync(idempotencyFile, { force: true });
});

test('prometheus metrics include state and auth gauges', async () => {
  const app = buildServer({
    promptApiToken: 'p',
    endpoints: []
  });
  const res = await app.inject({ method: 'GET', url: '/metrics/prometheus' });
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /neuralshell_rate_limit_active_keys/);
  assert.match(res.body, /neuralshell_admin_token_required/);
  assert.match(res.body, /neuralshell_prompt_token_required/);
  await app.close();
});
