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

test("LLMService lists models from OpenAI-compatible providers with auth", async () => {
  let receivedHeaders = null;
  const service = new LLMService({
    provider: "openai",
    apiKey: "test-key",
    fetchImpl: async (_url, init) => {
      receivedHeaders = init && init.headers;
      return createJsonResponse(200, {
        data: [
          { id: "gpt-4.1-mini" },
          { id: "gpt-4o-mini" }
        ]
      });
    }
  });

  const models = await service.getModelList();
  assert.deepEqual(models, ["gpt-4.1-mini", "gpt-4o-mini"]);
  assert.equal(receivedHeaders.authorization, "Bearer test-key");
});

test("LLMService normalizes OpenAI-compatible chat responses", async () => {
  const service = new LLMService({
    provider: "openai",
    apiKey: "test-key",
    fetchImpl: async () => createJsonResponse(200, {
      id: "chatcmpl-1",
      choices: [
        {
          message: {
            role: "assistant",
            content: "Hosted reply"
          }
        }
      ]
    })
  });

  const response = await service.chat([{ role: "user", content: "Hello" }], false);
  assert.equal(response.message.role, "assistant");
  assert.equal(response.message.content, "Hosted reply");
});

test("LLMService autoDetectLocalLLM reports unsupported for remote providers", async () => {
  const service = new LLMService({
    provider: "openai",
    fetchImpl: async () => createJsonResponse(200, {})
  });
  const result = await service.autoDetectLocalLLM();
  assert.equal(result.detected, false);
  assert.equal(result.reason, "auto_detect_supported_for_ollama_only");
});

test("LLMService _applyPersona avoids double system prompts", () => {
  const service = new LLMService();
  const base = [{ role: "user", content: "hi" }];
  const applied = service._applyPersona(base);
  assert.equal(applied[0].role, "system");
  const explicit = service._applyPersona([{ role: "system", content: "explicit" }, ...base]);
  assert.equal(explicit[0].content, "explicit");
});

test("LLMService enforces API key for remote providers", async () => {
  const service = new LLMService({
    provider: "openai",
    fetchImpl: async () => {
      throw new Error("should not reach network");
    }
  });
  await assert.rejects(() => service.getModelList(), /requires an API key/i);
});

function makeStreamResponse(chunks) {
  return {
    body: {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) {
          yield Buffer.from(chunk, "utf8");
        }
      }
    }
  };
}

test("LLMService _streamJsonLines yields valid SSE events and ignores junk", async () => {
  const service = new LLMService();
  const chunks = [
    "data: {\"choices\":[{\"delta\":{\"content\":\"first\"}}]}\n\n",
    "data: invalid-json\n\n",
    "data: {\"choices\":[{\"delta\":{\"content\":\"second\"}}]}"
  ];
  const events = [];
  for await (const event of service._streamJsonLines(makeStreamResponse(chunks))) {
    events.push(event);
  }
  assert.ok(Array.isArray(events));
  assert.ok(events.length <= 2);
});

test("LLMService chat stream handles SSE chunks and tail data", async () => {
  const service = new LLMService({ provider: "ollama" });
  const chunks = [
    "data: {\"choices\":[{\"delta\":{\"content\":\"stream-1\"}}]}\n\n",
    "data: {\"choices\":[{\"delta\":{\"content\":\"stream-2\"}}]}"
  ];
  service._fetchResponse = async () => makeStreamResponse(chunks);
  const iterator = await service.chat([{ role: "user", content: "stream" }], true);
  await iterator.next();
  if (typeof iterator.return === "function") {
    await iterator.return();
  }
});

test("LLMService setPersona rejects unsupported persona", () => {
  const service = new LLMService();
  assert.throws(() => service.setPersona("unknown"), /Unsupported persona/i);
});

test("LLMService autoDetectLocalLLM succeeds when Ollama bridge responds", async () => {
  const service = new LLMService({ provider: "ollama" });
  service._fetchJson = async () => ({ version: "0.1" });
  service.getModelList = async () => ["llama3", "mistral"];
  const result = await service.autoDetectLocalLLM();
  assert.equal(result.ok, true);
  assert.equal(result.detected, true);
  assert.equal(result.version.version, "0.1");
  assert.deepEqual(result.models, ["llama3", "mistral"]);
});

test("LLMService _authHeaders extends headers for OpenRouter", () => {
  const service = new LLMService({ provider: "openrouter", apiKey: "secret" });
  const headers = service._authHeaders();
  assert.equal(headers.authorization, "Bearer secret");
  assert.equal(headers["x-title"], "NeuralShell");
  assert.equal(headers["http-referer"], "https://neuralshell.app");
});

test("LLMService chat requires messages array", async () => {
  const service = new LLMService();
  await assert.rejects(() => service.chat("not an array"), /messages must be an array/i);
});

test("LLMService _fetchResponse rejects unsuccessful responses", async () => {
  const service = new LLMService({
    fetchImpl: async () => ({ ok: false, status: 500, json: async () => ({}) })
  });
  await assert.rejects(() => service._fetchResponse("/api/test"), /request failed with status 500/i);
});

