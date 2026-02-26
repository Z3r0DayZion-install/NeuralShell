"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("os");
const path = require("path");
const { createTearServer } = require("../src/runtime/createTearServer");

test("TEAR runtime health + auth setup/login + tear export/import", async () => {
  const runtimeDir = path.join(os.tmpdir(), `neuralshell_tear_runtime_${Date.now()}`);
  const { server } = await createTearServer({ runtimeDir });
  try {
    const health = await server.inject({ method: "GET", url: "/health" });
    assert.equal(health.statusCode, 200);
    assert.equal(JSON.parse(health.body).ok, true);

    const setup = await server.inject({
      method: "POST",
      url: "/auth/setup-pin",
      payload: { pin: "1234", role: "admin" }
    });
    assert.equal(setup.statusCode, 200);

    const login = await server.inject({
      method: "POST",
      url: "/auth/login",
      payload: { pin: "1234" }
    });
    assert.equal(login.statusCode, 200);
    assert.equal(JSON.parse(login.body).loggedIn, true);

    const exported = await server.inject({
      method: "POST",
      url: "/tear/export",
      payload: { payload: { a: 1, b: "ok" }, secret: "s3cr3t", hint: "h" }
    });
    assert.equal(exported.statusCode, 200);
    const envelope = JSON.parse(exported.body).envelope;
    assert.equal(envelope.encrypted, true);

    const imported = await server.inject({
      method: "POST",
      url: "/tear/import",
      payload: { envelope, secret: "s3cr3t" }
    });
    assert.equal(imported.statusCode, 200);
    assert.deepEqual(JSON.parse(imported.body).payload, { a: 1, b: "ok" });
  } finally {
    await server.close();
  }
});

