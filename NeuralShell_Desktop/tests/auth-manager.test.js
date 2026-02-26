"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { AuthManager } = require("../src/core/authManager");

test("AuthManager requires first-run setup and supports bootstrap login", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_${Date.now()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  const auth = new AuthManager(dir);
  await auth.init();

  const initial = auth.status();
  assert.equal(initial.needsSetup, true);
  await assert.rejects(() => auth.login("1234"), /PIN setup required/);
  await assert.rejects(() => auth.setPin("5678"), /PIN setup required/);

  await auth.bootstrapPin("5678", "admin");
  await assert.rejects(() => auth.bootstrapPin("9999"), /PIN already configured/);

  const status = await auth.login("5678");
  assert.equal(status.loggedIn, true);
  assert.equal(status.role, "admin");
});

test("AuthManager locks out after repeated failures and recovers after lockout window", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_lock_${Date.now()}`);
  await fs.promises.mkdir(dir, { recursive: true });

  let now = Date.now();
  const auth = new AuthManager(dir, {
    maxFailedAttempts: 2,
    lockoutMs: 1000,
    now: () => now
  });
  await auth.init();
  await auth.bootstrapPin("2468", "admin");

  await assert.rejects(() => auth.login("1111"), /Invalid PIN/);
  await assert.rejects(() => auth.login("1111"), /Invalid PIN/);
  await assert.rejects(() => auth.login("1111"), /Account locked/);
  assert.equal(Boolean(auth.status().lockedUntil), true);

  now += 1001;
  const status = await auth.login("2468");
  assert.equal(status.loggedIn, true);
  assert.equal(auth.status().lockedUntil, null);
});

test("AuthManager supports local recovery and writes auth audit log", async () => {
  const dir = path.join(os.tmpdir(), `neuralshell_auth_recover_${Date.now()}`);
  await fs.promises.mkdir(dir, { recursive: true });
  const auth = new AuthManager(dir);
  await auth.init();
  await auth.bootstrapPin("1111", "admin");
  await auth.login("1111");
  await auth.recoverPin("2222", "test-recovery");

  await assert.rejects(() => auth.login("1111"), /Invalid PIN/);
  const status = await auth.login("2222");
  assert.equal(status.loggedIn, true);

  const auditPath = path.join(dir, "auth_audit.log");
  const audit = await fs.promises.readFile(auditPath, "utf8");
  assert.match(audit, /bootstrap-pin/);
  assert.match(audit, /recover-pin/);
});
