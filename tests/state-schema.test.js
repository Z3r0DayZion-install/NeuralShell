"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { migrateState, CURRENT_SCHEMA_VERSION } = require("../src/stateSchema");

test("migrateState upgrades v1 payload and preserves messages", () => {
  const v1 = {
    sessions: [
      {
        id: "abc",
        name: "Legacy",
        messages: [{ role: "user", content: "hello" }]
      }
    ],
    activeSessionId: "abc",
    settings: { theme: "light" },
    logs: ["log line"]
  };

  const out = migrateState(v1);
  assert.equal(out.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(out.settings.theme, "light");
  assert.equal(out.settings.model, "llama3");
  assert.equal(out.sessions.length, 1);
  assert.equal(out.sessions[0].messages[0].content, "hello");
  assert.equal(typeof out.sessions[0].messages[0].at, "string");
});

test("migrateState recovers missing data into a safe default session", () => {
  const out = migrateState({ settings: {} });
  assert.equal(out.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(Array.isArray(out.sessions), true);
  assert.equal(out.sessions.length > 0, true);
  assert.equal(typeof out.activeSessionId, "string");
});
