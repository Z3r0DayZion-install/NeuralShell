const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateLog,
  validateMessages,
  validateModel,
  validatePassphrase,
  validateSessionName,
  validateStateKey,
  validateStateUpdates
} = require("../src/core/ipcValidators");

test("validateMessages accepts well-formed messages", () => {
  const input = [{ role: "user", content: "Hello" }];
  const output = validateMessages(input);
  assert.deepEqual(output, [{ role: "user", content: "Hello" }]);
});

test("validateMessages rejects invalid role", () => {
  assert.throws(() => validateMessages([{ role: "root", content: "x" }]), /invalid/i);
});

test("validateStateKey blocks prototype pollution keys", () => {
  assert.throws(() => validateStateKey("__proto__"), /blocked/i);
  assert.throws(() => validateStateKey("constructor"), /blocked/i);
});

test("validateStateUpdates requires plain object", () => {
  assert.throws(() => validateStateUpdates([]), /object/i);
  assert.doesNotThrow(() => validateStateUpdates({ tokens: 1 }));
});

test("validateSessionName and passphrase enforce non-empty strings", () => {
  assert.equal(validateSessionName(" demo "), "demo");
  assert.equal(validatePassphrase(" pass "), "pass");
  assert.throws(() => validateSessionName(""), /required/i);
  assert.throws(() => validatePassphrase(""), /required/i);
});

test("validateModel enforces bounds", () => {
  assert.equal(validateModel("llama3"), "llama3");
  assert.throws(() => validateModel(""), /required/i);
});

test("validateLog normalizes and validates level", () => {
  const payload = validateLog("WARN", "sample");
  assert.equal(payload.level, "warn");
  assert.equal(payload.message, "sample");
  assert.throws(() => validateLog("fatal", "x"), /invalid/i);
});
