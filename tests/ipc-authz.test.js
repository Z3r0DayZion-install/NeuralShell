"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { registerSecurityIpcHandlers } = require("../src/main/securityIpc");

test("security IPC handlers block unauthorized access and allow authorized access", async () => {
  const handlers = new Map();
  const registerHandle = (route, fn) => handlers.set(route, fn);

  const calls = [];
  const authManager = {
    requireAdmin: () => {
      throw new Error("Auth required");
    },
    bootstrapPin: async () => ({ ok: true }),
    setPin: async () => ({ ok: true }),
    recoverPin: async () => ({ ok: true })
  };
  const permissionManager = {
    list: () => ({ autoMode: true }),
    set: async (key, value, actor) => {
      calls.push(["perm:set", key, value, actor]);
      return { [key]: value };
    }
  };
  const secretVault = {
    get: async () => "s",
    set: async () => true,
    clear: async () => true
  };
  const syncClient = {
    push: async () => ({ ok: true }),
    pull: async () => ({ ok: true })
  };
  const dialog = {
    showMessageBox: async () => ({ response: 1 })
  };

  registerSecurityIpcHandlers({
    registerHandle,
    authManager,
    permissionManager,
    secretVault,
    syncClient,
    dialog
  });

  await assert.rejects(() => handlers.get("permissions:list")(), /Auth required/);
  await assert.rejects(() => handlers.get("permissions:set")(null, "autoMode", false), /Auth required/);
  await assert.rejects(() => handlers.get("vault:get-secret")(), /Auth required/);

  authManager.requireAdmin = () => {};
  const list = await handlers.get("permissions:list")();
  assert.equal(Boolean(list.autoMode), true);
  await handlers.get("permissions:set")(null, "autoMode", false);
  assert.deepEqual(calls[0], ["perm:set", "autoMode", false, "renderer"]);
  const secret = await handlers.get("vault:get-secret")();
  assert.equal(secret, "s");
});

test("security IPC recovery route enforces confirmation phrase", async () => {
  const handlers = new Map();
  const registerHandle = (route, fn) => handlers.set(route, fn);

  registerSecurityIpcHandlers({
    registerHandle,
    authManager: {
      requireAdmin: () => {},
      bootstrapPin: async () => ({ ok: true }),
      setPin: async () => ({ ok: true }),
      recoverPin: async () => ({ ok: true })
    },
    permissionManager: { list: () => ({}), set: async () => ({}) },
    secretVault: { get: async () => "", set: async () => true, clear: async () => true },
    syncClient: { push: async () => ({}), pull: async () => ({}) },
    dialog: { showMessageBox: async () => ({ response: 1 }) }
  });

  await assert.rejects(
    () => handlers.get("auth:recover-pin")(null, "1234", "WRONG"),
    /Type RESET PIN to confirm/
  );
});
