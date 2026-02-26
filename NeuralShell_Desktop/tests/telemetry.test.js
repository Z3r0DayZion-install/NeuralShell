"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Telemetry } = require("../src/core/telemetry");

test("Telemetry wraps calls and records route stats", async () => {
  const t = new Telemetry();
  const wrapped = t.wrap("demo:ok", async (x) => x + 1);
  const out = await wrapped(4);
  assert.equal(out, 5);
  const snap = t.snapshot();
  assert.equal(snap.routes["demo:ok"].calls, 1);
});
