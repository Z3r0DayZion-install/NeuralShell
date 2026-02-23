import test from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from '../router.js';

test('contract: OpenAI-like response shape is accepted', async () => {
  process.env.OPENAI_API_KEY = 'contract-key';
  const app = buildServer({
    endpoints: [{ name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' }],
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }),
      text: async () => ''
    })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().message.content, 'ok');
  await app.close();
});

test('contract: malformed OpenAI shape fails with 502', async () => {
  process.env.OPENAI_API_KEY = 'contract-key';
  const app = buildServer({
    endpoints: [{ name: 'o3', url: 'https://api.openai.com/v1/chat/completions', model: 'o3' }],
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
      text: async () => ''
    })
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'hello' }] }
  });
  assert.equal(res.statusCode, 502);
  await app.close();
});
