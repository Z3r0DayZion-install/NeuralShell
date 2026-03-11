const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  validateCommandArgs,
  validateCommandName,
  validateImportedState,
  validateLog,
  validateMessages,
  validateModel,
  validatePassphrase,
  validateSettings,
  validateSessionName,
  validateWorkspaceActionRequest,
  validateStateKey,
  validateStateUpdates
} = require("../src/core/ipcValidators");
const { LLMService } = require("../src/core/llmService");
const { previewWorkspaceAction } = require("../src/core/workspaceActionPlanner");

function ok(name) {
  console.log(`PASS ${name}`);
}

async function testIpcValidators() {
  const output = validateMessages([{ role: "user", content: "Hello" }]);
  assert.deepEqual(output, [{ role: "user", content: "Hello" }]);
  assert.throws(() => validateMessages([{ role: "root", content: "x" }]), /invalid/i);
  assert.throws(() => validateStateKey("__proto__"), /blocked/i);
  assert.throws(() => validateStateKey("constructor"), /blocked/i);
  assert.throws(() => validateStateUpdates([]), /object/i);
  assert.doesNotThrow(() => validateStateUpdates({ tokens: 1 }));
  assert.equal(validateSessionName(" demo "), "demo");
  assert.equal(validatePassphrase(" pass "), "pass");
  assert.throws(() => validateSessionName(""), /required/i);
  assert.throws(() => validatePassphrase(""), /required/i);
  assert.equal(validateModel("llama3"), "llama3");
  assert.throws(() => validateModel(""), /required/i);
  const logPayload = validateLog("WARN", "sample");
  assert.equal(logPayload.level, "warn");
  assert.equal(logPayload.message, "sample");
  assert.throws(() => validateLog("fatal", "x"), /invalid/i);
  const settings = validateSettings({
    ollamaBaseUrl: "http://127.0.0.1:11434",
    timeoutMs: 5000,
    retryCount: 3,
    theme: "light",
    clockEnabled: true,
    clock24h: true,
    clockUtcOffset: "+02:00",
    personalityProfile: "engineer",
    safetyPolicy: "strict",
    rgbEnabled: true,
    rgbProvider: "openrgb",
    rgbHost: "127.0.0.1",
    rgbPort: 6742,
    rgbTargets: ["keyboard", "mouse"],
    tokenBudget: 1200,
    autosaveEnabled: true,
    autosaveIntervalMin: 10,
    autosaveName: "autosave-main"
  });
  assert.equal(settings.timeoutMs, 5000);
  assert.equal(settings.theme, "light");
  assert.equal(settings.clockEnabled, true);
  assert.equal(settings.clock24h, true);
  assert.equal(settings.clockUtcOffset, "+02:00");
  assert.equal(settings.personalityProfile, "engineer");
  assert.equal(settings.safetyPolicy, "strict");
  assert.equal(settings.rgbEnabled, true);
  assert.equal(settings.rgbProvider, "openrgb");
  assert.equal(settings.rgbHost, "127.0.0.1");
  assert.equal(settings.rgbPort, 6742);
  assert.deepEqual(settings.rgbTargets, ["keyboard", "mouse"]);
  assert.equal(settings.tokenBudget, 1200);
  assert.equal(settings.autosaveEnabled, true);
  assert.equal(settings.autosaveIntervalMin, 10);
  assert.equal(settings.autosaveName, "autosave-main");
  assert.equal(validateCommandName("Echo_1"), "echo_1");
  assert.deepEqual(validateCommandArgs(["a", "b"]), ["a", "b"]);
  const imported = validateImportedState({
    model: "llama3",
    theme: "dark",
    tokens: 12,
    chat: [{ role: "user", content: "hello", timestamp: "2026-02-16T00:00:00.000Z" }],
    settings: { retryCount: 2 }
  });
  assert.equal(imported.model, "llama3");
  assert.equal(imported.chat.length, 1);
  assert.throws(() => validateImportedState({ chat: [{ role: "root", content: "x" }] }), /invalid/i);
  ok("ipcValidators");
}

function testWorkspaceActionGuards() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "neuralshell-workspace-"));
  try {
    const request = validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      directory: "docs",
      filename: "My Notes.md",
      content: "# Notes\n"
    });
    assert.equal(request.filename, "My Notes.md");

    const preview = previewWorkspaceAction(request);
    assert.equal(preview.relativePath, "docs/My Notes.md");
    assert.match(preview.previewText, /My Notes\.md/);

    assert.throws(() => validateWorkspaceActionRequest({
      kind: "file_replace",
      rootPath: tempRoot,
      directory: "docs",
      filename: "bad?.md",
      content: "# invalid\n"
    }), /unsupported|invalid/i);
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  ok("workspace action guards");
}

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

function createReaderResponse(status, chunks) {
  const queue = Array.isArray(chunks) ? chunks.slice() : [];
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return {};
    },
    body: {
      getReader() {
        return {
          async read() {
            if (!queue.length) {
              return { done: true, value: null };
            }
            return { done: false, value: queue.shift() };
          }
        };
      }
    }
  };
}

function createAsyncIterableResponse(status, chunks) {
  const queue = Array.isArray(chunks) ? chunks.slice() : [];
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return {};
    },
    body: {
      async *[Symbol.asyncIterator]() {
        while (queue.length) {
          yield queue.shift();
        }
      }
    }
  };
}

async function collectAsync(iterable) {
  const output = [];
  for await (const item of iterable) {
    output.push(item);
  }
  return output;
}

async function testLlmServiceRetry() {
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
  ok("llmService retry");
}

async function testLlmServiceOffline() {
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
  ok("llmService offline");
}

async function testLlmServiceCancel() {
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
  ok("llmService cancel");
}

