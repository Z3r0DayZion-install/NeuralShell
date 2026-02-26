"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createEnvelope, parseEnvelope } = require("../src/core/tearCodec");

test("TEAR codec round-trips plaintext envelope", async () => {
  const payload = { sessions: [{ id: "s1", messages: [{ role: "user", content: "hi" }] }], settings: { model: "llama3" } };
  const env = await createEnvelope(payload, "", "plain");
  assert.equal(env.encrypted, false);
  const parsed = await parseEnvelope(env, "");
  assert.deepEqual(parsed, payload);
});

test("TEAR codec round-trips encrypted envelope and rejects wrong secret", async () => {
  const payload = { foo: "bar", n: 7 };
  const env = await createEnvelope(payload, "secret-123", "enc");
  assert.equal(env.encrypted, true);
  await assert.rejects(() => parseEnvelope(env, "wrong"), /signature|decrypt|TEAR/i);
  const parsed = await parseEnvelope(env, "secret-123");
  assert.deepEqual(parsed, payload);
});

