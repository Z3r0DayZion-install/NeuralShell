const test = require("node:test");
const assert = require("node:assert/strict");
const { LLMService } = require("../src/core/llmService");

function createJsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    body: {
      getReader() {
        return {
          async read() {
            return { done: true, value: null };
          }
        };
      }
    }
  };
}

test("LLMService retries once and succeeds", async () => {
  let calls = 0;
  const service = new LLMService({
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        throw new Error("network down");
      }
      return createJsonResponse(200, { models: [{ name: "llama3" }] });
    },
    maxRetries: 1,
    retryBaseDelayMs: 1,
    requestTimeoutMs: 1000
  });

  const models = await service.getModelList();
  assert.equal(calls, 2);
  assert.deepEqual(models, ["llama3"]);
  const health = await service.getHealth();
  assert.equal(health.ok, true);
});

test("LLMService marks offline after exhausted retries", async () => {
  const service = new LLMService({
    fetchImpl: async () => {
      throw new Error("connection refused");
    },
    maxRetries: 1,
    retryBaseDelayMs: 1,
    requestTimeoutMs: 20
  });

  service.setModel("llama3");
  await assert.rejects(() => service.chat([{ role: "user", content: "hi" }], false), /connection refused|timed out|failed/i);
  const health = await service.getHealth();
  assert.equal(health.ok, false);
});

test("LLMService emits cancelled status on cancelStream", async () => {
  let resolver;
  const pending = new Promise((resolve) => {
    resolver = resolve;
  });

  const service = new LLMService({
    fetchImpl: async (_url, init) => {
      await pending;
      if (init && init.signal && init.signal.aborted) {
        throw new Error("aborted");
      }
      return createJsonResponse(200, { message: { content: "ok" } });
    },
    maxRetries: 0,
    requestTimeoutMs: 5000
  });

  const statuses = [];
  service.onStatusChange((s) => statuses.push(s));
  service.setModel("llama3");
  const run = service.chat([{ role: "user", content: "cancel me" }], false);
  service.cancelStream();
  resolver();

  await assert.rejects(() => run, /cancelled/i);
  assert.ok(statuses.includes("cancelled"));
});
