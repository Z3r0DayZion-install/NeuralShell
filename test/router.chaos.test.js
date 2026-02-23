import test from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from '../router.js';

test('chaos: intermittent upstream failures still produce responses', async () => {
  let counter = 0;
  const app = buildServer({
    includeFailuresOnSuccess: true,
    endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
    fetchImpl: async () => {
      counter += 1;
      if (counter % 3 === 0) {
        throw new Error('chaos-fail');
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ response: 'ok' }),
        text: async () => ''
      };
    }
  });

  let successes = 0;
  let failures = 0;
  for (let i = 0; i < 6; i += 1) {
    const res = await app.inject({
      method: 'POST',
      url: '/prompt',
      payload: { messages: [{ role: 'user', content: `hello-${i}` }] }
    });
    if (res.statusCode === 200) {
      successes += 1;
    } else if (res.statusCode === 502) {
      failures += 1;
    }
  }
  assert.equal(successes >= 4, true);
  assert.equal(failures >= 1, true);
  await app.close();
});
