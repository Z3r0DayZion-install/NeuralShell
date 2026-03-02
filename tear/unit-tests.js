const assert = require("node:assert/strict");
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
  validateStateKey,
  validateStateUpdates
} = require("../src/core/ipcValidators");
const { LLMService } = require("../src/core/llmService");

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

async function run() {
  await testIpcValidators();
  await testLlmServiceRetry();
  await testLlmServiceOffline();
  await testLlmServiceCancel();
  console.log("All unit tests passed.");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