async function testLlmServicePersonaAndConfigure() {
  let payload = null;
  const service = new LLMService({
    fetchImpl: async (_url, init) => {
      payload = JSON.parse(String(init.body || "{}"));
      return createJsonResponse(200, { message: { content: "ok" } });
    },
    maxRetries: 0,
    requestTimeoutMs: 1000
  });

  assert.throws(() => service.setPersona("invalid"), /Unsupported persona/i);
  service.configure({
    baseUrl: "http://127.0.0.1:22434",
    maxRetries: 3,
    requestTimeoutMs: 2500,
    retryBaseDelayMs: 1,
    persona: "founder"
  });
  assert.equal(service.baseUrl, "http://127.0.0.1:22434");
  assert.equal(service.maxRetries, 3);
  assert.equal(service.requestTimeoutMs, 2500);
  assert.equal(service.retryBaseDelayMs, 1);
  assert.equal(service.persona, "founder");

  service.setModel("llama3.2");
  const response = await service.chat([{ role: "user", content: "hello" }], false);
  assert.equal(response.message.content, "ok");
  assert.equal(payload.model, "llama3.2");
  assert.equal(payload.messages[0].role, "system");
  assert.match(payload.messages[0].content, /founder mode/i);

  const withSystem = service._applyPersona([
    { role: "system", content: "keep-this-system-prompt" },
    { role: "user", content: "x" }
  ]);
  assert.equal(withSystem[0].content, "keep-this-system-prompt");
  ok("llmService persona/config");
}

async function testLlmServiceAutoDetect() {
  const service = new LLMService({
    fetchImpl: async (url) => {
      if (url.endsWith("/api/version")) {
        return createJsonResponse(200, { version: "1.0.0" });
      }
      if (url.endsWith("/api/tags")) {
        return createJsonResponse(200, {
          models: [{ name: "llama3" }, { name: "mistral" }]
        });
      }
      throw new Error(`unexpected endpoint: ${url}`);
    },
    maxRetries: 0
  });

  const detected = await service.autoDetectLocalLLM();
  assert.equal(detected.ok, true);
  assert.equal(detected.detected, true);
  assert.equal(detected.modelCount, 2);
  assert.deepEqual(detected.models, ["llama3", "mistral"]);

  const offline = new LLMService({
    fetchImpl: async () => {
      throw new Error("bridge offline");
    },
    maxRetries: 0
  });
  const missing = await offline.autoDetectLocalLLM();
  assert.equal(missing.ok, false);
  assert.equal(missing.detected, false);
  assert.match(missing.reason, /bridge offline/i);
  ok("llmService autodetect");
}

async function testLlmServiceStreamingParsers() {
  const streamService = new LLMService({
    fetchImpl: async () =>
      createAsyncIterableResponse(200, [
        '{"delta":"a"}\nnot-json\n',
        '{"delta":"b"}\n{"done":true}\n'
      ]),
    maxRetries: 0
  });
  const stream = await streamService.chat(
    [{ role: "user", content: "stream please" }],
    true
  );
  const streamRows = await collectAsync(stream);
  assert.equal(streamRows.length, 3);
  assert.equal(streamRows[0].delta, "a");
  assert.equal(streamRows[2].done, true);

  const readerService = new LLMService({
    fetchImpl: async () =>
      createReaderResponse(200, [
        Buffer.from('{"chunk":1}\n{"chunk":2}\n'),
        Buffer.from('{"chunk":3}\n')
      ]),
    maxRetries: 0
  });
  const readerRows = await collectAsync(
    readerService._streamJsonLines(
      createReaderResponse(200, [Buffer.from('{"n":1}\n{"n":2}\n')])
    )
  );
  assert.equal(readerRows.length, 2);
  assert.equal(readerRows[1].n, 2);

  const typed = readerService._toUint8Array("abc");
  assert.ok(typed instanceof Uint8Array);
  assert.equal(typed.length, 3);
  ok("llmService stream");
}

async function testLlmServiceFailureModes() {
  const statusService = new LLMService({
    fetchImpl: async () => createJsonResponse(500, { error: "bad" }),
    maxRetries: 0
  });
  await assert.rejects(
    () => statusService.chat([{ role: "user", content: "x" }], false),
    /status 500/i
  );

  const malformedService = new LLMService({
    fetchImpl: async () => ({}),
    maxRetries: 0
  });
  await assert.rejects(
    () => malformedService.chat([{ role: "user", content: "x" }], false),
    /failed to fetch/i
  );

  const timeoutService = new LLMService({
    fetchImpl: async (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("aborted")));
      }),
    maxRetries: 0,
    requestTimeoutMs: 10
  });
  await assert.rejects(
    () => timeoutService.chat([{ role: "user", content: "timeout" }], false),
    /timed out/i
  );

  const noFetchService = new LLMService({ fetchImpl: "not-a-function", maxRetries: 0 });
  await assert.rejects(
    () => noFetchService._fetchResponse("/api/tags", { method: "GET" }),
    /No fetch implementation available/i
  );

  let seen = 0;
  const unsubscribe = statusService.onStatusChange(() => {
    seen += 1;
  });
  statusService._emitStatus("online");
  unsubscribe();
  statusService._emitStatus("online");
  assert.equal(seen, 1);
  assert.equal(statusService.cancelStream(), false);
  ok("llmService failure modes");
}

async function run() {
  await testIpcValidators();
  testWorkspaceActionGuards();
  await testLlmServiceRetry();
  await testLlmServiceOffline();
  await testLlmServiceCancel();
  await testLlmServicePersonaAndConfigure();
  await testLlmServiceAutoDetect();
  await testLlmServiceStreamingParsers();
  await testLlmServiceFailureModes();
  console.log("All unit tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
