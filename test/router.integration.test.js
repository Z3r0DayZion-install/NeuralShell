import test from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from '../router.js';

const runIntegration = process.env.RUN_OLLAMA_INTEGRATION === '1';

test('integration: local ollama health path', { skip: !runIntegration }, async () => {
  const app = buildServer({
    endpoints: [{ name: 'ollama-local', url: 'http://127.0.0.1:11434/api/generate', model: 'llama3' }]
  });
  const res = await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: 'Reply with OK' }] }
  });
  assert.equal([200, 502].includes(res.statusCode), true);
  await app.close();
});