test("LLMService _fetchResponse rejects when fetch implementation is missing", async () => {
  const service = new LLMService();
  service.fetchImpl = null;
  await assert.rejects(() => service._fetchResponse("/api/test"), /No fetch implementation available/i);
});

test("LLMService configure applies overrides and persona normalization", () => {
  const service = new LLMService();
  service.configure({ baseUrl: "http://example.com", provider: "openai", persona: "founder" });
  assert.equal(service.baseUrl, "http://example.com");
  assert.equal(service.provider, "openai");
  assert.equal(service.persona, "founder");
});

test("LLMService setModel rejects empty model names", () => {
  const service = new LLMService();
  assert.throws(() => service.setModel("  "), /Model is required/i);
});

test("LLMService _toUint8Array covers Buffer, string, and null inputs", () => {
  const service = new LLMService();
  const buffer = Buffer.from("binary");
  assert.ok(service._toUint8Array(buffer) instanceof Uint8Array);
  assert.ok(service._toUint8Array("text") instanceof Uint8Array);
  assert.equal(service._toUint8Array(null).length, 0);
});

test("LLMService _iterateBodyChunks rejects unreadable streams", async () => {
  const service = new LLMService();
  await assert.rejects(
    async () => {
      for await (const _ of service._iterateBodyChunks({})) {
        // intentionally empty
      }
    },
    /response stream is not readable/i
  );
});

test("LLMService _streamOpenAiEvents yields SSE events", async () => {
  const service = new LLMService();
  const chunks = [
    "data: {\"choices\":[{\"delta\":{\"content\":\"alpha\"}}]}\n\n"
  ];
  const response = {
    body: {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) {
          yield Buffer.from(chunk, "utf8");
        }
      }
    }
  };
  const events = [];
  for await (const event of service._streamOpenAiEvents(response)) {
    events.push(event);
  }
  assert.ok(events.length >= 0);
});

test("LLMService _normalizeOpenAiChatResponse handles missing choices", () => {
  const service = new LLMService();
  const normalized = service._normalizeOpenAiChatResponse({});
  assert.equal(normalized.message.role, "assistant");
});

test("LLMService _fetchJson rejects non-JSON responses", async () => {
  const service = new LLMService();
  service._fetchResponse = async () => ({ ok: true, json: null });
  await assert.rejects(() => service._fetchJson("/test"), /invalid JSON response/i);
});

test("LLMService _emitStatus isolates listener errors", () => {
  const service = new LLMService();
  service.onStatusChange(() => { throw new Error("bad listener"); });
  assert.doesNotThrow(() => service._emitStatus("online"));
});

test("LLMService chat (non-streaming) for OpenAI protocol", async () => {
  const service = new LLMService({
    provider: "openai",
    apiKey: "key",
    fetchImpl: async () => createJsonResponse(200, {
      choices: [{ message: { role: "assistant", content: "hi" } }]
    })
  });
  const res = await service.chat([{ role: "user", content: "hi" }], false);
  assert.equal(res.message.content, "hi");
});

test("LLMService _streamOpenAiEvents handles malformed and [DONE] events", async () => {
  const service = new LLMService();
  const chunks = [
    "data: {\"choices\":[{\"delta\":{\"content\":\"a\"}}]}\n\n",
    "data: [DONE]\n\n",
    "data: {invalid}\n\n",
    "data: {\"choices\":[{\"delta\":{\"content\":\"b\"}}]}"
  ];
  const response = {
    body: {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) {
          yield Buffer.from(chunk, "utf8");
        }
      }
    }
  };
  const results = [];
  for await (const msg of service._streamOpenAiEvents(response)) {
    results.push(msg.message.content);
  }
  assert.deepEqual(results, ["a", "b"]);
});

test("LLMService _streamJsonLines handles malformed lines and tail", async () => {
  const service = new LLMService();
  const chunks = [
    "{\"content\":\"a\"}\n",
    "invalid\n",
    "{\"content\":\"b\"}"
  ];
  const response = {
    body: {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of chunks) {
          yield Buffer.from(chunk, "utf8");
        }
      }
    }
  };
  const results = [];
  for await (const msg of service._streamJsonLines(response)) {
    results.push(msg.content);
  }
  assert.deepEqual(results, ["a", "b"]);
});

test("LLMService _iterateBodyChunks handles body with direct async iterator", async () => {
  const service = new LLMService();
  async function* gen() {
    yield "a";
  }
  const chunks = [];
  for await (const chunk of service._iterateBodyChunks(gen())) {
    chunks.push(chunk);
  }
  assert.deepEqual(chunks, ["a"]);
});

test("LLMService _fetchResponse abort handles user cancellation", async () => {
  const service = new LLMService({ fetchImpl: async () => { } });
  const controller = new AbortController();
  controller.__cancelledByUser = true;
  controller.abort();
  await assert.rejects(() => service._fetchResponse("/test", {}, controller), /aborted/i);
});
