import { performance } from 'node:perf_hooks';
import { buildServer } from '../router.js';

const iterations = Number(process.env.BENCH_ITERATIONS || 200);

const app = buildServer({
  endpoints: [{ name: 'ollama-local', url: 'http://localhost:11434/api/generate', model: 'llama3' }],
  fetchImpl: async () => ({
    ok: true,
    status: 200,
    json: async () => ({ response: 'ok' }),
    text: async () => ''
  })
});

const start = performance.now();
for (let i = 0; i < iterations; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await app.inject({
    method: 'POST',
    url: '/prompt',
    payload: { messages: [{ role: 'user', content: `bench-${i}` }] }
  });
}
const end = performance.now();
const totalMs = end - start;
const avgMs = totalMs / iterations;
const thresholdMs = Number(process.env.BENCH_MAX_AVG_MS || 8);
console.log(JSON.stringify({ iterations, totalMs: Number(totalMs.toFixed(2)), avgMs: Number(avgMs.toFixed(2)) }));
await app.close();
if (avgMs > thresholdMs) {
  console.error(`Benchmark regression: avg ${avgMs.toFixed(2)}ms > ${thresholdMs}ms`);
  process.exit(1);
}
